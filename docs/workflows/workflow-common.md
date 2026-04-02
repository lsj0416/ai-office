# AI Office — 공통 워크플로우

> 프론트엔드 / 백엔드 공통 개발 프로세스

---

## 전체 흐름

```
기능 계획  →  구현  →  리뷰  →  검증  →  머지
(Claude)     (Claude)  (Codex)  (Codex)
```

---

## 역할 분담

```
Claude Code  → 설계, 구현, 기능 개발 (메인)
Codex        → 리뷰, 검증, 버그 수정 (보조, ChatGPT Plus 무료)
```

---

## 브랜치 전략

```
main
└── develop
    ├── feature/frontend-*     # 프론트엔드 기능
    ├── feature/backend-*      # 백엔드 기능
    └── fix/*                  # 버그 수정
```

```bash
# 기능 시작
git checkout develop && git pull
git checkout -b feature/frontend-office-canvas

# 완료 후
git add .
git commit -m "feat: 오피스 캔버스 기본 구현"
git push origin feature/frontend-office-canvas
```

---

## 커밋 메시지 규칙

```
feat:     새 기능
fix:      버그 수정
refactor: 리팩터링
docs:     문서 수정
test:     테스트 추가
chore:    설정, 패키지 변경
```

---

## 기능 구현 사이클

### 1. 계획
```
/everything-claude-code:plan "구현할 기능 설명"
```

### 2. TDD
```
/everything-claude-code:tdd
```
RED → GREEN → REFACTOR 순서 강제

### 3. 구현 중 막혔을 때
```
/codex:rescue "해결해야 할 문제"
```

### 4. 빌드 에러
```
/everything-claude-code:build-fix
```

---

## 리뷰 & 검증 (Codex)

구현 완료 후 커밋 전 반드시 실행

```bash
# 기본 리뷰
/codex:review --background

# 브랜치 전체 리뷰
/codex:review --base main --background

# 진행 확인 / 결과 확인
/codex:status
/codex:result

# 설계 압박 테스트 (중요 기능)
/codex:adversarial-review --base main "검토 포인트"

# 문제 있을 때 수정 위임
/codex:rescue "수정 내용"
```

---

## 토큰 최적화

```
/clear      # 관련 없는 작업 전환 시
/compact    # 마일스톤 완료 후
/cost       # 현재 사용량 확인
```

```
개발/구현    → sonnet
서브에이전트 → haiku (자동)
리뷰/검증    → Codex (무료)
복잡한 설계  → opus (필요할 때만)
```

---

## 커맨드 빠른 참조

| 상황 | 커맨드 |
|------|--------|
| 새 기능 시작 | `/everything-claude-code:plan "기능명"` |
| TDD 시작 | `/everything-claude-code:tdd` |
| 빌드 에러 | `/everything-claude-code:build-fix` |
| 코드 리뷰 | `/codex:review --background` |
| 브랜치 리뷰 | `/codex:review --base main` |
| 설계 검토 | `/codex:adversarial-review` |
| 버그 위임 | `/codex:rescue "문제"` |
| 진행 확인 | `/codex:status` |
| 결과 확인 | `/codex:result` |
| 문서 동기화 | `/everything-claude-code:update-docs` |
| 토큰 확인 | `/cost` |
| 컨텍스트 압축 | `/compact` |
| 초기화 | `/clear` |

---

## 스프린트 사이클 (1주 기준)

```
월   스프린트 플래닝 → /everything-claude-code:plan 으로 태스크 분해
화~목  기능 구현 → TDD + /codex:review 반복
금   스프린트 리뷰 → /codex:adversarial-review --base main
     회고 → 문서 업데이트
```

---

## Review Gate (선택)

Claude Code 응답마다 Codex가 자동 검토하는 모드

```
/codex:setup --enable-review-gate   # 활성화
/codex:setup --disable-review-gate  # 비활성화
```

⚠️ 크레딧 소모가 빠르므로 중요 기능 구현 시에만 활성화