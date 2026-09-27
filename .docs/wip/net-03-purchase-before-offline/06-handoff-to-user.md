---
feature-slug: net-03-purchase-before-offline
author: manager
status: ready-for-user
---

# Handoff to user — NET-03

## Summary

NET-01의 uncertain(결제 결과 불확실) 상태 기계를 재검증한 결과, 요구사항 대부분은 이미 구현돼 있었고 **실결함 1건(닫기 버튼이 uncertain 상태에서 비활성화되지 않던 문제)을 발견해 수정**했다.

## What changed

- `app/settings/premium.tsx`: `isCloseDisabled`에 `isUncertain` 포함 — 결제 결과가 불확실한 동안 닫기(X) 버튼과 스와이프 뒤로가기를 차단
- `src/hooks/usePremiumPurchase.ts`: `handleRestore`에 `purchaseStatus === 'uncertain'` 가드 추가 — UI가 우회되더라도 훅 레벨에서 복원 호출을 막음
- `src/hooks/__tests__/usePremiumPurchase.test.tsx`: NET-03 시나리오 3개 신규 + 기존 2개 테스트에 `useSubscriptionStore.isPremium` 검증 보강

## Evidence

| Feature / AC                                     | tsc | Screenshot             | Interaction                                  | Regression       |
| ------------------------------------------------ | --- | ---------------------- | -------------------------------------------- | ---------------- |
| AC-1 오류→uncertain 통일                         | ✅  | —                      | jest 대체                                    | jest 전체 재실행 |
| AC-2 uncertain 중 차단(닫기 포함, **버그 수정**) | ✅  | `28-net03-premium.png` | ⚠️ 라이브 재현 실패(아래 블로커) — jest 대체 | jest 전체 재실행 |
| AC-3 상태확인 캐시무효화+분기                    | ✅  | —                      | jest 대체                                    | jest 전체 재실행 |
| AC-4 취소 안전 재시도                            | ✅  | —                      | jest 대체                                    | jest 전체 재실행 |

tsc exit 0, jest 30 suites / 312 tests 통과(real exit code). 상세는 `05-qa-report.md` 참고.

## Design QA

- 해당 없음(Tier S, UI 신규 요소 없음)

## Open questions

- (none)

## 남은 블로커 (정직하게 기재)

1. **실 Apple StoreKit 미검증**: NET-01/02와 동일 사유.
2. **이번 건의 uncertain 상태를 라이브로 직접 눈으로 확인하지 못함**: 결제 버튼 탭이 이 세션 후반부에 4회 재시도에도 반응하지 않아(Metro 로그에 신규 구매 호출 없음 확인) RevenueCat Test Store의 "Test failed purchase" 경로를 실제로 밟지 못했다. 시뮬레이터/cliclick 포커스 이슈로 추정되며, 같은 화면에서 플랜 선택 탭은 정상 동작했다(스크린샷 증빙). 닫기 버튼 비활성화 수정 자체는 코드 검토 + jest로 확인했지만, "실제로 화면에서 버튼이 흐리게 비활성화되는 모습"까지는 이번에 육안으로 재확인하지 못했다 — 가짜로 확인했다고 보고하지 않는다.

## User feedback

### UX feedback

-

### Evidence

-

### Triage

- [ ] Design → Design Agent
- [x] Dev → Dev Agent (필요 시 재시도 다음 세션에서 라이브 재현 권장)
- [ ] Spec → Manager Agent
- [ ] No change required

---

**확인 요청**

이번 건은 1건의 실결함(닫기 버튼 우회 가능성)을 발견해 수정했고 jest로 검증했습니다. 결제 버튼 탭을 통한 실제 uncertain 화면 육안 확인은 시뮬레이터 조작 이슈로 이번 세션에서 완결하지 못했습니다 — 필요하시면 다음 세션에서 재시도하겠습니다. 이견 없으시면 커밋 지시 주시면 됩니다.
