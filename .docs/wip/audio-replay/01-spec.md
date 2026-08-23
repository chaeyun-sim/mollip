---
feature-slug: audio-replay
tier: M
author: john
status: approved
---

# Spec — 저장된 해설 다시 듣기

## Problem

- `settings/bookmark/audio.tsx`에서 저장된 AI 해설을 텍스트로 읽을 수는 있지만 TTS 재생이 불가능
- 사용자가 원하는 건 "다시 듣기" — 텍스트 열람이 아님

## Goals

- 저장된 해설 BottomSheet에서 TTS 재생/일시정지 버튼 추가
- 기존 `useTTS` 훅 재사용 (ElevenLabs 호출 + in-memory 캐시)

## Non-goals

- TTS 오디오를 FileSystem에 오프라인 저장
- 재생 진행 바 / seek 기능 (기본 재생/정지만)
- 배경 재생 (화면 벗어나면 중단)

## Acceptance Criteria

### AC-1: 재생 버튼 표시

- **Given** 저장된 해설 목록에서 항목을 탭해 BottomSheet를 연다
- **When** BottomSheet가 열린 상태
- **Then** 제목 영역 옆에 재생 버튼이 표시된다

### AC-2: TTS 재생

- **Given** BottomSheet가 열려 있고 재생 버튼을 탭한다
- **When** TTS 로딩 중
- **Then** 로딩 인디케이터가 표시되고 완료 후 재생이 시작된다

### AC-3: 일시정지 / 재개

- **Given** TTS가 재생 중
- **When** 버튼을 탭한다
- **Then** 일시정지되고 다시 탭하면 재개된다

### AC-4: BottomSheet 닫으면 중단

- **Given** TTS가 재생 중
- **When** BottomSheet를 닫는다
- **Then** TTS가 중단된다

## 파일

| 파일 | 변경 |
|------|------|
| `app/settings/bookmark/audio.tsx` | BottomSheet에 TTS 재생 버튼 추가 |
