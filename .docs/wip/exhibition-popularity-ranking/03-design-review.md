---
feature-slug: exhibition-popularity-ranking
author: alex
iteration: 1
verdict: Pass
---

# Design review — 전시 인기 랭킹 (홈 "인기 전시" 섹션)

## Verdict

- **Pass**
- Iteration: 1 / 3

## Scores (1–5)

| Dimension            | Score   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens       | 5       | 신규 토큰 0개. 브리프 Tokens 표의 값을 실제 코드와 대조해 전부 일치 확인 — `KcisaExhibitionCard`의 `CARD_WIDTH = 148` / `CARD_HEIGHT = Math.round(148*4/3) = 197`, `rounded-[8px]`, 배지 `text-white text-[13px] font-hahmlet-bold` + `textShadowColor: 'rgba(0,0,0,0.5)'`, 카드 그림자 `colors.primary`/0.1/10/(0,4). 컬러는 전부 `.docs/DESIGN_SYSTEM.md` §1.3 정본 토큰(`#1C1917` primary, `#A8A29E` muted, `#E5E1D8` image-placeholder, 배경 `#F8F6F2`)이고 폰트는 Pretendard·Hahmlet 등록 토큰만 사용. `rounded-[8px]`·148px·gap 14를 "정본 §3에 radius 토큰 없음 → 임의값 상속"으로 명시한 것도 DESIGN_SYSTEM §3(spacing/radius 토큰 부재) 서술과 정확히 부합. 폰트를 전부 className으로 강제하고 `style={{}}`을 component-convention §2 예외(그림자·상수 폭·pressed opacity·textShadow·`contentContainerStyle`)로만 한정한 점 확인.                                                                                                     |
| Layout & IA          | 4       | 홈 세로 순서(`ExploreHomeHero → FeaturedCarousel → PopularSection → KcisaSection → 추천`)와 근거(사회적 증거 상단 / 개인화 하단 대비)가 명시됐고, 01-spec Open questions의 John 기본값과 일치. 섹션 간격을 홈 `ScrollView`의 `gap: 28`에 위임하고 자체 마진을 넣지 않는다는 결정이 명확해 이중 여백 리스크가 없음. 재사용 매핑(래퍼 `pb-2 pt-3`, `-mx-6` 레일, `gap: 14`, `paddingHorizontal: 24`, `CenteredLoader className="py-8"`)이 `KcisaSection.tsx` 실제 값과 1:1 일치하며, 신규 파일은 `PopularSection.tsx` 하나로 한정하고 기존 4개 컴포넌트 무수정을 선언 — 01-spec "기존 재사용 자산(변경 없음)"과 충돌 없음. 감점 1: `FeaturedCarousel`(히어로)에 걸린 전시가 동시에 인기 1위가 되어 **같은 전시 카드가 인접 두 섹션에 연속 노출되는 케이스**를 다루지 않았다. `KcisaSection`은 이미 `featured?.source === 'kcisa'` 분기로 이 중복을 회피하고 있어, 인기 섹션만 방어가 없는 상태다(Suggestion 1). AC를 깨지는 않아 Blocker는 아님. |
| Copy & tone          | 5       | Copy 표에 Eyebrow/Title/CTA/Empty/Error/Error a11y label 전 행이 채워졌고 각각 결정 근거가 붙어 있음. `TRENDING NOW → POPULAR NOW` 변경 근거(기존 `PUBLIC MUSEUMS`/`FOR YOU`가 담백한 명사구, 글자 수 균형)와 에러 문구를 `인기 전시를 불러오지 못했어요`로 특정한 근거(홈에 실패 가능 섹션이 복수라 출처 구분 필요 — `KcisaSection`의 `전시 정보를 불러오지 못했어요`와 실제로 충돌함을 코드에서 확인)가 타당. Empty를 "문구 없음 + 섹션 미렌더"로 두고 그 이유("아무도 안 봤다"는 부정 신호 회피)를 적은 것은 누락이 아니라 명시적 결정이며 AC-8과 일치. 🔥/HOT/금은동 차등을 거부한 근거 4가지가 mollip 무채색 톤과 정합.                                                                                                                                                                                                                                                                                                                   |
| Accessibility        | 4       | `KcisaExhibitionCard`의 `accessibilityRole="button"` + `accessibilityLabel={`${item.title}, ${item.venue}`}`, `RetryErrorState`의 role/label/`hitSlop 8` 존재를 코드에서 확인했고 브리프 서술과 일치. 터치 타깃 148×197 카드로 44pt 충족. 대비 계산도 정직함 — muted `#A8A29E` on `#F8F6F2`가 WCAG AA 미달임을 은폐하지 않고, 홈 기존 두 섹션과 동일 처리이며 이번 기능이 새로 악화시키지 않는다고 범위를 그은 판단은 수용 가능(전역 개선은 별건). 감점 1: 순위 배지 `01`이 부모 `Pressable` 라벨에 흡수되어 **스크린리더 사용자에게 순위 정보가 전달되지 않는다.** 브리프도 이를 인지하고 "카드 수정 필요 → 스코프 밖"으로 처리했는데, 카드를 고치지 않고도 `PopularSection` 쪽에서 대응할 여지가 남아 있어(Suggestion 2) 만점은 어렵다. 다만 시각 사용자에게 순위가 정상 전달되고 신규 a11y 위반을 만들지 않으므로 3점 이상.                                                                                                                 |
| **Weighted overall** | **4.5** | 가중치 Brand 0.3 / Layout 0.3 / Copy 0.2 / A11y 0.2 → (5×0.3)+(4×0.3)+(5×0.2)+(4×0.2) = 1.5+1.2+1.0+0.8 = **4.5**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Pass rule: overall ≥ 4.0 and no dimension < 3. → overall 4.5, 최저 항목 4점. **충족.**

### Non-goals 대조 (01-spec)

침범 없음. 브리프의 `Out of design scope`가 01-spec `Non-goals`를 그대로 상속하며, 특히 다음 3건이 명시적으로 재확인됐다.

- 점수·조회수·북마크 수 화면 노출 없음 (Non-goals "상세 화면 UI 변경 없음" 포함)
- 기존 섹션 재배치·제거 없음 — 새 섹션 삽입만
- 인기 전용 목록 화면/더보기 없음 (대응 라우트 부재)

콜드스타트 임계치를 두지 않기로 한 결정도 01-spec Open questions의 John 기본값 유지이므로 스코프 이탈 아님.

## Blockers (must fix)

없음. Pass.

## Suggestions (nice to have)

1. **히어로 중복 노출 방어를 `usePopularExhibitions` 단계에서 다룰지 한 줄 명시.** `FeaturedCarousel`에 노출 중인 전시가 인기 1위가 되면 홈 상단에서 같은 전시가 연속 두 번 보인다. `KcisaSection`이 `featured?.source === 'kcisa'`로 회피하는 것과 대비된다. 인기 목록에서 featured id를 제외할지, 그대로 둘지(사회적 증거로서 중복 노출도 무해하다는 판단이면 그 근거를) 브리프 `States > Success`에 추가하면 Chris가 판단을 되돌릴 일이 없다. Pass를 막지 않는다.
2. **순위의 스크린리더 전달 — 카드 수정 없이 가능한 대안 검토.** `PopularSection`의 레일 `View`에 `accessibilityLabel="인기 전시 1위부터 순서대로"` 같은 컨테이너 레벨 라벨을 두면 `KcisaExhibitionCard`를 건드리지 않고도 "이 배열이 순위"라는 맥락을 전달할 수 있다. 채택 여부는 Sam 판단에 맡긴다.
3. **Loading 상태의 레이아웃 점프 수치 확인.** `CenteredLoader className="py-8"`과 실제 카드 레일 높이(197 + 여백 ≈ 250px+)는 같지 않아 로딩→성공 전환 시 세로 점프가 남는다. 브리프도 "최소화"라고만 적었으므로 사실 서술로는 정확하다. G4 스모크에서 점프 폭이 거슬리는 수준인지 육안 확인만 해두면 충분하다(스켈레톤 도입은 Out of design scope이므로 요구하지 않는다).

## Handoff

- **Pass → Chris (Dev) 착수 가능** (G4 프로토타입 스모크 이후 본격 구현).
- G4 스모크 기준선은 브리프에 이미 정의됨: (1) `FeaturedCarousel`–`KcisaSection` 사이 배치, (2) eyebrow `POPULAR NOW` / title `지금 인기 있는 전시` 렌더, (3) 첫 카드 배지 `01`, (4) 가로 스크롤 1회 + 카드 탭 1회(→ `/(explore)/{id}`, AC-7).
- Suggestions 1~3은 Sam의 브리프 수정 없이 Chris가 구현 중 판단해도 무방하다. 단 Suggestion 1을 "제외하지 않음"으로 결정할 경우 `04-dev-notes.md`에 근거를 남길 것.
