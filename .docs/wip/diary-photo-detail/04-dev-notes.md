---
feature-slug: diary-photo-detail
author: chris
status: done-with-caveats
---

# Dev notes

## 진행 상태 (부모 모니터링용, 최신이 위)

- [x] AC-1 `visitGallery.ts` + Jest 14개 (RED 확인 → GREEN)
- [x] AC-2/3/4 `PhotoGallery`, `GalleryPhoto` — 시뮬레이터 1/3·2/3·3/3 스와이프, 깨진 URL 실패 UI 확인
- [x] AC-5/6/7 `VisitBlock` 재작성, `app/diary/[date].tsx` warm 화면 + 편집 시트 밝은 톤
- [x] 메뉴 열기, 삭제 Alert 표시 → 닫기 취소 확인 (mock 기록, 실제 데이터 무변경)
- [x] 썸네일 탭, 다시 시도(실패 재진입만), 편집 시트(키보드 시 제목 줄 고정·z-index 수정), 0장, 4장(중복 제거), 뒤로가기 — 확인 완료
- [x] 2차(부모 리뷰 6건) 반영 + 합성 스텁 복구(`t:mock2`) — 위 표 참고. `t:mock1`은 미복구(승인 필요)
- [ ] 회전, 재시도 성공 경로, 해설 재생/채팅, 하루 다중 블록 — 미검증 (05-qa-report 참고)
- 최종(2차): tsc exit 0, jest 43 suites / 341 tests 통과(`.agents` 11 suites는 기준선 실패), prettier·eslint 클린
- 정리 못 한 파일(삭제 권한 없음, 05 보고서는 참조하지 않음): `evidence/launch.png`(Metro 오류 화면), `evidence/dbg1.png`(디버그용 빈 화면), `evidence/fu-wall-restored.png`(홈 화면 오촬영)

status: 구현·QA 완료(캐비앗 있음)

## 테스트 부작용 복구 기록 (2차 작업, 2026-10-13)

1차 QA 중 Maestro 좌표 탭이 열려 있던 키보드를 눌러 mock 기록 `2026-10-06::t:mock2`에 `setVisitMemo`가 호출됐고, 스토어에 없는 키라 **스텁 레코드가 새로 만들어져** 로컬 SQLite와 Supabase `visits`에 기록됐다(코드 확인 + 아래 조회로 입증).

복구 절차 (부모 승인 범위: 내가 만든 합성 스텁 1건만, 자격 증명 값은 출력하지 않음):

| 단계                   | 한 일                                                                                                                                                                            | 결과                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 읽기 전용 조회(로컬) | 시뮬레이터 앱 컨테이너 `Documents/SQLite/local-visits.db`를 `sqlite3 -readonly`로 조회                                                                                           | `local_visits` 5행 중 `%mock%` 키 2행: `2026-10-06::t:mock2`, `2026-10-10::t:mock1`. 둘 다 키·날짜 외 모든 컬럼 NULL, `local_visit_photos`/`local_visit_listened` 자식 행 0. 나머지 3행은 실제 기록(제목·상태 있음)이라 조회 외에 건드리지 않음 |
| 2 읽기 전용 조회(원격) | 프로젝트 `.env`의 서비스 롤 키로 `visits`를 `visit_key like *mock*`로만 REST 조회(키는 출력하지 않음, `user_id`는 앞 8자만 확인)                                                 | 같은 사용자 1명의 2행: `t:mock2`(2026-10-06, `visit_status=recorded`, 제목·사진·메모 비어 있음), `t:mock1`(2026-10-10, memo `ㅔ`)                                                                                                               |
| 3 원격 삭제            | `t:mock2`만 `user_id`+`visit_key`+`date`+`exhibition_title is null`+`memo=''`+`ticket_photo_url is null`로 DELETE, `return=representation`                                       | 첫 시도는 `memo is null` 조건 불일치로 **0행**(안전장치 작동), 조건을 `memo=''`로 고쳐 재시도해 **정확히 1행** 삭제. 재조회로 확인                                                                                                              |
| 4 로컬 삭제            | 앱 종료 후 `delete … where visit_key='2026-10-06::t:mock2' and exhibition_id is null and exhibition_title is null and thumbnail_uri is null and memo is null and status is null` | 변경 1행, 5→4행, 자식 행 0                                                                                                                                                                                                                      |
| 5 닫힌 루프 확인       | 앱 재실행 후 다이어리 벽                                                                                                                                                         | 10.06 "색채의 항해" 액자가 벽에 복귀(`evidence/fu-launch.png`; 같은 폴더의 `fu-wall-restored.png`는 앱이 내려간 홈 화면을 잘못 찍은 파일이라 증거로 쓰지 않음). 이후 모든 테스트 뒤 로컬/원격 재조회에서 새 mock·QA·not-found 행 없음           |

복구하지 않은 것 (명시):

- **`2026-10-10::t:mock1`** (로컬 + 원격 memo `ㅔ`): 키가 mock 전용이고 필드가 모두 비어 합성 스텁이 거의 확실하지만, **내가 만든 스텁이라는 근거가 없어**(내 Maestro 마지막 실행 이후 시점으로 보이고 `ㅔ`를 입력한 기억 없음) 승인 범위 밖이라 삭제하지 않았다. 그 영향으로 벽 10.10 mock 액자가 빠져 있다(`4점`). 지우려면 승인 후: 원격 `DELETE visits where visit_key='t:mock1' and date='2026-10-10' and exhibition_title is null`, 로컬 `delete from local_visits where visit_key='2026-10-10::t:mock1'` (앱 종료 상태).
- `Documents/ExpoAppMetrics/metrics.db`에도 `t:mock2` 문자열이 남아 있다(앱 계측 로그, 레코드 저장소 아님) — 건드리지 않았다.
- 복구 코드를 저장소에 남기지 않았다(전부 일회성 셸/sqlite3/curl).

재발 방지(코드): 아래 2차 변경의 읽기 전용 mock 가드로 mock 키는 더 이상 `setVisitMemo/Rating/updateVisitPhotos/deleteVisit`에 닿지 않는다.

## 2차 변경 (부모 리뷰 반영)

| #   | 지적                                     | 조치                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `opacity-55`가 기본 스케일에 없음        | `tailwind.config.js`에 `opacity` 확장이 없음을 확인 → `opacity-[0.55]`. 썸네일 줄 패딩/간격은 `contentContainerClassName="px-6 gap-2"`로 이동(expo-image는 NativeWind cssInterop이 등록돼 있지 않아 `style` 유지, 동적 폭/높이도 `style`). 같은 문제가 무관한 `RouteTimeline.tsx:83`에 있으나 범위 밖이라 기록만                                                                                   |
| 2   | mock이 실제 스토어/원격 쓰기 경로에 닿음 | `app/diary/[date].tsx`: `isStoredKey`(스토어에 있는 키만 true). 수정·삭제 시도는 `handleEditPress`/`handleDeletePress`에서 막고 하단에 2.6초 안내("미리보기용 샘플이라 수정·삭제할 수 없어요"). 편집 시트의 별점·메모 onChange, 닫기(업로드) 경로에도 같은 가드. 편집 중 키가 스토어에서 사라지면 시트를 자동으로 닫음. 실제 기록이 같은 키로 스토어에 있으면 `isStoredKey`가 true라 기존대로 동작 |
| 3   | 기본 mock에 깨진 URL                     | 기본 mock에서 제거(정상 사진 추가분만, 난수 호출 순서·제목·썸네일 불변). 깨진 URL은 `getQaFixtureVisit`로 분리: 목록에는 나오지 않고 `mollip://diary/2026-10-13?visit=2026-10-13%3A%3At%3Aqa-broken-photos` 딥링크로 열 때만 상세에서 병합(`__DEV__` 한정, 읽기 전용)                                                                                                                              |
| 4   | 접근성 트리에서 재시도/메뉴 가려짐       | `GalleryPhoto`: 부모 View의 image 역할/라벨 제거 → `Image`에만 부여. `VisitBlock` 메뉴: 배경 `Pressable`을 메뉴의 부모가 아니라 **형제**(`absolute inset-0`)로 변경. 인디케이터 필에 `accessible` 추가. 라벨 셀렉터(`사진 다시 불러오기`, `나의 감상 편집`, `기록 삭제`, `사진 N 보기`, `사진 n/N`)로 Maestro 실제 확인                                                                            |
| 5   | stale index                              | `resolveActiveIndex`(보던 사진 uri를 따라가고 없으면 옛 인덱스를 새 범위로 보정) + 선택 상태를 `{index, uri}`로 저장하고 보정값을 상태에 되써 줄었다 늘어도 되살아나지 않음. 썸네일 점프 중에는 `scrollTargetRef`로 중간 페이지 이벤트를 무시하고 드래그 시작/모멘텀 종료에서 해제. 단위 테스트 +5                                                                                                 |
| 6   | 기록이 없을 때 빈 화면                   | `Result`(기존 공통 컴포넌트)로 "기록을 찾을 수 없어요 / 삭제되었거나 아직 불러오지 못한 기록이에요." + "돌아가기". 헤더 뒤로가기와 버튼은 `router.canGoBack()`이 없으면 `/(tabs)/diary`로 `replace`                                                                                                                                                                                                |

## 변경 파일

| 파일                                              | 내용                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/utils/visitGallery.ts` (신규)                | `buildVisitPhotos`, `clampPhotoIndex`, `pageIndexFromOffset`, `galleryStageHeight`, `resolveActiveIndex`             |
| `src/utils/__tests__/visitGallery.test.ts` (신규) | 19 tests                                                                                                             |
| `src/components/archive/GalleryPhoto.tsx` (신규)  | contain 이미지 한 장, 로드 실패·재시도(`Button` ghost 재사용)                                                        |
| `src/components/archive/PhotoGallery.tsx` (신규)  | 풀폭 FlatList 페이저, n / 전체 필, 썸네일 줄, 0장 빈 상태                                                            |
| `src/components/archive/VisitBlock.tsx`           | 티켓 제거 → 갤러리 + 제목/메타/별점/메모/들은 작품/채팅, 밝은 메뉴 모달                                              |
| `app/diary/[date].tsx`                            | `Screen variant="warm" px-0`, 헤더 어두운 색, dev mock 병합, 블록 구분선, 삭제 Alert 문구, 편집 시트 밝은 톤         |
| `src/utils/devMockVisits.ts`                      | `venuePhotos` 시나리오(다중·중복, 모두 정상 URL) + 옵트인 QA 픽스처 `getQaFixtureVisit` — 벽 대표 이미지/난수열 불변 |
| `src/utils/museumWall.ts`                         | `cleanText`에 `export`만 추가 (벽 로직 불변)                                                                         |

옛 `VisitTicket*.tsx`는 더 이상 참조되지 않지만 삭제하지 않았다(범위 밖).

## 데이터 매핑 조사 결과

- `thumbnail`과 `venuePhotos`는 저장(`saveRecord`, `updateVisitPhotos`), 로컬 SQLite(`thumbnail_uri` + `local_visit_photos`), 원격 동기화(`ticket_photo_url` + `venue_photo_urls`)에서 모두 별개 필드로 보존된다 → 저장 측 유실 없음.
- 유실은 읽는 쪽에서 한 필드만 볼 때 생긴다. 상세는 `buildVisitPhotos`로 합쳐서 읽는다. 첫 장은 벽 대표 이미지와 동일.
- 관찰(수정하지 않음, 범위 밖): `useVisitSync`는 원격 행의 `ticket_photo_url`이 없으면 `thumbnail`을 `undefined`로 덮는다. 로컬 전용 포스터가 로그인 직후 사라질 수 있는 경로로 보이나 이번 변경과 무관하다.
- 관찰: 감상 편집 시트는 `isTicketVisit`(사진 있음)일 때만 사진 편집을 보여주고, 저장 시 `thumbnail`이 없으면 "티켓 사진 필요"로 막는다. 기록하기 플로우처럼 `venuePhotos`만 있는 기록은 사진을 고치려면 막힐 수 있다. 동작 변경은 spec 비범위라 두었다.

## 환경 기준선

- `npx tsc --noEmit`: 변경 전 exit 0.
- `npx jest`: 변경 전/후 모두 `.agents/skills/claude-to-im` 11개 suite 실패(import 오류, 이번 작업과 무관). 앱 suite 43개 통과.

## rev4 변경 (2026-10-14, 티어 S)

- `PhotoGallery.tsx`: 인디케이터를 스테이지 안 absolute(`bottom-4`, 중앙)의 표시 전용 알약으로 이동. 사진 아래 점 줄 제거. 탭 가능한 점 관련 코드(`handleSelectDot`, `scrollTargetRef`, `onScrollBeginDrag/MomentumScrollEnd`)와 `canTapDots`/`DOT_TOUCH_SIZE`(+테스트 3건) 삭제 — 쓰이지 않는 코드를 남기지 않음.
- `VisitBlock.tsx`: 메타 블록 위 여백 `mt-4` → `mt-6`(24px). 메모에 `lineBreakStrategyIOS="hangul-word"` 추가(단어 중간 줄바꿈 완화).
- 사진 위 스테이지는 `useWindowDimensions` 폭/높이 기준이고, 스와이프·`resolveActiveIndex` 보정·읽기 전용 mock 가드·누락 상태·정리 이력은 그대로.
- 주의: 오늘이 10/14로 넘어가 mock 키(오늘 기준 생성)가 하루씩 밀렸다. QA는 현재 키(`2026-10-02::t:mock4` 4장, `2026-10-07::t:mock2` 2장, 벽 첫 액자 1장)로 수행. mock/실제 기록 변경 없음.

## 2026-10-14 별점 + 후기 섹션 정리 (티어 S, `VisitBlock.tsx`만)

요청: 기존 별점 박스(테두리 흰 박스, `self-start`, 주석 처리된 JSX)와 후기 `Text`를 중앙 정렬의 차분한 섹션으로 교체. 히어로·메타·인디케이터·메뉴·편집 시트·팔레트·다른 컴포넌트는 건드리지 않음.

1. 적용한 안(내가 쓴 코드): 죽은 주석 JSX와 흰 테두리 박스 삭제 → `hasReview` 하나로 묶은 `mt-8 items-center` 섹션. 별 24px(`StarRating`, 기존 컴포넌트·읽기 전용) + 그 아래 `4.0 / 5`(13px, gray600). 별+점수를 `accessible` 한 요소(`별점 4.0점, 5점 만점`)로 묶어 읽기 전용 별 5개가 버튼으로 따로 읽히지 않게 함. 후기는 `bg-surface-neutral` 패널(`rounded-2xl`, px/py 20) 안에 작은 `나의 후기` 라벨(12px gray600) + 중앙 정렬 본문(15/26, `lineBreakStrategyIOS="hangul-word"`). 별점만/후기만 있어도 빈 여백 없이 렌더(`mt-6`은 별점이 있을 때만). `cleanText` 기준 유지. `tsc` 0, eslint 0, prettier 통과 상태에서 저장.
2. **⚠ 저장 직후 파일이 내가 아닌 쪽에서 다시 바뀌었다.** 현재 디스크의 해당 블록(179–197행)은 별 `StarRating`이 `memo` 패널 **안**으로 들어가 있고, `나의 후기` 라벨·`4.0 / 5` 점수·접근성 묶음·본문 `text-center`가 없다. 시스템 안내대로 의도된 편집으로 보고 **되돌리지 않았다**. 이 상태의 문제(코드 확인 + 스크린샷 `evidence/r5-review-memo.png`):
   - 별이 `{memo && …}` 안에 있어 **별점만 있고 메모가 없는 기록은 별이 아예 안 보인다**(이전 버전은 보였음). 이번 mock은 별점만 있는 기록(`2026-10-14::t:mock0`)이 대표적인데, 딥링크가 이동하지 않아 화면으로는 확인하지 못했다 — 코드상 결론이다.
   - `ratingText`가 선언만 되고 쓰이지 않아 eslint 경고 1건(`@typescript-eslint/no-unused-vars`, 에러 아님).
   - 스크린샷에서 후기 본문이 좌측 정렬이고 별과 본문이 붙어 있다.
     원하는 안으로 되돌리려면 위 1번 설명대로 `hasReview` 블록을 다시 적용하면 된다(별+점수 그룹 → 후기 패널 분리, 별 그룹은 `hasRating` 단독 조건).
3. 이번 항목에서 실행하지 않은 것: 별점만/후기만 있는 기록의 화면 확인(mock이 모두 별점 + 일부만 메모), 가로 회전, 다른 기록.

## rev5 — 별점 + 후기 매거진 레이아웃 (2026-10-14, 티어 S, `VisitBlock.tsx`의 `hasReview` 블록만)

기준: 사용자가 준 현재 스니펫(별이 후기 패널 안에 있던 버전)을 출발점으로 삼아 그 블록만 교체. 위쪽 메타(제목/`작가 · 날짜`)와 아래 `listenedItems` 섹션은 그대로 — 편집 전 현재 파일을 읽고 `{hasReview && (` ~ `{listenedItems.length > 0 && (` 사이를 정확한 앵커(각 1회 매칭 assert)로만 치환했고, 치환 후 다시 읽어 주변이 보존된 것을 확인.

- 둥근 `bg-surface-neutral` 카드 제거 → 흰 페이지 위 `mt-10 px-6` 에디토리얼 섹션.
- 머리말 행: 짧은 `bg-editorial` 포인트 선(16×2) + `관람 노트`(11px, tracking 1.5, gray600) / 오른쪽 정렬 컴팩트 `StarRating`(18, light) + `4.0 / 5`(12px). 아래에 0.5px `border-divider` 가는 선.
- 별점·점수는 `accessible` 한 요소(`별점 4.0점, 5점 만점`)로 묶어 읽기 전용 별 5개가 따로 읽히지 않게 함. `StarRating` 자체는 수정하지 않음.
- 후기: Hahmlet 56px 여는 따옴표(`text-editorial/40`, 스크린리더 숨김, `-mb-5`로 본문에 붙임) + 18/30 본문(gray800, `lineBreakStrategyIOS="hangul-word"`), 좌측 정렬. 큰 장식·plum 블록 없음.
- 조건 분리: 바깥 `hasReview`, 별점 행 `hasRating`, 따옴표+본문 `memo`. 별점만 / 후기만 / 둘 다 / 없음 모두 빈 여백 없이 처리(코드 기준; 없음 → 섹션 자체 미렌더). 이전 주석 마크업·`bg-surface-neutral`·`mt-6` 조건 클래스 제거. `ratingText`는 다시 사용되어 eslint 경고 해소.
- prettier가 사용자가 쓴 메타 삼항(`) : <Text`)의 공백만 정리했다(동작·스타일 불변).

## rev6 — 히어로 사진 높이 축소 (2026-10-14, 티어 S)

사용자 요청("사진을 조금 작게해도 ㄱㅊ을듯"). `src/utils/visitGallery.ts`의 `STAGE_HEIGHT_RATIO`만 `1.2 → 0.9`로 변경. `STAGE_MAX_WINDOW_RATIO`(0.62)와 `STAGE_MIN_HEIGHT`(240) 클램프, `PhotoGallery`/캐러셀/절대 헤더/별점·후기는 그대로. 사용처는 `PhotoGallery.tsx` 한 곳(`galleryStageHeight(windowWidth, windowHeight)`)이라 상단 풀블리드 동작도 불변.

- 테스트 먼저: `galleryStageHeight(400, 900)` 기대값 480 → 360으로 바꿔 RED(기대 360, 실제 480) 확인 후 상수 수정 → GREEN. `(400, 500)=310`(창 높이 62% 클램프), `(800, 300)=240`(최소 높이)은 값 변경 없이 유효.
- 참고: 폭 402pt 기기에서 높이는 약 362pt = 화면 높이(874pt)의 약 41%다. 요청의 "화면 높이 약 1/3"은 대략적 표현으로 보고 "폭의 0.9배"를 기준으로 삼았다. 더 줄이려면 같은 상수만 조정하면 된다.
