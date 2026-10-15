---
feature-slug: home-catalogue
author: taylor
verdict: Pass
---

# QA report — iPhone 15 시뮬레이터

| AC               | Q1 tsc      | Q2 test | Q6 스크린샷                | Q7 인터랙션                                                                | Q8 회귀                                    |
| ---------------- | ----------- | ------- | -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| AC-1 마스트헤드  | ✅ 0 errors | ✅      | `evidence/ac1-top.png`     | 도슨트 → 작품 해설 생성기(`int-docent.png`), 지도 → 지도 탭(`int-map.png`) | 둘러보기 탭 복귀 정상(`int-back-home.png`) |
| AC-2 커버 + 도판 | ✅          | ✅      | `evidence/ac2-plates.png`  | 커버 탭 → 상세(`int-cover-detail.png`)                                     | 상세 화면 정상                             |
| AC-3 마감 목차   | ✅          | ✅      | `evidence/ac3-closing.png` | 행 탭 → 상세(`int-closing-detail.png`)                                     | —                                          |
| AC-4 추천 목차   | ✅          | ✅      | `evidence/ac4-bottom.png`  | 렌더 확인 (탭은 AC-3과 동일 컴포넌트)                                      | 탭바에 가리지 않음                         |

- Q2: `npm test` — 앱 테스트 전부 통과(`formatHomeDate` 신규 포함). 실패 11개 suite는 `.agents/skills/claude-to-im` (변경 전에도 동일하게 실패, 무관).
- Q5: eslint 0 / prettier 통과.
- Q3 edge: 대표 전시 0개 → 문구, 로딩 → 4:5 스켈레톤, 마감 0개 → 섹션 숨김 + 추천 번호 02로 당김(코드 확인). 커버 기간 라벨은 featured 데이터에 기간이 없으면 장소만 표시(현재 데이터가 그 경우).

## 미검증 / Manual QA Required

- 비로그인·비프리미엄 상태의 도슨트 버튼 라우팅 (로직은 기존 FAB 핸들러 그대로 재사용).
- 추천 에러 → 다시 시도 (네트워크 차단 필요).
- 작은 화면(SE) 2열 도판 캡션 줄바꿈.
