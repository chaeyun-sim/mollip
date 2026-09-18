import { WEEKDAYS } from '@/src/constants/week';

/** "본문 (대안: A, B)" 형태의 주차 안내 문자열을 요약과 대안 목록으로 분리한다. */
export function parseParkingAlternatives(parking: string | undefined): {
	summary: string;
	alternatives: string[];
} {
	if (!parking) return { summary: '', alternatives: [] };
	const marker = '대안:';
	const markerIndex = parking.indexOf(marker);
	if (markerIndex === -1) {
		return { summary: parking.trim(), alternatives: [] };
	}
	// "본문 (대안: A, B)" 형태 — 여는 괄호까지 잘라내 요약에 "(" 가 남지 않게, 닫는 괄호도 마지막 항목에서 제거
	const summary = parking.slice(0, markerIndex).trim().replace(/\($/, '').trim();
	const alternatives = parking
		.slice(markerIndex + marker.length)
		.replace(/\)\s*$/, '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
	return { summary, alternatives };
}

function includesToday(label: string | undefined, dayName: string): boolean {
	const normalized = label?.replace(/\s/g, '').replace(/요일/g, '') ?? '';
	if (!normalized || normalized === '없음' || normalized === '-') return false;
	if (normalized.includes('매일') || normalized.includes('연중무휴')) return true;
	if (normalized.includes('평일')) return ['월', '화', '수', '목', '금'].includes(dayName);
	if (normalized.includes('주말')) return ['토', '일'].includes(dayName);
	return normalized
		.split(/[,\s·/]+/)
		.map((item) => item.trim())
		.some((item) => item.includes(dayName));
}

function findTodayHours(openHours: string, dayName: string): string | null {
	const lines = openHours
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	for (const line of lines) {
		const match = line.match(/(\d{1,2}:\d{2})\s*[~–-]\s*(\d{1,2}:\d{2})/);
		if (!match) continue;
		const label = line.slice(0, match.index).replace(/[:：]/g, '').trim();
		if (!label || includesToday(label, dayName)) return `${match[1]}-${match[2]}`;
	}

	const fallback = openHours.match(/(\d{1,2}:\d{2})\s*[~–-]\s*(\d{1,2}:\d{2})/);
	return fallback ? `${fallback[1]}-${fallback[2]}` : null;
}

/** 오늘 요일 기준 "운영 중 10:00-19:00" / "휴관" 같은 한 줄 상태 문구를 만든다. */
export function formatTodayOpenStatus(openHours: string, closedDays: string | undefined): string {
	const dayName = WEEKDAYS[new Date().getDay()];
	if (includesToday(closedDays, dayName)) return '휴관';
	if (!openHours || openHours.includes('정보 없음')) return '운영시간 정보 없음';
	const hours = findTodayHours(openHours, dayName);
	return hours ? `운영 중 ${hours}` : '휴관 정보 없음';
}

/** 요일별 운영시간 드롭다운에 쓰는 월~일 7줄 목록을 만든다. */
export function buildWeeklyHours(
	openHours: string,
	closedDays: string | undefined,
): { day: string; hours: string }[] {
	return ['월', '화', '수', '목', '금', '토', '일'].map((day) => {
		if (includesToday(closedDays, day)) return { day, hours: '휴관' };
		return { day, hours: findTodayHours(openHours, day) ?? '정보 없음' };
	});
}
