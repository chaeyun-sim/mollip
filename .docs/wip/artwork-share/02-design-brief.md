---
feature-slug: artwork-share
author: sam
status: approved
---

# Design Brief — AI 해설 공유 카드

## Design Intent

기존 하단 플레이어 행의 레이아웃을 최대한 유지한다. 새 UI 없음 — 버튼 1개 추가.

## 버튼 위치

- 하단 `[채팅 w-9] [플레이 w-16] [우측 w-9]` 구조에서 우측 `w-9` 영역
- 몰입 모드 시 재생목록 버튼이 우선(공유 숨김), 비몰입 모드 시 공유 버튼 표시
- 아이콘: `Ionicons 'share-outline'`, size 26, color `#78716C` (채팅 버튼과 동일 스타일)
- `isTyping` 중에는 숨김 (채팅 버튼과 동일 조건)

## 공유 카드 콘텐츠 (카카오)

| 필드 | 값 |
|------|----|
| title | 작품명 (store.manualTitle \|\| store.extractedText \|\| '작품') |
| description | AI 해설 첫 문장 (최대 80자) + "\nmollip에서 감상했어요 🎨" |
| imageUrl | artworkImageUrl (없으면 생략) |
| link | https://mollip.app |
| button | '해설 들으러 가기' |

## 색상 / 폰트

기존 화면 그대로 (#171412 배경, #78716C 아이콘 색).

## Out of Design Scope

- 별도 공유 카드 미리보기 화면
- 공유 성공/실패 토스트
