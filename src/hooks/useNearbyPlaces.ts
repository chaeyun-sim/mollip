import { useEffect, useState } from 'react';

import { searchNaverLocal, type NaverLocalItem } from '@/src/api/naver';
import { distanceKm, formatDistance } from '@/src/utils/mapUtils';

const RADIUS_STEPS_KM = [5, 10, 15];

export interface NearbyPlace {
  id: string;
  name: string;
  distance: string;
  address: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

interface RatedPlace extends NearbyPlace {
  _km: number;
}

function toRatedPlace(
  item: NaverLocalItem,
  userLat: number,
  userLon: number,
  prefix: string,
  index: number,
): RatedPlace {
  const lat = Number(item.mapy) / 10_000_000;
  const lon = Number(item.mapx) / 10_000_000;
  const km = distanceKm(userLat, userLon, lat, lon);

  return {
    _km: km,
    id: `${prefix}-${index}`,
    name: item.title.replace(/<[^>]+>/g, ''),
    distance: formatDistance(km),
    address: item.roadAddress || item.address,
    imageUrl: '',
    latitude: lat,
    longitude: lon,
  };
}

/** 반경 단계적 확장: 5km → 10km → 15km, 각 단계에서 limit개 채워지면 중단 */
function pickWithinRadius(candidates: RatedPlace[], limit: number): NearbyPlace[] {
  for (const radius of RADIUS_STEPS_KM) {
    const hits = candidates.filter((p) => p._km <= radius).slice(0, limit);
    if (hits.length > 0) {
      return hits.map(({ _km: _, ...rest }) => rest);
    }
  }
  // 모든 반경에서 없으면 가장 가까운 것 최대 limit개
  return candidates
    .sort((a, b) => a._km - b._km)
    .slice(0, limit)
    .map(({ _km: _, ...rest }) => rest);
}

export interface NearbyPlaces {
  cafes: NearbyPlace[];
  attractions: NearbyPlace[];
}

export function useNearbyPlaces(location: { latitude: number; longitude: number } | null): {
  data: NearbyPlaces;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<NearbyPlaces>({ cafes: [], attractions: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!location) return;

    const { latitude, longitude } = location;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const loc = { latitude, longitude };
    // Naver 지역검색 display 최대 5
    // allSettled: 한 쿼리가 실패해도 나머지 결과는 살림
    Promise.allSettled([
      searchNaverLocal('카페', 5, loc),
      searchNaverLocal('관광명소', 5, loc),
    ])
      .then(([cafeResult, attrResult]) => {
        if (cancelled) return;
        console.log('[nearby] cafe:', cafeResult.status, cafeResult.status === 'rejected' ? String(cafeResult.reason) : cafeResult.value.length + '개');
        console.log('[nearby] attr:', attrResult.status, attrResult.status === 'rejected' ? String(attrResult.reason) : attrResult.value.length + '개');
        const cafeItems = cafeResult.status === 'fulfilled' ? cafeResult.value : [];
        const attrItems = attrResult.status === 'fulfilled' ? attrResult.value : [];
        const cafeRated = cafeItems.map((item, i) =>
          toRatedPlace(item, latitude, longitude, 'cafe', i),
        );
        const attrRated = attrItems.map((item, i) =>
          toRatedPlace(item, latitude, longitude, 'attr', i),
        );
        setData({
          cafes: pickWithinRadius(cafeRated, 3),
          attractions: pickWithinRadius(attrRated, 3),
        });
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
