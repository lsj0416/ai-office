# Changelog

All notable changes to AI Office are documented here.

## [0.1.0.0] - 2026-04-08

### Added
- **2D 픽셀 오피스 공간** (Phase 2): Pixi.js 7 기반 20×15 타일맵 오피스. WASD 이동, Y-sort 깊이감, 3D 책상, SD 캐릭터 스프라이트, 아이들 보빙/걷기 애니메이션
- **에이전트 근접 대화**: E키로 AI 에이전트와 대화 트리거, ChatDialog 오버레이, 대화 완료 후 자동 메모리 저장
- **픽셀 캐릭터 스프라이트**: 실제 픽셀아트 PNG 에셋 탑재 (PixelCharacterSprite), 교체 가능한 CharacterSprite 인터페이스
- **에이전트 FSM**: AgentFSM — 출근, 작업, 이동, 회의 등 상태 기계 기반 행동 패턴
- **RAG 파이프라인** (Phase 3): OpenAI Embeddings + Supabase pgvector. 관련 대화/문서 자동 검색 후 에이전트 컨텍스트 주입
- **음성 회의**: Whisper STT + ElevenLabs TTS. 마이크 녹음 → 에이전트 응답 스트리밍 → 음성 재생
- **Orchestrator Follow-up Tasks**: 파이프라인 완료 후 결과를 tasks 테이블에 저장, GPT-4o-mini로 후속 태스크 0~3개 자동 제안, generation 루프 깊이 제한(최대 3)
- **구조화 에이전트 페르소나**: 성별, 경력 수준, 어조, 의사결정 스타일 등 6개 축의 페르소나 설정
- **AUTO 모드 강화**: 수동 에이전트 선택 + 순서 지정, followup_tasks SSE 이벤트, 후속 태스크 인라인 실행

### Changed
- 워크스페이스 쉘 네비게이션에 오피스/회의 탭 추가
- orchestrate API에 generation 파라미터(0~10) 추가로 루프 깊이 추적
- 에이전트 API에 회사 컨텍스트(비전, 업무, 제품) 자동 주입

### Fixed
- tilemap 테스트가 실제 맵 레이아웃(회의실 row 12 시작)과 불일치하던 문제 수정
