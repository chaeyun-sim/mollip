---
feature-slug: artwork-share
tier: M
author: john
status: approved
---

# Spec — AI 해설 공유 카드

## Problem

- `description.tsx`(AI 해설 화면)에 공유 기능이 없음
- 사용자가 작품 감상 경험을 SNS에 공유하고 싶어도 방법이 없음
- 전시 상세(`[id].tsx`)의 카카오 공유와 달리, 해설 화면은 작품/AI 해설 중심의 공유가 필요

## Goals

- AI 해설 완료 후 작품 감상 경험을 카카오/기본 공유로 공유
- 카카오: 작품 이미지 + 해설 첫 문장 요약 + "mollip에서 감상했어요" 텍스트
- 카카오 미설치 또는 실패 시 기본 Share API fallback

## Non-goals

- 해설 스트리밍 중 공유 (완료 후에만 활성화)
- 공유 이미지 커스텀 카드 생성 (별도 작업)
- 인스타그램 / 트위터 직접 공유

## Acceptance Criteria

### AC-1: 공유 버튼 노출

- **Given** AI 해설 스트리밍이 완료된 상태
- **When** description 화면 하단 플레이어 영역을 본다
- **Then** 하단 버튼 행(채팅·플레이·재생목록)에 공유 버튼이 표시된다

### AC-2: 해설 스트리밍 중 버튼 숨김

- **Given** AI 해설이 스트리밍 중(`isTyping === true`)
- **When** 하단 버튼 행을 본다
- **Then** 공유 버튼이 표시되지 않는다 (채팅 버튼과 동일 조건)

### AC-3: 카카오 공유

- **Given** 카카오톡이 설치되어 있고 공유 버튼을 탭한다
- **When** `shareFeedTemplate` 호출 성공
- **Then** 카카오 공유 시트에 작품명(title), 해설 첫 문장(description), 작품 이미지(imageUrl)가 노출된다

### AC-4: 기본 공유 fallback

- **Given** 카카오 공유가 실패하거나 카카오톡 미설치
- **When** 공유 버튼을 탭한다
- **Then** 기본 Share API로 작품명 + 해설 첫 문장 + "mollip에서 감상했어요" 텍스트 공유

## Screens / Routes

| 파일 | 변경 |
|------|------|
| `app/(guide)/description.tsx` | 공유 버튼 추가 + 공유 핸들러 구현 |

## Feature Breakdown (for Chris)

1. AC-1/AC-2: 하단 버튼 행의 재생목록 자리(우측 `w-9`) 맞은편 왼쪽(현재 채팅 버튼 자리) 구조를 유지하면서, 우측 `w-9` 영역에 공유 버튼 추가. 채팅 버튼은 그대로 좌측 유지.
   - 현재 구조: `[채팅 w-9] [플레이 w-16] [재생목록 w-9]`
   - 변경 후: `[채팅 w-9] [플레이 w-16] [공유 w-9]` (재생목록은 몰입 모드 시 공유 위에 겹치지 않게 처리)
   - 실제로는 우측 `w-9`에 공유 버튼만 두고, 몰입 모드일 때는 재생목록 버튼을 공유 버튼 대신 표시
2. AC-3/AC-4: `handleShare` 함수 — `shareFeedTemplate` 시도 → 실패 시 `Share.share` fallback
   - title: `store.manualTitle || store.extractedText || '작품'`
   - description: `fullTextRef.current`의 첫 문장 (`.` 또는 `\n` 기준, 최대 80자)
   - imageUrl: `artworkImageUrl` (없으면 imageUrl 생략)
   - link: `{ mobileWebUrl: 'https://mollip.app', webUrl: 'https://mollip.app' }`
