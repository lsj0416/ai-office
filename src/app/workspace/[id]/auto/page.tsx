'use client'

import { useRef, useState } from 'react'
import { type AgentRole } from '@/types'

interface PlanStep {
  agentId: string
  agentName: string
  role: AgentRole
  subTask: string
}

interface AgentResult {
  agentId: string
  agentName: string
  role: AgentRole
  subTask: string
  content: string
  done: boolean
}

interface RunState {
  analysis: string
  steps: PlanStep[]
  results: AgentResult[]
  isDone: boolean
  error: string
}

const ROLE_COLORS: Record<AgentRole, string> = {
  PM: 'bg-blue-100 text-blue-700 border-blue-200',
  DEVELOPER: 'bg-purple-100 text-purple-700 border-purple-200',
  MARKETER: 'bg-orange-100 text-orange-700 border-orange-200',
  DESIGNER: 'bg-pink-100 text-pink-700 border-pink-200',
  REVIEWER: 'bg-green-100 text-green-700 border-green-200',
  CUSTOM: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function AutoPage({ params }: { params: { id: string } }) {
  const workspaceId = params.id
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [runState, setRunState] = useState<RunState | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function handleRun() {
    const trimmed = input.trim()
    if (!trimmed || isRunning) return

    setInput('')
    setIsRunning(true)
    setRunState(null)

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, message: trimmed }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: '알 수 없는 오류' }))
        setRunState({
          analysis: '',
          steps: [],
          results: [],
          isDone: true,
          error: err.error ?? '실행 실패',
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6)) as Record<string, unknown>
          handleEvent(event)
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    } catch {
      setRunState((prev) =>
        prev ? { ...prev, isDone: true, error: '네트워크 오류가 발생했습니다.' } : null
      )
    } finally {
      setIsRunning(false)
    }
  }

  function handleEvent(event: Record<string, unknown>) {
    const type = event.type as string

    if (type === 'plan') {
      const steps = event.steps as PlanStep[]
      setRunState({
        analysis: event.analysis as string,
        steps,
        results: steps.map((s) => ({ ...s, content: '', done: false })),
        isDone: false,
        error: '',
      })
    } else if (type === 'chunk') {
      const { agentId, content } = event as { agentId: string; content: string }
      setRunState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          results: prev.results.map((r) =>
            r.agentId === agentId ? { ...r, content: r.content + content } : r
          ),
        }
      })
    } else if (type === 'agent_done') {
      const { agentId } = event as { agentId: string }
      setRunState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          results: prev.results.map((r) => (r.agentId === agentId ? { ...r, done: true } : r)),
        }
      })
    } else if (type === 'done') {
      setRunState((prev) => (prev ? { ...prev, isDone: true } : prev))
    } else if (type === 'error') {
      setRunState((prev) =>
        prev ? { ...prev, isDone: true, error: event.message as string } : null
      )
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  // 현재 실행 중인 에이전트 인덱스
  const activeIndex = runState?.results.findIndex((r) => !r.done && r.content !== '') ?? -1

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">AUTO 실행</h1>
        <p className="text-sm text-gray-500">
          요청을 입력하면 AI가 적합한 에이전트를 선택해 순차적으로 실행합니다.
        </p>
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!runState && !isRunning && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="mb-3 text-4xl">⚡</p>
              <p className="text-sm">요청을 입력하면 AI 팀이 협력해서 처리합니다.</p>
              <p className="mt-1 text-xs text-gray-300">
                {'예: "랜딩 페이지 전략을 세우고 카피를 작성해줘"'}
              </p>
            </div>
          </div>
        )}

        {runState && (
          <div className="mx-auto max-w-2xl space-y-4">
            {/* 오케스트레이터 분석 */}
            {runState.analysis && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold text-gray-400">오케스트레이터 분석</p>
                <p className="text-sm text-gray-700">{runState.analysis}</p>

                {/* 실행 순서 */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {runState.steps.map((step, i) => (
                    <div key={step.agentId} className="flex items-center gap-1">
                      {i > 0 && <span className="text-xs text-gray-300">→</span>}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[step.role]}`}
                      >
                        {step.agentName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 에이전트별 결과 */}
            {runState.results.map((result, i) => (
              <div
                key={result.agentId}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                {/* 에이전트 헤더 */}
                <div
                  className={`flex items-center justify-between border-b border-gray-100 px-4 py-2.5 ${result.done ? 'bg-white' : activeIndex === i ? 'bg-blue-50' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {result.agentName[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{result.agentName}</span>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-xs ${ROLE_COLORS[result.role]}`}
                    >
                      {result.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[200px] truncate text-xs text-gray-400">
                      {result.subTask}
                    </span>
                    {result.done ? (
                      <span className="text-xs text-green-500">✓</span>
                    ) : activeIndex === i ? (
                      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-400" />
                    ) : (
                      <span className="inline-block h-3 w-3 rounded-full bg-gray-200" />
                    )}
                  </div>
                </div>

                {/* 응답 내용 */}
                <div className="px-4 py-3">
                  {result.content ? (
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{result.content}</p>
                  ) : (
                    <p className="animate-pulse text-sm text-gray-300">대기 중...</p>
                  )}
                  {!result.done && result.content && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-gray-400" />
                  )}
                </div>
              </div>
            ))}

            {runState.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {runState.error}
              </div>
            )}

            {runState.isDone && !runState.error && (
              <div className="py-2 text-center text-xs text-gray-400">
                ✓ 모든 에이전트 실행 완료
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="AI 팀에게 작업을 맡겨보세요 (Shift+Enter: 줄바꿈)"
            rows={2}
            disabled={isRunning}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleRun}
            disabled={!input.trim() || isRunning}
            className="self-end rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {isRunning ? '실행 중' : '실행'}
          </button>
        </div>
      </div>
    </div>
  )
}
