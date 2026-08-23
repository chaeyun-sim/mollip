import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface PlaylistModalProps {
	visible: boolean;
	titles: string[];
	onClose: () => void;
}

// 해당 관람에서 오디오로 들은 작품 목록 모달 (해설 본문은 노출하지 않음)
export function PlaylistModal({ visible, titles, onClose }: PlaylistModalProps) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			onRequestClose={onClose}
		>
			<Pressable
				className='flex-1 justify-end bg-black/40'
				onPress={onClose}
				accessibilityLabel='재생목록 닫기'
				accessibilityRole='button'
			>
				<Pressable
					className='w-full rounded-t-3xl bg-white px-5 pt-6 pb-9'
					onPress={() => {}}
					style={{
						shadowColor: '#000',
						shadowOpacity: 0.15,
						shadowRadius: 20,
						shadowOffset: { width: 0, height: 8 },
						elevation: 8,
						maxHeight: '75%',
					}}
				>
					<View className='items-center pb-3'>
						<View className='w-9 h-1 rounded-full bg-black/15' />
					</View>
					<View className='flex-row items-center justify-between'>
						<View className='flex-row items-center gap-2'>
							<Ionicons name='musical-notes-outline' size={17} color='#111827' />
							<Text className='text-gray-900 text-[17px] font-pretendard-semibold'>
								오디오 관람 목록
							</Text>
						</View>
						<Pressable
							onPress={onClose}
							hitSlop={8}
							accessibilityLabel='닫기'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
						>
							<Ionicons name='close' size={22} color='#9CA3AF' />
						</Pressable>
					</View>

					<ScrollView className='mt-3' showsVerticalScrollIndicator={false}>
						{titles.map((title, index) => (
							<View
								key={title}
								className='flex-row items-center border-b border-gray-100 py-3.5'
							>
								<Text className='w-7 text-[13px] font-pretendard-medium text-gray-400'>
									{index + 1}
								</Text>
								<Text
									className='flex-1 text-[15px] font-pretendard-regular text-gray-800'
									numberOfLines={1}
								>
									{title}
								</Text>
								<Ionicons name='headset-outline' size={16} color='#D1D5DB' />
							</View>
						))}
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
