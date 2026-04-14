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

const createAgentSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(30),
  role: z.enum([
    'PM',
    'BACKEND',
    'FRONTEND',
    'DEVOPS',
    'AI_DATA',
    'SECURITY',
    'MARKETER',
    'DESIGNER',
    'REVIEWER',
    'LEGAL',
    'CUSTOM',
    'DEVELOPER',
  ]),
  model: z.enum(['gpt-4o', 'gpt-4o-mini']),
  personaDetail: personaDetailSchema,
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

  const { data: last } = await supabase
    .from('agents')
    .select('order')
    .eq('workspace_id', workspaceId)
    .order('order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = last ? last.order + 1 : 0
  const persona = buildPersonaSummary(parsed.data.name, parsed.data.personaDetail)

  const { data, error } = await supabase
    .from('agents')
    .insert({
      workspace_id: workspaceId,
      name: parsed.data.name,
      role: parsed.data.role,
      model: parsed.data.model,
      persona,
      persona_detail: parsed.data.personaDetail,
      order: nextOrder,
    })
    .select()
    .single()

  if (error) return errorResponse(error.message, 500)

  return successResponse(data, 201)
}
