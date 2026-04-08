import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/types/api'
import { rowToWorkspace } from '@/lib/ai/context'

const workspaceProductSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200),
  status: z.enum(['planning', 'development', 'launched', 'deprecated']),
})

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  vision: z.string().max(200).optional(),
  industry: z.string().max(100).nullable().optional(),
  targetCustomer: z.string().max(300).nullable().optional(),
  products: z.array(workspaceProductSchema).max(10).nullable().optional(),
  teamCulture: z.string().max(500).nullable().optional(),
  keyMetrics: z.string().max(300).nullable().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('인증이 필요합니다', 401)

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return errorResponse('워크스페이스를 찾을 수 없습니다', 404)

  return successResponse(rowToWorkspace(data))
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
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

  const parsed = updateWorkspaceSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const { name, vision, industry, targetCustomer, products, teamCulture, keyMetrics } = parsed.data

  const { data, error } = await supabase
    .from('workspaces')
    .update({
      ...(name !== undefined && { name }),
      ...(vision !== undefined && { vision }),
      ...(industry !== undefined && { industry }),
      ...(targetCustomer !== undefined && { target_customer: targetCustomer }),
      ...(products !== undefined && { products }),
      ...(teamCulture !== undefined && { team_culture: teamCulture }),
      ...(keyMetrics !== undefined && { key_metrics: keyMetrics }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return errorResponse('워크스페이스 업데이트 실패', 500)

  return successResponse(rowToWorkspace(data))
}
