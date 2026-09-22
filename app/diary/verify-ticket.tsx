import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/src/components/common/Button';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { ProgressBar } from '@/src/components/common/ProgressBar';
import { TextField } from '@/src/components/common/TextField';
import { Screen } from '@/src/components/layout/Screen';
import { useAuthStore } from '@/src/store/authStore';
import { dateKeyFrom, makeVisitKey, useVisitStore } from '@/src/store/visitStore';
import { formatDate } from '@/src/utils/formatDate';
import { uploadTicketVisitPhotos } from '@/src/utils/visitPhotos';

const MIN_VENUE_PHOTOS = 3;
const MAX_VENUE_PHOTOS = 9;

export default function VerifyTicketScreen() {
	const router = useRouter();
	const [step, setStep] = useState<'ticket' | 'photos'>('ticket');
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [venue, setVenue] = useState('');
	const [visitDate, setVisitDate] = useState(() => new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [venuePhotos, setVenuePhotos] = useState<string[]>([]);
	const [titleError, setTitleError] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [photosError, setPhotosError] = useState(false);
	const [gridWidth, setGridWidth] = useState(0);
	const [saving, setSaving] = useState(false);
	const { recordExhibition, confirmVisit } = useVisitStore(
		useShallow((s) => ({ recordExhibition: s.recordExhibition, confirmVisit: s.confirmVisit })),
	);
	const userId = useAuthStore((s) => s.user?.id);

	const dateLabel = formatDate(undefined, {
		year: visitDate.getFullYear(),
		month: visitDate.getMonth() + 1,
		day: visitDate.getDate(),
	});

	const canConfirm = venuePhotos.length >= MIN_VENUE_PHOTOS;
	const tileSize = gridWidth > 0 ? (gridWidth - 16) / 3 : 0;

	const pickImage = async (useCamera: boolean, multiple: boolean) => {
		const permission = useCamera
			? await ImagePicker.requestCameraPermissionsAsync()
			: await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert(
				'권한 필요',
				useCamera
					? '카메라를 사용하려면 설정에서 카메라 권한을 허용해 주세요.'
					: '사진을 선택하려면 설정에서 사진 접근을 허용해 주세요.',
			);
			return [];
		}

		const remaining = MAX_VENUE_PHOTOS - venuePhotos.length;
		const result = useCamera
			? await ImagePicker.launchCameraAsync({ quality: 0.8 })
			: await ImagePicker.launchImageLibraryAsync({
					quality: 0.8,
					mediaTypes: ['images'],
					allowsMultipleSelection: multiple,
					selectionLimit: multiple ? remaining : 1,
				});

		if (result.canceled) return [];
		return result.assets.map((asset) => asset.uri);
	};

	const handlePickTicket = async (useCamera: boolean) => {
		const [uri] = await pickImage(useCamera, false);
		if (!uri) return;
		setImageUri(uri);
		setImageError(false);
	};

	const handleAddVenuePhoto = async () => {
		if (venuePhotos.length >= MAX_VENUE_PHOTOS) return;
		const uris = await pickImage(false, true);
		if (uris.length === 0) return;
		setVenuePhotos((prev) => [...prev, ...uris].slice(0, MAX_VENUE_PHOTOS));
		setPhotosError(false);
	};

	const handleNext = () => {
		const trimmedTitle = title.trim();
		if (!imageUri) {
			setImageError(true);
			return;
		}
		if (!trimmedTitle) {
			setTitleError(true);
			return;
		}
		setStep('photos');
	};

	const handleConfirm = async () => {
		if (!imageUri || !canConfirm) {
			setPhotosError(true);
			return;
		}

		if (!userId) {
			Alert.alert('로그인 필요', '티켓 인증은 로그인 후 저장돼요.');
			return;
		}

		const trimmedTitle = title.trim();
		const dateKey = dateKeyFrom(visitDate);
		setSaving(true);
		try {
			const { ticketUrl, venueUrls } = await uploadTicketVisitPhotos(
				userId,
				dateKey,
				imageUri,
				venuePhotos,
			);
			recordExhibition(dateKey, null, {
				title: trimmedTitle,
				venue: venue.trim() || undefined,
				thumbnail: ticketUrl,
				venuePhotos: venueUrls,
			});
			confirmVisit(makeVisitKey(dateKey, null, trimmedTitle), { signatureSvg: '' });
			router.replace('/(tabs)/diary');
		} catch (error) {
			console.warn('[visit] ticket upload failed:', error);
			Alert.alert('저장 실패', '사진을 서버에 올리지 못했어요. 잠시 후 다시 시도해 주세요.');
		} finally {
			setSaving(false);
		}
	};

	const stepProgress = step === 'ticket' ? 0.5 : 1;

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back
					color="muted"
					onPress={step === 'photos' ? () => setStep('ticket') : undefined}
				/>
				<Screen.Header.Center>{step === 'ticket' ? '티켓 인증' : '현장 사진'}</Screen.Header.Center>
			</Screen.Header>
			<ProgressBar progress={stepProgress} className="mb-4" />

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerClassName="pb-10 px-1 pt-5"
					keyboardShouldPersistTaps="handled"
				>
					{step === 'ticket' ? (
						<>
							{imageUri ? (
								<Pressable
									onPress={() => handlePickTicket(false)}
									accessibilityRole="button"
									accessibilityLabel="티켓 사진 다시 선택"
									className="mb-6 overflow-hidden rounded-2xl"
									style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
								>
									<Image source={{ uri: imageUri }} className="w-full h-[220px] bg-bg-tonal" />
								</Pressable>
							) : (
								<View className="gap-2 mb-6">
									<Pressable
										onPress={() => handlePickTicket(true)}
										accessibilityRole="button"
										accessibilityLabel="티켓 촬영"
										className="flex-row items-center gap-3 rounded-2xl bg-bg-tonal px-4 py-4"
										style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
									>
										<Ionicons name="camera-outline" size={22} className="text-gray900" />
										<View className="flex-1">
											<Text className="font-pretendard-semibold text-gray900 text-[15px]">
												티켓 촬영
											</Text>
											<Text className="font-pretendard-regular text-gray500 text-[13px] mt-0.5">
												카메라로 실물 티켓을 찍어요
											</Text>
										</View>
									</Pressable>
									<Pressable
										onPress={() => handlePickTicket(false)}
										accessibilityRole="button"
										accessibilityLabel="앨범에서 선택"
										className="flex-row items-center gap-3 rounded-2xl bg-bg-tonal px-4 py-4"
										style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
									>
										<Ionicons name="image-outline" size={22} className="text-gray900" />
										<View className="flex-1">
											<Text className="font-pretendard-semibold text-gray900 text-[15px]">
												앨범에서 선택
											</Text>
											<Text className="font-pretendard-regular text-gray500 text-[13px] mt-0.5">
												저장해 둔 티켓 사진을 고르세요
											</Text>
										</View>
									</Pressable>
									{imageError && (
										<Text className="font-pretendard-regular text-error text-[13px]">
											티켓 사진을 추가해 주세요
										</Text>
									)}
								</View>
							)}

							<Text className="font-pretendard-semibold text-gray500 text-[12px] tracking-wider mb-2">
								관람일
							</Text>
							<Pressable
								onPress={() => setShowDatePicker(true)}
								accessibilityRole="button"
								accessibilityLabel={`관람일 ${dateLabel}`}
								className="flex-row items-center justify-between rounded-2xl border border-[rgba(28,25,23,0.1)] h-[52px] px-4 mb-5"
								style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
							>
								<Text className="font-pretendard-regular text-gray900 text-[15px]">
									{dateLabel}
								</Text>
								<Ionicons name="calendar-outline" size={18} className="text-gray500" />
							</Pressable>

							<Text className="font-pretendard-semibold text-gray500 text-[12px] tracking-wider mb-2">
								전시명
							</Text>
							<TextField
								value={title}
								onChangeText={(text) => {
									setTitle(text);
									setTitleError(false);
								}}
								placeholder="관람한 전시 이름"
								error={titleError}
								returnKeyType="next"
							/>
							{titleError && (
								<Text className="font-pretendard-regular text-error text-[13px] mt-1.5">
									전시 이름을 입력해 주세요
								</Text>
							)}

							<Text className="font-pretendard-semibold text-gray500 text-[12px] tracking-wider mb-2 mt-5">
								장소
							</Text>
							<TextField
								value={venue}
								onChangeText={setVenue}
								placeholder="미술관·전시장 (선택)"
								returnKeyType="done"
								onSubmitEditing={handleNext}
							/>
						</>
					) : (
						<>
							<Text className="font-pretendard-regular text-gray600 text-[14px] leading-[21px] mb-4">
								전시장에서 찍은 사진을 {MIN_VENUE_PHOTOS}장 이상 올려 주세요
							</Text>

							<View
								className="flex-row flex-wrap gap-2"
								onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
							>
								{venuePhotos.map((uri) => (
									<View key={uri} style={{ width: tileSize, height: tileSize }}>
										<Image source={{ uri }} className="h-full w-full rounded-2xl bg-bg-tonal" />
										<Pressable
											onPress={() => setVenuePhotos((prev) => prev.filter((item) => item !== uri))}
											accessibilityRole="button"
											accessibilityLabel="사진 삭제"
											hitSlop={6}
											className="absolute top-1.5 right-1.5 h-6 w-6 items-center justify-center rounded-full bg-black/55"
										>
											<Ionicons name="close" size={14} className="text-white" />
										</Pressable>
									</View>
								))}
								{venuePhotos.length < MAX_VENUE_PHOTOS && (
									<Pressable
										onPress={handleAddVenuePhoto}
										accessibilityRole="button"
										accessibilityLabel="현장 사진 추가"
										className="aspect-square w-[30%] h-full items-center justify-center rounded-2xl bg-bg-tonal"
										style={({ pressed }) => ({
											width: tileSize,
											height: tileSize,
											opacity: pressed ? 0.75 : 1,
										})}
										disabled={saving || venuePhotos.length >= MAX_VENUE_PHOTOS}
									>
										<Ionicons name="add" size={28} className="text-gray500" />
										<Text className="font-pretendard-regular text-gray500 text-[12px] mt-1">
											추가
										</Text>
									</Pressable>
								)}
							</View>
							{photosError && (
								<Text className="font-pretendard-regular text-error text-[13px] mt-3">
									현장 사진을 {MIN_VENUE_PHOTOS}장 이상 올려 주세요
								</Text>
							)}
						</>
					)}
				</ScrollView>
				<Screen.BottomAbsolute className="bottom-10 mt-8">
					{step === 'ticket' ? (
						<Button onPress={handleNext} accessibilityLabel="다음" tone="inverse" haptic="light">
							다음
						</Button>
					) : (
						<Button
							onPress={handleConfirm}
							accessibilityLabel="티켓 인증하기"
							tone="inverse"
							haptic="light"
							disabled={!canConfirm}
							loading={saving}
						>
							인증하기
						</Button>
					)}
				</Screen.BottomAbsolute>
			</KeyboardAvoidingView>

			<DatePickerModal
				visible={showDatePicker}
				value={visitDate}
				maximumDate={new Date()}
				onChange={setVisitDate}
				onDismiss={() => setShowDatePicker(false)}
				onReset={() => setVisitDate(new Date())}
			/>
		</Screen>
	);
}
