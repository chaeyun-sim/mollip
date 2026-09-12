---
feature-slug: offline-download
tier: L
author: john
status: draft
revision: 3
---

# Spec — 오프라인 다운로드 (북마크한 해설 오프라인 저장)

> **Tier: L 판단 근거(재확인)** — 파일 I/O·다운로드 상태 관리 인프라(`offlineAudio.ts`, `offlineDownloadStore.ts`)는 revision 2에서 이미 구축되어 대부분 재사용 가능하지만, 대상 데이터가 재생목록(`immersiveStore.playlist`)에서 북마크(`bookmarkAudioStore` + `historyStore`)로 바뀌면서 **트리거·상태 표시·저장공간 관리 UI를 기존 화면(`playlist.tsx`)에서 다른 화면(`app/settings/bookmark/audio.tsx`)으로 옮기고, 기존 통합은 롤백**해야 한다. 신규 상호작용(개별 삭제)도 추가된다. 2개 이상 화면에 걸친 변경 + 저장소 계층 재설계이므로 M 범위를 넘는다.

> **Revision 3 변경 사유** — revision 2(AC-1~4 구현·QA Pass 완료, AC-5는 미착수)는 "몰입모드 재생목록 전체"를 다운로드 대상으로 했다. 사용자와의 대화에서 (1) 다운로드된 해설을 몰입모드 밖에서 확인할 화면이 없었고, (2) "재생목록 전체"가 아니라 "다시 들을 의도가 명확한 항목"만 저장 대상이 되어야 한다는 결론에 도달해, 다운로드 대상을 **북마크(하트)한 해설**로 축소하기로 결정했다. 조회 화면은 이미 존재하는 `app/settings/bookmark/audio.tsx`(오디오 북마크 화면)를 확장해 사용한다.

## Problem

- 전시장(특히 지하 전시실 등)은 통신이 불안정해, 저장(다시 듣고 싶은) 해설을 재생할 때마다 매번 네트워크로 TTS를 다시 받아오는 현재 구조는 재생 실패·지연의 원인이다.
- `useTTS.ts`의 `audioCache`는 세션(인메모리) 한정이라 앱 재시작·백그라운드 종료 시 소실되며, "다시 들을 해설을 미리 영구 저장해두기"라는 동작이 없다.
- (revision 2에서 신규 발견) 몰입모드 재생목록은 몰입모드 진입 후에만 접근 가능한 화면이라, 다운로드해둔 해설을 몰입모드 밖에서 확인·관리할 화면이 없었다. 반면 오디오 북마크 화면(`app/settings/bookmark/audio.tsx`)은 이미 존재하며 "다시 듣고 싶은 오디오"를 모아 보여주는 목적과 정확히 일치한다.

## Goals

- 사용자가 북마크(하트)한 해설(`useHistoryStore`의 `HistoryItem`, `bookmarkAudioStore.ids`에 포함된 항목)을 디바이스에 영구 다운로드할 수 있다.
- 북마크 화면(`app/settings/bookmark/audio.tsx`)에서 각 항목의 다운로드 상태(대기/진행중/완료/실패)를 확인할 수 있다.
- 다운로드 완료된 항목은 네트워크 연결 없이도 즉시 재생된다(로컬 파일 우선 확인 — 기존 `resolveAudioUri` 재사용).
- 다운로드 실패 시 항목별로 재시도할 수 있다.
- 다운로드된 오디오가 차지하는 저장 공간을 확인하고, 개별 항목 또는 전체를 삭제할 수 있다.

## Non-goals (out of scope)

- **재생목록(`immersiveStore.playlist`) 전체 사전 다운로드** — revision 2에서 구현했던 `playlist.tsx`의 "미리 받기" 일괄 다운로드(Row A)는 폐기한다. 몰입모드 중 재생목록 항목을 통째로 사전 다운로드하는 기능은 이번 spec의 대상이 아니다(명시적으로 축소).
- **북마크하지 않은 해설 다운로드** — `useHistoryStore.items`에는 있지만 `bookmarkAudioStore.ids`에 없는(하트를 누르지 않은) 항목은 다운로드 대상이 아니다.
- **작가 소개 트랙(`useArtistIntroStore`) 다운로드** — 북마크(`bookmarkAudioStore`)는 `description.tsx`에서 저장된 개별 작품 해설(`HistoryItem`)에만 연결되어 있고 작가 소개 트랙과는 무관한 도메인이므로 제외한다.
- **개별 작품(비몰입모드) 단건 다운로드 트리거를 몰입모드/재생목록에 추가하는 것** — 이번 spec의 다운로드 트리거는 북마크 관련 화면/액션에 한정한다.
- **네트워크 상태 실시간 감지/배너** — `NetInfo` 등 신규 의존성을 도입하지 않는다. 재생 시 로컬 파일 존재 여부를 먼저 확인하고, 없을 때만 네트워크 요청을 시도하는 방식으로 충분하다.
- **백그라운드 자동 다운로드** — 앱이 foreground일 때만 다운로드가 진행된다. OS 백그라운드 다운로드 태스크 등록은 다루지 않는다.
- **Wi-Fi 전용 다운로드 옵션(셀룰러 차단)** — 이번 SPEC에서 제공하지 않는다.
- **다운로드 파일의 TTL/자동 만료 정책** — 자동 삭제 스케줄링은 다루지 않는다. 수동 삭제(개별/전체, AC-5·AC-6)만 제공한다.

## Users & context

- 전시장(특히 통신 불안정 구역)에서 관람 전/중/후 "다시 듣고 싶은" 해설을 미리 저장해두려는 사용자.
- 트리거·조회·상태 확인·저장 공간 관리 전부 기존 오디오 북마크 화면(`app/settings/bookmark/audio.tsx`)에서 이루어진다(Open Questions #1 확정).

## Acceptance criteria

### AC-1: 북마크한 해설 다운로드 시작

- **Given** 사용자가 하나 이상의 해설을 북마크(하트)했다(`bookmarkAudioStore.ids`에 포함)
- **When** 사용자가 다운로드 액션을 실행한다 (정확한 트리거 위치·시점은 Open Questions #1 참고)
- **Then** 대상 항목(들)에 대해 오디오 다운로드가 시작되고, 항목별 다운로드 상태(대기/진행중/완료/실패)가 화면에 표시된다
- **참고**: 이미 "완료" 상태인 항목은 재다운로드하지 않는다(idle 항목만 대상 — revision 2의 `hasIdle`/`getIdleIds` 패턴 재사용)

### AC-2: 다운로드 완료 항목의 오프라인 재생

- **Given** 북마크한 항목이 "완료" 상태로 다운로드되어 있다
- **When** 기기가 네트워크에 연결되지 않은 상태에서 사용자가 북마크 화면(`bookmark/audio.tsx`)에서 해당 항목을 재생한다
- **Then** 네트워크 요청 없이 로컬에 저장된 오디오 파일로 즉시 재생이 시작된다

### AC-3: 다운로드 진행 상태 실시간 표시

- **Given** 다운로드가 진행 중이다
- **When** 사용자가 북마크 화면을 보고 있다
- **Then** 항목별 상태 아이콘(및 일괄 다운로드인 경우 전체 진행 현황)이 폴링 없이 실시간으로 갱신된다

### AC-4: 다운로드 실패 시 개별 재시도

- **Given** 특정 항목의 다운로드가 네트워크 오류 등으로 실패했다
- **When** 다운로드가 실패한다
- **Then** 해당 항목은 "실패" 상태로 표시되며 사용자가 재시도할 수 있는 UI가 제공된다. 다른 항목의 다운로드 진행은 실패와 무관하게 계속된다

### AC-5: 저장 공간 확인 및 전체 삭제

- **Given** 하나 이상의 항목이 다운로드되어 있다
- **When** 사용자가 북마크 화면 내 저장 공간 관리 UI에 접근한다
- **Then** 다운로드된 오디오의 총 용량이 표시되고, 사용자는 전체 삭제를 실행할 수 있다

### AC-6: 개별 항목 삭제

- **Given** 특정 북마크 항목이 "완료" 상태로 다운로드되어 있다
- **When** 사용자가 해당 항목에 대해 삭제 액션을 실행한다
- **Then** 그 항목의 다운로드 파일만 삭제되고 상태가 "대기"로 돌아가며, 다른 항목의 다운로드 상태·파일은 영향받지 않는다

### AC-7: 다운로드되지 않은 북마크 항목의 기존 동작 유지(회귀 방지)

- **Given** 어떤 항목도 다운로드하지 않았다
- **When** 사용자가 북마크 화면에서 항목을 재생한다
- **Then** 기존 동작과 동일하게 네트워크로 TTS를 요청해 재생한다(본 기능 도입으로 기존 미다운로드 재생 경로가 깨지지 않는다)

> **북마크 해제 시 다운로드 파일 처리(자동 삭제 vs 유지)는 아직 결정되지 않아 별도 AC로 작성하지 않았다 — Open Questions #2 확정 후 AC-8로 추가한다.**

## Screens / routes

| Route | 변경 |
|-------|------|
| `app/settings/bookmark/audio.tsx` | (확장, 확정) 카드별 다운로드 상태 배지(`DownloadStatusBadge` 재사용) + 다운로드 트리거 버튼(항목별 또는 일괄) + 재시도 액션(AC-4) + 저장 공간 인라인 UI(총 용량 표시 + 개별/전체 삭제, AC-5·AC-6) |
| `app/(guide)/playlist.tsx` | **롤백** — revision 2에서 추가된 Row A(`PredownloadRow` 트리거) 및 관련 상태 연결(`showPredownloadRow`/`canStartDownload`/`isDownloading`/`downloadProgress`)을 제거하고 revision-2-이전 상태로 복원한다 |
| `app/(guide)/description.tsx` | **변경 없음(확정)** — Open Questions #1에서 하트=자동 다운로드 방향은 채택되지 않았다 |

## Risks & dependencies

- **재사용 가능한 기존 인프라** (Feature breakdown 참고): `src/utils/offlineAudio.ts`, `src/store/offlineDownloadStore.ts`(`DownloadTarget { id, text }` 형태가 북마크 항목(`HistoryItem.id`/`.text`)에도 그대로 들어맞음), `src/hooks/useTTS.ts`의 `resolveAudioUri` 통합, `src/components/guide/DownloadStatusBadge.tsx`.
- **신규 필요 기능(기존 인프라에 없음)**: (1) 개별 파일 삭제 — `offlineAudio.ts`에는 전체 삭제(`deleteAllOfflineAudio`)만 있고 단건 삭제 함수가 없다(AC-6에 필요). (2) `offlineDownloadStore.ts`에는 단건 삭제 후 상태를 `idle`로 되돌리는 액션이 없다.
- **상태 영속성 공백**: `offlineDownloadStore`의 `statuses`는 Zustand 인메모리 상태(`persist` 미적용)라 앱을 재시작하면 초기화된다. 반면 다운로드 파일 자체(`offlineAudio.ts`)는 디바이스에 영구 저장된다. 따라서 북마크 화면 마운트 시 각 항목의 캐시 키에 대해 `hasOfflineAudio()`로 실제 파일 존재 여부를 조회해 초기 상태를 재구성하는 로직이 필요하다(그렇지 않으면 이미 다운로드된 항목이 앱 재시작 후 "대기"로 잘못 표시됨) — plan.md에서 구체화.
- `voiceId`/`voiceSpeed`(설정 화면에서 변경 가능)가 캐시 키에 포함되므로, 사용자가 음성 설정을 바꾸면 기존에 다운로드한 파일은 새 설정 기준으로는 "미다운로드" 상태로 보인다(재다운로드 필요) — revision 2에서도 존재했던 한계이며 이번 spec에서 새로 만드는 문제는 아니지만, 개별 삭제/재다운로드 UX에 영향을 주므로 plan.md에서 다룰 것.
- `playlist.tsx` 롤백 후 회귀 확인 필요 — Row A 제거 후 재생목록 화면이 revision-2-이전과 동일하게 동작하는지 QA에서 확인.
- `src/components/guide/PredownloadRow.tsx`는 폐기 대상 — 삭제 전 다른 참조가 없는지 확인 필요(단, Open Questions #1에서 "북마크 화면 내 일괄 받기 버튼" 방향이 채택되면 유사한 UI 패턴으로 재작성될 수 있음).
- 디바이스 저장 공간 부족 시 다운로드 실패 처리 필요(AC-4의 실패 케이스에 포함, revision 2와 동일).

## Open questions — 확정 (2026-09-11, 사용자 결정)

- **#1 다운로드 트리거 시점/위치** → **(B) 북마크 화면(`bookmark/audio.tsx`)에서 명시적 액션.** 항목별 다운로드 버튼(또는 일괄 "전체 받기")으로 사용자가 직접 트리거한다. `description.tsx`의 하트 액션에는 다운로드를 연동하지 않는다 — Screens/routes 표의 `description.tsx` 행은 적용하지 않는다.
- **#2 북마크 해제 시 다운로드 파일 처리** → **(B) 유지.** 북마크를 해제해도 다운로드 파일은 삭제하지 않는다 — 재북마크 시 재다운로드 없이 바로 재생 가능. 저장 공간 누적은 AC-5·AC-6의 수동 삭제로만 대응한다.

### AC-8: 북마크 해제 후에도 다운로드 파일 보존(회귀 방지)

- **Given** 어떤 항목이 "완료" 상태로 다운로드되어 있다
- **When** 사용자가 해당 항목의 북마크(하트)를 해제한다
- **Then** 다운로드 파일과 상태는 그대로 유지되며, 삭제되지 않는다(수동 삭제만 AC-6으로 가능)

## Feature breakdown (for Chris)

1. **AC-1** — 북마크 항목(`useHistoryStore.items` ∩ `bookmarkAudioStore.ids`, `{id, text}` 형태)을 `offlineDownloadStore.startDownload(targets, voiceId, voiceSpeed)`에 전달하는 트리거 구현. `offlineDownloadStore.ts`/`offlineAudio.ts`는 **그대로 재사용**(대상 데이터만 재생목록 → 북마크 항목으로 교체). 트리거 UI 배치는 Open Questions #1 확정 후 결정
2. **AC-1 부속 — playlist.tsx 롤백**: revision 2의 Row A(`PredownloadRow` 통합, `showPredownloadRow`/`canStartDownload`/`isDownloading`/`downloadProgress`)를 `app/(guide)/playlist.tsx`에서 제거. `src/components/guide/PredownloadRow.tsx`는 다른 참조가 없으면 삭제(또는 Open Questions #1(B) 채택 시 북마크 화면용으로 재작성)
3. **AC-2** — `bookmark/audio.tsx`의 재생 경로(현재 `useTTS().speak(selected.text)`)는 이미 `resolveAudioUri`를 통해 로컬 우선 조회하므로 **별도 구현 불필요**(voiceId/voiceSpeed/text로 만든 캐시 키가 다운로드 시점과 동일해야 함만 확인)
4. **AC-3** — `DownloadStatusBadge.tsx` **그대로 재사용**해 `bookmark/audio.tsx`의 `AudioHistoryCard` 썸네일에 배지 연결(`ImageFallback` 클리핑 회피 패턴도 동일 적용). 앱 재시작 후 상태 재구성 로직(Risks 참고) 신규 구현 필요
5. **AC-4** — `offlineDownloadStore.retryDownload` **그대로 재사용**, `bookmark/audio.tsx`에서 `DownloadStatusBadge`의 `onRetry`를 실제 재시도 함수에 연결(revision 2의 `playlist.tsx` 연결 패턴과 동일)
6. **AC-5** — `offlineAudio.ts`의 `getOfflineAudioTotalSizeBytes`/`deleteAllOfflineAudio` **그대로 재사용**해 `bookmark/audio.tsx`에 총 용량 표시 + 전체 삭제 UI 신규 추가
7. **AC-6(신규)** — `offlineAudio.ts`에 단건 삭제 함수(예: `deleteOfflineAudio(cacheKey)`) 신규 추가, `offlineDownloadStore.ts`에 단건 삭제 액션(파일 삭제 + 상태를 `idle`로 리셋) 신규 추가, `bookmark/audio.tsx` 카드에 개별 삭제 UI 신규 추가
8. **AC-7** — 다운로드 관련 코드가 없을 때 기존 `useTTS.speak` 네트워크 경로가 그대로 동작하는지 회귀 확인(신규 구현 없음)
