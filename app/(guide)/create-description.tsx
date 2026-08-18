import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Pressable,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	ActivityIndicator,
} from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import * as Haptics from 'expo-haptics';
import { store } from '../../src/store';
import { useChatStore } from '../../src/store/chatStore';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { searchWikiArtworks, type WikiArtwork } from '../../src/api/wikidata';

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
	const clearChat = useChatStore((s) => s.clear);
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const pendingCameraRef = useRef<boolean>(false);
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const exitImmersive = useImmersiveStore((s) => s.exit);

	const [isLoading, setIsLoading] = useState(false);

	// 셀프 가이드 진입점(작품 선택 화면) — 헤더 버튼뿐 아니라 스와이프 제스처/하드웨어 back
	// 까지 전부 가로채서, 몰입 모드일 때는 확인 없이 메인 서비스로 빠져나가지 못하게 막는다.
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', (e) => {
			if (!isImmersive) return;
			e.preventDefault();
			Alert.alert('전시 관람 종료', '재생목록이 초기화됩니다.', [
				{ text: '취소', style: 'cancel' },
				{
					text: '종료',
					style: 'destructive',
					onPress: () => {
						exitImmersive();
						// 바로 나가지 않고, 관람 마무리 화면(종료 요약 + 주변 추천)을 먼저 보여준다.
						// replace — 뒤로가기로 다시 가이드 화면으로 못 돌아오게 스택에서 제거.
						router.replace('/(guide)/exit-summary');
					},
				},
			]);
		});
		return unsubscribe;
	}, [navigation, isImmersive, exitImmersive, router]);

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

	useEffect(() => {
		if (!isImmersive || searchQuery.trim().length < 2) {
			setSearchResults([]);
			return;
		}
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
	}, [searchQuery, isImmersive]);

	const handleSelectArtwork = (artwork: WikiArtwork) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		store.manualTitle = artwork.label;
		store.manualArtist = artwork.artist ?? '';
		store.artworkImageUrl = artwork.imageUrl ?? '';
		store.artworkDescription = '';
		store.inputMode = 'manual';
		clearChat();
		setSearchQuery('');
		setSearchResults([]);
		router.push('/description');
	};

	const launchPicker = async (useCamera: boolean) => {
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
			Alert.alert('오류', '이미지를 읽을 수 없습니다. 다시 시도해 주세요.');
			setIsLoading(false);
			return;
		}
		store.imageBase64 = asset.base64;
		store.imageMediaType =
			(asset.mimeType as 'image/jpeg' | 'image/png' | 'image/webp') ??
			'image/jpeg';
		store.extractedText = '';
		store.artworkDescription = '';
		clearChat();
		setIsLoading(false);
		router.push('/description');
	};

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
	}, []);

	const handleDismissForever = useCallback(async () => {
		await AsyncStorage.setItem(STORAGE_KEY, 'true');
		bottomSheetRef.current?.dismiss();
		launchPicker(pendingCameraRef.current);
	}, []);

	return (
		<Screen>
			<Screen.Header>
				{isImmersive ? (
					<Pressable
						onPress={() => router.back()}
						hitSlop={8}
						accessibilityLabel='가이드 종료'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name='close' size={24} color='rgba(255,255,255,0.9)' />
					</Pressable>
				) : (
					<ScreenHeader.Back
						onPress={() => router.back()}
						color='rgba(255,255,255,0.9)'
					/>
				)}
			</Screen.Header>

			{/* 상단 타이틀 */}
			{!isImmersive && (
				<View className='mt-3 gap-2'>
					<Text className='text-3xl text-white mb-2 font-pretendard-bold'>
						작품 해설 생성기
					</Text>
					<Text className='text-md leading-6 text-[#78716C]'>
						{`작품 설명을 촬영하거나 사진을 선택하면\nAI가 바로 해설을 만들어드려요`}
					</Text>
				</View>
			)}

			{/* 작품 검색 — 몰입 모드 전용 */}
			{isImmersive && (
				<View className='mt-5'>
					<View
						className='flex-row items-center rounded-2xl px-4 gap-3 bg-[#1C1917] h-[52px] border-white/10'
						style={{
							borderWidth: StyleSheet.hairlineWidth,
						}}
					>
						<Ionicons name='search' size={18} color='#57534E' />
						<TextInput
							className='flex-1 text-white font-pretendard-regular text-[14px] pb-0 leading-0'
							placeholder='작품명으로 검색 (예: 별이 빛나는 밤)'
							placeholderTextColor='#57534E'
							value={searchQuery}
							onChangeText={setSearchQuery}
							returnKeyType='search'
							clearButtonMode='while-editing'
							keyboardAppearance='dark'
						/>
						{isSearching && <ActivityIndicator size='small' color='#57534E' />}
					</View>

					{searchResults.length > 0 && (
						<View
							className='mt-2 rounded-2xl overflow-hidden bg-[#1C1917] max-h-[360px] bg-white/8'
							style={{
								borderWidth: StyleSheet.hairlineWidth,
							}}
						>
							<ScrollView
								scrollEnabled={searchResults.length > 5}
								showsVerticalScrollIndicator={searchResults.length > 5}
								keyboardShouldPersistTaps='handled'
								nestedScrollEnabled
							>
								{searchResults.map((artwork, index) => (
									<Pressable
										key={artwork.qId}
										className='flex-row items-center gap-3 px-4 py-3 bg-white/6'
										style={({ pressed }) => ({
											borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
											opacity: pressed ? 0.7 : 1,
										})}
										onPress={() => handleSelectArtwork(artwork)}
									>
										{artwork.imageUrl ? (
											<Image
												source={{ uri: artwork.imageUrl }}
												className='rounded-lg w-12 h-12'
												resizeMode='cover'
											/>
										) : (
											<View className='rounded-lg items-center justify-center w-12 h-12 bg-[#292524]'>
												<Ionicons name='image-outline' size={20} color='#57534E' />
											</View>
										)}
										<View className='flex-1'>
											<Text
												className='text-white text-sm font-pretendard-semibold'
												numberOfLines={1}
											>
												{artwork.label}
												{artwork.year ? (
													<Text className='font-pretendard-regular text-[#78716C]'>
														{'  '}
														{artwork.year}
													</Text>
												) : null}
											</Text>
											{artwork.description ? (
												<Text
													className='text-xs mt-0.5 font-pretendard-regular text-[#78716C]'
													numberOfLines={1}
												>
													{artwork.description}
												</Text>
											) : null}
										</View>
										<Ionicons name='chevron-forward' size={16} color='#57534E' />
									</Pressable>
								))}
							</ScrollView>
						</View>
					)}
				</View>
			)}

			{/* 버튼 영역 */}
			<Screen.BottomAbsolute className='gap-3 px-6 bottom-10'>
				{/* 카메라 — primary */}
				<Pressable
					className='rounded-2xl overflow-hidden'
					onPress={() => pickAndGo(true)}
					style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
					disabled={isLoading}
					accessibilityLabel='카메라로 촬영'
					accessibilityRole='button'
				>
					<View className='flex-row items-center gap-4 px-6 py-5 bg-[#3B82F6]'>
						<View className='w-10 h-10 rounded-xl items-center justify-center bg-white/20'>
							<Ionicons name='camera' size={22} color='#fff' />
						</View>
						<View className='flex-1'>
							<Text className='text-white text-base font-pretendard-semibold'>
								카메라로 촬영
							</Text>
							<Text className='text-xs mt-0.5 text-white/60'>
								지금 바로 작품을 찍어보세요
							</Text>
						</View>
						<Ionicons
							name='chevron-forward'
							size={18}
							color='rgba(255,255,255,0.5)'
						/>
					</View>
				</Pressable>

				{/* 갤러리 — secondary */}
				<Pressable
					className='rounded-2xl overflow-hidden'
					onPress={() => pickAndGo(false)}
					style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
					disabled={isLoading}
					accessibilityLabel='갤러리에서 선택'
					accessibilityRole='button'
				>
					<View
						className='flex-row items-center gap-4 px-6 py-5 bg-[#1C1917] bg-white/8'
						style={{
							borderWidth: StyleSheet.hairlineWidth,
						}}
					>
						<View className='w-10 h-10 rounded-xl items-center justify-center bg-white/10'>
							<Ionicons name='images' size={22} color='#e8e8e8' />
						</View>
						<View className='flex-1'>
							<Text className='text-base font-pretendard-semibold text-[#e8e8e8]'>
								갤러리에서 선택
							</Text>
							<Text className='text-xs mt-0.5 font-pretendard-regular text-[#78716C]'>
								저장된 사진을 불러오세요
							</Text>
						</View>
						<Ionicons name='chevron-forward' size={18} color='#57534E' />
					</View>
				</Pressable>

				{/* 직접 입력 — ghost */}
				<Pressable
					className='flex-row items-center justify-center gap-2 py-4'
					onPress={() => router.push('/manual')}
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					disabled={isLoading}
					accessibilityLabel='작품명 직접 입력'
					accessibilityRole='button'
				>
					<Ionicons name='pencil-outline' size={15} color='#78716C' />
					<Text className='text-sm text-[#78716C]'>작품명 직접 입력</Text>
				</Pressable>
			</Screen.BottomAbsolute>

			{/* 예시 바텀시트 */}
			<BottomSheetModal
				ref={bottomSheetRef}
				snapPoints={['60%']}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: '#1C1917' }}
				handleIndicatorStyle={{ backgroundColor: '#57534E' }}
			>
				<BottomSheetView className='px-6 pb-10'>
					<Text className='text-lg text-white mt-2 mb-1 font-pretendard-bold'>
						이렇게 찍어보세요
					</Text>
					<Text className='text-sm mb-5 font-pretendard-regular text-[#78716C]'>
						작품 옆 설명 안내판이나 작품 전체를 찍으면{'\n'}정확한 해설을 생성해요
					</Text>

					{/* 예시 이미지 가로 스크롤 — 일반 ScrollView로 gesture 충돌 방지 */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
						className='mb-6'
					>
						{EXAMPLES.map((ex, i) => (
							<View key={i} className='gap-2 w-[220px]'>
								<Image
									source={ex.image}
									className='rounded-xl w-[220px] h-[160px]'
									resizeMode='cover'
									accessibilityLabel={ex.caption}
								/>
								<Text className='text-xs text-center font-pretendard-regular text-[#A8A29E]'>
									{ex.caption}
								</Text>
							</View>
						))}
					</ScrollView>

					<Pressable
						className='w-full py-4 rounded-2xl items-center mb-3 bg-[#3B82F6]'
						onPress={handleConfirm}
						style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
						accessibilityLabel='확인했어요'
						accessibilityRole='button'
					>
						<Text className='text-white text-base font-pretendard-semibold'>
							확인했어요
						</Text>
					</Pressable>

					<Pressable
						className='items-center py-2'
						onPress={handleDismissForever}
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						accessibilityLabel='다시 보지 않기'
						accessibilityRole='button'
					>
						<Text className='text-sm font-pretendard-regular text-[#57534E]'>
							다시 보지 않기
						</Text>
					</Pressable>
				</BottomSheetView>
			</BottomSheetModal>
		</Screen>
	);
}
