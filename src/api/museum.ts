import { XMLParser } from 'fast-xml-parser';

const DATA_URL = 'https://apis.data.go.kr/B553457/nopenapi/rest/cultureartspaces';

const KEY = process.env.EXPO_PUBLIC_ART_MUSEUM_API_KEY;

export interface Museum {
	seq: string;
	culName: string;
	culGrpName: string;
	culTel: string;
	culHomeUrl: string;
	gpsX: string;
	gpsY: string;
}

// cultureartspaces API도 문화포털 API와 동일하게 XML만 반환한다.
const xmlParser = new XMLParser({ isArray: (name) => name === 'item', parseTagValue: false });

const getMuseumList = async (keyword?: string): Promise<Museum[]> => {
	let url = `${DATA_URL}/artgallery?serviceKey=${KEY}&PageNo=1&numOfrows=100`;
	if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

	const response = await fetch(url);
	const xml = await response.text();
	const parsed = xmlParser.parse(xml)?.response ?? {};
	const items: Museum[] = parsed.body?.items?.item ?? [];

	return items;
};

export { getMuseumList };
