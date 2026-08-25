import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import type {
	ImageResizeMode,
	ImageSourcePropType,
	StyleProp,
	ViewStyle,
} from 'react-native';
import { proxiedImageUrl } from '@/src/utils/imageProxy';
import { cn } from '@/src/lib/cn';

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
	/** true면 원격 URI를 image-proxy 경유로 먼저 시도하고, 실패 시 원본 URL로 재시도한다 */
	useImageProxy?: boolean;
	/** 지정하면 원격 이미지 로딩 중 해당 색상으로 스피너를 겹쳐 보여준다 */
	loadingIndicatorColor?: string;
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

	const remoteSource =
		useImageProxy && !proxyFailed && remoteUri ? proxiedImageUrl(remoteUri) : remoteUri;

	const handleRemoteError = () => {
		if (useImageProxy && !proxyFailed) {
			setProxyFailed(true);
			setLoading(true);
			return;
		}
		setLoadFailed(true);
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
					resizeMode={resizeMode}
					onLoadEnd={() => setLoading(false)}
					onError={handleRemoteError}
				/>
			) : showLocal ? (
				<Image
					source={posterImage}
					style={StyleSheet.absoluteFill}
					resizeMode={resizeMode}
					onError={() => setLoadFailed(true)}
				/>
			) : null}
			{showImage && loadingIndicatorColor && loading ? (
				<View style={StyleSheet.absoluteFill} className='items-center justify-center'>
					<ActivityIndicator color={loadingIndicatorColor} />
				</View>
			) : null}
			{showImage && dimOverlay ? (
				<View
					pointerEvents='none'
					style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)' }]}
				/>
			) : null}
			{showPlaceholder ? (
				<View style={StyleSheet.absoluteFill} className='items-center justify-center'>
					<Image
						source={QUESTION_MARK}
						style={{ width: iconSize, height: iconSize }}
						resizeMode='contain'
					/>
				</View>
			) : null}
			{children}
		</View>
	);
}
