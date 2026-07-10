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
    map/           # 지도 도메인 컴포넌트
    layout/        # Screen, ScreenHeader 등 레이아웃 기반
  hooks/           # 커스텀 훅 (useMapFilter, useMapCamera 등)
  store/           # Zustand 스토어
  utils/           # 순수 함수 유틸
  data/            # 정적 데이터
```

한 파일에 한 컴포넌트. 여러 컴포넌트를 한 파일에 묶지 않는다
(단, 컴포넌트 전용 내부 서브컴포넌트는 같은 파일 허용).

---

## 10. Import 순서

1. 외부 라이브러리 (react, react-native, expo-*)
2. 내부 절대 경로 (`@/src/...`) — 컴포넌트 → 훅 → 스토어 → 유틸 → 타입 순

```tsx
import { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ExhibitionCard } from '@/src/components/map/ExhibitionCard';
import { useMapFilter } from '@/src/hooks/useMapFilter';
import { useMapStore } from '@/src/store/mapStore';
import { computeClusters } from '@/src/utils/mapUtils';
import type { VenueGroup } from '@/src/data/venues';
```
