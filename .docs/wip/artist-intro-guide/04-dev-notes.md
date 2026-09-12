---
feature-slug: artist-intro-guide
author: chris
status: in-progress
---

# Dev notes

## Implemented ACs

| AC | Status | Files |
|----|--------|-------|
| AC-1 캐시 미스 시 백그라운드 생성 트리거 | Done | `supabase/migrations/20260828000000_create_artist_intros.sql`, `supabase/functions/generate-artist-intro/index.ts`, `src/utils/api.ts`, `src/utils/artistIntro.ts`, `src/store/artistIntroStore.ts`, `app/(guide)/immersive-start.tsx`, `src/types/database.types.ts` |
| AC-2 전역 캐시 저장·재사용 | Done | `src/utils/artistIntro.ts`, `src/store/artistIntroStore.ts` |
| AC-3 최상단 고정 트랙 | Done | `src/components/guide/ArtistIntroTrack.tsx`, `app/(guide)/playlist.tsx` |
| AC-4 생성 중 disabled + ActivityIndicator | Done | `src/components/guide/ArtistIntroTrack.tsx` |
| AC-5 재진입 없이 활성 전환 → 재생 | Done | `src/store/artistIntroStore.ts`, `app/(guide)/playlist.tsx`, `src/store.ts`, `src/hooks/useDescriptionStream.ts` |
| AC-6 artist 없음 → 완전 스킵 | Done | `src/store/artistIntroStore.ts`, `app/(guide)/playlist.tsx` |
| AC-7 실패 표시 + 탭 재시도 | Done | `src/store/artistIntroStore.ts`, `src/components/guide/ArtistIntroTrack.tsx`, `app/(guide)/playlist.tsx` |
| AC-8 종료 시 세션 상태 초기화 | Done | `src/store/immersiveStore.ts`, `src/store/artistIntroStore.ts` |

## 구현 요약 (AC별)

### AC-1 — 백그라운드 생성 트리거

- **캐시 테이블**: `public.artist_intros (artist text pk, intro text, updated_at timestamptz)`. `artist_artworks`(작가명 키 + 전역 캐시) 선례를 그대로 따랐다. RLS를 켜고 select/insert/update 모두 `using (true)` — 01-spec Risks의 "정책 없으면 캐시 히트가 영구히 발생하지 않는 조용한 실패"를 막기 위해 비로그인 포함 전원 읽기·쓰기 허용.
- **Edge Function** `generate-artist-intro`: `stream-description`과 달리 **non-streaming**. 인트로는 타이프라이터 표시가 필수가 아니고(01-spec Risks 결정 위임), 결과를 통째로 캐시에 넣어야 하므로 단발 JSON(`{ intro }`)이 더 단순하다. 프롬프트는 생애 + 철학·미학적 태도 + 감상 관점 안내, 분량은 `DESCRIPTION_PROMPT`의 일반 작품 기준(220~280자)에 맞춰 "작품 해설과 비슷한 길이" 요구를 반영.
- **언마운트 생존**: 01-spec Risks의 "`router.replace`로 immersive-start가 언마운트되면 생성이 끊긴다"를 해결하기 위해, 생성 작업을 컴포넌트가 아니라 **모듈 스코프 Zustand 스토어 액션**(`artistIntroStore.prepare`)에서 돌린다. 화면은 `prepare()`를 호출만 하고 await하지 않으므로 시작 흐름에 지연이 0이다(로딩 화면·문구 추가 없음).
- 트리거 지점: `immersive-start.tsx` `handleSubmit` — `enterImmersive()` 직후 `prepareArtistIntro(exhibitionId, title)`.

### AC-2 — 전역 캐시 재사용

`artistIntroStore`의 `load()`가 항상 `readArtistIntroCache(artist)`를 먼저 조회하고, 히트면 `generateArtistIntro` 호출 없이 곧바로 `status: 'ready'`로 간다. 미스일 때만 생성 후 `writeArtistIntroCache`(fire-and-forget upsert, `artist_artworks` 선례와 동일).

### AC-3~AC-6 — 트랙 렌더링

- `src/components/guide/ArtistIntroTrack.tsx` — named export, Props는 02-design-brief 계약 그대로 (`artist` / `imageUrl` / `status` / `onPress`). `app/`에 인라인하지 않았다.
- 기존 작품 트랙의 골격(56px `ImageFallback` + `flex-1 gap-1` 텍스트 스택 + 26px 우측 아이콘, `text-[15px] semibold` 제목 / `text-[13px] regular` 보조)을 그대로 재사용했고, 카드 배경 `bg-white/6 rounded-2xl` + `작가 소개` 배지 + 하단 hairline 3가지로만 구분했다. 신규 토큰 0건.
- 배치: `재생목록` 라벨 바로 아래 `renderArtistIntroTrack()` 한 줄. 빈 상태/목록 상태 분기 **바깥**이라 작품 0개일 때도 항상 최상단이며 기존 `아직 들은 작품이 없어요` 블록은 그 아래에 그대로 남는다.
- AC-6 스킵 분기는 `renderArtistIntroTrack()` 안에서 `!exhibitionId || !introArtist || status === 'idle'` → `null`. `prepare()`도 `exhibitionId`가 없으면 즉시 return하고, `artist`가 비어 있으면 생성 API를 호출하지 않는다.
- AC-4: `status === 'loading'`이면 `disabled` + `accessibilityState={{ disabled: true, busy: true }}`, 우측은 `ActivityIndicator color={colors.gray500}`. 썸네일·제목만 `opacity-60`.
- AC-5: 상태는 Zustand 구독이라 `playlist.tsx`가 마운트된 채로 `loading → ready` 전환 시 우측 컨트롤만 스왑된다. 세 상태 모두 우측 슬롯을 `w-[26px] h-[26px]`로 고정해 레이아웃 시프트가 없다.

### AC-7 — 실패 + 재시도

`failed`면 보조 문구를 `text-error`로, 아이콘을 `refresh-outline`/`text-gray600`으로 바꾸고, 탭하면 `retry()`가 즉시 `loading`으로 되돌린 뒤 재생성한다. Alert·토스트 없음.

### AC-8 — 세션 상태 초기화

- `artistIntroStore`는 **`persist` 미적용**(01-spec Risks: 앱 재시작 후 `loading`이 영구히 굳는 문제 방지). 별도 스토어 파일로 분리해 `immersiveStore`의 persist 대상에 섞이지 않게 했다.
- `immersiveStore.exit()` 안에서 `useArtistIntroStore.getState().reset()`을 호출한다 — `playlist.tsx`와 `exit-summary.tsx` **양쪽 종료 경로**를 한 곳에서 커버하기 위해 화면이 아니라 스토어에 넣었다.
- 종료 시점에 생성이 아직 진행 중일 수 있으므로 **세션 토큰**(모듈 스코프 카운터)을 두고, `prepare`/`reset` 때 증가시킨다. 토큰이 바뀐 뒤 도착한 응답의 `set()`은 버린다 — 이전 전시의 트랙이 새 세션에 되살아나는 것을 막는다.

## Changed files

신규:

- `supabase/migrations/20260828000000_create_artist_intros.sql`
- `supabase/functions/generate-artist-intro/index.ts`
- `src/utils/artistIntro.ts`
- `src/store/artistIntroStore.ts`
- `src/components/guide/ArtistIntroTrack.tsx`

수정:

- `src/types/database.types.ts` — 타입 보강(아래 참고)
- `src/utils/api.ts` — `generateArtistIntro()` 추가
- `src/store.ts` — `isArtistIntro` 플래그 추가
- `src/store/immersiveStore.ts` — `exit()`에서 인트로 상태 리셋
- `src/hooks/useDescriptionStream.ts` — 인트로는 재생목록에 쌓지 않음
- `app/(guide)/immersive-start.tsx` — `prepare()` 트리거
- `app/(guide)/playlist.tsx` — 트랙 조립 + `handlePlayArtistIntro`
- `app/(guide)/manual.tsx`, `app/(guide)/create-description.tsx` — `isArtistIntro = false` 리셋(2곳)

`app/(guide)/description.tsx`는 **변경하지 않았다** — 01-spec대로 기존 `store.artworkDescription` 주입 경로를 그대로 사용한다.

## 타입 보강 (01-spec Risks 대응)

`npm run gen:types`는 Supabase 프로젝트 자격증명이 필요해 이 세션에서 실행할 수 없었다. 대신 `src/types/database.types.ts`를 **수동 보강**했다 (각 위치에 `// [수동 보강]` 주석 표시):

1. `exhibitions.artist: string | null` — Row / Insert / Update 3곳
2. `artist_intros` 테이블 블록 전체 (Row / Insert / Update / Relationships)

다음에 `npm run gen:types`를 돌리면 자동 생성분이 이 보강을 대체하며, 그때 주석도 함께 사라진다(DB에 컬럼·테이블이 실제로 존재하면 타입은 동일하게 유지된다). **마이그레이션을 아직 원격에 적용하지 않았다면 `gen:types`가 `artist_intros`를 지워버리므로, 순서는 migration apply → gen:types 여야 한다.**

## Deviations from spec/brief

1. **인트로 재생 시 재생목록에 작품 트랙으로 쌓이지 않게 막았다.** `useDescriptionStream`은 몰입 모드에서 해설 완료 시 무조건 `addToPlaylist`를 호출하는데, 이대로면 인트로 재생 후 (a) 재생목록에 작가명 트랙이 중복 생성되고 (b) 히어로의 `지금까지 N개의 작품을 만났어요` 카운트가 올라간다. 02-design-brief가 "작가 소개는 카운트 문구에 포함하지 않는다 / N은 스캔 작품 수 그대로"라고 못박았으므로, `src/store.ts`에 `isArtistIntro` 세션 플래그를 추가하고 해당 조건에서만 `addToPlaylist`를 건너뛰게 했다. `audio_guides` 저장(`description.tsx`)과 관람 기록(`recordListened`)은 **그대로 유지**되므로 01-spec Open questions의 "청취 이력 포함" 결정은 지켜진다.
2. **Alex Suggestion 3 반영** — `ArtistIntroTrack`에서 `loading → ready` 전환 시 `AccessibilityInfo.announceForAccessibility('작가 소개 해설이 준비됐어요')`를 호출한다. 시각적으로는 브리프대로 컨트롤만 스왑되고, 보조기술 사용자에게만 추가로 알린다.
3. **Alex Suggestion 4는 반영하지 않았다** — 실패 문구는 브리프 정본 그대로 `해설을 불러오지 못했어요 · 탭해서 다시 시도`를 `numberOfLines={1}`로 쓴다. 좁은 기기(SE)에서 말줄임될 수 있으니 Taylor가 실기기 폭에서 확인 필요. 잘림이 확인되면 Alex가 제시한 축약안(`불러오지 못했어요 · 다시 시도`)으로 교체 판단.
4. **Alex Suggestion 1/2(행 높이·텍스트 크기)**: 배지 한 줄이 추가되어 이 트랙의 행 높이가 기존 작품 트랙보다 약 20px 높다(의도된 차이). 제목·보조 텍스트 크기는 브리프에 수치가 없어 기존 작품 트랙과 동일하게 `text-[15px] semibold` / `text-[13px] regular`로 맞췄다.
5. 그 외 카피·토큰·Props 계약·a11y 라벨은 02-design-brief 문구를 그대로 사용했다.

## Blockers for Taylor (QA)

구조적 차단은 없다. 다만 아래는 코드로 해결 불가능한 **환경 의존** 항목이라 QA 전에 확인이 필요하다:

1. **마이그레이션 미적용** — `supabase/migrations/20260828000000_create_artist_intros.sql`을 원격 프로젝트에 적용해야 캐시가 동작한다. 적용 전에는 `readArtistIntroCache`가 항상 null을 반환해 **매번 재생성**된다(AC-2 실패로 보임). AC-2 검증 시 반드시 선행.
2. **Edge Function 미배포** — `supabase functions deploy generate-artist-intro` 및 `ANTHROPIC_KEY` 시크릿 설정이 필요하다. 미배포 상태에서는 항상 AC-7의 failed 상태로 떨어진다(= 실패 UI 검증에는 오히려 유용).
3. **테스트 데이터** — `exhibitions.artist`가 채워진 전시 레코드가 있어야 AC-1~AC-5·AC-7을 볼 수 있다. 없으면 AC-6(스킵 경로)만 검증 가능.
4. **AC-6 회귀 확인 포인트** — 전시 제목을 검색 선택 없이 직접 타이핑해 진입했을 때 트랙·구분선이 모두 미렌더인지, 그리고 네트워크 로그에 `generate-artist-intro` 호출이 없는지.
5. **lint 베이스라인** — `npx expo lint` 오류 수가 66 → 68로 늘었다. 신규 2건은 기존 코드와 **동일한 기존 패턴**(모듈 스코프 `store` 객체 직접 대입 / `useRef(...).current` 초기값 읽기)이며 신규 파일 3개(`ArtistIntroTrack.tsx`, `artistIntroStore.ts`, `artistIntro.ts`)는 lint 오류 0건이다.

## 자체 확인 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | 0 errors |
| `npm test` (jest) | 2 suites / 37 tests pass |
| `npx prettier --check` (변경 파일) | pass |
| 시뮬레이터 스크린샷·인터랙션 | 미실시 — Taylor 담당 |

## Native / env notes

- **네이티브 모듈 추가/제거 없음** → `pod install` / `npx expo run:ios` 리빌드 불필요. JS 리로드로 검증 가능하다.
- 신규 환경 변수 없음. Edge Function은 기존 `ANTHROPIC_KEY` 시크릿을 그대로 쓴다.
- 신규 npm 의존성 없음.
