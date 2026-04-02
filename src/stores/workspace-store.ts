import { create } from 'zustand'
import { type Workspace } from '@/types'

interface WorkspaceState {
  currentWorkspace: Workspace | null
  isLoading: boolean
  setWorkspace: (workspace: Workspace | null) => void
  setLoading: (loading: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  isLoading: false,
  setWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
