---
feature-slug: diary-ticket-back
author: taylor
status: pass
---

# QA Report — 관람 티켓 뒷면 (오늘의 프로그램)

## 체크리스트

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| Q1 | `npx tsc --noEmit` | ✅ 0 errors | |
| Q2 | `npm test` | ✅ 28/28 pass | |
| Q3 | 버그 / edge | ✅ | AC-2 빈 상태 정상 |
| Q4 | UX | ✅ | 플립 힌트·메모 모달 자연스러움 |
| Q5 | component-convention | ✅ | className 우선, named export |
| Q6 | 스크린샷 | ✅ | evidence/ 참조 |
| Q7 | 인터랙션 | ✅ | 플립·메모 모달·키보드 동작 확인 |
| Q8 | 회귀 | ✅ | 앞면·스텁·바코드·도장 유지 |
| Q9 | perf | ✅ | 특이사항 없음 |
| Q10 | native module | — | 추가 없음, pod install 불필요 |

## AC별 결과

| AC | 내용 | 결과 | 증거 |
|----|------|------|------|
| AC-1 | 뒷면 프로그램 hero (listened ≥ 1) | ✅ 코드 확인 | `VisitTicket.tsx` ProgramRow + listenedItems prop |
| AC-2 | listened 없음 empty state | ✅ 시각 확인 | `qa-ticket-back.png`, `qa-ticket2-back.png` |
| AC-3 | 헤더 ♪ PlaylistModal | ⚠️ 주의 | 헤더에 ✏️(메모)로 대체됨. 원본 spec AC-3과 amendment 설계 충돌. 서비스 영향 없으면 Pass |
| AC-4 | AI 일기 demote | ✅ | diaryStore 파일 없음, AI CTA 없음 |
| AC-5 | 헤더 refresh 제거 | ✅ | refresh 아이콘 없음 확인 |
| AC-6 | 앞면·플립 회귀 | ✅ 시각 확인 | `qa-ticket-front.png`, `qa-ticket2-front.png` |
| AC-7 | 데이터 소스 (visit.listened 우선) | ✅ 코드 확인 | `[date].tsx` listenedItems useMemo |
| AC-M1 | 메모 persist (setVisitMemo) | ✅ 코드+인터랙션 확인 | `qa-memo-modal.png`, visitStore |
| AC-M2 | AI 제거 | ✅ | diaryStore·useDiaryEntry·DIARY_PROMPT 없음 |
| AC-M3 | 뒷면 TextInput 접근 | ✅ | 헤더 ✏️ → 모달 → TextInput 포커스+키보드 ✅ |

## 주의사항

- **AC-3 ♪ 버튼**: 원본 spec은 헤더에 ♪(PlaylistModal) 유지를 명시했지만, 구현에서는 ✏️(메모 편집)으로 대체됨. Amendment(01-spec-amendment-memo.md)에서 PlaylistModal 명시적 제거는 없음. 사용자 확인 권장.
- **AC-1 실 데이터**: 시뮬레이터 내 기존 visit 데이터에 `listened` 항목 없어 프로그램 목록 UI는 코드 레벨 확인으로 대체. 실 기기 또는 listen 플로우 후 재확인 권장.

## 스크린샷 목록

| 파일 | 내용 |
|------|------|
| `evidence/qa-ticket-front.png` | AUG 14 앞면 (포스터·메타·바코드·도장) |
| `evidence/qa-ticket-back.png` | AUG 14 뒷면 (empty state) |
| `evidence/qa-ticket2-front.png` | AUG 05 앞면 |
| `evidence/qa-ticket2-back.png` | AUG 05 뒷면 (empty state) |
| `evidence/qa-memo-modal.png` | 메모 모달 + 키보드 |

## 판정

**PASS** (AC-3 ♪ 이슈는 사용자 확인 필요, 나머지 전원 통과)
