'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { AgentRole, AIModel, AgentStatus } from '@/types'
import type { OfficeMeetingResult, OfficeMeetingSession, OfficeMeetingStep, OfficeAgentViewModel } from '@/types/office'
import { ZONE_COPY } from './manifest'
import { toOfficeAgentViewModel } from './model'
import { usePixiOffice } from './hooks/usePixiOffice'
import ChatDialog from './ChatDialog'
import MeetingCallPanel from './MeetingCallPanel'
import { buildMeetingSeatAssignments } from './meeting'

interface OfficeCanvasProps {
  workspaceId: string
}

interface AgentRow {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  persona: string
  model: AIModel
}

interface OrchestratePlanEvent {
  type: 'plan'
  analysis: string
  steps: OfficeMeetingStep[]
}

interface OrchestrateChunkEvent {
  type: 'chunk'
  agentId: string
  content: string
}

interface OrchestrateAgentDoneEvent {
  type: 'agent_done'
  agentId: string
}

interface OrchestrateDoneEvent {
  type: 'done'
}

interface OrchestrateErrorEvent {
  type: 'error'
  message: string
}

type OrchestrateEvent =
  | OrchestratePlanEvent
  | OrchestrateChunkEvent
  | OrchestrateAgentDoneEvent
  | OrchestrateDoneEvent
  | OrchestrateErrorEvent

export default function OfficeCanvas({ workspaceId }: OfficeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const meetingSessionRef = useRef<OfficeMeetingSession | null>(null)

  const [agents, setAgents] = useState<OfficeAgentViewModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isMeetingPanelOpen, setIsMeetingPanelOpen] = useState(false)
  const [meetingSession, setMeetingSession] = useState<OfficeMeetingSession | null>(null)

  useEffect(() => {
    function syncViewport() {
      setIsMobile(window.innerWidth < 1024)
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/agents`)
      .then((response) => response.json())
      .then((json) => {
        const rows: AgentRow[] = json.data ?? []
        const officeAgents = rows.map((agent, index) =>
          toOfficeAgentViewModel(
            {
              id: agent.id,
              name: agent.name,
              role: agent.role,
              status: agent.status,
              persona: agent.persona,
              model: agent.model,
              deskIndex: index,
            },
            index + 1
          )
        )
        setAgents(officeAgents)
      })
      .finally(() => setIsLoading(false))
  }, [workspaceId])

  useEffect(() => {
    if (!selectedAgentId) return
    if (!agents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(null)
    }
  }, [agents, selectedAgentId])

  useEffect(() => {
    meetingSessionRef.current = meetingSession
  }, [meetingSession])

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  )

  const { nearbyAgent, activeZone } = usePixiOffice({
    containerRef,
    agents,
    selectedAgentId,
    onAgentSelect: (agent) => setSelectedAgentId(agent.id),
    meetingSession,
    onMeetingParticipantsArrived: (sessionId) => {
      void runMeetingOrchestration(sessionId)
    },
    isMobile,
  })

  async function runMeetingOrchestration(sessionId: string) {
    const session = meetingSessionRef.current
    if (!session || session.id !== sessionId || session.status !== 'gathering') return

    setMeetingSession((prev) =>
      prev && prev.id === sessionId
        ? {
            ...prev,
            status: 'running',
            analysis: '',
            results: [],
            error: '',
          }
        : prev
    )

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          message: session.agenda,
          participantIds: session.participantIds,
        }),
      })

      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({ error: '회의 실행 실패' }))) as {
          error?: string
        }
        setMeetingSession((prev) =>
          prev && prev.id === sessionId
            ? {
                ...prev,
                status: 'error',
                error: json.error ?? '회의 실행 실패',
              }
            : prev
        )
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
          handleMeetingEvent(sessionId, JSON.parse(line.slice(6)) as OrchestrateEvent)
        }
      }
    } catch {
      setMeetingSession((prev) =>
        prev && prev.id === sessionId
          ? {
              ...prev,
              status: 'error',
              error: '회의 실행 중 네트워크 오류가 발생했습니다.',
            }
          : prev
      )
    }
  }

  function handleMeetingEvent(sessionId: string, event: OrchestrateEvent) {
    setMeetingSession((prev) => {
      if (!prev || prev.id !== sessionId) return prev

      if (event.type === 'plan') {
        const results: OfficeMeetingResult[] = event.steps.map((step) => ({
          ...step,
          content: '',
          done: false,
        }))
        return {
          ...prev,
          analysis: event.analysis,
          results,
          error: '',
        }
      }

      if (event.type === 'chunk') {
        return {
          ...prev,
          results: prev.results.map((result) =>
            result.agentId === event.agentId
              ? { ...result, content: result.content + event.content }
              : result
          ),
        }
      }

      if (event.type === 'agent_done') {
        return {
          ...prev,
          results: prev.results.map((result) =>
            result.agentId === event.agentId ? { ...result, done: true } : result
          ),
        }
      }

      if (event.type === 'done') {
        return {
          ...prev,
          status: 'done',
        }
      }

      return {
        ...prev,
        status: 'error',
        error: event.message,
      }
    })
  }

  function handleStartMeeting(input: { agenda: string; participantIds: string[] }) {
    try {
      const nextSession: OfficeMeetingSession = {
        id: crypto.randomUUID(),
        agenda: input.agenda,
        participantIds: input.participantIds,
        seatAssignments: buildMeetingSeatAssignments(input.participantIds),
        status: 'gathering',
        analysis: '',
        results: [],
        error: '',
      }

      setMeetingSession(nextSession)
      setIsMeetingPanelOpen(true)
      setSelectedAgentId(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '회의 참가자 정보를 처리하지 못했습니다.'
      setMeetingSession({
        id: crypto.randomUUID(),
        agenda: input.agenda,
        participantIds: input.participantIds,
        seatAssignments: {},
        status: 'error',
        analysis: '',
        results: [],
        error: message,
      })
      setIsMeetingPanelOpen(true)
    }
  }

  function handleEndMeeting() {
    setMeetingSession(null)
  }

  useEffect(() => {
    if (isMobile) return

    function handleKey(event: KeyboardEvent) {
      if (event.code === 'KeyE' && nearbyAgent) {
        setSelectedAgentId(nearbyAgent.agent.id)
        return
      }

      if (event.code === 'KeyR' && activeZone === 'meeting') {
        setIsMeetingPanelOpen(true)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeZone, isMobile, nearbyAgent])

  if (isLoading) {
    return (
      <div className="workspace-panel flex min-h-[720px] items-center justify-center text-[var(--workspace-muted)]">
        오피스 캔버스를 재구성하는 중...
      </div>
    )
  }

  const zoneInfo = ZONE_COPY[activeZone]
  const meetingParticipantLabel =
    meetingSession?.participantIds
      .map((participantId) => agents.find((agent) => agent.id === participantId)?.name)
      .filter((name): name is string => Boolean(name))
      .join(', ') ?? ''

  return (
    <div className="flex h-full flex-col">
      <section className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="workspace-panel flex min-h-[720px] flex-col p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--workspace-muted)]">
            <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
              직원 {agents.length}명
            </span>
            <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
              현재 구역 {zoneInfo.label}
            </span>
            <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
              {selectedAgent?.name ?? nearbyAgent?.agent.name ?? '선택된 직원 없음'}
            </span>
            {(activeZone === 'meeting' || meetingSession) && (
              <button
                type="button"
                onClick={() => setIsMeetingPanelOpen(true)}
                className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5 text-[var(--workspace-text)]"
              >
                {meetingSession ? '회의 패널 열기' : '회의 소집'}
              </button>
            )}
          </div>

          <div className="scanlines relative flex-1 overflow-hidden rounded-[28px] border border-[var(--workspace-line)] bg-[#f4f1ea]">
            <div ref={containerRef} className="relative w-full" />

            {!isMobile && nearbyAgent && !selectedAgent && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/35 bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
                <kbd className="rounded bg-white/15 px-2 py-1 text-xs">E</kbd> 를 눌러{' '}
                <strong>{nearbyAgent.agent.name}</strong>과 대화하기
              </div>
            )}

            {isMobile && (
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-xs leading-5 text-[var(--office-text)] backdrop-blur">
                모바일에서는 캐릭터를 탭해 채널을 열 수 있습니다.
              </div>
            )}

            <MeetingCallPanel
              agents={agents}
              initialSelectedAgentId={selectedAgentId}
              isOpen={isMeetingPanelOpen}
              session={meetingSession}
              onClose={() => setIsMeetingPanelOpen(false)}
              onEndMeeting={handleEndMeeting}
              onStartMeeting={handleStartMeeting}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--workspace-muted)]">
            {!isMobile && (
              <>
                <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
                  이동: WASD / 방향키
                </span>
                <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
                  상호작용: E 또는 캐릭터 클릭
                </span>
              </>
            )}
            <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
              닫기: ESC
            </span>
            <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
              회의 소집: R
            </span>
            <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
              {zoneInfo.description}
            </span>
            {meetingSession && (
              <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1.5">
                회의 중 {meetingParticipantLabel || '참가자 정보 없음'}
              </span>
            )}
          </div>
        </div>

        {!isMobile && (
          <ChatDialog
            agent={selectedAgent}
            workspaceId={workspaceId}
            isMobile={false}
            onClose={() => setSelectedAgentId(null)}
          />
        )}
      </section>

      {isMobile && (
        <ChatDialog
          agent={selectedAgent}
          workspaceId={workspaceId}
          isMobile
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </div>
  )
}
