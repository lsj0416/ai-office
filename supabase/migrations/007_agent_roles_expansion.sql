-- 에이전트 역할 확장
-- DEVELOPER → BACKEND / FRONTEND / DEVOPS / AI_DATA 세분화
-- LEGAL 역할 신규 추가

-- 기존 CHECK 제약 제거
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_role_check;

-- 새 CHECK 제약 추가 (기존 DEVELOPER 포함하여 마이그레이션 안전하게 처리)
ALTER TABLE agents
  ADD CONSTRAINT agents_role_check CHECK (
    role IN (
      'PM',
      'DEVELOPER',   -- 기존 데이터 호환용 (신규 생성 불가, 조회는 가능)
      'BACKEND',
      'FRONTEND',
      'DEVOPS',
      'AI_DATA',
      'MARKETER',
      'DESIGNER',
      'REVIEWER',
      'LEGAL',
      'CUSTOM'
    )
  );

COMMENT ON COLUMN agents.role IS 'PM | BACKEND | FRONTEND | DEVOPS | AI_DATA | MARKETER | DESIGNER | REVIEWER | LEGAL | CUSTOM (DEVELOPER는 레거시)';
