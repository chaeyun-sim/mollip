---
feature-slug: color-system-overhaul
ac: AC-16
author: chris
---

# AC-16 — 다크/warm/gradient variant 대비 검증 결과

## 검증 방법

- 대비비: WCAG 2.1 상대휘도 공식으로 **Chris가 직접 재계산**(03-design-review Suggestion 3 반영). 02-design-brief의 Sam 실측값을 함께 병기해 차이를 드러낸다.
- 육안: iOS 시뮬레이터(iPhone 15 / iOS 17.0) 딥링크 네비게이션 + 스크린샷 직접 확인.
- `highContrast` / `gradient` variant는 코드에서 강제 활성화한 뒤 캡처하고 **원복**했다(아래 "검증 절차의 한계" 참고).

## 대비 실측값 재검산 (Suggestion 3)

| 조합                                     | Sam 브리프 값 | Chris 재계산 | 판정                                                                    | 판정 변화                                                                                                                                                              |
| ---------------------------------------- | ------------- | ------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `primary` #81759B + white                | 3.99:1        | **4.24:1**   | ⚠️ AA 본문(4.5:1) 미달 / AA Large 통과                                  | 없음                                                                                                                                                                   |
| `primary-dark` #625876 + white           | 6.47:1        | **6.61:1**   | ✅ AA 본문                                                              | 없음                                                                                                                                                                   |
| `primary` on `bg-dark` #171412           | 4.68:1        | **4.32:1**   | ✅ 비텍스트 표면 3:1 통과 / ⚠️ **AA 본문 4.5:1은 미달**                 | **변화 있음** — Sam은 "✅ AA 본문"으로 표기했으나 재계산 결과 4.32로 본문 기준 미달. 다만 B-4의 용도는 *표면*이므로 3:1 기준 적용이 맞고 최종 결론(라벤더 유지)은 동일 |
| `primary-dark` on `bg-dark`              | 2.89:1        | **2.77:1**   | ❌ 금지 (3:1 미달)                                                      | 없음 (더 나쁨)                                                                                                                                                         |
| `primary` on `gray100` #F8F6F2           | 3.70:1        | **3.93:1**   | ✅ 비텍스트 3:1 / ❌ 본문 금지                                          | 없음                                                                                                                                                                   |
| `primary` on gradient 상단 #FFF3E6       | 3.84:1        | **3.88:1**   | ✅ 비텍스트 3:1                                                         | 없음                                                                                                                                                                   |
| `primary-dark` on `#FFFFFF` (탭바)       | 6.47:1        | **6.61:1**   | ✅ AA 본문                                                              | 없음                                                                                                                                                                   |
| `secondary` #302D33 + white              | 13.56:1       | **13.56:1**  | ✅ AAA                                                                  | 없음                                                                                                                                                                   |
| `secondary` on `gray100`                 | 13.0:1        | **12.56:1**  | ✅ AAA                                                                  | 없음                                                                                                                                                                   |
| `accent` #D9A0A0 + `gray900`             | 7.90:1        | **7.90:1**   | ✅                                                                      | 없음                                                                                                                                                                   |
| `accent` + white                         | 2.21:1        | **2.21:1**   | ❌ 금지                                                                 | 없음                                                                                                                                                                   |
| `gray400` + white (disabled fill)        | 1.94:1        | **1.75:1**   | ➖ WCAG 1.4.3 비활성 예외                                               | 없음                                                                                                                                                                   |
| `gray400` on `gray100` (disabled 아이콘) | 1.54:1        | **1.63:1**   | ➖ WCAG 1.4.3 비활성 예외                                               | 없음                                                                                                                                                                   |
| `gray900` on `gray100`                   | 15.3:1        | **16.20:1**  | ✅                                                                      | 없음                                                                                                                                                                   |
| `gray700` on `gray100`                   | 6.8:1         | **7.07:1**   | ✅                                                                      | 없음                                                                                                                                                                   |
| `gray600` on `gray100`                   | (미기재)      | **4.44:1**   | ⚠️ 본문 4.5:1에 0.06 미달 — **기존부터 존재**(구 `tertiary`와 동일 hex) | 신규 정보                                                                                                                                                              |
| `gray500` on `gray100`                   | 2.4:1         | **2.34:1**   | placeholder 전용 (현행 유지)                                            | 없음                                                                                                                                                                   |
| 탭바 비활성 `#9CA3AF` on white           | 2.58:1        | **2.54:1**   | ❌ 미달 — **기존부터 존재, 이번 개편 무관**                             | 없음                                                                                                                                                                   |
| `error` #EF4444 on `gray100`             | 3.76:1        | **3.49:1**   | ❌ 미달 — **기존부터 존재, 이번 개편 무관**                             | 없음                                                                                                                                                                   |
| `highContrast` 버블 #F0EFED + `gray900`  | (미기재)      | **15.22:1**  | ✅ AAA                                                                  | 신규 정보                                                                                                                                                              |

> 차이의 원인은 반올림·중간 계산 정밀도로 보인다. 판정이 뒤집힌 항목은 `primary` on `bg-dark` 1건뿐이며, 그 항목도 **적용 용도가 텍스트가 아니라 표면**이므로 브리프의 결론(B-4에서 `primary` 사용)은 그대로 유효하다.

## 육안 검증 결과 (판정은 브리프 확정값, Chris는 "지정대로 렌더되는가"만 확인)

| 조합                                  | 확인 화면                                                                                  | 결과                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `primary` 표면 vs `bg-dark`           | `evidence/ac15/guide-manual.png`, `guide-playlist.png`, `guide-chat.png`                   | ✅ "해설 생성" pill·FAB의 가장자리가 배경과 명확히 분리됨                                                                              |
| `primary` 위 흰 라벨 (다크 한정)      | `evidence/ac15/guide-manual.png` "해설 생성"                                               | ✅ 획 분리되어 읽힘. **알려진 미달 1건**(4.24:1)로 아래 목록에 기록                                                                    |
| `highContrast` 완화 경로              | `evidence/ac16/hc-guide-chat.png`                                                          | ✅ 흰 배경 + `#F0EFED` 버블 + 진한 텍스트가 개편 전과 동일하게 동작. 라벤더/`primary-dark`가 한 군데도 나타나지 않음                   |
| `primary-dark` vs `bg-dark`           | 다크 화면 전수 (guide 7화면)                                                               | ✅ 다크 화면 어디에도 `bg-primary-dark` / `text-primary-dark` 없음 (B-4 위반 0건)                                                      |
| `gray800` 구분선 vs `bg-dark`         | `evidence/ac13/guide-*.png` ↔ `evidence/baseline/guide-*.png`                              | ✅ AC-13 시점 픽셀 비교에서 guide-description / guide-exit-summary / guide-playlist = IDENTICAL                                        |
| `warm` / `gradient` 위 `primary` 표면 | `evidence/ac14/onboarding-location.png`, `evidence/ac16/gradient-settings-general.png`     | ✅ 라벤더가 본문 문단 색으로 쓰인 곳 0건. 아이콘 원형 배경으로만 등장                                                                  |
| 라이트 fill CTA·칩 `primary-dark`     | `evidence/ac15/settings-index.png`, `ac14/onboarding-location.png`, `ac15/tabs-search.png` | ✅ 흰 라벨 fill 중 `bg-primary`로 남은 것 0건 (코드 grep으로도 교차 확인 — 잔여 `bg-primary` 13건은 전부 텍스트 미탑재 또는 다크 화면) |
| 탭바 활성 tint                        | `evidence/ac15/tabs-exhibitions.png`, `tabs-search.png`, `tabs-map.png`                    | ✅ 5개 탭 전부 `#625876`로 렌더. **아이콘 filled ↔ outline 전환 형태 신호 살아 있음** (활성 탭만 채워진 아이콘)                        |
| 탭바 비활성 tint                      | 동일                                                                                       | ✅ `#9CA3AF` 값 무변경                                                                                                                 |
| disabled fill `gray400`               | `app/settings/inquiry.tsx` 제출 칩, `app/(explore)/route.tsx` 경로 생성                    | ✅ 비활성/활성 구별 명확. `accessibilityState={{ disabled }}` 두 지점 모두 존재 확인                                                   |
| `error` 값 무변경                     | `evidence/ac16/gradient-settings-general.png` "로그아웃"                                   | ✅ `#EF4444` 그대로                                                                                                                    |

## 미달 지점 목록 (미달 0건 보고는 결함이므로 전부 기록)

### (a) 이번 개편이 만든 미달

| #   | 지점                                                                                                                                                                                                                                  | 실측                                               | 완화책                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| a-1 | 다크 화면 `bg-primary` 위 흰 라벨 (`manual.tsx:89`, `immersive-start.tsx:177`, `exit-summary.tsx:131`, `playlist.tsx:172`, `create-description.tsx:359,454`, `description.tsx:342,398`, `ChatMessage.tsx:149`, `diary/[date].tsx:54`) | **4.24:1** (AA 본문 4.5:1 미달, AA Large 3:1 통과) | 브리프 확정된 공식 완화 경로 = `Screen variant='dark' highContrast` (15.22:1). 정상 동작 확인 완료 |
| a-2 | 다크 배경 위 `primary` **표면** 자체                                                                                                                                                                                                  | **4.32:1**                                         | 비텍스트 3:1 기준 통과 — 미달 아님. Sam 브리프의 "AA 본문 ✅" 표기만 정정 필요(위 재검산 표)       |

### (b) 기존부터 존재하던 미달 (이번 개편 무관, 값 무변경)

| #   | 지점                                   | 실측       | 비고                                                 |
| --- | -------------------------------------- | ---------- | ---------------------------------------------------- |
| b-1 | 탭바 비활성 tint `#9CA3AF` on white    | **2.54:1** | 토큰 밖 하드코딩. 02-design-brief Out of scope       |
| b-2 | `error` `#EF4444` on `gray100`         | **3.49:1** | 01-spec Non-goals(값 무변경)                         |
| b-3 | `gray600` (구 `tertiary`) on `gray100` | **4.44:1** | 3차 텍스트. 구 `tertiary`와 hex 동일이므로 회귀 아님 |
| b-4 | `gray500` (구 `muted`) on `gray100`    | **2.34:1** | placeholder 전용 용도. 구 `muted`와 hex 동일         |

### (c) 이번 개편으로 새로 생긴 **비일관성** (미달은 아니지만 보고 대상)

`accent` 토큰(구 #3B82F6)의 사용처 16곳은 전부 브랜드 컬러로 이관했으나, **토큰이 아닌 하드코딩 블루가 6개 파일에 남아 있다**:

| 파일:줄                                        | 값                             |
| ---------------------------------------------- | ------------------------------ |
| `app/(guide)/playlist.tsx:84,86`               | `#60A5FA`                      |
| `app/(guide)/description.tsx:262,310,399`      | `#60A5FA`                      |
| `app/settings/bookmark/audio.tsx:193,198`      | `#60A5FA` / `text-blue-400`    |
| `src/components/guide/ChatMessage.tsx:110,157` | `text-blue-400` / `#60A5FA`    |
| `app/settings/delete-account.tsx:189,196`      | `bg-blue-50` / `text-blue-700` |

01-spec AC-15의 grep 조건(`#3B82F6` 0건, 구 `accent` 참조 0건)은 **충족**했고, 이 값들은 `accent` 토큰이 아니라 1회성 하드코딩이라 01-spec Non-goals("1회성 브랜드 색상 토큰화 없음", "색상 치환 대상 토큰만")의 범위 밖이다. 다만 결과적으로 **라벤더와 블루가 같은 화면에 공존**하므로(`guide-playlist` 스크린샷에서 확인 가능) Manager 판단이 필요하다.

## 검증 절차의 한계 (숨기지 않고 기록)

1. **`gradient` variant는 앱에서 실제 사용처가 0건이다.** `grep 'variant="gradient"'` 결과 0. 검증을 위해 `app/settings/general.tsx`를 임시로 `variant="gradient"`로 바꿔 캡처하고 즉시 원복했다(`git diff` 상 잔여 변경 없음).
2. **`highContrast`는 UI 토글(설정 > 고대비 모드)로만 켤 수 있는데 시뮬레이터 탭 자동화가 불가능**(아래 참고)하여, `src/store/settingsStore.ts`의 초기값과 persist 키를 임시로 바꿔 강제 활성화한 뒤 캡처하고 원복했다(`git diff src/store/settingsStore.ts` = 변경 0줄).
3. **시뮬레이터 탭/스크롤 자동화 불가** — `idb`/`maestro` 미설치, AppleScript System Events가 접근성 권한 거부(-1719)로 실패. 따라서 인터랙션 검증은 **딥링크(`my-app://`) 네비게이션 + 스크린샷**으로 수행했다. 탭 전환·화면 이동·상태 렌더는 검증했으나, "버튼을 눌러 pressed opacity가 바뀌는지" 같은 **터치 상태 전이는 검증하지 못했다**(코드상 기존 `opacity` 패턴을 보존했음은 diff로 확인).
