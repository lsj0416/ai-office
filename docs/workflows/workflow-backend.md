# AI Office — 백엔드 워크플로우

> Next.js API Routes + Supabase + OpenAI 기반 백엔드 개발 가이드
> 공통 프로세스는 `common.md` 참조

---

## 기술 스택

```
Next.js 14 API Routes   (서버 레이어)
Supabase                (PostgreSQL + pgvector + Auth + Realtime)
OpenAI API              (GPT-4o / GPT-4o mini)
Vercel AI SDK           (스트리밍 응답)
Upstash Redis           (캐싱, 선택)
```

---

## API Routes 구조

```
src/app/api/
├── agent/
│   ├── [agentId]/
│   │   └── chat/
│   │       └── route.ts       # POST - 에이전트 채팅
│   └── route.ts               # GET - 에이전트 목록
├── workspace/
│   ├── [id]/
│   │   └── route.ts           # GET/PATCH - 워크스페이스
│   └── route.ts               # POST - 워크스페이스 생성
├── memory/
│   ├── search/
│   │   └── route.ts           # POST - RAG 검색
│   └── route.ts               # POST - 메모리 저장
├── meeting/
│   └── route.ts               # POST - 회의 처리
└── task/
    └── route.ts               # GET/POST/PATCH - 태스크
```

---

## API Route 작성 규칙

```typescript
// app/api/agent/[agentId]/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // 비즈니스 로직
    const result = await processChat(params.agentId, body)

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error('[chat/route]', error)
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 })
  }
}
```

**응답 형태 통일**
```typescript
// 성공
{ data: T, error: null }

// 실패
{ data: null, error: string }
```

---

## 에이전트 실행 엔진

### Orchestrator → Worker 패턴

```typescript
// lib/ai/orchestrator.ts
export async function runOrchestrator(
  input: string,
  workspaceId: string,
  mode: ExecutionMode
) {
  // 1. RAG로 관련 컨텍스트 조합
  const context = await buildContext(input, workspaceId)

  // 2. 작업 분석 → 적절한 Worker 선택
  const plan = await analyzeTask(input, context)  // GPT-4o

  // 3. Worker 실행
  if (mode === 'AUTO') {
    return await runParallel(plan.workers, context)
  } else {
    return await runPipeline(plan.workers, context)
  }
}
```

### Worker 실행

```typescript
// lib/ai/worker.ts
export async function runWorker(
  role: AgentRole,
  input: string,
  context: string
) {
  const systemPrompt = buildSystemPrompt(role, context)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',    // Worker는 mini로 비용 절감
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ],
    stream: true
  })

  return stream
}
```

---

## RAG 파이프라인

```typescript
// lib/ai/rag.ts
export async function buildContext(
  query: string,
  workspaceId: string
): Promise<string> {
  // 1. 쿼리 임베딩
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  })

  // 2. pgvector 유사도 검색
  const { data: memories } = await supabase.rpc('search_memories', {
    query_embedding: embedding.data[0].embedding,
    workspace_id: workspaceId,
    match_count: 5
  })

  // 3. 주간 요약 조회
  const { data: summary } = await supabase
    .from('weekly_summaries')
    .select('content')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // 4. 컨텍스트 조합
  return `
[회사 컨텍스트]
${summary?.content ?? ''}

[관련 히스토리]
${memories?.map((m: Memory) => m.summary).join('\n') ?? ''}
  `.trim()
}
```

---

## Supabase 스키마 주요 테이블

```sql
-- 워크스페이스 (회사)
workspaces (id, name, vision, business, user_id, created_at)

-- 에이전트 (AI 직원)
agents (id, workspace_id, role, name, persona, model, status, position)

-- 대화 스레드
threads (id, workspace_id, agent_id, created_at)
messages (id, thread_id, role, content, created_at)

-- 메모리 (RAG)
memories (id, workspace_id, content, summary, embedding vector(1536), source, created_at)

-- 태스크
tasks (id, workspace_id, title, assignee_id, status, created_at)

-- 주간 요약
weekly_summaries (id, workspace_id, content, week_start, created_at)
```

---

## 모델 선택 기준

```
Orchestrator (작업 분석/조율)   → gpt-4o
Worker (문서/카피/요약)          → gpt-4o-mini
Worker (코드 작성/리뷰)          → gpt-4o
임베딩                           → text-embedding-3-small
```

---

## 에러 처리 패턴

```typescript
// try-catch 필수
// 에러 로그는 콘솔 + 향후 Supabase 저장 예정
try {
  const result = await someOperation()
  return NextResponse.json({ data: result, error: null })
} catch (error) {
  console.error('[route/name]', error)
  return NextResponse.json(
    { data: null, error: 'Internal Server Error' },
    { status: 500 }
  )
}
```

---

## 환경변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # 서버 전용
OPENAI_API_KEY=                 # 서버 전용
```

---

## 백엔드 리뷰 포인트 (Codex에 전달)

```
/codex:adversarial-review --base main
인증/인가 누락, N+1 쿼리, 환경변수 노출,
에러 처리 누락, RAG 컨텍스트 토큰 초과 여부 검토
```