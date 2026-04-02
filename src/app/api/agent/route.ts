import { successResponse, errorResponse } from '@/types/api'

// TODO: Phase 1 - 에이전트 실행 API 구현
export async function GET() {
  return successResponse({ message: 'Agent API ready' })
}

export async function POST() {
  try {
    // TODO: 에이전트 실행 로직
    return successResponse({ message: 'Agent API ready' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return errorResponse(message, 500)
  }
}
