# mollip Design System

몰립의 색, 글꼴, 그림자, 간격을 정하는 문서. 컴포넌트 작성 방식은 [component-convention.md](rules/component-convention.md)를 따른다.

> **적용 상태 — 2026-10-10:** 새 팔레트를 `src/constants/colors.ts`와 `tailwind.config.js`에 반영하고 기존 퍼플·민트 브랜드 토큰 사용처를 이관했다. 사용자 시각 피드백에 따라 기본 배경과 톤 표면은 참고 이미지보다 더 밝고 중립적인 색으로 조정했다. 외부 브랜드색, 작품 이미지, 도메인 전용 색은 별도로 관리한다.

## 1. Color

### 1.1 방향

몰립은 작품과 전시 포스터가 화면의 가장 풍부한 색이 되도록 한다. 흰색에 가까운 중립 배경과 진한 글자로 읽는 영역을 안정시키고, **Deep Plum 한 색으로 핵심 행동과 선택 상태에 초점을 준다.** 파스텔은 정보 위계가 아닌 작은 장식에 사용한다.

1. 한 화면에서 가장 강한 UI 강조색은 Deep Plum 하나다. 여러 색의 버튼을 나란히 두지 않는다.
2. 작품 이미지 주변에는 넓은 밝은 여백을 둔다. 색 면적을 늘리고 싶을 때는 먼저 카드나 섹션의 연한 배경을 쓴다.
3. 색만으로 선택·성공·오류를 전달하지 않는다. 아이콘, 글자, 테두리 또는 상태 문구를 함께 둔다.
4. 외부 브랜드 고유색, 작품 이미지, 지도 노선색은 이 팔레트로 재도색하지 않는다.

### 1.2 기본 팔레트

아래 이름은 참고 이미지의 색 이름이다. 코드에서는 역할에 맞는 토큰명을 사용한다.

| 역할               | 이름               | Hex       | 코드 토큰                                  | 사용                                      |
| ------------------ | ------------------ | --------- | ------------------------------------------ | ----------------------------------------- |
| 기본 배경          | Bianco 기반 조정색 | `#FAFAF8` | `canvas` / `bg-light` / `gray100`          | 홈·탐색·다이어리의 캔버스                 |
| 기본 글자          | Kimber             | `#2D2D23` | `ink` / `gray900`                          | 제목, 본문, 주요 아이콘                   |
| 브랜드 중심색      | Deep Plum          | `#5F1D3E` | `brand`                                    | 주요 CTA, 활성 탭, 선택 상태, 링크·포커스 |
| 다크 화면 브랜드색 | Light Plum         | `#E3A9C7` | `brand-on-dark`                            | 어두운 표면 위의 브랜드 강조              |
| 기본 카드          | White              | `#FFFFFF` | `white`                                    | 읽는 콘텐츠와 입력 필드의 표면            |
| 연한 톤 표면       | Soft neutral       | `#F3F3F0` | `surface-neutral` / `bg-tonal` / `gray200` | 검색창·작은 안내 영역                     |
| 따뜻한 표면        | Blanket            | `#F2E0CF` | `blanket`                                  | 비어 있는 카드와 한정된 색 면             |
| 경계·보조 표면     | Mushroom           | `#D4C7B4` | `mushroom` / `divider`                     | 구분선, 면적이 작은 톤 구분               |
| 편집 강조          | Autumn Fern        | `#854628` | `editorial`                                | 날짜·섹션 번호·인용 등 제한된 요소        |
| 보조 장식          | Oak                | `#B48954` | `oak`                                      | 작은 그래픽, 일러스트 세부 요소           |
| 보조 장식          | Khaki Moss         | `#7C7458` | `moss`                                     | 자연 소재를 표현하는 작은 그래픽          |

**Deep Plum이 주요 행동의 유일한 색이다.** Autumn Fern·Oak·Khaki Moss는 별도의 CTA 색이 아니다. 브라운 계열을 큰 버튼이나 활성 탭에 섞지 않는다.

### 1.3 장식용 파스텔

두 번째 참고 이미지의 파스텔은 작은 배지, 빈 상태 일러스트, 온보딩의 한정된 장면에 사용한다. **한 화면에는 한 계열만** 고른다. 전시 포스터가 많이 보이는 목록에서는 파스텔 배경을 반복하지 않는다.

| 이름         | Hex       | 권장 용도                                 |
| ------------ | --------- | ----------------------------------------- |
| French Tips  | `#FFD6EB` | `pastel-pink` · 작은 감성 배지·일러스트   |
| Very Buttery | `#FFF5B4` | `pastel-yellow` · 작은 안내·하이라이트    |
| Cloudy Latte | `#CAE4EF` | `pastel-blue` · 빈 상태·보조 일러스트     |
| Matcha Coded | `#939E86` | `pastel-green` · 자연 소재의 장식 면      |
| Soft Peach   | `#FFA873` | `pastel-peach` · 특별한 일러스트의 포인트 |

파스텔 위에 글자가 필요하면 Kimber를 우선 사용한다. 파스텔 자체를 본문 글자색이나 아이콘의 유일한 상태 신호로 쓰지 않는다. 작은 배지의 글자색도 실제 배경과 대비를 확인한다.

### 1.4 화면 요소별 사용 규칙

| 요소                 | 색 조합                                          | 추가 규칙                                                                      |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| 화면 배경            | Bianco                                           | 기본값. 작품 이미지의 색을 살리는 여백으로 사용                                |
| 본문·제목            | Kimber / Bianco                                  | 보조 글자는 크기·굵기와 기존 회색 단계로 구분하되 대비 검증 필요               |
| 주요 버튼            | Deep Plum 배경 + White 글자                      | 화면의 가장 중요한 행동 하나에 사용                                            |
| 보조 버튼            | White 또는 Bianco 배경 + Deep Plum 글자·테두리   | 주요 버튼과 같은 시각적 무게로 만들지 않음                                     |
| 활성 탭·선택 항목    | Deep Plum 아이콘·글자, 필요하면 연한 브랜드 배경 | 선택 아이콘 모양·굵기·체크 등 비색상 신호를 함께 사용                          |
| 카드·입력 필드       | White 또는 Soft neutral                          | 내용이 많은 카드는 White, 짧은 안내는 Soft neutral. Blanket은 장식용 면에 제한 |
| 마이페이지 계정 카드 | Deep Plum 배경 + White 글자                      | 첫 계정 카드 한 곳에 집중, 보조 글자도 충분한 대비 유지                        |
| 마이페이지 설정 카드 | White 배경 + 중립색 얇은 테두리                  | 밝은 캔버스와 경계를 만들고 그룹 제목으로 묶음 구분                            |
| 구분선               | Mushroom 계열의 얇은 선                          | 카드의 모든 면을 진한 선으로 둘러싸지 않음                                     |
| 포커스               | Deep Plum 테두리 + 두께 변화 또는 캐럿           | 포커스 여부가 색 변화만으로 결정되지 않게 함                                   |
| 에러·성공            | 전용 상태색 + 문구·아이콘                        | 브랜드 장식색을 상태색 대신 쓰지 않음                                          |
| 다크 화면            | `bg-dark` + `on-dark`, 브랜드 강조는 Light Plum  | Light Plum 면 위 글자는 Kimber 사용                                            |

에러·성공·disabled 색, 다크 화면, 지도·노선·도메인 전용 색은 이번 팔레트만으로 확정하지 않는다. 코드 이관 시 기존 의미를 유지하면서 각 조합을 검증한다. 외부 로그인 버튼의 브랜드 색도 유지한다.

### 1.5 대비 기준

WCAG 상대휘도 공식으로 계산한 대표 조합이다. 수치는 반올림한 정적 계산값이며 실제 컴포넌트에서는 글자 크기, 투명도, 이미지 오버레이까지 확인한다.

| 조합                                     |    대비 | 판정·용도                    |
| ---------------------------------------- | ------: | ---------------------------- |
| Kimber 글자 / 조정된 Bianco 배경         | 13.30:1 | 본문 사용 가능               |
| White 글자 / Deep Plum 배경              | 12.13:1 | 주요 버튼 사용 가능          |
| Deep Plum 글자 / 조정된 Bianco 배경      | 11.60:1 | 링크·활성 탭 사용 가능       |
| Kimber 글자 / Mushroom 배경              |  8.36:1 | 보조 카드 사용 가능          |
| Autumn Fern 글자 / 조정된 Bianco 배경    |  6.92:1 | 제한된 편집 요소에 사용 가능 |
| Khaki Moss 글자 / 조정된 Bianco 배경     |  4.47:1 | 일반 본문 글자에는 사용 금지 |
| White 글자 / Matcha Coded 배경           |  2.81:1 | 글자 조합으로 사용 금지      |
| Kimber 글자 / Light Plum 배경            |  7.12:1 | 다크 화면 버튼 사용 가능     |
| Light Plum 아이콘 / 다크 배경(`#171412`) |  9.40:1 | 다크 화면 강조 사용 가능     |

본문 글자는 최소 4.5:1, 큰 글자는 최소 3:1, 필수 UI 표시와 포커스 경계는 최소 3:1을 목표로 한다. 반투명 배경·사진 위 글자는 실제 합성 결과로 다시 계산한다. 밝은 파스텔 위에는 White 글자를 기본값으로 두지 않는다.

### 1.6 코드 정본과 별칭

앱의 컬러 값 정본은 [`src/constants/colors.ts`](../src/constants/colors.ts) 한 곳이다. [`tailwind.config.js`](../tailwind.config.js)의 `theme.extend.colors`가 이 객체를 가져온다. NativeWind의 `bg-*`·`text-*`·`border-*`와 런타임 JS 색상 prop이 같은 값을 참조한다.

`primary`·`primary-dark`·`accent` 브랜드 토큰은 제거하고, 밝은 화면은 `brand`, 어두운 화면은 `brand-on-dark`를 사용한다. `gray100`·`gray900`, `bg-light`·`bg-tonal`은 기존 컴포넌트와 호환되는 역할 별칭으로 남는다. 가장 밝은 두 회색 단계는 중립적인 흰색 계열에 맞게 조정됐다.

`secondary`는 기존 역색 버튼과 텍스트 호출부의 호환 별칭이며 Kimber와 같은 `#2D2D23`이다. `description`, 상태색, `bg-dark`는 역할을 유지한다.

### 1.7 유지·검증 규칙

1. 새 색은 재사용 가능한 UI 역할이 있을 때 `colors.ts`에 추가한다. 일회성 도메인 색은 해당 도메인에 둔다.
2. 밝은 화면의 새 CTA는 `brand` + `white`, 다크 화면은 `brand-on-dark` + `ink` 조합을 기본으로 한다.
3. 실제 화면의 일반·선택·disabled·로딩·오류·포커스 상태를 캡처하고, 텍스트·아이콘 대비와 터치 동작을 확인한다.
4. `primary`·`primary-dark`·`accent`를 신규 코드에 다시 도입하지 않는다.

### 1.8 도메인 전용 색

[`archivePalette.ts`](../src/constants/archivePalette.ts)의 통계·썸네일 색, [`ticketColor.ts`](../src/utils/ticketColor.ts)의 방문 티켓 색, [`routeColors.ts`](../src/utils/routeColors.ts)의 교통 노선 색은 별도 역할을 갖는다. 특히 노선 색은 외부 데이터의 의미를 전달하므로 브랜드 팔레트에 맞추어 변경하지 않는다. 재사용 가능한 UI 역할색만 전역 토큰으로 올린다.

## 2. Typography

글꼴의 코드 정본은 `tailwind.config.js`의 `theme.extend.fontFamily`다. 폰트는 `className`으로 지정한다.

| 글꼴                | className                               | 용도                             |
| ------------------- | --------------------------------------- | -------------------------------- |
| Pretendard Regular  | `font-pretendard-regular` / `font-sans` | 본문                             |
| Pretendard Light    | `font-pretendard-light`                 | 큰 보조 문구                     |
| Pretendard Medium   | `font-pretendard-medium`                | 강조 본문                        |
| Pretendard SemiBold | `font-pretendard-semibold`              | 버튼·목록 제목                   |
| Pretendard Bold     | `font-pretendard-bold`                  | 강한 강조                        |
| Hahmlet Regular     | `font-hahmlet`                          | 에디토리얼 제목                  |
| Hahmlet SemiBold    | `font-hahmlet-semibold`                 | 강조 제목                        |
| Hahmlet Bold        | `font-hahmlet-bold`                     | 표지형 제목                      |
| Nanum Pen Script    | `font-nanum-pen`                        | 손글씨 표현이 필요한 한정된 영역 |

색으로 위계를 만들기 전에 크기·굵기·여백으로 읽는 순서를 만든다. Hahmlet은 큰 제목과 에디토리얼 강조에 쓰고, 긴 본문과 조작 라벨은 Pretendard를 쓴다.

## 3. Shadow

현재 그림자 토큰은 `tailwind.config.js`의 `theme.extend.boxShadow`에 있다.

| 이름              | className                  | 값                                  | 용도              |
| ----------------- | -------------------------- | ----------------------------------- | ----------------- |
| floating          | `shadow-floating`          | `0 6px 14px rgba(45, 45, 35, 0.28)` | 떠 있는 카드·버튼 |
| map-control       | `shadow-map-control`       | `0 2px 8px rgba(0, 0, 0, 0.12)`     | 지도 컨트롤       |
| onboarding-button | `shadow-onboarding-button` | `0 4px 12px rgba(0, 0, 0.08)`       | 온보딩 버튼       |
| onboarding-card   | `shadow-onboarding-card`   | `0 8px 20px rgba(0, 0, 0, 0.12)`    | 온보딩 카드       |
| chip              | `shadow-chip`              | `0 1px 4px rgba(0, 0, 0, 0.12)`     | 칩·배지           |

새 팔레트를 코드에 적용할 때 그림자의 색도 화면 배경과 함께 확인한다. 그림자만으로 터치 가능 여부를 표현하지 않는다.

## 4. Spacing / Radius

프로젝트 전용 시맨틱 간격·모서리 반경 토큰은 없다. Tailwind 기본 스케일을 사용하고, 예외값은 [component-convention.md](rules/component-convention.md)의 `className` 규칙에 따라 기록한다. 넓은 여백은 작품과 주요 행동을 구분하는 디자인 요소로 취급한다.

## 5. 변경 관리

- 색을 추가하기 전에 §1.2~1.4에 이미 같은 역할이 있는지 확인한다. 화면 하나의 장식색은 전역 토큰으로 승격하지 않는다.
- 구현 시 `src/constants/colors.ts`를 수정한다. `tailwind.config.js`가 이를 정상적으로 가져오는지 확인하고, 런타임 JS 색상 prop과 NativeWind className을 함께 검증한다.
- 새 버튼·텍스트·상태 조합은 대비 수치를 기록하고, 실제 화면에서 시각·인터랙션 검증을 거친다.
- 이 문서의 디자인 기준과 앱 구현값을 함께 갱신한다. 컬러 토큰 변경 시 밝은 화면과 다크 화면 모두 확인한다.
