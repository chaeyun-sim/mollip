---
feature-slug: color-system-overhaul
tier: L
author: john
status: draft
---

# Spec — 디자인 토큰(컬러 시스템) 전면 개편

## Problem

- `primary` / `secondary` / `tertiary` / `muted` 는 정석 디자인 시스템 컨벤션에서 **브랜드 컬러 역할**을 가리키는 이름인데, mollip에서는 무채색 **텍스트 명도 사다리**(`#1C1917` → `#57534E` → `#78716C` → `#A8A29E`)로만 쓰이고 있다. 이름과 의미가 어긋나 있어 브랜드 컬러를 도입할 자리가 없다.
- 그 결과 앱에 **브랜드 컬러가 존재하지 않는다**. 강조 액션은 범용 블루(`accent: #3B82F6`)를, 주요 버튼 배경은 거의 검정(`bg-primary: #1C1917`)을 쓰고 있어 mollip 고유의 시각적 정체성이 없다.
- 명도 사다리에 중간 단계가 비어 있다. 배경(`bg-light` `#F8F6F2`, `bg-tonal` `#F2EFE9`), 구분선(`divider` `#E7E5E4`, `divider-dark` `#292524`), 텍스트(4단계)가 서로 다른 이름 체계에 흩어져 있어 "한 단계 밝게/어둡게"를 표현할 수 있는 연속 스케일이 없다.
- 토큰 정본이 두 곳(`tailwind.config.js`, `src/constants/colors.ts`)에 미러링되어 있어 값 드리프트가 반복 발생한다(`.docs/DESIGN_SYSTEM.md` §1.2 기록).

## Goals

- 무채색 명도 사다리를 `gray100`~`gray900` 9단계 연속 스케일로 재정의하고, 기존 텍스트 명도 토큰의 모든 사용처를 이 스케일로 이관한다.
- `primary` / `secondary` / `accent` 이름을 원래 의미인 **브랜드 컬러**로 되돌리고, Dusty Lavender 팔레트를 앱 전역 브랜드 컬러로 도입한다.
- 이름 충돌(구 `primary`=검정 텍스트 vs 신 `primary`=라벤더 브랜드)을 무중단으로 넘긴다 — 스케일 추가 → 참조 이관 → 정의 교체 순서로 진행해, 어느 중간 상태에서도 앱이 잘못된 색으로 렌더되지 않는다.
- `tailwind.config.js` ↔ `src/constants/colors.ts` 두 파일의 값 동기화를 이번 개편에서 전부 맞춘다.
- 전 화면 시각적 회귀 없이(의도된 브랜드 컬러 변경 외) 완료한다.

## Non-goals (out of scope)

- **`description` (#6B6360) 토큰 변경 금지.** 사용자가 명시적으로 유지를 요청했다. 값·이름 모두 손대지 않는다. (tailwind 미등록 상태 해소도 이번 범위 아님)
- **`error` / `error-alt` / `success` 토큰 변경 없음.** 값·이름·사용처 모두 현행 유지.
- **도메인 전용 팔레트 변경 없음** — `src/components/archive/archivePalette.ts`, `src/utils/ticketColor.ts`, `src/utils/routeColors.ts` (DESIGN_SYSTEM.md §1.4). 특히 `routeColors.ts`는 외부 표준(실제 노선 색)이므로 절대 흡수하지 않는다.
- **아이콘 라이브러리 자체 색상 팔레트 변경 없음** — `@expo/vector-icons` 등의 내장 색상 정의는 건드리지 않는다. 아이콘에 넘기는 `color` prop 값만 토큰 이관 대상이다.
- **타이포그래피 / spacing / radius 토큰 변경 없음.** 컬러 토큰만 다룬다.
- **다크 모드 기능 신규 구현 없음.** 기존 `Screen` variant(`dark` / `warm` / `gradient`)와 `bg-dark` / `on-dark` / `divider-dark` 토큰의 **현행 동작 유지 확인**만 한다.
- **1회성 브랜드 색상(카카오 노랑 등) 토큰화 없음.**
- **컴포넌트 구조·레이아웃 리팩토링 없음.** 색상 className/값 치환 외의 변경을 같은 커밋에 섞지 않는다.
- **새 컬러 관련 유닛 테스트 스위트 신설 없음.** 검증은 Taylor의 시각적 전수 검증 + `tsc` + grep 잔여 0건으로 한다.

## Users & context

- **최종 사용자**: mollip 앱 이용자. 이번 개편으로 버튼·강조 요소의 색이 검정/블루 → Dusty Lavender 계열로 바뀌는 것을 체감한다. 정보 위계(텍스트 명도)는 체감상 동일해야 한다.
- **개발자(Chris)**: 앞으로 `text-gray700` 같은 스케일 이름으로 무채색을, `bg-primary`로 브랜드 컬러를 쓴다.
- **현황 스캔 (2026-08-26, 이 spec 작성 시점 직접 측정)**:
  - `(text|bg|border|from|to|via|decoration|placeholder|shadow)-(primary|secondary|tertiary|muted)` className: **312건 / 74파일** (`.tsx` 기준)
  - `colors.(primary|secondary|tertiary|muted|accent)` JS 직접 참조: **49건 / 32파일**
  - `accent` 관련 참조: **20건 / 12파일** (앱 코드 기준 16건 — `tools/`·`.docs/` 제외)
  - DESIGN_SYSTEM.md의 "427건"은 전체 컬러 className 총량이며, 이번 마이그레이션 직접 대상은 위 312+49건이다.

## Acceptance criteria

> **구현 순서가 곧 안전장치다.** AC-1(추가) → AC-2(분류) → AC-3~11(참조 이관) → AC-12(잔여 0 게이트) → AC-13(정의 교체) 순서를 지켜야 이름 충돌이 발생하지 않는다. Chris는 이 순서를 앞당기거나 병합하지 않는다.

### AC-1: gray100~gray900 스케일을 두 정본 파일에 추가한다 (기존 토큰 무변경)

- **Given** `tailwind.config.js`와 `src/constants/colors.ts`에 기존 컬러 토큰이 정의되어 있고, 아직 어떤 사용처도 수정되지 않은 상태
- **When** 아래 9개 토큰을 두 파일에 **추가만** 하고(기존 토큰은 한 줄도 삭제·수정하지 않음) `npx tsc --noEmit`을 실행한다
  | 토큰      | Hex       | 기존 대응               |
  | --------- | --------- | ----------------------- |
  | `gray100` | `#F8F6F2` | bg-light 와 동일        |
  | `gray200` | `#F2EFE9` | bg-tonal 과 동일        |
  | `gray300` | `#E7E5E4` | divider 와 동일         |
  | `gray400` | `#C7C3BD` | 신규 보간값             |
  | `gray500` | `#A8A29E` | muted 와 동일           |
  | `gray600` | `#78716C` | tertiary 와 동일        |
  | `gray700` | `#57534E` | secondary 와 동일       |
  | `gray800` | `#292524` | divider-dark 와 동일    |
  | `gray900` | `#1C1917` | primary(텍스트) 와 동일 |
- **Then** 타입 오류 0건이고, 시뮬레이터에서 임의의 3개 화면(홈 / 전시 상세 / 설정)이 변경 전과 **픽셀 단위로 동일하게** 렌더되며, 두 파일의 9개 hex 값이 서로 100% 일치한다

### AC-2: `bg-primary` 사용처를 "브랜드 표면" / "무채색 표면"으로 전수 분류한다

- **Given** `bg-primary`(#1C1917)가 로그인·보내기 등 **버튼 배경**뿐 아니라 바텀시트 배경(`RouteSheet`, `ChatMessage`), 지도 마커(`VenueMarker`), 티켓 바코드 바(`VisitTicketFooter`), 진행 인디케이터(`ArtPreferenceDeck`), 점 표시 등 **비버튼 표면**에도 쓰이고 있는 상태
- **When** `bg-primary` / `bg-secondary` 전 사용처를 파일:줄 단위로 나열하고 각각을 `brand`(신규 라벤더 적용) 또는 `neutral`(gray900/gray700 유지) 중 하나로 표시한 분류표를 `.docs/wip/color-system-overhaul/bg-primary-inventory.md` 로 산출한다
- **Then** 분류표의 행 수가 실제 grep 히트 수와 일치하고, `brand`/`neutral` 미분류(빈칸) 행이 0건이며, 각 `brand` 행에 "왜 브랜드 표면인가" 한 줄 근거가 달려 있다

### AC-3: `src/components/common/` + `src/components/layout/` 텍스트 토큰 이관

- **Given** 해당 두 디렉터리의 컴포넌트가 `text-primary` / `text-secondary` / `text-tertiary` / `text-muted` 및 `border-*` 형태를 쓰고 있는 상태
- **When** 매핑표(`primary`→`gray900`, `secondary`→`gray700`, `tertiary`→`gray600`, `muted`→`gray500`)에 따라 **텍스트·보더 용도 참조만** 치환하고(AC-2에서 `brand`로 분류된 배경은 건드리지 않음), `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, `SearchBar`·`Chip`·`Fab`·`RetryErrorState`·`ScreenHeader`가 포함된 화면 스크린샷이 변경 전과 시각적으로 동일하며, 두 디렉터리 내 `text-(primary|secondary|tertiary|muted)` grep 히트가 0건이다

### AC-4: `src/components/explore/` + `src/components/search/` 텍스트 토큰 이관

- **Given** 두 디렉터리(explore 19파일, search 4파일)가 기존 텍스트 명도 토큰을 참조하는 상태
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 홈(`app/(tabs)/index.tsx`)·전시 상세(`app/(explore)/[id].tsx`)·검색(`app/(tabs)/search.tsx`) 스크린샷이 변경 전과 시각적으로 동일하며, 두 디렉터리 내 해당 grep 히트가 0건이다

### AC-5: `src/components/archive/` + `src/components/mypage/` + `src/components/settings/` 텍스트 토큰 이관

- **Given** 세 디렉터리(archive 17파일, mypage 5파일, settings 1파일)가 기존 텍스트 명도 토큰을 참조하는 상태
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 다이어리 홈(`app/(tabs)/diary.tsx`)·다이어리 상세(`app/diary/[date].tsx`)·설정 메인(`app/settings/index.tsx`) 스크린샷이 변경 전과 시각적으로 동일하며, 세 디렉터리 내 해당 grep 히트가 0건이다. `archivePalette.ts` / `ticketColor.ts` 는 diff에 포함되지 않는다

### AC-6: `src/components/map/` + `src/components/guide/` + `src/components/auth/` + `src/components/onboarding/` 텍스트 토큰 이관

- **Given** 네 디렉터리(map 10, guide 5, auth 2, onboarding 3파일)가 기존 텍스트 명도 토큰을 참조하는 상태
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 지도(`app/(tabs)/map.tsx`)·채팅(`app/(guide)/chat.tsx`)·로그인(`app/auth/login.tsx`)·온보딩(`app/onboarding/index.tsx`) 스크린샷이 변경 전과 시각적으로 동일하며, 네 디렉터리 내 해당 grep 히트가 0건이다. `routeColors.ts` 는 diff에 포함되지 않는다

### AC-7: `app/(tabs)/` 텍스트 토큰 이관

- **Given** `index.tsx`(3), `exhibitions.tsx`(1), `search.tsx`(9), `diary.tsx`(5)가 기존 텍스트 명도 토큰을 참조하는 상태
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 5개 탭을 순서대로 탭 전환하며 캡처한 스크린샷이 모두 변경 전과 시각적으로 동일하며, `app/(tabs)/` 내 해당 grep 히트가 0건이다

### AC-8: `app/(guide)/` 텍스트 토큰 이관

- **Given** `create-description.tsx`(21), `manual.tsx`(11), `description.tsx`(10), `chat.tsx`(9), `exit-summary.tsx`(5), `playlist.tsx`(5), `immersive-start.tsx`(3)이 기존 텍스트 명도 토큰을 참조하는 상태 — 단일 디렉터리 중 최대 규모(64건)
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 가이드 플로우를 진입 → 수동 입력 → 설명 생성 → 채팅 → 재생목록 → 종료 요약 순으로 실제 통과하며 각 화면 스크린샷이 변경 전과 시각적으로 동일하며, `app/(guide)/` 내 해당 grep 히트가 0건이다

### AC-9: `app/(explore)/` + `app/diary/` 텍스트 토큰 이관

- **Given** `app/(explore)/route.tsx`(12), `app/(explore)/[id].tsx`(2), `app/diary/[date].tsx`(3)이 기존 텍스트 명도 토큰을 참조하는 상태
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 전시 상세 → 길찾기 경로 화면 이동과 다이어리 날짜 상세 화면 스크린샷이 변경 전과 시각적으로 동일하며, 두 디렉터리 내 해당 grep 히트가 0건이다

### AC-10: `app/settings/` 텍스트 토큰 이관

- **Given** `inquiry.tsx`(12), `account.tsx`(8), `index.tsx`(7), `bookmark/exhibition.tsx`(7), `bookmark/audio.tsx`(6), `description.tsx`(3), `voice.tsx`(3), `general.tsx`(2), `delete-account.tsx`(2)가 기존 텍스트 명도 토큰을 참조하는 상태
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 설정 메인에서 각 하위 화면(계정/문의/음성/북마크 2종/설명/일반/계정삭제)에 실제로 진입해 캡처한 스크린샷이 모두 변경 전과 시각적으로 동일하며, `app/settings/` 내 해당 grep 히트가 0건이다

### AC-11: `app/auth/` + `app/onboarding/` + 최상위 화면 텍스트 토큰 이관

- **Given** `app/auth/login.tsx`(4), `app/onboarding/location.tsx`(7), `app/onboarding/index.tsx`(1), `app/terms.tsx`(2), `app/privacy-policy.tsx`(2), `app/notifications.tsx`가 기존 텍스트 명도 토큰을 참조하는 상태
- **When** AC-3과 동일한 매핑으로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 로그인·온보딩(취향/위치)·약관·개인정보처리방침·알림 화면 스크린샷이 변경 전과 시각적으로 동일하며, 해당 파일들의 grep 히트가 0건이다

### AC-12: `src/constants/colors.ts` JS 직접 참조 49건 이관

- **Given** `colors.primary` / `colors.secondary` / `colors.tertiary` / `colors.muted` 가 `shadowColor`, `ActivityIndicator` color prop, `LinearGradient` colors 배열 등 className으로 표현 불가한 32개 파일에서 참조되는 상태 (`colors.accent`는 AC-15 대상이므로 제외)
- **When** 각 참조를 `colors.gray900` / `colors.gray700` / `colors.gray600` / `colors.gray500` 로 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 로딩 인디케이터가 표시되는 화면(전시 목록 로딩, 음성 목록 로딩)과 그림자가 있는 카드 화면 스크린샷이 변경 전과 시각적으로 동일하며, `colors\.(primary|secondary|tertiary|muted)` grep 히트가 0건이다

### AC-13: 잔여 참조 0건 게이트

- **Given** AC-3~12가 모두 완료된 상태
- **When** 저장소 전체(`app/`, `src/`)에 `(text|bg|border|from|to|via|decoration|placeholder|shadow)-(primary|secondary|tertiary|muted)` 와 `colors\.(primary|secondary|tertiary|muted)` 두 패턴으로 grep을 실행한다
- **Then** AC-2에서 `brand`로 분류된 `bg-primary` / `bg-secondary` 행을 제외한 **모든 히트가 0건**이며, 남아 있는 `bg-primary` / `bg-secondary` 히트 목록이 AC-2 분류표의 `brand` 행 목록과 정확히 일치한다

### AC-14: 브랜드 컬러 정의 교체 및 신규 브랜드 토큰 추가

- **Given** AC-13 게이트를 통과해 `primary` / `secondary` 이름이 브랜드 컬러로 재정의되어도 안전한 상태
- **When** 두 정본 파일에서 `primary`를 `#1C1917` → `#81759B`, `secondary`를 `#57534E` → `#302D33` 으로 **값만 교체**하고, `primary-dark` `#625876` / `white` `#FFFFFF` 를 추가하며(Q2 확정에 따라 `background` 토큰은 도입하지 않음 — `gray100`이 그 역할을 대신함), `tertiary` / `muted` 는 정의에서 제거한 뒤 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, AC-2에서 `brand`로 분류된 모든 표면이 시뮬레이터에서 라벤더(`#81759B`)로 렌더되며(로그인 버튼·보내기 버튼·로그아웃 버튼 스크린샷으로 확인), `neutral`로 분류된 표면은 여전히 검정 계열로 렌더된다

### AC-15: 기존 `accent`(#3B82F6, 블루) 사용처 처리 — Open Question Q1 확정 후 적용

> **플레이스홀더 AC.** Q1(아래 Open questions) 답변 전에는 착수 금지. 답변이 나오면 Manager가 이 AC의 `When`을 확정 방침으로 치환한 뒤 Chris에게 넘긴다.

- **Given** `accent`(#3B82F6)가 탭바 활성색(`app/(tabs)/_layout.tsx`), 가이드 플로우 버튼·채팅 버블(`app/(guide)/*` 12건), `src/components/guide/ChatMessage.tsx`, `app/settings/voice.tsx`, `app/settings/delete-account.tsx`, `app/diary/[date].tsx` 등 총 16개 앱 코드 지점에서 쓰이는 상태
- **When** Q1에서 확정된 방침(신규 `primary` 라벤더로 대체 / 신규 `accent` 더스티 코럴 `#D9A0A0`로 대체 / 지점별 분기 중 하나)에 따라 16개 지점을 전부 치환하고 `npx tsc --noEmit`을 실행한다
- **Then** 타입 오류 0건이고, 탭바 활성 상태가 5개 탭 각각에서 확정 색으로 렌더되며, 채팅 화면에서 사용자 말풍선이 확정 색으로 렌더되고, `#3B82F6` 및 구 `accent` 참조 grep 히트가 0건이다

### AC-16: 다크 배경 variant와의 대비 검증

- **Given** `Screen` 컴포넌트가 `dark` / `warm` / `gradient` 세 variant를 제공하고(기본값 `dark`), `bg-dark` `#171412` / `on-dark` `#E8E8E8` / `divider-dark` `#292524` 토큰과 `ChatMessage`의 `highContrast` 분기가 존재하는 상태
- **When** 세 variant를 각각 사용하는 화면을 시뮬레이터에서 열고, 신규 브랜드 컬러가 올라간 요소(버튼·강조 텍스트)와 다크 배경의 대비를 확인한다
- **Then** 세 variant 전부에서 텍스트·아이콘이 배경에 묻히지 않고 읽히며(WCAG AA 4.5:1 기준 미달 지점이 발견되면 목록으로 기록), `gray800`(`#292524`)이 `divider-dark`와 동일 값이라 다크 구분선이 변경 전과 동일하게 렌더되고, `highContrast` 모드가 여전히 정상 동작한다

### AC-17: `.docs/DESIGN_SYSTEM.md` 정본 갱신

- **Given** DESIGN_SYSTEM.md §1.2(드리프트) / §1.3(전역 팔레트 표)가 개편 이전 토큰을 기술하고 있는 상태
- **When** §1.3 표를 신규 토큰 체계(gray100~900, primary, primary-dark, secondary, accent, white, 유지 토큰 — `background`는 Q2 확정에 따라 도입하지 않으며 `gray100`이 그 역할을 대신함을 명시)로 다시 쓰고, §1.2에 이번 개편으로 해소된 드리프트를 기록하며, `tertiary`/`muted` 제거 사실과 마이그레이션 매핑표를 남긴다
- **Then** 문서의 모든 hex 값이 `tailwind.config.js` 실제 값과 1:1 일치하고, 문서에 더 이상 `tertiary` / `muted`가 유효 토큰으로 표기되지 않으며, `description` / `error` / `error-alt` / `success` 항목은 변경 전과 동일하게 남아 있다

## Screens / routes

| Route                                  | 변경                                                       |
| -------------------------------------- | ---------------------------------------------------------- |
| `app/(tabs)/_layout.tsx`               | 탭바 활성색 (`accent` 사용처 — AC-15, Q1 대기)             |
| `app/(tabs)/index.tsx`                 | 텍스트 토큰 이관 (AC-7)                                    |
| `app/(tabs)/exhibitions.tsx`           | 텍스트 토큰 이관 (AC-7)                                    |
| `app/(tabs)/search.tsx`                | 텍스트 토큰 이관 (AC-7)                                    |
| `app/(tabs)/diary.tsx`                 | 텍스트 토큰 이관 (AC-7)                                    |
| `app/(tabs)/map.tsx`                   | `colors.*` JS 참조 이관 (AC-12)                            |
| `app/(explore)/[id].tsx`               | 텍스트 토큰 이관 (AC-9)                                    |
| `app/(explore)/route.tsx`              | 텍스트 토큰 이관 (AC-9, 12건 — explore 최다)               |
| `app/(guide)/create-description.tsx`   | 텍스트 토큰 이관 (AC-8, 21건 — 전체 최다)                  |
| `app/(guide)/manual.tsx`               | 텍스트 토큰 이관 (AC-8) + accent (AC-15)                   |
| `app/(guide)/description.tsx`          | 텍스트 토큰 이관 (AC-8) + accent (AC-15)                   |
| `app/(guide)/chat.tsx`                 | 텍스트 토큰 이관 (AC-8) + 채팅 버블 브랜드 컬러 (AC-14)    |
| `app/(guide)/playlist.tsx`             | 텍스트 토큰 이관 (AC-8) + accent (AC-15)                   |
| `app/(guide)/immersive-start.tsx`      | 텍스트 토큰 이관 (AC-8) + accent (AC-15)                   |
| `app/(guide)/exit-summary.tsx`         | 텍스트 토큰 이관 (AC-8) + accent (AC-15)                   |
| `app/settings/index.tsx`               | 텍스트 토큰 이관 (AC-10) + `bg-primary` 배지 (AC-14)       |
| `app/settings/account.tsx`             | 텍스트 토큰 이관 (AC-10)                                   |
| `app/settings/inquiry.tsx`             | 텍스트 토큰 이관 (AC-10, 12건) + 제출 버튼 (AC-14)         |
| `app/settings/voice.tsx`               | 텍스트 토큰 이관 (AC-10) + accent (AC-15)                  |
| `app/settings/description.tsx`         | 텍스트 토큰 이관 (AC-10)                                   |
| `app/settings/general.tsx`             | 텍스트 토큰 이관 (AC-10)                                   |
| `app/settings/delete-account.tsx`      | 텍스트 토큰 이관 (AC-10) + accent (AC-15)                  |
| `app/settings/preferences.tsx`         | `colors.*` JS 참조 이관 (AC-12)                            |
| `app/settings/bookmark/audio.tsx`      | 텍스트 토큰 이관 (AC-10)                                   |
| `app/settings/bookmark/exhibition.tsx` | 텍스트 토큰 이관 (AC-10)                                   |
| `app/auth/login.tsx`                   | 텍스트 토큰 이관 (AC-11) + 로그인 버튼 브랜드 컬러 (AC-14) |
| `app/onboarding/index.tsx`             | 텍스트 토큰 이관 (AC-11)                                   |
| `app/onboarding/location.tsx`          | 텍스트 토큰 이관 (AC-11) + CTA 버튼 (AC-14)                |
| `app/diary/[date].tsx`                 | 텍스트 토큰 이관 (AC-9) + accent (AC-15)                   |
| `app/terms.tsx`                        | 텍스트 토큰 이관 (AC-11)                                   |
| `app/privacy-policy.tsx`               | 텍스트 토큰 이관 (AC-11)                                   |
| `app/notifications.tsx`                | 텍스트 토큰 이관 (AC-11)                                   |
| `app/_layout.tsx`                      | 변경 없음 (폰트 로드 전용) — 회귀 확인 대상                |

비-라우트 변경 파일: `tailwind.config.js`(AC-1, AC-14), `src/constants/colors.ts`(AC-1, AC-12, AC-14), `src/components/` 12개 도메인 디렉터리 74파일 중 해당분(AC-3~6), `.docs/DESIGN_SYSTEM.md`(AC-17).

## Risks & dependencies

- **[P0] 전체 스크린 시각적 회귀 검증 필요.** 이 기능은 앱의 거의 모든 화면을 건드린다. Taylor는 샘플링이 아니라 **스크린 단위 전수 검증**을 해야 한다 — `app/` 라우트 33개 전부(위 Screens 표 + `app/(tabs)/map.tsx` + `app/_layout.tsx` 경유 화면)를 시뮬레이터에서 실제로 열고 스크린샷을 캡처해 이미지를 직접 확인한다. 캡처만 하고 확인하지 않은 스크린샷은 인정하지 않는다. AC-1~13 구간은 "변경 전과 동일"이 기대값, AC-14 이후는 "브랜드 컬러로 의도적으로 변경됨"이 기대값이므로, **AC-1 착수 전에 33개 화면의 baseline 스크린샷을 먼저 확보**해야 비교가 가능하다.
- **[P0] 이름 충돌 — 순서 위반 시 앱 전역 오염.** AC-14(정의 교체)를 AC-13(잔여 0 게이트) 이전에 수행하면, 미이관된 `text-primary` 텍스트가 전부 라벤더로 렌더되어 가독성이 붕괴된다. Chris는 AC 순서를 절대 앞당기지 않는다. AC-13이 Fail이면 AC-14는 착수 금지.
- **[P0] `bg-primary`의 비버튼 사용처.** 확인된 것만 바텀시트 배경(`src/components/explore/RouteSheet.tsx`, `src/components/map/RouteSheet.tsx`, `src/components/guide/ChatMessage.tsx`, `app/diary/[date].tsx`), 지도 마커(`VenueMarker`), 티켓 바코드 바(`VisitTicketFooter`), 온보딩 진행 바(`ArtPreferenceDeck`), 구분선(`ExhibitionVenueInfo`의 `h-0.5 w-full bg-primary`)이 있다. 이들이 무비판적으로 라벤더가 되면 전면 라벤더 시트/라벤더 구분선이 나온다. AC-2 분류 없이 AC-14로 넘어가는 것을 금지한다.
- **[P1] `tertiary` / `muted` 정의 제거의 파급.** AC-14에서 두 토큰을 제거하는데, NativeWind는 미정의 className을 **런타임 에러 없이 무시**하므로 `tsc`로 잡히지 않는다. AC-13 grep 게이트가 유일한 안전망이다. grep 패턴에 `decoration-` `placeholder-` `shadow-` `from-` `to-` `via-` 접두사를 반드시 포함할 것.
- **[P1] 두 정본 파일 드리프트.** `tailwind.config.js`와 `src/constants/colors.ts`는 값이 자동 동기화되지 않는다(DESIGN_SYSTEM.md §1.2에 기록된 기존 사고). AC-1과 AC-14에서 두 파일을 항상 같은 커밋에 함께 수정하고 hex 값을 대조한다.
- **[P1] 명도 대비 회귀.** 신규 `primary` `#81759B`는 구 `primary` `#1C1917`보다 훨씬 밝다. 흰 배경 위 라벤더 버튼의 **흰 글씨** 대비가 WCAG AA(4.5:1)를 만족하는지 AC-14/AC-16에서 반드시 측정한다. 미달 시 `primary-dark` `#625876` 사용 또는 Sam에게 배리언트 재요청.
- **[P1] `accent` 처리 미확정이 AC-15를 블록한다.** Q1 답변 없이는 AC-15가 착수 불가이고, 탭바·가이드 플로우가 구 블루로 남는다. AC-14 완료 시점에 라벤더 버튼과 블루 탭바가 공존하는 어색한 중간 상태가 발생하므로, **Q1은 AC-14 착수 전에 답이 나와야 한다.**
- **[P2] `git status` 상 이미 수정 중인 파일과의 충돌.** 현재 워킹트리에 `app/(tabs)/index.tsx`, `app/(tabs)/search.tsx`, `src/components/explore/*`, `src/components/search/*`, `src/components/layout/ScreenHeader.tsx` 등 18개 파일의 미커밋 변경이 있다. AC-3/4/7과 직접 겹치므로, 착수 전 Manager가 이 변경들의 커밋 또는 stash 여부를 정리해야 한다.
- **[P2] 커밋 단위.** 300건+ 치환을 한 커밋에 묶으면 리뷰·롤백이 불가능하다. AC 단위로 커밋을 나눈다(단, 커밋은 사용자 요청 시에만 — `feature-pipeline.md` §7).
- **의존성**: Sam의 `02-design-brief.md`가 신규 팔레트의 상태별 배리언트(pressed / disabled / focus)와 대비 검증 결과를 확정해야 AC-14가 완결된다. Alex의 G3 Pass가 AC-14 착수 전제.

## Open questions (for Manager → user)

- [x] **Q1. 기존 `accent`(#3B82F6, 블루)의 운명** — **확정: 16곳 전부 신규 `primary`(라벤더 `#81759B`)로 일괄 대체.** 신규 `accent`(#D9A0A0)는 정의만 하고 이 16곳엔 적용하지 않음(다른 용도로 남겨둠).
- [x] **Q2. `background`(#F7F4F7) vs 기존 `bg-light`(#F8F6F2) 관계** — **확정: `background` 토큰 도입 안 함.** `background`는 `gray100`(#F8F6F2)의 별칭으로만 취급하고, `bg-light`는 그대로 유지. `#F7F4F7`은 폐기.
- [x] **Q3. `gray`(#807A83) 단일 토큰의 역할** — **확정: 도입 안 함.** `gray100~900` 스케일만 유지하고 `gray500`/`gray600`으로 흡수.
- [x] **Q4. `secondary` `#302D33`(거의 검정)의 실제 용도** — **확정: 보조/아웃라인 버튼**(현재 `bg-tonal` 쓰는 "닫기"/"취소" 류)에 적용. 일반 본문 텍스트 대체 용도는 아님(계속 `gray900` 담당). 정확한 적용 범위는 Sam이 컴포넌트 컨벤션 기준으로 02-design-brief.md에 구체화함.
- [x] **Q5. 워킹트리 미커밋 변경 처리** — **무관.** Manager 확인 시점 워킹트리 클린 상태(0개 미커밋 파일) 확인됨.

## Feature breakdown (for Chris)

1. **AC-1** — `tailwind.config.js` + `src/constants/colors.ts`에 `gray100`~`gray900` 9개 토큰 **추가만**. 기존 토큰 무변경. 두 파일 hex 대조.
2. **AC-2** — `bg-primary` / `bg-secondary` 전 사용처 인벤토리 작성 및 `brand` / `neutral` 분류. 코드 변경 없음.
3. **AC-3** — `src/components/common/` + `src/components/layout/` 이관.
4. **AC-4** — `src/components/explore/` + `src/components/search/` 이관.
5. **AC-5** — `src/components/archive/` + `src/components/mypage/` + `src/components/settings/` 이관.
6. **AC-6** — `src/components/map/` + `src/components/guide/` + `src/components/auth/` + `src/components/onboarding/` 이관.
7. **AC-7** — `app/(tabs)/` 이관.
8. **AC-8** — `app/(guide)/` 이관 (최대 규모 64건, 플로우 전체 통과 검증 필수).
9. **AC-9** — `app/(explore)/` + `app/diary/` 이관.
10. **AC-10** — `app/settings/` 이관 (하위 9화면 전부 진입 검증).
11. **AC-11** — `app/auth/` + `app/onboarding/` + 최상위 화면(`terms` / `privacy-policy` / `notifications`) 이관.
12. **AC-12** — `src/constants/colors.ts` JS 직접 참조 49건 이관 (`colors.accent` 제외).
13. **AC-13** — 잔여 참조 0건 grep 게이트. **Fail이면 AC-14 착수 금지.**
14. **AC-14** — 브랜드 컬러 정의 교체(`primary`/`secondary` 값 변경, `primary-dark`/`white` 추가 — `background` 토큰은 Q2 확정에 따라 도입하지 않음 —, `tertiary`/`muted` 제거). Q1 답변 확보 및 Sam 브리프 G3 Pass 이후 착수.
15. **AC-15** — 구 `accent` 16개 지점 처리. **Q1 확정 후 `When` 절 치환 필요 — 플레이스홀더 상태로 착수 금지.**
16. **AC-16** — `Screen` dark/warm/gradient variant 및 `highContrast` 분기 대비 검증.
17. **AC-17** — `.docs/DESIGN_SYSTEM.md` §1.2/§1.3 정본 갱신.
