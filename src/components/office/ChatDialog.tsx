'use client'

import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/types'
import type { OfficeAgentViewModel } from '@/types/office'

interface ChatDialogProps {
  agent: OfficeAgentViewModel | null
  workspaceId: string
  isMobile: boolean
  onClose: () => void
}

const TONE_STYLES: Record<OfficeAgentViewModel['badgeTone'], string> = {
  emerald: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  sky: 'border-sky-400/40 bg-sky-400/15 text-sky-100',
  amber: 'border-amber-400/40 bg-amber-400/15 text-amber-100',
  rose: 'border-rose-400/40 bg-rose-400/15 text-rose-100',
  violet: 'border-violet-400/40 bg-violet-400/15 text-violet-100',
  stone: 'border-white/15 bg-white/5 text-slate-100',
}

export default function ChatDialog({ agent, workspaceId, isMobile, onClose }: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!agent) {
      setMessages([])
      setThreadId(null)
      setInput('')
      setIsReady(false)
      return
    }

    let cancelled = false
    setMessages([])
    setThreadId(null)
    setInput('')
    setIsReady(false)

    fetch(`/api/workspaces/${workspaceId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agent.id }),
    })
      .then((response) => response.json())
      .then((json) => {
        if (cancelled || !json.data) return null
        const tid: string = json.data.id
        setThreadId(tid)
        return fetch(`/api/threads/${tid}/messages`).then((response) => response.json())
      })
      .then((json) => {
        if (cancelled) return
        if (json?.data) setMessages(json.data)
        setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) setIsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [agent, workspaceId])

  useEffect(() => {
    if (!agent) return

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [agent, onClose])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!agent || !threadId) return

    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setInput('')
    setIsStreaming(true)

    const savedRes = await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: trimmed }),
    }).then((response) => response.json())

    const userMsg: Message = savedRes.data ?? {
      id: crypto.randomUUID(),
      threadId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        threadId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      },
    ])

    let fullContent = ''

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          agentName: agent.name,
          persona: agent.persona,
          role: agent.role,
          model: agent.model,
          messages: nextMessages.map((message) => ({
            role: message.role as 'user' | 'assistant',
            content: message.content,
          })),
        }),
      })

      if (!response.ok || !response.body) throw new Error('stream failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: message.content + chunk } : message
          )
        )
      }

      if (fullContent) {
        await fetch(`/api/threads/${threadId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: fullContent }),
        })
      }
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: '응답 중 오류가 발생했습니다.' }
            : message
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  if (!agent) {
    if (isMobile) return null
    return (
      <aside
        data-testid="office-chat-sidebar"
        className="workspace-panel flex h-full min-h-[820px] flex-col items-center justify-center px-6 py-10 text-center"
      >
        <h2 className="text-xl font-semibold text-[var(--workspace-text)]">대화할 에이전트를 선택하세요</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--workspace-muted)]">
          가까이 다가가서 <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">E</kbd>를
          누르거나, 오피스 안의 캐릭터를 클릭하면 우측 패널에서 바로 대화를 이어갈 수 있습니다.
        </p>
      </aside>
    )
  }

  const shell = (
    <div
      data-testid={isMobile ? 'office-chat-sheet' : 'office-chat-sidebar'}
      className={`workspace-panel flex flex-col overflow-hidden ${
        isMobile ? 'max-h-[78vh] rounded-[28px]' : 'h-full min-h-[820px]'
      }`}
    >
      <div className="border-b border-[var(--workspace-line)] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[var(--workspace-text)]">{agent.name}</h2>
            <p className="mt-1 text-sm text-[var(--workspace-muted)]">
              {agent.role} · {agent.statusLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="workspace-button rounded-xl px-3 py-2 text-xs"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs ${TONE_STYLES[agent.badgeTone]}`}>
            {agent.statusLabel}
          </span>
          <span className="rounded-full border border-[var(--workspace-line)] bg-white px-3 py-1 text-xs text-[var(--workspace-muted)]">
            모델 {agent.model}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {!isReady && (
          <div className="flex h-full items-center justify-center text-sm text-[var(--workspace-muted)]">
            채널을 여는 중...
          </div>
        )}

        {isReady && messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--workspace-line)] bg-[var(--workspace-bg)] px-4 py-6 text-sm text-[var(--workspace-muted)]">
            {agent.name}에게 현재 작업 상태를 묻거나, 맡기고 싶은 일을 바로 이야기해보세요.
          </div>
        )}

        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-[rgba(120,165,255,0.16)] text-white'
                    : 'border border-[var(--workspace-line)] bg-white text-[var(--workspace-text)]'
                }`}
              >
                {message.content}
                {message.role === 'assistant' && message.content === '' && (
                  <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-[var(--workspace-muted)]" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-[var(--workspace-line)] px-4 py-4 sm:px-5">
        <div className="mb-3 text-xs text-[var(--workspace-muted)]">Enter로 전송, Esc로 닫기</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${agent.name}에게 맡길 일을 입력하세요`}
            disabled={!isReady || isStreaming || !threadId}
            autoFocus
            className="min-w-0 flex-1 rounded-2xl border border-[var(--workspace-line)] bg-white px-4 py-3 text-sm text-[var(--workspace-text)] outline-none transition placeholder:text-[var(--workspace-muted)] focus:border-[var(--workspace-accent-strong)] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isStreaming || !threadId}
            className="workspace-button rounded-2xl px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isStreaming ? '전송 중' : '전송'}
          </button>
        </div>
      </div>
    </div>
  )

  if (!isMobile) return shell

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/45 px-3 pb-3 pt-12 md:hidden">
      <button type="button" aria-label="채팅 닫기" className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl">{shell}</div>
    </div>
  )
}
