---
feature-slug: diary-ticket-back
author: john
status: approved
supersedes: AC-4 AI diary
---

# Spec amendment — AI 일기 제거 · 나의 관람 메모

## Decision

- **Remove** AI 도슨트 일기 (`useDiaryEntry`, `diaryStore`, `DIARY_PROMPT`, stream on ticket).
- **Add** **나의 관람 메모**: 사용자 직접 입력, `visitStore` `DayVisit.memo`, 티켓 뒷면 프로그램 아래.

## Rationale

- AI 일기는 차별점 없음.
- **내 손글씨 메모 + 들은 작품 프로그램** = mollip 기록 UX.

## AC-M1: 메모 persist

- **Given** `/diary/[date]`
- **When** 사용자가 메모 입력
- **Then** `setVisitMemo(dateKey, text)`로 저장·재진입 시 복원

## AC-M2: AI 제거

- **Then** 일기 스트리밍·generate CTA·`diary-entries` persist **없음**

## AC-M3: 플립 + 입력

- **When** 뒷면
- **Then** TextInput 포커스 가능 (앞면만 탭 플립, 뒷면 「← 앞면 보기」)
