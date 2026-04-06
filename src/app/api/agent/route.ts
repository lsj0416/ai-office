import { z } from 'zod'
import { runWorkerStream } from '@/lib/ai/worker'
import { buildRagContext } from '@/lib/ai/rag'
import { createClient } from '@/lib/supabase/server'
import { errorResponse } from '@/types/api'

const requestSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  persona: z.string(),
  role: z.enum(['PM', 'DEVELOPER', 'MARKETER', 'DESIGNER', 'REVIEWER', 'CUSTOM']),
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
      .select('id, name, persona, role, model')
      .eq('id', parsed.data.agentId)
      .single()

    if (agentError || !agent) {
      return errorResponse('에이전트를 찾을 수 없습니다', 404)
    }

    if (
      agent.name !== parsed.data.agentName ||
      agent.persona !== parsed.data.persona ||
      agent.role !== parsed.data.role ||
      agent.model !== parsed.data.model
    ) {
      return errorResponse('에이전트 정보가 올바르지 않습니다', 400)
    }

    // RAG 컨텍스트 생성 (workspaceId가 있을 때만)
    let workspaceContext = parsed.data.workspaceContext
    if (parsed.data.workspaceId) {
      const lastUserMessage = [...parsed.data.messages]
        .reverse()
        .find((m) => m.role === 'user')?.content

      if (lastUserMessage) {
        const ragContext = await buildRagContext(parsed.data.workspaceId, lastUserMessage)
        if (ragContext) {
          workspaceContext = workspaceContext ? `${workspaceContext}\n\n${ragContext}` : ragContext
        }
      }
    }

    const stream = await runWorkerStream({
      role: parsed.data.role,
      agentName: parsed.data.agentName,
      persona: parsed.data.persona,
      model: parsed.data.model,
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
