import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import { cn } from '@/src/lib/cn';
import type { Message } from '@/src/store/chatStore';
import { getEffectiveFontSize, useSettingsStore } from '@/src/store/settingsStore';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';
import { colors } from '@/src/constants/colors';

const DOCENT_AVATAR = require('../../../assets/images/marker/gogh.png');
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Segment {
	type: 'text' | 'artwork';
	content: string;
}

function parseSegments(text: string): Segment[] {
	const segments: Segment[] = [];
	const regex = /「([^」]+)」/g;
	let lastIndex = 0;
	let match;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
		}
		segments.push({ type: 'artwork', content: match[1] });
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		segments.push({ type: 'text', content: text.slice(lastIndex) });
	}
	return segments;
}

interface ChatMessageProps {
	item: Message;
	onRetry: (item: Message) => void;
}

export function ChatMessage({ item, onRetry }: ChatMessageProps) {
	const isUser = item.role === 'user';
	const { fontSize, highContrast } = useSettingsStore();
	const bodyFontSize = getEffectiveFontSize(fontSize, highContrast);

	const [copyMenuVisible, setCopyMenuVisible] = useState(false);
	const [selectCopyVisible, setSelectCopyVisible] = useState(false);
	const [imageModalVisible, setImageModalVisible] = useState(false);
	const [artworkName, setArtworkName] = useState('');
	const [artworkImageUrl, setArtworkImageUrl] = useState<string | null>(null);
	const [imageLoading, setImageLoading] = useState(false);

	const handleArtworkTap = useCallback(async (name: string) => {
		setArtworkName(name);
		setArtworkImageUrl(null);
		setImageLoading(true);
		setImageModalVisible(true);
		try {
			const url = await fetchWikidataImage(name);
			setArtworkImageUrl(url);
		} catch {
			// silent
		} finally {
			setImageLoading(false);
		}
	}, []);

	const handleCopy = useCallback(async () => {
		setCopyMenuVisible(false);
		await Clipboard.setStringAsync(item.text);
	}, [item.text]);

	const handleSelectCopy = useCallback(() => {
		setCopyMenuVisible(false);
		setSelectCopyVisible(true);
	}, []);

	const segments = parseSegments(item.text);
	const hasArtwork = segments.some((s) => s.type === 'artwork');

	function renderMessageText() {
		const textClass = cn(
			isUser ? 'text-white' : (highContrast ? 'text-black' : 'text-[#e8e8e8]'),
		);

		const textStyle = { fontSize: bodyFontSize, lineHeight: bodyFontSize * 1.6 };

		if (!hasArtwork) {
			return <Text className={textClass} style={textStyle}>{item.text}</Text>;
		}

		return (
			<Text className={textClass} style={textStyle}>
				{segments.map((seg, i) =>
					seg.type === 'artwork' ? (
						<Text
							key={i}
							className='text-[#60A5FA] font-pretendard-semibold'
							onPress={() => handleArtworkTap(seg.content)}
							accessibilityLabel={`${seg.content} 이미지 보기`}
							accessibilityRole='button'
						>
							「{seg.content}」
						</Text>
					) : (
						<Text key={i}>{seg.content}</Text>
					),
				)}
			</Text>
		);
	}

	return (
		<View className={cn('mb-4', isUser ? 'items-end' : 'items-start')}>
			{!isUser && <Image source={DOCENT_AVATAR} className='w-7 h-7 mb-1' />}
			{item.isError ? (
				<Pressable
					className='flex-row items-center gap-1.5'
					onPress={() => onRetry(item)}
					accessibilityLabel='다시 시도'
					accessibilityRole='button'
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Text className='font-pretendard-regular text-tertiary text-[13px]'>
						일시적인 오류가 발생했습니다
					</Text>
					<Ionicons name='refresh-outline' size={14} color={colors.tertiary} />
				</Pressable>
			) : (
				<Pressable
					className={cn(
						'rounded-2xl px-4 py-3 max-w-[80%]',
						isUser
							? 'rounded-tr-sm bg-accent'
							: cn('rounded-tl-sm', highContrast ? 'bg-[#F0EFED]' : 'bg-primary border-white/[0.08]'),
					)}
					style={{ borderWidth: isUser ? 0 : (highContrast ? 0 : StyleSheet.hairlineWidth) }}
					onLongPress={!isUser ? () => setCopyMenuVisible(true) : undefined}
					delayLongPress={450}
				>
					{item.text === '' && !isUser ? (
						<ActivityIndicator size='small' color='#60A5FA' />
					) : (
						renderMessageText()
					)}
				</Pressable>
			)}

			{/* 복사 메뉴 */}
			<Modal
				visible={copyMenuVisible}
				transparent
				animationType='fade'
				onRequestClose={() => setCopyMenuVisible(false)}
			>
				<Pressable
					style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
					onPress={() => setCopyMenuVisible(false)}
				>
					<View className='absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] overflow-hidden pb-10'>
						<View className='w-10 h-1 rounded-full bg-black/10 self-center mt-3 mb-1' />
						{[
							{ label: '복사', onPress: handleCopy },
							{ label: '선택 복사', onPress: handleSelectCopy },
						].map((action, i) => (
							<View key={action.label}>
								{i > 0 && (
									<View
										className='bg-black/[0.08] mx-5'
										style={{ height: StyleSheet.hairlineWidth }}
									/>
								)}
								<Pressable
									onPress={action.onPress}
									className='px-6 py-5'
									style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
								>
									<Text className='text-[18px] font-pretendard-regular text-primary'>
										{action.label}
									</Text>
								</Pressable>
							</View>
						))}
					</View>
				</Pressable>
			</Modal>

			{/* 선택 복사 — 텍스트 직접 선택 */}
			<Modal
				visible={selectCopyVisible}
				transparent
				animationType='slide'
				onRequestClose={() => setSelectCopyVisible(false)}
			>
				<Pressable
					style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
					onPress={() => setSelectCopyVisible(false)}
				>
					<View className='absolute bottom-0 left-0 right-0 bg-primary rounded-t-[24px] px-6 pt-5 pb-12'>
						<View className='flex-row items-center justify-between mb-4'>
							<Text className='text-white/50 font-pretendard-regular text-[13px]'>
								텍스트를 꾹 눌러 원하는 부분 선택
							</Text>
							<Pressable
								onPress={() => setSelectCopyVisible(false)}
								hitSlop={8}
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							>
								<Ionicons name='close' size={20} color='rgba(255,255,255,0.6)' />
							</Pressable>
						</View>
						<ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
							<Text
								selectable
								className='text-[#e8e8e8] font-pretendard-regular text-[15px] leading-[24px]'
							>
								{item.text}
							</Text>
						</ScrollView>
					</View>
				</Pressable>
			</Modal>

			{/* 작품 이미지 팝업 */}
			<Modal
				visible={imageModalVisible}
				transparent
				statusBarTranslucent
				animationType='fade'
				onRequestClose={() => setImageModalVisible(false)}
			>
				<View style={{ flex: 1, backgroundColor: 'black' }}>
					<View
						className='absolute left-0 right-0 flex-row items-center justify-between px-5 z-10'
						style={{ top: 56 }}
					>
						<Text
							className='text-white font-pretendard-semibold text-[15px] flex-1 mr-4'
							numberOfLines={1}
						>
							「{artworkName}」
						</Text>
						<Pressable
							onPress={() => setImageModalVisible(false)}
							hitSlop={12}
							accessibilityLabel='닫기'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons name='close' size={28} color='white' />
						</Pressable>
					</View>

					{imageLoading ? (
						<View className='flex-1 items-center justify-center gap-3'>
							<ActivityIndicator color='rgba(255,255,255,0.5)' size='large' />
							<Text className='text-white/40 font-pretendard-regular text-[13px]'>
								이미지 검색 중...
							</Text>
						</View>
					) : artworkImageUrl ? (
						<ScrollView
							contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
							maximumZoomScale={4}
							minimumZoomScale={1}
							showsVerticalScrollIndicator={false}
							showsHorizontalScrollIndicator={false}
							centerContent
						>
							<Image
								source={{ uri: artworkImageUrl }}
								style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
								resizeMode='contain'
								accessibilityLabel={`「${artworkName}」 이미지`}
							/>
						</ScrollView>
					) : (
						<View className='flex-1 items-center justify-center gap-3'>
							<Ionicons name='image-outline' size={48} color='rgba(255,255,255,0.3)' />
							<Text className='text-white/40 font-pretendard-regular text-[14px]'>
								이미지를 찾을 수 없어요
							</Text>
						</View>
					)}
				</View>
			</Modal>
		</View>
	);
}
