---
feature-slug: korean-first-i18n
author: sam
status: pass
---
# Design brief

## Design intent / Tokens
기존 레이아웃·Pretendard/Hahmlet·#F8F6F2/#1C1917·간격·터치 타겟을 유지한다. 한국어가 정본이며 번역 때문에 한국어 문구를 바꾸지 않는다.

## Layout & components
기존 화면/공통 컴포넌트에서 useTranslation 사용. 단복수는 count 인자를 전달한다. 버튼의 접근성 역할·라벨을 유지하며 라벨만 번역한다.

## Copy / States
수정된 ko.json/en.json을 보존한다. 현재 한국어 UI와 리소스가 다른 문구는 한국어 정본을 존중한다. 로딩/빈 상태/오류/성공 문구를 동일 구조로 번역한다.

## Accessibility
accessibilityLabel/Hint 번역. 터치 타겟/색 대비 변경 없음.

## Prototype scope
새 화면이나 레이아웃 변경 없음. 렌더링 스모크는 구현 후 수행한다.
