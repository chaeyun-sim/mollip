---
feature-slug: plum-color-migration
tier: L
author: john
status: pass
---

# Spec — Deep Plum 컬러 시스템 코드 적용

## Problem

디자인 정본 `.docs/DESIGN_SYSTEM.md`는 Bianco·Kimber·Deep Plum 팔레트를 정의하지만 앱 토큰과 화면은 퍼플·민트를 사용한다.

## Goals

- 앱 전체의 공통 배경·글자·브랜드색을 새 팔레트로 이관한다.
- 버튼·탭·선택·다크 화면의 대비와 상태 의미를 유지한다.
- 컬러 prop 이름을 용도에 맞게 정리하고 이전 퍼플·민트 토큰을 제거한다.

## Constraints

- 기존 작업 트리의 미완료 변경을 보존한다.
- 외부 브랜드색, 교통 노선색, 작품 이미지색은 유지한다.
- 화면별 하드코딩 색 중 의도된 도메인 표현은 분류 후 유지한다.

## Non-goals (out of scope)

- 레이아웃과 기능 플로우 변경
- 새로운 상태색 의미 정의

## Acceptance criteria

### AC-1: 토큰

- **Given** 이전 컬러 토큰이 등록된 상태
- **When** Bianco·Kimber·Deep Plum과 표면·장식 토큰을 정의한다
- **Then** NativeWind와 JS 색상 prop에서 같은 값을 참조하고 타입 검사가 통과한다

### AC-2: 사용처 이관

- **Given** 버튼·탭·카드·텍스트·다크 화면에 이전 브랜드색이 사용된다
- **When** 시맨틱 역할에 따라 전체 사용처를 옮긴다
- **Then** 이전 퍼플·민트 토큰 참조가 남지 않고 화면의 핵심 행동이 Deep Plum으로 구분된다

### AC-3: 검증

- **Given** 새 팔레트가 적용된 상태
- **When** 타입·테스트·시뮬레이터 화면과 상호작용을 확인한다
- **Then** 오류와 주요 회귀가 없고 증빙을 남긴다

## Screens / routes

전 탭, 온보딩, 가이드, 다이어리, 지도, 설정.

## Risks & dependencies

다크 화면에서 Deep Plum과 기존 배경의 대비가 부족할 수 있으므로 밝은 브랜드 변형을 별도 사용한다.

## 사용자 피드백 반영 — 2026-10-10

첫 적용 후 밝은 화면의 배경이 붉게 보인다는 피드백을 받았다. 기본 캔버스와 검색창 같은 연한 표면을 흰색에 가까운 중립색으로 조정하고, 탐색·다이어리·마이페이지에서 확인한다. Deep Plum의 집중 역할은 유지한다.
