import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import type { OpenSourceLicense } from '@/src/data/licenses';

export interface LicenseAccordionRowProps {
	license: OpenSourceLicense;
}

export function LicenseAccordionRow({ license }: LicenseAccordionRowProps) {
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
					expanded ? `${license.name} 라이선스 접기` : `${license.name} 라이선스 펼치기`
				}
				accessibilityState={{ expanded }}
			>
				<Text className="font-pretendard-semibold text-gray900 text-[16px]">
					[폰트] {license.name}
				</Text>
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
						accessibilityLabel={`${license.name} GitHub 라이선스 원문 열기`}
					>
						<Ionicons name="logo-github" size={15} className="text-gray600" />
						<Text className="font-pretendard-semibold text-gray900 text-[13px]">
							GitHub에서 보기
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
