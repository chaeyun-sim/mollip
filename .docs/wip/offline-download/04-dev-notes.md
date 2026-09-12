---
feature-slug: offline-download
author: chris
status: in-progress
---

# Dev notes

## Implemented ACs

| AC | Status | Files |
|----|--------|-------|
| AC-1 | Done | `src/utils/offlineAudio.ts`, `src/store/offlineDownloadStore.ts`, `src/components/guide/PredownloadRow.tsx`, `app/(guide)/playlist.tsx` |
| AC-2 | Done | `src/hooks/useTTS.ts`, `src/utils/offlineAudio.ts`(`resolveAudioUri` 추가) |
| AC-3 | Done | `src/components/guide/DownloadStatusBadge.tsx`(신규, revision 3에서 `app/settings/bookmark/audio.tsx`용 백드롭 추가), `app/(guide)/playlist.tsx`(revision 2, 이후 롤백), `src/components/guide/ArtistIntroTrack.tsx`(revision 2, 이후 롤백), `app/settings/bookmark/audio.tsx`(revision 3 카드 통합) |
| AC-4 | Done | `src/store/offlineDownloadStore.ts`(`retryDownload` 추가), `app/(guide)/playlist.tsx`, `src/components/guide/ArtistIntroTrack.tsx` |
| AC-5 | Done | `src/utils/offlineAudio.ts`(`deleteOfflineAudio`, `formatOfflineAudioSize` 신규), `src/store/offlineDownloadStore.ts`(`computeCacheKey`, `deleteAllDownloads` 신규), `app/settings/bookmark/audio.tsx`(Row B) |
| AC-6 | Done | `src/utils/offlineAudio.ts`(`deleteOfflineAudio`), `src/store/offlineDownloadStore.ts`(`deleteDownload` 신규), `app/settings/bookmark/audio.tsx`(BottomSheet 삭제 아이콘) |

## AC-1 이력 — immersive-start.tsx → playlist.tsx 재구현

AC-1은 최초에 `immersive-start.tsx`에 구현됐으나(Open Questions #1 최초 결정), 구현 중 "그 시점엔 재생목록이 항상 비어있다"는 spec 전제 오류가 발견되어 spec revision 2 + design brief iteration 3/4을 거쳐 트리거 위치가 `playlist.tsx`로 재확정됐다. 아래는 재구현 기준 최신 상태다. `immersive-start.tsx`는 원래 상태로 복원됐다(변경 없음).

## Changed files

- `src/utils/offlineAudio.ts` (신규) — `expo-file-system`(SDK 56 신규 File/Directory/Paths API) 기반 파일 I/O 유틸. 디렉터리 보장, base64 저장, 존재 확인, 로컬 uri 조회.
- `src/store/offlineDownloadStore.ts` (신규) — 재생목록(작가 소개 포함) 대상 목록을 받아 순회 다운로드하고 항목별 상태(`idle`/`downloading`/`completed`/`failed`)를 관리하는 Zustand 스토어. 화면 언마운트와 무관하게 다운로드가 계속되도록 컴포넌트 훅이 아닌 스토어로 설계(아래 "구현 결정 사항" §1 참고, immersive-start 버전에서 이미 검증된 판단을 그대로 재사용).
- `src/components/guide/PredownloadRow.tsx` (신규) — Row A(트리거) UI. idle 항목이 없으면(실패만 남아도) `disabled` 처리 + `accessibilityState={{ disabled: true }}` — Alex iteration 4 지적 사항 반영.
- `app/(guide)/playlist.tsx` (수정) — 히어로 카드 View와 `ScrollView` 사이(둘 다 SafeAreaView의 flex 형제)에 Row A 삽입. `showPredownloadRow`(idle 또는 failed 있으면 노출) / `canStartDownload`(idle 있어야 활성화) / `isDownloading` / `downloadProgress`를 계산해 `PredownloadRow`에 전달. "받기"는 idle 항목만 대상(`startDownload`가 idle만 필터링).

## 구현 결정 사항

### 1. Zustand 스토어로 구현 (컴포넌트 훅 아님)

디자인 브리프 요구사항 — "다운로드는 백그라운드로 계속되고 사용자는 화면을 벗어나도 무방" — 을 만족하려면 컴포넌트 라이프사이클에 종속되지 않아야 한다. `src/store/artistIntroStore.ts`가 이미 동일한 문제(작가 소개 생성이 화면 전환 후에도 계속돼야 함)를 스토어 액션으로 해결한 선례가 있어 그 패턴을 재사용했다.

### 2. 오디오 캐시 키를 `useTTS.ts`와 동일하게 통일

`${voiceId}\x00${voiceSpeed}\x00${cleanTextForTTS(text)}` 조합을 FNV-1a로 해시. AC-2(오프라인 재생, 범위 밖)에서 "재생 시 로컬 파일 우선 확인"을 붙일 때 동일 키로 조회 가능하도록 미리 통일해 둔 것 — 이번 AC에서 새 동작을 추가한 것은 아니다.

### 3. 다운로드 대상 — 해설 생성 실패 항목 제외, 작가 소개는 ready 상태만

`playlist`에서 `item.description === FAILED_DESCRIPTION`인 항목은 애초에 다운로드 대상에서 제외(해설 텍스트 자체가 없으므로 내려받을 게 없음). 작가 소개는 `introStatus === 'ready' && introText`일 때만 포함.

### 4. "받기"는 idle 항목만 대상 (재실행 시나리오, Alex iteration 4 확정 사항)

Row A는 idle 또는 failed 항목이 1개 이상이면 보이지만, "받기" 버튼은 idle 항목이 1개 이상 있을 때만 활성화된다(`canStartDownload = hasIdle(...)`). failed 항목만 남은 상태에서는 버튼이 비활성화되고 `accessibilityState={{ disabled: true }}`가 붙는다 — 개별 재시도는 AC-4 범위(이번엔 없음, 썸네일 배지가 아직 없으므로 재시도 UI 자체도 없음).

## Deviations from spec/brief

- 없음 — spec revision 2 + design brief iteration 4(Pass) 기준으로 구현했다.

## Blockers for Taylor (QA)

- **화면 전환 후 다운로드 지속 확인 필요**: playlist.tsx에서 "받기" → 다른 화면으로 이동 → 다시 playlist.tsx로 복귀 시 `offlineDownloadStore`의 진행 상태가 유지되는지 확인(스토어가 모듈 스코프이므로 이론상 유지되나 실기 확인 필요).
- **재생목록이 비어있을 때 Row A 노출 안 됨 확인**: `showPredownloadRow`가 재생목록·작가소개 모두 idle/failed 항목이 없으면 false이므로 재생목록이 비어있으면 Row A 자체가 렌더되지 않아야 한다.
- 실제 네트워크 다운로드(TTS 호출 + 파일 쓰기) 종단 간 성공 여부는 Taylor 단계에서 재생목록에 항목이 있는 상태를 만들어 확인 필요.

## Native / env notes

- `expo-file-system`은 이미 설치되어 있으며(`~56.0.8`) 신규 의존성을 추가하지 않았다.
- SDK 56의 신규 File/Directory/Paths API 사용 — 레거시 `FileSystem.documentDirectory` API는 쓰지 않았다.
- 네이티브 모듈 추가/제거 없음 — `pod install`/`expo run:ios` 리빌드 불필요.

## AC-3 — 항목별 상태 배지 + 진행률

- `src/components/guide/DownloadStatusBadge.tsx`(신규) — `idle`/`loading`/`done`/`failed` 4상태 배지. `idle`은 렌더하지 않음(null). `loading`은 `ActivityIndicator`, `done`은 `checkmark-circle`(`text-success`), `failed`는 `alert-circle`(`text-error`) + `Pressable`(`hitSlop=16` 전방향, `onRetry` prop — 실제 재시도 로직은 AC-4 범위라 이번엔 prop만 노출하고 `playlist.tsx`/`ArtistIntroTrack.tsx`에서 호출하지 않음).
- **배지 클리핑 회피**(design brief iteration 3 Blocker 1 재적용): `playlist.tsx` 리스트 아이템과 `ArtistIntroTrack.tsx` 둘 다 `ImageFallback`을 `<View className="relative">`로 감싸고, 배지를 그 부모의 형제(= `ImageFallback`의 `children`이 아님)로 배치해 `ImageFallback` 루트의 `overflow-hidden`에 잘리지 않도록 함.
- "전체 진행 현황(N/M)"은 AC-1에서 이미 만든 `PredownloadRow`의 "받는 중… N/M" 텍스트가 그대로 충족 — 이번 AC에서 별도 추가 없음.
- Zustand 구독(`useOfflineDownloadStore`의 `statuses`)이라 폴링 없이 상태 변경 시 자동 리렌더 — spec의 "폴링 없이 실시간 갱신" 요건 충족.

## AC-4 — 개별 재시도

- `offlineDownloadStore.ts`에 `retryDownload(id, text, voiceId, voiceSpeed)` 액션 추가 — `startDownload`와 별개로 단일 항목만 다운로드하고 상태를 갱신한다. `batchIds`(진행 중이던 배치)를 건드리지 않으므로 다른 항목의 진행률(N/M)에 영향을 주지 않는다(AC-4 "다른 항목의 다운로드 진행은 실패와 무관하게 계속된다" 충족).
- `DownloadStatusBadge`는 AC-3에서 이미 `onRetry` prop을 갖고 있었음 — 이번엔 호출부(`playlist.tsx` 리스트 아이템, `ArtistIntroTrack`)에서 `onRetry`를 실제 재시도 함수(`handleRetryDownload`)에 연결만 했다.
- `handleRetryDownload`는 `downloadTargetTextById`(id→원문 텍스트 맵)로 재시도 대상의 텍스트를 조회해 `retryDownload`를 호출 — Row A의 "받기"(idle만 대상)와 완전히 분리된 경로.
- **중요 카피 수정(범위 밖이지만 함께 반영)**: 사용자 피드백으로 Row A 라벨 "관람 전 미리 받기"가 기능의 실제 의미(이미 재생목록에 쌓인 해설을 오프라인용으로 영구 저장 — 동선 예측이 아님)를 오해하게 한다는 지적이 있어 "들은 해설 오프라인으로 저장"으로 변경(`PredownloadRow.tsx`, `02-design-brief.md` Copy 표 동기화).

## 검증 결과 (Manager 통합 시점, 이 checkout 기준)

- `npx tsc --noEmit` — 0 errors
- `npx jest` — 6 suites / 76 tests 전부 통과 (AC-4 `retryDownload` 테스트 3개 추가)

## Revision 3 구현

spec revision 3 — 다운로드 대상이 "몰입모드 재생목록 전체"에서 "북마크(하트)한 해설"로 축소됨에 따라, revision 2의 `playlist.tsx` 통합을 롤백하고 AC-1을 `app/settings/bookmark/audio.tsx`에 새로 구현했다.

### playlist.tsx 롤백 (Feature breakdown #2)

- `app/(guide)/playlist.tsx`에서 revision 2의 Row A 통합을 전부 제거: `PredownloadRow`/`DownloadStatusBadge` import, `useOfflineDownloadStore`/`useSettingsStore` import, `downloadTargets`/`downloadTargetIds`/`showPredownloadRow`/`canStartDownload`/`isDownloading`/`downloadProgress`/`downloadTargetTextById`/`handleStartDownload`/`handleRetryDownload` 전부 삭제. 더 이상 쓰이지 않는 `useMemo` import도 제거.
- Row A JSX(히어로 카드와 `ScrollView` 사이)와, 재생목록 아이템 썸네일의 `<View className="relative">` 래핑 + `DownloadStatusBadge` 오버레이도 제거해 원래의 단순 `ImageFallback` 렌더로 복원.
- `ArtistIntroTrack`에 전달하던 `downloadStatus`/`onRetryDownload` prop 호출부 제거.
- 다운로드와 무관한 부분(채팅 버튼, `exitedExhibitionId` route param 전달, `confirmExit`, `handlePlay` 등)은 그대로 유지 — 손대지 않음.
- `src/components/guide/ArtistIntroTrack.tsx`에서 `downloadStatus`/`onRetryDownload` prop, `DownloadStatusBadge` import·사용, 썸네일을 감싸던 `<View className="relative">` 래퍼를 제거해 revision-2-이전 상태로 복원.
- `src/components/guide/PredownloadRow.tsx` — Grep으로 다른 참조가 없음을 확인 후 삭제.
- `src/components/guide/DownloadStatusBadge.tsx`는 이번 AC-1 범위(카드 배지는 AC-3)에서 쓰이지 않지만, `offlineDownloadStore.ts`가 여전히 참조하는 `DownloadStatus` 타입과 무관한 별도 파일이라 롤백 대상이 아니므로 유지.

### AC-1 — bookmark/audio.tsx 다운로드 트리거 구현

- `app/settings/bookmark/audio.tsx`에 `02-design-brief.md`의 Row A(일괄 트리거) 유틸리티 바를 추가. `Screen.Header` 바로 아래, 카드 리스트(`FlatList`/빈 상태) 바깥에 고정 배치.
- 다운로드 대상: `items`(= `useHistoryStore.items` ∩ `useBookmarkAudioStore.ids`, 이미 화면에 있던 계산)를 `{ id: item.id, text: item.text }` 형태의 `DownloadTarget[]`으로 매핑 — `HistoryItem.text`가 TTS 원문 필드임을 확인 후 사용.
- `offlineDownloadStore.startDownload(downloadTargets, voiceId, voiceSpeed)`를 호출하는 `handleStartDownload`를 구현하고, `useSettingsStore`에서 `voiceId`/`voiceSpeed`를 가져옴.
- `hasIdle`/`isAnyLoading`/`getBatchProgress` 헬퍼를 `offlineDownloadStore.ts`에서 그대로 재사용해 노출 조건("idle 항목 1개 이상")·진행 상태·N/M 진행률을 계산 — 신규 유틸 함수 추가 없이 기존 헬퍼로 충분했다.
- Row A는 `items.length > 0 && canStartDownload`(idle 항목 존재)일 때만 렌더 — 브리프의 "idle 항목이 1개 이상이면 렌더"(`hasIdleOrFailed`가 아닌 `hasIdle` 기준) 조건을 그대로 따름. 이 AC 범위에는 재시도(AC-4)가 없어 failed 항목을 별도로 취급할 UI가 아직 없다.
- 버튼 라벨: 대기 "전체 받기" / 진행중 "받는 중… N/M"(디자인 브리프 Copy 표와 동일), `accessibilityState={{ busy: isDownloading }}` + 진행중 접근성 라벨 갱신.
- 카드별 배지(AC-3), 재시도(AC-4), 저장공간 관리(AC-5/6)는 이번 범위에서 구현하지 않음 — Row B, `DownloadStatusBadge` 카드 통합, 개별/전체 삭제는 후속 AC.

### 검증 결과 (Revision 3, 이 checkout 기준)

- `npx tsc --noEmit` — 0 errors
- `npx jest` — 6 suites / 76 tests 전부 통과(롤백으로 인한 회귀 없음)

### AC-2 — 오프라인 재생 (캐시 키 일치 확인, 코드 변경 없음)

`app/settings/bookmark/audio.tsx`의 재생 경로(`handlePlayPause` → `speak(selected.text)`)와 다운로드 트리거(`handleStartDownload` → `startDownload(downloadTargets, voiceId, voiceSpeed)`)가 만드는 캐시 키를 직접 대조했다.

- **다운로드 시점** (`src/store/offlineDownloadStore.ts` `startDownload`/`retryDownload`): `cacheKey = ${voiceId}\x00${voiceSpeed}\x00${cleanTextForTTS(target.text)}` — `target.text`는 `bookmark/audio.tsx`에서 `items.map((item) => ({ id: item.id, text: item.text }))`로 매핑한 `HistoryItem.text`, `voiceId`/`voiceSpeed`는 `useSettingsStore()`에서 가져온 값을 그대로 인자로 전달.
- **재생 시점** (`src/hooks/useTTS.ts` `speak`): `cacheKey = ${voiceId}\x00${voiceSpeed}\x00${cleanTextForTTS(text)}` — `voiceId`/`voiceSpeed`는 훅 내부에서 동일한 `useSettingsStore()`를 구독해 가져오고, `text`는 `bookmark/audio.tsx`의 `selected.text`(같은 `HistoryItem.text`).
- 두 지점 모두 (1) 같은 `useSettingsStore`에서 읽은 `voiceId`/`voiceSpeed`, (2) 같은 `HistoryItem.text` 원문, (3) 동일한 `cleanTextForTTS` 함수, (4) 동일한 구분자(`\x00`) 조합 순서를 사용하므로 **다운로드 시점과 재생 시점 사이에 음성 설정을 바꾸지 않는 한 캐시 키가 항상 일치**한다(음성 설정 변경 시 재다운로드가 필요한 것은 spec의 Risks 섹션에 이미 명시된 기존 한계이며 이번 AC의 범위 밖).
- `useTTS.speak`은 이미 `resolveAudioUri(cacheKey, fetchFromNetwork)`를 통해 로컬 파일이 있으면 네트워크 요청 없이 그 uri로 `player.replace(uri)` 후 즉시 재생하므로(`src/utils/offlineAudio.ts`), `bookmark/audio.tsx`가 이 `speak`를 그대로 호출하는 것만으로 AC-2가 충족된다.
- **판정: 이미 충족, 추가 구현 없음.** `app/settings/bookmark/audio.tsx`, `src/hooks/useTTS.ts`, `src/store/offlineDownloadStore.ts`, `src/utils/offlineAudio.ts` 어느 파일도 수정하지 않았다.
- 검증: `npx tsc --noEmit` — 0 errors, `npx jest` — 6 suites / 76 tests 전부 통과(변경 없으므로 이전 결과와 동일).

### AC-3 — 카드별 다운로드 상태 배지 (bookmark/audio.tsx)

- **`DownloadStatusBadge.tsx`에 원형 백드롭 추가**(design brief §Accessibility 확정 사항 반영, 이전까지 미반영 상태였음): 세 상태(`loading`/`failed`/`done`) 모두 `bg-gray900` 원형 배경을 추가.
  - `failed`/`done`: 배지 바깥 요소(`Pressable`/`View`)에 `w-[22px] h-[22px] rounded-full bg-gray900 items-center justify-center` 추가 — `Ionicons size={12}` 아이콘을 중앙 정렬로 감싼다.
  - `loading`: 배지 바깥 `View`에 `w-[28px] h-[28px] rounded-full bg-gray900 items-center justify-center` 추가 — `ActivityIndicator size="small"`(iOS 실측 약 20pt)이 백드롭 밖으로 삐져나오지 않도록 더 큰 지름을 확보.
  - `idle`은 기존과 동일하게 `null` 반환(백드롭도 렌더하지 않음).
  - 위치 기준점(`absolute -top-1 -right-1`)은 백드롭을 포함한 바깥 요소에 그대로 유지 — 상태별 지름 차이에 따른 오프셋 시각 균형은 Alex iteration 3 §Non-blocking으로 이미 분리된 사항이라 이번 범위에서 조정하지 않음.
- **`AudioHistoryCard`(`app/settings/bookmark/audio.tsx`) 카드 통합**: `item.imageUrl` 유무에 따른 `Image`/폴백 `View` 분기 전체를 신규 `<View className="relative">`로 감싸고, 그 형제로 `<DownloadStatusBadge status={downloadStatus} />`를 배치(`onRetry`는 AC-4 범위라 이번엔 전달하지 않음 — prop 자체가 optional이라 생략).
  - `AudioHistoryCardProps`에 `downloadStatus: DownloadStatus` 신규 prop 추가.
  - `AudioHistoryScreen`은 이미 AC-1에서 `useOfflineDownloadStore((s) => s.statuses)`를 구독 중이었으므로(`downloadStatuses`), `FlatList`의 `renderItem`에서 `downloadStatus={downloadStatuses[item.id] ?? 'idle'}`로 그대로 전달 — 신규 구독 불필요.
- Zustand 구독(`statuses`)이 이미 카드 트리까지 prop으로 전파되므로 폴링 없이 상태 변경 시 자동 리렌더(spec AC-3 "폴링 없이 실시간 갱신" 요건 충족) — 별도 로직 추가 없음.
- 검증: `npx tsc --noEmit` — 0 errors, `npx jest` — 6 suites / 76 tests 전부 통과.

### AC-4 — 카드별 개별 재시도 (bookmark/audio.tsx)

- `offlineDownloadStore.ts`의 `retryDownload(id, text, voiceId, voiceSpeed)`는 이미 구현되어 있어(구 revision 2) 스토어 로직 변경 없이 그대로 재사용했다.
- `app/settings/bookmark/audio.tsx`에 `retryDownload` 액션을 구독 추가하고, `downloadTargets`(`{id, text}[]`)로부터 `id → text` 조회용 `downloadTargetTextById`(`Map`, `useMemo`)를 신규 계산해 `handleRetryDownload(id)`를 구현: 대상 텍스트가 있으면 `retryDownload(id, text, voiceId, voiceSpeed)` 호출, 없으면 no-op.
- `AudioHistoryCardProps`에 `onRetryDownload: (id: string) => void` prop 추가, `AudioHistoryCard` 내부 `<DownloadStatusBadge status={downloadStatus} onRetry={() => onRetryDownload(item.id)} />`로 연결 — `DownloadStatusBadge`는 AC-3 통합 시점부터 이미 `onRetry` prop을 받고 있었고(실패 상태에서 `Pressable`로 감싸 탭 시 호출) 이번엔 실제 함수를 연결만 했다.
- `AudioHistoryScreen`의 `FlatList` `renderItem`에서 `onRetryDownload={handleRetryDownload}`를 카드에 전달.
- `retryDownload`는 `batchIds`(전체 받기 배치)를 건드리지 않으므로 개별 재시도가 다른 항목의 진행 상태·진행률(N/M)에 영향을 주지 않는다(AC-4 "다른 항목의 다운로드 진행은 실패와 무관하게 계속된다" 충족) — 스토어 쪽은 revision 2에서 이미 검증된 동작이라 이번엔 화면 연결만으로 요건이 충족된다.
- 검증: `npx tsc --noEmit` — 0 errors, `npx jest` — 6 suites / 76 tests 전부 통과(스토어 로직 변경 없어 회귀 없음).

### AC-5 — 저장 공간 확인 및 전체 삭제 (bookmark/audio.tsx)

- **`src/utils/offlineAudio.ts` 신규 함수**: `deleteOfflineAudio(cacheKey)`(단건 삭제, AC-6에서도 재사용), `formatOfflineAudioSize(bytes)`(사람이 읽기 쉬운 용량 문자열 — B/KB/MB/GB, KB 이상은 소수 첫째 자리까지). `getOfflineAudioTotalSizeBytes`/`deleteAllOfflineAudio`는 revision 2에서 이미 존재해 그대로 재사용.
- **`src/store/offlineDownloadStore.ts` 신규**:
  - `computeCacheKey(text, voiceId, voiceSpeed)` — `startDownload`/`retryDownload`에 중복돼 있던 캐시 키 조합(`${voiceId}\x00${voiceSpeed}\x00${cleanTextForTTS(text)}`)을 함수로 추출해 export. AC-6에서 화면 쪽이 삭제 대상 캐시 키를 동일한 방식으로 계산할 수 있도록 함(대칭성 확보 — 다운로드 시점과 삭제 시점이 다른 키 조합을 쓰면 삭제가 엉뚱한 파일을 대상으로 함).
  - `deleteAllDownloads(ids: string[])` 액션 — `deleteAllOfflineAudio()` 호출 후 전달받은 id들의 상태만 `idle`로 리셋(다른 id의 상태는 그대로 유지 — 이 화면 범위 밖의 id가 statuses에 섞여 있어도 안전).
- **`app/settings/bookmark/audio.tsx` Row B 신규**: Row A 아래, `FlatList`/빈 상태 위에 고정 배치. `doneIds`(완료 상태인 다운로드 대상 id) 1개 이상일 때만 렌더. 좌측 "다운로드 {size}"(`formatOfflineAudioSize(getOfflineAudioTotalSizeBytes())`, `downloadStatuses` 변경 시 재계산되도록 `useMemo` 의존성에 포함), 우측 "전체 삭제" 텍스트(`text-gray900`) + `trash-outline` 아이콘(`text-error`) 버튼. 탭 시 브리프 Copy 표대로 `Alert.alert` 확인 후 `deleteAllDownloads(downloadTargetIds)` 호출.

### AC-6 — 개별 삭제 (bookmark/audio.tsx)

- **`offlineDownloadStore.ts` 신규**: `deleteDownload(id, cacheKey)` 액션 — `deleteOfflineAudio(cacheKey)` 호출 후 해당 id 하나만 상태를 `idle`로 되돌림(다른 id는 영향받지 않음, AC-6 "다른 항목의 다운로드 상태·파일은 영향받지 않는다" 충족).
- **BottomSheet 헤더 액션 그룹**: 재생/일시정지 `Pressable`과 닫기(`✕`) `Pressable` 사이에 `trash-outline` 아이콘(`text-error`, `hitSlop={{top:12,bottom:12,left:12,right:12}}`)을 `downloadStatuses[selected.id] === 'done'`일 때만 렌더 — 브리프가 지정한 위치·조건·hitSlop을 그대로 따름.
- 탭 시 브리프 Copy 표대로 `Alert.alert` 확인(`"{title}" 다운로드 파일을 삭제해요...`) → 확인 시 `computeCacheKey(item.text, voiceId, voiceSpeed)`로 캐시 키를 계산해 `deleteDownload(item.id, cacheKey)` 호출. 시트는 닫지 않음(`Alert.alert`만 별도 모달로 뜨고 `BottomSheet`는 그대로 유지) — 삭제 후 카드 목록의 배지가 `downloadStatuses` 구독을 통해 즉시 `idle`로 갱신되는 것을 시트를 닫지 않고도 확인 가능(브리프 States 요건).

### 검증 결과 (AC-5/AC-6)

- `npx tsc --noEmit` — 0 errors
- `npx jest` — 6 suites / 86 tests 전부 통과(신규 유닛 테스트 10개 추가: `offlineAudio.test.ts`에 `deleteOfflineAudio`/`formatOfflineAudioSize` 6개, `offlineDownloadStore.test.ts`에 `computeCacheKey`/`deleteDownload`/`deleteAllDownloads` 4개)
