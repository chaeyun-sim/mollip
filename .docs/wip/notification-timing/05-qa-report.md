---
feature-slug: notification-timing
author: taylor
status: partially-verified
---

# QA report

## Summary

- P0: 0 found
- Tier: L
- Date: 2026-10-03 (로컬 검증) · 2026-10-04 (원격 검증 반영)
- 원격 검증 근거는 Supabase SQL Editor 화면과 사용자가 알려 준 실기기 수신 결과다. 검증하지 못한 항목은 아래 "미검증"에 따로 적었다.

## QA checks

- Q1: `npx tsc --noEmit` — Pass (0 errors, 2026-10-04 재실행)
- Q2: `npm test -- --runInBand` — Pass (32 suites, 253 tests; `visitStore.markPending` 재현 테스트 3개 포함)
- Q3: Functional correctness — 공지 경로는 원격에서 끝까지 확인. 나머지 경로는 아래 "미검증" 참고
- Q4: UX — No UI changes
- Q5: Convention / code quality — prettier 통과(스테이징 파일), lint 오류 0
- Q6: Visual fidelity — Not applicable; no UI changes
- Q7: Interaction — 공지 푸시 실기기 수신 확인(사용자 보고). 그 외 경로는 미검증
- Q8: Regression — Existing test suite pass
- Q9: Performance — Queue batch capped at 50 jobs; push batches capped at 100

## AC matrix

| AC   | Q1 tsc | Q2 jest | Q3 bug                           | Q4 UX | Q5 conv | Q6 visual | Q7 interact                   | Q8 regress | Q9 perf |
| ---- | ------ | ------- | -------------------------------- | ----- | ------- | --------- | ----------------------------- | ---------- | ------- |
| AC-1 | ✅     | ✅      | ✅ 공지(notice) 경로 원격 확인   | N/A   | ✅      | N/A       | ✅ 공지 / ❌ 신규 전시 미검증 | ✅         | ✅      |
| AC-2 | ✅     | ✅      | 코드·타입 확인, 원격 실행 미검증 | N/A   | ✅      | N/A       | 미검증                        | ✅         | ✅      |
| AC-3 | ✅     | ✅      | cron 등록 확인, 실행 결과 대기   | N/A   | ✅      | N/A       | 미검증                        | ✅         | ✅      |
| AC-4 | ✅     | ✅      | ✅ `dedupe_key`·원자적 claim     | N/A   | ✅      | N/A       | ✅ 중복 수신 해소(아래)       | ✅         | ✅      |

## 원격 검증 결과 (2026-10-04)

- cron 목록: `mollip-process-notification-jobs` `* * * * *`, `mollip-recommendations` `30 2 * * *`, `mollip-bookmark-deadline` `0 1 * * *`, 모두 active. 기존 `mollip-visit-reminders`, `mollip-venue-follow`는 목록에 없음.
- 트리거 3개(`notices`, `exhibitions`, `visits`) 존재 확인.
- 공지 작업: `pending` → `sent`, `attempts` 2, `last_error` NULL. 1분 지연 적용 후 도착까지 약 1분 35초(사용자 보고).

## Findings

### P0 (ship blocker)

- None.

### 발견 후 해결한 문제

| 증상                                                  | 원인                                                                                                  | 조치                                                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 처리 cron이 매분 `401 Invalid JWT`                    | Vault의 `service_role_key`가 플레이스홀더였고, 이후엔 공개 키(`sb_publishable_`)가 들어 있었음        | cron 호출 함수 3개를 `CRON_SECRET` 인증으로 변경하고 `--no-verify-jwt`로 배포. Vault에 `cron_secret` 추가 |
| 공지 작업이 `failed` (`PUSH_TOO_MANY_EXPERIENCE_IDS`) | `profiles`에 다른 Expo 프로젝트(`@bysimune/aaa`)가 저장한 오래된 토큰이 있어 100건 배치 전체가 거절됨 | 해당 계정의 `push_token`을 비움                                                                           |
| 같은 알림이 2개 도착                                  | 한 기기에서 계정 2개가 같은 푸시 토큰을 가짐                                                          | 토큰 정리용 DB 트리거 적용(DB에만 있고 저장소에는 없음)                                                   |
| 공지 지연이 3분                                       | DB 트리거가 2분 지연이었고 cron이 매분 돌아 다음 분 경계까지 대기                                     | 1분 지연 마이그레이션 `20261004000000` 적용                                                               |

### P1

- 마감 알림(01:00 UTC)과 추천 알림(02:30 UTC)이 2026-10-04에 `401 Invalid JWT`로 실패했다(인증 변경 전). 인증 변경 후 첫 실행은 아직 관찰하지 못했다.
- `venue_follow`(신규 전시 10분 후)와 `visit_review`(관람 종료)는 실기기에서 확인하지 못했다.
- `notification_logs`에 알림이 정상 기록되는지는 확인하지 못했다.

### 알려진 한계 (후속 작업)

- `sendAndLog`는 배치 중간에 실패하면 앞 배치는 이미 발송됐는데 `notification_logs`는 맨 끝에서 쓴다. 다른 프로젝트 토큰이 섞이면 배치 전체가 거절된다.
- 처리 중 함수가 중단되면 작업이 `processing`으로 남고 복구 경로가 없다.
- `profilesWithTokens`는 페이지 처리가 없어 `max_rows = 1000`에 걸린다(`supabase/config.toml`; 호스팅 프로젝트 값은 확인하지 못함).
- `supabase/functions/`의 새 로직에는 자동 테스트가 없다.

## Evidence

| ID  | Path                                                 | Description                                           |
| --- | ---------------------------------------------------- | ----------------------------------------------------- |
| Q1  | `npx tsc --noEmit`                                   | 0 errors                                              |
| Q2  | `npm test -- --runInBand`                            | 32 suites / 253 tests passed                          |
| Q2  | `src/store/__tests__/visitStore.markPending.test.ts` | 수정 전 2건 실패(재현), 수정 후 3건 통과              |
| Q3  | Supabase `cron.job`, `net._http_response`            | cron 3개 active, 처리 함수 응답 200, 공지 작업 `sent` |

## Recommendation

- [ ] Ready for Manager handoff — 마감·추천 cron 실행 결과와 `venue_follow`·`visit_review` 실기기 확인 후
- [x] 공지 경로는 사용 가능. 나머지는 위 P1 확인 필요
