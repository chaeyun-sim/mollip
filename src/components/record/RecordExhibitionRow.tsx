import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ScalePressable } from '@/src/components/common/ScalePressable';

interface RecordExhibitionRowProps {
	title: string;
	venue?: string;
	/** 기간·방문일 등 한 줄 보조 정보 */
	meta?: string;
	poster?: string | null;
	/** 행 오른쪽 위 작은 표시 (예: "도슨트") */
	badge?: string;
	onPress: () => void;
}

/** 기록할 전시 한 줄 — 추천·검색 결과 공용 */
export function RecordExhibitionRow({
	title,
	venue,
	meta,
	poster,
	badge,
	onPress,
}: RecordExhibitionRowProps) {
	return (
		<ScalePressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={[badge, title, venue, meta].filter(Boolean).join(', ')}
			className="flex-row items-center gap-3.5 py-3"
		>
			{/* 벽의 액자처럼 흰 매트를 두른 포스터 */}
			<View className="rounded-[2px] border-[0.5px] border-divider bg-white p-1">
				<ImageFallback
					heroImageUri={poster}
					className="h-[64px] w-[48px] overflow-hidden bg-image-placeholder"
					iconSize={18}
					resizeMode="cover"
					useImageProxy
				/>
			</View>
			<View className="flex-1">
				<View className="flex-row items-center gap-1.5">
					{badge && (
						<Text className="overflow-hidden rounded-[4px] bg-gray900 px-1.5 py-0.5 text-white text-[10px] font-pretendard-semibold">
							{badge}
						</Text>
					)}
					<Text numberOfLines={1} className="flex-1 font-hahmlet-semibold text-[15px] text-gray900">
						{title}
					</Text>
				</View>
				{venue && (
					<Text
						numberOfLines={1}
						className="mt-1 text-gray700 text-[12.5px] font-pretendard-regular"
					>
						{venue}
					</Text>
				)}
				{meta && (
					<Text
						numberOfLines={1}
						className="mt-0.5 text-gray500 text-[12px] font-pretendard-regular"
					>
						{meta}
					</Text>
				)}
			</View>
			<Ionicons name="chevron-forward" size={16} className="text-gray400" />
		</ScalePressable>
	);
}
