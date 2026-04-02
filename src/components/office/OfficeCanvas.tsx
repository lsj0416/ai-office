'use client'

import { useEffect, useRef, useState } from 'react'
import type { OfficeAgent, NearbyAgent } from '@/types/office'
import type { AgentRole, AIModel, AgentStatus } from '@/types'
import { DESK_POSITIONS } from './constants'
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

  const [agents, setAgents] = useState<OfficeAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatTarget, setChatTarget] = useState<NearbyAgent | null>(null)

  // 에이전트 로드 + desk index 할당
  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/agents`)
      .then((r) => r.json())
      .then((json) => {
        const rows: AgentRow[] = json.data ?? []
        const officeAgents: OfficeAgent[] = rows
          .slice(0, DESK_POSITIONS.length)
          .map((a, i) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            status: a.status,
            persona: a.persona,
            model: a.model,
            deskIndex: i,
          }))
        setAgents(officeAgents)
      })
      .finally(() => setIsLoading(false))
  }, [workspaceId])

  const { nearbyAgent } = usePixiOffice({ containerRef, agents })

  // E 키 → 대화 열기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'KeyE' && nearbyAgent && !chatTarget) {
        setChatTarget(nearbyAgent)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [nearbyAgent, chatTarget])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-400">
        오피스 불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 캔버스 래퍼 */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div ref={containerRef} />

        {/* 근접 안내 */}
        {nearbyAgent && !chatTarget && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs">E</kbd>
            {' '}키를 눌러 <strong>{nearbyAgent.agent.name}</strong>에게 말 걸기
          </div>
        )}

        {/* 채팅 다이얼로그 */}
        {chatTarget && (
          <ChatDialog
            nearbyAgent={chatTarget}
            workspaceId={workspaceId}
            onClose={() => setChatTarget(null)}
          />
        )}
      </div>

      {/* 조작 안내 */}
      <div className="flex items-center gap-4 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500">
        <span>이동: <kbd className="rounded bg-gray-200 px-1 font-mono">W</kbd><kbd className="rounded bg-gray-200 px-1 font-mono">A</kbd><kbd className="rounded bg-gray-200 px-1 font-mono">S</kbd><kbd className="rounded bg-gray-200 px-1 font-mono">D</kbd> 또는 방향키</span>
        <span>대화: 직원에게 가까이 가서 <kbd className="rounded bg-gray-200 px-1 font-mono">E</kbd></span>
        <span>닫기: <kbd className="rounded bg-gray-200 px-1 font-mono">ESC</kbd></span>
        {agents.length > 0 && (
          <span className="ml-auto text-gray-400">직원 {agents.length}명 재직 중</span>
        )}
      </div>
    </div>
  )
}
