import { z } from 'zod'
import { runWorkerStream } from '@/lib/ai/worker'
import { buildChatRagContext, buildRagContext } from '@/lib/ai/rag'
import { buildCompanyContext, rowToWorkspace } from '@/lib/ai/context'
import { createClient } from '@/lib/supabase/server'
import { errorResponse } from '@/types/api'

export const maxDuration = 60

const requestSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  persona: z.string(),
  role: z.enum([
    'PM',
    'BACKEND',
    'FRONTEND',
    'DEVOPS',
    'AI_DATA',
    'SECURITY',
    'MARKETER',
    'DESIGNER',
    'REVIEWER',
    'LEGAL',
    'CUSTOM',
    'DEVELOPER',
  ]),
  model: z.enum(['gpt-4o', 'gpt-4o-mini']),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1),
  workspaceId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  workspaceContext: z.string().optional(),
})

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('인증이 필요합니다', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return errorResponse(firstError?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse('OpenAI API Key가 설정되지 않았습니다', 500)
  }

  try {
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, persona, persona_detail, role, model, workspaces!inner(user_id)')
      .eq('id', parsed.data.agentId)
      .eq('workspaces.user_id', user.id)
      .single()

    if (agentError || !agent) {
      return errorResponse('에이전트를 찾을 수 없습니다', 404)
    }

    if (agent.name !== parsed.data.agentName || agent.role !== parsed.data.role) {
      return errorResponse('에이전트 정보가 올바르지 않습니다', 400)
    }

    // 회사 컨텍스트 + RAG 컨텍스트 생성 (workspaceId가 있을 때만)
    let workspaceContext = parsed.data.workspaceContext
    if (parsed.data.workspaceId) {
      const { data: wsRow } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', parsed.data.workspaceId)
        .eq('user_id', user.id)
        .single()

      if (wsRow) {
        const companyCtx = buildCompanyContext(rowToWorkspace(wsRow))
        workspaceContext = workspaceContext ? `${companyCtx}\n\n${workspaceContext}` : companyCtx
      }

      const lastUserMessage = [...parsed.data.messages]
        .reverse()
        .find((m) => m.role === 'user')?.content

      const ragContext = parsed.data.threadId
        ? await buildChatRagContext(parsed.data.workspaceId, {
            messages: parsed.data.messages,
            agentId: parsed.data.agentId,
            threadId: parsed.data.threadId,
          })
        : lastUserMessage
          ? await buildRagContext(parsed.data.workspaceId, lastUserMessage)
          : ''

      if (ragContext) {
        workspaceContext = workspaceContext ? `${workspaceContext}\n\n${ragContext}` : ragContext
      }
    }

    const stream = await runWorkerStream({
      role: agent.role,
      agentName: agent.name,
      persona: agent.persona,
      personaDetail: agent.persona_detail ?? undefined,
      model: agent.model,
      messages: parsed.data.messages,
      workspaceContext,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '에이전트 실행 중 오류가 발생했습니다'
    return errorResponse(message, 500)
  }
}
