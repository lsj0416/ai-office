'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/utils/schemas'

export interface AuthState {
  error: string
}

function getAuthErrorMessage(code: string | undefined, fallback: string): string {
  const messages: Record<string, string> = {
    invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다',
    user_already_exists: '이미 가입된 이메일입니다',
    email_address_already_used: '이미 가입된 이메일입니다',
    weak_password: '비밀번호가 너무 약합니다. 더 복잡한 비밀번호를 사용해주세요',
    over_request_rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
  }
  return messages[code ?? ''] ?? fallback
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return {
      error: getAuthErrorMessage(error.code, '로그인 중 오류가 발생했습니다. 다시 시도해주세요'),
    }
  }

  redirect('/workspace')
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      error: getAuthErrorMessage(error.code, '회원가입 중 오류가 발생했습니다. 다시 시도해주세요'),
    }
  }

  // Confirm email이 OFF인 경우 session이 즉시 생성됨
  // ON인 경우 session이 null → 이메일 확인 안내
  if (!data.session) {
    return { error: '가입 확인 이메일을 발송했습니다. 이메일을 확인해주세요' }
  }

  redirect('/workspace')
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
