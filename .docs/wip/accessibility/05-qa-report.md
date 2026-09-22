---
feature-slug: accessibility
author: taylor
status: pass
---

# QA Report — 접근성 개선

## 2026-09-21 재검증 — 회귀 발견 및 스펙 정리

최초 QA(정적 검증)는 Pass로 처리했으나, 실제 코드를 재확인한 결과 AC-3(고대비 토글 UI)를 켤 UI 진입점이 어디에도 없었다(설정 화면 리팩터 과정에서 소실). AC-4/AC-5 렌더링 로직은 정상이었으나 `highContrast`가 영원히 `false`로 고정되어 실행될 수 없는 죽은 코드였다. 사용자 확인 결과 고대비 모드(AC-3/4/5) 전체를 제거하기로 결정 — `01-spec-amendment-memo.md` 참고.

| AC                            | tsc         | 로직                                                                                              | 비고                                      |
| ------------------------------ | ----------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| AC-1 텍스트 크기 설정 UI       | ✅ 0 errors | `NarrationSettingsFields`에 `[소\|중\|대]` 토글 존재                                                | ⚠️ 아래 잔여 이슈 참고                     |
| AC-2 chat 화면 fontSize 적용   | ✅          | `ChatMessage`에서 `getEffectiveFontSize` 사용                                                       |                                            |
| ~~AC-3/4/5 고대비 모드~~       | 제거        | 관련 코드 전량 삭제(`settingsStore`, `Screen`, `description.tsx`, `chat.tsx`, `ChatMessage.tsx`)     | `bg-[#F0EFED` 괄호 누락 버그도 함께 해소   |

## 잔여 이슈 (P1 — 이번 재검증 스코프 밖, 별도 확인 필요)

AC-1의 UI(`NarrationSettingsFields`, `/settings/narration`)는 존재하지만, `(tabs)/settings.tsx`에서 이 화면으로 가는 "해설 설정" 카드가 `locked`+`disabled`("출시 예정") 상태라 사용자가 현재 도달할 수 없다. 고대비 제거와는 별개 이슈이며 이번 턴에서는 손대지 않음.

## 검증

- `npx tsc --noEmit` ✅ 0 errors
- `npm test -- --runInBand` ✅ 26 suites / 252 tests

## P0 버그 없음
