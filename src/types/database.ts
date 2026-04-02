// 이 파일은 Supabase 스키마 기반 수동 관리 타입입니다.
// 스키마 변경 시 supabase/migrations/ 와 함께 업데이트해주세요.
// 추후: supabase gen types typescript --project-id <id> > src/types/database.ts

import type { AgentRole, AgentStatus, AIModel, TaskStatus } from './index'

export interface Database {
  PostgrestVersion: '12'
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'agents_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'threads_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'threads_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'messages_thread_id_fkey'
            columns: ['thread_id']
            isOneToOne: false
            referencedRelation: 'threads'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'tasks_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }

      memories: {
        Row: {
          id: string
          workspace_id: string
          content: string
          embedding: number[] | null
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
        Relationships: [
          {
            foreignKeyName: 'memories_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
    }

    Views: {
      [_ in never]: never
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

    Enums: {
      [_ in never]: never
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface MemoryMetadata {
  type?: 'conversation' | 'document' | 'meeting_note' | 'weekly_summary'
  agent_id?: string
  thread_id?: string
  source?: string
  [key: string]: unknown
}
