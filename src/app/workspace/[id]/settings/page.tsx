'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { WorkspaceProduct } from '@/types'

interface WorkspaceForm {
  name: string
  vision: string
  industry: string
  targetCustomer: string
  products: WorkspaceProduct[]
  teamCulture: string
  keyMetrics: string
}

const STATUS_OPTIONS: { value: WorkspaceProduct['status']; label: string }[] = [
  { value: 'planning', label: '기획 중' },
  { value: 'development', label: '개발 중' },
  { value: 'launched', label: '출시됨' },
  { value: 'deprecated', label: '종료됨' },
]

const INDUSTRY_OPTIONS = [
  'SaaS',
  '이커머스',
  '교육',
  '헬스케어',
  '핀테크',
  '미디어/콘텐츠',
  '엔터프라이즈 소프트웨어',
  '모바일 앱',
  '기타',
]

const EMPTY_FORM: WorkspaceForm = {
  name: '',
  vision: '',
  industry: '',
  targetCustomer: '',
  products: [],
  teamCulture: '',
  keyMetrics: '',
}

export default function WorkspaceSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<WorkspaceForm>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workspaces/${id}`)
        if (!res.ok) return
        const json = await res.json()
        const w = json.data
        setForm({
          name: w.name ?? '',
          vision: w.vision ?? '',
          industry: w.industry ?? '',
          targetCustomer: w.targetCustomer ?? '',
          products: w.products ?? [],
          teamCulture: w.teamCulture ?? '',
          keyMetrics: w.keyMetrics ?? '',
        })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          vision: form.vision,
          industry: form.industry || null,
          targetCustomer: form.targetCustomer || null,
          products: form.products.length > 0 ? form.products : null,
          teamCulture: form.teamCulture || null,
          keyMetrics: form.keyMetrics || null,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? '저장 실패')
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  function addProduct() {
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, { name: '', description: '', status: 'development' }],
    }))
  }

  function updateProduct(index: number, field: keyof WorkspaceProduct, value: string) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }))
  }

  function removeProduct(index: number) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">회사 설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          이 정보는 모든 에이전트가 대화할 때 자동으로 참고합니다.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 기본 정보 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">기본 정보</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              회사명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비전</label>
            <textarea
              value={form.vision}
              onChange={(e) => setForm((p) => ({ ...p, vision: e.target.value }))}
              maxLength={200}
              rows={2}
              placeholder="예: 1인 개발자도 AI 팀과 함께 빠르게 제품을 만들 수 있다"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">업종</label>
            <select
              value={form.industry}
              onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">선택 안 함</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">타깃 고객</label>
            <input
              type="text"
              value={form.targetCustomer}
              onChange={(e) => setForm((p) => ({ ...p, targetCustomer: e.target.value }))}
              maxLength={300}
              placeholder="예: 1인 개발자, 소규모 스타트업 팀"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </section>

        {/* 제품/서비스 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              제품 / 서비스
            </h2>
            <button
              type="button"
              onClick={addProduct}
              disabled={form.products.length >= 10}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40"
            >
              + 추가
            </button>
          </div>

          {form.products.length === 0 && (
            <p className="text-sm text-gray-400">아직 등록된 제품이 없습니다.</p>
          )}

          {form.products.map((product, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  maxLength={50}
                  placeholder="제품명"
                  className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                />
                <select
                  value={product.status}
                  onChange={(e) => updateProduct(index, 'status', e.target.value)}
                  className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={product.description}
                onChange={(e) => updateProduct(index, 'description', e.target.value)}
                maxLength={200}
                placeholder="제품/서비스 설명"
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          ))}
        </section>

        {/* 팀 & 지표 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">팀 & 지표</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">팀 문화</label>
            <textarea
              value={form.teamCulture}
              onChange={(e) => setForm((p) => ({ ...p, teamCulture: e.target.value }))}
              maxLength={500}
              rows={2}
              placeholder="예: 빠른 실험과 검증을 중시하는 린 스타트업 방식"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">핵심 지표</label>
            <input
              type="text"
              value={form.keyMetrics}
              onChange={(e) => setForm((p) => ({ ...p, keyMetrics: e.target.value }))}
              maxLength={300}
              placeholder="예: MAU 100명, 베타 테스터 20명, MRR $500"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving || !form.name.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
          {saved && <span className="text-sm text-green-600">저장되었습니다</span>}
        </div>
      </form>
    </div>
  )
}
