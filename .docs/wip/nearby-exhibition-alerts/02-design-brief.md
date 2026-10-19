---
feature-slug: nearby-exhibition-alerts
author: sam
status: draft
---

# Design brief

## Design intent

알림 설정의 기존 목록 흐름에 자연스럽게 연결한다. 사용자가 위치를 백그라운드에서도 쓰는 이유와 알림 빈도를 이해한 뒤 직접 켜도록 하며, 권한 거부를 오류처럼 다루지 않는다.

## Tokens (defaults)

- Background: `#FAFAF8`
- Ink: `#2D2D23`
- Muted: `#57534E` / `#A8A29E`
- Brand: Deep Plum `#5F1D3E`
- Font: Pretendard (UI), Hahmlet (display)
- 설정 카드·행은 기존 `CardRow`, `NotificationPreferenceRow` 관례를 유지한다.

## Layout & components

| 영역           | 설명                                                                                                     | 재사용 컴포넌트                 |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 알림 설정 행   | “근처 전시 알림” 토글. 기본 꺼짐                                                                         | `NotificationPreferenceRow`     |
| 설명           | 토글 아래에 “주변 전시 소식을 하루 최대 1회, 주 2회까지 알려드려요. 위치는 이 기기에서만 사용해요.” 표시 | `Text`                          |
| 권한 사전 안내 | 켜기 직후 기능 목적, 백그라운드 위치 권한 및 OS 설정 이동 가능성을 설명하고 계속/취소 제공               | `Alert`                         |
| 권한 상태      | 위치 또는 알림 권한 거부 시 토글은 꺼짐, 설정 이동 안내를 표시                                           | `Alert`, `Linking.openSettings` |
| 시스템 알림    | 지역에 진입했을 때 대표 전시 1개와 주변 전시 개수 전달                                                   | Expo local notification         |

## Design decisions

- 같은 전시는 14일 동안 다시 알리지 않고, 하루 1회 및 최근 7일 2회 상한을 둔다.
- 한 지역에 전시가 여러 개 있어도 알림은 하나만 보낸다. 헤드라인은 대표 전시, 본문은 “주변에 전시 N개가 있어요 · 지도에서 보기”를 쓴다.
- 토글은 명시적 opt-in이며 기존 설정 항목과 동일한 터치 영역 및 접근성 라벨을 사용한다.
- 알림을 누르면 기존 알림 딥링크 흐름으로 지도 탭에서 대표 장소를 포커스한다.
- 다크 화면을 추가하지 않는다. OS 시스템 알림은 플랫폼 표준 모양을 따른다.

## Copy (KO)

| Element            | Text                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Label              | 근처 전시 알림                                                                                                            |
| Description        | 가까운 전시에 들어서면 알려드려요. 하루 최대 1회, 주 2회까지 알림을 보내며 위치 정보는 이 기기에서만 사용해요.            |
| Permission title   | 근처 전시 알림을 켤까요?                                                                                                  |
| Permission body    | 주변 전시에 도착했을 때 알려드리려면 알림과 백그라운드 위치 접근이 필요해요. 위치 이동 경로는 저장하거나 전송하지 않아요. |
| Continue           | 계속하기                                                                                                                  |
| Denied             | 권한이 필요해요. 기기 설정에서 위치와 알림을 허용하면 사용할 수 있어요.                                                   |
| Notification title | {대표 전시 제목}                                                                                                          |
| Notification body  | 주변에 전시 {N}개가 있어요. 지도에서 둘러보세요.                                                                          |

## States

- Loading: 토글 잠금 및 로딩 표시
- Empty: 활성 전시/좌표가 없으면 켜기는 유지하되 지오펜스 0개; 활성화 성공 후 유용한 상태 안내
- Error: 권한/네트워크/지오펜싱 등록 실패 시 토글 원복 및 이유 안내
- Success: 활성 상태 토글 및 간결한 빈도·위치 처리 설명
- Disabled: 위치 또는 알림 권한을 허용하지 않은 경우 토글은 끄고 설정 안내

## Accessibility

- 토글 `accessibilityLabel="근처 전시 알림"`, `accessibilityRole="switch"`
- 권한 안내 버튼은 취소/계속을 명확히 낭독한다.
- 보조 설명은 `gray600` 이상 대비의 본문 크기로 표시한다.
- 터치 가능한 설정 행은 최소 44pt.

## Prototype scope

- [x] Navigation wired (기존 알림 설정 화면 유지)
- [x] Fake data / stub API (설정 행과 권한 안내 상호작용만 먼저 스모크)
- [ ] Static layout only

## Out of design scope

- 위치 지도 미리보기, 반경/빈도 선택 UI, 구독 자동 결제 알림
