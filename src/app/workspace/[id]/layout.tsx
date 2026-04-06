import WorkspaceShell from '@/components/workspace/WorkspaceShell'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const { id } = params

  return <WorkspaceShell workspaceId={id}>{children}</WorkspaceShell>
}
