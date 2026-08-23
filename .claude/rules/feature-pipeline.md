# Feature Pipeline (MANDATORY for tier M/L)

@AGENTS.md

기능 작업은 **Manager**가 오케스트레이션한다. 기획·디자인·QA가 **문서와 게이트**로 연결된다.

---

## 1. 파이프라인 개요

```
John(01-spec)
  → Sam(02-design-brief)
  → Alex(03-design-review) ⟲ 최대 3회
  → 프로토타입 시뮬 스모크
  → Chris(개발, AC 단위) ⟲ Taylor QA per AC
  → Taylor(05-qa-report) 종합
  → Manager(06-handoff-to-user) → 사용자 확인
```

### 게이트

| # | Gate | Pass 조건 |
|---|------|-----------|
| G1 | Spec | AC ≥ 1, out-of-scope, tier |
| G2 | Design | `02-design-brief.md` |
| G3 | Design QA | Alex → **Pass** (Fail → Sam) |
| G4 | Prototype | sim 스크린샷 + 1 인터랙션 (L 필수, M은 UI 변경 시) |
| G5 | Dev+QA | AC Done, P0=0, tsc+Jest+회귀 |
| G6 | User | `06-handoff-to-user.md` 후 사용자 승인 |

---

## 2. 디자인 QA 루프 (Alex)

4항목 1~5점. **overall ≥ 4.0/5**, 항목별 **≥ 3**. **max 3** iterations → Fail 지속 시 Manager → user.

---

## 3. 프로토타입 시뮬 스모크

Chris 최소 UI 연결 후 Taylor(또는 Chris 직후 QA):

1. `xcrun simctl io booted screenshot .docs/wip/{slug}/evidence/prototype.png`
2. 이미지 inspect
3. 핵심 인터랙션 1회+

Fail → Sam 또는 Chris.

---

## 4. QA 회귀 루프 (Taylor)

AC마다 Q1~Q10. Fail → Chris 수정 후 전체 재실행. Self-fix **5회**/AC.

| # | 영역 |
|---|------|
| Q1 | `npx tsc --noEmit` |
| Q2 | `npm test` |
| Q3 | 버그 / edge |
| Q4 | UX |
| Q5 | component-convention |
| Q6 | sim screenshot + inspect |
| Q7 | interaction |
| Q8 | regression paths |
| Q9 | perf (light) |
| Q10 | native module rebuild if needed |

---

## 5. Manager — 사용자 Handoff

G6 전 “완료” 보고 금지. `06-handoff-to-user.md` + evidence table.

---

## 6. 아티팩트

`.docs/templates/feature/` → `.docs/wip/{feature-slug}/`

---

## 7. 커밋

사용자 요청 전 commit 금지.

---

## 8. 템플릿 사용 (MANDATORY — 항상 적용)

**사용자가 `/moai:plan`을 실행하지 않아도** 모든 개발·리팩토링 작업은 `.docs/templates/feature/` 템플릿을 기준으로 진행한다.

### 규칙

- 작업 시작 시 `.docs/templates/feature/` 내 템플릿 목록을 확인한다.
- 티어(S/M/L)에 맞는 아티팩트를 `.docs/wip/{feature-slug}/`에 생성한다.
- `/moai:plan` 호출 여부와 무관하게 파이프라인 게이트(G1~G6)를 준수한다.
- 템플릿 없이 코드부터 작성하는 것은 금지. 항상 spec → design → dev → QA 순서를 따른다.

### 티어별 최소 아티팩트

| 티어 | 필수 아티팩트 |
|------|------------|
| S | 인라인 evidence 표 (06-handoff 대체) |
| M | 01-spec, 02-design-brief, 05-qa-report, 06-handoff-to-user |
| L | 01-spec, 02-design-brief, 03-design-review, 04-dev-notes, 05-qa-report, 06-handoff-to-user |
