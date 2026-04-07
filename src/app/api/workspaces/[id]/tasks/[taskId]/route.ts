import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
): Promise<Response> {
  const { id: workspaceId, taskId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { data: task } = await supabase
    .from('tasks')
    .select('id, workspaces!inner(user_id)')
    .eq('id', taskId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!task) return errorResponse('태스크를 찾을 수 없습니다', 404)

  const ws = task.workspaces as { user_id: string } | null
  if (ws?.user_id !== user.id) return errorResponse('태스크를 찾을 수 없습니다', 404)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.assigneeId !== undefined) updateData.assignee_id = parsed.data.assigneeId
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select('*, agents(id, name, role)')
    .single()

  if (error) return errorResponse(error.message, 500)

  return successResponse(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
): Promise<Response> {
  const { id: workspaceId, taskId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { data: task } = await supabase
    .from('tasks')
    .select('id, workspaces!inner(user_id)')
    .eq('id', taskId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!task) return errorResponse('태스크를 찾을 수 없습니다', 404)

  const ws = task.workspaces as { user_id: string } | null
  if (ws?.user_id !== user.id) return errorResponse('태스크를 찾을 수 없습니다', 404)

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) return errorResponse(error.message, 500)

  return successResponse({ id: taskId })
}
