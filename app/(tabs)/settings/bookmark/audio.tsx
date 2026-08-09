import { Ionicons } from '@expo/vector-icons';
import { FlatList, Image, Text, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { useImmersiveStore, type PlaylistItem } from '@/src/store/immersiveStore';

function AudioItem({ item }: { item: PlaylistItem }) {
	const addedDate = new Date(item.addedAt).toLocaleDateString('ko-KR', {
		month: 'short',
		day: 'numeric',
	});

	return (
		<View className='flex-row items-center gap-3 mb-4'>
			{item.imageUrl ? (
				<Image
					source={{ uri: item.imageUrl }}
					className='w-14 h-14 rounded-lg'
					resizeMode='cover'
				/>
			) : (
				<View className='w-14 h-14 rounded-lg bg-[#E5E1D8] items-center justify-center'>
					<Ionicons name='musical-notes-outline' size={22} color='#A8A29E' />
				</View>
			)}
			<View className='flex-1'>
				<Text
					numberOfLines={1}
					className='text-[#1C1917] text-[14px] font-pretendard-semibold'
				>
					{item.title}
				</Text>
				<Text
					numberOfLines={2}
					className='text-[#78716C] text-[12px] font-pretendard-regular mt-0.5'
				>
					{item.description}
				</Text>
				<Text className='text-[#A8A29E] text-[11px] font-pretendard-regular mt-1'>
					{addedDate}
				</Text>
			</View>
		</View>
	);
}

export default function AudioBookmarkScreen() {
	const playlist = useImmersiveStore((s) => s.playlist);

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Back color='#78716C' />
				<Screen.Header.Center>
					<Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 16, color: '#1C1917' }}>
						다시 듣고 싶은 오디오
					</Text>
				</Screen.Header.Center>
			</Screen.Header>

			{playlist.length === 0 ? (
				<View className='flex-1 items-center justify-center gap-2'>
					<Ionicons name='headset-outline' size={36} color='#D6D3D1' />
					<Text className='text-[#A8A29E] text-[14px] font-pretendard-regular text-center'>
						저장된 오디오가 없어요{'\n'}오디오 가이드를 감상하면 여기에 모여요
					</Text>
				</View>
			) : (
				<FlatList
					data={playlist}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => <AudioItem item={item} />}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</Screen>
	);
}
