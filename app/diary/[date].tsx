import { useTranslation } from 'react-i18next';
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
import { galleryStageHeight } from '@/src/utils/visitGallery';
import { uploadTicketVisitPhotos } from '@/src/utils/visitPhotos';

const MAX_VENUE_PHOTOS = 9;

export default function DiaryDateScreen() {
	const { t, i18n } = useTranslation();

	const router = useRouter();
	const params = useLocalSearchParams<{ date?: string; visit?: string }>();
	const insets = useSafeAreaInsets();
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();

	const dateKey = useMemo(() => {
		const raw = typeof params.date === 'string' ? params.date : '';
		return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
	}, [params.date]);

	const isEn = i18n.language === 'en';
	// 블록 메타 줄에 쓰는 관람일 — 한국어는 2026.10.17, 영어는 Oct 17, 2026
	const dateLabel = useMemo(() => {
		const [y, m, d] = dateKey.split('-').map(Number);
		if (isEn) {
			return new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			}).format(new Date(y, m - 1, d));
		}
		return `${y}.${m}.${d}`;
	}, [dateKey, isEn]);

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

	const isStoredKey = (key: string | null): key is string =>
		key !== null && visits[key] !== undefined;

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
	// 마지막 기록을 지우는 동안 "기록을 찾을 수 없어요" 화면이 번쩍 뜨지 않게 한다
	const [isLeavingAfterDelete, setIsLeavingAfterDelete] = useState(false);

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
	}, [activeMemoKey, visits]);

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
				t('diary.detail_permission_title'),
				useCamera ? t('diary.detail_permission_camera') : t('diary.detail_permission_photos'),
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
			Alert.alert(t('diary.detail_ticket_required_title'), t('diary.detail_ticket_required_body'));
			return;
		}
		if (!userId) {
			Alert.alert(t('diary.detail_login_required_title'), t('diary.detail_login_required_body'));
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
			Alert.alert(t('diary.detail_save_failed_title'), t('diary.detail_save_failed_body'));
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
		Alert.alert(t('diary.detail_delete_title'), t('diary.detail_delete_body'), [
			{ text: t('common.close'), style: 'cancel' },
			{
				text: t('common.delete'),
				style: 'destructive',
				onPress: async () => {
					const isLastEntry = dayVisitEntries.length <= 1;
					if (isLastEntry) setIsLeavingAfterDelete(true);
					try {
						await deleteVisit(visitKey);
					} catch (error) {
						setIsLeavingAfterDelete(false);
						throw error;
					}
					if (isLastEntry) handleBack();
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
					accessibilityLabel={t('diary.detail_back_a11y')}
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
				!isLeavingAfterDelete && (
					<Result
						icon="images-outline"
						title={t('diary.detail_not_found_title')}
						description={t('diary.detail_not_found_description')}
						actionLabel={t('diary.detail_not_found_action')}
						onAction={handleBack}
					/>
				)
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
							{t('diary.detail_preview_notice')}
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
							accessibilityLabel={t('diary.detail_editor_close_a11y')}
						/>
						<View
							className="max-h-full bg-white rounded-t-3xl px-6 pt-5"
							style={{ paddingBottom: insets.bottom + 40 }}
						>
							<View className="flex-row items-center justify-between mb-4">
								<Text className="text-ink font-pretendard-semibold text-[17px]">
									{t('diary.detail_editor_title')}
								</Text>
								<Pressable
									onPress={handleCloseEditor}
									hitSlop={8}
									disabled={savingPhotos}
									accessibilityLabel={t('common.close')}
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
											{t('diary.detail_ticket_photo')}
										</Text>
										<Pressable
											onPress={handlePickTicketPhoto}
											disabled={savingPhotos}
											accessibilityRole="button"
											accessibilityLabel={t('diary.detail_ticket_photo_change_a11y')}
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
											{t('diary.detail_venue_photos')}
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
														accessibilityLabel={t('diary.detail_venue_photo_remove_a11y')}
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
													accessibilityLabel={t('diary.detail_venue_photo_add_a11y')}
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
										placeholder={t('diary.detail_memo_placeholder')}
										placeholderTextColor={colors.gray500}
										multiline
										scrollEnabled={false}
										maxLength={400}
										accessibilityLabel={t('diary.detail_memo_a11y')}
										className="text-ink text-[15px] min-h-[120px]"
										style={{ lineHeight: 30 }}
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
