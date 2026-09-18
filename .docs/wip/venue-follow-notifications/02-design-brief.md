---
feature-slug: venue-follow-notifications
author: sam
status: draft
---

# Design brief

## Design intent

- 지도 바텀시트에서 장소 정보를 읽는 흐름을 방해하지 않으면서, 좋아하는 전시관의 새 전시 소식을 받는 행동을 헤더의 명확한 보조 액션으로 제공한다.
- 하트는 인기 투표나 공개 좋아요가 아니라 **내 관심 장소 + 새 전시 알림 구독**을 뜻한다. 첫 등록 시 목적을 설명하고, 이후에는 outline/filled 상태와 짧은 피드백으로 결과를 즉시 이해시킨다.
- 관심 관계와 OS 알림 권한을 시각적으로 분리한다. 권한이 거부되어도 filled 하트는 유지하며, “관심 등록 실패”처럼 보이지 않게 한다.
- 기존 `VenueHeader`의 큰 Hahmlet 장소명과 조용한 메타 정보는 유지하되, 첫 화면에는 운영 상태·주소와 핵심 액션만 남긴다. 전화·홈페이지·주차·편의시설은 접어 전시 탭이 더 빨리 보이게 한다.
- 하트는 장소명과 한 묶음으로 읽히는 무배경 아이콘 액션이다. 두 줄 제목에서는 마지막 줄 쪽에 정렬해 어느 장소를 관심 등록하는지 연결감을 유지한다.

## Tokens (defaults)

- Sheet background: `gray100` / `#F8F6F2`
- Ink / outline icon: `gray900` / `#1C1917`, 보조 상태는 `gray700` / `#57534E`
- Followed icon: `primary-dark` / `#7C3AED` — 라이트 배경 위 상태 식별에 사용
- Primary action: `primary-dark` / `#7C3AED` + `white` icon (기존 길찾기)
- Secondary action: transparent + `border-gray300`, label/icon `gray900`
- Disabled: `gray400` / `#C7C3BD`
- Error: `error` / `#EF4444`는 안내 아이콘/문구에만 사용하고 하트 상태색으로 사용하지 않는다.
- Font: 장소명 Hahmlet Bold, 안내·액션 피드백 Pretendard Medium/SemiBold
- Radius: 가로 액션 `rounded-xl`(12pt), 상세 정보 패널 `rounded-2xl`; 권한 안내는 기존 네이티브 alert 패턴을 따른다.
- Spacing: 시트 좌우 20pt 유지, 제목–기본 정보 8pt, 기본 정보 행 간 6pt, 기본 정보–액션 12pt, 액션 간 8pt, 액션–다음 콘텐츠 16pt

## Layout & components

| 영역                  | 설명                                                                                                                                                                                                                                                                                                            | 재사용 컴포넌트                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 이름 + 하트           | 헤더 첫 행은 Hahmlet Bold 26/30 장소명과 하트로만 구성한다. 장소명은 `flex-1`, 최대 2줄. 행은 `items-end`로 두어 두 줄 제목이면 하트가 마지막 줄 쪽에 놓인다. 하트 시각 배경은 없고 실제 Pressable은 `44×44pt`; 아이콘은 24pt다. 제목과 터치 영역의 시각 간격은 최소 4pt다.                                     | `VenueHeader`, `Pressable`, `Ionicons`                      |
| 항상 보이는 기본 정보 | 제목 아래 8pt부터 운영 상태와 주소만 2개 행으로 표시한다. 각 행은 13pt Pretendard Medium, 18pt line-height, 아이콘 14pt, 행 간 6pt. 운영 상태는 “운영중 · 10:00–18:00”/“오늘 휴관”처럼 한 줄 우선, 주소는 최대 2줄이다.                                                                                         | `HoursSection`의 요약 표현, 기존 주소 액션                  |
| 핵심 액션 행          | 기본 정보 아래 12pt에 동일 폭의 `길찾기`와 `상세 정보` 버튼을 가로 배치한다(`flex-1`, gap 8pt, 높이 44pt). 길찾기는 `bg-primary-dark` + 흰색 아이콘/라벨, 상세 정보는 투명 배경 + `border-gray300` + `gray900` 아이콘/라벨이다. 거리값이 있으면 길찾기 라벨을 `길찾기 · {거리}`로 표시해 별도 거리 행을 없앤다. | `Pressable`, `Ionicons`                                     |
| 접히는 상세 정보      | 기본값은 접힘. `상세 정보`를 누르면 액션 행 바로 아래 10pt에 톤온톤 패널이 열린다. 주간 운영시간, 전화, 홈페이지, 주차, 편의시설, note 중 값이 있는 항목만 12pt 간격으로 표시한다. 전화·홈페이지는 각각 44pt 이상의 행 전체를 탭할 수 있게 한다. 다시 누르면 접힌다.                                            | 기존 `HoursSection`, `VenueDetails`, 연락처 액션            |
| 관심 장소 버튼        | 배경 없는 `44×44pt` Pressable. 미등록은 `heart-outline` 24pt `gray700`, 등록은 `heart` 24pt `primary-dark`. 색뿐 아니라 아이콘 채움 형태로 상태를 구분한다. 별도 라벨이나 좋아요 수는 표시하지 않는다.                                                                                                          | `Pressable`, `Ionicons`                                     |
| 묶음 장소 칩          | 기존 하위 장소 칩을 선택하면 그 칩의 `museumId`가 하트 대상이 된다. 칩 전환 직후 이전 장소의 filled 상태를 남겨두지 않고, 새 장소 상태 조회 중에는 해당 하트를 busy/disabled 상태로 전환한다. 각 하위 장소는 독립 상태다.                                                                                       | 기존 `VenueSheet` horizontal `ScrollView` / sub-venue chips |
| 목적·권한 안내        | 로그인 사용자의 첫 관심 등록이면서 OS 권한이 미결정이면 시스템 권한 창 전에 네이티브 안내를 띄운다. 제목, 설명, `나중에`, `알림 받기` 두 액션으로 구성한다. `알림 받기` 선택 후에만 OS 권한을 요청한다.                                                                                                         | React Native `Alert` 또는 프로젝트 공통 confirm 패턴        |
| 결과 피드백           | 성공은 하트 상태 변화가 1차 피드백이다. 관심 등록 성공 후 짧은 인앱 피드백 “새 전시가 열리면 알려드릴게요”를 한 번 제공하고, 해제 시 “새 전시 알림을 받지 않아요”를 제공한다. 전용 toast가 없다면 접근 가능한 `Alert`/announce 또는 기존 피드백 패턴을 사용하며 새 임의 컴포넌트를 중복 생성하지 않는다.        | 기존 앱 피드백 패턴                                         |
| 권한 거부 안내        | 관심 등록 성공 뒤 별도 안내로 “관심 장소로 저장했어요. 알림을 받으려면 기기 설정에서 알림을 허용해 주세요.”를 보여준다. `닫기`, `설정 열기`를 제공한다. 하트는 filled 상태로 유지한다.                                                                                                                          | React Native `Alert`, `Linking.openSettings()`              |
| 로그인 안내           | 비로그인 탭은 하트를 로컬에서 filled로 바꾸지 않는다. 로그인 필요 안내 후 로그인 화면으로 이동하며, 로그인 완료 후 같은 지도 장소/바텀시트 맥락으로 돌아온다.                                                                                                                                                   | 기존 auth `returnTo` 흐름                                   |

## Design decisions

- 하트는 이름 바로 오른쪽의 같은 행에 둔다. 원형 배경은 제거하되 Pressable 자체는 `w-11 h-11`을 유지한다. 제목 행 `items-end` 정렬로 한 줄 제목에서는 하단이, 두 줄 제목에서는 마지막 줄이 하트 중심과 가깝게 보이게 한다.
- 길찾기는 단독 원형 아이콘에서 라벨이 있는 가로 버튼으로 바꾼다. 옆의 `상세 정보` 버튼과 동일 폭으로 배치해 정보 탐색 선택지를 명확하게 하고, 거리 텍스트는 길찾기 라벨 안에 흡수한다.
- 접힌 상태에서는 전화·홈페이지·주차·편의시설·note 및 주간 운영시간 표를 렌더하지 않는다. 항상 보이는 것은 오늘의 운영 상태와 주소뿐이다. 펼쳐 보일 상세 데이터가 전혀 없으면 disabled 버튼이나 “상세 정보가 없어요” 피드백을 만들지 않고 상세 정보 버튼을 숨기며, 길찾기를 전체 폭으로 확장한다.
- 하트 자체에 작은 종 배지를 겹치지 않는다. 44pt 안에서 기호가 복잡해지고 “좋아요”와 “알림” 의미가 충돌하므로, 최초 안내 문구와 성공 피드백으로 새 전시 알림 의미를 명시한다.
- 등록 요청 중에는 낙관적으로 filled 처리하지 않는다. 기존 아이콘 자리에 18–20pt `ActivityIndicator`(`gray600`)를 표시하고 버튼을 disabled/busy 처리한다. 성공 시에만 filled, 실패 시 서버 정본 상태로 돌아간다.
- 해제 요청 중에도 동일한 busy 상태를 쓴다. 중복 탭을 막되 헤더 전체나 바텀시트 스크롤·길찾기는 막지 않는다.
- `museumId`가 없는 장소는 이름 행의 44pt 버튼 위치를 유지해 제목 폭과 헤더 레이아웃 점프를 막되 `heart-outline`을 `gray400`으로 표시하고 disabled 처리한다. 탭 이벤트를 받지 않는 플랫폼을 고려해 화면에는 별도 상시 문구를 추가하지 않고, 접근성 힌트로 이유를 제공한다. 필요 시 정보 안내는 “이 장소는 아직 새 전시 알림을 지원하지 않아요”로 통일한다.
- grouped venue에서 칩 전환 시 하트의 의미 대상은 `activeVenue`다. 부모 그룹 전체를 한 번에 등록하지 않는다. 전환 중 이전 filled 아이콘이 새 장소에 귀속된 것처럼 보이지 않도록 즉시 busy 상태로 바꾸고, 조회 완료 후 outline/filled를 표시한다.
- 기존 헤더 제목은 그룹의 장소명 표현을 유지할 수 있으나, 하트의 접근성 라벨과 피드백 문구에는 반드시 현재 선택된 `activeVenue.venueName`을 사용한다. 시각적으로는 선택된 하위 장소 칩이 대상을 명시한다.
- filled 하트를 다시 누르는 것은 즉시 해제로 처리한다. 파괴적 데이터나 결제 동작이 아니므로 확인 모달을 반복 노출하지 않는다.
- 권한 설명 창에서 `나중에`를 누르거나 OS 권한을 거부해도 관심 관계 저장은 계속한다. 이후 하트를 다시 누르면 “권한 재요청”이 아니라 관심 해제이므로, 권한 복구 동선은 거부 안내의 `설정 열기` 및 앱 전역 푸시 설정에서 제공한다.
- 하트 press 상태는 기존 헤더 버튼과 동일하게 opacity 피드백을 적용하며, 성공 시 과한 모션이나 confetti는 사용하지 않는다. Reduce Motion 설정과 무관하게 상태를 이해할 수 있어야 한다.
- `상세 정보` 확장은 바텀시트 높이를 인위적으로 바꾸지 않고 현재 스크롤 안에서 아래 콘텐츠를 민다. 접힘이 기본이며 장소/하위 장소를 바꾸면 다시 접힘으로 초기화한다.
- 축약 헤더의 접힌 상태 목표 높이는 한 줄 제목 기준 약 150–170pt(시트 상단 패딩 포함), 두 줄 제목 기준 약 180–200pt다. 기존 전화·주차·홈페이지·편의시설을 모두 펼쳐 놓은 높이를 사용하지 않아 하위 장소 칩과 전시 탭이 첫 snap에서 더 빨리 보여야 한다.

## Copy (KO)

| Element                         | Text                                                     |
| ------------------------------- | -------------------------------------------------------- |
| First-use title                 | 새 전시 소식을 받아볼까요?                               |
| First-use body                  | 이 전시관에 새 전시가 열리면 알림으로 알려드릴게요.      |
| First-use secondary CTA         | 나중에                                                   |
| First-use primary CTA           | 알림 받기                                                |
| Follow success                  | 새 전시가 열리면 알려드릴게요                            |
| Unfollow success                | 새 전시 알림을 받지 않아요                               |
| Permission denied title         | 관심 장소로 저장했어요                                   |
| Permission denied body          | 알림을 받으려면 기기 설정에서 몰립 알림을 허용해 주세요. |
| Permission denied secondary CTA | 닫기                                                     |
| Permission denied primary CTA   | 설정 열기                                                |
| Login title                     | 로그인이 필요해요                                        |
| Login body                      | 관심 전시관의 새 전시 알림은 로그인 후 받을 수 있어요.   |
| Login secondary CTA             | 취소                                                     |
| Login primary CTA               | 로그인하기                                               |
| Save error title                | 관심 장소를 저장하지 못했어요                            |
| Save error body                 | 네트워크 연결을 확인하고 다시 시도해 주세요.             |
| Error CTA                       | 다시 시도                                                |
| Unsupported venue               | 이 장소는 아직 새 전시 알림을 지원하지 않아요            |
| Directions                      | 길찾기                                                   |
| Directions with distance        | 길찾기 · {거리}                                          |
| Details collapsed               | 상세 정보                                                |
| Details expanded                | 상세 정보 접기                                           |
| Open today                      | 운영중 · {시작 시간}–{종료 시간}                         |
| Closed today                    | 오늘 휴관                                                |

동적 피드백과 접근성 문구의 `{장소명}`은 그룹 부모명이 아니라 현재 `activeVenue.venueName`을 사용한다.

## States

- Loading (initial/hydration): 이름 옆의 배경 없는 44pt 터치 영역 중앙에 18–20pt `ActivityIndicator`를 표시한다. `accessibilityState={{ busy: true, disabled: true }}`. 길찾기·상세 정보·시트 탐색은 계속 가능하다.
- Unfollowed: `heart-outline`, `gray700`, 안내 라벨 “{장소명} 새 전시 알림 받기”, `checked: false`.
- Followed: filled `heart`, `primary-dark`, 안내 라벨 “{장소명} 새 전시 알림 받는 중”, `checked: true`.
- Saving/removing: spinner, 중복 탭 차단. 화면의 이전 상태를 임시 성공으로 표현하지 않는다.
- Permission undetermined: 첫 등록 의도 설명 → 사용자가 동의한 경우 OS 권한 요청 → 관심 저장 결과와 권한 결과를 각각 피드백한다.
- Permission denied / global push off: 관심 상태는 filled로 유지한다. 권한 거부 직후 설정 이동 안내를 제공한다. 전역 푸시 설정이 꺼진 경우 장소별 하트에서 거짓으로 “알림 수신 중”을 보장하지 않도록 성공 문구를 “관심 장소로 저장했어요”로 바꾸고 전역 설정에서 다시 켤 수 있음을 안내한다.
- Error: 서버 정본 outline/filled로 롤백하고 재시도 가능한 오류 안내를 표시한다. 오류 안내가 닫혀도 지도와 바텀시트는 사용 가능하다.
- Disabled/no `museumId`: `heart-outline`, `gray400`, `disabled: true`; 레이아웃은 유지한다.
- Group switch: 칩 선택 상태는 즉시 이동하고, 하트는 새 `activeVenue.museumId` 조회 동안 loading 후 독립 상태를 표시한다. 빠른 연속 칩 전환에서 늦게 끝난 이전 요청이 현재 하트를 덮어쓰지 않는다.
- Success after relaunch/relogin: 서버 hydrate 완료 후 동일 장소의 filled 상태를 복원한다. hydrate 전 outline이 잠깐 깜빡이지 않도록 loading을 사용한다.
- Details collapsed (default): 운영 상태·주소와 2개 액션 다음에 바로 하위 장소 칩 또는 전시 탭이 온다. 상세 버튼 chevron은 아래 방향이다.
- Details expanded: 버튼 라벨은 “상세 정보 접기”, chevron은 위 방향, `accessibilityState.expanded: true`. 패널은 주간 운영시간→전화→홈페이지→주차→편의시설→note 순으로 표시하되 값 없는 행은 생략한다.
- Venue/group switch: 새 `activeVenue`로 바뀌면 상세 영역은 접고, 운영 상태·주소·상세 데이터와 하트 상태를 함께 새 장소 기준으로 갱신한다.

## Accessibility

- 관심 버튼은 시각적 배경이 없어도 실제 Pressable을 최소 `44×44pt`로 만든다. 24pt 아이콘에 `hitSlop`만 의존하지 않는다.
- `accessibilityRole="button"`과 `accessibilityState={{ checked, disabled, busy }}`를 현재 상태에 맞게 제공한다.
- 라벨은 미등록 “{장소명} 새 전시 알림 받기”, 등록 “{장소명} 새 전시 알림 받는 중”처럼 대상과 상태를 함께 읽는다. 단순히 “좋아요”라고 읽지 않는다.
- 힌트는 미등록 “두 번 탭하면 새 전시 알림을 신청합니다”, 등록 “두 번 탭하면 새 전시 알림을 해제합니다”. `museumId` 부재 시 “이 장소는 아직 새 전시 알림을 지원하지 않습니다”를 제공한다.
- 상태 전환 성공·실패 문구는 화면에만 표시하지 말고 스크린 리더에도 announce한다. grouped venue 칩 변경 후 포커스를 강제로 하트로 옮기지는 않는다.
- outline/filled 형태와 `primary-dark`/`gray700` 색을 함께 사용해 색상만으로 상태를 전달하지 않는다. 두 색 모두 `gray100` 시트 배경 위 대비를 확보한다.
- 제목의 텍스트 영역과 하트 44pt 타깃은 겹치지 않아야 한다. 제목을 누르는 동작은 만들지 않는다.
- 길찾기와 상세 정보는 각각 높이 44pt, 라벨이 포함된 독립 버튼이다. 길찾기 `accessibilityLabel`은 거리 포함 여부와 무관하게 “{장소명}까지 길찾기”, 상세 버튼은 `accessibilityState={{ expanded }}`와 “{장소명} 상세 정보 보기/접기”를 제공한다.
- 전화와 홈페이지는 상세 패널에서 아이콘만 누르는 구조가 아니라 전체 44pt 행을 누를 수 있게 하고 각각 `button`/`link` role과 구체적인 라벨을 제공한다.
- 네이티브 권한 창을 띄우기 전에 앱 안내에서 알림 목적을 한국어로 설명하며, 취소 경로를 제공한다.

## Prototype scope

- [x] Static layout: 이름+무배경 하트, 운영 상태·주소, 길찾기/상세 정보 가로 액션, 접힘/펼침 상세 패널
- [x] Interaction wired: 일반 장소 및 grouped venue 칩별 하트 상태 전환, 중복 탭 잠금, 실패 롤백
- [x] Navigation wired: 비로그인 로그인 복귀, 권한 거부 시 시스템 설정 이동
- [x] Fake data / stub API: prototype smoke에서는 최소 일반 장소 1개와 하위 장소 2개(서로 다른 관심 상태)를 사용한다.
- Prototype smoke 필수 시나리오: 한 줄/두 줄 장소명에서 하트 하단 정렬과 44pt 타깃 확인, 상세 정보 접기/펼치기 및 전시 탭 노출 높이 확인, 일반 장소 outline→filled→outline, grouped venue A(filled)↔B(outline) 전환, loading 중 연속 탭 차단, `museumId` 없는 disabled 상태, 권한 설명/거부 안내와 설정 CTA.

## Out of design scope

- 알림 센터/알림 목록 화면, 읽음·안 읽음 배지 및 바텀 내비게이션 알림 탭
- 관심 장소만 모아보는 목록, 공개 좋아요 수, 인기 순위, 커뮤니티 반응
- 장소별 알림 빈도·시간 설정과 새 전시 외 휴관/티켓/마감 알림
- 부모 그룹의 모든 하위 장소를 한 번에 등록하는 UI
- 전시 추천 카드나 푸시 알림 자체의 비주얼 템플릿 변경
- 하트 애니메이션, 햅틱 강도 등 장식적 production polish는 프로토타입 및 Alex 검수 통과 후 결정
