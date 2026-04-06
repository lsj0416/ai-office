'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'

const navItems = [
  { href: 'office', label: '오피스' },
  { href: 'auto', label: 'AUTO' },
  { href: 'chat', label: '채팅' },
  { href: 'meeting', label: '회의' },
  { href: 'agents', label: '팀' },
  { href: 'tasks', label: '태스크' },
] as const

interface WorkspaceShellProps {
  workspaceId: string
  children: React.ReactNode
}

export default function WorkspaceShell({ workspaceId, children }: WorkspaceShellProps) {
  const segment = useSelectedLayoutSegment() ?? 'office'
  const isOfficeRoute = segment === 'office'

  return (
    <div className="min-h-screen bg-[var(--workspace-bg)] text-[var(--workspace-text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-3 p-3 sm:gap-4 sm:p-4">
        <aside className="workspace-panel hidden w-[112px] shrink-0 px-2 py-3 md:block">
          <nav className="flex w-full flex-col gap-2">
            {navItems.map((item) => {
              const isActive = item.href === segment
              return (
                <Link
                  key={item.href}
                  href={`/workspace/${workspaceId}/${item.href}`}
                  className={`rounded-2xl border px-3 py-3 text-center text-sm font-medium transition ${
                    isActive
                      ? 'border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent-strong)]'
                      : 'border-transparent text-[var(--workspace-muted)] hover:border-[var(--workspace-line)] hover:bg-white hover:text-[var(--workspace-text)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <nav className="workspace-panel flex gap-2 overflow-x-auto px-3 py-2 md:hidden">
            {navItems.map((item) => {
              const isActive = item.href === segment
              return (
                <Link
                  key={item.href}
                  href={`/workspace/${workspaceId}/${item.href}`}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent-strong)]'
                      : 'border-transparent bg-transparent text-[var(--workspace-muted)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <main className={isOfficeRoute ? 'min-h-0 flex-1' : 'flex-1'}>
            <div
              className={
                isOfficeRoute
                  ? 'h-full min-h-[calc(100vh-24px)]'
                  : 'workspace-panel min-h-[calc(100vh-24px)] px-4 py-5 sm:px-6'
              }
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
