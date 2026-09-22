import { ScrollView } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { LicenseAccordionRow } from '@/src/components/settings/LicenseAccordionRow';
import { OPEN_SOURCE_LICENSES } from '@/src/data/licenses';

export default function OpenSourceLicensesScreen() {
	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>오픈소스 라이선스</Screen.Header.Center>
			</Screen.Header>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pt-2 pb-12 px-1">
				{OPEN_SOURCE_LICENSES.map((license) => (
					<LicenseAccordionRow key={license.name} license={license} />
				))}
			</ScrollView>
		</Screen>
	);
}
