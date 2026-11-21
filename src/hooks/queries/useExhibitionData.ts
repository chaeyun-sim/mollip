import { useCultureExhibitionDetail } from '@/src/hooks/queries/useCultureExhibitionDetail';
import { useExhibitionDetail } from '@/src/hooks/queries/useExhibitionDetail';

// exhibitions.id(정수 PK)와 문화포털 seq는 서로 다른 값 공간이지만 숫자 형태를 공유한다.
// 아직 DB에 동기화되지 않은 문화포털 전시(북마크·최근 열람 등에서 seq를 id로 사용)를
// 곧바로 보여주기 위해, 숫자 id일 때 두 조회를 처음부터 병렬로 쏘고 DB 결과를 우선 채택한다.
export function useExhibitionData(id: string) {
	const isNumericDbId = id != null && Number.isFinite(Number(id));
	const {
		data: dbExhibition,
		isLoading: dbLoading,
		isError: dbError,
		error: dbQueryError,
		refetch: refetchDb,
	} = useExhibitionDetail(isNumericDbId ? id : undefined);

	const {
		data: cultureExhibition,
		isLoading: cultureLoading,
		isError: cultureError,
		error: cultureQueryError,
		refetch: refetchCulture,
	} = useCultureExhibitionDetail(id);

	const data = dbExhibition ?? cultureExhibition;
	const isLoading = !data && (dbLoading || cultureLoading);
	const isLookupFailure = (error: unknown) =>
		error != null && (error as { message?: string }).message !== 'exhibition not found';
	const isError =
		!data &&
		!isLoading &&
		((dbError && isLookupFailure(dbQueryError)) ||
			(cultureError && isLookupFailure(cultureQueryError)));
	const refetch = () =>
		Promise.all([isNumericDbId ? refetchDb() : Promise.resolve(), refetchCulture()]);

	return { data, isLoading, isError, refetch };
}
