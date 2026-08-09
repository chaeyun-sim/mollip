# E2E 테스트 (Maestro)

mollip 앱의 E2E 테스트는 [Maestro](https://maestro.mobile.dev/)를 사용합니다.

## 사전 요구사항

| 항목 | 버전 |
|---|---|
| Maestro CLI | 1.39.x 이상 |
| Xcode | 16.x 이상 |
| iOS 시뮬레이터 | iPhone 16 / iOS 18 |
| Node.js | 20 LTS 이상 |

앱이 iOS 시뮬레이터에서 **이미 실행 중**이어야 합니다. Maestro는 시뮬레이터를 직접 부팅하지 않습니다.

## 설치

```bash
brew install mobile-dev-inc/tap/maestro
```

설치 확인:

```bash
maestro --version
```

## 실행

### 전체 테스트 (순차 실행)

```bash
npm run e2e
```

`e2e/` 디렉토리의 모든 `.yaml` 파일을 파일명 순서대로 실행합니다.

### 단일 테스트

```bash
npm run e2e:single -- e2e/01-tab-navigation.yaml
```

`--` 뒤에 파일 경로를 지정합니다.

## 테스트 파일 목록

| 파일 | 내용 |
|---|---|
| `01-tab-navigation.yaml` | 하단 탭 5개 이동 확인 |
| `02-search-flow.yaml` | 검색 탭 → 검색어 입력 → 결과 확인 |
| `03-exhibition-detail.yaml` | 홈 → 전시 카드 탭 → 상세 화면 진입 |

## 스크린샷

테스트 실행 중 `e2e/screenshots/` 에 PNG 파일이 저장됩니다.  
이 디렉토리는 `.gitignore`에 등록되어 있어 커밋에 포함되지 않습니다.

## 트러블슈팅

### `maestro: command not found`

Maestro CLI가 설치되지 않았습니다. **설치** 섹션을 참고하세요.

### `No connected devices found` / `No booted simulator`

iOS 시뮬레이터가 실행되지 않았습니다.

```bash
# 시뮬레이터 목록 확인
xcrun simctl list devices booted

# 특정 시뮬레이터 부팅
xcrun simctl boot "iPhone 16"

# 앱 빌드 및 실행
npx expo run:ios
```

### 테스트가 엉뚱한 요소를 탭함

앱 로딩이 느릴 경우 YAML 파일에 `waitForAnimationToEnd` 또는 `assertVisible` 단계를 추가하세요.

### `Connection refused` (Metro 서버 오류)

```bash
npx expo start --dev-client
```

Metro 서버를 먼저 실행한 뒤 테스트를 돌려야 합니다.
