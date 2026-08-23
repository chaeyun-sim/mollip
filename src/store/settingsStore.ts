import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FontSize = 'small' | 'medium' | 'large';
export type VoiceSpeed = 0.7 | 1.0 | 1.25 | 1.5;
export type DescriptionFocus =
	| 'aesthetics'     // 미학 / 형식 분석
	| 'art_history'    // 미술사 · 사조
	| 'artist_life'    // 작가 생애
	| 'social_context' // 사회 · 문화적 맥락
	| 'appreciation'   // 감상 포인트 (감성적)
	| 'technique'      // 재료 · 기법
	| 'symbolism'      // 상징 · 도상학
	| 'viewer_gaze';   // 감상자의 시선

export const FONT_SIZE_VALUE: Record<FontSize, number> = {
	small: 15,
	medium: 17,
	large: 20,
};

export function getEffectiveFontSize(fontSize: FontSize, highContrast: boolean): number {
	return FONT_SIZE_VALUE[fontSize] + (highContrast ? 2 : 0);
}

type SettingsStore = {
	voiceId: string;
	voiceSpeed: VoiceSpeed;
	fontSize: FontSize;
	pushNotificationsEnabled: boolean;
	descriptionFocus: DescriptionFocus[];
	highContrast: boolean;
	setVoiceId: (id: string) => void;
	setVoiceSpeed: (speed: VoiceSpeed) => void;
	setFontSize: (size: FontSize) => void;
	setPushNotificationsEnabled: (enabled: boolean) => void;
	toggleDescriptionFocus: (focus: DescriptionFocus) => void;
	setHighContrast: (enabled: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>()(
	persist(
		(set) => ({
			voiceId: 'uyVNoMrnUku1dZyVEXwD',
			voiceSpeed: 1.0,
			fontSize: 'medium',
			pushNotificationsEnabled: true,
			descriptionFocus: [],
			highContrast: false,
			setVoiceId: (voiceId) => set({ voiceId }),
			setVoiceSpeed: (voiceSpeed) => set({ voiceSpeed }),
			setFontSize: (fontSize) => set({ fontSize }),
			setPushNotificationsEnabled: (pushNotificationsEnabled) =>
				set({ pushNotificationsEnabled }),
			toggleDescriptionFocus: (focus) =>
				set((s) => ({
					descriptionFocus: s.descriptionFocus.includes(focus)
						? s.descriptionFocus.filter((f) => f !== focus)
						: [...s.descriptionFocus, focus],
				})),
			setHighContrast: (highContrast) => set({ highContrast }),
		}),
		{
			name: 'settings',
			version: 2,
			migrate: (persistedState) => ({
				...(persistedState as SettingsStore),
				highContrast: (persistedState as SettingsStore).highContrast ?? false,
			}),
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (_state, error) => {
				if (error) console.warn('[settingsStore] rehydration failed:', error);
			},
		},
	),
);
