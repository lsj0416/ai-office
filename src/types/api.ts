import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status })
}

export function errorResponse(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status })
}
