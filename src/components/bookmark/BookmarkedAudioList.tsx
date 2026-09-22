import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Divider } from '@/src/components/common/Divider';
import { IconButton } from '@/src/components/common/IconButton';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { Result } from '@/src/components/common/Result';
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
import { formatDate } from '@/src/utils/cultureExhibitionMapper';
import { formatOfflineAudioSize, getOfflineAudioTotalSizeBytes } from '@/src/utils/offlineAudio';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';

export function BookmarkedAudioList() {
	const router = useRouter();

	// 상태 관리
	const sheetRef = useRef<BottomSheet>(null);
	const [selected, setSelected] = useState<HistoryItem | null>(null);

	// Zustand 상태 관리
	const session = useAuthStore((s) => s.session);
	const { isPremium, isLoading: subscriptionLoading } = useSubscription();
	const { historyItems, updateHistory } = useHistoryStore(
		useShallow((s) => ({ historyItems: s.items, updateHistory: s.update })),
	);
	const { bookmarkedIds, toggleBookmark } = useBookmarkAudioStore(
		useShallow((s) => ({ bookmarkedIds: s.ids, toggleBookmark: s.toggle })),
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
			'다운로드한 해설 삭제',
			`저장된 오디오 ${doneIds.length}개를 모두 삭제해요. 다시 들으려면 네트워크가 필요해요`,
			[
				{ text: '취소', style: 'cancel' },
				{
					text: '삭제',
					style: 'destructive',
					onPress: () => deleteAllDownloads(downloadTargetIds),
				},
			],
		);
	}, [deleteAllDownloads, doneIds.length, downloadTargetIds]);

	const handleDeleteSingleDownload = useCallback(
		(item: HistoryItem) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			Alert.alert(
				'다운로드 삭제',
				`"${item.title}" 다운로드 파일을 삭제해요. 다시 들으려면 네트워크가 필요해요`,
				[
					{ text: '취소', style: 'cancel' },
					{
						text: '삭제',
						style: 'destructive',
						onPress: () => {
							const cacheKey = computeCacheKey(item.text, voiceId, voiceSpeed);
							deleteDownload(item.id, cacheKey);
						},
					},
				],
			);
		},
		[deleteDownload, voiceId, voiceSpeed],
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
			Alert.alert('저장 취소', `"${item.title}"을 저장 목록에서 지울까요?`, [
				{ text: '닫기', style: 'cancel' },
				{
					text: '지우기',
					style: 'destructive',
					onPress: () => toggleBookmark(item.id),
				},
			]);
		},
		[toggleBookmark],
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
				title="로그인이 필요해요"
				description={'로그인해야 저장한 오디오가 보관돼요'}
				actionLabel="로그인하기"
				onAction={() => router.push({ pathname: '/auth/login', params: { returnTo: '/bookmark' } })}
				className="mb-20"
			/>
		);
	}

	if (subscriptionLoading) return null;

	if (!isPremium) {
		return (
			<Result
				icon="sparkles-outline"
				iconSize={36}
				title="프리미엄 전용 기능이에요"
				description={'프리미엄으로 업그레이드하면 저장한 오디오를 다시 들을 수 있어요'}
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
								북마크한 해설 오프라인으로 저장
							</Text>
						</View>
						<Pressable
							onPress={handleStartDownload}
							disabled={isDownloading}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel={
								isDownloading
									? `다운로드 진행 중, ${downloadProgress.total}개 중 ${downloadProgress.done}개 완료`
									: '북마크한 해설 오프라인으로 저장'
							}
							accessibilityState={{ busy: isDownloading }}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<View className="flex-row items-center gap-1.5">
								<Text className="font-pretendard-semibold text-gray900 text-[13px]">
									{isDownloading
										? `받는 중… ${downloadProgress.done}/${downloadProgress.total}`
										: '전체 받기'}
								</Text>
								{isDownloading && <ActivityIndicator size="small" className="text-gray500" />}
							</View>
						</Pressable>
					</View>
				</View>
			)}

			{doneIds.length > 0 && (
				<View className="px-4 pb-3">
					<View className="flex-row items-center justify-between rounded-2xl bg-[rgba(28,25,23,0.04)] px-4 py-3">
						<Text className="font-pretendard-regular text-gray600 text-[13px]">
							다운로드 {totalSizeLabel}
						</Text>
						<Pressable
							onPress={handleDeleteAllDownloads}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="다운로드한 해설 전체 삭제"
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<View className="flex-row items-center gap-1.5">
								<Ionicons name="trash-outline" size={14} className="text-error" />
								<Text className="font-pretendard-semibold text-gray900 text-[13px]">전체 삭제</Text>
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
									accessibilityLabel={`${item.title} 이미지`}
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
								accessibilityLabel="저장 취소"
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
					iconSize={36}
					title="저장된 오디오가 없어요"
					description={'해설 화면에서 하트를 눌러 저장해보세요'}
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
									accessibilityLabel={isSpeaking ? '일시정지' : '해설 듣기'}
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									{isTTSLoading ? (
										<ActivityIndicator size="small" color="#60A5FA" />
									) : (
										<Ionicons
											name={isSpeaking ? 'pause-circle' : 'play-circle'}
											size={28}
											className="text-blue-400"
										/>
									)}
								</Pressable>
								{downloadStatuses[selected.id] === 'done' && (
									<IconButton
										onPress={() => handleDeleteSingleDownload(selected)}
										hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
										accessibilityLabel="다운로드 삭제"
										variant="bare"
										icon="trash-outline"
										iconSize={22}
										iconClassName="text-error"
									/>
								)}
								<IconButton
									onPress={handleSheetClose}
									accessibilityLabel="닫기"
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
									accessibilityLabel={`${selected.title} 이미지`}
								/>
							</View>
						)}
					</BottomSheetScrollView>
				)}
			</BottomSheet>
		</View>
	);
}
