---
feature-slug: exhibition-alarm
author: sam
status: approved
---

# Design Brief — 전시 마감 알림

## Design intent

순수 로직 작업. 새 UI 없음. 알림 문구 컨벤션만 정의.

## 알림 문구

| 트리거 | title | body |
|--------|-------|------|
| D-7 | `{전시명}` | 북마크한 전시가 7일 후 마감이에요 |
| D-3 | `{전시명}` | 북마크한 전시가 3일 후 마감이에요 |
| D-1 | `{전시명}` | 북마크한 전시가 오늘 마지막이에요 |

- 발송 시각: 오전 10:00
- title은 전시 제목 그대로 사용 (잘림 방지를 위해 OS가 자동 처리)

## Out of design scope

- 알림 탭 핸들러 (딥링크)
- 알림 아이콘 커스텀
