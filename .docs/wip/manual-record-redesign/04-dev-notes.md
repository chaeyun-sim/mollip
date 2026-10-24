---
feature-slug: manual-record-redesign
author: Codex (Chris role, user-approved)
status: verified-with-limitations
---

# Dev notes

## Implemented ACs

AC-1: 폼 개편 후 사용자 수정 레이아웃 반영, 전시 기간을 단일 방문일로 교체.

## Implementation decisions

- `visitDate: Date | null`과 `isDatePickerOpen`으로 상태 단순화.
- 제출값 `visitDate?: string`은 로컬 날짜 YYYY-MM-DD. 화면 표시는 YYYY.MM.DD.
- 부모 `handleSubmitManual`에서 `draft.dateKey`로 전달. `fixedDateKey`는 설정하지 않아 다음 화면에서도 변경 가능.
- 미선택/선택 해제 시 undefined. 기존 write 화면이 오늘을 기본값으로 적용.
- 기존 write 화면과 동일하게 미래 날짜 제한.
- 사용자 제공 큰 포스터/헤더 없는 레이아웃 유지.
- 날짜 분기 잔재(field, period.start/end) 제거. 접근성 라벨 추가.

## Changed files

`src/components/record/ManualRecordForm.tsx`, `app/diary/record/index.tsx`.

## Native / env notes

네이티브 모듈 변경 없음. 전체 Jest 탐색에 포함되는 `.agents/skills/claude-to-im` 11 suites는 모듈 해석 오류. 앱 41 suites/307 tests 통과.

## QA notes

이전 단계의 prototype/keyboard/empty-disabled 이미지는 사용자 후속 레이아웃 수정 전 증거이며 최종 레이아웃 증거가 아니다.
