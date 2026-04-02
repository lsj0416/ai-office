import { successResponse, errorResponse } from '@/types/api'

// TODO: Phase 3 - RAG 메모리 저장/검색 API 구현
export async function GET() {
  return successResponse({ message: 'Memory API ready' })
}

export async function POST() {
  try {
    // TODO: 메모리 저장 로직
    return successResponse({ message: 'Memory API ready' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return errorResponse(message, 500)
  }
}
