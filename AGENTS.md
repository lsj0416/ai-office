# AGENTS.md — AI Office

> Claude Code, Codex 등 AI 도구가 공통으로 참조하는 에이전트 정의 문서

---

## 프로젝트 컨텍스트

**서비스명:** AI Office
**설명:** 역할 기반 멀티 에이전트를 시각적 사무실 공간으로 구현한 1인 개발자용 AI 팀 서비스
**스택:** Next.js 14 + TypeScript + Supabase + OpenAI API
**개발자:** 이세종 (백엔드 개발자, 대표 겸 풀스택)

---

## 역할 분담 원칙

```
Claude Code  → 설계, 구현, 기능 개발 (메인)
Codex        → 리뷰, 검증, 버그 수정 (보조)
```

**Claude Code가 직접 하지 않는 것**
- 코드 리뷰 → `/codex:review` 에 위임
- 설계 압박 테스트 → `/codex:adversarial-review` 에 위임
- 버그 수정 탐색 → `/codex:rescue` 에 위임

---

## 에이전트 목록

### 🗂️ planner (기능 구현 계획)
- **역할:** 새 기능 구현 전 단계별 계획 수립
- **트리거:** `/plan "기능명"`
- **산출물:** 구현 순서, 파일 목록, 예상 이슈
- **주의:** 구현은 하지 않음. 계획만 수립

### 🏗️ architect (시스템 설계)
- **역할:** 컴포넌트 구조, DB 스키마, API 설계 결정
- **트리거:** `/plan` 실행 후 설계 결정이 필요할 때
- **산출물:** 아키텍처 다이어그램(텍스트), 설계 근거
- **참조:** `docs/02_tech_stack.md`

### 🧪 tdd-guide (테스트 주도 개발)
- **역할:** 구현 전 테스트 먼저 작성 강제
- **트리거:** `/tdd`
- **원칙:** RED → GREEN → REFACTOR
- **커버리지 목표:** 80% 이상

### 🔒 security-reviewer (보안 검토)
- **역할:** OWASP Top 10 기준 보안 취약점 검토
- **트리거:** Codex로 위임 (`/codex:adversarial-review`)
- **주요 체크:** 인증/인가, SQL Injection, 환경변수 노출

### 📝 doc-updater (문서 동기화)
- **역할:** 코드 변경 후 관련 문서 업데이트
- **트리거:** `/update-docs`
- **대상:** CLAUDE.md, AGENTS.md, docs/ 하위 문서

---

## Codex 에이전트

### gstack 적용
- Codex에 gstack을 설치해 사용할 수 있다.
- 권장 설치: `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.codex/skills/gstack && cd ~/.codex/skills/gstack && ./setup --host codex`
- gstack이 설치된 경우 일반 대화보다 역할형 skill 사용을 우선한다.
- 권장 흐름: 기획 `/office-hours` → 설계 `/plan-eng-review` → 리뷰 `/review` → 버그 조사 `/investigate` → QA `/qa` → 문서 `/document-release`
- 단, 이 저장소의 프로젝트 규칙과 역할 분담 원칙은 gstack 기본 규칙보다 우선한다.

### codex:review
- 현재 uncommitted 변경사항 리뷰
- 브랜치 비교: `--base main`
- 백그라운드 실행 권장: `--background`

### codex:adversarial-review
- 설계 결정 압박 테스트
- 트레이드오프, 숨겨진 가정, 대안 검토
- 예시: `auth, caching, race conditions` 집중 리뷰

### codex:rescue
- 버그 조사 및 수정 위임
- Claude Code가 막혔을 때 사용
- 기본 모델: gpt-4o-mini (빠른 수정 목적)

---

## 코딩 원칙 (모든 에이전트 공통)

```
1. TypeScript strict mode 필수
2. 함수형 컴포넌트, 불변성 유지
3. 커밋 메시지: feat: / fix: / refactor: / docs:
4. 브랜치: main → develop → feature/*
5. 환경변수 절대 커밋 금지
6. 에러 처리: try-catch 필수
7. API 응답: { data, error } 형태 통일
```

---

## 파일 구조 참조

```
src/
├── app/
│   ├── (auth)/
│   ├── workspace/[id]/
│   │   ├── office/
│   │   ├── chat/
│   │   └── tasks/
│   └── api/
│       ├── agent/
│       ├── memory/
│       └── meeting/
├── components/
│   ├── office/
│   ├── agent/
│   └── ui/
├── lib/
│   ├── ai/
│   │   ├── orchestrator.ts
│   │   ├── worker.ts
│   │   └── rag.ts
│   └── supabase/
└── types/
```

---

## 관련 문서

- `CLAUDE.md` — Claude Code 작업 컨텍스트
- `docs/01_service_plan.md` — 서비스 기획서
- `docs/02_tech_stack.md` — 기술 스택 & 아키텍처
- `docs/workflow.md` — 개발 워크플로우
