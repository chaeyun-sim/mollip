import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cn } from '@/src/lib/cn';
import type { DirectionsMode } from '@/src/hooks/useDirections';

interface RoutePanelProps {
	mode: DirectionsMode;
	status: 'idle' | 'loading' | 'success' | 'error';
	distanceMeters?: number;
	durationSeconds?: number;
	onChangeMode: (mode: DirectionsMode) => void;
	onClose: () => void;
	topOffset: number;
}

function formatDuration(seconds: number): string {
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}분`;
	return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}

function formatDistanceM(meters: number): string {
	return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

export function RoutePanel({
	mode,
	status,
	distanceMeters,
	durationSeconds,
	onChangeMode,
	onClose,
	topOffset,
}: RoutePanelProps) {
	return (
		<View
			className='absolute left-4 right-4 bg-white rounded-2xl px-4 py-3'
			style={{
				top: topOffset,
				zIndex: 25,
				shadowColor: '#000',
				shadowOpacity: 0.12,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 4 },
				elevation: 6,
			}}
		>
			<View className='flex-row items-center justify-between mb-2'>
				<View className='flex-row bg-black/[0.05] rounded-full p-1'>
					<Pressable
						onPress={() => onChangeMode('walk')}
						className={cn('px-3 py-1.5 rounded-full', mode === 'walk' && 'bg-[#1C1917]')}
						accessibilityRole='button'
						accessibilityState={{ selected: mode === 'walk' }}
						accessibilityLabel='도보 경로'
					>
						<Text
							className={cn(
								'text-[12px] font-pretendard-bold',
								mode === 'walk' ? 'text-white' : 'text-black/45',
							)}
						>
							도보
						</Text>
					</Pressable>
					<Pressable
						onPress={() => onChangeMode('bus')}
						className={cn('px-3 py-1.5 rounded-full', mode === 'bus' && 'bg-[#1C1917]')}
						accessibilityRole='button'
						accessibilityState={{ selected: mode === 'bus' }}
						accessibilityLabel='버스 경로'
					>
						<Text
							className={cn(
								'text-[12px] font-pretendard-bold',
								mode === 'bus' ? 'text-white' : 'text-black/45',
							)}
						>
							버스
						</Text>
					</Pressable>
				</View>
				<Pressable
					onPress={onClose}
					hitSlop={8}
					accessibilityLabel='경로 닫기'
					accessibilityRole='button'
				>
					<Ionicons name='close' size={18} color='rgba(0,0,0,0.4)' />
				</Pressable>
			</View>

			{status === 'loading' && (
				<Text className='text-black/40 text-[13px] font-pretendard-regular'>경로 찾는 중…</Text>
			)}
			{status === 'error' && (
				<Text className='text-black/40 text-[13px] font-pretendard-regular'>
					경로를 찾을 수 없어요
				</Text>
			)}
			{status === 'success' && distanceMeters != null && durationSeconds != null && (
				<Text className='text-black text-[15px] font-pretendard-bold'>
					{formatDistanceM(distanceMeters)} · 약 {formatDuration(durationSeconds)}
				</Text>
			)}
		</View>
	);
}
