import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createOrchestrationPlan, evaluatePipelineAndSuggestNextTasks } from '@/lib/ai/orchestrator'
import { runWorkerStream } from '@/lib/ai/worker'
import { buildRagContext } from '@/lib/ai/rag'
import { buildCompanyContext, rowToWorkspace } from '@/lib/ai/context'
import { errorResponse } from '@/types/api'

export const maxDuration = 60

const manualStepSchema = z.object({
  agentId: z.string(),
  subTask: z.string().min(1).max(500),
})

const requestSchema = z.object({
  workspaceId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  participantIds: z.array(z.string().uuid()).min(1).optional(),
  manualSteps: z.array(manualStepSchema).min(1).optional(),
  generation: z.number().int().min(0).max(10).optional().default(0),
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

  const { workspaceId, message, participantIds, manualSteps, generation } = parsed.data

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse('OpenAI API Key가 설정되지 않았습니다', 500)
  }

  // 워크스페이스 소유권 확인 (에이전트 조회 전에 반드시 검증)
  const { data: wsRow } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!wsRow) {
    return errorResponse('접근 권한이 없습니다', 403)
  }

  // 에이전트 조회
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, role, persona, persona_detail, model')
    .eq('workspace_id', workspaceId)
    .order('order', { ascending: true })

  if (!agents || agents.length === 0) {
    return errorResponse('에이전트가 없습니다. 팀 탭에서 에이전트를 추가하세요.', 400)
  }

  const companyContext = buildCompanyContext(rowToWorkspace(wsRow))

  const agentList = agents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role as import('@/types').AgentRole,
    persona: a.persona,
    personaDetail: (a.persona_detail as import('@/types').PersonaDetail | null) ?? undefined,
    model: a.model as import('@/types').AIModel,
  }))

  const scopedAgentList = participantIds
    ? agentList.filter((agent) => participantIds.includes(agent.id))
    : agentList

  if (participantIds && scopedAgentList.length !== participantIds.length) {
    return errorResponse('선택한 회의 참가자 중 일부를 찾을 수 없습니다.', 400)
  }

  if (scopedAgentList.length === 0) {
    return errorResponse('실행할 회의 참가자가 없습니다.', 400)
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // 1. RAG 컨텍스트 조회 + 회사 컨텍스트 결합
        const ragContext = await buildRagContext(workspaceId, message).catch(() => '')
        const fullContext = ragContext ? `${companyContext}\n\n${ragContext}` : companyContext

        // 2. 실행 계획 수립 (수동 선택이면 오케스트레이터 생략)
        let plan: import('@/lib/ai/orchestrator').OrchestratorPlan

        if (manualSteps) {
          const steps = manualSteps.flatMap((s) => {
            const agent = scopedAgentList.find((a) => a.id === s.agentId)
            if (!agent) return []
            return [
              {
                agentId: agent.id,
                agentName: agent.name,
                role: agent.role,
                persona: agent.persona,
                model: agent.model,
                subTask: s.subTask,
              },
            ]
          })
          plan = { analysis: '수동으로 선택된 실행 순서입니다.', steps }
        } else if (scopedAgentList.length === 1) {
          const [agent] = scopedAgentList
          if (!agent) {
            throw new Error('회의 참가자를 확인하지 못했습니다.')
          }
          plan = {
            analysis: `${agent.name} 1인 브리핑으로 안건을 정리합니다.`,
            steps: [
              {
                agentId: agent.id,
                agentName: agent.name,
                role: agent.role,
                persona: agent.persona,
                model: agent.model,
                subTask: '회의 안건을 검토하고 실행 가능한 의견과 다음 액션을 정리하세요.',
              },
            ],
          }
        } else {
          plan = await createOrchestrationPlan(message, scopedAgentList, companyContext)
        }

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

        // 3. 각 에이전트 순차 실행
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

          const agentMeta = agentList.find((a) => a.id === step.agentId)

          const workerStream = await runWorkerStream({
            role: step.role,
            agentName: step.agentName,
            persona: step.persona,
            personaDetail: agentMeta?.personaDetail,
            model: step.model,
            messages: workerMessages,
            workspaceContext: fullContext || undefined,
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

        // 4. 파이프라인 결과 태스크로 저장 (status: DONE)
        if (previousResults.length > 0) {
          const taskRows = previousResults.map((r) => ({
            workspace_id: workspaceId,
            title: `[${r.agentName}] ${message.slice(0, 50)}`,
            description: r.content.slice(0, 500),
            status: 'DONE' as const,
            generation,
            source: 'ai_followup' as const,
          }))
          try {
            await supabase.from('tasks').insert(taskRows)
          } catch {
            /* non-critical */
          }
        }

        // 5. 후속 태스크 평가 (generation < 3일 때만)
        if (generation < 3 && previousResults.length > 0) {
          const followupTasks = await evaluatePipelineAndSuggestNextTasks(message, previousResults)

          if (followupTasks.length > 0) {
            controller.enqueue(
              sseEvent({
                type: 'followup_tasks',
                tasks: followupTasks.map((t) => ({
                  ...t,
                  generation: generation + 1,
                })),
              })
            )
          }
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
