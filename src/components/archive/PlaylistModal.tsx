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
			animationType='fade'
			onRequestClose={onClose}
		>
			<Pressable
				className='flex-1 items-center justify-center bg-black/45 px-8'
				onPress={onClose}
				accessibilityLabel='재생목록 닫기'
				accessibilityRole='button'
			>
				<Pressable
					className='w-full rounded-lg bg-[#FFFEF9] px-5 py-6'
					onPress={() => {}}
					style={{
						transform: [{ rotate: '-1deg' }],
						shadowColor: '#000',
						shadowOpacity: 0.3,
						shadowRadius: 12,
						shadowOffset: { width: 0, height: 6 },
						elevation: 8,
						maxHeight: '65%',
					}}
				>
					<View className='flex-row items-center justify-between'>
						<View className='flex-row items-center'>
							<Ionicons name='musical-notes' size={18} color='#2F5FA8' />
							<Text
								className='ml-2 text-[22px] text-[#37342F]'
								style={{ fontFamily: 'NanumPenScript_400Regular' }}
							>
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
							<Ionicons name='close' size={22} color='#78716C' />
						</Pressable>
					</View>

					<ScrollView className='mt-4' showsVerticalScrollIndicator={false}>
						{titles.map((title, index) => (
							<View
								key={title}
								className='flex-row items-center border-b border-dashed border-[#E5E0D3] py-3'
							>
								<Text
									className='w-7 text-[18px] text-[#2F5FA8]'
									style={{ fontFamily: 'NanumPenScript_400Regular' }}
								>
									{index + 1}.
								</Text>
								<Text
									className='flex-1 text-[19px] text-[#44403C]'
									style={{ fontFamily: 'NanumPenScript_400Regular' }}
									numberOfLines={1}
								>
									{title}
								</Text>
								<Ionicons name='headset-outline' size={16} color='#A8A29E' />
							</View>
						))}
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
