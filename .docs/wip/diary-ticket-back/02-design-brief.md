---
feature-slug: diary-ticket-back
author: sam
status: approved
---

# Design brief — 티켓 뒷면 프로그램

## Intent

- **앞** = 입장권 (전시)
- **뒤** = **프로그램 스텁** (그날 들은 작품) — mollip 고유 데이터
- **♪** = 헤더 shortcut (모달)

## Back layout

| Zone | Content |
|------|---------|
| Header row | `오늘의 프로그램` (Pretendard-SemiBold 15) + `{n}작품` muted |
| List | Row: 40–48px thumb rounded-lg, index, title (2 lines max), preview 12px muted |
| Divider | dashed or hairline (ticket language) |
| Footer | `도슨트 일기` — Hahmlet or SemiBold 14, body Pretendard-Regular 15, generate link-style or small pill |

## Tokens

- Same as ticket front: `#1C1917`, `#57534E`, `#A8A29E`, stamp `#C2410C` unchanged on front
- Back list thumb fallback: `#E5E1D8` + `EmptyImagePlaceholder`

## Copy (KO)

| Key | Text |
|-----|------|
| program title | 오늘의 프로그램 |
| empty program | 이날 들은 작품이 없어요 |
| empty hint | 헤더의 ♪에서 목록을 확인할 수 있어요 |
| diary section | 도슨트 일기 |
| diary empty | 아직 메모가 없어요 |
| diary generate | 일기 부탁하기 |
| diary retry | 다시 부탁하기 |
| diary streaming | 도슨트가 메모를 작성 중이에요… |

Remove: `DOCENT'S DIARY`, `MUSEUM TICKET` on back header (stub footer EN optional keep for ticket fantasy).

## A11y

- Program row: `{index}번, {title}`
- Flip hints unchanged
