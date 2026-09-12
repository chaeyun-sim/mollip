---
feature-slug: audio-replay
author: sam
status: approved
---

# Design Brief — 저장된 해설 다시 듣기

## Design Intent

BottomSheet 헤더 우측에 재생 버튼 1개 추가. 별도 플레이어 UI 없음.

## 버튼 배치

- 위치: BottomSheet 헤더 행 — 제목 / 닫기 버튼 사이의 우측
- 닫기 버튼 왼쪽에 재생 버튼 배치
- 아이콘: `Ionicons`
  - 로딩: `ActivityIndicator` size='small' color='#60A5FA'
  - 재생: `'play-circle'` size=28 color='#60A5FA'
  - 일시정지: `'pause-circle'` size=28 color='#60A5FA'
- hitSlop=8, `accessibilityRole='button'`

## 색상

BottomSheet 배경 `#1C1917` 유지. 버튼 색상 `#60A5FA` (description 화면 재생 버튼과 통일).
