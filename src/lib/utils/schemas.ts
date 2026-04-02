import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100, '100자 이하로 입력해주세요'),
  vision: z.string().min(1, '비전을 입력해주세요').max(500, '500자 이하로 입력해주세요'),
  business: z.array(z.string()).default([]),
})

export const createAgentSchema = z.object({
  workspaceId: z.string().uuid('유효하지 않은 워크스페이스 ID입니다'),
  role: z.enum(['PM', 'DEVELOPER', 'MARKETER', 'DESIGNER', 'REVIEWER', 'CUSTOM']),
  name: z.string().min(1, '이름을 입력해주세요').max(50, '50자 이하로 입력해주세요'),
  persona: z.string().min(1, '페르소나를 입력해주세요').max(1000, '1000자 이하로 입력해주세요'),
})

export const sendMessageSchema = z.object({
  threadId: z.string().uuid('유효하지 않은 스레드 ID입니다'),
  content: z.string().min(1, '메시지를 입력해주세요'),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
