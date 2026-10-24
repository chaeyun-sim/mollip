---
feature-slug: manual-record-redesign
author: Codex (Sam role)
status: approved
---

# Design brief

## Design intent

작은 전시 도록을 작성하는 차분한 편집 화면. 포스터와 입력창의 경쟁을 없애고 세로 읽기 순서를 만든다.

## Tokens

현행 정본 사용: canvas #FAFAF8, ink #2D2D23, surface-neutral #F3F3F0, brand #5F1D3E, gray600 보조문구. Hahmlet 제목, Pretendard UI. 주요 버튼 white/brand 대비 12.13:1.

## Layout & components

24pt 좌우 여백. Hahmlet 24pt 제목과 한 줄 안내, 우측 44pt 닫기. 중립색 포스터 업로드 가로 패널(썸네일 64×80 + 설명 + 추가 아이콘). 아래 전시 이름(필수), 장소(선택)의 전체 너비 52pt 이상 입력창. 20pt 섹션 간격. 기간 선택 두 열은 64pt 이상, 시작/종료 라벨이 선택 후에도 유지. 하단 브랜드 Button.

```text
전시를 직접 기록해요                 ×
이름만 입력해도 기록을 시작할 수 있어요.
┌───────────────────────────────────┐
│ [포스터]  전시 포스터          ＋ │
│           사진으로 기억해 보세요  │
└───────────────────────────────────┘
전시 이름  필수
[ 전시 이름을 입력해 주세요         ]
장소  선택
[ 미술관이나 갤러리 이름            ]
전시 기간  선택
[시작일  날짜 선택] [종료일 날짜 선택]
[          이 전시로 기록하기        ]
```

## States / Copy

사진 없음: 이미지 아이콘과 선택 안내. 선택 후: contain 썸네일과 ‘포스터 바꾸기’. 입력 포커스: 2pt brand 경계, 동일 외곽 크기. 공백 이름: 공통 disabled CTA. 사진 취소 시 유지. 날짜 선택은 Keyboard.dismiss 후 기존 DatePickerModal 사용.

## Accessibility

44pt 이상 터치, 명시적 label/role, 필수·선택 텍스트. 라벨/보조문구 gray600 이상. ScrollView와 safe-area padding 유지. 고정 높이 대신 min-height 입력/날짜 사용.

## Prototype scope / Out of scope

실제 기존 이벤트 연결로 검증. 새로운 에셋/외부 API/공통 컴포넌트 변경 없음.

G2: Pass.

## 사용자 후속 변경 (최종 기준)

사용자가 직접 조정한 240pt 3:4 포스터와 헤더 없는 레이아웃 유지. 기간 두 열은 “방문 날짜 · 선택” 단일 64pt 행으로 교체. 달력 아이콘과 YYYY.MM.DD 표시. 선택 해제 지원, 미래일 불가. 나머지 폼 디자인 유지.
