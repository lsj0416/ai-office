-- SECURITY 역할 신규 추가

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_role_check;

ALTER TABLE agents
  ADD CONSTRAINT agents_role_check CHECK (
    role IN (
      'PM',
      'DEVELOPER',   -- 기존 데이터 호환용 (신규 생성 불가, 조회는 가능)
      'BACKEND',
      'FRONTEND',
      'DEVOPS',
      'AI_DATA',
      'SECURITY',
      'MARKETER',
      'DESIGNER',
      'REVIEWER',
      'LEGAL',
      'CUSTOM'
    )
  );

COMMENT ON COLUMN agents.role IS 'PM | BACKEND | FRONTEND | DEVOPS | AI_DATA | SECURITY | MARKETER | DESIGNER | REVIEWER | LEGAL | CUSTOM (DEVELOPER는 레거시)';
