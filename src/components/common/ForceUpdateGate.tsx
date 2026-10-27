import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();

	return (
		<Screen variant="warm">
			<Result
				icon="arrow-up-circle-outline"
				title={t('force_update.title')}
				description={t('force_update.description')}
				actionLabel={t('force_update.update')}
				onAction={() => handleOpenStore(storeUrl)}
			/>
		</Screen>
	);
}
