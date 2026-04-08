-- 워크스페이스 회사 컨텍스트 필드 추가
-- 에이전트들이 "우리 회사가 어떤 회사인지" 이해할 수 있도록 구조화된 정보 저장

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS target_customer TEXT,
  ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS team_culture TEXT,
  ADD COLUMN IF NOT EXISTS key_metrics TEXT;

COMMENT ON COLUMN workspaces.industry IS '업종 (예: SaaS, 교육, 커머스, 헬스케어)';
COMMENT ON COLUMN workspaces.target_customer IS '타깃 고객 설명';
COMMENT ON COLUMN workspaces.products IS '제품/서비스 목록 [{name, description, status}]';
COMMENT ON COLUMN workspaces.team_culture IS '팀 문화 및 일하는 방식';
COMMENT ON COLUMN workspaces.key_metrics IS '핵심 지표 (MAU, MRR 등)';
