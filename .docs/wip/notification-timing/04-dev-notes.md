---
feature-slug: notification-timing
author: chris
status: in-progress
---

# Dev notes

## Implemented ACs

| AC   | Status               | Files                                                                                          |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------- |
| AC-1 | Done in code         | `20261003000000_create_notification_jobs.sql`, `process-notification-jobs`, `send-notice-push` |
| AC-2 | Done in code         | `visitStore.ts`, visits migration, `process-notification-jobs`                                 |
| AC-3 | Done in SQL schedule | existing recommendation cron must be replaced with daily 02:30 UTC gate                        |
| AC-4 | Done in code         | `notification_jobs.dedupe_key`, claim update                                                   |

## Implementation decisions

- 공지와 신규 전시는 DB trigger로 큐에 넣어 외부 webhook 누락에도 큐 생성이 유지되도록 했다.
- 기존 `send-notice-push` webhook은 남아 있어도 동일 dedupe key로 중복 큐를 만들지 않는다.
- 관람 종료 시 `visits.visit_ended_at`을 저장하고 DB trigger가 즉시 리뷰 작업을 만든다.
- 서버 D-1 마감 알림과 중복되는 로컬 신규 예약은 제거했다. 북마크 해제 시 기존 예약 취소는 유지한다.

## Changed files

- `supabase/migrations/20261003000000_create_notification_jobs.sql`
- `supabase/functions/process-notification-jobs/index.ts`
- `supabase/functions/send-notice-push/index.ts`
- `src/store/visitStore.ts`
- `src/types/database.types.ts`
- `app/(explore)/[id].tsx`
- `src/utils/notificationScheduler.ts`
- `app/_layout.tsx`

## Required production setup

1. Apply migration.
2. Deploy `process-notification-jobs` and the changed `send-notice-push` function.
3. Register a cron calling `process-notification-jobs` every minute with `Authorization: Bearer <cron_secret>` (Vault `cron_secret` == function secret `CRON_SECRET`; deploy with `--no-verify-jwt`). See `.docs/BACKEND.md` §2.8.
4. Unschedule `mollip-visit-reminders` and `mollip-venue-follow` to avoid stale duplicate/late sends.
5. Keep `mollip-bookmark-deadline` for D-1 and replace recommendations with the daily 02:30 UTC gated job.

## Blockers for Taylor (QA)

- Remote Supabase migration and Edge Function deployment require project access.
- Real push delivery requires a physical device with a valid Expo token.
