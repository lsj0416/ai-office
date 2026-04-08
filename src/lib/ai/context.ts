import type { Workspace } from '@/types'

/**
 * workspace 정보를 에이전트 시스템 프롬프트에 주입할 텍스트로 변환
 * Agent API, Orchestrator 양쪽에서 호출됨
 */
export function buildCompanyContext(workspace: Workspace): string {
  const lines: string[] = ['[우리 회사 정보]']

  lines.push(`- 회사명: ${workspace.name}`)

  if (workspace.vision) {
    lines.push(`- 비전: ${workspace.vision}`)
  }

  if (workspace.industry) {
    lines.push(`- 업종: ${workspace.industry}`)
  }

  if (workspace.targetCustomer) {
    lines.push(`- 타깃 고객: ${workspace.targetCustomer}`)
  }

  if (workspace.products && workspace.products.length > 0) {
    lines.push('- 주요 제품/서비스:')
    for (const product of workspace.products) {
      const statusLabel: Record<string, string> = {
        planning: '기획 중',
        development: '개발 중',
        launched: '출시됨',
        deprecated: '종료됨',
      }
      const status = statusLabel[product.status] ?? product.status
      lines.push(`  · ${product.name} (${status}): ${product.description}`)
    }
  } else if (workspace.business && workspace.business.length > 0) {
    lines.push(`- 사업 영역: ${workspace.business.join(', ')}`)
  }

  if (workspace.teamCulture) {
    lines.push(`- 팀 문화: ${workspace.teamCulture}`)
  }

  if (workspace.keyMetrics) {
    lines.push(`- 핵심 지표: ${workspace.keyMetrics}`)
  }

  return lines.join('\n')
}

/**
 * Supabase Row 결과를 Workspace 타입으로 변환
 */
export function rowToWorkspace(row: {
  id: string
  user_id: string
  name: string
  vision: string
  business: string[]
  industry: string | null
  target_customer: string | null
  products: import('@/types').WorkspaceProduct[] | null
  team_culture: string | null
  key_metrics: string | null
  created_at: string
  updated_at: string
}): Workspace {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    vision: row.vision,
    business: row.business ?? [],
    industry: row.industry ?? undefined,
    targetCustomer: row.target_customer ?? undefined,
    products: row.products ?? undefined,
    teamCulture: row.team_culture ?? undefined,
    keyMetrics: row.key_metrics ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
