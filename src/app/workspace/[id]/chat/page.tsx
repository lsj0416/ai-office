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
          workspaceId,
          threadId,
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

        void fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            content: `사용자: ${trimmed}\n${selectedAgent.name}: ${fullContent}`,
            metadata: {
              type: 'conversation',
              agent_id: selectedAgent.id,
              thread_id: threadId,
            },
          }),
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
      <div className="workspace-subtle-panel flex h-full min-h-[420px] items-center justify-center text-sm text-[var(--workspace-muted)]">
        에이전트가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      <div className="workspace-subtle-panel px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="workspace-section-title">Direct Thread</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--workspace-text)]">
              팀 채팅
            </h1>
            <p className="mt-2 text-sm text-[var(--workspace-muted)]">
              역할별 에이전트와 바로 대화하고, 답변은 스레드에 이어서 쌓입니다.
            </p>
          </div>

          {selectedAgent && (
            <div className="workspace-stat-card min-w-[220px] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a97ac]">
                Active Agent
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--workspace-text)]">
                {selectedAgent.name}
              </p>
              <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                {selectedAgent.role} · {selectedAgent.model}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedAgent?.id === agent.id
                  ? 'border-[#c7d9ff] bg-[#2f63d9] text-white shadow-[0_12px_24px_rgba(47,99,217,0.18)]'
                  : 'border-[var(--workspace-line)] bg-white text-[var(--workspace-muted)] hover:border-[#bfd0ee] hover:bg-[#f8fbff] hover:text-[var(--workspace-text)]'
              }`}
            >
              {agent.name}
              <span
                className={`ml-1 text-xs ${
                  selectedAgent?.id === agent.id ? 'text-white/75' : 'text-[#8a97ac]'
                }`}
              >
                ({agent.role})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="workspace-subtle-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-[var(--workspace-line)] px-5 py-4">
          <p className="text-sm font-medium text-[var(--workspace-text)]">
            {selectedAgent?.persona || `${selectedAgent?.name ?? '에이전트'}와 대화를 시작하세요.`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="workspace-stat-card flex h-full min-h-[280px] items-center justify-center text-center text-[var(--workspace-muted)]">
              <div>
                <p className="text-sm font-medium text-[var(--workspace-text)]">
                  {selectedAgent?.name}에게 메시지를 보내보세요.
                </p>
                <p className="mt-2 text-sm">
                  업무 지시, 아이디어 검토, 카피 초안까지 바로 이어서 진행할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#e7efff] text-xs font-bold text-[#2f63d9]">
                    {selectedAgent?.name[0]}
                  </div>
                )}
                <div
                  className={`max-w-[82%] whitespace-pre-wrap rounded-[24px] px-5 py-3 text-sm leading-7 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#2f63d9] text-white shadow-[0_18px_36px_rgba(47,99,217,0.22)]'
                      : 'border border-[var(--workspace-line)] bg-white text-gray-800'
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

        <div className="border-t border-[var(--workspace-line)] bg-white/70 px-5 py-4">
          <div className="mx-auto flex max-w-3xl gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${selectedAgent?.name ?? '에이전트'}에게 메시지 보내기 (Shift+Enter: 줄바꿈)`}
              rows={1}
              disabled={isStreaming || !threadId}
              className="min-h-[56px] flex-1 resize-none rounded-[20px] border border-[var(--workspace-line)] bg-white px-4 py-3 text-sm focus:border-[#9db7f5] focus:outline-none focus:ring-4 focus:ring-[#e8f0ff] disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming || !threadId}
              className="rounded-[20px] bg-[#2f63d9] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(47,99,217,0.18)] hover:bg-[#2456c7] disabled:opacity-40"
            >
              {isStreaming ? '...' : '전송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
