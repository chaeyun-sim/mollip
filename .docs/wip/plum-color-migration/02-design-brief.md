---
feature-slug: plum-color-migration
author: sam
status: pass
---

# Design brief

## Design intent

전시 이미지가 가장 다채로운 요소로 보이도록 밝은 중립 화면을 유지한다. 주요 동작은 Deep Plum 한 색으로 집중시킨다.

## Tokens

- Canvas Bianco 조정색 `#FAFAF8`, Ink Kimber `#2D2D23`
- Brand Deep Plum `#5F1D3E`, White `#FFFFFF`
- Soft neutral surface `#F3F3F0`, 장식용 Blanket `#F2E0CF`, border Mushroom `#D4C7B4`
- Editorial Autumn Fern `#854628`; Oak·Khaki Moss·파스텔은 장식 한정
- Dark 화면의 브랜드 표시에는 밝은 브랜드 변형을 사용하고 실제 배경 대비를 검증

## Layout & components

기존 구조를 유지하고 화면 배경, 텍스트, 버튼, 탭, 선택 상태, 카드 배경의 색만 변경한다.

## States

Loading·disabled·error·success 의미는 유지한다. 선택 상태는 색 이외에 아이콘·테두리·굵기로 드러낸다.

## Accessibility

Deep Plum/White = 12.13:1, Kimber/Canvas = 13.30:1. 본문 4.5:1, 필수 비텍스트 표시 3:1을 목표로 실제 화면을 검증한다.

## 사용자 피드백 반영 — 2026-10-10

밝은 화면은 `#FAFAF8`을 기본 바탕으로 사용하고 검색창·보조 표면은 `#F3F3F0`을 사용한다. 화면 전체에 Blanket 계열을 깔지 않고 필요한 장식에만 사용한다. `Screen`의 그라데이션도 이 두 중립색으로 제한한다.
