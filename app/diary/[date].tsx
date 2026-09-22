import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import {
	DiaryGuidePlayer,
	type DiaryGuidePlayerHandle,
} from '@/src/components/archive/DiaryGuidePlayer';
import { StarRating } from '@/src/components/archive/StarRating';
import { VisitBlock } from '@/src/components/archive/VisitBlock';
import { TextField } from '@/src/components/common/TextField';
import { dateKeyOf, isTicketVisit, useVisitStore } from '@/src/store/visitStore';
import { useAuthStore } from '@/src/store/authStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useHistoryStore } from '@/src/store/historyStore';
import type { HistoryItem } from '@/src/store/historyStore';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { WEEKDAYS } from '@/src/constants/week';
import { uploadTicketVisitPhotos } from '@/src/utils/visitPhotos';

const MAX_VENUE_PHOTOS = 9;

export default function DiaryDateScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ date?: string; visit?: string }>();
	const insets = useSafeAreaInsets();
	const memoScrollRef = useRef<ScrollView>(null);

	const dateKey = useMemo(() => {
		const raw = typeof params.date === 'string' ? params.date : '';
		return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
	}, [params.date]);

	const dateLabel = useMemo(() => {
		const [y, m, d] = dateKey.split('-').map(Number);
		const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
		return `${y}.${m}.${d} ${weekday}요일`;
	}, [dateKey]);

	const { visits, setVisitMemo, setVisitRating, deleteVisit, updateVisitPhotos } = useVisitStore(
		useShallow((s) => ({
			visits: s.visits,
			setVisitMemo: s.setVisitMemo,
			setVisitRating: s.setVisitRating,
			deleteVisit: s.deleteVisit,
			updateVisitPhotos: s.updateVisitPhotos,
		})),
	);
	const playlist = useImmersiveStore((s) => s.playlist);
	const historyItems = useHistoryStore((s) => s.items);
	const userId = useAuthStore((s) => s.user?.id);

	// visits 키는 "날짜::전시" — 이 날짜에 해당하는 확정 기록을 전부 모은다(여러 개일 수 있음)
	// visit 쿼리 파라미터가 있으면(캘린더에서 여러 개 중 하나를 골라 들어온 경우) 그 방문 하나로 좁힌다
	const dayVisitEntries = useMemo(() => {
		const all = Object.entries(visits).filter(
			([key, v]) => dateKeyOf(key) === dateKey && v.status === 'confirmed',
		);
		if (params.visit) return all.filter(([key]) => key === params.visit);
		return all;
	}, [visits, dateKey, params.visit]);

	const [playingGuide, setPlayingGuide] = useState<HistoryItem | null>(null);
	const playerRef = useRef<DiaryGuidePlayerHandle>(null);
	const [activeMemoKey, setActiveMemoKey] = useState<string | null>(null);
	const memoInputRef = useRef<TextInput>(null);
	const activeVisit = activeMemoKey ? visits[activeMemoKey] : null;
	const activeMemo = activeVisit?.memo || '';
	const activeRating = activeVisit?.rating || 0;
	const activeIsTicketVisit = activeVisit ? isTicketVisit(activeVisit) : false;

	const [editTicketUri, setEditTicketUri] = useState<string | null>(null);
	const [editVenuePhotos, setEditVenuePhotos] = useState<string[]>([]);
	const [photosDirty, setPhotosDirty] = useState(false);
	const [savingPhotos, setSavingPhotos] = useState(false);

	useEffect(() => {
		if (!activeMemoKey) return;
		const timer = setTimeout(() => memoInputRef.current?.focus(), 80);
		return () => clearTimeout(timer);
	}, [activeMemoKey]);

	useEffect(() => {
		if (!activeMemoKey) return;
		const visit = visits[activeMemoKey];
		setEditTicketUri(visit?.thumbnail ?? null);
		setEditVenuePhotos(visit?.venuePhotos ?? []);
		setPhotosDirty(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeMemoKey]);

	const pickVisitPhotos = async (useCamera: boolean, multiple: boolean, selectionLimit: number) => {
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
		const result = useCamera
			? await ImagePicker.launchCameraAsync({ quality: 0.8 })
			: await ImagePicker.launchImageLibraryAsync({
					quality: 0.8,
					mediaTypes: ['images'],
					allowsMultipleSelection: multiple,
					selectionLimit: multiple ? selectionLimit : 1,
				});
		if (result.canceled) return [];
		return result.assets.map((asset) => asset.uri);
	};

	const handlePickTicketPhoto = async () => {
		const [uri] = await pickVisitPhotos(false, false, 1);
		if (!uri) return;
		setEditTicketUri(uri);
		setPhotosDirty(true);
	};

	const handleAddVenuePhoto = async () => {
		if (editVenuePhotos.length >= MAX_VENUE_PHOTOS) return;
		const uris = await pickVisitPhotos(false, true, MAX_VENUE_PHOTOS - editVenuePhotos.length);
		if (uris.length === 0) return;
		setEditVenuePhotos((prev) => [...prev, ...uris].slice(0, MAX_VENUE_PHOTOS));
		setPhotosDirty(true);
	};

	const handleRemoveVenuePhoto = (uri: string) => {
		setEditVenuePhotos((prev) => prev.filter((item) => item !== uri));
		setPhotosDirty(true);
	};

	const handleCloseEditor = async () => {
		if (savingPhotos) return;
		if (!photosDirty || !activeMemoKey) {
			setActiveMemoKey(null);
			return;
		}
		if (!editTicketUri) {
			Alert.alert('티켓 사진 필요', '티켓 사진은 반드시 있어야 해요.');
			return;
		}
		if (!userId) {
			Alert.alert('로그인 필요', '사진 수정은 로그인 후 저장돼요.');
			setActiveMemoKey(null);
			return;
		}
		setSavingPhotos(true);
		try {
			const { ticketUrl, venueUrls } = await uploadTicketVisitPhotos(
				userId,
				dateKeyOf(activeMemoKey),
				editTicketUri,
				editVenuePhotos,
			);
			updateVisitPhotos(activeMemoKey, { thumbnail: ticketUrl, venuePhotos: venueUrls });
		} catch (error) {
			console.warn('[visit] photo update failed:', error);
			Alert.alert('저장 실패', '사진을 서버에 올리지 못했어요. 잠시 후 다시 시도해 주세요.');
			setSavingPhotos(false);
			return;
		}
		setSavingPhotos(false);
		setActiveMemoKey(null);
	};

	const dayChatItems = useMemo(
		() =>
			historyItems.filter(
				(item) =>
					item.savedAt.startsWith(dateKey) && item.chatMessages && item.chatMessages.length > 0,
			),
		[historyItems, dateKey],
	);

	const dayHistoryItems = useMemo(
		() =>
			historyItems.filter(
				(item) => item.savedAt.startsWith(dateKey) && item.text.trim().length > 0,
			),
		[historyItems, dateKey],
	);

	const handleDeletePress = (visitKey: string) => {
		Alert.alert('티켓 삭제', '이 티켓을 삭제할까요?', [
			{ text: '닫기', style: 'cancel' },
			{
				text: '삭제',
				style: 'destructive',
				onPress: async () => {
					await deleteVisit(visitKey);
					if (dayVisitEntries.length <= 1) router.back();
				},
			},
		]);
	};

	return (
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Back color="white" onPress={() => router.back()} />
				<ScreenHeader.Center>
					<Text className="text-[16px] text-white font-pretendard-semibold">{dateLabel}</Text>
				</ScreenHeader.Center>
			</ScreenHeader>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerClassName="pb-10"
			>
				{dayVisitEntries.map(([visitKey, visit]) => (
					<VisitBlock
						key={visitKey}
						visit={visit}
						dateKey={dateKey}
						dateLabel={dateLabel}
						playlistTitles={playlist.map((p) => p.title)}
						onEditMemo={() => setActiveMemoKey(visitKey)}
						onDelete={() => handleDeletePress(visitKey)}
						dayChatItems={dayChatItems}
						dayHistoryItems={dayHistoryItems}
						onPlayGuide={(item) => {
							setPlayingGuide(item);
							playerRef.current?.expand();
						}}
					/>
				))}
			</ScrollView>

			<DiaryGuidePlayer ref={playerRef} item={playingGuide} onClose={() => setPlayingGuide(null)} />

			{activeMemoKey !== null && (
				<View className="absolute inset-0 z-50">
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						className="flex-1 justify-end"
					>
						<Pressable
							className="flex-1 bg-black/50"
							onPress={handleCloseEditor}
							accessibilityRole="button"
							accessibilityLabel="감상 편집 닫기"
						/>
						<View
							className="bg-gray900 rounded-t-3xl px-6 pt-5"
							style={{ paddingBottom: insets.bottom + 40 }}
						>
							<View className="flex-row items-center justify-between mb-4">
								<Text className="text-white font-pretendard-semibold text-[17px]">
									나의 감상 편집
								</Text>
								<Pressable
									onPress={handleCloseEditor}
									hitSlop={8}
									disabled={savingPhotos}
									accessibilityLabel="닫기"
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									{savingPhotos ? (
										<ActivityIndicator size="small" color="#fff" />
									) : (
										<Ionicons name="checkmark" size={22} color="white" />
									)}
								</Pressable>
							</View>
							<View className="mb-4">
								<StarRating
									value={activeRating}
									onChange={(n) => activeMemoKey && setVisitRating(activeMemoKey, n)}
									size={26}
									tone="dark"
								/>
							</View>
							{activeIsTicketVisit && (
								<View className="mb-5">
									<Text className="text-white/70 text-[13px] font-pretendard-medium mb-2">
										티켓 사진
									</Text>
									<Pressable
										onPress={handlePickTicketPhoto}
										disabled={savingPhotos}
										accessibilityRole="button"
										accessibilityLabel="티켓 사진 변경"
										className="mb-4 overflow-hidden rounded-2xl"
										style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
									>
										{editTicketUri ? (
											<Image
												source={{ uri: editTicketUri }}
												className="w-full h-[140px] bg-gray800"
											/>
										) : (
											<View className="w-full h-[140px] bg-gray800 items-center justify-center">
												<Ionicons name="camera-outline" size={28} color="rgba(255,255,255,0.4)" />
											</View>
										)}
									</Pressable>

									<Text className="text-white/70 text-[13px] font-pretendard-medium mb-2">
										현장 사진
									</Text>
									<View className="flex-row flex-wrap gap-2">
										{editVenuePhotos.map((uri) => (
											<View key={uri} className="w-[72px] h-[72px]">
												<Image source={{ uri }} className="h-full w-full rounded-xl bg-gray800" />
												<Pressable
													onPress={() => handleRemoveVenuePhoto(uri)}
													disabled={savingPhotos}
													accessibilityRole="button"
													accessibilityLabel="현장 사진 삭제"
													hitSlop={6}
													className="absolute top-1 right-1 h-5 w-5 items-center justify-center rounded-full bg-black/60"
												>
													<Ionicons name="close" size={12} color="#fff" />
												</Pressable>
											</View>
										))}
										{editVenuePhotos.length < MAX_VENUE_PHOTOS && (
											<Pressable
												onPress={handleAddVenuePhoto}
												disabled={savingPhotos}
												accessibilityRole="button"
												accessibilityLabel="현장 사진 추가"
												className="w-[72px] h-[72px] items-center justify-center rounded-xl bg-gray800"
												style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
											>
												<Ionicons name="add" size={22} color="rgba(255,255,255,0.5)" />
											</Pressable>
										)}
									</View>
								</View>
							)}
							<ScrollView
								ref={memoScrollRef}
								keyboardShouldPersistTaps="handled"
								showsVerticalScrollIndicator={false}
								className="max-h-[200px]"
								onContentSizeChange={() => memoScrollRef.current?.scrollToEnd({ animated: false })}
							>
								<TextField
									ref={memoInputRef}
									variant="plain"
									tone="dark"
									value={activeMemo}
									onChangeText={(text) => activeMemoKey && setVisitMemo(activeMemoKey, text)}
									placeholder="오늘 기억하고 싶은 것을 적어보세요"
									placeholderTextColor="rgba(255,255,255,0.3)"
									multiline
									scrollEnabled={false}
									maxLength={400}
									accessibilityLabel="관람 메모 입력"
									className="text-white text-[15px] leading-[24px] min-h-[120px]"
								/>
							</ScrollView>
						</View>
					</KeyboardAvoidingView>
				</View>
			)}
		</Screen>
	);
}
