'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  type AgentRole,
  type AIModel,
  type PersonaDetail,
  type AgentGender,
  type ExperienceLevel,
  type WorkBackground,
  type ToneStyle,
  type DecisionStyle,
  type FeedbackStyle,
} from '@/types'
import type { MemoryMetadata } from '@/types/database'

interface AgentRow {
  id: string
  name: string
  role: AgentRole
  persona: string
  persona_detail: PersonaDetail | null
  model: AIModel
  status: string
  order: number
}

interface MemoryRow {
  id: string
  content: string
  metadata: MemoryMetadata
  created_at: string
}

type DetailTab = 'info' | 'memories'

interface AgentFormData {
  name: string
  role: AgentRole
  model: AIModel
  personaDetail: PersonaDetail
}

const DEFAULT_PERSONA_DETAIL: PersonaDetail = {
  gender: 'unspecified',
  experienceLevel: 'mid',
  background: 'startup',
  tone: 'casual',
  decisionStyle: 'quick',
  feedbackStyle: 'direct',
  expertise: '',
  strengths: '',
  notes: '',
}

const EMPTY_FORM: AgentFormData = {
  name: '',
  role: 'CUSTOM',
  model: 'gpt-4o-mini',
  personaDetail: DEFAULT_PERSONA_DETAIL,
}

const ROLE_LABELS: Record<AgentRole, string> = {
  PM: 'PM',
  BACKEND: '백엔드',
  FRONTEND: '프론트',
  DEVOPS: 'DevOps',
  AI_DATA: 'AI/데이터',
  SECURITY: '보안',
  MARKETER: '마케터',
  DESIGNER: '디자이너',
  REVIEWER: '리뷰어',
  LEGAL: '법무',
  CUSTOM: '커스텀',
  DEVELOPER: '개발자',
}

const _ROLE_COLORS: Record<AgentRole, string> = {
  PM: 'bg-blue-100 text-blue-700',
  BACKEND: 'bg-violet-100 text-violet-700',
  FRONTEND: 'bg-purple-100 text-purple-700',
  DEVOPS: 'bg-cyan-100 text-cyan-700',
  AI_DATA: 'bg-indigo-100 text-indigo-700',
  SECURITY: 'bg-red-100 text-red-700',
  MARKETER: 'bg-orange-100 text-orange-700',
  DESIGNER: 'bg-pink-100 text-pink-700',
  REVIEWER: 'bg-green-100 text-green-700',
  LEGAL: 'bg-amber-100 text-amber-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
  DEVELOPER: 'bg-purple-100 text-purple-700',
}

const ROLE_TEXT_COLORS: Record<AgentRole, string> = {
  PM: 'text-blue-600',
  BACKEND: 'text-violet-600',
  FRONTEND: 'text-purple-600',
  DEVOPS: 'text-cyan-600',
  AI_DATA: 'text-indigo-600',
  SECURITY: 'text-red-600',
  MARKETER: 'text-orange-600',
  DESIGNER: 'text-pink-600',
  REVIEWER: 'text-green-600',
  LEGAL: 'text-amber-600',
  CUSTOM: 'text-gray-500',
  DEVELOPER: 'text-purple-600',
}

const GENDER_OPTIONS: { value: AgentGender; label: string }[] = [
  { value: 'unspecified', label: '미지정' },
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: 'junior', label: '주니어', desc: '1-2년차' },
  { value: 'mid', label: '미드레벨', desc: '3-5년차' },
  { value: 'senior', label: '시니어', desc: '6-10년차' },
  { value: 'lead', label: '리드/수석', desc: '10년차 이상' },
]

const BACKGROUND_OPTIONS: { value: WorkBackground; label: string }[] = [
  { value: 'startup', label: '스타트업' },
  { value: 'enterprise', label: '대기업' },
  { value: 'freelance', label: '프리랜서' },
  { value: 'consulting', label: '컨설팅' },
]

const TONE_OPTIONS: { value: ToneStyle; label: string; desc: string }[] = [
  { value: 'casual', label: '편한 말투', desc: '친근하고 부담 없는' },
  { value: 'formal', label: '격식체', desc: '정중하고 전문적인' },
  { value: 'direct', label: '직설적', desc: '결론 먼저, 군더더기 없는' },
  { value: 'gentle', label: '부드러운', desc: '완곡하고 배려하는' },
]

const DECISION_OPTIONS: { value: DecisionStyle; label: string; desc: string }[] = [
  { value: 'quick', label: '빠른 결정', desc: '실행 후 개선' },
  { value: 'careful', label: '신중한 검토', desc: '충분히 분석 후 결정' },
  { value: 'data-driven', label: '데이터 중심', desc: '수치와 근거 기반' },
  { value: 'intuitive', label: '직관/경험', desc: '맥락과 감각 신뢰' },
]

const FEEDBACK_OPTIONS: { value: FeedbackStyle; label: string; desc: string }[] = [
  { value: 'direct', label: '직접 지적', desc: '솔직하게 명시' },
  { value: 'socratic', label: '질문으로 유도', desc: '스스로 깨닫게' },
  { value: 'encouraging', label: '격려 후 개선', desc: '칭찬 먼저' },
]

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

  // 에이전트 상세 모달
  const [detailAgent, setDetailAgent] = useState<AgentRow | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('info')
  const [memories, setMemories] = useState<MemoryRow[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(false)
  const [memoriesError, setMemoriesError] = useState('')
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch(`/api/workspaces/${workspaceId}/agents`)
    const json = await res.json()
    if (json.data) setAgents(json.data)
    setIsLoading(false)
  }, [workspaceId])

  useEffect(() => {
    void fetchAgents()
  }, [fetchAgents])

  function openDetailModal(agent: AgentRow) {
    setDetailAgent(agent)
    setDetailTab('info')
    setMemories([])
    setMemoriesError('')
  }

  function closeDetailModal() {
    setDetailAgent(null)
  }

  async function loadMemories(agentId: string) {
    setMemoriesLoading(true)
    setMemoriesError('')
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/agents/${agentId}/memories`)
      const json = await res.json()
      if (!res.ok) {
        setMemoriesError('기억을 불러오지 못했습니다.')
      } else {
        setMemories((json.data as MemoryRow[]) ?? [])
      }
    } catch {
      setMemoriesError('기억을 불러오지 못했습니다.')
    } finally {
      setMemoriesLoading(false)
    }
  }

  async function handleDeleteMemory(memoryId: string) {
    if (!detailAgent) return
    setDeletingMemoryId(memoryId)
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/agents/${detailAgent.id}/memories/${memoryId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId))
      }
    } finally {
      setDeletingMemoryId(null)
    }
  }

  function openAddForm() {
    setEditingAgent(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEditForm(agent: AgentRow) {
    setEditingAgent(agent)
    setForm({
      name: agent.name,
      role: agent.role,
      model: agent.model,
      personaDetail: agent.persona_detail ?? DEFAULT_PERSONA_DETAIL,
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingAgent(null)
    setError('')
  }

  function updateDetail<K extends keyof PersonaDetail>(key: K, value: PersonaDetail[K]) {
    setForm((prev) => ({ ...prev, personaDetail: { ...prev.personaDetail, [key]: value } }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('이름을 입력해주세요.')
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
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="workspace-section-title">Team Directory</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--workspace-text)]">
            팀 에이전트
          </h1>
          <p className="mt-2 text-sm text-[var(--workspace-muted)]">
            역할, 모델, 페르소나를 한 화면에서 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="workspace-stat-card px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a97ac]">
              Agents
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--workspace-text)]">
              {agents.length}
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="rounded-[20px] bg-[#2f63d9] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(47,99,217,0.18)] hover:bg-[#2456c7]"
          >
            + 에이전트 추가
          </button>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="workspace-subtle-panel py-16 text-center text-[var(--workspace-muted)]">
          에이전트가 없습니다. 추가해보세요.
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {agents.map((agent) => (
            <li
              key={agent.id}
              className="workspace-stat-card flex items-start justify-between gap-4 rounded-[24px] p-5"
            >
              <button
                type="button"
                onClick={() => openDetailModal(agent)}
                className="flex flex-1 items-start gap-3 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#e7efff] text-sm font-bold text-[#2f63d9]">
                  {agent.name[0]}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-[var(--workspace-text)]">
                      {agent.name}
                    </span>
                    <span
                      className={`rounded-full bg-white px-2.5 py-1 text-xs font-semibold ${ROLE_TEXT_COLORS[agent.role]}`}
                    >
                      {ROLE_LABELS[agent.role]}
                    </span>
                    <span className="rounded-full bg-[#f4f7fc] px-2.5 py-1 text-xs text-[#8a97ac]">
                      {agent.model}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--workspace-muted)]">
                    {agent.persona}
                  </p>
                </div>
              </button>
              <div className="ml-2 flex shrink-0 gap-2">
                <button
                  onClick={() => openEditForm(agent)}
                  className="rounded-xl border border-[var(--workspace-line)] px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(agent)}
                  disabled={deletingId === agent.id}
                  className="rounded-xl border border-red-100 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-40"
                >
                  {deletingId === agent.id ? '...' : '삭제'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {detailAgent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e7efff] text-sm font-bold text-[#2f63d9]">
                  {detailAgent.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{detailAgent.name}</p>
                  <p className="text-xs text-gray-400">{ROLE_LABELS[detailAgent.role]}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => setDetailTab('info')}
                className={`flex-1 py-2.5 text-sm font-medium transition ${
                  detailTab === 'info'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                정보
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailTab('memories')
                  void loadMemories(detailAgent.id)
                }}
                className={`flex-1 py-2.5 text-sm font-medium transition ${
                  detailTab === 'memories'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                기억
              </button>
            </div>

            <div className="p-6">
              {detailTab === 'info' && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      모델
                    </p>
                    <p className="text-sm text-gray-700">{detailAgent.model}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      페르소나
                    </p>
                    <p className="text-sm leading-6 text-gray-700">{detailAgent.persona}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeDetailModal()
                        openEditForm(detailAgent)
                      }}
                      className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeDetailModal()
                        void handleDelete(detailAgent)
                      }}
                      className="flex-1 rounded-lg border border-red-100 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}

              {detailTab === 'memories' && (
                <div>
                  {memoriesLoading && (
                    <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
                  )}
                  {memoriesError && (
                    <p className="py-4 text-center text-sm text-red-500">{memoriesError}</p>
                  )}
                  {!memoriesLoading && !memoriesError && memories.length === 0 && (
                    <div className="py-10 text-center">
                      <p className="text-sm text-gray-400">아직 저장된 기억이 없습니다.</p>
                      <p className="mt-1 text-xs text-gray-300">대화하면 자동으로 기억됩니다.</p>
                    </div>
                  )}
                  {!memoriesLoading && !memoriesError && memories.length > 0 && (
                    <ul className="space-y-2">
                      {memories.map((memory) => (
                        <li
                          key={memory.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-3 text-sm leading-6 text-gray-700">
                              {memory.content}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(memory.created_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDeleteMemory(memory.id)}
                            disabled={deletingMemoryId === memory.id}
                            className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
                            aria-label="기억 삭제"
                          >
                            {deletingMemoryId === memory.id ? (
                              <span className="inline-block h-3.5 w-3.5 animate-pulse rounded-full bg-gray-300" />
                            ) : (
                              '✕'
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              {editingAgent ? '에이전트 수정' : '새 에이전트 추가'}
            </h2>

            <div className="space-y-5">
              {/* 기본 정보 */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  기본 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="예: 민준"
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
                        <option value="gpt-4o-mini">gpt-4o-mini (빠름)</option>
                        <option value="gpt-4o">gpt-4o (고성능)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* 프로필 */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  프로필
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">성별</label>
                    <div className="flex gap-2">
                      {GENDER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateDetail('gender', opt.value)}
                          className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                            form.personaDetail.gender === opt.value
                              ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">연차</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateDetail('experienceLevel', opt.value)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            form.personaDetail.experienceLevel === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="ml-1 text-xs opacity-70">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      출신 배경
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BACKGROUND_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateDetail('background', opt.value)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                            form.personaDetail.background === opt.value
                              ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 스타일 */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  스타일
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">말투</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateDetail('tone', opt.value)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            form.personaDetail.tone === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="block text-xs opacity-60">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      의사결정 스타일
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DECISION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateDetail('decisionStyle', opt.value)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            form.personaDetail.decisionStyle === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="block text-xs opacity-60">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      피드백 스타일
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {FEEDBACK_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateDetail('feedbackStyle', opt.value)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            form.personaDetail.feedbackStyle === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="block text-xs opacity-60">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 전문성 */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  전문성 (선택)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      전문 분야
                    </label>
                    <input
                      type="text"
                      value={form.personaDetail.expertise}
                      onChange={(e) => updateDetail('expertise', e.target.value)}
                      placeholder="예: React, TypeScript, B2B SaaS 마케팅"
                      maxLength={100}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">강점</label>
                    <input
                      type="text"
                      value={form.personaDetail.strengths}
                      onChange={(e) => updateDetail('strengths', e.target.value)}
                      placeholder="예: 코드 리뷰에 꼼꼼함, 사용자 인터뷰를 잘 함"
                      maxLength={100}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">특이사항</label>
                    <input
                      type="text"
                      value={form.personaDetail.notes}
                      onChange={(e) => updateDetail('notes', e.target.value)}
                      placeholder="예: 비용에 민감, 완벽주의적 경향"
                      maxLength={100}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>
              </section>

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
