---
feature-slug: essay-generation
author: chris
revision: 2
status: dev-complete
---

# Dev notes — 감상평 통합 (rev2)

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/archive/EssayInputSection.tsx` | 신규 — 감상평 라벨 + 작성 방식 토글 + 박스형 TextInput + 에러/다음 UI |
| `src/components/archive/EssayStageSection.tsx` | **삭제** — rev1 3단계 감상 생성 블록 폐기 |
| `src/components/archive/ReceiptSummary.tsx` | 한줄평 입력칸 + EssayStageSection 제거, EssayInputSection pass-through로 교체. `onMemoDone`/`essayStageReady` 제거 |
| `app/diary/confirm-visits.tsx` | 별점 → 감상평 → 서명 3단계. `essayText`/`essayInputMode`/`essayGenerateCount` 소유. 스트리밍 값을 TextInput value로 동기화 |
| `src/hooks/useEssayStream.ts` | `MAX_ESSAY_GENERATES=5`, `clearError()` 추가. 델타 누적 로직은 유지 |
| `src/store/visitStore.ts` | `confirmVisit`에서 `essay` 파라미터 제거, `memo` 단일 저장. persist 재로딩 시 `_migrateEssayToMemo` |
| `src/utils/migrateEssayIntoMemo.ts` | 신규 — memo 비어있으면 essay 이관, 둘 다 있으면 memo 우선 |
| `src/constants/prompts.ts` | `memo` 주석만 재해석(생성 시점 입력칸 텍스트). 프롬프트 문자열 구조 유지 |
| `src/constants/__tests__/essayPrompt.test.ts` | AC 번호/설명만 rev2에 맞춤 |
| `src/utils/__tests__/migrateEssayIntoMemo.test.ts` | 신규 — 이관 규칙 4케이스 |

## AC별 체크리스트

| AC | 내용 | 구현 위치 | 상태 |
|----|------|-----------|------|
| AC-1 | "감상평" 단일 입력칸 | `EssayInputSection` 라벨/placeholder, `ReceiptSummary`는 별점 직후 바로 노출 | ✅ |
| AC-2 | 직접 쓰기/생성하기 토글 | `essayInputMode` controlled 토글 | ✅ |
| AC-3 | 별점만 있어도 생성 가능 | `onEssayGenerate`에 빈 텍스트 가드 없음 | ✅ |
| AC-4 | 기존 입력 텍스트를 재료로 포함 | `generateEssay({ memo: essayText.trim() })` | ✅ |
| AC-5 | 생성 중 입력칸 잠금 | `editable={essayStage !== 'streaming'}` | ✅ |
| AC-6 | 스트리밍이 TextInput value로 표시 | `confirm-visits`가 `streamedText`를 `essayText`에 동기화 | ✅ |
| AC-7 | 생성 완료 후 자유 편집 | `done`이면 잠금 해제, 이후 `onEssayTextChange`가 로컬 state 소유 | ✅ |
| AC-8 | 감상평 없이도 다음 가능 | "다음" 버튼에 텍스트 필수 조건 없음 | ✅ |
| AC-9 | 들은 해설 없어도 생성 | 기존 `buildEssayPrompt` 폴백 재사용 | ✅ |
| AC-10 | 생성 실패 처리 | 잠금 해제 + 에러 메시지 + 재시도/직접 쓰기 전환 | ✅ |
| AC-11 | 다음 → 서명 | `onEssayNext`만 서명 진입. multiline이라 키보드 완료는 의도적 미구현(브리프) | ✅ |
| AC-12 | 생성 중 다음 차단 | 부모/컴포넌트 양쪽에서 `streaming` 가드 | ✅ |
| AC-13 | 화면 이탈 시 취소 | 언마운트 `cancelEssay()` 재사용 | ✅ |
| AC-14 | 감상평을 memo로 저장 | `confirmVisit({ memo: essayText.trim() })` | ✅ |
| AC-15 | 재생성 5회 상한 | `essayGenerateCount` 단일 카운터, 5회 소진 시 토글 disabled | ✅ |

## 구현 결정 사항

1. **`essayInputMode`와 `essayStage`는 한 함수에서 함께 갱신**(Alex Suggestion). `handleEssayGenerate`가 mode를 `generate`로 바꾼 뒤 `generateEssay()`를 호출한다. streaming/error는 generate 경로에서만 발생한다.
2. **재생성 카운터는 Sam 채택안(단일 5회)**. 정상 재생성과 오류 재시도를 구분하지 않는다. `essayRetriesExhausted`도 이 카운터(`>= 5`)에서 파생한다. 훅의 `MAX_ESSAY_RETRIES`/`retry()`는 UI에서 쓰지 않는다.
3. **덮어쓰기 확인 없음**(spec Open Questions). 생성 시작 시 훅이 displayed를 비우고, 부모가 그 값을 입력칸에 반영한다.
4. **`DayVisit.essay`는 타입에만 잔존**. persist된 rev1 데이터를 읽기 위해서다. 재로딩/`loadFromRemote`/`confirmVisit`에서 이관·삭제한다. 신규 기록은 `memo`만 쓴다.
5. **`EssayInputSection`에 `focus()` ref**. ReceiptSummary의 `hasFocusedEssayRef` 패턴(별점 최초 1회 자동 포커스)을 유지한다.

## 완료 조건 결과

- `npx tsc --noEmit` → 오류 0건
- `npx jest` → 8 suites / 94 tests 전부 통과
