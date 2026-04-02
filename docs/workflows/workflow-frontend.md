# AI Office — 프론트엔드 워크플로우

> Next.js 14 + TypeScript + Pixi.js 기반 프론트엔드 개발 가이드
> 공통 프로세스는 `common.md` 참조

---

## 기술 스택

```
Next.js 14 (App Router)
TypeScript (strict mode)
Zustand (상태관리)
Tailwind CSS (스타일)
Pixi.js (2D 오피스 공간, Phase 2)
Vercel AI SDK (스트리밍)
```

---

## 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── workspace/
│   │   └── [id]/
│   │       ├── office/          # 오피스 공간 메인
│   │       │   └── page.tsx
│   │       ├── chat/            # 에이전트 채팅
│   │       │   └── page.tsx
│   │       ├── tasks/           # 태스크 관리
│   │       │   └── page.tsx
│   │       └── layout.tsx
│   └── api/                     # API Routes (백엔드)
│
├── components/
│   ├── office/                  # 오피스 UI
│   │   ├── DeskCard.tsx         # 직원 책상 카드
│   │   ├── MeetingRoom.tsx      # 회의실
│   │   ├── OfficeCanvas.tsx     # Pixi.js 캔버스 (Phase 2)
│   │   └── StatusBadge.tsx
│   ├── agent/                   # 에이전트 관련
│   │   ├── ChatPanel.tsx        # 채팅 패널
│   │   ├── ChatBubble.tsx
│   │   └── TypingIndicator.tsx
│   └── ui/                      # 공통 UI
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Modal.tsx
│
├── lib/
│   └── stores/                  # Zustand 스토어
│       ├── agentStore.ts        # 에이전트 상태
│       ├── chatStore.ts         # 채팅 상태
│       └── workspaceStore.ts    # 워크스페이스 상태
│
└── types/
    └── index.ts                 # 공통 타입
```

---

## 컴포넌트 작성 규칙

```typescript
// ✅ 함수형 컴포넌트 + Props 타입 명시
interface DeskCardProps {
  agent: Agent
  isSelected: boolean
  onClick: (agentId: string) => void
}

export default function DeskCard({ agent, isSelected, onClick }: DeskCardProps) {
  return (...)
}

// ❌ any 타입 금지
// ❌ default export 없는 컴포넌트 금지
// ❌ 인라인 스타일 (Tailwind 사용)
```

---

## Zustand 스토어 패턴

```typescript
// lib/stores/agentStore.ts
interface AgentStore {
  agents: Agent[]
  selectedAgentId: string | null
  setSelectedAgent: (id: string) => void
  updateAgentStatus: (id: string, status: AgentStatus) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  selectedAgentId: null,
  setSelectedAgent: (id) => set({ selectedAgentId: id }),
  updateAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, status } : a
      )
    }))
}))
```

---

## AI 스트리밍 응답 처리

```typescript
// Vercel AI SDK 사용
import { useChat } from 'ai/react'

export default function ChatPanel({ agentId }: { agentId: string }) {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: `/api/agent/${agentId}/chat`,
  })

  return (...)
}
```

---

## Phase별 UI 구현 범위

### Phase 1 (현재) — 카드 기반 UI
```
- DeskCard 컴포넌트 (직원 책상)
- ChatPanel (사이드 패널 채팅)
- TaskList (태스크 관리)
- MeetingRoom (회의실 트리거)
```

### Phase 2 — Pixi.js 2D 공간
```
- OfficeCanvas (타일맵 사무실)
- PlayerCharacter (WASD 이동)
- NpcCharacter (직원 AI 이동)
- 출퇴근 애니메이션
- 회의실 이동 트리거
```

---

## 자주 쓰는 Tailwind 패턴

```tsx
// 다크 카드
<div className="bg-gray-900 border border-gray-700 rounded-xl p-4">

// 액센트 버튼
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">

// 상태 뱃지
<span className="flex items-center gap-1.5 text-xs text-green-400">
  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
  작업 중
</span>
```

---

## 프론트엔드 리뷰 포인트 (Codex에 전달)

```
/codex:adversarial-review --base main
컴포넌트 재사용성, 상태 관리 구조,
불필요한 리렌더링, 접근성(a11y) 검토
```

---

## 환경변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`NEXT_PUBLIC_` 없는 변수는 클라이언트에서 접근 불가 — 서버 전용