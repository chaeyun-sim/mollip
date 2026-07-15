import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';
import { cn } from '@/src/lib/cn';

type Props = {
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	/** elevated: 흰 배경+그림자 (지도 등 유색 배경 위) / tonal: 웜 뉴트럴 배경 (흰 화면 위) */
	variant?: 'elevated' | 'tonal';
	onSubmitEditing?: () => void;
	onFocus?: () => void;
	onBlur?: () => void;
};

export function SearchBar({
	value,
	onChangeText,
	placeholder = '검색',
	variant = 'elevated',
	onSubmitEditing,
	onFocus,
	onBlur,
}: Props) {
	const elevated = variant === 'elevated';
	return (
		<View
			className={cn(
				'flex-row items-center rounded-2xl px-3 py-2.5 gap-2',
				elevated ? 'bg-white' : 'bg-[#F2EFE9]',
			)}
			style={
				elevated
					? {
							shadowColor: '#000',
							shadowOpacity: 0.12,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 2 },
							elevation: 4,
						}
					: undefined
			}
		>
			<Ionicons name='search' size={16} color='rgba(0,0,0,0.35)' />
			<TextInput
				className='flex-1 text-black text-sm font-pretendard-regular'
				style={{ lineHeight: 0 }}
				placeholder={placeholder}
				placeholderTextColor='rgba(0,0,0,0.3)'
				value={value}
				onChangeText={onChangeText}
				onSubmitEditing={onSubmitEditing}
				onFocus={onFocus}
				onBlur={onBlur}
				returnKeyType='search'
			/>
			{value.length > 0 && (
				<Pressable
					onPress={() => onChangeText('')}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					accessibilityLabel='검색어 지우기'
					accessibilityRole='button'
				>
					<Ionicons name='close-circle' size={16} color='rgba(0,0,0,0.3)' />
				</Pressable>
			)}
		</View>
	);
}
