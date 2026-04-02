import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  description: z.string().max(500).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id: workspaceId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { data, error } = await supabase
    .from('tasks')
    .select('*, agents(id, name, role)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) return errorResponse(error.message, 500)

  return successResponse(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id: workspaceId } = await params
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: workspaceId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      assignee_id: parsed.data.assigneeId ?? null,
    })
    .select('*, agents(id, name, role)')
    .single()

  if (error) return errorResponse(error.message, 500)

  return successResponse(data, 201)
}
