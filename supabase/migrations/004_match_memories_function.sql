-- ============================================================
-- 004_match_memories_function.sql
-- RAG 벡터 검색 RPC 함수
-- 사용법: supabase.rpc('match_memories', { query_embedding, match_workspace_id, match_count, match_threshold })
-- ============================================================

CREATE OR REPLACE FUNCTION match_memories(
  query_embedding    vector(1536),
  match_workspace_id uuid,
  match_count        int     DEFAULT 5,
  match_threshold    float   DEFAULT 0.7
)
RETURNS TABLE (
  id         uuid,
  content    text,
  metadata   jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.metadata,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memories m
  WHERE m.workspace_id = match_workspace_id
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
