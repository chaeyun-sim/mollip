import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { ARCHIVE_STAT_ACCENTS } from '@/src/components/archive/archivePalette';

interface ArchiveLoginPromptProps {
	onLogin: () => void;
}

export function ArchiveLoginPrompt({ onLogin }: ArchiveLoginPromptProps) {
	return (
		<View className="flex-1 items-center justify-center px-8 py-16">
			<View className="rounded-full bg-bg-light p-5 mb-5">
				<Ionicons name="lock-closed-outline" size={28} color={ARCHIVE_STAT_ACCENTS.visitDays} />
			</View>
			<Text className="text-[20px] text-center mb-2 font-hahmlet-bold text-gray900">
				로그인하고 관람을 기록해요
			</Text>
			<Text className="text-[14px] text-center leading-[21px] mb-8 font-pretendard-regular text-gray700">
				북마크와 관람 다이어리는 계정에 저장돼요
			</Text>
			<Pressable
				onPress={onLogin}
				className="w-full rounded-full py-4 items-center bg-secondary"
				accessibilityRole="button"
				accessibilityLabel="로그인하기"
				style={({ pressed }) => ({
					opacity: pressed ? 0.9 : 1,
				})}
			>
				<Text className="text-white text-[15px] font-pretendard-semibold">로그인하기</Text>
			</Pressable>
		</View>
	);
}
