import { useEffect, useRef, useState } from 'react';
import { DESCRIPTION_PROMPT } from '../constants/prompts';
import { store } from '../store';
import { useImmersiveStore } from '../store/immersiveStore';
import { todayKey, useVisitStore } from '../store/visitStore';
import { streamDescription, streamDescriptionFromImage } from '../utils/api';

const CHAR_INTERVAL_MS = 25;

export function useDescriptionStream() {
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const addToPlaylist = useImmersiveStore((s) => s.addToPlaylist);
	const recordListened = useVisitStore((s) => s.recordListened);

	const [displayed, setDisplayed] = useState('');
	const [isStreaming, setIsStreaming] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [loadingStep, setLoadingStep] = useState(0);

	const bufferRef = useRef('');
	const fullTextRef = useRef('');
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const mountedRef = useRef(true);
	const savedToPlaylistRef = useRef(false);
	const savedToVisitRef = useRef(false);
	const artworkImageUrl = useRef(store.artworkImageUrl).current;

	// 로딩 단계 자동 진행 (5초, 10초)
	useEffect(() => {
		const t1 = setTimeout(() => { if (mountedRef.current) setLoadingStep(1); }, 5000);
		const t2 = setTimeout(() => { if (mountedRef.current) setLoadingStep(2); }, 10000);
		return () => { clearTimeout(t1); clearTimeout(t2); };
	}, []);

	// 문자 단위 표시 타이머
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

	// API 스트리밍
	useEffect(() => {
		if (!fullTextRef.current && store.artworkDescription) {
			fullTextRef.current = store.artworkDescription;
			store.artworkDescription = '';
		}
		if (fullTextRef.current) {
			setDisplayed(fullTextRef.current);
			setIsStreaming(false);
			return;
		}
		setHasError(false);
		setIsStreaming(true);
		let cancelled = false;
		const run = async () => {
			try {
				const gen =
					store.inputMode === 'manual'
						? streamDescription(
								`${DESCRIPTION_PROMPT}작품명: ${store.manualTitle}\n작가명: ${store.manualArtist}`,
							)
						: streamDescriptionFromImage(
								store.imageBase64,
								store.imageMediaType,
								DESCRIPTION_PROMPT,
							);
				for await (const chunk of gen) {
					if (cancelled || !mountedRef.current) break;
					bufferRef.current += chunk;
					fullTextRef.current += chunk;
				}
			} catch {
				if (!cancelled && mountedRef.current) setHasError(true);
			} finally {
				if (!cancelled && mountedRef.current) {
					store.artworkDescription = fullTextRef.current;
					setIsStreaming(false);
				}
			}
		};
		run();
		return () => { cancelled = true; };
	}, [retryCount]);

	const isTyping = isStreaming || bufferRef.current.length > 0;

	// 스트리밍 완료 시 재생목록 저장 (몰입 모드 전용)
	useEffect(() => {
		if (!isTyping && isImmersive && !savedToPlaylistRef.current) {
			savedToPlaylistRef.current = true;
			addToPlaylist({
				title: store.inputMode === 'manual' ? store.manualTitle : '촬영한 작품',
				imageUrl: artworkImageUrl || undefined,
				description: fullTextRef.current || '해설 생성에 실패했어요.',
			});
		}
	}, [isTyping]);

	// 해설 생성 성공 시 관람 기록 저장 (몰입 모드 전용)
	useEffect(() => {
		if (!isTyping && isImmersive && fullTextRef.current && !savedToVisitRef.current) {
			savedToVisitRef.current = true;
			recordListened(todayKey(), {
				title: store.inputMode === 'manual' ? store.manualTitle : '촬영한 작품',
				imageUrl: artworkImageUrl || undefined,
				descriptionPreview: fullTextRef.current.replace(/\s+/g, ' ').trim().slice(0, 280),
			});
		}
	}, [isTyping]);

	const handleRetry = () => {
		bufferRef.current = '';
		fullTextRef.current = '';
		setDisplayed('');
		setLoadingStep(0);
		setRetryCount((c) => c + 1);
	};

	return {
		displayed,
		isStreaming,
		hasError,
		isTyping,
		loadingStep,
		fullTextRef,
		artworkImageUrl,
		handleRetry,
	};
}
