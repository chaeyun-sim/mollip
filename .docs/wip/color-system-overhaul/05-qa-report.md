---
feature-slug: color-system-overhaul
author: taylor
status: complete
---

# QA report — 디자인 토큰(컬러 시스템) 전면 개편

## Summary

- **P0: 0** (핸드오프 가능)
- P1: 2 / P2: 3
- Tier: L (AC 17개)
- Date: 2026-08-27
- **판정: Conditional Pass** — P0 0건이므로 G5 게이트는 통과. 단 **P1-1은 Manager 판단 없이 그대로 커밋하면 안 된다**(범위 밖 변경 + 자체 규칙 위반).

모든 수치는 Chris의 보고를 인용하지 않고 **Taylor가 백지에서 재실행·재계산**했다. 재현 명령은 각 Finding에 그대로 적어 두었다.

### 재검증한 게이트 (Chris 보고와 대조)

| 항목 | Chris 보고 | Taylor 재실행 | 일치 |
|---|---|---|---|
| `npx tsc --noEmit` | 0 errors | **0 errors** (exit 0) | ✅ |
| `npm test` | 2 suites / 37 tests | **2 suites / 37 tests PASS** | ✅ |
| 토큰 두 정본 hex 대조 | 100% 일치 | **VALUE MISMATCH 0건**, `tertiary`/`muted` 양쪽 제거 확인 | ✅ |
| `#3B82F6` / 구 `accent` 잔여 | 0건 | **0건** | ✅ |
| AC-16 대비 수치 | 4.24 / 4.32 / 3.93 | **4.24 / 4.32 / 3.93** (독립 계산 일치) | ✅ |
| AC-13 패턴 2 (`colors.*`) | **0건** | **1건** (`app/(guide)/chat.tsx:245`) | ⚠️ 아래 §보고 정확도 1 |
| AC-13 패턴 1 구성 | "33건 **전부 bg-primary**" | 33건이나 **bg 22 + text 8 + border 3** | ⚠️ 아래 §보고 정확도 1 |

---

## AC matrix

Q10(네이티브 모듈)은 전 AC 공통 **N/A** — 네이티브 모듈 추가/제거 0건을 `package.json` diff로 확인했고, `pod install` / 리빌드 불필요하다는 Chris 판단이 맞다.
Q7은 **구조적 차단**(터치 자동화 불가, §Blockers)으로 전 AC에서 **정적 코드 리뷰 + 딥링크 네비게이션**으로 대체했다. `SIM` = 실탭 미실행, 대체 검증만 수행했다는 뜻이다.

| AC | Q1 tsc | Q2 jest | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact | Q8 regress | Q9 perf |
|----|--------|---------|--------|-------|---------|-----------|-------------|------------|---------|
| AC-1 토큰 추가 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ IDENTICAL | SIM | ✅ | ✅ |
| AC-2 분류표 | — | — | ✅ | ✅ | — | — | — | — | — |
| AC-3 common/layout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-4 explore/search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-5 archive/mypage/settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-6 map/guide/auth/onboarding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-7 app/(tabs) | ✅ | ✅ | ⚠️ **P1-1** | ⚠️ **P1-1** | ✅ | ⚠️ 미커버 | SIM | ✅ | ✅ |
| AC-8 app/(guide) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-9 app/(explore)+diary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-10 app/settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-11 auth/onboarding/최상위 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-12 colors.* 이관 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-13 잔여 0 게이트 | ✅ | ✅ | ✅ | — | ✅ | ✅ 32라우트 | SIM | ✅ | ✅ |
| AC-14 브랜드 정의 교체 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SIM | ✅ | ✅ |
| AC-15 accent 이관 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 32라우트 | SIM | ✅ | ✅ |
| AC-16 대비 검증 | — | — | ✅ | ✅ | — | ✅ | SIM | ✅ | ✅ |
| AC-17 DESIGN_SYSTEM.md | — | — | ✅ | ⚠️ **P1-2** | — | — | — | — | — |

**AC-7만 조건부.** 나머지 16개 AC는 Then 절 기준 전부 충족.

### AC별 Then 절 충족 근거 (핵심만)

- **AC-1**: 두 정본 파일 9개 hex 파싱 대조 → mismatch 0. `evidence/ac01/settings-index` 픽셀 IDENTICAL.
- **AC-13**: 게이트가 **AC-14 착수 전에** 실행됐음을 dev-notes 순서와 `evidence/ac13/` 32라우트 캡처로 확인. 01-spec [P0] "순서 위반 시 앱 전역 오염" 리스크는 실현되지 않았다.
- **AC-14**: `bg-primary`/`bg-primary-dark` 각 21건이 brand 표면에 적용, `neutral` 분류 표면(바코드 바·시트·마커)은 `gray900` 유지 — `evidence/final/tabs-diary.png`의 바코드가 검정으로 렌더되어 육안 확인.
- **AC-15**: `#3B82F6` 0건 / 구 `accent` 0건 독립 확인. 탭바 활성 tint는 `colors.primaryDark` (§보고 정확도 3).
- **AC-17**: 문서 hex ↔ `tailwind.config.js` 1:1 일치, `tertiary`/`muted`는 §1.2.1 마이그레이션 이력에만 등장(유효 토큰 표기 아님), `description`/`error`/`error-alt`/`success` 4행 무변경 — 전부 충족. 대비 **수치** 오류는 Then 절 범위 밖이라 Pass, 단 P1-2로 별도 기록.

---

## Findings

### P0 (ship blocker)

**없음.**

### P1

#### P1-1 — `app/(tabs)/index.tsx:140` 범위 밖 색상 변경 + AA 본문 대비 미달 (홈 화면)

가장 중요한 발견. **Deviations 8건에 포함되지 않은 미신고 변경**이다.

```
- <Text className="text-[#B8623D] font-pretendard-bold">딱 맞는 전시를 추천</Text>   (원본)
+ <Text className="text-primary font-pretendard-bold">딱 맞는 전시를 추천</Text>      (현재)
```

- **화면 배경**: `app/(tabs)/index.tsx:95` = `<Screen variant="warm">` → `bg-bg-light` `#F8F6F2` (라이트).
- **대비 (Taylor 독립 계산)**: 신규 `#81759B` on `#F8F6F2` = **3.93:1** → AA 본문 4.5:1 **미달**. 원본 `#B8623D` = 4.01:1(역시 경계이나 더 높음). **개편이 대비를 낮췄다.**
- **자체 규칙 위반 3중**:
  1. `.docs/DESIGN_SYSTEM.md` §1.3 (AC-17 산출물, Chris 본인 작성): "**`primary`를 라이트 배경 위 본문 텍스트/링크 색으로 쓰지 않는다**".
  2. `ac16-contrast-report.md` L23: `primary` on `gray100` → "**❌ 본문 금지**".
  3. `01-spec.md` Non-goals: "1회성 브랜드 색상 토큰화 없음" — `#B8623D`는 레거시 토큰도, 구 `accent` 19지점도 아닌 1회성 하드코딩이라 **애초에 이관 대상이 아니다**.
- **산출물 어디에도 근거 없음**: `.docs/` 전체에 `B8623D` 문자열 **0건**(`grep -rn 'B8623D' .docs/`). 02-design-brief·bg-primary-inventory·Deviations 모두 미언급.
- **증빙 공백**: `evidence/final/tabs-index.png`는 이 줄이 **스크롤 하단이라 화면에 없다**. 즉 이 변경은 **어떤 스크린샷으로도 확인된 적이 없다.**

**재현 스텝**
1. `xcrun simctl openurl booted "my-app://"` → 홈 탭
2. 히어로 캐러셀 아래로 스크롤 → 추천 안내 문장 영역
3. "딱 맞는 전시를 추천" 이 라벤더(`#81759B`)로 렌더 — 주변 본문 대비 흐릿함

**재현 명령 (코드)**: `grep -n '딱 맞는' 'app/(tabs)/index.tsx'`
**스크린샷**: 없음 (미커버 — 이것 자체가 결함)
**우선순위**: **P1** — 회귀는 홈 화면(최다 트래픽) + 자체 규칙 위반. 다만 단일 텍스트 1줄이라 ship blocker는 아님.
**권고 조치 (Manager 택1)**
- (a) **원복** `text-[#B8623D]` — 01-spec Non-goals 준수, 최소 diff. **Taylor 권장.**
- (b) 브랜드 강조가 의도라면 `text-primary-dark`(**6.12:1**, AA 통과)로 변경하고 02-design-brief에 근거 행 추가.
- (c) 현행 유지는 **비권장** — 문서화된 자체 금지 규칙과 정면 충돌.

#### P1-2 — `.docs/DESIGN_SYSTEM.md` §1.3 판정 트리에 폐기된 대비 수치가 정본으로 남음

AC-17 Then 절은 **hex** 일치만 요구하므로 AC-17은 Pass다. 그러나 정본 문서가 **Chris 본인이 이미 틀렸다고 증명한 숫자**를 싣고 있다.

| §1.3 판정 트리 표기 | 실제 (Taylor 독립 계산 = `ac16-contrast-report.md`와 일치) | 차이 |
|---|---|---|
| `bg-primary` 다크 표면 "4.68:1 ✅" | **4.32:1** | Sam 원본 오류. `ac16-contrast-report.md` L21이 "Sam은 ✅로 표기했으나 재계산 4.32"라고 **명시 정정**했는데 정본 문서엔 반영 안 됨 |
| `primary` 라이트 "3.70:1" | **3.93:1** | |
| `primary-dark` + white "6.47:1" | **6.61:1** | |

`bg-primary` 다크 표면은 4.32:1이라 **AA 본문 4.5:1 미달**인데 문서엔 "4.68:1 ✅"로 적혀 있어, 앞으로 이 표를 보고 다크 화면에 본문 텍스트를 얹는 오판을 유발한다.

**재현**: `.docs/DESIGN_SYSTEM.md` §1.3 "브랜드 컬러 사용 판정" 코드블록 ↔ `ac16-contrast-report.md` L19~23 대조
**우선순위**: **P1** (핸드오프 전 수정 권장 — 정본 문서 신뢰성)
**권고**: 세 수치를 4.32 / 3.93 / 6.61로 교체. 4.32는 "표면 3:1 통과 / 본문 4.5:1 미달" 로 병기.

### P2

#### P2-1 — `app/settings/delete-account.tsx:116` disabled 표현이 D-1/D-2 통일 언어에서 누락

02-design-brief §D-2가 `delete-account.tsx:110-114`를 **확인 지점으로 명시**했으나 미변경이고 Deviations에도 없다.

```tsx
className={cn('rounded-full px-3.5 py-1.5', canSubmit ? 'bg-red-500' : 'bg-black/10')}
```

D-1(`bg-gray400`)도 D-2(`text-gray400`)도 아닌 `bg-black/10` 유지. 브리프가 이 요소를 "배경 없는 버튼"(D-2)으로 **오분류**한 게 1차 원인이며(실제로는 red fill CTA), 그 점에서 Chris의 미적용은 방어 가능하다. 다만 **Deviation으로 신고했어야 한다** — 나머지 8건은 신고했다.
영향: 낮음. `accessibilityState={{ disabled: !canSubmit }}` 존재 확인, disabled 요소는 WCAG 1.4.3 예외. 순수 일관성 문제.
**증빙**: `evidence/final/settings-delete-account.png` 우상단 흐린 pill
**권고**: 후속 범위. `bg-gray400` 통일 또는 브리프 D-2 목록에서 제외 정정.

#### P2-2 — 라벤더/하드코딩 블루 공존 (Chris Blocker 2) — **육안 확인 완료, 파일 목록보다 범위가 넓다**

Chris 보고를 스크린샷으로 검증했고 사실이다. 01-spec Non-goals(1회성 하드코딩) 범위 밖이라 **Fail 판정하지 않는다.**

- `evidence/final/guide-playlist.png` — 한 화면에 **라벤더 FAB(+)** 와 **블루 "몰입 모드 진행 중" 라벨·헤드셋 아이콘**이 동시에 보임. 브랜드 정체성 훼손이 가장 뚜렷.
- `evidence/final/guide-exit-summary.png` — **`primary-dark` CTA** 와 **블루 "볼거리" 카테고리 아이콘**이 동시에 보임. Chris의 6파일 목록만 봐선 이 화면이 드러나지 않는다.

잔존 지점(재확인): `bookmark/audio.tsx:193,198`, `playlist.tsx:84,86`, `description.tsx:262,310,399`, `delete-account.tsx:189,196`, `ChatMessage.tsx:110,157`.
**권고**: 후속 스펙으로 분리. 사용자 체감 브랜드 일관성 관점에서 **P2 중 최우선**.

#### P2-3 — `app/(guide)/exit-summary.tsx:111` 체크 아이콘이 흐림 (Chris 자진 신고, 타당)

`text-primary`(#81759B) on `bg-bg-tonal`(#F2EFE9) = **3.70:1**. 비텍스트 3:1 기준 **통과**이므로 결함 아님. 다만 `evidence/final/guide-exit-summary.png`에서 육안으로도 체크마크가 옅게 보인다. Chris의 "Sam 재확인 필요" 판단에 동의.
**권고**: Sam이 아이콘 한정 `primary-dark`(6.12:1) 승격 여부 판단. 후속.

---

## Deviations 검토 (8건 — 전건 승인)

| # | 내용 | Taylor 판정 | 근거 |
|---|---|---|---|
| 1 | `chat.tsx:179,220` 기존 버그 수정으로 실제 색 변화 | **승인** | `backgroundColor: 'bg-primary'`는 RN에서 **무효값**(className 문자열을 style에 주입) → 배경이 아예 안 그려지던 진짜 버그. `colors.gray900`으로 수정 정당. `evidence/final/guide-chat.png`에서 빈 상태 원형 아이콘·입력 필드에 배경이 생긴 것 확인. baseline 0.72% 차이는 **회귀 아님**. 02-design-brief §N-부속이 예고한 케이스. |
| 2 | `delete-account.tsx:193` → `text-primary-dark` (브리프 §B-6 배경 판정 오류) | **승인** | 코드 확인 결과 `<Screen variant="warm">` + `bg-blue-50` 팁 카드 = **라이트**가 맞다. 브리프 문장이 틀렸고 Chris는 브리프의 **규칙**(라이트+브랜드 텍스트→`primary-dark`)을 따랐다. 6.12:1로 AA 통과. ⚠️ 단 이 카드는 조건부 렌더라 **어떤 스크린샷에도 없음** — 렌더 미검증(§증빙 공백). |
| 3 | 확정표 밖 `bg-primary` 히트 2건 판정 트리로 기계 적용 | **승인** | `location.tsx:43` 아이콘 원형→`bg-primary`(비텍스트 3:1), `ExcludeWordsModal.tsx:98` 흰 13px 라벨 pill→`bg-primary-dark`(6.61:1). 둘 다 판정 트리 정확 적용. 인벤토리 하단 별도 표기도 확인. |
| 4 | 구 `accent` "16곳"이 아니라 실측 19곳 | **승인** | 01-spec 자체가 "앱 코드 기준 16건"을 **추정치**로 적었다. Taylor 독립 확인: 구 `accent`·`#3B82F6` 잔여 **0건** — 19곳 전건 이관 완료. |
| 5 | `accent` 값 교체를 AC-14 → AC-15로 연기 | **승인** | AC-14에서 값만 바꾸면 미이관 지점이 일시적으로 코럴 렌더. 연기가 **더 안전**하며 01-spec의 "어느 중간 상태에서도 잘못된 색으로 렌더되지 않는다"(Goals)에 오히려 부합. 최종 결과는 T-1 표와 동일 확인. |
| 6 | `inquiry.tsx` 비활성 라벨 `text-white` 통일 + 무의미 삼항 정리 | **승인 (사실상 Deviation 아님)** | 02-design-brief **§D-1이 `bg-gray400` + `text-white`를 명시적으로 요구**한다. 브리프 준수이지 이탈이 아니다. `bg-divider`→`bg-gray400` 값 변경도 D-1이 지시한 것. (참고: Chris의 "1.1:1"은 실제 **1.44:1** — 방향·결론은 동일, disabled는 WCAG 1.4.3 예외.) 브리프가 함께 요구한 `route.tsx:498` `bg-border` 이관도 완료 확인(`bg-border` 잔여 0건). |
| 7 | `exit-summary.tsx:131` 다크→라이트 재분류, `bg-primary-dark`로 정정 | **승인 — 8건 중 가장 가치 있는 발견** | 코드 확인: `<Screen variant="warm">`(라이트) + CTA 흰 라벨이 맞다. 브리프대로 `bg-primary`면 **4.24:1(AA 미달)**, 정정한 `primary-dark`는 **6.61:1(통과)**. `evidence/final/guide-exit-summary.png`에서 CTA가 짙은 보라로 렌더됨을 육안 확인. `:111` 아이콘 `text-primary` 유지도 비텍스트 3:1 기준상 타당(3.70:1) — P2-3으로 별도 기록. |
| 8 | `gradient` variant 사용처 0건, AC-16 위해 임시 적용 후 원복 | **승인 + 원복 검증 완료** | `variant="gradient"` 현재 **0건**, diff에 gradient 관련 추가분 **0건** → 임시 적용이 남아 있지 않음을 독립 확인. |

---

## Chris 보고 정확도 (결함 아님 — 핸드오프 문서에서 정정 필요)

1. **AC-13 게이트 결과가 "현재 상태"로 읽힌다.** dev-notes는 "패턴 2 → 0건", "33건 **전부 bg-primary**"라고 적었으나 현재 워킹트리는 `colors.primary` **1건**(`chat.tsx:245` 전송 버튼 활성 배경), className 33건의 구성은 `bg-primary` 21 / `bg-primary-dark`는 별도 21 / `text-primary` 4 / `text-secondary` 4 / `border-secondary` 2 / `border-primary` 1 / `bg-secondary` 1이다.
   → **게이트 자체는 유효하다.** 이 히트들은 전부 **AC-14/15에서 브랜드 컬러를 의도적으로 적용하며 새로 생긴 것**이고, AC-13 실행 시점(AC-14 착수 전)엔 실제로 0건/33 bg-primary였다. 순서 위반 없음. 문장을 "AC-13 실행 시점 기준"으로 한정 표기하면 된다.
2. **Blocker 4(로그인 미검증)는 과장이다.** `evidence/final/tabs-diary.png`는 **실제 로그인 상태**(1 Tickets, 이대원 전시 실데이터, 바코드 렌더)이고 `evidence/final/settings-account.png`도 실제 이메일이 노출된 로그인 상태다. `VisitTicketFooter` 바코드 바가 `neutral`(검정) 유지됨도 이 스크린샷으로 검증됐다.
   → 실제 미검증분은 "로그인 필요 화면" 전체가 아니라 **계정에 데이터가 있어 도달 불가한 *빈 상태*** (`ArchiveDiaryEmpty`, `ArchiveLoginPrompt`)로 한정된다.
3. **미신고 Deviation 9번**: 탭바 활성 tint가 `colors.primaryDark`(#625876)다(`app/(tabs)/_layout.tsx:15`). Q1 확정문("16곳 전부 신규 `primary` 라벤더")과 다르다. **판정: 승인** — 라이트 배경 위 텍스트라 `primary`는 3.93:1 미달, `primary-dark`는 6.12:1 통과이며 `.docs/DESIGN_SYSTEM.md` §1.3이 "탭바 활성 tint = primary-dark"로 이미 문서화했다. 올바른 결정이나 Deviations 목록에 없었다.

---

## Evidence

| ID | Path | 확인 내용 (Taylor가 **이미지를 직접 열어** 확인) |
|----|------|------|
| E-1 | `evidence/final/tabs-index.png` ↔ `evidence/baseline/tabs-index.png` | FAB 2개 검정→라벤더, 탭바 활성 블루→라벤더. 그 외 레이아웃·텍스트 명도 동일. **P1-1 대상 줄은 스크롤 하단이라 미커버** |
| E-2 | `evidence/final/guide-playlist.png` | 라벤더 FAB + **블루 라벨 공존** (P2-2 시각 확정) |
| E-3 | `evidence/final/guide-exit-summary.png` | CTA `primary-dark` 짙은 보라 + 흰 라벨(Deviation 7 정상), 체크 아이콘 옅음(P2-3), 블루 카테고리 아이콘 공존(P2-2) |
| E-4 | `evidence/final/guide-chat.png` | 빈 상태 원형 아이콘·입력 필드 **배경 생성** = Deviation 1 버그 수정 반영 |
| E-5 | `evidence/final/auth-login.png` | 카카오 `#FEE500`·Apple 흰색 **무변경** (Non-goals·D-3 준수) |
| E-6 | `evidence/final/settings-index.png` | 선택 pill(1.0x·중) `bg-primary-dark`+흰 라벨(6.61:1), 토글은 `neutral` 검정 유지 |
| E-7 | `evidence/final/settings-account.png` | 로그인 상태 확인. 단 "닫기" 아웃라인 버튼은 모달 내부라 미커버 |
| E-8 | `evidence/final/tabs-diary.png` | **로그인 실데이터** 티켓 + 바코드 바 `neutral` 검정 유지 (AC-2 분류 정확성 입증) |
| E-9 | `evidence/final/settings-delete-account.png` | 우상단 disabled pill `bg-black/10` (P2-1) |
| E-10 | `evidence/final/tabs-search.png` | 태그 칩·최근 검색 명도 위계 baseline과 동일 |
| E-11 | `evidence/baseline/` (32) · `evidence/final/` (32) | 라우트 커버리지 **32/32 양쪽 완비** 확인 |
| E-12 | `evidence/ac13/` (32) · `evidence/ac15/` (32) | 게이트 시점 전수 스윕 존재 확인 |

### 증빙 공백 (통과로 위장하지 않고 명시)

터치 자동화 차단 때문에 **조건부/모달 내부 렌더는 스크린샷 증빙이 없다.** 정적 코드 리뷰로만 검증한 지점:

- `app/settings/delete-account.tsx:189-196` 블루 팁 카드 (**Deviation 2 결과물** — 렌더 미확인)
- `app/settings/account.tsx:92,97` "닫기" 아웃라인 버튼 (`border-secondary`/`text-secondary`)
- `src/components/search/ExcludeWordsModal.tsx:98` 제외어 pill (**Deviation 3 결과물**)
- `app/(tabs)/index.tsx:140` (**P1-1** — 스크롤 하단)
- 전 지점 pressed opacity 전이, 칩/필 토글, 바텀시트 드래그, 폼 입력

---

## Regression paths walked

딥링크 네비게이션 + 전/후 스크린샷 대조로 실제 이동한 경로. **실탭 이벤트는 미실행**(구조적 차단).

1. **홈 → 전시 상세 → 길찾기** — `tabs-index` → `explore-detail` → `explore-route`. 렌더 정상, 텍스트 명도 위계 baseline 동일. `explore-route`의 baseline 차이는 지도 카메라 위치 변동(색상 회귀 아님).
2. **몰입 가이드 플로우** — `guide-immersive-start` → `guide-manual` → `guide-create-description` → `guide-description` → `guide-chat` → `guide-playlist` → `guide-exit-summary`. 7화면 전부 렌더 정상. 다크 화면 흰 라벨 4.24:1 알려진 미달 외 신규 미달 없음.
3. **검색 → 필터** — `tabs-search` 렌더 정상, 태그 칩·최근 검색 위계 동일. (필터 칩 **토글 실사용은 미검증** — 정적 리뷰상 `Chip`의 `active ? 'bg-primary-dark' : INACTIVE_BACKGROUND[variant]` 분기가 브리프 §96과 일치함만 확인.)
4. **마이페이지 → 설정 하위 10화면** — `settings-index` → account / general / voice / description / inquiry / preferences / narration / bookmark-audio / bookmark-exhibition / delete-account. 전부 렌더 정상.
5. **탭바 5개 탭 전환** — `tabs-index` / `search` / `exhibitions` / `map` / `diary`. 활성 tint `primary-dark` 일관 적용, 비활성 `#9CA3AF` 무변경(기존 2.58:1 미달은 개편 무관, 브리프 L291이 사전 기록).
6. **인접 화면 회귀** — `terms` / `privacy-policy` / `notifications` / `onboarding-index` / `onboarding-location` / `auth-login` / `diary-date`. 렌더 정상, 외부 브랜드 고정색 보존.

**Q9 성능**: 이번 변경은 색상 className/상수 치환에 국한되고 리스트 렌더 구조·메모이제이션에 diff 없음(`git diff` 확인). 스크린샷 캡처 중 프레임 드랍·렌더 지연 징후 없음. 신규 재렌더 유발 요인 없음.

---

## Blockers (구조적 — 코드 수정으로 해결 불가)

1. **시뮬레이터 터치 자동화 불가.** `idb`·`maestro` 미설치, AppleScript System Events 접근성 권한 거부(`-1719`). Chris 보고를 그대로 확인했고 Taylor도 우회 수단이 없다.
   → 미검증: pressed opacity 전이, 칩/필 토글 실사용, 바텀시트 드래그, 폼 입력, 모달 내부 렌더.
   → 대체 수행: 딥링크 네비게이션(32라우트) + 스크린샷 육안 확인 + 정적 코드 리뷰(상태 분기의 토큰 매핑 검증).
   → 해소 조건: `brew install facebook/fb/idb-companion` 또는 Maestro 설치, 혹은 터미널 앱 손쉬운 사용 권한 부여. **Manager 판단 필요.**
2. **빈 아카이브 상태 도달 불가.** 현 계정에 관람 데이터가 있어 `ArchiveDiaryEmpty` / `ArchiveLoginPrompt`가 렌더되지 않는다. 신규/빈 계정 필요. (Chris의 "미로그인" 서술은 부정확 — §보고 정확도 2)

---

## Recommendation

- [x] **Ready for Manager handoff (조건부)** — **P0 = 0**, G5 통과.
- [ ] Return to Chris (Dev)

**Chris 반려는 하지 않는다.** 17개 AC의 Then 절이 전부 충족됐고 P0가 없다. 다만 Manager는 핸드오프 전 아래를 처리해야 한다.

| 순위 | 조치 | 담당 |
|---|---|---|
| 1 | **P1-1 결정** — `index.tsx:140`을 원복(권장) 또는 `primary-dark`로 변경. 현행 유지는 자체 문서 규칙과 충돌하므로 비권장 | Manager 결정 → Chris 1줄 수정 |
| 2 | **P1-2** — `.docs/DESIGN_SYSTEM.md` §1.3 대비 수치 3건을 4.32 / 3.93 / 6.61로 정정 | Chris (문서) |
| 3 | 06-handoff에 **보고 정확도 3건**(AC-13 시점 한정 표기, Blocker 4 범위 축소, Deviation 9번 탭바 tint) 반영 | Manager |
| 4 | P2-1 / P2-2 / P2-3을 후속 스펙으로 등록. 특히 **P2-2(블루 잔존)** 는 브랜드 일관성상 우선 | Manager |

P1 2건은 각각 **1줄 코드 수정**과 **문서 수치 3개 교체**로 끝나므로 전체 재검증(Q1~Q10) 부담은 작다. P1-1을 코드 수정하면 `npx tsc --noEmit` + 홈 화면 스크린샷 재캡처만 추가로 필요하다.
