---
feature-slug: visit-record-v2
author: chris
---

# Dev notes

## 새 파일

- 화면: `app/diary/record/index.tsx`(고르기) · `checkin.tsx` · `write.tsx`
- 컴포넌트 `src/components/record/`: RecordStepHeader, RecordExhibitionRow, ManualRecordForm, BoardingPassPreview, StampRating, PhotoSlots, KeywordPicker
- `src/store/recordDraftStore.ts`(3단계 공유 드래프트), `src/utils/visitRecord.ts`(동행·방문일 칩·키워드), `src/utils/pickPhotos.ts`

## 변경

- `visitStore`: `DayVisit.companion/keywords`, `saveRecord`(새 관람·도슨트 미확정을 같은 키로 확정)
- `localVisitDb`: companion·keywords 컬럼 + 기존 DB `ALTER TABLE`, slim 오버레이에 포함
- `useVisitSync`: 원격 로드 시 동행·키워드 로컬 값 유지
- `visitPhotos.uploadVisitRecordPhotos`: 기록별 해시 이름(같은 날 덮어쓰기 방지)
- `DatePickerModal.minimumDate` 추가
- 다이어리 FAB → 라벨형 '기록하기', 미확정 배너 → 기록하기
- 영감 한 줄 150자(AI 감상 2~3문장 길이에 맞춤, spec의 100자에서 조정)

## 삭제

- `app/diary/verify-ticket.tsx`, `app/diary/confirm-visits.tsx`
- `ReceiptSummary`, `EssayInputSection`, `SignaturePad` (위 화면 전용)

## 남은 정리 후보 (이번 범위 밖)

- `MiniBarcode.tsx`: 이번 변경 전부터 사용처 0
- Nanum Pen Script 폰트: SignaturePad 삭제로 사용처 0 — `_layout.tsx` 로드·tailwind 등록 제거 검토

## 사용자 피드백 반영 — 체크인 화면 제거 (3단계 → 2단계)

- `app/diary/record/checkin.tsx` 삭제. 방문일·동행은 `CheckinFields` 컴포넌트로 옮겨 기록 화면 맨 위(탑승권 바로 아래)에 둔다.
- 기록 화면이 탑승권을 실시간으로 채우는 역할까지 맡는다. 저장 버튼이 비어 있는 항목(방문일 → 동행 → 별점) 순서로 안내한다.
- `toPassDate`를 `utils/visitRecord`로 옮기고 테스트 추가. 헤더 `n/2`.
- 증빙: `evidence/12-write-merged.png`

## 사용자 피드백 반영 — 직접 기록 바텀시트

- 검색 결과가 없을 때 나타나는 기존 직접 기록 진입 조건을 그대로 유지하고, 입력 UI만 `BottomSheetModal`로 이동.
- 검색 중이던 키보드를 닫은 뒤 시트를 열며 검색어를 전시 이름에 전달한다. 제출 후 시트가 닫힌 다음 기록 화면으로 이동한다.
- `BottomSheetTextInput`과 `BottomSheetScrollView`를 사용하고, 시트 컨테이너 `accessible={false}`로 자식 입력·버튼이 접근성 트리에서 노출되게 했다.
- 시트 전용 제목·설명, 44pt 닫기 버튼, safe area 하단 여백 적용.
- 증빙: `evidence/manual-sheet-flow.yaml`, `manual-sheet-open.png`, `manual-sheet-submit-result.png`.
