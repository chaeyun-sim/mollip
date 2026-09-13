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

| 값 유형 | className 예시 |
|---|---|
| 고정 픽셀 크기 | `w-[82px]` `h-[124px]` `w-7` |
| rgba 색상 (배경) | `bg-[rgba(61,43,26,0.06)]` `bg-[rgba(0,0,0,0.35)]` |
| rgba 색상 (텍스트) | `text-[rgba(61,43,26,0.42)]` |
| rgba 색상 (테두리) | `border-[rgba(61,43,26,0.2)]` |
| 불투명도 슬래시 | `bg-white/15` `text-black/70` |
| hex 색상 | `bg-[#FAF7F2]` `text-[#3D2B1A]` |
| 테두리 두께 | `border-[0.5px]` `border-l-[1.5px]` |
| 레이아웃 | `flex-row` `items-center` `absolute` `overflow-hidden` |
| 폰트 (tailwind.config.js 등록됨) | `font-hahmlet-bold` `font-pretendard-medium` |
| 폰트 크기·행간·자간 | `text-[13.5px]` `leading-[19px]` `tracking-[1.2px]` |
| 라운드 | `rounded-tl-[14px]` `rounded-xl` |
| 패딩·마진 | `px-[11px]` `pt-3` `mb-0.5` `mt-px` |
| z-index | `z-10` `z-20` |

### style={{}}만 허용되는 예외

| 상황 | 이유 |
|---|---|
| JS 변수/상수 참조 (`width: STUB_WIDTH`) | Tailwind는 런타임 변수 불가 |
| 계산값 (`top: -(NOTCH / 2)`, `borderRadius: NOTCH / 2`) | 동적 계산 |
| 동적 색상 (`backgroundColor: stubColor`) | 런타임 결정값 |
| 그림자 (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`) | Tailwind 미지원 |
| `transform: [{ rotate: '90deg' }]` | RN transform 배열 문법 |
| Pressable pressed 상태 opacity (`opacity: pressed ? 0.85 : 1`) | 동적 boolean |
| `insets.top + 16` 등 SafeArea 계산값 | 동적 계산 |

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

| 역할 | 위치 |
|---|---|
| 데이터 패칭 / 상태 관리 | `src/store/`, `src/hooks/` |
| 비즈니스 로직 / 계산 | `src/utils/` |
| UI 렌더링 | `src/components/` |
| 화면 조립 (컴포넌트 + 훅 연결) | `app/` |

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

## 6. 이벤트 핸들러 Props 네이밍

이벤트 핸들러 prop은 `on` 접두사를 사용한다.
컴포넌트 내부 핸들러 변수는 `handle` 접두사를 사용한다.

```tsx
// Props (외부)
interface CardProps {
  onPress: (id: string) => void;
  onLayout: (height: number) => void;
}

// 내부 핸들러
const handlePress = () => onPress(id);
```

---

## 7. 성능 — useCallback / useMemo

- 자식 컴포넌트에 props로 전달하는 함수: `useCallback`으로 감싼다.
- 렌더마다 재계산되는 파생 값: `useMemo`로 감싼다.
- 단순 원시값(string, number, boolean)은 메모이제이션 불필요.

```tsx
// Good
const handleMarkerPress = useCallback((name: string, lat: number, lon: number) => {
  selectVenue(name);
  mapRef.current?.animateCameraTo({ latitude: lat, longitude: lon, zoom: 14 });
}, [selectVenue]);

const clusters = useMemo(
  () => computeClusters(mapVenues, displayZoom),
  [mapVenues, displayZoom],
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
    common/        # 도메인 무관 공통 컴포넌트 (SearchBar, DatePickerModal 등)
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

### 9.3 페이지 전용 private 서브컴포넌트 (좁은 예외)

아래를 **모두** 만족할 때만 `app/` 파일 안에 둘 수 있다.

- 해당 화면에서만 사용
- **약 50줄 이하**
- 재사용·테스트 분리 계획 없음

그 외(전시 상세 `[id].tsx` 수준의 다중 UI)는 **`src/components/{도메인}/`** 로 분리한다.

### 9.4 분리 신호

- 파일 **100줄 초과** + UI 블록이 2개 이상 → 컴포넌트 추출 검토
- 같은 UI가 **다른 화면**에서도 쓰일 가능성 → 즉시 `src/components/`로

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
6. 렌더 함수        (renderXxx — JSX를 반환하는 함수)
7. return           (컴포넌트 JSX)
```

```tsx
export default function ExploreScreen() {
  // 1. 플랫폼 공식 훅
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 2. useState
  const [query, setQuery] = useState('');
  // 3. 커스텀 훅
  const { items, status } = useExploreScreenData();

  // 4. 상수
  const carousel = resolveCarousel();
  // 5. 일반 함수
  const openExhibition = (id: string) => router.push(`/(explore)/${id}`);
  function resolveCarousel() { ... }
  // 6. 렌더 함수
  function renderContent() { ... }

  // 7. return
  return (...);
}
```

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
{hasItems ? <List /> : <Empty />}

// Bad — 부정으로 시작
{!hasItems ? <Empty /> : <List />}
```

### 11.2 삼항 연산자 중첩 금지

삼항 연산자는 **2중 이상 중첩하지 않는다.** 분기가 3개 이상이면 렌더 함수(`renderXxx`)로 분리한다.

```tsx
// Bad — 2중 중첩 삼항
{isLoading
  ? <Spinner />
  : hasError
    ? <ErrorView />
    : <List />}

// Good — 렌더 함수로 분리
function renderContent() {
  if (isLoading) return <Spinner />;
  if (hasError) return <ErrorView />;
  return <List />;
}

{renderContent()}
```

### 11.3 null 분기

null을 렌더링하는 분기는 `&&` 연산자를 사용한다. 삼항 연산자의 `: null` 분기는 쓰지 않는다.

```tsx
// Good
{featured && <FeaturedExhibitionHero {...featured} />}

// Bad — `: null` 분기는 불필요하게 길다
{featured ? <FeaturedExhibitionHero {...featured} /> : null}
```

단, 두 분기 모두 무언가를 렌더링하는 경우에는 삼항 연산자를 사용한다.

```tsx
// Good — 두 분기 모두 렌더링
{isPersonalized ? '추천 전시 · 당신의 취향' : '추천 전시'}
```

### 11.4 if 블록 간격

함수 내에 `if` 블록이 여러 개면 블록 사이에 빈 줄을 넣는다.

```tsx
// Good
function renderContent() {
  if (status === 'loading') {
    return <Spinner />;
  }

  if (status === 'error') {
    return <ErrorView />;
  }

  return <List />;
}

// Bad — 블록 사이 빈 줄 없음
function renderContent() {
  if (status === 'loading') {
    return <Spinner />;
  }
  if (status === 'error') {
    return <ErrorView />;
  }
  return <List />;
}
```

JSX 안에서 즉시 실행 함수(IIFE)를 사용하지 않는다. 로직이 필요하면 컴포넌트 내부 렌더 함수(`renderXxx`)나 별도 컴포넌트로 분리한다.

```tsx
// Bad — JSX 안에서 IIFE
{(() => {
  const entries = buildEntries(data);
  if (entries.length === 0) return null;
  return entries.map((e) => <Row key={e.label} {...e} />);
})()}

// Good — 렌더 함수로 분리 (컴포넌트 내부, 섹션 10 선언 순서 6번 위치)
function renderEntries() {
  const entries = buildEntries(data);
  if (entries.length === 0) return null;
  return entries.map((e) => <Row key={e.label} {...e} />);
}

{renderEntries()}
```

---

## 12. Import 순서

외부 라이브러리 블록과 내부 경로 블록, 두 블록만 구분한다. 빈 줄은 **블록 사이에만** 넣는다. 블록 내부에는 빈 줄을 넣지 않는다.

1. 외부 라이브러리 (react, react-native, expo-*, 서드파티) — 블록 내 빈 줄 없음
2. *(빈 줄 1개)*
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
