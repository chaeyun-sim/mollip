---
feature-slug: artwork-share
author: manager
status: done
---

# Handoff — AI 해설 공유 카드

## 완료 증거

| 기능 | tsc | 로직 | 회귀 |
|------|-----|------|------|
| AC-1 공유 버튼 (비몰입 완료 후) | ✅ 0 errors | `!isTyping && !isImmersive` 조건 | 몰입 모드 재생목록 정상 |
| AC-2 스트리밍 중 숨김 | ✅ | 채팅 버튼과 동일 `isTyping` 게이트 | — |
| AC-3 카카오 공유 | ✅ | `shareFeedTemplate` (작품명·해설첫문장·이미지·링크) | — |
| AC-4 기본 Share fallback | ✅ | catch → `Share.share` | — |

## 변경 파일

- `app/(guide)/description.tsx` — `Share` import 추가, `shareFeedTemplate` import 추가, `handleShare` 함수 추가, 하단 우측 버튼에 공유 버튼 추가

## 미포함 (별도 작업)

- 카카오 미설치 기기 실기기 검증 (시뮬레이터 불가)
- 공유 성공/실패 토스트
