import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { LicenseAccordionRow } from '@/src/components/settings/LicenseAccordionRow';
import { OPEN_SOURCE_LICENSES, type LicenseCategory } from '@/src/data/licenses';

// 화면에 표시할 분류 순서
const LICENSE_CATEGORIES: LicenseCategory[] = ['폰트', '라이브러리'];

export default function OpenSourceLicensesScreen() {
	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>오픈소스 라이선스</Screen.Header.Center>
			</Screen.Header>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pt-2 pb-12 px-1">
				{LICENSE_CATEGORIES.map((category) => (
					<View key={category} className="mb-4">
						<Text
							className="font-pretendard-medium text-gray500 text-[13px]"
							accessibilityRole="header"
						>
							{category}
						</Text>
						{OPEN_SOURCE_LICENSES.filter((license) => license.category === category).map(
							(license) => (
								<LicenseAccordionRow key={license.name} license={license} />
							),
						)}
					</View>
				))}
			</ScrollView>
		</Screen>
	);
}
