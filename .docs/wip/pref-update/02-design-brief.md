---
feature-slug: pref-update
author: sam
status: approved
---

# Design Brief — 내 취향 업데이트

## Design intent

설정 안에서 온보딩을 "가볍게 재경험"하는 느낌. 온보딩의 화려한 그라데이션 배경은 유지하되,
헤더는 settings 스타일(뒤로가기 + 타이틀)로 바꿔 "설정 내 서브화면"임을 명확히 한다.
완료 화면 CTA는 온보딩의 "다음으로" → "저장하기"로 변경한다.

## Tokens (defaults)

- Background: `#F8F6F2` + LinearGradient `['#FFF3E6','#F7DFCE','#E4CCE8','#F8F6F2']` (온보딩 동일)
- Ink: `#1C1917`
- Muted: `#6B6360`
- Font: Pretendard (UI), Hahmlet (display title)
- CTA: `bg-[#1C1917]` rounded-[18px] py-[18px]

## Layout & components

| 영역 | 설명 | 재사용 컴포넌트 |
|------|------|-----------------|
| 헤더 | `Screen.Header.Back` (color `#1C1917`) + Center 텍스트 "내 취향 수정" | `Screen.Header` |
| 진행 바 | 카드 12개 기준 점 진행 바 | onboarding/index.tsx 동일 패턴 |
| 카드 스택 | 스와이프 카드 3장 미리보기 | `OnboardingSwipeCard` |
| 하단 버튼 | 패스(X) / 선택(♥) 버튼 쌍 | onboarding/index.tsx 동일 패턴 |
| 완료 상태 | 이모지 + 설명 텍스트 + "저장하기" CTA | — |
| 설정 진입점 | `settings/index` → 계정 섹션 하단에 CardRow 추가 | `CardRow` |

## Copy (KO)

| Element | Text |
|---------|------|
| 화면 타이틀 | 내 취향 수정 |
| 부제 | 마음에 드는 그림을 저장하면 맞춤 전시를 추천해드릴게요 |
| 완료 이모지 | 🎨 |
| 완료 타이틀 | 완료! |
| 완료 설명 (선택 있음) | `{N}개의 취향을 저장했어요\n맞춤 전시를 추천해드릴게요` |
| 완료 설명 (선택 없음) | 다음에 취향을 설정해도 괜찮아요 |
| CTA | 저장하기 |
| 설정 메뉴 라벨 | 내 취향 수정 |

## States

- 스와이프 중: 카드 스택 + 진행 바 + 버튼 쌍
- 완료 (liked ≥ 1): 🎨 완료! + N개 저장 문구 + "저장하기" 버튼
- 완료 (liked = 0): 🎨 완료! + "다음에 설정해도 괜찮아요" + "저장하기" 버튼
- 저장 중: 버튼 opacity 0.6 (별도 로딩 UI 불필요 — 저장이 빠름)

## Accessibility

- `Screen.Header.Back` accessibilityLabel 기본값 사용
- 패스/선택 버튼: `accessibilityRole='button'` + label 유지
- CTA: `accessibilityLabel='저장하기'`

## Out of design scope

- 카드 애니메이션 변경 없음
- 저장 실패 토스트 없음 (fire-and-forget, 온보딩과 동일 정책)
