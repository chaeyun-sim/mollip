import { useEffect, useState } from 'react';
import { getMuseumList } from '@/src/api/museum';
import { venueNames, type VenueGroup } from '@/src/data/venues';
import { supabase } from '@/src/utils/supabase';
import { isStale, markSynced } from '@/src/utils/syncCache';

interface MuseumRow {
	seq: string;
	cul_name: string;
	cul_grp_name: string | null;
	cul_tel: string | null;
	cul_home_url: string | null;
	gps_x: string;
	gps_y: string;
}

function rowToVenueGroup(row: MuseumRow): VenueGroup | null {
	const latitude = Number(row.gps_y);
	const longitude = Number(row.gps_x);
	if (!row.cul_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return null;
	}
	return {
		venueName: row.cul_name,
		coordinates: { latitude, longitude },
		openHours: '운영시간 정보 없음',
		exhibitions: [],
		phone: row.cul_tel || undefined,
		homepageUrl: row.cul_home_url || undefined,
	};
}

// museums 캐시가 24시간 이상 오래됐으면 공공API를 다시 호출해 테이블을 갱신한다.
// 공공API 호출이 실패해도(네트워크 등) 기존 캐시로 계속 서비스할 수 있도록 조용히 넘어간다.
async function syncMuseumsIfStale(): Promise<void> {
	if (!(await isStale('museums'))) return;
	const list = await getMuseumList();
	if (list.length === 0) return;
	const rows = list.map((m) => ({
		seq: m.seq,
		cul_name: m.culName,
		cul_grp_name: m.culGrpName || null,
		cul_tel: m.culTel || null,
		cul_home_url: m.culHomeUrl || null,
		gps_x: m.gpsX,
		gps_y: m.gpsY,
	}));
	await supabase.from('museums').upsert(rows);
	await markSynced('museums');
}

// 미술관 목록을 Supabase 캐시(museums)에서 읽어 지도 마커용 VenueGroup으로 변환한다.
// 이미 전시 데이터로 등록된 장소(venueNames)는 중복 마커를 만들지 않도록 제외한다.
export function useMuseums(): VenueGroup[] {
	const [museumVenues, setMuseumVenues] = useState<VenueGroup[]>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				await syncMuseumsIfStale();
			} catch {
				// 캐시가 이미 있으면 공공API 실패는 무시하고 캐시로 계속 서비스한다.
			}
			if (cancelled) return;
			const { data } = await supabase.from('museums').select('*');
			if (cancelled || !data) return;
			const mapped = (data as MuseumRow[])
				.map(rowToVenueGroup)
				.filter((v): v is VenueGroup => v !== null && !venueNames.has(v.venueName));
			setMuseumVenues(mapped);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return museumVenues;
}
