import type { OfficePropPlacement, OfficeZoneId } from '@/types/office'

export interface OfficeLabel {
  text: string
  col: number
  row: number
  tone: 'muted' | 'accent'
}

export interface OfficeProp {
  asset:
    | 'deskFront'
    | 'chairFront'
    | 'chairSide'
    | 'chairBack'
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
  { text: 'AI 오피스', col: 11, row: 0, tone: 'accent' },
  { text: '회의실', col: 2, row: 10, tone: 'muted' },
  { text: '탕비실', col: 20, row: 10, tone: 'muted' },
]

export const OFFICE_PROPS: OfficeProp[] = [
  {
    asset: 'doubleBookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 1, row: 1, offsetY: 18 },
  },
  {
    asset: 'doubleBookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 24, row: 1, offsetY: 18 },
  },
  {
    asset: 'hangingPlant',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 6, row: 1, offsetY: 10 },
  },
  {
    asset: 'hangingPlant',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 21, row: 1, offsetY: 10 },
  },
  {
    asset: 'largePainting',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 12, row: 1, offsetY: -8 },
  },
  {
    asset: 'clock',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 15, row: 1, offsetX: 10, offsetY: -8 },
  },
  {
    asset: 'whiteboard',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 2, row: 11, offsetX: 10 },
  },
  {
    asset: 'bookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 1, col: 8, row: 10.3, offsetX: 14 },
  },
  {
    asset: 'smallPainting',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 23, row: 10.7, offsetX: 10 },
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 2.5, row: 12.5 },
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 5.2, row: 12.5 },
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 2.5, row: 13.5 },
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 5.2, row: 13.5 },
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 2.8, row: 15.2 },
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 4.2, row: 15.2 },
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 5.6, row: 15.2 },
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 7, row: 15.2 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 2.8, row: 12.6 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 4.2, row: 12.6 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 5.6, row: 12.6 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 7, row: 12.6 },
  },
  {
    asset: 'chairSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 1.4, row: 13.8, anchorY: 1, offsetX: 10 },
  },
  {
    asset: 'chairSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 8.3, row: 13.8, mirror: true, anchorY: 1, offsetX: 34 },
  },
  {
    asset: 'largePlant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 3, col: 9, row: 14 },
  },
  {
    asset: 'sofaFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 18.7, row: 11 },
  },
  {
    asset: 'coffeeTable',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 18.7, row: 12.4 },
  },
  {
    asset: 'sofaSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 22, row: 12.1 },
  },
  {
    asset: 'sofaSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 25, row: 12.1, mirror: true, offsetX: 48 },
  },
  {
    asset: 'coffeeTable',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 23, row: 12.3 },
  },
  {
    asset: 'smallTableFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 18, row: 15 },
  },
  {
    asset: 'smallTableFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 22, row: 15 },
  },
  {
    asset: 'plant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 1, row: 15 },
  },
  {
    asset: 'plant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 17, row: 15 },
  },
  {
    asset: 'plant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 26, row: 15 },
  },
  {
    asset: 'bin',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 25, row: 16 },
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
