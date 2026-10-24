# mollip

전시 셀프 오디오 가이드 모바일 앱입니다.

- 작품을 촬영하거나 직접 입력하면 AI가 한국어 미술 해설을 생성합니다.
- AI 도슨트와 작품에 대해 자유롭게 채팅할 수 있습니다.
- 지도에서 주변 전시관을 탐색하고 길찾기 경로를 확인할 수 있습니다.
- 관람한 전시를 다이어리로 기록하고 돌아볼 수 있습니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 `.env`로 복사하고 값을 채운다.

```bash
cp .env.example .env
```

필수 변수:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

두 변수는 `src/utils/api.ts`에서 Supabase Edge Functions를 호출할 때 런타임에 사용된다. 나머지 변수(카카오/네이버/ODsay 등)의 발급 방법은 `.env.example`의 주석과 `.docs/BACKEND.md`를 참고한다.

### 3. 개발 서버 실행

```bash
npx expo start

# 플랫폼별 단축 명령
npx expo start --ios
npx expo start --android
```

### 4. iOS 네이티브 빌드 (네이티브 모듈 변경 시)

네이티브 모듈을 추가하거나 제거한 경우 JS 리로드만으로는 반영되지 않는다. 아래 순서로 풀 빌드한다.

```bash
cd ios && pod install && cd ..
npx expo run:ios
```

### 5. 테스트

```bash
npm test
```

Jest는 전시 검색 유틸(`src/utils/__tests__/exhibitionSearch.test.ts`)을 커버한다. 도메인 로직을 추가할 때는 테스트도 함께 확장한다.

## 더 알아보기

- `.docs/STATUS.md` — 구현 현황(라우트/컴포넌트/스토어/Edge Function) 정본
- `.docs/ARCHITECTURE.md` — 앱 구조·네비게이션·상태 관리 설계
- `.docs/BACKEND.md` — Supabase Edge Functions 연동
- `.docs/DESIGN_SYSTEM.md` — 컬러·타이포 토큰
- `AGENTS.md` — 에이전트 팀 워크플로
