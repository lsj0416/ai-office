import { describe, it, expect } from 'vitest'
import { createWorkspaceSchema, createAgentSchema, sendMessageSchema } from '../schemas'

describe('createWorkspaceSchema', () => {
  it('유효한 입력을 파싱한다', () => {
    const input = { name: 'AI Office', vision: 'AI 팀을 만든다', business: ['SaaS'] }
    const result = createWorkspaceSchema.parse(input)
    expect(result.name).toBe('AI Office')
    expect(result.vision).toBe('AI 팀을 만든다')
  })

  it('business가 없으면 빈 배열로 기본값을 설정한다', () => {
    const input = { name: 'AI Office', vision: 'AI 팀을 만든다' }
    const result = createWorkspaceSchema.parse(input)
    expect(result.business).toEqual([])
  })

  it('name이 비어있으면 실패한다', () => {
    const input = { name: '', vision: 'AI 팀을 만든다' }
    expect(() => createWorkspaceSchema.parse(input)).toThrow()
  })

  it('name이 100자를 초과하면 실패한다', () => {
    const input = { name: 'a'.repeat(101), vision: 'AI 팀을 만든다' }
    expect(() => createWorkspaceSchema.parse(input)).toThrow()
  })

  it('vision이 비어있으면 실패한다', () => {
    const input = { name: 'AI Office', vision: '' }
    expect(() => createWorkspaceSchema.parse(input)).toThrow()
  })
})

describe('createAgentSchema', () => {
  const validInput = {
    workspaceId: '123e4567-e89b-12d3-a456-426614174000',
    role: 'PM' as const,
    name: '김기획',
    persona: '꼼꼼하고 논리적인 PM',
  }

  it('유효한 입력을 파싱한다', () => {
    const result = createAgentSchema.parse(validInput)
    expect(result.role).toBe('PM')
  })

  it('유효하지 않은 UUID면 실패한다', () => {
    expect(() => createAgentSchema.parse({ ...validInput, workspaceId: 'not-uuid' })).toThrow()
  })

  it('유효하지 않은 role이면 실패한다', () => {
    expect(() => createAgentSchema.parse({ ...validInput, role: 'UNKNOWN' })).toThrow()
  })
})

describe('sendMessageSchema', () => {
  it('유효한 입력을 파싱한다', () => {
    const input = { threadId: '123e4567-e89b-12d3-a456-426614174000', content: '안녕하세요' }
    const result = sendMessageSchema.parse(input)
    expect(result.content).toBe('안녕하세요')
  })

  it('content가 비어있으면 실패한다', () => {
    const input = { threadId: '123e4567-e89b-12d3-a456-426614174000', content: '' }
    expect(() => sendMessageSchema.parse(input)).toThrow()
  })
})
