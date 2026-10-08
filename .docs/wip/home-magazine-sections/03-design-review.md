---
feature-slug: home-magazine-sections
author: alex
iteration: 1
verdict: pass
---

# Design review — iteration 1

| 항목               | 점수 | 근거                                                                                                                                     |
| :----------------- | :--- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| 디자인 시스템 준수 | 4    | 토큰(gray*, primary/primary-dark, bg-dark, on-dark)·폰트 정본 내. 브랜드 판정표 준수(라이트 위 D-day=primary-dark, 다크 위 CTA=primary). |
| 위계·리듬          | 5    | 섹션마다 형태(랭킹/레일/다크 밴드/매거진/와이드+레일)와 이미지 크기가 교차해 이탈 동기를 줄임.                                           |
| 접근성             | 4    | 라벨 패턴·48 터치 높이 명시. 순위 숫자 대비: gray500(#A8A29E)는 큰 텍스트(28) 기준 3:1 미만 가능 → **수정 반영**.                        |
| 구현 가능성        | 4    | 기존 `ImageFallback`·`LinearGradient`·`SkeletonBox` 재사용.                                                                              |

**Overall 4.25 → Pass**

## 수정 요청 (구현 시 반영)

1. 4~5위 숫자는 `text-gray600`(#78716C, 큰 텍스트 4.5:1 이상)로.
2. `h-hairline`은 tailwind `borderWidth`에만 정의돼 있어 높이로 동작하지 않음 → 구분선은 `border-b-hairline border-divider`.
3. 명화 출처 표기 `text-on-dark/50` → `/60` (10px 소형 텍스트 대비 확보).
