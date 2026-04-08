export type AgentRole =
  | 'PM'
  | 'BACKEND'
  | 'FRONTEND'
  | 'DEVOPS'
  | 'AI_DATA'
  | 'MARKETER'
  | 'DESIGNER'
  | 'REVIEWER'
  | 'LEGAL'
  | 'CUSTOM'
  | 'DEVELOPER' // 레거시 호환용

export type AgentStatus = 'WORKING' | 'THINKING' | 'IDLE' | 'MEETING' | 'BREAK' | 'GONE'

export type AIModel = 'gpt-4o' | 'gpt-4o-mini'

export type AgentGender = 'male' | 'female' | 'unspecified'
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead'
export type WorkBackground = 'startup' | 'enterprise' | 'freelance' | 'consulting'
export type ToneStyle = 'formal' | 'casual' | 'direct' | 'gentle'
export type DecisionStyle = 'quick' | 'careful' | 'data-driven' | 'intuitive'
export type FeedbackStyle = 'direct' | 'socratic' | 'encouraging'

export interface PersonaDetail {
  gender: AgentGender
  experienceLevel: ExperienceLevel
  background: WorkBackground
  tone: ToneStyle
  decisionStyle: DecisionStyle
  feedbackStyle: FeedbackStyle
  expertise: string
  strengths: string
  notes: string
}

export type ExecutionMode = 'AUTO' | 'PIPELINE' | 'CHAT'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type TaskSource = 'manual' | 'ai_followup'

export interface WorkspaceProduct {
  name: string
  description: string
  status: 'planning' | 'development' | 'launched' | 'deprecated'
}

export interface Workspace {
  id: string
  name: string
  vision: string
  business: string[]
  industry?: string
  targetCustomer?: string
  products?: WorkspaceProduct[]
  teamCulture?: string
  keyMetrics?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Agent {
  id: string
  workspaceId: string
  role: AgentRole
  name: string
  persona: string
  personaDetail?: PersonaDetail
  avatar?: string
  model: AIModel
  status: AgentStatus
  position?: { x: number; y: number }
  order: number
}

export interface Thread {
  id: string
  workspaceId: string
  agentId: string
  title: string
  createdAt: string
}

export interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export interface Task {
  id: string
  workspaceId: string
  title: string
  description?: string
  assigneeId?: string
  status: TaskStatus
  generation: number
  source: TaskSource
  createdAt: string
}
