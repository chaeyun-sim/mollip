import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FontSize = 'small' | 'medium' | 'large';
export type VoiceSpeed = 0.7 | 1.0 | 1.25 | 1.5;

export const FONT_SIZE_VALUE: Record<FontSize, number> = {
	small: 15,
	medium: 17,
	large: 20,
};

type SettingsStore = {
	voiceId: string;
	voiceSpeed: VoiceSpeed;
	fontSize: FontSize;
	pushNotificationsEnabled: boolean;
	setVoiceId: (id: string) => void;
	setVoiceSpeed: (speed: VoiceSpeed) => void;
	setFontSize: (size: FontSize) => void;
	setPushNotificationsEnabled: (enabled: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>()(
	persist(
		(set) => ({
			voiceId: 'uyVNoMrnUku1dZyVEXwD',
			voiceSpeed: 1.0,
			fontSize: 'medium',
			pushNotificationsEnabled: true,
			setVoiceId: (voiceId) => set({ voiceId }),
			setVoiceSpeed: (voiceSpeed) => set({ voiceSpeed }),
			setFontSize: (fontSize) => set({ fontSize }),
			setPushNotificationsEnabled: (pushNotificationsEnabled) =>
				set({ pushNotificationsEnabled }),
		}),
		{
			name: 'settings',
			version: 1,
			migrate: (persistedState) => persistedState as SettingsStore,
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (_state, error) => {
				if (error) console.warn('[settingsStore] rehydration failed:', error);
			},
		},
	),
);
