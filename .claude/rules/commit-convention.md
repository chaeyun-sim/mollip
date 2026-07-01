# Commit Convention

## 형식

```
type(scope): 한글 텍스트
```

type, scope, text 세 항목 모두 필수입니다.

## Type

| type | 용도 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `chore` | 빌드·설정·의존성 등 기능 외 작업 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `style` | 포맷·공백·세미콜론 등 코드 스타일 |
| `docs` | 문서 작성·수정 |
| `perf` | 성능 개선 |
| `test` | 테스트 추가·수정 |
| `build` | 빌드 시스템·CI 변경 |

## Scope

프로젝트 주요 도메인 단위로만 사용합니다. 세부 파일명은 쓰지 않습니다.

| scope | 대상 |
|---|---|
| `app` | 화면·라우팅 (`app/`) |
| `api` | API 클라이언트 (`src/utils/api.ts`) |
| `ui` | 컴포넌트·레이아웃 (`src/components/`) |
| `store` | 상태 관리 (`src/store/`) |
| `tts` | TTS·오디오 (`src/hooks/useTTS.ts`) |
| `supabase` | Edge Functions (`supabase/functions/`) |
| `deps` | 의존성 추가·제거·업데이트 |
| `config` | 설정 파일 (env, tsconfig, tailwind 등) |

## Text 규칙

- **한글**로 작성
- 명령형 동사로 끝내기: `~추가`, `~수정`, `~제거`, `~개선`
- 마침표 없음

## 올바른 예시

```
feat(app): 검색 화면 추가
fix(api): 스트리밍 응답 파싱 오류 수정
chore(deps): expo-file-system 설치
refactor(store): chatStore 액션 단순화
style(ui): ScreenHeader 들여쓰기 정리
docs(config): 환경 변수 설명 추가
```

## 잘못된 예시

```
fix: 버그 수정            # scope 없음 → FAIL
feat(screens): 추가       # 허용되지 않는 scope → FAIL
fix(ui) 버튼 수정         # 콜론 없음 → FAIL
```

## 설정 파일

- `commitlint.config.js` — 형식 강제 (husky commit-msg 훅)
- `.husky/commit-msg` — commitlint 실행 훅
