-- ============================================================
-- 002_rls_policies.sql
-- RLS 활성화 + 워크스페이스 기반 격리 정책
-- ============================================================

-- ============================================================
-- workspaces: 소유자(user_id)만 접근
-- ============================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_select_own ON workspaces
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY workspace_insert_own ON workspaces
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY workspace_update_own ON workspaces
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY workspace_delete_own ON workspaces
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- agents: workspace 소유자만 접근
-- ============================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_own ON agents
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY agents_insert_own ON agents
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY agents_update_own ON agents
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY agents_delete_own ON agents
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- ============================================================
-- threads: workspace 소유자만 접근
-- ============================================================
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY threads_select_own ON threads
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY threads_insert_own ON threads
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY threads_update_own ON threads
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY threads_delete_own ON threads
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- ============================================================
-- messages: thread → workspace → user 2단 서브쿼리
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_own ON messages
  FOR SELECT USING (
    thread_id IN (
      SELECT id FROM threads WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY messages_insert_own ON messages
  FOR INSERT WITH CHECK (
    thread_id IN (
      SELECT id FROM threads WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY messages_update_own ON messages
  FOR UPDATE USING (
    thread_id IN (
      SELECT id FROM threads WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY messages_delete_own ON messages
  FOR DELETE USING (
    thread_id IN (
      SELECT id FROM threads WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- tasks: workspace 소유자만 접근
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select_own ON tasks
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY tasks_insert_own ON tasks
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY tasks_update_own ON tasks
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY tasks_delete_own ON tasks
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- ============================================================
-- memories: workspace 소유자만 접근
-- ============================================================
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY memories_select_own ON memories
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY memories_insert_own ON memories
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY memories_update_own ON memories
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY memories_delete_own ON memories
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
