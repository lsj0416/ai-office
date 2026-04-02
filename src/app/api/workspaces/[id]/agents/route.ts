import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { z } from 'zod'

const createAgentSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(30),
  role: z.enum(['PM', 'DEVELOPER', 'MARKETER', 'DESIGNER', 'REVIEWER', 'CUSTOM']),
  persona: z.string().min(1, '페르소나를 입력해주세요').max(300),
  model: z.enum(['gpt-4o', 'gpt-4o-mini']),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('workspace_id', id)
    .order('order', { ascending: true })

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

  // 해당 워크스페이스가 이 유저 소유인지 확인
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

  const parsed = createAgentSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  // 현재 최대 order 값 조회
  const { data: last } = await supabase
    .from('agents')
    .select('order')
    .eq('workspace_id', workspaceId)
    .order('order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = last ? last.order + 1 : 0

  const { data, error } = await supabase
    .from('agents')
    .insert({
      workspace_id: workspaceId,
      name: parsed.data.name,
      role: parsed.data.role,
      persona: parsed.data.persona,
      model: parsed.data.model,
      order: nextOrder,
    })
    .select()
    .single()

  if (error) return errorResponse(error.message, 500)

  return successResponse(data, 201)
}
