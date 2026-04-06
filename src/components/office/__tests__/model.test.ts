import { describe, expect, it } from 'vitest'
import { mapStatusToVisualState, toOfficeAgentViewModel } from '../model'

describe('office model helpers', () => {
  it('maps backend status to office visual states', () => {
    expect(mapStatusToVisualState('WORKING')).toBe('typing')
    expect(mapStatusToVisualState('THINKING')).toBe('thinking')
    expect(mapStatusToVisualState('MEETING')).toBe('meeting')
    expect(mapStatusToVisualState('BREAK')).toBe('break')
    expect(mapStatusToVisualState('IDLE')).toBe('idle')
    expect(mapStatusToVisualState('GONE')).toBe('idle')
  })

  it('builds a view model with derived presentation fields', () => {
    const viewModel = toOfficeAgentViewModel(
      {
        id: 'agent-1',
        name: '개발자 민준',
        role: 'DEVELOPER',
        status: 'WORKING',
        persona: '실용적인 시니어 개발자',
        model: 'gpt-4o',
        deskIndex: 1,
      },
      2
    )

    expect(viewModel.visualState).toBe('typing')
    expect(viewModel.statusLabel).toBe('집중 작업 중')
    expect(viewModel.badgeTone).toBe('emerald')
    expect(viewModel.paletteIndex).toBe(2)
  })
})
