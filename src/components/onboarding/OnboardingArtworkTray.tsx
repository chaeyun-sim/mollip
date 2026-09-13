import { useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAccessibilityAnnouncement } from '@/src/hooks/useAccessibilityAnnouncement';
import type { OnboardingWallPiece, OnboardingWallTray } from '@/src/data/onboardingWallTrays';

interface OnboardingArtworkTrayProps {
	tray: OnboardingWallTray;
	onSelect: (piece: OnboardingWallPiece) => void;
	/** 트레이 전환 직후 발화할 안내 문구 — null이면 발화하지 않는다 (AC-7) */
	announcement: string | null;
}

const MIN_PANEL_HEIGHT = 168;

function renderTexture(texture: OnboardingWallPiece['texture']) {
	if (texture === 'diagonal') {
		return (
			<View className="absolute inset-0 overflow-hidden opacity-20">
				<View className="absolute -left-6 top-2 w-[140%] h-2 bg-white rotate-[-24deg]" />
				<View className="absolute -left-6 top-10 w-[140%] h-2 bg-white rotate-[-24deg]" />
				<View className="absolute -left-6 top-[72px] w-[140%] h-2 bg-white rotate-[-24deg]" />
			</View>
		);
	}

	if (texture === 'dot') {
		return (
			<View className="absolute inset-0 flex-row flex-wrap opacity-25 p-2 gap-2">
				{Array.from({ length: 9 }).map((_, i) => (
					<View key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
				))}
			</View>
		);
	}

	if (texture === 'grid') {
		return (
			<View className="absolute inset-0 opacity-20">
				<View className="absolute left-1/3 top-0 bottom-0 w-[1.5px] bg-white" />
				<View className="absolute left-2/3 top-0 bottom-0 w-[1.5px] bg-white" />
				<View className="absolute top-1/3 left-0 right-0 h-[1.5px] bg-white" />
				<View className="absolute top-2/3 left-0 right-0 h-[1.5px] bg-white" />
			</View>
		);
	}

	if (texture === 'wave') {
		return (
			<View className="absolute inset-0 overflow-hidden opacity-20">
				<View className="absolute -left-4 top-6 w-[130%] h-8 rounded-full border-[1.5px] border-white" />
				<View className="absolute -left-8 top-16 w-[130%] h-8 rounded-full border-[1.5px] border-white" />
			</View>
		);
	}

	// collage — 여러 톤의 사각 조각을 겹쳐 매체를 특정하지 않는 결로 표현 (현대미술)
	return (
		<View className="absolute inset-0 opacity-25">
			<View className="absolute left-2 top-2 w-10 h-10 bg-white rotate-6" />
			<View className="absolute right-3 top-6 w-8 h-14 bg-white -rotate-12" />
			<View className="absolute left-6 bottom-3 w-12 h-6 bg-white rotate-3" />
		</View>
	);
}

/** 현재 라운드의 3분할 작품 조각 트레이 — 탭 1회로 선택, 스와이프 없음 (AC-2). */
export function OnboardingArtworkTray({ tray, onSelect, announcement }: OnboardingArtworkTrayProps) {
	const reduceMotion = useReducedMotion();
	const firstPanelRef = useRef<View>(null);

	useAccessibilityAnnouncement(announcement, firstPanelRef);

	function handleSelect(piece: OnboardingWallPiece) {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onSelect(piece);
	}

	return (
		<ScrollView
			showsVerticalScrollIndicator={false}
			contentContainerClassName="flex-grow"
		>
			<Animated.View
				key={tray.id}
				entering={reduceMotion ? undefined : FadeIn.duration(200)}
				className="flex-row gap-2 px-1"
				style={{ minHeight: MIN_PANEL_HEIGHT }}
			>
				{tray.pieces.map((piece, index) => (
					<Pressable
						key={piece.id}
						ref={index === 0 ? firstPanelRef : undefined}
						onPress={() => handleSelect(piece)}
						accessibilityRole="button"
						accessibilityLabel={`${piece.cue}, ${piece.genre}`}
						className="flex-1 rounded-2xl overflow-hidden border-[0.5px] border-gray300 justify-end p-2.5"
						style={({ pressed }) => ({
							backgroundColor: piece.color,
							minHeight: MIN_PANEL_HEIGHT,
							opacity: pressed ? 0.85 : 1,
						})}
					>
						{renderTexture(piece.texture)}
						<Text
							numberOfLines={2}
							className="text-gray900 text-[12px] leading-[16px] font-pretendard-medium"
						>
							{piece.cue}
						</Text>
						<Text
							numberOfLines={1}
							className="text-gray700 text-[10px] font-pretendard-regular mt-0.5"
						>
							{piece.genre}
						</Text>
					</Pressable>
				))}
			</Animated.View>
		</ScrollView>
	);
}
