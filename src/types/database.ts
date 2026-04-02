// TODO: supabase gen types typescript --project-id <id> > src/types/database.ts 로 자동 생성 예정

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          vision: string
          business: string[]
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          vision: string
          business?: string[]
          user_id: string
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
          role: string
          name: string
          persona: string
          avatar: string | null
          model: string
          status: string
          position: { x: number; y: number } | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          role: string
          name: string
          persona: string
          avatar?: string | null
          model?: string
          status?: string
          position?: { x: number; y: number } | null
          order?: number
          created_at?: string
        }
        Update: {
          name?: string
          persona?: string
          avatar?: string | null
          model?: string
          status?: string
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
          title: string
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
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          role: string
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
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          description?: string | null
          assignee_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          assignee_id?: string | null
          status?: string
        }
      }
    }
  }
}
