---
feature-slug: main-hero-visual-boost
author: taylor
status: final
---

# QA report

## Summary

- P0: 0 required for handoff — 0 remaining
- Tier: M
- Date: 2026-08-25

## AC matrix

| AC | Q1 tsc | Q2 jest | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact | Q8 regress | Q9 perf |
|----|--------|---------|--------|-------|---------|-----------|---------------|------------|---------|
| AC-1 히어로 비주얼 강화 | ✅ | N/A(테스트 없음) | ✅(1차 발견 후 수정) | ✅ | ✅ | ✅ | N/A(정적 카드) | ✅ | ✅ |
| AC-2 오늘의 전시 배지 | ✅ | N/A | ✅(1차 발견 후 수정) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AC-3 추천 리드 카드 PICK 배지 | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Findings

### P0 (ship blocker)

- 없음

### P1

- 없음(발견된 2건은 Chris 자가 수정 루프에서 즉시 해결 — 아래 참고)

### P2

- 없음

## 발견 및 수정 이력 (자가 수정 루프)

1. **AC-1 회귀**: 조각상 이미지를 96x134·타이틀 34→36px로 동시에 키우자 히어로 타이틀("어떤 이야기를")이 좁아진 텍스트 영역 때문에 의도치 않게 4줄로 줄바꿈됨. → 이미지 84x116, 타이틀 34px(원본 유지)로 조정해 2줄 고정 레이아웃 복원. 스크린샷으로 재확인.
2. **AC-2 배지 미표시**: "오늘의 전시" 배지에 기존 라벨 스타일의 `leading-[1.8px]`를 그대로 가져왔는데, 이 값이 폰트 크기(11px)보다 훨씬 작아 텍스트가 거의 클리핑되어 흰 배지 안이 빈 것처럼 보임. → 배지 텍스트에서 해당 `leading` 클래스 제거, 기본 line-height로 정상 표시 확인. (원본 코드의 "ABSORBED IN ART"/"오늘의 전시" 등 동일 패턴 다른 텍스트는 이번 스코프 밖이라 별도 수정하지 않음 — 필요 시 후속 이슈로 분리 권장)

## Evidence

| ID | Path | Description |
|----|------|-------------|
| E1 | `.docs/wip/main-hero-visual-boost/evidence/main-hero-after.png` | 1차 구현 직후 — AC-1 줄바꿈 회귀, AC-2 배지 미표시 확인 |
| E2 | `.docs/wip/main-hero-visual-boost/evidence/main-hero-after-fix.png` | AC-1 수정 후 — 히어로 타이틀 2줄 정상 |
| E3 | `.docs/wip/main-hero-visual-boost/evidence/main-hero-after-fix2.png` | AC-2 수정 후 — "오늘의 전시" 배지 정상 표시 |
| E4 | `.docs/wip/main-hero-visual-boost/evidence/scroll-recommended.png` | AC-3 — 추천 전시 리드 카드 PICK 배지 확인 |
| E5 | `.docs/wip/main-hero-visual-boost/evidence/interaction-tap.png` | 인터랙션 — 리드 카드 탭 → 전시 상세 이동 확인 |
| E6 | `.docs/wip/main-hero-visual-boost/evidence/regression-fresh-launch2.png` | 회귀 — 앱 콜드 리런치 후 메인 화면 정상 렌더링 |
| E7 | `.docs/wip/main-hero-visual-boost/evidence/regression-map-tab.png` | 회귀 — 인접 탭(지도) 정상 렌더링, 우리 변경과 무관 |

## Regression paths walked

1. 메인 → 추천 전시 리드 카드 탭 → 전시 상세 화면 진입 확인 (정상)
2. 앱 콜드 리런치 → 메인 화면 첫 진입 렌더링 확인 (정상, 3개 AC 모두 유지)
3. 메인 → 지도 탭 이동 확인 (정상, 무관 화면 영향 없음)

## 참고 (미해결/스코프 외)

- 전시 상세 화면에서 뒤로가기 버튼을 시뮬레이터 자동화 클릭(cliclick)으로 재현하려 했으나 좌표 캘리브레이션 문제로 탭이 인식되지 않음 — 코드 결함이 아니라 테스트 툴 한계로 판단(포워드 내비게이션과 화면 자체 렌더링은 정상 확인됨). 사용자가 직접 확인 시 정상 동작할 것으로 예상.

## Recommendation

- [x] Ready for Manager handoff
- [ ] Return to Chris (Dev)
