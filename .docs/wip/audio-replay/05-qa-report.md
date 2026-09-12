---
feature-slug: audio-replay
author: taylor
status: pass
---

# QA Report — 저장된 해설 다시 듣기

| AC | tsc | 로직 | 비고 |
|----|-----|------|------|
| AC-1 재생 버튼 표시 | ✅ 0 errors | BottomSheet 헤더 우측에 play-circle / pause-circle 아이콘 | |
| AC-2 TTS 재생 | ✅ | `speak(selected.text)` 호출, 로딩 중 ActivityIndicator | ElevenLabs in-memory 캐시 활용 |
| AC-3 일시정지/재개 | ✅ | `isSpeaking` 분기로 pause / speak 전환 | |
| AC-4 시트 닫으면 중단 | ✅ | `handleSheetClose`에서 `stop()` 호출 | 카드 전환 시에도 `stop()` 호출 |

## 회귀

- 북마크 삭제(하트 버튼) 동작 변경 없음
- 목록 비어있을 때 빈 상태 UI 변경 없음

## 시뮬레이터 미실행

실기기 TTS 재생은 ElevenLabs API 키 필요. 정적 검증으로 대체.

## P0 버그 없음
