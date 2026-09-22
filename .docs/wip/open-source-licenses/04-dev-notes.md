---
feature-slug: open-source-licenses
author: chris
status: in-progress
---

# Dev notes

## Implemented ACs

| AC   | Status | Files                                                               |
| ---- | ------ | ------------------------------------------------------------------- |
| AC-1 | Done   | `app/(tabs)/settings.tsx`                                           |
| AC-2 | Done   | `app/settings/open-source-licenses.tsx`, `src/data/licenses.ts`     |
| AC-3 | Done   | `app/settings/open-source-licenses.tsx` (Screen.Header.Back 재사용) |
| AC-4 | Done   | `src/components/settings/LicenseAccordionRow.tsx`                   |
| AC-5 | Done   | `src/components/settings/LicenseAccordionRow.tsx`                   |
| AC-6 | Done   | `app/(tabs)/settings.tsx`                                           |

## Implementation decisions

- Pretendard LICENSE 원문(4816 bytes, 104줄)은 `curl`로 원격 raw 파일을 직접 다운로드한 뒤 Node로 바이트 단위(byte-for-byte) 동일성을 검증했다. 최초 저장 시 한 줄의 trailing whitespace(embedded 줄 끝 공백 1개)가 유실되어 `identical: false`로 잡혔고, `perl -i -pe`로 해당 줄만 복원해 `identical: true`를 재확인했다 — 오프라인 완전성 요구를 문자 단위로 충족.
- 아코디언은 `src/components/map/route-sheet/RouteCandidateCard.tsx`의 기존 프로덕션 패턴(`accessibilityState={{ expanded }}`, `accessibilityRole="button"`)에서 정보구조만 차용하고, reanimated 스프링 애니메이션은 정적 텍스트 1건에 과하다고 판단해 제외(`useState` + 조건부 렌더링만 사용, `ExhibitionDescription.tsx` 방식과 동일한 무게감).
- GitHub 링크는 `VenueSheet.tsx`의 기존 홈페이지 링크 패턴(아이콘 + `text-gray900` semibold + 45도 회전 화살표, `accessibilityRole="link"`)을 그대로 재사용 — 색상만으로 링크임을 표시하지 않는 접근성 원칙 준수.
- 실패 처리는 `src/utils/externalMaps.ts`의 기존 try/catch 폴백 관용구를 재사용: `WebBrowser.openBrowserAsync` 실패 시 `Linking.openURL`로 폴백.
- `LicenseAccordionRow`는 component-convention.md §9.3(같은 파일 내 private 서브컴포넌트 금지)에 따라 `src/components/settings/`로 분리했다.
- `app/(tabs)/settings.tsx`의 `scrollEnabled={!!session}`을 제거해 게스트도 항상 스크롤 가능하도록 수정(AC-6) — 소형 기기에서 게스트가 처리방침·오픈소스 라이선스·버전 행에 도달하지 못하던 버그.

## Changed files

- `app/(tabs)/settings.tsx` — "오픈소스 라이선스" `CardRow` 추가, `scrollEnabled` 버그 수정 (기존 파일 최소 diff)
- `app/settings/_layout.tsx` — `open-source-licenses` 라우트 등록
- `app/settings/open-source-licenses.tsx` — 신규 화면
- `src/components/settings/LicenseAccordionRow.tsx` — 신규 아코디언 행 컴포넌트
- `src/data/licenses.ts` — 신규 데이터 파일 (Pretendard LICENSE 원문 상수 + 라이선스 목록)

## Deviations from spec/brief

- None — 02-design-brief.md의 참조 패턴(RouteCandidateCard/VenueSheet)을 그대로 따름.

## Blockers for Taylor (QA)

- 하단 탭바 "마이페이지" 아이콘 자체를 좌표 기반으로 탭하는 시도가 이번 세션에서 AppleScript·Maestro 양쪽 모두 반응하지 않는 현상을 발견함 (05-qa-report.md § 환경 관찰 참고). `app/(tabs)/_layout.tsx`는 이번 변경과 무관한 표준 expo-router `Tabs`이며, 실제로 딥링크(`mollip://settings`)로 진입한 뒤에는 탭바 하이라이트가 정상적으로 "마이페이지"로 반영됨(회귀 스크린샷 확인) — 코드 결함이라기보다 개발 세션의 Metro/dev-client 상태 이슈로 추정. 이 기능 스코프 밖이라 별도 조치하지 않음.

## Native / env notes

- 신규 네이티브 모듈 없음(`expo-web-browser`는 기존 설치된 의존성 재사용, `~56.0.6`).
