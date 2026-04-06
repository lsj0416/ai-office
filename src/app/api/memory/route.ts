import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { saveMemory, searchMemories } from '@/lib/ai/rag'
import { successResponse, errorResponse } from '@/types/api'

const searchSchema = z.object({
  workspaceId: z.string().uuid(),
  query: z.string().min(1).max(500),
  count: z.coerce.number().int().min(1).max(20).optional().default(5),
})

const saveSchema = z.object({
  workspaceId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  metadata: z
    .object({
      type: z.enum(['conversation', 'document', 'meeting_note', 'weekly_summary']).optional(),
      agent_id: z.string().optional(),
      thread_id: z.string().optional(),
      source: z.string().optional(),
    })
    .optional()
    .default({}),
})

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// GET /api/memory?workspaceId=...&query=...&count=5
export async function GET(request: Request): Promise<Response> {
  const user = await getAuthUser()
  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { searchParams } = new URL(request.url)
  const parsed = searchSchema.safeParse({
    workspaceId: searchParams.get('workspaceId'),
    query: searchParams.get('query'),
    count: searchParams.get('count'),
  })

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse('OpenAI API Key가 설정되지 않았습니다', 500)
  }

  try {
    const memories = await searchMemories(
      parsed.data.workspaceId,
      parsed.data.query,
      parsed.data.count
    )
    return successResponse({ memories })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '메모리 검색 중 오류가 발생했습니다'
    return errorResponse(message, 500)
  }
}

// POST /api/memory
export async function POST(request: Request): Promise<Response> {
  const user = await getAuthUser()
  if (!user) return errorResponse('인증이 필요합니다', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = saveSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse('OpenAI API Key가 설정되지 않았습니다', 500)
  }

  // 워크스페이스 소유 확인
  const supabase = await createClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', parsed.data.workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!workspace) {
    return errorResponse('워크스페이스에 접근 권한이 없습니다', 403)
  }

  try {
    await saveMemory(parsed.data.workspaceId, parsed.data.content, parsed.data.metadata)
    return successResponse({ message: '메모리가 저장되었습니다' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '메모리 저장 중 오류가 발생했습니다'
    return errorResponse(message, 500)
  }
}
