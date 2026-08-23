import { Pressable, Text, View } from 'react-native';

import { ArchiveSectionTitle } from '@/src/components/archive/ArchiveSectionTitle';
import { ARCHIVE_INK } from '@/src/components/archive/archivePalette';

interface ArchiveDiaryEmptyProps {
	onExplore: () => void;
	onMap: () => void;
}

export function ArchiveDiaryEmpty({
	onExplore,
	onMap,
}: ArchiveDiaryEmptyProps) {
	return (
		<View className='border border-dashed border-[#D6D3D1] rounded-[24px] px-5 py-8'>
			<ArchiveSectionTitle
				title='아직 관람 기록이 없어요'
				subtitle='전시 가이드를 들으면 이 달력이 채워져요'
			/>
			<Pressable
				onPress={onExplore}
				className='rounded-full py-3.5 items-center mb-3 mt-2'
				accessibilityRole='button'
				accessibilityLabel='전시 둘러보기'
				style={({ pressed }) => ({
					opacity: pressed ? 0.9 : 1,
					backgroundColor: ARCHIVE_INK,
				})}
			>
				<Text className='text-white text-[14px] font-pretendard-semibold'>
					전시 둘러보기
				</Text>
			</Pressable>
			<Pressable
				onPress={onMap}
				className='rounded-full py-3.5 items-center border border-divider bg-white'
				accessibilityRole='button'
				accessibilityLabel='지도에서 찾기'
				style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
			>
				<Text
					className='text-[14px] font-pretendard-semibold'
					style={{ color: ARCHIVE_INK }}
				>
					지도에서 찾기
				</Text>
			</Pressable>
		</View>
	);
}
