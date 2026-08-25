# mollip

박물관 오디오 가이드 역할을 하는 React Native / Expo 모바일 앱이다. 작품 정보를 촬영하거나 직접 입력하면 AI 백엔드가 한국어 미술 해설을 생성해 타자기 애니메이션으로 보여주고 ElevenLabs TTS로 읽어주며, 이후 AI 도슨트와 채팅할 수 있다.

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

### 4. 테스트

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
