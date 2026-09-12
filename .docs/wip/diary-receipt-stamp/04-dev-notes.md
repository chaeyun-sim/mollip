---
feature-slug: diary-receipt-stamp
author: chris
status: in-progress
---

## [Chris (Dev)]

# Dev notes — 관람 영수증 → 우표 다이어리

이번 이터레이션 범위: **AC-1~5만** (01-spec.md에서 AC-6/7은 다음 이터레이션으로 확정 연기됨).

## 구현 요약

| AC | 상태 | 변경 파일 |
|---|---|---|
| AC-1 | 완료 | `src/store/visitStore.ts`(`status`/`pendingSince`/`visitedAt`/`signatureSvg` 필드 + `markPending`/`todayKey`/`loadFromRemote` 마이그레이션), `src/store/immersiveStore.ts`(`enteredAt` + `exit()`에서 `markPending` 호출), `src/hooks/useVisitSync.ts`(로컬 status 필드 보존) |
| AC-2 | 완료 | `src/components/archive/PendingVisitsBanner.tsx`(신규), `app/(tabs)/diary.tsx`(배너 렌더 + pendingCount) |
| AC-3 | 완료 | `src/components/archive/ReceiptSummary.tsx`, `SignaturePad.tsx`, `ReceiptStampTransition.tsx`(전부 신규), `app/diary/confirm-visits.tsx`(신규 큐 화면), `visitStore.confirmVisit` |
| AC-4 | 완료 | `visitStore.pruneExpiredPending` + `app/(tabs)/diary.tsx`의 mount 시 호출 |
| AC-5 | 완료(스코프 축소, 아래 참고) | `src/components/archive/DiaryStampCell.tsx`(신규), `DiaryCalendar.tsx`(교체), `VisitTicketGrid.tsx`(확정 필터만) |

추가로 재구성한 파일: `app/diary/[date].tsx` — 사용자가 기존 파일을 `app/diary-1/[date].tsx`로 백업해둔 뒤 `app/diary/`를 비워둔 상태였어서, 기존 티켓 플립·메모·삭제·채팅기록 기능을 그대로 옮기고 서명 표시 섹션(`SignatureSection`)만 추가해 새로 작성함.

## 스펙 대비 구현 상 결정 (다음 이터레이션 참고용)

1. **`locationLabel` 필드 미도입.** 01-spec.md에는 GPS 기반 위치 라벨 필드가 있었지만, 영수증에 필요한 "장소" 정보는 이미 `DayVisit.venue`(전시장명, `recordExhibition` 시점부터 존재)로 충분해서 별도 GPS 필드를 추가하지 않음. `exit-summary.tsx`도 스펙대로 변경 없이 그대로 둠.
2. **`signatureUri` → `signatureSvg`로 명명/구현 변경.** `react-native-view-shot` 등 래스터화 라이브러리를 새로 넣지 않고, `react-native-svg`(기존 설치됨)만으로 서명 스트로크를 SVG 마크업 문자열로 직렬화해 저장 → 재생 시 `SvgXml`로 렌더. "신규 네이티브 모듈 불필요" 리스크 노트를 실제로 지킴.
3. **그리드 카드(`VisitTicketGridCard`)는 이번에 우표 스타일로 바꾸지 않음.** 02-design-brief.md/03-design-review.md에서는 그리드에도 절취 노치를 얹기로 했었지만, 실제로 열어보니 `VisitTicketGridCard`가 이미 자체적인 완성도 높은 티켓-스텁 디자인(바코드·스텁·노치)을 갖고 있어서 이걸 우표로 바꾸는 건 별개의 재작업에 가까움. 이번엔 **필터 조건만** `status === 'confirmed'`로 바꾸고 비주얼은 손대지 않음 — `DiaryStampCell`은 캘린더 뷰에만 적용. (스코프 축소, Alex/Sam 문서에 반영 필요 — 다음 세션에서 업데이트 권장)
4. **Supabase 원격 동기화는 이번에 붙이지 않음.** `visits` 테이블에 `status`/`pending_since`/`signature_svg`/`visit_started_at`/`visit_ended_at` 컬럼이 없어서(마이그레이션 미완료, 01-spec Risks에 이미 명시됨) `markPending`/`confirmVisit`는 로컬(zustand persist → AsyncStorage)에만 저장한다. 로그인 사용자가 기기를 바꾸면 미확정/확정 상태가 동기화되지 않는 게 알려진 갭 — 마이그레이션 후 후속 작업 필요.
5. **레거시 데이터 마이그레이션.** `status` 필드가 없는 기존 방문 기록(이 기능 이전에 생성됨)은 하이드레이션 시 일괄 `confirmed`로 처리(`_migrateLegacyStatus`) — 안 하면 기존 다이어리 기록이 전부 사라져 보이는 회귀가 생겨서 추가함.
6. **부수적으로 고친 버그**: `src/store/visitStore.ts`에 `todayKey`가 export되지 않아 `exit-summary.tsx`/`useDescriptionStream.ts`의 기존 import가 이미 깨져 있던 baseline tsc 에러 2건을 발견 — AC-1 구현에 `todayKey`가 그대로 필요해서 export 추가로 같이 해결함(무관한 드리프트라 별도 보고: `tailwind.config.js`의 `primary`/`primary-dark`/`accent` 실제 값이 `.docs/DESIGN_SYSTEM.md` 문서 기재값과 다름 — 이번 작업과 무관해 손대지 않음, 별도 확인 필요).
7. **토스트 없음.** "오늘의 우표가 저장됐어요" 토스트는 별도 토스트 라이브러리가 없어서 생략 — `ReceiptStampTransition`(도장 애니메이션) 자체를 확정 피드백으로 씀.
8. **회귀 발견 및 수정: `useVisitSync.ts`가 status/pendingSince/signatureSvg/visitedAt을 매번 지워버리는 문제.** 로그인 시 Supabase에서 visits를 다시 불러오는 `useVisitSync.ts`는 원격에 없는 새 필드들을 무시하고 매번 새 객체로 덮어써서, 앱을 재시작할 때마다 미확정(pending) 기록이 서명 없이 확정(confirmed)으로 잘못 승격되는 버그가 될 뻔했다 — 로컬 값을 이어받도록 고쳐서 막음(`local?.status` 등 fallback 추가).
9. **`ArchiveRecentVisits.tsx` 확인.** "최근 관람" 리스트 컴포넌트가 있지만 실제로 어디서도 호출되지 않는 미사용 컴포넌트임을 grep으로 확인(호출부 0건) — 이번 기능과 무관하고 사용되지 않아 손대지 않음(삭제도 하지 않음, 범위 밖).

## 검증

- `npx tsc --noEmit` → 0 errors (기존 baseline 2건 포함 수정됨)
- `npx eslint <변경 파일 전체>` → 0 errors/warnings (react-hooks/refs 위반 1건 발견 후 `useRef` → `useState` lazy init으로 수정)
- `npm test` → 기존 52개 테스트 전부 通과 (회귀 없음, 이번 기능에 대한 신규 유닛 테스트는 작성하지 않음 — 05-qa-report.md Gaps 참고)
