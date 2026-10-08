import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

export interface FeaturedExhibitionProps {
	id: string;
	/** 카드 상단 레이블 (카테고리 기반 카피, 전시 원제목이 아님) */
	tagline: string;
	/** 실제 전시명 — 카드의 주인공 */
	exhibitionTitle: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
	/** 반응형 카드 폭 (부모 캐러셀이 계산) */
	width: number;
	onPress: (id: string) => void;
}

export function FeaturedExhibitionHero({
	id,
	tagline,
	exhibitionTitle,
	venue,
	thumbnail,
	status,
	width,
	onPress,
}: FeaturedExhibitionProps) {
	const title = exhibitionTitle.trim();
	const venueName = venue.trim() || '장소 정보 없음';

	const handlePress = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress(id);
	}, [id, onPress]);

	return (
		<Pressable
			onPress={handlePress}
			accessibilityRole="button"
			accessibilityLabel={`${title}, ${venueName}, ${STATUS_LABELS[status]}`}
			style={({ pressed }) => ({ width, opacity: pressed ? 0.94 : 1 })}
		>
			<View
				className="rounded-[20px] overflow-hidden shadow-gray900 elevation-md"
				style={{
					width,
					height: Math.round(width * 1.18),
					shadowOpacity: 0.14,
					shadowRadius: 18,
					shadowOffset: { width: 0, height: 8 },
				}}
			>
				<ImageFallback
					heroImageUri={thumbnail}
					className="absolute inset-0 bg-image-placeholder"
					iconSize={96}
					resizeMode="cover"
					useImageProxy
				/>
				<View className="absolute inset-0" pointerEvents="none">
					<LinearGradient
						colors={['rgba(28,25,23,0.28)', 'transparent', 'rgba(28,25,23,0.82)']}
						locations={[0, 0.4, 1]}
						style={{ flex: 1 }}
					/>
				</View>
				<View className="px-5 pt-5 flex-row">
					<Text className="text-white text-[12px] font-pretendard-semibold tracking-[0.4px] px-2.5 py-1 rounded-full bg-[rgba(28,25,23,0.72)] overflow-hidden">
						{tagline}
					</Text>
				</View>
				<View className="flex-1 justify-end px-5 pb-5">
					<Text
						className="text-white text-[26px] leading-[34px] font-hahmlet-bold"
						numberOfLines={3}
					>
						{title}
					</Text>
					<View className="flex-row items-center gap-1.5 mt-2.5">
						<Ionicons name="location-outline" size={14} className="text-white/80" />
						<Text
							className="flex-1 text-white/80 text-[13px] font-pretendard-regular"
							numberOfLines={1}
						>
							{venueName}
						</Text>
						<Text className="text-white text-[11px] font-pretendard-semibold px-2.5 py-1 rounded-full bg-white/20 overflow-hidden">
							{STATUS_LABELS[status]}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}
