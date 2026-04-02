'use client'

import { useEffect, useState } from 'react'
import { type AgentRole, type TaskStatus } from '@/types'

interface AgentRef {
  id: string
  name: string
  role: AgentRole
}

interface TaskRow {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  assignee_id: string | null
  agents: AgentRef | null
  created_at: string
}

interface TaskFormData {
  title: string
  description: string
  assigneeId: string | null
}

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'TODO', label: '할 일', color: 'bg-gray-100' },
  { key: 'IN_PROGRESS', label: '진행 중', color: 'bg-blue-50' },
  { key: 'DONE', label: '완료', color: 'bg-green-50' },
]

const EMPTY_FORM: TaskFormData = { title: '', description: '', assigneeId: null }

export default function TasksPage({ params }: { params: { id: string } }) {
  const workspaceId = params.id

  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [agents, setAgents] = useState<AgentRef[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null)
  const [form, setForm] = useState<TaskFormData>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/workspaces/${workspaceId}/tasks`).then((r) => r.json()),
      fetch(`/api/workspaces/${workspaceId}/agents`).then((r) => r.json()),
    ]).then(([taskJson, agentJson]) => {
      if (taskJson.data) setTasks(taskJson.data)
      if (agentJson.data) setAgents(agentJson.data)
      setIsLoading(false)
    })
  }, [workspaceId])

  function openAddForm() {
    setEditingTask(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEditForm(task: TaskRow) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      assigneeId: task.assignee_id,
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingTask(null)
    setError('')
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    setIsSaving(true)
    setError('')

    const url = editingTask
      ? `/api/workspaces/${workspaceId}/tasks/${editingTask.id}`
      : `/api/workspaces/${workspaceId}/tasks`

    const res = await fetch(url, {
      method: editingTask ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        assigneeId: form.assigneeId,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? '저장 실패')
      setIsSaving(false)
      return
    }

    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? json.data : t)))
    } else {
      setTasks((prev) => [...prev, json.data])
    }

    closeForm()
    setIsSaving(false)
  }

  async function handleStatusChange(task: TaskRow, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)))

    const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!res.ok) {
      // 실패 시 롤백
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
    }
  }

  async function handleDelete(task: TaskRow) {
    if (!confirm(`"${task.title}"을(를) 삭제할까요?`)) return

    const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${task.id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    }
  }

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center text-gray-400">불러오는 중...</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">태스크</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {tasks.length}개 · 완료 {tasks.filter((t) => t.status === 'DONE').length}개
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 태스크 추가
        </button>
      </div>

      {/* 칸반 3열 */}
      <div className="grid flex-1 grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className={`rounded-xl p-3 ${col.color}`}>
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-100"
                  >
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>

                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{task.description}</p>
                    )}

                    {task.agents && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {task.agents.name[0]}
                        </div>
                        <span className="text-xs text-gray-400">{task.agents.name}</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                        className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600 focus:outline-none"
                      >
                        {STATUS_COLUMNS.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditForm(task)}
                          className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 추가/수정 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              {editingTask ? '태스크 수정' : '새 태스크 추가'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="예: 랜딩 페이지 카피 작성"
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  설명 <span className="text-gray-400">(선택)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="상세 내용을 입력하세요"
                  maxLength={500}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  담당 에이전트 <span className="text-gray-400">(선택)</span>
                </label>
                <select
                  value={form.assigneeId ?? ''}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value || null })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="">없음</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
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
