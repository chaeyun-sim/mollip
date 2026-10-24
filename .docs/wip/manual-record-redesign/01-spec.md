---
feature-slug: manual-record-redesign
tier: M
author: Codex (John role; user-authorized execution exception)
status: approved
---

# Spec — 직접 기록 폼 디자인 개편

## Problem / Goals

포스터 옆 좁은 입력창과 placeholder만 있는 라벨을 개선하여 입력 순서와 필수 여부를 명확히 한다.

## Constraints / Non-goals

현재 DESIGN_SYSTEM과 공통 컴포넌트 사용. 저장/API/검색/인접 화면 개편 제외. 초기 제목 전달, trim, 선택값 유지. 사용자 후속 지시에 따라 전시 기간을 선택형 방문일 하나로 교체.

## Users & context

검색에 없는 전시를 바텀시트에서 직접 등록하는 사용자.

## Acceptance criteria

### AC-1: 전체 폼 재구성 및 기존 기록 흐름 유지

- **Given** 검색어를 입력하고 직접 기록을 연다.
- **When** 포스터·이름·장소·방문일을 확인하고 입력하거나 이름만 입력한다.
- **Then** 사용자가 조정한 큰 포스터 레이아웃과 상시 라벨, 전체 너비 입력창, 방문일 선택 하나, 브랜드 CTA를 표시한다. 공백 이름은 제출 불가하고 유효한 이름은 다음 화면에 전달한다. 방문일은 YYYY-MM-DD로 draft.dateKey에 전달하며 전시 기간에 저장하지 않는다. 미선택은 다음 화면에서 오늘 기본값, 선택은 오늘까지 허용, 선택 해제도 가능하다. 작은 화면과 키보드에서 스크롤 가능하다.

## Screens / routes

`src/components/record/ManualRecordForm.tsx`, `/diary/record`의 기존 시트.

## Risks & dependencies

BottomSheet 키보드/높이, 사진 권한, 네이티브 날짜 모달. 기존 워크트리 변경 보존.

## Open questions

없음. 사용자가 Codex 직접 수행 예외 승인.

## Feature breakdown

1. AC-1 프로토타입 → 시뮬 스모크 → QA.

G1: Pass.
