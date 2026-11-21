import { act } from 'react';
import { createRoot } from 'test-renderer';

import { useExhibitionData } from '../useExhibitionData';
import { useExhibitionDetail } from '../useExhibitionDetail';
import { useCultureExhibitionDetail } from '../useCultureExhibitionDetail';

jest.mock('../useExhibitionDetail', () => ({ useExhibitionDetail: jest.fn() }));
jest.mock('../useCultureExhibitionDetail', () => ({ useCultureExhibitionDetail: jest.fn() }));

const mockDb = useExhibitionDetail as jest.Mock;
const mockCulture = useCultureExhibitionDetail as jest.Mock;
const missing = new Error('exhibition not found');
const result = (error: unknown = null, data?: unknown) => ({
	data,
	isLoading: false,
	isError: error != null,
	error,
	refetch: jest.fn().mockResolvedValue({ data }),
});

const renderData = (id = '10074') => {
	let value: ReturnType<typeof useExhibitionData> | undefined;
	function Harness() {
		value = useExhibitionData(id);
		return null;
	}
	const root = createRoot();
	act(() => root.render(<Harness />));
	act(() => root.unmount());
	return value!;
};

describe('useExhibitionData lookup failures', () => {
	it('DB 컬럼 오류를 전시 없음으로 처리하지 않는다', () => {
		mockDb.mockReturnValue(result({ code: '42703', message: 'column does not exist' }));
		mockCulture.mockReturnValue(result(missing));
		expect(renderData().isError).toBe(true);
	});

	it('양쪽에서 전시를 찾지 못한 경우에만 전시 없음으로 처리한다', () => {
		mockDb.mockReturnValue(result(missing));
		mockCulture.mockReturnValue(result(missing));
		expect(renderData().isError).toBe(false);
	});

	it('문화포털 장애가 있어도 DB 전시를 표시한다', () => {
		const exhibition = { id: '10074', title: '상서' };
		mockDb.mockReturnValue(result(null, exhibition));
		mockCulture.mockReturnValue(result(new Error('Network request failed')));
		expect(renderData()).toMatchObject({ data: exhibition, isError: false, isLoading: false });
	});

	it('재시도로 두 데이터 소스를 다시 조회한다', async () => {
		const db = result(new Error('Network request failed'));
		const culture = result(new Error('Network request failed'));
		mockDb.mockReturnValue(db);
		mockCulture.mockReturnValue(culture);
		await renderData().refetch();
		expect(db.refetch).toHaveBeenCalledTimes(1);
		expect(culture.refetch).toHaveBeenCalledTimes(1);
	});

	it('숫자가 아닌 ID 재시도는 비활성화된 DB 조회를 실행하지 않는다', async () => {
		const db = result();
		const culture = result(new Error('Network request failed'));
		mockDb.mockReturnValue(db);
		mockCulture.mockReturnValue(culture);
		await renderData('culture-id').refetch();
		expect(db.refetch).not.toHaveBeenCalled();
		expect(culture.refetch).toHaveBeenCalledTimes(1);
	});
});
