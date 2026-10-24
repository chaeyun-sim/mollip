---
feature-slug: home-magazine-sections
author: sam
status: ready-for-review
---

# Design brief — 랭킹 + 매거진

## 리듬

캐러셀(이미지 큼) → 랭킹(텍스트·숫자, 밀도 높음) → 레일(작은 포스터 + 긴박감) → **다크 밴드**(명화, 전환점) → 매거진(큰+작은) → 와이드+레일. 이미지 크기·배경 명도를 교차시켜 스크롤마다 다른 장면을 준다.

## 공통

- 좌우 여백 24 (`HOME_SIDE_PADDING`), 섹션 간 `gap-12`.
- 섹션 헤더: eyebrow 제거. 제목 Hahmlet Bold 22/30 `text-gray900` + 선택적 부제 Pretendard 13 `text-gray600`, 우측 액션(`전체 >`).
- 메타 라벨: D-day 는 `text-primary-dark` semibold(라이트 배경 5.70:1), 기간은 `text-gray600`.

## AC-1 인기 TOP 5 — "지금 많이 찾는 전시"

```
 1   [▢ 60x80]  모네: 빛의 정원
                예술의전당 한가람미술관
                D-5 · 진행 중
 ─────────────────────────────────────
 2   [▢]        ...
```

- 순위: Hahmlet Bold 28, 폭 32 고정. 1~3위 `text-gray900`, 4~5위 `text-gray400` 아님(비활성 전용) → `text-gray500`.
- 썸네일 60×80 `rounded-[10px]`. 제목 Pretendard SemiBold 15/21 2줄, 장소 12 `text-gray700`, 메타 12.
- 행 사이 `h-hairline bg-divider` (썸네일 시작점부터).

## AC-2 곧 막을 내려요 — "놓치면 아쉬운 전시"

- 카드 폭 132, 포스터 132×176 `rounded-[14px]`. 좌상단 칩 `bg-gray900/85 text-white` Hahmlet Bold 13 (`D-3`, `오늘 마감`).
- 아래 제목 14/19 2줄, 장소 12 1줄. 간격 12.

## AC-3 오늘의 명화 — 다크 밴드

- 전폭 `bg-bg-dark`, 상하 패딩 40. eyebrow `TODAY'S MASTERPIECE` 11 `text-on-dark/60`, 제목 "오늘의 명화" Hahmlet Bold 22 `text-white`.
- 작품 이미지 콘텐츠 폭 × 4:3, `rounded-[16px]`, `resizeMode="cover"`, 배경 `bg-gray800`.
- 작품명(한국어) Hahmlet SemiBold 20 `text-white`, 작가·연도 13 `text-on-dark/70`, 한 줄 소개 13/20 `text-on-dark/80`.
- CTA: 높이 48 전폭 `rounded-full bg-primary` + 헤드폰 아이콘 + "AI 도슨트 해설 듣기" `text-white` semibold 15 (다크 배경 위 primary 5.80:1, 본문 허용).
- 출처 표기 `The Met · Public Domain` 10 `text-on-dark/50`.

## AC-4 추천 매거진

- 리드 카드: 콘텐츠 폭 × 0.75 높이 `rounded-[20px]`, 하단 그라데이션 `rgba(28,25,23,0→0.85)`, 제목 Hahmlet Bold 20 white 2줄, 장소·기간 12 white/80.
- 이어서 2열(간격 14): 이미지 1:1 `rounded-[14px]`, 제목 14/19 2줄, 장소 12, 메타 12.

## AC-5 국립 기관 — "국립 미술관·박물관"

- 와이드 커버: 콘텐츠 폭 × 10/16 `rounded-[20px]`, 하단 그라데이션 + 상태 칩 + 제목 Hahmlet 20 white.
- 아래 레일: 카드 112, 이미지 112×112 `rounded-[12px]`, 제목 13/18 2줄.

## 상태

- 스켈레톤은 각 형태와 동일한 박스(`SkeletonBox`, `bg-[#E0DCD5]`).
- 에러: `HomeSectionMessage` 재사용. 이미지 없음: `ImageFallback` 플레이스홀더.

## 접근성

- 모든 카드 `accessibilityRole="button"` + `"{제목}, {장소}, {D-day/기간}"` 라벨. 랭킹은 `"{n}위, ..."`.
- 명화 CTA 라벨 `"{작품명} AI 도슨트 해설 듣기"`, 터치 높이 48.
- 기존 className/style 규칙(§2) 준수: 동적 폭/높이·그림자만 style.
