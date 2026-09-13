export interface OnboardingListenClip {
	id: string;
	genre: string;
	title: string;
	caption: string;
	source: number;
}

export const ONBOARDING_LISTEN_CLIPS: OnboardingListenClip[] = [
	{
		id: 'ink',
		genre: '한국화',
		title: '여백의 숨',
		caption: '먹선 하나가 산을 가르면, 여백이 숨을 쉽니다. 오늘은 그 숨을 따라가 봅니다.',
		source: require('../../assets/audio/onboarding/ink.m4a'),
	},
	{
		id: 'light',
		genre: '미디어아트',
		title: '다른 시간',
		caption: '빛이 벽을 채우면 전시장이 잠시 다른 시간이 됩니다. 그 시간에 귀를 기울여 보세요.',
		source: require('../../assets/audio/onboarding/light.m4a'),
	},
];
