---
feature-slug: color-system-overhaul
author: sam
status: draft
iteration: 2
depends-on: 01-spec.md (tier L, AC-1~AC-17), 03-design-review.md (iteration 1, Fail — Blockers 1~5)
---

# Design brief — 디자인 토큰(컬러 시스템) 전면 개편

> **iteration 2 변경 요약** (03-design-review.md Blockers 대응)
>
> | Blocker                                         | 해소 위치                                                                                                               |
> | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
> | 1. `ArtPreferenceDeck` 모순                     | §Layout & components "다크 표면(비버튼)" 행에서 삭제 → §N 확정표 N-7 `brand` 확정                                       |
> | 2. 비버튼 `bg-primary`/`bg-secondary` 판정 위임 | §N. **brand / neutral 확정표** 신설 (조건부 서술 전면 삭제)                                                             |
> | 3. B-1/B-2 폰트 임계값 불일치                   | §B-1/B-2를 **폰트 크기 무관 단일 기준**(흰 텍스트 유무)으로 재정의 + `Chip` active fill을 `bg-primary-dark`로 확정 지정 |
> | 4. disabled / focus 배리언트 부재               | §States에 **Disabled**·**Focus** 행 신설 (D-1~~D-4, F-1~~F-3)                                                           |
> | 5. 탭바 활성 tint 미달 완화책 위임              | §B-7 신설 — 탭바 활성 tint를 **`primary-dark`(6.47:1)** 로 확정 + 기존 아이콘 filled 전환을 형태 신호로 고정            |

---

## Design intent

- **무채색과 브랜드색의 역할을 분리한다.** `primary`/`secondary`/`tertiary`/`muted`가 텍스트 명도 사다리로 쓰이던 구조를 끝내고, 명도는 `gray100~900` 연속 스케일이, 브랜드는 `primary`/`primary-dark`/`secondary`/`accent`가 담당한다.
- **정보 위계는 체감상 동일하게 유지한다.** AC-1~13 구간은 hex 값이 1:1로 동일한 이름 교체이므로 사용자는 아무 변화도 느끼면 안 된다. 시각적 변화는 AC-14 이후에만 나타난다.
- **브랜드 인상은 "조용한 라벤더".** mollip의 카피(`예술에 몰입하는 가장 조용한 방법`)와 웜 그레이 배경(`#F8F6F2`)에 맞는 저채도 더스티 라벤더를 액션 컬러로 쓴다. 기존 범용 블루(`#3B82F6`)의 "시스템 UI" 인상을 제거하는 것이 이번 개편의 체감 목표다.
- **저채도 브랜드색은 대비가 약하다는 사실을 설계에 반영한다.** `#81759B`는 흰 텍스트와 3.99:1로 WCAG AA 본문 기준(4.5:1)에 미달한다. 이 브리프는 "어디에 `primary`를 쓰고 어디에 `primary-dark`를 쓰는가"를 대비 실측값 기준으로 규정한다 — 이것이 이번 브리프의 핵심 산출물이다.
- **"라벤더로 바꿀 표면"과 "검정으로 남길 표면"을 브리프가 확정한다.** 시트 배경·바코드·지도 마커처럼 기능적으로 최대 명도가 필요한 표면은 브랜드 컬러의 대상이 아니다. 이 판정은 §N 확정표가 정본이며, Chris의 AC-2 인벤토리는 이 표를 **옮겨 적는 작업**이지 판단하는 작업이 아니다.
- **토큰 정본은 여전히 `tailwind.config.js`이고, `src/constants/colors.ts`는 JS 미러다.** 새 값은 반드시 두 파일에 동일 hex로 들어간다(`DESIGN_SYSTEM.md` §4 절차).

---

## Tokens

### T-1. 최종 토큰 표 (Manager 확정본 — 이 표가 AC-1/AC-14/AC-17의 기준값)

| 토큰                                                                                               | Hex       | className 예                          | 역할                                                                                                | 정본 대비           |
| -------------------------------------------------------------------------------------------------- | --------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| `gray100`                                                                                          | `#F8F6F2` | `bg-gray100`                          | 최상위 밝기 배경 (기존 `bg-light` 동일값)                                                           | 신규 이름 / 기존 값 |
| `gray200`                                                                                          | `#F2EFE9` | `bg-gray200`                          | 톤온톤 카드 배경 (기존 `bg-tonal` 동일값)                                                           | 신규 이름 / 기존 값 |
| `gray300`                                                                                          | `#E7E5E4` | `border-gray300`                      | 라이트 구분선 (기존 `divider` 동일값)                                                               | 신규 이름 / 기존 값 |
| `gray400`                                                                                          | `#C7C3BD` | `bg-gray400` / `text-gray400`         | 신규 보간값 — **disabled 표면·disabled 아이콘**(D-1/D-2), 비활성 보더                               | **신규 값**         |
| `gray500`                                                                                          | `#A8A29E` | `text-gray500`                        | placeholder·비활성 텍스트 (기존 `muted`)                                                            | 신규 이름 / 기존 값 |
| `gray600`                                                                                          | `#78716C` | `text-gray600`                        | 3차 텍스트·로딩 인디케이터 (기존 `tertiary`)                                                        | 신규 이름 / 기존 값 |
| `gray700`                                                                                          | `#57534E` | `text-gray700`                        | 보조 텍스트 (기존 `secondary`)                                                                      | 신규 이름 / 기존 값 |
| `gray800`                                                                                          | `#292524` | `border-gray800`                      | 다크 구분선 (기존 `divider-dark` 동일값)                                                            | 신규 이름 / 기존 값 |
| `gray900`                                                                                          | `#1C1917` | `text-gray900` / `bg-gray900`         | 본문 텍스트 + **무채색 표면**(시트·마커·바코드 — §N `neutral` 행)                                   | 신규 이름 / 기존 값 |
| `primary`                                                                                          | `#81759B` | `bg-primary`                          | 브랜드 메인 (더스티 라벤더). **텍스트를 얹지 않는 브랜드 표면** 전용(B-2)                           | **값 교체**         |
| `primary-dark`                                                                                     | `#625876` | `bg-primary-dark`                     | **흰 텍스트를 얹는 모든 라이트 배경 브랜드 표면**(B-1) + 탭바 활성 tint(B-7) + 그라데이션 다크 엔드 | **신규 값**         |
| `secondary`                                                                                        | `#302D33` | `border-secondary` / `text-secondary` | 보조·아웃라인 버튼                                                                                  | **값 교체**         |
| `accent`                                                                                           | `#D9A0A0` | `bg-accent`                           | 포인트 강조 (더스티 코럴). 이번 범위에 강제 적용처 없음 — 정의만                                    | **신규 값**         |
| `white`                                                                                            | `#FFFFFF` | `bg-white` / `text-white`             | 순백 (기존 tailwind 기본값을 정식 토큰화)                                                           | 신규 등록           |
| `description`                                                                                      | `#6B6360` | — (tailwind 미등록 유지)              | 설명 텍스트                                                                                         | **무변경**          |
| `error`                                                                                            | `#EF4444` | `text-error`                          | 에러/경고                                                                                           | **무변경**          |
| `error-alt`                                                                                        | `#F43F5E` | `text-error-alt`                      | 스와이프 "패스" 등                                                                                  | **무변경**          |
| `success`                                                                                          | `#00BC7D` | `text-success`                        | 성공 상태                                                                                           | **무변경**          |
| `bg-light` / `bg-dark` / `bg-tonal` / `on-dark` / `image-placeholder` / `divider` / `divider-dark` | 현행      | 현행                                  | 현행 유지                                                                                           | **무변경**          |

**제거 대상**: `tertiary`, `muted` (AC-14에서 정의 삭제. AC-13 grep 게이트가 유일한 안전망 — `decoration-` `placeholder-` `shadow-` `from-` `to-` `via-` 접두사 포함 필수).

### T-2. Q2/Q3 확정에 따른 비도입 항목 (정본에 추가하지 않는다)

- `background` `#F7F4F7` — **도입하지 않는다.** `background`는 `gray100`(#F8F6F2)의 개념적 별칭으로만 취급하고 `tailwind.config.js`에 추가하지 않는다. `bg-light`는 현행 값·이름 그대로 둔다. → **01-spec AC-14의 "`background` `#F7F4F7` 추가" 문장은 이 확정으로 무효화된다. Chris는 `background`를 추가하지 않는다.**
- `gray` `#807A83` 단일 토큰 — **도입하지 않는다.** gray100~900 스케일만 유지한다.

### T-3. 신규 값 도입 사유 (정본에 없던 값)

| 값                       | 사유                                                                                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gray400` `#C7C3BD`      | 기존 사다리에 `#E7E5E4`(300)와 `#A8A29E`(500) 사이가 비어 있어 "한 단계 어둡게"를 표현할 수 없었다(01-spec Problem 3번). 두 값 사이 보간값. **이번 범위의 적용처는 §States D-1/D-2 disabled 표면·아이콘으로 확정**(iteration 1의 "강제 적용처 없음"에서 변경). |
| `primary` `#81759B`      | 앱에 브랜드 컬러가 부재(01-spec Problem 2번). 웜 그레이 배경 위에서 튀지 않는 저채도 라벤더.                                                                                                                                                                   |
| `primary-dark` `#625876` | `primary` 위 흰 텍스트가 3.99:1로 AA 미달 → 01-spec Risks P1이 명시적으로 지정한 대체 값. 흰 텍스트 fill·탭바 tint·pressed/그라데이션 다크 엔드 역할.                                                                                                          |
| `secondary` `#302D33`    | 라벤더 fill(주요) ↔ 뉴트럴 아웃라인(보조)의 2단 버튼 위계를 만들기 위한 값.                                                                                                                                                                                    |
| `accent` `#D9A0A0`       | 라벤더의 보색 계열 포인트. 이번 범위에서는 정의만.                                                                                                                                                                                                             |

### T-4. 타이포 / Radius — 변경 없음

- 폰트는 `tailwind.config.js` 등록 className으로만 지정한다: `font-pretendard-regular|medium|semibold|bold`, `font-hahmlet|-semibold|-bold`. `style={{ fontFamily }}` 금지(`component-convention.md` §2).
- Radius는 현행 유지 — 카드 `rounded-2xl`~~`rounded-3xl`(16~~24), pill `rounded-full`. 이번 개편에서 radius 값을 바꾸지 않는다.
- **폰트 크기·weight도 바꾸지 않는다.** 대비 미달은 전부 색으로만 해결한다(B-1, B-7).

---

## Layout & components

새 화면·새 컴포넌트를 만들지 않는다. 기존 컴포넌트의 색상 참조만 이관·교체한다.

| 영역                | 설명                                                                                                                                                                                                                                      | 재사용 컴포넌트 (신규 생성 없음)                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 화면 셸             | `variant='dark' \| 'warm' \| 'gradient'` 3종 + `highContrast`. **그라디언트 색 배열은 이번 범위에서 변경하지 않는다** (`['#FFF3E6','#F7DFCE',colors.bgLight]`, `['#0C0A09',colors.bgDark]`). AC-16 대비 검증의 기준 배경.                 | `Screen`, `Screen.Header`, `Screen.Bottom`, `Screen.BottomAbsolute` (`src/components/layout/Screen.tsx`)                                                       |
| 헤더                | 타이틀·로고·우측 액션 슬롯. 텍스트 토큰만 이관(AC-3).                                                                                                                                                                                     | `ScreenHeader`, `ScreenHeader.Logo`, `ScreenHeader.Right`                                                                                                      |
| 탭바                | 활성 tint를 `primary-dark`로 확정(B-7). 아이콘 filled/outline 전환은 **현행 유지가 요구사항**.                                                                                                                                            | `app/(tabs)/_layout.tsx`                                                                                                                                       |
| 주요 CTA (fill)     | 흰 라벨 fill 버튼 → `bg-primary-dark`(B-1).                                                                                                                                                                                               | 각 화면의 `Pressable` (공통 Button 컴포넌트 없음 — 추출은 out of scope)                                                                                        |
| 보조/아웃라인 버튼  | `secondary` 아웃라인 적용. 대상 목록은 §"보조 버튼 적용 범위".                                                                                                                                                                            | 각 화면의 `Pressable`                                                                                                                                          |
| 칩 / 필터           | `active ? 'bg-primary-dark' : INACTIVE_BACKGROUND[variant]`. active 라벨이 흰색 13px이므로 B-1 대상 — **확정 지정**(§B-1-a). 비활성 라벨의 `text-secondary`는 **명도 용도이므로 `text-gray700`으로 이관**(AC-3, 브랜드 `secondary` 아님). | `Chip` (`src/components/common/Chip.tsx`)                                                                                                                      |
| 검색 입력           | `elevated ? 'bg-white' : 'bg-bg-tonal'` 유지. placeholder 색만 `colors.muted` → `colors.gray500`.                                                                                                                                         | `SearchBar` (`src/components/common/SearchBar.tsx`)                                                                                                            |
| 플로팅 액션         | `bg-primary` 원형 + 아이콘. 텍스트 라벨 없음 → B-2.                                                                                                                                                                                       | `Fab`, `FloatingIconButton`, `FloatingBackButton`                                                                                                              |
| 에러/재시도         | 텍스트 토큰만 이관.                                                                                                                                                                                                                       | `RetryErrorState`                                                                                                                                              |
| 모달 / 시트         | backdrop `bg-black/35`, 시트 `bg-white` 유지. 내부 버튼만 B-1/B-3 적용.                                                                                                                                                                   | `DatePickerModal`, `ExternalMapSheet`, `ExcludeWordsModal`, `PlaylistModal`, `RouteSheet`(explore/map), `VenueSheet`, `TicketFocusOverlay`, `ImmersiveOverlay` |
| 채팅 버블           | `highContrast` 분기 유지. 사용자 버블이 라벤더가 된다(B-4). 같은 파일의 입력 시트 배경은 `neutral`(§N N-3b).                                                                                                                              | `ChatMessage` (`src/components/guide/ChatMessage.tsx`)                                                                                                         |
| 무채색 표면(비버튼) | 바텀시트 배경·지도 마커·티켓 바코드 바·구분선·다크 입력 필드. **§N 확정표에서 `neutral`로 확정된 지점은 `gray900`으로 이관하고 라벤더로 바꾸지 않는다.**                                                                                  | `RouteSheet`(explore/map), `VenueMarker`, `VisitTicketFooter`, `ExhibitionVenueInfo`, `ChatMessage`(시트), `ExhibitionTitleField`, `VenueField`                |
| 도메인 팔레트       | 건드리지 않음.                                                                                                                                                                                                                            | `archivePalette.ts`, `ticketColor.ts`, `routeColors.ts`                                                                                                        |

> `ArtPreferenceDeck`은 이 표의 "무채색 표면" 행에서 **삭제됐다** — 진행 바는 §N N-7에서 `brand`로 확정(Blocker 1 해소).

> 새 컴포넌트가 필요하다고 판단되더라도 이번 범위에서는 만들지 않는다. 공용 `Button` 추출은 out of design scope(아래) — 필요 시 배치 위치만 미리 지정: `src/components/common/Button.tsx`.

---

## 브랜드 컬러 적용 규칙 (B-1 ~ B-7)

모든 값은 실측 대비비(WCAG 2.1 상대휘도 기준)를 병기한다. 기준: 본문 텍스트 4.5:1, 대형 텍스트(≈18px 이상 또는 14px bold) 3:1, 비텍스트 UI 요소 3:1.

### 판정 트리 (Blocker 3 — 폰트 크기 임계값 폐기)

iteration 1의 "18px 미만" / "13px 미만" 두 임계값은 **모두 삭제한다.** 13~17px 회색지대가 생기지 않도록 기준을 **폰트 크기와 무관한 단일 질문**으로 바꾼다.

```
표면 위에 흰색 텍스트가 올라가는가?
  ├─ YES → 배경이 라이트인가?
  │         ├─ YES → B-1  bg-primary-dark  (white 6.47:1 ✅)
  │         └─ NO(다크 화면) → B-4  bg-primary  (표면 4.68:1 ✅ / 라벨 3.99:1은 highContrast로 완화)
  └─ NO(아이콘·인디케이터·점·바 등 텍스트 없음) → B-2  bg-primary  (비텍스트 3:1 기준 3.70:1 ✅)
```

폰트 크기·weight는 이 판정에 **일절 개입하지 않는다.** 12px든 20px든 흰 텍스트를 얹으면 `primary-dark`다. (근거: 대형 텍스트 3:1 예외에 기대면 라벨 크기가 바뀔 때마다 색이 흔들린다. 단일 규칙이 회귀 위험이 낮고 AC-13 grep 검증도 단순해진다.)

### B-1. 라이트 배경 + 흰 텍스트 → `bg-primary-dark` + `text-white`

- 실측: `#81759B` + white = **3.99:1 ❌**(AA 본문 미달) / `#625876` + white = **6.47:1 ✅**.
- 근거: 01-spec Risks P1이 "미달 시 `primary-dark` 사용"을 명시적으로 허용한다. 라벨 폰트 크기 변경은 out of scope(T-4)이므로 배경을 어둡게 하는 쪽이 유일한 해법이다.
- pressed: `style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}` — 기존 패턴 유지(`component-convention.md` §2 style 허용 예외). 색 교체 아님.
- 적용 지점(fill CTA): `app/onboarding/location.tsx:102` "허용하기", `app/settings/inquiry.tsx:78` 제출, `src/components/search/ExcludeWordsModal.tsx:112` "완료", `src/components/archive/ArchiveLoginPrompt.tsx:23`, `src/components/archive/ArchiveDiaryEmpty.tsx:18`, `src/components/explore/ExhibitionImmersiveCTA.tsx:36`, `src/components/map/RoutePlanningBar.tsx:377`, `app/(explore)/route.tsx:498`, `src/components/onboarding/ArtPreferenceComplete.tsx:32`.
- **`app/auth/login.tsx`의 카카오/Apple 소셜 로그인 버튼은 B-1 대상 아님.** 외부 브랜드 고정색(카카오 `#FEE500`, Apple 시스템 버튼)이라 D-3(외부 브랜드 가이드라인상 색 변경 불가) 적용 대상이며 enabled/disabled 모두 현행 배경 유지. §Copy 표에서도 "카카오로 시작하기"/"Apple로 시작하기"는 "CTA (primary fill)" 행이 아니라 별도 행("CTA — 외부 브랜드 고정색, 무변경")으로 둔다.

#### B-1-a. 흰 라벨을 얹는 **비버튼 fill**도 동일 규칙 — 확정 지정

| 지점                                                    | 라벨                              | 확정                                                                                             |
| ------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/components/common/Chip.tsx:39` `active` fill       | 흰 13px semibold + 흰 체크 아이콘 | **`bg-primary-dark`** — 전역 공통 컴포넌트이므로 예시가 아니라 확정. 앱 전체 칩이 이 값을 따른다 |
| `src/components/mypage/PillSelector.tsx:39` `selected`  | 흰 12px medium                    | **`bg-primary-dark border-2 border-primary-dark`**                                               |
| `app/settings/index.tsx:85` "로그인하기" 배지           | 흰 13px semibold                  | **`bg-primary-dark`**                                                                            |
| `app/settings/inquiry.tsx:103` 제출 칩(활성)            | 흰 라벨                           | **`bg-primary-dark`** (비활성 `bg-divider`는 D-1로 이동)                                         |
| `app/settings/inquiry.tsx:148` 선택 칩                  | 흰 라벨                           | **`bg-primary-dark`**                                                                            |
| `app/(explore)/route.tsx:362,451` 선택 상태             | 흰 라벨                           | **`bg-primary-dark`**                                                                            |
| `src/components/map/RouteSheet.tsx:349` 모드 칩(active) | 흰 라벨                           | **`bg-primary-dark border-transparent`**                                                         |
| `src/components/map/VenueSheet.tsx:383` 선택 상태       | 흰 라벨                           | **`bg-primary-dark border-primary-dark`**                                                        |

### B-2. 텍스트를 얹지 않는 브랜드 표면 → `bg-primary`

- 실측: `#81759B` vs `#F8F6F2` 배경 = **3.70:1 ✅**(비텍스트 3:1 통과). `#81759B` 위 흰 아이콘(스트로크 UI) = 3.99:1 ✅(비텍스트 3:1 통과).
- 적용 지점: `Fab`(`src/components/common/Fab.tsx:19,29`), `src/components/explore/ExhibitionImmersiveFab.tsx:42`, `src/components/map/VenueSheet.tsx:301`, `src/components/explore/ExhibitionMapPreview.tsx:65`, `app/settings/description.tsx:94` 선택 체크(아이콘 단독), `app/settings/voice.tsx:156` 선택 뱃지(아이콘 단독), `src/components/map/RouteSheet.tsx:480` 점, `app/(explore)/route.tsx:320` 점(`bg-primary/25` 불투명도 유지), `src/components/onboarding/ArtPreferenceDeck.tsx:36` 진행 바(§N N-7).
- **활성 칩은 이 목록에서 제외됐다** — 흰 라벨을 가지므로 B-1-a 소관(Blocker 3 해소).

### B-3. 보조/아웃라인 버튼 → `border-secondary` + `text-secondary`, 배경은 투명 또는 `bg-secondary/[0.06]`

- 실측: `#302D33` on white = **13.56:1 ✅**, on `#F8F6F2` = 13.0:1 ✅.
- fill(`bg-secondary` + white)로 쓰지 않는다 — 거의 검정이라 주요 액션과 위계가 뒤집힌다. 아웃라인이 정답.
- 적용 대상은 §"보조 버튼 적용 범위" 표 참고.

### B-4. 다크 화면(`Screen variant='dark'`, `#171412`) 위 브랜드 표면 → `bg-primary` (`primary-dark` 금지)

- 실측: `#81759B` vs `#171412` = **4.68:1 ✅** (표면 분리 충분) / `#625876` vs `#171412` = **2.89:1 ❌** (배경에 묻힘).
- **`primary-dark`는 다크 배경 위의 표면·텍스트·아이콘 색으로 쓰지 않는다.** pressed 상태도 다크 화면에서는 색 교체가 아니라 `opacity` 변화로 표현한다.
- 다크 화면에서는 흰 라벨이 올라가더라도 `primary`를 쓴다(라벨 3.99:1 미달은 `highContrast` 경로가 공식 완화책 — AC-16 참고). 표면이 배경에 묻히는 쪽이 더 큰 손실이기 때문이다.
- 적용 지점: `src/components/guide/ChatMessage.tsx:149` 사용자 말풍선, `app/(guide)/immersive-start.tsx:177`, `app/(guide)/exit-summary.tsx:131`, `app/(guide)/playlist.tsx:172`, `app/(guide)/create-description.tsx:359,454`, `app/(guide)/description.tsx:342,398`.

### B-5. `accent`(#D9A0A0) 위 텍스트는 항상 `text-gray900`

- 실측: `#D9A0A0` + `#1C1917` = **7.90:1 ✅** / `#D9A0A0` + white = **2.21:1 ❌**.
- 이번 범위에 강제 적용처는 없다. 향후 이 토큰을 쓰는 사람이 흰 글씨를 얹지 않도록 DESIGN_SYSTEM.md(AC-17)에 이 한 줄을 함께 기록한다.

### B-6. `primary`를 라이트 배경 위 **본문 텍스트/링크 색**으로 쓰지 않는다

- 실측: `#81759B` on `#F8F6F2` = **3.70:1 ❌**(본문 4.5:1 미달).
- 구 `text-accent` 텍스트 지점(`app/(guide)/playlist.tsx:159`, `app/settings/delete-account.tsx:193`, `app/(guide)/manual.tsx:214`)은 **다크 배경 위**이므로 `text-primary`(4.68:1)로 통과한다.
- 라이트 배경 위에서 브랜드색 텍스트가 필요하면 `text-primary`가 아니라 **`text-primary-dark`**(6.47:1)를 쓴다. 순수 본문 문단에는 어느 쪽도 쓰지 않는다.

### B-7. 탭바 활성 tint → `colors.primaryDark` (`#625876`) — Blocker 5 확정

- 현행: `app/(tabs)/_layout.tsx:15` `tabBarActiveTintColor: colors.accent`(#3B82F6), 라벨 `Pretendard-Medium 12px`, 탭바 배경 `#FFFFFF`.
- Q1 확정("구 `accent` 16곳 → 신규 브랜드 컬러")을 따르되, **값은 `primary`가 아니라 `primary-dark`로 확정한다.**
  - `#81759B` on `#FFFFFF` = **3.70:1 ❌** (12px 라벨은 대형 텍스트가 아니므로 4.5:1 필요)
  - `#625876` on `#FFFFFF` = **6.47:1 ✅** — 라벨·아이콘 모두 AA 본문 통과
  - 탭바 배경이 흰색(라이트)이므로 B-1 계열 규칙과 일관된다. B-4(다크 금지)와 충돌하지 않는다.
- **형태 신호(WCAG 1.4.1 색 단독 의존 회피)는 "(a) 아이콘 filled 변형 전환"으로 확정한다.** `_layout.tsx`의 각 `tabBarIcon`이 이미 `focused ? 'search' : 'search-outline'` 형태로 구현돼 있다 — 신규 구현이 아니라 **현행 유지가 요구사항**이며, 색상 치환 커밋에서 이 분기를 지우면 회귀다.
- **(b) 라벨 weight 상향은 채택하지 않는다.** `tabBarLabelStyle`은 focus 상태 분기가 없어 weight를 바꾸려면 `tabBarLabel` 렌더 함수를 새로 도입해야 하고, 이는 "색상 치환 외 변경 금지"(01-spec Non-goals)와 T-4(타이포 무변경)를 동시에 위반한다. (a)만으로 1.4.1이 충족되므로 불필요하다.
- 비활성 tint `'#9CA3AF'`는 토큰 밖 하드코딩이지만 **이번 범위에서 손대지 않는다**(Non-goals: 색상 치환 대상 토큰만). `#9CA3AF` on white = 2.58:1로 기존부터 미달 — AC-16에 "기존부터 존재하던 미달, 이번 개편 무관"으로 구분 기록한다.
- 결과: iteration 1에서 "⚠️ 조건부 Pass"였던 탭바 행은 **✅ Pass로 확정**된다. Taylor는 판정하지 않고 "지정대로 렌더되는지"만 확인한다.

---

## N. 비버튼 `bg-primary` / `bg-secondary` — brand / neutral 확정표 (Blocker 2)

**이 표가 AC-2 분류의 정본이다.** 01-spec Risks P0가 P0로 지정한 8개 지점을 전부 포함하며, 조건부 서술("AC-2에서 분류되면 따른다")은 이 표로 **대체·삭제**됐다. Chris는 `bg-primary-inventory.md`에 이 판정을 그대로 옮겨 적고, 새로 판단하지 않는다. 표에 없는 히트를 발견하면 판단하지 말고 Manager에게 보고한다.

판정 원칙 두 줄:

- **brand** = 사용자의 선택·진행·액션 가능성을 표시하는 표면. 배경색을 앱이 통제하며, 색이 의미를 갖는다.
- **neutral** = 콘텐츠를 담는 그릇이거나(시트·입력 필드·카드), 통제 불가능한 배경 위에서 최대 명도 대비가 기능인 요소(마커·바코드·구분선). → `gray900` 유지.

| #    | 파일:줄                                                | 요소                                     | 확정                           | 근거 (한 줄)                                                                                                                                                                                                                                                        |
| ---- | ------------------------------------------------------ | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-1  | `src/components/explore/RouteSheet.tsx:75`             | 바텀시트 배경 `rounded-t-3xl`            | **neutral** → `bg-gray900`     | 시트는 콘텐츠 그릇이다. 전면 라벤더 시트는 브랜드 강조가 아니라 배경 오염이며, 시트 내부 흰 텍스트 대비(15.3:1 → 3.99:1)가 무너진다                                                                                                                                 |
| N-2  | `src/components/map/RouteSheet.tsx:277`                | 경로 하이라이트 바 `absolute rounded-xl` | **neutral** → `bg-gray900`     | 지도 타일 위 오버레이. 배경 통제 불가 구간이라 최대 명도 대비가 기능 요건                                                                                                                                                                                           |
| N-3a | `src/components/guide/ChatMessage.tsx:149`             | 사용자 말풍선(다크 화면)                 | **brand** → `bg-primary` (B-4) | "내가 보낸 말"을 구분하는 선택/행위 표시. 다크 배경 4.68:1로 표면 분리 확보                                                                                                                                                                                         |
| N-3b | `src/components/guide/ChatMessage.tsx:214`             | 하단 입력 시트 배경                      | **neutral** → `bg-gray900`     | 같은 파일이지만 역할이 다르다 — 입력 그릇. N-3a와 같은 색이 되면 말풍선이 시트에 녹아 위계가 사라진다                                                                                                                                                               |
| N-4  | `app/diary/[date].tsx:221`                             | 바텀시트 배경                            | **neutral** → `bg-gray900`     | N-1과 동일 근거                                                                                                                                                                                                                                                     |
| N-5  | `src/components/map/VenueMarker.tsx:44`                | 지도 장소 마커                           | **neutral** → `bg-gray900`     | 지도 타일은 색을 통제할 수 없다. 마커는 어떤 타일 위에서도 읽혀야 하는 기능 요소이므로 최대 명도를 유지한다. `border border-white`도 함께 유지(형태 분리)                                                                                                           |
| N-6  | `src/components/archive/VisitTicketFooter.tsx:34`      | 티켓 바코드 바                           | **neutral** → `bg-gray900`     | 바코드는 "스캔되는 검은 선"이라는 은유 자체가 정보다. 라벤더 바코드는 오독을 유발한다                                                                                                                                                                               |
| N-7  | `src/components/onboarding/ArtPreferenceDeck.tsx:36`   | 온보딩 진행 바(채워진 구간)              | **brand** → `bg-primary` (B-2) | **Blocker 1 확정.** 진행도는 "사용자가 만들어낸 값"이며 텍스트를 얹지 않는 순수 인디케이터다. 미채움 트랙 `bg-divider`(#E7E5E4) 대비 3.5:1, 화면 배경 대비 3.70:1 — 둘 다 비텍스트 3:1 통과. **§Layout & components "무채색 표면" 행에서는 이 컴포넌트를 삭제했다** |
| N-8  | `src/components/explore/ExhibitionVenueInfo.tsx:38,76` | `h-0.5 w-full` 구분선                    | **neutral** → `bg-gray900`     | 구분선은 정보 분할 장치다. 브랜드색 구분선은 "클릭 가능"으로 오인된다                                                                                                                                                                                               |

### N-부속. P0 8개 외 나머지 비버튼 히트 (같은 표 기준으로 함께 확정 — 빈칸 0건 보장)

| 파일:줄                                                                      | 요소                                                                             | 확정                                | 근거                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/guide/ExhibitionTitleField.tsx:45,101` / `VenueField.tsx:30` | 다크 화면 입력 필드·드롭다운 표면                                                | **neutral** → `bg-gray900`          | 입력 그릇. 흰 입력 텍스트(`text-on-dark`) 대비 유지 필요                                                                                                                                                                                                            |
| `app/(guide)/manual.tsx:111,140,170,193`                                     | 다크 화면 `TextInput` 배경                                                       | **neutral** → `bg-gray900`          | 동일                                                                                                                                                                                                                                                                |
| `app/(guide)/create-description.tsx:263,285,381`                             | 다크 화면 카드·입력 표면                                                         | **neutral** → `bg-gray900`          | 동일                                                                                                                                                                                                                                                                |
| `app/settings/delete-account.tsx:90`                                         | 확인 CTA(흰 라벨)                                                                | **brand** → `bg-primary-dark` (B-1) | 버튼이므로 §N 대상 아님 — 참고용 행                                                                                                                                                                                                                                 |
| `src/components/map/RouteSheet.tsx:480` / `app/(explore)/route.tsx:320`      | 타임라인 점                                                                      | **brand** → `bg-primary` (B-2)      | 텍스트 없는 진행 인디케이터. `route.tsx:320`의 `/25` 불투명도는 유지                                                                                                                                                                                                |
| `app/(guide)/chat.tsx:179,220`                                               | `style={{ backgroundColor: highContrast ? HIGH_CONTRAST_COLOR : 'bg-primary' }}` | **neutral** → `colors.gray900`      | ⚠️ **기존 버그**: `backgroundColor`에 className 문자열 `'bg-primary'`가 들어가 있어 현재 무효값이다. 이관 시 `colors.gray900`(JS 값)으로 고쳐야 `component-convention.md` §2를 만족한다. 색 변화가 발생하면 그건 회귀가 아니라 버그 수정이므로 Taylor에게 별도 고지 |

`bg-secondary` grep 히트: **0건**(전수 확인). 신규 `secondary`는 §"보조 버튼 적용 범위" S-1~S-4에서 새로 도입되는 것이며, 기존 `bg-secondary` 표면 이관 대상은 없다.

---

## 보조 버튼 적용 범위 (Q4 구체화)

`.claude/rules/component-convention.md` §9(파일 구조)·§8(접근성) 기준으로, **"주요 액션과 나란히 놓인 취소/닫기/되돌리기 성격의 버튼"**만 `secondary` 아웃라인 대상으로 본다. 판정 기준 3가지를 모두 만족해야 대상이다.

1. `Pressable`이고 `accessibilityRole='button'`을 가진다 (토글/칩/리스트 아이템 아님)
2. 같은 화면에 더 강한 위계의 주요 액션이 함께 존재한다
3. 현재 배경이 `bg-bg-tonal` 또는 투명이며, 아이콘 단독이 아니라 텍스트 라벨을 가진다

### 적용 대상 (B-3 적용)

| #   | 파일:줄                                        | 현재                                                     | 변경 후                                                        | 근거                                                                                                                                                     |
| --- | ---------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-1 | `app/settings/account.tsx:92`                  | `bg-bg-tonal` + `text-primary`, 라벨 "닫기"              | `border border-secondary bg-transparent` + `text-secondary`    | 탈퇴 경고 모달에서 `bg-error` "그래도 탈퇴할래요"와 나란히 놓인 취소 액션. 3기준 모두 충족                                                               |
| S-2 | `src/components/common/DatePickerModal.tsx:94` | `text-black/40` 텍스트 버튼 "초기화"                     | `text-secondary` (테두리 없는 텍스트 버튼 유지)                | 같은 행의 확인 버튼과 위계가 명확히 나뉘는 보조 액션. 임의값 `black/40` → 토큰화                                                                         |
| S-3 | `app/(tabs)/search.tsx:223`                    | `bg-bg-tonal` + `text-secondary`(구 #57534E)             | `border border-secondary/25 bg-transparent` + `text-secondary` | "추천 태그" 필터 버튼. 검색 실행이라는 주요 액션의 보조 경로. 라벨 텍스트 보유                                                                           |
| S-4 | `app/onboarding/location.tsx:110`              | 투명 배경 + `text-description`, 라벨 "나중에 설정할게요" | `text-secondary` (테두리 없는 텍스트 버튼 유지)                | 바로 위 "허용하기" fill CTA의 스킵 경로. **주의: `description` 토큰은 무변경(Non-goal)이므로 이 지점은 토큰 값이 아니라 참조를 `secondary`로 바꾸는 것** |

### 비대상 (판정 근거 명시 — `bg-tonal`이지만 버튼이 아님)

| 파일:줄                                                                                                                                                                                                                | 제외 사유                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/common/Chip.tsx:9` `INACTIVE_BACKGROUND.tonal`                                                                                                                                                         | 토글 선택 상태 표현 (기준 1 미충족)                                                                                                                                                                                        |
| `app/settings/voice.tsx:131`                                                                                                                                                                                           | 리스트 아이템 선택 표면 (기준 1 미충족)                                                                                                                                                                                    |
| `app/settings/inquiry.tsx:148`                                                                                                                                                                                         | 선택 칩 미선택 상태 (기준 1 미충족)                                                                                                                                                                                        |
| `app/settings/inquiry.tsx:174,192` / `app/settings/delete-account.tsx:204`                                                                                                                                             | `TextInput` 배경 (기준 1 미충족)                                                                                                                                                                                           |
| `app/settings/delete-account.tsx:79,149` / `app/(guide)/exit-summary.tsx:110`                                                                                                                                          | 아이콘 원형 장식 · 카드 표면 (기준 1·3 미충족)                                                                                                                                                                             |
| `src/components/settings/VoiceListSkeletonItem.tsx:27`                                                                                                                                                                 | 스켈레톤 표면                                                                                                                                                                                                              |
| `src/components/common/SearchBar.tsx:19` / `src/components/common/ImageFallback.tsx:95` / `src/components/search/ExcludeWordsModal.tsx:61`                                                                             | 입력 필드·이미지 폴백·입력 래퍼 표면                                                                                                                                                                                       |
| `src/components/common/ExternalMapSheet.tsx:34` / `PlaylistModal.tsx:42` / `RouteSheet.tsx:71` / `ChatMessage.tsx:261` / `TicketFocusOverlay.tsx:122` / `ImmersiveOverlay.tsx:155` / `app/auth/login.tsx:78` 등 "닫기" | **아이콘 단독 닫기 버튼**(기준 3 미충족). 색을 바꾸지 않고 현행 유지하되, `accessibilityLabel='닫기'`가 이미 붙어 있는지만 확인                                                                                            |
| `app/(guide)/manual.tsx:208` `border border-accent` "바로 질문하기"                                                                                                                                                    | 형태는 아웃라인 버튼이지만 **Q1 확정(구 accent 16곳 → 브랜드 컬러)이 우선**한다. 다크 화면이므로 B-4에 따라 `border-primary` + `text-primary`가 되며 `secondary` 대상이 아니다. Chris는 이 지점을 S-1~S-4와 혼동하지 말 것 |

---

## `primary-dark` 사용 지점 (요약)

| 유형                         | 지점                                                                       | 표기                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 라이트 배경 + 흰 텍스트 fill | B-1 목록 + B-1-a 표 전체                                                   | `className='bg-primary-dark'`                                                               |
| 탭바 활성 tint               | `app/(tabs)/_layout.tsx:15` (B-7)                                          | `tabBarActiveTintColor: colors.primaryDark` — JS 값이므로 style 예외 해당                   |
| 라이트 배경 위 브랜드 텍스트 | B-6                                                                        | `className='text-primary-dark'`                                                             |
| pressed                      | 위 전 지점                                                                 | `style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}` — 기존 패턴 유지, 색 교체 아님 |
| 그라데이션 다크 엔드         | 향후 라벤더 그라데이션 도입 시 `[colors.primary, colors.primaryDark]` 순서 | `<LinearGradient colors={[colors.primary, colors.primaryDark]} />`                          |
| 다크 배경 위                 | **사용 금지** (B-4, 2.89:1)                                                | —                                                                                           |

> `Screen`의 기존 그라디언트 배열(`['#FFF3E6','#F7DFCE',colors.bgLight]`, `['#0C0A09',colors.bgDark]`)은 이번 범위에서 **변경하지 않는다.**

---

## AC-16 다크 variant 대비 — 육안 판단 기준

Taylor가 시뮬레이터 스크린샷을 열고 아래를 순서대로 확인한다. 실측값은 미리 계산해 두었으므로, **육안 확인의 목적은 "계산값과 실제 렌더가 일치하는가"와 "실사용 맥락에서 읽히는가"**다. **판정 열은 이미 확정돼 있다 — Taylor는 판정을 새로 내리지 않는다.**

| 조합                                             | 실측                                               | 판정                                                    | 육안 확인 포인트                                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `primary` `#81759B` 표면 vs `bg-dark` `#171412`  | **4.68:1**                                         | ✅ Pass                                                 | 라벤더 말풍선/버튼의 **가장자리가 배경과 명확히 분리**되어 보이는가. 스크린샷을 50% 축소해도 버블 경계가 사라지지 않으면 Pass           |
| `primary` 위 흰 라벨 (다크 화면 한정)            | **3.99:1**                                         | ⚠️ AA Large만 통과 / AA 본문 미달 — **알려진 미달 1건** | 말풍선 안 텍스트가 뿌옇게 뭉개지지 않고 획이 분리되어 읽히는가. 미달 사실은 AC-16 산출물에 반드시 목록 기록(숨기지 않는다)              |
| 위 미달의 완화 경로                              | `highContrast` 모드                                | ✅ 필수 확인                                            | `Screen variant='dark' highContrast` → 흰 배경 + `bg-[#F0EFED]` 버블 + 진한 텍스트가 **현재와 동일하게** 동작하는가. 여기서 Fail이면 P0 |
| `primary-dark` `#625876` vs `bg-dark`            | **2.89:1**                                         | ❌ 금지                                                 | 다크 화면 어디에도 `bg-primary-dark` / `text-primary-dark`가 나타나지 않아야 한다. 나타났다면 B-4 위반 — Chris에게 반려                 |
| `gray800` `#292524` 구분선 vs `bg-dark`          | 값 동일(`divider-dark`)                            | ✅ 무변화 기대                                          | 다크 화면 구분선이 AC-1 이전 baseline 스크린샷과 **픽셀 동일**한가                                                                      |
| `warm`(`#F8F6F2`) / `gradient` 위 `primary` 표면 | **3.70:1** (`gradient` 상단 `#FFF3E6` 기준 3.84:1) | ✅ 비텍스트 3:1 통과                                    | 라벤더가 **본문 문단 색으로 쓰인 곳이 한 군데도 없는가**(B-6). 아이콘·인디케이터·점 배경으로만 나타나야 한다                            |
| 라이트 배경 fill CTA·칩 `primary-dark` + white   | **6.47:1**                                         | ✅ AA 본문                                              | 흰 라벨 fill 중 `bg-primary`(밝은 라벤더)로 남은 것이 **0건**인가 (B-1/B-1-a 위반 탐지)                                                 |
| 탭바 활성 tint `primary-dark` on `#FFFFFF`       | **6.47:1**                                         | ✅ Pass (B-7 확정)                                      | 5개 탭 전부에서 활성 라벨·아이콘이 확정 색으로 렌더되고, **아이콘이 filled 변형으로 바뀌는 형태 신호가 살아 있는가**                    |
| 탭바 비활성 tint `#9CA3AF` on `#FFFFFF`          | 2.58:1                                             | ❌ 미달 — **기존부터 존재, 이번 개편 무관**             | 값이 변하지 않았는지만 확인. 수정은 별도 범위                                                                                           |
| disabled fill `gray400` + white (D-1)            | 1.94:1                                             | ➖ WCAG 1.4.3 비활성 요소 예외                          | 비활성 버튼이 활성 버튼과 **명확히 구별**되고, `accessibilityState={{ disabled }}`가 붙어 있는가                                        |
| `error` `#EF4444` on `#F8F6F2`                   | 3.76:1                                             | ❌ 미달 — **기존부터 존재, 이번 개편 무관**             | 값 무변경 확인만                                                                                                                        |

**AC-16 산출물 요구**: 위 표를 그대로 채운 결과와 함께, 미달 지점을 **(a) 이번 개편이 만든 미달**(다크 화면 흰 라벨 3.99:1 — 완화책: `highContrast`)과 **(b) 기존부터 존재하던 미달**(탭바 비활성 2.58:1, `error` 3.76:1)로 구분해 목록화한다. 미달 0건이라고 보고하면 그 자체가 결함이다.

---

## Copy (KO)

이번 개편은 **카피를 한 글자도 바꾸지 않는다.** 아래는 색이 바뀌는 요소의 현행 카피를 확정 기록한 것이며, Chris는 이 문구를 유지해야 한다(문구 변경 시 회귀).

| Element                          | Text (현행 유지)                                                                     | 위치                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Title                            | `제외할 검색어` / `정말 탈퇴할까요?` / `오디오 관람 목록` / `추천 태그`              | ExcludeWordsModal / account.tsx / PlaylistModal / search.tsx |
| Title (브랜드)                   | `예술에 몰입하는 가장 조용한 방법`                                                   | `app/auth/login.tsx:95` — 색 무변경(`text-description`)      |
| CTA (primary fill)               | `완료` / `허용하기` / `로그인하기`                                                   | ExcludeWordsModal / location.tsx / settings/index.tsx:87     |
| CTA — 외부 브랜드 고정색, 무변경 | `카카오로 시작하기` / `Apple로 시작하기`                                             | `app/auth/login.tsx` (D-3, B-1 대상 아님)                    |
| CTA (secondary)                  | `닫기` / `초기화` / `나중에 설정할게요`                                              | account.tsx:97 / DatePickerModal:94 / location.tsx:118       |
| CTA (destructive — 무변경)       | `그래도 탈퇴할래요`                                                                  | account.tsx — `bg-error` 유지                                |
| 탭바 라벨 (색만 변경)            | `검색` / `전시` / `둘러보기` / `지도` / `다이어리`                                   | `app/(tabs)/_layout.tsx` — 라벨 문자열·폰트·크기 전부 무변경 |
| Empty                            | `입력한 단어가 포함된 전시는 결과에서 빠집니다` (안내) / 아카이브 빈 상태 문구 현행  | ExcludeWordsModal:58 / ArchiveDiaryEmpty                     |
| Error                            | `탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요` / `로그인에 실패했습니다`        | delete-account.tsx:221 / login.tsx:65                        |
| Disabled (신규 문구 없음)        | 비활성 상태에서 라벨 텍스트를 **바꾸지 않는다** — 색과 `accessibilityState`로만 표현 | 전 지점                                                      |

**신규 카피 없음.** 이번 브리프는 새 문구를 도입하지 않는다.

---

## States

토큰 개편이므로 각 상태는 "어떤 토큰이 그 상태를 그리는가"로 정의한다.

### Loading

`ActivityIndicator color={colors.gray600}` (구 `colors.tertiary` #78716C — **값 동일, 이름만 변경**). 스켈레톤 표면은 `bg-bg-tonal` 현행 유지. 버튼 내부 로딩은 fill 배경(`bg-primary-dark`) 유지 + `color={colors.white}` 인디케이터. 대비: white on `#625876` = 6.47:1 ✅

### Empty

안내 문구 `text-gray600`(#78716C), 보조 설명 `text-gray500`(#A8A29E), 빈 상태 CTA는 B-1(`bg-primary-dark` + `text-white`). 아이콘은 `text-gray400`(#C7C3BD) 사용 가능 — 이번 범위에서 기존 색을 gray400으로 바꾸는 작업은 **하지 않는다**(disabled 용도만 강제).

### Error

`text-error`(#EF4444) **무변경**. 에러 상태에서도 재시도 버튼은 B-1 라벤더를 쓴다(에러색을 액션에 쓰지 않는다). `RetryErrorState`의 텍스트만 `gray600`/`gray900`으로 이관. 대비: `#EF4444` on `#F8F6F2` = 3.76:1 — 본문 미달이나 **현행 유지가 Non-goal이므로 손대지 않는다.** AC-16 목록에 "기존부터 존재하던 미달"로 구분 기록.

### Success

`text-success`(#00BC7D) **무변경**. 완료 체크 아이콘의 구 `text-accent`(블루) 지점(`app/(guide)/exit-summary.tsx:111`)은 Q1 확정에 따라 브랜드 컬러가 되며, 다크 화면이므로 B-4에 따라 **`text-primary`**로 확정한다(브랜드 강조 판정). 다크 배경 대비 4.68:1 ✅

### Pressed (기존 정의 유지)

색을 교체하지 않고 `opacity`로 표현한다 — `style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}`. `Chip`은 기존 `0.7`, `PillSelector`는 기존 `scale 0.93`을 각각 유지한다(컴포넌트별 현행 값 무변경). 다크 화면에서도 색 교체 없이 opacity만 쓴다(B-4).

### Disabled (Blocker 4 — 신설)

01-spec Risks & dependencies 마지막 항목이 요구한 배리언트다. 현재 코드베이스는 disabled 표현이 세 갈래(`bg-divider` / `bg-border` / `opacity` 0.4·0.55·0.6)로 흩어져 있다. **아래 4개 규칙으로 통일한다.**

| #       | 대상                                                        | 확정                                                                                                                                                                                                                                             |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **D-1** | 브랜드 fill CTA의 disabled 배경                             | **`bg-gray400`(#C7C3BD) + `text-white`**, `opacity` 조작 없음. 기존 `bg-divider`(#E7E5E4) / `bg-border` 임시값을 이 토큰으로 통일한다. 확인 지점: `app/settings/inquiry.tsx:103`(`bg-divider`), `app/(explore)/route.tsx:498`(`bg-border`)       |
| **D-2** | 배경 없는 아이콘/텍스트 버튼의 disabled                     | **`text-gray400`(#C7C3BD)**, `opacity` 조작 없음. 확인 지점: `src/components/search/ExcludeWordsModal.tsx:76-83` "제외어 전체 삭제" 아이콘, `app/settings/delete-account.tsx:110-114` 헤더 우측 "탈퇴하기", `app/(guide)/chat.tsx:238` 전송 버튼 |
| **D-3** | 외부 브랜드 색 고정 요소 (카카오 `#FEE500` / Apple / ghost) | **배경 교체 금지.** 기존 `opacity-[0.55]` 유지 (`src/components/auth/SocialPill.tsx:37`). 외부 브랜드 가이드라인상 색을 바꿀 수 없는 요소이므로 D-1의 예외로 명시한다                                                                            |
| **D-4** | 그 외 기존 `opacity` 기반 disabled                          | **현행 값 유지** — `ArtPreferenceComplete.tsx:33`(0.6), `RoutePlanningBar.tsx:240`(0.4), `DiaryCalendar.tsx:126`(비활성 날짜). 색 토큰이 관여하지 않으므로 이번 개편 대상이 아니다                                                               |

**대비 판정**: `gray400` + white = **1.94:1**, `gray400` on `#F8F6F2` = **1.54:1**. 두 값 모두 4.5:1 미달이지만 **WCAG 2.1 §1.4.3 "비활성(disabled) 사용자 인터페이스 컴포넌트는 대비 요건에서 제외" 예외를 적용한다.** 미달을 몰라서가 아니라 규격상 면제 대상임을 명시한다.

**색 단독 의존 회피**: disabled는 색만으로 표현하지 않는다. 모든 disabled 지점에 `disabled={...}` prop과 **`accessibilityState={{ disabled: true }}`가 함께 있어야 한다**(스크린리더 신호). 이미 붙어 있는 곳(`ExcludeWordsModal.tsx:80`, `DiaryCalendar.tsx:131`)은 유지하고, 없는 곳(`inquiry.tsx:103` 계열)은 색 변경과 같은 커밋에서 추가한다 — `component-convention.md` §8이 요구하는 범위다.

### Focus (Blocker 4 — 신설)

**현황 확정**: 코드베이스 전수 grep(`isFocused|onFocus|focused|selectionColor|cursorColor`) 결과, **시각적 focus 상태를 가진 입력·버튼은 0건**이다(히트는 전부 지도 카메라 이동용 `onFocusStop`/`onFocusLocation` 콜백이며 UI 상태가 아니다). 탭바의 `focused`는 focus가 아니라 **active(선택) 상태**이며 B-7이 담당한다.

따라서 focus는 **토큰 규격만 확정하고 이번 범위에서 신규 스타일을 추가하지 않는다.** 없는 상태를 새로 만드는 것은 "색상 치환 외 변경 금지"(01-spec Non-goals) 위반이다. 아래 규격은 AC-17에서 `DESIGN_SYSTEM.md`에 기록되어, 다음에 focus 상태를 만드는 사람이 임의 색을 고르지 않게 한다.

| #       | 규격                                 | 값                                                                                                                   | 대비 근거                                                                                                              |
| ------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **F-1** | 라이트 배경 입력·컨트롤의 focus 보더 | `border-primary`(#81759B), **두께는 기존 값 유지**(신규 링 추가 금지)                                                | `#81759B` vs `#F8F6F2` = 3.70:1 ✅ 비텍스트 UI 3:1 통과. 비-focus 보더 `border-gray300`(#E7E5E4) 대비 인접 대비도 확보 |
| **F-2** | 다크 배경 입력·컨트롤의 focus 보더   | `border-primary`(#81759B). **`primary-dark` 금지**(B-4)                                                              | `#81759B` vs `#171412` = 4.68:1 ✅                                                                                     |
| **F-3** | focus는 색 단독으로 표현하지 않는다  | 보더 색 변경 + 캐럿(`selectionColor={colors.primary}`) 또는 보더 두께 변화 중 **최소 1개의 비색상 신호**를 함께 둔다 | WCAG 1.4.1. RN에서 focus ring이 없으므로 캐럿이 사실상의 기본 형태 신호다                                              |

**이번 개편에서의 적용 대상: 0건.** Chris는 focus 스타일을 새로 추가하지 않으며, Taylor는 focus 관련 회귀를 검증 항목에 넣지 않는다. AC-14 완결 조건(01-spec Risks 마지막 항목 "pressed / disabled / focus 확정")은 이 규격 확정으로 충족된다.

---

## Accessibility

- **터치 타겟 ≥ 44pt**: B-1 fill CTA는 현행 `py-3.5`~`py-[18px]` + 라벨 높이로 44pt 이상 확보됨. S-1(`py-[14px]` + 15px 라벨 ≈ 50pt) ✅. **S-2 `DatePickerModal` "초기화" 텍스트 버튼과 S-4 "나중에 설정할게요"는 시각 높이가 44pt 미만일 수 있으므로 `hitSlop={8}` 이상을 유지/추가한다.** 아이콘 단독 닫기 버튼들은 이미 `hitSlop={8~12}`가 붙어 있으므로 유지. `Chip`(`px-3.5 py-2` + 13px 라벨 ≈ 33pt)은 리스트 내 다중 선택 요소로 현행 유지 — 이번 개편에서 spacing을 바꾸지 않는다(T-4).
- **`accessibilityRole` / `accessibilityLabel`**: 색상 치환 커밋에서 기존 a11y 속성을 **절대 삭제하지 않는다.** 아래는 확인된 현행 상태 — 유지가 요구사항이다.

| 요소                                                                                                                                                                                                                                        | role                           | label                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| S-1 닫기 (`account.tsx:94-95`)                                                                                                                                                                                                              | `button`                       | `닫기` ✅ 존재                                                                                         |
| destructive (`account.tsx:107-108`)                                                                                                                                                                                                         | `button`                       | `그래도 탈퇴할래요` ✅                                                                                 |
| S-3 추천 태그 (`search.tsx:221-222`)                                                                                                                                                                                                        | `button`                       | `${tag} 태그로 검색` ✅                                                                                |
| S-4 스킵 (`location.tsx:114-115`)                                                                                                                                                                                                           | `button`                       | `나중에 설정` ✅                                                                                       |
| location CTA (`location.tsx:105-106`)                                                                                                                                                                                                       | `button`                       | `위치 허용하기` ✅                                                                                     |
| ExcludeWordsModal 완료 (`:110-111`)                                                                                                                                                                                                         | `button`                       | `완료` ✅                                                                                              |
| 제외어 전체 삭제 (`:78-80`)                                                                                                                                                                                                                 | `button`                       | `제외어 전체 삭제` ✅ + `accessibilityState={{ disabled }}` (D-2 대상)                                 |
| `Chip` (`Chip.tsx:34-36`)                                                                                                                                                                                                                   | `button`                       | `${label} 필터` ✅ + `accessibilityState={{ selected }}` — **선택 상태의 비색상 신호이므로 필수 유지** |
| `PillSelector` (`:30-32`)                                                                                                                                                                                                                   | `button`                       | `opt.label` ✅ + `accessibilityState={{ selected }}`                                                   |
| `ArtPreferenceDeck` 패스/선택 (`:68-69`,`:88-89`)                                                                                                                                                                                           | `button`                       | `패스` / `선택` ✅                                                                                     |
| manual "바로 질문하기" (`:210-211`)                                                                                                                                                                                                         | `button`                       | `해설 없이 채팅으로 바로 이동` ✅                                                                      |
| **아이콘 단독 버튼** (ExternalMapSheet:34, PlaylistModal:45, RouteSheet:71,83, ChatMessage:261, TicketFocusOverlay:122, ImmersiveOverlay:155, login:82, route.tsx:526,540, diary/[date]:229, bookmark/audio:205, description:420, chat:239) | `button`                       | `닫기` / `전송` ✅ 전부 존재 — **아이콘 단독이므로 label 필수, 유지 확인**                             |
| `DatePickerModal` "초기화"/확인 (`:94`,`:104`)                                                                                                                                                                                              | ⚠️ **role/label 확인 필요**    | 없으면 `accessibilityRole='button'` + `accessibilityLabel='초기화'` / `'확인'` 추가                    |
| 탭바 5개 탭                                                                                                                                                                                                                                 | expo-router `Tabs`가 자동 부여 | 라벨 문자열이 곧 a11y 라벨 — 라벨 표시(`tabBarShowLabel: true`)를 끄지 않는다                          |

- **대비 확인 메모** (실측 요약):

| 조합                                     | 비율    | 판정                                                  |
| ---------------------------------------- | ------- | ----------------------------------------------------- |
| `primary-dark` #625876 + white           | 6.47:1  | ✅ AA 본문 — 라이트 fill·칩·탭바 tint                 |
| `secondary` #302D33 + white              | 13.56:1 | ✅ AAA                                                |
| `primary` #81759B + white                | 3.99:1  | ⚠️ AA Large만 — **다크 화면 표면 한정**(B-4)          |
| `primary` #81759B on `#171412`           | 4.68:1  | ✅ AA 본문                                            |
| `primary` #81759B on `#F8F6F2`           | 3.70:1  | ⚠️ 비텍스트만 — 아이콘·인디케이터 배경 전용(B-2)      |
| `primary` #81759B on `#FFFFFF`           | 3.70:1  | ❌ 12px 탭바 라벨 미달 → `primary-dark` 사용(B-7)     |
| `primary-dark` on `#171412`              | 2.89:1  | ❌ 금지                                               |
| `accent` #D9A0A0 + `gray900`             | 7.90:1  | ✅                                                    |
| `accent` #D9A0A0 + white                 | 2.21:1  | ❌ 금지                                               |
| `gray900` on `gray100`                   | 15.3:1  | ✅ (현행 유지)                                        |
| `gray700` on `gray100`                   | 6.8:1   | ✅ (현행 유지)                                        |
| `gray500` on `gray100`                   | 2.4:1   | placeholder 전용 — 본문 금지 (현행과 동일, 회귀 아님) |
| `gray400` + white (disabled fill)        | 1.94:1  | ➖ WCAG 1.4.3 비활성 예외 (D-1)                       |
| `gray400` on `gray100` (disabled 아이콘) | 1.54:1  | ➖ WCAG 1.4.3 비활성 예외 (D-2)                       |

- **색 단독 의존 금지(WCAG 1.4.1) — 확정된 비색상 신호 목록**:

| 상태    | 색 신호                      | 비색상 신호 (필수 유지)                                                     |
| ------- | ---------------------------- | --------------------------------------------------------------------------- |
| 탭 활성 | `primary-dark` tint          | **아이콘 filled ↔ outline 전환** (`_layout.tsx` 각 `tabBarIcon`) — B-7 확정 |
| 칩 선택 | `bg-primary-dark` fill       | 체크마크 아이콘 삽입(`Chip.tsx:54`) + `accessibilityState.selected`         |
| 필 선택 | `bg-primary-dark` + 2px 보더 | 보더 두께 변화(1px→2px) + `accessibilityState.selected`                     |
| 비활성  | `gray400`                    | `disabled` prop + `accessibilityState.disabled` (D-1~D-4)                   |
| 진행도  | `bg-primary` 채움            | 채워진 세그먼트 개수(형태·길이) — `ArtPreferenceDeck`                       |

라벤더가 블루보다 배경과의 채도 차가 작으므로 이 항목이 이번 개편의 실질적 회귀 위험이다 — AC-15/AC-16 검증 시 위 표를 그대로 확인한다.

---

## Prototype scope

- [x] **Static layout only** — 새 화면·새 컴포넌트가 없다. 프로토타입은 "기존 화면이 새 토큰으로 렌더된 상태"다.
- [x] **Navigation wired** — 기존 네비게이션 그대로. G4 스모크는 AC-1 적용 후 **홈 / 전시 상세 / 설정** 3개 화면 스크린샷 + 탭 전환 인터랙션 1회로 한다(AC-1의 Then 조건과 동일).
- [ ] Fake data / stub API — 해당 없음. 실제 데이터로 렌더한다.

**G4 스모크 기준선**: `xcrun simctl io booted screenshot .docs/wip/color-system-overhaul/evidence/prototype.png` → 이미지 직접 확인 → **AC-1 시점에는 baseline과 픽셀 동일해야 Pass**(색이 바뀌면 그 자체가 Fail). AC-14 이후 스모크에서는 반대로 fill CTA가 `#625876`, 탭바 활성이 `#625876`, Fab·진행 바가 `#81759B`로 바뀐 것이 Pass 조건이다.

**baseline 선행 요구**: 01-spec Risks P0에 따라 AC-1 착수 **전에** `app/` 라우트 33개의 baseline 스크린샷을 `.docs/wip/color-system-overhaul/evidence/baseline/`에 확보해야 이 스코프가 성립한다.

---

## Out of design scope

01-spec Non-goals와 동일하게 유지하며, 디자인 관점에서 다음을 추가로 명시한다.

- `description`(#6B6360) / `error` / `error-alt` / `success` — 값·이름·사용처 무변경. `description`의 tailwind 미등록 상태도 이번에 해소하지 않는다.
- 도메인 팔레트 무변경: `archivePalette.ts`, `ticketColor.ts`, `routeColors.ts`(외부 표준).
- **타이포·spacing·radius 토큰 무변경.** 대비 미달을 폰트 크기·weight 상향으로 해결하지 않는다(그래서 B-1이 배경 교체로, B-7이 tint 교체로 해결한다).
- **`Screen`의 기존 그라디언트 색 배열 무변경** — 웜 그라디언트를 라벤더로 바꾸지 않는다.
- **다크 모드 기능 신규 구현 없음.** `Screen` variant와 `highContrast`는 동작 유지 확인만.
- **focus 시각 상태 신규 구현 없음** — F-1~F-3은 규격 정의이며 적용 대상 0건(§States Focus).
- **탭바 비활성 tint `#9CA3AF` 무변경.** 하드코딩 해소는 별도 범위.
- **공용 `Button` / `SecondaryButton` 컴포넌트 추출 없음.** 필요성은 인정하나 "색상 치환 외 변경 금지"(01-spec Non-goals)와 충돌한다. 향후 도입 시 배치 위치만 지정: `src/components/common/Button.tsx`.
- **`background` `#F7F4F7` / `gray` `#807A83` 토큰 도입 없음** (Q2/Q3 확정).
- **`accent`(#D9A0A0)의 강제 적용처 지정 없음.** 정의만 추가한다 — 이번 범위에서 화면에 나타나지 않는 것이 정상이다.
- **`gray400`(#C7C3BD)은 disabled 용도(D-1/D-2)에만 적용한다.** 그 외 기존 색을 gray400으로 바꾸는 작업은 하지 않는다.
- 1회성 브랜드 색상(카카오 `#FEE500`/`#191919`, Apple 등) 토큰화 없음.
- 새 컬러 유닛 테스트 스위트 없음.

---

## Chris에게 넘기는 확정 사항 요약

1. `background` 토큰은 **추가하지 않는다** — 01-spec AC-14 문구보다 이 브리프가 우선(Q2 확정).
2. **흰 텍스트가 올라가면 `primary-dark`, 안 올라가면 `primary`.** 폰트 크기는 판정에 개입하지 않는다(§판정 트리). `Chip` active fill = **`bg-primary-dark`** 확정.
3. 다크 화면에는 **`primary-dark`를 쓰지 않는다** (B-4). 다크 화면은 흰 라벨이 있어도 `primary`다.
4. 탭바 활성 tint = **`colors.primaryDark`(#625876)** (B-7). 아이콘 `focused` filled/outline 분기를 지우지 않는다.
5. 비버튼 `bg-primary`의 brand/neutral 판정은 **§N 확정표가 정본**이다. 직접 판단하지 않는다. 표에 없는 히트가 나오면 Manager에게 보고.
6. `ArtPreferenceDeck` 진행 바 = **`bg-primary`**(brand). `RouteSheet`·`ChatMessage` 시트 배경·`VenueMarker`·`VisitTicketFooter`·`ExhibitionVenueInfo` 구분선 = **`bg-gray900`**(neutral).
7. disabled는 **D-1(`bg-gray400`+white) / D-2(`text-gray400`)** 로 통일하고, `accessibilityState={{ disabled }}`를 함께 보장한다. `SocialPill`은 예외(D-3).
8. focus 스타일은 **새로 만들지 않는다** (F-1~F-3은 문서용 규격).
9. 보조 버튼은 **S-1~S-4 네 곳만** `secondary` 아웃라인으로 바꾼다. `bg-tonal`이라고 전부 바꾸지 않는다.
10. `app/(guide)/manual.tsx:208` 아웃라인 버튼은 `secondary`가 아니라 **`primary`** (Q1 + B-4 우선).
11. `app/(guide)/chat.tsx:179,220`의 `backgroundColor: 'bg-primary'`는 **기존 버그**다. `colors.gray900`으로 고치고 Taylor에게 고지한다.
12. 기존 `accessibilityRole` / `accessibilityLabel` / `hitSlop` / `accessibilityState`를 색상 치환 커밋에서 삭제하지 않는다.
13. 카피는 한 글자도 바꾸지 않는다.
