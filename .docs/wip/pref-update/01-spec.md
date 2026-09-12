---
feature-slug: pref-update
tier: M
author: john
status: draft
---

# Spec — 내 취향 업데이트 (설정 재진입)

## Problem

온보딩 취향 선택(스와이프 카드)은 최초 1회만 설정 가능하다. 이후 관심사가 바뀌어도 preferred_genres / preferred_artists를 수정할 방법이 없다.

## Goals

- 설정 화면에서 언제든 취향을 다시 설정할 수 있게 한다
- 기존 온보딩 스와이프 카드 UI를 그대로 재사용한다
- 저장 시 Supabase profiles 테이블을 덮어쓴다

## Non-goals (out of scope)

- 위치 권한 재요청 없음
- 추천 전시 즉시 갱신 없음 (저장 후 다음 탐색 시 자동 반영)
- 카드 항목 추가·변경 없음

## Users & context

로그인 유저. 온보딩을 이미 완료한 상태.

## Acceptance criteria

### AC-1: 설정 메뉴 진입점 추가

- **Given** 설정 화면이 열려 있다
- **When** 사용자가 화면을 본다
- **Then** "계정" 섹션 하단에 "내 취향 수정" CardRow(icon: `heart-outline`)가 표시된다

### AC-2: 취향 수정 화면 진입

- **Given** "내 취향 수정"을 탭한다
- **When** 화면이 전환된다
- **Then** 온보딩과 동일한 스와이프 카드 UI가 표시된다 (뒤로가기 버튼 포함)

### AC-3: 완료 후 저장

- **Given** 12장 카드를 모두 스와이프한다
- **When** 완료 화면에서 "저장하기" 버튼을 탭한다
- **Then** profiles.preferred_genres / preferred_artists 가 갱신되고 설정 화면으로 돌아간다

### AC-4: 중간 취소 시 저장 안 됨

- **Given** 카드를 스와이프하는 도중
- **When** 뒤로가기 버튼을 탭한다
- **Then** DB는 변경되지 않고 설정 화면으로 돌아간다

## Screens / routes

| Route | 변경 |
|-------|------|
| `settings/index` | "계정" 섹션에 CardRow 1줄 추가 |
| `settings/preferences` | 신규 — 스와이프 카드 취향 선택 화면 |
| `settings/_layout` | `preferences` Stack.Screen 등록 |

## Risks & dependencies

- `OnboardingSwipeCard`, `ART_ITEMS`, `shuffle` 로직 재사용 → onboarding/index.tsx 참조

## Feature breakdown (for Chris)

1. AC-1: `settings/index.tsx`에 CardRow 추가
2. AC-2 / AC-3 / AC-4: `settings/preferences.tsx` 신규 생성 (온보딩 카드 UI + 저장 로직)
3. `settings/_layout.tsx`에 `preferences` 등록
