import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { FloatingBackButton } from '@/src/components/common/FloatingBackButton';
import { FloatingIconButton } from '@/src/components/common/FloatingIconButton';

interface ExhibitionDetailFloatingActionsProps {
	onBack: () => void;
	onShare: () => void;
	onBookmark: () => void;
	onRoute: () => void;
	isBookmarked: boolean;
	insetTop: number;
}

export function ExhibitionDetailFloatingActions({
	onBack,
	onShare,
	onBookmark,
	onRoute,
	isBookmarked,
	insetTop,
}: ExhibitionDetailFloatingActionsProps) {
	return (
		<View
			className='absolute flex-row justify-between w-full items-center px-5'
			style={{ top: insetTop + 16 }}
		>
			{/* 뒤로가기 버튼 */}
			<FloatingBackButton onPress={onBack} />

			{/* 우측 상단 버튼 그룹 (루트 + 공유 + 북마크) */}
			<View className='flex-row gap-2'>
				<FloatingIconButton
					onPress={onRoute}
					haptic
					accessibilityLabel='관람 루트 보기'
					icon={<MaterialCommunityIcons name='map-marker-path' size={20} color='#1a1a1a' />}
				/>
				<FloatingIconButton
					onPress={onShare}
					haptic
					accessibilityLabel='공유하기'
					icon={<Ionicons name='share-outline' size={20} color='#1a1a1a' />}
				/>
				<FloatingIconButton
					onPress={onBookmark}
					haptic
					accessibilityLabel='북마크'
					icon={
						<Ionicons
							name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
							size={20}
							color={isBookmarked ? '#111827' : '#1a1a1a'}
						/>
					}
				/>
			</View>
		</View>
	);
}
