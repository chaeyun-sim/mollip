---
feature-slug: offline-download
author: manager
status: ready-for-user
---

# Handoff to user

## Summary

북마크(하트)한 해설을 디바이스에 영구 저장해 오프라인에서도 즉시 재생할 수 있는 기능을 `app/settings/bookmark/audio.tsx`에 구현했다. 당초 "몰입모드 재생목록 전체 다운로드"로 시작했으나, 사용자 피드백으로 "조회 화면 부재"와 "저장 대상의 타당성" 문제가 드러나 북마크 전용으로 범위를 재설계(spec revision 3)했다.

## What changed

- `app/settings/bookmark/audio.tsx`: 다운로드 트리거(Row A "전체 받기"), 저장공간 관리(Row B "다운로드 {size}" + 전체 삭제), 카드별 상태 배지(대기/진행중/완료/실패), BottomSheet 개별 삭제
- `src/store/offlineDownloadStore.ts`: `startDownload`/`retryDownload`/`deleteDownload`/`deleteAllDownloads` — 다운로드 상태 관리
- `src/utils/offlineAudio.ts`: `expo-file-system` 기반 파일 저장/삭제/용량 조회, `resolveAudioUri`(재생 시 로컬 파일 우선 조회 — 신규 의존성 없음)
- `src/hooks/useTTS.ts`: 로컬 우선 재생 통합
- `src/components/guide/DownloadStatusBadge.tsx`: 상태 배지(idle/loading/done/failed), `bg-gray900` 백드롭으로 사진 배경 위에서도 접근성 대비 보장
- `app/(guide)/playlist.tsx`, `src/components/guide/ArtistIntroTrack.tsx`: 초기 설계(재생목록 전체 다운로드) 롤백 — 원래 상태로 복원

## Evidence

| AC | tsc | 스크린샷 | 인터랙션 | 회귀 |
|---|---|---|---|---|
| AC-1 다운로드 시작 | ✅ 0 errors | 확보(빈 상태 — 아래 참고) | 코드 레벨 검증(단위 테스트) | playlist.tsx 정상 |
| AC-2 오프라인 재생 | ✅ 0 errors | 해당 없음(코드 변경 없이 이미 충족) | 캐시 키 대조로 코드 레벨 검증 | 없음 |
| AC-3 상태 배지 | ✅ 0 errors | 확보(빈 상태 — 아래 참고) | 코드 레벨 검증(Zustand 구독) | 카드 레이아웃 미훼손 |
| AC-4 개별 재시도 | ✅ 0 errors | 확보(빈 상태 — 아래 참고) | 코드 레벨 검증(revision 2에서 실기 이력 있음) | Row A idle 필터링 미훼손 |
| AC-5 저장공간·전체삭제 | ✅ 0 errors | 확보(빈 상태 — 아래 참고) | 코드 레벨 검증(단위 테스트) | 없음 |
| AC-6 개별 삭제 | ✅ 0 errors | 확보(빈 상태 — 아래 참고) | 코드 레벨 검증(hitSlop/위치/흐름) | BottomSheet 헤더 액션 미훼손 |
| AC-7 회귀 방지(미다운로드 기존 동작) | ✅ 0 errors | 해당 없음 | 코드 미변경 확인 | 없음 |
| AC-8 북마크 해제 후 파일 보존 | ✅ 0 errors | 해당 없음 | 코드 레벨 검증 | 없음 |
| playlist.tsx 롤백 | ✅ 0 errors | 확보(정상 구동) | — | grep으로 다운로드 관련 참조 0건 확인 |

**최종 통합**: `npx tsc --noEmit` 0 errors, `npx jest` 6 suites / 86 tests 전부 통과.

## ⚠️ 알려진 한계 — 실기 검증 필요

QA 세션에 로그인 세션이 없어(`bookmarkAudioStore`/`historyStore`가 경유하는 `authAwareStorage`에 테스트 데이터 주입이 반영되지 않음), **북마크 항목이 실제로 채워진 화면을 시뮬레이터에서 육안으로 확인하지 못했습니다.** 모든 로직은 코드 레벨(조건식·카피 문자 대조·hitSlop 수치·캐시 키 조합)과 단위 테스트 86개로 검증했지만, 이건 어디까지나 "코드가 의도대로 짜여 있다"는 확인이지 "실제로 그렇게 보인다"는 확인은 아닙니다.

**요청**: 실제 로그인 상태에서 해설 몇 개를 북마크한 뒤 다음을 눈으로 한 번 확인해 주세요:
1. 설정 > 오디오 북마크 화면에서 "전체 받기" 버튼이 뜨는지, 눌렀을 때 "받는 중… N/M"으로 바뀌는지
2. 완료 후 카드 썸네일에 체크 배지가 뜨는지, 실패 시 재시도가 되는지
3. Wi-Fi를 끈 상태에서 다운로드한 항목이 즉시 재생되는지
4. 저장공간 표시 + 전체/개별 삭제가 정상 동작하는지

## Design QA

- Alex (Design QA) verdict: **Pass** @ iteration 4 (4.5/5) — 파이프라인 루프 상한(3회)을 두 차례 초과해 사용자 예외 승인으로 진행 (한 번은 spec revision 2 설계, 한 번은 revision 3 배지 대비 이슈)

## Open questions

- (none — 모두 확정됨: 트리거=북마크 화면 명시적 액션, 해제 시 파일 유지)

---

**확인 요청**

기능 자체는 코드·테스트 레벨로 완결됐지만, 실기 확인이 안 된 부분이 있어 위 4가지를 한 번 봐 주시면 좋겠습니다.
OK면 commit 지시를 주시면 됩니다. 수정 원하시면 구체적으로 알려 주세요.
