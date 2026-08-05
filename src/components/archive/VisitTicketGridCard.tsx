import { useState } from 'react';
import { Image, LayoutChangeEvent, Pressable, Text, View } from 'react-native';

import { archiveTintForKey, ARCHIVE_INK, ARCHIVE_SUBTLE } from './archivePalette';
import { useVisitStore } from '@/src/store/visitStore';

const CARD_HEIGHT = 224;
const GAP = 12;

function miniBarHeights(dateKey: string): number[] {
	const seed = dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
	return Array.from({ length: 14 }, (_, i) => ((seed + i * 5) % 3) + 1);
}

function MiniBarcode({ dateKey, color }: { dateKey: string; color: string }) {
	const heights = miniBarHeights(dateKey);
	return (
		<View className='flex-row items-end' style={{ gap: 2 }}>
			{heights.map((h, i) => (
				<View key={i} style={{ width: 2, height: h * 4, backgroundColor: color }} />
			))}
		</View>
	);
}

function formatDateLabel(dateKey: string): string {
	const [y, m, d] = dateKey.split('-');
	return `${y}.${m}.${d}`;
}

interface VisitTicketGridCardProps {
	dateKey: string;
	title: string;
	imageUrl?: string;
	width: number;
	onPress: () => void;
}

function VisitTicketGridCard({ dateKey, title, imageUrl, width, onPress }: VisitTicketGridCardProps) {
	const [imgError, setImgError] = useState(false);
	const tint = archiveTintForKey(dateKey);
	const showImage = !!imageUrl && !imgError;
	const dateLabel = formatDateLabel(dateKey);
	const imageHeight = Math.round(CARD_HEIGHT * 0.58);
	const bottomHeight = CARD_HEIGHT - imageHeight;

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole='button'
			accessibilityLabel={`${dateLabel} ${title} 관람 기록`}
			style={({ pressed }) => ({
				opacity: pressed ? 0.88 : 1,
				width,
				height: CARD_HEIGHT,
				borderRadius: 20,
				overflow: 'hidden',
				shadowColor: '#1C1917',
				shadowOpacity: 0.08,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 4 },
				elevation: 3,
			})}
		>
			{showImage ? (
				<View style={{ width, height: CARD_HEIGHT }}>
					<Image
						source={{ uri: imageUrl }}
						style={{ width, height: imageHeight }}
						resizeMode='cover'
						onError={() => setImgError(true)}
					/>
					<View
						className='px-3 justify-between'
						style={{ height: bottomHeight, backgroundColor: '#FFFFFF', paddingVertical: 10 }}
					>
						<Text
							numberOfLines={2}
							style={{ fontFamily: 'Hahmlet_700Bold', color: ARCHIVE_INK, fontSize: 13, lineHeight: 18 }}
						>
							{title}
						</Text>
						<View>
							<Text
								className='mb-1.5'
								style={{ fontFamily: 'Pretendard-Regular', fontSize: 10, color: ARCHIVE_SUBTLE }}
							>
								{dateLabel}
							</Text>
							<MiniBarcode dateKey={dateKey} color='#D6D3D1' />
						</View>
					</View>
				</View>
			) : (
				<View
					className='flex-1 px-4 justify-between'
					style={{ backgroundColor: tint, paddingVertical: 16 }}
				>
					<Text
						numberOfLines={5}
						style={{
							fontFamily: 'Hahmlet_700Bold',
							color: ARCHIVE_INK,
							fontSize: 18,
							lineHeight: 24,
							flex: 1,
						}}
					>
						{title}
					</Text>
					<View>
						<Text
							className='mb-1.5'
							style={{ fontFamily: 'Pretendard-Regular', fontSize: 10, color: ARCHIVE_SUBTLE }}
						>
							{dateLabel}
						</Text>
						<MiniBarcode dateKey={dateKey} color='rgba(28,25,23,0.2)' />
					</View>
				</View>
			)}
		</Pressable>
	);
}

interface VisitTicketGridProps {
	onPress: (dateKey: string) => void;
}

export function VisitTicketGrid({ onPress }: VisitTicketGridProps) {
	const visits = useVisitStore((s) => s.visits);
	const [containerWidth, setContainerWidth] = useState(0);

	const handleLayout = (e: LayoutChangeEvent) => {
		const w = e.nativeEvent.layout.width;
		if (w > 0 && w !== containerWidth) setContainerWidth(w);
	};

	const cardWidth = containerWidth > 0 ? (containerWidth - GAP) / 2 : 0;
	const sortedDateKeys = Object.keys(visits).sort((a, b) => b.localeCompare(a));

	return (
		<View onLayout={handleLayout} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
			{containerWidth > 0 &&
				sortedDateKeys.map((dateKey) => {
					const visit = visits[dateKey];
					const title = visit?.exhibitionTitle?.trim() || '관람 기록';
					const imageUrl = visit?.listened.find((l) => l.imageUrl)?.imageUrl;
					return (
						<VisitTicketGridCard
							key={dateKey}
							dateKey={dateKey}
							title={title}
							imageUrl={imageUrl}
							width={cardWidth}
							onPress={() => onPress(dateKey)}
						/>
					);
				})}
		</View>
	);
}
