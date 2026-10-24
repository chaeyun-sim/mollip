---
feature-slug: home-editorial-refresh
author: taylor
status: pass — iPhone 15 시뮬레이터 검증 완료 (일부 미검증 항목 명시)
---

# QA report

## Summary

- P0/P1: 확인된 범위 내 0건
- Tier: M
- Date: 2026-10-05
- 환경: iPhone 15 (iOS 17.0, UUID 56F1783E-…), `com.simune.mollip` 개발 빌드, Maestro로 탭·스와이프. 로그인된 프리미엄 계정 상태. 구매·데이터 쓰기 동작은 하지 않았다.
- 이전 iPhone 16 Pro 네이티브 모듈 오류는 오래된 빌드 문제였고 현재 환경에서는 재현되지 않는다. 이전 증빙은 `STALE-iphone16-*`로 이름을 바꿔 보존(이전 설명 "개발 서버 선택 대화상자"는 부정확했으므로 폐기).

## QA checks

- Q1 `npx tsc --noEmit` 오류 0건 ✅
- Q2 `npm test` 33 suites / 260 tests 통과 ✅
- Q3 eslint(변경 2파일) 경고 0, prettier 통과 ✅
- Q5 Convention: `handle~`, 화살표 함수, 자식 전달 콜백 `useCallback`, 삼항 2갈래 ✅
- Q6 Visual / Q7 Interaction / Q8 Regression: 아래 표 참조

## 최종 수정 (태그라인 대비)

- `FeaturedExhibitionHero`: 태그라인을 `bg-[rgba(28,25,23,0.72)]` 둥근 배지 + `px-2.5 py-1` + 흰색 글자로 변경, 레이아웃 유지.
- `FEATURED_TAGLINES`: `특별전` / `인기 전시` / `곧 시작하는 전시`로 교체(과장 카피 제거).
- tsc 0건, `npm test` 33 suites / 260 tests 통과, 변경 2파일 prettier 통과.

## 이번 수정 (코드 리뷰 반영)

- 장소 비어 있으면 `장소 정보 없음` 표시 (`FeaturedExhibitionHero`)
- 히어로 `handlePress`, 홈의 `openExhibition`/`handleFeaturedScroll`/`renderItem`/구분자를 `useCallback`으로 감쌈
- `LinearGradient` 절대 위치 `style`을 `className="absolute inset-0"` 래퍼 View로 이동 (그라데이션은 `flex: 1`)
- 히어로 데이터가 없고 로딩도 아닐 때 헤딩 아래에 `지금 소개할 전시가 없어요` 빈 상태 표시
- 폭·개수 변경 시 `scrollToOffset`으로 실제 오프셋을 현재 페이지에 맞추고, 인덱스를 범위로 clamp

## 시뮬레이터 검증 결과

| 항목                                                                          | 결과 | 증빙                                      |
| ----------------------------------------------------------------------------- | ---- | ----------------------------------------- |
| 홈 상단 렌더링 (날짜 eyebrow·헤드·검색바·지도 버튼·히어로·`01 / 03`·도트·FAB) | ✅   | `iphone15-01-home-hero1.png`              |
| 히어로 2페이지 스와이프, `02 / 03`                                            | ✅   | `iphone15-02-hero2.png`                   |
| 히어로 3페이지, `03 / 03`, 마지막에서 추가 스와이프 시 그대로 유지            | ✅   | `iphone15-03-hero3.png`                   |
| 반대 방향 스와이프로 1페이지 복귀, `01 / 03`                                  | ✅   | `iphone15-04-swipe-back-hero1.png`        |
| 히어로 탭 → 전시 상세 (제목·장소·기간 확인)                                   | ✅   | `iphone15-05-exhibition-detail.png`       |
| 상세 뒤로 가기 → 홈 1페이지 복귀                                              | ✅   | `iphone15-06-detail-back-home.png`        |
| 검색바 탭 → 검색 화면, 뒤로 → 홈 (2페이지 상태 유지)                          | ✅   | `iphone15-07-search.png`                  |
| 지도 버튼 → 지도 탭                                                           | ✅   | `iphone15-08-map.png`                     |
| 지도 → 둘러보기 탭 복귀 시 `02 / 03` 페이지와 실제 카드가 일치                | ✅   | `iphone15-09-home-tab-restores-page2.png` |
| 세로 스크롤(인기·곧 개봉·개인화 추천 섹션)과 상단 복귀                        | ✅   | `iphone15-10-vertical-scroll.png`         |
| AI 도슨트 FAB → 해설 생성 화면 (프리미엄 계정)                                | ✅   | `iphone15-11-docent-fab.png`              |
| 북마크 아이콘 → 북마크 화면 (읽기 전용)                                       | ✅   | `iphone15-12-bookmark.png`                |

## 미검증 / Manual QA Required

- 비로그인 상태의 `LoginRequiredPressable` 동작, 비프리미엄 계정의 `/settings/premium` 분기 (현재 시뮬레이터는 프리미엄 로그인 계정이며 계정 전환·결제는 하지 않음)
- 장소 비어 있는 전시의 `장소 정보 없음` 렌더링, 히어로 0건 빈 상태, 화면 회전/작은 화면(SE)에서의 오프셋 보정은 코드로만 확인했고 실기 렌더링은 확인하지 못했다.
- 태그라인 대비 최종 수정은 코드·정적 검증만 했다. 수정 후 홈 렌더링은 시뮬레이터에서 확인하지 못했다(시뮬레이터가 북마크 화면에 머물렀고 Maestro 복귀 1회 시도 실패). 위 표의 홈 스크린샷은 수정 전 상태다. Manual QA Required.
- 알림 아이콘 탭, 네트워크 장애 등 Exception QA는 수행하지 않았다.

## Findings

### P0/P1

- 없음

### P2

- 상세 화면 기간 표기가 `D-D-6` (이번 변경 범위 밖의 기존 상세 화면 문제로 보이며 수정하지 않았다).

## Recommendation

- [x] Manager handoff 가능 (미검증 항목은 06에 명시)
