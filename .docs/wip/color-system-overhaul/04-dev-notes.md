---
feature-slug: color-system-overhaul
tier: L
author: chris
status: dev-complete (Taylor 검증 대기)
---

# Dev notes — 디자인 토큰(컬러 시스템) 전면 개편

## Implemented ACs

| AC        | 내용                                             | 상태        | tsc      | grep 게이트                                                | 시각 증빙                                                                         |
| --------- | ------------------------------------------------ | ----------- | -------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| AC-1      | `gray100`~`gray900` 9토큰 두 정본 파일에 추가    | ✅ Done     | 0 errors | 두 파일 9개 hex 100% 일치 (스크립트 대조)                  | `evidence/ac01/` — `settings-index` **픽셀 IDENTICAL**                            |
| AC-2      | `bg-primary`/`bg-secondary` 전수 분류표          | ✅ Done     | —        | 53건 전수, 미분류 0건, `bg-secondary` 0건                  | 산출물: `bg-primary-inventory.md`                                                 |
| AC-3      | `src/components/common` + `layout`               | ✅ Done     | 0 errors | `text-*` 잔여 0                                            | `evidence/ac03/` — settings-index IDENTICAL, search/terms ~0.18%(홈 인디케이터만) |
| AC-4      | `src/components/explore` + `search`              | ✅ Done     | 0 errors | `text-*`/neutral `bg-*` 잔여 0                             | `evidence/ac04/` — tabs-search IDENTICAL                                          |
| AC-5      | `archive` + `mypage` + `settings` 컴포넌트       | ✅ Done     | 0 errors | 잔여 0 (brand만 남음)                                      | `evidence/ac05/` — tabs-diary IDENTICAL, diary-date ~0.18%                        |
| AC-6      | `map` + `guide` + `auth` + `onboarding` 컴포넌트 | ✅ Done     | 0 errors | 잔여 0                                                     | `evidence/ac06/` — guide-chat IDENTICAL, auth-login ~0.18%                        |
| AC-7      | `app/(tabs)/`                                    | ✅ Done     | 0 errors | 잔여 **0건**                                               | `evidence/ac07/` — 5개 탭 중 3개 IDENTICAL, 2개 ~0.18%/동적 데이터                |
| AC-8      | `app/(guide)/` (최대 규모)                       | ✅ Done     | 0 errors | 잔여 0 (brand 1건만)                                       | `evidence/ac08/` — 7화면 중 5개 IDENTICAL                                         |
| AC-9      | `app/(explore)/` + `app/diary/`                  | ✅ Done     | 0 errors | 잔여 0 (brand 4건만)                                       | `evidence/ac09/`                                                                  |
| AC-10     | `app/settings/` (하위 10화면)                    | ✅ Done     | 0 errors | 잔여 0 (brand 7건만)                                       | `evidence/ac10/` — 10화면 중 4개 IDENTICAL, 4개 ~0.18%                            |
| AC-11     | `app/auth/` + `app/onboarding/` + 최상위 3화면   | ✅ Done     | 0 errors | 잔여 0 (brand 2건만)                                       | `evidence/ac11/` — 3개 IDENTICAL                                                  |
| AC-12     | `colors.*` JS 직접 참조 이관                     | ✅ Done     | 0 errors | `colors.(primary\|secondary\|tertiary\|muted)` **0건**     | AC-13 전수 스윕에 포함                                                            |
| **AC-13** | **잔여 참조 0건 게이트**                         | ✅ **PASS** | 0 errors | 아래 §AC-13 게이트 결과                                    | `evidence/ac13/` — **32개 라우트 전수 스윕**                                      |
| AC-14     | 브랜드 컬러 정의 교체 + brand 표면 적용          | ✅ Done     | 0 errors | —                                                          | `evidence/ac14/`                                                                  |
| AC-15     | 구 `accent` 19개 지점 → 브랜드 컬러              | ✅ Done     | 0 errors | `#3B82F6` **0건**, 구 `accent` 참조 **0건**                | `evidence/ac15/` — 32개 라우트 전수 스윕                                          |
| AC-16     | dark/warm/gradient + highContrast 대비 검증      | ✅ Done     | —        | —                                                          | 산출물: `ac16-contrast-report.md`, `evidence/ac16/`                               |
| AC-17     | `.docs/DESIGN_SYSTEM.md` 정본 갱신               | ✅ Done     | —        | 문서 hex ↔ `tailwind.config.js` 자동 대조 **MISMATCH 0건** | —                                                                                 |

**최종 통합 검증**: `npx tsc --noEmit` → 0 errors / `npm test` → **2 suites, 37 tests PASS**.

## Baseline 스크린샷

- 경로: `.docs/wip/color-system-overhaul/evidence/baseline/` — **32개 라우트**, AC-1 착수 **전에** 확보.
- 캡처 방식: `xcrun simctl openurl booted "my-app://<route>"` 딥링크 후 `xcrun simctl io booted screenshot`.
  (설치된 dev build의 URL scheme은 `app.config.js`의 `mollip`이 아니라 **`my-app`** — 빌드가 config보다 오래됨. `mollip://`는 `-10814`로 실패한다.)
- 커버리지: `app/` 라우트 파일 37개 중 `_layout.tsx` 5개를 제외한 **32개 전부**. 01-spec이 말한 "33개"와의 차이는 `_layout` 계산 방식 차이이며 실제 스크린 누락은 없다.
- 비교 도구: PIL 기반 픽셀 diff 스크립트(상태바 상단 140px 제외, 4px 샘플링). 결과 표기 — `IDENTICAL` / `~same <0.5%` / `DIFF`.

### DIFF로 표시된 항목의 원인 (전부 색상 회귀 아님 — 이미지 직접 확인 완료)

| 화면                                                            | 원인                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `tabs-index`, `tabs-map`, `explore-route`                       | 실시간 API 데이터 / 지도 카메라 위치 변동                                        |
| `onboarding-index`, `settings-preferences`                      | 취향 스와이프 덱의 랜덤 작품                                                     |
| `settings-voice`                                                | 음성 목록 정렬 순서가 매 로드마다 다름 (baseline과 나란히 비교해 색상 동일 확인) |
| `settings-index`, `settings-general`, `diary-date` 등 상단 bbox | Expo dev 모드 "Refreshing..." 배너로 인한 레이아웃 시프트                        |
| `guide-chat` (0.72%)                                            | **의도된 버그 수정** — 아래 §Deviations 1번                                      |

## AC-13 게이트 결과

```
패턴 1: (text|bg|border|border-t|...|shadow)-(primary|secondary|tertiary|muted)
  → 33건. 전부 bg-primary이며 AC-2 분류표의 brand 33행과 1:1 정확히 일치.
패턴 2: colors.(primary|secondary|tertiary|muted)
  → 0건
패턴 3: colors['primary'] 등 bracket/구조분해 접근
  → 0건
```

AC-13 PASS를 확인한 뒤에만 AC-14에 착수했다.

## Changed files

### 토큰 정본 (2개)

- `tailwind.config.js` — gray100~900·`primary-dark`·`white` 추가, `primary`/`secondary`/`accent` 값 교체, `tertiary`/`muted` **제거**
- `src/constants/colors.ts` — 동일 변경(`primaryDark` camelCase)

### 색상 치환 (커밋 단위 A) — 58파일

`src/components/` (common 5, layout 1, explore 14, search 2, archive·mypage·settings 다수, map 5, guide 5, auth 1, onboarding 2)
`app/` ((tabs) 5, (guide) 7, (explore) 2, settings 9, auth 1, onboarding 2, diary 1, terms/privacy-policy 2)

### a11y 보강 (커밋 단위 B — 색상 치환과 분리, Manager 지시)

| 파일                                        | 변경                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/components/common/DatePickerModal.tsx` | 초기화·확인 버튼에 `hitSlop={8}` + `accessibilityRole='button'` + `accessibilityLabel` **추가** |
| `app/onboarding/location.tsx`               | "나중에 설정할게요" 버튼에 `hitSlop={8}` **추가**                                               |

> `app/settings/inquiry.tsx:103`(D-1 대상)은 `accessibilityState={{ disabled }}`·`hitSlop`이 **이미 존재**해서 추가 작업이 없었다. `ExcludeWordsModal`·`DiaryCalendar`도 동일.

### 문서 (3개)

- `.docs/DESIGN_SYSTEM.md` — §1.2 드리프트 해소 기록 + §1.2.1 마이그레이션 매핑표 신설 + §1.3 전면 재작성(무채색/브랜드/기타 3분할, 판정 트리·금지 규칙 포함). `description`/`error`/`error-alt`/`success` 행은 무변경.
- `.docs/wip/color-system-overhaul/bg-primary-inventory.md` (AC-2 산출물)
- `.docs/wip/color-system-overhaul/ac16-contrast-report.md` (AC-16 산출물)

### 커밋 분리 제안

| 단위  | 대상                                                        | 메시지(안)                                                   |
| ----- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| A-1   | `tailwind.config.js`, `src/constants/colors.ts` (AC-1 부분) | `feat(config): 무채색 명도 스케일 gray100~gray900 토큰 추가` |
| A-2   | AC-3~12 치환 파일 전체                                      | `refactor(ui): 텍스트 명도 토큰을 gray 스케일로 이관`        |
| A-3   | 토큰 정의 교체 + brand 표면 + accent 이관 (AC-14/15)        | `feat(config): 브랜드 컬러를 더스티 라벤더로 교체`           |
| **B** | `DatePickerModal.tsx`, `onboarding/location.tsx`            | `fix(ui): 보조 버튼 터치 타겟·접근성 속성 보강`              |
| C     | `.docs/*`                                                   | `docs(config): 컬러 토큰 정본 개편 반영`                     |

## Deviations (브리프/스펙과 다르게 처리한 것 — Manager 판단 요청)

1. **`app/(guide)/chat.tsx:179,220` 기존 버그 수정으로 색이 실제로 바뀌었다.**
   `style={{ backgroundColor: highContrast ? HIGH_CONTRAST_COLOR : 'bg-primary' }}` — `backgroundColor`에 className 문자열이 들어가 무효값이었다. `colors.gray900`으로 고쳤고, 그 결과 채팅 빈 상태 원형 아이콘과 입력 필드에 배경색이 **새로 생겼다**(baseline 대비 0.72% 차이). 02-design-brief §N-부속이 예고한 대로 회귀가 아니라 버그 수정이다. Taylor 고지 대상.

2. **02-design-brief §B-6의 `app/settings/delete-account.tsx:193` 배경 판정이 사실과 다르다.**
   브리프는 "다크 배경 위이므로 `text-primary`"라고 적었으나 실제로는 `<Screen variant="warm">`(라이트) 안의 `bg-blue-50` 팁 카드다. B-6의 규칙("라이트 배경 위 브랜드 텍스트는 `primary-dark`")을 적용해 **`text-primary-dark`**로 넣었다. 규칙을 따랐고 브리프 문장만 어긋난 케이스.

3. **02-design-brief §N 확정표에 없는 `bg-primary` 히트 2건**을 판정 트리로 기계 적용했다 (`bg-primary-inventory.md` 하단에 별도 표기).
   - `app/onboarding/location.tsx:43` 아이콘 원형 → B-2 `bg-primary`
   - `src/components/search/ExcludeWordsModal.tsx:98` 제외어 pill(흰 13px 라벨) → B-1 `bg-primary-dark`

4. **구 `accent` 사용처는 01-spec의 "16곳"이 아니라 실측 19곳이었다.** 전부 이관했다(탭바 1, guide 12, settings 3, diary 1, ChatMessage 1, voice 1).

5. **`accent` 토큰 값 교체(#3B82F6 → #D9A0A0) 시점을 AC-14가 아니라 AC-15로 미뤘다.**
   AC-14에서 값만 바꾸면 미이관 상태의 16곳이 일시적으로 코럴로 렌더된다. AC-15에서 사용처 이관을 끝낸 직후 값을 교체해 중간 오염 상태를 없앴다. 최종 결과는 T-1 표와 동일.

6. **D-1 적용 과정에서 `inquiry.tsx` 비활성 라벨 색을 함께 바꿨다.** `bg-gray400` 위에 `text-gray500`이 남아 있으면 1.1:1로 라벨이 완전히 소실된다. 브리프 D-1이 명시한 `text-white`로 통일하며 무의미해진 `cn(... canSubmit ? 'text-white' : 'text-white')` 삼항을 평문 className으로 정리했다.

7. **02-design-brief §B-4가 `app/(guide)/exit-summary.tsx:131`을 다크 화면으로 잘못 분류했다 — 최종 스윕에서 잡아 수정.**
   실제로는 `<Screen variant="warm">`(라이트)이고 CTA "다른 전시 보러가기"에 **흰 라벨**이 올라간다. 브리프대로 `bg-primary`를 넣으면 4.24:1로 AA 본문 미달 상태가 된다. 판정 트리(라이트 + 흰 텍스트 → B-1)를 적용해 **`bg-primary-dark`(6.61:1)**로 정정했다. 같은 파일 `:111` 체크 아이콘은 텍스트가 아니라 아이콘이라 비텍스트 3:1 기준이 적용되므로 `text-primary` 유지(약 3.8:1). 다만 웜 배경 위 라벤더 체크가 다소 흐릿하게 보이므로 Sam 재확인이 필요할 수 있다.

8. **`gradient` variant는 앱에 실제 사용처가 0건**이다(`variant="gradient"` grep 0). AC-16 검증을 위해 임시로 한 화면에 적용해 캡처하고 원복했다.

## Blockers for Taylor

1. **[구조적] 시뮬레이터 터치 자동화 불가.**
   `idb`·`maestro` 미설치, AppleScript System Events가 접근성 권한 거부(`-1719`)로 Simulator 윈도우에 접근하지 못한다. 따라서 **탭·스크롤·입력 인터랙션을 실제로 실행하지 못했다.** 대체 수단으로 딥링크(`my-app://<route>`) 네비게이션 + 스크린샷을 썼고, 이것으로 라우트 전환·화면 렌더·탭바 활성 상태는 검증했다. 검증 못 한 항목: pressed opacity 전이, 칩/필 토글 실사용, 바텀시트 드래그, 폼 입력.
   → Taylor가 이 항목을 채우려면 `brew install facebook/fb/idb-companion` 또는 Maestro 설치, 혹은 터미널 앱에 손쉬운 사용 권한 부여가 필요하다. **코드 수정으로 해결 불가.**

2. **라벤더와 하드코딩 블루의 공존.** `#60A5FA`·`text-blue-400`·`bg-blue-50`이 6개 파일에 남아 있다(`ac16-contrast-report.md` §(c) 목록). `accent` 토큰이 아니라 1회성 하드코딩이라 01-spec Non-goals 범위 밖이지만, `app/(guide)/playlist.tsx`에서 라벤더 FAB와 블루 "몰입 모드 진행 중" 라벨이 한 화면에 같이 보인다. 후속 범위 지정이 필요하다.

3. **다크 화면 흰 라벨 4.24:1** — AA 본문 미달(알려진 1건). 완화 경로는 `highContrast`이며 정상 동작을 확인했다. `ac16-contrast-report.md` §(a) 참고.

4. **로그인이 필요한 화면**(다이어리 탭 등)은 현재 시뮬레이터 세션이 미로그인이라 로그인 프롬프트 상태로 캡처됐다. `ArchiveDiaryEmpty`·`VisitTicketFooter` 등 로그인 후 화면의 실데이터 렌더는 미검증.

## Empty 상태 카피 확정 기록 (03-design-review Suggestion 4 반영 — 문구 무변경 확인용)

| 화면 / 컴포넌트            | Title                        | Subtitle / 안내                                   | CTA (색만 변경)                                                                           |
| -------------------------- | ---------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ArchiveDiaryEmpty`        | `아직 관람 기록이 없어요`    | `전시 가이드를 들으면 이 달력이 채워져요`         | `전시 둘러보기` (`bg-primary-dark`) / `지도에서 찾기` (`border-divider bg-white`, 무변경) |
| `ArchiveLoginPrompt`       | `로그인하고 관람을 기록해요` | `북마크와 관람 다이어리는 계정에 저장돼요`        | `로그인하기` (`bg-primary-dark`)                                                          |
| `ExcludeWordsModal`        | `제외할 검색어`              | `입력한 단어가 포함된 전시는 결과에서 빠집니다`   | `완료` (`bg-primary-dark`)                                                                |
| `SavedExhibitions`         | `저장한 전시가 없어요`       | —                                                 | —                                                                                         |
| `app/(guide)/playlist.tsx` | `아직 들은 작품이 없어요`    | —                                                 | FAB (`bg-primary`)                                                                        |
| `app/(guide)/chat.tsx`     | `작품이 궁금하신가요?`       | `작가, 시대적 배경, 기법 등\n무엇이든 물어보세요` | 전송 버튼 (활성 `colors.primary` / 비활성 `text-gray400`)                                 |
| `VisitTicket`              | `이날 들은 작품이 없어요`    | —                                                 | —                                                                                         |

**카피는 한 글자도 바뀌지 않았다.** 위 문자열은 코드에서 그대로 추출한 현행 값이다.

## Native / env notes

- **네이티브 모듈 추가/제거 없음.** `pod install` / `npx expo run:ios` 리빌드 불필요. JS 리로드로 충분하다.
- **단, `tailwind.config.js`를 바꿀 때마다 NativeWind CSS 재컴파일이 필요하다.** AC-1과 AC-14/15 시점에 `pkill -f "expo start"` → `npx expo start --dev-client -c`(캐시 클리어)로 metro를 재기동한 뒤 앱을 재실행했다. 캐시를 안 지우면 새 토큰이 무시되어 className이 조용히 실패한다(런타임 에러 없음).
- 설치된 dev build(`com.simune.aaa`)의 URL scheme은 **`my-app`** 이다. `app.config.js`에는 `mollip`로 되어 있으나 빌드가 오래됐다. 다음 네이티브 리빌드 시 scheme이 `mollip`로 바뀌므로, 이 문서의 딥링크 명령은 그때 갱신해야 한다.
- 개발 서버: `npx expo start --dev-client` (포트 8081). 검증 중 metro를 3회 재기동했다.
