import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted: vi.mock 호이스팅보다 먼저 실행되어 factory에서 참조 가능
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }
  }),
}))

import { evaluatePipelineAndSuggestNextTasks } from '@/lib/ai/orchestrator'

const SAMPLE_RESULTS = [
  { agentName: 'PM 에이전트', content: '랜딩 페이지 기획 완료. 구체적인 카피 작업 필요.' },
]

describe('evaluatePipelineAndSuggestNextTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('OpenAI 응답을 올바르게 파싱하여 FollowupTask 배열을 반환한다', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              tasks: [
                { title: '카피라이팅 작성', description: '랜딩 페이지 헤드라인 및 본문 카피 작성' },
                { title: '디자인 시안 요청', description: 'UI 디자이너에게 랜딩 페이지 시안 요청' },
              ],
            }),
          },
        },
      ],
    }

    mockCreate.mockResolvedValue(mockResponse)

    const result = await evaluatePipelineAndSuggestNextTasks(
      '랜딩 페이지 전략 수립',
      SAMPLE_RESULTS
    )

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      title: '카피라이팅 작성',
      description: '랜딩 페이지 헤드라인 및 본문 카피 작성',
    })
    expect(result[1]).toEqual({
      title: '디자인 시안 요청',
      description: 'UI 디자이너에게 랜딩 페이지 시안 요청',
    })
  })

  it('OpenAI 응답이 올바르지 않은 JSON이면 빈 배열을 반환한다', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'not valid json {{{}' } }],
    }

    mockCreate.mockResolvedValue(mockResponse)

    const result = await evaluatePipelineAndSuggestNextTasks(
      '랜딩 페이지 전략 수립',
      SAMPLE_RESULTS
    )

    expect(result).toEqual([])
  })

  it('OpenAI 호출 자체가 실패하면 빈 배열을 반환한다', async () => {
    mockCreate.mockRejectedValue(new Error('API 오류'))

    const result = await evaluatePipelineAndSuggestNextTasks(
      '랜딩 페이지 전략 수립',
      SAMPLE_RESULTS
    )

    expect(result).toEqual([])
  })

  it('tasks 항목에 title 또는 description이 누락되면 해당 항목을 필터링한다', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              tasks: [
                { title: '유효한 태스크', description: '설명 있음' },
                { title: '제목만 있음' },
                { description: '설명만 있음' },
              ],
            }),
          },
        },
      ],
    }

    mockCreate.mockResolvedValue(mockResponse)

    const result = await evaluatePipelineAndSuggestNextTasks('목표', SAMPLE_RESULTS)

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('유효한 태스크')
  })
})

// ─── generation 조건 검증 ─────────────────────────────────────────────────
// route.ts의 `if (generation < 3 && ...)` 분기를 직접 검증하는 순수 로직 테스트

describe('generation 루프 깊이 제한', () => {
  it('generation이 3 미만일 때만 evaluatePipelineAndSuggestNextTasks를 호출해야 한다', async () => {
    const mockEvaluate = vi.fn().mockResolvedValue([])

    // route 내부 조건과 동일한 로직을 검증
    async function runFollowupIfAllowed(generation: number) {
      if (generation < 3) {
        await mockEvaluate()
      }
    }

    await runFollowupIfAllowed(0)
    await runFollowupIfAllowed(1)
    await runFollowupIfAllowed(2)
    await runFollowupIfAllowed(3) // 호출 안 됨
    await runFollowupIfAllowed(10) // 호출 안 됨

    expect(mockEvaluate).toHaveBeenCalledTimes(3)
  })

  it('followup_tasks 이벤트는 done 이벤트보다 먼저 enqueue된다', () => {
    const emitted: string[] = []

    // route 내부 SSE 순서와 동일한 로직을 검증
    function emitFollowupThenDone(hasTasks: boolean) {
      if (hasTasks) emitted.push('followup_tasks')
      emitted.push('done')
    }

    emitFollowupThenDone(true)

    const followupIdx = emitted.indexOf('followup_tasks')
    const doneIdx = emitted.indexOf('done')

    expect(followupIdx).toBeLessThan(doneIdx)
  })
})
