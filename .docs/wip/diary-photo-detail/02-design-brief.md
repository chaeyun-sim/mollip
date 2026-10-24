---
feature-slug: diary-photo-detail
author: sam
status: approved
---

# Design brief — 다이어리 기록 상세 (사진 우선 저널)

## Design intent

액자는 목록에서 이미 봤다. 상세에서는 장식 없이 **사진 자체**를 크게 본다. 사진 → 제목/메타 → 짧은 감상 순서로 읽히는 사진 저널. 흰색에 가까운 캔버스 위에 ink 글자, 강조는 Deep Plum 한 색(선택된 썸네일 테두리, 별)만.

## Tokens (현재 DESIGN_SYSTEM.md 기준)

- 배경: `bg-bg-light` (`#FAFAF8`, `Screen variant="warm"`)
- 글자: `text-ink` (`#2D2D23`), 보조 `text-gray600`(`#6D655B`, Bianco 위 대비 ≥ 5:1), 본문 `text-gray800`
- 강조: `brand` (`#5F1D3E`) — 선택 썸네일 테두리, 별점, 사용자 채팅 말풍선
- 사진 무대: `bg-surface-neutral` (`#F3F3F0`) — contain 시 레터박스가 보이는 조용한 면
- 구분선: `border-divider`
- 폰트: 제목 `font-hahmlet-bold`, 메타/본문 Pretendard
- 오류 문구: `text-gray600` + 아이콘(`image-outline`) + 텍스트 (색만으로 전달하지 않음). 삭제 항목만 기존 `error-alt` 유지.
- 인디케이터 필: `bg-black/65` + `text-white` (흰 사진 위 최악 합성 `#595959` 기준 약 7:1, 계산값)

## Layout & components

| 영역           | 설명                                                                                                            | 재사용 컴포넌트                         |
| -------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 화면           | warm 배경, 헤더 뒤로가기(기본 어두운 색) + 날짜                                                                 | `Screen variant="warm"`, `ScreenHeader` |
| 갤러리 무대    | 화면 폭 풀블리드(`-mx-6`), 높이 = 폭×1.2, 단 방향/창 높이에 따라 `[240, 창높이×0.62]`로 제한. 페이징, `contain` | 신규 `PhotoGallery`, `GalleryPhoto`     |
| n/전체         | 무대 우하단 필 `2 / 5` (2장 이상만)                                                                             | `PhotoGallery`                          |
| 썸네일 줄      | 무대 아래 가로 스크롤, 48×48 정사각 `cover`, 간격 8, 선택=2px brand 테두리·나머지 opacity .55 (2장 이상만)      | `PhotoGallery`                          |
| 제목 행        | 전시명(22/30 Hahmlet bold, 최대 3줄) + 오른쪽 점 세 개 버튼 (40×40 터치)                                        | 인라인                                  |
| 메타           | `장소 · 방문일` (Pretendard 13, gray600, 날짜는 `text-editorial`)                                               | 인라인                                  |
| 별점           | 읽기 전용 `StarRating` light, size 18                                                                           | `StarRating`                            |
| 감상           | 메모 15/24 `text-gray800`, 상단 간격 16                                                                         | 인라인                                  |
| 들은 작품      | 구분선 + "들은 작품" 헤더 + 행(제목, 재생 가능 시 plum 재생 아이콘)                                             | 인라인                                  |
| 채팅           | 구분선 + 작품별 헤더 + 말풍선(사용자 brand/white, AI surface-neutral/ink)                                       | 인라인                                  |
| 메뉴 모달      | 점 세 개 아래 앵커, 흰 표면 + divider 테두리, 수정/삭제                                                         | 인라인 `Modal`                          |
| 감상 편집 시트 | 흰 표면(rounded-t-3xl), ink 글자, 별점 light                                                                    | 기존 구조 유지                          |

다중 방문(날짜 진입)은 블록 사이 `border-t border-divider` + 위 여백 32.

## Design decisions

1. **프레임 없음**: 테두리/그림자/못·줄 일체 제거. 무대 면(`surface-neutral`) 위에 contain으로 원본 비율 보존. 목록의 액자와 중복되지 않는다.
2. **첫 장 = 벽 대표 이미지**: `thumbnail → venuePhotos` 순서로 합쳐 목록에서 본 사진이 상세 첫 장이 된다.
3. **썸네일은 2장 이상만**: 1장이면 인디케이터·썸네일 모두 생략해 군더더기 없음. 선택 상태는 테두리 두께 + 투명도(색 외 신호) + `accessibilityState.selected`.
4. **점 세 개는 사진 위가 아니라 제목 행**: 사진을 가리지 않고, 사진이 없을 때도 같은 위치.
5. **0장**: 3:4 무대에 전시명 타이포(FrameCard 빈 면과 동일 어휘, 장식 제외) + "등록된 사진이 없어요".
6. **로드 실패**: 해당 페이지만 아이콘 + "사진을 불러오지 못했어요" + `다시 시도` 보조 버튼(plum 글자·테두리, solid 아님). 재시도는 이미지 키를 바꿔 다시 요청.
7. **회전/폭 변경**: 무대 폭은 `onLayout` 기준, 폭이 바뀌면 현재 인덱스로 즉시 재정렬.
8. **옛 VisitTicket**: 상세에서 더는 쓰지 않는다 (파일은 보존).

## Copy (KO)

| Element        | Text                                                |
| -------------- | --------------------------------------------------- |
| 인디케이터     | `2 / 5`                                             |
| 들은 작품 헤더 | 들은 작품                                           |
| 빈 사진        | 등록된 사진이 없어요                                |
| 로드 실패      | 사진을 불러오지 못했어요                            |
| 재시도         | 다시 시도                                           |
| 제목 없음      | 제목 없는 전시 (벽과 동일)                          |
| 메뉴           | 수정 / 삭제                                         |
| 삭제 Alert     | **기록 삭제** "이 기록을 삭제할까요?" / 닫기 · 삭제 |

## States

- Loading: 이미지 로딩 중 무대 면 + 작은 `Indicator`(brand)
- Empty: 위 0장 상태
- Error: 위 로드 실패 (페이지 단위)
- Success: 갤러리 + 메타

## Accessibility

- 각 사진 `accessibilityRole="image"`, 라벨 `"{전시명} 사진 {n}/{전체}"`
- 인디케이터 `accessibilityLiveRegion="polite"`, 라벨 `"사진 {n}/{전체}"`
- 썸네일 `accessibilityRole="button"`, 라벨 `"사진 {n} 보기"`, `selected` 상태, 터치 48pt
- 점 세 개 40pt + hitSlop 8, 라벨 `기록 옵션 더보기`
- 재시도 버튼 높이 ≥ 44
- 대비: ink/bg-light 13.3:1, white / black65 pill 최악(흰 사진 위) 약 7:1 (계산), gray600/bg-light 5.49:1, gray600/surface-neutral 5.16:1

## Prototype scope

- [x] Navigation wired (기존 라우트)
- [x] Fake data: dev mock (`__DEV__`만)

## Out of design scope

- 확대 뷰어, 공유, 사진 편집 UI 변경

## rev4 — 인디케이터 사진 안쪽 (2026-10-14, 티어 S)

- 위치: 히어로 스테이지(사진 영역) 안, 하단 중앙, bottom 16px. 캡션 포함 갤러리 전체가 아니라 사진 스테이지 기준 absolute.
- 모양: 반투명 어두운 알약 `bg-black/40`(px 10, py 6), 활성 흰 막대 14×5, 비활성 흰 50% 5×5, 점 간격 5. plum 미사용.
- 사진 아래 점 줄 제거 → 사진과 전시명 사이 여백 24px(`mt-6`).
- 접근성: 알약 하나를 `accessible`, 라벨 `사진 n/N`, live region polite. 터치는 통과(표시 전용) — 점 탭 이동은 폐기해 44pt 간격 문제 자체가 사라짐. 사진이 많아도 점 폭이 합쳐 화면 폭 안에 들어간다(점 20개여도 약 200pt).
- 대비: 알약이 `black/40`이라 흰 사진 위 최악 합성 약 `#999`(흰 막대 대비 약 2.8:1)이나, 막대는 모양(길이)으로도 구분되고 표시 보조용이다. 스크린샷으로 밝은 사진(10.07 노을)에서 확인.
