# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code(claude.ai/code)를 위한 가이드를 제공한다.

@AGENTS.md @.claude/rules/component-convention.md @.claude/rules/commit-convention.md

## 프로젝트 개요

오디오 가이드를 위한 React Native / Expo 모바일 앱이다. 작품 정보를 촬영·입력하면 AI가 한국어 미술 해설을 생성해 TTS로 읽어주고, AI 도슨트와 채팅할 수 있다.

## 개발 워크플로우 (간단 버전)

목표: 화면/컴포넌트 수정, 리팩토링, 버그 수정처럼 신규 화면 파이프라인까지는 필요 없는 요청을 최소 diff로 완주한다.

트리거: 특정 파일·화면·컴포넌트를 고쳐달라는 요청, 중복 코드 정리, 상수·색상 토큰화, 간단한 버그 수정 시 이 절차를 쓴다. 새 화면·플로우 개발(Tier M/L)은 이 절차 대신 AGENTS.md의 Manager→John→Sam→Alex→Chris→Taylor 파이프라인을 그대로 따른다 — 이 절차가 그걸 대체하지 않는다.

절차:

1. 수정 대상 파일을 Read로 먼저 읽는다 (읽지 않고 Edit 금지).
2. 요청 범위 안에서만 최소 diff로 수정한다. 관련 없는 정리·리팩토링은 하지 않는다.
3. `npx tsc --noEmit`으로 타입 오류 0건을 확인하고, 테스트가 있으면 `npm test`도 돌린다.
4. UI 변경이면 시뮬레이터 스크린샷으로 실제 렌더링을 확인한다 (가능한 경우).
5. 커밋은 사용자가 명시적으로 요청할 때만 한다.

## 문서 지도

### 항상 준수 (규칙)

| 문서                                    | 내용                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.docs/DESIGN_SYSTEM.md`                | 컬러·타이포 토큰 정본                                                                           |
| `AGENTS.md`                             | 에이전트 팀 구성·역할·워크플로 티어·검증 체크리스트 정본 (@import로 항상 로드됨)                |
| `.claude/rules/component-convention.md` | 컴포넌트 작성 규칙: Props 타입, className/style, 파일 구조, import 순서 (@import로 항상 로드됨) |
| `.claude/rules/commit-convention.md`    | 커밋 메시지 형식 (@import로 항상 로드됨)                                                        |

### 작업 전 확인 (현황)

| 문서                    | 내용                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| `.docs/STATUS.md`       | 구현된 화면/컴포넌트/스토어/Edge Function 현황 정본. 코드 탐색 전 먼저 읽을 것 |
| `.docs/ARCHITECTURE.md` | 앱 구조·네비게이션 플로우·상태 관리(store.ts vs Zustand)·레이아웃 컴포넌트     |
| `.docs/BACKEND.md`      | Supabase Edge Functions 인벤토리·SSE 스트리밍 연동·환경 변수                   |

### 필요 시 참조

| 문서                                | 내용                                        |
| ----------------------------------- | ------------------------------------------- |
| `.claude/rules/feature-pipeline.md` | 티어 M/L 파이프라인 세부 게이트(G1~G6) 절차 |
| `.docs/templates/feature/`          | 기능 산출물 템플릿(01~06)                   |
| `README.md`                         | 실행/설치 명령                              |

## 하네스 변경 이력 (최근 5행)

CLAUDE.md · `.claude/agents/` · `.claude/skills/` · `.claude/rules/` · 훅 변경만 기록한다(기능 코드 변경은 커밋 로그가 정본). 5행을 넘으면 가장 오래된 행부터 `.docs/CHANGELOG.md`로 이관한다(이관 시 내용 수정 금지, append-only). 전체 이력은 그 파일 참고.

| 날짜       | 변경 내용                                                                    | 대상                                              | 사유                                                                     |
| ---------- | ----------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| 2026-08-25 | 하네스 파일 변경 자동 감지 → CHANGELOG.md 로깅 hook 추가                     | `.claude/settings.json`, `.claude/hooks/moai/`     | 사용자 요청 — 하네스 변경 시 수동 이관을 잊지 않도록 자동 기록             |
| 2026-08-25 | chris.md/taylor.md 입력 섹션에 tier S 조건 명시, taylor.md Q4 tier S 분기     | `.claude/agents/chris.md`, `.claude/agents/taylor.md` | harness 드라이런 테스트에서 발견 — tier S 실행 시 dead link 위험         |
| 2026-08-25 | (이 섹션이 디스크에서 통째로 사라져 재생성됨 — 이전 3행은 `.docs/CHANGELOG.md`에 보존) | CLAUDE.md                                          | 세션 중 외부 변경으로 섹션 소실 발견, 정본은 CHANGELOG.md라 데이터 손실 없음 |
