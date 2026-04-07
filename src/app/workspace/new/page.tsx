'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewWorkspacePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [vision, setVision] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), vision: vision.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? '워크스페이스 생성 실패')
        return
      }

      router.push(`/workspace/${json.data.id}/chat`)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">새 워크스페이스</h1>
        <p className="mb-6 text-sm text-gray-500">
          생성하면 PM, 개발자, 마케터 에이전트가 자동으로 추가됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              워크스페이스 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 내 스타트업"
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              비전 <span className="text-gray-400">(선택)</span>
            </label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="예: 1인 개발자도 AI 팀과 함께 빠르게 제품을 만들 수 있다"
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {isLoading ? '생성 중...' : '워크스페이스 만들기'}
          </button>
        </form>
      </div>
    </div>
  )
}
