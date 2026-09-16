import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildDescriptionPrompt } from '../constants/prompts';
import { useSettingsStore } from '../store/settingsStore';
import { store, updateStore } from '../store';
import { useImmersiveStore } from '../store/immersiveStore';
import { todayKey, useVisitStore } from '../store/visitStore';
import { streamDescription, streamDescriptionFromImage } from '../utils/api';

const CHAR_INTERVAL_MS = 25;
export const MAX_DESCRIPTION_RETRIES = 3;

export function useDescriptionStream() {
	const { isImmersive, immersiveExhibitionId, immersiveExhibitionTitle, addToPlaylist } =
		useImmersiveStore(
			useShallow((s) => ({
				isImmersive: s.isImmersiveMode,
				immersiveExhibitionId: s.exhibitionId,
				immersiveExhibitionTitle: s.exhibitionTitle,
				addToPlaylist: s.addToPlaylist,
			})),
		);
	const { descriptionFocus, descriptionLength } = useSettingsStore(
		useShallow((s) => ({
			descriptionFocus: s.descriptionFocus,
			descriptionLength: s.descriptionLength,
		})),
	);
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
	const [artworkImageUrl] = useState(store.artworkImageUrl);
	// 작가 소개 인트로는 작품 트랙으로 쌓지 않는다 — 재생목록 최상단 고정 트랙이 담당한다.
	const [isArtistIntro] = useState(store.isArtistIntro);
	const [fullText, setFullText] = useState('');

	// 로딩 단계 자동 진행 (5초, 10초)
	useEffect(() => {
		const t1 = setTimeout(() => {
			if (mountedRef.current) setLoadingStep(1);
		}, 5000);
		const t2 = setTimeout(() => {
			if (mountedRef.current) setLoadingStep(2);
		}, 10000);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
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
			updateStore({ artworkDescription: '' });
		}
		if (fullTextRef.current) {
			setDisplayed(fullTextRef.current);
			setFullText(fullTextRef.current);
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
								`${buildDescriptionPrompt(descriptionFocus, descriptionLength)}작품명: ${store.manualTitle}\n작가명: ${store.manualArtist}`,
							)
						: streamDescriptionFromImage(
								store.imageBase64,
								store.imageMediaType,
								buildDescriptionPrompt(descriptionFocus, descriptionLength),
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
					updateStore({ artworkDescription: fullTextRef.current });
					setFullText(fullTextRef.current);
					setIsStreaming(false);
				}
			}
		};
		run();
		return () => {
			cancelled = true;
		};
		// retryCount가 재시도 트리거. descriptionFocus는 생성 시작 시점 값을 고정한다.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [retryCount]);

	const isTyping = isStreaming || displayed.length < fullText.length;

	// 스트리밍 완료 시 재생목록 저장 (몰입 모드 전용)
	useEffect(() => {
		if (!isTyping && isImmersive && !isArtistIntro && !savedToPlaylistRef.current) {
			savedToPlaylistRef.current = true;
			addToPlaylist({
				title: store.inputMode === 'manual' ? store.manualTitle : '촬영한 작품',
				artist: store.inputMode === 'manual' ? store.manualArtist || undefined : undefined,
				year: store.inputMode === 'manual' ? store.manualYear || undefined : undefined,
				imageUrl: artworkImageUrl || undefined,
				description: fullTextRef.current || '해설 생성에 실패했어요.',
			});
		}
		// isTyping이 false로 바뀌는 순간에만 1회 저장. 스냅샷 값은 마운트 시 고정.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isTyping]);

	// 해설 생성 성공 시 관람 기록 저장 (몰입 모드 전용)
	useEffect(() => {
		if (!isTyping && isImmersive && fullTextRef.current && !savedToVisitRef.current) {
			savedToVisitRef.current = true;
			recordListened(todayKey(), immersiveExhibitionId, immersiveExhibitionTitle ?? undefined, {
				title: store.inputMode === 'manual' ? store.manualTitle : '촬영한 작품',
				imageUrl: artworkImageUrl || undefined,
				descriptionPreview: fullTextRef.current.replace(/\s+/g, ' ').trim().slice(0, 280),
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isTyping]);

	const handleRetry = () => {
		if (retryCount >= MAX_DESCRIPTION_RETRIES) return;
		bufferRef.current = '';
		fullTextRef.current = '';
		setDisplayed('');
		setFullText('');
		setLoadingStep(0);
		setRetryCount((c) => c + 1);
	};

	return {
		displayed,
		isStreaming,
		hasError,
		isTyping,
		loadingStep,
		retryCount,
		fullTextRef,
		artworkImageUrl,
		handleRetry,
	};
}
