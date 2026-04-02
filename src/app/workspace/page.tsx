import { logout } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/server'

export default async function WorkspacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">워크스페이스</h1>
        <p className="mb-6 text-sm text-gray-500">{user?.email}</p>
        {/* TODO: 워크스페이스 목록 및 생성 기능 */}
        <p className="mb-8 text-gray-600">워크스페이스를 준비 중입니다.</p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>
      </div>
    </div>
  )
}
