import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { errorResponse, successResponse } from '@/types/api'

// POST /api/meeting/stt — 음성 → 텍스트 (Whisper)
// multipart/form-data: { audio: File }
export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return errorResponse('인증이 필요합니다', 401)

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse('OpenAI API Key가 설정되지 않았습니다', 500)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const audio = formData.get('audio')
  if (!audio || !(audio instanceof File)) {
    return errorResponse('audio 파일이 필요합니다', 400)
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const transcription = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file: audio,
      language: 'ko',
    })

    return successResponse({ text: transcription.text })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'STT 처리 중 오류가 발생했습니다'
    return errorResponse(message, 500)
  }
}

// GET /api/meeting — API 상태 확인
export async function GET(): Promise<Response> {
  return successResponse({
    stt: 'Whisper (whisper-1)',
    tts: process.env.ELEVENLABS_API_KEY ? 'ElevenLabs' : '미설정',
  })
}
