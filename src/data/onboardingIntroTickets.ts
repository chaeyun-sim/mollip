export interface OnboardingIntroTicket {
	id: string;
	front: string;
	back: string;
}

export const ONBOARDING_INTRO_TICKETS: OnboardingIntroTicket[] = [
	{
		id: 'listen',
		front: '듣다',
		back: '작품 앞에서 짧게 해설을 들려 드립니다',
	},
	{
		id: 'keep',
		front: '남기다',
		back: '관람이 끝나면 티켓으로 그날의 기록을 남깁니다',
	},
	{
		id: 'match',
		front: '맞춰 보다',
		back: '고른 결의 전시를 홈에서 먼저 보여 드립니다',
	},
];
