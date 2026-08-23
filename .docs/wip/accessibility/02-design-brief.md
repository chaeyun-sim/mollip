---
feature-slug: accessibility
author: sam
status: approved
---

# Design Brief — 접근성 개선

## 설정 화면 추가 UI

### 텍스트 크기 행 (해설 생성 설정 섹션)
- 기존 `PillSelector`와 동일 패턴: `[소 | 중 | 대]`
- icon: `text-outline`

### 접근성 섹션 (신규, 알림 섹션 바로 아래)
- icon: `accessibility-outline` + label: `고대비 모드` + Switch (알림 토글과 동일 스타일)
- Switch: trackColor `{ false: '#E7E5E4', true: '#1C1917' }`, thumbColor `#FFFFFF`

## 고대비 색상 토큰

| 요소 | 일반 | 고대비 |
|------|------|--------|
| (guide) 화면 배경 | `#0C0A09 → #171412` 그라데이션 | `#FFFFFF` |
| 해설 텍스트 | `#e8e8e8` | `#000000` |
| 하단 플레이어 배경 | `#171412` | `#FFFFFF` |
| 플레이어 시간 텍스트 | `#78716C` | `#57534E` |
| AI 채팅 버블 배경 | `#1C1917` | `#F0EFED` |
| AI 채팅 텍스트 | `#e8e8e8` | `#000000` |
| 사용자 채팅 버블 | `#3B82F6` 유지 | `#3B82F6` 유지 (변경 없음) |
| 채팅 입력창 배경 | `#1C1917` | `#F0EFED` |
| 채팅 입력 텍스트 | `white` | `#1C1917` |

## FontSize 값
`small: 15, medium: 17, large: 20` (기존 유지)
고대비 모드 시 +2pt 오프셋.
