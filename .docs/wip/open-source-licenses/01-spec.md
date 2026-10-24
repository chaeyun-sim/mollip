---
feature-slug: open-source-licenses
tier: M
author: john
status: implemented
---

> **개정 이력**: 최초 작성 시 Tier S(기존 패턴 100% 재사용)로 분류했으나, 사용자가 아코디언(접기/펼치기) 인터랙션과 외부 링크 연동을 추가 요구하면서 이 앱에 없던 새 인터랙션 패턴이 도입되어 Tier M으로 재분류함. Sam 디자인 브리프·Alex 디자인 QA를 추가로 거친다.

# Spec — 오픈소스 라이선스 화면

## Problem

- 설정 화면에 오픈소스 라이선스 고지 항목이 없어, 앱이 사용하는 폰트(Pretendard)의 원 라이선스(SIL OFL 1.1)를 이용자에게 오프라인으로 고지할 방법이 없다.

## Goals

- `app/(tabs)/settings.tsx`의 "개인정보 처리방침" 바로 아래에 "오픈소스 라이선스" 행을 추가한다.
- 탭하면 Pretendard의 원본 LICENSE 전문(저작권 고지 4건 + SIL OFL 1.1 전문)을 오프라인으로 보여주는 새 화면을 연다.
- 게스트(비로그인)·로그인 사용자 모두 접근 가능해야 한다(약관/처리방침과 동일 위치).

## Constraints

- 네트워크 요청 없이 오프라인에서 완전히 읽혀야 한다 — 라이선스 원문은 앱 번들에 정적 데이터로 포함한다(런타임 fetch 금지).
- `https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE` 원문을 저작권 고지 포함 손실 없이 그대로 수록한다 — 요약·재구성 금지.
- 기존 `Screen` / `Screen.Header` / `Screen.Header.Back` / `Screen.Header.Center`와 `privacy-policy.tsx`·`terms.tsx`의 className 패턴을 그대로 재사용한다. 새 스타일 토큰·컴포넌트를 만들지 않는다.
- component-convention.md 준수: Props는 `interface`, named/default export 규칙, import 순서.

## Non-goals (out of scope)

- 다른 오픈소스 라이브러리(react-native, expo 등)의 라이선스 목록화 — 이번 스코프는 Pretendard 1건.
- 디자인 변경(색상/타이포 토큰 신규 도입) — 기존 처리방침 화면과 시각적으로 동일한 패턴만 사용.

## Users & context

- 게스트: `app/(tabs)/settings.tsx`는 비로그인 시에도 렌더링되며 처리방침/약관 카드가 이미 노출됨 — 오픈소스 라이선스도 동일 카드 내 신규 행으로 노출.
- 로그인 사용자: 동일 카드, 동일 위치.

## Acceptance criteria

### AC-1: 설정 화면에 항목 추가

- **Given** 게스트 또는 로그인 사용자가 설정(마이페이지) 화면을 연다
- **When** "서비스 이용약관 / 개인정보 처리방침" 카드를 본다
- **Then** "개인정보 처리방침" 바로 아래에 "오픈소스 라이선스" 행이 보이고, "버전" 행보다 위에 위치한다

### AC-2: 라이선스 화면 열람 (오프라인)

- **Given** "오픈소스 라이선스" 행을 탭한다
- **When** 새 화면이 열린다
- **Then** 네트워크 연결 없이도 Pretendard LICENSE 전문(4건의 Copyright 고지 + SIL Open Font License 1.1 전문)이 스크롤 가능한 형태로 표시된다

### AC-3: 뒤로가기

- **Given** 라이선스 화면이 열려 있다
- **When** 헤더의 뒤로가기 버튼을 탭한다
- **Then** 설정 화면으로 돌아간다

### AC-4: 아코디언 기본 접힘 + 펼침/접힘 토글

- **Given** 라이선스 화면을 처음 연다
- **When** 화면을 본다
- **Then** "[폰트] Pretendard" 행이 접힌 상태로만 보이고, 전문 텍스트는 보이지 않는다
- **And** 그 행을 탭하면 전문이 펼쳐지고, 다시 탭하면 접힌다
- **And** 행에는 `accessibilityRole="button"`과 `accessibilityState={{ expanded }}`, 상태별 `accessibilityLabel`이 있다

### AC-5: GitHub 원문 링크

- **Given** "[폰트] Pretendard" 행이 펼쳐져 있다
- **When** "GitHub에서 보기" 링크를 탭한다
- **Then** `https://github.com/orioncactus/pretendard/blob/main/LICENSE`를 인앱 브라우저(`expo-web-browser`)로 연다
- **And** 인앱 브라우저 실행이 실패하면 `Linking.openURL`로 폴백한다
- **And** 링크에는 `accessibilityRole="link"`와 설명적 `accessibilityLabel`이 있다

### AC-6: 게스트 화면 스크롤

- **Given** 게스트(비로그인) 상태로 설정(마이페이지) 화면을 연다
- **When** 화면 높이보다 콘텐츠가 긴 소형 기기(예: iPhone SE)에서 하단으로 스크롤한다
- **Then** 스크롤이 정상 동작하여 처리방침·오픈소스 라이선스·버전 행까지 도달할 수 있다 (기존 `scrollEnabled={!!session}`으로 인한 게스트 스크롤 차단 버그 수정)

## Screens / routes

| Route                                          | 변경                                                           |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `app/(tabs)/settings.tsx`                      | "오픈소스 라이선스" `CardRow` 1행 추가                         |
| `app/settings/open-source-licenses.tsx` (신규) | Pretendard LICENSE 전문 표시, `privacy-policy.tsx` 패턴 재사용 |
| `app/settings/_layout.tsx`                     | 신규 라우트 `Stack.Screen` 등록                                |

## Risks & dependencies

- LICENSE 원문이 향후 orioncactus/pretendard 저장소에서 변경될 수 있으나, 오프라인 요구사항상 정적 스냅샷을 번들에 포함하는 것이 의도된 동작이다(fetch 없음).

## Open questions (for Manager → user)

- (없음 — 기존 패턴 재사용, 스코프 명확)

## Feature breakdown (for Chris)

1. AC-1: `src/data/licenses.ts`에 Pretendard LICENSE 원문 상수 추가, `settings.tsx`에 `CardRow` 추가
2. AC-2: `app/settings/open-source-licenses.tsx` 신규 작성 (privacy-policy.tsx 패턴, 항상 스크롤 가능)
3. AC-3: `settings/_layout.tsx`에 라우트 등록, `Screen.Header.Back` 재사용 확인
4. AC-4: 아코디언 행 컴포넌트 — `useState` 기반 펼침/접힘, `accessibilityState`/`accessibilityRole` 부여
5. AC-5: GitHub 링크 — `WebBrowser.openBrowserAsync` + `Linking.openURL` 폴백 (`src/utils/externalMaps.ts` 관용구 재사용)
6. AC-6: `app/(tabs)/settings.tsx`의 `ScrollView`에서 `scrollEnabled={!!session}` 제거
