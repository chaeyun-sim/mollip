---
feature-slug: essay-generation
author: alex
revision: 2
iteration: 2
verdict: Pass
---

# Design review

## Rev2 Iteration 2 (current)

> Iteration 1의 Blocker 4건(§3~§6)에 대한 Sam의 수정안을 검증한다. 각 항목을 spec/브리프 원문과 직접 대조해 해소 여부를 판정하고, iteration 1에서 경계선이었던 §7과 신규 도입된 두 축(`essayInputMode` × `essayStage`)의 상태 조합을 추가로 점검한다.

### Verdict

- **Pass**
- Iteration: 2 / 3

### Scores (1–5)

| Dimension                            | Score    | Notes                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens                       | 5        | iteration 1에서 지적한 2건의 어림 서술(토글 inactive, 에러 보더 대비)이 실제 인접 배경 기준 정확한 재계산값(6.66:1, 3.49:1)으로 교체됨(§2 검증). 신규 색상/컴포넌트 언어 도입 없음.                                                                                                                                    |
| Layout & IA                          | 4        | Blocker 4건(§3~§6) 전부 해소 확인(아래 §1~§4 참고). 5점 미부여 사유는 §6에서 발견한 `essayInputMode`/`essayStage` 조합 중 일부(streaming+write, error+write)가 "불가능한 조합"이라는 점이 인과관계 서술로만 암시되고 명시적 불변식으로 선언되지 않은 잔여 리스크 때문 — must-pass 위반은 아니므로 Suggestion으로 하향. |
| Copy & tone                          | 5        | 변경 없음, 기존 톤과 일관.                                                                                                                                                                                                                                                                                             |
| Accessibility                        | 5        | §6(토글 selected 소스) Blocker 해소 + §7(44pt 터치 영역) 경계선이 폰트 크기 명시 + py-3.5 확정으로 완결됨(아래 §5 참고). Contrast 재계산도 정확.                                                                                                                                                                       |
| **Weighted overall (harmonic mean)** | **4.71** | 4/(1/5+1/4+1/5+1/5) = 4/0.85 ≈ 4.71 — Pass 기준(≥4.0) 충족, 항목별 3점 미만 없음, 미해결 Blocker 없음.                                                                                                                                                                                                                 |

Pass rule: overall ≥ 4.0 and no dimension < 3, **AND 미해결 Blocker가 없어야 함** — 모두 충족.

### §1 [Blocker 해소] multiline 입력과 키보드 "완료" 충돌 (iteration 1 §3 대응)

`02-design-brief.md` L82-90(`onEssayNext` 필드 주석)은 iteration 1이 제시한 두 대안 중 첫 번째("멀티라인 입력에서 엔터=줄바꿈을 유지하고, '완료' 키 트리거는 사실상 도달 불가능함을 인지한 채 '다음' 버튼을 주 경로로 명시")를 정확히 채택했다:

- `returnKeyType`/`onSubmitEditing`을 감상평 `TextInput`에 연결하지 않는다고 명시적으로 선언.
- "Chris는 이를 버그로 오인해 별도 대응을 시도할 필요 없음"이라고 명확히 의도를 문서화 — Chris가 rev1 패턴을 그대로 재사용해 Android에서 절반만 작동하는 위험을 원천 차단.
- AC-11 원문("키보드 '완료' 키를 누르거나 ... 누르면 ... 두 액션 중 어느 쪽을 사용하든 동일하게")은 OR 트리거로 읽을 수 있고, 스펙을 삭제·수정하지 않으면서 "다음" 버튼을 유일한 실질 경로로 문서화하는 것은 spec과 모순되지 않는다 — spec이 요구하는 "서명 단계 진입"이라는 결과 자체는 "다음" 버튼으로 항상 달성 가능하다.

**결론: §3 Blocker 완전 해소.**

### §2 [Blocker 해소] 에러 상태 카피 분기 prop (iteration 1 §4 대응)

`essayRetriesExhausted: boolean`(필수, optional 아님)이 Component contract에 추가됨(L73) — "essayStage==='error'일 때만 의미를 가지므로 optional이 아닌 필수 boolean으로 선언해 error 상태에서 값 누락을 방지한다"고 명시해 iteration 1 이전(rev1 iteration 2 Suggestion)의 optional 필드 회귀를 스스로 인지하고 수정했다.

- Copy 표(L111-112)가 `essayRetriesExhausted === false`/`=== true` 두 값에 정확히 문구를 매핑.
- States 섹션(L121)도 "`essayRetriesExhausted`에 따라 에러 메시지 문구가 전환된다 — `false`면 ..., `true`면 ..."으로 동일 매핑을 재서술 — Copy/States 양쪽 일관성 확인.

**결론: §4 Blocker 완전 해소.**

### §3 [Blocker 해소] spec 출처 오기재 정정 (iteration 1 §5 대응)

`01-spec.md` L155 원문("Chris 구현 판단(권장: ...)")과 `02-design-brief.md` L98을 직접 대조:

> "이 단일 카운터 방식은 `01-spec.md` Open questions 확정 섹션이 **Chris 구현 판단으로 위임하며 권장한 안**(...)을 **Sam이 디자인 확정값으로 채택한 것**이다 — spec 자체가 이 값을 확정한 것은 아니므로 **'spec 확정 사항'이 아니라 'Sam이 spec의 권장안을 채택함'으로 정확히 표기한다**."

iteration 1이 요구한 정확한 표현("Sam의 채택안(spec 권장을 따름)")과 사실관계·의도 모두 일치. spec 원문의 "권장" 문구를 왜곡 없이 인용했고, 위임 주체(Chris 구현 판단)와 실제 채택 주체(Sam)를 구분해 명시했다.

**결론: §5 Blocker 완전 해소.**

### §4 [Blocker 해소] 토글 `selected` 상태 소스 (iteration 1 §6 대응)

`essayInputMode: 'write' | 'generate'` 필드가 Component contract에 신규 추가됨(L69) — "essayStage(생성 진행 단계)와는 다른 축이므로 별도 필드로 분리한다"고 명시해 두 축의 독립성을 문서 스스로 인지하고 있다.

- States 섹션 "토글 선택 상태(`essayInputMode`)"(L123)가 전환 규칙을 완결 서술: 기본값 `'write'` → "생성하기" 탭 시 즉시 `'generate'`로 전환 → **생성 완료(`essayStage==='done'`) 후에도 `essayInputMode`는 `'generate'`로 유지**(자동으로 `'write'`로 돌아가지 않음) → 입력칸 직접 탭 또는 "직접 쓰기" 세그먼트(`onEssayWriteMode`)를 눌러야만 `'write'`로 복귀.
- Accessibility 섹션(L129)이 `selected={essayInputMode === 'write'}` / `selected={essayInputMode === 'generate'}`로 값의 소스를 §Component contract `essayInputMode`로 명시적으로 지정 — accessibilityState `selected`가 실제로 이 필드를 소스로 사용함을 확인.

**결론: §6 Blocker 완전 해소.**

### §5 "생성하기" 44pt 터치 영역 확정 검증 (iteration 1 §7 경계선 대응)

- 토글 텍스트 className이 `text-[14px] font-pretendard-medium`(line-height ≈ 20px)으로 명시됨 — iteration 1이 지적한 "폰트 크기 미지정" 문제 해소.
- 세로 패딩이 `py-3.5`로 확정(조건부 대안 없이 단일 값 선택) — "`py-3`(48px 미만 가능성)는 채택하지 않는다"고 명시해 iteration 1의 "어느 쪽을 택할지 확정하지 않았다" 지적에 정면 대응.
- 재계산: 20(텍스트) + 14(상)×2 = **48pt** ≥ 44pt(Apple HIG), 여유 **4pt** — 독립 재검증 결과 브리프의 산수와 일치. `py-3` 채택 시 20+12×2=44pt로 여유가 0이었을 것과 비교하면 `py-3.5` 선택이 타당하다.
- line-height 20px는 14px 폰트 대비 약 1.43배 비율로, Pretendard 서체의 통상적인 렌더링 범위 안에 있다(실측치는 아니나 iteration 1이 지적한 "폰트 크기 자체가 미지정"이라는 근본 문제는 해소됨).

**결론: §7 경계선 항목 해소. 44pt 계산이 문서 내에서 완결됨.**

### §6 신규 결함 점검 — `essayInputMode` × `essayStage` 상태 조합(4×2=8가지)

두 축이 늘어나며 이론상 8개 조합이 생긴다. 각 조합의 도달 가능성을 브리프 서술을 근거로 검증:

| essayStage | essayInputMode | 도달 가능?             | 근거                                                                                                                                                                                                                                         |
| ---------- | -------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| idle       | write          | ✅ 기본 상태           | States "일반"                                                                                                                                                                                                                                |
| idle       | generate       | ⚠️ 순간적(과도) 상태만 | "생성하기" 탭 시 mode가 즉시 generate로 바뀌고 곧바로 streaming 진입 — 지속되는 화면 상태로 존재하지 않음                                                                                                                                    |
| streaming  | generate       | ✅                     | States "잠금(streaming)" — 유일하게 정의된 streaming 조합                                                                                                                                                                                    |
| streaming  | write          | ❌ 불가능(암시적)      | streaming은 오직 onEssayGenerate 경유로만 진입하고, 그 경로는 항상 mode를 generate로 전환 — 하지만 이 불변식이 "streaming은 반드시 generate mode에서만 발생한다"는 형태로 명시적으로 선언되어 있지 않고, 인과관계 서술(L123)에서만 추론 가능 |
| done       | write          | ✅                     | 생성 완료 후 사용자가 입력칸을 탭하거나 "직접 쓰기"를 눌러 전환한 경우 — States "일반" 스타일 재사용, `selected` 값만 write로 바뀜(§6 대응 로직으로 커버)                                                                                    |
| done       | generate       | ✅ 기본 사후 상태      | "생성 완료 후에도 essayInputMode는 generate로 유지"                                                                                                                                                                                          |
| error      | generate       | ✅                     | "다시 시도" 경로(`onEssayRetry`는 onEssayGenerate와 동일 동작) — error는 항상 generate 시도 실패에서 발생하므로 자연스러운 조합                                                                                                              |
| error      | write          | ⚠️ 순간적(과도) 상태만 | "직접 쓰기로 전환"(`onEssayWriteMode`)을 누르면 "에러 상태가 해제되고" 동시에 mode도 write로 바뀌는 것으로 읽히나, essayStage가 정확히 어느 시점에 'idle'로 전환되는지 명시적 문장이 없다                                                    |

**판정**: 8가지 조합 중 6가지는 States/Component contract 서술로 명확히 커버되고, 나머지 2가지(streaming+write, error+write 지속 상태)는 브리프의 인과관계 서술상 애초에 도달 불가능한 조합으로 읽힌다 — 이는 논리적 결함이 아니라 브리프가 암묵적으로 올바르게 배제한 조합이다. 다만 "streaming은 generate mode에서만 발생한다"는 불변식이 문서에 한 문장으로 명시되지 않은 점은 Chris가 두 상태를 독립적으로 잘못 관리(예: `essayStage`만 boolean으로 토글하고 `essayInputMode`는 갱신하지 않는 버그)할 여지를 완전히 차단하지 못한다. **Blocker로 격상할 사안은 아니다** — 두 필드 모두 controlled 패턴으로 부모(`confirm-visits.tsx`)가 단일 소유하므로 실제 구현에서 두 필드를 동기화하는 것은 자연스러운 한 함수 내 로직이 될 가능성이 높다.

### Suggestions (nice to have)

1. `essayInputMode`와 `essayStage`의 결합 불변식("streaming/error(재시도 대기 아님) 상태는 항상 `essayInputMode==='generate'`에서만 발생한다")을 브리프 또는 `04-dev-notes.md`에 한 문장으로 명시할 것(§6 참고) — Chris 구현 시 두 필드를 하나의 전환 함수에서 함께 갱신하도록 유도.
2. (Iteration 1에서 이월, 여전히 유효) Copy 표의 에러 문구 매핑을 States 섹션에도 표로 한 번 더 명시.

### Handoff

- **Pass → Chris(Dev) 구현 시작 가능.**
- 남은 Suggestion 2건은 must-fix가 아니므로 구현을 막지 않는다 — 여유가 있으면 `04-dev-notes.md`에 메모 형태로 반영 권장.

---

## Rev2 Iteration 1 (archived)

> rev1은 Design QA Pass(iteration 3, 4.71/5)까지 완료됐으나 사용자 피드백으로 spec이 revision 2로 재설계됐다(한줄평+별도 3단계 감상생성 → 감상평 단일 입력칸 통합). 이 iteration은 rev2 `02-design-brief.md`에 대한 신규 검토이며, rev1의 검증 이력(대비 수치, hitSlop 계산 등)은 재사용 가능한 부분만 인용하고 나머지는 새로 검증했다.

### Verdict

- **Fail**
- Iteration: 1 / 3

### Scores (1–5)

| Dimension                            | Score    | Notes                                                                                                                                                                                                                                        |
| ------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens                       | 4        | 신규 색상/컴포넌트 언어 도입 없음, 명시된 대비 수치 4건 중 4건 모두 독립 재계산으로 정확함을 확인(§2). 다만 2건의 참조 배경 부정확/서술 부정확이 있어(§2) 5점은 보류.                                                                        |
| Layout & IA                          | 2        | 신규 Blocker 4건(§3~§6) — multiline 입력과 키보드 "완료" 충돌 미해결, Component contract 필드 개수 오기재 + 에러 카피 분기 prop 부재, spec이 "Chris 구현 판단"으로 남긴 사항을 "확정"으로 오기재, 토글 selected 상태를 구동할 prop 부재.     |
| Copy & tone                          | 5        | 기존 영수증 카드 톤 유지, Copy 표가 spec이 위임한 placeholder/버튼 문구를 정확히 확정. 변경 없이 통과.                                                                                                                                       |
| Accessibility                        | 2        | 대비 계산 자체는 정확하나(§2), 토글 "생성하기" 세그먼트의 44pt 터치 영역 확보가 브리프 스스로 "42~44px대"로 불확실성을 인정한 채 미확정이고(§7), accessibilityState `selected`를 구동할 소스가 Component contract에 없음(§6과 공유 Blocker). |
| **Weighted overall (harmonic mean)** | **2.76** | 4/(1/4+1/2+1/5+1/2) = 4/1.45 ≈ 2.76 — Pass 기준(≥4.0) 미달, Layout & IA·Accessibility 모두 3점 미만이라 이중으로 Fail.                                                                                                                       |

Pass rule: overall ≥ 4.0 and no dimension < 3, **AND 미해결 Blocker가 없어야 함** — 모두 미충족.

### AC 대응표 (AC-1~15)

| AC    | 브리프 반영 여부 | 비고                                                                                                                                  |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | ✅               | §Layout & components 표 1행, Copy 표 "감상평" 라벨/placeholder                                                                        |
| AC-2  | ⚠️ 부분          | 토글 UI 자체는 명시되나, 토글의 "selected" 상태를 구동하는 prop이 Component contract에 없음(§6)                                       |
| AC-3  | ✅               | onEssayGenerate 설명("idle/done/error 상태에서 모두 호출 가능")에 essayText 공백 여부 조건이 없음 — 비활성화 트리거 없음, 로직은 타당 |
| AC-4  | —                | 재료 조립 로직(비UI) — 브리프 범위 밖으로 타당                                                                                        |
| AC-5  | ✅               | States "잠금(streaming)" — `editable={false}`                                                                                         |
| AC-6  | ✅               | States "잠금(streaming)" — 스트리밍 델타가 `value`로 채워짐                                                                           |
| AC-7  | ✅               | States "일반" — "생성 완료 직후에도 이 상태로 돌아와 자유 편집 가능"                                                                  |
| AC-8  | ✅               | "다음" 버튼이 essayText 공백 여부와 무관하게 항상 노출/활성 — 별도 방지 로직 없음                                                     |
| AC-9  | —                | 재료 조립 로직(비UI) — 브리프 범위 밖으로 타당                                                                                        |
| AC-10 | ⚠️ 부분          | States "에러" 시각 상태는 명확하나, Copy 표의 에러 문구 2종(재시도 가능/소진)을 구분할 prop이 없음(§4)                                |
| AC-11 | ⚠️ 부분          | "다음" 버튼은 명확하나, 멀티라인 입력칸에서 "키보드 완료" 트리거가 실질적으로 작동 가능한지 브리프가 검토하지 않음(§3, Blocker)       |
| AC-12 | ✅               | States "잠금" — 토글/버튼 모두 비활성                                                                                                 |
| AC-13 | —                | 언마운트 정리 로직(비UI) — 브리프 범위 밖으로 타당                                                                                    |
| AC-14 | —                | 저장 로직(비UI) — 브리프 범위 밖으로 타당                                                                                             |
| AC-15 | ✅               | States "재생성 5회 소진", Copy 표 헬퍼 텍스트. 다만 카운터 증가 시점 서술에 오기재 있음(§5)                                           |

### §1 컴포넌트 분리(SRP) 검증 — Pass

- `EssayStageSection.tsx` 삭제 + `EssayInputSection.tsx`(named export, `src/components/archive/`) 신규 추출을 명시. `component-convention.md` §9.1/§9.4 요구 충족.
- `ReceiptSummary`는 pass-through 조립만 담당한다고 명시("로직 소유는 여전히 confirm-visits.tsx") — SRP(§4) 준수.
- 실제 `ReceiptSummary.tsx`(현재 288줄, rev1의 `EssayStageSection` 포함 상태)를 대조 확인한 결과, rev2 통합 후 예상 축소분(한줄평 TextInput 블록 + `<EssayStageSection ... />` 호출부가 `<EssayInputSection ... />` 단일 호출로 대체)이 §9.4 분리 신호를 재유발하지 않는 방향인 것도 확인됨.

**결론: 구조 분리 자체는 문제 없음.**

### §2 대비 수치 독립 재계산 (WCAG 2.1 relative luminance)

| 토큰 조합                                                       | 브리프 주장                                      | 독립 재계산                                                                                                                | 판정                                                                                                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text-error`(#EF4444) on 흰 배경                                | 3.76:1                                           | R_lin=0.8636, G_lin=B_lin=0.0578 → L=0.2291 → (1.05)/(0.2791)=**3.762:1**                                                  | ✅ 일치                                                                                                                                                                                                                     |
| `text-gray700`(#57534E) on 흰 배경                              | 7.63:1                                           | L=0.08754 → (1.05)/(0.13754)=**7.635:1**                                                                                   | ✅ 일치                                                                                                                                                                                                                     |
| `bg-primary-dark`(#625876) + `text-white`                       | 6.61:1                                           | L=0.1088 → (1.05)/(0.1588)=**6.613:1**                                                                                     | ✅ 일치                                                                                                                                                                                                                     |
| 토글 inactive `bg-gray200`(#F2EFE9) + `text-gray700`(#57534E)   | "순백 대비 7.63:1보다 **근소하게** 낮은 정도"    | `bg-gray200` L=0.8653 → (0.9153)/(0.13754)=**6.656:1**                                                                     | ⚠️ 부정확 — 7.63 대비 약 13% 낮음(0.97pt 차이), "근소하게"라는 서술은 실측과 어긋남. AA 4.5:1은 넉넉히 통과하므로 Blocker는 아니지만, 이 문서가 수치를 계산하지 않고 어림으로만 서술한 유일한 항목                          |
| 입력 박스 에러 보더(`border-error`, 2px) — 그래픽 요소 3:1 기준 | "3.76:1로 통과"(흰 배경 기준 수치를 그대로 인용) | 실제 인접 배경은 흰 카드가 아니라 입력 박스 배경 `bg-gray100`(#F8F6F2, L=0.9227) → (0.9227+0.05)/(0.2291+0.05)=**3.485:1** | ⚠️ 부정확 — 3:1 기준은 통과하지만, 인용된 "3.76:1"은 잘못된 참조 배경(흰 카드)에서 계산한 값이다. 실제 인접 배경(입력 박스의 `bg-gray100`)으로 재계산하면 3.485:1로 더 낮다 — 여전히 3:1은 충족하나 근거 수치 자체가 틀렸다 |

**결론: 4개 핵심 주장은 모두 정확. 다만 2건(토글 inactive, 에러 보더)이 실제 인접 배경을 재계산하지 않고 흰 배경 기준값을 그대로 재사용/어림한 것으로 확인됨 — Suggestion으로 하향(§Accessibility 점수에 소폭 반영).**

### §3 [Blocker] multiline TextInput과 키보드 "완료"(`onSubmitEditing`) 충돌 미검토

AC-11은 "감상평 입력칸에서 키보드 '완료' 키(`onSubmitEditing`)를 누르거나 ... '다음' 버튼을 누르면 ... 서명 단계로 진입한다"고 명시한다. rev1의 한줄평 입력칸은 **한 줄**(`border-b` 단일 라인)이었으므로 `returnKeyType="done"` + `onSubmitEditing`이 자연스럽게 작동했다(실제 `ReceiptSummary.tsx` L218-230).

그러나 rev2 브리프는 이 입력칸을 **여러 줄**(`multiline`, 최소 3줄 높이 ~72px, 최대 약 6줄 이후 스크롤)로 명시적으로 바꾼다(§Layout & components 표 2행). React Native에서 `multiline={true}`인 `TextInput`은 키보드의 return/엔터 키가 기본적으로 **줄바꿈**을 삽입하며, `onSubmitEditing`이 안정적으로 발화하는지는 플랫폼(특히 Android)에 따라 일관되지 않다 — 사용자가 감상평 문단 중간에 줄바꿈을 넣고 싶을 때와 "완료" 의도로 엔터를 누를 때를 구분할 방법이 없다.

브리프의 Component contract는 `onEssayNext: () => void`에 "키보드 완료 또는 '다음' 버튼 — 서명 단계로 진입하는 단일 트리거"라고만 적어, 이 충돌을 전혀 인지하지 못한 채 rev1의 단일 라인 패턴을 그대로 명명만 바꿔 재사용하고 있다. AC-11 자체가 spec 확정 사항이므로 브리프에서 삭제할 수는 없지만, 최소한 아래 중 하나는 브리프에 명시되어야 한다:

- 멀티라인 입력에서 엔터=줄바꿈을 유지하고, "완료" 키 트리거는 사실상 도달 불가능함을 인지한 채 "다음" 버튼을 주 경로로 명시(AC-11의 "키보드 완료 키" 부분은 사실상 no-op으로 문서화)
- 또는 별도의 완료 트리거 방식(예: 키보드 위 액세서리 바의 "완료" 버튼)을 신규 제안

이대로 Chris에게 넘어가면 "returnKeyType='done' + onSubmitEditing 그대로 재사용"으로 구현했다가 실기기(특히 Android)에서 AC-11의 절반이 작동하지 않는 채로 QA에 올라올 위험이 크다.

### §4 [Blocker] 에러 상태 카피 분기를 구동할 prop 부재

Copy 표는 에러 메시지를 **2종**으로 나눈다:

- "감상 생성에 실패했어요"(재시도 가능)
- "잠시 후 다시 시도해 주세요"(재시도 소진 — "네트워크/서버 오류 자체 재시도 카운트, 재생성 카운트와 **별개**"라고 브리프 스스로 명시)

하지만 Component contract의 essay 관련 필드(`essayText`, `onEssayTextChange`, `essayStage`, `essayGenerateCount`, `onEssayGenerate`, `onEssayWriteMode`, `onEssayRetry`, `onEssayFocus`, `onEssayNext`) 어디에도 이 두 문구를 구분할 값이 없다. `essayStage`는 `'idle' | 'streaming' | 'done' | 'error'` 4값뿐이고, `essayGenerateCount`는 "생성하기" 재생성 카운터이지 브리프가 "별개"라고 명시한 네트워크 재시도 카운터(rev1의 `MAX_ESSAY_RETRIES`/`essayRetriesExhausted`에 대응)가 아니다.

rev1(iteration 2 Suggestion 2)에서도 `essayRetriesExhausted?: boolean`가 있었지만 optional이라 타입 레벨 보장이 약하다는 지적이 있었다 — rev2는 그 필드 자체가 아예 **사라졌다**. 문서가 스스로 "별개 카운터"라고 서술한 개념을 표현할 prop이 없는 것은 회귀다.

### §5 [Blocker] spec이 "Chris 구현 판단(권장)"으로 남긴 사항을 "spec 확정 사항"으로 오기재

`01-spec.md` Open questions 확정 섹션(L155)의 실제 문구:

> "오류 시 재시도(`MAX_ESSAY_RETRIES`)와 별개 카운터로 관리할지 통합할지는 **Chris 구현 판단**(권장: 하나의 카드 세션 동안 '생성하기' 버튼을 누른 총 횟수를 5회로 제한하는 단일 카운터 — 정상 재생성과 오류 재시도를 구분하지 않는 편이 단순함)."

이는 명시적으로 "권장"이며 "Chris 구현 판단"으로 위임된 사항이다. 그런데 `02-design-brief.md`(L87)는:

> "`essayGenerateCount`는 `confirm-visits.tsx`가 소유하며 '생성하기'를 누를 때마다(정상 생성이든 에러 후 재시도든 구분 없이, **spec 확정 사항**) 1씩 증가한다."

라고 서술해, spec이 "권장"으로 남긴 것을 "확정 사항"으로 격상시켰다. spec의 권장안을 브리프가 채택하는 것 자체는 문제가 아니지만(디자인 단계에서 구체적 값이 필요하므로 타당한 선택), **"spec 확정 사항"이라는 출처 표시가 사실과 다르다** — Chris가 이 문구를 읽고 재량의 여지가 없다고 오인해 §4의 prop 부재 문제(별개 카운터가 필요할 수도 있다는 가능성)를 아예 검토하지 않을 위험이 있다. "Sam의 채택안(spec 권장을 따름)"처럼 정확히 표기해야 한다.

### §6 [Blocker] 토글 `selected` 상태를 구동할 prop 부재

§Accessibility 섹션은 "토글 두 세그먼트: 각각 `accessibilityRole='button'` + `accessibilityState={{ selected, disabled }}`"를 요구한다. 그러나 Component contract 9개 필드 중 현재 "직접 쓰기"/"생성하기" 중 어느 쪽이 시각적으로 선택된 상태인지 나타내는 값이 없다 — `essayStage`(idle/streaming/done/error)는 생성 진행 단계일 뿐 "어느 토글이 눌려 있는가"와 다른 축이다.

States 섹션은 "토글은 '직접 쓰기'가 기본 선택(active 스타일)이며 ... 생성 완료 직후에도 이 상태로 돌아와"라고만 적어, **생성 완료 후에도 '직접 쓰기'가 계속 active로 남는지**(즉 "생성하기"는 순간 액션 버튼일 뿐 지속 선택 상태를 갖지 않는지), 아니면 "생성하기"를 누른 시점에 active가 "생성하기"로 전환되는지가 불명확하다. `selected` accessibilityState를 요구하면서 그 값의 소스가 문서 어디에도 정의되지 않은 것은 Blocker다 — Chris가 로컬 state로 임의 구현하면 부모 controlled 패턴(component-convention.md §4 SRP)에서 벗어난 숨은 상태가 생길 수 있다.

### §7 [Suggestion→경계선] "생성하기" 세그먼트 44pt 터치 영역 미확정

§Accessibility: "'생성하기' 세그먼트는 필 형태이므로 `py-3`(패딩만으로) 44pt 이상 터치 영역을 확보한다 — 별도 hitSlop 불필요(텍스트 라인하이트 ~~18px + 상하 패딩 12px×2 = **42~~44px대**, 필요 시 `py-3.5`로 여유 확보)."

- 계산 자체(18+12×2=42px)는 **44pt에 미달**하는 하한값이고, 브리프도 이를 "42~44px대"로 스스로 불확실하게 서술한 뒤 "필요 시 `py-3.5`"라는 조건부 대안으로 얼버무렸다 — 어느 쪽을 택할지 확정하지 않았다.
- 게다가 토글 텍스트의 실제 폰트 크기가 Tokens/Copy/Layout 어느 표에도 명시되어 있지 않다("~18px"는 추정치의 추정치). 다른 모든 텍스트 요소(예: 헬퍼 텍스트 `text-[11px]`, 에러 메시지 `text-gray700`)는 정확한 className이 지정된 것과 대조적이다.
- rev1 iteration 1이 정확히 이런 유형의 "추정 렌더 높이 + 여유 없는 마진"을 Blocker로 잡아 Fail 판정을 내린 전례가 있다(구 §2). 이번 사안은 그때보다 더 근본적이다 — 애초에 폰트 크기가 미지정이라 42px이라는 하한값조차 검증 불가능하다.
- **요구**: 토글 텍스트 className(폰트 크기 포함)을 명시하고, `py-3`/`py-3.5` 중 하나로 확정하거나 hitSlop을 추가해 44pt 확보를 문서 내에서 완결할 것.

### Suggestions (nice to have)

1. 토글 inactive 대비(`bg-gray200`+`text-gray700`)와 에러 보더 대비(`border-error` vs `bg-gray100`)를 실제 인접 배경 기준으로 재계산해 정확한 수치로 교체할 것(§2).
2. §5의 "spec 확정 사항" 표기를 "Sam이 spec의 권장안을 채택함"으로 정정할 것.
3. (Iteration 1 rev1에서 이월, 여전히 유효) Copy 표의 에러 문구 매핑을 States 섹션에도 표로 한 번 더 명시.

### Handoff

- **Fail → Sam (Design)** — `02-design-brief.md`를 다음 관점에서 보완:
  1. multiline 입력칸에서 AC-11 "키보드 완료" 트리거의 실질적 작동 여부를 검토하고 문서화(§3, Blocker).
  2. 에러 메시지 2종(재시도 가능/소진)을 구분할 prop을 Component contract에 추가(§4, Blocker).
  3. essayGenerateCount 증가 시점 서술의 출처 표기를 정정(§5, Blocker).
  4. 토글 `selected` 상태의 소스를 Component contract에 추가(§6, Blocker).
  5. (선택, 경계선) 토글 텍스트 폰트 크기 명시 + 44pt 터치 영역 확정(§7).
- 위 5건 중 최소 §3~§6(Blocker 4건)이 해결되어야 다음 iteration에서 Pass 가능.

---

## Rev1 (archived — superseded)

> 아래는 rev1(한줄평/감상 생성 분리, 4단계 흐름) 브리프에 대한 검토 이력이다. rev1은 iteration 3에서 Pass(4.71/5)했고 Chris 구현·Taylor QA까지 완료됐으나, 이후 사용자 피드백으로 spec이 rev2로 재설계되면서 이 브리프 자체는 대체(superseded)되었다. 이관 없이 원문 그대로 보존한다.

## Iteration 3 (archived)

### Verdict

- **Pass**
- Iteration: 3 / 3

### Scores (1–5)

| Dimension                            | Score    | Notes                                                                                                                                                 |
| ------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens                       | 5        | 변경 없음. 신규 색상/컴포넌트 언어 도입 없음.                                                                                                         |
| Layout & IA                          | 4        | §5 신규 Blocker(컴포넌트 분리) 해소됨(아래 §1 참고). 5점 미부여 사유는 §4의 경계 모호 지점(Suggestion) 하나가 남아 있기 때문 — must-pass 위반은 아님. |
| Copy & tone                          | 5        | 변경 없음.                                                                                                                                            |
| Accessibility                        | 5        | hitSlop 8→16 상향으로 iteration 2의 마진 리스크(1pt)가 해소됨(아래 §2 참고). 나머지 접근성 항목은 변경 없이 이미 검증 완료 상태 유지.                 |
| **Weighted overall (harmonic mean)** | **4.71** | 4/(1/5+1/4+1/5+1/5) ≈ 4.71 — Pass 기준(≥4.0) 충족, 항목별 3점 미만 없음, 미해결 Blocker 없음.                                                         |

Pass rule: overall ≥ 4.0 and no dimension < 3, **AND 미해결 Blocker가 없어야 함** — 모두 충족.

### §1 `EssayStageSection` 분리 검증 (신규 Blocker — 해소 확인)

실제 `ReceiptSummary.tsx`(246줄, 6개 UI 블록 — 전시정보/프로그램/장소·시간/별점/메모/서명)를 직접 재확인한 결과, iteration 2 §5 지적(245줄 기준선 2배 초과)이 정확했음을 재확인했다. 수정된 브리프의 대응을 §Layout & components / §Component contract 원문 기준으로 검증:

- **파일 분리 + named export**: `src/components/archive/EssayStageSection.tsx`(named export)로 신규 4개 상태(idle/streaming/done/error) UI 전체를 명시적으로 이관 — `component-convention.md` §9.1("named export 컴포넌트 1개") 및 §9.4(분리 신호) 요구를 정확히 충족.
- **props 인터페이스 명확성**: `EssayStageSection`의 props가 `ReceiptSummaryProps`에 추가되는 8개 필드(`essayStageReady`~`onEssayConfirm`)와 "동일하다"고 명시 — 인터페이스 경계가 문서상 모호하지 않다.
- **pass-through 조립 확인**: "`ReceiptSummary`는 아래 props를 받아 `<EssayStageSection essayStage={essayStage} essayText={essayText} ... />` 형태로 그대로 넘겨주는 pass-through 조립만 담당"이라고 명시 — `ReceiptSummary` 내부에 신규 UI 블록이 직접 추가되지 않으므로 §9.4 위반이 재발하지 않는다. `useEssayStream` 훅 소유권도 여전히 `confirm-visits.tsx`(부모)에 있고 `EssayStageSection`은 결과만 props로 받으므로 SRP(§4)도 유지된다.

**결론: §5 Blocker 완전 해소.** (Suggestion 1건은 §4 참고)

### §2 hitSlop 재검증 (독립 재계산)

브리프 변경: 신규 링크 2종(다시 시도/건너뛰고 서명하기)의 hitSlop을 8→16으로 상향.

- 계산: 17(추정 렌더 높이) + 16(상) + 16(하) = **49pt** ≥ 44pt(Apple HIG) — 여유 마진 **5pt**.
- 열화 시나리오 재확인: 실제 렌더 높이가 추정보다 작은 15px일 경우 15+16+16=**47pt**로도 여전히 44pt 기준 통과 — iteration 2에서 지적한 "측정 오차를 흡수하지 못하는 1pt 마진" 리스크가 해소됨.
- 기존 "서명 지우기" 링크(hitSlop 8, 이번 spec 범위 밖)는 의도적으로 변경하지 않는다고 명시 — 스코프 경계가 명확하다.

**결론: §2(iteration 2) Suggestion 완전 반영, 잔여 리스크 없음.**

### §3 회귀 여부 확인 (iteration 1/2 해소 사항 유지)

- **대비(Blocker 1, iteration 1)**: 토큰 값(`text-error` 3.76:1 아이콘 전용, `text-gray700` 7.63:1 텍스트 전용) 변경 없음 — 훼손 없음.
- **상태 소유 경계(Blocker 3, iteration 1)**: `EssayStageSection` 도입 후에도 controlled 패턴 유지 확인 — `EssayStageSection`은 여전히 props로만 상태를 받고 `streamChat()` 호출은 `confirm-visits.tsx` 소유 훅에 남아 있다. `onMemoDone → essayStageReady=true → (onEssaySkip|onEssayConfirm) → signatureStageReady=true` 전환 체인도 문구 그대로 유지됨. 실제 `ReceiptSummary.tsx`의 기존 `onMemoDone` 문서화("3단계(서명)로 넘어가는 트리거", L39-40)와 브리프의 의미 변경 설명이 정확히 대응함을 재확인.
- **stamped 가시성(Blocker 4, iteration 1)**: States 섹션 문구("버튼만 숨김, 이미 생성된 감상문 텍스트는 계속 노출") 변경 없음 — 실제 파일의 기존 3단계 패턴(`StarRating disabled`지만 값 유지, `SignaturePad disabled`지만 서명 유지, L183/196/212)과 동일 규칙을 재확인.

**결론: 이전 해소 사항 중 훼손된 것 없음.**

### §4 신규 결함 점검

- **Props drilling**: `ReceiptSummary → EssayStageSection`으로 8개 props를 그대로 전달하는 구조는 과도한 drilling이 아니다 — 기존에도 `rating`/`onRatingChange` 등 동일 개수 수준의 props를 부모(`confirm-visits.tsx`)로부터 받아 렌더링해왔고, 여기서는 한 단계 더 넘기는 것뿐이라 depth가 1 증가하는 데 그친다. Blocker 아님.
- **경계 모호 지점(Suggestion)**: 브리프가 `essayStageReady && <EssayStageSection .../>` 형태의 조건부 마운트를 `ReceiptSummary`와 `EssayStageSection` 중 어느 쪽이 담당하는지 코드 스니펫으로 명시하지 않았다. 기존 서명 단계(`{signatureStageReady && (...)}`, L205)와 동일 패턴을 따를 것이 사실상 명백하지만, 브리프 문서 자체에는 이 위치가 암묵적으로만 남아 있다 — Chris가 반대로 `EssayStageSection` 내부에서 `essayStageReady`를 다시 검사하는 이중 게이팅을 넣을 여지가 (낮지만) 있다. Blocker로 격상하지 않고 Suggestion으로 기록한다.

### Suggestions (nice to have)

1. `essayStageReady && <EssayStageSection ... />` 게이팅은 `ReceiptSummary`(부모)가 담당하고 `EssayStageSection` 내부에서는 이를 재검사하지 않는다는 문장을 브리프 또는 04-dev-notes에 한 줄 추가할 것(§4 참고).
2. (Iteration 2에서 이월) `essayRetriesExhausted`를 discriminated union으로 바꿔 `error` 상태에서 값 누락을 타입 레벨에서 방지할 것.
3. (Iteration 1에서 이월) Copy 표의 재시도 카운트별 문구 매핑을 States 섹션에 표로 한 번 더 명시.

### Handoff

- **Pass → Chris(Dev) 구현 시작 가능.**
- 남은 Suggestion 3건은 must-fix가 아니므로 구현을 막지 않는다 — 여유가 있으면 `04-dev-notes.md`에 메모 형태로 반영 권장.

---

## Iteration 2 (archived)

### Verdict

- **Fail** (overall 점수는 Pass 기준선에 걸치지만, 신규 발견된 컨벤션 위반 Blocker로 인해 override — 아래 근거 참고)
- Iteration: 2 / 3

### Scores (1–5)

| Dimension                            | Score    | Notes                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens                       | 5        | Iteration 1 Blocker 1의 `text-error` 대비 오류를 정확히 수정. 아이콘 전용(`text-error`, 그래픽 3:1 기준)과 텍스트 전용(`text-gray700`, 7.63:1) 토큰을 분리 지정한 것을 독립 재계산으로 확인 — 오류 없음. 새 색상/컴포넌트 언어 도입 없음.                                                                                                         |
| Layout & IA                          | 3        | 상태 소유 경계(Blocker 3)는 모범적으로 해결됐으나(아래 §1 참고), 브리프가 4개 신규 상태(idle/streaming/done/error) 전체를 이미 245줄인 `ReceiptSummary.tsx`에 인라인으로 추가하도록 지시하고 있어 `component-convention.md` §9.4 분리 신호("파일 100줄 초과 + UI 블록 2개 이상 → 컴포넌트 추출 검토")와 정면 배치 — 신규 Blocker(아래 §5)로 등재. |
| Copy & tone                          | 5        | 변경 없음, 이전과 동일하게 기존 톤과 합치.                                                                                                                                                                                                                                                                                                        |
| Accessibility                        | 4        | Blocker 1·2·4가 모두 정량적으로 재검증됨(아래 §1~2, §4). 다만 hitSlop 45pt 계산이 최소 기준(44pt) 대비 여유가 1pt뿐이고 텍스트 렌더 높이 추정치(17px)가 실측이 아닌 추정값이라 리스크가 남음 — Suggestion으로 하향 반영.                                                                                                                          |
| **Weighted overall (harmonic mean)** | **4.07** | 4/(1/5+1/3+1/5+1/4) ≈ 4.07 — 숫자상으로는 Pass 기준(≥4.0)을 충족하지만, Layout & IA의 컨벤션 위반 Blocker가 must-pass 기준이므로 verdict는 Fail로 override한다(Skeptical Evaluation Stance — "점수와 무관하게 must-pass 기준 미충족 시 Reject").                                                                                                  |

Pass rule: overall ≥ 4.0 and no dimension < 3, **AND 미해결 Blocker가 없어야 함**(본 리뷰에서 명시).

### §1 대비 수정 검증 (독립 재계산)

- `#EF4444`(`text-error`): sRGB→선형화 R_lin=0.8637, G_lin=B_lin=0.0578 → L=0.2292 → 대비=(1.05)/(0.2292+0.05)=**3.76:1**. 브리프의 주장과 정확히 일치. 본문 텍스트 AA(4.5:1) 미달, 그래픽/대형텍스트 3:1은 충족 — 아이콘 전용 한정이 올바른 결론.
- `#57534E`(`text-gray700`): 선형화 R_lin≈0.0953, G_lin≈0.0864, B_lin≈0.0763 → L≈0.0876 → 대비=(1.05)/(0.0876+0.05)=**7.63:1**. 브리프 주장과 일치, AA 통과.
- `#F43F5E`(`error-alt`, 기각 후보): 선형화 R_lin≈0.9048, G_lin≈0.0497, B_lin≈0.1119 → L≈0.2360 → 대비=(1.05)/(0.2360+0.05)=**3.67:1**. AA 미달 확인 — 텍스트 대체 토큰으로 채택하지 않은 판단이 옳다.
- `bg-primary-dark`(#625876) + `text-white`: 선형화 L≈0.1089 → 대비=(1.05)/(0.1089+0.05)=**6.61:1**. 기존 주장과 일치, 문제 없음.

**결론: Blocker 1 완전 해결. 4개 대비값 전부 독립 재계산으로 검증됨.**

### §2 hitSlop 검증

브리프 계산: 텍스트 렌더 높이(약 17px) + hitSlop 14(상) + 14(하) = 45pt ≥ 44pt(Apple HIG). 산수 자체는 맞다.

다만 다음 리스크가 남는다(Blocker로 등재하지 않고 Suggestion으로 하향):

- "약 17px"는 실측이 아니라 폰트 크기 12px에 대한 추정 line-height다. Pretendard 폰트 메트릭이나 OS별 렌더링 차이로 실제 렌더 높이가 15~16px일 경우 15+14+14=43pt로 44pt 기준에 미달할 수 있다. 안전 여유가 1pt에 불과해 측정 오차를 흡수하지 못한다.
- 시스템 폰트 확대(Dynamic Type/접근성 큰 텍스트) 시에는 실제 렌더 높이가 커져 오히려 안전해지므로 그 방향은 문제없다. 리스크는 "실측보다 작게 렌더링되는 경우"에 한정된다.
- 제안: hitSlop을 14 대신 16 이상으로 지정하거나, 실기기에서 실측 후 여유값을 확정하도록 브리프에 명시하면 이 리스크가 해소된다.

### §3 상태 소유 경계 검증 (Blocker 3 — 모범적으로 해결)

- `ReceiptSummary.tsx`의 기존 controlled 패턴(`rating`/`onRatingChange`, `memo`/`onMemoChange`, `signatureStageReady`)과 정확히 동일한 스타일로 `essayStageReady`/`essayStage`/`essayText`/`essayRetriesExhausted`/`onEssayGenerate`/`onEssaySkip`/`onEssayRetry`/`onEssayConfirm` 8개 props가 정의됨 — controlled 패턴 확인.
- `streamChat()` 호출 책임이 "`confirm-visits.tsx`가 소유하는 경량 훅(`useEssayStream`)"으로 명시적으로 지정됨. `ReceiptSummary`는 결과만 props로 받는다는 문장이 명확하여 컴포넌트 내부 직접 fetch 오해의 여지가 없다 — component-convention.md §4(SRP) 준수.
- `onMemoDone` 의미 변경도 "별도 콜백을 신설하지 않는다"와 함께 전체 상태 전환 체인(`onMemoDone → essayStageReady=true → (onEssaySkip|onEssayConfirm) → signatureStageReady=true`)을 명문화해 Chris가 임의 해석할 여지를 제거했다.
- 사소한 개선 여지(Suggestion, 블로커 아님): `essayRetriesExhausted?: boolean`가 optional로 선언되어 있어, `essayStage === 'error'`일 때 이 값이 항상 채워지는지 타입 레벨에서 보장되지 않는다. Discriminated union(`essayStage: {type:'error', retriesExhausted: boolean} | ...`)으로 바꾸면 더 안전하지만, 현재 형태도 구현 가능한 수준이라 Blocker로 격상하지 않는다.

**결론: Blocker 3 완전 해결.**

### §4 stamped 상태 가시성 검증 (Blocker 4 — 해결)

브리프가 "버튼만 `{!stamped && ...}`로 숨기고, 이미 생성된 `essayText`는 기존 3단계(별점/메모/서명)와 동일하게 `stamped` 이후에도 계속 노출한다"고 명시적으로 기술했고, 기존 3단계의 실제 구현 패턴(`StarRating disabled`, `TextInput editable={!stamped}` 값 유지, `SignaturePad disabled` 서명 유지)과의 일관성 근거도 제시했다. 다이어리 재조회 시 감상문이 사라지는 회귀를 막는다는 목적도 명확하다.

**결론: Blocker 4 완전 해결.**

### §5 신규 Blocker — 컴포넌트 분리(SRP) 미검토

`ReceiptSummary.tsx`는 현재 245줄이며 이미 전시정보/프로그램/장소·시간/별점/메모/서명 6개 UI 블록을 담고 있다. 브리프의 Layout & components 표는 신규 3단계(idle/streaming/done/error) 4개 상태 UI 전부를 "신규 서브 블록, `ReceiptSummary` 내부에 추가"로 3회 반복 지시하고 있다 — 최소 4개의 추가 UI 블록(헤더+버튼 2종, 로딩 인디케이터+스트리밍 텍스트, 완성 텍스트+CTA, 에러 아이콘+텍스트+링크 2종)이 같은 파일에 누적된다.

`.claude/rules/component-convention.md` §9.4(분리 신호)는 "파일 100줄 초과 + UI 블록 2개 이상 → 컴포넌트 추출 검토"를 명시한다. `ReceiptSummary.tsx`는 이미 245줄로 기준을 2배 이상 초과한 상태에서 UI 블록을 4개 더 추가하는 것은, 컨벤션이 경고하는 정확한 상황이다. 이는 이후 Taylor QA 체크리스트 Q5(컨벤션 준수) 단계에서 지적되어 Chris의 재작업을 유발할 가능성이 높다 — 지금 브리프 단계에서 방향을 정하는 것이 비용이 훨씬 적다.

**요구 사항**: 신규 3단계(감상 생성) UI를 `src/components/archive/` 하위의 별도 named-export 서브컴포넌트(예: `EssayStageSection.tsx`)로 추출하고, `ReceiptSummary`는 이 컴포넌트에 `essayStage`/`essayText`/... props를 그대로 전달(pass-through)하는 얇은 조립 역할만 하도록 브리프에 명시해야 한다. Props 계약(§Component contract) 자체는 그대로 유지 가능 — 어느 컴포넌트가 그 props를 받는지만 재지정하면 된다.

### Suggestions (nice to have)

1. hitSlop을 14→16 이상으로 올리거나 실기기 실측값을 브리프에 추가해 44pt 여유 마진을 확보할 것(§2 참고).
2. `essayRetriesExhausted`를 discriminated union으로 바꿔 `error` 상태에서 값 누락을 타입 레벨에서 방지할 것(§3 참고).
3. (Iteration 1에서 이월) Copy 표의 재시도 카운트별 문구 매핑을 States 섹션에 표로 한 번 더 명시.

### Handoff

- **Fail → Sam (Design)** — `02-design-brief.md`를 다음 관점에서 보완:
  1. 신규 3단계(감상 생성) UI를 별도 서브컴포넌트(`src/components/archive/EssayStageSection.tsx` 등)로 추출하도록 Layout & components 표를 수정 — `ReceiptSummary`는 pass-through 조립만 담당하도록 명시(§5).
  2. (선택) hitSlop 여유 마진 보강 — §2 Suggestion 참고.
- 위 1번(신규 Blocker)만 해결되면 나머지 항목은 모두 Pass 수준이므로, 다음 iteration은 이 부분만 검증하면 된다.

---

## Iteration 1 (archived)

### Verdict

- **Fail**
- Iteration: 1 / 3

### Scores (1–5)

| Dimension                            | Score   | Notes                                                                                                                                                                                                                                              |
| ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens                       | 4       | 새 색상/컴포넌트 언어 도입 없음, `primary-dark` 재사용 사실 확인. 다만 `text-error` 대비 주장 오류(→ Accessibility에서 별도 감점).                                                                                                                 |
| Layout & IA                          | 3       | AC-1~11 매핑 자체는 대체로 대응되나, `onMemoDone` → `essayStageReady` → `signatureStageReady` 상태 전환 설계가 컴포넌트/훅 경계를 명시하지 않아 Chris가 임의 해석할 여지가 큼. `stamped` 상태에서 완성된 감상문 텍스트를 유지할지 숨길지도 불명확. |
| Copy & tone                          | 5       | 기존 영수증 카드 톤(라벨/보조 액션 문구 패턴)과 일관되고, AC-8 카피 변경 방향과 합치.                                                                                                                                                              |
| Accessibility                        | 2       | 핵심 근거로 제시한 대비값이 재계산 결과 틀림(아래 근거 참고), hitSlop(8)만으로는 텍스트 링크형 버튼이 44pt 터치 영역에 도달하지 못하는데 브리프가 이를 인지하지 못함.                                                                              |
| **Weighted overall (harmonic mean)** | **3.1** | 4/(1/4+1/3+1/5+1/2) ≈ 3.12 — Pass 기준(≥4.0) 미달. Accessibility 항목이 3점 미만이라 그 자체로 Fail.                                                                                                                                               |

Pass rule: overall ≥ 4.0 and no dimension < 3. **Accessibility = 2 → 단독으로 Fail 조건 충족.**

### AC 대응표 (근거)

| AC     | 브리프 반영 여부 | 비고                                                                                                    |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------- |
| AC-1   | ✅               | States "Idle" 섹션                                                                                      |
| AC-2/3 | ⚠️ 부분          | UI 상태(idle→streaming)는 정의됐지만 재료 조립(별점+한줄평 유무 분기)은 브리프 범위 밖(로직이므로 타당) |
| AC-4   | ✅               | Streaming 상태, `CHAR_INTERVAL_MS` 패턴 참조                                                            |
| AC-5   | ✅               | Skip 경로                                                                                               |
| AC-6/7 | ✅               | Skip 경로에 "에세이 필드는 빈 문자열로 저장" 명시                                                       |
| AC-8   | ✅               | Copy 표                                                                                                 |
| AC-9   | ✅               | Error 상태, 재시도 상한 패턴                                                                            |
| AC-10  | ✅               | "listenedTitles가 빈 배열이어도 버튼은 비활성화하지 않는다" 명시                                        |
| AC-11  | ✅               | Done 상태, "버튼을 눌러야만 서명 단계로 진행" 명시                                                      |

### Blockers (must fix)

1. **`text-error`(#EF4444) 대비 주장 오류.** 브리프 Accessibility 섹션은 "흰 배경 위 4.5:1 이상 확보된 기존 토큰"이라 주장하지만, WCAG 2.1 relative luminance 공식으로 독립 재계산하면:
   - `#EF4444` → R=0.9373, G=B=0.2667(sRGB)
   - 선형화: R_lin=0.8637, G_lin=B_lin=0.0578
   - L = 0.2126×0.8637 + 0.7152×0.0578 + 0.0722×0.0578 = **0.2292**
   - 대비비 = (1.0+0.05)/(0.2292+0.05) = 1.05/0.2792 = **3.76:1**
   - 일반 텍스트 WCAG AA 기준 4.5:1에 **미달**(대형 텍스트 3:1 기준은 충족하지만 에러 메시지는 본문 크기). 에러 메시지 텍스트에 그대로 쓰면 접근성 결함이다. `text-error-alt`나 더 어두운 톤으로 교체하거나, 최소한 브리프에서 "기존 토큰이지만 AA 미달 — 별도 개선 필요"로 정정해야 한다.
   - (참고로 `bg-primary-dark` + `text-white` 6.61:1 주장은 독립 재계산 결과 정확했다 — R_lin=0.1222/G_lin=0.0976/B_lin=0.1811, L=0.1089, 대비=1.05/0.1589=6.61 ✅)

2. **hitSlop(8)이 텍스트 링크형 버튼의 44pt 터치 영역을 보장하지 못함.** "다시 시도"/"건너뛰고 서명하기"는 `text-[12px]` 수준 텍스트(기존 "서명 지우기" 패턴 참고)로, 렌더 높이는 대략 16~~18px 안팎이다. `hitSlop(8)`은 상하좌우로 8pt씩만 확장하므로 세로 터치 영역은 대략 16(텍스트)+8+8=32pt 수준 — Apple HIG 44pt 기준에 못 미친다. 브리프는 "기존 서명 지우기 패턴과 동일"이라며 기존 코드를 근거로 들지만, 기존 패턴 자체가 44pt 미달일 가능성이 높고 신규 기능에 그대로 답습하는 것은 결함이다. `hitSlop`을 12~~14 이상으로 늘리거나 `py-2` 이상의 실질 패딩을 추가해 44pt를 확보하도록 명시해야 한다.

3. **essay 단계의 상태 소유 경계가 불명확.** 브리프는 "새 컴포넌트/화면 없이 기존 카드 내부 상태 확장"이라고만 서술하고, `서명(기존 3→4단계)` 행에서 "`essayStageReady` 완료/건너뛰기 후에만 `signatureStageReady`가 true가 되도록 부모 상태 연결 순서만 변경"이라고만 적어놓았다. 하지만:
   - `essayStageReady`가 `ReceiptSummaryProps`에 새로 추가되는 prop인지, 아니면 컴포넌트 내부 로컬 state인지 명시가 없다.
   - 현재 `onMemoDone`은 "3단계(서명)로 넘어가는 트리거"로 문서화돼 있다(`ReceiptSummary.tsx` L39-40) — 이 콜백의 의미가 "감상 생성 단계 진입 트리거"로 바뀌는지, 아니면 별도 콜백(`onEssayStageEnter` 등)이 새로 필요한지 브리프가 결정하지 않았다.
   - `streamChat()` 호출(재료 조립 + SSE 수신)을 `ReceiptSummary` 컴포넌트 내부에서 직접 하는지, 아니면 `confirm-visits.tsx`가 별도 훅(spec의 "감상 생성 전용 경량 훅")을 사용해 상태를 끌어올리고 `ReceiptSummary`는 별점/메모/서명처럼 controlled 컴포넌트로 essay 상태를 props로만 받는지가 정해지지 않았다. 후자가 기존 컴포넌트의 controlled 패턴(`rating`/`onRatingChange`, `memo`/`onMemoChange`) 및 component-convention.md §4(SRP — 데이터 패칭은 훅/스토어, UI는 컴포넌트)와 일관되므로 이쪽으로 명시해야 하는데, 브리프의 "카드 내부 상태 확장"이라는 표현은 반대로 읽힐 수 있다.
   - → Chris가 두 가지 중 하나를 임의로 선택할 여지가 있고, 특히 컴포넌트 내부에서 직접 `streamChat` fetch를 호출하는 쪽으로 구현되면 SRP 위반이 된다. 브리프에서 props 시그니처(예: `essayStage: 'idle'|'streaming'|'done'|'error'`, `essayText`, `onEssayGenerate`, `onEssaySkip`, `onEssayRetry`, `onEssayConfirm`)와 훅 소유 위치를 명확히 해야 한다.

4. **`stamped` 상태에서 완성된 감상문 텍스트의 가시성 미정.** 브리프는 "감상 생성 단계의 모든 버튼은 비활성/숨김 처리"라고만 적었는데, 기존 3단계(별점/메모/서명)는 `stamped`가 true여도 "비활성화(interaction 차단)"만 하고 콘텐츠 자체는 계속 보여준다(`StarRating disabled`, `TextInput editable={!stamped}`이지만 값은 표시, `SignaturePad` 그대로 표시 + 도장 오버레이). "비활성/숨김"이라는 표현은 버튼뿐 아니라 이미 생성된 감상문 텍스트까지 숨겨버릴 수 있는 여지를 남긴다 — 만약 사용자가 확정 후 이 카드를 다시 보게 되는 흐름이 있다면(다이어리 등) 감상문이 사라지는 회귀가 될 수 있다. "버튼만 숨기고, 이미 생성된 감상문 텍스트는 기존 3단계와 동일하게 계속 노출한다"로 명시해야 한다.

### Suggestions (nice to have)

1. Copy 표에 "감상 생성에 실패했어요" / "잠시 후 다시 시도해 주세요" 두 에러 문구가 사용자 입장에서 언제 어떤 문구가 뜨는지 헷갈릴 수 있으니, States 섹션에 재시도 카운트별 문구 매핑을 표로 한 번 더 명시하면 Chris 구현 시 실수를 줄일 수 있다.
2. `description` 계열 색상처럼 이번에 새로 텍스트를 추가하는 지점(한줄평 라벨)에 대해, `text-gray600`/`text-gray700` 중 어느 걸 쓸지 브리프에 명시된 톤(§Design intent 3항)과 Copy 표 사이에 실제 className 예시가 없어 사소하게 모호함 — 헤더용 `text-gray600`, 값/입력 텍스트용 `text-gray900` 정도로 한 줄만 추가하면 좋다.

### Handoff

- **Fail → Sam (Design)** — `02-design-brief.md`를 다음 관점에서 보완:
  1. 에러 텍스트 대비를 AA 기준(4.5:1)에 맞는 톤으로 교체하거나 근거를 정정
  2. 텍스트 링크형 버튼의 hitSlop/패딩을 44pt 터치 영역이 확보되도록 구체적 수치로 재지정
  3. essay 단계의 prop/훅 소유 경계를 명시(controlled prop 방식 권장)
  4. `stamped` 상태에서 감상문 텍스트 유지 여부 명시
  </content>
