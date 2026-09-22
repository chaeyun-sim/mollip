---
feature-slug: open-source-licenses
author: manager
status: ready-for-user
---

# Handoff to user

## Summary

설정 화면의 "개인정보 처리방침" 아래에 "오픈소스 라이선스"를 추가했다. 기본 접힘 아코디언으로 Pretendard 폰트의 SIL OFL 1.1 전문(저작권 고지 4건 포함, 오프라인 완전 수록)을 보여주고, 펼치면 GitHub 원문 링크를 인앱 브라우저로 열 수 있다. 게스트 화면 스크롤이 막혀 있던 기존 버그도 함께 고쳤다.

## What changed

- `app/(tabs)/settings.tsx` — "오픈소스 라이선스" 행 추가(개인정보 처리방침 아래, 버전 위), `scrollEnabled={!!session}` 제거로 게스트 스크롤 버그 수정
- `app/settings/open-source-licenses.tsx` (신규) — 라이선스 화면
- `app/settings/_layout.tsx` — 신규 라우트 등록
- `src/components/settings/LicenseAccordionRow.tsx` (신규) — 접힘/펼침 아코디언 행, GitHub 링크 열기(실패 시 폴백)
- `src/data/licenses.ts` (신규) — Pretendard LICENSE 원문(바이트 단위로 원본과 동일 검증됨)

## Evidence

| Feature / AC                     | tsc                                   | Screenshot                                                | Interaction                    | Regression                                       |
| -------------------------------- | ------------------------------------- | --------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| AC-1 설정 항목 위치              | ✅ 0 errors                           | 게스트 상단 캡처 확인                                     | —                              | —                                                |
| AC-2 라이선스 화면 오프라인 열람 | ✅                                    | 접힘/펼침 캡처 확인                                       | 탭 → 화면 진입 확인            | —                                                |
| AC-3 뒤로가기                    | ✅                                    | 복귀 화면 캡처 확인                                       | 탭 → 설정 복귀 확인            | —                                                |
| AC-4 아코디언 기본 접힘/토글     | ✅                                    | 접힘→펼침→재접힘 3단계 캡처 확인                          | 탭 2회(펼침/접힘) 확인         | —                                                |
| AC-5 GitHub 링크                 | ✅                                    | 인앱 브라우저에 실제 GitHub LICENSE 페이지 로드 캡처 확인 | 탭 → 브라우저 오픈 → 닫기 확인 | —                                                |
| AC-6 게스트 스크롤               | ✅                                    | 스크롤 후 "버전" 도달 캡처 확인                           | 스크롤 제스처 확인             | —                                                |
| 전체                             | ✅ 0 errors, 26 suites/252 tests pass | 9개 상태 캡처                                             | Maestro로 전체 플로우 실측     | 개인정보 처리방침·서비스 이용약관 화면 정상 확인 |

## Design QA

- Alex (Design QA) verdict: Pass @ iteration 1 (overall 4.25/5, 항목별 최소 4점 — `.docs/wip/open-source-licenses/03-design-review.md`)

## Open questions

- (none)

## 구조적 미해결 사항 (사용자 확인 필요)

- `e2e/tmp-qa-open-source-license.yaml` — QA 검증용으로 만든 임시 Maestro 플로우 파일을 세션 종료 전 삭제하려 했으나 `rm` 명령이 권한 승인 대기로 차단되어 삭제하지 못했다. 커밋 대상은 아니지만(untracked) 저장소에 남아 있으니 필요 없으면 수동으로 지워달라: `rm e2e/tmp-qa-open-source-license.yaml`
- 하단 탭바 "마이페이지" 아이콘 좌표 탭이 이번 개발 세션 환경(AppleScript, Maestro 둘 다)에서 반응하지 않는 현상을 관찰했다. 딥링크로 우회 진입 시에는 라우팅·탭 하이라이트 모두 정상이라 이번 변경과 무관한 세션 환경 이슈로 추정되며 코드 수정은 하지 않았다. 실기기·새 세션에서 재현되면 별도로 알려달라.

## User feedback

### UX feedback

-

### Evidence

-

### Triage

- [ ] Design → Design Agent
- [ ] Dev → Dev Agent
- [ ] Spec → Manager Agent
- [ ] No change required

---

**확인 요청**

위 내용 기준으로 동작·UX를 한 번 봐 주세요.
OK면 commit / push / 배포 지시를 주시면 됩니다. 수정 원하시면 구체적으로 알려 주세요.
