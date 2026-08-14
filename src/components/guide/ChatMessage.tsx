import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';
import type { Message } from '@/src/store/chatStore';

const DOCENT_AVATAR = require('../../../assets/images/marker/gogh.png');

interface ChatMessageProps {
	item: Message;
	onRetry: (item: Message) => void;
}

export function ChatMessage({ item, onRetry }: ChatMessageProps) {
	const isUser = item.role === 'user';
	return (
		<View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
			{!isUser && <Image source={DOCENT_AVATAR} className='w-7 h-7 mb-1' />}
			{item.isError ? (
				<Pressable
					className='flex-row items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#2a1a1a]'
					onPress={() => onRetry(item)}
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Ionicons name='refresh' size={14} color='#e05050' />
					<Text className='font-pretendard-regular text-[#e05050] text-[13px]'>
						답변 실패 — 다시 시도
					</Text>
				</Pressable>
			) : (
				<View
					className={cn(
						'rounded-2xl px-4 py-3 max-w-[80%]',
						isUser
							? 'rounded-tr-sm bg-[#3B82F6]'
							: 'rounded-tl-sm bg-[#1C1917] border-white/[0.08]',
					)}
					style={{ borderWidth: isUser ? 0 : StyleSheet.hairlineWidth }}
				>
					{item.text === '' && !isUser ? (
						<ActivityIndicator size='small' color='#60A5FA' />
					) : (
						<Text
							className={cn(
								'text-sm leading-5',
								isUser ? 'text-white' : 'text-[#e8e8e8]',
							)}
						>
							{item.text}
						</Text>
					)}
				</View>
			)}
		</View>
	);
}
