'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Agent } from '@/types'

interface VoiceMeetingPanelProps {
  workspaceId: string
}

type PanelStatus = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'error'

export default function VoiceMeetingPanel({ workspaceId }: VoiceMeetingPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [status, setStatus] = useState<PanelStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [ttsEnabled, setTtsEnabled] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 에이전트 목록 불러오기
  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/agents`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          const list = json.data as Agent[]
          setAgents(list)
          if (list.length > 0 && list[0]) {
            setSelectedAgentId(list[0].id)
          }
        }
      })
      .catch(() => {
        // 에이전트 로드 실패는 무시
      })
  }, [workspaceId])

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null

  // TTS 처리
  const handleTts = useCallback(async (text: string) => {
    setStatus('speaking')

    try {
      const res = await fetch('/api/meeting/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        // TTS 실패해도 idle로 복귀 (치명적이지 않음)
        setStatus('idle')
        return
      }

      const audioBuffer = await res.arrayBuffer()
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        setStatus('idle')
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        setStatus('idle')
      }

      await audio.play()
    } catch {
      setStatus('idle')
    }
  }, [])

  // 에이전트 쿼리 (스트리밍)
  const handleAgentQuery = useCallback(
    async (text: string) => {
      if (!selectedAgent) {
        setErrorMsg('에이전트를 선택해주세요.')
        setStatus('error')
        return
      }

      setStatus('thinking')
      setResponse('')

      let fullContent = ''

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgent.id,
            agentName: selectedAgent.name,
            persona: selectedAgent.persona,
            role: selectedAgent.role,
            model: selectedAgent.model,
            messages: [{ role: 'user', content: text }],
            workspaceId,
          }),
        })

        if (!res.ok || !res.body) throw new Error('에이전트 응답 실패')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          setResponse((prev) => prev + chunk)
        }

        // RAG 메모리 자동 저장 (fire-and-forget)
        void fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            content: `사용자: ${text}\n${selectedAgent.name}: ${fullContent}`,
            metadata: {
              type: 'meeting_note',
              agent_id: selectedAgent.id,
              source: 'voice_meeting',
            },
          }),
        })

        if (ttsEnabled && fullContent) {
          await handleTts(fullContent)
        } else {
          setStatus('idle')
        }
      } catch {
        setErrorMsg('에이전트 응답 중 오류가 발생했습니다.')
        setStatus('error')
      }
    },
    [handleTts, selectedAgent, workspaceId, ttsEnabled]
  )

  // STT 처리
  const handleStt = useCallback(async () => {
    setStatus('transcribing')

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    try {
      const res = await fetch('/api/meeting', { method: 'POST', body: formData })
      const json = (await res.json()) as { data?: { text: string }; error?: string }

      if (!res.ok || !json.data?.text) {
        setErrorMsg(json.error ?? 'STT 처리에 실패했습니다.')
        setStatus('error')
        return
      }

      const text = json.data.text.trim()
      setTranscript(text)
      await handleAgentQuery(text)
    } catch {
      setErrorMsg('STT 요청 중 오류가 발생했습니다.')
      setStatus('error')
    }
  }, [handleAgentQuery])

  // 녹음 시작
  const startRecording = useCallback(async () => {
    setErrorMsg('')
    setTranscript('')
    setResponse('')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMsg('마이크 접근 권한이 필요합니다.')
      setStatus('error')
      return
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunksRef.current = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      void handleStt()
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setStatus('recording')
  }, [handleStt])

  // 녹음 중지
  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  // 음성 중지
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setStatus('idle')
  }, [])

  const isRecording = status === 'recording'
  const isBusy = status === 'transcribing' || status === 'thinking' || status === 'speaking'

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 헤더 */}
      <div className="workspace-panel px-5 py-4">
        <h1 className="text-lg font-semibold text-[var(--workspace-text)]">음성 회의</h1>
        <p className="mt-1 text-sm text-[var(--workspace-muted)]">
          마이크로 말하면 에이전트가 실시간으로 응답합니다
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        {/* 왼쪽: 컨트롤 */}
        <div className="workspace-panel flex w-full flex-col gap-5 px-5 py-5 lg:w-72 lg:shrink-0">
          {/* 에이전트 선택 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--workspace-muted)]">
              대화 상대 에이전트
            </label>
            {agents.length === 0 ? (
              <p className="text-sm text-[var(--workspace-muted)]">에이전트가 없습니다</p>
            ) : (
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                disabled={isBusy || isRecording}
                className="w-full rounded-xl border border-[var(--workspace-line)] bg-white px-3 py-2 text-sm text-[var(--workspace-text)] outline-none focus:border-[var(--workspace-accent-strong)] disabled:opacity-60"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* TTS 토글 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--workspace-text)]">음성 응답 (TTS)</span>
            <button
              type="button"
              onClick={() => setTtsEnabled((prev) => !prev)}
              disabled={isBusy}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                ttsEnabled ? 'bg-[var(--workspace-accent-strong)]' : 'bg-[var(--workspace-line)]'
              } disabled:opacity-60`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  ttsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 마이크 버튼 */}
          <div className="flex flex-col items-center gap-3 pt-2">
            {!isRecording && !isBusy && (
              <button
                type="button"
                onClick={() => void startRecording()}
                disabled={!selectedAgentId || agents.length === 0}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--workspace-accent-strong)] text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="녹음 시작"
              >
                <MicIcon />
              </button>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:opacity-90"
                aria-label="녹음 중지"
              >
                <StopIcon />
              </button>
            )}

            {isBusy && status !== 'speaking' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--workspace-line)] bg-white">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--workspace-accent-strong)] border-t-transparent" />
              </div>
            )}

            {status === 'speaking' && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition hover:opacity-90"
                aria-label="재생 중지"
              >
                <SpeakerIcon />
              </button>
            )}

            <p className="text-sm text-[var(--workspace-muted)]">{STATUS_LABELS[status]}</p>
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMsg}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('')
                  setStatus('idle')
                }}
                className="ml-2 underline"
              >
                닫기
              </button>
            </div>
          )}
        </div>

        {/* 오른쪽: 대화 내용 */}
        <div className="workspace-panel flex min-h-[300px] flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          {!transcript && !response && (
            <div className="flex h-full items-center justify-center text-sm text-[var(--workspace-muted)]">
              마이크 버튼을 눌러 대화를 시작하세요
            </div>
          )}

          {transcript && (
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--workspace-muted)]">내 말</p>
              <div className="rounded-2xl bg-[rgba(120,165,255,0.16)] px-4 py-3 text-sm leading-6 text-white">
                {transcript}
              </div>
            </div>
          )}

          {response && (
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--workspace-muted)]">
                {selectedAgent?.name ?? '에이전트'} 응답
              </p>
              <div className="rounded-2xl border border-[var(--workspace-line)] bg-white px-4 py-3 text-sm leading-6 text-[var(--workspace-text)]">
                {response}
                {status === 'thinking' && (
                  <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-[var(--workspace-muted)]" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<PanelStatus, string> = {
  idle: '마이크를 눌러 시작',
  recording: '녹음 중… 누르면 중지',
  transcribing: '음성 인식 중…',
  thinking: '에이전트 응답 중…',
  speaking: '재생 중… 누르면 중지',
  error: '오류 발생',
}

function MicIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}
