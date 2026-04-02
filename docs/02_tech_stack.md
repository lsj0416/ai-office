# AI Office — 기술 스택 & 아키텍처

---

## 1. 기술 스택

### Frontend
| 분류 | 기술 | 선택 이유 |
|------|------|----------|
| 프레임워크 | Next.js 14 (App Router) | Supabase 공식 지원, SSR + 실시간 최적 |
| 언어 | TypeScript | 타입 안전성 |
| 상태관리 | Zustand | 에이전트 실행 상태 관리 |
| 2D 공간 | Pixi.js | 타일맵 + 캐릭터 이동 (Phase 2) |
| AI 스트리밍 | Vercel AI SDK | 스트리밍 응답 처리 간소화 |
| 스타일 | Tailwind CSS | 빠른 UI 개발 |

### Backend
| 분류 | 기술 | 선택 이유 |
|------|------|----------|
| 런타임 | Next.js API Routes | 별도 서버 불필요, 1인 개발 최적 |
| DB | Supabase (PostgreSQL) | Auth + Storage + Realtime 통합 |
| 캐시 | Supabase Redis (or Upstash) | 세션, 컨텍스트 캐싱 |
| 실시간 | Supabase Realtime | 에이전트 상태 구독 |

### AI 레이어
| 분류 | 기술 | 용도 |
|------|------|------|
| 메인 모델 | GPT-4o | Orchestrator, 복잡한 작업 |
| 워커 모델 | GPT-4o mini | 반복 작업, 비용 절감 |
| 임베딩 | OpenAI text-embedding-3-small | RAG 벡터 검색 |
| 벡터 DB | Supabase pgvector | 컨텍스트 검색 |
| STT | OpenAI Whisper | 음성 → 텍스트 |
| TTS | ElevenLabs | 역할별 목소리 |

### 인프라
| 분류 | 기술 | 비용 |
|------|------|------|
| 호스팅 | Vercel | 무료 (MVP) |
| DB/Auth | Supabase | 무료 (MVP) |
| 도메인 | 별도 구매 | 약 1만원/년 |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                 │
│                                                      │
│  ┌─────────────┐    ┌──────────────┐                │
│  │  오피스 UI   │    │  Pixi.js     │                │
│  │  (카드/채팅) │    │  2D 공간     │                │
│  └──────┬──────┘    └──────┬───────┘                │
│         └──────────────────┘                         │
│                    │                                 │
│              Zustand Store                           │
│         (에이전트 상태, 채팅 히스토리)                │
└────────────────────┬────────────────────────────────┘
                     │ API Routes
┌────────────────────▼────────────────────────────────┐
│                BACKEND (Next.js API)                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Orchestrator Agent                │   │
│  │         (작업 분해 + 팀 조율)                 │   │
│  └──────┬───────────┬──────────────┬────────────┘   │
│         │           │              │                 │
│  ┌──────▼──┐  ┌─────▼──┐  ┌──────▼──┐             │
│  │  PM AI  │  │ Dev AI  │  │Mkt AI   │  ...        │
│  │ Worker  │  │ Worker  │  │ Worker  │             │
│  └─────────┘  └────────┘  └─────────┘             │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              RAG Pipeline                    │   │
│  │  쿼리 → 임베딩 → 벡터 검색 → 컨텍스트 주입  │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  Supabase                            │
│                                                      │
│  PostgreSQL    pgvector    Auth    Storage  Realtime │
│  (메인 DB)    (RAG 벡터)  (인증)  (파일)   (구독)   │
└─────────────────────────────────────────────────────┘
```

---

## 3. 도메인 모델

```typescript
// 워크스페이스 (회사)
interface Workspace {
  id: string
  name: string           // "AI Office"
  vision: string         // 회사 비전
  business: string[]     // 핵심 비즈니스
  createdAt: Date
}

// AI 에이전트 (직원)
interface Agent {
  id: string
  workspaceId: string
  role: AgentRole        // PM | DEVELOPER | MARKETER | CUSTOM ...
  name: string           // "PM 지민"
  persona: string        // 시스템 프롬프트
  avatar: string         // 이모지 or 스프라이트 경로
  model: AIModel         // claude-haiku | claude-sonnet | gpt-4o-mini
  status: AgentStatus    // WORKING | THINKING | IDLE | MEETING | GONE
  position: Position     // { x, y } - 2D 공간 좌표
  order?: number         // PIPELINE 모드 실행 순서
}

// 실행 모드
type ExecutionMode = 'AUTO' | 'PIPELINE' | 'CHAT'

// 작업 스레드
interface Thread {
  id: string
  workspaceId: string
  agentId: string
  messages: Message[]
  createdAt: Date
}

// 메모리 (RAG용)
interface Memory {
  id: string
  workspaceId: string
  content: string        // 원문
  summary: string        // 요약
  embedding: number[]    // 벡터
  source: MemorySource   // CHAT | DOCUMENT | MEETING
  createdAt: Date
}

// 태스크
interface Task {
  id: string
  workspaceId: string
  title: string
  assigneeId: string     // 담당 에이전트 ID
  status: TaskStatus     // TODO | IN_PROGRESS | DONE
  createdAt: Date
}
```

---

## 4. AI 에이전트 실행 구조

### Orchestrator-Worker 패턴

```
사용자 입력
    ↓
Orchestrator (Claude Sonnet)
├── 작업 분석 및 분해
├── 적절한 Worker 선택
└── 컨텍스트 조합
    ↓
Worker Agents (Claude Haiku / GPT-4o mini)
├── PM Worker    → 기획 / 일정
├── Dev Worker   → 기술 / 코드
├── Mkt Worker   → 마케팅 / 카피
└── Custom ...
    ↓
결과 취합 → 사용자 반환
```

### 에이전트간 컨텍스트 전달 (PIPELINE 모드)

```
Worker A 결과
    ↓
[전체 목표] + [지금까지 결과 요약] + [Worker A output]
    ↓
Worker B 입력
    ↓
Worker B 결과
    ↓
...반복
```

### RAG 컨텍스트 주입

```typescript
async function buildContext(query: string, workspaceId: string) {
  // 1. 쿼리 임베딩
  const queryEmbedding = await embed(query)

  // 2. 관련 메모리 검색 (top-k)
  const relevantMemories = await searchMemories({
    workspaceId,
    embedding: queryEmbedding,
    limit: 5
  })

  // 3. 계층 요약 가져오기
  const weeklySummary = await getWeeklySummary(workspaceId)

  // 4. 컨텍스트 조합
  return `
    [회사 컨텍스트]
    ${weeklySummary}

    [관련 히스토리]
    ${relevantMemories.map(m => m.summary).join('\n')}
  `
}
```

---

## 5. 직원 행동 패턴 (FSM)

```
상태: GONE → WORKING → THINKING → MEETING → BREAK → GONE

전환 규칙
├── 09:00 → GONE에서 WORKING (출근)
├── 12:00 → WORKING에서 BREAK (점심)
├── 13:00 → BREAK에서 WORKING (복귀)
├── 18:00 → WORKING에서 GONE (퇴근, 야근 직원 제외)
├── 회의 이벤트 → 현재 상태에서 MEETING
└── 랜덤 트리거 → BREAK (탕비실 이동)

역할별 패턴
├── PM      → 오전 MEETING 빈도 높음
├── DEV     → 오전 WORKING (집중), 야근 확률 높음
├── MKT     → 오전 BREAK (커피), 오후 WORKING
└── CUSTOM  → 페르소나에 따라 설정
```

---

## 6. 모델 선택 전략

```
복잡한 분석 / 전략 수립    → GPT-4o
단순 문서 / 카피 작성       → GPT-4o mini
코드 작성 / 리뷰            → GPT-4o
STT                        → Whisper API
TTS (역할별 목소리)         → ElevenLabs
임베딩                      → text-embedding-3-small
```

**비용 최적화**
- Orchestrator만 GPT-4o, Worker는 GPT-4o mini로 단계별 적용
- 동일 요청 캐싱 (Redis TTL 1시간)
- RAG로 컨텍스트 토큰 최소화
- 프롬프트 압축 (불필요한 공백 제거)

---

## 7. 개발 환경

```bash
# 패키지 매니저
pnpm

# 주요 패키지
next: 14.x
typescript: 5.x
supabase-js: 2.x
zustand: 4.x
ai: 3.x (Vercel AI SDK)
pixi.js: 7.x (Phase 2)

# 환경변수
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
```

---

## 8. 브랜치 전략

```
main
└── develop
    ├── feature/workspace-setup     # 회사 생성
    ├── feature/agent-chat          # 에이전트 채팅
    ├── feature/task-management     # 태스크 관리
    ├── feature/rag-pipeline        # RAG 구축
    ├── feature/pixi-office         # 2D 공간 (Phase 2)
    └── feature/voice-meeting       # 음성 회의 (Phase 3)
```
