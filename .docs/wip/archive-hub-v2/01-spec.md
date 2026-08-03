---
feature-slug: archive-hub-v2
tier: L
author: john
status: approved
phase: 2-visual-refresh
---

# Spec — 아카이브 허브 (Phase 2: 비주얼·레이아웃 전면 개편)

> Phase 1(기능 AC-1~6)은 구현됨. 사용자 피드백으로 **같은 기능·데이터**를 유지한 채 UI/IA만 갈아엎는다.

## Problem (Phase 2)

- 화면이 **베이지·회색 단색** 위주라 밋밋하고 “관람 기록”의 감정·다양성이 전달되지 않는다.
- 통계·날짜에 쓰인 **`#3B82F6` 블루**는 탐색 히어로(`ExploreHomeHero`의 라벤더·크림 그라데이션) 및 앱 warm 톤과 **단절**되어 당황스럽다.
- 정보 순서가 **히어로 → pill → (빈 상태?) → 최근 → 달력 덩어리**로 겹쳐 보여 **레이아웃 리듬**이 어색하다 (빈 상태와 달력이 동시에 보이는 구조 등).
- “MY ARCHIVE” 영문 라벨·3칸 통계 카드가 **설정/탐색 탭과 다른 임시 UI**처럼 느껴진다.

## Goals

- **부드럽고 다양한** 시각: 크림·잉크·**저채도 웜/라벤더/세이지** 등 탐색 탭과 **한 계열**의 악센트 (채도 높은 primary blue **금지**).
- **한 화면 = 한 스토리**: “요약 → 무엇을 볼지(탭) → 그 탭의 핵심 콘텐츠”로 계층 정리; 스크롤 시 피로 줄이기.
- **콘텐츠에서 색을 끌어오기**: 최근 관람·달력 썸네일(작품/전시 이미지)을 카드 배경·틴트에 활용해 단색 탈피.
- Phase 1 **기능·라우트·스토어** 유지: `useArchiveStats`, visit/diary/bookmark, `/diary/[date]`, `SavedExhibitions`, `DiaryCalendar` 동작 동일.

## Non-goals (out of scope)

- 백엔드·스키마·visit/diary 비즈니스 로직 변경
- VisitTicket·일기 상세 화면 전면 리디자인 (아카이브 탭 + `src/components/archive/*` 허브 영역만) → **티켓 뒷면은 `diary-ticket-back` 스펙**
- 새 탭 추가 (여전히 관람 다이어리 / 저장한 전시 2분할)

## Design principles (Sam 입력 전 가드레일)

| Do | Don't |
|----|--------|
| `#F8F6F2`, `#1C1917`, Explore 히어로 계열 그라데이션·소프트 blob | `#3B82F6`, iOS system blue, 회색만 쌓인 flat card |
| Hahmlet(제목) + Pretendard(UI), 44pt 터치 | 영문 ALL CAPS 장식만으로 채운 헤더 |
| 이미지·포스터 틴트, 카드별 미세 hue variation | 모든 카드 동일 `#F2EFE9` |

## Users & context

- 동일 (Phase 1). 추가: **기록이 많은 사용자**는 최근·달력이 시각적으로 풍부해야 “쌓였다”는 느낌을 받음.
- **기록 없음**: 달력을 빈 채로 크게 두기보다 **한 덩어리 empty + 가벼운 달력 프리�** 등 IA 선택은 Sam brief에서 확정.

## Acceptance criteria

### AC-V1: 브랜드 일관 악센트

- **Given** 로그인 사용자 아카이브 탭
- **When** 요약 숫자·최근 날짜·강조 UI 렌더
- **Then** `#3B82F6`(및 탭바 블루와 동일 계열) **미사용**, 탐색 히어로와 조화되는 **잉크 + 웜/라벤더/세이지** 토큰만 사용 (Sam `02-design-brief`에 hex 고정)

### AC-V2: 히어로·요약 재구성

- **Given** 아카이브 진입
- **When** 스크롤 최상단
- **Then** Explore 히어로와 **짝**이 되는 그라데이션/장식(soft blob 또는 일러스트 여백) + **3지표(관람일·들은 작품·저장)** 가 한눈에 읽히되, Phase 1보다 **덜 “대시보드”, 더 “여정”** 톤 (카피·타이포 Sam 확정)

### AC-V3: 탭 아래 레이아웃 리듬

- **Given** 세그먼트 선택
- **When** “관람 다이어리” 또는 “저장한 전시”
- **Then**
  - **다이어리**: (1) 섹션 헤더 명확 (2) **기록 없음**이면 empty가 **주 영역**, 달력은 보조 또는 empty와 **중복 안내 없이** 한 흐름 (3) **기록 있음**이면 **최근 관람 → 달력** 순, 섹션 간 spacing 20–24pt 일관
  - **저장**: 헤더 + `SavedExhibitions`만; 불필요한 회색 박스 제거

### AC-V4: 최근 관람 카드

- **Given** recentDateKeys.length > 0
- **When** 가로 스크롤 카드 표시
- **Then** 날짜·전시명 가독성 유지 + **썸네일 또는 visit 이미지**가 있으면 카드에 반영(없으면 날짜별 **저채도 틴트** rotation), 블루 날짜 텍스트 없음

### AC-V5: 달력 영역

- **Given** 다이어리 탭
- **When** 달력 표시
- **Then** `#F2EFE9` 단일 둔덩이 shell 대신 **카드/여백 분리** (테두리·shadow 또는 배경 분리 Sam spec); `DiaryCalendar` 마킹·썸네일 동작 유지

### AC-V6: Empty · Guest · Saved empty

- **Given** 각 empty 상태
- **When** 렌더
- **Then** Phase 1 CTA(둘러보기·지도·로그인) 유지, **일러스트/아이콘 톤**을 warm palette로 통일 (회색 아이콘 only 금지)

### AC-V7: 회귀 (기능)

- **Given** Phase 1 AC-1~6
- **When** Phase 2 UI 적용 후
- **Then** 세그먼트 haptic·날짜 탭→diary·저장 탭·비로그인 CTA·stats 숫자 정확성 **변경 없음**

## Screens / routes

| Route / file | 변경 |
|--------------|------|
| `app/(tabs)/archive.tsx` | 섹션 순서·조건부 렌더(empty vs calendar) 정리 |
| `ArchiveSummaryHero.tsx` | 비주얼 전면 |
| `ArchiveRecentVisits.tsx` | 썸네일/틴트 카드 |
| `ArchiveDiaryEmpty.tsx` | warm empty |
| `ArchiveLoginPrompt.tsx` | Explore 짝 톤 |
| `DiaryCalendar.tsx` | (선택) shell 밖 스타일만; 셀 로직 최소 diff |
| `02-design-brief.md` | Phase 2 토큰·와이어·레퍼런스 반영 |

## Risks & dependencies

- 사용자 **레퍼런스 미제공** 시 Sam이 Explore/onboarding 카드 톤으로 fallback.
- `dayImages` / visit `imageUrl` 없는 날짜는 틴트 palette로만 다양성 확보.

## Open questions (Manager → user)

- [ ] **레퍼런스**: 앱/웹 스크린샷·Figma·Pinterest 링크 1–3개 (원하면 다음 메시지에 첨부)
- [ ] **히어로**: Explore처럼 **스culpture/일러스트** 노출 vs **통계만 미니멀** — 레퍼런스 보고 Sam이 1안 제안
- [ ] **기록 없을 때 달력**: 완전 숨김 vs **흐린 프리�** (CTA 집중 vs “이렇게 채워진다” 힌트)

## Feature breakdown (for Sam → Alex → Chris)

1. Sam: Phase 2 `02-design-brief` (토큰, 와이어, empty/diary/saved 3 state)
2. Alex: `03-design-review` (blue 잔존·회색 단조 rubric)
3. Chris: AC-V1→V7 순, `archive.tsx` IA 먼저
4. Taylor: Phase 1 AC + V7 회귀, 스크린샷 3 state

## Phase 1 spec (archive, unchanged behavior)

<details>
<summary>AC-1~6 요약 (구현 완료)</summary>

- AC-1 요약 히어로(3 stats)
- AC-2 SettingsPillGroup equalWidth
- AC-3 최근 관람 5일
- AC-4 다이어리 empty + CTA
- AC-5 저장 N개
- AC-6 비로그인 ArchiveLoginPrompt

</details>
