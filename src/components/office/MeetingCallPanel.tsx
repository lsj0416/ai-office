'use client'

import { useEffect, useMemo, useState } from 'react'
import type { OfficeAgentViewModel, OfficeMeetingSession } from '@/types/office'

interface MeetingCallPanelProps {
  agents: OfficeAgentViewModel[]
  initialSelectedAgentId: string | null
  isOpen: boolean
  session: OfficeMeetingSession | null
  onClose: () => void
  onEndMeeting: () => void
  onStartMeeting: (input: { agenda: string; participantIds: string[] }) => void
}

const STATUS_LABELS: Record<OfficeMeetingSession['status'], string> = {
  gathering: '참가자 집합 중',
  running: '오케스트레이션 실행 중',
  done: '회의 완료',
  error: '회의 오류',
}

export default function MeetingCallPanel({
  agents,
  initialSelectedAgentId,
  isOpen,
  session,
  onClose,
  onEndMeeting,
  onStartMeeting,
}: MeetingCallPanelProps) {
  const [agenda, setAgenda] = useState('')
  const [participantIds, setParticipantIds] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen || session) return
    setAgenda('')
    setParticipantIds(initialSelectedAgentId ? [initialSelectedAgentId] : [])
  }, [initialSelectedAgentId, isOpen, session])

  const participants = useMemo(
    () =>
      (session?.participantIds ?? participantIds)
        .map((participantId) => agents.find((agent) => agent.id === participantId))
        .filter((agent): agent is OfficeAgentViewModel => agent !== undefined),
    [agents, participantIds, session]
  )

  if (!isOpen) return null

  function toggleParticipant(agentId: string) {
    setParticipantIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    )
  }

  function handleStart() {
    if (agenda.trim() === '' || participantIds.length === 0) return
    onStartMeeting({ agenda: agenda.trim(), participantIds })
  }

  return (
    <div className="absolute inset-4 z-20 overflow-hidden rounded-[28px] border border-black/10 bg-[rgba(255,252,245,0.96)] shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--workspace-text)]">회의 소집</h2>
          <p className="mt-1 text-xs text-[var(--workspace-muted)]">
            선택한 직원이 회의실에 모이면 오케스트레이션을 실행합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session && (
            <button
              type="button"
              onClick={onEndMeeting}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[var(--workspace-text)]"
            >
              회의 종료
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[var(--workspace-text)]"
          >
            닫기
          </button>
        </div>
      </div>

      {session ? (
        <div className="grid h-[calc(100%-73px)] gap-4 p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-xs font-medium text-[var(--workspace-muted)]">상태</div>
              <div className="mt-2 text-sm font-semibold text-[var(--workspace-text)]">
                {STATUS_LABELS[session.status]}
              </div>
              <div className="mt-4 text-xs font-medium text-[var(--workspace-muted)]">안건</div>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-text)]">{session.agenda}</p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-xs font-medium text-[var(--workspace-muted)]">참가자</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {participants.map((agent) => (
                  <span
                    key={agent.id}
                    className="rounded-full border border-[var(--workspace-line)] bg-[#f5efe2] px-3 py-1 text-xs text-[var(--workspace-text)]"
                  >
                    {agent.name}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto rounded-2xl border border-black/10 bg-white p-4">
            {session.analysis && (
              <div className="rounded-2xl border border-[var(--workspace-line)] bg-[#faf7ef] px-4 py-3 text-sm leading-6 text-[var(--workspace-text)]">
                {session.analysis}
              </div>
            )}

            {session.error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {session.error}
              </div>
            )}

            <div className="mt-4 space-y-4">
              {session.results.map((result) => (
                <article key={result.agentId} className="rounded-2xl border border-black/10 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[var(--workspace-text)]">
                        {result.agentName}
                      </div>
                      <div className="mt-1 text-xs text-[var(--workspace-muted)]">{result.subTask}</div>
                    </div>
                    <span className="rounded-full border border-[var(--workspace-line)] bg-[#f7f3eb] px-3 py-1 text-[11px] text-[var(--workspace-muted)]">
                      {result.done ? '완료' : '실행 중'}
                    </span>
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--workspace-text)]">
                    {result.content || (session.status === 'gathering' ? '회의실로 이동 중...' : '응답 대기 중...')}
                  </div>
                </article>
              ))}

              {session.results.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-[var(--workspace-muted)]">
                  {session.status === 'gathering'
                    ? '참가자가 회의실에 모이면 실행 계획이 표시됩니다.'
                    : '실행 계획을 준비하는 중입니다.'}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid h-[calc(100%-73px)] gap-4 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-xs font-medium text-[var(--workspace-muted)]">참가자 선택</div>
            <div className="mt-3 space-y-2">
              {agents.map((agent) => (
                <label
                  key={agent.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--workspace-line)] px-3 py-3"
                >
                  <input
                    type="checkbox"
                    checked={participantIds.includes(agent.id)}
                    onChange={() => toggleParticipant(agent.id)}
                    className="mt-1 h-4 w-4 rounded border-[var(--workspace-line)]"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--workspace-text)]">
                      {agent.name}
                    </div>
                    <div className="mt-1 text-xs text-[var(--workspace-muted)]">{agent.role}</div>
                  </div>
                </label>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <label className="text-xs font-medium text-[var(--workspace-muted)]">회의 안건</label>
            <textarea
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              placeholder="예: 신규 기능 출시 전략과 구현 우선순위를 정리해줘"
              className="mt-3 min-h-[220px] w-full rounded-2xl border border-[var(--workspace-line)] bg-[#fcfbf7] px-4 py-3 text-sm leading-6 text-[var(--workspace-text)] outline-none focus:border-[var(--workspace-accent-strong)]"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[var(--workspace-muted)]">
                {participantIds.length === 0
                  ? '직원을 1명 이상 선택하세요.'
                  : `${participantIds.length}명의 직원을 회의실로 소집합니다.`}
              </div>

              <button
                type="button"
                onClick={handleStart}
                disabled={agenda.trim() === '' || participantIds.length === 0}
                className="rounded-full bg-[var(--workspace-accent)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                회의 시작
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
