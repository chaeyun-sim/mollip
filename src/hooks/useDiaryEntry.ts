import { useCallback, useRef, useState } from 'react';

import { useDiaryStore } from '@/src/store/diaryStore';
import { streamDescription } from '@/src/utils/api';

interface DiaryPromptInput {
	prompt: string;
}

/**
 * 날짜 키별 AI 일기 생성 훅.
 * 스트리밍 중에는 draft를, 완료 후에는 persist된 entry를 반환한다.
 */
export function useDiaryEntry(entryKey: string, { prompt }: DiaryPromptInput) {
	const entry = useDiaryStore((s) => s.entries[entryKey]);
	const setEntry = useDiaryStore((s) => s.setEntry);
	const clearEntry = useDiaryStore((s) => s.clearEntry);

	const [draft, setDraft] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const [hasError, setHasError] = useState(false);
	const fullTextRef = useRef('');

	const generate = useCallback(async () => {
		if (isStreaming) return;
		clearEntry(entryKey);
		fullTextRef.current = '';
		setDraft('');
		setHasError(false);
		setIsStreaming(true);
		try {
			for await (const chunk of streamDescription(prompt)) {
				fullTextRef.current += chunk;
				setDraft(fullTextRef.current);
			}
			setEntry(entryKey, fullTextRef.current);
		} catch {
			setHasError(true);
		} finally {
			setIsStreaming(false);
		}
	}, [isStreaming, entryKey, prompt, setEntry, clearEntry]);

	return {
		text: entry ?? draft,
		hasEntry: Boolean(entry),
		isStreaming,
		hasError,
		generate,
	};
}
