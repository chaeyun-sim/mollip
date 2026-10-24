---
feature-slug: diary-record-revisit
tier: M
author: john
status: approved
---

# Spec — 기록하기 감상 단계 개편 + 재방문 여부 저장

## Problem

- `app/diary/record/write.tsx`(기록하기 2단계)는 방문일·별점·사진이 같은 모양의 라벨+박스로 나열돼 묶음이 흐리다.
- "이 전시를 다시 찾았는지"를 남길 곳이 없다.

## Goals

- 감상 단계를 근백색 / 코코아 / 올리브 / 마호가니 톤으로 다시 디자인하고, 입력을 의미 단위로 묶는다.
- 재방문 여부(`isRevisit: boolean`)를 접근성 있는 토글로 받아 draft → `saveRecord` → `DayVisit` → SQLite까지 영속한다.
- 기존 DB(컬럼 없음)는 앱 시작 시 마이그레이션으로 컬럼을 덧붙인다.

## Constraints

- 로컬 전용: `rating`/`companion`/`keywords`와 같다. 근거 — `src/types/database.types.ts`·`supabase/migrations`에 해당 컬럼이 없고 `useVisitSync.ts`가 로컬 값을 그대로 보존한다. 원격 업서트 payload에 넣지 않는다.
- `keywords`에 인코딩하지 않는다. 별도 boolean 필드.
- 방문일(도슨트 고정일 잠금·picker 범위)·별점(0.5 단위, 필수)·사진(선택, 최대 6) 의미와 `다음 → /diary/record/caption` 내비게이션은 유지한다.
- 신규 의존성·네이티브 모듈 없음. 커밋 금지. 무관한 변경과 `t:mock1` 스텁은 건드리지 않는다.

## Non-goals (out of scope)

- 다이어리 상세/벽/캘린더에서 재방문 표시 (저장만 한다).
- 원격(Supabase) 컬럼 추가·동기화.
- `index.tsx`·`caption.tsx`의 UI 변경 (caption은 저장 호출에 필드를 전달하는 한 줄만).
- 디자인 시스템 토큰 신규 추가.

## Users & context

- 전시를 본 뒤 기록을 남기는 사용자. 한 손, 짧은 시간.

## Acceptance criteria

### AC-1: 재방문 토글이 draft에 저장된다

- **Given** 기록하기 2단계에 들어왔다(재방문 기본 꺼짐)
- **When** 재방문 행을 탭한다
- **Then** 토글이 켜지고 `draft.isRevisit === true`; 다시 탭하면 꺼진다. 스크린리더는 `switch` 역할과 켜짐/꺼짐 상태를 읽는다.

### AC-2: 저장 시 isRevisit가 DayVisit로 간다

- **Given** draft에 `isRevisit`가 있다
- **When** 캡션 단계에서 `기록 남기기`를 누른다
- **Then** `saveRecord({ …, isRevisit })`가 호출되고 `visits[key].isRevisit`에 같은 값이 저장된다. 원격 payload에는 포함되지 않는다.

### AC-3: SQLite에 영속되고 기존 DB는 마이그레이션된다

- **Given** `is_revisit` 컬럼이 없는 기존 `local_visits` 테이블
- **When** DB를 처음 연다
- **Then** `ALTER TABLE … ADD COLUMN is_revisit INTEGER`가 한 번 실행되고, 기존 행은 `isRevisit === undefined`로 읽히며, 저장한 true/false는 그대로 복원된다. 로그인 오버레이(`slimLocalVisit`)와 `useVisitSync` 병합에서도 값이 사라지지 않는다.

### AC-4: 감상 단계 재디자인(의미 보존)

- **Given** 기록하기 2단계
- **When** 화면을 본다
- **Then** "방문"(날짜 + 재방문), "감상"(별점), "사진" 세 묶음이 구분되고, 방문일 잠금/변경, 별점 0.5 단위·필수 게이트, 사진 추가/삭제(최대 6), `다음` 이동이 이전과 동일하게 동작한다.

## Screens / routes

| Route                   | 변경                                  |
| ----------------------- | ------------------------------------- |
| `/diary/record/write`   | 레이아웃 재디자인 + 재방문 토글       |
| `/diary/record/caption` | `saveRecord`에 `isRevisit` 전달 (1줄) |

## Risks & dependencies

- DB 마이그레이션은 기존 사용자 데이터를 건드린다 → `ADD COLUMN`만 사용(비파괴), 컬럼 존재 시 건너뜀.
- 도슨트로 남은 미확정 기록과 합칠 때 `prev.isRevisit`를 보존해야 한다.
- 디자인 시스템은 plum을 유일한 CTA 색으로 정한다 → 올리브/마호가니는 소면적 보조색으로만 쓴다.

## Open questions (for Manager → user)

- (none — 사용자 질문 금지 세션. 가정은 02에 기록)

## Feature breakdown (for Chris)

1. AC-3 데이터 계층(타입·store·DB·sync·tests)
2. AC-2 caption 전달
3. AC-1/AC-4 write.tsx UI

---

## Follow-up amendment A2 — 한 번에 한 질문씩 진행하는 순차 플로우 (2026-10-14, 사용자 피드백 v3)

사용자 피드백: v2도 "여전히 목록 같다". 질문이 **하나씩 차례로** 나오는 플로우여야 한다. 순서: **방문일 → 별점 → 오늘 찍은 사진 → 재방문 여부 → (예시) 시설 평가**.

### 결정·가정

- 기록하기 전체 단계는 그대로 3단계(입장 / 감상 / 캡션). 헤더 `RecordStepHeader`는 계속 **2/3**을 보여주고, 2단계 안에 **내부 진행 표시**(질문 n/N)를 추가한다.
- **시설 평가는 이번에 구현하지 않는다.** 사용자가 "예시인지 실제 필드인지" 비동기로 확인 중이다. 데이터 필드·저장·UI 모두 추가하지 않는다. 단계 목록을 설정 배열로 두어 답이 오면 한 단계만 더하면 되게 한다. 그래서 현재 N = 4.
- 라우트는 그대로 `/diary/record/write` 한 화면이 내부 단계를 가진다(기존 라우트·딥링크·캡션 가드 불변). 현재 질문은 draft의 `writeStep`에 두어, 캡션에서 뒤로 돌아오면 마지막 질문으로 복원되고 단계 간 이동 중에도 답이 유지된다.
- v2의 색 체계(근백색/코코아/올리브/마호가니, plum은 CTA 한 곳)는 유지한다.

### 변경되는 AC (A2가 이전 AC-1·AC-4의 UI 서술을 대체)

#### AC-1′: 재방문은 명시적 선택이다 (AC-1 대체)

- **Given** 재방문 질문 단계이고 아직 답하지 않았다(`draft.isRevisit === undefined`)
- **When** "네, 다시 찾았어요" 또는 "아니요, 처음이에요"를 고른다
- **Then** `draft.isRevisit`가 `true` / `false`로 저장된다(기존 boolean 그대로). 고르기 전에는 `다음`이 비활성이다. 한 번 고른 뒤 다른 쪽을 고르면 바뀐다. 접근성은 `radio` 역할 + `checked` 상태.

#### AC-4′: 질문 하나씩 보여주는 순차 플로우 (AC-4 대체)

- **Given** 기록하기 2단계에 들어왔다
- **When** 화면을 본다
- **Then** 방문일 → 별점 → 사진 → 재방문 순서로 질문 **하나만** 보이고, 내부 진행(`n / 4`과 진행 바)이 현재 위치를 알려준다. 방문일 기본값·날짜 범위 제약(고정일 잠금, 최소/최대일), 별점 0.5 단위·필수, 사진 선택·최대 6장은 이전과 동일하다.

#### AC-5 (신규): 이동과 답 보존

- **Given** 어느 질문에서든
- **When** `다음` / `뒤로`를 누른다
- **Then** 앞뒤로 이동해도 입력한 답이 유지된다. 첫 질문의 `뒤로`는 1단계(전시 고르기)로 나간다. 마지막 질문의 `다음`은 방문일을 확정하고 캡션으로 간다. 캡션에서 뒤로 돌아오면 마지막 질문(재방문)이 복원되고 모든 답이 남아 있다. 별점이 0이면 별점 질문의 `다음`은 비활성(필수).

#### AC-6 (신규): 사진은 건너뛸 수 있다

- **Given** 사진 질문 단계에서 사진이 0장이다
- **When** 주 버튼을 본다
- **Then** 라벨이 `건너뛰기`이고 누르면 다음 질문으로 간다. 사진이 1장 이상이면 `다음`이다.

### Out of scope (A2)

- 시설 평가 데이터/필드/화면 (사용자 답변 대기). 구현하지 않는다.
- 캡션 화면·다이어리 표시 변경, 원격 동기화.
- 라우트를 질문별로 쪼개는 것(내부 단계로 처리).

### Open questions (비동기, 사용자 답변 대기)

- [ ] 시설 평가는 실제 저장 필드로 추가할 것인가, 단지 예시인가? — 답이 오면 5번째 단계와 필드를 별도 작업으로 반영.

### Screens / routes (A2)

| Route                 | 변경                                             |
| --------------------- | ------------------------------------------------ |
| `/diary/record/write` | 내부 4단계 순차 질문 UI (경로 불변)              |
| `RecordDraft`         | `writeStep?` 추가 (내부 진행 복원용, 저장 안 함) |

### Feature breakdown (A2)

1. 단계 정의·진행 규칙 유틸(`recordWriteFlow`) + 단위 테스트
2. draft `writeStep`
3. 질문 레이아웃·선택지·진행 컴포넌트, `write.tsx` 조립
4. (Alex Pass 이후) 구현 → 시뮬레이터 스크린샷·Maestro → QA
