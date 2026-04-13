import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> }
): Promise<Response> {
  const { id: workspaceId, agentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!workspace) return errorResponse('워크스페이스를 찾을 수 없습니다', 404)

  const { data, error } = await supabase
    .from('memories')
    .select('id, content, metadata, created_at')
    .eq('workspace_id', workspaceId)
    .eq('metadata->>agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return errorResponse(error.message, 500)

  return successResponse(data ?? [])
}
