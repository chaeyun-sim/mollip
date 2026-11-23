import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { BookmarkedAudioRowSkeleton } from '@/src/components/bookmark/BookmarkedAudioRowSkeleton';
import { Divider } from '@/src/components/common/Divider';
import { IconButton } from '@/src/components/common/IconButton';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { Result } from '@/src/components/common/Result';
import { AudioEmptyIllustration } from '@/src/components/illustration/AudioEmptyIllustration';
import { DownloadStatusBadge } from '@/src/components/guide/DownloadStatusBadge';
import { colors } from '@/src/constants/colors';
import { useSubscription } from '@/src/hooks/useSubscription';
import { useTTS } from '@/src/hooks/useTTS';
import { useAuthStore } from '@/src/store/authStore';
import { useBookmarkAudioStore } from '@/src/store/bookmarkAudioStore';
import { useHistoryStore, type HistoryItem } from '@/src/store/historyStore';
import {
	computeCacheKey,
	type DownloadTarget,
	getBatchProgress,
	hasIdle,
	isAnyLoading,
	useOfflineDownloadStore,
} from '@/src/store/offlineDownloadStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { formatDate } from '@/src/utils/formatDate';
import { formatOfflineAudioSize, getOfflineAudioTotalSizeBytes } from '@/src/utils/offlineAudio';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';

export function BookmarkedAudioList() {
	const { t } = useTranslation();

	const router = useRouter();

	// 상태 관리
	const sheetRef = useRef<BottomSheet>(null);
	const [selected, setSelected] = useState<HistoryItem | null>(null);

	// Zustand 상태 관리
	const session = useAuthStore((s) => s.session);
	const { isPremium, isLoading: subscriptionLoading } = useSubscription();
	const { historyItems, updateHistory, isHistoryLoaded } = useHistoryStore(
		useShallow((s) => ({
			historyItems: s.items,
			updateHistory: s.update,
			isHistoryLoaded: s.isRemoteLoaded,
		})),
	);
	const { bookmarkedIds, toggleBookmark, isBookmarkLoaded } = useBookmarkAudioStore(
		useShallow((s) => ({
			bookmarkedIds: s.ids,
			toggleBookmark: s.toggle,
			isBookmarkLoaded: s.isRemoteLoaded,
		})),
	);
	const { voiceId, voiceSpeed } = useSettingsStore(
		useShallow((s) => ({ voiceId: s.voiceId, voiceSpeed: s.voiceSpeed })),
	);
	const {
		downloadStatuses,
		downloadBatchIds,
		startDownload,
		retryDownload,
		deleteDownload,
		deleteAllDownloads,
	} = useOfflineDownloadStore(
		useShallow((s) => ({
			downloadStatuses: s.statuses,
			downloadBatchIds: s.batchIds,
			startDownload: s.startDownload,
			retryDownload: s.retryDownload,
			deleteDownload: s.deleteDownload,
			deleteAllDownloads: s.deleteAllDownloads,
		})),
	);

	// 텍스트 읽어주기 훅
	const { isSpeaking, isLoading: isTTSLoading, speak, pause, stop } = useTTS();

	// 메모이제이션
	const items = useMemo(
		() => historyItems.filter((item) => bookmarkedIds.includes(item.id)),
		[historyItems, bookmarkedIds],
	);

	const downloadTargets = useMemo<DownloadTarget[]>(
		() => items.map((item) => ({ id: item.id, text: item.text })),
		[items],
	);
	const downloadTargetIds = useMemo(() => downloadTargets.map((t) => t.id), [downloadTargets]);
	const downloadTargetTextById = useMemo(
		() => new Map(downloadTargets.map((t) => [t.id, t.text])),
		[downloadTargets],
	);

	const doneIds = useMemo(
		() => downloadTargetIds.filter((id) => downloadStatuses[id] === 'done'),
		[downloadTargetIds, downloadStatuses],
	);
	const totalSizeLabel = useMemo(
		() => (doneIds.length > 0 ? formatOfflineAudioSize(getOfflineAudioTotalSizeBytes()) : ''),
		[doneIds.length],
	);

	const isAudioSyncing = !isHistoryLoaded || !isBookmarkLoaded;

	// 다운로드 가능 여부 계산 (유틸)
	const canStartDownload = hasIdle(downloadTargetIds, downloadStatuses);
	const isDownloading = isAnyLoading(downloadTargetIds, downloadStatuses);
	const downloadProgress = getBatchProgress(downloadBatchIds, downloadStatuses);

	useEffect(() => {
		items.forEach((item) => {
			if (item.imageUrl) return;
			fetchWikidataImage(item.title, item.artist, item.text).then((url) => {
				if (url) updateHistory(item.id, { imageUrl: url });
			});
		});
	}, [items, updateHistory]);

	/**
	 * 이벤트 핸들러 (콜백)
	 */
	const handleStartDownload = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		startDownload(downloadTargets, voiceId, voiceSpeed);
	}, [downloadTargets, startDownload, voiceId, voiceSpeed]);

	const handleRetryDownload = useCallback(
		(id: string) => {
			const text = downloadTargetTextById.get(id);
			if (!text) return;
			retryDownload(id, text, voiceId, voiceSpeed);
		},
		[downloadTargetTextById, retryDownload, voiceId, voiceSpeed],
	);

	const handleDeleteAllDownloads = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Alert.alert(
			t('bookmark.delete_all_downloads_title'),
			t('bookmark.delete_all_downloads_message', { count: doneIds.length }),
			[
				{ text: t('common.cancel'), style: 'cancel' },
				{
					text: t('common.delete'),
					style: 'destructive',
					onPress: () => deleteAllDownloads(downloadTargetIds),
				},
			],
		);
	}, [deleteAllDownloads, doneIds.length, downloadTargetIds, t]);

	const handleDeleteSingleDownload = useCallback(
		(item: HistoryItem) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			Alert.alert(
				t('bookmark.delete_download_title'),
				t('bookmark.delete_download_message', { title: item.title }),
				[
					{ text: t('common.cancel'), style: 'cancel' },
					{
						text: t('common.delete'),
						style: 'destructive',
						onPress: () => {
							const cacheKey = computeCacheKey(item.text, voiceId, voiceSpeed);
							deleteDownload(item.id, cacheKey);
						},
					},
				],
			);
		},
		[deleteDownload, voiceId, voiceSpeed, t],
	);

	const handleCardPress = useCallback(
		(item: HistoryItem) => {
			stop();
			setSelected(item);
			sheetRef.current?.expand();
		},
		[stop],
	);

	const handleUnbookmark = useCallback(
		(item: HistoryItem) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			Alert.alert(t('bookmark.unsave_title'), t('bookmark.unsave_message', { title: item.title }), [
				{ text: t('common.close'), style: 'cancel' },
				{
					text: t('bookmark.unsave_confirm'),
					style: 'destructive',
					onPress: () => toggleBookmark(item.id),
				},
			]);
		},
		[toggleBookmark, t],
	);

	const handleSheetClose = useCallback(() => {
		stop();
		sheetRef.current?.close();
	}, [stop]);

	const handlePlayPause = useCallback(() => {
		if (!selected) return;
		if (isSpeaking) {
			pause();
		} else {
			void speak(selected.text);
		}
	}, [selected, isSpeaking, pause, speak]);

	if (!session) {
		return (
			<Result
				icon="lock-closed-outline"
				iconSize={36}
				title={t('auth.login_required')}
				description={t('bookmark.audio_login_description')}
				actionLabel={t('bookmark.audio_login_action')}
				onAction={() => router.push({ pathname: '/auth/login', params: { returnTo: '/bookmark' } })}
				className="mb-20"
			/>
		);
	}

	// 구독 확인·해설 동기화 전에는 빈 화면 대신 스켈레톤 — 이미 받은 목록이 있으면 그대로 보여준다
	if (subscriptionLoading || (isAudioSyncing && items.length === 0)) {
		return (
			<View className="flex-1 px-1 pt-4">
				{Array.from({ length: 5 }).map((_, index) => (
					<BookmarkedAudioRowSkeleton key={index} />
				))}
			</View>
		);
	}

	if (!isPremium) {
		return (
			<Result
				icon="sparkles-outline"
				iconSize={36}
				title={t('bookmark.audio_premium_title')}
				description={t('bookmark.audio_premium_description')}
				className="mb-20"
			/>
		);
	}

	return (
		<View className="flex-1">
			{items.length > 0 && canStartDownload && (
				<View className="px-4 py-3">
					<View className="flex-row items-center justify-between rounded-2xl bg-[rgba(28,25,23,0.04)] px-4 py-3">
						<View className="flex-row items-center gap-2">
							<Ionicons name="cloud-download-outline" size={18} className="text-gray700" />
							<Text className="font-pretendard-regular text-gray700 text-[13px]">
								{t('bookmark.offline_save')}
							</Text>
						</View>
						<Pressable
							onPress={handleStartDownload}
							disabled={isDownloading}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel={
								isDownloading
									? t('bookmark.downloading_a11y', downloadProgress)
									: t('bookmark.offline_save')
							}
							accessibilityState={{ busy: isDownloading }}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<View className="flex-row items-center gap-1.5">
								<Text className="font-pretendard-semibold text-gray900 text-[13px]">
									{isDownloading
										? t('bookmark.downloading', downloadProgress)
										: t('bookmark.download_all')}
								</Text>
								{isDownloading && <ActivityIndicator size="small" className="text-gray500" />}
							</View>
						</Pressable>
					</View>
				</View>
			)}

			{doneIds.length > 0 && (
				<View className="pb-3">
					<View className="flex-row items-center justify-between rounded-2xl bg-[rgba(28,25,23,0.04)] px-4 py-3">
						<Text className="font-pretendard-regular text-gray600 text-[13px]">
							{t('bookmark.downloaded_size', { size: totalSizeLabel })}
						</Text>
						<Pressable
							onPress={handleDeleteAllDownloads}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel={t('bookmark.delete_all_downloads_a11y')}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<View className="flex-row items-center gap-1.5">
								<Ionicons name="trash-outline" size={14} className="text-error" />
								<Text className="font-pretendard-semibold text-gray900 text-[13px]">
									{t('search.clear_recent')}
								</Text>
							</View>
						</Pressable>
					</View>
				</View>
			)}

			{items.length > 0 ? (
				<FlatList
					data={items}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<Pressable
							onPress={() => handleCardPress(item)}
							accessibilityLabel={item.title}
							accessibilityRole="button"
							className="flex-row items-center gap-3"
							style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
						>
							<View className="relative">
								<ImageFallback
									heroImageUri={item.imageUrl}
									className="w-[40px] h-[40px] rounded-full bg-[#E8E3DB]"
									iconSize={18}
									resizeMode="cover"
									accessibilityLabel={t('bookmark.image_a11y', { title: item.title })}
								/>
								<DownloadStatusBadge
									status={downloadStatuses[item.id] ?? 'idle'}
									onRetry={() => handleRetryDownload(item.id)}
								/>
							</View>

							<View className="flex-1">
								<Text
									numberOfLines={1}
									className="text-gray900 text-[14px] font-pretendard-semibold leading-[20px]"
								>
									{item.title}
								</Text>
								{item.artist && (
									<Text className="text-gray500 text-[12px] font-pretendard-regular">
										{item.artist}
									</Text>
								)}
								<Text className="text-[#C7C3BD] text-[11px] font-pretendard-regular mt-0.5">
									{formatDate(item.savedAt)}
								</Text>
							</View>

							<IconButton
								onPress={() => handleUnbookmark(item)}
								accessibilityLabel={t('bookmark.unsave_title')}
								variant="bare"
								className="p-1"
								iconClassName="text-red-400"
								icon="heart"
								iconSize={18}
							/>
						</Pressable>
					)}
					ItemSeparatorComponent={() => <Divider className="my-2.5" />}
					contentContainerClassName="pt-4 pb-10 px-1"
					showsVerticalScrollIndicator={false}
				/>
			) : (
				<Result
					icon="headset-outline"
					illustration={<AudioEmptyIllustration />}
					title={t('bookmark.audio_empty_title')}
					description={t('bookmark.audio_empty_description')}
					className="mb-20"
				/>
			)}

			<BottomSheet
				ref={sheetRef}
				index={-1}
				snapPoints={['70%']}
				enablePanDownToClose
				onClose={() => setSelected(null)}
				backgroundStyle={{ backgroundColor: colors.gray900 }}
				handleIndicatorStyle={{ backgroundColor: colors.gray700 }}
			>
				{selected && (
					<BottomSheetScrollView contentContainerClassName="px-6 pb-12">
						<View className="flex-row items-start justify-between pt-2 pb-5">
							<View className="flex-1 pr-4">
								<Text className="text-white text-[17px] font-pretendard-semibold leading-[24px]">
									{selected.title}
								</Text>
								{selected.artist && (
									<Text className="text-gray500 text-[13px] font-pretendard-regular mt-0.5">
										{selected.artist}
									</Text>
								)}
							</View>
							<View className="flex-row items-center gap-4">
								<Pressable
									onPress={handlePlayPause}
									hitSlop={8}
									accessibilityLabel={
										isSpeaking ? t('bookmark.pause_a11y') : t('bookmark.play_a11y')
									}
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									{isTTSLoading ? (
										<ActivityIndicator size="small" color={colors['brand-on-dark']} />
									) : (
										<Ionicons
											name={isSpeaking ? 'pause-circle' : 'play-circle'}
											size={28}
											className="text-brand-on-dark"
										/>
									)}
								</Pressable>
								{downloadStatuses[selected.id] === 'done' && (
									<IconButton
										onPress={() => handleDeleteSingleDownload(selected)}
										hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
										accessibilityLabel={t('bookmark.delete_download_title')}
										variant="bare"
										icon="trash-outline"
										iconSize={22}
										iconClassName="text-error"
									/>
								)}
								<IconButton
									onPress={handleSheetClose}
									accessibilityLabel={t('common.close')}
									variant="bare"
									icon="close"
									iconSize={22}
								/>
							</View>
						</View>

						<Text className="text-on-dark font-pretendard-medium leading-[28px] text-[15px]">
							{selected.text}
						</Text>
						{selected.imageUrl && (
							<View className="mt-10">
								<ImageFallback
									heroImageUri={selected.imageUrl}
									className="w-full h-[200px] rounded-lg"
									iconSize={64}
									resizeMode="cover"
									accessibilityLabel={t('bookmark.image_a11y', { title: selected.title })}
								/>
							</View>
						)}
					</BottomSheetScrollView>
				)}
			</BottomSheet>
		</View>
	);
}
