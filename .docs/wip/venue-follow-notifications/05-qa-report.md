---
feature-slug: venue-follow-notifications
author: taylor
status: in-progress
---

# QA report

## AC별 결과

| AC   | 결과                                                | tsc         | 테스트                   | 스크린샷                                      | 인터랙션                                                                                                                   | 회귀                                                  |
| ---- | --------------------------------------------------- | ----------- | ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| AC-1 | **환경 차단 (코드/UI 검증 Pass, 서버 정본 미검증)** | ✅ 0 errors | ✅ 13 suites / 143 tests | ✅ `evidence/ac1-grouped-venue.png` 직접 확인 | ⚠️ 지도 검색 → 묶음 장소 바텀시트 열기 Pass; 하위 장소 탭은 Maestro가 완료 응답 없이 앱이 검은 화면으로 전환되어 증빙 실패 | ✅ 지도 탭 및 기존 길찾기/장소 정보/전시 탭 렌더 정상 |

## AC-1 — 바텀시트에서 관심 장소 상태 확인

### Q1~Q10

| 항목                        | 결과              | 증빙 / 판단                                                                                                                                                                                             |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 `npx tsc --noEmit`       | Pass              | exit 0, 오류 0건                                                                                                                                                                                        |
| Q2 `npm test`               | Pass              | `npm test -- --runInBand`: 13 suites, 143 tests 모두 통과                                                                                                                                               |
| Q3 버그 / edge              | Blocked           | `museumId` 없음, 비로그인, 조회 중 상태는 코드상 각각 disabled/outline/loading으로 분리됨. 원격 `venue_follows` migration 적용 여부를 확인할 수 없어 실제 서버 outline/filled 복원은 검증 불가          |
| Q4 UX                       | Pass              | 44×44pt 하트가 길찾기 왼쪽에 배치되고 outline, tone-on-tone 배경, 버튼 간 8pt 간격이 브리프와 일치. 긴 정보 영역과 충돌 없음                                                                            |
| Q5 component convention     | Pass              | `VenueFollowButton` 분리, `className` 토큰 사용, import/조건부 렌더링 규칙 준수. `git diff --check`의 유일한 trailing whitespace는 unrelated `src/components/explore/ExhibitionInfoRow.tsx:20`          |
| Q6 sim screenshot + inspect | Pass (UI)         | `evidence/ac1-map.png`, `evidence/ac1-grouped-venue.png`를 직접 열어 확인. 예술의전당/서예박물관 묶음 장소 바텀시트에 하트와 길찾기 버튼 정상 렌더                                                      |
| Q7 interaction              | Partial / Blocked | 지도 탭 진입 → 검색 입력 `예술의전당` → `예술의전당 선택` → 바텀시트 열기까지 Maestro Pass. `한가람디자인미술관` 탭은 명령 완료 전 멈추고 이후 캡처가 검은 화면이어서 전환 후 상태를 독립 확인하지 못함 |
| Q8 regression paths         | Pass (관찰 범위)  | 지도 탭, 검색, 장소 바텀시트, 주소/시간/전화/주차/홈페이지/하위 장소 칩/전시 탭이 정상 렌더. 길찾기 버튼도 기존 위치·형태 유지                                                                          |
| Q9 perf (light)             | Pass (정적)       | 상태 조회는 `userId + museumId` 키 변화 때만 실행. 이전 응답은 cleanup flag로 무시하며 전환 순간 이전 장소의 상태를 재사용하지 않음                                                                     |
| Q10 native rebuild          | N/A               | 네이티브 모듈 추가·제거 없음                                                                                                                                                                            |

### 접근성 정적 검증

- 실체 터치 영역: `w-11 h-11` = 44×44pt.
- `accessibilityRole="button"` 제공.
- label은 현재 장소명과 `새 전시 알림 받기`/`받는 중` 상태를 포함.
- `accessibilityState.checked`, `disabled`, `busy` 제공.
- `museumId` 부재 시 disabled와 지원 불가 hint 제공.

### 구조적 blocker

1. 신규 `supabase/migrations/20260917000000_create_venue_follows.sql`의 원격 적용을 이 QA 환경에서 확인할 수 없다. 미적용 환경에서는 조회가 실패하고 UI가 outline으로 귀결되므로, 서버에 저장된 followed 상태의 filled 복원은 검증할 수 없다.
2. iOS 시뮬레이터에서 묶음 장소 칩 탭 자동화가 완료되지 않고 앱 화면이 검게 바뀌었다. 첫 묶음 장소 렌더와 코드상의 키 전환/이전 응답 무시는 확인했지만, 전환 후 독립 상태 UI는 스크린샷으로 증명하지 못했다.

### 재검증 조건

- migration이 적용된 테스트 Supabase에 로그인 사용자별 `(user_id, museum_id)` fixture를 준비한다.
- 같은 예술의전당 그룹의 서로 다른 두 `museumId`에 outline/filled fixture를 각각 두고 칩 전환 시 상태가 서로 바뀌는지 확인한다.
- VoiceOver/접근성 hierarchy에서 각 상태의 label, checked, busy, disabled 및 44×44 bounds를 캡처한다.

## 증빙 파일

- `evidence/ac1-map.png` — 지도 탭 진입 회귀
- `evidence/ac1-grouped-venue.png` — 예술의전당 묶음 장소 바텀시트, 하트 UI
- `evidence/ac1-open-map.yaml` — 지도 탭 진입 자동화
- `evidence/ac1-open-grouped-venue.yaml` — 검색을 통한 묶음 장소 열기 자동화
- `evidence/ac1-switch-subvenue.yaml` — 하위 장소 전환 재현 자동화(환경에서 완료되지 않음)

## G4 iteration 2 UI / AC-1 재검증 — 2026-09-17

### 결론

- **개정 UI: Pass (실제 시뮬레이터 렌더 및 상세 펼침 확인)**
- **연속 interaction: 환경 차단** — Naver map + BottomSheet 화면에서 Maestro가 새 flow를 연결할 때 탭 명령이 간헐적으로 30초간 정지하고 앱이 black/home 화면으로 전환됐다. 하위 장소 전환 후 상세 접힘 초기화와 30% snap 조작은 독립 증빙하지 못했다.
- **서버 상태: 별도 차단 유지** — 원격 `venue_follows` migration/fixture 미확인으로 persisted filled 상태는 검증하지 못했다.

### Q1~Q10 재실행

| 항목                        | 결과              | 증빙 / 판단                                                                                                                                 |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 `npx tsc --noEmit`       | Pass              | exit 0, 오류 0건                                                                                                                            |
| Q2 `npm test`               | Pass              | 13 suites, 143 tests 모두 통과                                                                                                              |
| Q3 버그 / edge              | Partial / Blocked | 한 줄 grouped title과 서버 조회 실패 시 outline 상태 렌더 확인. 두 줄 제목, 서로 다른 followed fixture 전환은 미검증                        |
| Q4 UX                       | Pass              | 이름 옆 무배경 하트, 요약 정보, 동일폭 핵심 액션, 접힌 상세 정보 구조가 최신 brief와 일치                                                   |
| Q5 component convention     | Pass              | `VenueHeader`/`VenueDetails`/`HoursSection` 역할 분리, className 토큰 및 import 구조 준수                                                   |
| Q6 sim screenshot + inspect | Pass              | `g4-grouped-collapsed.png`, `g4-grouped-expanded.png`를 직접 열어 확인                                                                      |
| Q7 interaction              | Partial / Blocked | 지도→검색→예술의전당 바텀시트 진입 Pass. 좌표 탭으로 상세 정보 펼침 Pass. 접기→하위 장소 전환 연속 자동화는 Maestro 재연결 실패로 미검증    |
| Q8 regression paths         | Pass (관찰 범위)  | 지도, 검색, 바텀시트, 길찾기/상세 정보, grouped chip, 전시 탭과 첫 카드 정상 렌더                                                           |
| Q9 perf (light)             | Pass (정적)       | 상세 패널은 조건부 렌더링되고 장소 전환은 `VenueHeader` key remount로 로컬 expanded state를 폐기. follow 조회의 stale response cleanup 유지 |
| Q10 native rebuild          | N/A               | 네이티브 의존성 변경 없음                                                                                                                   |

### 직접 시각 검수

`evidence/g4-grouped-collapsed.png`:

- 한 줄 `예술의전당` 제목과 inline outline heart가 겹치지 않고 마지막 줄 기준으로 자연스럽게 정렬됨.
- 운영 상태와 주소만 기본 노출됨.
- `길찾기` primary와 `상세 정보` outline 버튼이 동일 폭·44pt 높이로 표시됨.
- grouped chips, `진행 중/예정` 전시 탭과 첫 전시 카드가 같은 화면에 노출되어 정보 밀도 개선 목적을 충족함.
- 캡처 당시 바텀시트는 코드의 초기 `index={1}`에 해당하는 50% snap이다. **30% snap에서의 노출 여부는 별도 미검증**이다.

`evidence/g4-grouped-expanded.png`:

- 버튼 라벨이 `상세 정보 접기`, chevron-up으로 변경됨.
- 주간 운영시간 패널이 액션 바로 아래에서 콘텐츠를 밀어내며 렌더됨.
- 오늘(목) 행 강조와 월요일 휴관 표시를 직접 확인함.

### 미검증 / 정확한 실패 지점

1. `g4-collapse-switch.yaml`: 기존 expanded 화면에 새 Maestro flow를 연결하자 `서예박물관 상세 정보 접기` element 탐색 실패 후 앱이 black 화면으로 전환.
2. `g4-switch-flow.yaml`: launch 후 `지도, tab, 4 of 5` 탭에서 30초 정지. 후속 검색/하위 장소 탭까지 도달하지 못함.
3. 따라서 한가람디자인미술관으로 전환한 뒤 상세 패널이 접힘으로 초기화되는 실제 화면은 미확인. 코드는 `VenueHeader key={activeVenue.museumId ?? activeVenue.venueName}` remount로 초기화하도록 구현됨.
4. 두 줄 장소명 프로토타입 fixture가 현재 앱 데이터/흐름에서 확보되지 않아 실화면 미검증.
5. 30% snap은 drag 자동화가 안정적으로 실행되지 않아 미검증. 초기 sheet는 `app/(tabs)/map.tsx`의 `index={1}`로 50%에서 열린다.

### 추가 증빙

- `evidence/g4-grouped-collapsed.png`
- `evidence/g4-grouped-expanded.png`
- `evidence/g4-tap-map.yaml`
- `evidence/g4-details-flow.yaml`
- `evidence/g4-collapse-switch.yaml` — 실패 재현
- `evidence/g4-switch-flow.yaml` — 실패 재현

## G4 최종 헤더 재검증 — 2026-09-17

### 결과

- **Pass (실제 iPhone 17 시뮬레이터 캡처 및 직접 inspect)**
- 최종 구현은 큰 가로 액션 행을 제거하고 제목 우측에 44pt 원형 하트와 원형 길찾기를 배치했다. 운영시간·주소는 유지되고, 상세 정보는 작은 텍스트 링크로 접혔다.

### 시각 및 인터랙션 검증

`evidence/g4-final-collapsed.png`:

- `국립중앙박물관` 한 줄 제목과 우측의 하트/길찾기 원형 버튼이 한 행에서 충돌 없이 렌더됨.
- 하트는 `gray200` 배경의 outline 상태, 길찾기는 `primary-dark` 배경으로 위계가 구분됨.
- 운영 상태 `운영중 · 9:30–17:30`과 주소가 제목 아래에 유지됨.
- 작은 `상세 정보 ›` 링크 직후 `진행 중/예정` 전시 탭과 첫 전시 카드들이 노출됨. 큰 가로 버튼 제거로 접힌 헤더의 정보 밀도가 개선됨.
- 지도 배경과 바텀시트, 전시 목록이 정상 렌더되어 인접 지도 회귀 이상 없음.

`evidence/g4-final-expanded.png`:

- 작은 링크를 실제 탭했고 `상세 정보⌃` 상태로 전환됨.
- 주간 운영시간, 전화, 홈페이지, 주차, 편의시설이 톤온톤 패널 안에 정상 렌더됨.
- 상세 패널 아래 전시 탭과 카드가 유지되어 펼침이 바텀시트 내부 콘텐츠를 정상적으로 미는 것을 확인함.

### 코드 검토

- 하트와 길찾기는 모두 실체 `w-11 h-11` 44pt 타깃이다.
- 하트는 checked/disabled/busy와 상태별 label/hint를 유지한다.
- 길찾기는 현재 `activeVenue.venueName` 기반 접근성 label을 제공한다.
- 상세 링크는 `expanded` 접근성 상태와 보기/접기 label을 제공하며 `hitSlop={8}`을 사용한다.
- `VenueHeader` key가 `activeVenue.museumId` 또는 장소명이므로 장소 전환 시 상세 local state가 초기화되는 구조를 유지한다.

### 정적 검증 승계

- 직전 동일 변경 세트 재검증: `npx tsc --noEmit` 0 errors, `npm test -- --runInBand` 13 suites / 143 tests Pass.
- 네이티브 의존성 변경 없음.

### 남은 환경 blocker

- 원격 `venue_follows` migration/fixture 미확인으로 서버 persisted filled 상태 검증은 계속 별도 차단이다.
- 캡처에 보이는 반투명 톱니 overlay는 Maestro/Simulator 도구 UI이며 앱 UI가 아니다.

### 최종 증빙

- `evidence/g4-final-collapsed.png`
- `evidence/g4-final-expanded.png`
- `evidence/g4-final-toggle.yaml`
