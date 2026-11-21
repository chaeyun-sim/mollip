import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import type { OpenSourceLicense } from '@/src/data/licenses';

export interface LicenseAccordionRowProps {
	license: OpenSourceLicense;
}

export function LicenseAccordionRow({ license }: LicenseAccordionRowProps) {
	const { t } = useTranslation();

	const [expanded, setExpanded] = useState(false);

	const handleToggle = () => setExpanded((prev) => !prev);

	const handleOpenLicenseUrl = async () => {
		try {
			await WebBrowser.openBrowserAsync(license.licenseUrl);
		} catch {
			await Linking.openURL(license.licenseUrl);
		}
	};

	return (
		<View className="mb-6">
			<Pressable
				onPress={handleToggle}
				className="flex-row items-center justify-between py-4"
				accessibilityRole="button"
				accessibilityLabel={
					expanded
						? t('licenses.collapse_a11y', { name: license.name })
						: t('licenses.expand_a11y', { name: license.name })
				}
				accessibilityState={{ expanded }}
			>
				<Text className="font-pretendard-semibold text-gray900 text-[16px]">{license.name}</Text>
				<Ionicons
					name={expanded ? 'chevron-up' : 'chevron-down'}
					size={18}
					className="text-gray500"
				/>
			</Pressable>

			{expanded && (
				<View className="pb-1">
					<Text className="font-pretendard-regular text-gray500 text-[13px] mb-3">
						{license.licenseName}
					</Text>
					<Pressable
						onPress={handleOpenLicenseUrl}
						style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
						className="flex-row items-center gap-2 mb-4"
						accessibilityRole="link"
						accessibilityLabel={t('licenses.open_github_a11y', { name: license.name })}
					>
						<Ionicons name="logo-github" size={15} className="text-gray600" />
						<Text className="font-pretendard-semibold text-gray900 text-[13px]">
							{t('licenses.view_on_github')}
						</Text>
						<Ionicons name="arrow-up-outline" size={13} className="rotate-45 text-gray700 -ml-1" />
					</Pressable>
					<Text className="font-pretendard-regular text-gray600 text-[13px] leading-5">
						{license.licenseText}
					</Text>
				</View>
			)}
		</View>
	);
}
