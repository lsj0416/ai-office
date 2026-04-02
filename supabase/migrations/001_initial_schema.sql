-- ============================================================
-- 001_initial_schema.sql
-- pgvector 확장 + 핵심 6개 테이블 + updated_at 트리거
-- ============================================================

-- pgvector 확장 활성화 (RAG 임베딩 저장용)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- workspaces: 회사 단위 (최상위 테넌트)
-- ============================================================
CREATE TABLE workspaces (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  vision     text        NOT NULL DEFAULT '',
  business   text[]      NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- agents: AI 직원 (역할별 페르소나)
-- ============================================================
CREATE TABLE agents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role         text        NOT NULL CHECK (role IN ('PM','DEVELOPER','MARKETER','DESIGNER','REVIEWER','CUSTOM')),
  name         text        NOT NULL,
  persona      text        NOT NULL,
  avatar       text,
  model        text        NOT NULL DEFAULT 'gpt-4o-mini' CHECK (model IN ('gpt-4o','gpt-4o-mini')),
  status       text        NOT NULL DEFAULT 'IDLE' CHECK (status IN ('WORKING','THINKING','IDLE','MEETING','BREAK','GONE')),
  position     jsonb,
  "order"      integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- threads: 에이전트별 대화 스레드
-- ============================================================
CREATE TABLE threads (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id     uuid        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title        text        NOT NULL DEFAULT '새 대화',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- messages: 스레드 내 메시지 (가장 빠르게 증가하는 테이블)
-- ============================================================
CREATE TABLE messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid        NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('user','assistant','system')),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- tasks: 태스크 관리
-- ============================================================
CREATE TABLE tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  assignee_id  uuid        REFERENCES agents(id) ON DELETE SET NULL,
  status       text        NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO','IN_PROGRESS','DONE')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- memories: RAG 벡터 저장소 (대화/문서/회의록 임베딩)
-- 벡터 차원: 1536 (text-embedding-3-small)
-- ============================================================
CREATE TABLE memories (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content      text        NOT NULL,
  embedding    vector(1536),           -- 비동기 생성 가능하므로 NULL 허용
  metadata     jsonb       NOT NULL DEFAULT '{}', -- {type, agent_id, source, ...}
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- updated_at 자동 갱신 트리거 (workspaces에만 적용)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
