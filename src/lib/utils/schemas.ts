import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100, '100자 이하로 입력해주세요'),
  vision: z.string().min(1, '비전을 입력해주세요').max(500, '500자 이하로 입력해주세요'),
  business: z.array(z.string()).default([]),
})

export const createAgentSchema = z.object({
  workspaceId: z.string().uuid('유효하지 않은 워크스페이스 ID입니다'),
  role: z.enum([
    'PM',
    'DEVELOPER',
    'BACKEND',
    'FRONTEND',
    'DEVOPS',
    'AI_DATA',
    'SECURITY',
    'MARKETER',
    'DESIGNER',
    'REVIEWER',
    'LEGAL',
    'CUSTOM',
  ]),
  name: z.string().min(1, '이름을 입력해주세요').max(50, '50자 이하로 입력해주세요'),
  persona: z.string().min(1, '페르소나를 입력해주세요').max(1000, '1000자 이하로 입력해주세요'),
})

export const sendMessageSchema = z.object({
  threadId: z.string().uuid('유효하지 않은 스레드 ID입니다'),
  content: z.string().min(1, '메시지를 입력해주세요'),
})

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export const signupSchema = z
  .object({
    email: z.string().email('올바른 이메일 형식을 입력해주세요'),
    password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
