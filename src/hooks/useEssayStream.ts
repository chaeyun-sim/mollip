import { useEffect, useRef, useState } from 'react';
import { buildEssayPrompt, ESSAY_SYSTEM_PROMPT, type EssayMaterials } from '../constants/prompts';
import { streamChat } from '../utils/api';

const CHAR_INTERVAL_MS = 25;
export const MAX_ESSAY_RETRIES = 3;
/** 한 카드 세션에서 생성이 성공한 횟수의 상한. 실패는 세지 않는다. */
export const MAX_ESSAY_GENERATES = 5;

export type EssayStage = 'idle' | 'streaming' | 'done' | 'error';

// 확정 큐(confirm-visits)의 감상 생성 단계 전용 경량 스트리밍 훅.
// useDescriptionStream의 델타 누적/문자 단위 표시 패턴만 참고해 신규 작성했다 —
// 이미지 해설 플로우 상태(artworkImageUrl, 재생목록 자동 저장 등)와 결합되어 있지 않다.
export function useEssayStream() {
	const [stage, setStage] = useState<EssayStage>('idle');
	const [displayed, setDisplayed] = useState('');
	const [fullText, setFullText] = useState('');
	const [retryCount, setRetryCount] = useState(0);

	const bufferRef = useRef('');
	const fullTextRef = useRef('');
	const materialsRef = useRef<EssayMaterials | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const mountedRef = useRef(true);
	const cancelledRef = useRef(false);

	// 문자 단위 표시 타이머("주루루룩")
	useEffect(() => {
		mountedRef.current = true;
		timerRef.current = setInterval(() => {
			if (!mountedRef.current || bufferRef.current.length === 0) return;
			const char = bufferRef.current[0];
			bufferRef.current = bufferRef.current.slice(1);
			setDisplayed((prev) => prev + char);
		}, CHAR_INTERVAL_MS);
		return () => {
			mountedRef.current = false;
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	// 표시 문자가 완성된 전체 텍스트를 따라잡으면 done으로 전환(AC-11 — 자동 서명 진행은 아님)
	useEffect(() => {
		if (stage === 'streaming' && fullText.length > 0 && displayed.length >= fullText.length) {
			setStage('done');
		}
	}, [stage, displayed, fullText]);

	async function runGeneration() {
		const materials = materialsRef.current;
		if (!materials) return;

		cancelledRef.current = false;
		bufferRef.current = '';
		fullTextRef.current = '';
		setDisplayed('');
		setFullText('');
		setStage('streaming');

		try {
			const prompt = buildEssayPrompt(materials);
			const gen = streamChat(ESSAY_SYSTEM_PROMPT, [{ role: 'user', content: prompt }]);
			for await (const chunk of gen) {
				if (cancelledRef.current || !mountedRef.current) break;
				bufferRef.current += chunk;
				fullTextRef.current += chunk;
			}
			if (cancelledRef.current || !mountedRef.current) return;

			if (fullTextRef.current.length === 0) {
				setStage('error');
				return;
			}
			setFullText(fullTextRef.current);
		} catch (error) {
			console.warn('[essay] stream-chat failed:', error);
			if (!cancelledRef.current && mountedRef.current) setStage('error');
		}
	}

	function generate(materials: EssayMaterials) {
		materialsRef.current = materials;
		runGeneration();
	}

	function retry() {
		if (retryCount >= MAX_ESSAY_RETRIES) return;
		setRetryCount((c) => c + 1);
		runGeneration();
	}

	// 화면 이탈(뒤로가기 등) 시 진행 중이던 생성 요청을 취소하고 미완성 감상문을 폐기한다.
	function cancel() {
		cancelledRef.current = true;
	}

	// 확정 큐에서 다음 카드로 넘어갈 때 이전 카드의 감상 생성 상태를 완전히 초기화한다.
	function reset() {
		cancelledRef.current = true;
		bufferRef.current = '';
		fullTextRef.current = '';
		materialsRef.current = null;
		setDisplayed('');
		setFullText('');
		setStage('idle');
		setRetryCount(0);
	}

	// 에러 배너를 닫고 입력칸을 다시 직접 편집 가능하게 한다. 이미 도착한 텍스트는 유지한다.
	function clearError() {
		setStage((current) => (current === 'error' ? 'idle' : current));
	}

	return {
		stage,
		/** streaming 중에는 문자 단위로 늘어나고, 완료/에러 후에도 마지막 표시값을 유지한다 */
		text: displayed,
		retryCount,
		generate,
		retry,
		cancel,
		reset,
		clearError,
	};
}
