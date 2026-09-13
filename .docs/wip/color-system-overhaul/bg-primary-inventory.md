---
feature-slug: color-system-overhaul
ac: AC-2
author: chris
source-of-truth: 02-design-brief.md §N / §B-1 / §B-1-a / §B-2 / §B-4 (Sam 확정표)
---

# AC-2 — `bg-primary` / `bg-secondary` 전수 분류표

## 측정

- 패턴: `bg-primary|bg-secondary` (`app/`, `src/`, `*.tsx`)
- **총 히트 53건 / 41파일**
- `bg-secondary` 히트: **0건** (02-design-brief §N 마지막 줄과 일치)
- 미분류(빈칸) 행: **0건**

> 이 표는 02-design-brief.md §N 확정표와 §B 판정 트리를 **옮겨 적은 것**이다. Chris는 판단하지 않았다.
> 브리프에 명시되지 않은 히트 2건은 표 아래 "브리프 미수록 히트" 절에 별도 표기하고 판정 트리를 기계적으로 적용했다 — Manager 확인 요청 대상.

## 분류표

| #   | 파일:줄                                                  | 요소                                                      | 분류    | 규칙                                     | AC-14 이후 값                                  | 근거 (brand인 경우)                                           |
| --- | -------------------------------------------------------- | --------------------------------------------------------- | ------- | ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| 1   | `app/settings/description.tsx:94`                        | 선택 체크 배지(아이콘 단독)                               | brand   | B-2                                      | `bg-primary`                                   | 사용자가 고른 항목을 표시하는 선택 표면                       |
| 2   | `app/settings/index.tsx:85`                              | "로그인하기" 배지 (흰 13px)                               | brand   | B-1-a                                    | `bg-primary-dark`                              | 로그인 액션 유도 표면                                         |
| 3   | `app/settings/inquiry.tsx:78`                            | 제출 CTA (흰 라벨)                                        | brand   | B-1                                      | `bg-primary-dark`                              | 화면의 주요 액션                                              |
| 4   | `app/settings/inquiry.tsx:103`                           | 제출 칩 활성 (흰 라벨)                                    | brand   | B-1-a                                    | `bg-primary-dark`                              | 제출 가능 상태를 알리는 액션 표면 (비활성은 D-1 `bg-gray400`) |
| 5   | `app/settings/inquiry.tsx:148`                           | 문의 유형 선택 칩                                         | brand   | B-1-a                                    | `bg-primary-dark`                              | 사용자의 선택 상태 표시                                       |
| 6   | `app/settings/delete-account.tsx:90`                     | 확인 CTA (흰 라벨)                                        | brand   | B-1 (§N-부속)                            | `bg-primary-dark`                              | 화면의 주요 액션                                              |
| 7   | `app/settings/voice.tsx:156`                             | 선택 뱃지(아이콘 단독)                                    | brand   | B-2                                      | `bg-primary`                                   | 선택된 음성 표시                                              |
| 8   | `app/(guide)/description.tsx:398`                        | 다크 화면 원형 액션                                       | brand   | B-4                                      | `bg-primary`                                   | 다크 화면 위 액션 표면                                        |
| 9   | `app/(guide)/chat.tsx:179`                               | `style.backgroundColor` (**기존 버그**: className 문자열) | neutral | §N-부속                                  | `colors.gray900`                               | —                                                             |
| 10  | `app/(guide)/chat.tsx:220`                               | `style.backgroundColor` (**기존 버그**)                   | neutral | §N-부속                                  | `colors.gray900`                               | —                                                             |
| 11  | `app/(guide)/manual.tsx:111`                             | 다크 `TextInput` 배경                                     | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 12  | `app/(guide)/manual.tsx:140`                             | 다크 `TextInput` 배경                                     | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 13  | `app/(guide)/manual.tsx:170`                             | 다크 `TextInput` 배경                                     | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 14  | `app/(guide)/manual.tsx:193`                             | 다크 `TextInput` 배경                                     | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 15  | `app/(guide)/create-description.tsx:263`                 | 다크 입력 표면                                            | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 16  | `app/(guide)/create-description.tsx:285`                 | 다크 카드 표면                                            | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 17  | `app/(guide)/create-description.tsx:381`                 | 다크 카드 표면                                            | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 18  | `app/onboarding/location.tsx:43`                         | 아이콘 원형(텍스트 없음, warm 화면)                       | brand   | B-2 (**브리프 미수록 — 판정 트리 적용**) | `bg-primary`                                   | 위치 권한 화면의 브랜드 심볼. 텍스트 미탑재                   |
| 19  | `app/onboarding/location.tsx:102`                        | "허용하기" fill CTA (흰 16px)                             | brand   | B-1                                      | `bg-primary-dark`                              | 화면의 주요 액션                                              |
| 20  | `app/(explore)/route.tsx:320`                            | 타임라인 점 `bg-primary/25`                               | brand   | B-2 (§N-부속)                            | `bg-primary/25`                                | 텍스트 없는 진행 인디케이터. `/25` 불투명도 유지              |
| 21  | `app/(explore)/route.tsx:362`                            | 선택 상태 칩 (흰 라벨)                                    | brand   | B-1-a                                    | `bg-primary-dark`                              | 사용자의 선택 표시                                            |
| 22  | `app/(explore)/route.tsx:451`                            | 선택 상태 칩 (흰 라벨)                                    | brand   | B-1-a                                    | `bg-primary-dark`                              | 사용자의 선택 표시                                            |
| 23  | `app/(explore)/route.tsx:498`                            | 경로 생성 CTA (흰 라벨)                                   | brand   | B-1                                      | `bg-primary-dark`                              | 화면의 주요 액션 (비활성 `bg-border`는 D-1 `bg-gray400`)      |
| 24  | `src/components/guide/VenueField.tsx:30`                 | 다크 입력 필드                                            | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 25  | `src/components/guide/ChatMessage.tsx:149`               | 사용자 말풍선 (다크)                                      | brand   | B-4 (§N N-3a)                            | `bg-primary`                                   | "내가 보낸 말"을 구분하는 행위 표시                           |
| 26  | `src/components/guide/ChatMessage.tsx:214`               | 하단 입력 시트 배경                                       | neutral | §N N-3b                                  | `bg-gray900`                                   | —                                                             |
| 27  | `app/diary/[date].tsx:221`                               | 바텀시트 배경                                             | neutral | §N N-4                                   | `bg-gray900`                                   | —                                                             |
| 28  | `src/components/guide/ExhibitionTitleField.tsx:45`       | 다크 입력 필드                                            | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 29  | `src/components/guide/ExhibitionTitleField.tsx:101`      | 드롭다운 표면                                             | neutral | §N-부속                                  | `bg-gray900`                                   | —                                                             |
| 30  | `src/components/archive/VisitTicketFooter.tsx:34`        | 티켓 바코드 바                                            | neutral | §N N-6                                   | `bg-gray900`                                   | —                                                             |
| 31  | `src/components/archive/ArchiveDiaryEmpty.tsx:18`        | 빈 상태 CTA (흰 라벨)                                     | brand   | B-1                                      | `bg-primary-dark`                              | 빈 상태의 유일한 액션                                         |
| 32  | `src/components/archive/ArchiveLoginPrompt.tsx:23`       | 로그인 CTA (흰 라벨)                                      | brand   | B-1                                      | `bg-primary-dark`                              | 화면의 주요 액션                                              |
| 33  | `src/components/explore/ExhibitionImmersiveCTA.tsx:36`   | 몰입 시작 CTA (흰 라벨)                                   | brand   | B-1                                      | `bg-primary-dark`                              | 전시 상세의 주요 액션                                         |
| 34  | `src/components/explore/ExhibitionMapPreview.tsx:65`     | 지도 미리보기 원형 아이콘                                 | brand   | B-2                                      | `bg-primary`                                   | 길찾기 진입을 알리는 액션 표면. 텍스트 없음                   |
| 35  | `src/components/explore/ExhibitionVenueInfo.tsx:38`      | `h-0.5 w-full` 구분선                                     | neutral | §N N-8                                   | `bg-gray900`                                   | —                                                             |
| 36  | `src/components/explore/ExhibitionVenueInfo.tsx:76`      | `h-0.5 w-full` 구분선                                     | neutral | §N N-8                                   | `bg-gray900`                                   | —                                                             |
| 37  | `src/components/explore/ExhibitionImmersiveFab.tsx:42`   | 플로팅 액션 (아이콘 단독)                                 | brand   | B-2                                      | `bg-primary`                                   | 액션 가능성을 알리는 플로팅 표면                              |
| 38  | `src/components/explore/RouteSheet.tsx:75`               | 바텀시트 배경                                             | neutral | §N N-1                                   | `bg-gray900`                                   | —                                                             |
| 39  | `src/components/search/ExcludeWordsModal.tsx:98`         | 제외어 pill (흰 13px)                                     | brand   | B-1 (**브리프 미수록 — 판정 트리 적용**) | `bg-primary-dark`                              | 사용자가 추가한 값을 표시하는 선택 표면. 흰 라벨 탑재         |
| 40  | `src/components/search/ExcludeWordsModal.tsx:112`        | "완료" CTA (흰 라벨)                                      | brand   | B-1                                      | `bg-primary-dark`                              | 모달의 주요 액션                                              |
| 41  | `src/components/common/Fab.tsx:19`                       | 플로팅 액션 (아이콘 단독)                                 | brand   | B-2                                      | `bg-primary`                                   | 액션 가능성 표시                                              |
| 42  | `src/components/common/Fab.tsx:29`                       | 플로팅 액션 (아이콘 단독)                                 | brand   | B-2                                      | `bg-primary`                                   | 액션 가능성 표시                                              |
| 43  | `src/components/common/Chip.tsx:39`                      | `active` fill (흰 13px + 체크)                            | brand   | B-1-a                                    | `bg-primary-dark`                              | 전역 칩 선택 상태. 앱 전체 칩이 이 값을 따름                  |
| 44  | `src/components/mypage/PillSelector.tsx:39`              | `selected` (흰 12px)                                      | brand   | B-1-a                                    | `bg-primary-dark border-2 border-primary-dark` | 선택 상태 표시                                                |
| 45  | `src/components/map/RoutePlanningBar.tsx:377`            | 경로 계획 CTA (흰 라벨)                                   | brand   | B-1                                      | `bg-primary-dark`                              | 화면의 주요 액션                                              |
| 46  | `src/components/map/VenueSheet.tsx:301`                  | 원형 액션 (아이콘 단독)                                   | brand   | B-2                                      | `bg-primary`                                   | 액션 가능성 표시                                              |
| 47  | `src/components/map/VenueSheet.tsx:383`                  | 선택 상태 (흰 라벨)                                       | brand   | B-1-a                                    | `bg-primary-dark border-primary-dark`          | 사용자의 선택 표시                                            |
| 48  | `src/components/map/VenueMarker.tsx:44`                  | 지도 장소 마커                                            | neutral | §N N-5                                   | `bg-gray900`                                   | —                                                             |
| 49  | `src/components/onboarding/ArtPreferenceComplete.tsx:32` | 완료 CTA (흰 16px)                                        | brand   | B-1                                      | `bg-primary-dark`                              | 온보딩 종료 주요 액션                                         |
| 50  | `src/components/onboarding/ArtPreferenceDeck.tsx:36`     | 진행 바 채움 구간                                         | brand   | B-2 (§N N-7)                             | `bg-primary`                                   | 진행도는 사용자가 만들어낸 값. 텍스트 미탑재 인디케이터       |
| 51  | `src/components/map/RouteSheet.tsx:277`                  | 경로 하이라이트 바                                        | neutral | §N N-2                                   | `bg-gray900`                                   | —                                                             |
| 52  | `src/components/map/RouteSheet.tsx:349`                  | 모드 칩 active (흰 라벨)                                  | brand   | B-1-a                                    | `bg-primary-dark border-transparent`           | 이동 수단 선택 상태                                           |
| 53  | `src/components/map/RouteSheet.tsx:480`                  | 타임라인 점                                               | brand   | B-2 (§N-부속)                            | `bg-primary`                                   | 텍스트 없는 진행 인디케이터                                   |

## 집계

| 분류     | 건수   |
| -------- | ------ |
| brand    | 33     |
| neutral  | 20     |
| **합계** | **53** |

### brand 세부

| 목적지 토큰                     | 건수 | 행 번호                                                |
| ------------------------------- | ---- | ------------------------------------------------------ |
| `bg-primary-dark` (B-1 / B-1-a) | 20   | 2,3,4,5,6,19,21,22,23,31,32,33,39,40,43,44,45,47,49,52 |
| `bg-primary` (B-2 / B-4)        | 13   | 1,7,8,18,20,25,34,37,41,42,46,50,53                    |

### neutral 세부 (AC-3~11에서 `bg-gray900`으로 선이관)

행 9,10,11,12,13,14,15,16,17,24,26,27,28,29,30,35,36,38,48,51 — 총 20건.
(9,10은 className이 아니라 `style.backgroundColor` 문자열 버그이므로 `colors.gray900` JS 값으로 수정)

## 브리프 미수록 히트 (Manager 확인 요청)

| 파일:줄                                          | 적용한 판정             | 사유                                                                                       |
| ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| `app/onboarding/location.tsx:43`                 | B-2 → `bg-primary`      | 아이콘 원형, 텍스트 미탑재. 02-design-brief §판정 트리의 "NO → B-2" 분기를 기계적으로 적용 |
| `src/components/search/ExcludeWordsModal.tsx:98` | B-1 → `bg-primary-dark` | 흰 13px 라벨 탑재 + 라이트 배경. §판정 트리 "YES → 라이트 → B-1" 분기                      |

두 건 모두 새 판정 기준을 만들지 않고 브리프의 판정 트리를 그대로 적용했다. 다른 결론을 원하면 지시 바람.
