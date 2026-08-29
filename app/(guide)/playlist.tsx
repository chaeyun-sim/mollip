import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ArtistIntroTrack } from '@/src/components/guide/ArtistIntroTrack';
import { store } from '../../src/store';
import { useArtistIntroStore } from '../../src/store/artistIntroStore';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { cn } from '@/src/lib/cn';

export default function PlaylistScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const playlist = useImmersiveStore((s) => s.playlist);
	const exhibitionTitle = useImmersiveStore((s) => s.exhibitionTitle);
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const exhibitionId = useImmersiveStore((s) => s.exhibitionId);
	const exitImmersive = useImmersiveStore((s) => s.exit);
	const introArtist = useArtistIntroStore((s) => s.artist);
	const introImageUrl = useArtistIntroStore((s) => s.imageUrl);
	const introStatus = useArtistIntroStore((s) => s.status);
	const introText = useArtistIntroStore((s) => s.text);
	const retryArtistIntro = useArtistIntroStore((s) => s.retry);

	const confirmExit = () => {
		Alert.alert('전시 관람 종료', '재생목록이 초기화돼요', [
			{ text: '닫기', style: 'cancel' },
			{
				text: '종료',
				style: 'destructive',
				onPress: () => {
					exitImmersive();
					// 바로 나가지 않고, 관람 마무리 화면(종료 요약 + 주변 추천)을 먼저 보여준다.
					// replace — 뒤로가기로 다시 재생목록으로 못 돌아오게 스택에서 제거.
					router.replace('/(guide)/exit-summary');
				},
			},
		]);
	};

	// 몰입 모드의 홈 화면 — 헤더 버튼뿐 아니라 스와이프 제스처/하드웨어 back까지
	// 전부 가로채서, 확인 없이 메인 서비스로 빠져나가지 못하게 막는다.
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', (e) => {
			if (!isImmersive) return;
			e.preventDefault();
			confirmExit();
		});
		return unsubscribe;
	}, [navigation, isImmersive, exitImmersive, router]);

	const FAILED_DESCRIPTION = '해설 생성에 실패했어요.';

	const handlePlay = (item: (typeof playlist)[number]) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		store.manualTitle = item.title;
		store.artworkImageUrl = item.imageUrl ?? '';
		store.artworkDescription = item.description === FAILED_DESCRIPTION ? '' : item.description;
		store.inputMode = 'manual';
		store.manualArtist = '';
		store.isArtistIntro = false;
		router.replace('/description');
	};

	// ready면 재생, failed면 재생성. loading은 트랙이 disabled라 호출되지 않는다.
	const handlePlayArtistIntro = () => {
		if (introStatus === 'failed') {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			retryArtistIntro();
			return;
		}

		if (introStatus !== 'ready' || !introArtist || !introText) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		store.manualTitle = introArtist;
		store.artworkImageUrl = introImageUrl ?? '';
		store.artworkDescription = introText;
		store.inputMode = 'manual';
		store.manualArtist = '';
		store.isArtistIntro = true;
		router.replace('/description');
	};

	// artist가 없거나 전시를 검색으로 선택하지 않은 경우 트랙 자체를 렌더하지 않는다.
	function renderArtistIntroTrack() {
		if (!exhibitionId || !introArtist || introStatus === 'idle') return null;

		return (
			<ArtistIntroTrack
				artist={introArtist}
				imageUrl={introImageUrl}
				status={introStatus}
				onPress={handlePlayArtistIntro}
			/>
		);
	}

	return (
		<Screen>
			<Stack.Screen options={{ gestureEnabled: !isImmersive }} />
			<Screen.Header className="py-1">
				<ScreenHeader.Right>
					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							confirmExit();
						}}
						hitSlop={8}
						accessibilityLabel="전시 관람 종료"
						accessibilityRole="button"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name="close" size={24} color="rgba(255,255,255,0.55)" />
					</Pressable>
				</ScreenHeader.Right>
			</Screen.Header>

			{/* 몰입 모드 홈 히어로 — 기능의 일부가 아니라 별도 서비스 진입점처럼 보이도록 구성 */}
			<View className="mb-7 pb-6 rounded-[28px] gap-4 bg-white/6">
				<View className="flex-row items-center gap-2">
					<View className="w-9 h-9 rounded-full items-center justify-center bg-primary/20">
						<Ionicons name="headset" size={18} color="#60A5FA" />
					</View>
					<Text className="text-sm font-pretendard-semibold text-[#60A5FA] tracking-wider">
						몰입 모드 진행 중
					</Text>
				</View>
				<Text className="text-[26px] leading-8 font-pretendard-bold text-white" numberOfLines={2}>
					{exhibitionTitle || '전시 관람'}
				</Text>
				<Text className="text-md font-pretendard-regular text-gray500">
					{playlist.length > 0
						? `지금까지 ${playlist.length}개의 작품을 만났어요`
						: '작품을 스캔하면 해설이 여기에 쌓여요'}
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
				scrollEnabled={playlist.length > 0}
			>
				<Text className="mb-4 font-pretendard-semibold text-on-dark text-[15px]">재생목록</Text>
				{renderArtistIntroTrack()}
				{playlist.length === 0 ? (
					<View className="flex-1 items-center justify-center gap-3 mb-20">
						<Ionicons name="musical-notes-outline" size={40} className="text-gray700" />
						<Text className="font-pretendard-regular text-gray700 text-[15px]">
							아직 들은 작품이 없어요
						</Text>
					</View>
				) : (
					<>
						{[...playlist].reverse().map((item, index) => (
							<View
								key={item.id}
								className="flex-row items-center gap-4 py-4 border-t-white/6"
								style={{
									borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
								}}
							>
								{/* 썸네일 */}
								<ImageFallback
									heroImageUri={item.imageUrl}
									className="w-14 h-14 rounded-[10px]"
									iconSize={22}
									resizeMode="cover"
								/>
								{/* 텍스트 */}
								<View className="flex-1 gap-1">
									<Text
										className="font-pretendard-semibold text-on-dark text-[15px]"
										numberOfLines={1}
									>
										{item.title}
									</Text>
									<Text
										className="font-pretendard-regular text-gray600 text-[13px]"
										numberOfLines={2}
									>
										{item.artist
											? `${item.artist}${item.year ? ` · ${item.year}` : ''}`
											: item.description}
									</Text>
								</View>
								<Pressable
									onPress={() => handlePlay(item)}
									style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								>
									<Ionicons
										name={
											item.description === FAILED_DESCRIPTION
												? 'refresh-outline'
												: 'play-circle-outline'
										}
										size={26}
										className={cn(
											item.description === FAILED_DESCRIPTION ? 'text-gray600' : 'text-primary',
										)}
									/>
								</Pressable>
							</View>
						))}
					</>
				)}
			</ScrollView>

			{/* 플로팅 추가 버튼 — 작품 찾기(create-description)로 이동 */}
			<Screen.BottomAbsolute className="bottom-10 flex-row mr-6 justify-end">
				<Pressable
					className="w-14 h-14 rounded-full items-center justify-center bg-secondary"
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						router.push('/(guide)/create-description');
					}}
					style={({ pressed }) => ({
						opacity: pressed ? 0.85 : 1,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.3,
						shadowRadius: 8,
						elevation: 6,
					})}
					accessibilityLabel="작품 추가하기"
					accessibilityRole="button"
				>
					<Ionicons name="add" size={30} color="#fff" />
				</Pressable>
			</Screen.BottomAbsolute>
		</Screen>
	);
}
