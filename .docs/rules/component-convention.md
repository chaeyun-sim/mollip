# Component Convention Guide

이 프로젝트에서 React Native 컴포넌트를 작성할 때 따라야 할 규칙 모음.

---

## 1. Props 타입 선언

컴포넌트 Props는 반드시 `interface`를 사용하고, 이름은 `{컴포넌트명}Props` 패턴을 따른다.

```tsx
// Good
interface ExhibitionCardProps {
  ex: Exhibition;
  onPress: (id: string) => void;
}

export function ExhibitionCard({ ex, onPress }: ExhibitionCardProps) { ... }
```

```tsx
// Bad — type alias 사용, 이름 불일치
type Props = { ... };
```

단, 파일 내부에서만 쓰이는 하위 타입(유니언, 유틸리티 타입)은 `type`을 사용해도 무방하다.

---

## 2. Styling — className vs style

**원칙: NativeWind 임의값(arbitrary value) 문법으로 표현 가능하면 반드시 `className`으로 쓴다. `style={{}}`은 아래 예외만 허용.**

### className으로 써야 하는 것들 (임의값 포함)

| 값 유형                          | className 예시                                         |
| -------------------------------- | ------------------------------------------------------ |
| 고정 픽셀 크기                   | `w-[82px]` `h-[124px]` `w-7`                           |
| rgba 색상 (배경)                 | `bg-[rgba(61,43,26,0.06)]` `bg-[rgba(0,0,0,0.35)]`     |
| rgba 색상 (텍스트)               | `text-[rgba(61,43,26,0.42)]`                           |
| rgba 색상 (테두리)               | `border-[rgba(61,43,26,0.2)]`                          |
| 불투명도 슬래시                  | `bg-white/15` `text-black/70`                          |
| hex 색상                         | `bg-[#FAF7F2]` `text-[#3D2B1A]`                        |
| 테두리 두께                      | `border-[0.5px]` `border-l-[1.5px]`                    |
| 레이아웃                         | `flex-row` `items-center` `absolute` `overflow-hidden` |
| 폰트 (tailwind.config.js 등록됨) | `font-hahmlet-bold` `font-pretendard-medium`           |
| 폰트 크기·행간·자간              | `text-[13.5px]` `leading-[19px]` `tracking-[1.2px]`    |
| 라운드                           | `rounded-tl-[14px]` `rounded-xl`                       |
| 패딩·마진                        | `px-[11px]` `pt-3` `mb-0.5` `mt-px`                    |
| z-index                          | `z-10` `z-20`                                          |

### style={{}}만 허용되는 예외

| 상황                                                                                 | 이유                        |
| ------------------------------------------------------------------------------------ | --------------------------- |
| JS 변수/상수 참조 (`width: STUB_WIDTH`)                                              | Tailwind는 런타임 변수 불가 |
| 계산값 (`top: -(NOTCH / 2)`, `borderRadius: NOTCH / 2`)                              | 동적 계산                   |
| 동적 색상 (`backgroundColor: stubColor`)                                             | 런타임 결정값               |
| 그림자 (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`) | Tailwind 미지원             |
| `transform: [{ rotate: '90deg' }]`                                                   | RN transform 배열 문법      |
| Pressable pressed 상태 opacity (`opacity: pressed ? 0.85 : 1`)                       | 동적 boolean                |
| `insets.top + 16` 등 SafeArea 계산값                                                 | 동적 계산                   |

```tsx
// ✅ Good — rgba도 className으로
<View className='bg-[rgba(61,43,26,0.06)] w-[82px] h-full' />
<Text className='text-[rgba(61,43,26,0.42)] font-pretendard-regular text-[9px]' />

// ❌ Bad — className으로 쓸 수 있는 값을 style에 작성
<View style={{ backgroundColor: 'rgba(61,43,26,0.06)', width: 82 }} />
<Text style={{ color: 'rgba(61,43,26,0.42)', fontSize: 9 }} />

// ✅ Good — 변수/계산값은 style
<View
  className='rounded-xl items-center'
  style={{ width: STUB_WIDTH, height: CARD_HEIGHT, backgroundColor: stubColor }}
/>
```

### 폰트 — 반드시 className

`tailwind.config.js`에 모든 폰트가 등록되어 있으므로 `style={{ fontFamily }}` 절대 금지.

```tsx
// ✅ Good
<Text className='font-hahmlet-bold text-[16px]'>제목</Text>
<Text className='font-pretendard-regular text-[9px]'>설명</Text>

// ❌ Bad
<Text style={{ fontFamily: 'Hahmlet_700Bold', fontSize: 16 }}>제목</Text>
```

등록된 폰트: `font-pretendard-light` / `font-pretendard-regular` / `font-pretendard-medium` / `font-pretendard-semibold` / `font-pretendard-bold` / `font-hahmlet` / `font-hahmlet-semibold` / `font-hahmlet-bold`

---

## 3. 조건부 className — cn 사용

`className`에서 조건부 클래스가 필요할 때는 반드시 `cn` 함수(`@/src/lib/cn`)를 사용한다.
템플릿 리터럴로 조건부 클래스를 인라인으로 이어 붙이지 않는다.

```tsx
import { cn } from '@/src/lib/cn';

// Good
<View className={cn('rounded-2xl px-4 py-3', isUser ? 'bg-blue-500' : 'bg-[#1C1917]')} />

// Bad — 삼항 인라인 문자열
<View className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-blue-500' : 'bg-[#1C1917]'}`} />
```

boolean 조건이 여러 개일 때는 객체 형식을 활용한다.

```tsx
<Text
	className={cn('text-sm', {
		'text-white': active,
		'text-black/70': !active,
		'font-pretendard-bold': important,
	})}
/>
```

---

## 4. SOLID — 단일 책임 원칙 (SRP)

하나의 컴포넌트는 하나의 역할만 담당한다.
렌더링 로직, 비즈니스 로직, 데이터 페칭을 한 파일에 섞지 않는다.

**분리 기준:**

| 역할                           | 위치                       |
| ------------------------------ | -------------------------- |
| 데이터 패칭 / 상태 관리        | `src/store/`, `src/hooks/` |
| 비즈니스 로직 / 계산           | `src/utils/`               |
| UI 렌더링                      | `src/components/`          |
| 화면 조립 (컴포넌트 + 훅 연결) | `app/`                     |

```tsx
// Good — VenueSheet는 데이터를 props로 받고 렌더링만 담당
export function VenueSheet({ venue, filterDate, onGoToExhibition }: VenueSheetProps) {
  const activeExhibitions = useMemo(() => ..., [venue, filterDate]);
  return <BottomSheetScrollView>...</BottomSheetScrollView>;
}

// Bad — 컴포넌트 내부에서 직접 API 호출
export function VenueSheet({ venueId }: { venueId: string }) {
  const [venue, setVenue] = useState(null);
  useEffect(() => { fetch(`/venues/${venueId}`).then(...) }, []);
  ...
}
```

컴포넌트가 100줄을 넘기 시작하거나 `useEffect`가 2개 이상이면 분리를 고려한다.

---

## 5. 컴포넌트 Export

- `src/components/` 하위 컴포넌트: **named export**
- `app/` 하위 화면 컴포넌트: **default export** (expo-router 요구사항)

```tsx
// src/components/map/FilterChips.tsx
export function FilterChips(...) { ... }          // named

// app/(tabs)/map.tsx
export default function MapScreen() { ... }       // default
```

---

## 6. 함수 선언 스타일과 네이밍

### 6.1 컴포넌트는 `function`, 그 외 함수는 화살표 함수

- **컴포넌트**: `function ComponentName() { ... }` 선언식을 그대로 쓴다.
- **컴포넌트가 아닌 모든 함수**(이벤트 핸들러, 계산 함수, 유틸 등): `const fn = () => { ... }` 화살표 함수로 선언한다. `function fn() { ... }` 선언식을 쓰지 않는다.

```tsx
// Good — 컴포넌트는 function
export function ExhibitionCard({ ex, onPress }: ExhibitionCardProps) {
	// Good — 컴포넌트가 아닌 함수는 화살표 함수
	const resolveCarousel = () => { ... };
	const onPress = useCallback(() => { ... }, []);

	return (...);
}

// Bad — 일반 함수를 function 선언식으로 작성
function resolveCarousel() { ... }
```

### 6.2 이벤트 핸들러 네이밍 — `on~` vs `handle~`

기준은 **소유권**(컴포넌트 내부인가, 외부 인터페이스인가)이다. 내부 로직의 줄 수·분기(`if`)·비동기(`async`/`await`) 유무는 이름 결정에 영향을 주지 않는다.

- **`on~`**: 컴포넌트가 **외부(부모)로부터 전달받는** 이벤트 props에만 쓴다. "이 이벤트가 발생했을 때(on)"라는 타이밍을 뜻한다.
- **`handle~`**: 컴포넌트 **내부에서 이벤트를 실제로 처리하는** 지역 함수에 쓴다. 내부 로직이 직선 흐름이든 분기·비동기가 있든 상관없이 `handle~`이다. "그 이벤트를 어떻게 처리(handle)하겠다"라는 행동을 뜻한다.

```tsx
// 1. Props 인터페이스 정의 시에는 무조건 on~
interface CardProps {
	onPress: (id: string) => void;
	onLayout: (height: number) => void;
}

function Card({ onPress, onLayout }: CardProps) {
	// 2. 컴포넌트 내부에서 정의하는 핸들러 함수는 무조건 handle~
	// 내부 로직이 직선 흐름이든, 분기·비동기가 있든 상관없이 handle 접두사를 쓴다.
	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		updateStore({ manualTitle: artwork.label });
		router.replace('/description');
	};

	// 3. JSX에 바인딩할 때는 <Component onEvent={handleEvent} /> 형태를 유지한다.
	return <Pressable onPress={handlePress} />;
}
```

`on이 보이면 props, handle이 보이면 내부 함수`로 코드를 훑을 때 바로 식별된다는 게 핵심이다.

**이름 겹침 처리**: 자식이 던져준 이벤트를 가공 없이 그대로 부모에게 토스하거나 한 문장만 실행하는 경우, 아래 중 하나를 쓴다.

1. **인라인 화살표 함수** (권장) — 불필요한 지역 변수를 만들지 않는다.
   ```tsx
   return <Button onPress={() => onDelete(id)} />;
   ```
2. **구체적인 행동 동사** — `handle~` 대신 함수가 하는 일 자체를 동사로 표현한다.
   ```tsx
   const submitData = () => { ... };
   return <Button onPress={submitData} />;
   ```
3. **prop 이름 그대로 재사용** (지양) — 부모에게 받은 `onDelete`와 내부 변수 `onDelete`가 겹치면 가독성이 떨어지므로, 가급적 내부 함수는 `handleDelete`로 명명한다.

기존 코드는 건드릴 때마다 이 규칙에 맞춰 점진적으로 정리한다 — 이 규칙 하나만으로 전체 코드베이스를 일괄 리네임하지 않는다.

---

## 7. 성능 — useCallback / useMemo

- 자식 컴포넌트에 props로 전달하는 함수: `useCallback`으로 감싼다.
- 렌더마다 재계산되는 파생 값: `useMemo`로 감싼다.
- 단순 원시값(string, number, boolean)은 메모이제이션 불필요.

```tsx
// Good
const handleMarkerPress = useCallback(
	(name: string, lat: number, lon: number) => {
		selectVenue(name);
		mapRef.current?.animateCameraTo({ latitude: lat, longitude: lon, zoom: 14 });
	},
	[selectVenue],
);

const clusters = useMemo(() => computeClusters(mapVenues, displayZoom), [mapVenues, displayZoom]);
```

### 7.1 Zustand selector — 1개면 그대로, 2개 이상이면 useShallow

같은 zustand 스토어에서 selector를 **1개만** 쓸 때는 그대로 쓴다.

```tsx
// Good — selector 1개
const session = useAuthStore((s) => s.session);
```

같은 스토어에서 selector를 **2개 이상** 쓸 때는 `zustand/react/shallow`의 `useShallow`로 한 번에 묶는다. 여러 줄로 나눠 쓰면 코드는 늘어나지만 리렌더 동작은 동일하고, 그렇다고 `useShallow` 없이 객체 하나로 묶으면(`useStore((s) => ({ a: s.a, b: s.b }))`) selector가 매번 새 객체를 반환해 스토어의 무관한 필드가 바뀌어도 리렌더된다. `useShallow`는 얕은 비교로 이 문제를 막으면서 여러 줄을 한 번에 정리한다.

```tsx
// Bad — selector 2개 이상을 따로따로
const statuses = useOfflineDownloadStore((s) => s.statuses);
const startDownload = useOfflineDownloadStore((s) => s.startDownload);
const deleteDownload = useOfflineDownloadStore((s) => s.deleteDownload);

// Bad — useShallow 없이 객체로 묶기 (무관한 필드 변경에도 리렌더됨)
const { statuses, startDownload, deleteDownload } = useOfflineDownloadStore((s) => ({
	statuses: s.statuses,
	startDownload: s.startDownload,
	deleteDownload: s.deleteDownload,
}));

// Good — useShallow로 묶기
import { useShallow } from 'zustand/react/shallow';

const { statuses, startDownload, deleteDownload } = useOfflineDownloadStore(
	useShallow((s) => ({
		statuses: s.statuses,
		startDownload: s.startDownload,
		deleteDownload: s.deleteDownload,
	})),
);
```

---

## 8. 접근성

터치 가능한 모든 요소에 `accessibilityLabel`과 `accessibilityRole`을 추가한다.

```tsx
<Pressable
  onPress={handlePress}
  accessibilityLabel='전시 상세 보기'
  accessibilityRole='button'
>
```

아이콘만 있는 버튼은 반드시 `accessibilityLabel`로 의도를 설명한다.

---

## 9. 파일 구조

```
src/
  components/
    common/        # 도메인 무관 순수 UI 프리미티브 (Button, Chip, TextField 등). §13 참고
    explore/       # 탐색·전시 상세
    settings/      # 설정 화면 UI 조각
    auth/          # 로그인 등 인증 UI
    onboarding/    # 온보딩 UI
    map/           # 지도 도메인 컴포넌트
    layout/        # Screen, ScreenHeader 등 레이아웃·컴파운드
  hooks/           # 커스텀 훅 (useMapFilter, useMapCamera 등)
  store/           # Zustand 스토어
  utils/           # 순수 함수 유틸
  data/            # 정적 데이터
app/               # expo-router 화면 — default export 1개(스크린)만
```

### 9.1 기본 원칙

- **`src/components/`**: 파일당 **named export 컴포넌트 1개**.
- **`app/*.tsx`**: **default export 스크린 1개**. 역할은 훅·스토어와 `src/components` **조립**만.

### 9.2 컴파운드 컴포넌트 (예외)

`Screen`, `ScreenHeader`처럼 **하나의 API로 묶인 slot 패턴**은 한 파일에 여러 서브컴포넌트를 둔다.

```tsx
<Screen.Header>
	<Screen.Header.Logo />
	<Screen.Header.Right>...</Screen.Header.Right>
</Screen.Header>
```

### 9.3 인라인이 기본 — 미리 빼지 않는다

한 곳에서만 쓰이는 JSX는 **그 자리에 인라인**한다. 메인 컴포넌트 위에 private 서브컴포넌트를 미리 만들지 않는다.

분리하는 경우:

- 같은 UI가 **2곳 이상**에서 반복된다
- 인라인하면 부모가 읽히지 않을 정도로 복잡하다 (대략 80줄 넘는 독립 블록)

그때는 파일로 빼서 named export 한다. `function Foo()`를 같은 파일 윗줄에 두는 방식은 쓰지 않는다.

이미 있는 카드·빈 상태·섹션 컴포넌트를 먼저 찾고, 비슷하면 그걸 쓴다. 페이지 하나 추가한다고 동형 컴포넌트를 새로 만들지 않는다.

### 9.4 `common/` 추출

같은 순수 UI가 **3번 이상** 반복되면 `src/components/common/` 추출을 검토한다 (§13). 1~2화면이고 도메인 맥락이 있으면 `src/components/{도메인}/` 에 둔다.

---

## 10. 컴포넌트 내부 선언 순서

컴포넌트 함수 내부는 아래 순서로 작성한다. 훅 블록과 나머지 블록 사이에 빈 줄 1개를 넣는다.

```
1. 플랫폼 공식 훅   (useRouter, useNavigation, useSafeAreaInsets 등)
2. useState
3. 커스텀 훅        (프로젝트에서 만든 훅)
   ↕ 빈 줄
4. 상수             (const foo = ...)
5. 일반 함수        (순수 계산, 이벤트 핸들러 등)
6. return           (컴포넌트 JSX)
```

`renderXxx()`처럼 JSX만 반환하는 함수는 만들지 않는다. 분기는 return 안 삼항/&& 이거나, 컴포넌트 본문의 early return으로 끝낸다.

```tsx
export default function ExploreScreen() {
  // 1. 플랫폼 공식 훅
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 2. useState
  const [query, setQuery] = useState('');
  // 3. 커스텀 훅
  const { items, status } = useExploreScreenData();

  // 5. 일반 함수 — function 선언식이 아닌 화살표 함수로 (§6.1)
  const openExhibition = (id: string) => router.push(`/(explore)/${id}`);
  const resolveCarousel = () => { ... };
  // 4. 상수 — 화살표 함수는 호이스팅되지 않으므로, 그 결과를 쓰는 상수는 함수 선언 다음에 온다
  const carousel = resolveCarousel();

  // 6. return
  return (...);
}
```

화살표 함수(`const fn = () => {}`)는 `function` 선언식과 달리 호이스팅되지 않는다. "4. 상수"가 "5. 일반 함수"의 결과를 바로 사용하면, 그 상수는 해당 함수 **다음 줄**에 둔다 — 목록의 4→5 순서를 절대적인 줄 순서로 강제하지 않는다.

---

## 11. 조건부 렌더링

### 11.1 긍정 조건 우선

`if-else` 또는 삼항 연산자는 **긍정 조건을 먼저** 작성한다. 부정 연산자(`!`)로 시작하는 분기는 조건을 뒤집어 긍정으로 만든다.

```tsx
// Good
if (isLoggedIn) {
	return <Dashboard />;
} else {
	return <Login />;
}

// Bad — 부정으로 시작
if (!isLoggedIn) {
	return <Login />;
} else {
	return <Dashboard />;
}
```

JSX 삼항도 동일하게 적용한다.

```tsx
// Good
{
	hasItems ? <List /> : <Empty />;
}

// Bad — 부정으로 시작
{
	!hasItems ? <Empty /> : <List />;
}
```

### 11.2 삼항은 2갈래만 — `renderXxx` 금지

삼항 연산자는 **한 번만** 쓴다. 2중 중첩 금지.

- 갈래가 **2개**면 JSX 안에서 삼항을 그대로 쓴다.
- 갈래가 **3개 이상**이면 그 컴포넌트에서 `if` early return 한다. `renderContent()` 같은 함수로 JSX를 빼지 않는다.

```tsx
// Good — 2갈래는 삼항
{
	tab === 'audio' ? <BookmarkedAudioList /> : <BookmarkedExhibitionList />;
}

// Bad — 2갈래인데 render 함수
function renderTab() {
	if (tab === 'audio') return <BookmarkedAudioList />;
	return <BookmarkedExhibitionList />;
}

// Bad — 2중 중첩 삼항
{
	isLoading ? <Spinner /> : hasError ? <ErrorView /> : <List />;
}

// Good — 3갈래 이상은 컴포넌트 early return
if (isLoading) return <Spinner />;

if (hasError) return <ErrorView />;

return <List />;
```

### 11.3 null 분기

null을 렌더링하는 분기는 `&&` 연산자를 사용한다. 삼항 연산자의 `: null` 분기는 쓰지 않는다.

```tsx
// Good
{
	featured && <FeaturedExhibitionHero {...featured} />;
}

// Bad — `: null` 분기는 불필요하게 길다
{
	featured ? <FeaturedExhibitionHero {...featured} /> : null;
}
```

단, 두 분기 모두 무언가를 렌더링하는 경우에는 삼항 연산자를 사용한다.

```tsx
// Good — 두 분기 모두 렌더링
{
	isPersonalized ? '추천 전시 · 당신의 취향' : '추천 전시';
}
```

### 11.4 if 블록 간격

컴포넌트 본문에 `if` early return이 여러 개면 블록 사이에 빈 줄을 넣는다.

```tsx
// Good
if (status === 'loading') {
	return <Spinner />;
}

if (status === 'error') {
	return <ErrorView />;
}

return <List />;

// Bad — 블록 사이 빈 줄 없음
if (status === 'loading') {
	return <Spinner />;
}
if (status === 'error') {
	return <ErrorView />;
}
return <List />;
```

JSX 안에서 즉시 실행 함수(IIFE)와 `renderXxx()`를 쓰지 않는다. 값은 미리 계산하고, JSX에서는 삼항/`&&`/`.map`만 쓴다.

```tsx
// Bad — JSX 안에서 IIFE
{
	(() => {
		const entries = buildEntries(data);
		if (entries.length === 0) return null;
		return entries.map((e) => <Row key={e.label} {...e} />);
	})();
}

// Good — 계산은 위, 그릴 때는 삼항
const entries = buildEntries(data);

return entries.length > 0 ? entries.map((e) => <Row key={e.label} {...e} />) : null;
```

---

## 12. Import 순서

외부 라이브러리 블록과 내부 경로 블록, 두 블록만 구분한다. 빈 줄은 **블록 사이에만** 넣는다. 블록 내부에는 빈 줄을 넣지 않는다.

1. 외부 라이브러리 (react, react-native, expo-*, 서드파티) — 블록 내 빈 줄 없음
2. _(빈 줄 1개)_
3. 내부 절대 경로 (`@/src/...`) — 컴포넌트 → 훅 → 스토어 → 유틸 → 타입 순, 블록 내 빈 줄 없음

```tsx
import { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitionCard } from '@/src/components/map/ExhibitionCard';
import { useMapFilter } from '@/src/hooks/useMapFilter';
import { useMapStore } from '@/src/store/mapStore';
import { computeClusters } from '@/src/utils/mapUtils';
import type { VenueGroup } from '@/src/data/venues';
```

---

## 13. 공통 UI (`src/components/common/`)

도메인 컴포넌트와 순수 UI를 엄격히 구분한다. `common/`에는 **비즈니스 로직이 없는 프리미티브**만 둔다.

### 13.1 단일 책임

한 파일·한 컴포넌트는 하나의 역할만 갖는다. CTA·아이콘 버튼·설정 행을 한 옴니 컴포넌트에 묶지 않는다.

| 역할                          | 위치                                                     |
| ----------------------------- | -------------------------------------------------------- |
| 라벨 CTA (solid / ghost)      | `common/Button`                                          |
| 원형·아이콘 전용 버튼         | `common/IconButton`                                      |
| 한 화면의 아이콘+제목+설명 행 | 해당 도메인 (`guide/SourceActionRow` 등). `common/` 금지 |

`Button.Row`, `Button.Icon`처럼 역할이 다른 API를 한 컴포넌트에 붙이지 않는다. 컴파운드(`Screen.Header`)는 **같은 레이아웃 API의 slot**일 때만 허용한다 (§9.2).

### 13.2 추출 기준

아래를 **하나라도** 만족할 때만 `common/` 추출을 검토한다.

1. **3곳 이상**에서 같은 UI가 반복된다
2. 비즈니스 로직과 분리된 **순수 UI**이고, 도메인 맥락 없이 재사용된다

해당하지 않으면 인라인하거나 `src/components/{도메인}/`에 둔다. 1~2회 사용·한 화면 전용은 `common/`에 올리지 않는다.

```tsx
// Good — 순수 토글. 선택 상태만 props로 받는다
<Chip label="무료" active={freeOnly} onPress={onToggleFree} />

// Bad — 관람 확정·위키 검색 등 도메인 로직을 common에 넣음
export function Chip({ exhibitionId, onConfirmVisit }: ChipProps) { ... }
```

### 13.3 variant와 확장

프리미티브는 `variant`(필요하면 `tone`)로 허용된 변형만 열고, 나머지는 **rest + `className`** 으로 넘긴다.

- 인터랙션 루트: `PressableProps` / `TextInputProps` 를 `extends` 하고 `...rest`를 루트에 전달한다
- 스타일 확장: 루트 `className`을 `cn(..., className)`으로 합친다. `style`이 오면 pressed 핸들러와 병합한다
- 새 화면마다 prop을 늘리기보다 `className`으로 간격을 조정한다
- 전체 화면 모달처럼 크롬을 컴포넌트가 소유하면 rest는 생략해도 된다 (`DatePickerModal`)

```tsx
interface ButtonProps extends Omit<PressableProps, 'children' | 'onPress'> {
	children: ReactNode;
	onPress: () => void;
	variant?: 'solid' | 'ghost';
	className?: string;
}
```

허용된 variant 밖에 있는 모양은 새 variant를 추가하기 전에, 그게 정말 같은 역할인지부터 확인한다. 역할이 다르면 파일을 나눈다.

### 13.4 관심사 분리

|                 | `common/`                                      | `src/components/{도메인}/`                   |
| --------------- | ---------------------------------------------- | -------------------------------------------- |
| 하는 일         | 그리기·접근성·기본 인터랙션                    | 도메인 카피, 스토어, API, 화면 전용 레이아웃 |
| 알면 안 되는 것 | 전시·관람·해설·설정 스토어                     | —                                            |
| 상태            | `active`, `disabled`, `loading` 등 표시 상태만 | 방문 확정, 위키 검색, 온보딩 스텝 등         |

훅(`useTextField`)은 입력 프리미티브의 표시 상태만 다룬다. 제출·검증 규칙이 도메인에 묶이면 화면이나 도메인 훅에 둔다.

14. 공통 컴포넌트 및 유틸 분리된

- 해당 컴포넌트나 유틸을 작업하기 전, 비슷하거나 동일한 컴포넌트가 존재하는지 확인한다
- 존재한다면 해당 컴포넌트를 확장시켜 싱글 컴포넌트로 분리한 뒤, 적용한다.
