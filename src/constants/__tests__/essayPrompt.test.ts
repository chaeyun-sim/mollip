import { buildEssayPrompt } from '../prompts';

describe('buildEssayPrompt — 감상 에세이 재료 조립', () => {
	it('기존 입력 텍스트가 있으면 재료에 포함한다(AC-4)', () => {
		const prompt = buildEssayPrompt({
			exhibitionTitle: '모네: 빛의 정원',
			rating: 5,
			memo: '색채가 인상 깊었다',
			listenedTitles: ['수련', '루앙 대성당'],
		});

		expect(prompt).toContain('전시명: 모네: 빛의 정원');
		expect(prompt).toContain('별점: 5/5');
		expect(prompt).toContain('한줄평: 색채가 인상 깊었다');
		expect(prompt).toContain('들은 해설: 수련, 루앙 대성당');
	});

	it('기존 입력 텍스트가 빈 문자열이면 재료에서 제외한다(AC-3)', () => {
		const prompt = buildEssayPrompt({
			exhibitionTitle: '모네: 빛의 정원',
			rating: 4,
			memo: '',
			listenedTitles: ['수련'],
		});

		expect(prompt).not.toContain('한줄평');
	});

	it('기존 입력 텍스트가 공백뿐이면 재료에서 제외한다(AC-3)', () => {
		const prompt = buildEssayPrompt({
			exhibitionTitle: '모네: 빛의 정원',
			rating: 4,
			memo: '   ',
			listenedTitles: [],
		});

		expect(prompt).not.toContain('한줄평');
	});

	it('들은 해설이 없어도 버튼 비활성화 없이 별점만으로 재료를 구성한다(AC-9)', () => {
		const prompt = buildEssayPrompt({
			exhibitionTitle: '모네: 빛의 정원',
			rating: 3,
			listenedTitles: [],
		});

		expect(prompt).toContain('전시명: 모네: 빛의 정원');
		expect(prompt).toContain('별점: 3/5');
		expect(prompt).toContain('들은 해설: 없음');
	});
});
