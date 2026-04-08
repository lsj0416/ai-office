-- 008_task_automation.sql
-- tasks 테이블에 파이프라인 자동화용 컬럼 추가

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS generation INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- 기존 행은 모두 수동 생성으로 처리
UPDATE tasks SET source = 'manual' WHERE source IS NULL OR source = 'manual';

-- generation 범위 제약
ALTER TABLE tasks
  ADD CONSTRAINT tasks_generation_range CHECK (generation >= 0 AND generation <= 10);

-- source 값 제약
ALTER TABLE tasks
  ADD CONSTRAINT tasks_source_values CHECK (source IN ('manual', 'ai_followup'));
