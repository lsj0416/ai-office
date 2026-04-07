import type { AgentStatus } from '@/types'
import type { OfficeAgent, OfficeAgentViewModel, OfficeVisualState } from '@/types/office'

const STATUS_LABELS: Record<OfficeVisualState, string> = {
  typing: '집중 작업 중',
  thinking: '전략 구상 중',
  idle: '대기 중',
  meeting: '회의 집중 모드',
  break: '휴식 중',
}

const BADGE_TONES: Record<OfficeVisualState, OfficeAgentViewModel['badgeTone']> = {
  typing: 'emerald',
  thinking: 'sky',
  idle: 'stone',
  meeting: 'violet',
  break: 'amber',
}

export function mapStatusToVisualState(status: AgentStatus): OfficeVisualState {
  switch (status) {
    case 'WORKING':
      return 'typing'
    case 'THINKING':
      return 'thinking'
    case 'MEETING':
      return 'meeting'
    case 'BREAK':
      return 'break'
    case 'GONE':
    case 'IDLE':
    default:
      return 'idle'
  }
}

export function toOfficeAgentViewModel(agent: OfficeAgent, paletteIndex: number): OfficeAgentViewModel {
  const visualState = mapStatusToVisualState(agent.status)
  return {
    ...agent,
    visualState,
    paletteIndex,
    statusLabel: STATUS_LABELS[visualState],
    badgeTone: BADGE_TONES[visualState],
  }
}
