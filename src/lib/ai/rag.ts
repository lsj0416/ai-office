import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { MemoryMetadata } from '@/types/database'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

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
): Promise<Array<{ id: string; content: string; metadata: MemoryMetadata; similarity: number }>> {
  const embedding = await embedText(query)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: embedding,
    match_workspace_id: workspaceId,
    match_count: matchCount,
    match_threshold: matchThreshold,
  })

  if (error) return []
  return (data ?? []) as Array<{
    id: string
    content: string
    metadata: MemoryMetadata
    similarity: number
  }>
}

// 쿼리에 맞는 관련 히스토리를 컨텍스트 문자열로 반환
export async function buildRagContext(workspaceId: string, query: string): Promise<string> {
  const memories = await searchMemories(workspaceId, query)
  if (memories.length === 0) return ''

  const contextLines = memories.map((m) => `- ${m.content}`).join('\n')
  return `[관련 대화 히스토리]\n${contextLines}`
}
