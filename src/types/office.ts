import type { AgentRole, AgentStatus } from './index'

export type AgentFSMStateType = 'IDLE_AT_DESK' | 'WANDERING' | 'RETURNING'
export type OfficeZoneId = 'branding' | 'workbay' | 'meeting' | 'lounge'
export type OfficeVisualState = 'typing' | 'thinking' | 'idle' | 'meeting' | 'break'
export type OfficePropKind = 'wall' | 'floor'
export type OfficeTileAnchor = 'top-left' | 'bottom-left' | 'bottom-center'

export interface TilePos {
  col: number
  row: number
}

export interface OfficeAgent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  persona: string
  model: string
  deskIndex: number // 0-based preset desk position
}

export interface OfficeAgentViewModel extends OfficeAgent {
  visualState: OfficeVisualState
  paletteIndex: number
  statusLabel: string
  badgeTone: 'emerald' | 'sky' | 'amber' | 'rose' | 'violet' | 'stone'
}

export interface NearbyAgent {
  agent: OfficeAgentViewModel
  worldX: number
  worldY: number
  distance: number
}

export interface OfficeHudState {
  workspaceName: string
  vision: string
  headcount: number
  activeZone: OfficeZoneId
  selectedAgent: OfficeAgentViewModel | null
}

export interface OfficePropPlacement {
  col: number
  row: number
  kind: OfficePropKind
  tileAnchor: OfficeTileAnchor
  footprintW: number
  footprintH: number
  offsetX?: number
  offsetY?: number
  anchorX?: number
  anchorY?: number
  sortBaseY?: number
  scale?: number
  mirror?: boolean
}
