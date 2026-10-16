import { create } from 'zustand';
import { generateArtistIntro } from '@/src/utils/api';
import {
	fetchExhibitionArtist,
	readArtistIntroCache,
	writeArtistIntroCache,
} from '@/src/utils/artistIntro';

export type ArtistIntroStatus = 'idle' | 'loading' | 'ready' | 'failed';

interface ArtistIntroStore {
	artist: string | null;
	imageUrl?: string;
	/** 작가 소개 생성에 같이 넘기는 전시 정보 — 재시도에서도 같은 단서를 쓰도록 들고 있는다 */
	context?: string;
	exhibitionTitle?: string;
	status: ArtistIntroStatus;
	text: string | null;
	prepare: (exhibitionId: string | null, exhibitionTitle?: string) => void;
	retry: () => void;
	reset: () => void;
}

const INITIAL = {
	artist: null,
	imageUrl: undefined,
	context: undefined,
	exhibitionTitle: undefined,
	status: 'idle' as ArtistIntroStatus,
	text: null,
};

// 진행 중인 생성 작업이 종료·재진입 이후에 늦게 끝나 이전 전시의 결과를 되살리는 것을 막는
// 세션 토큰. prepare/reset마다 증가하며, 토큰이 바뀐 작업의 결과는 버려진다(AC-8).
let sessionToken = 0;

/**
 * 몰입 모드 세션의 작가 소개 인트로 상태.
 *
 * - persist하지 않는다: 앱을 재시작했을 때 'loading' 상태가 영구히 굳는 것을 막는다(01-spec Risks).
 * - 생성 작업은 스토어 액션(모듈 스코프)에서 돌기 때문에, immersive-start가
 *   router.replace로 언마운트돼도 중단되지 않는다(AC-1/AC-5).
 */
export const useArtistIntroStore = create<ArtistIntroStore>()((set, get) => ({
	...INITIAL,

	// 몰입 시작 시 호출. 사용자를 기다리게 하지 않도록 await하지 않는다(AC-1).
	prepare: (exhibitionId, exhibitionTitle) => {
		const token = ++sessionToken;
		set({ ...INITIAL });

		void (async () => {
			const info = await fetchExhibitionArtist(exhibitionId, exhibitionTitle);
			// 단체전 등 artist가 없는 전시는 생성 API를 호출하지 않는다.
			if (!info) return;

			if (token !== sessionToken) return;
			set({
				artist: info.artist,
				imageUrl: info.imageUrl,
				context: info.context,
				exhibitionTitle,
				status: 'loading',
				text: null,
			});
			await load(info.artist, exhibitionTitle, info.context, token, set);
		})();
	},

	// 실패 상태의 트랙을 탭했을 때 재생성(AC-7)
	retry: () => {
		const { artist, status, exhibitionTitle, context } = get();
		if (!artist || status === 'loading') return;

		const token = sessionToken;
		set({ status: 'loading', text: null });
		void load(artist, exhibitionTitle, context, token, set);
	},

	// 몰입 종료·재진입 시 세션 상태 초기화(AC-8). 전역 캐시 테이블 데이터는 그대로 유지된다.
	reset: () => {
		sessionToken += 1;
		set({ ...INITIAL });
	},
}));

type SetState = (partial: Partial<ArtistIntroStore>) => void;

// 캐시 히트면 생성 호출 없이 즉시 ready(AC-2), 미스면 생성 후 캐시에 저장한다.
async function load(
	artist: string,
	exhibitionTitle: string | undefined,
	context: string | undefined,
	token: number,
	set: SetState,
) {
	const cached = await readArtistIntroCache(artist);
	if (cached) {
		if (token !== sessionToken) return;
		set({ status: 'ready', text: cached });
		return;
	}

	try {
		const intro = await generateArtistIntro(artist, exhibitionTitle, context);
		if (token !== sessionToken) return;
		// 작가 정보를 확신할 수 없어 쓸 만한 해설이 없으면 캐시하지 않고 트랙을 숨긴다(단체전과 같은 취급)
		if (!intro) {
			set({ ...INITIAL });
			return;
		}
		writeArtistIntroCache(artist, intro);
		set({ status: 'ready', text: intro });
	} catch {
		if (token !== sessionToken) return;
		set({ status: 'failed', text: null });
	}
}
