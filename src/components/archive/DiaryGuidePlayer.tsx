import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import { colors } from '@/src/constants/colors';
import { useTTS } from '@/src/hooks/useTTS';
import { useHistoryStore, type HistoryItem } from '@/src/store/historyStore';
import { proxiedImageUrl } from '@/src/utils/imageProxy';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';

export interface DiaryGuidePlayerHandle {
	expand: () => void;
}

interface DiaryGuidePlayerProps {
	item: HistoryItem | null;
	onClose: () => void;
}

// 다이어리 날짜 상세 — 북마크 오디오와 같은 BottomSheet.
// ScrollView 형제가 되어야 화면 하단에서 올라오고 별점 위에 뜬다.
export const DiaryGuidePlayer = forwardRef<DiaryGuidePlayerHandle, DiaryGuidePlayerProps>(
	function DiaryGuidePlayer({ item, onClose }, ref) {
		const sheetRef = useRef<BottomSheet>(null);
		const { isSpeaking, isLoading, speak, pause, stop } = useTTS();
		const updateHistory = useHistoryStore((s) => s.update);
		const [wikiImageUrl, setWikiImageUrl] = useState<string | null>(null);
		const [wikiImageLoading, setWikiImageLoading] = useState(false);

		useEffect(() => {
			setWikiImageUrl(item?.imageUrl ?? null);
			if (!item || item.imageUrl) {
				setWikiImageLoading(false);
				return;
			}

			let cancelled = false;
			setWikiImageLoading(true);
			void fetchWikidataImage(item.title, item.artist, item.text)
				.then((url) => {
					if (cancelled) return;
					if (url) {
						setWikiImageUrl(url);
						updateHistory(item.id, { imageUrl: url });
					}
				})
				.finally(() => {
					if (!cancelled) setWikiImageLoading(false);
				});
			return () => {
				cancelled = true;
			};
		}, [item, updateHistory]);

		useImperativeHandle(ref, () => ({
			expand: () => sheetRef.current?.snapToIndex(0),
		}));

		const handleClose = useCallback(() => {
			stop();
			sheetRef.current?.close();
		}, [stop]);

		const handleSheetClose = useCallback(() => {
			stop();
			onClose();
		}, [onClose, stop]);

		const handlePlayPause = useCallback(() => {
			if (!item) return;
			if (isSpeaking) {
				pause();
				return;
			}
			void speak(item.text);
		}, [item, isSpeaking, pause, speak]);

		return (
			<BottomSheet
				ref={sheetRef}
				index={-1}
				snapPoints={['50%', '75%']}
				enableDynamicSizing={false}
				enablePanDownToClose
				enableHandlePanningGesture
				onClose={handleSheetClose}
				backgroundStyle={{ backgroundColor: colors.gray900 }}
				handleIndicatorStyle={{ backgroundColor: colors.gray700 }}
				backdropComponent={(props) => (
					<BottomSheetBackdrop
						{...props}
						disappearsOnIndex={-1}
						appearsOnIndex={0}
						opacity={0.55}
						pressBehavior="close"
					/>
				)}
			>
				{item && (
					<BottomSheetScrollView contentContainerClassName="px-6 pb-12">
						<View className="flex-row items-start justify-between pt-2 pb-5">
							<View className="flex-1 pr-4">
								<Text className="text-white text-[17px] font-pretendard-semibold leading-[24px]">
									{item.title}
								</Text>
								{item.artist && (
									<Text className="text-gray500 text-[13px] font-pretendard-regular mt-0.5">
										{item.artist}
									</Text>
								)}
							</View>
							<View className="flex-row items-center gap-4">
								<Pressable
									onPress={handlePlayPause}
									hitSlop={8}
									accessibilityLabel={isSpeaking ? '일시정지' : '해설 듣기'}
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									{isLoading ? (
										<ActivityIndicator size="small" color={colors.primary} />
									) : (
										<Ionicons
											name={isSpeaking ? 'pause-circle' : 'play-circle'}
											size={28}
											color={colors.primary}
										/>
									)}
								</Pressable>
								<Pressable
									onPress={handleClose}
									hitSlop={8}
									accessibilityLabel="닫기"
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name="close" size={22} color={colors.gray600} />
								</Pressable>
							</View>
						</View>

						<Text className="text-on-dark font-pretendard-medium leading-[28px] text-[15px]">
							{item.text}
						</Text>
						{wikiImageLoading ? (
							<View className="mt-6 h-[220px] items-center justify-center">
								<ActivityIndicator color={colors.primary} />
							</View>
						) : wikiImageUrl ? (
							<ImageFallback
								heroImageUri={proxiedImageUrl(wikiImageUrl) ?? wikiImageUrl}
								useImageProxy
								resizeMode="contain"
								className="mt-6 w-full h-[220px] rounded-lg bg-gray800"
								loadingIndicatorColor={colors.primary}
								accessibilityLabel={`${item.title} 작품 이미지`}
							/>
						) : null}
					</BottomSheetScrollView>
				)}
			</BottomSheet>
		);
	},
);
