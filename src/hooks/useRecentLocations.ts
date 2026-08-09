import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { RouteEndpoint } from '@/src/hooks/useDirections';

export interface RecentLocation {
  name: string;
  subtitle?: string;
  coord: { latitude: number; longitude: number };
}

const STORAGE_KEY = 'recent_locations_v1';
const MAX_COUNT = 6;

function toKey(loc: RecentLocation) {
  return `${loc.coord.latitude.toFixed(5)},${loc.coord.longitude.toFixed(5)}`;
}

export function useRecentLocations() {
  const [recents, setRecents] = useState<RecentLocation[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecents(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const addRecent = useCallback(
    (endpoint: RouteEndpoint, subtitle?: string) => {
      const next: RecentLocation = {
        name: endpoint.name,
        subtitle,
        coord: endpoint.coord,
      };
      setRecents((prev) => {
        const key = toKey(next);
        const filtered = prev.filter((r) => toKey(r) !== key);
        const updated = [next, ...filtered].slice(0, MAX_COUNT);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    [],
  );

  return { recents, addRecent };
}
