---
feature-slug: diary-ticket-back
author: manager
status: done
---

# Handoff — 관람 티켓 뒷면 (오늘의 프로그램 + 나의 관람 메모)

## 한 줄 요약

티켓 뒷면을 AI 일기에서 **들은 작품 프로그램 목록 + 나의 관람 메모**로 교체했습니다.

## 변경 내용

| 항목 | 변경 |
|------|------|
| `app/diary/[date].tsx` | 헤더 refresh 제거 → ✏️(메모 편집) 버튼, `listenedItems` pass-through |
| `src/components/archive/VisitTicket.tsx` | 뒷면 = 「오늘의 프로그램」 목록 + `TicketVisitMemo` |
| `src/store/visitStore.ts` | `DayVisit.memo`, `setVisitMemo` 추가 |
| AI 일기 | `diaryStore`, `useDiaryEntry`, `DIARY_PROMPT` 전체 제거 |

## QA 결과

| 항목 | 결과 |
|------|------|
| tsc | ✅ 0 errors |
| 테스트 | ✅ 28/28 |
| 뒷면 empty state | ✅ 시각 확인 |
| 메모 모달 + 키보드 | ✅ 인터랙션 확인 |
| 앞면·플립 회귀 | ✅ 정상 |
