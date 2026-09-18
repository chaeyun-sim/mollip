# mollip FE 구현 현황 (STATUS)

FE 구현 현황의 단일 정본. 코드 탐색 전에 먼저 읽을 것.

갱신 규칙: 기능 완료 시 관련 섹션(라우트/컴포넌트/스토어/훅/Edge Function/테스트)을 갱신한다. 과거 이력은 git log로 확인하며, 이 문서는 과거 이력을 쌓지 않고 항상 현재 스냅샷만 유지한다.

기준 시점: 2026-09-17, 최신 커밋 `0ecabe8 feat(app): 문화포털 신규 전시 동기화 시 공식 사이트·설명 함께 채우기` (단, 온보딩 재배선·지도 최근 검색·전시 상세 정보 리팩터 등 이 문서에 반영된 변경 다수는 아직 커밋되지 않은 작업 트리 상태 기준)

## 1. 라우트 (`app/`, expo-router)

### 최상위 / 레이아웃

| 파일                     | 역할                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `app/_layout.tsx`        | 루트 레이아웃 — 폰트 로드(Pretendard, Hahmlet, cormorant-garamond, nanum-pen-script), 전역 provider |
| `app/+not-found.tsx`     | 404 화면                                                                                            |
| `app/bookmark.tsx`       | 북마크 화면 — 전시/오디오 탭 (`app/settings/bookmark/*`와 별개, 탭 전환 UI로 통합 진입)             |
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

| 파일                       | 역할                                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/onboarding/index.tsx` | 온보딩 — 프롤로그(`OnboardingWallPrologue`) → 갤러리 월(작품을 액자에 드래그로 배치, `OnboardingGalleryWall`) → 입장. 기존 트레이 넘기기 방식(`OnboardingArtworkTray`/`OnboardingWallConfirm`/`useOnboardingWallFlow` 등)은 삭제됨 |

위치 권한 페이지(`app/onboarding/location.tsx`)는 2026-08-30 커밋 `ad6a14f`로 온보딩 플로우에서 제거됨.

### `diary`

| 파일                           | 역할                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `app/diary/[date].tsx`         | 특정 날짜 다이어리 상세                                         |
| `app/diary/confirm-visits.tsx` | pending 관람 확정 큐 — 별점 → 감상평(직접 쓰기/생성하기) → 서명 |
| `app/diary/verify-ticket.tsx`  | 관람 인증(티켓 사진 촬영/선택 + 날짜) 화면                      |

### `settings`

| 파일                                   | 역할                                   |
| -------------------------------------- | -------------------------------------- |
| `app/settings/_layout.tsx`             | 설정 스택 레이아웃                     |
| `app/settings/index.tsx`               | 설정 메인 (토글 등)                    |
| `app/settings/account.tsx`             | 계정 정보                              |
| `app/settings/delete-account.tsx`      | 계정 삭제                              |
| `app/settings/description.tsx`         | 설명 관련 설정                         |
| `app/settings/inquiry.tsx`             | 문의하기                               |
| `app/settings/narration.tsx`           | 해설(나레이션) 설정                    |
| `app/settings/notice.tsx`              | 공지사항                               |
| `app/settings/preferences.tsx`         | 내 취향 수정 — 온보딩과 같은 초대권 덱 |
| `app/settings/voice.tsx`               | TTS 음성 선택 설정                     |
| `app/settings/bookmark/audio.tsx`      | 오디오 북마크(청취 기록) 목록          |
| `app/settings/bookmark/exhibition.tsx` | 전시 북마크 목록                       |

## 2. `src/components/` 도메인별 인벤토리

| 도메인        | 파일 수                                                | 비고                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `archive/`    | 13                                                     | 관람 기록/티켓 UI — `VisitTicket*`, `DiaryCalendar`, `DiaryGuidePlayer`, `ReceiptSummary`, `EssayInputSection`(확정 큐 감상평), `PlaylistModal`, `SignaturePad` 등. 컬러 팔레트는 `archivePalette.ts`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `auth/`       | 2                                                      | `SocialPill`, `LoginRequiredPressable`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `common/`     | 20                                                     | 도메인 무관 프리미티브 — `Button`, `IconButton`, `Chip`, `ImageFallback`, `SearchBar`, `TextField`, `DatePickerModal`, `SectionTitle`, `Divider`, `FadeInView`(범용 페이드인 래퍼) 등. `HorizontalSection`/`ExhibitionStatusBadge`는 `explore/`에서 이쪽으로 이동됨                                                                                                                                                                                                                                                                                                                                    |
| `explore/`    | 24                                                     | 전시 탐색/상세 — 카드(`ExhibitionArtworkCard`, `ExhibitionListRow`, `FeaturedExhibitionHero`, `PopularExhibitionAvatar` 등), `CircleActionButton`(상세 히어로 원형 액션 버튼), `ExhibitionVenueInfo`/`ExhibitionInfoRow`(관람 정보, 아이콘 칩 + 외부 지도 앱 연결), `ExhibitionMapPreview`, `RelatedExhibitions`, 몰입모드 오버레이. `ExhibitionTicketCTA`는 `ExhibitionImmersiveCTA.tsx`에서 배럴로 재수출됨. `ExhibitionDetailHero`/`ExhibitionDetailHeader`/`ExhibitionDetailFloatingActions`는 배럴에 남아있지만 `[id].tsx`가 더 이상 쓰지 않는 죽은 export. 경로 시트는 `map/`에도 동명 파일 존재 |
| `guide/`      | 8                                                      | 오디오 가이드 채팅/입력 필드, `SourceActionRow`(작품 입력 카메라·갤러리 행)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `layout/`     | 2 (+ `Loading/` 서브디렉터리)                          | `Screen.tsx`, `ScreenHeader.tsx` — 모든 화면의 레이아웃 프리미티브 (CLAUDE.md에 명시). `Loading/`에 `ExhibitionDetailSkeleton`, `SkeletonBox`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `map/`        | 10 (+ `route-sheet/` 6, `venue-sheet/` 4 서브디렉터리) | 지도 마커, 경로 시트(`RouteSheet` + `route-sheet/` 하위 `RouteCandidateCard`/`RouteTimeline` 등), `VenueSheet` + `venue-sheet/` 하위 컴포넌트, `ExternalMapSheet`, 필터 칩 등. 노선 색상은 `src/utils/routeColors.ts` 참조                                                                                                                                                                                                                                                                                                                                                                             |
| `mypage/`     | 3 (+ `index.ts`)                                       | `CardRow`, `NarrationSettingsFields`, `SettingsCard` — 설정 화면 카드/셀렉터 UI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `onboarding/` | 11                                                     | 프롤로그(`OnboardingWallPrologue`), 갤러리 월 드래그 배치(`OnboardingGalleryWall`/`OnboardingFrame`/`OnboardingPieceCard`/`OnboardingDraggable`), 스킵(`OnboardingSkipAction`), `OnboardingEnter`/`OnboardingIntroStack`/`OnboardingFlowHeader`/`OnboardingSaveErrorBar`/`ListenClipCard`. 티켓 소개·초대권 덱 방식(구 트레이 플로우: `OnboardingArtworkTray`/`OnboardingWallConfirm`/`useOnboardingWallFlow`)은 삭제됨                                                                                                                                                                                |
| `search/`     | 3                                                      | `ExhibitionResultCard`, `SearchFilterBar`, `ExcludeWordsModal`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `settings/`   | 1                                                      | `VoiceListSkeletonItem` — 설정 화면 UI 조각이 대부분 `mypage/`에 있어 상대적으로 적음                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## 3. `src/store/` — Zustand 스토어 (반응형)

| 파일                      | 역할                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| `artistIntroStore.ts`     | 아티스트 소개 오디오 재생 상태                                    |
| `authStore.ts`            | Supabase 세션/유저 상태                                           |
| `bookmarkStore.ts`        | 전시 북마크, `persist` 미들웨어로 영속화                          |
| `bookmarkAudioStore.ts`   | 오디오(청취) 북마크, `persist`                                    |
| `chatStore.ts`            | 채팅 메시지 목록 + API 호출용 history (CLAUDE.md에 명시)          |
| `historyStore.ts`         | 방문/청취 이력, `persist`                                         |
| `immersiveStore.ts`       | 몰입모드 재생목록 상태(`PlaylistItem`), `persist`                 |
| `mapStore.ts`             | 지도 카메라 이동 대기(`PendingCamera`) 등 지도 UI 상태            |
| `offlineDownloadStore.ts` | 오프라인 오디오 다운로드 상태                                     |
| `recentSearchStore.ts`    | 최근 검색어, `persist` (최대 10개)                                |
| `settingsStore.ts`        | `voiceId`, `voiceSpeed`, `fontSize` (CLAUDE.md에 명시), `persist` |
| `subscriptionStore.ts`    | 구독 상태                                                         |
| `visitStore.ts`           | 방문 기록, `persist`                                              |

## 4. `src/store.ts` — 비반응형 전역 mutable 객체

CLAUDE.md에 이미 설명된 대로, 화면 간 전달되는 임시 세션 데이터를 담는다. 직접 mutate되며 영속화되지 않는다.

필드: `imageBase64`, `imageMediaType`, `extractedText`, `artworkDescription`, `artworkImageUrl`, `inputMode`, `manualTitle`, `manualArtist`, `manualYear`.

## 5. `src/hooks/` — 커스텀 훅 (46개)

데이터 페칭(`useAllExhibitions`, `useCultureExhibitions`, `useKcisaExhibitions`, `useExhibitionDetail`, `useVenueExhibitions` 등), 지도(`useMapCamera`, `useMapFilter`, `useMapMarkers`, `useMapVenues`, `useDirections`), 지도 검색바 "최근" 목록(`useRecentEndpoints` — storageKey로 매개변수화된 범용 훅, `useRecentLocations`는 지도 검색바 "최근 방문한 곳" 전용 얇은 래퍼, `useRecentRoutes`는 완료된 길찾기 출발지→도착지 기록. 길찾기 출발지/도착지 자체의 최근 목록은 `RoutePlanningBar.tsx`에서 `useRecentEndpoints`를 서로 다른 storageKey로 직접 2회 인스턴스화 — 셋 다 서로 섞이지 않는 별도 AsyncStorage 키), 동기화(`useBookmarkSync`, `useBookmarkAudioSync`, `useHistorySync`, `useVisitSync`), TTS(`useTTS.ts` — CLAUDE.md에 상세 설명됨, `shouldPlayInBackground: true`로 잠금화면에서도 재생 유지), 인증(`useRequireAuth`), 기타(`useDescriptionStream`, `usePushNotifications`, `useShareExhibition`, `useUserLocation`, `useTextField` 등)로 구성. `useUserLocation`/`useMapCamera`는 `getCurrentPositionAsync` 실패 시 unhandled rejection이 나던 버그를 try/catch로 수정함. 전체 목록은 `ls src/hooks`로 확인.

## 6. `supabase/functions/` — Edge Functions

**주의: CLAUDE.md의 Edge Function 표(5개)는 오래되어 실제 상태와 다르다.** 실제로는 아래 14개가 존재한다 (CLAUDE.md 갱신 필요 — 이 STATUS.md가 정본).

| Edge Function           | CLAUDE.md에 문서화됨? | 비고                                                                                                  |
| ----------------------- | --------------------- | ----------------------------------------------------------------------------------------------------- |
| `extract-text`          | O                     | OCR (이미지 → 작품 텍스트)                                                                            |
| `stream-description`    | O                     | 작품 설명 스트리밍 생성                                                                               |
| `stream-chat`           | O                     | 도슨트 채팅 스트리밍                                                                                  |
| `voices`                | O                     | ElevenLabs 음성 목록 프록시                                                                           |
| `tts`                   | O                     | ElevenLabs TTS 프록시                                                                                 |
| `_shared`               | 미문서화              | 공유 유틸리티 (함수 아님, 헬퍼 코드)                                                                  |
| `delete-account`        | 미문서화              | 계정 삭제 처리                                                                                        |
| `generate-artist-intro` | 미문서화              | 아티스트 소개 오디오/텍스트 생성                                                                      |
| `generate-route`        | 미문서화              | 길찾기 경로 생성 (커밋 `bf20826` 몰입모드 개편과 관련 추정)                                           |
| `image-proxy`           | 미문서화              | 이미지 프록시 — 커밋 `e145f90`에서 추가된 위키 이미지 매칭용 (CLAUDE.md에도 없고 별도 기능 정리 필요) |
| `kakao-local-search`    | 미문서화              | 카카오 로컬 검색 프록시                                                                               |
| `naver-local-search`    | 미문서화              | 네이버 로컬 검색 프록시                                                                               |
| `odsay-route`           | 미문서화              | ODsay 대중교통 길찾기 경로 프록시                                                                     |
| `send-recommendations`  | 미문서화              | 추천 전송                                                                                             |

## 7. 테스트 커버리지 현황

`package.json`의 jest 설정(`testMatch: **/__tests__/**/*.test.ts?(x)`) 기준, 현재 존재하는 테스트 파일:

- `src/utils/__tests__/exhibitionSearch.test.ts` — 전시 검색 유틸
- `src/utils/__tests__/exhibitionClassification.test.ts` — 전시 장르/유형 분류
- `src/utils/__tests__/migrateEssayIntoMemo.test.ts` — 감상문 memo 이관
- `src/utils/__tests__/offlineAudio.test.ts` — 오프라인 오디오 경로
- `src/utils/__tests__/stripHtml.test.ts` — HTML 엔티티 정리
- `src/utils/__tests__/wikidataImage.test.ts` — 위키 썸네일 매칭
- `src/utils/__tests__/popularExhibitions.test.ts` — 인기 전시 산출 로직
- `src/utils/__tests__/visitPhotoFiles.test.ts` — 관람 인증 사진 파일 처리
- `src/utils/__tests__/localVisitDb.test.ts` — 로컬 방문 기록 DB
- `src/constants/__tests__/essayPrompt.test.ts` — 감상 에세이 프롬프트
- `src/store/__tests__/offlineDownloadStore.test.ts` — 오프라인 다운로드 스토어

그 외 `src/utils/`(43개 파일), `src/hooks/`(46개), `src/store/`(13개), `src/components/`(전체) 등 대부분의 도메인 로직에는 테스트가 없다. 새 도메인 로직 추가 시 CLAUDE.md 지침대로 테스트 확장이 필요하다.
