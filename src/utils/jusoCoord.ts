/** juso API entX/entY (EPSG:5179, GRS80 중부원점) → WGS84 */
export function jusoEntToWgs84(
	entX: string,
	entY: string,
): { latitude: number; longitude: number } | null {
	const x = Number(entX);
	const y = Number(entY);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

	const RE = 6378137.0;
	const GRID = 5.0;
	const PI = Math.PI;
	const OLon = 127.0;
	const OLat = 38.0;
	const OX = 200000.0;
	const OY = 600000.0;
	const DEGRAD = PI / 180.0;

	const re = RE / GRID;
	const slat1 = 30.0 * DEGRAD;
	const slat2 = 60.0 * DEGRAD;
	const olon = OLon * DEGRAD;
	const olat = OLat * DEGRAD;

	let sn = Math.tan(PI * 0.25 + slat2 * 0.5) / Math.tan(PI * 0.25 + slat1 * 0.5);
	sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
	let sf = Math.tan(PI * 0.25 + slat1 * 0.5);
	sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
	let ro = (re * sf) / Math.pow(Math.tan(PI * 0.25 + olat * 0.5), sn);

	let ra = Math.sqrt((x - OX) * (x - OX) + (ro - (y - OY)) * (ro - (y - OY)));
	if (sn < 0) ra = -ra;
	let alat = Math.pow((re * sf) / ra, 1.0 / sn);
	alat = 2.0 * Math.atan(alat) - PI * 0.5;
	let theta = 0;
	if (Math.abs(x - OX) <= 1e-9) {
		theta = olon;
	} else {
		theta = Math.atan2(x - OX, ro - (y - OY));
	}
	const alon = theta / sn + olon;

	return { latitude: alat / DEGRAD, longitude: alon / DEGRAD };
}
