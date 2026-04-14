import type { OfficeZoneId } from '@/types/office'
export { OFFICE_PROPS } from './layout'

export interface OfficeLabel {
  text: string
  col: number
  row: number
  tone: 'muted' | 'accent'
}

export const OFFICE_LABELS: OfficeLabel[] = [
  { text: 'AI 오피스', col: 11, row: 0, tone: 'accent' },
  { text: '회의실', col: 2, row: 10, tone: 'muted' },
  { text: '탕비실', col: 20, row: 10, tone: 'muted' },
]

export const ZONE_COPY: Record<
  OfficeZoneId,
  {
    label: string
    description: string
  }
> = {
  branding: {
    label: '브랜딩 월',
    description: '회사의 비전과 운영 지표가 정리된 상단 커맨드 월',
  },
  workbay: {
    label: '워크 베이',
    description: '에이전트들이 메인 업무를 처리하는 데스크 구역',
  },
  meeting: {
    label: '미팅 존',
    description: '아이디어를 정리하고 합의점을 맞추는 회의 구역',
  },
  lounge: {
    label: '팬트리 라운지',
    description: '휴식과 짧은 리프레시를 위한 공간',
  },
}
