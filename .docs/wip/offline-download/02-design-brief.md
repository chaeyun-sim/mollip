---
feature-slug: offline-download
author: sam
status: draft
---

# Design brief — 오프라인 다운로드 (북마크한 해설 오프라인 저장)

> **전면 재작성 사유(2026-09-11)**: spec revision 3 — 다운로드 대상이 "몰입모드 재생목록 전체"에서 "북마크(하트)한 해설"로, 화면이 `app/(guide)/playlist.tsx`(다크 톤, 롤백 대상)에서 `app/settings/bookmark/audio.tsx`(라이트 톤, 확장 대상)로 바뀌었다. 이전 iteration의 배지 클리핑 회피 패턴·hitSlop 44pt 기준은 유효해 재사용하지만, 색 토큰·레이아웃·화면 구조는 대상 화면이 완전히 다르므로 처음부터 새로 설계한다.

## Design intent

- `bookmark/audio.tsx`는 **라이트 톤(`Screen variant="warm"`, `bg-gray100` 계열)** 화면이다 — 이전 브리프(playlist.tsx 기준)의 다크 토큰(`bg-white/6`, `text-on-dark`)은 여기서 쓰지 않는다. 이 화면이 기존에 쓰는 라이트 팔레트(`text-gray900`/`text-gray700`/`text-gray500`/`text-[#C7C3BD]`, `bg-[#E8E3DB]` 폴백)를 그대로 상속한다.
- 카드(`AudioHistoryCard`)는 이미 한 줄(원형 썸네일 40px + 텍스트 3줄 + 하트 버튼)로 밀도가 높다. **카드별 다운로드 버튼을 새로 추가하지 않는다** — 세 번째 터치 요소를 욱여넣으면 카드가 과밀해진다(Enforce Simplicity). 대신:
  - **트리거는 리스트 상단 유틸리티 바에서 일괄로만 제공**한다("전체 받기"). 개별 대상 선택 없이 "북마크했지만 아직 안 받은 항목 전부"를 한 번에 받는다 — 북마크 자체가 이미 사용자의 명시적 선택이므로 추가 선택 UI가 불필요하다.
  - **개별 재시도**는 실패 배지를 직접 탭하는 기존 패턴(`DownloadStatusBadge`의 `onRetry`)으로 충분하다.
  - **개별 삭제(AC-6)**는 카드 목록이 아니라 카드를 눌러 여는 **상세 BottomSheet**에 배치한다 — 상세 시트는 이미 재생 컨트롤을 위한 여유 공간이 있고, 삭제는 "지금 재생 중인/보고 있는 항목"에 대한 부가 액션이라 시트가 자연스러운 자리다.
- 유틸리티 바는 `Screen.Header` 바로 아래, `FlatList` **바깥**에 고정 배치한다 — AC-3(폴링 없는 실시간 갱신)를 감안하면 사용자가 리스트를 스크롤하는 동안에도 진행률/저장공간이 계속 보여야 한다(이전 브리프의 playlist.tsx 배치 이유와 동일한 논리, 화면만 다름).
- 다운로드 상태 배지는 `DownloadStatusBadge`(완성 컴포넌트)를 재사용하되, **아이콘 배경에 `bg-gray900` 원형 백드롭을 새로 추가**해야 한다(Alex 재검증 Blocker 3 대응 — 아래 Accessibility 참고). 기존 브리프에서 검증된 클리핑 회피 패턴(`ImageFallback`/`Image`를 감싸는 `relative` 부모)을 그대로 적용한다.

## Tokens (defaults)

- Background(라이트 화면 기준): `Screen variant="warm"`(화면 자체가 배경 처리) 위 유틸리티 바 표면 `bg-white` 또는 `bg-[rgba(28,25,23,0.04)]`(카드와 구분되는 아주 옅은 톤온톤)
- Ink: `text-gray900`(#1C1917, 1차) / `text-gray700`(#57534E, 보조) / `text-gray600`(#78716C, 3차) / `text-gray500`(#A8A29E, placeholder급)
- 상태 컬러: 진행중 `text-gray500`(스피너, `ActivityIndicator` 기본), 완료 `text-success`(#00BC7D), 실패 `text-error`(#EF4444). **삭제 액션 텍스트는 `text-gray900`(#1C1917, 고대비 — 4.5:1 기준 충족)로 확정**하고, destructive 의도는 텍스트 색이 아니라 함께 배치하는 `trash-outline` 아이콘의 `text-error`(#EF4444) 색으로 전달한다(비텍스트 3:1 기준 적용, `bg-gray100` 위에서 통과) — Row B "전체 삭제" 버튼, BottomSheet 개별 삭제 아이콘 둘 다 동일 규칙 적용. (Alex 재검증: `text-error` on `#F8F6F2`는 실측 3.49:1로 4.5:1 미달이 확정값이며 "실측 후 결정"으로 미룰 사안이 아니다.)
- Font: Pretendard (카드와 동일 — `font-pretendard-semibold`/`-regular`/`-medium`)
- Radius: 유틸리티 바 `rounded-2xl`, 카드 썸네일 `rounded-full`(기존), 배지 `rounded-full`
- Touch target: 모든 다운로드 관련 인터랙션 요소 44×44pt 이상(`hitSlop`으로 확보). Row A "전체 받기" / Row B "전체 삭제" 텍스트 버튼은 아이콘 배지와 달리 `py-3`(수직 12px) 이상의 패딩으로 44pt를 확보한다(텍스트 렌더 높이 약 20px + 상하 패딩 12px×2 = 44px) — 별도 `hitSlop` 불필요.

## Layout & components

| 영역                                               | 설명                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 재사용 컴포넌트                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `bookmark/audio.tsx` — 유틸리티 바 배치            | `Screen.Header` 바로 아래, `FlatList`(L146) **바깥**에 삽입한다 — 리스트 스크롤과 무관하게 항상 고정 노출. `items.length === 0`인 빈 상태(L138-144)에서는 렌더하지 않는다(받을 대상 자체가 없으므로). Row A(일괄 트리거)·Row B(저장공간)를 세로로 쌓되(`gap-2`), 각각 독립 조건부 렌더 — 동시에 보일 수도, 하나만 보일 수도, 둘 다 안 보일 수도 있다. 컨테이너 자체 패딩은 `px-4 py-3`; 기존 `FlatList`의 `pt-4`와는 별개 요소(유틸리티 바 아래·리스트 위)이므로 두 패딩이 겹쳐 중복 여백이 생기지 않는다          | 신규 `BookmarkDownloadBar`(가칭, Row A+B 컨테이너)                                                  |
| `bookmark/audio.tsx` — Row A(일괄 다운로드 트리거) | 좌측 아이콘(`cloud-download-outline`, `text-gray700`) + 라벨 "북마크한 해설 오프라인으로 저장" + 우측 텍스트 버튼("전체 받기" / "받는 중… N/M" + 우측 소형 `ActivityIndicator`). **idle 상태 항목이 1개 이상 있을 때만 렌더**(failed 항목은 Row A 대상이 아님 — 아래 States 참고)                                                                                                                                                                                                                                  | 신규 `BookmarkDownloadRow`, `Ionicons`, `ActivityIndicator`                                         |
| `bookmark/audio.tsx` — Row B(저장공간 관리)        | 좌측 "다운로드 {size}" 텍스트(`text-gray600`) + 우측 "전체 삭제" 텍스트 버튼. **텍스트는 `text-gray900`(고대비)로 확정, destructive 의도는 버튼 좌측/텍스트 옆에 배치하는 `trash-outline` 아이콘의 `text-error` 색으로 전달**(아래 Accessibility 참고, Tokens 섹션과 동일 규칙). **완료 항목이 1개 이상 있을 때만 렌더**                                                                                                                                                                                           | 신규 파일 분리 여부는 Chris 판단(component-convention.md §9.3 기준)                                 |
| `AudioHistoryCard` — 썸네일 배지 오버레이          | `item.imageUrl` 유무에 따라 갈리는 두 분기(L39-49, `Image` 또는 `bg-[#E8E3DB]` 폴백 `View`) 전체를 감싸는 **신규 부모 `View`(`relative`)**를 추가하고, 그 형제로 `DownloadStatusBadge`를 배치한다 — 기존 브리프에서 검증된 클리핑 회피 패턴과 동일 원리(단, 이 화면은 `ImageFallback`이 아니라 순수 `Image`/`View` 분기라 클리핑 이슈 자체는 없지만, 오버레이 배치를 위해 `relative` 부모는 동일하게 필요). 예: `<View className="relative"><Image .../><DownloadStatusBadge status={...} onRetry={...} /></View>` | `DownloadStatusBadge`(아이콘을 감싸는 `bg-gray900` 원형 백드롭 신규 추가 — 아래 Accessibility 참고) |
| BottomSheet — 개별 삭제(AC-6)                      | 상세 시트 헤더 우측 액션 그룹(L182-209, 재생/일시정지 + 닫기)에 **완료 상태일 때만** `trash-outline` 아이콘을 하나 추가(재생 버튼과 닫기 버튼 사이). 탭 시 `Alert.alert` 확인 다이얼로그(취소/삭제) → 확인 시 파일만 삭제, 시트는 유지하되 배지가 즉시 idle로 갱신되는 것을 카드 목록에서 확인 가능(시트를 닫지 않아도 됨)                                                                                                                                                                                         | `Alert.alert`, `Ionicons`(`trash-outline`)                                                          |

## Copy (KO)

| Element                      | Text                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| Row A 라벨                   | 북마크한 해설 오프라인으로 저장                                        |
| Row A 버튼(대기)             | 전체 받기                                                              |
| Row A 버튼(진행중)           | 받는 중… N/M                                                           |
| Row B 저장공간 표시          | 다운로드 {size}                                                        |
| Row B 전체 삭제 버튼         | 전체 삭제                                                              |
| 전체 삭제 확인 제목          | 다운로드한 해설 삭제                                                   |
| 전체 삭제 확인 본문          | 저장된 오디오 {N}개를 모두 삭제해요. 다시 들으려면 네트워크가 필요해요 |
| 전체 삭제 확인 - 취소        | 취소                                                                   |
| 전체 삭제 확인 - 삭제        | 삭제                                                                   |
| 개별 삭제 아이콘 접근성 라벨 | 다운로드 삭제                                                          |
| 개별 삭제 확인 제목          | 다운로드 삭제                                                          |
| 개별 삭제 확인 본문          | "{title}" 다운로드 파일을 삭제해요. 다시 들으려면 네트워크가 필요해요  |
| 개별 삭제 확인 - 취소        | 취소                                                                   |
| 개별 삭제 확인 - 삭제        | 삭제                                                                   |
| 실패 상태 접근성 라벨        | 다운로드 실패, 탭해서 재시도                                           |

## States

- **Row A 표시 여부**: 북마크 목록(`items`) 중 idle 상태 항목이 1개 이상이면 Row A를 렌더한다. idle 항목이 0개(전부 완료·진행중이거나, 북마크 자체가 없음)면 렌더하지 않는다.
- **Row A "전체 받기"의 대상 범위**: idle 항목만 대상으로 한다(spec AC-1 참고사항과 동일 — 이미 완료된 항목은 재다운로드하지 않음). failed 항목은 Row A로 재시도하지 않고, 카드 썸네일의 실패 배지를 개별 탭해야만 재시도된다 — "전체 받기" 한 번으로 실패 원인이 해소되지 않은 항목까지 자동 재시도되는 혼란을 피한다(이전 브리프의 동일 결정과 같은 논리).
- **Row A — Loading**: 버튼 텍스트가 "받는 중… N/M"으로 바뀌고 우측에 소형 `ActivityIndicator`(`size="small"`, `className="text-gray500"`). 대상 카드들의 썸네일에도 각각 로딩 배지가 함께 표시된다(`DownloadStatusBadge` 자체 동작).
- **Row B 표시 여부**: 완료 상태 항목이 1개 이상이면 렌더, 0개면 렌더하지 않는다(빈 바 노출 금지).
- **카드 배지 — idle**: 배지 렌더 없음(`DownloadStatusBadge`가 `null` 반환, 기존 카드 레이아웃과 100% 동일하게 보임 — 북마크는 했지만 아직 다운로드하지 않은 다수 사용자에게 화면 변경이 느껴지지 않아야 함).
- **카드 배지 — loading/failed/done**: `DownloadStatusBadge`의 스피너 / 실패 아이콘+탭재시도 / 완료 체크 동작은 그대로 유지하되, 세 상태 모두 동일한 `bg-gray900` 원형 백드롭 위에 렌더한다(아래 Accessibility 참고 — 사진/폴백 배경과 무관하게 3:1 대비를 정적으로 보장하기 위한 신규 시각 처리).
- **북마크 해제(AC-8) 시**: 항목이 목록에서 사라질 뿐 다운로드 파일·상태는 그대로 보존된다(spec Open Questions #2 확정 — 별도 UI 변경 없음, 기존 `handleDelete`/`toggleBookmark` 동작 그대로 재사용).
- **앱 재시작 후 상태 재구성**: 화면 마운트 시 각 항목이 `hasOfflineAudio()`로 초기 상태를 재구성한다(spec Risks 참고, Chris 구현 범위) — 디자인 관점에서는 카드가 로딩 스피너 없이 완료/대기 상태로 바로 나타나야 한다(재구성 중 깜빡임 없이).
- **개별 삭제 후**: 시트를 닫지 않고 그대로 유지 — 목록의 해당 카드 배지가 done → idle로 즉시 갱신된다.

## Accessibility

- Row A 버튼: `accessibilityRole="button"`, `accessibilityLabel="북마크한 해설 오프라인으로 저장"`, 진행중일 때 `accessibilityState={{ busy: true }}` + 라벨을 "다운로드 진행 중, N개 중 M개 완료"로 갱신
- Row B 전체 삭제 버튼: `accessibilityRole="button"`, `accessibilityLabel="다운로드한 해설 전체 삭제"`
- 카드 배지: `DownloadStatusBadge` 컴포넌트에 이미 상태별 `accessibilityLabel`/`accessibilityRole`이 구현되어 있음(변경 불필요) — 실패 배지 히트 영역도 `hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}`로 이미 44pt 이상 확보됨
- BottomSheet 개별 삭제 아이콘: `accessibilityRole="button"`, `accessibilityLabel="다운로드 삭제"`, `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}`(아이콘 22px 기준 22+12+12=46pt로 44pt 원칙 충족). **기존 재생/일시정지·닫기 버튼(`hitSlop=8`)은 이번 spec 범위 밖(out-of-scope) — 회귀 방지 대상이 아니므로 이번 변경에서 함께 수정하지 않는다.**
- Contrast notes(라이트 배경 `bg-gray100` #F8F6F2 / 카드 표면은 투명):
  - Row B "전체 삭제" 텍스트 / BottomSheet 개별 삭제 아이콘 라벨: **`text-gray900`(#1C1917) on #F8F6F2 — 15.6:1, 4.5:1 기준 충분히 충족(확정값)**. `text-error`(#EF4444) on #F8F6F2는 실측 3.49:1로 4.5:1 기준 명확히 미달이므로 본문/버튼 텍스트 색으로 사용하지 않는다(Tokens 섹션과 동일 확정 — 더 이상 대안/권장 단계 아님).
  - destructive 의도는 `trash-outline` 아이콘의 `text-error`(#EF4444) 색으로 전달 — 아이콘은 비텍스트 요소이므로 3:1 기준 적용, `bg-gray100` 배경 위에서 통과.
  - **카드 배지(`text-success`/`text-error`/로딩 스피너) — 백드롭 방식 채택, `bg-gray900` 원형 백드롭 확정(Alex 재검증 Blocker 3 대응).** 배지는 실제로는 페이지 배경(`bg-gray100`)이 아니라 카드 썸네일(사진 이미지 또는 `#E8E3DB` 베이지 폴백) 위에 오버레이되므로, 사진처럼 배경색이 임의인 경우 정적으로 대비를 보장할 방법이 구조적으로 없다 — 그래서 **아이콘을 항상 고정된 색의 원형 백드롭으로 감싸** 배지-백드롭 간 대비만 정적으로 계산하고, 백드롭-사진 간의 시인성은 별도 관심사로 분리한다.
    - 백드롭 색 선택 과정: 처음 검토한 흰색(`bg-white` #FFFFFF) 백드롭은 `text-success`(#00BC7D) 대비 약 **2.47:1**로 3:1 기준에 미달해 채택하지 않았다(WCAG 2.1 relative luminance 공식으로 정적 계산 — 참고로 같은 공식으로 `bg-gray100`(#F8F6F2) 배경 대비를 재계산하면 약 2.29:1이 나와 Alex가 지적한 값과 일치, 흰색으로 바꿔도 이 특정 녹색은 근본적으로 통과하지 못함을 확인했다). 대신 `.docs/DESIGN_SYSTEM.md`에 이미 등록된 `bg-gray900`(#1C1917, "무채색 표면" 시맨틱)를 백드롭으로 채택 — 임의 hex 도입 없이 기존 토큰만 사용.
    - `bg-gray900`(#1C1917) 백드롭 위 대비(WCAG 2.1 relative luminance, 정적 계산):
      - `text-success`(#00BC7D) on `#1C1917` ≈ **7.07:1** (3:1 기준 대비 2배 이상 여유, 통과)
      - `text-error`(#EF4444) on `#1C1917` ≈ **4.65:1** (통과, `bg-gray100` 배경 대비였던 3.48:1보다도 여유 큼)
      - 로딩 스피너 `text-gray500`(#A8A29E) on `#1C1917` ≈ **6.93:1** (통과 — 참고로 스피너를 이번 백드롭 없이 그대로 뒀다면 흰 배경 위에서도 약 2.52:1로 미달했을 것이므로, 백드롭 통일이 스피너 상태의 잠재적 결함도 함께 해소한다)
    - 트레이드오프: 다른 화면(설정·확인 다이얼로그 등)의 `text-success`/`text-error` 사용처는 이 백드롭 없이 그대로 유지되므로 토큰 자체의 일관성은 깨지지 않는다 — 이번 변경은 "카드 썸네일 배지"라는 좁은 컨텍스트에 한정된 백드롭 추가일 뿐, `text-success`/`text-error` 토큰 값 자체는 전혀 바꾸지 않는다(선택지 B, 토큰 교체는 대체 녹색 토큰이 DESIGN_SYSTEM.md에 없어 애초에 불가능했다).
    - **구현 가이드(Chris) — 백드롭 지름은 상태별로 다르다(iteration 3 신규 Blocker 대응).** `failed`/`done`은 `Ionicons size={12}`로 아이콘 크기가 고정이라 "아이콘 12px + 패딩" 공식이 그대로 성립하지만, `loading`은 `ActivityIndicator size="small"`을 쓰며 이 prop은 `'small'|'large'` 프리셋만 지원해 임의 px 지정이 불가능하다. iOS 기준 `size="small"`의 실제 렌더 크기는 약 20×20pt로 이미 "failed/done 배지용 백드롭(20~22px)"과 비슷하거나 더 커서, 두 상태에 같은 치수를 쓰면 스피너가 백드롭 밖으로 삐져나온다. 이를 막기 위해 백드롭을 스피너보다 확실히 크게 잡는 방향(위 Required fix 옵션 1)을 채택한다 — `ActivityIndicator` 자체는 축소하지 않고 그대로 둔다.
      - **`failed` / `done`**: 원형 `View`(`bg-gray900`, 지름 **20~22px** — 아이콘 12px + 여유 패딩 4~5px)를 `Ionicons`의 부모로 추가한다.
      - **`loading`**: 원형 `View`(`bg-gray900`, 지름 **28px** — `ActivityIndicator size="small"`의 iOS 실측 렌더 크기(약 20pt)에 여유 패딩 4px씩을 더한 값)를 `ActivityIndicator`의 부모로 추가한다. Android는 기기/테마에 따라 `size="small"` 렌더 크기가 다를 수 있으므로, 28px보다 작게 잡지 말 것 — 여유를 더 두는 방향으로만 조정 가능.
      - 세 상태 모두 배지 위치 기준점(`absolute -top-1 -right-1`)은 백드롭을 포함한 바깥 `View` 기준으로 그대로 유지한다. `loading` 백드롭이 `failed`/`done`보다 커지면서 오프셋이 달라 보일 수 있는 시각적 균형 문제는 Blocker가 아니라 별도 non-blocking 항목(Alex iteration 3 §Non-blocking, `-top-1 -right-1` 재검토)으로 이미 분리돼 있다 — 프로토타입 시뮬 스모크 단계에서 스크린샷으로 확인.
      - 사진 썸네일 위에서도 배지 자체의 경계가 흐려지지 않도록 옅은 흰 테두리(`border border-white/20` 등, 선택 사항)를 곁들이는 것을 권장하나 이는 WCAG 통과의 필수 조건은 아니다.
      - `text-success`/`text-error`/`text-gray500` on `bg-gray900` 대비 수치(7.07:1 / 4.65:1 / 6.93:1)는 백드롭 **색**이 그대로이므로 재계산 불필요 — 이번 수정은 백드롭 **크기**만 상태별로 구분한다.
  - Row A/B 라벨 텍스트(`text-gray900`/`text-gray700`/`text-gray600`)는 기존 카드가 동일 배경에서 이미 사용 중인 토큰이므로 대비 재검증 불필요.

## Prototype scope

- [x] Static layout only
- [ ] Navigation wired
- [x] Fake data / stub API

## Out of design scope

- 카드별 개별 다운로드 트리거 버튼 — Design intent에서 밀도 문제로 배제, 일괄 트리거 + 개별 재시도 조합으로 대체(재검토 시 Chris/Manager 판단 필요하면 에스컬레이션)
- `description.tsx` 하트 액션에 다운로드 자동 연동 — spec Open Questions #1에서 명시적으로 채택되지 않음(재검토하지 않음)
- Wi-Fi 전용 다운로드 토글, TTL 만료 배지, 백그라운드 다운로드 인디케이터, 네트워크 상태 배너 — spec의 Non-goals와 동일하게 디자인 대상 아님
- 다운로드 상태의 서버 동기화/멀티 디바이스 표시 — 로컬 디바이스 상태만 다룸
- `playlist.tsx` 롤백 후 화면 자체의 디자인 변경 — 롤백은 revision-2-이전 상태 복원이므로 신규 디자인 결정 없음
