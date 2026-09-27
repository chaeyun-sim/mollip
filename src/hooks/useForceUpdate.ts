import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/src/utils/supabase';

interface ForceUpdateState {
	blocked: boolean;
	storeUrl: string | null;
}

const compareVersions = (a: string, b: string): number => {
	const partsA = a.split('.').map(Number);
	const partsB = b.split('.').map(Number);
	const length = Math.max(partsA.length, partsB.length);

	for (let i = 0; i < length; i++) {
		const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
		if (diff !== 0) return diff;
	}
	return 0;
};

/**
 * 앱 시작 시 현재 버전이 Supabase에 등록된 최소 버전보다 낮으면 업데이트를 강제한다.
 * 조회 실패 시에는 앱을 막지 않는다(fail-open) — 네트워크 오류로 정상 사용자를 차단하면 안 된다.
 */
export function useForceUpdate(): ForceUpdateState {
	const [state, setState] = useState<ForceUpdateState>({ blocked: false, storeUrl: null });

	useEffect(() => {
		const checkMinVersion = async () => {
			const platform = Platform.OS === 'ios' ? 'ios' : 'android';
			const currentVersion = Constants.expoConfig?.version;
			if (!currentVersion) return;

			const { data, error } = await supabase
				.from('app_min_version')
				.select('min_version, store_url')
				.eq('platform', platform)
				.maybeSingle();

			if (error || !data) return;

			if (compareVersions(currentVersion, data.min_version) < 0) {
				setState({ blocked: true, storeUrl: data.store_url });
			}
		};

		void checkMinVersion();
	}, []);

	return state;
}
