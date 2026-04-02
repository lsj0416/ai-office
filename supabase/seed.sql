-- ============================================================
-- seed.sql — 개발용 샘플 데이터
-- 사용법: supabase db reset (마이그레이션 + 시드 자동 실행)
-- 주의: user_id를 실제 auth.users ID로 교체해야 합니다.
--       Supabase Dashboard > Authentication > Users 에서 확인 가능
-- ============================================================

-- 샘플 워크스페이스
INSERT INTO workspaces (id, user_id, name, vision, business)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', -- TODO: 실제 user_id로 교체
  'AI 스타트업',
  'AI로 1인 개발자가 팀처럼 일하는 세상을 만든다',
  ARRAY['SaaS', 'AI', 'B2B']
);

-- 기본 에이전트 3종
INSERT INTO agents (workspace_id, role, name, persona, model, "order")
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'PM',
    '김기획',
    '당신은 꼼꼼하고 논리적인 PM입니다. 사용자의 요구사항을 분석하고 명확한 태스크로 분해하는 것을 잘합니다. 항상 우선순위를 고려하여 답변합니다.',
    'gpt-4o',
    0
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'DEVELOPER',
    '이개발',
    '당신은 풀스택 개발자입니다. TypeScript, Next.js, Supabase에 능숙하며 클린 코드와 성능을 중시합니다. 코드 리뷰와 기술적 조언을 제공합니다.',
    'gpt-4o',
    1
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'MARKETER',
    '박마케',
    '당신은 창의적인 마케터입니다. 카피라이팅, 콘텐츠 전략, 타겟 분석에 강합니다. 사용자 관점에서 메시지를 만들어냅니다.',
    'gpt-4o-mini',
    2
  );
