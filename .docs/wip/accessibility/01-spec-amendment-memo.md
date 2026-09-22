---
feature-slug: accessibility
author: manager
status: approved
supersedes: AC-3 고대비 모드 토글, AC-4 고대비 — description 화면, AC-5 고대비 — chat 화면
---

# Spec amendment — 고대비 모드 제거

## Decision

- **Remove** 고대비 모드 전체 (AC-3/AC-4/AC-5).
- AC-1(텍스트 크기 UI), AC-2(chat fontSize 적용)는 유지.

## Rationale

- QA 재검증(2026-09-21) 중 고대비 모드가 백엔드 로직(`highContrast` state, description/chat 렌더링 분기)은 있었으나 이를 켤 수 있는 UI 진입점이 어디에도 없어(설정 화면 리팩터 과정에서 소실) 사용자가 절대 도달할 수 없는 죽은 코드 상태였음을 발견.
- 사용자 확인 결과 기능을 되살리는 대신 **제거**하기로 결정.

## 제거 내용

| 파일 | 변경 |
| ---- | ---- |
| `src/store/settingsStore.ts` | `highContrast`, `setHighContrast` 제거, `getEffectiveFontSize(fontSize, highContrast)` → `getEffectiveFontSize(fontSize)` |
| `src/components/layout/Screen.tsx` | `highContrast` prop 및 분기 제거 |
| `app/(guide)/description.tsx` | highContrast 배경·텍스트 분기 제거 (기본 dark 스타일만 유지) |
| `app/(guide)/chat.tsx` | highContrast 배경·텍스트·키보드 분기 제거, `HIGH_CONTRAST_COLOR` 상수 제거 |
| `src/components/guide/ChatMessage.tsx` | highContrast 버블·텍스트 분기 제거 (제거 과정에서 `bg-[#F0EFED` 괄호 누락 버그도 함께 해소) |

## 검증

- `npx tsc --noEmit` 0 errors
- `npm test` 26 suites / 252 tests pass
