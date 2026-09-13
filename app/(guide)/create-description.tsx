import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Pressable,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
	ActivityIndicator,
} from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import * as Haptics from 'expo-haptics';
import { updateStore } from '../../src/store';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { Button } from '@/src/components/common/Button';
import { TextField } from '@/src/components/common/TextField';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { NarrationSettingsFields } from '@/src/components/mypage';
import { searchWikiArtworks, type WikiArtwork } from '../../src/api/wikidata';
import { colors } from '@/src/constants/colors';

const STORAGE_KEY = 'example_modal_hidden';

const EXAMPLES = [
	{
		image: require('../../assets/images/example/example-1.png'),
		caption: '작품 옆 설명 안내판을 찍어보세요',
	},
	{
		image: require('../../assets/images/example/example-2.png'),
		caption: '작품 전체가 나오도록 찍어도 좋아요',
	},
];

export default function IndexScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const settingsSheetRef = useRef<BottomSheetModal>(null);
	const pendingCameraRef = useRef<boolean>(false);
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const exhibitionTitle = useImmersiveStore((s) => s.exhibitionTitle);
	const [isLoading, setIsLoading] = useState(false);
	const [directQuestionSessionId] = useState(() => Date.now().toString());

	// Wikidata 검색 상태 (몰입 모드 전용)
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<WikiArtwork[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 해설 화면 등에서 뒤로가기로 이 화면에 다시 돌아왔을 때 이전 검색어가 남아있지
	// 않도록, 화면이 포커스를 받을 때마다 검색 상태를 초기화한다.
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			setSearchQuery('');
			setSearchResults([]);
		});
		return unsubscribe;
	}, [navigation]);

	const isSearchActive = isImmersive && searchQuery.trim().length >= 2;

	useEffect(() => {
		if (!isSearchActive) return;

		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await searchWikiArtworks(searchQuery.trim());
				setSearchResults(results);
			} catch {
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 500);
		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
	}, [isSearchActive, searchQuery]);

	// 검색 비활성 상태(짧은 검색어·비몰입모드)에서는 이전 결과를 화면에 노출하지 않는다
	const displayedSearchResults = isSearchActive ? searchResults : [];

	const handleSelectArtwork = (artwork: WikiArtwork) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		updateStore({
			manualTitle: artwork.label,
			manualArtist: artwork.artist ?? '',
			manualYear: artwork.year ?? '',
			artworkImageUrl: artwork.imageUrl ?? '',
			artworkDescription: '',
			isArtistIntro: false,
			inputMode: 'manual',
		});
		setSearchQuery('');
		setSearchResults([]);
		router.replace('/description');
	};

	const launchPicker = useCallback(
		async (useCamera: boolean) => {
			setIsLoading(true);
			const permission = useCamera
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permission.granted) {
				Alert.alert(
					'권한 필요',
					useCamera
						? '카메라를 사용하려면 설정에서 카메라 권한을 허용해 주세요.'
						: '사진을 선택하려면 설정에서 사진 라이브러리 권한을 허용해 주세요.',
				);
				return;
			}

			const result = useCamera
				? await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true })
				: await ImagePicker.launchImageLibraryAsync({
						quality: 0.8,
						mediaTypes: ['images'],
						base64: true,
					});

			if (result.canceled) {
				setIsLoading(false);
				return;
			}

			const asset = result.assets[0];
			if (!asset.base64) {
				Alert.alert('오류', '이미지를 다시 선택해 주세요.');
				setIsLoading(false);
				return;
			}
			// inputMode를 'image'로 되돌리지 않으면, 이전에 검색/직접입력(manual) 흐름을 한 번이라도
			// 거친 세션에서는 useDescriptionStream이 여전히 manual 분기를 타서 방금 찍은 사진 대신
			// 이전 manualTitle/manualArtist로 해설을 생성해버린다 — 그 스테일 필드도 함께 비운다.
			updateStore({
				inputMode: 'image',
				manualTitle: '',
				manualArtist: '',
				manualYear: '',
				imageBase64: asset.base64,
				imageMediaType:
					(asset.mimeType as 'image/jpeg' | 'image/png' | 'image/webp') ?? 'image/jpeg',
				extractedText: '',
				artworkDescription: '',
				isArtistIntro: false,
			});
			setIsLoading(false);
			if (isImmersive) {
				router.replace('/description');
			} else {
				router.push('/description');
			}
		},
		[isImmersive, router],
	);

	const pickAndGo = async (useCamera: boolean) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const hidden = await AsyncStorage.getItem(STORAGE_KEY);
		if (hidden === 'true') {
			launchPicker(useCamera);
			return;
		}
		pendingCameraRef.current = useCamera;
		bottomSheetRef.current?.present();
	};

	const handleConfirm = useCallback(() => {
		bottomSheetRef.current?.dismiss();
		launchPicker(pendingCameraRef.current);
	}, [launchPicker]);

	const handleDismissForever = useCallback(async () => {
		await AsyncStorage.setItem(STORAGE_KEY, 'true');
		bottomSheetRef.current?.dismiss();
		launchPicker(pendingCameraRef.current);
	}, [launchPicker]);

	return (
		<Screen>
			<Stack.Screen options={{ gestureEnabled: !isImmersive }} />
			<Screen.Header>
				{isImmersive ? (
					<>
						<ScreenHeader.Back onPress={() => router.back()} color="white-90" />
						<ScreenHeader.Right>
							<View className="flex-row items-center gap-4">
								<Pressable
									onPress={() =>
										router.push({
											pathname: '/chat',
											params: {
												sessionId: directQuestionSessionId,
												...(exhibitionTitle ? { title: exhibitionTitle } : {}),
											},
										})
									}
									hitSlop={8}
									accessibilityLabel="작품 없이 바로 질문하기"
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name="chatbubble-outline" size={22} className="text-white/90" />
								</Pressable>
								<Pressable
									onPress={() => settingsSheetRef.current?.present()}
									hitSlop={8}
									accessibilityLabel="해설 생성 설정"
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name="settings-outline" size={22} className="text-white/90" />
								</Pressable>
							</View>
						</ScreenHeader.Right>
					</>
				) : (
					<>
						<ScreenHeader.Left>
							<ScreenHeader.Back onPress={() => router.back()} color="white-90" />
						</ScreenHeader.Left>
						<ScreenHeader.Right>
							<Pressable
								className="flex-row items-center gap-1.5"
								onPress={() => router.push('/(guide)/immersive-start')}
								hitSlop={8}
								accessibilityLabel="몰입 모드로 시작"
								accessibilityRole="button"
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							>
								<Ionicons name="headset-outline" size={18} className="text-white/70" />
								<Text className="text-sm font-pretendard-regular text-white/70">몰입 모드</Text>
							</Pressable>
						</ScreenHeader.Right>
					</>
				)}
			</Screen.Header>

			{/* 상단 타이틀 */}
			{!isImmersive && (
				<View className="mt-3 gap-2">
					<Text className="text-3xl text-white mb-2 font-pretendard-bold">작품 해설 생성기</Text>
					<Text className="text-md leading-6 text-gray600">
						{`작품 설명을 촬영하거나 사진을 선택하면\nAI가 바로 해설을 만들어드려요`}
					</Text>
				</View>
			)}

			{/* 작품 검색 — 몰입 모드 전용 */}
			{isImmersive && (
				<View className="mt-5">
					<View
						className="flex-row items-center rounded-2xl px-4 gap-3 bg-gray900 h-[52px] border-white/10"
						style={{
							borderWidth: StyleSheet.hairlineWidth,
						}}
					>
						<Ionicons name="search" size={18} className="text-gray700" />
						<TextField
							variant="plain"
							tone="dark"
							className="text-white text-[16px]"
							placeholder="작품명으로 검색 (예: 별이 빛나는 밤)"
							value={searchQuery}
							onChangeText={setSearchQuery}
							returnKeyType="search"
							clearButtonMode="while-editing"
							keyboardAppearance="dark"
						/>
						{isSearching && <ActivityIndicator size="small" className="text-gray700" />}
					</View>

					{displayedSearchResults.length > 0 && (
						<View
							className="mt-2 rounded-2xl overflow-hidden bg-gray900 max-h-[360px] bg-white/8"
							style={{
								borderWidth: StyleSheet.hairlineWidth,
							}}
						>
							<ScrollView
								scrollEnabled={displayedSearchResults.length > 5}
								showsVerticalScrollIndicator={displayedSearchResults.length > 5}
								keyboardShouldPersistTaps="handled"
								nestedScrollEnabled
							>
								{displayedSearchResults.map((artwork, index) => (
									<Pressable
										key={artwork.qId}
										className="flex-row items-center gap-3 px-4 py-3 bg-white/6"
										style={({ pressed }) => ({
											borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
											opacity: pressed ? 0.7 : 1,
										})}
										onPress={() => handleSelectArtwork(artwork)}
									>
										{artwork.imageUrl ? (
											<Image
												source={{ uri: artwork.imageUrl }}
												className="rounded-lg w-12 h-12"
												resizeMode="cover"
											/>
										) : (
											<View className="rounded-lg items-center justify-center w-12 h-12 bg-divider-dark">
												<Ionicons name="image-outline" size={20} className="text-gray700" />
											</View>
										)}
										<View className="flex-1">
											<Text
												className="text-white text-sm font-pretendard-semibold"
												numberOfLines={1}
											>
												{artwork.label}
												{artwork.year ? (
													<Text className="font-pretendard-regular text-gray600">
														{'  '}
														{artwork.year}
													</Text>
												) : null}
											</Text>
											{artwork.description ? (
												<Text
													className="text-xs mt-0.5 font-pretendard-regular text-gray600"
													numberOfLines={1}
												>
													{artwork.description}
												</Text>
											) : null}
										</View>
										<Ionicons name="chevron-forward" size={16} className="text-gray700" />
									</Pressable>
								))}
							</ScrollView>
						</View>
					)}
				</View>
			)}

			{/* 버튼 영역 */}
			<Screen.BottomAbsolute className="gap-3 px-6 bottom-10">
				<Button.Row
					icon="camera"
					title="카메라로 촬영"
					description="지금 바로 작품을 찍어보세요"
					onPress={() => pickAndGo(true)}
					disabled={isLoading}
				/>
				<Button.Row
					variant="outlined"
					icon="images"
					title="갤러리에서 선택"
					description="저장된 사진을 불러오세요"
					onPress={() => pickAndGo(false)}
					disabled={isLoading}
				/>
				<Button
					variant="ghost"
					icon="pencil-outline"
					onPress={() => router.push('/manual')}
					disabled={isLoading}
					accessibilityLabel="작품명 직접 입력"
				>
					작품명 직접 입력
				</Button>
			</Screen.BottomAbsolute>

			{/* 예시 바텀시트 */}
			<BottomSheetModal
				ref={bottomSheetRef}
				snapPoints={['60%']}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: colors.gray900 }}
				handleIndicatorStyle={{ backgroundColor: colors.gray700 }}
			>
				<BottomSheetView className="px-6 pb-10">
					<Text className="text-lg text-white mt-2 mb-1 font-pretendard-bold">
						이렇게 찍어보세요
					</Text>
					<Text className="text-sm mb-5 font-pretendard-regular text-gray600">
						작품 옆 설명 안내판이나 작품 전체를 찍으면{'\n'}정확한 해설을 생성해요
					</Text>

					{/* 예시 이미지 가로 스크롤 — 일반 ScrollView로 gesture 충돌 방지 */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerClassName="gap-3 pb-1"
						className="mb-6"
					>
						{EXAMPLES.map((ex, i) => (
							<View key={i} className="gap-2 w-[220px]">
								<Image
									source={ex.image}
									className="rounded-xl w-[220px] h-[160px]"
									resizeMode="cover"
									accessibilityLabel={ex.caption}
								/>
								<Text className="text-xs text-center font-pretendard-regular text-gray500">
									{ex.caption}
								</Text>
							</View>
						))}
					</ScrollView>

					<Button
						tone="inverse"
						onPress={handleConfirm}
						accessibilityLabel="확인했어요"
						className="mb-3"
					>
						확인했어요
					</Button>
					<Button
						variant="ghost"
						onPress={handleDismissForever}
						accessibilityLabel="다시 보지 않기"
					>
						다시 보지 않기
					</Button>
				</BottomSheetView>
			</BottomSheetModal>

			{/* 해설 생성 설정 바텀시트 */}
			<BottomSheetModal
				ref={settingsSheetRef}
				snapPoints={['40%']}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: colors.gray900 }}
				handleIndicatorStyle={{ backgroundColor: colors.gray700 }}
			>
				<BottomSheetView className="px-6 pb-10">
					<Text className="text-lg text-white mt-2 mb-6 font-pretendard-bold">해설 생성 설정</Text>
					<NarrationSettingsFields theme="dark" />
				</BottomSheetView>
			</BottomSheetModal>
		</Screen>
	);
}
