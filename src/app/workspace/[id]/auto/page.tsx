'use client'

import { useEffect, useRef, useState } from 'react'
import type { Agent, AgentRole } from '@/types'

// ─── 공통 타입 ──────────────────────────────────────────────

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

interface FollowupTask {
  title: string
  description: string
  generation: number
}

interface RunState {
  analysis: string
  steps: PlanStep[]
  results: AgentResult[]
  followupTasks: FollowupTask[]
  isDone: boolean
  error: string
}

interface ManualStep {
  key: string // UI 식별용 고유 키
  agentId: string
  agentName: string
  role: AgentRole
  subTask: string
}

type Mode = 'auto' | 'manual'

// ─── 스타일 상수 ─────────────────────────────────────────────

const ROLE_COLORS: Record<AgentRole, string> = {
  PM: 'bg-blue-100 text-blue-700 border-blue-200',
  BACKEND: 'bg-violet-100 text-violet-700 border-violet-200',
  FRONTEND: 'bg-purple-100 text-purple-700 border-purple-200',
  DEVOPS: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  AI_DATA: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SECURITY: 'bg-red-100 text-red-700 border-red-200',
  MARKETER: 'bg-orange-100 text-orange-700 border-orange-200',
  DESIGNER: 'bg-pink-100 text-pink-700 border-pink-200',
  REVIEWER: 'bg-green-100 text-green-700 border-green-200',
  LEGAL: 'bg-amber-100 text-amber-700 border-amber-200',
  CUSTOM: 'bg-gray-100 text-gray-700 border-gray-200',
  DEVELOPER: 'bg-purple-100 text-purple-700 border-purple-200',
}

// ─── 컴포넌트 ────────────────────────────────────────────────

export default function AutoPage({ params }: { params: { id: string } }) {
  const workspaceId = params.id

  // 공통
  const [mode, setMode] = useState<Mode>('auto')
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [runState, setRunState] = useState<RunState | null>(null)
  const [currentGeneration, setCurrentGeneration] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 수동 모드
  const [agents, setAgents] = useState<Agent[]>([])
  const [manualSteps, setManualSteps] = useState<ManualStep[]>([])

  // 에이전트 목록 로드
  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/agents`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setAgents(json.data as Agent[])
        }
      })
      .catch(() => {})
  }, [workspaceId])

  // ── 수동 스텝 조작 ──

  function addManualStep(agent: Agent) {
    setManualSteps((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        subTask: '',
      },
    ])
  }

  function removeManualStep(key: string) {
    setManualSteps((prev) => prev.filter((s) => s.key !== key))
  }

  function updateSubTask(key: string, value: string) {
    setManualSteps((prev) => prev.map((s) => (s.key === key ? { ...s, subTask: value } : s)))
  }

  function moveStep(key: string, direction: 'up' | 'down') {
    setManualSteps((prev) => {
      const idx = prev.findIndex((s) => s.key === key)
      if (idx === -1) return prev
      const next = direction === 'up' ? idx - 1 : idx + 1
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next]!, arr[idx]!]
      return arr
    })
  }

  // ── 실행 ──

  const canRun =
    input.trim() !== '' &&
    !isRunning &&
    (mode === 'auto' || (manualSteps.length > 0 && manualSteps.every((s) => s.subTask.trim())))

  function handleFollowupClick(task: FollowupTask) {
    if (isRunning) return
    void handleRun(task.title + ': ' + task.description, task.generation)
  }

  async function handleRun(overrideMessage?: string, overrideGeneration?: number) {
    const msg = overrideMessage ?? input.trim()
    const gen = overrideGeneration ?? 0

    if (!msg || isRunning) return

    if (!overrideMessage) setInput('')
    setIsRunning(true)
    setRunState(null)
    setCurrentGeneration(gen)

    const body: Record<string, unknown> = { workspaceId, message: msg, generation: gen }
    if (mode === 'manual' && !overrideMessage) {
      body.manualSteps = manualSteps.map((s) => ({
        agentId: s.agentId,
        subTask: s.subTask.trim(),
      }))
    }

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: '알 수 없는 오류' }))
        setRunState({
          analysis: '',
          steps: [],
          results: [],
          followupTasks: [],
          isDone: true,
          error: (err as { error?: string }).error ?? '실행 실패',
        })
        return
      }

      const reader = res.body!.getReader()
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
        followupTasks: [],
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
    } else if (type === 'followup_tasks') {
      const tasks = event.tasks as FollowupTask[]
      setRunState((prev) => (prev ? { ...prev, followupTasks: tasks } : prev))
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
      if (canRun) void handleRun()
    }
  }

  const activeIndex = runState?.results.findIndex((r) => !r.done && r.content !== '') ?? -1

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* 헤더 + 모드 토글 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">AUTO 실행</h1>
            <p className="text-sm text-gray-500">
              {mode === 'auto'
                ? 'AI가 적합한 에이전트를 선택해 순차적으로 실행합니다.'
                : '에이전트와 실행 순서를 직접 지정합니다.'}
            </p>
          </div>

          {/* 모드 토글 */}
          <div className="flex rounded-xl border border-gray-200 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setMode('auto')}
              className={`rounded-lg px-4 py-1.5 font-medium transition ${
                mode === 'auto'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              자동
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded-lg px-4 py-1.5 font-medium transition ${
                mode === 'manual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              수동
            </button>
          </div>
        </div>

        {/* 수동 모드: 에이전트 선택 패널 */}
        {mode === 'manual' && (
          <div className="mt-4 flex flex-col gap-3">
            {/* 팀 에이전트 목록 */}
            {agents.length === 0 ? (
              <p className="text-sm text-gray-400">팀 탭에서 에이전트를 먼저 추가하세요.</p>
            ) : (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">에이전트 추가</p>
                <div className="flex flex-wrap gap-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => addManualStep(agent)}
                      disabled={isRunning}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition hover:shadow-sm disabled:opacity-50 ${ROLE_COLORS[agent.role]}`}
                    >
                      <span className="font-bold">+</span>
                      {agent.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 선택된 스텝 목록 */}
            {manualSteps.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">
                  실행 순서 ({manualSteps.length}개)
                </p>
                <div className="flex flex-col gap-2">
                  {manualSteps.map((step, i) => (
                    <div
                      key={step.key}
                      className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      {/* 순서 번호 */}
                      <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                        {i + 1}
                      </span>

                      {/* 에이전트 이름 */}
                      <div className="mt-1.5 shrink-0">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[step.role]}`}
                        >
                          {step.agentName}
                        </span>
                      </div>

                      {/* 서브태스크 입력 */}
                      <input
                        type="text"
                        value={step.subTask}
                        onChange={(e) => updateSubTask(step.key, e.target.value)}
                        placeholder="이 에이전트가 수행할 작업을 입력하세요"
                        disabled={isRunning}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-400 disabled:opacity-60"
                      />

                      {/* 이동/삭제 버튼 */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStep(step.key, 'up')}
                          disabled={i === 0 || isRunning}
                          className="rounded px-1 py-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                          aria-label="위로"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(step.key, 'down')}
                          disabled={i === manualSteps.length - 1 || isRunning}
                          className="rounded px-1 py-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                          aria-label="아래로"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeManualStep(step.key)}
                          disabled={isRunning}
                          className="rounded px-1 py-0.5 text-red-300 hover:text-red-500 disabled:opacity-20"
                          aria-label="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!runState && !isRunning && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="mb-3 text-4xl">⚡</p>
              {mode === 'auto' ? (
                <>
                  <p className="text-sm">요청을 입력하면 AI 팀이 협력해서 처리합니다.</p>
                  <p className="mt-1 text-xs text-gray-300">
                    {'예: "랜딩 페이지 전략을 세우고 카피를 작성해줘"'}
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  {manualSteps.length === 0
                    ? '위에서 에이전트를 추가하고 각 작업을 입력하세요.'
                    : '전체 목표를 입력하고 실행을 누르세요.'}
                </p>
              )}
            </div>
          </div>
        )}

        {runState && (
          <div className="mx-auto max-w-2xl space-y-4">
            {/* 오케스트레이터 분석 */}
            {runState.analysis && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold text-gray-400">
                  {mode === 'manual' ? '수동 실행 계획' : '오케스트레이터 분석'}
                </p>
                <p className="text-sm text-gray-700">{runState.analysis}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {runState.steps.map((step, i) => (
                    <div key={`${step.agentId}-${i}`} className="flex items-center gap-1">
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
                key={`${result.agentId}-${i}`}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                <div
                  className={`flex items-center justify-between border-b border-gray-100 px-4 py-2.5 ${
                    result.done ? 'bg-white' : activeIndex === i ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
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

            {runState.isDone && !runState.error && runState.followupTasks.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="mb-2 text-xs font-semibold text-blue-500">
                  💡 다음 작업 제안 (클릭하면 바로 실행)
                </p>
                <div className="flex flex-col gap-2">
                  {runState.followupTasks.map((task, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleFollowupClick(task)}
                      disabled={isRunning || currentGeneration >= 3}
                      className="flex flex-col items-start gap-0.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-left hover:border-blue-400 hover:shadow-sm disabled:opacity-50"
                    >
                      <span className="text-sm font-medium text-gray-800">{task.title}</span>
                      <span className="text-xs text-gray-500">{task.description}</span>
                    </button>
                  ))}
                </div>
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
            placeholder={
              mode === 'auto'
                ? 'AI 팀에게 작업을 맡겨보세요 (Shift+Enter: 줄바꿈)'
                : '전체 목표를 입력하세요 (각 에이전트에게 맥락으로 전달됩니다)'
            }
            rows={2}
            disabled={isRunning}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => {
              if (canRun) void handleRun()
            }}
            disabled={!canRun}
            className="self-end rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {isRunning ? '실행 중' : '실행'}
          </button>
        </div>
        {mode === 'manual' && manualSteps.some((s) => !s.subTask.trim()) && (
          <p className="mx-auto mt-1.5 max-w-2xl text-xs text-amber-500">
            모든 에이전트의 작업 내용을 입력해야 실행할 수 있습니다.
          </p>
        )}
      </div>
    </div>
  )
}
