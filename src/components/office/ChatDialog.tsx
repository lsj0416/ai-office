'use client'

import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/types'
import type { NearbyAgent } from '@/types/office'

interface ChatDialogProps {
  nearbyAgent: NearbyAgent
  workspaceId: string
  onClose: () => void
}

export default function ChatDialog({ nearbyAgent, workspaceId, onClose }: ChatDialogProps) {
  const { agent } = nearbyAgent

  const [messages, setMessages] = useState<Message[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 스레드 초기화
  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agent.id }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) return
        const tid: string = json.data.id
        setThreadId(tid)
        return fetch(`/api/threads/${tid}/messages`).then((r) => r.json())
      })
      .then((json) => {
        if (json?.data) setMessages(json.data)
        setIsReady(true)
      })
      .catch(() => setIsReady(true))
  }, [agent.id, workspaceId])

  // ESC 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || !threadId) return

    setInput('')
    setIsStreaming(true)

    const savedRes = await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: trimmed }),
    }).then((r) => r.json())

    const userMsg: Message = savedRes.data ?? {
      id: crypto.randomUUID(),
      threadId: threadId!,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, threadId: threadId!, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ])

    let fullContent = ''

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          agentName: agent.name,
          persona: agent.persona,
          role: agent.role,
          model: agent.model,
          messages: nextMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        }),
      })

      if (!res.ok || !res.body) throw new Error('응답 실패')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
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
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: '응답 중 오류가 발생했습니다.' } : m,
        ),
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gray-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: agentColor(agent.role) }}
            >
              {agent.role[0]}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{agent.name}</p>
              <p className="text-xs text-gray-400">{agent.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            닫기 (ESC)
          </button>
        </div>

        {/* 메시지 목록 */}
        <div className="h-64 overflow-y-auto px-4 py-3 space-y-2">
          {!isReady && (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              불러오는 중...
            </div>
          )}
          {isReady && messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              {agent.name}에게 말을 걸어보세요.
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
                {msg.role === 'assistant' && msg.content === '' && (
                  <span className="inline-block h-3 w-0.5 animate-pulse bg-gray-400" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 입력 */}
        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${agent.name}에게...`}
            disabled={!isReady || isStreaming || !threadId}
            autoFocus
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming || !threadId}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {isStreaming ? '...' : '전송'}
          </button>
        </div>
      </div>
    </div>
  )
}

function agentColor(role: string): string {
  const map: Record<string, string> = {
    PM: '#4a90d9',
    DEVELOPER: '#7ed321',
    MARKETER: '#e040fb',
    DESIGNER: '#ff6090',
    REVIEWER: '#ff9800',
    CUSTOM: '#9b9b9b',
  }
  return map[role] ?? '#9b9b9b'
}
