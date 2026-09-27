---
feature-slug: net-01-purchase-recovery
author: sam
status: draft
---

> **정직성 노트**: 기존 `premium.tsx`의 헤더/베네핏 UI는 그대로 보존했다. 이 브리프는 provisional 구현에 이미 반영된 3개 상태(loading/error/uncertain) UI를 기존 디자인 시스템 토큰 기준으로 소급 검토한다.

# Design brief — 프리미엄 구매 상태 UI (NET-01)

## Design intent

기존 dark variant 프리미엄 화면의 시각 언어(어두운 배경, `#171412` 하단 바, `primary-dark` CTA)를 그대로 따르며, 3개 신규 상태(로딩/에러/불확실)를 추가 컴포넌트 없이 기존 톤의 텍스트+버튼 조합으로만 표현한다. 새 시각 요소를 도입하지 않는다.

## Tokens (defaults)

- Background: 화면 자체는 dark variant(`bg-gray900` 카드, `#171412` 하단 바) — `.docs/DESIGN_SYSTEM.md`의 warm 톤(`#F8F6F2`)은 이 화면에 적용되지 않음(기존 구현 유지)
- Ink: `white`, `white/65`, `white/80`, `white/85` (기존 화면에서 이미 사용 중인 투명도 스케일)
- Font: Pretendard (`font-pretendard-medium` / `-bold`) — 기존 화면과 동일
- Radius: 버튼 `rounded-[10px]`/`rounded-[12px]`, pill `rounded-full` — 기존 화면과 동일

## Layout & components

| 영역                    | 설명                                                                      | 재사용 컴포넌트                                     |
| ----------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| 로딩                    | 베네핏 카드 아래, 플랜 목록 자리에 중앙 정렬 스피너                       | `Indicator`                                         |
| 에러                    | 동일 영역에 안내 텍스트 + "다시 시도" pill 버튼                           | `Indicator`(N/A), 신규 `Pressable` (기존 톤 재사용) |
| 불확실(uncertain)       | 하단 CTA 바로 위 카드(`bg-white/[0.08]`)에 안내 텍스트 + "상태 확인" 버튼 | 기존 하단 바와 동일 배경 톤                         |
| 구매 완료 전환 오버레이 | 루트 전역, `bg-black/60` + 흰색 large `Indicator`                         | `Indicator`                                         |

## Design decisions

- 에러 문구는 AC-1에 명시된 문자열을 정확히 사용한다(임의 문구 금지).
- 불확실 상태는 별도 화면/모달이 아니라 기존 CTA 영역 바로 위 카드로 삽입해, 사용자가 맥락을 잃지 않게 한다.
- 구매 완료 전환 오버레이는 프리미엄 화면 자체가 아니라 루트에 배치해 화면 전환 애니메이션 위에서도 끊기지 않는다.

## Copy (KO)

| Element        | Text                                                         |
| -------------- | ------------------------------------------------------------ |
| Error          | `상품 정보를 불러오지 못했어요. 연결 후 다시 시도해 주세요.` |
| Retry CTA      | `다시 시도`                                                  |
| Uncertain body | `결제 확인이 필요해요. 아래 버튼으로 상태를 확인해 주세요.`  |
| Uncertain CTA  | `상태 확인`                                                  |
| Success toast  | `몰립 프리미엄이 시작됐어요!`                                |

## States

- Loading: 중앙 `Indicator` (white)
- Empty/Error: 안내 텍스트 + 재시도 pill
- Uncertain: 안내 카드 + "상태 확인" 버튼, 구매 버튼은 비활성(opacity 50%)
- Success: 루트 오버레이(어두운 반투명 + large indicator) → 해제 후 토스트

## Accessibility

- 모든 인터랙션 요소에 `accessibilityRole`/`accessibilityLabel` 부여(기존 화면 패턴 유지)
- 구매 버튼: `accessibilityState={{ disabled, busy }}` — 로딩/불확실/작업중 모두 반영
- 닫기 버튼: 작업 중(`isBusy`)일 때 `accessibilityState={{ disabled: true }}` + opacity 40%로 시각적으로도 구분
- 오버레이: `accessibilityViewIsModal`로 포커스 트랩

## Prototype scope

- [x] Navigation wired (기존 화면 그대로)
- [x] 실제 RevenueCat SDK 연동 (fake data 아님 — mock은 Jest 테스트에서만 사용)

## Out of design scope

- 신규 아이콘/일러스트 추가 없음
- Android 전용 UI 없음(§01-spec Non-goals)
