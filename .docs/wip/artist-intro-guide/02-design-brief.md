---
feature-slug: artist-intro-guide
author: sam
status: draft
tier: L
---

# Design brief — 몰입 모드 작가 소개 인트로 트랙

## Design intent

- **"목록의 0번 트랙"으로 읽히게 한다.** 작가 소개는 스캔한 작품과 같은 재생목록 안에 있지만 작품이 아니다. 기존 작품 트랙의 골격(썸네일 56 + 2줄 텍스트 + 우측 아이콘)을 **그대로 재사용**하되, ① 얇은 톤온톤 카드 배경, ② `작가 소개` 배지, ③ 아래쪽 구분선 세 가지 신호로만 구분한다. 새 레이아웃·새 카드 규격을 만들지 않는다.
- **대기 UI를 늘리지 않는다.** 01-spec Non-goals대로 "몰입 준비중" 화면·토스트·알림은 없다. 로딩 표현은 이 한 줄 우측의 `ActivityIndicator`가 전부다.
- **하트(북마크) UI를 그리지 않는다.** 작가 소개는 작품이 아니므로 저장 어포던스를 노출하지 않는다 (01-spec Open questions 확정 사항).
- **썸네일은 전시 대표 이미지 재사용.** 신규 일러스트/아이콘 자산을 만들지 않는다. 이미지가 없으면 기존 `ImageFallback`의 question.png 폴백을 그대로 쓴다.
- 과장 금지: 그라데이션·글로우·전용 강조색(민트 `accent`)을 도입하지 않는다. 브랜드 포인트는 재생목록이 이미 쓰고 있는 `primary` 한 가지로 통일한다.

## Tokens

정본은 `tailwind.config.js`의 `theme.extend.colors`(DESIGN_SYSTEM.md §1.1). 아래 값은 2026-08-28 `tailwind.config.js` + `src/constants/colors.ts` 실측값이며 **신규 토큰 도입 0건**이다.

| 용도 | 토큰 | Hex | 지정 방법 |
|------|------|-----|-----------|
| 화면 배경 (몰입 다크) | `Screen` variant `dark` 그라디언트 | `#0C0A09` → `#171412` | `<Screen>` 기본값, 변경 없음 |
| 트랙 카드 배경 | 흰색 6% 오버레이 | `rgba(255,255,255,0.06)` | `bg-white/6` (히어로 블록과 동일 값 재사용) |
| 트랙 제목 텍스트 | on-dark | `#E8E8E8` | `text-on-dark` |
| 트랙 보조 텍스트 | gray600 | `#78716C` | `text-gray600` |
| 배지 텍스트·아이콘 | primary | `#AB77F1` | `text-primary` |
| 배지 배경 | primary 15% | `rgba(171,119,241,0.15)` | `bg-primary/15` |
| 재생 아이콘 (활성) | primary | `#AB77F1` | `text-primary` |
| 재시도 아이콘 (실패) | gray600 | `#78716C` | `text-gray600` — 기존 작품 트랙 실패 표현과 동일 |
| 실패 안내 문구 | error | `#EF4444` | `text-error` |
| 로딩 인디케이터 | gray500 | `#A8A29E` | `color={colors.gray500}` (ActivityIndicator `color`는 JS prop — convention §2 허용 예외) |
| 구분선 | 흰색 6% | `rgba(255,255,255,0.06)` | `border-b-white/6` + `borderBottomWidth: StyleSheet.hairlineWidth` (hairline은 JS 계산값이라 style 허용) |
| 폰트 | Pretendard | — | `font-pretendard-semibold`(제목·배지) / `font-pretendard-regular`(보조) |
| Radius | 썸네일 10, 카드 16, 배지 full | — | `rounded-[10px]` / `rounded-2xl` / `rounded-full` |

**드리프트 메모 (Chris/Alex 참고, 이번 범위에서 고치지 않음):**

1. `.docs/DESIGN_SYSTEM.md` §1.3 표는 아직 구 팔레트(`primary #81759B`, `primary-dark #625876`, `accent #D9A0A0`)를 적고 있고, `tailwind.config.js`는 신 팔레트(`#AB77F1` / `#7C3AED` / `#00E9C8`)다. §1.1이 tailwind.config.js를 정본으로 못박고 있으므로 **이 브리프는 tailwind 값을 따른다.** 문서 §1.3 갱신은 별도 작업으로 분리.
2. `app/(guide)/playlist.tsx` 히어로 블록에 하드코딩 `#60A5FA`(구 블루)가 2곳 남아 있다. **이번 기능 범위 밖 — 건드리지 않는다.**

## Layout & components

배치 위치: 재생목록 `ScrollView` 안, `재생목록` 섹션 라벨 **바로 아래 / 작품 트랙 목록 위**. 즉 빈 상태(`playlist.length === 0`)와 목록 상태 **양쪽 모두**에서 항상 최상단에 렌더된다 (AC-3).

```
재생목록                      ← 기존 섹션 라벨 (변경 없음)
┌──────────────────────────────────────────┐
│ [썸네일56] ( 작가 소개 )             [▶] │  ← 신규: ArtistIntroTrack
│            이대원                        │     bg-white/6, rounded-2xl
│            작가의 시선으로 전시 보기      │
└──────────────────────────────────────────┘
─────────── hairline (white/6) ───────────   ← 신규 구분선
[썸네일] 작품명                       [▶]    ← 기존 작품 트랙 (변경 없음)
[썸네일] 작품명                       [▶]
```

| 영역 | 설명 | 재사용 컴포넌트 |
|------|------|-----------------|
| 화면 셸 | 몰입 다크 배경·헤더·FAB — **변경 없음** | `Screen`, `Screen.Header`, `ScreenHeader.Right`, `Screen.BottomAbsolute` |
| 히어로 블록 | 몰입 모드 진행 중 카드 — **변경 없음** (작가 소개는 카운트 문구 `지금까지 N개의 작품을 만났어요`에 포함하지 않는다. N은 스캔 작품 수 그대로) | 기존 인라인 JSX |
| **작가 소개 트랙 (신규)** | 3상태(대기/활성/실패)를 가진 한 줄. 행 전체가 `Pressable` | **신규** `src/components/guide/ArtistIntroTrack.tsx` (named export) |
| ├ 썸네일 | 56×56, `rounded-[10px]`, 전시 대표 이미지. 없으면 question.png 폴백 | `ImageFallback` (`heroImageUri`, `iconSize={22}`, `resizeMode="cover"`) |
| ├ 배지 | `작가 소개` — `person-outline` 12px + 11px 텍스트, `px-2 py-0.5 rounded-full bg-primary/15` | Ionicons + View (신규 인라인, 15줄 미만) |
| ├ 제목 | 작가명 (`exhibitions.artist` 원문 그대로, 예: `이대원(1921-2005)`), `numberOfLines={1}` | Text |
| ├ 보조 | 상태별 문구 (아래 Copy 표), `numberOfLines={1}` | Text |
| └ 우측 컨트롤 | 26px 아이콘 또는 `ActivityIndicator` — 상태별 스왑 | Ionicons / ActivityIndicator |
| 구분선 | 트랙 하단 hairline. **작품 트랙이 0개여도 표시**해 "고정 트랙"임을 드러낸다 | 인라인 |
| 빈 상태 | 작품 0개일 때의 `아직 들은 작품이 없어요` 블록은 **작가 소개 트랙 아래에 그대로 유지** (문구·아이콘 변경 없음). 트랙이 항상 위 (AC-3) | 기존 인라인 JSX |

**Props 계약 (Chris용, `ArtistIntroTrackProps`):**

| Prop | 타입 | 비고 |
|------|------|------|
| `artist` | `string` | 제목에 표시. 빈 문자열이면 화면 쪽에서 렌더 자체를 스킵 (AC-6) |
| `imageUrl` | `string \| undefined` | 전시 대표 이미지 |
| `status` | `'loading' \| 'ready' \| 'failed'` | 3상태 |
| `onPress` | `() => void` | `ready`면 재생, `failed`면 재생성 트리거. `loading`은 호출되지 않음 |

- **화면(`playlist.tsx`)은 조립만** 한다: `artist`가 없거나 `exhibitionId === null`이면 `ArtistIntroTrack` 자체를 렌더하지 않는다(AC-6 — `&&` 단축 렌더, convention §11.3).
- **`playlist.tsx`가 100줄을 이미 넘으므로 신규 UI는 `app/` 안에 두지 않는다** (convention §9.3/§9.4).
- `status === 'loading'`일 때 `Pressable`은 `disabled` + `accessibilityState={{ disabled: true }}` — 햅틱·라우팅 모두 발생하지 않는다(AC-4).
- 스크롤: 현재 `scrollEnabled={playlist.length > 0}`인데, 작가 소개 트랙 + 빈 상태가 함께 있어도 한 화면에 들어가므로 이 조건은 **그대로 둔다**(변경 불필요).

## Copy (KO)

| Element | Text |
|---------|------|
| 배지 | `작가 소개` |
| Title | `{exhibitions.artist}` 원문 (예: `이대원(1921-2005)`) |
| 보조 — Loading | `해설을 준비하고 있어요` |
| 보조 — Success(ready) | `작가의 시선으로 전시 보기` |
| 보조 — Error(failed) | `해설을 불러오지 못했어요 · 탭해서 다시 시도` |
| CTA | 별도 버튼 텍스트 없음 — 행 전체 탭 + 우측 `play-circle-outline` 아이콘이 CTA |
| Empty | **이 트랙 전용 empty 없음.** 작품 0개일 때의 기존 문구 `아직 들은 작품이 없어요` 유지 (작가 소개 트랙은 그 위에 존재) |
| Error(전역) | 없음 — Alert·토스트·배너를 띄우지 않는다 (AC-4/AC-7) |
| 해설 화면 제목 | `store.manualTitle`에 `{artist}` 원문을 그대로 넣는다. `작가 소개 - ` 같은 접두사를 붙이지 않는다 (기존 해설 화면 헤더 규격 유지) |

문구 규칙: 마침표 없음, 존댓말 `~어요` 체 — 재생목록 기존 문구(`작품을 스캔하면 해설이 여기에 쌓여요`, `아직 들은 작품이 없어요`)와 통일.

## States

| 상태 | 좌측 | 중앙 | 우측 | 인터랙션 |
|------|------|------|------|----------|
| **Loading** (생성 중, AC-1/AC-4) | 썸네일 정상 노출, `opacity-60` | 배지 정상 / 제목 `text-on-dark` + `opacity-60` / 보조 `해설을 준비하고 있어요` | `ActivityIndicator size="small" color={colors.gray500}`, 26×26 컨테이너로 자리 고정 | `disabled` — 탭 무반응, 햅틱·네비게이션 없음. 눌림 opacity 변화도 없음 |
| **Success** (ready, AC-2/AC-5) | 썸네일 100% | 보조 `작가의 시선으로 전시 보기` | `play-circle-outline` 26 `text-primary` | 탭 → `Haptics.Light` → `store` 주입 후 `router.replace('/description')` (기존 `handlePlay`와 동일 경로) |
| **Error** (failed, AC-7) | 썸네일 100% | 보조 `해설을 불러오지 못했어요 · 탭해서 다시 시도` (`text-error`) | `refresh-outline` 26 `text-gray600` — 기존 작품 트랙 실패 표현과 동일 | 탭 → `Haptics.Light` → 재생성 트리거 → 즉시 Loading 상태로 전환. Alert 없음 |
| **Hidden** (AC-6) | — | — | — | `artist` 없음/`exhibitionId === null` → 트랙·구분선 모두 미렌더. 화면이 도입 전과 픽셀 동일 |
| **Reset** (AC-8) | — | — | — | 몰입 종료 후 다른 전시 진입 시 이전 트랙이 남지 않는다. 세션 상태이므로 `persist` 대상에서 제외 권장(01-spec Risks 참고) |

전환 규칙: Loading → Success는 **화면 재진입 없이** 우측 컨트롤만 스왑된다(AC-5). 별도 애니메이션 없음 — 레이아웃 시프트를 막기 위해 우측 컨트롤 슬롯은 세 상태 모두 **26×26 고정**.

## Accessibility

| 요소 | role | label | 비고 |
|------|------|-------|------|
| 트랙 행 (loading) | `button` | `작가 소개 해설 준비 중` | `accessibilityState={{ disabled: true, busy: true }}` |
| 트랙 행 (ready) | `button` | `작가 소개 재생, {artist}` | `accessibilityHint='작가 소개 해설 화면으로 이동해요'` |
| 트랙 행 (failed) | `button` | `작가 소개 해설 다시 생성` | 아이콘 단독이 아니어도 상태가 label에 드러나야 함 |
| 썸네일 | `image` (ImageFallback 내부 처리) | 지정하지 않음 (장식적 — 행 label이 정보를 전달) | `ImageFallback`에 `accessibilityLabel` 미전달 → role 자동 미부여 |
| 배지 | 없음 | 없음 | 시각 전용. 스크린리더 중복 읽기 방지를 위해 배지 텍스트는 행 label에 이미 `작가 소개`로 포함됨 |

- **터치 타겟**: 행 전체가 `Pressable`이며 `py-4` + 56px 썸네일로 **높이 ≥ 88pt**, 폭은 화면 전체 폭 - 48. 44pt 기준 충족. (기존 작품 트랙은 26px 아이콘만 탭 가능해 44pt 미달인데, 이 신규 트랙은 그 문제를 답습하지 않는다. 기존 트랙 수정은 이번 범위 밖.)
- **대비** (배경 `#171412` 기준, WCAG AA):
  - `text-on-dark` #E8E8E8 → **14.7:1** ✅ (본문 4.5:1)
  - `text-gray600` #78716C → **3.82:1** — 비텍스트/보조 3:1 ✅, 본문 4.5:1은 미달. **기존 작품 트랙 보조 텍스트와 동일한 취급**이므로 일관성 유지 차원에서 그대로 쓴다(신규 회귀 아님). 상태를 좌우하는 실패 문구는 아래 `text-error`로 올린다.
  - `text-error` #EF4444 → **4.87:1** ✅ (본문 통과)
  - `text-primary` #AB77F1 (아이콘·배지 텍스트) → **5.80:1** ✅
  - `bg-primary/15` 배지 배경 위 `text-primary` → 배경이 6% 흰색 카드 위 15% 틴트라 실효 대비는 primary 대 다크 배경(5.80:1)에 근접 ✅
  - `colors.gray500` 스피너 #A8A29E → **7.27:1** ✅ (비텍스트 3:1 여유)
- **색상 단독 의존 금지**: 3상태는 색이 아니라 **아이콘 모양(스피너/▶/↻) + 보조 문구**로 구분된다. 색맹 사용자도 판별 가능.
- 실패를 Alert가 아닌 인라인으로 표현하므로 스크린리더 사용자에게는 행 label 변경으로 상태가 전달된다.

## Prototype scope

G4 스모크 기준선:

- [x] Static layout only — 3상태 각각의 시각 확인
- [x] Navigation wired — Success 상태 탭 → `/description` 이동 1회 확인
- [x] Fake data / stub API — Edge Function·캐시 테이블 없이 `status`를 하드코딩 스텁으로 순환시켜 loading → ready → failed 3상태를 캡처한다

프로토타입 통과 조건: 재생목록 스크린샷에서 (1) 작품 0개 상태에서도 트랙이 최상단에 보이고, (2) loading 상태 탭이 무반응이며, (3) ready 상태 탭이 해설 화면으로 이동한다.

## Out of design scope

- **단체전 UI 없음** — `artist` 미보유 전시에 대한 대체 트랙·안내 문구·플레이스홀더를 만들지 않는다 (01-spec Non-goals).
- **"몰입 준비중" 로딩 화면/타이머/진행률 UI 없음.** 로딩은 트랙 우측 인디케이터가 전부.
- **`ImmersiveOverlay`(몰입 진입 연출) 미변경** — 타이밍·문구·지속시간 손대지 않는다.
- **북마크(하트) 아이콘 없음.**
- **`description.tsx` 레이아웃 변경 없음** — 인트로 본문도 기존 해설 화면 그대로 표시. 인트로 전용 헤더/배지를 추가하지 않는다.
- **캐시 무효화·재생성 UI 없음** (실패 재시도 제외).
- **기존 작품 트랙 리팩터링 안 함** — 44pt 미달 탭 타겟, 하드코딩 `#60A5FA`, `FAILED_DESCRIPTION` 문자열 비교 방식은 인지하되 이번 diff에서 건드리지 않는다.
- **`.docs/DESIGN_SYSTEM.md` §1.3 표의 구 팔레트 갱신** — 별도 문서 작업.
- **신규 컬러/폰트/스페이싱 토큰 도입 없음** (`accent` 민트 포함 미사용).
