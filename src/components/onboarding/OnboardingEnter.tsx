import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';

interface OnboardingEnterProps {
	genres: string[];
	buttonLabel: string;
	onPress: () => void;
	disabled?: boolean;
}

export function OnboardingEnter({
	genres,
	buttonLabel,
	onPress,
	disabled = false,
}: OnboardingEnterProps) {
	const { t } = useTranslation();
	const hasGenres = genres.length > 0;
	const title = hasGenres
		? t('onboarding.enter_title_with_genres', {
				genres: genres
					.map((genre) => t(`recommendations.labels.${genre}`, { defaultValue: genre }))
					.join(', '),
			})
		: t('onboarding.enter_title_no_genres');
	const body = hasGenres
		? t('onboarding.enter_body_with_genres')
		: t('onboarding.enter_body_no_genres');

	return (
		<>
			<View className="flex-1 items-center justify-center gap-4 px-4">
				<View className="w-2 h-2 rounded-full bg-brand" />
				<Text className="text-gray900 text-[22px] leading-[30px] font-hahmlet-bold text-center">
					{title}
				</Text>
				<Text className="text-gray600 text-[13px] font-pretendard-regular text-center leading-5">
					{body}
				</Text>
			</View>
			<Screen.Bottom className="pb-12">
				<Pressable
					className="w-full bg-brand flex-row items-center justify-center rounded-[18px] py-[18px]"
					style={({ pressed }) => ({ opacity: pressed || disabled ? 0.6 : 1 })}
					onPress={onPress}
					disabled={disabled}
					accessibilityRole="button"
					accessibilityLabel={buttonLabel}
				>
					<Text className="text-base text-white font-pretendard-semibold">{buttonLabel}</Text>
				</Pressable>
			</Screen.Bottom>
		</>
	);
}
