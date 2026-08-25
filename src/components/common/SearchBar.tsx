import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { cn } from '@/src/lib/cn';

interface SearchBarProps extends TextInputProps {
	/**
	 * elevated: 흰 배경+그림자 (지도 등 유색 배경 위) / tonal: 웜 뉴트럴 배경 (흰 화면 위)
	 */
	variant?: 'elevated' | 'tonal';
}

export function SearchBar({ variant = 'elevated', ...props }: SearchBarProps) {
	const elevated = variant === 'elevated';

	return (
		<View
			className={cn(
				'flex-row items-center rounded-2xl px-3 py-2.5 gap-2',
				elevated ? 'bg-white' : 'bg-bg-tonal',
			)}
			style={
				elevated && {
					shadowColor: '#000',
					shadowOpacity: 0.12,
					shadowRadius: 8,
					shadowOffset: { width: 0, height: 2 },
					elevation: 4,
				}
			}
		>
			<Ionicons name="search" size={16} color="rgba(0,0,0,0.35)" />
			<TextInput
				className="flex-1 text-black text-sm font-pretendard-regular"
				style={{ lineHeight: 0 }}
				placeholderTextColor="rgba(0,0,0,0.3)"
				{...props}
				returnKeyType="search"
			/>
			{props.value && props.value.length > 0 && (
				<Pressable
					onPress={() => props.onChangeText?.('')}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					accessibilityLabel="검색어 지우기"
					accessibilityRole="button"
				>
					<Ionicons name="close-circle" size={16} color="rgba(0,0,0,0.3)" />
				</Pressable>
			)}
		</View>
	);
}
