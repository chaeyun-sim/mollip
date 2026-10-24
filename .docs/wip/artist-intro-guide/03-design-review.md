---
feature-slug: artist-intro-guide
author: alex
iteration: 1
verdict: Pass
---

# Design review — 몰입 모드 작가 소개 인트로 트랙

## Verdict

- **Pass**
- Iteration: 1 / 3
- 대상: `02-design-brief.md` (sam, draft) / 대조: `01-spec.md` (AC-1~AC-8), `.docs/DESIGN_SYSTEM.md`, `.claude/rules/component-convention.md`

## Scores (1–5)

| Dimension            | Score   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brand & tokens       | 5       | Tokens 표의 값을 `tailwind.config.js` 실측과 대조 — `primary #AB77F1`, `accent #00E9C8`, `gray500 #A8A29E`, `gray600 #78716C`, `on-dark #E8E8E8`, `error #EF4444`, `bg-dark #171412` 전부 일치. 신규 토큰 도입 0건이고 `accent`(민트) 미사용 선언도 있다. DESIGN_SYSTEM §1.3 표가 구 팔레트(`#81759B`)를 적고 있는 드리프트를 브리프가 먼저 인지하고, §1.1(“정본은 tailwind.config.js”)을 근거로 tailwind 값을 따르기로 한 판단이 정본 규칙과 정확히 일치한다. `bg-white/6`·`border-*-white/6`는 이미 `playlist.tsx:81`, `playlist.tsx:118`, `create-description.tsx:299`에 선례가 있어 NativeWind에서 동작이 검증된 표기다. `ActivityIndicator color`와 `StyleSheet.hairlineWidth`만 `style`로 두고 사유를 convention §2 예외에 매핑한 것도 정확. 폰트는 `font-pretendard-*` className만 사용(§2 폰트 규칙 준수).                                                                                                                                                                                                                         |
| Layout & IA          | 4       | 배치가 AC-3을 정확히 만족한다: `재생목록` 섹션 라벨 아래·작품 목록 위 고정, `playlist.length === 0`일 때도 빈 상태 블록 **위**에 렌더. 하단 hairline이 기존 작품 트랙의 `borderTopWidth: index === 0 ? 0 : hairline`(playlist.tsx:120)과 겹치지 않아 이중선이 생기지 않는 것까지 코드 구조와 일관된다. 재사용 컴포넌트 지정(`Screen`, `ScreenHeader.Right`, `ImageFallback` + `heroImageUri`/`iconSize={22}`/`resizeMode="cover"`)이 실제 시그니처와 맞고, `src/components/guide/`는 이미 존재하는 도메인 폴더라 §9 파일 구조 위반이 없다. Props 계약이 `{컴포넌트명}Props` 네이밍(§1)·`on` 접두사(§6)·named export(§5)를 따르고, `&&` 단축 렌더(§11.3)·`playlist.tsx` 100줄 초과 근거(§9.3/§9.4)까지 명시. 감점 사유: Design intent는 “기존 트랙 골격(썸네일 56 + **2줄** 텍스트) 그대로 재사용”이라 적었는데 실제 레이아웃은 배지/제목/보조 **3줄**이라 행 높이가 기존 트랙보다 커진다(내부 불일치, 아래 Suggestion 1). 제목·보조 텍스트의 `text-[15px]`/`text-[13px]` 수치가 표에 없어 Chris가 기존 행에서 추론해야 한다(Suggestion 2). |
| Copy & tone          | 5       | Copy 표에 배지/Title/Loading/Success/Error/CTA/Empty/전역 Error/해설 화면 제목 9행이 모두 채워져 빈 칸이 없다. `해설을 준비하고 있어요` / `작가의 시선으로 전시 보기` / `해설을 불러오지 못했어요 · 탭해서 다시 시도`가 기존 재생목록 문구(`아직 들은 작품이 없어요`, `작품을 스캔하면 해설이 여기에 쌓여요` — playlist.tsx:96,110)와 같은 `~어요` 존댓말·마침표 없음 규칙으로 통일됐고, 그 규칙을 명문화까지 했다. Empty 행을 “이 트랙 전용 empty 없음 + 기존 문구 유지”로 처리한 것이 AC-3의 “빈 상태 대신이 아니라 그 위에”라는 요구와 정확히 대응한다. 전역 Error를 “Alert·토스트 없음”으로 못박아 AC-4/AC-7의 “별도 안내 문구 없음”을 지킨다.                                                                                                                                                                                                                                                                                                                                                                                         |
| Accessibility        | 4       | 3상태 각각의 `accessibilityRole='button'` + label이 표로 명시되고, loading은 `accessibilityState={{ disabled: true, busy: true }}`까지 지정 — AC-4의 “탭 무반응”을 시각·보조기술 양쪽에서 표현한다. 터치 타겟은 행 전체 `Pressable` + `py-4` + 56px 썸네일로 ≥88pt라 44pt 기준을 여유 있게 넘고, 기존 작품 트랙(아이콘 26px만 탭 가능 — playlist.tsx:147)의 미달 문제를 답습하지 않겠다고 근거까지 남겼다. 색상 단독 의존 금지(스피너/▶/↻ 아이콘 모양 + 보조 문구로 구분)를 명시한 점이 좋다. 대비 수치는 내 재계산과 최대 ±0.4 차이(`text-error` 4.87 vs 실계산 ≈5.2, `text-primary` 5.80 vs ≈5.5)가 있으나 AA 통과/미통과 결론은 모두 동일하며, `text-gray600` 3.82:1이 본문 4.5:1 미달임을 숨기지 않고 “기존 트랙과 동일 취급 + 실패 문구는 `text-error`로 승격”이라는 완화책을 붙인 것은 타당한 처리다. 감점 사유: AC-5의 loading→ready 전환이 “우측 컨트롤만 스왑”이라 스크린리더 사용자에게는 무음 변화다(포커스가 다른 곳이면 상태 변경이 전달되지 않음, Suggestion 3).                                                             |
| **Weighted overall** | **4.5** | (5 + 4 + 5 + 4) / 4 = 4.5. 항목 최저 4점 — Pass 규칙(overall ≥ 4.0, 항목별 ≥ 3) 충족.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

Pass rule: overall ≥ 4.0 and no dimension < 3.

## AC 커버리지 대조

| AC                                        | 브리프 대응                                                                                             | 판정                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-1 백그라운드 생성, 대기 UI 없음        | Design intent “대기 UI를 늘리지 않는다”, States Loading 행, Out of design scope “몰입 준비중 화면 없음” | Covered                                |
| AC-2 캐시 히트 시 즉시 활성               | States Success 행(진입 직후 ready 진입 경로)                                                            | Covered                                |
| AC-3 최상단 고정 + 빈 상태에서도 노출     | Layout 배치 문단 + 빈 상태 행                                                                           | Covered                                |
| AC-4 loading disabled + ActivityIndicator | States Loading + `disabled`/`accessibilityState` + a11y 표 1행                                          | Covered                                |
| AC-5 재진입 없이 활성 전환                | States 전환 규칙(26×26 슬롯 고정, 컨트롤만 스왑)                                                        | Covered (보조기술 알림은 Suggestion 3) |
| AC-6 artist 없음 → 완전 스킵              | States Hidden 행 + `&&` 단축 렌더 지침 + Props `artist` 비고                                            | Covered                                |
| AC-7 실패 표시 + 탭 재시도                | States Error 행(`refresh-outline`/`text-gray600` — 기존 실패 표현과 동일)                               | Covered                                |
| AC-8 종료 시 상태 초기화                  | States Reset 행 + `persist` 제외 권장                                                                   | Covered                                |

Non-goals 침범 여부: **없음.** 단체전 대체 UI 없음, 로딩 화면/타이머 없음, `ImmersiveOverlay` 미변경, 북마크 UI 없음, `description.tsx` 레이아웃 미변경, 캐시 무효화 UI 없음 — 8개 Non-goal이 “Out of design scope”에 1:1로 반영되어 있다. 확정된 Open questions(썸네일=전시 대표 이미지, 북마크 제외)도 반영됨.

## Blockers (must fix)

없음 — 이번 iteration에서 Pass를 막는 항목이 없다.

## Suggestions (nice to have)

1. Design intent의 “썸네일 56 + **2줄** 텍스트 골격 그대로” 서술과 Layout의 배지/제목/보조 **3줄** 구성이 어긋난다. Design intent 문장을 “썸네일 56 + 텍스트 스택”으로 완화하거나, Layout 표에 “행 높이는 기존 트랙보다 약 6~10px 높아짐(허용)”을 한 줄 덧붙이면 Chris가 규격 차이를 버그로 오인하지 않는다.
2. Layout 표에 제목·보조 텍스트의 크기를 명시하면 좋겠다 — 기존 행 기준 제목 `text-[15px] font-pretendard-semibold`, 보조 `text-[13px] font-pretendard-regular`(playlist.tsx:133,139). 현재는 배지 11px만 수치가 있다.
3. AC-5의 loading → ready 전환을 스크린리더에 전달할 수단(`AccessibilityInfo.announceForAccessibility('작가 소개 해설이 준비됐어요')` 또는 `accessibilityLiveRegion`)을 Accessibility 표에 한 줄 추가하는 것을 권한다. 시각 사용자는 컨트롤 스왑으로 인지하지만 보조기술 사용자에게는 무음 변화다.
4. 실패 보조 문구 `해설을 불러오지 못했어요 · 탭해서 다시 시도`가 `numberOfLines={1}`에서 좁은 기기(SE 등) 폭에 잘릴 수 있다. 축약안(`불러오지 못했어요 · 다시 시도`)을 대안 문구로 병기해 두면 Chris가 판단할 여지가 생긴다.
5. 브리프가 기록한 `#60A5FA` 하드코딩 2곳(playlist.tsx:84,86 — 실제로 확인됨)과 DESIGN_SYSTEM §1.3 구 팔레트 갱신은 범위 밖 처리가 맞다. 다만 별도 티켓으로 남겨 두지 않으면 잊히므로 Manager가 백로그에 등록해 두길 권한다.

## Handoff

- **Pass → Chris (Dev) 착수 가능** (G4 프로토타입 스모크 이후 본 구현 진행). 프로토타입 통과 조건은 브리프 “Prototype scope”의 3항목 — (1) 작품 0개 상태에서 트랙 최상단 노출, (2) loading 탭 무반응, (3) ready 탭 → `/description` 이동 — 을 그대로 사용한다.
- Suggestions 1~4는 Sam이 브리프에 반영해도 좋고, Chris가 구현 중 판단해 `04-dev-notes.md`에 기록해도 된다. 어느 쪽이든 G3 재심사 대상은 아니다.
