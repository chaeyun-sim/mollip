export interface OnboardingInvite {
	id: string;
	genre: string;
	title: string;
	venue: string;
	invitation: string;
	color: string;
	accent: string;
	imageUrl: string;
}

export const ONBOARDING_INVITES: OnboardingInvite[] = [
	{
		id: 'korean-painting',
		genre: '한국화',
		title: '진경, 다시 보다',
		venue: '국립중앙박물관',
		invitation: '진경산수전에 초대합니다',
		color: '#D9C9A8',
		accent: '#B8935A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Inwangjesaekdo.jpg/3840px-Inwangjesaekdo.jpg',
	},
	{
		id: 'media-art',
		genre: '미디어아트',
		title: '빛의 방',
		venue: '국립현대미술관',
		invitation: '국립현대미술관 미디어아트전에 초대합니다',
		color: '#A8B4C4',
		accent: '#3A5E8A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/7/7e/Die_Zwitscher-Maschine_%28Twittering_Machine%29%2C_1922_-_Paul_Klee.jpg',
	},
	{
		id: 'photography',
		genre: '사진',
		title: '정지된 시선',
		venue: '서울시립미술관',
		invitation: '서울시립 사진전에 초대합니다',
		color: '#C8C8CC',
		accent: '#5A5A6A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/3840px-1665_Girl_with_a_Pearl_Earring.jpg',
	},
	{
		id: 'installation',
		genre: '설치',
		title: '공간을 걷는 조각',
		venue: '리움미술관',
		invitation: '리움 설치전에 초대합니다',
		color: '#C4C0B4',
		accent: '#6A6250',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/a/a4/Le_Penseur_by_Rodin_%28Kunsthalle_Bielefeld%29_2014-04-10.JPG',
	},
	{
		id: 'painting',
		genre: '회화',
		title: '밤의 색',
		venue: '예술의전당',
		invitation: '예술의전당 회화전에 초대합니다',
		color: '#B8B4C8',
		accent: '#5A3A8A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/3840px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
	},
];
