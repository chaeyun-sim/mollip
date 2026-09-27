---
feature-slug: usr-05-force-quit-purchase
author: alex
iteration: 2
verdict: Pass
written: retroactive (G3 skipped in round 2; iteration 1 was the first G3 review)
---

# Design review

## Iteration 2

검토 대상: `.docs/wip/usr-05-force-quit-purchase/02-design-brief.md` (Sam, 2회차)
대조 기준: `.docs/DESIGN_SYSTEM.md`, `.docs/rules/component-convention.md` §2·§8·§11, `01-spec.md` §4.1~§4.5
참고: `app/settings/premium.tsx`는 아직 브리프에 맞춰 수정되지 않았다. 이번 판정은 브리프 자체를 대상으로 하며, 코드는 브리프가 구현 불가능한 경우에만 지적한다(해당 없음).

### Verdict

- **Pass**
- Iteration: 2 / 3

1회차 블로커 3건이 모두 해소됐다. 배너 판정이 우선순위 1~6으로 상호 배타적으로 정리됐고(02-design-brief.md:48-57), 요소별 동작표가 결제·라디오·복원·닫기 네 요소를 모든 상태에 대해 닫는다(02-design-brief.md:61-71). `01-spec.md` §4.3(:113-119)도 브리프를 정본으로 가리키며 조건이 일치한다. 남은 항목은 모두 경미해 구현 단계에서 반영하면 된다.

### Scores (1–5)

| Dimension            | Score | Notes                                                                                                                                                             |
| -------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens       | 4     | 새 토큰·새 컴포넌트 없음. 라디오 비활성 `opacity-40`이 D-3(:77)에 정의됐으나 Tokens 섹션(:35)에는 빠져 있음(m-2). 하단 바 `primary-dark` 충돌은 범위 밖 기록 유지 |
| Layout & IA          | 5     | 우선순위 목록 + 요소별 표로 상태 공간이 닫힘. SDK 응답 대기 중 재진입(4)·복원 중·로딩/오류 행 추가. `isCheckingStatus`가 문구를 유지한다는 규칙 명시(:57)         |
| Copy & tone          | 4     | B-2·B-3 문구가 실제 가능한 행동으로 수정됨. 타임아웃 문구 해요체 통일. 결제 버튼 힌트가 모든 확인 필요 상태에 "이전 구매"라고 말하는 점만 부정확(m-1)             |
| Accessibility        | 4     | 라디오 시각·`accessibilityState` 일치, 결제 버튼 `accessibilityHint` 추가, `announceForAccessibility` 미사용 근거 명시(:97). 44pt 터치 타겟 유지                  |
| **Weighted overall** | 4.25  | 가중치 미정의 → 4개 차원 동일 가중 평균                                                                                                                           |

Pass rule: overall ≥ 4.0 and no dimension &lt; 3. → overall 4.25, 최저 4로 **Pass**.

### Iteration 1 blockers — 해소 여부

- [x] **B-1 SDK 응답 대기 중 재진입 상태 + 우선순위** — 우선순위 4 `isPendingTransaction && isPurchaseInFlight`(02-design-brief.md:53)와 표 행(:69)이 추가됐다. 배너 "결제 처리가 아직 끝나지 않았어요…" + 상태 확인 버튼이 노출되므로 1회차에 지적한 "이유 없이 눌리지 않는 결제 버튼" 상태가 사라진다. 재진입 시 `purchaseStatus`가 `'idle'`로 초기화되더라도 우선순위 2·3을 건너뛰고 4에 걸리므로 경로가 맞다. `beginPurchaseAttempt`가 `isPending`과 `isPurchaseInFlight`를 함께 세우고(01-spec.md:97) 자동·명시 해제가 in-flight 중에는 표식을 지우지 않으므로(01-spec.md:110-111), "in-flight이지만 pending 아님" 조합은 발생하지 않는다. 판정 우선순위(:48-55)와 `isCheckingStatus` 처리(:57)도 명시됐다. spec §4.3(:117)이 같은 순서로 정렬됐다.
- [x] **B-2 in-flight 토스트** — "결제 처리가 아직 끝나지 않았어요. 잠시 후 다시 확인해 주세요."(:89). 사용자가 실제로 할 수 있는 행동(기다렸다가 다시 확인)만 요구한다.
- [x] **B-3 미활성 토스트** — "완료된 구매가 확인되지 않았어요. 필요하면 다시 구매해 주세요."(:90). 해제 후 결제 버튼이 다시 활성화되는 실제 상태와 맞고, 01-spec §4.5(:128)의 중복 구독 미검증 위험을 고려해 단정하지 않는 표현을 택한 근거도 적혀 있다.

### Iteration 1 suggestions — 반영 여부

- [x] S-1 라디오 비활성 시각 표현 — D-3(:77), 선택되지 않은 플랜만 `opacity-40`
- [x] S-2 상태표 완결성 — 복원 중(:66), 로딩/오류(:64) 행 추가
- [x] S-3 닫기 정책 근거 — 표(:67-68)와 spec §4.3(:119)에 NET-03·NET-06 유지 반영
- [x] S-4 문체 통일 — "…계속 확인돼요"(:85)
- [x] S-5 배너 등장 알림 — D-5 `accessibilityHint`(:79, :97), announce 미사용 근거 명시
- [x] S-6 게이트 누락 기록 — 사후 작성 고지에 G2·G3 누락 모두 기록(:11)
- [ ] S-7 (범위 밖) 하단 바 토큰·`primary-dark` 충돌 — 별도 카드 대상으로 유지

### Minor (구현 시 반영 권장, 재검수 불필요)

1. **m-1 결제 버튼 힌트 문구 범위.** 힌트 "이전 구매 상태를 먼저 확인해 주세요."(:91, :97)는 우선순위 2~5 전체에 적용되는데, 타임아웃·불확실·처리 대기는 "이전" 구매가 아니다. "결제 상태를 먼저 확인해 주세요."처럼 모든 상태에 맞는 문구로 바꾸거나, 우선순위 5에서만 현재 문구를 쓰도록 명시할 것.
2. **m-2 Tokens 섹션 단일화.** 라디오 비활성 `opacity-40`(비선택 플랜만)을 Tokens의 비활성 항목(:35)에도 적어 토큰 정의를 한곳에서 찾을 수 있게 할 것.
3. **m-3 라디오 비활성 표현 구현 방식.** D-3은 "비활성이면서 선택되지 않은 플랜"에만 불투명도를 적용하는 조건부 클래스다. 구현 시 component-convention §3에 따라 `cn()`으로 조합할 것(템플릿 리터럴 금지).

### Handoff

- Pass → **Chris (Dev)** may start implementation (after prototype smoke if required). m-1~m-3은 구현 단계에서 반영.

---

## Iteration 1 (기록)

frontmatter(당시): `iteration: 1`, `verdict: Fail`

검토 대상: `.docs/wip/usr-05-force-quit-purchase/02-design-brief.md` (Sam, 사후 작성)
대조 기준: `.docs/DESIGN_SYSTEM.md`, `.docs/rules/component-convention.md` §2·§8·§11, `01-spec.md` §2·§4.3·AC-4·AC-6·AC-7, 현재 구현 `app/settings/premium.tsx`, `src/hooks/usePremiumPurchase.ts`

### Verdict

- **Fail**
- Iteration: 1 / 3

§0 사후 검수(S1~S5)는 현재 코드 결함을 정확히 짚었고, 새 컴포넌트·새 토큰 없이 기존 배너 슬롯을 재사용한다는 방향도 타당하다. 다만 상태표가 상태 조합과 우선순위를 정의하지 않아 D2와 같은 "조용히 비활성된 결제 버튼" 상태가 다시 생길 수 있고, 신규·재사용 토스트 문구 두 개가 실제 동작과 맞지 않는다.

### Scores (1–5)

| Dimension            | Score | Notes                                                                                                                                                                                                                 |
| -------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens       | 4     | 기존 배너·버튼 토큰 재사용, 새 토큰 없음. 다만 플랜 라디오 비활성 시각 토큰이 정의되지 않았다(S-1 참고). 하단 바 `bg-[#171412]` 위 `bg-primary-dark` 조합은 DESIGN_SYSTEM.md:92와 충돌하나 기존 코드이며 이번 범위 밖 |
| Layout & IA          | 3     | 상태표 행이 상호 배타적이지 않은데 우선순위가 없음. "SDK in-flight인 채 화면 재진입" 상태가 누락되어 막다른 상태 발생(B-1). 복원 중·상품 로딩/오류 상태 행 없음                                                       |
| Copy & tone          | 3     | 신규 토스트가 실제 상황과 맞지 않는 행동을 요구(B-2), 재사용 토스트가 사라진 버튼을 다시 누르라고 안내(B-3). 타임아웃 배너의 해요체·합니다체 혼용                                                                     |
| Accessibility        | 3     | 상태 확인 버튼 44pt·role·label·state는 양호. 플랜 라디오는 `accessibilityState`만 맞추고 시각적 비활성 표현이 없음. 재실행 후 나타나는 배너의 스크린리더 알림 정의 없음                                               |
| **Weighted overall** | 3.25  | 가중치 미정의 → 4개 차원 동일 가중 평균                                                                                                                                                                               |

Pass rule: overall ≥ 4.0 and no dimension &lt; 3. → overall 3.25로 **Fail**.

### Previous issues addressed

- [x] S1 — D-1로 "이전 구매" 배너를 in-flight가 아닐 때만 노출 (02-design-brief.md:56, 01-spec §4.3과 일치)
- [x] S2 — "구매 진행 중(저장 대기 + SDK 대기)" 행에서 닫기 비활성 명시 (02-design-brief.md:48, AC-6과 일치)
- [x] S3 — D-2로 배너 문구를 JSX 밖 단일 문자열로 계산 (§11.2 준수, 현재 위반 위치 `premium.tsx:258-262`)
- [ ] S4 — 비활성 조건은 맞췄으나 시각적 비활성 표현이 없어 "눌리는 것처럼 보이지만 아무 일도 없는" 문제가 그대로 남음 (아래 S-1)
- [x] S5 — 기존 배너 레이아웃·토큰 유지

(1회차 줄 번호는 당시 브리프 1회차 기준이다.)

### Blockers (must fix)

1. **상태표에 "SDK in-flight 중 화면 재진입" 상태가 없고, 이 상태가 D2와 같은 막다른 화면이 된다.** (02-design-brief.md:45-52)
   - 경로: 타임아웃 행은 닫기를 허용하고(02-design-brief.md:49), 배너 문구도 "화면을 나가도 결과는 계속 확인됩니다"로 이탈을 권한다(02-design-brief.md:65). 타임아웃 후에는 `finally`에서 `isPurchasing`이 false가 되고(`usePremiumPurchase.ts:326`), 화면을 나갔다 다시 들어오면 `purchaseStatus`는 로컬 state라 `'idle'`로 초기화된다(`usePremiumPurchase.ts:59`). 반면 01-spec §4.3·AC-7에 따라 전역 `isPurchaseInFlight`는 SDK가 settle할 때까지 true로 남는다.
   - 결과: `isPendingTransaction && !isPurchaseInFlight`가 false라 배너·상태 확인 버튼이 없고, 결제 버튼은 `isPendingTransaction` 때문에 비활성, Indicator도 없다. 사용자는 이유 없이 눌리지 않는 결제 버튼만 보게 된다 — AC-4가 막으려던 D2와 같은 침묵이다.
   - 요구: 이 조합을 상태표에 별도 행으로 추가하고 배너·결제·라디오·복원·닫기를 정의할 것(예: "결제를 처리하고 있어요" 류 배너 + 결제 버튼 Indicator, 상태 확인 버튼 노출 여부 명시). 01-spec §4.3의 배너 조건과 충돌하면 Manager를 통해 spec 정정 요청을 함께 남길 것.
   - 아울러 상태표 행들이 상호 배타적이지 않으므로(예: `timedOut` + `isPendingTransaction`, `uncertain` + `isPendingTransaction`, 모든 상태 + `isCheckingStatus`) **판정 우선순위**를 표 위에 명시할 것. "상태 확인 중" 행(02-design-brief.md:52)은 배너 문구가 유지되는지, 어느 상태의 문구인지도 적을 것.

2. **신규 토스트 "결제가 아직 진행 중이에요. 결제를 마친 뒤 다시 확인해 주세요."가 사용자가 할 수 없는 행동을 요구한다.** (02-design-brief.md:68)
   - 이 토스트는 in-flight 중 상태 확인을 눌렀을 때만 뜬다. in-flight 중 상태 확인 버튼이 보이는 경우는 타임아웃 배너가 있을 때뿐이며(uncertain은 SDK settle 이후에 설정됨, `usePremiumPurchase.ts:274`, `:293`), 그때 결제 시트는 이미 닫혀 있거나 시트가 화면을 덮고 있어 버튼을 누를 수 없다. 즉 토스트가 실제로 보이는 상황에서는 사용자가 "마칠" 결제가 화면에 없다.
   - 또한 기존 토스트 `'결제가 진행 중이에요. 상태를 확인해 주세요.'`(`usePremiumPurchase.ts:296`)와 표현이 거의 같은데 요구 행동은 정반대(확인하라 vs 마친 뒤 확인하라)라 혼동된다.
   - 요구: 행동 지시를 실제 가능한 것으로 바꿀 것. 예: "결제 처리가 아직 끝나지 않았어요. 잠시 후 다시 확인해 주세요."

3. **"미활성" 토스트가 사라진 버튼을 다시 누르라고 안내한다.** (02-design-brief.md:69)
   - 명시 확인 결과가 inactive(in-flight 아님)면 표식·pending을 해제하고 `purchaseStatus`를 `'idle'`로 되돌려(`usePremiumPurchase.ts:364-368`, 01-spec §4.2) 배너와 상태 확인 버튼이 사라지고 결제가 다시 활성화된다. 그런데 문구는 "잠시 후 다시 상태를 확인해 주세요"라고 안내한다.
   - "(기존)"으로 표기되어 있지만, 이번 라운드에서 "이전 구매" 경로에도 적용되는 문구이므로 브리프가 정확성을 책임져야 한다.
   - 요구: 해제 후 실제로 가능한 행동을 반영할 것. 예: "완료된 구매가 없어요. 다시 구매할 수 있어요." (01-spec §4.5의 중복 구독 미검증 위험을 고려해 표현 강도는 Manager 판단 필요 — 확인 필요 항목으로 남길 것)

### Suggestions (nice to have)

1. **S-1 플랜 라디오 비활성 시각 표현 정의.** 현재 라디오에는 비활성 스타일이 없다(`premium.tsx:207-212`). Tokens 섹션(02-design-brief.md:32)에 결제 `opacity-50`, 복원·닫기 `opacity-40`만 있고 라디오가 빠져 있다. 선택된 플랜은 유지하되 비선택 플랜을 `opacity-40`으로 낮추는 등 한 가지를 정해 D-3(02-design-brief.md:58)에 명시할 것. 이 항목이 정의되지 않으면 S4는 스크린리더 사용자에게만 해소된다.
2. **상태표 완결성.** "복원 중(`isRestoring`)" 행과 "상품 로딩/오류(`loadState`)" 행을 추가하면 버튼 5종의 동작이 표 하나로 닫힌다. 현재 코드상 복원 중에는 결제·복원·닫기 모두 비활성이다(`premium.tsx:102-109`).
3. **닫기 정책 근거 정리.** 01-spec §4.3은 닫기 차단 조건을 `isPurchasing`만 적었고, 브리프는 uncertain 중 차단(NET-03)을 유지한다(02-design-brief.md:50). 브리프 쪽이 맞으므로 spec §4.3에 NET-03 유지를 반영하도록 Manager에게 전달할 것.
4. **타임아웃 배너 문체 통일.** "화면을 나가도 결과는 계속 확인됩니다"만 합니다체다(02-design-brief.md:65). "…계속 확인돼요"로 해요체를 맞출 것. B-1 해결 방식에 따라 "나가도 된다"는 안내 자체가 유지될지도 함께 판단할 것.
5. **배너 등장 알림.** 재실행 후 화면 진입 시 배너가 이미 떠 있으므로 스크린리더 사용자는 결제 버튼이 왜 비활성인지 알기 어렵다. 결제 버튼 `accessibilityHint`에 비활성 사유를 넣거나, 배너 등장 시 `AccessibilityInfo.announceForAccessibility`로 알리는 방식 중 하나를 정의할 것.
6. **게이트 누락 기록 보강.** 사후 작성 고지(02-design-brief.md:10)는 G2 누락만 적었다. 01-spec §0.2-1처럼 G3(Alex)도 건너뛰었음을 함께 적고, 이 문서가 첫 G3 검수라는 점을 연결할 것.
7. **(범위 밖, 기록만)** 하단 바 `bg-[#171412]`(`premium.tsx:254`)는 `bg-bg-dark` 토큰으로 대체 가능하고, 그 위의 `bg-primary-dark` 결제 버튼은 DESIGN_SYSTEM.md:92 "다크 배경 위 primary-dark 금지"와 충돌한다. 이번 기능 범위가 아니므로 별도 카드로만 남길 것.

### Handoff

- Fail → **Sam (Design)** updates `02-design-brief.md` (B-1 상태표 행 추가·우선순위, B-2·B-3 문구 수정, S-1 라디오 비활성 토큰)
