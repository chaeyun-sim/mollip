import { useEffect, useState } from 'react';

import { useRecordDraftStore } from '@/src/store/recordDraftStore';
import RecordWriteScreen from './write';

/** 기록하기 진입점 — 이전에 쓰던 내용을 비우고 전시 고르기부터 같은 화면에서 시작한다 */
export default function RecordEntryScreen() {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		useRecordDraftStore.getState().reset();
		setIsReady(true);
	}, []);

	return isReady ? <RecordWriteScreen /> : null;
}
