import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { MemoryMetadata } from '@/types/database'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536
const CHAT_RAG_CANDIDATE_COUNT = 10
const CHAT_RAG_MAX_ITEMS = 6
const CHAT_RAG_MAX_CHARS = 1800

type RetrievedMemory = {
  id: string
  content: string
  metadata: MemoryMetadata
  similarity: number
}

export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다')
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  })
  const embedding = response.data[0]?.embedding
  if (!embedding) throw new Error('임베딩 생성 실패')
  return embedding
}

export async function saveMemory(
  workspaceId: string,
  content: string,
  metadata: MemoryMetadata = {}
): Promise<void> {
  const embedding = await embedText(content)
  const supabase = await createClient()

  const { error } = await supabase.from('memories').insert({
    workspace_id: workspaceId,
    content,
    embedding,
    metadata,
  })

  if (error) {
    throw new Error(`메모리 저장 실패: ${error.message}`)
  }
}

export async function searchMemories(
  workspaceId: string,
  query: string,
  matchCount = 5,
  matchThreshold = 0.7
): Promise<RetrievedMemory[]> {
  const embedding = await embedText(query)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: embedding,
    match_workspace_id: workspaceId,
    match_count: matchCount,
    match_threshold: matchThreshold,
  })

  if (error) return []
  return (data ?? []) as RetrievedMemory[]
}

// 쿼리에 맞는 관련 히스토리를 컨텍스트 문자열로 반환
export async function buildRagContext(workspaceId: string, query: string): Promise<string> {
  const memories = await searchMemories(workspaceId, query)
  if (memories.length === 0) return ''

  const contextLines = memories.map((m) => `- ${m.content}`).join('\n')
  return `[관련 대화 히스토리]\n${contextLines}`
}

function normalizeMemoryType(type: MemoryMetadata['type']): string {
  switch (type) {
    case 'weekly_summary':
      return '주간 요약'
    case 'meeting_note':
      return '회의 메모'
    case 'document':
      return '문서'
    case 'conversation':
    default:
      return '대화 기억'
  }
}

function compactText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function buildChatSearchQuery(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  const recentMessages = messages.slice(-4)
  const latestUserMessage =
    [...messages].reverse().find((message) => message.role === 'user')?.content ?? ''

  const transcript = recentMessages
    .map((message) => `${message.role === 'user' ? '사용자' : '에이전트'}: ${compactText(message.content)}`)
    .join('\n')

  return latestUserMessage ? `${latestUserMessage}\n\n${transcript}` : transcript
}

function scoreChatMemory(
  memory: RetrievedMemory,
  {
    agentId,
    threadId,
  }: {
    agentId?: string
    threadId?: string
  }
): number {
  let score = memory.similarity * 100

  if (memory.metadata.agent_id && memory.metadata.agent_id === agentId) score += 18
  if (memory.metadata.thread_id && memory.metadata.thread_id === threadId) score += 24

  switch (memory.metadata.type) {
    case 'weekly_summary':
      score += 10
      break
    case 'meeting_note':
      score += 6
      break
    case 'document':
      score += 4
      break
    case 'conversation':
    default:
      score += 8
      break
  }

  return score
}

function formatChatMemories(memories: RetrievedMemory[]): string {
  const lines: string[] = []
  let usedChars = 0

  for (const memory of memories) {
    const label = normalizeMemoryType(memory.metadata.type)
    const sourceParts = [label]
    if (memory.metadata.agent_id) sourceParts.push(`agent:${memory.metadata.agent_id}`)
    if (memory.metadata.thread_id) sourceParts.push(`thread:${memory.metadata.thread_id}`)
    if (memory.metadata.source) sourceParts.push(String(memory.metadata.source))

    const entry = `- [${sourceParts.join(' / ')}] ${compactText(memory.content)}`

    if (usedChars + entry.length > CHAT_RAG_MAX_CHARS) break

    lines.push(entry)
    usedChars += entry.length
  }

  if (lines.length === 0) return ''

  return [
    '[기억된 관련 맥락]',
    ...lines,
    '',
    '[기억 사용 원칙]',
    '- 아래 기억은 현재 1:1 대화와 관련 있는 과거 기록이다.',
    '- 현재 대화와 충돌하면 현재 대화를 우선한다.',
    '- 기억을 활용해 맥락을 이어가되, 사실이 불확실하면 단정하지 않는다.',
  ].join('\n')
}

export async function buildChatRagContext(
  workspaceId: string,
  {
    messages,
    agentId,
    threadId,
  }: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    agentId?: string
    threadId?: string
  }
): Promise<string> {
  const query = buildChatSearchQuery(messages)
  if (!query) return ''

  const candidates = await searchMemories(
    workspaceId,
    query,
    CHAT_RAG_CANDIDATE_COUNT,
    0.55
  )

  if (candidates.length === 0) return ''

  const deduped = new Map<string, RetrievedMemory>()
  for (const candidate of candidates) {
    const key = compactText(candidate.content)
    if (!key || deduped.has(key)) continue
    deduped.set(key, candidate)
  }

  const ranked = Array.from(deduped.values())
    .sort(
      (left, right) =>
        scoreChatMemory(right, { agentId, threadId }) -
        scoreChatMemory(left, { agentId, threadId })
    )
    .slice(0, CHAT_RAG_MAX_ITEMS)

  return formatChatMemories(ranked)
}
