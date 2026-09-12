---
feature-slug: main-editorial-redesign
author: taylor
status: final
---

# QA report

## Summary

- P0: 0 required for handoff — 0 remaining
- Tier: L
- Date: 2026-08-25

## AC matrix

| AC | Q1 tsc | Q2 jest | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact | Q8 regress | Q9 perf |
|----|--------|---------|--------|-------|---------|-----------|---------------|------------|---------|
| AC-1 마스트헤드 헤더 | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | N/A(정적) | ✅ | ✅ |
| AC-2 히어로 에디토리얼 | ✅ | N/A | ✅(줄바꿈 리스크 사전 방지 설계로 회귀 없음) | ✅ | ✅ | ✅ | N/A(정적) | ✅ | ✅ |
| AC-3 커버스토리 | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AC-4 인덱스 리스트 | ✅ | N/A | ✅(1차 발견 후 수정) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AC-5 KCISA 넘버링 | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Findings

### P0 (ship blocker)

- 없음

### P1

- 없음(발견된 1건은 Chris 자가 수정 루프에서 즉시 해결)

### P2

- 없음

## 발견 및 수정 이력 (자가 수정 루프)

1. **AC-4 버그**: 인덱스 리스트 번호 컬럼 너비를 `w-8`(32px)로 고정했더니 "04"가 "0"/"4" 두 줄로 줄바꿈됨(01~03은 정상, 04에서만 재현). → `w-10`(40px) + `numberOfLines={1}`로 여유 폭을 확보해 모든 번호가 한 줄로 표시되도록 수정. 스크린샷으로 01~04 전부 재확인.
2. **AC-2 사전 리스크 관리**: 이전 Tier M 작업(`main-hero-visual-boost`)에서 이미지 확대+폰트 확대를 동시에 해 타이틀이 4줄로 wrap되는 회귀를 겪은 바 있어, 이번엔 이미지를 절대 위치(`position: absolute`)로 텍스트 컨테이너 폭 계산에서 완전히 제외하는 방식으로 설계 — 같은 유형의 회귀가 재발하지 않음을 스크린샷으로 확인.

## Evidence

| ID | Path | Description |
|----|------|-------------|
| E1 | `evidence/ac1-header.png` | AC-1 — 마스트헤드 헤더(로고 확대+룰선+날짜 eyebrow) |
| E2 | `evidence/ac2-hero.png` | AC-2 — 히어로 에디토리얼 재설계, 2줄 고정 확인 |
| E3 | `evidence/ac3-coverstory.png` | AC-3 — COVER STORY 라벨+룰선, 확대된 타이틀 |
| E4 | `evidence/ac4-fix-04.png` | AC-4 — 인덱스 리스트 01~04 전부 정상(버그 수정 후) |
| E5 | `evidence/ac5-kcisa-check.png` | AC-5 — KCISA 카드 01/02/03 넘버링 오버레이 |
| E6 | `evidence/interaction-kcisa-tap.png` | 인터랙션 — KCISA 카드 탭 → 상세 이동 확인 |
| E7 | `evidence/regression-cold-launch-clean.png` | 회귀 — 앱 콜드 리런치 후 메인 화면 정상 렌더링(5개 AC 모두 유지) |
| E8 | `evidence/regression-exhibitions-tab2.png` | 회귀 — 전시 탭(GridExhibitionCell 재사용) 정상, 헤더 영향 없음 |

## Regression paths walked

1. 메인 → KCISA 카드 탭 → 전시 상세 화면 진입 확인 (정상)
2. 앱 콜드 리런치 → 메인 화면 첫 진입 렌더링 확인 (정상, 5개 AC 모두 유지)
3. 메인 → 전시 탭 이동 확인 (정상, `GridExhibitionCell`/`Screen.Header.Logo` 등 공유 컴포넌트 영향 없음)

## Recommendation

- [x] Ready for Manager handoff
- [ ] Return to Chris (Dev)
