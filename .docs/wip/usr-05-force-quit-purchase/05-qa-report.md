---
feature: USR-05 결제 중 강제 종료
status: stopped-at-user-request-final-verification-incomplete
updated: 2026-09-25
---

## AC별 증빙

> 사용자 요청으로 추가 검증 중단. 아래 통과 결과는 1차 구현 기준이며, 이후 추가된 동시 실행 방어 및 reconciliation 테스트를 포함한 최종 코드의 통합 검증 결과는 확인하지 못했다. 최종 AC Pass 판정은 보류한다.

| AC   | 내용                            | tsc                            | 자동 테스트                                                                                     | 비고                                                                                       |
| ---- | ------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| AC-1 | 01-spec.md 정정                 | N/A(문서)                      | N/A                                                                                             | 코드 감사로 D1~D5 도출, 문서 반영 완료                                                     |
| AC-2 | 영속 쓰기 순서(await)           | ✅ `npx tsc --noEmit` 0 errors | ✅ `usePremiumPurchase.test.tsx` 42/42                                                          | purchasePackage 호출이 표식 저장 완료 후로 이동                                            |
| AC-3 | 저장 실패 Sentry breadcrumb     | ✅                             | ✅ (기존 실패 케이스 테스트가 catch 경로를 이미 실행, 정상 통과)                                | breadcrumb 자체의 전송 여부는 실제 Sentry 프로젝트 콘솔에서만 확인 가능 — 코드 경로만 검증 |
| AC-4 | premium.tsx pending 노출        | ✅                             | 전체 테스트 스위트(343/343) 통과 — 해당 화면 전용 유닛 테스트는 없음(기존에도 없었음)           | 시각적 렌더링은 Manual QA 항목(아래)                                                       |
| AC-5 | 포그라운드 복귀 시 pending 정리 | ✅                             | 간접 검증(전체 스위트 통과, `_layout.tsx`는 화면 컴포넌트라 전용 테스트 없음 — 기존에도 없었음) | 실기기 포그라운드 전환 시나리오는 Manual QA 항목                                           |

전체 검증:

```
npx tsc --noEmit          → 0 errors
npx prettier --check ...  → 모든 대상 파일 포맷 준수
npx eslint ...             → 0 경고/오류
npx jest                   → 36 suites / 343 tests 모두 통과 (exit 0)
```

## Manual QA Required (Pass로 표시하지 않음)

다음 항목은 실기기 + StoreKit Sandbox 계정 없이는 검증할 수 없다. 시뮬레이터에서는 RevenueCat이 Preview API Mode로 동작해 실제 결제 시트·트랜잭션 큐 동작을 재현하지 못하며, 이번 세션에서는 부팅된 시뮬레이터도 없어 화면 스크린샷조차 촬영하지 않았다 — 촬영하지 않은 항목을 확인한 것처럼 보고하지 않는다.

- [ ] **Manual QA Required** — 결제 시트 표시 직후(탭 전) 강제 종료 → 재실행 → pending 표식 유무 및 구매 가능 여부 확인
- [ ] **Manual QA Required** — 인증(Face ID/암호) 중 강제 종료 → 재실행 → RevenueCat 재조회 결과에 따른 권한 반영/미반영 확인
- [ ] **Manual QA Required** — Apple 승인 직후, RevenueCat 서버 응답 전 강제 종료 → 재실행 → StoreKit 미종료 트랜잭션이 다음 `Purchases.configure()`에서 재관찰돼 최종 entitlement가 반영되는지 실측(01-spec.md §4.7)
- [ ] **Manual QA Required** — AC-4 배너("이전에 진행하던 구매가 있어요…")가 실기기 프리미엄 화면에서 의도한 레이아웃으로 렌더링되는지 육안 확인(시뮬레이터 미부팅으로 이번 세션에서 스크린샷 미촬영)
- [ ] **Manual QA Required** — 저장 실패(AsyncStorage 쓰기 실패) 시 Sentry breadcrumb이 실제 Sentry 프로젝트에 도달하는지 — 코드 경로는 확인했으나 배포 환경 전송은 별도 확인 필요

## 구조적 차단 사항

- 이 리포지토리는 Expo 네이티브 모듈(RevenueCat)을 쓰므로 Expo Go로 실행 불가 — `expo run:ios` 개발 빌드가 필요하나 이번 세션에서는 수행하지 않았다(시간·시뮬레이터 부팅 상태 제약). 코드 변경은 tsc/lint/test로 정적 검증만 완료했다.
- 강제 종료 자체를 자동화 테스트로 재현하는 것은 iOS 프로세스 강제 종료 + StoreKit 트랜잭션 상태 제어가 필요해 Jest 유닛 테스트 범위를 벗어난다 — 위 Manual QA 항목으로 대체한다.
