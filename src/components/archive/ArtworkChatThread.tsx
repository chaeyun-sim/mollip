import { Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import type { StoredChatMessage } from '@/src/store/historyStore';

interface ArtworkChatThreadProps {
	messages: StoredChatMessage[];
}

// 한 작품에 대한 도슨트 대화 말풍선 목록 (읽기 전용) — 연한 회색 패널 위에 놓이므로 AI 말풍선은 흰색
export function ArtworkChatThread({ messages }: ArtworkChatThreadProps) {
	return (
		<View className="gap-y-2">
			{messages.map((msg) => (
				<View
					key={msg.id}
					className={msg.role === 'user' ? 'items-end' : 'items-start'}
					accessibilityRole="text"
					accessibilityLabel={msg.role === 'user' ? `내 질문: ${msg.text}` : `AI 답변: ${msg.text}`}
				>
					<View
						className={cn(
							'max-w-[80%] rounded-2xl px-4 py-2.5',
							msg.role === 'user' ? 'rounded-tr-sm bg-brand' : 'rounded-tl-sm bg-white',
						)}
					>
						<Text
							className={cn(
								'font-pretendard-regular text-[14px] leading-[20px]',
								msg.role === 'user' ? 'text-white' : 'text-ink',
							)}
						>
							{msg.text}
						</Text>
					</View>
				</View>
			))}
		</View>
	);
}
