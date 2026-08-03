import { create } from 'zustand';

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
	setVoiceId: (id: string) => void;
	setVoiceSpeed: (speed: VoiceSpeed) => void;
	setFontSize: (size: FontSize) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
	voiceId: 'uyVNoMrnUku1dZyVEXwD',
	voiceSpeed: 1.0,
	fontSize: 'medium',
	setVoiceId: (voiceId) => set({ voiceId }),
	setVoiceSpeed: (voiceSpeed) => set({ voiceSpeed }),
	setFontSize: (fontSize) => set({ fontSize }),
}));
