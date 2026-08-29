# mollip Design System

컬러·타이포 등 디자인 토큰의 정본(source of truth)을 정의하는 문서. 컴포넌트 작성 규칙(className vs style 예외, cn() 사용법, import 순서 등)은 다루지 않는다 — 그건 [`.claude/rules/component-convention.md`](../.claude/rules/component-convention.md)를 참고할 것.

## 1. 컬러 토큰

### 1.1 정본 지정: `tailwind.config.js`

`tailwind.config.js`의 `theme.extend.colors`를 **정본**으로 지정한다.

근거 (2026-08-25 기준 코드 스캔):

- `app/`, `src/` 전체에서 `bg-*` / `text-*` / `border-*` 형태의 tailwind 색상 className 사용이 **427건**
- `src/constants/colors.ts`의 `colors.xxx` 직접 참조는 **55건** — 대부분 `shadowColor`, `ActivityIndicator`의 `color` prop, `LinearGradient`의 `colors` 배열처럼 className으로 표현 불가능한 런타임 JS 값이 필요한 지점([`component-convention.md`](../.claude/rules/component-convention.md) §2의 style 예외 규칙과 일치)

즉 className 경로가 절대다수이므로 `tailwind.config.js`가 실질적 정본이고, `src/constants/colors.ts`는 "className으로 쓸 수 없는 위치를 위한 JS 값 미러"로 존재한다.

### 1.2 알려진 드리프트 (해소 필요)

두 파일의 값이 일부 어긋나 있다. 새 토큰을 추가하거나 기존 값을 바꿀 때 반드시 두 파일을 함께 갱신할 것.

| 토큰                                                                                                                                                                        | `tailwind.config.js` | `src/constants/colors.ts` | 상태                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| description                                                                                                                                                                 | 없음                 | `#6B6360`                 | tailwind.config.js에 대응 className 없음 — className으로 이 색을 쓰려면 `text-[#6B6360]` 임의값을 써야 함(정식 토큰화 안 됨)         |
| 그 외 (primary, primaryDark/primary-dark, secondary, gray100~gray900, white, bgLight/bg-light, bgDark, bgTonal, onDark, imagePlaceholder, border/divider, borderDark/divider-dark, accent, error, errorAlt/error-alt, success) | 동일                 | 동일                      | 일치 (2026-08-26 전수 대조)                                                                                                     |

2026-08-25: bgLight/bg-light 드리프트 해소 — `tailwind.config.js`의 `bg-light`를 `#f4f4f1` → `#F8F6F2`로 통일(`Screen.tsx`가 그라디언트에 실제 사용 중인 값 기준).

2026-08-26: **컬러 시스템 전면 개편(`color-system-overhaul`)으로 두 파일의 전 토큰 값을 대조 완료 — 잔여 드리프트 0건.** 신규 `gray100`~`gray900`, `primary`/`primaryDark`(`primary-dark`)/`secondary`/`accent`/`white`는 추가·교체 시점에 두 파일을 같은 커밋에서 함께 수정했고 hex를 1:1 대조했다. `description`의 tailwind 미등록 상태는 의도적으로 유지(위 표 1행 그대로).

### 1.2.1 마이그레이션 매핑표 (2026-08-26, `tertiary` / `muted` 제거)

`primary` / `secondary` / `tertiary` / `muted`는 원래 브랜드 컬러 이름인데 무채색 텍스트 명도 사다리로 쓰이고 있었다. 명도는 `gray100~900`이 담당하도록 전량 이관했고, `tertiary`와 `muted`는 **정의에서 제거**했다.

| 구 토큰 (className)                | 신 토큰                | 값 변화             |
| ---------------------------------- | ---------------------- | ------------------- |
| `text-primary` (#1C1917)           | `text-gray900`         | 동일 (#1C1917)      |
| `text-secondary` (#57534E)         | `text-gray700`         | 동일 (#57534E)      |
| `text-tertiary` (#78716C)          | `text-gray600`         | 동일 (#78716C)      |
| `text-muted` / `bg-muted` (#A8A29E)| `text-gray500` / `bg-gray500` | 동일 (#A8A29E) |
| `colors.primary`                   | `colors.gray900`       | 동일                |
| `colors.secondary`                 | `colors.gray700`       | 동일                |
| `colors.tertiary`                  | `colors.gray600`       | 동일                |
| `colors.muted`                     | `colors.gray500`       | 동일                |
| `bg-primary` (무채색 표면: 시트·마커·바코드·구분선·다크 입력 필드) | `bg-gray900` | 동일 (#1C1917) |
| `bg-primary` (브랜드 표면, 흰 텍스트 O) | `bg-primary-dark`  | #1C1917 → **#625876** |
| `bg-primary` (브랜드 표면, 텍스트 X)    | `bg-primary`       | #1C1917 → **#81759B** |
| `accent` / `text-accent` / `bg-accent` (#3B82F6) | 라이트 배경 → `primary-dark` / 다크 배경 → `primary` | 블루 제거 |

**`tertiary` / `muted`는 더 이상 유효 토큰이 아니다.** NativeWind는 미정의 className을 런타임 에러 없이 무시하므로 `tsc`로 잡히지 않는다 — 새로 쓰지 말 것.

### 1.3 전역 컬러 팔레트 (정본: `tailwind.config.js`)

#### 무채색 명도 스케일

| 시맨틱 이름 | Hex       | className                        | 용도                                                      |
| ----------- | --------- | -------------------------------- | --------------------------------------------------------- |
| gray100     | `#F8F6F2` | `bg-gray100`                     | 최상위 밝기 배경. **`background` 토큰은 도입하지 않으며 이 토큰이 그 역할을 대신한다** (`bg-light`와 동일 값) |
| gray200     | `#F2EFE9` | `bg-gray200`                     | 톤온톤 카드 배경 (`bg-tonal`과 동일 값)                    |
| gray300     | `#E7E5E4` | `border-gray300`                 | 라이트 구분선 (`divider`와 동일 값)                        |
| gray400     | `#C7C3BD` | `bg-gray400` / `text-gray400`    | **disabled 전용** — 비활성 fill 배경·비활성 아이콘/텍스트  |
| gray500     | `#A8A29E` | `text-gray500`                   | placeholder·비활성 텍스트                                  |
| gray600     | `#78716C` | `text-gray600`                   | 3차 텍스트·로딩 인디케이터                                 |
| gray700     | `#57534E` | `text-gray700`                   | 보조 텍스트                                                |
| gray800     | `#292524` | `border-gray800`                 | 다크 구분선 (`divider-dark`와 동일 값)                     |
| gray900     | `#1C1917` | `text-gray900` / `bg-gray900`    | 본문 텍스트 + 무채색 표면(시트·지도 마커·바코드·구분선)    |

#### 브랜드 컬러

| 시맨틱 이름  | Hex       | className                          | 용도                                                                                |
| ------------ | --------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| primary      | `#81759B` | `bg-primary` / `text-primary`      | 브랜드 메인(더스티 라벤더). **텍스트를 얹지 않는 브랜드 표면** + **다크 배경 위 브랜드 표면** 전용 |
| primary-dark | `#625876` | `bg-primary-dark` / `text-primary-dark` | **흰 텍스트를 얹는 모든 라이트 배경 브랜드 표면** + 탭바 활성 tint + 라이트 배경 위 브랜드 텍스트 |
| secondary    | `#302D33` | `border-secondary` / `text-secondary` | 보조/아웃라인 버튼(취소·닫기·스킵 계열)                                            |
| accent       | `#D9A0A0` | `bg-accent`                        | 포인트 강조(더스티 코럴). **현재 적용처 없음 — 정의만.** 이 색 위에는 반드시 `text-gray900`(7.90:1), 흰 글씨 금지(2.21:1) |
| white        | `#FFFFFF` | `bg-white` / `text-white`          | 순백 (정식 토큰화)                                                                  |

**브랜드 컬러 사용 판정 (폰트 크기는 판정에 개입하지 않는다)**

```
표면 위에 흰색 텍스트가 올라가는가?
  ├─ YES → 배경이 라이트인가?
  │         ├─ YES → bg-primary-dark  (white 6.61:1 ✅)
  │         └─ NO(다크 화면) → bg-primary  (표면 3:1 기준 4.32:1 ✅ / 본문 4.5:1 기준은 미달 — 이 표면에 본문 텍스트를 얹지 않는다)
  └─ NO(아이콘·인디케이터·점·바) → bg-primary  (비텍스트 3:1 기준 3.93:1 ✅)
```

- **다크 배경(`bg-dark` #171412) 위에 `primary-dark`를 쓰지 않는다** — 2.89:1로 배경에 묻힌다.
- **`primary`를 라이트 배경 위 본문 텍스트/링크 색으로 쓰지 않는다** — 3.93:1(본문 4.5:1 미달). 필요하면 `primary-dark`(6.61:1).
- disabled는 `bg-gray400` + `text-white`(fill) 또는 `text-gray400`(배경 없는 버튼)으로 통일하고 `accessibilityState={{ disabled }}`를 함께 둔다. 외부 브랜드 고정색(카카오/Apple)은 예외로 배경을 바꾸지 않는다.
- focus 시각 상태는 현재 코드베이스에 0건이다. 새로 만들 때는 라이트/다크 모두 `border-primary`(#81759B)를 쓰고, 캐럿(`selectionColor`) 또는 보더 두께 변화 같은 비색상 신호를 함께 둔다.

#### 기타 (이번 개편에서 변경 없음)

| 시맨틱 이름       | Hex                    | className                     | 용도                                       |
| ----------------- | ---------------------- | ----------------------------- | ------------------------------------------ |
| description       | `#6B6360`              | (tailwind 미등록)             | 설명 텍스트 — JS 값(`colors.description`)으로만 사용 |
| bg-light          | `#F8F6F2`              | `bg-bg-light`                 | 라이트 모드 배경                           |
| bg-dark           | `#171412`              | `bg-bg-dark`                  | 다크 모드 배경                             |
| bg-tonal          | `#F2EFE9`              | `bg-bg-tonal`                 | 카드 등 톤온톤 배경                        |
| on-dark           | `#E8E8E8`              | `text-on-dark`                | 다크 배경 위 텍스트                        |
| image-placeholder | `#E5E1D8`              | `bg-image-placeholder`        | 이미지 로딩 전 배경                        |
| divider           | `#E7E5E4`              | `border-divider`              | 라이트 모드 구분선                         |
| divider-dark      | `#292524`              | `border-divider-dark`         | 다크 모드 구분선                           |
| error             | `#EF4444`              | `text-error` / `bg-error`     | 에러/경고                                  |
| error-alt         | `#F43F5E`              | `text-error-alt`              | 에러와 톤이 다른 빨강 (스와이프 "패스" 등) |
| success           | `#00BC7D`              | `text-success` / `bg-success` | 성공 상태                                  |

className 조합 예: `bg-[rgba(28,25,23,0.06)]`처럼 위 hex를 rgba 임의값으로 쓰는 경우도 있다 — 이는 [`component-convention.md`](../.claude/rules/component-convention.md) §2 표를 따른다.

### 1.4 도메인 전용 팔레트 (전역 토큰과 분리된 이유)

아래 팔레트들은 전역 시맨틱 토큰(1.3)과 의도적으로 분리되어 있다. 특정 도메인의 의사난수/분류 로직에서만 쓰이고, 재사용 가능한 UI 시맨틱이 아니기 때문이다.

| 파일                                       | 성격                                                                                                                  | 분리 이유                                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/components/archive/archivePalette.ts` | 아카이브 통계 강조색(`ARCHIVE_STAT_ACCENTS`), 썸네일 없을 때 카드 틴트 로테이션(`ARCHIVE_CARD_TINTS`, 해시 기반 선택) | 특정 화면(아카이브)의 시각적 다양성을 위한 장식용 팔레트. 전역 시맨틱 의미가 없음                                           |
| `src/utils/ticketColor.ts`                 | 방문 티켓 카드 배경 12색 (빈티지 웜톤 파스텔), 문자열 해시(`djb2`) 기반 결정적 색상 선택                              | 티켓 고유 식별을 위한 의사난수 배정 팔레트. 전역 토큰과 무관                                                                |
| `src/utils/routeColors.ts`                 | 대중교통 노선 색상 — 버스 타입 코드, 지하철 노선 코드(ODsay 공식 코드 기준)                                           | **외부 표준(실제 노선 색상)**을 그대로 반영해야 하는 데이터이므로 디자인 토큰이 아니라 참조 데이터. 전역 팔레트로 흡수 불가 |

## 2. 타이포그래피

`tailwind.config.js`의 `theme.extend.fontFamily`가 정본. `component-convention.md` §2 규칙에 따라 폰트는 항상 className으로만 지정한다 (`style={{ fontFamily }}` 금지).

| 폰트 패밀리         | className                                       | 실제 폰트 파일/패키지                               | 사용 여부 |
| ------------------- | ----------------------------------------------- | --------------------------------------------------- | --------- |
| Pretendard Regular  | `font-pretendard-regular` / `font-sans`(기본값) | `Pretendard-Regular` (커스텀 폰트 파일)             | 사용 중   |
| Pretendard Light    | `font-pretendard-light`                         | `Pretendard-Light`                                  | 사용 중   |
| Pretendard Medium   | `font-pretendard-medium`                        | `Pretendard-Medium`                                 | 사용 중   |
| Pretendard SemiBold | `font-pretendard-semibold`                      | `Pretendard-SemiBold`                               | 사용 중   |
| Pretendard Bold     | `font-pretendard-bold`                          | `Pretendard-Bold`                                   | 사용 중   |
| Hahmlet Regular     | `font-hahmlet`                                  | `Hahmlet_400Regular` (`@expo-google-fonts/hahmlet`) | 사용 중   |
| Hahmlet SemiBold    | `font-hahmlet-semibold`                         | `Hahmlet_600SemiBold`                               | 사용 중   |
| Hahmlet Bold        | `font-hahmlet-bold`                             | `Hahmlet_700Bold`                                   | 사용 중   |

### 설치되었지만 tailwind.config.js에 등록되지 않은 폰트

`package.json`에 설치되어 있고 `app/_layout.tsx`에서 `useFonts`로 로드는 되지만, `tailwind.config.js`의 `fontFamily`에는 등록되어 있지 않다 — 즉 className으로 쓸 수 없고 `style={{ fontFamily }}`로만 접근 가능한 상태(component-convention.md 규칙 위반 소지가 있는 예외 상태).

| 패키지                                  | 로드 위치                                            | tailwind 등록 | 상태                                                                                     |
| --------------------------------------- | ---------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `@expo-google-fonts/cormorant-garamond` | `app/_layout.tsx` (import만 확인됨)                  | 미등록        | 사용처 재확인 필요 — 실제 렌더링에 쓰이는지, 쓴다면 tailwind에 등록해야 하는지 검토 대상 |
| `@expo-google-fonts/nanum-pen-script`   | `app/_layout.tsx` (`NanumPenScript_400Regular` 로드) | 미등록        | 사용처 재확인 필요 — 동일                                                                |

두 폰트 모두 `useFonts` 로드 확인 외에 실제 컴포넌트에서의 사용처는 이번 스캔 범위에서 확인되지 않았다. 사용 중이면 tailwind.config.js에 `font-cormorant` / `font-nanum-pen` 형태로 정식 등록하고, 미사용이면 정리(제거) 후보로 표시한다.

## 3. Spacing / Radius

별도의 시맨틱 spacing/radius 토큰 파일은 **존재하지 않는다**. Tailwind 기본 숫자 스케일(`p-4`, `gap-2`, `rounded-xl` 등)을 그대로 사용하며, 값이 필요할 때는 [`component-convention.md`](../.claude/rules/component-convention.md) §2 표에 따라 `px-[11px]`, `rounded-tl-[14px]` 같은 임의값 className으로 표현한다. 프로젝트 전용 spacing 스케일을 도입하려면 이 문서와 `tailwind.config.js`에 함께 추가해야 한다(현재는 없음을 있는 그대로 기록).

## 4. 새 토큰 추가 절차

컬러 토큰을 추가/변경할 때:

1. `tailwind.config.js` `theme.extend.colors`에 시맨틱 이름으로 추가 (정본)
2. 해당 색상을 `style={{}}`(JS 값)로도 참조해야 하는 지점이 있다면 `src/constants/colors.ts`에 **동일한 hex 값**으로 동기화 추가
3. 두 파일의 값이 다르면 안 됨 — 다르면 그 자체가 §1.2 같은 드리프트가 되므로, PR 리뷰에서 반드시 diff 확인
4. 도메인 전용 팔레트(§1.4)에 넣을지 전역 토큰(§1.3)에 넣을지는 "다른 화면에서도 재사용 가능한 시맨틱 색인가?" 기준으로 판단 — 재사용 가능하면 전역, 특정 화면/도메인 로직 전용이면 도메인 파일

폰트 토큰을 추가할 때:

1. `@expo-google-fonts/*` 패키지 설치 및 `app/_layout.tsx`의 `useFonts`에 등록
2. `tailwind.config.js` `theme.extend.fontFamily`에 className 등록
3. 실제 컴포넌트에서 `className='font-xxx'`로만 사용 (`style={{ fontFamily }}` 금지)
