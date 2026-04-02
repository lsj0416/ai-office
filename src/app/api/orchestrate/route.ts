import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createOrchestrationPlan } from '@/lib/ai/orchestrator'
import { runWorkerStream } from '@/lib/ai/worker'
import { errorResponse } from '@/types/api'

const requestSchema = z.object({
  workspaceId: z.string().uuid(),
  message: z.string().min(1).max(2000),
})

// SSE 이벤트 직렬화
function sseEvent(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const { workspaceId, message } = parsed.data

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse('OpenAI API Key가 설정되지 않았습니다', 500)
  }

  // 워크스페이스 소유 확인 + 에이전트 조회
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, role, persona, model, workspaces!inner(user_id)')
    .eq('workspace_id', workspaceId)
    .order('order', { ascending: true })

  if (!agents || agents.length === 0) {
    return errorResponse('에이전트가 없습니다. 팀 탭에서 에이전트를 추가하세요.', 400)
  }

  const firstAgent = agents[0] as { workspaces: { user_id: string } | null }
  if (firstAgent?.workspaces?.user_id !== user.id) {
    return errorResponse('접근 권한이 없습니다', 403)
  }

  const agentList = agents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role as import('@/types').AgentRole,
    persona: a.persona,
    model: a.model as import('@/types').AIModel,
  }))

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // 1. 오케스트레이터가 실행 계획 수립
        const plan = await createOrchestrationPlan(message, agentList)

        controller.enqueue(
          sseEvent({
            type: 'plan',
            analysis: plan.analysis,
            steps: plan.steps.map((s) => ({
              agentId: s.agentId,
              agentName: s.agentName,
              role: s.role,
              subTask: s.subTask,
            })),
          })
        )

        // 2. 각 에이전트 순차 실행
        let previousResults: Array<{ agentName: string; content: string }> = []

        for (const step of plan.steps) {
          controller.enqueue(
            sseEvent({
              type: 'agent_start',
              agentId: step.agentId,
              agentName: step.agentName,
              role: step.role,
              subTask: step.subTask,
            })
          )

          // 이전 결과를 컨텍스트로 전달
          const contextSummary =
            previousResults.length > 0
              ? previousResults.map((r) => `[${r.agentName}의 결과]\n${r.content}`).join('\n\n')
              : undefined

          const workerMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
            {
              role: 'user',
              content: contextSummary
                ? `[전체 목표]\n${message}\n\n[이전 작업 결과]\n${contextSummary}\n\n[당신의 작업]\n${step.subTask}`
                : `[전체 목표]\n${message}\n\n[당신의 작업]\n${step.subTask}`,
            },
          ]

          const workerStream = await runWorkerStream({
            role: step.role,
            agentName: step.agentName,
            persona: step.persona,
            model: step.model,
            messages: workerMessages,
          })

          const reader = workerStream.getReader()
          const decoder = new TextDecoder()
          let agentContent = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            agentContent += chunk
            controller.enqueue(sseEvent({ type: 'chunk', agentId: step.agentId, content: chunk }))
          }

          previousResults = [
            ...previousResults,
            { agentName: step.agentName, content: agentContent },
          ]
          controller.enqueue(sseEvent({ type: 'agent_done', agentId: step.agentId }))
        }

        controller.enqueue(sseEvent({ type: 'done' }))
      } catch (err) {
        const message = err instanceof Error ? err.message : '오케스트레이션 오류'
        controller.enqueue(sseEvent({ type: 'error', message }))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
