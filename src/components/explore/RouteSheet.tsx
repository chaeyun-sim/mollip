import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildRoutePrompt, ROUTE_SYSTEM_PROMPT } from '@/src/constants/prompts';
import { streamRoute } from '@/src/utils/api';

interface RouteSheetArtwork {
	title: string;
	artist?: string;
	year?: string;
	description?: string;
}

interface RouteSheetProps {
	visible: boolean;
	exhibitionTitle: string;
	venue: string;
	artworks: RouteSheetArtwork[];
	onClose: () => void;
}

export function RouteSheet({
	visible,
	exhibitionTitle,
	venue,
	artworks,
	onClose,
}: RouteSheetProps) {
	const insets = useSafeAreaInsets();
	const [text, setText] = useState('');
	const [streaming, setStreaming] = useState(false);
	const abortedRef = useRef(false);

	useEffect(() => {
		if (!visible) {
			abortedRef.current = true;
			setText('');
			return;
		}

		abortedRef.current = false;
		setStreaming(true);
		setText('');

		const run = async () => {
			try {
				const prompt = buildRoutePrompt(exhibitionTitle, venue, artworks);
				const gen = streamRoute(ROUTE_SYSTEM_PROMPT, prompt);
				for await (const chunk of gen) {
					if (abortedRef.current) break;
					setText((prev) => prev + chunk);
				}
			} catch (e) {
				console.warn('[route] stream error:', e);
			} finally {
				setStreaming(false);
			}
		};

		void run();
	}, [visible, exhibitionTitle, venue, artworks]);

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<View className="flex-1 justify-end">
				<Pressable
					className="flex-1"
					onPress={onClose}
					accessibilityLabel="닫기"
					accessibilityRole="button"
				/>
				<View
					className="bg-primary rounded-t-3xl px-6 pt-5"
					style={{ paddingBottom: insets.bottom + 24, maxHeight: '80%' }}
				>
					<View className="flex-row items-center justify-between mb-5">
						<Text className="text-white font-pretendard-semibold text-[17px]">추천 관람 루트</Text>
						<Pressable
							onPress={onClose}
							hitSlop={8}
							accessibilityLabel="닫기"
							accessibilityRole="button"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons name="close" size={22} color="white" />
						</Pressable>
					</View>

					{streaming && text.length === 0 ? (
						<View className="items-center py-12">
							<ActivityIndicator color="white" />
							<Text className="text-white/50 font-pretendard-regular text-[13px] mt-3">
								루트를 생성하고 있어요...
							</Text>
						</View>
					) : (
						<ScrollView showsVerticalScrollIndicator={false}>
							<Text className="text-white/90 font-pretendard-regular text-[15px] leading-[26px] pb-2">
								{text}
							</Text>
							{streaming && (
								<ActivityIndicator
									color="rgba(255,255,255,0.4)"
									size="small"
									style={{ marginTop: 4, marginBottom: 8 }}
								/>
							)}
						</ScrollView>
					)}
				</View>
			</View>
		</Modal>
	);
}
