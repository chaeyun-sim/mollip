import { useEffect, useState } from 'react';

import { searchNaverLocal, type NaverLocalItem } from '@/src/api/naver';
import { distanceKm, formatDistance } from '@/src/utils/mapUtils';

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'cafe' | 'restaurant';
  distance: string;
  address: string;
  imageUrl: string;
}

function classifyCategory(category: string): NearbyPlace['category'] {
  if (category.includes('카페') || category.includes('커피')) return 'cafe';
  return 'restaurant';
}

function mapNaverItemToPlace(
  item: NaverLocalItem,
  userLat: number,
  userLon: number,
  index: number,
): NearbyPlace {
  const lat = Number(item.mapy) / 10_000_000;
  const lon = Number(item.mapx) / 10_000_000;
  const km = distanceKm(userLat, userLon, lat, lon);

  return {
    id: String(index),
    name: item.title.replace(/<[^>]+>/g, ''),
    category: classifyCategory(item.category),
    distance: formatDistance(km),
    address: item.roadAddress || item.address,
    imageUrl: '',
  };
}

export function useNearbyPlaces(location: { latitude: number; longitude: number } | null): {
  data: NearbyPlace[];
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!location) return;

    const { latitude, longitude } = location;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    // 카페·음식점 각각 조회 후 합산 (OR 문법 미지원)
    const loc = { latitude, longitude };
    Promise.all([
      searchNaverLocal('카페', 4, loc),
      searchNaverLocal('음식점', 4, loc),
    ])
      .then(([cafes, restaurants]) => {
        if (cancelled) return;
        const all = [...cafes, ...restaurants];
        setData(all.map((item, i) => mapNaverItemToPlace(item, latitude, longitude, i)));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setData([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude]);

  return { data, isLoading, error };
}
