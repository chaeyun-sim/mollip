import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
	Pressable,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { Screen } from '../src/components/layout/Screen';
import * as Haptics from 'expo-haptics';
import { store } from '../src/store';
import { useChatStore } from '../src/store/chatStore';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';

const STORAGE_KEY = 'example_modal_hidden';

const EXAMPLES = [
	{
		image: require('../assets/images/example/example-1.png'),
		caption: '작품 옆 설명 안내판을 찍어보세요',
	},
	{
		image: require('../assets/images/example/example-2.png'),
		caption: '작품 전체가 나오도록 찍어도 좋아요',
	},
];

export default function IndexScreen() {
	const router = useRouter();
	const clearChat = useChatStore((s) => s.clear);
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const pendingCameraRef = useRef<boolean>(false);

	const [isLoading, setIsLoading] = useState(false);

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
			? await ImagePicker.launchCameraAsync({ quality: 0.8 })
			: await ImagePicker.launchImageLibraryAsync({
					quality: 0.8,
					mediaTypes: ['images'],
				});

		if (result.canceled) {
			setIsLoading(false);
			return;
		}

		const asset = result.assets[0];
		const base64 = await FileSystem.readAsStringAsync(asset.uri, {
			encoding: FileSystem.EncodingType.Base64,
		});
		store.imageBase64 = base64;
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
				<ScreenHeader.Back
					onPress={() => {
						router.back();
					}}
				/>
			</Screen.Header>

			{/* 상단 타이틀 */}
			<View className='mt-3 gap-2'>
				<Text className='text-3xl text-white mb-2 font-pretendard-bold'>
					작품 해설 생성기
				</Text>
				<Text className='text-md leading-6 text-[#78716C]'>
					작품 설명을 촬영하거나 사진을 선택하면{'\n'}AI가 바로 해설을 만들어드려요
				</Text>
			</View>

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
						className='flex-row items-center gap-4 px-6 py-5 bg-[#1C1917]'
						style={{
							borderWidth: StyleSheet.hairlineWidth,
							borderColor: 'rgba(255,255,255,0.08)',
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
						<Text className='text-sm font-pretendard-regular text-[#57534E]'>다시 보지 않기</Text>
					</Pressable>
				</BottomSheetView>
			</BottomSheetModal>
		</Screen>
	);
}
