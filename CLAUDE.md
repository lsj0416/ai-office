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
│   ├── (auth)/                    # 로그인, 회원가입
│   ├── workspace/
│   │   ├── page.tsx               # 워크스페이스 목록
│   │   ├── new/                   # 워크스페이스 생성
│   │   └── [id]/
│   │       ├── office/            # Pixi.js 2D 오피스 공간
│   │       ├── chat/              # 에이전트 채팅
│   │       ├── agents/            # 에이전트 CRUD
│   │       ├── tasks/             # 태스크 관리
│   │       └── auto/              # AUTO 모드 (Orchestrator)
│   └── api/
│       ├── agent/                 # 에이전트 스트리밍 실행
│       ├── orchestrate/           # Orchestrator → Worker 파이프라인
│       ├── memory/                # RAG 저장 / 검색 (Phase 3)
│       ├── meeting/               # 음성 회의 (Phase 3)
│       └── workspaces/[id]/
│           ├── agents/            # 에이전트 CRUD API
│           ├── threads/           # 스레드 생성/조회
│           └── tasks/             # 태스크 CRUD API
├── components/
│   └── office/                    # Pixi.js 오피스 컴포넌트
│       ├── OfficeCanvas.tsx       # 메인 React 래퍼
│       ├── ChatDialog.tsx         # 근접 대화 오버레이
│       ├── constants.ts           # 타일/캐릭터/색상 상수
│       ├── tilemap.ts             # 20×15 맵 데이터 + 이동 가능 판정
│       ├── hooks/
│       │   └── usePixiOffice.ts   # Pixi 게임 루프 훅
│       └── sprites/
│           ├── CharacterSprite.ts # SD 캐릭터 팩토리 (교체 가능 구조)
│           └── DeskSprite.ts      # 3D 책상 팩토리
├── lib/
│   ├── ai/
│   │   ├── orchestrator.ts        # Orchestrator 에이전트
│   │   ├── worker.ts              # Worker 에이전트 (스트리밍)
│   │   └── rag.ts                 # RAG 파이프라인 (Phase 3)
│   ├── supabase/                  # DB 클라이언트 (client/server/middleware)
│   └── utils/
│       └── schemas.ts             # Zod 스키마
├── stores/                        # Zustand 상태
│   ├── workspace-store.ts
│   ├── agent-store.ts
│   └── chat-store.ts
└── types/
    ├── index.ts                   # 공통 도메인 타입
    ├── database.ts                # Supabase 스키마 타입
    └── office.ts                  # 오피스 전용 타입
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

### Phase 1 — 완료
- [x] 서비스 기획 및 아이디어 구체화
- [x] 기술 스택 확정
- [x] Next.js 14 프로젝트 세팅 (App Router, TypeScript, Tailwind, Zustand)
- [x] Supabase 스키마 설계 (Workspace / Agent / Thread / Message / Task / Memory)
- [x] Supabase Auth (로그인 / 회원가입 / 로그아웃)
- [x] 워크스페이스 CRUD
- [x] 에이전트 CRUD (역할 / 페르소나 / 모델 설정)
- [x] 에이전트 채팅 (Thread + 스트리밍 응답)
- [x] 태스크 관리 (생성 / 상태 변경 / 삭제)
- [x] AUTO 모드 (Orchestrator → Worker 파이프라인, 스트리밍)
- [x] OpenAI API 연동 (GPT-4o Orchestrator + GPT-4o-mini Worker)

### Phase 2 — 진행 중
- [x] Pixi.js 7 설치 및 기본 캔버스 세팅
- [x] 20×15 타일맵 오피스 맵 (작업공간 / 회의실 / 탕비실)
- [x] 세종씨 캐릭터 WASD 이동 + 충돌 처리
- [x] SD 캐릭터 스프라이트 (머리+몸통+다리, Zep 스타일, Graphics 기반)
- [x] 3D 책상 (위면+앞면+모니터+키보드)
- [x] Y-sort 깊이감 (sortableChildren, zIndex=feet.y)
- [x] 아이들 보빙 / 걷기 다리 스윙 애니메이션
- [x] 에이전트 근접 감지 → E키 대화 트리거 → ChatDialog 오버레이
- [x] 스프라이트 교체 가능 구조 (CharacterSprite 인터페이스)
- [ ] 직원 행동 패턴 FSM (출퇴근 / 회의실 이동 / 탕비실 이동)

### Phase 3 — 진행 중
- [x] RAG 파이프라인 (OpenAI Embeddings + Supabase pgvector)
  - embedText / saveMemory / searchMemories / buildRagContext (src/lib/ai/rag.ts)
  - Memory REST API: GET 검색 / POST 저장 (src/app/api/memory/route.ts)
  - Agent API & Orchestrate API에 RAG 컨텍스트 자동 주입
- [x] 음성 회의 STT (Whisper whisper-1): POST /api/meeting — multipart audio → text
- [x] 음성 회의 TTS (ElevenLabs eleven_multilingual_v2): POST /api/meeting/tts — text → audio/mpeg
- [x] 대화 완료 후 자동 메모리 저장 (ChatDialog 스트리밍 완료 시 /api/memory 저장)
- [x] 음성 회의 UI 컴포넌트 (마이크 녹음 → STT → 에이전트 응답 스트리밍 → TTS 재생)
  - VoiceMeetingPanel (src/components/meeting/VoiceMeetingPanel.tsx)
  - /workspace/[id]/meeting 페이지 + 네비게이션 '회의' 탭

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
