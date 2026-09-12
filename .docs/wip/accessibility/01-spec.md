---
feature-slug: accessibility
tier: M
author: john
status: approved
---

# Spec — 접근성 개선 (텍스트 크기 + 고대비 모드)

## Problem

- `fontSize` 설정이 `description.tsx` 하나에만 적용됨 (chat 화면 등 미적용)
- 설정 화면에 폰트 크기 변경 UI 자체가 없어 사용자가 바꿀 방법 없음
- 고대비 모드 없음

## Goals

- 설정 화면에 텍스트 크기 토글 추가
- fontSize를 chat 화면 메시지 텍스트에도 적용
- 고대비 모드 추가 (배경 흰색, 텍스트 검정) — description·chat 화면 적용

## Non-goals

- explore, search 등 콘텐츠 탐색 화면까지 고대비 적용 (별도 작업)
- 고대비 모드에서 이미지/아이콘 색 역전

## Acceptance Criteria

### AC-1: 텍스트 크기 설정 UI

- **Given** 설정 화면 → 해설 생성 설정 섹션
- **When** 화면을 본다
- **Then** "텍스트 크기" 행에 [소 | 중 | 대] 토글이 표시되고 탭하면 즉시 변경된다

### AC-2: chat 화면 fontSize 적용

- **Given** 텍스트 크기를 "대"로 설정한다
- **When** 채팅 화면에서 AI 답변을 본다
- **Then** 메시지 텍스트가 20px로 표시된다

### AC-3: 고대비 모드 토글

- **Given** 설정 화면 → 접근성 섹션
- **When** "고대비 모드" 스위치를 켠다
- **Then** 즉시 설정이 저장되고 (guide) 화면들에 반영된다

### AC-4: 고대비 — description 화면

- **Given** 고대비 모드가 켜진 상태
- **When** AI 해설 화면을 본다
- **Then** 배경 흰색, 해설 텍스트 검정, 하단 플레이어 흰 배경으로 표시된다

### AC-5: 고대비 — chat 화면

- **Given** 고대비 모드가 켜진 상태
- **When** 채팅 화면을 본다
- **Then** 배경 흰색, AI 메시지 버블 밝은 회색 배경, 텍스트 검정으로 표시된다

## 파일

| 파일 | 변경 |
|------|------|
| `src/store/settingsStore.ts` | `highContrast`, `setHighContrast`, `getEffectiveFontSize` 추가, version 2 |
| `src/data/mypage.ts` | `FONT_SIZE_OPTIONS` 추가 |
| `src/components/layout/Screen.tsx` | dark variant에 `highContrast` prop 추가 |
| `app/settings/index.tsx` | 텍스트 크기 행 + 접근성 섹션 추가 |
| `app/(guide)/description.tsx` | highContrast 배경·텍스트·플레이어 분기 |
| `app/(guide)/chat.tsx` | highContrast Screen 전달 + 입력창 분기 |
| `src/components/guide/ChatMessage.tsx` | fontSize 동적 적용 + highContrast 버블 분기 |
