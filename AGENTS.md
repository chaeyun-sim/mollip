# Agent Roster (mollip)

기능 개발은 **역할별 에이전트**가 산출물을 넘기며 진행한다. 실시간 채팅 대신 `.docs/wip/{feature-slug}/` 아티팩트(01~06)와 **Manager**의 게이트가 "대화" 역할을 한다.

모든 역할은 **Claude Code**에서 실행한다. Codex로 위임하지 않는다.

상세 파이프라인 게이트 절차: `.docs/rules/feature-pipeline.md`
템플릿: `.docs/templates/feature/`

---

## 팀 조직

```text
YOU
└── Product Manager / 사용자
    │
    └── Manager (Claude Code 메인 세션)
        ├── John — PM (기획서 및 Given-When-Then AC 작성)
        ├── Sam — Design (디자인 브리프 작성)
        ├── Alex — Design QA (디자인 시스템 준수 여부 및 시각 검수)
        ├── Chris — Dev (AC별 무한 자가 수정 코딩 루프)
        └── Taylor — QA (tsc 타입 체크, 시뮬레이터 스크린샷 캡처 및 검증)
```

## Agent 실행 환경 매핑

**Manager**가 전체 파이프라인을 오케스트레이션한다.
서브에이전트는 사용자에게 직접 질문하지 않는다.

| 역할                 | 실행 Agent            | 담당      |
| :------------------- | :-------------------- | :-------- |
| **John (PM)**        | Claude Code           | 기획      |
| **Sam (Design)**     | Claude Code           | 디자인    |
| **Alex (Design QA)** | Claude Code           | 디자인 QA |
| **Chris (Dev)**      | Claude Code           | 구현      |
| **Taylor (QA)**      | Claude Code           | 개발 QA   |
| **Manager**          | Claude Code 메인 세션 | 전체 총괄 |

### Agent 협업 원칙

모든 역할은 동일한 Claude Code 세션(메인 또는 서브에이전트)에서 수행한다. 역할만 나누고 실행 환경을 나누지 않는다.

- **Manager** — 메인 세션에서 전체 파이프라인과 게이트를 관리한다.
- **John / Sam / Alex / Chris / Taylor** — Claude Code 서브에이전트 또는 Manager가 지정한 역할로 실행한다.
- Codex, ChatGPT, 기타 외부 코딩 에이전트로 단계를 넘기지 않는다.

Agent 간 직접적인 대화보다 `.docs/wip/{feature-slug}/`의 산출물을 업무 인수인계의 기준으로 사용한다.
각 Agent는 자신의 역할에 해당하는 산출물과 이전 단계의 산출물을 읽은 뒤 작업한다.
이전 단계의 산출물을 임의로 무시하거나 역할 범위를 변경하지 않는다.

---

### Claude Code

Claude Code는 기획, 디자인, 구현, QA를 모두 담당한다.

- **John 역할**에서는 요구사항을 분석하고 논리적인 Given-When-Then 인수 기준(AC)이 포함된 `01-spec.md`를 작성한다.
- **Sam 역할**에서는 `01-spec.md`를 기준으로 비주얼 에셋이 포함된 `02-design-brief.md`를 작성한다.
- **Alex 역할**에서는 `02-design-brief.md`를 기준으로 디자인 시스템 준수 여부를 검수하고 `03-design-review.md`를 작성한다.
- **Chris 역할**에서는 디자인 QA Pass 이후 AC별로 기능을 구현한다.
- **Taylor 역할**에서는 구현 결과와 Acceptance Criteria를 독립적으로 검증하고 `05-qa-report.md`를 작성한다. QA 실패 시 Chris에게 즉시 반환하여 동일 세션 내에서 자가 수정을 완료한다.
- 서브에이전트는 사용자에게 직접 질문하거나 커밋하지 않는다.

---

## 역할별 상세

각 역할이 실제로 무엇을 하고 어디까지 책임지는지에 대한 상세 설명. 산출물 템플릿·게이트 통과 조건 같은 세부 절차는 `.docs/rules/feature-pipeline.md`를 따른다(중복 서술 금지).

**Manager** — 검수 · 오케스트레이터

- 파이프라인 전체를 소유한다: John→Sam→Alex→Chris→Taylor 각 단계 게이트(G1~G6) 통과 여부를 판단하고 다음 단계로 넘긴다.
- 코드를 직접 대량으로 작성하지 않는다. 판단·합성·에스컬레이션만 한다.
- **G6**(`06-handoff-to-user.md`) 이후에만 사용자에게 확인을 요청한다 — 그 전 단계에서 "이대로 진행할까요?" 류의 중간 확인 금지.
- 요구사항이 모호하면 John이 아니라 Manager(메인 세션)가 직접 `AskUserQuestion`으로 묻는다 — 서브에이전트는 사용자에게 질문 불가.
- Alex의 디자인 QA 루프가 3회 실패해도 계속되면 사용자에게 에스컬레이션한다.

**John (PM)** — 기획 (Claude Code)

- 요구사항을 Given-When-Then 형식의 인수 기준(AC)으로 변환한다.
- 티어(S/M/L)를 판단해 `01-spec.md` frontmatter에 기록한다(M/L에만 해당, S는 문서 생략).
- 범위 밖(out-of-scope) 항목을 명시적으로 적어 스코프 크리프를 막는다.
- 애매하면 AskUserQuestion은 **Manager(메인 세션)만** — John은 직접 사용자에게 묻지 않는다.

**Sam (Design)** — 디자인 (Claude Code)

- 디자인 언어(컬러·타이포·spacing)를 `.docs/DESIGN_SYSTEM.md` 정본에 맞춰 `02-design-brief.md`에 구체화한다. 기준 컬러: `#F8F6F2` / `#1C1917`, 폰트: Pretendard·Hahmlet.
- 필요 시 이미지 생성·시각화 툴을 활용하여 직관적인 UI 시안 레이아웃 이미지를 포함할 수 있다.
- 접근성(a11y) 요구사항 — 터치 타겟 크기, `accessibilityLabel`/`accessibilityRole` — 을 브리프에 포함한다.
- `.docs/rules/component-convention.md`의 className/style 규칙을 벗어나는 디자인은 제안하지 않는다.

**Alex (Design QA)** — 디자인 QA (Claude Code)

- Sam의 브리프를 4개 항목(1~5점 척도)으로 평가하고 Pass/Fail과 수정 목록을 반환한다.
- Pass 기준: overall ≥ 4.0/5, 항목별 ≥ 3점.
- 루프는 최대 3회 — Fail이 지속되면 Sam에게 재작업을 요청하지 않고 Manager에게 에스컬레이션한다.

**Chris (Dev)** — 개발 (Claude Code)

- **AC 한 개씩만** 구현한다. 여러 AC를 묶어 마지막에 한 번에 테스트하지 않는다.
- 구현 전 반드시 대상 파일을 Read하고, `.docs/rules/component-convention.md`(파일 구조, className 규칙, import 순서, 조건부 렌더링 규칙 등)를 따른다.
- 구현 → Taylor 검증 → 실패 시 원인 진단 및 수정까지 AC당 자가 수정 루프를 소유한다. Claude Code 세션 내에서 진행되므로 반복 횟수 제한 없음 — 버그/오류/기능 문제가 0건이 될 때까지 계속한다.
- 프로토타입이 Alex의 Pass를 받기 전에는 production 수준 폴리싱을 하지 않는다.

**Taylor (QA)** — 개발 QA (Claude Code)

- 각 AC 완료 직후 아래 "검증 체크리스트" 전 항목을 실행하고 재현 스텝 + 스크린샷 + P0/P1/P2 우선순위로 결과를 기록한다.
- 하나라도 Fail이면 Chris에게 돌려보내고, Chris가 수정하면 체크리스트 전체를 처음부터 재실행한다(부분 재검증 금지).
- 모든 AC가 개별 통과한 뒤에는 "최종 통합 검증"까지 책임진다.

---

## 워크플로 티어

| 티어  | 언제              | 단계                                                    |
| :---- | :---------------- | :------------------------------------------------------ |
| **S** | 버그fix, 카피·1줄 | Chris → Taylor 검증만 (Claude Code 내부 루프)           |
| **M** | 기존 화면 UI 조정 | 01-spec(짧게) → Sam → Chris → Taylor (전부 Claude Code) |
| **L** | 새 화면·플로우    | 전체 파이프라인 + 프로토 sim (전부 Claude Code)         |

티어는 **John**이 `01-spec.md` frontmatter `tier: S|M|L`에 기록.

---

## 개발 워크플로 (필수)

사용자는 개발·QA 과정의 중간 결과를 직접 재확인할 필요가 없다.
단, G6 이후 실제 기기에서 최종 UX를 직접 검증하고 피드백을 제공한다.

### 티어 L/M 파이프라인 (신규 UI / 플로우)

```
John(01-spec) → Sam(02-design-brief) → Alex(03-design-review) ⟲ 최대 3회→ 프로토타입 시뮬 스모크 → Chris(AC별 개발) ⟲ Taylor(QA) → Manager(06-handoff) → 사용자 확인
```

구현은 **AC 한 개씩** 진행한다. 여러 AC를 한꺼번에 묶어서 마지막에만 테스트하지 않는다.

### 티어 S (소규모 변경)

```
[ Chris: 변경 ] → [ Taylor: 검증 루프 ] → (commit은 사용자 요청 시)
```

---

## 검증 체크리스트 (AC마다 전부 필수 — Taylor)

핵심 체크 항목 (티어 S 및 M/L의 모든 AC):

1. **타입 체크** — `npx tsc --noEmit`이 오류 0건으로 통과.
2. **테스트** — 테스트 스위트가 있으면 `npm test` 실행.
3. **비주얼 체크** — `xcrun simctl io booted screenshot <path>`로 iOS 시뮬레이터를 캡처하고 이미지를 열어 직접 확인한다. 변경 사항이 실제로 렌더링되었는지(레이아웃, 색상, 텍스트) 확인한다 — 캡처만 하고 확인하지 않은 스크린샷은 인정하지 않는다.
4. **인터랙션 체크** — 눈으로만 보지 말고 실제로 변경된 동작을 실행한다: 시뮬레이터 제어(`xcrun simctl`, 해당되는 경우 브라우저/E2E 도구)로 탭/스크롤/입력하고 기대한 상태 변화(내비게이션, 토글, 리스트 갱신)를 확인한다.
5. **회귀 체크** — 변경된 화면으로 이동하기 전/후의 인접 화면을 방문해 여전히 정상적으로 렌더링·동작하는지 확인한다.
6. **컨벤션** — `.docs/rules/component-convention.md` (파일 구조, import 순서).
7. **네이티브 모듈** — 네이티브 모듈이 추가/제거된 경우: `cd ios && pod install` 후 `npx expo run:ios`로 리빌드한다 (JS 리로드만으로는 네이티브 뷰가 등록되지 않으며, 그렇지 않으면 "Unimplemented component" 오류가 발생한다).

M/L 티어는 AC마다 Q1~Q10까지 추가로 확인한다 — `.docs/rules/feature-pipeline.md` §4.

## 자가 수정 루프 (자동 — 사용자에게 묻지 않음)

- 어떤 체크라도 실패하면: 원인을 진단하고 수정한 뒤 모든 체크를 처음부터 다시 실행한다.
- **반복 횟수 제한 없음.** Taylor 검증(검증 체크리스트)에서 버그/오류/기능 문제가 0건이 될 때까지 동일한 Claude Code 세션 내에서 Chris↔Taylor 루프를 계속한다. 중간 실패는 사용자에게 보고하지 않는다.
- **예외(구조적 차단)**: 코드 수정으로는 해결 불가능한 문제 — 자격증명/API 키 부재, 시뮬레이터·환경·네트워크 문제 등 — 가 확인되면 즉시 루프를 중단하고, 무엇이 막혔는지·무엇을 시도했는지·왜 코드 수정으로 해결 불가능한지를 보고한 뒤 지시를 기다린다. 단순히 반복 횟수가 많다는 이유만으로는 중단하지 않는다.
- 깨진 AC를 다음 AC로 절대 넘기지 않는다.

## 최종 통합 검증 (커밋 전 / G6 핸드오프 전)

모든 기능이 개별적으로 통과한 후: `npx tsc --noEmit`을 한 번 더 실행하고, 앱에서 주요 영향 플로우를 처음부터 끝까지 직접 확인한다 (스크린샷 증빙). 이 검증을 통과하기 전까지 다중 기능 작업은 "완료"가 아니다.

## 완료 보고 (증빙 체크리스트 — Taylor → Manager → 사용자, G6 시점)

티어 M/L: `05-qa-report.md` 작성 후 `06-handoff-to-user.md` 작성. 티어 S: 동일한 표로 인라인 보고.

완료 보고는 반드시 AC별 증빙 체크리스트와 함께 제공한다. 예:

| 기능   | tsc         | 스크린샷      | 인터랙션       | 회귀           |
| :----- | :---------- | :------------ | :------------- | :------------- |
| 기능 A | ✅ 0 errors | `<path>` 확인 | 탭 → 이동 확인 | 인접 화면 정상 |

이 표 없이 "완료"라고 보고하는 것은 결함이다. 체크를 건너뛴 경우(예: 시뮬레이터 미부팅) 통과한 것처럼 암시하지 말고 명시적으로 밝힌다.

---

## Handoff 규칙

1. 이전 번호 파일 + 게이트 **Pass** 후 다음 단계.
2. WIP: `.docs/wip/{feature-slug}/`
3. **사용자 확인**: `06-handoff-to-user.md` 이후에만.
