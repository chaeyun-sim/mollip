import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import { pickPhotos } from '@/src/utils/pickPhotos';

const COLUMNS = 3;

interface PhotoGridProps {
	value: string[];
	onChange: (value: string[]) => void;
	max: number;
}

/** 오늘 찍은 사진 — 3열 그리드, 남은 칸만큼 앨범에서 여러 장 고른다 */
export function PhotoGrid({ value, onChange, max }: PhotoGridProps) {
	const remaining = max - value.length;

	const handleAdd = async () => {
		if (remaining <= 0) return;
		const uris = await pickPhotos({ limit: remaining });
		if (uris.length > 0) onChange([...value, ...uris].slice(0, max));
	};

	// 사진 + 추가 칸을 3개씩 끊어 행으로 — 마지막 행도 칸 폭이 같도록 빈 칸으로 채운다
	const cells: (string | 'add' | null)[] = [...value, ...(remaining > 0 ? (['add'] as const) : [])];
	while (cells.length % COLUMNS !== 0) cells.push(null);
	const rows = Array.from({ length: cells.length / COLUMNS }, (_, i) =>
		cells.slice(i * COLUMNS, i * COLUMNS + COLUMNS),
	);

	return (
		<View className="gap-2.5">
			{rows.map((row, rowIndex) => (
				<View key={rowIndex} className="flex-row gap-2.5">
					{row.map((cell, cellIndex) => {
						if (cell === null) return <View key={cellIndex} className="flex-1" />;

						if (cell === 'add') {
							return (
								<ScalePressable
									key="add"
									onPress={handleAdd}
									accessibilityRole="button"
									accessibilityLabel={`사진 추가, ${remaining}장 더 올릴 수 있어요`}
									className="aspect-square flex-1 items-center justify-center rounded-xl border border-dashed border-gray300 bg-bg-tonal"
								>
									<Ionicons name="add" size={22} className="text-gray500" />
									<Text className="mt-0.5 text-gray500 text-[11px] font-pretendard-medium">
										{`${value.length}/${max}`}
									</Text>
								</ScalePressable>
							);
						}

						return (
							<View key={cell} className="aspect-square flex-1">
								<Image source={{ uri: cell }} className="h-full w-full rounded-xl bg-bg-tonal" />
								<Pressable
									onPress={() => onChange(value.filter((uri) => uri !== cell))}
									hitSlop={6}
									accessibilityRole="button"
									accessibilityLabel="사진 빼기"
									className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-black/55"
								>
									<Ionicons name="close" size={14} className="text-white" />
								</Pressable>
							</View>
						);
					})}
				</View>
			))}
		</View>
	);
}
