import { useCultureExhibitionDetail } from '@/src/hooks/useCultureExhibitionDetail';
import { useExhibitionDetail } from '@/src/hooks/useExhibitionDetail';

export function useExhibitionData(id: string) {
	const isNumericDbId = id != null && Number.isFinite(Number(id));
	const { exhibition: kcisaExhibition, status: kcisaStatus } =
		useExhibitionDetail(isNumericDbId ? id : undefined);
	const shouldTryCulture = !isNumericDbId || kcisaStatus === 'error';
	const { exhibition: apiExhibition, status: apiStatus } =
		useCultureExhibitionDetail(shouldTryCulture ? id : undefined);
	const exhibition = kcisaExhibition ?? apiExhibition ?? undefined;
	const isLoading =
		kcisaStatus === 'loading' ||
		kcisaStatus === 'idle' ||
		(shouldTryCulture && (apiStatus === 'loading' || apiStatus === 'idle'));

	return { exhibition, isLoading };
}
