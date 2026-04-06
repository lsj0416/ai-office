'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { AgentRole, AIModel, AgentStatus } from '@/types'
import type { OfficeAgentViewModel } from '@/types/office'
import { ZONE_COPY } from './manifest'
import { toOfficeAgentViewModel } from './model'
import { usePixiOffice } from './hooks/usePixiOffice'
import ChatDialog from './ChatDialog'

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

export default function OfficeCanvas({ workspaceId }: OfficeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [agents, setAgents] = useState<OfficeAgentViewModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

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

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  )

  const { nearbyAgent, activeZone } = usePixiOffice({
    containerRef,
    agents,
    selectedAgentId,
    onAgentSelect: (agent) => setSelectedAgentId(agent.id),
    isMobile,
  })

  useEffect(() => {
    if (isMobile) return

    function handleKey(event: KeyboardEvent) {
      if (event.code === 'KeyE' && nearbyAgent) {
        setSelectedAgentId(nearbyAgent.agent.id)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isMobile, nearbyAgent])

  if (isLoading) {
    return (
      <div className="workspace-panel flex min-h-[720px] items-center justify-center text-[var(--workspace-muted)]">
        오피스 캔버스를 재구성하는 중...
      </div>
    )
  }

  const zoneInfo = ZONE_COPY[activeZone]

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
              {zoneInfo.description}
            </span>
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
