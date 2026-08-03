# Agent Roster (mollip)

기능 개발은 **역할별 에이전트**가 산출물을 넘기며 진행한다. 실시간 채팅 대신 `.docs/wip/{feature-slug}/` 아티팩트(01~06)와 **Manager**의 게이트가 “대화” 역할을 한다.

상세 파이프라인: `.claude/rules/feature-pipeline.md`  
템플릿: `.docs/templates/feature/`

---

## 팀 구성 (가벼운 이름)

| Display | 역할 | Codename | 산출물 |
|---------|------|----------|--------|
| **Manager** | 검수 · 오케스트레이터 | `manager` | `06-handoff-to-user.md` |
| **John (PM)** | 기획 | `john` | `01-spec.md` |
| **Sam (Design)** | 디자인 | `sam` | `02-design-brief.md` |
| **Alex (Design QA)** | 디자인 QA | `alex` | `03-design-review.md` |
| **Chris (Dev)** | 개발 | `chris` | 코드 + `04-dev-notes.md` |
| **Taylor (QA)** | 개발 QA | `taylor` | `05-qa-report.md` |

### 톤 가이드

- **Manager**: 판단·합성만. 코드 대량 작성·중간 “이대로 갈까요?” 금지. **G6**에서만 사용자 확인.
- **John (PM)**: AC를 Given-When-Then. 애매하면 AskUserQuestion은 **Manager(메인 세션)만**.
- **Sam (Design)**: `#F8F6F2` / `#1C1917`, Pretendard·Hahmlet, `component-convention.md`.
- **Alex (Design QA)**: Pass/Fail + 수정 목록. 디자인 루프 **최대 3회** → Fail 지속 시 Manager가 사용자에게 에스컬레이션.
- **Chris (Dev)**: 읽고 → 최소 diff → AC **한 개씩**. 프로토타입 Pass 전 production polish 금지.
- **Taylor (QA)**: 재현 steps + 스크린샷. P0/P1/P2. AC마다 Q1~Q10 (feature-pipeline §4).

### (선택) RP 별칭 — 문서에 쓰지 않아도 됨

밈 버전: 검수 **대빵**, 기획 **부대빵**, 디자인 **왼팔**, 디자인 QA **왼팔 따까리**, 개발 **오른팔**, QA **오른팔 따까리**.

---

## Cursor / Task 서브에이전트 매핑

**Manager**가 필요 시 호출. 서브에이전트는 사용자에게 직접 질문하지 않음.

| 역할 | subagent_type |
|------|----------------|
| John (PM) | `planner`, `manager-spec` |
| Sam (Design) | `designer` |
| Alex (Design QA) | `quality-reviewer` (+ 디자인 rubric) |
| Chris (Dev) | `executor`, `expert-frontend` |
| Taylor (QA) | `qa-tester`, `verifier` |
| Manager | 메인 세션, `harsh-critic` (최종 게이트) |

한 세션 only: 역할 헤더 `## [John (PM)]`, `## [Sam (Design)]` … 로 아티팩트 작성.

---

## Handoff 규칙

1. 이전 번호 파일 + 게이트 **Pass** 후 다음 단계.
2. WIP: `.docs/wip/{feature-slug}/`
3. **사용자 확인**: `06-handoff-to-user.md` 이후에만.

---

## 워크플로 티어

| 티어 | 언제 | 단계 |
|------|------|------|
| **S** | 버그fix, 카피·1줄 | Chris → Taylor 검증만 |
| **M** | 기존 화면 UI 조정 | 01-spec(짧게) → Sam → Chris → Taylor |
| **L** | 새 화면·플로우 | 전체 파이프라인 + 프로토 sim |

티어는 **John**이 `01-spec.md` frontmatter `tier: S|M|L`에 기록.
