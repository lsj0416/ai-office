import type { OfficePropPlacement, OfficeZoneId } from '@/types/office'

export interface OfficeLabel {
  text: string
  col: number
  row: number
  tone: 'muted' | 'accent'
}

export interface OfficeProp {
  asset:
    | 'whiteboard'
    | 'bookshelf'
    | 'doubleBookshelf'
    | 'smallPainting'
    | 'largePainting'
    | 'hangingPlant'
    | 'plant'
    | 'largePlant'
    | 'sofaFront'
    | 'sofaSide'
    | 'smallTableFront'
    | 'coffeeTable'
    | 'coffee'
    | 'clock'
    | 'bin'
  placement: OfficePropPlacement
}

export const OFFICE_LABELS: OfficeLabel[] = [
  { text: 'AI 오피스', col: 8, row: 0, tone: 'accent' },
  { text: '회의실', col: 1, row: 9, tone: 'muted' },
  { text: '탕비실', col: 13, row: 9, tone: 'muted' },
]

export const OFFICE_PROPS: OfficeProp[] = [
  {
    asset: 'doubleBookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 1, row: 1, offsetY: 18 },
  },
  {
    asset: 'doubleBookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 17, row: 1, offsetY: 18 },
  },
  {
    asset: 'hangingPlant',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 6, row: 1, offsetY: 10 },
  },
  {
    asset: 'hangingPlant',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 14, row: 1, offsetY: 10 },
  },
  {
    asset: 'largePainting',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 9, row: 1, offsetY: -8 },
  },
  {
    asset: 'clock',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 11, row: 1, offsetX: 10, offsetY: -8 },
  },
  {
    asset: 'whiteboard',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 1, row: 10, offsetX: 10 },
  },
  {
    asset: 'bookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 1, col: 6, row: 9.3, offsetX: 14 },
  },
  {
    asset: 'smallPainting',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 14, row: 9.7, offsetX: 10 },
  },
  {
    asset: 'largePlant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 3, col: 17, row: 11 },
  },
  {
    asset: 'sofaSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 14.5, row: 10.5 },
  },
  {
    asset: 'sofaSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 17.5, row: 10.5, mirror: true, offsetX: 48 },
  },
  {
    asset: 'coffeeTable',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 15.5, row: 10.5 },
  },
  {
    asset: 'smallTableFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 12, row: 10 },
  },
  {
    asset: 'plant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 1, row: 12 },
  },
  {
    asset: 'bin',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 17, row: 13 },
  },
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
