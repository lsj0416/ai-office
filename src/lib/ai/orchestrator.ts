import OpenAI from 'openai'
import { type AgentRole, type AIModel } from '@/types'

export interface FollowupTask {
  title: string
  description: string
}

export interface OrchestratorAgent {
  id: string
  name: string
  role: AgentRole
  persona: string
  model: AIModel
}

export interface OrchestratorStep {
  agentId: string
  agentName: string
  role: AgentRole
  persona: string
  model: AIModel
  subTask: string
}

export interface OrchestratorPlan {
  analysis: string
  steps: OrchestratorStep[]
}

const ORCHESTRATOR_SYSTEM_PROMPT = `당신은 AI 팀의 총괄 매니저입니다.
사용자의 요청을 분석하고, 주어진 에이전트 목록에서 가장 적합한 에이전트를 선택하여 실행 계획을 세웁니다.

규칙:
- 1~3명의 에이전트만 선택하세요 (필요한 만큼만)
- 각 에이전트에게 명확하고 구체적인 서브태스크를 부여하세요
- 에이전트 순서는 논리적 흐름을 따르세요 (기획 → 개발 → 검토 등)
- 불필요한 에이전트는 포함하지 마세요

반드시 아래 JSON 형식으로만 응답하세요:
{
  "analysis": "요청 분석 요약 (1-2문장)",
  "steps": [
    {
      "agentId": "에이전트 ID",
      "subTask": "이 에이전트가 수행할 구체적인 작업"
    }
  ]
}`

export async function createOrchestrationPlan(
  userMessage: string,
  agents: OrchestratorAgent[],
  companyContext?: string
): Promise<OrchestratorPlan> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const agentList = agents
    .map((a) => `- ID: ${a.id} | 이름: ${a.name} | 역할: ${a.role} | 페르소나: ${a.persona}`)
    .join('\n')

  const userContent = companyContext
    ? `${companyContext}\n\n[사용 가능한 에이전트]\n${agentList}\n\n[사용자 요청]\n${userMessage}`
    : `[사용 가능한 에이전트]\n${agentList}\n\n[사용자 요청]\n${userMessage}`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ORCHESTRATOR_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as {
    analysis?: string
    steps?: Array<{ agentId?: string; subTask?: string }>
  }

  // agentId로 나머지 정보 복원
  const steps: OrchestratorStep[] = (parsed.steps ?? []).flatMap((step) => {
    const agent = agents.find((a) => a.id === step.agentId)
    if (!agent || !step.subTask) return []
    return [
      {
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        persona: agent.persona,
        model: agent.model,
        subTask: step.subTask,
      },
    ]
  })

  return {
    analysis: parsed.analysis ?? '',
    steps,
  }
}

const FOLLOWUP_SYSTEM_PROMPT = `당신은 AI 파이프라인 결과를 분석하는 매니저입니다.
주어진 파이프라인 실행 결과를 검토하고, 자연스럽게 이어질 다음 작업 2~3개를 제안하세요.

규칙:
- 파이프라인 결과에서 미완료되거나 다음 단계가 필요한 작업만 제안
- 이미 완료된 내용은 제안하지 마세요
- 각 후속 작업은 실행 가능하고 구체적이어야 합니다
- 후속 작업이 없으면 빈 배열을 반환하세요

반드시 아래 JSON 형식으로만 응답하세요:
{
  "tasks": [
    {
      "title": "짧고 명확한 태스크 제목 (30자 이내)",
      "description": "구체적인 작업 내용 설명 (100자 이내)"
    }
  ]
}`

export async function evaluatePipelineAndSuggestNextTasks(
  originalGoal: string,
  results: Array<{ agentName: string; content: string }>
): Promise<FollowupTask[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const resultSummary = results
    .map((r) => `[${r.agentName}의 결과]\n${r.content.slice(0, 500)}`)
    .join('\n\n')

  const userContent = `[원래 목표]\n${originalGoal}\n\n[파이프라인 실행 결과]\n${resultSummary}`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: FOLLOWUP_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as { tasks?: Array<{ title?: string; description?: string }> }

    return (parsed.tasks ?? []).slice(0, 3).flatMap((t) => {
      if (!t.title || !t.description) return []
      return [{ title: t.title.slice(0, 60), description: t.description.slice(0, 200) }]
    })
  } catch {
    return []
  }
}
