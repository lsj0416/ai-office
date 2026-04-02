# CLAUDE.md — AI Office

> Claude Code 및 AI 작업 시 참조하는 프로젝트 컨텍스트 문서

---

## 프로젝트 개요

**서비스명:** AI Office
**한 줄 설명:** 역할 기반 멀티 에이전트를 시각적 사무실 공간으로 구현한 1인 개발자용 AI 팀 서비스
**개발자:** 이세종 (백엔드 개발자, 대표 겸 풀스택)
**GitHub:** lsj0416

---

## 핵심 도메인 개념

| 용어 | 설명 |
|------|------|
| Workspace | 회사 단위. 이름 + 비전 + 비즈니스 정보 포함 |
| Agent | AI 직원. 역할별 페르소나 + 시스템 프롬프트 |
| Orchestrator | 작업을 분해하고 Worker에게 위임하는 총괄 에이전트 |
| Worker | 실제 작업을 수행하는 역할별 에이전트 |
| Thread | 에이전트별 대화 스레드 |
| Memory | RAG용 벡터 저장소. 대화/문서/회의록 포함 |
| ExecutionMode | AUTO / PIPELINE / CHAT 세 가지 실행 방식 |

---

## 기술 스택 요약

```
Frontend  Next.js 14 (App Router) + TypeScript + Zustand + Tailwind
Backend   Next.js API Routes (별도 서버 없음)
DB        Supabase (PostgreSQL + pgvector + Auth + Realtime)
AI        GPT-4o (Orchestrator) + GPT-4o mini (Worker)
RAG       OpenAI Embeddings + Supabase pgvector
STT/TTS   Whisper + ElevenLabs
2D 공간   Pixi.js (Phase 2)
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/          # 로그인, 회원가입
│   ├── workspace/       # 회사 생성 및 메인 오피스
│   │   ├── [id]/
│   │   │   ├── office/  # 오피스 공간 UI
│   │   │   ├── chat/    # 에이전트 채팅
│   │   │   └── tasks/   # 태스크 관리
│   └── api/
│       ├── agent/       # 에이전트 실행 API
│       ├── memory/      # RAG 저장 / 검색
│       └── meeting/     # 회의 처리
├── components/
│   ├── office/          # 오피스 UI 컴포넌트
│   ├── agent/           # 에이전트 카드, 채팅
│   └── ui/              # 공통 UI
├── lib/
│   ├── ai/              # AI 관련 유틸
│   │   ├── orchestrator.ts
│   │   ├── worker.ts
│   │   └── rag.ts
│   ├── supabase/        # DB 클라이언트
│   └── utils/
└── types/               # 공통 타입 정의
```

---

## 주요 구현 패턴

### 에이전트 실행

```typescript
// Orchestrator → Worker 패턴
// 1. 사용자 입력 분석
// 2. 적절한 Worker 선택
// 3. RAG로 관련 컨텍스트 조합
// 4. Worker 실행 (스트리밍)
// 5. 결과 반환 + 메모리 저장
```

### RAG 컨텍스트 주입 순서

```
1. 쿼리 임베딩 (text-embedding-3-small)
2. pgvector 유사도 검색 (top-5)
3. 주간 요약 가져오기
4. [회사 컨텍스트] + [관련 히스토리] 조합
5. 시스템 프롬프트에 주입
```

### 에이전트 간 컨텍스트 전달 (PIPELINE 모드)

```
이전 에이전트 결과 + 전체 목표 + 지금까지 요약
→ 다음 에이전트 입력으로 전달
(단순 목표만 넘기는 것과 품질 차이가 큼)
```

---

## 모델 선택 기준

| 작업 유형 | 모델 | 이유 |
|----------|------|------|
| Orchestrator (작업 분석/조율) | gpt-4o | 복잡한 추론 필요 |
| Worker (문서/카피/요약) | gpt-4o-mini | 빠르고 저렴 |
| Worker (코드 작성/리뷰) | gpt-4o | 코딩 성능 중요 |
| 최종 결과물 검토 | gpt-4o | 품질 보장 |

---

## 코딩 컨벤션

- 언어: TypeScript (strict mode)
- 패키지 매니저: pnpm
- 브랜치: `main → develop → feature/*`
- 커밋 메시지: `feat:` / `fix:` / `refactor:` / `docs:`
- API Route 응답: `{ data, error }` 형태로 통일
- 에러 처리: try-catch 필수, 에러 로그 Supabase에 저장
- 환경변수: `.env.local` 사용, 절대 커밋 금지
- AI API 키: `OPENAI_API_KEY` (90달러 크레딧 보유)

---

## 현재 개발 상태

### 완료
- [x] 서비스 기획 및 아이디어 구체화
- [x] 기술 스택 확정
- [x] HTML 프로토타입 (정적 UI)

### 진행 중 (Phase 1)
- [ ] Next.js 프로젝트 초기 세팅
- [ ] Supabase 스키마 설계
- [ ] Claude API 실제 연동
- [ ] 에이전트 채팅 기능

### 예정 (Phase 2)
- [ ] Pixi.js 2D 오피스 공간
- [ ] 캐릭터 이동 및 직원 행동 패턴

### 예정 (Phase 3)
- [ ] RAG 파이프라인
- [ ] 음성 회의 (STT/TTS)

---

## 관련 프로젝트 (세종씨 사이드 프로젝트)

### 예비자 (Yebija)
- **설명:** 교회 예배 준비 서비스. PPT 자동생성, 성경 본문 추출, AI 설교 기획
- **스택:** Spring Boot + React + Apache POI + GPT-4o
- **현황:** PPT 자동생성 기능 개발 중. holybible.or.kr CGI 연동 검토 중
- **이슈:** 개역개정 저작권 검토 필요

### DevNote AI
- **설명:** GitHub 레포 분석 → 학습 노트 / 기술 블로그 / 복습 퀴즈 자동 생성
- **스택:** Spring Boot + OAuth2 + JPA + Redis + GPT-4o
- **현황:** 비동기 파이프라인 구축 중. Kafka 마이그레이션 예정

---

## 작업 시 주의사항

- Supabase는 무료 플랜 기준으로 설계 (MVP 단계)
- AI API 비용 최소화: Worker는 Haiku 우선, Sonnet은 꼭 필요할 때만
- 특정 모델에 종속되지 않도록 AI Provider 추상화 레이어 유지
- RAG 없이 전체 히스토리를 프롬프트에 넣지 말 것 (비용 폭발)
- 1인 개발 → 과도한 추상화 지양, 빠른 검증 우선
