# Feature Audit — mollip (2026-08-18)

> 프로젝트 전체 스캔 기반 기능 현황 · 문제점 · 개선 아이디어 정리  
> 각 항목: ✅ 통과 / ⚠️ 문제 있음 / 💡 아이디어 / 🚧 미구현

---

## 1. 검색 (Search)

### 1-1. 키워드 검색 · 필터링
**위치:** `app/(tabs)/search.tsx`, `src/hooks/useExhibitionSearch.ts`

⚠️ **검색 결과 120개 하드 캡**
- 현황: `SEARCH_LIMIT = 120` 으로 클라이언트 단에서 자르고 있음
- 문제: DB 전시 수가 120개를 초과하면 이후 데이터는 노출 자체가 안 됨
- 해결 방향: Supabase 서버사이드 full-text search(`to_tsvector`) + 페이지네이션 도입

✅ 디바운싱, 제외 키워드 필터, 상태 필터(예정·진행·종료), 무료 토글, 날짜 범위 필터 동작 확인

💡 **최근 검색어가 태그 형태로만 노출** — 인기 검색어 또는 "이 검색어를 찾는 사람이 많아요" 배너 추가 고려

💡 **온보딩 선호 장르가 검색에 미반영** — `preferred_genres` 값이 있을 때 검색 결과 상단에 관련 장르 섹션을 우선 노출하거나, 필터 탭에 "내 취향" 퀵 필터 추가

---

## 2. 홈 / 탐색 (Explore)

### 2-1. 피처드 캐러셀
**위치:** `app/(tabs)/index.tsx`, `src/hooks/useExploreScreenData.ts`

✅ 피처드 전시, KCISA 큐레이션, 개인화 추천 섹션 3단 구성

⚠️ **데이터 출처 구분 없음**
- KCISA / 공공데이터 / 수동 입력 전시가 UI에서 구분되지 않음
- 사용자 입장에서 신뢰도 판단 불가
- 해결: 카드에 출처 뱃지(예: `공공데이터`, `큐레이션`) 추가

💡 **개인화 추천 알고리즘 미확인** — `useRecommendedExhibitions`가 `preferred_genres`를 실제로 쿼리하는지 검증 필요. 신규 사용자(온보딩 미완료)일 때 폴백 로직 존재 여부도 확인

### 2-2. 전시 상세
**위치:** `app/(explore)/[id].tsx`

✅ 히어로 이미지 패럴랙스, 메타 정보, 관련 전시 캐러셀, 북마크, 몰입하기 FAB

⚠️ **비몰입 모드 방문 기록 없음**
- 전시 상세를 열람해도 `visitStore.recordExhibition()` 미호출
- 다이어리가 몰입 모드 기록만 남기는 편향 발생
- 해결: 상세 화면 마운트(또는 일정 시간 체류) 시 방문 기록

---

## 3. 지도 (Map)

### 3-1. 장소·전시 마커
**위치:** `app/(tabs)/map.tsx`, `src/hooks/useMapVenues.ts`

✅ Naver Maps 마커 클러스터링(줌 기반 dot 전환), 날짜·상태 필터 칩, 거리 정렬

⚠️ **탭 이동 후 선택 상태 유지됨**
- 다른 탭으로 이동 후 복귀 시 이전에 선택한 장소 시트가 다시 열림
- `suppressClearOnDismissRef` 임시 처리 중; `useFocusEffect` 로 클리어 처리 필요

⚠️ **경로 플래닝 ref 의존성 취약**
- 경로 모달 상태를 ref 체인(`wantToOpenRef`, `suppressClearOnDismissRef`)으로 관리
- 중간 네비게이션 취소 시 ref가 dirty 상태로 남을 수 있음
- 해결: ref 대신 콜백 기반 cleanup 패턴으로 리팩토링

💡 **줌 레벨 변경 시 로딩 상태 없음** — dot ↔ 마커 전환 시 플리커링 발생. 전환 중 희미한 오버레이 또는 페이드 트랜지션 추가 고려

---

## 4. 몰입 모드 (Immersive Mode)

### 4-1. 설명 생성 흐름
**위치:** `app/(guide)/create-description.tsx`, `src/hooks/useDescriptionStream.ts`

✅ 카메라·갤러리·수동 입력 3가지 경로, Wikidata 아트워크 검색, 타이프라이터 애니메이션, TTS 자동 프리로드

⚠️ **TTS 캐시 키 충돌 가능성**
- 캐시 키: `voiceId::voiceSpeed::cleanedText`
- 텍스트에 `::`가 포함될 경우 key 충돌
- 해결: 구분자를 `\x00` 같은 비가시 문자로 교체 또는 해시 사용

⚠️ **스트리밍 완료 후 사용자가 화면 이탈 시 TTS 프리로드 낭비**
- 스트리밍 종료 → 자동 프리로드 시작 → 이탈 → blob 미사용
- 해결: 프리로드 AbortController 도입, 언마운트 시 취소

💡 **재시도 횟수 UI 노출 없음** — `retryCount` 상태가 있으나 사용자에게 "재시도 중 (2/3)" 같은 피드백이 없음

### 4-2. 채팅 (Chat Docent)
**위치:** `app/(guide)/chat.tsx`, `src/store/chatStore.ts`

✅ 메시지 스트리밍, 재시도 버튼, history 배열로 컨텍스트 유지

⚠️ **세션 누수 (메모리 리크 위험)**
- 새 설명을 생성할 때마다 chatStore에 메시지가 쌓임
- `clear()` 메서드가 deprecated 상태로 방치
- 해결: 설명 화면 언마운트 시 해당 세션 flush

⚠️ **무한 재시도 가능**
- 재시도 버튼에 최대 횟수 제한 없음
- 해결: 3회 이상 실패 시 "잠시 후 다시 시도해 주세요" 상태로 전환

---

## 5. 다이어리 / 아카이브 (Diary)

### 5-1. 방문 기록
**위치:** `app/(tabs)/diary.tsx`, `src/store/visitStore.ts`

✅ 그리드 · 캘린더 토글, 날짜별 이미지 썸네일, 메모 편집

⚠️ **오프라인 데이터가 전부 (Supabase 미연동)**
- 방문 기록이 AsyncStorage에만 저장됨
- 기기 변경 또는 앱 재설치 시 전체 소실
- 해결: 로그인 사용자 한정 Supabase `user_visits` 테이블 동기화

💡 **관람 메모 공유 기능 부재** — 작성한 메모를 카카오/클립보드로 공유하거나 이미지로 내보내기

### 5-2. 북마크
**위치:** `src/store/bookmarkStore.ts`

⚠️ **북마크 백엔드 미연동** (높은 우선순위)
- 로컬 AsyncStorage 전용; 기기 초기화 시 소실
- Supabase `user_bookmarks` 테이블 없음 (온보딩은 `profiles`에 저장하면서 북마크는 누락)
- 해결: 북마크 토글 시 Supabase upsert (디바운스 300ms)

---

## 6. 설정 (Settings)

### 6-1. 음성 · TTS 설정
**위치:** `app/settings/voice.tsx`, `src/hooks/useTTS.ts`

✅ ElevenLabs 한국어 음성 목록 필터, 속도 조절(0.7 ~ 1.5), 폰트 크기 설정

⚠️ **TTS 모델 하드코딩**
- `eleven_turbo_v2_5` 고정; 장애 시 폴백 없음
- 해결: turbo 실패 시 `eleven_multilingual_v2` 폴백 로직 추가 (Edge Function 내)

💡 **음성 미리 듣기 없음** — 목록에서 음성 선택 전 샘플 재생 버튼 제공 고려

### 6-2. 계정 · 인증
**위치:** `app/auth/login.tsx`, `src/utils/authOAuth.ts`

✅ 카카오 · Apple 로그인, 딥링크 콜백 처리

💡 **로그아웃 후 기기 로컬 데이터 처리 정책 없음** — 로그아웃 시 북마크/방문 기록을 유지할지 삭제할지 사용자에게 선택권 제공 고려

---

## 7. 오프라인 · 에러 처리

⚠️ **에러 바운더리 없음** (전체)
- 전시 데이터 로드 실패, 네트워크 끊김 등에 대한 전역 fallback UI 없음
- 해결: `app/_layout.tsx` 또는 탭 레이아웃에 React Error Boundary 래퍼 추가

⚠️ **오프라인 지원 없음**
- 생성된 설명 텍스트가 세션 후 소멸 (캐시 없음)
- 해결: 설명 생성 완료 후 `visitStore`에 텍스트도 함께 저장 → 다이어리에서 재열람 가능하게

---

## 8. 성능

⚠️ **지도 화면 825줄 단일 파일**
- `app/(tabs)/map.tsx` 가 너무 큼; 컴포넌트 분리 신호
- 해결: `MapBottomSheet`, `RoutePanel`, `MarkerLayer` 등으로 분리

⚠️ **React Query 미사용 (설치만 됨)**
- `package.json`에 있지만 실제 쿼리 캐싱 미적용
- 현재 훅들이 직접 fetch → 화면 재진입마다 중복 요청 발생
- 해결: 전시 상세, 검색 결과에 React Query 캐싱 도입

---

## 9. 새로운 기능 아이디어

### 9-1. 설명 저장 · 재생 (오디오 노트)
- 생성된 AI 설명 텍스트와 TTS 오디오를 "오디오 노트"로 저장
- 다이어리 → 날짜 → 해당 전시 → 저장된 오디오 재생
- 기술: `visitStore`에 `description` 필드 추가, TTS blob을 FileSystem에 저장

### 9-2. 소셜 공유 카드
- "오늘 나는 이 작품을 감상했어요" 형태의 공유 이미지 생성
- 작품 이미지 + AI 설명 요약 + 날짜로 구성된 카드를 `react-native-view-shot`으로 PNG 생성
- 카카오 공유 / 인스타그램 스토리 연동

### 9-3. 전시 알림
- 관심 전시 종료 D-7, D-3 알림
- 북마크한 전시가 "오늘 마지막 날"이면 push 발송
- 기술: Supabase Edge Function 스케줄러 + Expo Notifications (`usePushNotifications` 이미 skeleton 존재)

### 9-4. 작가 프로필 페이지
- Wikidata 검색으로 아트워크를 찾을 때 작가 정보도 함께 노출
- 작가 → 대표작 목록 → 해당 작가의 진행 중 전시 연결

### 9-5. 몰입 모드 플레이리스트 재생
- `immersiveStore.playlist` 항목들을 순서대로 TTS 재생하는 "뮤지엄 오디오 투어" 모드
- 작품 간 자동 이동 + 배경 음악 볼륨 덕킹

### 9-6. 접근성 개선 — 큰 글씨 + 고대비 테마
- 현재 `fontSize` 설정(small/medium/large)이 있지만 실제 적용 범위 확인 필요
- 시각 약자를 위한 고대비 모드(배경 흰색, 텍스트 검정, 폰트 +2 step)

### 9-7. 내 취향 업데이트 (온보딩 재진입)
- 온보딩 선호도가 최초 1회만 설정 가능
- 설정 → "내 취향 수정" 메뉴로 재진입해 preferred_genres / preferred_artists 갱신

---

## 우선순위 요약

| 우선도 | 항목 |
|--------|------|
| 🔴 High | 검색 120개 캡 해소, 북마크 Supabase 연동, 에러 바운더리 추가 |
| 🟠 Medium | 비몰입 방문 기록, 채팅 세션 누수 정리, TTS 모델 폴백, 방문 기록 백엔드 연동 |
| 🟡 Low | 지도 탭 선택 상태 블러 초기화, TTS 캐시 키 충돌, 출처 뱃지, 재시도 UI 피드백 |
| 💡 New | 오디오 노트 저장, 공유 카드, 전시 알림, 취향 재설정, 오디오 투어 모드 |
