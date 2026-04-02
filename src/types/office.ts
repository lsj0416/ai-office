import type { AgentRole, AgentStatus } from './index'

export interface OfficeAgent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  persona: string
  model: string
  deskIndex: number // 0-based preset desk position
}

export interface NearbyAgent {
  agent: OfficeAgent
  deskCol: number
  deskRow: number
}
