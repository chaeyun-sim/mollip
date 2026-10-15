import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
	useWindowDimensions,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import {
	DiaryGuidePlayer,
	type DiaryGuidePlayerHandle,
} from '@/src/components/archive/DiaryGuidePlayer';
import { StarRating } from '@/src/components/archive/StarRating';
import { VisitBlock } from '@/src/components/archive/VisitBlock';
import { Result } from '@/src/components/common/Result';
import { TextField } from '@/src/components/common/TextField';
import { dateKeyOf, isTicketVisit, useVisitStore } from '@/src/store/visitStore';
import { useAuthStore } from '@/src/store/authStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useHistoryStore } from '@/src/store/historyStore';
import type { HistoryItem } from '@/src/store/historyStore';
import { Screen } from '@/src/components/layout/Screen';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';
import { WEEKDAYS } from '@/src/constants/week';
import { buildMockVisits, getQaFixtureVisit } from '@/src/utils/devMockVisits';
import { galleryStageHeight } from '@/src/utils/visitGallery';
import { uploadTicketVisitPhotos } from '@/src/utils/visitPhotos';

const MAX_VENUE_PHOTOS = 9;
// TODO(임시): 다이어리 목록(diary.tsx)의 가짜 기록과 같은 개수 — 목록에서 누른 가짜 액자가 상세에서도 열리게 한다. 확인이 끝나면 함께 지운다
const MOCK_VISIT_COUNT = __DEV__ ? 60 : 0;

export default function DiaryDateScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ date?: string; visit?: string }>();
	const insets = useSafeAreaInsets();
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();

	const dateKey = useMemo(() => {
		const raw = typeof params.date === 'string' ? params.date : '';
		return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
	}, [params.date]);

	const dateLabel = useMemo(() => {
		const [y, m, d] = dateKey.split('-').map(Number);
		const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
		return `${y}.${m}.${d} ${weekday}요일`;
	}, [dateKey]);

	const {
		visits: storeVisits,
		setVisitMemo,
		setVisitRating,
		deleteVisit,
		updateVisitPhotos,
	} = useVisitStore(
		useShallow((s) => ({
			visits: s.visits,
			setVisitMemo: s.setVisitMemo,
			setVisitRating: s.setVisitRating,
			deleteVisit: s.deleteVisit,
			updateVisitPhotos: s.updateVisitPhotos,
		})),
	);
	// 개발용 가짜 기록은 읽기 전용 미리보기다 — 스토어에 없는 키라 아래 handle*에서 쓰기 경로를 모두 막는다.
	// 같은 키의 실제 기록이 스토어에 있으면 그쪽이 덮어쓰므로 정상 동작한다
	const visits = useMemo(() => {
		const qaVisit = __DEV__ && params.visit ? getQaFixtureVisit(params.visit) : undefined;
		return {
			...buildMockVisits(MOCK_VISIT_COUNT),
			...(qaVisit && params.visit ? { [params.visit]: qaVisit } : {}),
			...storeVisits,
		};
	}, [storeVisits, params.visit]);
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

	const isStoredKey = (key: string | null): key is string =>
		key !== null && storeVisits[key] !== undefined;

	const [playingGuide, setPlayingGuide] = useState<HistoryItem | null>(null);
	const playerRef = useRef<DiaryGuidePlayerHandle>(null);
	const [activeMemoKey, setActiveMemoKey] = useState<string | null>(null);
	const memoInputRef = useRef<TextInput>(null);
	const activeVisit = activeMemoKey ? visits[activeMemoKey] : null;
	const activeMemo = activeVisit?.memo || '';
	const activeRating = activeVisit?.rating || 0;
	const activeIsTicketVisit = activeVisit ? isTicketVisit(activeVisit) : false;

	const [showPreviewNotice, setShowPreviewNotice] = useState(false);
	// 사진이 상태바 뒤까지 이어지는 상단 구간인지, 첫 블록 히어로에 실제 사진이 있는지 — 상태바 글자색·버튼 면을 고른다
	const [isOverHero, setIsOverHero] = useState(true);
	const [heroHasPhoto, setHeroHasPhoto] = useState(false);

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
		if (!showPreviewNotice) return;
		const timer = setTimeout(() => setShowPreviewNotice(false), 2600);
		return () => clearTimeout(timer);
	}, [showPreviewNotice]);

	// 편집 중인 기록이 스토어에서 사라지면(다른 곳에서 삭제·동기화) 시트를 닫아 유령 레코드를 만들지 않는다
	useEffect(() => {
		if (activeMemoKey !== null && !isStoredKey(activeMemoKey)) setActiveMemoKey(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeMemoKey, storeVisits]);

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
		if (!photosDirty || !isStoredKey(activeMemoKey)) {
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

	// 뒤로가기 버튼(안전 영역 아래 8 + 44pt)까지 사진이 보이는 동안만 "히어로 위"로 본다
	const heroOverThreshold = galleryStageHeight(windowWidth, windowHeight) - insets.top - 56;
	const hasHeroPhoto = dayVisitEntries.length > 0 && heroHasPhoto;
	const isLightOverPhoto = hasHeroPhoto && isOverHero;

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const over = event.nativeEvent.contentOffset.y < heroOverThreshold;
		setIsOverHero((prev) => (prev === over ? prev : over));
	};

	const handleBack = () => {
		if (router.canGoBack()) router.back();
		else router.replace('/(tabs)/diary');
	};

	const handleEditPress = (visitKey: string) => {
		if (!isStoredKey(visitKey)) {
			setShowPreviewNotice(true);
			return;
		}
		setActiveMemoKey(visitKey);
	};

	const handleDeletePress = (visitKey: string) => {
		if (!isStoredKey(visitKey)) {
			setShowPreviewNotice(true);
			return;
		}
		Alert.alert('기록 삭제', '이 기록을 삭제할까요?', [
			{ text: '닫기', style: 'cancel' },
			{
				text: '삭제',
				style: 'destructive',
				onPress: async () => {
					await deleteVisit(visitKey);
					if (dayVisitEntries.length <= 1) handleBack();
				},
			},
		]);
	};

	return (
		<Screen variant="warm" className="px-0" edges={['left', 'right']}>
			{/* 사진 위로 올라가는 상태바 — 사진 위에서는 흰 글자, 스크롤로 사진이 지나가면 어두운 글자 */}
			<StatusBar style={isLightOverPhoto ? 'light' : 'dark'} />

			{/* 사진이 지나간 뒤 상태바 뒤에 본문이 비치지 않게 덮는 띠 */}
			{!isOverHero && (
				<View
					pointerEvents="none"
					className="absolute inset-x-0 top-0 z-10 bg-bg-light"
					style={{ height: insets.top }}
				/>
			)}

			{/* 투명 absolute 헤더 — 콘텐츠를 밀지 않고 사진 위에 뜬다. 편집 시트(z 10000)보다 아래 */}
			<View className="absolute left-4 z-20" style={{ top: insets.top + 8 }}>
				<Pressable
					onPress={handleBack}
					hitSlop={4}
					accessibilityRole="button"
					accessibilityLabel="뒤로 가기"
					className={cn(
						'h-11 w-11 items-center justify-center rounded-full',
						isLightOverPhoto ? 'bg-black/50' : 'border-[0.5px] border-divider bg-white/90',
					)}
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Ionicons
						name="arrow-back"
						size={22}
						color={isLightOverPhoto ? colors.white : colors.ink}
					/>
				</Pressable>
			</View>

			{dayVisitEntries.length > 0 ? (
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					scrollEventThrottle={16}
					onScroll={handleScroll}
					// 사진이 기기 최상단까지 닿도록 시스템이 상단 인셋을 자동으로 더하지 못하게 한다
					contentInsetAdjustmentBehavior="never"
					automaticallyAdjustContentInsets={false}
					contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
				>
					{dayVisitEntries.map(([visitKey, visit], index) => (
						<View
							key={visitKey}
							className={index > 0 ? 'mt-10 border-t-[0.5px] border-divider pt-10' : undefined}
						>
							<VisitBlock
								visit={visit}
								dateKey={dateKey}
								dateLabel={dateLabel}
								playlistTitles={playlist.map((p) => p.title)}
								onEditMemo={() => handleEditPress(visitKey)}
								onDelete={() => handleDeletePress(visitKey)}
								heroTopInset={index === 0 ? insets.top : 0}
								onHeroPhotoChange={index === 0 ? setHeroHasPhoto : undefined}
								dayChatItems={dayChatItems}
								dayHistoryItems={dayHistoryItems}
								onPlayGuide={(item) => {
									setPlayingGuide(item);
									playerRef.current?.expand();
								}}
							/>
						</View>
					))}
				</ScrollView>
			) : (
				<Result
					icon="images-outline"
					title="기록을 찾을 수 없어요"
					description="삭제되었거나 아직 불러오지 못한 기록이에요."
					actionLabel="돌아가기"
					onAction={handleBack}
				/>
			)}

			{showPreviewNotice && (
				<View
					pointerEvents="none"
					className="absolute inset-x-6 items-center"
					style={{ bottom: insets.bottom + 24 }}
				>
					<View
						accessible
						accessibilityLiveRegion="polite"
						className="rounded-full bg-gray800 px-4 py-2.5"
					>
						<Text className="font-pretendard-medium text-[13px] text-white">
							미리보기용 샘플이라 수정·삭제할 수 없어요
						</Text>
					</View>
				</View>
			)}

			<DiaryGuidePlayer ref={playerRef} item={playingGuide} onClose={() => setPlayingGuide(null)} />

			{/* 뒤로가기 헤더(z 20)·상태바 띠(z 10)보다 위에 둬야 시트 뒤로 비치지 않는다 */}
			{activeMemoKey !== null && (
				<View className="absolute inset-0 z-[10000]">
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						className="flex-1 justify-end"
						style={{ paddingTop: insets.top }}
					>
						<Pressable
							className="flex-1 bg-black/50"
							onPress={handleCloseEditor}
							accessibilityRole="button"
							accessibilityLabel="감상 편집 닫기"
						/>
						<View
							className="max-h-full bg-white rounded-t-3xl px-6 pt-5"
							style={{ paddingBottom: insets.bottom + 40 }}
						>
							<View className="flex-row items-center justify-between mb-4">
								<Text className="text-ink font-pretendard-semibold text-[17px]">
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
										<ActivityIndicator size="small" color={colors.brand} />
									) : (
										<Ionicons name="checkmark" size={22} color={colors.brand} />
									)}
								</Pressable>
							</View>
							{/* 키보드가 올라와 시트가 화면보다 커져도 제목 줄(닫기)은 고정하고 본문만 스크롤한다 */}
							<ScrollView
								keyboardShouldPersistTaps="handled"
								showsVerticalScrollIndicator={false}
								className="shrink"
							>
								<View className="mb-4">
									<StarRating
										value={activeRating}
										onChange={(n) => isStoredKey(activeMemoKey) && setVisitRating(activeMemoKey, n)}
										size={26}
									/>
								</View>
								{activeIsTicketVisit && (
									<View className="mb-5">
										<Text className="text-gray600 text-[13px] font-pretendard-medium mb-2">
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
													className="w-full h-[140px] bg-surface-neutral"
												/>
											) : (
												<View className="w-full h-[140px] bg-surface-neutral items-center justify-center">
													<Ionicons name="camera-outline" size={28} color={colors.gray500} />
												</View>
											)}
										</Pressable>

										<Text className="text-gray600 text-[13px] font-pretendard-medium mb-2">
											현장 사진
										</Text>
										<View className="flex-row flex-wrap gap-2">
											{editVenuePhotos.map((uri) => (
												<View key={uri} className="w-[72px] h-[72px]">
													<Image
														source={{ uri }}
														className="h-full w-full rounded-xl bg-surface-neutral"
													/>
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
													className="w-[72px] h-[72px] items-center justify-center rounded-xl bg-surface-neutral"
													style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
												>
													<Ionicons name="add" size={22} color={colors.gray600} />
												</Pressable>
											)}
										</View>
									</View>
								)}
								<View>
									<TextField
										ref={memoInputRef}
										variant="plain"
										value={activeMemo}
										onChangeText={(text) =>
											isStoredKey(activeMemoKey) && setVisitMemo(activeMemoKey, text)
										}
										placeholder="오늘 기억하고 싶은 것을 적어보세요"
										placeholderTextColor={colors.gray500}
										multiline
										scrollEnabled={false}
										maxLength={400}
										accessibilityLabel="관람 메모 입력"
										className="text-ink text-[15px] leading-[24px] min-h-[120px]"
									/>
								</View>
							</ScrollView>
						</View>
					</KeyboardAvoidingView>
				</View>
			)}
		</Screen>
	);
}
