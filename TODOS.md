# TODOS

AI Office 개발 추적 목록. 카테고리별 + 우선순위별 정렬.

---

## Phase 2 — 오피스 공간

**Priority: P1**

- **AgentFSM 행동 패턴 완성**
  - 출근/퇴근 시간 기반 등장/퇴장 애니메이션
  - 회의실 이동 트리거 연동
  - 탕비실 이동 트리거 연동

---

## Phase 3 — RAG & 메모리

**Priority: P2**

- **단일 프롬프트 vs 파이프라인 비교 모드** (M, 3-4h)
  - Auto 페이지에 단일 에이전트 응답과 파이프라인 응답을 나란히 표시
  - PMF 검증 후 구현. 사용자 기반 확보 우선
  - Deferred from: CEO 리뷰 2026-04-13

- **주간 다이제스트** (M)
  - 워크스페이스 활동 요약 자동 발송
  - Supabase 무료 플랜 scheduled function 없음 → Vercel Cron 또는 별도 워커 필요
  - Deferred from: CEO 리뷰 2026-04-13

---

## 보안

**Priority: P2**

- **Followup tasks DB 저장 여부 검토**
  - 현재 followup tasks는 SSE로만 전달, DB에 TODO 저장 없음
  - 유저가 브라우저 닫으면 제안이 사라짐 — 필요시 tasks 테이블에 TODO 상태로 저장

---

## 인프라 / 배포

**Priority: P3**

- **Vercel 배포 설정**
  - orchestrate API maxDuration=60은 Vercel Pro 필요
  - 현재는 로컬 실행으로 충분

---

## Completed

- **Orchestrator 워크스페이스 소유권 검증** — Completed: v0.1.0.0 (2026-04-13)
- **메모리 대시보드** — Completed: v0.1.0.0 (2026-04-13)
- **Auto 모드 첫 화면** — Completed: v0.1.0.0 (2026-04-13)
- **빠른 시작 템플릿 (Auto 페이지)** — Completed: v0.1.0.0 (2026-04-13)
- **Orchestrator Follow-up Tasks** — Completed: v0.1.0.0 (2026-04-13)
- **RAG 파이프라인** — Completed: v0.1.0.0 (2026-04-13)
- **음성 회의 STT/TTS** — Completed: v0.1.0.0 (2026-04-13)
- **오피스 충돌 시스템 리팩터** — Completed: v0.1.0.0 (2026-04-13)
- **SECURITY 에이전트 역할 추가** — Completed: v0.1.0.0 (2026-04-13)
- **구조화 에이전트 페르소나** — Completed: v0.1.0.0 (2026-04-13)
- **Agent API 소유권 검증** — Completed: v0.1.0.0 (2026-04-13)
