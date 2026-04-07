-- ============================================================
-- 005_agent_persona_detail.sql
-- agents 테이블에 구조화된 페르소나 상세 컬럼 추가
-- ============================================================

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS persona_detail jsonb;

COMMENT ON COLUMN agents.persona_detail IS
  '구조화된 페르소나 정보: gender, experienceLevel, background, tone, decisionStyle, feedbackStyle, expertise, strengths, notes';
