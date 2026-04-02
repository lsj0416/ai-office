// 이 파일은 Supabase 스키마 기반 수동 관리 타입입니다.
// 스키마 변경 시 supabase/migrations/ 와 함께 업데이트해주세요.
// 추후: supabase gen types typescript --project-id <id> > src/types/database.ts

import type { AgentRole, AgentStatus, AIModel, TaskStatus } from './index'

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          vision: string
          business: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          vision?: string
          business?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          vision?: string
          business?: string[]
          updated_at?: string
        }
      }

      agents: {
        Row: {
          id: string
          workspace_id: string
          role: AgentRole
          name: string
          persona: string
          avatar: string | null
          model: AIModel
          status: AgentStatus
          position: { x: number; y: number } | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          role: AgentRole
          name: string
          persona: string
          avatar?: string | null
          model?: AIModel
          status?: AgentStatus
          position?: { x: number; y: number } | null
          order?: number
          created_at?: string
        }
        Update: {
          role?: AgentRole
          name?: string
          persona?: string
          avatar?: string | null
          model?: AIModel
          status?: AgentStatus
          position?: { x: number; y: number } | null
          order?: number
        }
      }

      threads: {
        Row: {
          id: string
          workspace_id: string
          agent_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          agent_id: string
          title?: string
          created_at?: string
        }
        Update: {
          title?: string
        }
      }

      messages: {
        Row: {
          id: string
          thread_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
      }

      tasks: {
        Row: {
          id: string
          workspace_id: string
          title: string
          description: string | null
          assignee_id: string | null
          status: TaskStatus
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          description?: string | null
          assignee_id?: string | null
          status?: TaskStatus
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          assignee_id?: string | null
          status?: TaskStatus
        }
      }

      memories: {
        Row: {
          id: string
          workspace_id: string
          content: string
          embedding: number[] | null  // vector(1536) — JS에서는 number[]로 취급
          metadata: MemoryMetadata
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          content: string
          embedding?: number[] | null
          metadata?: MemoryMetadata
          created_at?: string
        }
        Update: {
          content?: string
          embedding?: number[] | null
          metadata?: MemoryMetadata
        }
      }
    }

    Functions: {
      match_memories: {
        Args: {
          query_embedding: number[]
          match_workspace_id: string
          match_count?: number
          match_threshold?: number
        }
        Returns: Array<{
          id: string
          content: string
          metadata: MemoryMetadata
          similarity: number
        }>
      }
    }
  }
}

// memories.metadata의 구조 정의
export interface MemoryMetadata {
  type?: 'conversation' | 'document' | 'meeting_note' | 'weekly_summary'
  agent_id?: string
  thread_id?: string
  source?: string
  [key: string]: unknown
}
