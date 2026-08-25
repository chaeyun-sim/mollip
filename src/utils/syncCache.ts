import { supabase } from '@/src/utils/supabase';

const STALE_MS = 24 * 60 * 60 * 1000; // 24시간

// data_sync_meta에 소스별 마지막 동기화 시각을 기록해, 공공데이터 캐시 테이블이
// "오래됐는지"를 판단한다. 없거나 24시간이 지났으면 오래된 것으로 본다.
export async function isStale(source: string): Promise<boolean> {
	const { data } = await supabase
		.from('data_sync_meta')
		.select('synced_at')
		.eq('source', source)
		.maybeSingle();
	if (!data) return true;
	return Date.now() - new Date(data.synced_at).getTime() > STALE_MS;
}

export async function markSynced(source: string): Promise<void> {
	await supabase.from('data_sync_meta').upsert({ source, synced_at: new Date().toISOString() });
}
