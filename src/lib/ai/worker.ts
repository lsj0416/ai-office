import { createAIClient, getModelConfig } from './provider'
import { type AgentRole, type AIModel } from '@/types'

const ROLE_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  PM: `당신은 프로젝트 매니저 AI입니다.
요구사항 분석, 일정 계획, 우선순위 결정, 팀 조율을 담당합니다.
명확하고 구조적으로 답변하며, 항상 실행 가능한 다음 단계를 제시합니다.`,

  DEVELOPER: `당신은 시니어 개발자 AI입니다.
코드 작성, 기술 설계, 코드 리뷰, 버그 분석을 담당합니다.
코드는 TypeScript로 작성하며, 실용적이고 명확한 해결책을 제시합니다.`,

  MARKETER: `당신은 마케터 AI입니다.
카피라이팅, 마케팅 전략, 콘텐츠 기획, 사용자 분석을 담당합니다.
설득력 있고 창의적인 아이디어를 제시합니다.`,

  DESIGNER: `당신은 UX/UI 디자이너 AI입니다.
UI 설계, 사용자 경험 개선, 디자인 가이드라인 수립을 담당합니다.
사용자 중심의 관점으로 명확한 피드백을 제공합니다.`,

  REVIEWER: `당신은 품질 검토 AI입니다.
결과물 검토, 오류 발견, 개선 제안을 담당합니다.
객관적이고 건설적인 피드백을 제공합니다.`,

  CUSTOM: `당신은 AI 어시스턴트입니다. 사용자의 요청에 성실하게 답변합니다.`,
}

export interface WorkerInput {
  role: AgentRole
  agentName: string
  persona: string
  model: AIModel
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  workspaceContext?: string
}

export async function runWorkerStream(input: WorkerInput): Promise<ReadableStream<Uint8Array>> {
  const client = createAIClient(input.model)
  const { model } = getModelConfig(input.model)

  const systemPrompt = buildSystemPrompt(input)

  const stream = await client.chat.completions.create({
    model,
    stream: true,
    messages: [{ role: 'system', content: systemPrompt }, ...input.messages],
  })

  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          controller.enqueue(encoder.encode(text))
        }
      }
      controller.close()
    },
  })
}

function buildSystemPrompt(input: WorkerInput): string {
  const basePrompt = ROLE_SYSTEM_PROMPTS[input.role]
  const namePrompt = `당신의 이름은 ${input.agentName}입니다.`
  const personaPrompt = `당신의 페르소나는 다음과 같습니다: ${input.persona}`
  const contextPrompt = input.workspaceContext
    ? `\n\n[워크스페이스 컨텍스트]\n${input.workspaceContext}`
    : ''

  return `${basePrompt}\n${namePrompt}\n${personaPrompt}${contextPrompt}`
}
