---
feature-slug: korean-first-i18n
tier: M
author: john
status: pass
---
# Spec — 한국어 우선 번역 연결

## Problem
한국어·영어 리소스는 있으나 화면과 연결되지 않았다.

## Goals / Constraints
한국어 원문을 기준으로 기존 카탈로그에 해당하는 화면 문구를 연결한다. 첫 번째 기기 locale의 `languageCode`가 `ko`이면 한국어, 그 외 지원되지 않는 언어는 영어로 표시하고 언어 코드가 없으면 한국어를 기본값으로 사용한다. 누락된 영어 번역은 한국어로 대체한다. 지역·스토어 국가·GPS 위치는 언어 선택에 사용하지 않는다. Android foreground 복귀 시 언어 변경을 반영한다. 기존 번역 수정 내용은 보존한다.

## Non-goals
새로운 언어 선택 UI, API 데이터·작가명·검색 질의 번역, AI 생성 언어 변경, 기존 카탈로그에 없는 앱 전체 문구의 신규 번역.

## Acceptance criteria
### AC-1: 한국어 우선 번역 연결
- **Given** 한국어와 영어 번역 리소스와 기존 한국어 화면이 있을 때
- **When** 앱이 시작되거나 기기 언어 변경 후 foreground로 돌아올 때
- **Then** 기기 지역 KR은 한국어, 다른 지역은 영어로 표시되며, 번역이 빠진 영어 문구는 한국어로 대체된다. 기존 카탈로그에 대응하는 화면 문구·접근성·개수 표현을 연결한다. 한국어 원문과 데이터 값은 보존한다.

## Risks & dependencies
expo-localization 네이티브 모듈 등록을 위한 리빌드 필요. 실기기·계정 의존 QA는 미검증으로 명시한다.

## Open questions
없음. Codex 실행은 사용자가 본 세션에서 허용함.
