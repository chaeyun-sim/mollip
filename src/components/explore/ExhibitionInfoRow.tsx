import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';

interface ExhibitionInfoRowProps {
	icon?: ReactNode;
	label: string;
	isLast?: boolean;
	children: ReactNode;
	onPress?: () => void;
}

export function ExhibitionInfoRow({
	icon,
	label,
	isLast,
	children,
	onPress,
}: ExhibitionInfoRowProps) {
	const { t } = useTranslation();

	return (
		<View
			className={cn('flex-row items-center gap-3 py-3.5', !isLast && 'border-b border-gray300')}
		>
			<View className="flex-1 pt-1">
				<Text className="text-gray500 text-[11px] font-pretendard-medium tracking-wider uppercase">
					{label}
				</Text>
				{/* 아이콘 버튼을 문장 안(인라인)에 넣어 여러 줄일 때도 마지막 줄 끝에 붙인다 */}
				<Text className="text-gray900 text-[14px] font-pretendard-regular leading-5 mt-0.5">
					{children}
					{icon && (
						<>
							{/* 줄바꿈 없는 공백 — 아이콘만 다음 줄로 떨어지지 않게 하고 간격(약 8px)을 준다 */}
							{'  '}
							<Pressable
								onPress={onPress}
								hitSlop={8}
								accessibilityLabel={t('exhibitions.detail.copy_a11y', { label })}
								accessibilityRole="button"
								style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
							>
								{/* 인라인 요소는 글자 기준선에 바닥이 맞춰져 위로 떠 보인다 — 글자 중앙에 오도록 내린다 */}
								<View className="translate-y-[3px]">{icon}</View>
							</Pressable>
						</>
					)}
				</Text>
			</View>
		</View>
	);
}
