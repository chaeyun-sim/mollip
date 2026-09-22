---
feature-slug: open-source-licenses
tier: M
author: sam
status: draft
---

# Design Brief — 오픈소스 라이선스 화면 (아코디언)

## 기준 디자인 시스템

- 컬러: `#F8F6F2`(bg-light) 배경, `#1C1917`(gray900) 텍스트 — `.docs/DESIGN_SYSTEM.md` 정본 그대로, 신규 토큰 없음.
- 폰트: `font-pretendard-*` (본문/라벨), 기존 `privacy-policy.tsx`·`terms.tsx`와 동일 크기 체계(`text-[16px]` 섹션 제목, `text-[13~15px]` 본문).
- 레이아웃 프레임: `Screen` (`variant="warm"`) + `Screen.Header` + `Screen.Header.Back color="muted"` + `Screen.Header.Center` — 완전 재사용, 신규 컴포넌트 없음.

## 참조 패턴 (기존 코드베이스에서 재사용)

이 앱에 아코디언이 아예 없는 것은 아니다 — `src/components/map/route-sheet/RouteCandidateCard.tsx`가 이미 "탭하여 펼침/접힘 + `accessibilityState={{ expanded }}` + `accessibilityRole="button"`" 패턴을 프로덕션에 반영 중이다. 신규 UI 토큰을 만들지 않고 이 패턴의 **정보 구조**(헤더 탭 → 본문 펼침)만 차용하되, 애니메이션(reanimated spring)은 라이선스 텍스트처럼 긴 정적 텍스트 1건에는 과한 구현이라 판단해 제외한다 — `src/components/explore/ExhibitionDescription.tsx`의 순수 `useState` + 조건부 렌더링 방식이 이 화면의 무게감에 더 맞는다.

## 화면 구조 (`app/settings/open-source-licenses.tsx`)

```
Screen (variant="warm")
├─ Screen.Header
│   ├─ Screen.Header.Back (color="muted")
│   └─ Screen.Header.Center — "오픈소스 라이선스"
└─ ScrollView (항상 scrollEnabled, privacy-policy.tsx와 동일)
    └─ 아코디언 행 (Pressable, 카드 스타일 없이 리스트 행 — SettingsCard 재사용은 대상이 1건뿐이라 과함)
        ├─ 헤더: "[폰트] Pretendard" + chevron-down/up 아이콘 (펼침 상태에 따라 아이콘 교체)
        └─ 펼쳐진 본문 (조건부 렌더링)
            ├─ 라이선스명 · 소스 텍스트: "SIL Open Font License 1.1"
            ├─ GitHub LICENSE 원문 링크 — 탭 가능한 Text/Pressable, `text-secondary underline`
            └─ PRETENDARD_LICENSE 전문 (오프라인 상수, 스크롤 내 그대로 노출)
```

## 인터랙션 명세

- 기본 상태: **접힘**(collapsed). 헤더 행만 보인다.
- 헤더 탭 → 펼침/접힘 토글. `accessibilityRole="button"`, `accessibilityLabel`은 상태에 따라 "Pretendard 라이선스 펼치기"/"Pretendard 라이선스 접기", `accessibilityState={{ expanded }}`.
- 펼친 상태에서 "GitHub에서 보기" 링크 탭 → `expo-web-browser`의 `WebBrowser.openBrowserAsync(url)`로 인앱 브라우저를 연다. 실패 시(사용 불가 환경 등) `Linking.openURL(url)`로 폴백 — `src/utils/externalMaps.ts`의 try/catch 폴백 관용구 재사용.
- 링크 자체는 `accessibilityRole="link"` — `VenueSheet.tsx`의 기존 홈페이지 링크 패턴(아이콘 + `text-gray900` semibold + 45도 회전 화살표 아이콘, 색상만으로 링크임을 표시하지 않음)을 그대로 재사용.

## 접근성

- 헤더 행 터치 영역: 최소 44pt 높이 확보(`py-4` 이상).
- 링크 텍스트는 `underline`으로 시각적 구분 + `accessibilityRole="link"` + `accessibilityLabel="Pretendard GitHub 라이선스 원문 열기"`.

## Non-goals

- reanimated 기반 펼침 애니메이션 — 정적 텍스트 1건에 과한 구현이라 제외(속도 우선, §4 Enforce Simplicity).
- 다건 라이선스 리스트 UI(향후 라이브러리 추가 시 그때 확장) — 이번엔 단일 아코디언 행.
