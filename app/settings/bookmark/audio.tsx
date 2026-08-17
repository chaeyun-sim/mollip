import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Screen } from '@/src/components/layout/Screen';
import { useHistoryStore } from '@/src/store/historyStore';
import type { HistoryItem } from '@/src/store/historyStore';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';

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
			accessibilityRole='button'
			className='flex-row items-center gap-3'
			style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
		>
			{item.imageUrl ? (
				<Image
					source={{ uri: item.imageUrl }}
					className='w-[40px] h-[40px] rounded-full'
					resizeMode='cover'
				/>
			) : (
				<View className='w-[40px] h-[40px] rounded-full bg-[#E8E3DB] items-center justify-center'>
					<Ionicons name='headset-outline' size={18} color='#78716C' />
				</View>
			)}

			<View className='flex-1'>
				<Text
					numberOfLines={1}
					className='text-[#1C1917] text-[14px] font-pretendard-semibold leading-[20px]'
				>
					{item.title}
				</Text>
				{item.artist && (
					<Text className='text-[#A8A29E] text-[12px] font-pretendard-regular'>
						{item.artist}
					</Text>
				)}
				<Text className='text-[#C7C3BD] text-[11px] font-pretendard-regular mt-0.5'>
					{formatDate(item.savedAt)}
				</Text>
			</View>

			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					onDelete(item.id);
				}}
				hitSlop={8}
				accessibilityLabel='저장 취소'
				accessibilityRole='button'
				className='p-1'
			>
				<Ionicons name='heart' size={18} color='#F87171' />
			</Pressable>
		</Pressable>
	);
}

export default function AudioHistoryScreen() {
	const items = useHistoryStore((s) => s.items);
	const remove = useHistoryStore((s) => s.remove);
	const [selected, setSelected] = useState<HistoryItem | null>(null);
	const sheetRef = useRef<BottomSheet>(null);

	const handleCardPress = useCallback((item: HistoryItem) => {
		setSelected(item);
		sheetRef.current?.expand();
	}, []);

	const handleDelete = useCallback(
		(id: string) => {
			remove(id);
		},
		[remove],
	);

	const handleSheetClose = useCallback(() => {
		sheetRef.current?.close();
	}, []);

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Back color='#78716C' />
				<Screen.Header.Center>
					<Text className='font-pretendard-semibold text-[16px] text-[#1C1917]'>
						다시 듣고 싶은 오디오
					</Text>
				</Screen.Header.Center>
			</Screen.Header>

			{items.length === 0 ? (
				<View className='flex-1 items-center justify-center gap-2'>
					<Ionicons name='headset-outline' size={36} color='#D6D3D1' />
					<Text className='text-[#A8A29E] text-[14px] font-pretendard-regular text-center'>
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
							onPress={handleCardPress}
							onDelete={handleDelete}
						/>
					)}
					ItemSeparatorComponent={() => (
						<View className='h-[1px] bg-[#E7E5E4] my-4' />
					)}
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
				backgroundStyle={{ backgroundColor: '#1C1917' }}
				handleIndicatorStyle={{ backgroundColor: '#57534E' }}
			>
				{selected && (
					<BottomSheetScrollView
						contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
					>
						<View className='flex-row items-start justify-between pt-2 pb-5'>
							<View className='flex-1 pr-4'>
								<Text className='text-white text-[17px] font-pretendard-semibold leading-[24px]'>
									{selected.title}
								</Text>
								{selected.artist && (
									<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular mt-0.5'>
										{selected.artist}
									</Text>
								)}
							</View>
							<Pressable
								onPress={handleSheetClose}
								hitSlop={8}
								accessibilityLabel='닫기'
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							>
								<Ionicons name='close' size={22} color='#78716C' />
							</Pressable>
						</View>

						<Text className='text-[#E8E8E8] font-pretendard-medium leading-[28px] text-[15px]'>
							{selected.text}
						</Text>
						{selected.imageUrl && (
							<View className='mt-10'>
								<Image
									source={{ uri: selected.imageUrl }}
									className='w-full h-[200px] rounded-lg'
									resizeMode='cover'
								/>
							</View>
						)}
					</BottomSheetScrollView>
				)}
			</BottomSheet>
		</Screen>
	);
}
