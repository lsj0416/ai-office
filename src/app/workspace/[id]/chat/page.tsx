'use client'

import { useEffect, useRef, useState } from 'react'
import { type AgentRole, type AIModel, type Message } from '@/types'

interface AgentRow {
  id: string
  name: string
  role: AgentRole
  model: AIModel
  persona: string
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const workspaceId = params.id

  const [agents, setAgents] = useState<AgentRow[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 에이전트 목록 로드
  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/agents`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setAgents(json.data)
          setSelectedAgent(json.data[0])
        }
      })
      .finally(() => setIsLoading(false))
  }, [workspaceId])

  // 에이전트 선택 시 스레드 + 메시지 로드
  useEffect(() => {
    if (!selectedAgent) return

    setMessages([])
    setThreadId(null)

    fetch(`/api/workspaces/${workspaceId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: selectedAgent.id }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) return
        const tid = json.data.id
        setThreadId(tid)

        return fetch(`/api/threads/${tid}/messages`).then((r) => r.json())
      })
      .then((json) => {
        if (json?.data) setMessages(json.data)
      })
  }, [selectedAgent, workspaceId])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || !selectedAgent || !threadId) return

    setInput('')
    setIsStreaming(true)

    // 유저 메시지 DB 저장
    const savedUserMsg = await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: trimmed }),
    }).then((r) => r.json())

    const userMessage: Message = savedUserMsg.data ?? {
      id: crypto.randomUUID(),
      threadId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMessage]
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
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          persona: selectedAgent.persona,
          role: selectedAgent.role,
          model: selectedAgent.model,
          messages: nextMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: '알 수 없는 오류' }))
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `오류: ${err.error ?? '응답 실패'}` } : m
          )
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
        )
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }

      // 어시스턴트 메시지 DB 저장
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
          m.id === assistantId ? { ...m, content: '네트워크 오류가 발생했습니다.' } : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">불러오는 중...</div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        에이전트가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* 에이전트 선택 */}
      <div className="flex gap-2 border-b border-gray-200 bg-white px-4 py-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedAgent?.id === agent.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {agent.name}
            <span className="ml-1 text-xs opacity-70">({agent.role})</span>
          </button>
        ))}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>{selectedAgent?.name}에게 메시지를 보내보세요.</p>
          </div>
        )}
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {selectedAgent?.name[0]}
                </div>
              )}
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-100'
                }`}
              >
                {msg.content}
                {msg.role === 'assistant' && msg.content === '' && (
                  <span className="inline-block h-4 w-1 animate-pulse bg-gray-400" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력창 */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${selectedAgent?.name ?? '에이전트'}에게 메시지 보내기 (Shift+Enter: 줄바꿈)`}
            rows={1}
            disabled={isStreaming || !threadId}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:opacity-50"
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
