import { Text, View } from 'react-native';
import { Button } from '@/src/components/common/Button';
import { Chip } from '@/src/components/common/Chip';
import { ONBOARDING_GENRE_OPTIONS } from '@/src/utils/onboardingWallGenres';

interface OnboardingGenrePickerProps {
	selectedGenres: string[];
	busy: boolean;
	onToggleGenre: (genre: string) => void;
	onConfirm: () => void;
	title?: string;
	description?: string;
	submitLabel?: string;
}

/** 빠르게 여러 장르를 선택하는 온보딩 대안 경로. */
export function OnboardingGenrePicker({
	selectedGenres,
	busy,
	onToggleGenre,
	onConfirm,
	title = '어떤 장르의 전시가 끌리나요?',
	description = '좋아하는 장르를 모두 골라주세요',
	submitLabel = '이 취향으로 시작하기',
}: OnboardingGenrePickerProps) {
	const hasSelection = selectedGenres.length > 0;

	return (
		<View className="flex-1">
			<View className="pt-2">
				<Text className="font-pretendard-bold text-[24px] leading-[32px] text-gray900">
					{title}
				</Text>
				<Text className="mt-2 font-pretendard-regular text-[14px] leading-[21px] text-gray600">
					{description}
				</Text>
			</View>

			<View className="mt-7 flex-row flex-wrap gap-2.5">
				{ONBOARDING_GENRE_OPTIONS.map((genre) => {
					const active = selectedGenres.includes(genre);
					return (
						<Chip
							key={genre}
							label={genre}
							active={active}
							variant="tonal"
							accessibilityLabel={`${genre} 장르`}
							disabled={busy}
							onPress={() => onToggleGenre(genre)}
						/>
					);
				})}
			</View>

			<Text className="mt-4 font-pretendard-regular text-[12px] text-gray500">
				{hasSelection ? `${selectedGenres.length}개 장르를 골랐어요` : '한 가지 이상 골라주세요'}
			</Text>

			<View className="flex-1" />
			<Button
				disabled={!hasSelection || busy}
				loading={busy}
				onPress={onConfirm}
				accessibilityLabel="선택한 취향으로 시작하기"
				className="bottom-10 min-h-[52px]"
				size="large"
			>
				{submitLabel}
			</Button>
		</View>
	);
}
