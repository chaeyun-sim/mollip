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

NativeWind(Tailwind) className을 기본으로 쓰고, Tailwind로 표현할 수 없는 값만 `style` prop에 작성한다.

| 상황 | 사용 |
|---|---|
| Tailwind 유틸리티로 커버되는 값 | `className` |
| rgba 투명도 (예: `rgba(0,0,0,0.35)`) | `style` |
| 픽셀 단위 커스텀 값 (예: `width: 80, height: 100`) | `style` |
| 동적 색상·크기 변수 (예: `backgroundColor: ex.posterColor`) | `style` |
| 그림자 (`shadowColor`, `shadowOpacity` 등) | `style` |
| pressed 상태 opacity | `style` (Pressable style 함수) |

```tsx
// Good
<View
  className='rounded-xl items-center justify-center'
  style={{ width: 80, height: 100, backgroundColor: ex.posterColor }}
/>

// Bad — Tailwind로 가능한 값을 style에 작성
<View style={{ borderRadius: 12, alignItems: 'center' }} />
```

커스텀 폰트는 NativeWind가 처리하지 못하므로 항상 `style`에 작성한다.

```tsx
// Good
<Text style={{ fontFamily: 'Pretendard-SemiBold' }}>...</Text>

// Bad
<Text className='font-pretendard-semibold'>...</Text>  // 동작하지 않음
```

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

삼항 연산자가 `A ? B : C` 기본 형태를 넘어 중첩되면 상수나 함수로 분리한다.

```tsx
// Bad — 중첩 삼항
{status === 'loading'
  ? <Spinner />
  : status === 'error'
    ? <ErrorView />
    : items.length === 0
      ? <EmptyView />
      : <List />}

// Good — 함수로 분리
function renderContent() {
  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorView />;
  if (items.length === 0) return <EmptyView />;
  return <List />;
}

// JSX에서는 호출만
{renderContent()}
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

## 11. Import 순서

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
