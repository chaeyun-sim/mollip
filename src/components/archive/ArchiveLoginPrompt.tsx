import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { ARCHIVE_INK, ARCHIVE_MUTED } from '@/src/components/archive/archivePalette';

interface ArchiveLoginPromptProps {
	onLogin: () => void;
}

export function ArchiveLoginPrompt({ onLogin }: ArchiveLoginPromptProps) {
	return (
		<View className='flex-1 items-center justify-center px-8 py-16'>
			<View className='rounded-full bg-[#F8F6F2] p-5 mb-5'>
				<Ionicons name='lock-closed-outline' size={28} color='#9B8AB8' />
			</View>
			<Text
				className='text-[20px] text-center mb-2'
				style={{ fontFamily: 'Hahmlet_700Bold', color: ARCHIVE_INK }}
			>
				로그인하고 관람을 기록해요
			</Text>
			<Text
				className='text-[14px] text-center leading-[21px] mb-8'
				style={{ fontFamily: 'Pretendard-Regular', color: ARCHIVE_MUTED }}
			>
				북마크와 관람 다이어리는 계정에 저장돼요
			</Text>
			<Pressable
				onPress={onLogin}
				className='w-full rounded-full py-4 items-center'
				accessibilityRole='button'
				accessibilityLabel='로그인하기'
				style={({ pressed }) => ({
					opacity: pressed ? 0.9 : 1,
					backgroundColor: ARCHIVE_INK,
				})}
			>
				<Text className='text-white text-[15px]' style={{ fontFamily: 'Pretendard-SemiBold' }}>
					로그인하기
				</Text>
			</Pressable>
		</View>
	);
}
