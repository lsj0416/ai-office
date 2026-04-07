import Link from 'next/link'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/server'

export default async function WorkspacePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">워크스페이스</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
        </div>

        {workspaces && workspaces.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <Link
                  href={`/workspace/${ws.id}/chat`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{ws.name}</p>
                    {ws.vision && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{ws.vision}</p>
                    )}
                  </div>
                  <span className="text-gray-300">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-gray-500">워크스페이스가 없습니다. 새로 만들어보세요.</p>
        )}

        <Link
          href="/workspace/new"
          className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          + 새 워크스페이스
        </Link>
      </div>
    </div>
  )
}
