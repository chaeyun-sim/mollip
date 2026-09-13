import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/src/components/common/TextField';
import { cn } from '@/src/lib/cn';

interface VenueFieldProps {
	value: string;
	error: boolean;
	focused: boolean;
	onFocus: () => void;
	onBlur: () => void;
	onChangeText: (text: string) => void;
	onSubmitEditing: () => void;
}

/** 관람 장소 입력 필드 — 탭하면 편집 모드로 전환되는 단순 텍스트 필드. */
export function VenueField({
	value,
	error,
	focused,
	onFocus,
	onBlur,
	onChangeText,
	onSubmitEditing,
}: VenueFieldProps) {
	return (
		<View className="mb-8">
			<Text className="text-xs mb-2 font-pretendard-semibold text-gray500 tracking-wider">위치</Text>
			<View
				className={cn(
					'rounded-lg border bg-gray900 h-[52px] overflow-hidden',
					error ? 'border-error' : 'border-divider-dark',
				)}
			>
				{focused ? (
					<TextField
						variant="plain"
						tone="dark"
						autoFocus
						className="px-4 text-base"
						placeholder="예) 국립현대미술관 과천관"
						value={value}
						onChangeText={onChangeText}
						returnKeyType="done"
						onSubmitEditing={onSubmitEditing}
						numberOfLines={1}
						onBlur={onBlur}
					/>
				) : (
					<Pressable
						className="flex-1 px-4 justify-center"
						onPress={onFocus}
						accessibilityRole="button"
						accessibilityLabel="위치 입력"
					>
						<Text
							numberOfLines={1}
							className={cn(
								'text-base font-pretendard-regular',
								value ? 'text-on-dark' : 'text-gray700',
							)}
						>
							{value || '예) 국립현대미술관 과천관'}
						</Text>
					</Pressable>
				)}
			</View>
			{error && (
				<Text className="text-xs mt-1.5 font-pretendard-regular text-error">
					위치를 입력해 주세요
				</Text>
			)}
		</View>
	);
}
