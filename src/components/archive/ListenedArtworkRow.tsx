import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ArtworkChatThread } from '@/src/components/archive/ArtworkChatThread';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';
import type { StoredChatMessage } from '@/src/store/historyStore';

interface ListenedArtworkRowProps {
	/** 목록에서의 0부터 시작하는 순서 — 번호와 구분선에 쓴다 */
	index: number;
	title: string;
	playable: boolean;
	/** 이 작품에서 나눈 대화 — 없으면 빈 배열 */
	chatMessages: StoredChatMessage[];
	onPlay: () => void;
}

// 들은 작품 한 줄 — 제목·재생 버튼은 해설 재생, 말풍선 배지는 그 작품의 대화를 패널로 펼친다
export function ListenedArtworkRow({
	index,
	title,
	playable,
	chatMessages,
	onPlay,
}: ListenedArtworkRowProps) {
	const [expanded, setExpanded] = useState(false);

	const chatCount = chatMessages.length;
	const hasChat = chatCount > 0;

	const handleToggleChat = () => setExpanded((prev) => !prev);

	return (
		<View className={cn(index > 0 && 'border-t-[0.5px] border-divider')}>
			<View className="min-h-[60px] flex-row items-center gap-3 py-2">
				<Text className="w-5 font-pretendard-medium text-[13px] text-gray500">{index + 1}</Text>
				<Pressable
					onPress={onPlay}
					disabled={!playable}
					accessible={false}
					className="flex-1"
					style={({ pressed }) => ({ opacity: pressed && playable ? 0.6 : 1 })}
				>
					<Text
						numberOfLines={2}
						className="font-pretendard-medium text-[15px] leading-[21px] text-ink"
					>
						{title}
					</Text>
				</Pressable>
				{hasChat && (
					<Pressable
						onPress={handleToggleChat}
						hitSlop={4}
						accessibilityRole="button"
						accessibilityState={{ expanded }}
						accessibilityLabel={`${title} 대화 ${chatCount}개 ${expanded ? '접기' : '펼치기'}`}
						className={cn(
							'h-8 flex-row items-center gap-1 rounded-full px-2.5',
							expanded ? 'bg-brand' : 'bg-surface-neutral',
						)}
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons
							name="chatbubble-outline"
							size={13}
							color={expanded ? colors.white : colors.gray600}
						/>
						<Text
							className={cn(
								'font-pretendard-medium text-[12px]',
								expanded ? 'text-white' : 'text-gray600',
							)}
						>
							{chatCount}
						</Text>
					</Pressable>
				)}
				{playable && (
					<Pressable
						onPress={onPlay}
						hitSlop={6}
						accessibilityRole="button"
						accessibilityLabel={`${title} 해설 듣기`}
						className="h-9 w-9 items-center justify-center rounded-full bg-brand"
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons name="play" size={15} color={colors.white} style={{ marginLeft: 2 }} />
					</Pressable>
				)}
			</View>
			{hasChat && expanded && (
				<View className="mb-3 rounded-2xl bg-surface-neutral p-3">
					<ArtworkChatThread messages={chatMessages} />
				</View>
			)}
		</View>
	);
}
