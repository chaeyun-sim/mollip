---
feature-slug: museum-p0-chat
author: sam
status: pass
---

# Design brief — 채팅 기록 저장 + 해설 없이 채팅

## Design intent

- 채팅 내역은 카드 형태로 분리해 일기/티켓 화면에 자연스럽게 녹아들도록 한다.
- "바로 질문하기"는 보조 액션으로 기존 "해설 생성" 버튼보다 시각적으로 낮은 위계를 갖는다.
- 캡션 입력은 선택 사항임을 확실히 하여 입력 부담을 줄인다.

## Tokens (defaults)

- Background: `#F8F6F2` / `#1C1917` (현재 앱 다크 배경 유지)
- Ink: `#1C1917` / `#E8E8E8`
- Muted: `#A8A29E` / `#57534E`
- User bubble: `bg-[#3B82F6]` (기존 채팅과 동일)
- Assistant bubble: `bg-[#1C1917]` / `border-[#292524]`
- Font: Pretendard (모든 텍스트)
- Radius: 버블 `rounded-2xl`, 카드 `rounded-xl`

## Layout & components

### A. diary/[date].tsx — 채팅 내역 섹션

| 영역 | 설명 | 재사용 컴포넌트 |
|------|------|-----------------|
| 섹션 헤더 | "채팅 기록" 레이블 + 작품 제목 | `Text` |
| 말풍선 목록 | 사용자/AI 역할에 따라 좌우 정렬 | `ScrollView` + `View` 버블 |
| 빈 상태 | 채팅 없을 때 숨김 (섹션 자체 렌더 안 함) | — |

말풍선 규칙:
- 사용자: 우측 정렬, `bg-[#3B82F6]`, `text-white`, `rounded-2xl rounded-tr-sm`
- AI: 좌측 정렬, `bg-[#292524]`, `text-[#E8E8E8]`, `rounded-2xl rounded-tl-sm`
- 폰트: `font-pretendard-regular text-[14px] leading-[20px]`
- 최대 너비: `max-w-[80%]`

### B. manual.tsx — 캡션 + 바로 질문하기

| 영역 | 설명 |
|------|------|
| 캡션 입력 (선택) | 다중 줄 `TextInput`, 라벨에 "(선택)" 표기, 높이 ~80px |
| "해설 생성" 버튼 | 현재와 동일, primary (파란색) |
| "바로 질문하기" 버튼 | secondary, `border border-[#3B82F6]`, `text-[#3B82F6]`, 배경 투명, 해설 생성 버튼 아래 `mt-2.5` |

## Copy (KO)

| Element | Text |
|---------|------|
| 캡션 라벨 | `캡션 / 메모` + `(선택)` |
| 캡션 placeholder | `전시장 캡션이나 메모를 입력하면 더 정확하게 질문할 수 있어요` |
| 바로 질문하기 버튼 | `바로 질문하기` |
| 채팅 섹션 헤더 | `채팅 기록` |
| 채팅 없음 | (렌더 안 함) |

## States

- Loading: 채팅 내역 로딩 — 없음 (메모리 즉시 로드)
- Empty: 채팅 내역 없음 → 섹션 미표시
- Error: 해당 없음 (읽기 전용)
- Success: 말풍선 목록 표시

## Accessibility

- 채팅 버블: `accessibilityRole="text"`, `accessibilityLabel={role === 'user' ? '내 질문: ' + text : 'AI 답변: ' + text}`
- "바로 질문하기": `accessibilityRole="button"`, `accessibilityLabel="해설 없이 채팅으로 바로 이동"`
- 캡션 입력: `accessibilityLabel="캡션 또는 메모 (선택)"`
- 터치 타깃: 버튼 `py-3.5` 유지 (~52pt)

## Prototype scope

- [x] Navigation wired
- [x] Fake data / stub API

## Out of design scope

- 채팅 내역 공유/복사
- 몰입 재생목록에서의 채팅 보기 (P1로 분리)
- 채팅 재개
