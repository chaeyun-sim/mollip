---
feature-slug: exhibition-popularity-ranking
author: sam
status: draft
---

# Design brief — 전시 인기 랭킹 (홈 "인기 전시" 섹션)

## Design intent

- **신규 비주얼 언어 없음.** 이 기능은 새 디자인을 요구하지 않는다. 오늘 세션에서 확립한 가로 스크롤 카드 패턴(`KcisaSection` + `KcisaExhibitionCard`)을 **그대로** 재사용한다. 카드 폭 148px, 썸네일 `rounded-[8px]`(각진 리브랜딩 반영), 순번 배지 `01`·`02`…, `StatusBadge`, 제목 2줄 + 기관명 1줄 — 모두 변경 없이 사용한다.
- 신규 파일 `src/components/explore/PopularSection.tsx`는 `KcisaSection.tsx`의 구조적 복제본이며, 다르게 하는 것은 **카피(eyebrow/title)와 상태 분기 3가지**뿐이다. 새 토큰·새 컬러·새 radius·새 폰트를 도입하지 않는다.
- 톤 원칙: mollip은 조용하고 절제된 톤이다. "인기"를 시각적으로 과장하는 장치(🔥 이모지, "HOT" 라벨, 붉은 강조색, 배지 확대)를 **도입하지 않는다.** 순위는 이미 존재하는 흑백 순번 배지와 배열 순서만으로 전달한다.
- 결과적으로 홈 화면에 섹션이 하나 더 붙어도 화면의 시각적 리듬(28px 섹션 간격 · 동일 카드 규격)이 흐트러지지 않는다.

## Tokens (정본: `.docs/DESIGN_SYSTEM.md` / `tailwind.config.js`)

이번 브리프는 **새 토큰을 1개도 추가하지 않는다.** 사용하는 값 전부 기존 토큰이다.

| 용도                | 토큰 / className                                                                 | 값                                                                                    |
| ------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 화면 배경           | `Screen variant="warm"` (기존)                                                   | `#F8F6F2` (bg-light)                                                                  |
| 섹션 제목           | `text-primary` `font-pretendard-semibold` `text-[20px]` (SectionTitle 내부)      | `#1C1917`                                                                             |
| eyebrow             | `text-muted` `font-pretendard-semibold` `text-[11px]` (SectionTitle 내부)        | `#A8A29E`                                                                             |
| 카드 제목           | `text-primary` `text-[13px]` `leading-[18px]` `font-pretendard-semibold`         | `#1C1917`                                                                             |
| 카드 기관명         | `text-muted` `text-[11px]` `font-pretendard-regular`                             | `#A8A29E`                                                                             |
| 순번 배지           | `text-white` `text-[13px]` `font-hahmlet-bold` + textShadow(style 예외)          | `#FFFFFF` on 썸네일                                                                   |
| 썸네일 플레이스홀더 | `bg-image-placeholder`                                                           | `#E5E1D8`                                                                             |
| StatusBadge         | `bg-black/10` `text-black` `rounded-full` (기존 컴포넌트)                        | —                                                                                     |
| 에러/빈 문구        | `text-muted` `text-[13px]` `font-pretendard-regular`                             | `#A8A29E`                                                                             |
| 재시도 라벨         | `text-primary` `text-[13px]` `font-pretendard-semibold`                          | `#1C1917`                                                                             |
| 로더                | `CenteredLoader` (`colors.muted`)                                                | `#A8A29E`                                                                             |
| 카드 radius         | `rounded-[8px]`                                                                  | 8px (오늘 세션 리브랜딩 값. 정본 §3에 radius 토큰 없음 — Tailwind 임의값 그대로 사용) |
| 카드 그림자         | `shadowColor: colors.primary`, opacity 0.1, radius 10, offset (0,4) — style 예외 | 기존 카드 내부 값                                                                     |

> 정본 미등록 값 사유: `rounded-[8px]`, 카드 폭 148px, 갭 14px은 `KcisaExhibitionCard`/`KcisaSection`에 이미 존재하는 값을 그대로 상속하는 것이며, 이번 기능이 새로 도입하는 값이 아니다.

## Layout & components

홈 화면 세로 순서(변경 후):

```
ExploreHomeHero
FeaturedCarousel
PopularSection        ← 신규 (여기)
KcisaSection
추천 전시 섹션
```

**배치 확정**: `FeaturedCarousel` 바로 다음, `KcisaSection` 앞 — John의 01-spec Open questions 기본값 그대로. 근거: 사회적 증거(다수가 본 전시)는 발견 단계 상단에 있을 때 가치가 가장 크고, 개인화 섹션(`추천 전시`)은 하단에 남겨 대비를 만든다. 홈 `ScrollView`의 `contentContainerStyle.gap: 28`이 섹션 간격을 이미 담당하므로 PopularSection에 추가 마진을 넣지 않는다.

| 영역              | 설명                                                                                                                                                                                                    | 재사용 컴포넌트                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 섹션 래퍼         | `<View className="pb-2 pt-3">` — `KcisaSection`과 동일                                                                                                                                                  | (신규 `PopularSection.tsx`, `src/components/explore/`) |
| 섹션 헤더         | eyebrow + title. **`right`(더보기) 미전달** — 대응하는 목록 화면이 없으므로 빈 링크를 만들지 않는다                                                                                                     | `SectionTitle` (`src/components/common/`)              |
| 카드 레일         | `<View className="-mx-6">` + 가로 `ScrollView`, `showsHorizontalScrollIndicator={false}`, `contentContainerStyle={{ flexDirection: 'row', gap: 14, paddingHorizontal: 24 }}` — `KcisaSection` 값 그대로 | RN `ScrollView`                                        |
| 카드              | 최대 10개, 인기 점수 내림차순. `index={i + 1}`로 순위 전달(1부터)                                                                                                                                       | `KcisaExhibitionCard` (변경 없음)                      |
| 카드 내 상태 라벨 | 진행중/예정/종료                                                                                                                                                                                        | `StatusBadge` (변경 없음)                              |
| 로딩              | `<CenteredLoader className="py-8" />` — `KcisaSection`과 동일한 세로 여백                                                                                                                               | `CenteredLoader`                                       |
| 에러              | `<RetryErrorState ... className="py-8" />`                                                                                                                                                              | `RetryErrorState`                                      |
| 빈 상태           | 섹션 전체 미렌더(`return null`)                                                                                                                                                                         | —                                                      |

**신규 컴포넌트는 `PopularSection.tsx` 하나뿐이다.** 배치 위치: `src/components/explore/PopularSection.tsx`. `KcisaExhibitionCard`, `SectionTitle`, `StatusBadge`, `CenteredLoader`, `RetryErrorState`는 **수정하지 않는다.**

구현 주의(컨벤션):

- 상태 분기는 삼항 중첩 금지(§11.2) — `PopularSection` 내부 `renderContent()` 렌더 함수로 분리하고, `if` 블록 사이에 빈 줄을 넣는다(§11.4). 긍정 조건 우선(§11.1).
- 조건부 className이 필요하면 `cn()` 사용(§3). 이 섹션에는 조건부 스타일이 없으므로 템플릿 리터럴이 등장할 이유가 없다.
- 폰트는 전부 className. `style={{ fontFamily }}` 금지.
- `style={{}}`는 카드 내부의 기존 예외(그림자·고정 폭 상수·pressed opacity·textShadow)뿐이며, PopularSection 자체는 `ScrollView`의 `contentContainerStyle` 외에 style을 쓰지 않는다.

### 순위 표시 결정 (요청 항목 ②)

**결정: `KcisaExhibitionCard`의 기존 인덱스 배지(`01`, `02`…)를 그대로 사용한다. 별도 인기 표식(🔥 / "HOT" / 랭킹 왕관 등)을 추가하지 않는다.**

근거:

1. **톤** — mollip의 시각 언어는 무채색(Ink `#1C1917` / Muted `#A8A29E`)과 두 서체(Pretendard·Hahmlet)로만 구성돼 있다. 이모지나 형광 강조는 이 팔레트에 존재하지 않는 색·형태를 끌어들여 홈 전체 톤을 깬다.
2. **일관성** — 같은 홈 화면에서 `KcisaSection`이 이미 동일한 배지로 "01, 02…"를 쓰고 있다. 인기 섹션만 배지 형태가 달라지면 사용자는 두 번호 체계가 서로 다른 의미라고 오독한다. 지금은 둘 다 "왼쪽부터 순서"라는 동일 의미로 읽힌다.
3. **정보 전달로 충분** — "무엇이 인기인가"는 섹션 제목이 이미 명시한다. 순위 자체는 배열 순서 + 번호로 전달된다. 표식을 더해도 새 정보가 없다.
4. **비용** — 배지를 바꾸려면 `KcisaExhibitionCard`를 수정해야 하고, 이는 01-spec의 "기존 재사용 자산(변경 없음)" 선언과 충돌한다.

거부한 대안: 🔥 이모지(팔레트 외 색상, 플랫폼별 렌더 편차), "HOT" 텍스트 뱃지(영문 대문자 강조가 eyebrow와 시각적으로 충돌), 1~3위 색상 차등(금·은·동 → 팔레트에 없는 색 3개 신규 도입).

## Copy (KO)

| Element          | Text                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| Eyebrow          | `POPULAR NOW`                                                                   |
| Title            | `지금 인기 있는 전시`                                                           |
| CTA (더보기)     | **없음** — 대응 목록 화면이 없으므로 `SectionTitle`의 `right`를 전달하지 않는다 |
| CTA (카드)       | 카드 전체가 탭 타깃. 별도 버튼 라벨 없음                                        |
| Empty            | **문구 없음** — 섹션 전체를 렌더링하지 않는다 (아래 States 참고)                |
| Error            | `인기 전시를 불러오지 못했어요` + 버튼 `다시 시도`(RetryErrorState 내장)        |
| Error a11y label | `인기 전시 다시 불러오기`                                                       |

카피 결정 근거:

- John의 제안은 eyebrow `TRENDING NOW`였다. 기존 두 섹션(`PUBLIC MUSEUMS`, `FOR YOU`)이 모두 담백한 명사구인 데 비해 `TRENDING`은 상대적으로 마케팅 톤이 강해 **`POPULAR NOW`** 로 확정한다. 글자 수(11자)도 `PUBLIC MUSEUMS`(14자)와 같은 범위라 `text-[11px]` eyebrow 라인에서 시각적 무게가 균형을 이룬다.
- Title은 John 제안 `지금 인기 있는 전시`를 그대로 채택. `국공립 기관 전시`·`추천 전시`와 동일한 명사구 형식이고, 20px 한 줄에 여유롭게 들어간다.
- 에러 문구는 기존 `전시 정보를 불러오지 못했어요` 대신 **`인기 전시를 불러오지 못했어요`** 로 특정한다. 홈에는 실패 가능한 섹션이 여럿이라, 같은 문구가 두 곳에 동시에 뜨면 어느 영역이 실패했는지 구분되지 않는다.
- `subtitle`(예: "저장·조회가 많은 순")은 **넣지 않는다.** 기존 두 섹션 모두 subtitle을 쓰지 않아 홈의 헤더 높이 리듬이 일정하고, 집계 방식 설명은 사용자 의사결정에 필요한 정보가 아니다.

## States

- **Loading** — 집계 요청 진행 중이고 표시할 카드가 0개일 때: 섹션 헤더(eyebrow+title)는 그대로 두고 카드 레일 자리에 `<CenteredLoader className="py-8" />`. `KcisaSection`과 동일한 높이감이라 로딩 중 레이아웃 점프가 최소화된다. 이미 카드가 있는 상태의 refetch에서는 로더로 교체하지 않고 기존 카드를 유지한다.
- **Empty** — 집계 결과 0건이거나, 표시 정보를 조인하지 못해 최종 카드가 0개인 경우: **섹션 전체를 `return null`로 미렌더**한다. 헤더만 남은 빈 섹션을 만들지 않는다(AC-8). `KcisaSection`처럼 "진행 중인 전시가 없어요" 문구를 두지 않는 이유 — 인기 섹션은 사회적 증거가 존재할 때만 의미가 있고, 빈 상태 문구는 "아무도 안 봤다"는 부정적 신호만 남긴다. 홈의 나머지 섹션은 정상 렌더링되며, 삭제된 섹션 자리는 `gap: 28`이 자연스럽게 흡수한다.
  - **콜드스타트(요청 항목 ④)**: 최소 노출 임계치를 **두지 않는다**(John 기본값 유지). 점수 1점짜리 전시 3개만 나와도 그대로 노출한다. 근거: 카드 UI 어디에도 점수·조회수 숫자가 노출되지 않으므로, 낮은 점수로 만들어진 순위와 높은 점수로 만들어진 순위가 사용자 눈에는 동일하게 보인다. 즉 콜드스타트의 시각적 리스크는 "빈 섹션" 하나뿐이고, 그건 0건 미렌더로 이미 막힌다. 카드가 1~2개뿐이어도 가로 레일은 왼쪽 정렬로 자연스럽게 렌더된다(`ScrollView`가 콘텐츠보다 넓어도 레이아웃 깨짐 없음).
  - 임계치를 넣지 않는 두 번째 이유: 임계치는 "왜 어제 있던 섹션이 오늘 사라졌나"라는 설명 불가능한 깜빡임을 만든다.
- **Error** — 집계 요청 실패: 헤더 유지 + 카드 레일 자리에 `<RetryErrorState message="인기 전시를 불러오지 못했어요" onRetry={...} retryAccessibilityLabel="인기 전시 다시 불러오기" className="py-8" />`. 재시도 성공 시 Success로 전환.
- **Success** — 카드 1~10개가 인기 점수 내림차순으로 가로 배열. 좌측 첫 카드가 1위이며 배지에 `01`. 카드 탭 → `/(explore)/{id}` 이동(AC-7). 카드 수가 화면 폭을 넘으면 우측 카드가 살짝 잘려 보여 스크롤 가능성을 암시한다(`paddingHorizontal: 24` + 148px 카드 조합의 기존 동작).

## Accessibility

신규 요소만 점검한다 — 카드·에러·로더는 기존 컴포넌트라 이미 충족한다.

| 요소              | 요구사항                                                                                                                                   | 상태                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 카드 `Pressable`  | `accessibilityRole="button"`, `accessibilityLabel={`${title}, ${venue}`}`                                                                  | 기존 `KcisaExhibitionCard`에 구현됨 — 변경 없음                             |
| 카드 터치 타깃    | 148 × 197px 썸네일 + 텍스트 영역 → 44pt 훨씬 상회                                                                                          | 충족                                                                        |
| 순위 배지 `01`    | 장식 텍스트. 부모 `Pressable`의 `accessibilityLabel`이 우선하므로 스크린리더가 "01"을 따로 읽지 않는다. 순위는 읽기 순서(왼→오)로 전달된다 | 충족(의도된 동작). 라벨에 순위를 넣으려면 카드 수정이 필요해 이번 스코프 밖 |
| 섹션 제목/eyebrow | 순수 텍스트, 인터랙티브 아님 → role 불필요                                                                                                 | 충족                                                                        |
| 다시 시도 버튼    | `accessibilityRole="button"` + `accessibilityLabel="인기 전시 다시 불러오기"`, `hitSlop 8`                                                 | `RetryErrorState`에 구현됨. **label만 이 섹션 전용 문구로 전달할 것**       |
| 가로 `ScrollView` | 별도 라벨 불필요(기존 두 레일과 동일 패턴)                                                                                                 | 충족                                                                        |
| 아이콘 단독 버튼  | 이 섹션에 없음(더보기 미도입)                                                                                                              | 해당 없음                                                                   |

대비 확인:

- 제목 `#1C1917` on `#F8F6F2` — 명도 대비 매우 높음(약 16:1). 통과.
- eyebrow/기관명 `#A8A29E` on `#F8F6F2` — 약 2.2:1로 WCAG AA(4.5:1) 미달이나, **홈의 기존 두 섹션과 동일한 처리**이며 보조 정보(장식적 레이블)에 한정된다. 이번 기능에서 새로 악화시키는 지점은 없다. 전역 muted 대비 개선은 디자인 시스템 차원의 별건으로 남긴다.
- 순위 배지 흰 텍스트 on 임의 썸네일 — `textShadowColor: 'rgba(0,0,0,0.5)'`, radius 4가 이미 적용되어 밝은 이미지 위에서도 판독 가능. 기존 카드 동작 그대로.
- `StatusBadge` 검정 텍스트 on `bg-black/10` — 기존 값 유지.

## Prototype scope

- [ ] Static layout only
- [x] Navigation wired — 카드 탭 → `/(explore)/{id}` 이동까지 프로토타입에서 확인한다(AC-7)
- [x] Fake data / stub API — G4 스모크 시점에는 집계 RPC 대신 기존 전시 목록 상위 N개를 임시 주입해 섹션 렌더 + 순번 배지 + 가로 스크롤 + 카드 탭 이동을 검증한다

G4 스모크 기준선: 홈 스크린샷에서 (1) `FeaturedCarousel`과 `KcisaSection` 사이에 섹션이 위치, (2) eyebrow `POPULAR NOW` / title `지금 인기 있는 전시` 렌더, (3) 첫 카드 배지가 `01`, (4) 가로 스크롤 1회 + 카드 탭 1회 인터랙션 성공.

## Out of design scope

01-spec Non-goals와 일치하며, 디자인 관점에서 추가로 하지 않는 것:

- **인기 표식 신규 디자인** — 🔥/HOT/왕관/순위 색상 차등 없음(위 근거 참고).
- **점수·조회수·북마크 수의 화면 노출** — 카드에도 섹션에도 숫자를 표시하지 않는다. 상세 화면 UI 변경 없음(01-spec Non-goals).
- **"더보기" 및 인기 전시 전용 목록 화면** — 대응 라우트가 없다.
- **`KcisaExhibitionCard` / `StatusBadge` / `SectionTitle` 수정** — 재사용만 한다. 카드 규격·radius·배지 스타일 변경 금지.
- **홈 기존 섹션의 재배치·제거·리디자인** — 새 섹션 삽입 외 변경 없음.
- **콜드스타트 전용 플레이스홀더 일러스트/안내 문구** — 0건이면 조용히 사라진다.
- **다크 모드 대응** — 홈 화면이 현재 라이트(`variant="warm"`) 전용이므로 별도 다크 팔레트를 정의하지 않는다.
- **스켈레톤 UI** — 기존 섹션들이 `CenteredLoader`를 쓰므로 스켈레톤을 새로 도입하지 않는다(일관성).
- **애니메이션·전환 효과** — 섹션 등장 애니메이션 없음. 기존 pressed opacity(0.88)만 유지.
