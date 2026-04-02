import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { z } from 'zod'

const updateAgentSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  role: z.enum(['PM', 'DEVELOPER', 'MARKETER', 'DESIGNER', 'REVIEWER', 'CUSTOM']).optional(),
  persona: z.string().min(1).max(300).optional(),
  model: z.enum(['gpt-4o', 'gpt-4o-mini']).optional(),
})

async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  agentId: string,
  userId: string
) {
  const { data } = await supabase
    .from('agents')
    .select('id, workspaces!inner(user_id)')
    .eq('id', agentId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!data) return false

  const ws = data.workspaces as { user_id: string } | null
  return ws?.user_id === userId
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> }
): Promise<Response> {
  const { id: workspaceId, agentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const owned = await verifyOwnership(supabase, workspaceId, agentId, user.id)
  if (!owned) return errorResponse('에이전트를 찾을 수 없습니다', 404)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = updateAgentSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const { data, error } = await supabase
    .from('agents')
    .update(parsed.data)
    .eq('id', agentId)
    .select()
    .single()

  if (error) return errorResponse(error.message, 500)

  return successResponse(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> }
): Promise<Response> {
  const { id: workspaceId, agentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const owned = await verifyOwnership(supabase, workspaceId, agentId, user.id)
  if (!owned) return errorResponse('에이전트를 찾을 수 없습니다', 404)

  const { error } = await supabase.from('agents').delete().eq('id', agentId)

  if (error) return errorResponse(error.message, 500)

  return successResponse({ id: agentId })
}
