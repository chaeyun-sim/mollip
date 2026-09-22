---
feature-slug: accessibility
tier: M
author: john
status: approved
---

# Spec — 접근성 개선 (텍스트 크기)

> 고대비 모드(원 AC-3/4/5)는 2026-09-21 제거됨 — `01-spec-amendment-memo.md` 참고.

## Problem

- `fontSize` 설정이 `description.tsx` 하나에만 적용됨 (chat 화면 등 미적용)
- 설정 화면에 폰트 크기 변경 UI 자체가 없어 사용자가 바꿀 방법 없음

## Goals

- 설정 화면에 텍스트 크기 토글 추가
- fontSize를 chat 화면 메시지 텍스트에도 적용

## Non-goals

- explore, search 등 콘텐츠 탐색 화면까지 텍스트 크기 적용 확대 (별도 작업)

## Acceptance Criteria

### AC-1: 텍스트 크기 설정 UI

- **Given** 설정 화면 → 해설 생성 설정 섹션
- **When** 화면을 본다
- **Then** "텍스트 크기" 행에 [소 | 중 | 대] 토글이 표시되고 탭하면 즉시 변경된다

### AC-2: chat 화면 fontSize 적용

- **Given** 텍스트 크기를 "대"로 설정한다
- **When** 채팅 화면에서 AI 답변을 본다
- **Then** 메시지 텍스트가 20px로 표시된다

### ~~AC-3: 고대비 모드 토글~~ (2026-09-21 제거 — `01-spec-amendment-memo.md` 참고)

### ~~AC-4: 고대비 — description 화면~~ (제거)

### ~~AC-5: 고대비 — chat 화면~~ (제거)

## 파일

| 파일                                   | 변경                                          |
| -------------------------------------- | --------------------------------------------- |
| `src/store/settingsStore.ts`           | `getEffectiveFontSize` 추가                   |
| `src/data/mypage.ts`                   | `FONT_SIZE_OPTIONS` 추가                      |
| `src/components/mypage/NarrationSettingsFields.tsx` | 텍스트 크기 토글 UI (`/settings/narration`) |
| `app/(guide)/description.tsx`          | fontSize 적용                                 |
| `app/(guide)/chat.tsx`                 | fontSize 적용                                 |
| `src/components/guide/ChatMessage.tsx` | fontSize 동적 적용                            |
