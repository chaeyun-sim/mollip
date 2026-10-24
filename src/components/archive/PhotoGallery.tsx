import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
	FlatList,
	Text,
	View,
	useWindowDimensions,
	type LayoutChangeEvent,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
} from 'react-native';
import { GalleryPhoto } from '@/src/components/archive/GalleryPhoto';
import { cn } from '@/src/lib/cn';
import {
	galleryStageHeight,
	pageIndexFromOffset,
	resolveActiveIndex,
} from '@/src/utils/visitGallery';

interface PhotoGalleryProps {
	photos: string[];
	/** 사진이 없을 때 보여줄 전시명, 스크린리더 라벨에도 쓴다 */
	title: string;
	/** 사진 위 상단에 까는 스크림 높이(상태바 + 버튼 줄). 상태바 글자가 사진 위에서 읽히게 한다. 0이면 없음 */
	scrimHeight?: number;
	className?: string;
}

/** 기록 사진 히어로 갤러리 — 풀폭 가로 페이징(cover), 2장 이상이면 사진 안쪽 하단 중앙에 캐러셀 점을 겹쳐 둔다 */
export function PhotoGallery({ photos, title, scrimHeight = 0, className }: PhotoGalleryProps) {
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();
	const [width, setWidth] = useState(0);
	// 인덱스와 함께 보던 사진의 uri를 들고 있어야 목록이 바뀌어도 같은 사진을 따라갈 수 있다
	const [selection, setSelection] = useState({ index: 0, uri: photos[0] });
	const pagerRef = useRef<FlatList<string>>(null);

	const total = photos.length;
	const photosKey = photos.join('\n');
	// 사진이 줄거나 바뀌면 보정한 값을 상태에 저장한다 — 다시 늘어나도 옛 인덱스가 되살아나지 않는다
	const current = resolveActiveIndex(selection.uri, selection.index, photos);
	if (current !== selection.index || photos[current] !== selection.uri) {
		setSelection({ index: current, uri: photos[current] });
	}
	const stageHeight = galleryStageHeight(windowWidth, windowHeight);
	const isMulti = total > 1;

	// 폭(회전·분할 화면)이나 사진 목록이 바뀌면 보고 있던 장에 다시 맞춘다
	useEffect(() => {
		if (width <= 0 || total === 0) return;
		pagerRef.current?.scrollToOffset({ offset: current * width, animated: false });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [width, photosKey]);

	const handleLayout = (event: LayoutChangeEvent) => {
		const nextWidth = Math.round(event.nativeEvent.layout.width);
		setWidth((prev) => (prev === nextWidth ? prev : nextWidth));
	};

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const next = pageIndexFromOffset(event.nativeEvent.contentOffset.x, width, total);
		setSelection((prev) =>
			prev.index === next && prev.uri === photos[next] ? prev : { index: next, uri: photos[next] },
		);
	};

	if (total === 0) {
		return (
			<View
				className={cn('w-full items-center justify-center bg-surface-neutral px-10', className)}
				style={{ height: stageHeight }}
				accessibilityRole="image"
				accessibilityLabel={`${title}, 등록된 사진이 없어요`}
			>
				<Text
					numberOfLines={4}
					className="text-center font-hahmlet-bold text-[18px] leading-[26px] text-ink"
				>
					{title}
				</Text>
				<Text className="mt-3 font-pretendard-regular text-[12px] text-gray600">
					등록된 사진이 없어요
				</Text>
			</View>
		);
	}

	return (
		<View className={className}>
			<View className="w-full" style={{ height: stageHeight }} onLayout={handleLayout}>
				{width > 0 && (
					<FlatList
						ref={pagerRef}
						data={photos}
						keyExtractor={(uri) => uri}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						scrollEventThrottle={16}
						onScroll={handleScroll}
						initialNumToRender={1}
						windowSize={3}
						getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
						renderItem={({ item, index }) => (
							<GalleryPhoto
								uri={item}
								width={width}
								height={stageHeight}
								accessibilityLabel={`${title} 사진 ${index + 1}/${total}`}
							/>
						)}
					/>
				)}
				{isMulti && (
					// 사진 안쪽 하단 중앙(16px) — 밝은 사진에서도 보이게 반투명 어두운 알약 위에 올린다. 터치는 통과시켜 스와이프를 막지 않는다
					<View pointerEvents="none" className="absolute inset-x-0 bottom-4 items-center">
						<View
							accessible
							accessibilityLabel={`사진 ${current + 1}/${total}`}
							accessibilityLiveRegion="polite"
							className="flex-row items-center gap-[5px] rounded-full bg-black/40 px-2.5 py-1.5"
						>
							{photos.map((uri, index) => (
								<View
									key={uri}
									className={cn(
										'h-[5px] rounded-full',
										index === current ? 'w-[14px] bg-white' : 'w-[5px] bg-white/50',
									)}
								/>
							))}
						</View>
					</View>
				)}
				{scrimHeight > 0 && (
					<LinearGradient
						pointerEvents="none"
						colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']}
						style={{ position: 'absolute', top: 0, left: 0, right: 0, height: scrimHeight }}
					/>
				)}
			</View>
		</View>
	);
}
