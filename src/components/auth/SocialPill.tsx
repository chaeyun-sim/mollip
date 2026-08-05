import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

const APPLE_PILL_SHADOW = {
	shadowColor: '#1C1917',
	shadowOpacity: 0.06,
	shadowRadius: 12,
	shadowOffset: { width: 0, height: 4 },
};

export interface SocialPillProps {
	label: string;
	onPress: () => void;
	disabled: boolean;
	loading: boolean;
	variant: 'kakao' | 'apple' | 'ghost';
	icon?: React.ReactNode;
}

export function SocialPill({
	label,
	onPress,
	disabled,
	loading,
	variant,
	icon,
}: SocialPillProps) {
	const isKakao = variant === 'kakao';
	const isApple = variant === 'apple';
	const isGhost = variant === 'ghost';

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			accessibilityRole='button'
			accessibilityLabel={label}
			className={cn(
				'h-14 rounded-full items-center justify-center',
				isKakao && 'bg-[#FEE500]',
				isApple && 'bg-white border border-[rgba(28,25,23,0.08)]',
				isGhost &&
					'bg-[rgba(255,255,255,0.38)] border border-[rgba(255,255,255,0.65)]',
				disabled && !loading && 'opacity-[0.55]',
			)}
			style={isApple ? APPLE_PILL_SHADOW : undefined}
		>
			{({ pressed }) => (
				<View
					className='flex-row items-center justify-center gap-2'
					style={
						pressed ? { opacity: 0.88, transform: [{ scale: 0.985 }] } : undefined
					}
				>
					{loading ? (
						<ActivityIndicator color={isKakao ? '#191919' : '#1C1917'} />
					) : (
						<>
							{icon}
							<Text
								className={cn(
									'text-[16px] font-pretendard-semibold',
									isKakao
										? 'text-[#191919]'
										: isGhost
											? 'text-[#44403C]'
											: 'text-[#1C1917]',
								)}
							>
								{label}
							</Text>
						</>
					)}
				</View>
			)}
		</Pressable>
	);
}
