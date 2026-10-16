import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ArtworkChatThread } from '@/src/components/archive/ArtworkChatThread';
import { colors } from '@/src/constants/colors';
import type { StoredChatMessage } from '@/src/store/historyStore';

interface ListenedArtworkRowProps {
	title: string;
	playable: boolean;
	/** 이 작품에서 나눈 대화 — 없으면 빈 배열 */
	chatMessages: StoredChatMessage[];
	onPlay: () => void;
}

// 들은 작품 한 줄 — 제목 탭은 해설 재생, 말풍선 배지 탭은 그 작품의 대화를 펼친다
export function ListenedArtworkRow({
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
		<View>
			<View className="min-h-11 flex-row items-center gap-3">
				<Pressable
					onPress={onPlay}
					disabled={!playable}
					accessibilityRole={playable ? 'button' : 'text'}
					accessibilityLabel={playable ? `${title} 해설 듣기` : title}
					className="min-h-11 flex-1 flex-row items-center justify-between gap-3 py-2"
					style={({ pressed }) => ({ opacity: pressed && playable ? 0.6 : 1 })}
				>
					<Text
						numberOfLines={2}
						className="flex-1 font-pretendard-medium text-[15px] leading-[21px] text-ink"
					>
						{title}
					</Text>
					{playable && <Ionicons name="play-circle" size={28} color={colors.brand} />}
				</Pressable>
				{hasChat && (
					<Pressable
						onPress={handleToggleChat}
						hitSlop={4}
						accessibilityRole="button"
						accessibilityState={{ expanded }}
						accessibilityLabel={`${title} 대화 ${chatCount}개 ${expanded ? '접기' : '펼치기'}`}
						className="h-8 flex-row items-center gap-1 rounded-full bg-surface-neutral px-2.5"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name="chatbubble-outline" size={13} color={colors.gray600} />
						<Text className="font-pretendard-medium text-[12px] text-gray600">{chatCount}</Text>
						<Ionicons
							name={expanded ? 'chevron-up' : 'chevron-down'}
							size={12}
							color={colors.gray600}
						/>
					</Pressable>
				)}
			</View>
			{hasChat && expanded && (
				<View className="pb-3 pt-1">
					<ArtworkChatThread messages={chatMessages} />
				</View>
			)}
		</View>
	);
}
