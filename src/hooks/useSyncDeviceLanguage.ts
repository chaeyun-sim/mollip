import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncDeviceLanguage } from '@/src/i18n';

export function useSyncDeviceLanguage() {
	useEffect(() => {
		syncDeviceLanguage();
		const subscription = AppState.addEventListener('change', (state) => {
			if (state === 'active') syncDeviceLanguage();
		});
		return () => subscription.remove();
	}, []);
}
