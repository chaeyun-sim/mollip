---
feature-slug: premium-paywall
author: sam
status: pass
---

# Design brief — revised after user feedback

## Design intent

- 네 번째 시안은 이미지의 짙은 갈색·검정 배경을 화면 전체로 확장한다.
- 스크롤 없이 한 화면에 사진, 제목, 혜택, 가로 상품 카드, CTA를 배치한다.
- 이미지와 동일한 어두운 톤 위에 흰 텍스트를 사용하고 1주 상품만 보라색으로 강조한다.

## Tokens (defaults)

- Background `#171412`, ink `#FFFFFF`, selected surface `#30233D`, primary `#7C3AED`.
- Pretendard UI, Hahmlet 제목. 20px 안팎 카드 radius.

## Layout & components

| 영역 | 설명                                           | 재사용 컴포넌트                |
| ---- | ---------------------------------------------- | ------------------------------ |
| 상단 | 작품 이미지 위 브랜드 배지와 닫기              | `ImageBackground`, `Pressable` |
| 본문 | 중앙 제목·설명, 체크 표시 혜택                 | `Text`, `Ionicons`             |
| 상품 | 1일/1주/1달 가로 비교, 주간 선택 강조          | `Pressable`                    |
| 하단 | 선택 상품 청구 조건, 결제 준비 상태, 약관 링크 | `Pressable`                    |

## Design decisions

- 주간 ₩6,990/주를 가장 크게, 약 ₩999/일은 보조로 표시한다.
- 1일은 자동 갱신이 아닌 이용권으로 표기한다.
- 무료 체험 자격은 아직 확인할 수 없어 `3일 무료 체험 예정`으로 표기한다.
- 모든 가격은 출시 시 실제 StoreKit 현지화 가격으로 교체한다.

## Copy (KO)

| Element | Text                                 |
| ------- | ------------------------------------ |
| Title   | 전시 앞에서, 더 깊이 몰입하는 시간   |
| CTA     | 결제 기능 준비 중                    |
| Terms   | 3일 체험 후 ₩6,990/주 자동 갱신 예정 |

## States

- Loading: 현재 상품 조회 없음.
- Empty: 상품 3종 고정 시안.
- Error: 결제 버튼은 항상 비활성.
- Success: 선택 카드와 조건 문구 변경.

## Accessibility

- 선택 카드와 닫기 최소 44pt, `accessibilityRole`/`accessibilityLabel`/선택 상태 제공.
- 가격·체험·갱신은 색상 외 텍스트로 구분. 보조 텍스트도 충분한 명도.

## Prototype scope

- [x] Static layout
- [x] Navigation wired
- [x] Local selection interaction

## Out of design scope

- 실제 결제/복원 동작.
