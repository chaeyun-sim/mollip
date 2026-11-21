import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { LicenseAccordionRow } from '@/src/components/settings/LicenseAccordionRow';
import { OPEN_SOURCE_LICENSES, type LicenseCategory } from '@/src/data/licenses';

// 화면에 표시할 분류 순서
const LICENSE_CATEGORIES: LicenseCategory[] = ['폰트', '라이브러리'];

// 분류 값은 데이터 식별자라 그대로 두고, 화면 표시만 번역한다
const CATEGORY_LABEL_KEYS: Record<LicenseCategory, string> = {
	폰트: 'licenses.category_fonts',
	라이브러리: 'licenses.category_libraries',
};

export default function OpenSourceLicensesScreen() {
	const { t } = useTranslation();

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>{t('settings.open_source_licenses')}</Screen.Header.Center>
			</Screen.Header>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pt-2 pb-12 px-1">
				{LICENSE_CATEGORIES.map((category) => (
					<View key={category} className="mb-4">
						<Text
							className="font-pretendard-medium text-gray500 text-[13px]"
							accessibilityRole="header"
						>
							{t(CATEGORY_LABEL_KEYS[category])}
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
