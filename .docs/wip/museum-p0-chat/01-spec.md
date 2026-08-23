---
feature-slug: museum-p0-chat
tier: M
author: john
status: draft
---

# Spec — 채팅 기록 저장 + 해설 없이 채팅

## Problem

1. 채팅이 세션 한정 휘발성 — 설명 화면을 벗어나면 나눈 대화를 다시 볼 수 없음.
2. 이미 캡션이 있는 전시에서는 불필요한 AI 해설 생성을 거쳐야만 채팅(질문)이 가능함.

## Goals

- 채팅 내역을 히스토리 항목에 붙여 티켓/일기 화면에서 다시 열람 가능하게 한다.
- 제목·작가를 입력한 뒤 해설 생성을 건너뛰고 바로 채팅으로 진입할 수 있게 한다.

## Non-goals (out of scope)

- 채팅 메시지 클라우드 동기화 (이번 범위에선 AsyncStorage 로컬 저장만)
- 채팅 내역 검색·필터
- 채팅 재개 (이전 대화를 이어서 추가 질문) — 읽기 전용 열람만
- P1/P2 항목 (설정 접근, 브라우저, 연도 입력 등)

## Users & context

- 미술관을 방문 중인 사용자가 작품 해설을 들은 후 나눈 Q&A를 나중에 복기하고 싶음.
- 캡션이 풍부한 전시에서 해설 생성 없이 궁금한 것만 빠르게 질문하고 싶음.

## Acceptance criteria

### AC-1: 채팅 내역 저장

- **Given** 사용자가 작품 설명 화면에서 채팅 탭을 열어 1회 이상 대화를 나눈 상태
- **When** 설명 화면을 벗어나거나 (back) 앱이 종료될 때
- **Then** 해당 히스토리 항목(`historyStore.HistoryItem`)에 `chatMessages` 배열이 저장되어 다음 실행에서도 조회 가능하다

### AC-2: 티켓(일기) 화면에서 채팅 내역 열람

- **Given** 일기(`diary/[date].tsx`) 또는 히스토리 상세 화면을 열었을 때
- **When** 해당 히스토리 항목에 `chatMessages`가 1건 이상 존재할 때
- **Then** "채팅 기록 보기" 섹션이 표시되고, 말풍선 형태로 대화를 스크롤하여 읽을 수 있다 (읽기 전용)

### AC-3: 해설 없이 채팅 진입 (캡션 채팅)

- **Given** 수동 입력 화면(`manual input`)에서 제목·작가를 입력한 상태
- **When** 사용자가 "바로 질문하기" 버튼을 누를 때
- **Then** AI 해설 생성 없이 채팅 화면으로 이동하며, 채팅 컨텍스트는 "제목 — 작가" 정보를 기반으로 초기화된다 (시스템 프롬프트에 작품 정보 주입)

### AC-4: 캡션 채팅에서 입력 텍스트 제공 (선택)

- **Given** 수동 입력 화면에서 선택적으로 캡션 텍스트를 입력한 상태
- **When** "바로 질문하기"로 채팅 진입 시
- **Then** 채팅 시스템 프롬프트에 캡션 내용이 추가 컨텍스트로 포함된다

## Screens / routes

| Route | 변경 |
|-------|------|
| `app/(guide)/chat.tsx` | 변경 없음 (재사용) |
| `src/store/chatStore.ts` | 변경 없음 |
| `src/store/historyStore.ts` | `HistoryItem`에 `chatMessages?` 필드 추가, `saveChatMessages()` 액션 추가 |
| `app/(guide)/description.tsx` | 화면 unmount 시 채팅 flush 대신 historyStore에 저장 |
| `app/diary/[date].tsx` | 해당 날짜 히스토리 항목의 채팅 내역 섹션 추가 (읽기 전용) |
| `app/(guide)/manual.tsx` | "바로 질문하기" 버튼 추가 → 채팅 직행 |
| `src/constants/prompts.ts` | 캡션 채팅용 시스템 프롬프트 변형 추가 |

## Risks & dependencies

- `historyStore`는 현재 AsyncStorage에 저장되나, chatMessages 추가 시 저장 데이터 크기 증가 가능. 메시지당 ~500바이트 가정, 6회 교환 = ~6KB — 허용 범위 내.
- description.tsx의 `useEffect` cleanup이 현재 `flushSession`을 호출 중 — 저장 로직으로 교체 필요.
- 캡션 채팅은 `sessionId` 없이 채팅 화면을 시작해야 하므로 임시 sessionId 생성 필요.
- manual.tsx 파일 구조 확인 필요 (현재 탐색에서 미조회).

## Open questions (for Manager → user)

- [x] 몰입 재생목록 화면에서도 채팅 보기가 필요한가? → 우선 diary/ticket 화면에만 구현, 재생목록은 P1로 분리

## Feature breakdown (for Chris)

1. AC-1: `historyStore`에 `chatMessages` 필드 + `saveChatMessages()` 액션 추가
2. AC-1: `description.tsx` unmount cleanup → flush 대신 save
3. AC-2: `diary/[date].tsx`에 채팅 내역 읽기 전용 UI 섹션 추가
4. AC-3 & AC-4: `manual.tsx`에 캡션 입력 필드(옵션) + "바로 질문하기" 버튼 추가
5. AC-3 & AC-4: `prompts.ts`에 캡션 채팅용 시스템 프롬프트 추가, 채팅 직접 진입 라우팅
