import * as Linking from 'expo-linking';

import { Result } from '@/src/components/common/Result';
import { Screen } from '@/src/components/layout/Screen';

interface ForceUpdateGateProps {
	storeUrl: string | null;
}

const handleOpenStore = (storeUrl: string | null) => {
	if (!storeUrl) return;
	void Linking.openURL(storeUrl);
};

export function ForceUpdateGate({ storeUrl }: ForceUpdateGateProps) {
	return (
		<Screen variant="warm">
			<Result
				icon="arrow-up-circle-outline"
				title="새 버전이 있어요"
				description={'더 안정적인 이용을 위해\n최신 버전으로 업데이트해 주세요.'}
				actionLabel="업데이트하기"
				onAction={() => handleOpenStore(storeUrl)}
			/>
		</Screen>
	);
}
