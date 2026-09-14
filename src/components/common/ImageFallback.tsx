import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ImageResizeMode, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { Image, type ImageContentFit } from 'expo-image';
import { proxiedImageUrl } from '@/src/utils/imageProxy';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';
import { Indicator } from './Indicator';

const RESIZE_MODE_TO_CONTENT_FIT: Record<ImageResizeMode, ImageContentFit> = {
	cover: 'cover',
	contain: 'contain',
	stretch: 'fill',
	center: 'contain',
	repeat: 'cover',
	none: 'none',
};

export const QUESTION_MARK = require('@/assets/images/skulpture/question.png');

function isUsableRemoteUri(uri?: string | null): boolean {
	return Boolean(uri?.trim());
}

interface ImageFallbackProps {
	heroImageUri?: string | null;
	posterImage?: ImageSourcePropType;
	className?: string;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
	resizeMode?: ImageResizeMode;
	children?: React.ReactNode;
	/** 실제 이미지가 보일 때만 살짝 어둡게 (히어로 상단 버튼 대비) */
	dimOverlay?: boolean;
	accessibilityLabel?: string;
	/** true면 원본 URL이 실패할 때 image-proxy로 한 번 더 시도한다 */
	useImageProxy?: boolean;
	/** 지정하면 원격 이미지 로딩 중 해당 색상으로 스피너를 겹쳐 보여준다 */
	loadingIndicatorColor?: keyof typeof colors;
	/** 이미지가 없거나 로드에 실패해 placeholder(question mark)로 대체될 때 호출됨 */
	onFallback?: () => void;
}

/** 원격 URI·로컬 소스가 없거나 로드 실패 시 question.png 빈 상태로 대체하는 이미지. */
export function ImageFallback({
	heroImageUri,
	posterImage,
	className,
	style,
	iconSize = 96,
	resizeMode = 'cover',
	children,
	dimOverlay = false,
	accessibilityLabel,
	useImageProxy = false,
	loadingIndicatorColor,
	onFallback,
}: ImageFallbackProps) {
	const [loadFailed, setLoadFailed] = useState(false);
	const [proxyFailed, setProxyFailed] = useState(false);
	const [loading, setLoading] = useState(true);
	const remoteUri = heroImageUri?.trim();
	const hasRemote = isUsableRemoteUri(remoteUri);
	const hasLocal = posterImage != null;
	const sourceKey = hasRemote ? remoteUri : hasLocal ? 'local' : 'none';

	useEffect(() => {
		setLoadFailed(false);
		setProxyFailed(false);
		setLoading(true);
	}, [sourceKey]);

	const showRemote = hasRemote && !loadFailed;
	const showLocal = !hasRemote && hasLocal && !loadFailed;
	const showPlaceholder = !showRemote && !showLocal;
	const showImage = showRemote || showLocal;

	useEffect(() => {
		if (showPlaceholder) onFallback?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [showPlaceholder]);

	const remoteSource =
		useImageProxy && proxyFailed && remoteUri ? proxiedImageUrl(remoteUri) : remoteUri;

	const handleRemoteError = () => {
		if (useImageProxy && !proxyFailed) {
			setProxyFailed(true);
			setLoading(true);
			return;
		}
		setLoadFailed(true);
		setLoading(false);
	};

	return (
		<View
			className={cn('bg-bg-tonal overflow-hidden', className)}
			style={style}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={accessibilityLabel ? 'image' : undefined}
		>
			{showRemote ? (
				<Image
					source={{ uri: remoteSource ?? remoteUri }}
					style={StyleSheet.absoluteFill}
					contentFit={RESIZE_MODE_TO_CONTENT_FIT[resizeMode]}
					recyclingKey={remoteSource ?? remoteUri}
					onLoadEnd={() => setLoading(false)}
					onError={handleRemoteError}
				/>
			) : showLocal ? (
				<Image
					source={posterImage}
					style={StyleSheet.absoluteFill}
					contentFit={RESIZE_MODE_TO_CONTENT_FIT[resizeMode]}
					onLoadEnd={() => setLoading(false)}
					onError={() => setLoadFailed(true)}
				/>
			) : null}
			{showImage && loadingIndicatorColor && loading && (
				<View className="absolute inset-0 items-center justify-center">
					<Indicator color={loadingIndicatorColor} />
				</View>
			)}
			{showImage && dimOverlay && (
				<View pointerEvents="none" className="absolute inset-0 bg-black/15" />
			)}
			{showPlaceholder && (
				<View className="absolute inset-0 items-center justify-center">
					<Image
						source={QUESTION_MARK}
						style={{ width: iconSize, height: iconSize }}
						contentFit="contain"
					/>
				</View>
			)}
			{children}
		</View>
	);
}
