import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Screen } from '@/src/components/layout/Screen';
import { useHistoryStore } from '@/src/store/historyStore';
import type { HistoryItem } from '@/src/store/historyStore';
import { useTTS } from '@/src/hooks/useTTS';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';
import { colors } from '@/src/constants/colors';

function formatDate(iso: string) {
	const d = new Date(iso);
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

interface AudioHistoryCardProps {
	item: HistoryItem;
	onPress: (item: HistoryItem) => void;
	onDelete: (id: string) => void;
}

function AudioHistoryCard({ item, onPress, onDelete }: AudioHistoryCardProps) {
	const update = useHistoryStore((s) => s.update);

	useEffect(() => {
		if (item.imageUrl) return;
		fetchWikidataImage(item.title, item.artist).then((url) => {
			if (url) update(item.id, { imageUrl: url });
		});
	}, [item.id]);

	return (
		<Pressable
			onPress={() => onPress(item)}
			accessibilityLabel={item.title}
			accessibilityRole="button"
			className="flex-row items-center gap-3"
			style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
		>
			{item.imageUrl ? (
				<Image
					source={{ uri: item.imageUrl }}
					className="w-[40px] h-[40px] rounded-full"
					resizeMode="cover"
				/>
			) : (
				<View className="w-[40px] h-[40px] rounded-full bg-[#E8E3DB] items-center justify-center">
					<Ionicons name="headset-outline" size={18} className="text-tertiary" />
				</View>
			)}

			<View className="flex-1">
				<Text
					numberOfLines={1}
					className="text-primary text-[14px] font-pretendard-semibold leading-[20px]"
				>
					{item.title}
				</Text>
				{item.artist && (
					<Text className="text-muted text-[12px] font-pretendard-regular">{item.artist}</Text>
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
	const items = useHistoryStore((s) => s.items);
	const remove = useHistoryStore((s) => s.remove);
	const [selected, setSelected] = useState<HistoryItem | null>(null);
	const sheetRef = useRef<BottomSheet>(null);
	const { isSpeaking, isLoading: isTTSLoading, speak, pause, stop } = useTTS();

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
			remove(id);
		},
		[remove],
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

			{items.length === 0 ? (
				<View className="flex-1 items-center justify-center gap-2">
					<Ionicons name="headset-outline" size={36} className="text-stone-300" />
					<Text className="text-muted text-[14px] font-pretendard-regular text-center">
						저장된 오디오가 없어요{'\n'}해설 화면에서 하트를 눌러 저장해보세요
					</Text>
				</View>
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<AudioHistoryCard item={item} onPress={handleCardPress} onDelete={handleDelete} />
					)}
					ItemSeparatorComponent={() => <View className="h-[1px] bg-divider my-2.5" />}
					contentContainerStyle={{
						paddingTop: 16,
						paddingBottom: 40,
						paddingHorizontal: 4,
					}}
					showsVerticalScrollIndicator={false}
				/>
			)}

			<BottomSheet
				ref={sheetRef}
				index={-1}
				snapPoints={['70%']}
				enablePanDownToClose
				onClose={() => setSelected(null)}
				backgroundStyle={{ backgroundColor: colors.primary }}
				handleIndicatorStyle={{ backgroundColor: colors.secondary }}
			>
				{selected && (
					<BottomSheetScrollView
						contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
					>
						<View className="flex-row items-start justify-between pt-2 pb-5">
							<View className="flex-1 pr-4">
								<Text className="text-white text-[17px] font-pretendard-semibold leading-[24px]">
									{selected.title}
								</Text>
								{selected.artist && (
									<Text className="text-muted text-[13px] font-pretendard-regular mt-0.5">
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
								<Pressable
									onPress={handleSheetClose}
									hitSlop={8}
									accessibilityLabel="닫기"
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name="close" size={22} className="text-tertiary" />
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
