---
feature-slug: diary-ticket-back
tier: M
author: john
status: approved
parent: archive-hub-v2
---

# Spec — 관람 티켓 뒷면 (오늘의 프로그램)

## Problem

- `VisitTicket` **뒷면 hero**가 **AI 일기 생성·스트리밍**인데, 이는 mollip **차별 기능이 아님** (범용 LLM 텍스트).
- 플립 UX 기대(입장권 **스텁 / 프로그램**)와 콘텐츠(장문 AI 글)가 **어긋남**.
- `visitStore.listened`(작품·썸네일·`descriptionPreview`)는 이미 있으나 **뒷면·hero에서 활용되지 않음**; 헤더 ♪ 모달만 존재.
- AI 일기 empty/CTA가 뒷면 대부분을 차지해 **“들은 작품” 기록**이 약함.

## Goals

- **뒷면 주 콘텐츠** = 그날 **들은 작품 프로그램** (번호·썸네일·제목·선택적 preview 1줄).
- **헤더 오른쪽 ♪** = `PlaylistModal` **유지** (앞면·빠른 목록 접근).
- **AI 일기** = 부가 기능: hero·대형 CTA 제거, **접힌 블록 / 하단 보조** (기존 `useDiaryEntry`·스토어 **유지**).
- **앞면** 입장권(포스터·전시 메타·스텁) **유지**; 플립·절취선·도장 **유지**.

## Non-goals

- `visitStore` / `diaryStore` 스키마 변경
- `streamDescription`·프롬프트(`DIARY_PROMPT`) 로직 변경
- 아카이브 허브 탭(`archive.tsx`) UI
- 작품 탭 시 **전시/작품 상세 라우팅** (2차 — 데이터 없으면 비활성)

## Users & context

- 달력에서 날짜 선택 → `/diary/[date]` → 티켓 **앞** = 그날 전시, **뒤** = 그날 들은 해설 목록.
- ♪ = 앞면에서도 목록 확인 (모달).

## IA (Sam)

```
[Header: back | date | ♪ (playlist modal) (⋯ optional later)]
[VisitTicket front: unchanged]
[Flip]
[VisitTicket back:
  - Title: 오늘의 프로그램 (KO)
  - Scroll: listened[] rows (thumb, title, preview?)
  - Footer collapsible: 도슨트 일기 (existing text / generate — compact)
]
[Flip hint dots]
```

- 헤더 **refresh(일기 다시 쓰기)** → **제거** 또는 **⋯** 로 이동 (AC-5). 1차: **제거**하고 일기 블록 내 “다시 쓰기”만.

## Acceptance criteria

### AC-1: 뒷면 — 프로그램 hero

- **Given** `visit.listened.length >= 1` (또는 `listenedTitles`와 동기된 목록)
- **When** 사용자가 티켓을 뒤집음
- **Then** 상단에 **「오늘의 프로그램」**(또는 brief 확정 KO) 표시
- **And** 각 항목에 **순번 + (imageUrl 있으면 썸네일, 없으면 placeholder)** + **작품 제목**
- **And** `descriptionPreview`가 있으면 **1줄** muted preview (없으면 생략)
- **And** **「DOCENT'S DIARY」 영문 hero 라벨·빈 일기 대형 CTA가 뒷면 상단에 없음**

### AC-2: 뒷면 — listened 없음

- **Given** 해당 `dateKey`에 `listened` 없음 (빈 배열)
- **When** 뒷면
- **Then** 「이날 들은 작품이 없어요」 + ♪ 로 전체 목록을 볼 수 있다는 **1줄 안내** (모달 열기 버튼 optional)
- **And** AI 일기 생성을 **유일한 CTA로 두지 않음**

### AC-3: 헤더 플레이리스트

- **Given** `/diary/[date]` 화면
- **When** 헤더 ♪ 탭
- **Then** 기존 `PlaylistModal` 동작·목록 소스 **유지** (`listenedTitles` / visit listened)

### AC-4: AI 일기 (demote)

- **Given** 기존 `diaryStore` / `useDiaryEntry`에 entry 또는 draft 있음
- **When** 뒷면 스크롤 하단 **「도슨트 일기」** 영역
- **Then** 기존 일기 텍스트 표시·스트리밍·에러·재생성 **동작 유지**
- **And** 영역은 프로그램 목록 **아래** (접기 기본: **펼침** if hasEntry, **접힘** if no entry — 구현 단순화 시 항상 펼침 + compact OK)

### AC-5: 헤더 정리

- **Given** 일기 screen header
- **When** 렌더
- **Then** ♪ **유지**
- **And** `hasEntry` 시 보이던 **refresh 아이콘 제거** (재생성은 AC-4 일기 블록에서)

### AC-6: 앞면·플립 회귀

- **Given** 변경 후
- **When** 앞면·플립·절취선·바코드·도장
- **Then** Phase 1 대비 **레이아웃·동작 동일** (포스터·3칸 메타·스텁)

### AC-7: 데이터 소스

- **Given** `DayVisit.listened[]`
- **When** 프로그램 렌더
- **Then** **visit store의 `listened` 객체 배열** 우선 (title, imageUrl, descriptionPreview); fallback은 diary screen 기존 `listenedTitles` string[] **only if** visit empty (기존 placeholder 동작 유지)

## Screens / routes

| Route / file | 변경 |
|--------------|------|
| `app/diary/[date].tsx` | `listened` items pass-through, header refresh 제거 |
| `src/components/archive/VisitTicket.tsx` | 뒷면 UI, props 확장 (`listenedItems?: ListenedItem[]`) |
| `src/components/archive/PlaylistModal.tsx` | 변경 없음 (또는 제목만 KO 통일 — optional) |

## Risks

- `listened` only strings in old persisted visits → placeholder thumb OK.
- `TICKET_MIN_HEIGHT` — 프로그램 길면 스크롤; min height 조정 may be needed (Chris dev-notes).

## Feature breakdown (Chris)

1. AC-7 + props: `ListenedItem[]` → `VisitTicket`
2. AC-1, AC-2: back face program list UI
3. AC-4: diary subsection below program
4. AC-5: `[date].tsx` header
5. AC-3, AC-6: regression pass

## Open questions

- [x] AI 일기: demote, not remove — **Yes**
- [x] ♪ 헤더 유지 — **Yes**
- [ ] 작품 row tap → 상세: **Out of scope v1**
