import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { ExhibitionPoster } from '@/src/components/common/EmptyImagePlaceholder';
import { store } from '../../src/store';
import { useChatStore } from '../../src/store/chatStore';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { colors } from '@/src/constants/colors';

export default function PlaylistScreen() {
	const router = useRouter();
	const playlist = useImmersiveStore((s) => s.playlist);
	const clearChat = useChatStore((s) => s.clear);

	const FAILED_DESCRIPTION = '해설 생성에 실패했어요.';

	const handlePlay = (item: (typeof playlist)[number]) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		store.manualTitle = item.title;
		store.artworkImageUrl = item.imageUrl ?? '';
		store.artworkDescription =
			item.description === FAILED_DESCRIPTION ? '' : item.description;
		store.inputMode = 'manual';
		store.manualArtist = '';
		clearChat();
		router.push('/description');
	};

	return (
		<Screen>
			<Screen.Header>
				<ScreenHeader.Back
					onPress={() => {
						router.back();
					}}
					color='rgba(255,255,255,0.9)'
				/>
				<ScreenHeader.Center>
					<Text className='font-pretendard-semibold text-[#E8E8E8] text-[16px]'>
						재생 목록
					</Text>
				</ScreenHeader.Center>
			</Screen.Header>

			{playlist.length === 0 ? (
				<View className='flex-1 items-center justify-center gap-3'>
					<Ionicons name='musical-notes-outline' size={40} color={colors.secondary} />
					<Text className='font-pretendard-regular text-secondary text-[15px]'>
						아직 들은 작품이 없어요
					</Text>
					<Pressable
						className='mt-2 flex-row items-center gap-2 px-5 py-3 rounded-xl bg-primary'
						onPress={() => router.push('/(guide)/create-description')}
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons name='search' size={15} color='#60A5FA' />
						<Text className='font-pretendard-semibold text-[#60A5FA] text-[14px]'>
							작품 찾기
						</Text>
					</Pressable>
				</View>
			) : (
				<ScrollView
					className='flex-1'
					contentContainerStyle={{ paddingBottom: 32 }}
				>
					<Text className='mb-4 mt-1 font-pretendard-regular text-secondary text-[13px]'>
						{playlist.length}개의 작품
					</Text>

					{[...playlist].reverse().map((item, index) => (
						<View
							key={item.id}
							className='flex-row items-center gap-4 py-4 border-t-white/6'
							style={{
								borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
							}}
						>
							{/* 썸네일 */}
							<ExhibitionPoster
								heroImageUri={item.imageUrl}
								className='w-14 h-14 rounded-[10px]'
								iconSize={22}
								resizeMode='cover'
							/>
							{/* 텍스트 */}
							<View className='flex-1 gap-1'>
								<Text
									className='font-pretendard-semibold text-[#E8E8E8] text-[15px]'
									numberOfLines={1}
								>
									{item.title}
								</Text>
								<Text
									className='font-pretendard-regular text-tertiary text-[13px]'
									numberOfLines={2}
								>
									{item.description}
								</Text>
							</View>
							<Pressable onPress={() => handlePlay(item)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
								<Ionicons
									name={
										item.description === FAILED_DESCRIPTION
											? 'refresh-outline'
											: 'play-circle-outline'
									}
									size={26}
									color={item.description === FAILED_DESCRIPTION ? colors.tertiary : colors.accent}
								/>
							</Pressable>
						</View>
					))}
				</ScrollView>
			)}
		</Screen>
	);
}
