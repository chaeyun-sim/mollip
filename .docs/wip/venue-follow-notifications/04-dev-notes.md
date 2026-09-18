---
feature-slug: venue-follow-notifications
author: chris
status: in-progress
---

# Dev notes

## Implemented ACs

| AC   | Status  | Files                                                                                                                                                   |
| ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Done    | `VenueSheet.tsx`, `VenueHeader.tsx`, `VenueFollowButton.tsx`, `useVenueFollowStatus.ts`, `database.types.ts`, `20260917000000_create_venue_follows.sql` |
| AC-2 | Pending | -                                                                                                                                                       |

## Implementation decisions

- 관심 상태 조회는 UI에서 분리한 `useVenueFollowStatus`가 로그인 사용자 ID와 현재 `activeVenue.museumId`를 키로 서버 정본을 읽는다.
- 하위 장소 전환 시 새 키의 조회가 완료되기 전까지 이전 장소의 상태를 재사용하지 않고 즉시 loading 상태를 표시한다. effect cleanup으로 늦은 이전 응답도 무시한다.
- 하트 UI는 별도 `VenueFollowButton`으로 분리하고 44×44pt 실체 타깃, outline/filled/loading/unsupported 상태와 접근성 label/hint/state를 구현했다.
- 서버 상태 조회에 필요한 `venue_follows` 테이블, 복합 PK, FK, 본인 데이터 전용 RLS를 최소 기반으로 추가했다.
- iteration 2 디자인에 맞춰 하트를 장소명 행의 무배경 44pt 액션으로 옮기고, 길찾기·상세 정보를 44pt 동일 폭 버튼으로 재구성했다.
- 기본 헤더에는 오늘 운영 상태와 주소만 남겼다. `HoursSection`의 독립 확장을 제거하고 상세 패널 한 곳에서만 주간 운영시간과 전화·홈페이지·주차·편의시설·note를 표시한다.
- `VenueHeader`를 `activeVenue` 식별자로 remount해 grouped venue 전환 시 상세 패널이 즉시 접힌 기본 상태로 돌아간다.
- G4 grouped visual review 후 제목 행을 content-width/self-start 구조로 조정하고 하트 아이콘을 44pt 타깃의 제목 쪽에 정렬해, 한 줄·두 줄 제목 모두 마지막 글자와 약 6pt 간격으로 붙도록 수정했다.

## Changed files

- `src/components/map/VenueSheet.tsx`
- `src/components/map/venue-sheet/VenueHeader.tsx`
- `src/components/map/venue-sheet/VenueFollowButton.tsx`
- `src/components/map/venue-sheet/HoursSection.tsx`
- `src/components/map/venue-sheet/VenueDetails.tsx`
- `src/hooks/useVenueFollowStatus.ts`
- `src/types/database.types.ts`
- `supabase/migrations/20260917000000_create_venue_follows.sql`
- `.docs/wip/venue-follow-notifications/04-dev-notes.md`

## Deviations from spec/brief

- None.
- AC-2 범위인 등록/해제 mutation과 버튼 press 동작은 의도적으로 구현하지 않았다.

## Blockers for Taylor (QA)

- 서버 관심 상태 실기기 검증 전 신규 migration 적용이 필요하다.
- 현재 환경에서 CoreSimulatorService 연결이 거부되어 G4 시뮬레이터 스모크와 스크린샷 캡처를 실행할 수 없었다.

## Native / env notes

- 네이티브 모듈 변경 없음.
