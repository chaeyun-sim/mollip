import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageResizeMode, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

/** 화면 배경(#F8F6F2)보다 한 톤 진한 포스터 빈 상태 배경 */
export const EXHIBITION_POSTER_PLACEHOLDER_BG = '#F2EFE9';

const QUESTION_MARK = require('@/assets/images/skulpture/question.png');

interface EmptyImagePlaceholderProps {
	className?: string;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
}

export function EmptyImagePlaceholder({
	className = 'flex-1 items-center justify-center',
	style,
	iconSize = 96,
}: EmptyImagePlaceholderProps) {
	return (
		<View
			className={className}
			style={[{ backgroundColor: EXHIBITION_POSTER_PLACEHOLDER_BG }, style]}
		>
			<Image
				source={QUESTION_MARK}
				style={{ width: iconSize, height: iconSize }}
				resizeMode='contain'
			/>
		</View>
	);
}

function isUsableRemoteUri(uri?: string | null): boolean {
	return Boolean(uri?.trim());
}

interface ExhibitionPosterProps {
	heroImageUri?: string | null;
	posterImage?: ImageSourcePropType;
	className?: string;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
	resizeMode?: ImageResizeMode;
	children?: React.ReactNode;
	/** 실제 포스터가 보일 때만 살짝 어둡게 (히어로 상단 버튼 대비) */
	dimOverlay?: boolean;
}

/** 포스터 URI·로컬 소스가 없거나 로드 실패 시 question.png 빈 상태 */
export function ExhibitionPoster({
	heroImageUri,
	posterImage,
	className,
	style,
	iconSize = 96,
	resizeMode = 'cover',
	children,
	dimOverlay = false,
}: ExhibitionPosterProps) {
	const [loadFailed, setLoadFailed] = useState(false);
	const remoteUri = heroImageUri?.trim();
	const hasRemote = isUsableRemoteUri(remoteUri);
	const hasLocal = posterImage != null;
	const sourceKey = hasRemote ? remoteUri : hasLocal ? 'local' : 'none';

	useEffect(() => {
		setLoadFailed(false);
	}, [sourceKey]);

	const showRemote = hasRemote && !loadFailed;
	const showLocal = !hasRemote && hasLocal && !loadFailed;
	const showPlaceholder = !showRemote && !showLocal;
	const showImage = showRemote || showLocal;

	return (
		<View
			className={className}
			style={[{ backgroundColor: EXHIBITION_POSTER_PLACEHOLDER_BG, overflow: 'hidden' }, style]}
		>
			{showRemote ? (
				<Image
					source={{ uri: remoteUri }}
					style={StyleSheet.absoluteFill}
					resizeMode={resizeMode}
					onError={() => setLoadFailed(true)}
				/>
			) : showLocal ? (
				<Image
					source={posterImage}
					style={StyleSheet.absoluteFill}
					resizeMode={resizeMode}
					onError={() => setLoadFailed(true)}
				/>
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
