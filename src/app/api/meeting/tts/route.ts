import { createClient } from '@/lib/supabase/server'
import { errorResponse } from '@/types/api'
import { z } from 'zod'

export const maxDuration = 60

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'
// 기본 음성 ID (Rachel)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

const requestSchema = z.object({
  text: z.string().min(1).max(2000),
  voiceId: z.string().optional(),
})

// POST /api/meeting/tts — 텍스트 → 음성 (ElevenLabs)
export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return errorResponse('인증이 필요합니다', 401)

  if (!process.env.ELEVENLABS_API_KEY) {
    return errorResponse('ElevenLabs API Key가 설정되지 않았습니다', 500)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('요청 본문이 올바르지 않습니다', 400)
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다', 400)
  }

  const voiceId = parsed.data.voiceId ?? DEFAULT_VOICE_ID

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return errorResponse(`ElevenLabs 오류: ${errorText}`, response.status)
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'TTS 처리 중 오류가 발생했습니다'
    return errorResponse(message, 500)
  }
}
