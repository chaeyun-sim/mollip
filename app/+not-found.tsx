import { useRouter } from 'expo-router';

import { Result } from '@/src/components/common/Result';
import { Screen } from '@/src/components/layout/Screen';

export default function NotFoundScreen() {
	const router = useRouter();

	const handleGoHome = () => router.replace('/(tabs)');

	return (
		<Screen variant="warm">
			<Result
				icon="information-circle-outline"
				title="페이지를 찾을 수 없어요"
				description={'주소가 바뀌었거나 삭제된 화면이에요'}
				actionLabel="홈으로 가기"
				iconSize={36}
				onAction={handleGoHome}
			/>
		</Screen>
	);
}
