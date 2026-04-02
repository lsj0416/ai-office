import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { z } from 'zod'

const getOrCreateThreadSchema = z.object({
  agentId: z.string().uuid(),
})

// 에이전트의 스레드를 가져오거나 없으면 생성
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = getOrCreateThreadSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const { agentId } = parsed.data

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id')
    .eq('id', agentId)
    .eq('workspace_id', workspaceId)
    .single()

  if (agentError || !agent) {
    return errorResponse('해당 워크스페이스의 에이전트를 찾을 수 없습니다', 404)
  }

  // 기존 스레드 조회 (에이전트당 하나)
  const { data: existing } = await supabase
    .from('threads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) return successResponse(existing)

  // 없으면 생성
  const { data: created, error } = await supabase
    .from('threads')
    .insert({ workspace_id: workspaceId, agent_id: agentId })
    .select()
    .single()

  if (error) return errorResponse(error.message, 500)

  return successResponse(created, 201)
}
