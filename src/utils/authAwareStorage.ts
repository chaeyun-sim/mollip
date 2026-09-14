import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

import { useAuthStore } from '@/src/store/authStore';

// 로그인 상태에서는 DB가 단일 소스이므로 AsyncStorage 읽기/쓰기를 건너뛴다.
// 비로그인(게스트) 상태에서만 로컬에 저장해 오프라인 사용을 지원한다.
const hasSession = (): boolean => {
	try {
		return Boolean(useAuthStore.getState().session);
	} catch {
		return false;
	}
};

export const createAuthAwareStorage = (): StateStorage => {
	return {
		getItem: (name) => {
			if (hasSession()) return null;
			return AsyncStorage.getItem(name);
		},
		setItem: (name, value) => {
			if (hasSession()) {
				return AsyncStorage.removeItem(name);
			}
			return AsyncStorage.setItem(name, value);
		},
		removeItem: (name) => AsyncStorage.removeItem(name),
	};
};
