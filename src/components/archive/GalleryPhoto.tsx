import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/src/components/common/Button';
import { Indicator } from '@/src/components/common/Indicator';
import { colors } from '@/src/constants/colors';

interface GalleryPhotoProps {
	uri: string;
	width: number;
	height: number;
	accessibilityLabel: string;
}

/** 갤러리 한 장 — 영역을 꽉 채우는 cover, 로드 실패는 이 장에만 보이고 다시 시도할 수 있다 */
export function GalleryPhoto({ uri, width, height, accessibilityLabel }: GalleryPhotoProps) {
	const { t } = useTranslation();

	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	// 다시 시도할 때마다 올려서 같은 URL이어도 이미지를 새로 요청한다
	const [attempt, setAttempt] = useState(0);

	const handleRetry = () => {
		setHasError(false);
		setIsLoading(true);
		setAttempt((prev) => prev + 1);
	};

	return (
		<View className="items-center justify-center bg-surface-neutral" style={{ width, height }}>
			{hasError ? (
				<View className="items-center px-8">
					<Ionicons name="image-outline" size={32} color={colors.gray500} />
					<Text className="mt-2 font-pretendard-medium text-[14px] text-gray600">
						사진을 불러오지 못했어요
					</Text>
					<Button
						variant="ghost"
						tone="brand"
						size="medium"
						icon="refresh"
						block={false}
						className="min-h-11"
						onPress={handleRetry}
						accessibilityLabel="사진 다시 불러오기"
					>
						{t('common.retry')}
					</Button>
				</View>
			) : (
				<Image
					key={attempt}
					source={{ uri }}
					contentFit="cover"
					style={{ width, height }}
					// 라벨은 이미지에만 둔다 — 부모에 image 역할을 주면 실패 UI의 재시도 버튼이 접근성 트리에서 가려진다
					accessible
					accessibilityRole="image"
					accessibilityLabel={accessibilityLabel}
					onLoad={() => setIsLoading(false)}
					onError={() => {
						setIsLoading(false);
						setHasError(true);
					}}
				/>
			)}
			{isLoading && !hasError && (
				<View pointerEvents="none" className="absolute inset-0 items-center justify-center">
					<Indicator color="brand" />
				</View>
			)}
		</View>
	);
}
