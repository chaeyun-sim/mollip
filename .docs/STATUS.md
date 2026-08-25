# mollip FE 구현 현황 (STATUS)

FE 구현 현황의 단일 정본. 코드 탐색 전에 먼저 읽을 것.

갱신 규칙: 기능 완료 시 관련 섹션(라우트/컴포넌트/스토어/훅/Edge Function/테스트)을 갱신한다. 과거 이력은 git log로 확인하며, 이 문서는 과거 이력을 쌓지 않고 항상 현재 스냅샷만 유지한다.

기준 시점: 2026-08-25, 최신 커밋 `6031f88 feat(app): 작품 상세 화면 제거 (몰입모드 재생목록으로 대체)`

## 1. 라우트 (`app/`, expo-router)

### 최상위 / 레이아웃

| 파일                     | 역할                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `app/_layout.tsx`        | 루트 레이아웃 — 폰트 로드(Pretendard, Hahmlet, cormorant-garamond, nanum-pen-script), 전역 provider |
| `app/notifications.tsx`  | 알림 목록 화면                                                                                      |
| `app/privacy-policy.tsx` | 개인정보처리방침                                                                                    |
| `app/terms.tsx`          | 이용약관                                                                                            |

### `(tabs)` — 하단 탭

| 파일                         | 역할                               |
| ---------------------------- | ---------------------------------- |
| `app/(tabs)/_layout.tsx`     | 탭 네비게이션 레이아웃             |
| `app/(tabs)/index.tsx`       | 홈(탐색) 화면 — `ExploreScreen`    |
| `app/(tabs)/exhibitions.tsx` | 전시 목록 화면                     |
| `app/(tabs)/map.tsx`         | 지도 화면 — 전시관 마커, 경로 계획 |
| `app/(tabs)/search.tsx`      | 검색 화면                          |
| `app/(tabs)/diary.tsx`       | 관람 기록(다이어리) 홈             |

### `(explore)` — 전시 상세/경로

| 파일                        | 역할                                      |
| --------------------------- | ----------------------------------------- |
| `app/(explore)/_layout.tsx` | 전시 상세 스택 레이아웃                   |
| `app/(explore)/[id].tsx`    | 전시 상세 화면 — `ExhibitionDetailScreen` |
| `app/(explore)/route.tsx`   | 전시관까지 길찾기 경로 화면               |

### `(guide)` — 오디오 가이드 플로우 (CLAUDE.md App Flow 참고)

| 파일                                 | 역할                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `app/(guide)/_layout.tsx`            | 가이드 플로우 스택 레이아웃                                                           |
| `app/(guide)/create-description.tsx` | 이미지/수동 입력 진입점 — `IndexScreen`                                               |
| `app/(guide)/manual.tsx`             | 작품 정보 수동 입력                                                                   |
| `app/(guide)/description.tsx`        | AI 생성 작품 설명 + TTS 재생 (타이프라이터 애니메이션)                                |
| `app/(guide)/chat.tsx`               | AI 도슨트와의 채팅 Q&A                                                                |
| `app/(guide)/playlist.tsx`           | 몰입모드 재생목록 — 작품 상세 화면(구 `[id].tsx`)을 대체 (2026-08-25, 커밋 `6031f88`) |
| `app/(guide)/immersive-start.tsx`    | 몰입모드 시작 화면                                                                    |
| `app/(guide)/exit-summary.tsx`       | 관람 종료 요약 화면                                                                   |

### `auth`

| 파일                   | 역할                      |
| ---------------------- | ------------------------- |
| `app/auth/_layout.tsx` | 인증 스택 레이아웃        |
| `app/auth/login.tsx`   | 로그인 화면 (소셜 로그인) |

### `onboarding`

| 파일                          | 역할                            |
| ----------------------------- | ------------------------------- |
| `app/onboarding/index.tsx`    | 온보딩 시작(취향 선택 스와이프) |
| `app/onboarding/location.tsx` | 온보딩 — 위치 권한/설정         |

### `diary`

| 파일                   | 역할                    |
| ---------------------- | ----------------------- |
| `app/diary/[date].tsx` | 특정 날짜 다이어리 상세 |

### `settings`

| 파일                                   | 역할                          |
| -------------------------------------- | ----------------------------- |
| `app/settings/_layout.tsx`             | 설정 스택 레이아웃            |
| `app/settings/index.tsx`               | 설정 메인 (토글 등)           |
| `app/settings/account.tsx`             | 계정 정보                     |
| `app/settings/delete-account.tsx`      | 계정 삭제                     |
| `app/settings/description.tsx`         | 설명 관련 설정                |
| `app/settings/inquiry.tsx`             | 문의하기                      |
| `app/settings/preferences.tsx`         | 취향/선호 설정                |
| `app/settings/voice.tsx`               | TTS 음성 선택 설정            |
| `app/settings/bookmark/audio.tsx`      | 오디오 북마크(청취 기록) 목록 |
| `app/settings/bookmark/exhibition.tsx` | 전시 북마크 목록              |

## 2. `src/components/` 도메인별 인벤토리

| 도메인        | 파일 수                       | 비고                                                                                                                                                            |
| ------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `archive/`    | 17                            | 관람 기록/티켓 UI 대부분 — `VisitTicket*`, `DiaryCalendar`, `ArchiveTabBar`, `PlaylistModal` 등. 컬러 팔레트는 `archivePalette.ts` (DESIGN_SYSTEM.md §1.4 참고) |
| `auth/`       | 2                             | `SocialPill`, `LoginRequiredPressable`                                                                                                                          |
| `character/`  | 0                             | **디렉터리는 존재하나 파일 없음** — 미사용/정리 대상 후보                                                                                                       |
| `common/`     | 14                            | 도메인 무관 공통 UI — `SearchBar`, `Fab`, `Chip`, `DatePickerModal`, `RetryErrorState`, `WarmGradientBackdrop` 등                                               |
| `explore/`    | 19                            | 전시 탐색/상세 관련 최대 규모 도메인 — 카드, 상세 헤더, 몰입모드 오버레이, 경로 시트(`RouteSheet.tsx`, `map/`에도 동명 파일 존재 — 중복 명칭 주의)              |
| `guide/`      | 5                             | 오디오 가이드 채팅/입력 필드 UI                                                                                                                                 |
| `layout/`     | 3 (+ `Loading/` 서브디렉터리) | `Screen.tsx`, `ScreenHeader.tsx` — 모든 화면의 레이아웃 프리미티브 (CLAUDE.md에 명시)                                                                           |
| `map/`        | 10                            | 지도 마커, 경로 시트, 필터 칩 등. 노선 색상은 `src/utils/routeColors.ts` 참조                                                                                   |
| `mypage/`     | 5 (+ `index.ts`)              | 설정 화면 카드/셀렉터 UI                                                                                                                                        |
| `onboarding/` | 3                             | 온보딩 스와이프 카드 UI                                                                                                                                         |
| `search/`     | 4                             | 검색 결과 카드, 필터 바, 상태 배지                                                                                                                              |
| `settings/`   | 1                             | `VoiceListSkeletonItem` — 설정 화면 UI 조각이 대부분 `mypage/`에 있어 상대적으로 적음                                                                           |

## 3. `src/store/` — Zustand 스토어 (반응형)

| 파일                    | 역할                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `authStore.ts`          | Supabase 세션/유저 상태                                           |
| `bookmarkStore.ts`      | 전시 북마크, `persist` 미들웨어로 영속화                          |
| `bookmarkAudioStore.ts` | 오디오(청취) 북마크, `persist`                                    |
| `chatStore.ts`          | 채팅 메시지 목록 + API 호출용 history (CLAUDE.md에 명시)          |
| `historyStore.ts`       | 방문/청취 이력, `persist`                                         |
| `immersiveStore.ts`     | 몰입모드 재생목록 상태(`PlaylistItem`), `persist`                 |
| `mapStore.ts`           | 지도 카메라 이동 대기(`PendingCamera`) 등 지도 UI 상태            |
| `recentSearchStore.ts`  | 최근 검색어, `persist` (최대 10개)                                |
| `settingsStore.ts`      | `voiceId`, `voiceSpeed`, `fontSize` (CLAUDE.md에 명시), `persist` |
| `visitStore.ts`         | 방문 기록, `persist`                                              |

## 4. `src/store.ts` — 비반응형 전역 mutable 객체

CLAUDE.md에 이미 설명된 대로, 화면 간 전달되는 임시 세션 데이터를 담는다. 직접 mutate되며 영속화되지 않는다.

필드: `imageBase64`, `imageMediaType`, `extractedText`, `artworkDescription`, `artworkImageUrl`, `inputMode`, `manualTitle`, `manualArtist`, `manualYear`.

## 5. `src/hooks/` — 커스텀 훅 (34개)

데이터 페칭(`useAllExhibitions`, `useCultureExhibitions`, `useKcisaExhibitions`, `useExhibitionDetail`, `useVenueExhibitions` 등), 지도(`useMapCamera`, `useMapFilter`, `useMapMarkers`, `useMapVenues`, `useDirections`), 동기화(`useBookmarkSync`, `useBookmarkAudioSync`, `useHistorySync`, `useVisitSync`), TTS(`useTTS.ts` — CLAUDE.md에 상세 설명됨), 인증(`useRequireAuth`), 기타(`useDescriptionStream`, `usePushNotifications`, `useShareExhibition`, `useUserLocation` 등)로 구성. 전체 목록은 `ls src/hooks`로 확인.

## 6. `supabase/functions/` — Edge Functions

**주의: CLAUDE.md의 Edge Function 표(5개)는 오래되어 실제 상태와 다르다.** 실제로는 아래 12개가 존재한다 (CLAUDE.md 갱신 필요 — 이 STATUS.md가 정본).

| Edge Function          | CLAUDE.md에 문서화됨? | 비고                                                                                                  |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------------------- |
| `extract-text`         | O                     | OCR (이미지 → 작품 텍스트)                                                                            |
| `stream-description`   | O                     | 작품 설명 스트리밍 생성                                                                               |
| `stream-chat`          | O                     | 도슨트 채팅 스트리밍                                                                                  |
| `voices`               | O                     | ElevenLabs 음성 목록 프록시                                                                           |
| `tts`                  | O                     | ElevenLabs TTS 프록시                                                                                 |
| `_shared`              | 미문서화              | 공유 유틸리티 (함수 아님, 헬퍼 코드)                                                                  |
| `delete-account`       | 미문서화              | 계정 삭제 처리                                                                                        |
| `generate-route`       | 미문서화              | 길찾기 경로 생성 (커밋 `bf20826` 몰입모드 개편과 관련 추정)                                           |
| `image-proxy`          | 미문서화              | 이미지 프록시 — 커밋 `e145f90`에서 추가된 위키 이미지 매칭용 (CLAUDE.md에도 없고 별도 기능 정리 필요) |
| `kakao-local-search`   | 미문서화              | 카카오 로컬 검색 프록시                                                                               |
| `naver-local-search`   | 미문서화              | 네이버 로컬 검색 프록시                                                                               |
| `send-recommendations` | 미문서화              | 추천 전송                                                                                             |

## 7. 테스트 커버리지 현황

`package.json`의 jest 설정(`testMatch: **/__tests__/**/*.test.ts?(x)`) 기준, 현재 존재하는 테스트 파일:

- `src/utils/__tests__/exhibitionSearch.test.ts` — 전시 검색 유틸 테스트 (CLAUDE.md에 "Jest covers exhibition search utils"로 명시된 바로 그 테스트)

그 외 `src/utils/`(27개 파일), `src/hooks/`(34개), `src/store/`(9개), `src/components/`(전체) 등 대부분의 도메인 로직에는 테스트가 없다. 새 도메인 로직 추가 시 CLAUDE.md 지침대로 테스트 확장이 필요하다.
