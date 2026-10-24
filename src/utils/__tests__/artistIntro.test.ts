import { buildExhibitionContext, isUsableArtistIntro } from '../artistIntro';

// babel-jest가 jest.mock을 import보다 위로 끌어올린다
jest.mock('@/src/utils/supabase', () => ({ supabase: {} }));

describe('isUsableArtistIntro — 관람객에게 보여주고 읽어줘도 되는 작가 소개인지', () => {
	it('평범한 해설은 통과한다', () => {
		expect(isUsableArtistIntro('1969년생 작가는 식물을 소재로 작업해 왔습니다.')).toBe(true);
	});

	it('비어 있거나 공백뿐이면 막는다', () => {
		expect(isUsableArtistIntro(undefined)).toBe(false);
		expect(isUsableArtistIntro(null)).toBe(false);
		expect(isUsableArtistIntro('   ')).toBe(false);
	});

	it('모델의 정보 없음 표식은 막는다', () => {
		expect(isUsableArtistIntro('[NO_INFO]')).toBe(false);
	});

	it('작성자 비고·거절문이 섞인 글은 막는다', () => {
		expect(isUsableArtistIntro('작성자 비고(관람객에게는 낭독하지 않음): 죄송합니다. ...')).toBe(
			false,
		);
		expect(isUsableArtistIntro('죄송합니다. 이 작가에 대한 정보를 갖고 있지 않습니다.')).toBe(
			false,
		);
	});
});

describe('buildExhibitionContext — 작가 특정용 전시 정보', () => {
	it('있는 항목만 줄 단위로 만들고 설명의 HTML은 걷어낸다', () => {
		const context = buildExhibitionContext({
			title: '어느 한 해',
			venue_name_fallback: '서울서예박물관',
			start_date: '2026-07-01',
			end_date: '2026-10-17',
			description: '<p>스페인 작가의 <br/>대규모 회화전</p>',
		});

		expect(context).toContain('전시명: 어느 한 해');
		expect(context).toContain('장소: 서울서예박물관');
		expect(context).toContain('기간: 2026-07-01 ~ 2026-10-17');
		expect(context).toContain('설명: 스페인 작가의');
		expect(context).not.toContain('<');
	});

	it('모든 항목이 비어 있으면 undefined', () => {
		expect(buildExhibitionContext({ title: ' ', description: null })).toBeUndefined();
	});
});
