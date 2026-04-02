import Link from 'next/link'

const navItems = [
  { href: 'office', label: '오피스' },
  { href: 'chat', label: '채팅' },
  { href: 'tasks', label: '태스크' },
]

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-gray-200 bg-white">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">워크스페이스</p>
        </div>
        <nav className="px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/workspace/${String(params)?.toString() ?? ''}/${item.href}`}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  )
}
