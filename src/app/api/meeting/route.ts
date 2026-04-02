import { successResponse, errorResponse } from '@/types/api'

// TODO: Phase 3 - 음성 회의 처리 API 구현
export async function GET() {
  return successResponse({ message: 'Meeting API ready' })
}

export async function POST() {
  try {
    // TODO: 회의 처리 로직
    return successResponse({ message: 'Meeting API ready' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return errorResponse(message, 500)
  }
}
