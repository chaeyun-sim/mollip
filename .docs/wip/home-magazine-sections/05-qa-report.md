---
feature-slug: home-magazine-sections
author: taylor
device: iPhone 15 시뮬레이터 (iOS 17.0), 로그인·프리미엄 계정
---

# QA report

## AC 검증

| AC               | tsc | jest     | 스크린샷                                 | 인터랙션                                                 | 회귀                |
| :--------------- | :-- | :------- | :--------------------------------------- | :------------------------------------------------------- | :------------------ |
| AC-0 유틸        | ✅  | ✅ 13/13 | —                                        | —                                                        | —                   |
| AC-1 인기 TOP 5  | ✅  | ✅       | `evidence/ac1-popular.png`               | 1위 탭 → 상세 → 뒤로 ✅ (`i1-popular-tap.png`)           | 캐러셀·헤더 정상    |
| AC-2 마감 임박   | ✅  | ✅       | `ac2-closing-c.png`                      | 레일 표시·D-day 칩 ✅                                    | —                   |
| AC-3 오늘의 명화 | ✅  | ✅       | `ac3-artwork.png`                        | CTA → 해설 생성 → ← 홈 복귀(스크롤 유지) ✅ (`i3-*.png`) | `/description` 정상 |
| AC-4 추천 매거진 | ✅  | ✅       | `ac4-rec.png`, `ac4-rec-lead.png`        | 리드 카드 탭 → 상세 ✅ (`i2-closing-tap.png`)            | —                   |
| AC-5 국립        | ✅  | ✅       | `ac5-national.png`, `i3-artwork-cta.png` | 전체 → `/search?q=국립` ✅ (`i5-national-all.png`)       | 검색 화면 정상      |

전체: `npx tsc --noEmit` 0 errors · jest 35 suites / 279 passed · eslint 0 · prettier ✅

## 발견·수정

| 단계 | 문제                                                           | 조치                 |
| :--- | :------------------------------------------------------------- | :------------------- |
| AC-1 | 구분선 미표시                                                  | `border-b-[0.5px]`   |
| AC-2 | Pressable 함수형 style의 width가 적용 안 돼 제목이 가로로 넘침 | 고정 폭 View 래퍼    |
| AC-2 | 14일 기준 실데이터 1건                                         | 레일 범위 30일       |
| 통합 | 같은 전시가 인기·마감·추천·국립에 반복                         | 위→아래 순 중복 제거 |
| 통합 | 중복 제거로 국립이 비면 "진행 중인 전시가 없어요" 오표시       | 그때는 섹션 숨김     |

## Exception QA

| 시나리오                      | 결과                                                                                                          |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------ |
| Met API 실패/오프라인         | 코드 확인: `ImageFallback` 플레이스홀더, CTA 동작 유지. **미검증 / Manual QA Required**(네트워크 차단 미실행) |
| 구독 상태 로딩 중 CTA 탭      | 코드 확인: no-op (FAB와 동일)                                                                                 |
| 비로그인 CTA 탭               | 코드 확인: `LoginRequiredPressable` → 로그인. **미검증 / Manual QA Required**                                 |
| 비프리미엄 CTA 탭             | 코드 확인: `/settings/premium`. **미검증 / Manual QA Required**                                               |
| 자정 경계                     | `getDailyIndex` 로컬 자정 기준 테스트 ✅. 앱이 켜진 채 자정을 넘기면 다음 렌더 시 바뀜                        |
| 썸네일 URL은 있으나 로드 실패 | 리드 카드가 플레이스홀더로 표시됨(「흑백의 분투」) — 데이터 문제, 렌더 전 판별 불가                           |

## 범위 밖 발견 (수정 안 함)

- 전시 상세 화면 기간 옆 라벨이 **`D-D-1`**로 중복 표기됨.

## 최종 상태 (커밋 시점)

이 리포트의 AC-1(인기)·AC-5(국립)은 이후 사용자 피드백으로 제거됐다. 최종 구성과 검증은 `06-handoff-to-user.md`, 단계별 변경은 `04-dev-notes.md` 참고.
