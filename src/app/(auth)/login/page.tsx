'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { login } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
    >
      {pending ? '로그인 중...' : '로그인'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, { error: '' })

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">로그인</h2>
      <form action={formAction} className="space-y-4">
        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <SubmitButton />
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
