# mollip 백엔드 아키텍처

Supabase Edge Functions 인벤토리 및 클라이언트-백엔드 연동 방식. 함수 개수·미문서화 여부 같은 인벤토리 스냅샷은 `.docs/STATUS.md` §6이 정본이며, 이 문서는 각 함수의 입출력과 호출 흐름을 설명한다.

## 1. 원칙 — 클라이언트는 외부 AI/서드파티 API를 직접 호출하지 않는다

모든 AI(Anthropic) 호출, TTS(ElevenLabs) 호출, 지도/장소 검색(Kakao·Naver) 호출은 반드시 `supabase/functions/`의 Edge Function을 거친다. API 키(`ANTHROPIC_KEY`, `ELEVENLABS_KEY`, `KAKAO_API_KEY`, `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`)는 전부 Supabase 서버 사이드 시크릿으로만 존재하고 앱 번들에는 절대 포함되지 않는다(`EXPO_PUBLIC_` 접두사를 쓰지 않음 — `.env.example` 주석에 명시).

클라이언트 → Edge Function 호출은 전부 `src/utils/api.ts`의 `edgeFunctionUrl(name)` 헬퍼를 거쳐 `${EXPO_PUBLIC_SUPABASE_URL}/functions/v1/{name}`로 fetch한다. 인증이 필요한 함수는 `authHeaders()`로 `Authorization: Bearer <accessToken>`을 붙인다(토큰은 `src/store/authStore.ts`의 `getAccessTokenForApi()`에서 가져온다).

## 2. 함수별 입출력

### 2.1 Anthropic 기반 (텍스트/이미지 생성)

| 함수                 | 입력                                                                              | 처리                                                                                                                                        | 출력                                     |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `extract-text`       | `{ imageBase64, mediaType }`                                                      | Anthropic Messages API(`claude-opus-4-6`)에 이미지 + "텍스트만 추출" 프롬프트 전달                                                          | 추출된 텍스트 JSON (non-streaming)       |
| `stream-description` | `{ mode: 'image' \| 'manual', imageBase64?, mediaType?, systemPrompt?, prompt? }` | mode에 따라 이미지+시스템프롬프트 또는 텍스트 프롬프트로 Anthropic에 `stream: true` 요청                                                    | Anthropic SSE 응답을 그대로 body로 relay |
| `stream-chat`        | `{ systemPrompt, messages }`                                                      | `claude-haiku-4-5-20251001`에 도슨트 시스템 프롬프트 + 대화 히스토리로 `stream: true` 요청                                                  | SSE relay                                |
| `generate-route`     | `{ systemPrompt?, prompt }`                                                       | `claude-haiku-4-5-20251001`에 단일 프롬프트로 `stream: true` 요청 (도보/대중교통 경로 설명 생성 추정 — 커밋 `bf20826` 몰입모드 개편과 연관) | SSE relay                                |

네 함수 모두 `ANTHROPIC_KEY` 미설정 시 500을 반환하고, Anthropic 응답이 실패하면 원본 상태 코드를 그대로 전달한다.

### 2.2 SSE 스트리밍 파싱 — 클라이언트 측

`src/utils/api.ts`의 `readSSEStream(res)`가 위 스트리밍 함수들의 공통 파싱 로직이다. `ReadableStream`을 라인 단위로 버퍼링하며 `data: ` 접두사 라인만 취급하고, `[DONE]`을 만나면 종료한다. 각 라인을 JSON 파싱해 `content_block_delta` 타입이면서 `delta.type === 'text_delta'`인 이벤트에서 `delta.text`만 `yield`한다 — 이는 Anthropic Messages API의 표준 SSE 이벤트 포맷을 그대로 따른다. `streamDescriptionFromImage`, `streamDescription`, `streamChat`, `streamRoute` 네 함수가 이 제너레이터를 감싸 각각의 Edge Function을 호출한다.

### 2.3 ElevenLabs 기반 (TTS)

| 함수     | 입력                        | 처리                                                                                                                  | 출력                |
| -------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `voices` | 없음 (GET)                  | ElevenLabs `/v1/voices` 조회 후 `labels.language`가 한국어인 항목만 필터링                                            | `{ voices: [...] }` |
| `tts`    | `{ voiceId, text, speed? }` | ElevenLabs `/v1/text-to-speech/{voiceId}/stream` 호출 (`eleven_turbo_v2_5`, `stability: 0.55` 등 고정 voice_settings) | 오디오 바이너리     |

클라이언트(`fetchTTSBlob`)는 응답 바이너리를 `arrayBuffer()`로 받아 base64로 인코딩해 `data:audio/mpeg;base64,...` data URI로 변환한다 — `src/hooks/useTTS.ts`가 이 URI를 `expo-audio`로 재생하고 `voiceId::voiceSpeed::text` 키로 캐싱한다.

### 2.4 계정

| 함수             | 입력                   | 처리                                                                                                                                                                                 | 출력     |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `delete-account` | `Authorization` 헤더만 | anon 클라이언트로 요청자 세션 검증 후, service role 클라이언트로 `auth.admin.deleteUser` 실행 — 삭제 권한은 반드시 service role로만 수행하고 신원 확인은 별도 anon 클라이언트로 분리 | 204/에러 |

### 2.5 프록시 · 검색

| 함수                   | 입력                                                            | 처리                                                                                                                                                                                                                                              | 출력                    |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `image-proxy`          | 쿼리 파라미터 `?url=`                                           | 대상 URL이 사설 IP 대역(`10.*`, `192.168.*`, `172.16-31.*`, localhost 등)이면 차단(SSRF 방지). 브라우저 User-Agent를 위장해 핫링크 방지가 걸린 이미지 호스트(예: `myartmuseum.co.kr`)를 우회하고, iOS ATS가 막는 평문 HTTP 이미지를 HTTPS로 relay | 이미지 스트림           |
| `kakao-local-search`   | `{ query, size? }`                                              | Kakao 키워드 장소 검색 API 프록시 (`KAKAO_API_KEY`는 서버 전용)                                                                                                                                                                                   | Kakao 응답 relay        |
| `naver-local-search`   | `{ query, display? }`                                           | NAVER API HUB(NCP) 지역 검색 프록시. 2026-07-31부로 구 openapi.naver.com에서 이관되어 엔드포인트·인증 헤더가 다름(주석에 명시). 좌표 기반 정렬 미지원이라 거리순 정렬은 클라이언트에서 처리                                                       | `{ items: [...] }`      |
| `send-recommendations` | 없음 (cron 전용, `pg_cron '0 1 * * 1'` = 매주 월요일 09:00 KST) | `push_token`·`preferred_genres` 있는 프로필 조회 → 진행 중 전시에서 장르 매칭 top 3 선정 → Expo Push API로 배치(100건 단위) 발송                                                                                                                  | 없음 (side-effect only) |

`image-proxy`는 `src/utils/imageProxy.ts`의 `proxiedImageUrl()`이 감싸며, 위키 이미지 등 외부 이미지 URL을 화면에 표시하기 전에 항상 이 프록시를 거치도록 강제한다. `kakao-local-search`/`naver-local-search`는 각각 `src/api/kakao.ts`/`src/api/naver.ts`에서 호출되고, `generate-route`(`streamRoute`)는 `src/components/explore/RouteSheet.tsx`에서 호출된다.

### 2.6 공유 유틸리티

`supabase/functions/_shared/cors.ts` — 모든 함수가 공통으로 import하는 CORS 헤더 정의. 함수가 아니라 헬퍼 코드이므로 배포 대상이 아니다.

## 3. 환경 변수

| 변수                                                           | 위치                                                  | 용도                                                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`                                     | 클라이언트(`.env`)                                    | Edge Function 호출 base URL 조합 (`src/utils/api.ts`, `src/utils/imageProxy.ts`)                            |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`                                | 클라이언트(`.env`)                                    | Supabase 클라이언트 초기화(인증 등)                                                                         |
| `EXPO_PUBLIC_KAKAO_JS_KEY`                                     | 클라이언트(`.env`)                                    | 카카오톡 공유 fallback (JS 키, 공개 가능)                                                                   |
| `ANTHROPIC_KEY`                                                | Supabase Edge Function Secrets                        | `extract-text`/`stream-description`/`stream-chat`/`generate-route`에서 Anthropic 호출                       |
| `ELEVENLABS_KEY`                                               | Supabase Edge Function Secrets                        | `voices`/`tts`에서 ElevenLabs 호출                                                                          |
| `KAKAO_API_KEY` (REST API 키)                                  | Supabase Edge Function Secrets — `kakao-local-search` | 서버 전용, `EXPO_PUBLIC_` 접두사 금지                                                                       |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`                      | Supabase Edge Function Secrets — `naver-local-search` | 서버 전용, `EXPO_PUBLIC_` 접두사 금지                                                                       |
| `EXPO_PUBLIC_ODSAY_API_KEY`                                    | 클라이언트(`.env`)                                    | 도보/대중교통 길찾기(ODsay)                                                                                 |
| `EXPO_PUBLIC_JUSO_CONFIRM_KEY`                                 | 클라이언트(`.env`)                                    | 도로명주소 검색                                                                                             |
| `EXPO_KOREAN_CONTEMPORARY_MUSEUM_API_KEY` / `EXPO_SAC_API_KEY` | 로컬 스크립트 전용                                    | `scripts/sync_kcisa_moca_exhibitions.py`, `scripts/sync_sac_exhibitions.py` — 앱 런타임에서는 사용하지 않음 |

값 설정 방법은 `.env.example`을 `.env`로 복사해 채우는 것이며, 실행 명령은 `README.md`를 참고한다.
