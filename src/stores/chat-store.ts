import { create } from 'zustand'
import { type Message } from '@/types'

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setStreaming: (streaming: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  clearMessages: () => set({ messages: [] }),
}))
