---
feature-slug: diary-receipt-stamp
tier: L
author: john
status: draft
---

## [John (PM)]

# Spec — 관람 영수증 → 우표 다이어리 (Diary Overhaul)

## Problem

- 현재 다이어리(`app/(tabs)/diary.tsx`)는 오디오가이드를 들어야만 그 날짜의 기록(`DayVisit`)이 생기고, 사용자가 직접 남길 수 있는 건 자유 메모 1개뿐이다(`app/diary/[date].tsx`).
- "관람 여부(추억용 기록)"와 "사용자가 직접 쓰는 부분"이 둘 다 약해서 다이어리가 재생 로그에 가깝고 일기 같은 애착이 안 생긴다.

## Goals

- 관람이 끝나는 순간에는 아무것도 요구하지 않는다 — 오디오가이드 종료 즉시 폰을 끄는 게 자연스러운 행동이므로, "영수증 확인 + 서명" 의식은 나중에 다이어리에서 모아서 하게 한다.
- 다이어리 탭에 들어왔을 때 "미확정 관람 기록이 N개 있다"는 걸 알려주고, 모아서 한 번에 확정(서명)하게 한다. 확정하지 않으면 일정 기간 후 사라진다.
- 확정된 결과물을 캘린더에서 우표(포스터/사진 썸네일) 형태로 모아 볼 수 있게 한다.
- 오디오가이드 사용 여부와 무관하게 "관람했다"는 기록을 남길 수 있게 한다(수동 인증).

## Non-goals (out of scope)

- 다른 사용자의 리뷰/별점을 보여주는 소셜 기능 (완전히 별도 스코프)
- 우표/영수증을 다른 사람과 공유하거나 내보내기(이미지 저장·SNS 공유)
- 오프라인 인쇄, 실물 우표 발송 등
- **이번 이터레이션 제외 (다음으로 미룸)**: AC-6 오디오가이드 없이 수동 인증, AC-7 상세 화면 별점 — 우선 미확정 큐 + 우표 캘린더 코어(AC-1~5)만 검증
- 미확정 기록 배너는 다이어리 탭에만 노출, 홈 탭 변경 없음
- 확정 큐 완주 강제 없음 — 언제든 나가도 되고, 남은 항목은 계속 미확정으로 유지

## Users & context

- 이미 오디오가이드로 전시를 들은 사용자 (기존 플로우 확장)
- 오디오가이드 없이 그냥 다녀온 전시를 기록하고 싶은 사용자 (신규 진입점)

## Acceptance criteria

### AC-1: 오디오가이드 종료 시 미확정 기록만 자동 생성

- **Given** 사용자가 몰입모드(오디오가이드)를 듣고 종료했다
- **When** `exit-summary` 화면을 그대로 빠져나간다 (추가 액션 없음)
- **Then** 오늘 들은 재생목록·관람 장소·시작~종료 시각이 "미확정(pending)" 상태로 저장되고, 캘린더에는 아직 우표로 나타나지 않는다

### AC-2: 다이어리 탭에서 미확정 기록 배너 노출

- **Given** 미확정 관람 기록이 1개 이상 있다
- **When** 다이어리 홈(`app/(tabs)/diary.tsx`)에 진입한다
- **Then** 상단에 "최근 저장하지 못한 관람 내역이 N개 남았습니다! (7일이 지나면 사라져요)" 배너가 뜬다

### AC-3: 배너 → 모아서 확정(서명)

- **Given** 미확정 기록 배너를 탭했다
- **When** 미확정 기록을 하나씩 확인하며 영수증 요약(재생목록/장소/시간)을 보고 서명한다
- **Then** 확정된 항목은 즉시 우표로 전환되어 캘린더/그리드에 나타나고, 다음 미확정 항목이 이어서 나온다 (전부 끝나면 다이어리 홈으로 복귀)

### AC-4: 미확정 기록 7일 만료

- **Given** 미확정 기록이 생성된 지 7일이 지났다
- **When** 앱이 다이어리 관련 화면을 열거나 백그라운드 점검 시점이 된다
- **Then** 해당 미확정 기록은 확정 없이 자동 삭제되고 배너 카운트에서도 제외된다

### AC-5: 캘린더/그리드에서 우표로 열람

- **Given** 확정된 관람 기록이 1개 이상 있다
- **When** 다이어리 홈(`app/(tabs)/diary.tsx`)의 캘린더 또는 그리드 뷰를 본다
- **Then** 각 날짜/항목이 톱니 테두리 우표 스타일로 표시되고, 탭하면 상세로 이동한다

### AC-6: 오디오가이드 없이 수동으로 관람 인증 — **다음 이터레이션으로 연기**

- **Given** 오디오가이드를 사용하지 않고 전시를 관람했다
- **When** 다이어리 홈에서 "관람 기록 추가"로 전시를 선택하고 사진/티켓 사진을 올린다
- **Then** 해당 날짜에 관람 기록이 곧바로 "확정" 상태로 생성되고 캘린더에 우표로 나타난다 (직접 추가한 행위 자체가 확정이므로 미확정 큐를 거치지 않음, 시간/위치 정보는 없을 수 있음)

### AC-7: 상세 화면 별점 — **다음 이터레이션으로 연기**

- **Given** 저장된 관람 기록이 있다
- **When** 상세(`app/diary/[date].tsx`)에 진입한다
- **Then** 서명, 별점, 메모를 확인하거나 별점/메모는 이후에도 수정할 수 있다

## Screens / routes

| Route | 변경 |
|-------|------|
| `app/(guide)/exit-summary.tsx` | **변경 없음** — 관람 종료 시점에는 아무 CTA도 추가하지 않는다 (의도적으로 그대로 둠) |
| `app/(tabs)/diary.tsx` | 상단에 미확정 기록 배너 추가, 캘린더·그리드 카드를 우표 스타일로 교체, "관람 기록 추가" 진입점 추가 |
| `app/diary/confirm-visits.tsx` (신규) | 배너 탭 시 진입 — 미확정 기록을 하나씩 영수증 요약 + 서명으로 확정하는 큐 화면 |
| `app/diary/[date].tsx` | 별점 입력, 서명 썸네일, 위치/시간 정보 섹션 추가 |
| `app/diary/add-manual.tsx` (신규) | 오디오가이드 없이 관람 수동 기록 (전시 선택 + 사진 업로드) |

## UX Flow

핵심 변경: 관람 종료 시점 ≠ 확정 시점. 종료 시점엔 아무것도 요구하지 않고 **미확정 기록만 조용히 쌓아뒀다가**, 사용자가 다이어리에 들어왔을 때 모아서 확정시킨다.

```
[오디오가이드 재생 중]
      │ 종료
      ▼
exit-summary.tsx  ── 변경 없음 (근처 카페/명소 추천 그대로)
      │
      ▼
visit 자동 기록 생성 (status: pending, 재생목록/장소/시간 포함)
      │
      ⋮  (사용자는 그냥 앱을 나간다 — 아무 액션 없음)
      ⋮  (며칠 후) 다이어리 탭 재진입
      ▼
app/(tabs)/diary.tsx
      │ 상단 배너: "최근 저장하지 못한 관람 내역이 N개 남았습니다!
      │            (7일이 지나면 사라집니다)"
      │ 배너 탭
      ▼
app/diary/confirm-visits.tsx (신규) ── 미확정 큐
  1) 영수증 요약(재생목록/장소/시간) 확인
  2) 손그림 서명
  3) 확정 → 우표로 전환, 다음 미확정 항목으로 (없으면 다이어리로 복귀)
      │
      ▼
app/(tabs)/diary.tsx  ── 확정된 항목들이 캘린더/그리드에 우표로 나타남
      │ 우표 탭
      ▼
app/diary/[date].tsx  ── 서명·별점·메모·재생목록 상세 확인/편집
```

7일 경과 시: 확정하지 않은 미확정 기록은 배너 카운트/큐에서 자동 제외되고 데이터도 삭제된다(만료).

수동 기록 경로(오디오가이드 미사용 — 큐를 거치지 않고 즉시 확정):

```
app/(tabs)/diary.tsx ── "관람 기록 추가" ──▶ app/diary/add-manual.tsx
  (전시 선택 + 사진/티켓 업로드 + 날짜)
      │ 저장
      ▼
app/(tabs)/diary.tsx  ── 우표로 즉시 반영 (미확정 큐를 거치지 않음)
```

## 구성요소 (Components)

**신규**

| 컴포넌트 | 역할 |
|---|---|
| `PendingVisitsBanner` | 다이어리 홈 상단에 미확정 개수 + 만료 안내를 보여주는 배너, 탭하면 확정 큐로 이동 |
| `ReceiptSummary` | 확정 큐(`confirm-visits.tsx`)에서 보여주는 영수증 스타일 요약 카드(재생목록/장소/시간, 점선 절취선 느낌) |
| `SignaturePad` | `react-native-svg` 기반 손그림 서명 캡처 (신규 네이티브 모듈 불필요) |
| `StampCell` | 톱니 테두리(우표) 썸네일 셀 — 캘린더·그리드 공용 |
| `RatingStars` | 별점 입력/표시 (상세 화면용) |
| `ReceiptStampTransition` | 서명 완료 후 보관함으로 빨려 들어가는 트랜지션 애니메이션 (큐 안에서 항목별로 재생) |

**수정**

| 컴포넌트 | 변경 |
|---|---|
| `DiaryCalendar.tsx` | 날짜 셀 렌더링을 `StampCell`로 교체 |
| `VisitTicketGrid.tsx` / `VisitTicketGridCard.tsx` | 카드 렌더링을 `StampCell` 스타일로 교체 |
| `VisitTicket.tsx` | 뒷면(프로그램)에 서명 썸네일 + 위치/시간 정보 행 추가 |
| `ArchiveDiaryEmpty.tsx` | "관람 기록 추가" 수동 진입 버튼 추가 |
| `useDayImages.ts` | 이미지 우선순위에 서명/사용자 업로드 사진 반영 여부 결정 필요 (Open question 참고) |

**스토어**

| 스토어 | 변경 |
|---|---|
| `visitStore.ts` (`DayVisit`) | `status: 'pending' \| 'confirmed'`, `pendingSince?: string`(만료 계산용), `rating?: number`, `signatureUri?: string`, `visitedAt?: { start: string; end: string }`, `locationLabel?: string` 필드 추가 |
| `immersiveStore.ts` | `enter()` 시점에 `enteredAt` 타임스탬프 기록 (관람 시간 계산용) |

## Risks & dependencies

- Supabase `visits` 테이블에 `status` / `pending_since` / `rating` / `signature_url` / `visit_started_at` / `visit_ended_at` / `location_label` 컬럼 추가(마이그레이션) 필요.
- 서명 이미지·수동 업로드 사진을 담을 Supabase Storage 버킷/정책 설계 필요.
- **7일 만료 정리 로직**: 언제 sweep을 돌릴지가 관건 — 서버 크론이 없는 구조라, 1차는 다이어리 탭 mount 시점에 클라이언트에서 `pendingSince + 7일 < now`인 pending 항목을 걸러 삭제하는 방식으로 시작(백그라운드 크론은 out of scope).
- 관람 시간은 몰입모드 진입~종료 기준이라, AC-6(수동 기록)에는 시간 정보가 없음 — UI에서 옵셔널로 처리.
- `expo-image-picker`, `react-native-svg`는 이미 설치돼 있어 신규 네이티브 모듈 추가는 불필요(빌드 리스크 낮음).
- 미확정 기록이 여러 개 쌓였을 때(예: 3개) 확정 큐를 한 번에 다 돌게 강제할지, 중간에 나가도 되게 할지 UX 결정 필요 (Open questions 참고).

## Open questions — 확정됨 (Manager ↔ user, 2026-09-09)

- [x] 확정 큐 중간 이탈: **언제든 나가도 됨.** 처리 못 한 항목은 그대로 미확정으로 남아 다음에 배너로 다시 카운트된다. 큐 완주를 강제하지 않는다.
- [x] 배너 노출 범위: **다이어리 탭만.** 홈 탭 변경 없음.
- [x] AC-6(수동 인증): **이번 스코프 제외**, 다음 이터레이션으로 미룸.
- [x] AC-7(별점): **이번 스코프 제외**, 다음 이터레이션으로 미룸.

이번 이터레이션 실행 범위는 AC-1~5(미확정 큐 + 우표 캘린더)로 확정.

## Feature breakdown (for Chris)

**이번 이터레이션 (AC-1~5)**

1. AC-1(데이터만): `immersiveStore`에 `enteredAt` 추가, `visitStore`에 `status`/`pendingSince` 추가 — 오디오가이드 종료 시 `status: 'pending'`으로 저장, `exit-summary.tsx`는 변경 없음
2. AC-2: `PendingVisitsBanner` — 다이어리 홈 상단에 pending 개수 + 만료일 배너(다이어리 탭 전용), 7일 경과 pending 정리(sweep) 로직
3. AC-3: `confirm-visits.tsx` 신규 화면 — `ReceiptSummary` + `SignaturePad` + `ReceiptStampTransition`으로 큐 순회하며 확정. 언제든 중도 이탈 가능(강제 완주 없음), 남은 항목은 미확정 유지
4. AC-5: `StampCell` 컴포넌트 제작 → `DiaryCalendar`/`VisitTicketGrid` 교체 (confirmed 항목만 표시)

**다음 이터레이션 (연기됨 — 이번엔 착수하지 않음)**

- AC-6: `add-manual.tsx` + `ArchiveDiaryEmpty` 진입점 (즉시 confirmed로 생성)
- AC-7: 상세 화면에 `RatingStars` + 서명/시간/위치 표시
