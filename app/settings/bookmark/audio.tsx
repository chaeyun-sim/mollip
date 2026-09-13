import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { DownloadStatusBadge } from '@/src/components/guide/DownloadStatusBadge';
import { Screen } from '@/src/components/layout/Screen';
import { useTTS } from '@/src/hooks/useTTS';
import { useBookmarkAudioStore } from '@/src/store/bookmarkAudioStore';
import { useHistoryStore } from '@/src/store/historyStore';
import type { HistoryItem } from '@/src/store/historyStore';
import {
	computeCacheKey,
	type DownloadStatus,
	type DownloadTarget,
	getBatchProgress,
	hasIdle,
	isAnyLoading,
	useOfflineDownloadStore,
} from '@/src/store/offlineDownloadStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { formatOfflineAudioSize, getOfflineAudioTotalSizeBytes } from '@/src/utils/offlineAudio';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';
import { colors } from '@/src/constants/colors';
import { formatDate } from '@/src/utils/cultureExhibitionMapper';

interface AudioHistoryCardProps {
	item: HistoryItem;
	downloadStatus: DownloadStatus;
	onPress: (item: HistoryItem) => void;
	onDelete: (id: string) => void;
	onRetryDownload: (id: string) => void;
}

function AudioHistoryCard({
	item,
	downloadStatus,
	onPress,
	onDelete,
	onRetryDownload,
}: AudioHistoryCardProps) {
	const update = useHistoryStore((s) => s.update);

	useEffect(() => {
		if (item.imageUrl) return;
		fetchWikidataImage(item.title, item.artist, item.text).then((url) => {
			if (url) update(item.id, { imageUrl: url });
		});
	}, [item.id, item.artist, item.imageUrl, item.text, item.title, update]);

	return (
		<Pressable
			onPress={() => onPress(item)}
			accessibilityLabel={item.title}
			accessibilityRole="button"
			className="flex-row items-center gap-3"
			style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
		>
			<View className="relative">
				{item.imageUrl ? (
					<Image
						source={{ uri: item.imageUrl }}
						className="w-[40px] h-[40px] rounded-full"
						resizeMode="cover"
					/>
				) : (
					<View className="w-[40px] h-[40px] rounded-full bg-[#E8E3DB] items-center justify-center">
						<Ionicons name="headset-outline" size={18} className="text-gray600" />
					</View>
				)}
				<DownloadStatusBadge status={downloadStatus} onRetry={() => onRetryDownload(item.id)} />
			</View>

			<View className="flex-1">
				<Text
					numberOfLines={1}
					className="text-gray900 text-[14px] font-pretendard-semibold leading-[20px]"
				>
					{item.title}
				</Text>
				{item.artist && (
					<Text className="text-gray500 text-[12px] font-pretendard-regular">{item.artist}</Text>
				)}
				<Text className="text-[#C7C3BD] text-[11px] font-pretendard-regular mt-0.5">
					{formatDate(item.savedAt)}
				</Text>
			</View>

			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					Alert.alert('저장 취소', `"${item.title}"을 저장 목록에서 지울까요?`, [
						{ text: '닫기', style: 'cancel' },
						{
							text: '지우기',
							style: 'destructive',
							onPress: () => onDelete(item.id),
						},
					]);
				}}
				hitSlop={8}
				accessibilityLabel="저장 취소"
				accessibilityRole="button"
				className="p-1"
			>
				<Ionicons name="heart" size={18} className="text-red-400" />
			</Pressable>
		</Pressable>
	);
}

export default function AudioHistoryScreen() {
	const historyItems = useHistoryStore((s) => s.items);
	const bookmarkedIds = useBookmarkAudioStore((s) => s.ids);
	const toggleBookmark = useBookmarkAudioStore((s) => s.toggle);
	const items = useMemo(
		() => historyItems.filter((item) => bookmarkedIds.includes(item.id)),
		[historyItems, bookmarkedIds],
	);
	const [selected, setSelected] = useState<HistoryItem | null>(null);
	const sheetRef = useRef<BottomSheet>(null);
	const { isSpeaking, isLoading: isTTSLoading, speak, pause, stop } = useTTS();

	const voiceId = useSettingsStore((s) => s.voiceId);
	const voiceSpeed = useSettingsStore((s) => s.voiceSpeed);
	const downloadStatuses = useOfflineDownloadStore((s) => s.statuses);
	const downloadBatchIds = useOfflineDownloadStore((s) => s.batchIds);
	const startDownload = useOfflineDownloadStore((s) => s.startDownload);
	const retryDownload = useOfflineDownloadStore((s) => s.retryDownload);
	const deleteDownload = useOfflineDownloadStore((s) => s.deleteDownload);
	const deleteAllDownloads = useOfflineDownloadStore((s) => s.deleteAllDownloads);

	// AC-1 다운로드 대상 — 북마크한 항목(useBookmarkAudioStore.ids ∩ useHistoryStore.items).
	const downloadTargets = useMemo<DownloadTarget[]>(
		() => items.map((item) => ({ id: item.id, text: item.text })),
		[items],
	);
	const downloadTargetIds = useMemo(() => downloadTargets.map((t) => t.id), [downloadTargets]);

	const canStartDownload = hasIdle(downloadTargetIds, downloadStatuses);
	const isDownloading = isAnyLoading(downloadTargetIds, downloadStatuses);
	const downloadProgress = getBatchProgress(downloadBatchIds, downloadStatuses);

	const downloadTargetTextById = useMemo(
		() => new Map(downloadTargets.map((t) => [t.id, t.text])),
		[downloadTargets],
	);

	// AC-5 저장 공간 — 완료 항목이 1개 이상일 때만 Row B를 노출한다.
	const doneIds = useMemo(
		() => downloadTargetIds.filter((id) => downloadStatuses[id] === 'done'),
		[downloadTargetIds, downloadStatuses],
	);
	const hasDownloaded = doneIds.length > 0;
	const totalSizeLabel = useMemo(
		() => (hasDownloaded ? formatOfflineAudioSize(getOfflineAudioTotalSizeBytes()) : ''),
		// downloadStatuses가 바뀔 때(다운로드/삭제 완료 시) 디스크 상태를 다시 읽어야 하므로 의존성에 포함한다.
		[hasDownloaded, downloadStatuses],
	);

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

	const handleDelete = useCallback(
		(id: string) => {
			toggleBookmark(id);
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

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>다시 듣고 싶은 오디오</Screen.Header.Center>
			</Screen.Header>

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

			{hasDownloaded && (
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

			{items.length === 0 ? (
				<View className="flex-1 items-center justify-center gap-2">
					<Ionicons name="headset-outline" size={36} className="text-stone-300" />
					<Text className="text-gray500 text-[14px] font-pretendard-regular text-center">
						저장된 오디오가 없어요{'\n'}해설 화면에서 하트를 눌러 저장해보세요
					</Text>
				</View>
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<AudioHistoryCard
							item={item}
							downloadStatus={downloadStatuses[item.id] ?? 'idle'}
							onPress={handleCardPress}
							onDelete={handleDelete}
							onRetryDownload={handleRetryDownload}
						/>
					)}
					ItemSeparatorComponent={() => <View className="h-[1px] bg-divider my-2.5" />}
					contentContainerClassName="pt-4 pb-10 px-1"
					showsVerticalScrollIndicator={false}
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
									<Pressable
										onPress={() => handleDeleteSingleDownload(selected)}
										hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
										accessibilityRole="button"
										accessibilityLabel="다운로드 삭제"
										style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
									>
										<Ionicons name="trash-outline" size={22} className="text-error" />
									</Pressable>
								)}
								<Pressable
									onPress={handleSheetClose}
									hitSlop={8}
									accessibilityLabel="닫기"
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name="close" size={22} className="text-gray600" />
								</Pressable>
							</View>
						</View>

						<Text className="text-on-dark font-pretendard-medium leading-[28px] text-[15px]">
							{selected.text}
						</Text>
						{selected.imageUrl && (
							<View className="mt-10">
								<Image
									source={{ uri: selected.imageUrl }}
									className="w-full h-[200px] rounded-lg"
									resizeMode="cover"
								/>
							</View>
						)}
					</BottomSheetScrollView>
				)}
			</BottomSheet>
		</Screen>
	);
}
