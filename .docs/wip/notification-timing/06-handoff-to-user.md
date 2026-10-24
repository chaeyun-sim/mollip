---
feature-slug: notification-timing
author: manager
status: ready-for-user
---

# Handoff to user

## Summary

알림 발송 시점을 공통 지연 큐 기반으로 정리하고, 관람 종료 직후 리뷰 알림 경로를 추가했습니다. 기존 로컬 마감 알림 신규 예약은 제거해 서버 D-1 알림과의 중복을 없앴습니다. 원격 적용(마이그레이션, 함수 배포, cron 등록)은 끝났고, 공지 알림은 실기기 수신까지 확인했습니다.

## What changed

- 공지 1분 후 큐 발송 (처음 2분이었으나 1분으로 단축; cron이 매분 돌아 실제 도착은 1~2분)
- 신규 전시 10분 후 팔로워 발송
- 관람 종료 시 원격 종료 시각 저장 및 즉시 리뷰 큐 생성
- 추천 cron은 매일 11:30 KST 검사, 최근 3일 이내 발송 시 skip
- cron 호출 함수 3개(`process-notification-jobs`, `send-bookmark-deadline-reminders`, `send-recommendations`)의 인증을 `CRON_SECRET`으로 변경. 배포는 `--no-verify-jwt` 필수 (`.docs/BACKEND.md` §2.8)
- Expo 응답 오류 기록 강화

## Evidence

| Feature / AC  | tsc         | Screenshot | Interaction                    | Regression |
| ------------- | ----------- | ---------- | ------------------------------ | ---------- |
| 지연 큐(공지) | ✅ 0 errors | N/A        | ✅ 실기기 수신, 중복 해소      | ✅ tests   |
| 신규 전시     | ✅ 0 errors | N/A        | 미검증                         | ✅ tests   |
| 관람 종료     | ✅ 0 errors | N/A        | 미검증                         | ✅ tests   |
| 추천 주기     | ✅ 0 errors | N/A        | cron 등록 확인, 실행 결과 대기 | ✅ tests   |
| 마감 D-1      | ✅ 0 errors | N/A        | cron 등록 확인, 실행 결과 대기 | ✅ tests   |

## Open questions

- 마감(01:00 UTC = 10:00 KST)과 추천(02:30 UTC = 11:30 KST) cron은 2026-10-04에 인증 오류로 실패했습니다. 인증 변경 후 첫 실행 결과를 `net._http_response`에서 확인해야 합니다.
- 신규 전시 팔로워 알림과 관람 종료 리뷰 알림은 실기기에서 확인하지 못했습니다.
- 한 기기에서 계정을 바꾸면 같은 푸시 토큰이 두 계정에 남아 알림이 중복되던 문제는 DB 트리거(`claim_push_token`)로 해결했습니다. 이 트리거는 DB에만 있고 저장소 마이그레이션에는 없습니다.
- 로그아웃 시 푸시 토큰을 지우지 않아, 로그아웃한 계정도 그 기기에서 알림을 받을 수 있습니다.
