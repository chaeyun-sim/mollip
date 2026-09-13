---
feature-slug: diary-receipt-stamp
author: sam
status: draft
---

## [Sam (Design)]

# Design brief — 관람 영수증 → 우표 다이어리

> 참고: 기존 `app/diary/[date].tsx`는 사용자가 `app/diary-1/[date].tsx`로 백업해뒀다. `app/diary/` 안은 이번 기능용으로 자유롭게 새로 구성한다 (기존 파일 참조/이관 없이 새로 작성).

## Design intent

- 이 기능은 두 가지 다른 재질감을 가진 화면이 이어진다 — **① 확정 큐(영수증·서명)는 "종이" 질감**, **② 캘린더/그리드(우표)는 "수집첩" 질감**. 둘 다 지금 다이어리에 이미 있는 티켓 비주얼 언어(`VisitTicket`, `VisitTicketFooter`의 절취선, `VisitStamp`의 잉크 도장)를 그대로 이어받아서 붙어있는 느낌이 아니라 원래 있던 세계관의 연장으로 보이게 한다.
- 새 컬러/폰트를 추가하지 않는다. 기존 웜톤 아카이브 팔레트(`gray100`~`gray900`, `bg-light`, `bg-tonal`)와 Pretendard/Hahmlet만 쓴다. 예외 1건 제안(아래 Tokens 참고).
- 서명 순간이 이 플로우의 감정적 정점이다 — 종이(영수증) 위에 손글씨를 얹는 느낌을 최대한 살리고, 확정 즉시 기존 `VisitStamp`(관람 완료 잉크 도장)가 쿵 찍히는 손맛을 재사용해서 "완료됐다"는 확신을 준다.
- 명명 주의: 이번에 만드는 캘린더/그리드용 작은 사진 썸네일은 **우표(postage stamp)** 개념이라 `VisitStamp.tsx`(잉크 도장, 완전히 다른 의미)와 헷갈리지 않게 컴포넌트명을 `DiaryStampCell`로 못박는다.

## Tokens (defaults)

기존 `tailwind.config.js` 정본 그대로 사용 (`.docs/DESIGN_SYSTEM.md` 참고). 새로 추가하는 색은 없다.

| 용도                                       | 토큰                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 화면 배경                                  | `bg-bg-light` (#F8F6F2)                                                                                                                                                                                                                                                                |
| 영수증/우표 카드 표면                      | `bg-white` (영수증), `bg-bg-tonal` (배너)                                                                                                                                                                                                                                              |
| 잉크 텍스트 / 서명 스트로크                | `text-gray900` (#1C1917)                                                                                                                                                                                                                                                               |
| 보조 텍스트 (영수증 라벨, 배너 서브텍스트) | `text-gray600` / `text-gray500`                                                                                                                                                                                                                                                        |
| 점선 구분선 (절취선·영수증 섹션 구분)      | `border-divider` / `border-gray300` (dashed)                                                                                                                                                                                                                                           |
| 주요 CTA ("확정하고 보관하기")             | `bg-primary-dark` (#625876) + `text-white`                                                                                                                                                                                                                                             |
| 보조 액션 ("다시 쓰기", 스킵)              | `text-secondary` (#302D33) 텍스트 버튼, 배경 없음                                                                                                                                                                                                                                      |
| 배너 카운트 뱃지                           | `bg-primary-dark` 원형 + `text-white` 숫자                                                                                                                                                                                                                                             |
| 만료 경고 뉘앙스                           | 별도 `error` 색 쓰지 않음 — 급박함은 카피로 전달, 색은 중립 유지 (배너가 매번 빨갛게 보이면 피로감)                                                                                                                                                                                    |
| 폰트 — 본문/영수증                         | `font-pretendard-regular` / `font-pretendard-medium`                                                                                                                                                                                                                                   |
| 폰트 — 타이틀 ("오늘의 영수증" 등)         | `font-hahmlet-bold`                                                                                                                                                                                                                                                                    |
| 폰트 — 서명 캡션 (제안, 신규 등록 필요)    | `font-nanum-pen` — Nanum Pen Script는 `app/_layout.tsx`에 이미 로드돼 있지만 `tailwind.config.js`에 미등록 상태(DESIGN_SYSTEM.md §2 확인됨). 서명 패드의 안내 캡션("여기에 서명해주세요") 같은 아주 작은 영역에만 한정해서 이번에 정식 등록해 쓴다 — 사용 범위를 좁게 제한하는 게 조건 |

## Layout & components

| 영역                                        | 설명                                                                                                                                                                                                                                                                                                                                                                       | 재사용/신규 컴포넌트                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 다이어리 홈 상단 배너                       | 헤더 바로 아래, "N Tickets" 카운터 위에 배치. `bg-bg-tonal` 카드, 점선 테두리(영수증 절취선 느낌), 좌측 영수증 아이콘 + 우측 카운트 뱃지 + chevron. 전체가 탭 가능(min-height 56). pending이 0개면 렌더 자체를 안 함                                                                                                                                                       | 신규 `PendingVisitsBanner`                                                          |
| 확정 큐 화면 (`confirm-visits.tsx`)         | 화면 상단 "n / 총N" 진행 표시 → `ReceiptSummary` 카드 → 하단 고정 `SignaturePad` 진입 CTA. 한 번에 카드 1장만 보여주고(리스트 스크롤 아님), 확정되면 다음 카드가 슬라이드로 교체                                                                                                                                                                                           | `Screen`, 신규 `ReceiptSummary`, 신규 `SignaturePad`, 신규 `ReceiptStampTransition` |
| 영수증 카드 (`ReceiptSummary`)              | `bg-white` 세로형 카드, 위/아래 절취선은 `VisitTicketFooter`의 `Perforation` 패턴 재사용(양옆 노치+점선). 상단 전시명(Hahmlet-bold)+날짜, 구분선, "오늘의 프로그램" 재생목록 행(제목만, 점선 리더), 구분선, 장소/시작~종료 시각 2열                                                                                                                                        | `VisitTicketFooter`(패턴 재사용), `ImageFallback`                                   |
| 서명 패드 (`SignaturePad`)                  | 하단 시트 또는 전체화면 모달. `bg-white` 캔버스에 `border-dashed border-gray300` 안내 박스, 안내 문구(`font-nanum-pen`, 미입력 시만 표시). 스트로크는 `text-gray900` 잉크색, 두께 ~3px. 하단 좌측 "다시 쓰기"(텍스트), 우측 "확정하고 보관하기"(`bg-primary-dark` pill)                                                                                                    | 신규                                                                                |
| 확정 → 우표 전환 (`ReceiptStampTransition`) | 서명 완료 즉시 `VisitStamp`(기존 잉크 도장)가 카드 위에 쿵 찍히는 애니메이션 → 카드가 축소되며 사라짐. 화려한 3D 폴드는 1차 스코프 아님(단순 scale+fade)                                                                                                                                                                                                                   | `VisitStamp`(재사용), Reanimated                                                    |
| 캘린더/그리드 우표 셀 (`DiaryStampCell`)    | 사진/포스터 썸네일에 흰색 여백 프레임(우표 마진) + 살짝 랜덤 회전(`DiaryCalendar`의 기존 `rotationForDateKey` 로직 그대로 재사용). **캘린더 셀(40px, 작음)은 흰 프레임만** — 절취 노치를 넣으면 그 크기에서 뭉개져 보임. **그리드 카드(116px, 더 큼)는 상/하 절취 노치까지 추가** — `VisitTicketFooter`의 `Perforation` 노치 크기를 절반으로 줄여 재사용. (Alex 리뷰 확정) | `DiaryCalendar`, `VisitTicketGridCard` 내부 셀 교체                                 |

## Copy (KO)

| Element           | Text                                        |
| ----------------- | ------------------------------------------- |
| 배너 타이틀       | 최근 저장하지 못한 관람 기록이 {n}개 있어요 |
| 배너 서브텍스트   | 7일이 지나면 사라져요 · 지금 확인하기       |
| 확정 큐 진행 표시 | {현재} / {전체}                             |
| 영수증 섹션 라벨  | 오늘의 프로그램 · 장소 · 관람 시간          |
| 서명 안내 캡션    | 여기에 서명해주세요                         |
| 서명 지우기       | 다시 쓰기                                   |
| 서명 확정 CTA     | 확정하고 보관하기                           |
| 확정 완료 토스트  | 오늘의 우표가 저장됐어요                    |
| 큐 완료 후        | 모두 확인했어요!                            |
| 빈 배너 상태      | (렌더 안 함 — 카피 없음)                    |

## States

- **Loading**: 확정 큐 진입 시 pending 목록을 불러오는 짧은 스켈레톤(영수증 카드 모양의 회색 블록) — 기존 `NearbyPlaceRowSkeleton` 패턴처럼 형태를 미리 잡아둔 스켈레톤 사용
- **Empty**: pending 0개 → 배너 자체를 숨김(빈 배너 UI 없음). 큐를 다 처리하면 "모두 확인했어요!" 화면 후 다이어리 홈으로 자동 복귀
- **Error**: 서명 저장(업로드) 실패 시 카드 위에 인라인 에러 텍스트(`text-error`) + "다시 시도" — 큐 중단 없이 해당 카드에서만 재시도
- **Success**: 서명 확정 → `ReceiptStampTransition` 재생 → 토스트 → 다음 카드 또는 홈 복귀

## Accessibility

- `PendingVisitsBanner` 전체에 `accessibilityRole="button"`, `accessibilityLabel="미확정 관람 기록 {n}개, 확인하러 가기"`
- `SignaturePad`의 "다시 쓰기"/CTA 버튼은 각각 `accessibilityLabel` 명시, 최소 44pt 터치 영역
- `DiaryStampCell`은 기존 `DiaryCalendar` 패턴과 동일하게 `accessibilityLabel="{month}월 {day}일 일기 보기"` 유지
- 서명 캔버스 자체는 제스처 기반이라 스크린리더 사용자를 위한 대체 경로 필요 — "서명 없이 확정하기" 텍스트 버튼을 작게 제공(서명은 장식/감성 요소이지 필수 데이터가 아니므로 접근성상 우회 경로 허용)
- 대비: 잉크(`gray900` #1C1917) on 화이트/`bg-light` 모두 굿; 배너 서브텍스트(`gray600` #78716C on `bg-tonal` #F2EFE9)는 3차 텍스트 기준으로 이미 검증된 조합(DESIGN_SYSTEM.md 참고)

## Prototype scope

- [x] Static layout only — `PendingVisitsBanner`, `ReceiptSummary`, `DiaryStampCell` 정적 레이아웃
- [x] Navigation wired — 배너 탭 → 확정 큐 진입, 큐 완료 → 다이어리 복귀
- [x] Fake data / stub API — 백엔드 마이그레이션 전이므로 pending 목록은 로컬 stub 데이터로 스모크

## Out of design scope

- AC-6(수동 인증 add-manual.tsx), AC-7(별점 RatingStars) — 01-spec에서 이번 이터레이션 제외로 확정된 항목, 디자인도 이번엔 하지 않음
- 서명/우표 이미지 공유·내보내기 화면
- 확정 큐의 풀 3D 폴드 애니메이션(1차는 scale+fade로 축소, 고도화는 다음 이터레이션)
