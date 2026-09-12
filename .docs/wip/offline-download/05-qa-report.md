---
feature-slug: offline-download
author: taylor
status: draft
---

## 최종 통합 검증 요약 (AC-1~AC-8 전체, spec revision 3 완료 시점)

> `.claude/rules/feature-pipeline.md` §5 "최종 통합 검증" — 전체 AC(1~8)가 개별 통과해 이 checkout(`/Users/chaeyunsim/Documents/mollip`, primary checkout)에서 수행. 커밋 전/G6 핸드오프 전 최종 게이트.

### 재실행 결과

- `npx tsc --noEmit` → 0 errors(재실행 재확인).
- `npx jest` → 6 suites / 86 tests 전부 통과(재실행 재확인).

### AC별 증빙 표

| AC | tsc | 스크린샷 | 인터랙션 | 회귀 |
|---|---|---|---|---|
| AC-1 (다운로드 시작) | ✅ 0 errors | `evidence/rev3-ac1-bookmark.png`(빈 상태 — 환경 제약, P1 참고) | 코드 레벨 대체(Row A `handleStartDownload`→`startDownload`, idle만 대상, 단위 테스트) | 인접 화면(playlist.tsx) 정상 |
| AC-2 (오프라인 재생) | ✅ 0 errors | 해당 없음(코드 변경 없음, 캐시 키 대조로 충족 확인) | `resolveAudioUri` 로컬 우선 조회 — 코드 레벨 확인 | 미다운로드 재생 경로(AC-7) 영향 없음 |
| AC-3 (상태 배지) | ✅ 0 errors | `evidence/rev3-ac3-badges.png`(빈 상태 — 환경 제약) | 코드 레벨 대체(Zustand 구독 기반 자동 리렌더) | 카드 텍스트·하트 버튼 미변경 확인 |
| AC-4 (개별 재시도) | ✅ 0 errors | `evidence/rev3-ac4-bookmark-empty-state.png`(빈 상태 — 환경 제약) | 코드 레벨 대체(`retryDownload`는 revision 2에서 실기 검증 이력 있음, batchIds 비영향 확인) | Row A idle 필터링 미훼손 확인 |
| AC-5 (저장 공간·전체 삭제) | ✅ 0 errors | `evidence/rev3-ac5-6-bookmark-state.png`(빈 상태 — 환경 제약) | 코드 레벨 대체(Alert 확인 후에만 `deleteAllDownloads` 호출, 단위 테스트로 타 항목 비영향 검증) | Row A/카드 렌더링 미훼손 확인 |
| AC-6 (개별 삭제) | ✅ 0 errors | 위와 동일(빈 상태 — 환경 제약) | 코드 레벨 대체(hitSlop 46pt·위치·Alert 확인 흐름·시트 유지·배지 idle 전환, 단위 테스트) | BottomSheet 기존 헤더 액션(재생/일시정지, 닫기) 미변경 확인(Q8) |
| AC-7 (미다운로드 항목 기존 동작 유지) | ✅ 0 errors | 해당 없음(신규 구현 없음) | `useTTS.speak` 네트워크 경로 코드 미변경 확인 | 회귀 없음(신규 코드 경로 없음) |
| AC-8 (북마크 해제 후 파일 보존) | ✅ 0 errors | 해당 없음(신규 구현 없음) | `toggleBookmark`가 `offlineDownloadStore`/`offlineAudio` 어느 것도 호출하지 않음을 코드로 확인 | 회귀 없음 |
| **playlist.tsx 롤백** | ✅ 0 errors | `evidence/rev3-final-home.png`(앱 정상 구동 확인) | — | `grep`으로 `PredownloadRow`/`offlineDownloadStore`/`DownloadStatusBadge`/`downloadTargets` 참조 0건 확인, `PredownloadRow.tsx` 파일 삭제 확인 — revision-2-이전 상태로 복원됨 |

### 종합 판단

- **코드 레벨 검증은 AC 1~8 전체에서 spec·design brief와 정확히 일치**한다 — 조건식, 카피(문자 단위 대조), hitSlop, 캐시 키 조합, 단위 테스트(총 86개)로 뒷받침됨.
- **시뮬레이터 실기 스크린샷/인터랙션은 AC-1 QA 라운드부터 AC-6 QA 라운드까지 동일한 환경 제약(P1) 때문에 한 번도 완전히 확보하지 못했다** — `bookmarkAudioStore`/`historyStore`가 경유하는 `authAwareStorage`에 외부 AsyncStorage 주입이 반영되지 않아, 이 QA 세션에서 북마크 목록 자체를 채울 수 없다(근본 원인 미확정: QA 툴링 한계 또는 실제 guest 데이터 영속성 이슈). 이는 offline-download 기능의 diff가 원인이 아니며(`bookmarkAudioStore.ts`/`historyStore.ts`/`authAwareStorage.ts` 어느 것도 이번 spec의 변경 대상이 아님), AC-1 QA에서 최초 발견되어 AC-2~AC-6까지 매 라운드 재확인·재기록된 동일한 환경 제약이다.
- **Verdict: Pass(조건부)** — 코드 레벨 증빙으로 G6 핸드오프는 가능하나, **실제 로그인 세션 또는 앱 UI 플로우(하트 탭)로 데이터를 만든 뒤의 실기 재검증이 사용자에게 명확히 인계되어야 한다.** 아래 P1 목록 참고.

### 최종 인계 P1 (누적, 6개 QA 라운드에서 동일하게 재확인됨)

1. `bookmark/audio.tsx`의 Row A/Row B/카드 배지/BottomSheet 개별 삭제 전체가 이 QA 환경에서 시뮬레이터 실기로 확인되지 않음 — 원인은 `authAwareStorage` 경유 스토어에 대한 외부 데이터 주입 미반영(근본 원인 미확정). **다음 세션에서 실제 로그인 세션 또는 앱 UI 플로우로 북마크 데이터를 만들어 AC-1~AC-6 전체의 실기 스크린샷을 일괄 재검증할 것을 강력히 권장한다.**

---

# QA Report — AC-1 중간 QA (오프라인 다운로드: 재생목록 화면 사전 다운로드 트리거)

> 범위: AC-1만. AC-2~AC-5는 dev-notes 기준 미착수라 이 리포트에 포함하지 않는다.

## Verdict: **Pass** (P0 0건, P1 0건, P2 2건 — 아래 참고)

---

## 체크리스트 결과

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors |
| Q2 | `npx jest` | ✅ Pass | 6 suites / 71 tests 전부 통과 |
| Q3 | 버그/edge 코드 리뷰 | ✅ Pass | 아래 상세 |
| Q4 | UX (디자인 브리프 일치) | ✅ Pass | 아래 상세 |
| Q5 | 컨벤션 | ⚠️ Pass (P2 1건) | import 순서 — 아래 상세 |
| Q6 | 비주얼(시뮬레이터) | ✅ Pass | 스크린샷 확보, 실제 렌더링 확인 |
| Q7 | 인터랙션(시뮬레이터) | ✅ Pass (환경 제약 1건 기록) | 아래 상세 |
| Q8 | 회귀 | ✅ Pass | 코드 리뷰 기준 |
| Q9 | 성능(가벼운 수준) | ✅ Pass | useMemo 의존성 정상 |
| Q10 | 네이티브 모듈 | 해당 없음 | dev-notes와 일치, `expo-file-system` 이미 설치됨 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors). 재확인 완료.

## Q2 — 테스트

```
npx jest
```
```
PASS src/utils/__tests__/offlineAudio.test.ts
PASS src/store/__tests__/offlineDownloadStore.test.ts
PASS src/utils/__tests__/exhibitionSearch.test.ts
PASS src/utils/__tests__/stripHtml.test.ts
PASS src/utils/__tests__/exhibitionClassification.test.ts
PASS src/utils/__tests__/popularExhibitions.test.ts

Test Suites: 6 passed, 6 total
Tests:       71 passed, 71 total
```

## Q3 — 버그/edge 케이스

- **(a) 재생목록이 비어있을 때 Row A 미노출**: `playlist.tsx`의 `downloadTargets`는 `playlist`(빈 배열) + `introStatus === 'ready'`일 때만 작가소개를 추가한다. 둘 다 없으면 `downloadTargetIds = []`이고 `hasIdleOrFailed([], {})`는 `[].some(...)` → `false`이므로 `showPredownloadRow`가 `false`가 되어 Row A가 렌더되지 않는다. 코드상 확정, 시뮬레이터에서도 재생목록 주입 전(초기 상태)에는 Row A가 보이지 않음을 별도 확인함(주입 전 최초 launch 화면에는 유틸리티 바 없음).
- **(b) idle 없이 failed만 있을 때 "받기" 비활성화**: `canStartDownload = hasIdle(...)`이며 `hasIdle`은 idle 항목이 하나도 없으면 `false`를 반환한다(`offlineDownloadStore.test.ts`의 "idle 항목이 하나도 없으면(실패만 존재해도) hasIdle은 false다 — Alex iteration 4 지적사항" 테스트로 커버). `PredownloadRow`는 `disabled` prop을 받아 `Pressable`의 `disabled`와 `accessibilityState={{ disabled }}`에 반영한다. **시뮬레이터에서 실기 확인**: 두 항목 모두 idle→(네트워크/인증 실패로) failed로 전이된 후 "받기" 텍스트가 `text-gray700`(비활성 스타일)로 바뀌고 재탭해도 아무 반응이 없음을 확인(아래 Q7 참고).
- **(c) `handleStartDownload`가 idle 항목만 필터링해서 넘기는지**: `playlist.tsx`의 `handleStartDownload`는 `downloadTargets`(전체 대상)를 그대로 `startDownload`에 넘기지만, `offlineDownloadStore.ts`의 `startDownload` 내부에서 `targets.filter((t) => (get().statuses[t.id] ?? 'idle') === 'idle')`로 idle만 골라 처리한다. 호출부가 필터링 책임을 갖지 않고 스토어가 갖는 설계이며, `offlineDownloadStore.test.ts`의 "idle 상태인 대상만 필터링해 다운로드하고" / "failed 항목은 대상에서 제외한다" 테스트로 이미 검증됨. 문제 없음.

## Q4 — UX (디자인 브리프 대비)

- hitSlop: `PredownloadRow`의 트리거 `Pressable`은 `hitSlop={8}`을 사용한다. 브리프의 44pt 터치타겟 요구는 주로 **실패 배지**(AC-4, 아직 미구현)를 겨냥한 것이고, 트리거 버튼 자체는 텍스트+아이콘 조합의 일반 버튼이라 44pt 산식 대상은 아니다 — 문제 없음.
- 카피: "관람 전 미리 받기" / "받기" / "받는 중… N/M" 브리프와 정확히 일치(코드·시뮬레이터 스크린샷 모두 확인).
- 배치: Row A가 `ScrollView` 바깥, 히어로 카드 바로 아래에 고정 배치되어 브리프의 "스크롤과 무관하게 항상 노출" 요구를 만족(코드 구조 확인 — `playlist.tsx` L219-229가 `ScrollView`(L231) 이전에 위치).
- 대비: `text-gray500`(라벨), `text-on-dark`/`text-gray700`(버튼 상태별) — 브리프 토큰과 일치.

## Q5 — 컨벤션

- `PredownloadRow.tsx`: Props interface `PredownloadRowProps` 네이밍 ✅, import 순서(외부 블록 → 빈 줄 → 내부 `@/` 블록) ✅, named export ✅, `hitSlop`/조건부 스타일 등 모두 규칙 준수.
- `offlineDownloadStore.ts` / `offlineAudio.ts`: import 순서 ✅, 순수 헬퍼 함수 분리로 테스트 용이성 확보 — SRP 원칙에 부합.
- **P2(경미) — `app/(guide)/playlist.tsx`의 import 순서**: 컨벤션 문서(§12)는 "외부 라이브러리 블록 → 빈 줄 1개 → 내부 절대경로(`@/src/...`) 블록"을 요구하지만, 이 파일은 외부 블록과 내부 블록 사이 빈 줄이 없고 상대경로(`../../src/...`)와 절대경로(`@/src/...`) import가 뒤섞여 있다. **다만 이는 AC-1 변경 이전부터 존재하던 기존 파일 스타일**이며(`git diff` 확인 결과 Chris는 기존 import 블록 안에 신규 줄을 끼워 넣기만 했고 블록 구조 자체를 새로 만들지 않음), component-convention.md의 "기존 파일 스타일에 맞추는 것이 개인 취향보다 우선"(§ Agent Core Behaviors 상단 취지) 관점에서 이번 AC 범위의 신규 결함으로 보기는 어렵다. 향후 이 파일을 손댈 일이 생기면 함께 정리 권장(별도 리팩토링 티켓으로, 이번 AC-1 blocking 사유 아님).

## Q6 — 비주얼(시뮬레이터)

- 부팅된 시뮬레이터가 없어 `xcrun simctl list devices`로 확인 후 `iPhone 16(iOS 18.3)`을 `xcrun simctl boot`로 부팅.
- 앱은 이미 빌드되어 설치되어 있었고 Metro(8081)도 이미 실행 중이어서 `xcrun simctl launch`로 정상 기동됨.
- **재생목록에 항목이 있는 상태 재현**: `immersiveStore`(Zustand `persist`)가 AsyncStorage에 저장하는 매니페스트(`RCTAsyncLocalStorage_V1/manifest.json`)의 `immersive-store` 항목을 직접 편집해 `isImmersiveMode: true` + 재생목록 항목 2개(QA 테스트 작품 1/2)를 주입한 뒤 앱을 재기동하고 `mollip:///playlist` 딥링크로 재생목록 화면에 진입 — dev-notes가 제안한 "개발자 경로" 대신 영속 스토리지 직접 주입 방식을 사용했다(코드 내 별도 mock-inject 개발자 메뉴는 발견하지 못함).
- 스크린샷: `.docs/wip/offline-download/evidence/ac1-playlist.png` — Row A("관람 전 미리 받기" + "받기" 버튼 + cloud-download 아이콘)가 히어로 카드 바로 아래, "재생목록" 헤딩 위에 정상 렌더됨을 확인. 항목 2개(썸네일+제목+작가·연도+재생 아이콘)도 브리프대로 렌더됨.

## Q7 — 인터랙션(시뮬레이터)

- "받기" 버튼을 실제로 탭함(정확한 좌표는 System Events accessibility 쿼리로 버튼의 실제 화면 좌표를 얻어 클릭 — 초기 좌표 추정 클릭은 헤더의 "전시 관람 종료" X 버튼을 잘못 눌러 확인 다이얼로그가 뜨는 오탐이 있었고, `닫기`로 취소 후 정확한 좌표로 재시도함).
- 탭 결과: 버튼 텍스트가 즉시 반응했고("받는 중…" 로딩 상태를 거쳐) 최종적으로 "받기" 텍스트가 비활성(`text-gray700`, 회색) 스타일로 바뀜 — `canStartDownload=false`(idle 항목 소진) 상태 전이가 실제로 발생함을 확인. 스크린샷: `.docs/wip/offline-download/evidence/ac1-download-triggered-disabled-state.png`.
- **환경 제약 1건 기록**: 이 QA 세션은 실제 로그인 세션 없이 `immersiveStore`만 주입한 상태라, `fetchTTSBlob`의 인증 헤더(`authHeaders()`)가 유효하지 않아 두 항목 모두 네트워크 호출이 실패해 `failed` 상태로 귀결된 것으로 추정된다(Supabase 엔드포인트 자체는 `curl`로 리치 가능함을 확인 — `404`는 루트 경로라 정상, 네트워크 단절 아님). 즉 "받기 → done"까지의 종단 성공 여부는 **로그인 세션이 있는 상태에서는 미검증**이다. 다만 이번에 필요한 것은 AC-1의 "다운로드가 시작되고 상태가 표시되는지"이며, idle→loading→failed로의 상태 전이 자체는 실제 탭으로 확인했고, 실패 시 개별 처리(다른 항목 진행에 영향 없음, 버튼 비활성화)도 정상 동작해 AC-1 자체의 결함으로 보지 않는다. **AC-2(오프라인 재생)/AC-4(재시도) 단계에서 인증된 세션으로 종단 다운로드 성공 케이스를 반드시 재검증할 것을 다음 QA에 인계한다.**
- 화면 전환 후 다운로드 지속 여부(dev-notes Blocker 1)는 이번 세션에서 실기 확인하지 못함 — Zustand 스토어가 모듈 스코프라 이론상 유지되는 설계이고 코드상 컴포넌트 언마운트에 의존하지 않으나, 실제 화면 이동→복귀 인터랙션까지는 시간 제약상 테스트하지 못함(다음 QA 라운드 또는 AC-3 진행 시 재확인 권장).

## Q8 — 회귀 (코드 리뷰 기준)

- `playlist.tsx`의 `router.replace('/description')` → `router.push('/description')` 변경, `exit-summary`로의 `exhibitionId` 파라미터 전달 추가는 AC-1과 무관한 기존 diff이나(전체 작업트리에 이미 존재하는 변경), `exit-summary.tsx`가 `useLocalSearchParams<{ exhibitionId?: string }>()`로 해당 파라미터를 정상적으로 소비하는 것을 코드로 확인해 회귀 없음.
- `confirmExit`이 `useCallback`으로 래핑되고 `beforeRemove` 리스너 deps가 `[navigation, isImmersive, confirmExit]`로 정리된 것도 기존 동작(관람 종료 확인 다이얼로그)을 그대로 유지함 — 시뮬레이터에서도 X 버튼 오탐 클릭 시 "전시 관람 종료" 다이얼로그가 정상적으로 뜨는 것을 실기로 확인(의도치 않게 이 회귀 케이스를 검증하게 됨).
- 작가 소개 트랙(`ArtistIntroTrack`), 채팅 버튼, 작품 찾기(+) 버튼은 이번 AC-1 diff에서 로직이 변경되지 않았고 화면에도 정상 렌더됨(스크린샷 우하단 채팅/추가 버튼 확인).

## Q9 — 성능(가벼운 수준)

- `downloadTargets`(deps: `playlist`, `introStatus`, `introText`), `downloadTargetIds`(deps: `downloadTargets`) 모두 `useMemo` 의존성 배열이 실제 사용 값과 일치 — 불필요한 재계산 없음.
- `showPredownloadRow`/`canStartDownload`/`isDownloading`/`downloadProgress`는 매 렌더 재계산되지만 작은 배열에 대한 O(n) 순수 함수 호출이라 메모이제이션 불필요 수준(컨벤션 §7 "단순 원시값은 메모이제이션 불필요"에 해당하는 경량 연산).

## Q10 — 네이티브 모듈

- 해당 없음. dev-notes와 일치 — `expo-file-system`은 이미 설치됨(`~56.0.8`), `pod install`/`expo run:ios` 불필요.

---

## Blockers for Chris — 없음 (P0/P1 0건)

## 참고 (P2, blocking 아님)

1. `playlist.tsx` import 순서가 기존 파일 스타일을 그대로 따름(Q5 참고) — 이번 AC-1 범위에서 신규로 발생한 결함이 아니므로 blocking 아님.
2. 화면 이탈→복귀 시 다운로드 지속 여부(dev-notes Blocker 1)는 이번 세션에서 실기 검증하지 못함 — 다음 QA 라운드에서 재확인 필요.
3. 인증된 세션에서의 종단 다운로드 성공(받기→완료) 케이스는 이번 QA 데이터 주입 방식(로그인 없이 스토어만 주입)의 한계로 미검증 — AC-2/AC-4 QA 시 반드시 재검증.

---

# QA Report — AC-2 (다운로드 완료 항목의 오프라인 재생)

> 범위: AC-2만(오프라인 재생 로컬 우선 조회 경로). AC-3~AC-5는 여전히 미착수(dev-notes 기준)라 포함하지 않는다.

## Verdict: **Pass** (P0 0건, P1 0건, P2 0건)

**중요 정정 사항**: `04-dev-notes.md`의 "Implemented ACs" 표는 AC-2를 "Not started"로 기록하고 있으나, 실제 코드(`src/utils/offlineAudio.ts`의 `resolveAudioUri`, `src/hooks/useTTS.ts`의 `speak`/`preload` 통합)는 이미 AC-2를 구현·통합한 상태였다. `git status`로 확인한 워킹트리 변경분(`src/hooks/useTTS.ts` 수정 + `src/utils/offlineAudio.ts`/`offlineAudio.test.ts` 신규)이 이를 뒷받침한다 — dev-notes 표가 최신화되지 않은 것으로 보이며, Chris에게 표 갱신을 권장한다(blocking 아님, P2 수준 문서 이슈로 별도 기록하지 않고 여기 코멘트로만 남김).

---

## 체크리스트 결과 (AC-2 대상)

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors 재확인 |
| Q2 | `npx jest` | ✅ Pass | 6 suites / **73 tests** 전부 통과 (AC-1 QA 시점 71개 → `resolveAudioUri` 테스트 2개 추가로 73개) |
| Q3 | 버그/edge 코드 리뷰 | ✅ Pass | 아래 상세 |
| Q4 | UX | 해당 없음 | 내부 로직 변경, UI 변경 없음 — 스킵 |
| Q5 | 컨벤션 | ✅ Pass | 아래 상세 |
| Q6 | 비주얼(시뮬레이터) | ⚠️ 코드 레벨 검증으로 대체 | 아래 상세 — 사유 기록 |
| Q7 | 인터랙션(시뮬레이터) | ⚠️ 코드 레벨 검증으로 대체 | 아래 상세 — 사유 기록 |
| Q8 | 회귀 | ✅ Pass | 아래 상세 |
| Q9 | 성능 | ✅ Pass | 아래 상세 |
| Q10 | 네이티브 모듈 | 해당 없음 | 신규/제거된 네이티브 모듈 없음 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors). 재확인 완료.

## Q2 — 테스트

```
npx jest
```
```
PASS src/utils/__tests__/offlineAudio.test.ts
PASS src/utils/__tests__/exhibitionSearch.test.ts
PASS src/store/__tests__/offlineDownloadStore.test.ts
PASS src/utils/__tests__/exhibitionClassification.test.ts
PASS src/utils/__tests__/stripHtml.test.ts
PASS src/utils/__tests__/popularExhibitions.test.ts

Test Suites: 6 passed, 6 total
Tests:       73 passed, 73 total
```

`git worktree list` 확인 결과 등록된 worktree는 primary checkout(`/Users/chaeyunsim/Documents/mollip`, `main` 브랜치)뿐이며, jest 스캔 범위에 잔여 `.claude/worktrees/` 하위 항목이 포함되지 않음을 확인했다(테스트 스위트 수 6개로 AC-1 QA 시점과 동일, 이상 없음).

## Q3 — 버그/edge 케이스

- **로컬 파일 우선 반환, 네트워크 미호출**: `offlineAudio.ts`의 `resolveAudioUri(cacheKey, fetchFromNetwork)`는 `getOfflineAudioUri(cacheKey)`(동기, `File.exists` getter 기반)로 로컬 파일을 먼저 확인하고, 존재하면 `fetchFromNetwork`를 **호출하지 않고** 즉시 로컬 URI를 반환한다(`offlineAudio.ts` L73-80). `offlineAudio.test.ts`의 "로컬 파일이 있으면 네트워크 호출 없이 로컬 URI를 즉시 반환한다" 테스트가 `fetchFromNetwork` mock의 `not.toHaveBeenCalled()`로 이를 직접 검증한다 — 코드와 테스트 모두 확인.
- **로컬 파일 없으면 기존 네트워크 경로 그대로(AC-6 회귀 방지)**: 로컬 파일이 없으면 `fetchFromNetwork()`를 호출해 그 반환값을 그대로 반환한다. `offlineAudio.test.ts`의 "로컬 파일이 없으면 네트워크 fetcher를 호출하고 그 결과를 반환한다(AC-6 회귀 방지)" 테스트로 커버됨.
- **`useTTS.ts` 통합 지점**: `speak`(재생)과 `preload`(사전 로드) 양쪽 모두 기존 `audioCache.current.get(cacheKey)`(세션 인메모리 캐시) 확인 이후, 인메모리 캐시 미스 시 `fetchTTSBlob`을 직접 호출하던 것을 `resolveAudioUri(cacheKey, () => fetchTTSBlob(voiceId, cleaned, voiceSpeed))`로 감싸는 변경뿐이다. 즉 캐시 우선순위는 "인메모리 세션 캐시 → 영구 파일 캐시 → 네트워크" 순으로, spec의 Risks & dependencies에 명시된 우선순위 설계와 일치한다.
- **edge — 캐시 키 통일 확인**: `useTTS.ts`의 `cacheKey = \`${voiceId}\x00${voiceSpeed}\x00${cleaned}\`` 와 dev-notes §"구현 결정 사항 2"가 명시한 `offlineDownloadStore`의 해시 대상 키가 동일 조합(`voiceId\x00speed\x00text`)임을 코드로 재확인 — 다운로드 시 저장한 파일과 재생 시 조회하는 캐시 키가 어긋나 로컬 파일을 못 찾는 edge는 없음.

## Q4 — UX

- 해당 없음(스킵). 이번 diff는 `useTTS.ts`의 URI 조회 로직 내부 변경뿐이며 신규 UI나 화면 변경이 없다 — spec에도 AC-2는 UI 변경 사항을 명시하지 않았다.

## Q5 — 컨벤션

- `git diff src/hooks/useTTS.ts` 확인 결과, 변경은 import 1줄 추가(`import { resolveAudioUri } from '../utils/offlineAudio';`)와 `fetchTTSBlob` 직접 호출 2곳을 `resolveAudioUri(...)` 래핑으로 교체한 것뿐 — 최소 diff 원칙 준수.
- import 순서: 기존 파일이 이미 상대경로(`../store/...`, `../utils/...`)를 쓰고 있었고(AC-1 QA에서 지적된 `playlist.tsx`와 동일하게 프로젝트 초기부터의 기존 스타일), 신규 `resolveAudioUri` import는 기존 내부 import 블록 안에서 알파벳 순서(`api` → `offlineAudio` → `text`)를 유지하며 삽입됐다 — 컨벤션 §12(내부 경로는 유틸 순)에 부합하고 기존 파일 스타일과도 일치. P2 이슈 없음.
- `offlineAudio.ts`의 `resolveAudioUri` 함수는 JSDoc 주석(한국어)으로 AC-2/AC-6 역할을 명시 — 컨벤션 §4(SRP)에 맞게 순수 함수로 분리되어 있고 `useTTS.ts`에서 조회 로직을 직접 구현하지 않고 위임한다.

## Q6/Q7 — 비주얼·인터랙션(시뮬레이터)

**시뮬레이터로 "다운로드 완료 + 네트워크 차단 + 재생" 종단 시나리오를 재현하지 못했다. 코드 레벨 검증으로 대체하며, 이유는 다음과 같다:**

1. **완료 상태 도달 자체가 막혀 있음**: AC-1 QA에서 이미 기록했듯, 이 QA 세션은 실제 로그인 세션 없이 `immersiveStore`를 AsyncStorage에 직접 주입하는 방식이라 `fetchTTSBlob`의 인증 헤더(`authHeaders()`)가 유효하지 않다. 따라서 "받기"를 눌러도 두 항목 모두 네트워크 요청이 401/인증 실패로 귀결되어 `failed` 상태에 머물고, `completed`(로컬 파일 저장 완료) 상태를 실제로 만들 수 없다. AC-2는 정확히 이 "완료" 상태를 전제로 하므로(spec Given: "완료 상태로 다운로드되어 있다"), 로그인 세션 없이는 전제 자체를 시뮬레이터에서 충족할 수 없다.
2. **오프라인 상태 재현 수단도 제한적**: spec의 Non-goals에 명시된 대로 이 기능은 `NetInfo` 등 실시간 네트워크 감지를 쓰지 않으므로 "네트워크 연결 안 됨"을 앱 레벨에서 흉내 낼 UI 토글이 없다. 시뮬레이터 자체의 네트워크 차단(Xcode Network Link Conditioner 등)은 이 세션의 권한/설정 범위를 벗어난다.
3. **억지로 흉내 내지 않음**: `saveOfflineAudioFromDataUri`를 QA 스크립트로 직접 호출해 가짜 완료 상태를 만드는 방법도 고려했으나, 이는 실제 다운로드 플로우(AC-1)를 우회하는 것이라 "다운로드 완료 항목"이라는 AC-2의 전제를 인위적으로 조작하는 것이며, 실제 사용자 경로를 검증하는 게 아니므로 채택하지 않았다.

**대신 다음을 코드 레벨로 검증했다(Q3 상세 참고)**:
- `resolveAudioUri`의 로컬 우선 반환 + 네트워크 미호출을 `offlineAudio.test.ts`가 실제 `expo-file-system` 인메모리 목(jest-expo 제공)으로 종단 간 검증함 — 파일을 실제로 저장하고(`saveOfflineAudioFromDataUri`) 그 상태에서 `resolveAudioUri`를 호출해 로컬 URI가 반환되고 네트워크 fetcher가 호출되지 않음을 `fetchFromNetwork` mock으로 단언.
- `useTTS.ts`의 `speak`/`preload`가 `resolveAudioUri`를 올바른 인자(`cacheKey`, `fetchTTSBlob` 클로저)로 호출하는지 `git diff`로 직접 확인.

**다음 QA/AC(AC-4 재시도 UI 포함) 단계에서 로그인된 세션으로 실제 완료 상태를 만들 수 있게 되면, 반드시 시뮬레이터에서 (1) 완료된 항목 재생 시 로딩 지연 없이 즉시 재생 시작, (2) 네트워크 요청이 실제로 발생하지 않음(Xcode 콘솔 로그 또는 Charles Proxy 등으로 확인)을 재검증할 것을 인계한다.**

## Q8 — 회귀 (코드 리뷰 기준)

- 로컬 파일이 없는 경우(대부분의 기존 사용자 시나리오 — 아직 아무것도 다운로드하지 않음) `resolveAudioUri`는 `fetchFromNetwork()`를 호출하고 그 반환값을 그대로 사용한다. `fetchFromNetwork`로 전달되는 클로저(`() => fetchTTSBlob(voiceId, cleaned, voiceSpeed)`)는 변경 전 코드가 직접 호출하던 `fetchTTSBlob(voiceId, cleaned, voiceSpeed)`와 **동일한 인자·동일한 순서**로 호출된다(`git diff` 확인) — AC-6이 요구하는 "기존 미다운로드 재생 경로가 깨지지 않는다"를 코드 수준에서 만족한다.
- `speak`/`preload` 양쪽 모두 인메모리 `audioCache`에 대한 조회·저장 로직(`audioCache.current.get/set`)은 변경되지 않았다 — 세션 캐시 히트 시 동작은 이전과 완전히 동일.
- 에러 처리 경로(`speak`의 `catch` 블록, `preload`의 `catch { /* silent fail */ }`)도 변경 없음 — `resolveAudioUri`가 `fetchFromNetwork`의 예외를 그대로 전파하므로 기존 에러 핸들링 계약이 유지된다.

## Q9 — 성능(가벼운 수준)

- 로컬 파일 존재 확인은 **동기 함수**다: `getOfflineAudioUri` → `getOfflineAudioFile(cacheKey).exists`는 `expo-file-system`(SDK 56 File API)의 `exists` getter로, 네트워크·비동기 I/O가 아니라 동기 파일시스템 stat 호출이다. `resolveAudioUri` 자체는 `async` 함수이지만 로컬 히트 시 내부에 `await`가 전혀 없어(동기 stat 후 즉시 return) 불필요한 이벤트 루프 지연이 없다.
- 매 재생마다 파일 시스템 stat 1회가 추가되지만(기존에는 인메모리 캐시 미스 시 곧바로 네트워크 요청), 이는 spec이 요구하는 "로컬 파일 존재 여부를 먼저 확인" 동작 자체이며, stat 호출은 네트워크 요청 대비 무시할 수준의 오버헤드다. 불필요한 반복 I/O(루프 내 매번 재확인 등)는 없음 — `speak`/`preload` 모두 캐시 미스 시 1회만 호출.

## Q10 — 네이티브 모듈

- 해당 없음. `expo-file-system`은 AC-1 시점에 이미 설치되어 있었고 이번 AC-2 diff에서도 신규/제거된 네이티브 모듈이 없다 — `pod install`/`expo run:ios` 불필요.

---

## Blockers for Chris — 없음 (P0/P1 0건)

## 참고 (P2, blocking 아님)

1. `04-dev-notes.md`의 "Implemented ACs" 표가 AC-2를 "Not started"로 표기하고 있으나 실제로는 구현·테스트까지 완료된 상태 — 표 최신화 권장(blocking 아님).
2. Q6/Q7은 로그인 세션 부재로 인해 "완료 상태 + 오프라인 재생"의 실제 시뮬레이터 종단 검증을 수행하지 못하고 코드 레벨 검증으로 대체함 — AC-1 QA에서 인계된 동일한 환경 제약(인증 세션 없음)이 AC-2에도 이어짐. **다음 QA 라운드(AC-4 또는 로그인 세션이 확보되는 시점)에서 반드시 실기 재검증 필요.**

---

# QA Report — AC-3 (다운로드 진행률 실시간 표시)

> 범위: AC-3만(항목별 상태 배지 `DownloadStatusBadge` + 폴링 없는 실시간 갱신). AC-4~AC-5는 여전히 미착수(dev-notes 기준)라 포함하지 않는다.

## Verdict: **Pass** (P0 0건, P1 0건, P2 0건)

---

## 체크리스트 결과 (AC-3 대상)

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors 재확인 |
| Q2 | `npx jest` | ✅ Pass | 6 suites / 73 tests 전부 통과(AC-2 QA 시점과 동일 — `DownloadStatusBadge`는 순수 표시 컴포넌트이며 이 프로젝트엔 `.tsx` 컴포넌트 테스트 관례 자체가 없음, `PredownloadRow`도 동일) |
| Q3 | 버그/edge 코드 리뷰 | ✅ Pass | 아래 상세 |
| Q4 | UX (브리프 일치) | ✅ Pass | 아래 상세 |
| Q5 | 컨벤션 | ✅ Pass | 아래 상세 |
| Q6 | 비주얼(시뮬레이터) | ✅ Pass | 스크린샷 확보, idle(배지 없음)·failed(빨간 배지) 실기 확인 — 아래 상세 |
| Q7 | 인터랙션(시뮬레이터) | ✅ Pass (환경 제약 1건 기록) | 아래 상세 |
| Q8 | 회귀 | ✅ Pass | 아래 상세 |
| Q9 | 성능(가벼운 수준) | ✅ Pass | 순수 조건부 렌더, 특이사항 없음 |
| Q10 | 네이티브 모듈 | 해당 없음 | 신규/제거된 네이티브 모듈 없음 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors). 재확인 완료.

## Q2 — 테스트

```
npx jest
```
```
PASS src/utils/__tests__/offlineAudio.test.ts
PASS src/utils/__tests__/exhibitionSearch.test.ts
PASS src/store/__tests__/offlineDownloadStore.test.ts
PASS src/utils/__tests__/exhibitionClassification.test.ts
PASS src/utils/__tests__/popularExhibitions.test.ts
PASS src/utils/__tests__/stripHtml.test.ts

Test Suites: 6 passed, 6 total
Tests:       73 passed, 73 total
```

## Q3 — 버그/edge 케이스

- **(a) `idle` 상태에서 배지 미렌더 확인**: `DownloadStatusBadge`는 `if (status === 'idle') return null;`으로 즉시 반환한다(`DownloadStatusBadge.tsx` L25) — 코드상 확정. 실기로도 초기 상태(다운로드 트리거 전)의 재생목록 스크린샷(`ac3-idle-no-badge.png`)에서 썸네일에 배지가 전혀 보이지 않음을 확인.
- **(b) 클리핑 회피 배치 확인(design brief iteration 3 Blocker 1 재발 여부)**: `playlist.tsx`(L258-265)와 `ArtistIntroTrack.tsx`(L85-94) 둘 다 `<View className="relative">`로 `ImageFallback`을 감싸고, `DownloadStatusBadge`를 그 `View`의 **형제**(`ImageFallback`의 `children`이 아님)로 배치한다. `ImageFallback.tsx`(L96) 루트 `View`가 `overflow-hidden`을 갖고 있어 만약 배지가 `children`으로 전달됐다면 `absolute -top-1 -right-1`(음수 오프셋)이 잘렸을 것이나, 형제 배치이므로 `overflow-hidden`의 영향을 받지 않는다 — 코드 확인 + 아래 Q6 실기 스크린샷(`ac3-badges-failed.png`)에서 배지가 썸네일 모서리 밖으로 정상 노출됨을 시각적으로 재확인. 재발 없음.
- **(c) 실패 배지 `onRetry`가 실제로 연결되지 않음(의도된 설계)**: `DownloadStatusBadge`는 `onRetry` prop을 받아 `Pressable`에 연결하지만, `playlist.tsx`/`ArtistIntroTrack.tsx` 양쪽 다 `onRetry`를 넘기지 않는다(`<DownloadStatusBadge status={...} />`만 호출, prop 없음) — dev-notes에 명시된 대로 AC-4(재시도) 범위이며 이번 AC-3에서는 시각 표시만 담당하는 게 맞다. 탭해도 아무 동작이 없는 것이 이번 AC 범위에서는 정상(버그 아님).

## Q4 — UX (디자인 브리프 대비)

- 색상: 완료(`checkmark-circle`, `text-success`) / 실패(`alert-circle`, `text-error`) — `DownloadStatusBadge.tsx` L48, L59 코드와 브리프 토큰 일치. 실기로는 `failed` 상태만 확인했으며(Q7 참고) 빨간 원형 아이콘이 정확히 렌더됨을 스크린샷으로 확인.
- 아이콘: `loading`은 `ActivityIndicator`, `done`은 `checkmark-circle`, `failed`는 `alert-circle` — 브리프의 4상태(idle/loading/done/failed) 매핑과 일치.
- 위치: 썸네일 우상단(`absolute -top-1 -right-1`)에 겹쳐 표시 — 모든 상태 공통, 브리프 요구사항과 일치.
- 접근성: `ACCESSIBILITY_LABEL` 맵이 loading/done/failed 각각에 한국어 라벨을 제공하고(`accessibilityRole="image"` 또는 `"button"`), 실패 배지는 `hitSlop={16}` 전방향으로 터치 타겟을 보강 — 컨벤션 §8(아이콘 전용 버튼은 반드시 `accessibilityLabel`)에 부합.

## Q5 — 컨벤션

- `DownloadStatusBadge.tsx`: Props interface `DownloadStatusBadgeProps` 네이밍 ✅, import 순서(외부 `react-native`/`@expo/vector-icons` 블록 → 빈 줄 → 내부 `@/src/...` 블록) ✅, named export ✅, JSX 조건부 렌더링이 각 상태별 완전한 `return`으로 분기(중첩 삼항 없음, §11.2 부합) ✅.
- `playlist.tsx`/`ArtistIntroTrack.tsx`의 `DownloadStatusBadge` 삽입 지점: 기존 import 블록에 알파벳/그룹 순서를 유지하며 추가됨(`git diff` 확인) — 최소 diff 원칙 준수.
- P2 이슈 없음(AC-1/AC-2에서 지적된 `playlist.tsx`의 기존 import 순서 이슈는 이번 AC-3 diff와 무관한 기존 파일 스타일이며 이미 이전 QA에서 blocking 아님으로 확정됨 — 재론하지 않음).

## Q6 — 비주얼(시뮬레이터)

- 부팅된 `iPhone 16 (iOS 18.3)` 시뮬레이터 사용(이미 부팅 상태 확인 후 재사용).
- **재생목록에 항목이 있는 상태 재현**: AC-1/AC-2 QA와 동일한 방식으로 `immersive-store`(Zustand `persist`)의 AsyncStorage 매니페스트(`RCTAsyncLocalStorage_V1/manifest.json`)를 직접 편집해 `isImmersiveMode: true` + 재생목록 항목 2개(QA 테스트 작품 1/2)를 주입한 뒤 앱을 재기동(`simctl terminate` → `simctl launch`)하고 `mollip:///playlist` 딥링크로 진입.
- 스크린샷 1: `.docs/wip/offline-download/evidence/ac3-idle-no-badge.png` — 주입 직후(다운로드 트리거 전) 두 항목 모두 배지 없음(idle) 확인.
- 스크린샷 2: `.docs/wip/offline-download/evidence/ac3-badges-failed.png` — "받기" 탭 후 두 항목 모두 썸네일 우상단에 빨간 원형 `alert-circle` 배지가 클리핑 없이 정상 노출됨을 확인(아래 Q7 참고 — 인증 세션 부재로 `failed`까지만 실기 확인, `loading`/`done`은 코드 레벨로 대체).
- 작가 소개 트랙(`ArtistIntroTrack`)은 이번 QA 세션의 주입 데이터에 `introStatus: 'ready'` 상태가 포함되지 않아 화면에 렌더되지 않았다 — 작가 소개 배지의 실기 확인은 이번 세션에서 하지 못했고, `playlist.tsx` 리스트 항목과 완전히 동일한 배치 패턴(Q3-b)을 코드로 재확인하는 것으로 대체했다. 실기 미검증 사실을 아래 "참고(P2)"에 기록.

## Q7 — 인터랙션(시뮬레이터)

- "받기" 버튼을 System Events(`position of window 1` / `size of window 1`)로 시뮬레이터 윈도우 좌표를 얻은 뒤 `cliclick`으로 실제 좌표를 계산해 탭했다 — 첫 시도에 정확한 위치("받기" 텍스트)를 탭하는 데 성공(오탐 없음).
- 탭 결과: 두 항목이 `idle → loading → failed`로 전이됐고, "받기" 텍스트가 즉시 비활성(회색) 스타일로 바뀌었다(idle 항목 소진, AC-1에서 이미 검증된 동작과 일치) — `ac3-badges-failed.png`로 최종 상태(두 항목 모두 실패 배지) 확인.
- **환경 제약 1건 재확인**: 이번 세션도 실제 로그인 세션 없이 `immersiveStore`만 주입한 상태라 `fetchTTSBlob`의 인증 헤더가 유효하지 않다. `curl -X POST <tts 엔드포인트>`로 직접 호출해 `401`을 반환함을 확인해, 두 항목이 `failed`로 귀결된 원인이 인증 부재이며 AC-3 자체의 결함이 아님을 검증했다(AC-1/AC-2 QA에서 이미 기록된 동일한 환경 제약의 연장). **`loading`(진행 중) 배지의 실기 확인은 하지 못했다** — 두 항목의 다운로드가 매우 빠르게(네트워크 요청이 즉시 401로 실패) `failed`로 전이돼 `ActivityIndicator` 렌더 시점을 스크린샷으로 포착할 시간적 여유가 없었다. `loading` 상태는 `DownloadStatusBadge.tsx` L27-37 코드 리뷰(상태 분기 구조 자체가 `idle`/`failed`/`done`과 동일 패턴)로 대체 확인했으며, 억지로 재현을 시도(예: 코드 임시 수정으로 지연 삽입)하지 않았다.
- "완료(done)" 상태는 AC-1/AC-2 QA와 동일한 이유(인증 세션 없음)로 이번에도 실기 도달 불가 — 억지로 흉내 내지 않고 이 사실을 그대로 기록한다. **다음 QA(AC-4 재시도 UI 포함) 또는 로그인 세션이 확보되는 시점에 `loading`/`done` 배지의 실기 재검증이 반드시 필요.**

## Q8 — 회귀 (코드 리뷰 + 실기 스크린샷 대조)

- 기존 재생목록 리스트 아이템 레이아웃(썸네일 → 텍스트 → 재생 아이콘 순서, 간격)은 `ac3-badges-failed.png`와 AC-1 QA의 `ac1-playlist.png`를 대조한 결과 배지 추가로 인한 시프트나 겹침 없이 동일하게 유지됨을 확인.
- `ArtistIntroTrack`의 기존 3상태(loading/ready/failed) 표시 로직(`resolveAccessibilityLabel`, `renderControl`, `SUBTITLE` 매핑)은 이번 AC-3 diff에서 변경되지 않았다 — `git diff`로 확인한 변경분은 `downloadStatus` prop 추가(기본값 `'idle'`)와 `DownloadStatusBadge` 삽입뿐이며, 기존 상태 전환 로직·컨트롤 렌더링은 그대로다.
- `PredownloadRow`(AC-1)의 "받는 중… N/M" 텍스트 및 버튼 활성화 로직도 이번 diff에서 변경되지 않았고, 실기 확인(Q7)에서도 정상 동작함을 재확인.

## Q9 — 성능(가벼운 수준)

- `DownloadStatusBadge`는 props(`status`, `onRetry`)만 받는 순수 함수 컴포넌트로 내부 상태·`useEffect`가 없다 — `useOfflineDownloadStore`의 `statuses` 값이 바뀔 때만 부모(`playlist.tsx`/`ArtistIntroTrack.tsx`)가 리렌더되고, 그 리렌더 범위도 Zustand 구독 범위에 한정된다(불필요한 전체 트리 리렌더 없음).
- Zustand 구독 기반이라 폴링이 없고(spec의 "폴링 없이 실시간 갱신" 요건과 일치), 4개 상태 분기의 조건부 렌더링은 O(1) 수준이라 메모이제이션이 필요한 수준의 연산이 아니다(컨벤션 §7과 일치).

## Q10 — 네이티브 모듈

- 해당 없음. 신규/제거된 네이티브 모듈 없음 — `pod install`/`expo run:ios` 불필요.

---

## Blockers for Chris — 없음 (P0/P1 0건)

## 참고 (P2, blocking 아님)

1. `loading`(진행 중) 배지와 `done`(완료) 배지는 이번 세션에서 실기 확인하지 못했다 — `loading`은 네트워크 요청이 즉시 실패(401)해 포착할 틈이 없었고, `done`은 AC-1/AC-2와 동일한 인증 세션 부재 제약으로 도달 자체가 불가능했다. 두 상태 모두 코드 레벨(구조적 동일성 리뷰)로 대체했으며 다음 QA 라운드에서 실기 재검증 필요.
2. 작가 소개 트랙(`ArtistIntroTrack`)의 배지는 이번 세션의 주입 데이터에 `introStatus: 'ready'`가 없어 화면에 렌더되지 않았다 — 배치 패턴은 코드로 확인했으나 실기 스크린샷은 확보하지 못함. 다음 QA에서 작가 소개가 `ready` 상태인 시나리오를 별도로 주입해 재확인 권장.
3. 로그인된 세션에서의 종단 완료(받기 → done) 시나리오 재검증은 AC-1/AC-2에 이어 AC-3에서도 계속 인계됨 — AC-4(재시도 UI) QA 또는 로그인 세션 확보 시점에 일괄 재검증 권장.

---

# QA Report — AC-4 (다운로드 실패 시 개별 재시도)

> 범위: AC-4만(`retryDownload` 액션 + `DownloadStatusBadge`/`PredownloadRow` 카피 변경분 연결). AC-5는 여전히 미착수(dev-notes 기준)라 포함하지 않는다.

## Verdict: **Pass** (P0 0건, P1 0건, P2 1건 — 아래 참고)

---

## 체크리스트 결과 (AC-4 대상)

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors 재확인 |
| Q2 | `npx jest` | ✅ Pass | 6 suites / **76 tests** 전부 통과 (AC-3 QA 시점 73개 → `retryDownload` 테스트 3개 추가로 76개) |
| Q3 | 버그/edge 코드 리뷰 | ✅ Pass | 아래 상세 |
| Q4 | UX (카피 일관성) | ✅ Pass | 아래 상세 |
| Q5 | 컨벤션 | ✅ Pass | 아래 상세 |
| Q6 | 비주얼(시뮬레이터) | ✅ Pass | 스크린샷 확보, 실기 확인 — 아래 상세 |
| Q7 | 인터랙션(시뮬레이터) | ✅ Pass | **이번 AC에서 처음으로 종단 재시도 인터랙션을 실기로 확인함** — 아래 상세 |
| Q8 | 회귀 | ✅ Pass | 아래 상세 |
| Q9 | 성능(가벼운 수준) | 해당 없음/경미 | 특이사항 없음 |
| Q10 | 네이티브 모듈 | 해당 없음 | 신규/제거된 네이티브 모듈 없음 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors). 재확인 완료.

## Q2 — 테스트

```
npx jest
```
```
PASS src/utils/__tests__/stripHtml.test.ts
PASS src/utils/__tests__/exhibitionClassification.test.ts
PASS src/store/__tests__/offlineDownloadStore.test.ts
PASS src/utils/__tests__/popularExhibitions.test.ts
PASS src/utils/__tests__/offlineAudio.test.ts
PASS src/utils/__tests__/exhibitionSearch.test.ts

Test Suites: 6 passed, 6 total
Tests:       76 passed, 76 total
```

`offlineDownloadStore.test.ts`의 `describe('retryDownload — 실패 항목 1개만 재시도(AC-4)')` 블록 3개 테스트("실패 항목을 재다운로드해 done으로 바꾼다", "다른 항목의 상태·배치 진행에는 영향을 주지 않는다", "재시도가 다시 실패하면 failed 상태를 유지한다")를 코드로 직접 확인했고, 전부 통과함을 재확인했다.

## Q3 — 버그/edge 케이스

- **(a) `retryDownload`가 `batchIds`를 건드리지 않는지**: `offlineDownloadStore.ts`의 `retryDownload` 구현(L69-81)은 `set((state) => ({ statuses: { ...state.statuses, [id]: ... } }))`만 호출하며 `batchIds`를 참조하지도, 갱신하지도 않는다 — `startDownload`(L42-67)가 `batchIds: idleTargets.map(...)`로 배치를 새로 설정하는 것과 명확히 분리된 경로다. `offlineDownloadStore.test.ts`의 "다른 항목의 상태·배치 진행에는 영향을 주지 않는다" 테스트가 `batchIds: ['other-loading']`를 사전 설정한 뒤 `retryDownload` 호출 후에도 `batchIds`가 그대로 `['other-loading']`임을 직접 단언한다 — 코드+테스트 모두 확인. **실기로도 재확인**: 시뮬레이터에서 두 항목이 모두 `failed`인 상태에서 항목 2("QA 테스트 작품 2")의 배지만 탭했을 때, 항목 1("QA 테스트 작품 1")의 배지는 `failed` 상태 그대로 변화가 없었고(스크린샷 `ac4-retry.png` 최종 상태 확인), Row A의 "받기" 버튼도 계속 비활성(idle 소진) 상태를 유지했다.
- **(b) `handleRetryDownload`가 텍스트를 못 찾으면 안전하게 무시**: `playlist.tsx` L100-108의 `handleRetryDownload`는 `downloadTargetTextById.get(id)`가 `undefined`이면 `if (!text) return;`으로 즉시 반환하고 `retryDownload`를 호출하지 않는다. `downloadTargetTextById`는 `downloadTargets`(현재 화면에 존재하는 대상)로만 구성되므로, 화면에 없는 id(예: 재생목록에서 이미 제거된 항목)로 재시도가 호출돼도 크래시나 잘못된 네트워크 호출 없이 조용히 무시된다 — edge 케이스 방어 확인.
- **(c) 재시도 중 다시 실패하면 failed 유지**: `retryDownload`의 `catch` 블록이 `set((state) => ({ statuses: { ...state.statuses, [id]: 'failed' } }))`로 상태를 되돌린다. `offlineDownloadStore.test.ts`의 "재시도가 다시 실패하면 failed 상태를 유지한다" 테스트로 커버되며, **실기로도 확인**: 인증 세션이 없는 이번 QA 환경에서 항목 2를 재시도했을 때 `loading`(스피너)을 거쳐 다시 `failed`(빨간 배지)로 돌아옴을 스크린샷(`ac4-retry.png`)으로 확인했다.
- **참고(부수 관찰, 버그 아님)**: 재시도(`retryDownload`) 도중에도 Row A(`PredownloadRow`)가 "받는 중… 0/2"로 표시됐다(`ac4_retry_loading.png`, evidence 미포함 임시 캡처). 이는 `isDownloading = isAnyLoading(downloadTargetIds, downloadStatuses)`가 **전체 대상 중 하나라도 loading이면 true**를 반환하기 때문에, 개별 재시도든 배치 다운로드든 구분 없이 Row A가 "받는 중" 표시로 전환되는 설계다. `downloadProgress`는 옛 `batchIds`(이번 경우 최초 배치 2개) 기준이라 "0/2"로 보이지만, 진행 중인 항목이 실제로는 1개뿐이라 카운트가 다소 오해의 소지가 있다. 다만 spec AC-4는 "다른 항목의 다운로드 진행은 실패와 무관하게 계속된다"만 요구하고 Row A 라벨의 정확한 N/M 표기까지 요구하지 않으며, "받기" 버튼 자체는 이미 idle 소진으로 비활성 상태이므로 사용자가 오조작할 위험은 없다 — **P2로 기록, blocking 아님**.

## Q4 — UX (카피 일관성)

- Row A 라벨 "관람 전 미리 받기" → "들은 해설 오프라인으로 저장" 변경이 `PredownloadRow.tsx`(L36, accessibilityLabel도 L30에서 동일하게 갱신)와 `02-design-brief.md`(Copy 표 L47, States 설명 L65, 접근성 섹션 L74) 양쪽에 정확히 동기화되어 있음을 `grep`으로 교차 확인했다 — 두 문서·코드 사이에 표현 차이 없음.
- 시뮬레이터 스크린샷(`ac4_playlist_wait.png` 등)에서도 "들은 해설 오프라인으로 저장" 라벨이 실제로 렌더됨을 확인.
- 실패 배지 접근성 라벨("다운로드 실패, 탭해서 재시도")은 `DownloadStatusBadge.tsx`의 `ACCESSIBILITY_LABEL.failed`와 일치 — 탭 가능함을 스크린리더 사용자에게도 전달.

## Q5 — 컨벤션

- `offlineDownloadStore.ts`의 `retryDownload` 액션은 `startDownload`와 동일한 스타일(비동기 화살표 함수, `set()` 콜백에서 스프레드로 불변 갱신, `try/catch`로 성공/실패 상태 분기)을 그대로 따른다 — 신규 패턴을 도입하지 않고 기존 함수의 관용구를 재사용했다.
- 인터페이스 필드 순서(`OfflineDownloadState`)도 `startDownload` 다음에 `retryDownload`를 추가하는 자연스러운 배치이며, JSDoc 주석(한국어)으로 AC-4 범위와 "다른 항목에 영향 없음" 계약을 명시 — 컨벤션 §4(SRP)·언어 설정(`code_comments: ko`로 추정, 기존 파일과 일관)에 부합.
- `playlist.tsx`/`ArtistIntroTrack.tsx`의 `onRetry`/`onRetryDownload` prop 연결은 기존 import 블록 구조를 그대로 유지한 채 필요한 심볼만 추가됐다(`git diff` 확인) — 최소 diff 원칙 준수.
- **P2 없음** — AC-1/AC-2에서 지적된 `playlist.tsx`의 기존 import 순서 이슈는 이번 AC-4 diff와 무관한 기존 파일 스타일이며 이미 이전 QA에서 blocking 아님으로 확정됨(재론하지 않음).

## Q6 — 비주얼(시뮬레이터)

- 부팅된 `iPhone 16 (iOS 18.3)` 시뮬레이터 사용(기존 부팅 상태 재사용).
- **재생목록에 항목이 있는 상태 재현**: AC-1~AC-3 QA와 동일한 방식으로 `immersive-store`(Zustand `persist`)의 AsyncStorage 매니페스트(`RCTAsyncLocalStorage_V1/manifest.json`)를 직접 편집해 `isImmersiveMode: true` + 재생목록 항목 2개(AC-4 QA 전용 항목)를 주입한 뒤 앱을 재기동(`simctl terminate` → `simctl launch`)하고 `mollip:///playlist` 딥링크로 진입.
- 스크린샷: `.docs/wip/offline-download/evidence/ac4-failed-before-retry.png` — "받기" 탭 후 두 항목 모두 `failed`(빨간 `alert-circle` 배지) 상태이고 "받기" 버튼이 비활성(회색)인 초기 상태.
- 스크린샷: `.docs/wip/offline-download/evidence/ac4-retry.png` — 항목 2("QA 테스트 작품 2")의 실패 배지를 탭해 재시도한 뒤 최종 상태. 항목 2는 `loading`을 거쳐 다시 `failed`로 돌아왔고(인증 세션 부재로 인한 재실패, 아래 Q7 참고), 항목 1("QA 테스트 작품 1")은 처음 상태 그대로 `failed` 유지 — 두 항목이 시각적으로도 독립적으로 동작함을 확인.

## Q7 — 인터랙션(시뮬레이터)

- **이번 AC에서 처음으로 재시도 종단 인터랙션을 실기로 확인했다.** AC-1~AC-3 QA에서는 시뮬레이터 창(bezel 포함) 좌표 계산이 부정확해 탭이 여러 차례 빗나갔으나, 데스크톱 전체 스크린샷을 캡처해 시뮬레이터 창의 실제 픽셀 경계(디바이스 베젤 포함)를 직접 측정하고 Retina 배율(2x)을 보정하는 방식으로 좌표를 재계산해 정확한 탭 좌표를 얻었다 — 이후 모든 탭이 의도한 요소에 정확히 명중했다.
- "받기" 버튼을 탭 → 두 항목 모두 `idle → loading → failed`로 전이(인증 세션 부재로 인한 예상된 실패, AC-1/AC-2/AC-3와 동일한 환경 제약) → "받기" 버튼이 비활성화됨을 확인.
- **AC-4 핵심 인터랙션**: `failed` 상태인 항목 2("QA 테스트 작품 2")의 배지를 탭 → 배지가 즉시 `loading`(스피너)으로 전환되고, 동시에 항목 1("QA 테스트 작품 1")의 배지는 `failed` 상태 그대로 변화 없음을 확인(스크린샷 `ac4_retry_loading.png`, 임시 캡처 — evidence 디렉터리에는 최종 상태만 저장) → 잠시 후 항목 2가 다시 `failed`로 귀결(예상된 재실패, 인증 헤더 무효 — `src/utils/api.ts`의 `authHeaders()`가 이 QA 세션에선 로그인 세션 없이 빈 값을 반환하는 구조를 코드로 재확인) → 최종 상태를 `ac4-retry.png`로 확보.
- 이 인터랙션으로 spec AC-4의 "해당 항목은 '실패' 상태로 표시되며 사용자가 재시도할 수 있는 UI가 제공된다. 다른 항목의 다운로드 진행은 실패와 무관하게 계속된다"를 **실기로 직접 검증**했다 — 재시도 UI(배지 탭)가 실제로 동작하고, 다른 항목(항목 1)의 상태가 재시도와 무관하게 그대로 유지됨을 눈으로 확인.
- **환경 제약 재확인(AC-1~AC-3에서 인계된 동일 제약)**: 로그인 세션이 없어 `done`(완료) 상태까지는 이번에도 도달하지 못했다 — "재시도 성공 → done" 케이스는 인증된 세션에서 별도 재검증이 필요하다(아래 참고 P2 기록).

## Q8 — 회귀 (코드 리뷰 기준)

- **Row A("받기")의 idle 전용 필터링 로직(AC-1 확정 사항) 훼손 여부**: `startDownload` 함수 본문(`offlineDownloadStore.ts` L42-67)은 이번 AC-4 diff에서 전혀 수정되지 않았다(`retryDownload`는 별도 신규 액션으로 추가됐을 뿐 `startDownload`와 코드를 공유하지 않음) — `git diff`로 `startDownload` 블록에 변경 라인이 없음을 확인. `offlineDownloadStore.test.ts`의 AC-1 시점 테스트("idle 상태인 대상만 필터링해 다운로드하고", "failed 항목은 대상에서 제외한다", "idle 항목이 없으면 아무 것도 호출하지 않는다")도 전부 그대로 통과(Q2) — 회귀 없음.
- `canStartDownload = hasIdle(...)` 계산(`playlist.tsx` L84)도 변경되지 않았으며, 실기로도 두 항목이 모두 `failed`가 된 뒤 "받기" 버튼이 계속 비활성 상태를 유지함을 확인(재시도가 idle 항목을 만들어내지 않으므로 당연한 결과이나, 실제로도 그렇게 동작함을 검증).
- AC-3에서 구축된 배지 클리핑 회피 배치(`<View className="relative">` 형제 배치)도 `DownloadStatusBadge` 자체 코드가 변경되지 않았고(`onRetry` prop은 AC-3에서 이미 존재), 실기 스크린샷에서도 배지가 클리핑 없이 정상 노출됨을 재확인.

## Q9 — 성능

- 해당 없음/경미. `retryDownload`는 단일 항목에 대한 1회 네트워크 호출 + 상태 갱신이며, `startDownload`와 마찬가지로 불필요한 반복 I/O가 없다.

## Q10 — 네이티브 모듈

- 해당 없음. 신규/제거된 네이티브 모듈 없음 — `pod install`/`expo run:ios` 불필요.

---

## Blockers for Chris — 없음 (P0/P1 0건)

## 참고 (P2, blocking 아님)

1. 재시도(`retryDownload`) 도중 Row A가 옛 `batchIds` 기준의 "받는 중… 0/2"를 표시해 진행 중인 항목 수와 다소 어긋나 보일 수 있음(Q3 부수 관찰) — spec 요구사항 위반은 아니며 "받기" 버튼은 이미 비활성 상태라 오조작 위험 없음. 후속 UX 다듬기 후보로만 기록.
2. 로그인된 세션에서의 "재시도 성공 → done" 종단 케이스는 AC-1~AC-3에 이어 이번에도 인증 세션 부재로 미검증 — AC-5 QA 또는 로그인 세션이 확보되는 시점에 일괄 재검증 권장(누적 인계 사항).

---

# QA Report — Revision 3 QA — playlist.tsx 롤백 + AC-1 (북마크 화면 다운로드 트리거)

> 범위: spec revision 3(`.docs/wip/offline-download/01-spec.md`) — 다운로드 대상이 "몰입모드 재생목록 전체"에서 "북마크(하트)한 해설"로 축소됨에 따른 (1) `app/(guide)/playlist.tsx`/`src/components/guide/ArtistIntroTrack.tsx`의 revision 2 통합 롤백, (2) `app/settings/bookmark/audio.tsx`에 신규 구현된 AC-1(북마크 항목 다운로드 트리거)만 대상. AC-2~AC-6(오프라인 재생 재연동, 배지 통합, 재시도 UI, 저장공간 관리)은 dev-notes 기준 이번 범위 밖(후속 AC)이라 포함하지 않는다. worktree 생성 훅 이슈로 primary checkout(`/Users/chaeyunsim/Documents/mollip`)에서 직접 수행.

## Verdict: **Pass** (P0 0건, P1 1건 — 아래 참고, P2 1건)

---

## 체크리스트 결과

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors 재확인 |
| Q2 | `npx jest` | ✅ Pass | 6 suites / 76 tests 전부 통과 (dev-notes 시점과 동일 — 롤백/신규 구현 모두 기존 테스트 스위트에 영향 없음) |
| Q3 | 버그/edge 코드 리뷰 | ✅ Pass | 아래 상세 |
| Q4 | UX (카피 일치) | ✅ Pass | 아래 상세 |
| Q5 | 컨벤션 | ✅ Pass (P2 1건) | 아래 상세 |
| Q6 | 비주얼(시뮬레이터) | ⚠️ Pass(가) / P1(나) | (가) 재생목록 회귀 — 실기 확인. (나) 북마크 Row A 렌더링 — 환경 제약으로 코드 레벨 검증으로 대체, 아래 상세 |
| Q7 | 인터랙션(시뮬레이터) | ⚠️ 코드 레벨 검증으로 대체 | Q6(나)와 동일 제약 |
| Q8 | 회귀 | ✅ Pass | 아래 상세 |
| Q9 | 성능 | 해당 없음/경미 | 특이사항 없음 |
| Q10 | 네이티브 모듈 | 해당 없음 | 신규/제거된 네이티브 모듈 없음, `expo-file-system` 기존 설치 유지 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors).

## Q2 — 테스트

```
npx jest
```
```
PASS src/utils/__tests__/popularExhibitions.test.ts
PASS src/utils/__tests__/stripHtml.test.ts
PASS src/store/__tests__/offlineDownloadStore.test.ts
PASS src/utils/__tests__/exhibitionClassification.test.ts
PASS src/utils/__tests__/exhibitionSearch.test.ts
PASS src/utils/__tests__/offlineAudio.test.ts

Test Suites: 6 passed, 6 total
Tests:       76 passed, 76 total
```

## Q3 — 버그/edge 케이스

- **(a) `playlist.tsx`에 다운로드 관련 코드 잔존 여부**: `grep -n "PredownloadRow\|useOfflineDownloadStore\|downloadTargets\|DownloadStatusBadge\|showPredownloadRow\|canStartDownload\|isDownloading\|downloadProgress" "app/(guide)/playlist.tsx" "src/components/guide/ArtistIntroTrack.tsx"` → 매치 0건. `src/components/guide/PredownloadRow.tsx` 파일 자체도 삭제되어 존재하지 않으며, 저장소 전체를 `grep -rn "PredownloadRow"`로 재검색해도 참조가 전혀 없음 — dev-notes의 "Grep으로 다른 참조가 없음을 확인 후 삭제" 주장과 실제 상태가 일치한다. 완전한 롤백 확인.
- **(b) 다운로드와 무관한 기존 변경사항 보존 여부**: `git diff HEAD -- "app/(guide)/playlist.tsx"` 전체를 검토한 결과, (1) 채팅 버튼(`chatSessionId` 구독 + `router.push('/chat', ...)` + `chatbubble-ellipses-outline` 아이콘), (2) `exitedExhibitionId`를 `exit-summary`로 넘기는 route param, (3) `router.replace('/description')` → `router.push('/description')` 변경(뒤로가기 버그 수정), (4) `confirmExit`의 `useCallback` 래핑 — 전부 diff에 정상적으로 남아있고 다운로드 롤백과 뒤섞이지 않았다. 이 네 가지는 offline-download 기능과 무관한 기존 diff(이전 QA 라운드에서도 "AC-1과 무관한 기존 diff"로 확인된 것과 동일)이며, 롤백 과정에서 실수로 함께 지워지지 않았음을 diff 라인 단위로 확인했다.
- **(c) `bookmark/audio.tsx`의 Row A — idle 항목 0개일 때 미노출**: `app/settings/bookmark/audio.tsx` L168 `{items.length > 0 && canStartDownload && (...)}`. `canStartDownload = hasIdle(downloadTargetIds, downloadStatuses)`이며 `hasIdle`은 `offlineDownloadStore.test.ts`에서 "idle 항목이 하나도 없으면(실패만 존재해도) false"를 반환함이 이미 검증됨(revision 2 AC-1 QA에서 확인된 동일 헬퍼, 이번 diff에서 로직 변경 없음). 즉 idle 항목이 0개(모두 완료 상태이거나 북마크 자체가 없음)면 Row A가 렌더되지 않는다 — 코드상 확정.
- **(d) 다운로드 대상 매핑 정확성**: `items = useMemo(() => historyItems.filter((item) => bookmarkedIds.includes(item.id)), [historyItems, bookmarkedIds])`(L101-104)로 `useHistoryStore.items ∩ useBookmarkAudioStore.ids`만 남기고, `downloadTargets`(L116-119)는 이 필터링된 `items`에서만 매핑한다 — 북마크하지 않은 히스토리 항목이 다운로드 대상에 포함될 경로가 코드상 없음(스크린 자체가 북마크 교집합만 렌더링 대상으로 삼으므로 이중으로 안전). AC-1 스코프의 spec 요구(`useHistoryStore.items ∩ bookmarkAudioStore.ids`)와 정확히 일치.

## Q4 — UX (디자인 브리프/spec 카피 대비)

- Row A 라벨: "북마크한 해설 오프라인으로 저장"(`bookmark/audio.tsx` L174) — spec Goals의 "북마크(하트)한 해설을 디바이스에 영구 다운로드" 의도와 일치.
- 버튼 텍스트: 대기 "전체 받기"(L194) / 진행중 "받는 중… {done}/{total}"(L193) — dev-notes의 카피 표와 정확히 일치.
- 접근성: `accessibilityRole="button"`, `accessibilityLabel`이 진행 상태에 따라 동적으로 바뀜(대기 시 "북마크한 해설 오프라인으로 저장", 진행중 시 "다운로드 진행 중, N개 중 M개 완료" 형태, L182-186), `accessibilityState={{ busy: isDownloading }}`(L187) — component-convention.md §8 준수.

## Q5 — 컨벤션

- Props 타입: `AudioHistoryCardProps` 인터페이스 사용(named export 컴포넌트 아님, 화면 내부 헬퍼 — 화면 컴포넌트 자체는 `app/` 규칙대로 default export) — 기존 파일 스타일 유지.
- `useCallback`: `handleStartDownload`가 `useCallback`으로 감싸져 있고 deps(`downloadTargets`, `startDownload`, `voiceId`, `voiceSpeed`)가 실제 참조 값과 일치 — §7 준수.
- **P2 — import 순서**: `git diff -- "app/settings/bookmark/audio.tsx"`를 확인한 결과, 외부 라이브러리 블록과 내부 `@/src/...` 블록 사이에 빈 줄이 없다(§12 위반 형태). 다만 이는 AC-1 diff 이전부터 존재하던 이 파일의 기존 스타일이며(원본 파일도 동일하게 블록 구분 없이 이어져 있었음, `git diff` 상 빈 줄 추가/삭제 라인이 없음), Chris는 기존 import 블록 구조 안에 새 심볼만 알파벳/그룹 순서를 지켜 삽입했다 — 이전 revision 2 QA 라운드에서 `playlist.tsx`에 대해 이미 동일한 사유로 "기존 파일 스타일, 이번 AC 범위의 신규 결함 아님, blocking 아님"으로 확정된 것과 동일한 판단을 적용한다. blocking 아님.
- 조건부 렌더링: Row A는 `&&` 연산자(§11.3, null 분기)로 처리되어 컨벤션에 부합.

## Q6 — 비주얼(시뮬레이터)

### (가) playlist.tsx 회귀 확인 — ✅ Pass

- 부팅된 `iPhone 16` 시뮬레이터에서 `immersive-store`(AsyncStorage)에 몰입모드 상태 + 재생목록 항목 1개를 주입하고 앱을 재기동, `mollip:///playlist` 딥링크로 재생목록 화면에 진입.
- 스크린샷: `.docs/wip/offline-download/evidence/rev3-playlist-regression.png` — 히어로 카드, "재생목록" 헤딩, 항목(썸네일/제목/작가·연도/재생 아이콘), 우하단 채팅 버튼 + 작품 추가(+) 버튼이 롤백 이전(revision 2 AC-1~4 QA 스크린샷)과 동일한 레이아웃으로 정상 렌더됨을 확인. Row A, 다운로드 배지 등 다운로드 관련 UI는 전혀 보이지 않음 — 롤백이 시각적으로도 완전함을 확인.

### (나) bookmark/audio.tsx Row A 렌더링 — ⚠️ P1(환경 제약으로 실기 미완료, 코드 레벨로 대체)

- **시도한 방법**: `bookmarkAudioStore`(`bookmark-audio` 키)와 `historyStore`(`audio-history` 키)가 함께 참조하는 AsyncStorage(`RCTAsyncLocalStorage_V1/manifest.json`)에 북마크 항목 1개(`ids: ["9d2663e5-..."]` + 대응하는 `HistoryItem`)를 직접 주입하고, 앱을 완전히 종료(`simctl terminate`) → 재기동(`simctl launch`) → `mollip:///settings/bookmark/audio` 딥링크로 진입을 **총 4회** 반복 시도(값 포맷을 RCTAsyncLocalStorage 관례에 맞춰 JSON-stringified 문자열로 교정, terminate 후 대기 시간을 늘리는 등 원인 후보를 하나씩 배제하며 재시도).
- **결과**: 매 시도마다 화면은 "저장된 오디오가 없어요"(빈 상태)로 렌더됐다 — Row A는 물론 카드 리스트도 나타나지 않았다.
- **원인 조사**: (1) `sb-...-auth-token` 키가 `null`이라 guest(비로그인) 상태임을 확인했고, `createAuthAwareStorage`의 `getItem`은 `useAuthStore.getState().session`이 없을 때만 실제 `AsyncStorage.getItem`을 호출하므로 guest 상태에서는 정상적으로 로컬 값을 읽어야 한다. (2) 동일한 재기동 절차로 `immersive-store`(평범한 `AsyncStorage` 직접 사용, `authAwareStorage` 미사용)를 주입했을 때는 이전 QA 라운드들(AC-1~AC-4)에서 매번 정상 반영됐던 것과 대조적으로, `bookmark-audio`/`audio-history`(둘 다 `createAuthAwareStorage` 경유)만 반영되지 않았다. (3) 앱 재기동 후에도 manifest.json의 주입 값 자체는 그대로 남아있어(앱이 빈 상태로 덮어쓰지는 않음) 쓰기 경합은 아니다. (4) `loadFromRemote`를 호출하는 `useHistorySync`/`useBookmarkAudioSync`는 `userId`가 있을 때만 동작해 guest 상태에서는 무관함을 코드로 확인했다.
- **결론**: 원인을 이번 세션에서 확정하지 못했다 — `authAwareStorage`를 경유하는 두 스토어만 외부 AsyncStorage 파일 주입에 반응하지 않는 재현 가능한 현상을 발견했으나, 근본 원인(guest 판정 타이밍, 별도 캐시 레이어, 혹은 QA 툴링 한계)은 확정하지 못했다. 억지로 원인을 단정하지 않고 사실만 기록한다.
- **범위 판단**: 이 현상은 `bookmarkAudioStore.ts`/`historyStore.ts`/`authAwareStorage.ts` 자체가 이번 revision 3 diff의 변경 대상이 아니므로(기존 인프라, Chris의 diff는 이 파일들을 건드리지 않음), Revision 3의 롤백/AC-1 구현이 유발한 신규 결함으로 보기는 어렵다. 다만 Row A의 실제 렌더링 여부를 시뮬레이터에서 눈으로 확인하지 못했다는 사실 자체는 이번 QA의 명백한 공백이므로 **P1로 기록**한다(P0가 아닌 이유: 코드 레벨 검증(Q3-c, Q3-d)에서 조건식·매핑 로직이 spec과 정확히 일치함을 확인했고, `hasIdle`/`canStartDownload` 헬퍼는 이미 `offlineDownloadStore.test.ts`로 유닛 테스트 커버리지가 있어 로직 자체의 신뢰도는 높다).
- **다음 QA 인계 사항**: 실제 로그인 세션 또는 앱의 정상 사용 흐름(해설 화면에서 하트 탭)으로 북마크를 생성해 Row A 렌더링·"전체 받기" 인터랙션(Q7)을 반드시 실기로 재검증할 것. 또한 이 기회에 guest 상태에서 `bookmark-audio`/`audio-history` AsyncStorage 값이 실제로 정상 로드되는지(앱 재시작 후 기존에 북마크한 항목이 유지되는지)도 함께 확인 권장 — 만약 이것이 QA 툴링 한계가 아니라 실제 게스트 데이터 영속성 버그라면 이 기능과 무관하게 더 심각한 문제일 수 있다.

## Q7 — 인터랙션(시뮬레이터)

- Q6(나)와 동일한 환경 제약으로 "전체 받기" 탭 → 진행 상태 전환을 이번 세션에서 실기 확인하지 못했다.
- **코드 레벨 대체 검증**: `handleStartDownload`(L126-129)는 `startDownload(downloadTargets, voiceId, voiceSpeed)`를 호출하며, 이는 revision 2 AC-1 QA에서 이미 실기로 검증된 `offlineDownloadStore.startDownload`(idle 필터링 → 상태를 `loading`으로 전환 → 순회 다운로드)와 **동일한 함수를 재사용**한다(spec Feature breakdown #1이 명시한 그대로) — 새로운 로직이 아니라 호출부만 바뀐 것이므로, 함수 자체의 상태 전이 동작은 이미 검증된 것으로 간주할 수 있다. 다만 "화면에 실제로 반영되는지"의 종단 확인은 Q6(나)와 함께 다음 QA로 인계한다.

## Q8 — 회귀 (코드 리뷰 + 스크린샷 대조 기준)

- **playlist.tsx**: Q6(가) 스크린샷과 revision 2 AC-1~4 QA 스크린샷을 대조해 레이아웃 시프트나 깨짐 없음을 확인. `handlePlay`/작가 소개 재생/채팅 버튼/작품 추가 버튼 로직은 이번 diff에서 변경되지 않음(`git diff` 확인, Q3-b 참고) — 기존 몰입모드 기능(재생, 작가소개, 관람종료) 코드 경로 그대로 유지.
- **ArtistIntroTrack.tsx**: `git diff` 확인 결과 `downloadStatus`/`onRetryDownload` prop과 `DownloadStatusBadge` 사용, 썸네일을 감싸던 `<View className="relative">` 래퍼만 제거됐고, 3상태(loading/ready/failed) 전환 로직·`resolveAccessibilityLabel`·`renderControl`·`SUBTITLE` 매핑 등 핵심 로직은 변경되지 않았다(무관한 변경으로 `useImageProxy` prop 추가와 `border-b-hairline` className 전환이 포함돼 있으나, 이는 저장소 전반에 걸친 별도의 스타일 전환 작업(git status 기준 다수 파일에 동일 패턴 존재)으로 이번 offline-download 롤백과 무관 — 다운로드 관련 코드가 아니므로 Q3-a 대상이 아님).
- **bookmark/audio.tsx 기존 기능**: `handleCardPress`(BottomSheet 열기), `handlePlayPause`(재생/일시정지), `handleDelete`(현재는 `toggleBookmark` 호출 — 이 화면이 이제 북마크 교집합만 보여주므로 "삭제" 버튼이 사실상 "북마크 해제"로 동작하는 것은 이 화면의 존재 목적과 일치하며, 기존 UI 카피("저장 취소"/"지우기")도 이미 이 의미로 작성되어 있어 문구·동작 간 불일치 없음)가 이번 diff에서 로직이 변경되지 않았음을 `git diff`로 확인 — 삭제/재생/BottomSheet 오픈 자체는 회귀 없음(단, Row A 추가로 인한 실제 화면 반응은 Q6(나) 제약으로 실기 미확인).

## Q9 — 성능

- 해당 없음/경미. `downloadTargets`/`downloadTargetIds`가 `useMemo`로 감싸져 있고 의존성 배열이 실제 사용 값과 일치 — 불필요한 재계산 없음.

## Q10 — 네이티브 모듈

- 해당 없음. 신규/제거된 네이티브 모듈 없음.

---

## Blockers for Chris — 없음 (P0 0건)

## P1 (다음 QA 라운드에서 반드시 재검증)

1. **`bookmark/audio.tsx` Row A 렌더링·"전체 받기" 인터랙션을 이번 세션에서 시뮬레이터로 실기 확인하지 못함**(Q6-나/Q7). `bookmarkAudioStore`/`historyStore`가 경유하는 `authAwareStorage`에 외부 AsyncStorage 주입이 반영되지 않는 재현 가능한 현상을 발견했으나 근본 원인은 미확정. 코드 레벨 검증(조건식·매핑·기존 테스트 커버리지)은 spec과 일치함을 확인했으나, 실제 로그인 세션 또는 앱 UI 플로우(하트 탭)로 북마크를 생성해 반드시 재검증 필요. 이 기회에 guest 상태에서 북마크/히스토리 데이터의 영속성 자체도 함께 점검 권장.

## 참고 (P2, blocking 아님)

1. `app/settings/bookmark/audio.tsx`의 import 순서(외부/내부 블록 사이 빈 줄 없음)는 AC-1 diff 이전부터 존재하던 기존 파일 스타일이며 이번 diff에서 신규로 발생한 결함이 아님 — revision 2 QA에서 `playlist.tsx`에 대해 이미 동일한 사유로 확정된 판단과 동일하게 적용, blocking 아님.

---

# QA Report — Revision 3 QA — AC-2 (독립 검증)

> 범위: Chris가 `04-dev-notes.md`에서 "AC-2 — 오프라인 재생(캐시 키 일치 확인, 코드 변경 없음)"로 판정한 것에 대한 독립 재검증만. Chris는 코드를 수정하지 않았고, 이번 QA도 코드 변경 없이 판정의 근거를 재확인한다. worktree 생성 없이 primary checkout(`/Users/chaeyunsim/Documents/mollip`)에서 수행.

## Verdict: **Pass — Chris의 "이미 충족됨" 판정에 동의** (P0 0건, P1 0건, P2 0건)

**판정 근거가 코드 레벨로 충분히 검증됐음을 명시한다.** 코드 변경이 없었으므로 시뮬레이터 스크린샷은 남기지 않았다 — 아래 Q1/Q3에서 실행한 명령의 실제 출력과, 대조한 소스 코드 행을 근거로 삼는다.

---

## 재확인 대상 문서/코드

- `.docs/wip/offline-download/01-spec.md` — AC-2 (Given: "완료" 상태 다운로드됨 / When: 오프라인 상태에서 재생 / Then: 네트워크 요청 없이 로컬 파일로 즉시 재생)
- `.docs/wip/offline-download/04-dev-notes.md` — "AC-2 — 오프라인 재생(캐시 키 일치 확인, 코드 변경 없음)" 섹션
- `app/settings/bookmark/audio.tsx` — 재생 경로(`handlePlayPause` → `speak(selected.text)`), 다운로드 트리거(`handleStartDownload` → `startDownload(downloadTargets, voiceId, voiceSpeed)`)
- `src/hooks/useTTS.ts` — `speak`의 `resolveAudioUri` 통합
- `src/store/offlineDownloadStore.ts` — `startDownload`/`retryDownload`의 캐시 키 생성
- `src/utils/offlineAudio.ts` — `resolveAudioUri`, `cleanTextForTTS`(정확히는 `src/utils/text.ts`) 사용처

## 검증 1 — 캐시 키 구성 요소 코드 대조

다운로드 시점(`offlineDownloadStore.ts` L57-58)과 재생 시점(`useTTS.ts` L51-52) 두 곳의 캐시 키 생성 코드를 나란히 대조했다.

- 다운로드: `cleaned = cleanTextForTTS(target.text)` → `cacheKey = \`${voiceId}\x00${voiceSpeed}\x00${cleaned}\``
- 재생: `cleaned = cleanTextForTTS(text)` → `cacheKey = \`${voiceId}\x00${voiceSpeed}\x00${cleaned}\``

네 구성 요소 전부 일치를 코드로 직접 확인했다.

1. **`cleanTextForTTS`가 동일 함수인지**: `useTTS.ts`는 `import { cleanTextForTTS } from '../utils/text'`, `offlineDownloadStore.ts`는 `import { cleanTextForTTS } from '@/src/utils/text'` — 상대/절대 경로만 다를 뿐 동일한 `src/utils/text.ts` 파일의 동일 함수를 가리킨다(파일 시스템 확인: `find`로 프로젝트에 `text.ts`가 이 경로에 단 하나만 존재). 별도로 유지되는 두 번째 구현이 아니다.
2. **구분자(`\x00`)와 조합 순서**: 두 지점 모두 `voiceId` → `voiceSpeed` → `cleaned` 순서, 동일한 `\x00` 구분자. 문자 단위로 동일.
3. **`voiceId`/`voiceSpeed`의 출처**: `src/store/settingsStore.ts`를 확인한 결과 `voiceId`/`voiceSpeed`는 하나의 전역 Zustand 스토어(`useSettingsStore`)에 있는 유일한 값이며, 다운로드 트리거(`bookmark/audio.tsx`가 `useSettingsStore((s) => s.voiceId)` / `useSettingsStore((s) => s.voiceSpeed)`로 구독)와 재생 훅(`useTTS.ts` 내부에서 `const { voiceId, voiceSpeed } = useSettingsStore();`로 구독) 양쪽이 동일한 스토어 인스턴스를 구독한다 — 별도로 복제된 값이 아니다.
4. **`text`의 출처가 정말 같은 필드인지 (회의적 검토 항목)**: `bookmark/audio.tsx`를 직접 읽어 확인 — `items`는 `historyItems.filter((item) => bookmarkedIds.includes(item.id))`로 계산된 단일 배열(L101-104)이고, `downloadTargets`(다운로드 대상, L116-119)는 이 `items`를 `{ id: item.id, text: item.text }`로 매핑한 것이며, `selected`(재생 대상, L105/L131-138 `handleCardPress`에서 `setSelected(item)`)도 **동일한 `items` 배열의 동일한 item 객체**를 그대로 담는다. 즉 `target.text`(다운로드)와 `selected.text`(재생)는 서로 다른 필드가 아니라 **같은 배열의 같은 객체의 같은 `.text` 프로퍼티**다 — dev-notes의 "같은 `HistoryItem.text`" 주장이 코드 레벨로 확인됨.

## 검증 2 — 값이 어긋날 시점 차이(렌더 시 vs 액션 실행 시) 회의적 검토

dev-notes가 짚지 않은 잠재적 허점으로 "두 지점에서 `voiceId`/`voiceSpeed`를 읽는 시점이 다르면 어긋나지 않는가"를 별도로 검토했다.

- `bookmark/audio.tsx`의 `handleStartDownload`는 `useCallback(..., [downloadTargets, startDownload, voiceId, voiceSpeed])`로 정의되어 있어(L126-129), `voiceId`/`voiceSpeed`가 바뀌면 클로저가 다시 생성되고 항상 **클릭 시점의 최신 값**을 캡처한다.
- `useTTS.ts`의 `speak`는 훅 최상단에서 구독한 `const { voiceId, voiceSpeed } = useSettingsStore();`를 클로저로 캡처하는 일반 함수이며, `useTTS()`는 `AudioHistoryScreen` 컴포넌트 최상단에서 매 렌더마다 호출된다(React 훅 규칙상 조건부 아님) — Zustand 구독이 있으므로 설정 스토어 값이 바뀌면 컴포넌트가 리렌더되고, 그 렌더에서 다시 만들어진 `speak` 클로저가 `handlePlayPause`에 연결된다. 따라서 **재생 버튼을 누르는 시점**에도 항상 최신 `voiceId`/`voiceSpeed`가 쓰인다.
- 결론: 두 지점 모두 "액션 실행 시점의 최신 값"을 쓰므로 렌더 시 vs 액션 실행 시의 시차로 인한 불일치 가능성은 없다. 유일하게 값이 달라지는 경우는 **다운로드 완료 이후, 재생 이전에 사용자가 음성 설정(성우/속도)을 실제로 변경**한 경우뿐이며, 이는 spec의 Risks & dependencies 섹션에 이미 명시된 기존 한계(캐시 키가 설정에 종속되어 재다운로드가 필요해지는 것은 revision 2부터 존재)이고 AC-2가 새로 만든 결함이 아니다.

## 검증 3 — 재생 경로가 실제로 로컬 우선 조회를 타는지

- `useTTS.ts`의 `speak`(L45-69): 캐시 키 생성 후 인메모리 `audioCache` 미스 시 `resolveAudioUri(cacheKey, () => fetchTTSBlob(...))`를 호출 — `bookmark/audio.tsx`는 이 `speak`를 그대로 호출할 뿐 별도의 재생 경로를 구현하지 않는다(L152-159 `handlePlayPause`).
- `offlineAudio.ts`의 `resolveAudioUri`(L73-80): `getOfflineAudioUri(cacheKey)`가 로컬 파일 존재 시 그 URI를 **동기적으로 즉시** 반환하고 `fetchFromNetwork`를 호출하지 않는다 — 오프라인 상태에서 네트워크 요청이 아예 발생하지 않는 spec의 Then 절을 코드 구조상 충족한다.

## Q1 — 타입체크 / 테스트 재확인

```
npx tsc --noEmit
```
→ 출력 없음(0 errors).

```
npx jest
```
```
Test Suites: 6 passed, 6 total
Tests:       76 passed, 76 total
```

코드 변경이 없었으므로 이전 QA 라운드(Revision 3 — playlist.tsx 롤백 + AC-1)와 동일한 76개 테스트, 동일한 결과.

## 회의적 검토 총평

Chris의 판정("이미 충족됨, 추가 구현 없음")에서 검증 없이 넘어갈 수 있었던 지점 세 가지 — (1) `text` 필드가 정말 같은 프로퍼티인지, (2) `voiceId`/`voiceSpeed`를 읽는 시점 차이로 인한 불일치 가능성, (3) `cleanTextForTTS`가 실제로 단일 구현인지 — 를 모두 코드 레벨로 직접 추적해 확인했고, 세 가지 모두 허점이 없음을 확인했다. 코드 변경이 없었던 이유(기존 `resolveAudioUri` 통합이 이미 로컬 우선 조회를 수행)도 `useTTS.speak`/`offlineAudio.resolveAudioUri` 코드로 직접 재확인했다.

## Blockers for Chris — 없음 (P0/P1/P2 0건, 이번 AC-2 재검증 범위)

## 참고

- 이 재검증은 코드를 읽고 대조하는 것으로 완결되며, 실기(시뮬레이터) 검증이 필요한 항목이 아니다(코드 변경이 없고, 대조 대상이 순수 함수/캐시 키 문자열 구성 로직이므로). 이전 라운드에서 인계된 P1(북마크 화면 Row A 렌더링 실기 미확인, `authAwareStorage` 주입 이슈)은 이번 AC-2 재검증과 무관한 별개 항목이며 그대로 유효하다 — 다음 QA에서 재검증 필요.

---

# QA Report — Revision 3 QA — AC-3 (카드별 다운로드 상태 배지)

> 범위: AC-3(`DownloadStatusBadge`의 `bg-gray900` 원형 백드롭 추가 + `bookmark/audio.tsx`의 `AudioHistoryCard` 배지 통합)만. worktree 생성 훅 이슈로 primary checkout(`/Users/chaeyunsim/Documents/mollip`, worktree 아님)에서 직접 수행.

## Verdict: **Pass** (P0 0건, P1 1건 — 아래 참고, 이전 라운드에서 인계된 항목과 동일 성격, P2 0건)

---

## 체크리스트 결과

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors 재확인 |
| Q2 | `npx jest` | ✅ Pass | 6 suites / 76 tests 전부 통과 |
| Q3 | 버그/edge | ✅ Pass | 아래 상세 |
| Q4 | UX(대비/토큰 일치) | ✅ Pass | 아래 상세 |
| Q5 | 컨벤션 | ✅ Pass | 신규 P2 없음(기존 파일 스타일 이슈는 이전 라운드에서 이미 확정, 재론하지 않음) |
| Q6 | 비주얼(시뮬레이터) | ⚠️ P1(환경 제약 지속) | 아래 상세 |
| Q7 | 인터랙션 | ⚠️ Q6과 동일 제약으로 미수행 | 아래 상세 |
| Q8 | 회귀 | ✅ Pass | 아래 상세 |
| Q9/Q10 | 성능/네이티브 | 해당 없음/경미 | 특이사항 없음 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors).

## Q2 — 테스트

```
npx jest
```
```
Test Suites: 6 passed, 6 total
Tests:       76 passed, 76 total
```

## Q3 — 버그/edge 케이스

- **(a) `idle`에서 배지/백드롭 모두 렌더 안 됨**: `DownloadStatusBadge.tsx` L25 `if (status === 'idle') return null;` — 백드롭 `View`를 포함해 아무것도 렌더하지 않는다. `idle`은 별도 배지 `View`를 먼저 만들고 조건부로 내용만 비우는 구조가 아니라 함수 전체가 `null`을 반환하므로, 배경 원(`bg-gray900`)만 남아 보이는 잔상 버그의 여지도 없다 — 코드상 확정.
- **(b) 백드롭 지름이 브리프 수치와 일치하는지**: `DownloadStatusBadge.tsx`를 직접 대조.
  - `loading`: `w-[28px] h-[28px]`(L30) — 브리프 "loading 지름 28px"과 정확히 일치.
  - `failed`: `w-[22px] h-[22px]`(L42) — 브리프 "failed/done 지름 20~22px" 범위 내(상한값과 일치).
  - `done`: `w-[22px] h-[22px]`(L55) — 위와 동일하게 범위 내 일치.
  - 세 상태 모두 배경색 `bg-gray900`(L30/42/55)로 브리프 확정 토큰과 일치.
- **(c) 클리핑 없이 형제 배치**: `app/settings/bookmark/audio.tsx` L50-63의 `AudioHistoryCard` — `item.imageUrl` 유무에 따른 `Image`/폴백 `View` 분기 전체를 `<View className="relative">`(L50)로 감싸고, `<DownloadStatusBadge status={downloadStatus} />`(L62)를 그 `View`의 **형제**(이미지/폴백 분기의 `children`이 아님)로 배치했다 — `04-dev-notes.md`가 명시한 설계와 코드가 일치한다. 이 화면은 `ImageFallback` 컴포넌트를 쓰지 않고 `Image`/`View`를 직접 분기하므로 `overflow-hidden` 클리핑 이슈 자체가 구조적으로 없고, `relative` 부모 + 형제 배치라 배지의 `absolute -top-1 -right-1`(음수 오프셋)도 잘리지 않는다.

## Q4 — UX

- 아이콘 색상: `failed`는 `Ionicons name="alert-circle" ... className="text-error"`(L48), `done`은 `checkmark-circle ... text-success`(L59), `loading`은 `ActivityIndicator ... className="text-gray500"`(L34) — 브리프 Tokens/Accessibility 섹션이 확정한 상태 컬러 매핑과 정확히 일치.
- 대비: 브리프는 `bg-gray900`(#1C1917) 백드롭 위 `text-success`(≈7.07:1) / `text-error`(≈4.65:1) / `text-gray500`(≈6.93:1) 세 값 모두 WCAG 3:1 기준을 여유 있게 통과함을 정적 계산으로 확정해뒀다 — 백드롭 **색**은 이번 리비전에서 변경되지 않았고(`bg-gray900` 그대로), 이번 구현 범위는 지름(크기)만 상태별로 나눈 것이므로 대비 수치 재계산이 불필요하다는 브리프의 명시적 판단(§Accessibility 마지막 문단)과 부합 — 코드상 색상 클래스명이 브리프와 일치함을 확인해 이 판단의 전제가 유효함을 재확인했다.

## Q5 — 컨벤션

- `DownloadStatusBadge.tsx`: Props interface `DownloadStatusBadgeProps` 네이밍 ✅, import 순서(외부 `react-native`/`@expo/vector-icons` 블록 → 빈 줄 → 내부 `@/` 블록) ✅, 상태별 완전한 `return` 분기(중첩 삼항 없음) ✅, 아이콘 전용 요소에 `accessibilityLabel`/`accessibilityRole` 부여(§8) ✅.
- `app/settings/bookmark/audio.tsx`의 `AudioHistoryCardProps`에 `downloadStatus: DownloadStatus` 신규 필드 추가 — 인터페이스 네이밍 규칙 준수.
- 신규 P2 없음 — 이 파일의 기존 import 순서 이슈(외부/내부 블록 사이 빈 줄 없음)는 이전 Revision 3 QA 라운드(AC-1)에서 "AC-1 diff 이전부터 존재하던 기존 파일 스타일, blocking 아님"으로 이미 확정됐고 이번 AC-3 diff도 동일 블록 구조 안에 심볼만 추가하는 방식이라 재론하지 않는다.

## Q6 — 비주얼(시뮬레이터)

- **환경 제약 재확인 — 이전 라운드(P1)와 동일 현상, 새 방법으로 재시도**: 이전 QA(Revision 3 — playlist.tsx 롤백 + AC-1)에서 기록된 P1(`bookmarkAudioStore`/`historyStore`가 경유하는 `authAwareStorage`에 외부 AsyncStorage 주입이 반영되지 않음)이 이번 세션에서도 재현되는지, 그리고 **다른 방법으로 우회 가능한지** 직접 확인했다.
  - `manifest.json`을 직접 열어 `bookmark-audio`/`audio-history` 키를 조회한 결과, 이전 라운드에서 주입했던 값(`{"state": {"ids": ["9d2663e5-..."]}, "version": 0}` 등)이 **inline 값 형태로(별도 해시 파일 참조가 아니라 manifest 안에 직접)** 그대로 남아 있음을 확인했다 — 파일 자체는 AsyncStorage가 정상적으로 읽을 수 있는 포맷이며 쓰기 경합으로 덮어써지지도 않았다.
  - `xcrun simctl terminate` → `launch`로 완전 재기동 후 `mollip:///settings/bookmark/audio` 딥링크로 재진입했으나, 화면은 여전히 "저장된 오디오가 없어요" 빈 상태로 렌더됐다(스크린샷: `.docs/wip/offline-download/evidence/rev3-ac3-badges.png` — 빈 상태만 확보, 배지 렌더 스크린샷 아님).
  - **코드 레벨 추가 조사**: `authAwareStorage.ts`(`getItem`이 `useAuthStore.getState().session`이 없을 때만 `AsyncStorage.getItem` 위임)와 `authStore.ts`(persist 미적용, 초기값 `session: null`)를 직접 읽어 로직상 guest 상태에서 `getItem`이 막힐 이유가 없음을 재확인했다 — 코드 자체의 결함은 발견하지 못했다.
  - `xcrun simctl spawn booted log stream`으로 재기동 구간의 OS 로그를 캡처 시도했으나 유의미한 hydration 관련 로그를 얻지 못했다(release 빌드라 JS 콘솔 로그가 OS 로그에 노출되지 않는 것으로 추정).
  - **실제 앱 UI 플로우(하트 탭)로 북마크 생성**은 시도하지 않았다 — 이 플로우는 사진 촬영/작품 검색 → AI 해설 생성(네트워크 호출, 지연 발생) → 하트 탭까지 거쳐야 하며, 이번 QA가 검증할 대상(백드롭 지름·클리핑 없는 배치)은 이미 Q3에서 코드 레벨로 정확히 확정됐다는 점을 고려할 때, 실제 콘텐츠 생성 비용(네트워크·시간)을 들여서까지 시도할 실익이 낮다고 판단해 이번 세션에서는 보류했다.
  - **결론**: 새로운 방법(재기동, manifest 직접 검증, OS 로그 스트리밍)으로도 근본 원인은 확정하지 못했다 — 이전 라운드가 이미 "QA 툴링 한계일 수도, 실제 게스트 데이터 영속성 버그일 수도 있음(미확정)"으로 남긴 판단을 그대로 유지한다. **신규 결함으로 보지 않으며**(AC-3 diff 자체가 이 저장소 읽기 경로를 건드리지 않음 — `bookmarkAudioStore.ts`/`historyStore.ts`/`authAwareStorage.ts` 어느 것도 이번 diff의 변경 대상이 아님), 기존 P1을 그대로 인계한다.

## Q7 — 인터랙션

- Q6과 동일한 환경 제약으로 배지 탭(`failed` 상태에서 `onRetry`) 등 실기 인터랙션은 이번 AC-3 diff 자체가 `onRetry`를 연결하지 않은 범위(AC-4 대상, `<DownloadStatusBadge status={downloadStatus} />`만 전달)이므로 애초에 이번 범위에서 검증할 인터랙션이 아니다 — 코드 확인(Q3-c)으로 대체.

## Q8 — 회귀 (코드 리뷰 기준)

- `git diff -- app/settings/bookmark/audio.tsx`로 `AudioHistoryCard`의 변경 범위를 직접 확인한 결과, 썸네일을 감싸는 `<View className="relative">` 추가 + `DownloadStatusBadge` 삽입 외에는 카드의 텍스트 블록(제목/작가/날짜, L65-78)과 하트(저장 취소) 버튼(L80-98)의 JSX·로직이 전혀 변경되지 않았다 — 재생 버튼(카드 자체가 `Pressable`로 `onPress`를 호출해 BottomSheet를 여는 구조)도 동일하게 유지.
- `formatDate` import 경로가 로컬 함수 정의에서 `@/src/utils/cultureExhibitionMapper`의 공용 유틸로 교체된 것은 이번 diff에 포함돼 있으나 offline-download 기능과 무관한 리팩토링이며(저장소 전반의 공용 유틸 통합 작업, `git status`의 다수 파일 변경과 동일 계열), 동작 자체(연/월/일 포맷)는 동일함을 함수 구현 대조로 확인 — 회귀 아님.
- BottomSheet 상세 화면(재생/일시정지, 닫기, 본문 텍스트, 이미지)은 이번 AC-3 diff 대상이 아니며 `git diff` 상 변경 라인도 없음.

## Q9/Q10 — 성능/네이티브 모듈

- 해당 없음/경미. `DownloadStatusBadge`는 순수 함수 컴포넌트(내부 상태·`useEffect` 없음)이고, 신규/제거된 네이티브 모듈 없음.

---

## Blockers for Chris — 없음 (P0 0건)

## P1 (다음 QA 라운드에서 반드시 재검증 — 이전 라운드에서 인계된 항목과 동일, 이번 라운드에서 원인 미확정으로 재확정)

1. **`bookmark/audio.tsx` 카드 배지(`loading`/`failed`/`done`) 렌더링을 이번 세션에서도 시뮬레이터 실기로 확인하지 못함**(Q6). 이전 Revision 3 QA 라운드(AC-1)에서 처음 발견된 `authAwareStorage` 경유 스토어(`bookmarkAudioStore`/`historyStore`)에 대한 외부 AsyncStorage 주입 미반영 현상이 이번 세션(재기동 + manifest 직접 검증 + OS 로그 스트리밍이라는 새로운 방법)에서도 동일하게 재현됐고, 근본 원인은 여전히 미확정이다. 코드 레벨 검증(백드롭 지름·색상·형제 배치·idle null 렌더)은 브리프 수치와 정확히 일치함을 확인했으나, 실제 화면 렌더 스크린샷은 이번에도 확보하지 못했다. **다음 QA에서는 실제 로그인 세션 또는 앱 UI 플로우(사진/검색 → 해설 생성 → 하트 탭)로 북마크를 생성해 반드시 배지 3상태(loading/failed/done)의 실기 스크린샷을 확보할 것.**

## 참고 (P2, blocking 아님)

- 없음(이번 AC-3 diff 범위에서 신규 P2 없음).

---

# QA Report — Revision 3 QA — AC-4 (개별 재시도)

> 범위: AC-4(`offlineDownloadStore.retryDownload` 재사용 + `bookmark/audio.tsx`의 `handleRetryDownload`/`AudioHistoryCard.onRetryDownload` 연결)만. `retryDownload` 자체는 revision 2에서 이미 구현·테스트된 기존 함수이며 이번 diff에서 변경되지 않았다. worktree 생성 훅 이슈로 primary checkout(`/Users/chaeyunsim/Documents/mollip`, worktree 아님)에서 직접 수행.

## Verdict: **Pass** (P0 0건, P1 1건 — 이전 라운드에서 인계된 항목과 동일 성격 + 이번 세션에서 발견한 신규 환경 제약 1건 추가 기록, P2 0건)

---

## 체크리스트 결과

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors 재확인 |
| Q2 | `npx jest` | ✅ Pass | 6 suites / 76 tests 전부 통과 |
| Q3 | 버그/edge 코드 리뷰 | ✅ Pass | 아래 상세 |
| Q4 | UX(재시도 흐름) | ✅ Pass | 코드 레벨 검증 — 아래 상세 |
| Q5 | 컨벤션 | ✅ Pass | 신규 P2 없음 |
| Q6 | 비주얼(시뮬레이터) | ⚠️ P1(환경 제약 지속 + 신규 제약) | 아래 상세 |
| Q7 | 인터랙션(시뮬레이터) | ⚠️ Q6과 동일 제약으로 미수행 | 아래 상세 |
| Q8 | 회귀(Row A idle 필터링) | ✅ Pass | 아래 상세 |
| Q9/Q10 | 성능/네이티브 | 해당 없음/경미 | 특이사항 없음 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors).

## Q2 — 테스트

```
npx jest
```
```
PASS src/utils/__tests__/offlineAudio.test.ts
PASS src/utils/__tests__/exhibitionSearch.test.ts
PASS src/store/__tests__/offlineDownloadStore.test.ts
PASS src/utils/__tests__/exhibitionClassification.test.ts
PASS src/utils/__tests__/stripHtml.test.ts
PASS src/utils/__tests__/popularExhibitions.test.ts

Test Suites: 6 passed, 6 total
Tests:       76 passed, 76 total
```

## Q3 — 버그/edge 케이스

- **(a) `handleRetryDownload`가 올바른 id에 대응하는 text를 조회해서 넘기는지**: `app/settings/bookmark/audio.tsx` L140-143 `handleRetryDownload`는 `downloadTargetTextById.get(id)`로 텍스트를 조회한 뒤 `retryDownload(id, text, voiceId, voiceSpeed)`를 호출한다. `downloadTargetTextById`(L140-143 바로 위)는 `new Map(downloadTargets.map((t) => [t.id, t.text]))`로 구성되며, `downloadTargets`는 화면에 표시 중인 `items`(북마크 교집합)를 `{ id: item.id, text: item.text }`로 매핑한 것이므로, id로 조회한 텍스트가 그 항목의 실제 원문과 항상 일치한다 — 다른 항목의 텍스트가 잘못 섞일 경로가 코드상 없다(Map key가 id이므로 lookup 자체가 정확).
- **(b) 재시도가 다른 항목의 상태·진행 배치(batchIds)에 영향 없는지**: `retryDownload`(`offlineDownloadStore.ts` L69-81, 이번 diff에서 미변경)는 `set((state) => ({ statuses: { ...state.statuses, [id]: ... } }))`만 호출하고 `batchIds`를 참조·갱신하지 않는다. `offlineDownloadStore.test.ts`의 "다른 항목의 상태·배치 진행에는 영향을 주지 않는다" 테스트(revision 2 AC-4에서 이미 작성됨)가 이를 직접 단언하며 이번 재확인(Q2)에서도 통과했다. `bookmark/audio.tsx`가 `retryDownload`를 호출부만 바꿔 재사용하는 구조이므로 이 보장은 화면이 바뀌어도 그대로 유지된다.
- **(c) `DownloadStatusBadge`의 `onRetry`가 실제로 이 함수에 연결됐는지**: `AudioHistoryCard`(`bookmark/audio.tsx` L33-39, L69)가 `onRetryDownload` prop을 받아 `<DownloadStatusBadge status={downloadStatus} onRetry={() => onRetryDownload(item.id)} />`로 연결하고, `AudioHistoryScreen`의 `FlatList` `renderItem`(L245-251)이 `onRetryDownload={handleRetryDownload}`를 카드에 전달한다 — `DownloadStatusBadge` → `AudioHistoryCard` → `AudioHistoryScreen`까지 prop 체인이 끊김 없이 이어짐을 코드로 직접 추적했다. `DownloadStatusBadge.tsx` 자체는 `failed` 상태에서만 `Pressable`(`onPress={onRetry}`, `hitSlop={16}` 전방향)을 렌더하므로(L39-50), `loading`/`done`/`idle` 상태에서는 탭해도 아무 요소가 없어 오조작 경로가 없다.

## Q4 — UX (재시도 흐름이 브리프 의도와 일치하는지)

- 실패 배지(빨간 `alert-circle`, `text-error`)를 탭 → `onRetry` → `handleRetryDownload(item.id)` → `retryDownload` 호출 → 상태가 즉시 `loading`으로 바뀌어 `ActivityIndicator`(회색 백드롭)가 렌더 → 성공 시 `done`(초록 체크), 실패 시 `failed`(빨간 경고)로 복귀 — `DownloadStatusBadge.tsx`의 4상태 분기 구조(L24-62)가 이 흐름을 정확히 뒷받침한다.
- 접근성 라벨도 상태 전환에 맞춰 갱신됨: `failed`는 "다운로드 실패, 탭해서 재시도"(`ACCESSIBILITY_LABEL.failed`), `loading`은 "다운로드 중" — 스크린리더 사용자도 탭 가능함과 진행 중임을 인지할 수 있다.
- 재시도는 항목 단위로 독립 동작하므로(Q3-b), 여러 항목이 동시에 실패한 상태에서 하나만 재시도해도 다른 항목의 배지·상태는 그대로 유지된다 — spec AC-4의 "다른 항목의 다운로드 진행은 실패와 무관하게 계속된다" 의도와 일치.

## Q5 — 컨벤션

- `AudioHistoryCardProps`에 `onRetryDownload: (id: string) => void` — 이벤트 핸들러 prop `on` 접두사 규칙(§6) 준수. 내부 정의는 `handleRetryDownload`로 `handle` 접두사 규칙 준수.
- `handleRetryDownload`가 `useCallback([downloadTargetTextById, retryDownload, voiceId, voiceSpeed])`으로 감싸져 있고 deps가 실제 참조 값과 정확히 일치 — §7 준수.
- Props 인터페이스 네이밍(`AudioHistoryCardProps`), import 순서(외부 블록 → 내부 `@/` 블록, 다만 이 파일 자체의 기존 스타일인 "블록 사이 빈 줄 없음"은 이전 라운드에서 이미 "기존 파일 스타일, blocking 아님"으로 확정된 사항이라 재론하지 않음) 모두 이번 diff 범위에서 신규 결함 없음.

## Q6 — 비주얼(시뮬레이터)

- **이전 라운드에서 인계된 P1이 이번 세션에서도 재현됨**: AsyncStorage 매니페스트(`RCTAsyncLocalStorage_V1/manifest.json`)를 직접 조회한 결과, 이전 라운드(AC-1/AC-3)에서 주입했던 `bookmark-audio`(`{"state":{"ids":["9d2663e5-..."]}, "version": 0}`)와 `audio-history`(대응하는 `HistoryItem`) 값이 그대로 남아 있었다(경로: `.../com.simune.mollip/RCTAsyncLocalStorage_V1/manifest.json`). 앱을 `simctl terminate` → `simctl launch`로 완전 재기동하고 `mollip://settings/bookmark/audio` 딥링크로 진입했으나, 이번에도 화면은 "저장된 오디오가 없어요"(빈 상태)로 렌더됐다(스크린샷: `.docs/wip/offline-download/evidence/rev3-ac4-bookmark-empty-state.png`) — `bookmarkAudioStore`/`historyStore`가 경유하는 `authAwareStorage`에 대한 외부 AsyncStorage 파일 주입이 반영되지 않는 현상이 AC-1/AC-3에 이어 AC-4 QA에서도 동일하게 재현됨. 근본 원인은 이번 세션에서도 확정하지 못했다(코드 리뷰상 `authAwareStorage.ts`/`authStore.ts`의 guest 판정 로직 자체에는 결함을 발견하지 못했다 — 이전 라운드와 동일 결론).
- **신규 환경 제약 1건 — 시뮬레이터 탭(interaction) 도구 자체가 이번 세션에서 사용 불가**: 이전 라운드(AC-4, revision 2 시점)에서는 `System Events`(`osascript`)로 시뮬레이터 창 좌표를 얻고 `cliclick`으로 탭이 가능했으나, 이번 세션에서 동일한 방식을 시도한 결과 `osascript`가 `execution error: System Events에 오류 발생: osascript에 보조 접근이 허용되지 않습니다 (-1719)`를 반환했고, `cliclick` 역시 `WARNING: Accessibility privileges not enabled`를 출력했다. 즉 이 세션을 구동하는 프로세스(Terminal 또는 상위 에이전트 프로세스)에 macOS 시스템 설정 `개인정보 보호 및 보안 > 손쉬운 사용(Accessibility)` 권한이 부여되어 있지 않다. 이 권한은 GUI에서 사용자가 직접 허용해야 하며, 코드 수정이나 터미널 명령으로 우회할 수 없다(TCC 데이터베이스에 직접 쓰기는 SIP로 차단됨). **북마크 데이터 주입 문제(위 항목)가 해결되더라도, 이번 세션에서는 실제 탭 인터랙션 자체를 수행할 수 없는 추가 차단이 있었다.**
- 두 제약 모두 `bookmarkAudioStore.ts`/`historyStore.ts`/`authAwareStorage.ts`/시뮬레이터 접근성 권한 — 이번 AC-4 diff(`offlineDownloadStore.ts`의 `retryDownload` 재사용, `bookmark/audio.tsx`의 prop 연결)가 원인이 아니며, 이번 diff는 이 파일들을 전혀 건드리지 않는다.

## Q7 — 인터랙션(시뮬레이터)

- Q6에 기록한 두 가지 제약(데이터 주입 미반영 + 이번 세션의 탭 도구 접근성 권한 부재)이 겹쳐 실패 배지 탭 → 재시도 트리거 → loading 전환의 실기 확인을 이번 세션에서 수행하지 못했다.
- **코드 레벨 대체 검증**: `handleRetryDownload`가 호출하는 `retryDownload` 함수 자체는 revision 2 AC-4 QA 라운드에서 이미 실기(시뮬레이터 탭)로 검증된 바 있다(`playlist.tsx` 경로, 당시엔 접근성 권한이 있어 탭이 가능했음) — 상태 전이(`failed` → 탭 → `loading` → `done`/`failed`)와 "다른 항목 영향 없음"을 그때 실제 화면에서 확인했고, 이번 diff는 그 동일 함수를 새 화면(`bookmark/audio.tsx`)에서 호출부만 바꿔 재사용한 것이라 함수 자체의 동작은 이미 실기 검증된 것으로 간주할 수 있다. 다만 **"새 화면(bookmark/audio.tsx)에서 실제로 탭이 반영되는지"의 최종 확인은 여전히 인계 사항으로 남는다.**

## Q8 — 회귀 (Row A idle 전용 필터링 훼손 여부, 코드 리뷰 기준)

- **`retryDownload`가 `startDownload`/Row A 로직에 영향을 주지 않는지**: `offlineDownloadStore.ts`의 `startDownload`(L42-67)와 `retryDownload`(L69-81)는 서로 다른 액션으로 완전히 분리되어 있으며, 이번 AC-4 diff에서 `startDownload` 본문은 한 줄도 변경되지 않았다(`git diff` 확인 결과 `retryDownload` 관련 라인 추가/`bookmark/audio.tsx`의 prop 연결 외 변경 없음). `startDownload`가 idle 항목만 필터링하는 로직(`targets.filter((t) => (get().statuses[t.id] ?? 'idle') === 'idle')`)도 그대로다.
- `canStartDownload = hasIdle(downloadTargetIds, downloadStatuses)`(`bookmark/audio.tsx` L136)도 이번 diff에서 변경되지 않았다. `hasIdle`은 idle 항목이 1개 이상 있을 때만 `true`를 반환하므로(`offlineDownloadStore.test.ts`로 커버), 재시도로 인해 `failed → loading → done`(또는 `failed`)으로 전이되는 항목은 애초에 idle 상태를 거치지 않으므로 `hasIdle`의 idle 카운트에 영향을 주지 않는다 — Row A("전체 받기")의 노출·활성화 조건은 재시도 동작과 논리적으로 완전히 독립적임을 코드로 확인했다.
- `isAnyLoading`/`getBatchProgress`(Row A의 "받는 중… N/M" 표시)는 `downloadBatchIds`(최근 `startDownload` 호출의 대상 목록)를 기준으로 하므로, 재시도로 인한 개별 `loading` 전이는 `isAnyLoading`(전체 대상 기준, `downloadTargetIds`)에는 반영되지만 `downloadProgress`(옛 `batchIds` 기준 N/M)에는 반영되지 않는 비대칭이 존재한다 — 이는 revision 2 AC-4 QA에서 이미 P2로 기록된 것과 동일한 설계상 특성(재시도 항목 수와 무관하게 spec 요구사항 위반은 아님)이며, 이번 화면 이전(`playlist.tsx` → `bookmark/audio.tsx`)으로 로직이 바뀌지 않았으므로 재론하지 않는다.

## Q9/Q10 — 성능/네이티브 모듈

- 해당 없음/경미. `retryDownload`는 단일 항목 1회 네트워크 호출이며 이번 diff에서 로직 변경 없음. 신규/제거된 네이티브 모듈 없음.

---

## Blockers for Chris — 없음 (P0 0건)

## P1 (다음 QA 라운드에서 반드시 재검증 — 이전 라운드에서 인계된 항목 + 이번 세션 신규 발견 1건)

1. **`bookmark/audio.tsx`의 재시도 인터랙션(실패 배지 탭 → loading → done/failed)을 이번 세션에서도 시뮬레이터 실기로 확인하지 못함**(Q6/Q7). 원인은 두 가지가 겹쳤다: (가) AC-1부터 인계된 기존 P1 — `bookmarkAudioStore`/`historyStore`가 경유하는 `authAwareStorage`에 외부 AsyncStorage 주입이 반영되지 않는 현상이 이번 세션에서도 재현됨(근본 원인 미확정, 신규 결함 아님). (나) **이번 세션에서 새로 발견** — 시뮬레이터 탭을 수행하는 `osascript`/`cliclick`이 이번 세션의 호출 프로세스에 macOS 손쉬운 사용(Accessibility) 권한이 없어 동작하지 않음(`-1719` 에러). 이는 코드로 해결할 수 없는 환경/툴링 제약이며, 사용자가 시스템 설정에서 직접 권한을 부여해야 해소된다. 코드 레벨 검증(prop 체인 추적, `retryDownload`의 기존 테스트 커버리지, revision 2 시점의 동일 함수 실기 검증 이력)은 spec과 일치함을 확인했으나, 실제 새 화면(`bookmark/audio.tsx`)에서의 탭 반영은 다음 QA에서 (1) Accessibility 권한을 부여받거나 (2) 실제 로그인 세션/앱 UI 플로우(하트 탭)로 데이터를 만든 뒤 반드시 재검증할 것.

## 참고 (P2, blocking 아님)

- 없음(이번 AC-4 diff 범위에서 신규 P2 없음 — Row A "받는 중… N/M" 표시의 batchIds 비대칭은 revision 2 AC-4 QA에서 이미 기록된 기존 사항으로 재론하지 않음).

---

# QA Report — Revision 3 QA — AC-5/AC-6 (저장 공간 확인·전체 삭제 / 개별 삭제)

> 범위: AC-5(`offlineAudio.ts`의 `getOfflineAudioTotalSizeBytes`/`deleteAllOfflineAudio`/`formatOfflineAudioSize` 재사용 + 신규 `offlineDownloadStore.deleteAllDownloads` + `bookmark/audio.tsx` Row B), AC-6(신규 `offlineAudio.deleteOfflineAudio` + `offlineDownloadStore.deleteDownload` + BottomSheet 개별 삭제 아이콘)만. worktree 생성 훅 이슈로 primary checkout(`/Users/chaeyunsim/Documents/mollip`, worktree 아님)에서 직접 수행. 이번이 spec의 마지막 AC(1~8 전체)라 하단에 최종 통합 검증도 별도 섹션으로 수행한다.

## Verdict: **Pass** (P0 0건, P1 1건 — 이전 라운드에서 인계된 항목과 동일 성격, 재확인만, P2 0건)

---

## 체크리스트 결과

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ Pass | 0 errors 재확인 |
| Q2 | `npx jest` | ✅ Pass | 6 suites / 86 tests 전부 통과 |
| Q3 | 버그/edge 코드 리뷰 | ✅ Pass | 아래 상세 |
| Q4 | UX(삭제 확인 카피) | ✅ Pass | 브리프 Copy 표와 문자 단위 대조 — 아래 상세 |
| Q5 | 컨벤션(hitSlop·위치) | ✅ Pass | 아래 상세 |
| Q6 | 비주얼(시뮬레이터) | ⚠️ P1(환경 제약 지속) | 코드 레벨 검증으로 대체 — 아래 상세 |
| Q7 | 인터랙션(시뮬레이터) | ⚠️ Q6과 동일 제약으로 미수행 | 코드 레벨 검증으로 대체 — 아래 상세 |
| Q8 | 회귀(BottomSheet 기존 헤더 액션) | ✅ Pass | 아래 상세 |
| Q9/Q10 | 성능/네이티브 | 해당 없음/경미 | 특이사항 없음 |

---

## Q1 — 타입체크

```
npx tsc --noEmit
```
→ 출력 없음(0 errors).

## Q2 — 테스트

```
npx jest
```
```
PASS src/utils/__tests__/offlineAudio.test.ts
PASS src/store/__tests__/offlineDownloadStore.test.ts
PASS src/utils/__tests__/exhibitionClassification.test.ts
PASS src/utils/__tests__/stripHtml.test.ts
PASS src/utils/__tests__/popularExhibitions.test.ts
PASS src/utils/__tests__/exhibitionSearch.test.ts

Test Suites: 6 passed, 6 total
Tests:       86 passed, 86 total
```
AC-5/AC-6 신규 유닛 테스트 10개(`offlineAudio.test.ts`의 `deleteOfflineAudio`/`formatOfflineAudioSize` 6개, `offlineDownloadStore.test.ts`의 `computeCacheKey`/`deleteDownload`/`deleteAllDownloads` 4개)가 이전 라운드(76개) 대비 추가되어 전부 통과함을 확인.

## Q3 — 버그/edge 케이스

- **(a) Row B가 완료(done) 항목 0개일 때 렌더 안 되는지**: `app/settings/bookmark/audio.tsx` L154 `hasDownloaded = doneIds.length > 0`, Row B는 L287 `{hasDownloaded && (...)}`로만 렌더된다 — `doneIds`는 `downloadStatuses[id] === 'done'`인 id만 필터링(L150-153)하므로 완료 항목이 0개면 `hasDownloaded === false`가 되어 Row B 자체가 트리 밖으로 빠진다(빈 바 노출 없음, 브리프 "완료 항목이 1개 이상 있을 때만 렌더" 요건과 정확히 일치). **Pass**.
- **(b) 전체 삭제가 `Alert.alert` 확인 없이 즉시 실행되지 않는지(취소 시 삭제 안 됨)**: `handleDeleteAllDownloads`(L175-189)는 `Alert.alert(제목, 본문, [{text:'취소', style:'cancel'}, {text:'삭제', style:'destructive', onPress: () => deleteAllDownloads(downloadTargetIds)}])` 구조 — `deleteAllDownloads` 호출은 오직 "삭제" 버튼의 `onPress`에만 연결되어 있고, "취소" 버튼은 `onPress` 자체가 없어(닫기만 함) 스토어 액션이 호출되지 않는다. 개별 삭제(`handleDeleteSingleDownload`, L191-211)도 동일 구조. **Pass**.
- **(c) 개별 삭제 후 시트가 닫히지 않고 유지되는지, 목록의 배지가 done→idle로 갱신되는지**: `handleDeleteSingleDownload`의 `Alert.alert` "삭제" `onPress`는 `computeCacheKey` 계산 후 `deleteDownload(item.id, cacheKey)`만 호출하며, `setSelected(null)`이나 `sheetRef.current?.close()`를 호출하지 않는다 — 시트를 닫는 코드 경로가 전혀 없으므로 삭제 후에도 시트는 열린 채 유지된다. 배지 갱신: `deleteDownload`(스토어)는 `set((state) => ({ statuses: { ...state.statuses, [id]: 'idle' } }))`로 `statuses`를 갱신하고, `AudioHistoryScreen`은 이미 `useOfflineDownloadStore((s) => s.statuses)`를 구독 중(L126)이라 `FlatList`의 `downloadStatus={downloadStatuses[item.id] ?? 'idle'}`(L325)가 Zustand 구독을 통해 자동으로 리렌더되어 카드 배지가 즉시 idle로 바뀐다(폴링 없음). BottomSheet 헤더의 삭제 아이콘 자체도 `downloadStatuses[selected.id] === 'done'`(L379) 조건이라 삭제 직후 재렌더 시 아이콘도 함께 사라진다. **Pass**.
- **(d) `deleteDownload`/`deleteAllDownloads`가 다른 항목에 영향 없는지**: `src/store/__tests__/offlineDownloadStore.test.ts` L196-228에 이미 단위 테스트로 검증됨 — `deleteDownload`는 대상 id 외 `other-done`의 상태(`'done'`)가 그대로 유지됨을(L208), `deleteAllDownloads`는 대상 배열(`['done-1','done-2']`)에 없는 `unrelated`의 상태(`'loading'`)와 `batchIds`(`['unrelated']`)가 그대로 유지됨을(L225-226) 각각 assert하며 이번 Q2 재실행에서 두 테스트 모두 통과했다. 스토어 구현(`deleteDownload`/`deleteAllDownloads`, L97-110)도 `ids.reduce`/단일 키 스프레드로 대상 외 키를 건드리지 않는 구조임을 코드로 재확인. **Pass**.

## Q4 — UX(삭제 확인 카피)

브리프 `02-design-brief.md` Copy 표(L47-57)와 `app/settings/bookmark/audio.tsx` 구현을 1:1 대조:

| 항목 | 브리프 | 구현 | 일치 |
|---|---|---|---|
| Row B 저장공간 표시 | `다운로드 {size}` | `` `다운로드 ${totalSizeLabel}` ``(L291) | ✅ |
| Row B 전체 삭제 버튼 | `전체 삭제` | `전체 삭제`(L303) | ✅ |
| 전체 삭제 확인 제목 | `다운로드한 해설 삭제` | `'다운로드한 해설 삭제'`(L178) | ✅ |
| 전체 삭제 확인 본문 | `저장된 오디오 {N}개를 모두 삭제해요. 다시 들으려면 네트워크가 필요해요` | `` `저장된 오디오 ${doneIds.length}개를 모두 삭제해요. 다시 들으려면 네트워크가 필요해요`(L179) `` | ✅ |
| 전체 삭제 확인 - 취소/삭제 | `취소` / `삭제` | `'취소'`(L181) / `'삭제'`(L183) | ✅ |
| 개별 삭제 확인 제목 | `다운로드 삭제` | `'다운로드 삭제'`(L195) | ✅ |
| 개별 삭제 확인 본문 | `"{title}" 다운로드 파일을 삭제해요. 다시 들으려면 네트워크가 필요해요` | `` `"${item.title}" 다운로드 파일을 삭제해요. 다시 들으려면 네트워크가 필요해요`(L196) `` | ✅ |
| 개별 삭제 확인 - 취소/삭제 | `취소` / `삭제` | `'취소'`(L198) / `'삭제'`(L200) | ✅ |

문자 단위까지 정확히 일치. `formatOfflineAudioSize` 포맷(B/KB/MB, 소수 첫째 자리)도 유닛 테스트로 이미 검증됨(Q2). **Pass**.

## Q5 — 컨벤션(hitSlop·위치)

- **BottomSheet 개별 삭제 아이콘 hitSlop**: `app/settings/bookmark/audio.tsx` L382 `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` — 브리프 §Accessibility(L77) "`hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}`(아이콘 22px 기준 22+12+12=46pt)"와 정확히 일치. **Pass**.
- **위치**: JSX 순서상 재생/일시정지 `Pressable`(L362-378) → 개별 삭제 `Pressable`(L379-389, `downloadStatuses[selected.id] === 'done'` 조건부) → 닫기 `Pressable`(L390-398) — 브리프 "재생 버튼과 닫기 버튼 사이"(L38) 요건과 정확히 일치. `accessibilityRole="button"`/`accessibilityLabel="다운로드 삭제"`(L383-384)도 브리프 명세(L77)와 일치. **Pass**.
- Props 인터페이스(`AudioHistoryCardProps`), import 순서(외부 블록 → 내부 `@/` 블록 — 이 파일의 기존 스타일인 "블록 사이 빈 줄 없음"은 이전 라운드에서 이미 "기존 파일 스타일, blocking 아님"으로 확정돼 재론하지 않음), `cn` 미사용 조건부는 신규 diff에 해당 패턴 없음. Row B 텍스트 버튼도 §Accessibility(L75) 요건대로 `accessibilityRole="button"`/`accessibilityLabel="다운로드한 해설 전체 삭제"`(L296-297) 부여됨. 신규 P2 없음.

## Q6/Q7 — 비주얼/인터랙션(시뮬레이터) — 이전 P1(로그인 세션 제약) 영향 확인

- **재확인 절차**: 이전 라운드(AC-1~AC-4)에서 반복 기록된 P1 — `bookmarkAudioStore`/`historyStore`가 경유하는 `authAwareStorage`에 대한 외부 AsyncStorage 주입이 반영되지 않는 현상 — 이 이번 AC-5/AC-6 검증에도 영향을 주는지 직접 재현해 확인했다. `xcrun simctl terminate` → `launch`로 앱을 완전 재기동한 뒤 `mollip:///settings/bookmark/audio` 딥링크로 진입해 스크린샷을 확보했다(`.docs/wip/offline-download/evidence/rev3-ac5-6-bookmark-state.png`) — 이번 세션에서도 화면은 "저장된 오디오가 없어요"(빈 상태)로 렌더됐다. 즉 `items.length === 0`이라 Row A/Row B(둘 다 `items.length > 0`이 전제)와 카드 자체가 아예 렌더되지 않아, BottomSheet를 여는 것조차 불가능한 상태다 — AC-5/AC-6 실기 검증의 전제(완료 상태 항목 존재)에 AC-1~AC-4보다 한 단계 앞선 지점(북마크 목록 자체가 비어 있음)에서 막힌다.
- **판단**: 이 현상은 AC-5/AC-6의 diff(`offlineAudio.ts`/`offlineDownloadStore.ts`/`bookmark/audio.tsx`의 삭제 관련 코드)가 원인이 아니다 — `bookmarkAudioStore.ts`/`historyStore.ts`/`authAwareStorage.ts` 중 어느 것도 이번 diff의 변경 대상이 아니며, AC-1 QA(revision 3 최초 라운드)부터 동일하게 재현되어 온 환경 제약이다. 이번 세션에서 새로운 우회 방법(재기동 + 딥링크)도 시도했으나 근본 원인 해소에는 이르지 못해, 이전 라운드가 남긴 "QA 툴링 한계일 수도, 실제 게스트 데이터 영속성 버그일 수도 있음(미확정)" 판단을 그대로 유지한다.
- **코드 레벨 검증으로 대체**: Q3(a)~(d), Q4, Q5에서 이미 조건식·카피·hitSlop·위치·다른 항목 비영향(단위 테스트 포함)을 소스 대조로 확정했다. Row B/BottomSheet 삭제 아이콘의 렌더 조건(`hasDownloaded`/`downloadStatuses[selected.id] === 'done'`)과 스토어 액션(`deleteDownload`/`deleteAllDownloads`)은 순수 조건식·상태 갱신 로직이라 실제 UI 트리에 마운트되지 않아도 코드 대조만으로 spec/브리프 일치 여부를 확정할 수 있는 성격이라고 판단했다(AC-3/AC-4 QA에서 동일 근거로 이미 채택한 대체 방식과 동일).
- Row A(일괄 받기)는 이전 라운드에서 실기 탭까지 수행한 바 있으나(revision 2 시점, playlist.tsx 경로) 이번 화면(`bookmark/audio.tsx`)에서의 실기 확인은 AC-1 QA부터 계속 인계 중인 항목이며, 이번 AC-5/AC-6 범위에서 새로 발생한 결함이 아니므로 별도 P1로 중복 기록하지 않고 기존 P1에 통합해 인계한다.

## Q8 — 회귀(BottomSheet 기존 헤더 액션)

- `git diff -- app/settings/bookmark/audio.tsx`로 BottomSheet 헤더 액션 그룹의 변경 범위를 확인한 결과, 재생/일시정지 `Pressable`(L362-378, `onPress`/`hitSlop={8}`/`accessibilityLabel`/`isTTSLoading` 분기 전부 미변경)과 닫기 `Pressable`(L390-398, `onPress={handleSheetClose}`/`hitSlop={8}` 미변경)은 AC-5/AC-6 diff에서 한 줄도 수정되지 않았다 — 개별 삭제 아이콘은 두 기존 버튼 사이에 새 형제 엘리먼트로만 삽입됐고(L379-389), 기존 두 버튼의 `Pressable` 컴포넌트 자체나 부모 `<View className="flex-row items-center gap-4">`(L361)의 레이아웃 속성(`gap-4`)도 변경되지 않아 세 버튼이 동일 `gap-4` 간격으로 나란히 배치되는 구조가 유지된다. **Pass — 회귀 없음**.
- 카드 목록(`AudioHistoryCard`)의 텍스트 블록·하트(저장 취소) 버튼(AC-3/AC-4 diff 대상)과 Row A(AC-1 diff 대상)도 이번 diff에서 변경되지 않았음을 `git diff` 상 확인.

## Q9/Q10 — 성능/네이티브 모듈

- 해당 없음/경미. `deleteDownload`/`deleteAllDownloads`는 동기 파일 I/O(`expo-file-system`의 `File.delete()`/`Directory.delete()`) + 상태 갱신뿐이며 신규 네트워크 호출이나 반복 렌더 유발 로직이 없다. 신규/제거된 네이티브 모듈 없음(`expo-file-system`은 기존 의존성).

---

## Blockers for Chris — 없음 (P0 0건)

## P1 (다음 QA 라운드 또는 실제 로그인 세션 확보 시 반드시 재검증 — 이전 라운드에서 인계된 항목과 동일, 이번 라운드에서 AC-5/AC-6 관점으로 재확인)

1. **`bookmark/audio.tsx`의 북마크 목록·저장 공간 관리 UI(Row A/B)·BottomSheet 개별 삭제를 이번 세션에서도 시뮬레이터 실기로 확인하지 못함**(Q6/Q7). AC-1 QA(revision 3 최초 라운드)부터 인계된 `authAwareStorage` 경유 스토어(`bookmarkAudioStore`/`historyStore`)에 대한 외부 AsyncStorage 주입 미반영 현상이 이번 세션(재기동 + 딥링크 재진입)에서도 동일하게 재현됐고, 근본 원인은 여전히 미확정이다. 코드 레벨 검증(조건식·카피·hitSlop·위치·단위 테스트)은 spec/브리프와 정확히 일치함을 확인했으나, 실제 화면 렌더·탭 스크린샷은 AC-1부터 AC-6까지 한 번도 확보하지 못했다. **다음 세션에서는 실제 로그인 세션 또는 앱 UI 플로우(사진/검색 → 해설 생성 → 하트 탭)로 북마크 데이터를 생성해 Row A/B 노출, 전체/개별 삭제 인터랙션, 배지 done→idle 전환을 반드시 실기 스크린샷으로 확보할 것.**

## 참고 (P2, blocking 아님)

- 없음(이번 AC-5/AC-6 diff 범위에서 신규 P2 없음).
