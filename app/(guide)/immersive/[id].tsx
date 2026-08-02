import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useCultureExhibitionDetail } from '../../../src/hooks/useCultureExhibitionDetail';
import { useExhibitionDetail } from '../../../src/hooks/useExhibitionDetail';
import { ImmersiveEntry } from '../../../src/components/immersive/ImmersiveEntry';
import { useImmersiveStore } from '../../../src/store/immersiveStore';
import { todayKey, useVisitStore } from '../../../src/store/visitStore';

export default function ImmersiveScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();

	// 정적 큐레이션 6개 외의 전시(대부분)는 KCISA/문화포털 API 소스라 여기서도 같이 조회해야 한다
	// — 메인 상세 화면((explore)/[id].tsx)과 동일한 폴백 순서.
	const isNumericDbId = id != null && Number.isFinite(Number(id));
	const { exhibition: kcisaExhibition, status: kcisaStatus } = useExhibitionDetail(
		isNumericDbId ? id : undefined,
	);
	const shouldTryCulture = !isNumericDbId || kcisaStatus === 'error';
	const { exhibition: apiExhibition, status: apiStatus } = useCultureExhibitionDetail(
		shouldTryCulture ? id : undefined,
	);
	const exhibition = kcisaExhibition ?? apiExhibition ?? undefined;
	const isLoading =
		(kcisaStatus === 'loading' ||
			kcisaStatus === 'idle' ||
			(shouldTryCulture && (apiStatus === 'loading' || apiStatus === 'idle')));

	const enter = useImmersiveStore((s) => s.enter);
	const exit = useImmersiveStore((s) => s.exit);
	const recordExhibition = useVisitStore((s) => s.recordExhibition);

	if (isLoading) {
		return (
			<View className='flex-1 items-center justify-center bg-black'>
				<ActivityIndicator color='rgba(255,255,255,0.5)' />
			</View>
		);
	}

	if (!exhibition) {
		return (
			<View className='flex-1 items-center justify-center bg-black'>
				<Text className='text-white/50 font-pretendard-medium text-base'>
					전시를 찾을 수 없습니다
				</Text>
			</View>
		);
	}

	const handleStart = () => {
		enter(id);
		recordExhibition(todayKey(), id, {
			title: exhibition.title,
			venue: exhibition.venue,
		});
		router.push('/(guide)/create-description');
	};

	return (
		<ImmersiveEntry
			exhibition={exhibition}
			onStart={handleStart}
			onClose={() => {
				exit();
				router.back();
			}}
		/>
	);
}
