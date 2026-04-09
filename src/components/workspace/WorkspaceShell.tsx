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
  { href: 'settings', label: '설정' },
] as const

interface WorkspaceShellProps {
  workspaceId: string
  children: React.ReactNode
}

export default function WorkspaceShell({ workspaceId, children }: WorkspaceShellProps) {
  const segment = useSelectedLayoutSegment() ?? 'office'
  const isOfficeRoute = segment === 'office'

  return (
    <div className="workspace-shell min-h-screen text-[var(--workspace-text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-3 sm:gap-5 sm:p-5">
        <aside className="workspace-panel hidden w-[124px] shrink-0 px-3 py-4 md:block">
          <div className="mb-5 px-1">
            <p className="workspace-section-title">AI Office</p>
            <p className="mt-2 text-xs leading-5 text-[var(--workspace-muted)]">
              실행 공간
            </p>
          </div>

          <nav className="flex w-full flex-col gap-2.5">
            {navItems.map((item) => {
              const isActive = item.href === segment
              return (
                <Link
                  key={item.href}
                  href={`/workspace/${workspaceId}/${item.href}`}
                  className={`rounded-2xl border px-3 py-3 text-center text-sm font-medium transition ${
                    isActive
                      ? 'border-[#c7d9ff] bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent-strong)] shadow-[0_12px_24px_rgba(35,86,184,0.12)]'
                      : 'border-transparent text-[var(--workspace-muted)] hover:border-[var(--workspace-line)] hover:bg-white/90 hover:text-[var(--workspace-text)]'
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
                  ? 'h-full min-h-[calc(100vh-40px)]'
                  : 'workspace-panel min-h-[calc(100vh-40px)] bg-[var(--workspace-surface-strong)] px-4 py-5 sm:px-6 sm:py-6'
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
