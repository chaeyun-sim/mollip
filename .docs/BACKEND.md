# mollip 백엔드 아키텍처

Supabase Edge Functions 인벤토리 및 클라이언트-백엔드 연동 방식. 함수 개수·미문서화 여부 같은 인벤토리 스냅샷은 `.docs/STATUS.md` §6이 정본이며, 이 문서는 각 함수의 입출력과 호출 흐름을 설명한다.

## 1. 원칙 — 클라이언트는 외부 AI/서드파티 API를 직접 호출하지 않는다

모든 AI(Anthropic) 호출, TTS(ElevenLabs) 호출, 지도/장소 검색(Kakao·Naver·ODsay) 호출은 반드시 `supabase/functions/`의 Edge Function을 거친다. API 키(`ANTHROPIC_KEY`, `ELEVENLABS_KEY`, `KAKAO_API_KEY`, `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`, `ODSAY_API_KEY`)는 전부 Supabase 서버 사이드 시크릿으로만 존재하고 앱 번들에는 절대 포함되지 않는다(`EXPO_PUBLIC_` 접두사를 쓰지 않음 — `.env.example` 주석에 명시).

예외는 §2.6의 문화·미술 데이터 API(문화포털·Met·AIC·Wikidata·Europeana)다. 전부 무료 공개 API거나(Met/AIC/Wikidata는 키 자체가 없음) 클라이언트 노출이 문제되지 않는 공개 서비스키(문화포털·Europeana)라 Edge Function 프록시 없이 클라이언트에서 직접 호출한다.

클라이언트 → Edge Function 호출은 전부 `src/utils/api.ts`의 `edgeFunctionUrl(name)` 헬퍼를 거쳐 `${EXPO_PUBLIC_SUPABASE_URL}/functions/v1/{name}`로 fetch한다. 인증이 필요한 함수는 `authHeaders()`로 `Authorization: Bearer <accessToken>`을 붙인다(토큰은 `src/store/authStore.ts`의 `getAccessTokenForApi()`에서 가져온다).

## 2. 함수별 입출력

### 2.1 Anthropic 기반 (텍스트/이미지 생성)

| 함수                    | 입력                                                                              | 처리                                                                                                                                                                          | 출력                                                             |
| ----------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `extract-text`          | `{ imageBase64, mediaType }`                                                      | Anthropic Messages API(`claude-opus-4-6`)에 이미지 + "텍스트만 추출" 프롬프트 전달                                                                                            | 추출된 텍스트 JSON (non-streaming)                               |
| `stream-description`    | `{ mode: 'image' \| 'manual', imageBase64?, mediaType?, systemPrompt?, prompt? }` | mode에 따라 이미지+시스템프롬프트 또는 텍스트 프롬프트로 Anthropic에 `stream: true` 요청                                                                                      | Anthropic SSE 응답을 그대로 body로 relay                         |
| `stream-chat`           | `{ systemPrompt, messages }`                                                      | `claude-haiku-4-5-20251001`에 도슨트 시스템 프롬프트 + 대화 히스토리로 `stream: true` 요청                                                                                    | SSE relay                                                        |
| `generate-route`        | `{ systemPrompt?, prompt }`                                                       | `claude-haiku-4-5-20251001`에 단일 프롬프트로 `stream: true` 요청 (도보/대중교통 경로 설명 생성 추정 — 커밋 `bf20826` 몰입모드 개편과 연관)                                   | SSE relay                                                        |
| `generate-artist-intro` | `{ artist, exhibitionTitle }` (요청자 인증 필요 — `_shared/requireUser.ts`)       | `claude-opus-4-6`에 "작가 소개" 전용 시스템 프롬프트로 단발 요청. 낭독 40~~55초(약 220~~280자) 분량 고정, 확인 안 된 사실은 "알려진 바로는" 식으로 구분하도록 프롬프트에 명시 | 텍스트 JSON (non-streaming — 캐시 테이블에 그대로 저장하기 위함) |

다섯 함수 모두 `ANTHROPIC_KEY` 미설정 시 500을 반환하고, Anthropic 응답이 실패하면 원본 상태 코드를 그대로 전달한다.

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

| 함수                   | 입력                                                                                                                                                                            | 처리                                                                                                                                                                                                                                              | 출력                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `image-proxy`          | 쿼리 파라미터 `?url=`                                                                                                                                                           | 대상 URL이 사설 IP 대역(`10.*`, `192.168.*`, `172.16-31.*`, localhost 등)이면 차단(SSRF 방지). 브라우저 User-Agent를 위장해 핫링크 방지가 걸린 이미지 호스트(예: `myartmuseum.co.kr`)를 우회하고, iOS ATS가 막는 평문 HTTP 이미지를 HTTPS로 relay | 이미지 스트림           |
| `kakao-local-search`   | `{ query, size? }`                                                                                                                                                              | Kakao 키워드 장소 검색 API 프록시 (`KAKAO_API_KEY`는 서버 전용)                                                                                                                                                                                   | Kakao 응답 relay        |
| `naver-local-search`   | `{ query, display? }`                                                                                                                                                           | NAVER API HUB(NCP) 지역 검색 프록시. 2026-07-31부로 구 openapi.naver.com에서 이관되어 엔드포인트·인증 헤더가 다름(주석에 명시). 좌표 기반 정렬 미지원이라 거리순 정렬은 클라이언트에서 처리                                                       | `{ items: [...] }`      |
| `send-recommendations` | 없음 (cron 전용, `pg_cron '30 2 * * 1'` = 매주 월요일 11:30 KST, jobname `mollip-recommendations`. 명령에 남은 "최근 3일 내 발송 시 건너뜀" 조건은 주 1회 실행이라 걸리지 않음) | `push_token`·`preferred_genres` 있는 프로필 조회 → 진행 중 전시에서 장르 매칭 top 3 선정 → Expo Push API로 배치(100건 단위) 발송. 인증은 `CRON_SECRET`(§2.8)                                                                                      | 없음 (side-effect only) |
| `sync-exhibitions`     | 없음 (cron 전용, `pg_cron '20 18 * * *'` = 매일 03:20 KST)                                                                                                                      | 문화포털·예술의전당·KCISA 공개 API에서 전시를 가져와 `exhibitions`에 동기화. `CRON_SECRET` 인증. API별 키는 Edge Function Secrets에 설정                                                                                                          | `{ ok, synced }`        |
| `odsay-route`          | `{ start: {latitude,longitude}, end: {latitude,longitude}, searchMethod: '1'\|'2' }`                                                                                            | ODsay Lab 멀티모달 길찾기(`maasRP`) 프록시. `ODSAY_API_KEY` 미설정 시 500                                                                                                                                                                         | ODsay 원본 응답 relay   |

`image-proxy`는 `src/utils/imageProxy.ts`의 `proxiedImageUrl()`이 감싸며, 위키 이미지 등 외부 이미지 URL을 화면에 표시하기 전에 항상 이 프록시를 거치도록 강제한다. `kakao-local-search`/`naver-local-search`는 각각 `src/api/kakao.ts`/`src/api/naver.ts`에서 호출되고, `generate-route`(`streamRoute`)는 `src/components/explore/RouteSheet.tsx`에서 호출된다. `odsay-route`는 `src/api/tmap.ts`(이름은 tmap이지만 실제 구현은 ODsay로 교체됨)가 `supabase.functions.invoke('odsay-route', ...)`로 호출하고, `src/hooks/useDirections.ts`가 이를 감싼다.

### 2.6 외부 문화·미술 데이터 (클라이언트 직접 호출)

§1 예외 항목 — Edge Function을 거치지 않고 `src/api/`에서 바로 fetch한다.

| 모듈                   | 소스                                    | 키 필요 여부                | 용도                                                                       |
| ---------------------- | --------------------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `src/api/culture.ts`   | 문화체육관광부 문화포털(공공데이터포털) | `EXPO_PUBLIC_DATA_KEY`      | 전시 동기화 스크립트가 아니라 앱 런타임에서도 기간/지역별 전시 조회에 사용 |
| `src/api/met.ts`       | Met Museum Open Access API              | 없음 (완전 공개)            | 작품 검색                                                                  |
| `src/api/aic.ts`       | Art Institute of Chicago API            | 없음 (완전 공개)            | 작품 검색                                                                  |
| `src/api/wikidata.ts`  | Wikidata SPARQL                         | 없음 (완전 공개)            | 작품 검색                                                                  |
| `src/api/europeana.ts` | Europeana                               | `EXPO_PUBLIC_EUROPEANA_SPI` | 작품 검색 — 키 없으면 빈 배열 반환(무경고 폴백)                            |

`src/api/artworkSearch.ts`의 `searchArtworks()`가 Wikidata·Met·AIC·Europeana 네 곳을 `Promise.allSettled`로 동시 검색해 하나의 결과 리스트로 합친다(제목+작가 기준 중복 제거). 한쪽 소스가 느리거나 실패해도 나머지는 그대로 보여준다.

### 2.7 공유 유틸리티

`supabase/functions/_shared/cors.ts` — 모든 함수가 공통으로 import하는 CORS 헤더 정의. 함수가 아니라 헬퍼 코드이므로 배포 대상이 아니다. `_shared/requireUser.ts` — 요청자 세션 검증 헬퍼(`generate-artist-intro`가 사용).

### 2.8 푸시 알림 큐 · cron 인증

지연 푸시는 `notification_jobs` 테이블(DB 큐)에 넣고, `process-notification-jobs`가 매분 `send_at`이 지난 `pending` 작업을 처리한다. 발송은 `_shared/pushNotify.ts`의 `sendAndLog`(Expo Push API + `notification_logs` 기록)를 쓴다.

| 종류           | 큐에 들어가는 시점                                         | 발송 시각        |
| -------------- | ---------------------------------------------------------- | ---------------- |
| `notice`       | `notices` INSERT (DB 트리거 `enqueue_notice_notification`) | 1분 뒤           |
| `venue_follow` | `exhibitions` INSERT, `museum_id`가 있을 때                | 10분 뒤          |
| `visit_review` | `visits.visit_ended_at` 저장 (앱이 관람 종료 순간 저장)    | `visit_ended_at` |

`dedupe_key`가 unique라 같은 이벤트가 재시도돼도 작업은 하나다. cron이 매분 돌기 때문에 실제 도착은 지연 시간 + 최대 1분이다. 한 번 `failed`가 된 작업은 자동 재시도되지 않는다(`status`를 `pending`으로 되돌려야 함).

**cron 인증 — `CRON_SECRET`.** cron으로 호출하는 함수(`process-notification-jobs`, `send-bookmark-deadline-reminders`, `send-recommendations`)는 `Authorization: Bearer <CRON_SECRET>`와 정확히 일치할 때만 실행된다. service role 키는 cron에 쓰지 않는다.

- 함수 쪽: `supabase secrets set CRON_SECRET=<값>`
- cron 쪽: Vault에 같은 값을 `cron_secret`으로 저장하고, `net.http_post` 헤더가 `vault.decrypted_secrets`의 `cron_secret`을 읽는다. 값은 `openssl rand -hex 32`로 만든다.
- 두 값이 한 글자라도 다르면 함수가 `{"error":"Unauthorized"}`(401)를 반환한다.
- **배포는 반드시 `--no-verify-jwt`로 한다.** 빼면 `cron_secret`이 JWT 형식이 아니라서 게이트웨이가 함수 실행 전에 `Invalid JWT`(401)로 거절한다.

  ```bash
  supabase functions deploy process-notification-jobs --no-verify-jwt
  supabase functions deploy send-bookmark-deadline-reminders --no-verify-jwt
  supabase functions deploy send-recommendations --no-verify-jwt
  supabase functions deploy sync-exhibitions --no-verify-jwt
  ```

전시 동기화에는 Edge Function Secrets `PUBLIC_DATA_KEY`, `SAC_API_KEY`, `KOREAN_CONTEMPORARY_MUSEUM_API_KEY`가 추가로 필요하다(값은 로컬 `.env`의 `EXPO_` 접두사 키와 같다). Vault에는 기존 `cron_secret` 외에 `supabase_url`(예: `https://<project-ref>.supabase.co`)을 저장한다. 스케줄 마이그레이션은 이 두 Vault 값을 읽어 함수를 호출한다. 동기화 결과는 Supabase Dashboard의 Edge Function Logs와 `data_sync_meta`에서 확인한다.

cron의 `succeeded`는 요청을 던졌다는 뜻일 뿐이다. 실제 응답은 `net._http_response`의 `status_code`와 `content`로 확인한다.

**푸시 토큰 주의.** Expo 푸시 토큰은 계정이 아니라 기기+앱에 묶인다. 한 요청에 서로 다른 Expo 프로젝트(`owner`/`slug`)의 토큰이 섞이면 Expo가 `PUSH_TOO_MANY_EXPERIENCE_IDS`(400)로 배치 전체를 거절한다. 예전 빌드(`@bysimune/aaa`)가 저장한 오래된 토큰이 원인이 된 적이 있다. 한 기기에서 계정을 바꾸면 두 계정이 같은 토큰을 갖게 되어 알림이 중복으로 가므로, `profiles.push_token`은 마지막으로 저장한 계정만 갖도록 DB에서 정리한다.

## 3. 환경 변수

| 변수                                                           | 위치                                                  | 용도                                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`                                     | 클라이언트(`.env`)                                    | Edge Function 호출 base URL 조합 (`src/utils/api.ts`, `src/utils/imageProxy.ts`)                              |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`                                | 클라이언트(`.env`)                                    | Supabase 클라이언트 초기화(인증 등)                                                                           |
| `ANTHROPIC_KEY`                                                | Supabase Edge Function Secrets                        | `extract-text`/`stream-description`/`stream-chat`/`generate-route`/`generate-artist-intro`에서 Anthropic 호출 |
| `ELEVENLABS_KEY`                                               | Supabase Edge Function Secrets                        | `voices`/`tts`에서 ElevenLabs 호출                                                                            |
| `CRON_SECRET`                                                  | Supabase Edge Function Secrets + Vault(`cron_secret`) | cron 호출 함수의 인증값 — §2.8. 두 곳의 값이 같아야 함                                                        |
| `KAKAO_API_KEY` (REST API 키)                                  | Supabase Edge Function Secrets — `kakao-local-search` | 서버 전용, `EXPO_PUBLIC_` 접두사 금지                                                                         |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`                      | Supabase Edge Function Secrets — `naver-local-search` | 서버 전용, `EXPO_PUBLIC_` 접두사 금지                                                                         |
| `ODSAY_API_KEY`                                                | Supabase Edge Function Secrets — `odsay-route`        | 도보/대중교통 길찾기. 예전엔 `EXPO_PUBLIC_ODSAY_API_KEY`로 클라이언트에 있었으나 Edge Function으로 이전됨     |
| `EXPO_PUBLIC_JUSO_CONFIRM_KEY`                                 | 클라이언트(`.env`)                                    | 도로명주소 검색                                                                                               |
| `EXPO_PUBLIC_DATA_KEY`                                         | 클라이언트(`.env`)                                    | 문화포털(공공데이터포털) 서비스키 — `src/api/culture.ts`                                                      |
| `EXPO_PUBLIC_EUROPEANA_SPI`                                    | 클라이언트(`.env`)                                    | Europeana 작품 검색 — `src/api/europeana.ts`, 없으면 빈 배열로 폴백                                           |
| `EXPO_KOREAN_CONTEMPORARY_MUSEUM_API_KEY` / `EXPO_SAC_API_KEY` | 로컬 `.env`                                           | 기존 동기화 스크립트 — 앱 런타임에서는 사용하지 않음. `sync-exhibitions`는 `EXPO_` 없는 이름의 Secrets를 사용 |

Met/AIC/Wikidata는 키가 필요 없다 — §2.6 참고. `EXPO_PUBLIC_KAKAO_JS_KEY`는 카카오톡 공유가 네이티브 SDK(`@react-native-kakao/share`)로 바뀌면서 코드 어디에서도 더 이상 참조되지 않는다(`.env.example`엔 남아있을 수 있으니 정리 시 같이 제거 대상).

값 설정 방법은 `.env.example`을 `.env`로 복사해 채우는 것이며, 실행 명령은 `README.md`를 참고한다.
