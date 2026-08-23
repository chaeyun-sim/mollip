import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { SettingsCard } from '@/src/components/mypage';
import { cn } from '@/src/lib/cn';
import {
	type DescriptionFocus,
	useSettingsStore,
} from '@/src/store/settingsStore';
import { colors } from '@/src/constants/colors';

interface FocusOption {
	key: DescriptionFocus;
	label: string;
}

const FOCUS_OPTIONS: FocusOption[] = [
	{
		key: 'aesthetics',
		label: '구도, 색채, 조형적 특징',
	},
	{
		key: 'art_history',
		label: '작품의 사조와 역사적 맥락',
	},
	{
		key: 'artist_life',
		label: '작가의 삶과 이 작품의 연관성',
	},
	{
		key: 'social_context',
		label: '시대 배경과 사회적 의미',
	},
	{
		key: 'appreciation',
		label: '직접 느낄 수 있는 감성적 감상 포인트',
	},
	{
		key: 'technique',
		label: '사용된 재료, 물감 종류, 붓 터치, 제작 기법',
	},
	{
		key: 'symbolism',
		label: '작품 속 숨겨진 상징, 도상, 알레고리',
	},
	{
		key: 'viewer_gaze',
		label: '조명, 액자, 구도가 시선을 이끄는 방식',
	},
];

export default function DescriptionSettingsScreen() {
	const router = useRouter();
	const descriptionFocus = useSettingsStore((s) => s.descriptionFocus);
	const toggleDescriptionFocus = useSettingsStore(
		(s) => s.toggleDescriptionFocus,
	);

	return (
		<Screen className='flex-1 bg-[#f4f4f1]'>
			<Screen.Header>
				<Screen.Header.Back color={colors.primary} onPress={() => router.back()} />
				<Screen.Header.Center>
					<Text className='font-pretendard-semibold text-[16px] text-primary'>
						해설 강화 항목
					</Text>
				</Screen.Header.Center>
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 60 }}
			>
				<Text className='text-[13px] font-pretendard-regular text-tertiary mt-4 mb-3'>
					{`선택한 항목을 해설에서 더 깊게 다뤄요.\n여러 개 선택할 수 있어요.`}
				</Text>

				<View className='mt-2'>
					<SettingsCard>
						{FOCUS_OPTIONS.map((option, idx) => {
							const isSelected = descriptionFocus.includes(option.key);
							const isLast = idx === FOCUS_OPTIONS.length - 1;

							return (
								<Pressable
									key={option.key}
									onPress={() => toggleDescriptionFocus(option.key)}
									accessibilityRole='checkbox'
									accessibilityLabel={option.label}
									accessibilityState={{ checked: isSelected }}
									style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								>
									<View
										className={cn(
											'flex-row items-center px-4 py-4 gap-3',
											!isLast && 'border-b border-divider',
										)}
									>
										<View
											className={cn(
												'w-5 h-5 rounded items-center justify-center',
												isSelected ? 'bg-primary' : 'border border-[#D6D3D1] bg-white',
											)}
										>
											{isSelected && <Ionicons name='checkmark' size={13} color='white' />}
										</View>
										<View className='flex-1'>
											<Text className='text-[14px] font-pretendard-medium text-primary'>
												{option.label}
											</Text>
										</View>
									</View>
								</Pressable>
							);
						})}
					</SettingsCard>
				</View>
			</ScrollView>
		</Screen>
	);
}
