import { Ionicons } from '@expo/vector-icons';
import { Text, useWindowDimensions, View } from 'react-native';

import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { HOME_SIDE_PADDING } from '@/src/components/home/HomeSectionHeader';
import type { DailyArtwork } from '@/src/data/dailyArtworks';
import { cn } from '@/src/lib/cn';

interface DailyArtworkBandProps {
	artwork: DailyArtwork;
	imageUrl: string | null;
	isImageLoading: boolean;
	onListen: () => void;
	/** 화면 맨 아래에 둘 때 FAB·탭바에 가리지 않도록 하단 여백을 늘리는 용도 */
	className?: string;
}

/** 오늘의 명화 — 다크 갤러리 밴드에 퍼블릭 도메인 명화 1점과 AI 도슨트 해설 진입 */
export function DailyArtworkBand({
	artwork,
	imageUrl,
	isImageLoading,
	onListen,
	className,
}: DailyArtworkBandProps) {
	const { width: windowWidth } = useWindowDimensions();

	const contentWidth = Math.max(0, windowWidth - HOME_SIDE_PADDING * 2);
	const imageHeight = Math.round((contentWidth * 3) / 4);

	return (
		<View
			className={cn('bg-bg-dark py-10', className)}
			style={{ paddingHorizontal: HOME_SIDE_PADDING }}
		>
			<Text className="text-on-dark/60 text-[11px] font-pretendard-semibold tracking-[1.2px]">
				TODAY&apos;S MASTERPIECE
			</Text>
			<Text className="mt-1 text-white text-[22px] leading-[30px] font-hahmlet-bold">
				오늘의 명화
			</Text>

			<View
				className="mt-5 overflow-hidden rounded-[16px] bg-gray800"
				style={{ width: contentWidth, height: imageHeight }}
			>
				{isImageLoading ? (
					<View className="flex-1 bg-gray800" />
				) : (
					<ImageFallback
						heroImageUri={imageUrl}
						className="absolute inset-0 bg-gray800"
						iconSize={72}
						resizeMode="contain"
						accessibilityLabel={`${artwork.title}, ${artwork.artist}`}
					/>
				)}
			</View>

			<Text className="mt-5 text-white text-[20px] leading-[28px] font-pretendard-semibold">
				{artwork.title}
			</Text>
			<Text className="mt-1 text-on-dark/70 text-[13px] font-pretendard-regular">
				{`${artwork.artist} · ${artwork.year}`}
			</Text>
			<Text className="mt-3 text-on-dark/80 text-[13px] leading-[20px] font-pretendard-regular">
				이 그림에는 어떤 이야기가 숨어 있을까요? AI 도슨트가 작품의 배경과 감상 포인트를 들려드려요.
			</Text>

			<LoginRequiredPressable
				onPress={onListen}
				returnTo="/(tabs)"
				accessibilityRole="button"
				accessibilityLabel={`${artwork.title} AI 도슨트 해설 듣기`}
				className="mt-6 h-12 flex-row items-center justify-center gap-2 rounded-full bg-primary"
				style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
			>
				<Ionicons name="headset" size={18} className="text-white" />
				<Text className="text-white text-[15px] font-pretendard-semibold">AI 도슨트 해설 듣기</Text>
			</LoginRequiredPressable>

			<Text className="mt-4 text-on-dark/60 text-[10px] font-pretendard-regular">
				The Metropolitan Museum of Art · Public Domain
			</Text>
		</View>
	);
}
