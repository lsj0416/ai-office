import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChatDialog from '../ChatDialog'
import type { OfficeAgentViewModel } from '@/types/office'

const agent: OfficeAgentViewModel = {
  id: '11111111-1111-1111-1111-111111111111',
  name: '기획자 준호',
  role: 'PM',
  status: 'THINKING',
  persona: '논리적이고 체계적인 PM',
  model: 'gpt-4o',
  deskIndex: 0,
  visualState: 'thinking',
  paletteIndex: 1,
  statusLabel: '전략 구상 중',
  badgeTone: 'sky',
}

describe('ChatDialog', () => {
  beforeEach(() => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/threads') && !url.includes('/messages')) {
        return Promise.resolve({
          json: async () => ({ data: { id: 'thread-1' } }),
        } as Response)
      }

      if (url.includes('/messages')) {
        return Promise.resolve({
          json: async () => ({ data: [] }),
        } as Response)
      }

      return Promise.resolve({
        json: async () => ({ data: null }),
      } as Response)
    }) as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a desktop placeholder when no agent is selected', () => {
    render(<ChatDialog agent={null} workspaceId="workspace-1" isMobile={false} onClose={() => {}} />)

    expect(screen.getByTestId('office-chat-sidebar')).toBeInTheDocument()
    expect(screen.getByText('대화할 에이전트를 선택하세요')).toBeInTheDocument()
  })

  it('renders a mobile sheet when an agent is selected', async () => {
    render(<ChatDialog agent={agent} workspaceId="workspace-1" isMobile onClose={() => {}} />)

    expect(screen.getByTestId('office-chat-sheet')).toBeInTheDocument()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('renders a desktop dock when an agent is selected', async () => {
    render(<ChatDialog agent={agent} workspaceId="workspace-1" isMobile={false} onClose={() => {}} />)

    expect(screen.getByTestId('office-chat-sidebar')).toBeInTheDocument()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText('기획자 준호')).toBeInTheDocument()
  })
})
