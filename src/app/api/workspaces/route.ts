import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { z } from 'zod'

const createWorkspaceSchema = z.object({
  name: z.string().min(1, '워크스페이스 이름을 입력해주세요').max(50),
  vision: z.string().max(200).optional().default(''),
})

export async function GET(): Promise<Response> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return errorResponse(error.message, 500)

  return successResponse(data)
}

export async function POST(request: Request): Promise<Response> {
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

  const parsed = createWorkspaceSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ user_id: user.id, name: parsed.data.name, vision: parsed.data.vision })
    .select()
    .single()

  if (wsError) return errorResponse(wsError.message, 500)

  // 기본 에이전트 3명 자동 생성
  const defaultAgents = [
    {
      workspace_id: workspace.id,
      role: 'PM' as const,
      name: '기획자 준호',
      persona:
        '논리적이고 체계적인 프로젝트 매니저. 요구사항을 명확히 정의하고 실행 계획을 수립합니다.',
      model: 'gpt-4o' as const,
      order: 0,
    },
    {
      workspace_id: workspace.id,
      role: 'DEVELOPER' as const,
      name: '개발자 민준',
      persona:
        '실용적인 시니어 개발자. TypeScript와 Next.js를 주로 사용하며 명확한 코드를 작성합니다.',
      model: 'gpt-4o' as const,
      order: 1,
    },
    {
      workspace_id: workspace.id,
      role: 'MARKETER' as const,
      name: '마케터 지은',
      persona: '창의적인 마케터. 사용자 관점에서 설득력 있는 메시지를 만들어냅니다.',
      model: 'gpt-4o-mini' as const,
      order: 2,
    },
  ]

  const { error: agentError } = await supabase.from('agents').insert(defaultAgents)

  if (agentError) {
    await supabase.from('workspaces').delete().eq('id', workspace.id)
    return errorResponse(agentError.message, 500)
  }

  return successResponse(workspace, 201)
}
