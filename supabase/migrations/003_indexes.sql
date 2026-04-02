-- ============================================================
-- 003_indexes.sql
-- FK 기반 조회 최적화 인덱스
-- (pgvector ivfflat 인덱스는 memories 1000행 초과 시 별도 마이그레이션으로 추가)
-- ============================================================

-- workspaces: RLS 서브쿼리 + 내 워크스페이스 목록
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);

-- agents: 워크스페이스별 에이전트 목록
CREATE INDEX idx_agents_workspace_id ON agents(workspace_id);

-- threads: 워크스페이스별 / 에이전트별 스레드 조회
CREATE INDEX idx_threads_workspace_id ON threads(workspace_id);
CREATE INDEX idx_threads_agent_id ON threads(agent_id);

-- messages: 스레드별 메시지 조회 (가장 빈번한 쿼리) + 시간순 페이징
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_thread_id_created_at ON messages(thread_id, created_at);

-- tasks: 워크스페이스별 + 담당 에이전트별 태스크 조회
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- memories: RLS 서브쿼리 최적화
CREATE INDEX idx_memories_workspace_id ON memories(workspace_id);
