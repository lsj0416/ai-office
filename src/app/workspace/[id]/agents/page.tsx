'use client'

import { useEffect, useState } from 'react'
import { type AgentRole, type AIModel } from '@/types'

interface AgentRow {
  id: string
  name: string
  role: AgentRole
  persona: string
  model: AIModel
  status: string
  order: number
}

interface AgentFormData {
  name: string
  role: AgentRole
  persona: string
  model: AIModel
}

const ROLE_LABELS: Record<AgentRole, string> = {
  PM: 'PM',
  DEVELOPER: '개발자',
  MARKETER: '마케터',
  DESIGNER: '디자이너',
  REVIEWER: '리뷰어',
  CUSTOM: '커스텀',
}

const ROLE_COLORS: Record<AgentRole, string> = {
  PM: 'bg-blue-100 text-blue-700',
  DEVELOPER: 'bg-purple-100 text-purple-700',
  MARKETER: 'bg-orange-100 text-orange-700',
  DESIGNER: 'bg-pink-100 text-pink-700',
  REVIEWER: 'bg-green-100 text-green-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
}

const EMPTY_FORM: AgentFormData = {
  name: '',
  role: 'CUSTOM',
  persona: '',
  model: 'gpt-4o-mini',
}

export default function AgentsPage({ params }: { params: { id: string } }) {
  const workspaceId = params.id

  const [agents, setAgents] = useState<AgentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentRow | null>(null)
  const [form, setForm] = useState<AgentFormData>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchAgents()
  }, [workspaceId])

  async function fetchAgents() {
    setIsLoading(true)
    const res = await fetch(`/api/workspaces/${workspaceId}/agents`)
    const json = await res.json()
    if (json.data) setAgents(json.data)
    setIsLoading(false)
  }

  function openAddForm() {
    setEditingAgent(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEditForm(agent: AgentRow) {
    setEditingAgent(agent)
    setForm({ name: agent.name, role: agent.role, persona: agent.persona, model: agent.model })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingAgent(null)
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim() || !form.persona.trim()) {
      setError('이름과 페르소나를 입력해주세요.')
      return
    }

    setIsSaving(true)
    setError('')

    const url = editingAgent
      ? `/api/workspaces/${workspaceId}/agents/${editingAgent.id}`
      : `/api/workspaces/${workspaceId}/agents`

    const res = await fetch(url, {
      method: editingAgent ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? '저장 실패')
      setIsSaving(false)
      return
    }

    await fetchAgents()
    closeForm()
    setIsSaving(false)
  }

  async function handleDelete(agent: AgentRow) {
    if (!confirm(`"${agent.name}"을(를) 삭제할까요? 관련 대화 기록도 함께 삭제됩니다.`)) return

    setDeletingId(agent.id)
    const res = await fetch(`/api/workspaces/${workspaceId}/agents/${agent.id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== agent.id))
    }
    setDeletingId(null)
  }

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center text-gray-400">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">팀 에이전트</h1>
          <p className="mt-1 text-sm text-gray-500">에이전트를 추가하고 역할을 설정하세요.</p>
        </div>
        <button
          onClick={openAddForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 에이전트 추가
        </button>
      </div>

      {/* 에이전트 목록 */}
      {agents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
          에이전트가 없습니다. 추가해보세요.
        </div>
      ) : (
        <ul className="space-y-3">
          {agents.map((agent) => (
            <li
              key={agent.id}
              className="flex items-start justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {agent.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{agent.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[agent.role]}`}
                    >
                      {ROLE_LABELS[agent.role]}
                    </span>
                    <span className="text-xs text-gray-400">{agent.model}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{agent.persona}</p>
                </div>
              </div>
              <div className="ml-4 flex shrink-0 gap-2">
                <button
                  onClick={() => openEditForm(agent)}
                  className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(agent)}
                  disabled={deletingId === agent.id}
                  className="rounded-lg px-3 py-1 text-sm text-red-500 hover:bg-red-50 disabled:opacity-40"
                >
                  {deletingId === agent.id ? '...' : '삭제'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 추가/수정 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              {editingAgent ? '에이전트 수정' : '새 에이전트 추가'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 개발자 민준"
                  maxLength={30}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">역할</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as AgentRole })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">모델</label>
                  <select
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value as AIModel })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  페르소나 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.persona}
                  onChange={(e) => setForm({ ...form, persona: e.target.value })}
                  placeholder="예: 논리적이고 체계적인 개발자. 코드 품질을 중시하며 TypeScript를 선호합니다."
                  maxLength={300}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{form.persona.length}/300</p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={closeForm}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
