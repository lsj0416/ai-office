'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { signup } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
    >
      {pending ? '가입 중...' : '회원가입'}
    </button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signup, { error: '' })

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
        First workspace
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
        회원가입
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--public-muted)]">
        계정을 만들면 바로 AI 팀을 생성하고 오피스로 들어갈 수 있습니다.
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
            autoComplete="new-password"
            required
            className="min-h-12 w-full rounded-2xl border border-[var(--public-line-strong)] bg-white px-4 text-[var(--public-text)] outline-none transition focus:border-[var(--public-accent)] focus:ring-4 focus:ring-[var(--public-accent-soft)]"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--public-text)]" htmlFor="confirmPassword">
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="min-h-12 w-full rounded-2xl border border-[var(--public-line-strong)] bg-white px-4 text-[var(--public-text)] outline-none transition focus:border-[var(--public-accent)] focus:ring-4 focus:ring-[var(--public-accent-soft)]"
          />
        </div>
        <SubmitButton />
      </form>
      <p className="mt-6 text-center text-sm text-[var(--public-muted)]">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-[var(--public-accent)] hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
