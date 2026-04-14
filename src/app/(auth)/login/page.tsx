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
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
        Welcome back
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
        로그인
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--public-muted)]">
        오늘의 목표를 팀에게 넘기기 전에, 먼저 워크스페이스로 들어갑니다.
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        {state.error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.error}
          </p>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--public-text)]" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-h-12 w-full rounded-2xl border border-[var(--public-line-strong)] bg-white px-4 text-[var(--public-text)] outline-none transition placeholder:text-[#97a3b8] focus:border-[var(--public-accent)] focus:ring-4 focus:ring-[var(--public-accent-soft)]"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--public-text)]" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="min-h-12 w-full rounded-2xl border border-[var(--public-line-strong)] bg-white px-4 text-[var(--public-text)] outline-none transition focus:border-[var(--public-accent)] focus:ring-4 focus:ring-[var(--public-accent-soft)]"
          />
        </div>
        <SubmitButton />
      </form>
      <p className="mt-6 text-center text-sm text-[var(--public-muted)]">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-[var(--public-accent)] hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
