import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { z } from 'zod'
import type { PersonaDetail } from '@/types'

const personaDetailSchema = z.object({
  gender: z.enum(['male', 'female', 'unspecified']),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead']),
  background: z.enum(['startup', 'enterprise', 'freelance', 'consulting']),
  tone: z.enum(['formal', 'casual', 'direct', 'gentle']),
  decisionStyle: z.enum(['quick', 'careful', 'data-driven', 'intuitive']),
  feedbackStyle: z.enum(['direct', 'socratic', 'encouraging']),
  expertise: z.string().max(100).default(''),
  strengths: z.string().max(100).default(''),
  notes: z.string().max(100).default(''),
})

const updateAgentSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  role: z
    .enum([
      'PM',
      'BACKEND',
      'FRONTEND',
      'DEVOPS',
      'AI_DATA',
      'MARKETER',
      'DESIGNER',
      'REVIEWER',
      'LEGAL',
      'CUSTOM',
      'DEVELOPER',
    ])
    .optional(),
  model: z.enum(['gpt-4o', 'gpt-4o-mini']).optional(),
  personaDetail: personaDetailSchema.optional(),
})

function buildPersonaSummary(name: string, detail: PersonaDetail): string {
  const expMap = { junior: '주니어', mid: '미드레벨', senior: '시니어', lead: '리드' }
  const bgMap = {
    startup: '스타트업',
    enterprise: '대기업',
    freelance: '프리랜서',
    consulting: '컨설팅',
  }
  const toneMap = { formal: '격식체', casual: '편한 말투', direct: '직설적', gentle: '부드러운' }

  const parts = [
    `${expMap[detail.experienceLevel]} ${bgMap[detail.background]} 출신`,
    `${toneMap[detail.tone]} 말투`,
  ]
  if (detail.expertise) parts.push(`전문: ${detail.expertise}`)
  if (detail.strengths) parts.push(`강점: ${detail.strengths}`)
  if (detail.notes) parts.push(detail.notes)

  return `${name} — ${parts.join(', ')}`
}

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

  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name
  if (parsed.data.role !== undefined) updatePayload.role = parsed.data.role
  if (parsed.data.model !== undefined) updatePayload.model = parsed.data.model

  if (parsed.data.personaDetail !== undefined) {
    updatePayload.persona_detail = parsed.data.personaDetail
    const name = parsed.data.name ?? (await fetchAgentName(supabase, agentId))
    updatePayload.persona = buildPersonaSummary(name, parsed.data.personaDetail)
  }

  const { data, error } = await supabase
    .from('agents')
    .update(updatePayload)
    .eq('id', agentId)
    .select()
    .single()

  if (error) return errorResponse(error.message, 500)

  return successResponse(data)
}

async function fetchAgentName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agentId: string
): Promise<string> {
  const { data } = await supabase.from('agents').select('name').eq('id', agentId).single()
  return data?.name ?? ''
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
