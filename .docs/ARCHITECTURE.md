# mollip 아키텍처

앱 구조 · 네비게이션 플로우 · 상태 관리 설계를 설명하는 문서. 구현 현황(라우트/컴포넌트/스토어 개수 등 인벤토리)은 `.docs/STATUS.md`가 정본이며, 이 문서는 "왜 이렇게 나뉘어 있는지"를 설명한다. 스타일링(NativeWind·폰트 토큰)은 `.docs/DESIGN_SYSTEM.md`가 정본이므로 여기서는 중복 서술하지 않는다.

## 1. 네비게이션 — expo-router 파일 기반 라우팅

`app/` 디렉토리 구조가 곧 라우트다. 라우트 그룹(괄호 디렉토리)으로 도메인을 분리한다.

| 그룹         | 역할                                      |
| ------------ | ----------------------------------------- |
| `(tabs)`     | 하단 탭 — 홈/전시목록/지도/검색/다이어리  |
| `(explore)`  | 전시 상세, 길찾기 경로                    |
| `(guide)`    | 오디오 가이드 · 몰입모드 플로우 (아래 §2) |
| `auth`       | 로그인                                    |
| `onboarding` | 최초 실행 온보딩                          |
| `settings`   | 설정 및 하위 화면                         |
| `diary`      | 날짜별 관람 기록 상세                     |

## 2. 오디오 가이드 플로우 (`(guide)`)

`app/(guide)/*.tsx`의 실제 `router.push`/`router.replace` 호출을 기준으로 확인한 현재 플로우다. 과거 CLAUDE.md에 있던 `index → create-description → description → chat` 다이어그램은 오래된 설명이었다 — `[id].tsx`(작품 상세) 화면이 제거되고 몰입모드 재생목록(`playlist.tsx`)으로 대체된 이후(커밋 `6031f88`) 실제 진입 경로가 여러 갈래로 늘었다.

### 진입점 두 갈래

1. **개별 작품 촬영/입력 플로우**: 탭 홈(`(tabs)/index.tsx`) 또는 전시 상세(`(explore)/[id].tsx`)에서 `(guide)/create-description`으로 진입 → 사진 촬영(OCR) 또는 `manual.tsx`(수동 입력) → `description`(AI 해설 생성 + TTS) → 필요 시 `chat`(도슨트 Q&A).
2. **몰입모드(전시 전체 관람) 플로우**: 탭 홈 또는 전시 상세에서 `(guide)/immersive-start`로 진입 → 시작하면 `replace`로 `playlist`(재생목록)로 이동 → 재생목록에서 작품을 선택하면 `replace`로 `description`을 재사용해 해당 작품 해설을 보여줌 → 관람 종료 시 `exit-summary`(종료 요약)로 이동.

```
(tabs)/index, (explore)/[id]
  ├─ push → (guide)/create-description ─┬─ (촬영) replace → description
  │                                       └─ push → manual → push → description
  │                                                              └─ push → chat (도슨트 Q&A, sessionId 전달)
  │
  └─ push → (guide)/immersive-start
              └─ replace → playlist ──┬─ (작품 선택) replace → description
                                       ├─ (재촬영) push → create-description
                                       └─ (관람 종료) replace → exit-summary
```

`description` 화면은 두 플로우에서 공유된다 — `store`(§3)에 `manualTitle`/`artworkDescription` 등을 채워 넣는 방식으로 호출부가 다르더라도 동일한 화면을 재사용한다. `chat`은 `description`과 `manual`에서 `sessionId` 파라미터와 함께 진입한다.

`playlist`는 몰입모드의 허브 화면으로, `beforeRemove` 리스너로 하드웨어 back/스와이프까지 가로채 "재생목록이 초기화돼요" 확인 없이 이탈하지 못하게 막는다(`app/(guide)/playlist.tsx`).

## 3. User Journey (참고용 · 아키텍처 아님)

화면 구조(§1~2)를 사용자 목표 관점에서 다시 읽은 보조 자료다. 정본은 §1~2이고, 여기는 "왜 이 순서로 화면을 거치는가"만 보완한다.

| 단계 | 사용자 목표 | 주요 행동 | 화면 | 관련 상태 |
|---|---|---|---|---|
| 1. 발견 | 지금 볼 만한 전시를 찾는다 | 홈 추천·국공립 전시 훑기, 검색, 지도에서 주변 전시 탐색 | `(tabs)/index`, `(tabs)/search`, `(tabs)/map` | — |
| 2. 관람 준비 | 관람 방식을 정한다(개별 작품 vs 전시 전체) | 작품 하나만 볼지, 전시 전체를 몰입모드로 돌지 선택 | `(explore)/[id]`, `(guide)/immersive-start` | `store.ts` |
| 3. 해설 받기 | 지금 보는 작품에 대한 해설을 듣는다 | 촬영(OCR) 또는 수동 입력 → AI 해설 생성 → TTS 재생 | `(guide)/create-description`, `manual`, `description` | `store.ts` |
| 4. 더 알아보기 | 궁금한 점을 더 물어본다 | AI 도슨트에게 질문 | `(guide)/chat` | `chatStore` |
| 5. 관람 마무리 | 관람 흐름을 이어가거나 정리한다 | 재생목록에서 다음 작품 선택, 관람 종료 시 요약·주변 추천 확인 | `(guide)/playlist`, `(guide)/exit-summary` | `immersiveStore`, `visitStore` |
| 6. 기록 확인 | 지금까지 뭘 봤는지 돌아본다 | 날짜별 관람 기록·티켓, 저장한 전시 다시 보기 | `(tabs)/diary`, `diary/[date]` | `visitStore`, `bookmarkStore` |

## 4. 상태 아키텍처

두 계층을 용도에 따라 명확히 분리해서 쓴다.

### 3.1 `src/store.ts` — 비반응형 mutable 객체

화면 전환 시 리렌더를 트리거할 필요가 없는 "다음 화면에 전달만 하면 되는" 일시 데이터를 담는다. React state가 아니라 평범한 객체(`store.artworkDescription = text`처럼 직접 mutate)이기 때문에, 값이 바뀌어도 이 값을 구독하는 컴포넌트가 자동으로 리렌더되지 않는다 — 오디오 가이드 플로우처럼 "화면 A에서 값을 채우고 화면 B에서 한 번 읽기만 하면 되는" 단방향 전달에 적합하다. 필드: `imageBase64`, `imageMediaType`, `extractedText`, `artworkDescription`, `artworkImageUrl`, `inputMode`, `manualTitle`, `manualArtist`, `manualYear`. 영속화되지 않으며 앱 재시작 시 초기화된다.

### 3.2 Zustand 스토어 — 반응형

여러 화면에서 구독·갱신되어야 하거나(리스트 갱신, 뱃지 표시 등) 앱 재실행 후에도 유지되어야 하는 상태는 Zustand로 관리한다. `persist` 미들웨어를 쓰는 스토어(북마크, 방문 기록, 몰입모드 재생목록, 최근 검색어, 설정 등)는 로컬에 영속화된다. 채팅 메시지·지도 카메라 이동 대기 상태처럼 세션 내에서만 필요한 것은 `persist` 없이 쓴다.

두 계층을 나누는 기준: **"다른 컴포넌트가 이 값의 변화를 구독해야 하는가?"** — 필요 없으면 `store.ts`(가볍다), 필요하면 Zustand(반응형 갱신 + 선택적 영속화).

전체 스토어 목록·필드는 `.docs/STATUS.md` §3~4 참고.

## 5. 레이아웃 컴포넌트

`src/components/layout/`은 모든 화면이 공유하는 레이아웃 프리미티브다.

- `Screen.tsx` — 화면 최상위 컨테이너. 컴파운드 컴포넌트 패턴으로 `Screen.Header` 등의 slot을 제공한다(`component-convention.md` §9.2 참고).
- `ScreenHeader.tsx` — 헤더 영역 — 좌/우 슬롯(`ScreenHeader.Right` 등)으로 뒤로가기 버튼, 타이틀, 액션 버튼을 배치한다.
- `Loading/` — 로딩 스켈레톤 (`SkeletonBox.tsx`, `ExhibitionDetailSkeleton.tsx`).

거의 모든 `app/*.tsx` 화면이 `Screen` + `ScreenHeader`로 조립된다(예: `app/(guide)/description.tsx`, `app/(guide)/playlist.tsx`).

## 6. 스타일링

NativeWind(Tailwind) 클래스와 Pretendard/Hahmlet 폰트 패밀리, 컬러 토큰의 정본은 `.docs/DESIGN_SYSTEM.md`다. 컴포넌트에서 `className` vs `style` 사용 규칙은 `.claude/rules/component-convention.md` §2를 따른다.

## 7. 백엔드 연동

클라이언트가 Supabase Edge Functions를 호출하는 방식과 각 함수의 역할은 `.docs/BACKEND.md`에 별도로 정리한다.
