import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { type ComponentRef, useRef, useState } from 'react';
import { Image, Keyboard, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/src/components/common/Button';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { RecordFormSection } from '@/src/components/record/RecordFormSection';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';
import { pickPhotos } from '@/src/utils/pickPhotos';

export interface ManualRecordValue {
	title: string;
	venue?: string;
	/** 방문일, 로컬 날짜 기준 YYYY-MM-DD */
	visitDate?: string;
	poster?: string;
}

interface ManualRecordFormProps {
	/** 검색창에 쓰던 이름을 그대로 이어받는다 */
	initialTitle: string;
	onSubmit: (value: ManualRecordValue) => void;
	onCancel: () => void;
}

/** 이름·장소 입력칸 공통 모양 — 테두리만 포커스 상태에 따라 바뀐다 */
const inputClassName =
	'h-[52px] rounded-2xl bg-white px-4 text-[15px] text-ink font-pretendard-regular';

const toBoardDate = (date: Date) =>
	`${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

/** 검색에 없는 전시를 같은 화면에서 바로 적는다 — 이름만 필수, 장소·방문일·포스터는 선택 */
export function ManualRecordForm({ initialTitle, onSubmit }: ManualRecordFormProps) {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();
	const venueRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null);
	const [focusedField, setFocusedField] = useState<'title' | 'venue' | null>(null);
	const [title, setTitle] = useState(initialTitle);
	const [venue, setVenue] = useState('');
	const [poster, setPoster] = useState<string | null>(null);
	const [visitDate, setVisitDate] = useState<Date | null>(null);
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

	const canSubmit = title.trim().length > 0;

	const handlePickPoster = async () => {
		Keyboard.dismiss();
		const [uri] = await pickPhotos();
		if (uri) setPoster(uri);
	};

	const handleSubmit = () => {
		if (!canSubmit) return;
		onSubmit({
			title: title.trim(),
			venue: venue.trim() || undefined,
			visitDate: visitDate ? toBoardDate(visitDate).replaceAll('.', '-') : undefined,
			poster: poster ?? undefined,
		});
	};

	return (
		<BottomSheetScrollView
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			keyboardDismissMode="on-drag"
			contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 24 }}
			className="flex-1 bg-canvas"
		>
			<View className="px-6 pt-2">
				<Text className="font-pretendard-bold text-[22px] leading-[30px] text-ink">
					직접 기록하기
				</Text>
				<Text className="mt-1 font-pretendard-regular text-[13px] text-gray600">
					이름만 있으면 바로 남길 수 있어요
				</Text>

				{/* 포스터는 선택 — 가운데 액자를 탭하면 사진을 고른다 */}
				<View className="mt-6 items-center">
					<Pressable
						onPress={handlePickPoster}
						accessibilityRole="button"
						accessibilityLabel={poster ? '포스터 다시 고르기' : '포스터 추가 (선택)'}
						className="h-[148px] w-[111px] rounded-[4px] border-[0.5px] border-divider bg-white p-2"
						style={({ pressed }) => ({
							opacity: pressed ? 0.8 : 1,
							shadowColor: '#2D2D23',
							shadowOffset: { width: 0, height: 6 },
							shadowOpacity: 0.12,
							shadowRadius: 14,
							elevation: 4,
						})}
					>
						<View className="flex-1 items-center justify-center overflow-hidden bg-surface-neutral">
							{poster ? (
								<Image source={{ uri: poster }} resizeMode="cover" className="h-full w-full" />
							) : (
								<>
									<View className="h-10 w-10 items-center justify-center rounded-full bg-white">
										<Ionicons name="image-outline" size={20} color={colors.gray600} />
									</View>
									<Text className="mt-2 font-pretendard-medium text-[12px] text-gray600">
										포스터 추가
									</Text>
									<Text className="mt-0.5 font-pretendard-regular text-[11px] text-gray500">
										선택
									</Text>
								</>
							)}
						</View>
						<View className="absolute -bottom-2.5 -right-2.5 h-8 w-8 items-center justify-center rounded-full border-2 border-canvas bg-brand">
							<Ionicons name={poster ? 'swap-horizontal' : 'add'} size={16} color={colors.white} />
						</View>
					</Pressable>
				</View>

				<RecordFormSection label="전시 이름" hint="필수" className="mt-6">
					<BottomSheetTextInput
						value={title}
						accessibilityLabel="전시 이름 (필수)"
						onChangeText={setTitle}
						onFocus={() => setFocusedField('title')}
						onBlur={() => setFocusedField(null)}
						onSubmitEditing={() => venueRef.current?.focus()}
						submitBehavior="submit"
						placeholder="전시 이름"
						returnKeyType="next"
						placeholderTextColor={colors.gray500}
						selectionColor={colors.brand}
						className={cn(inputClassName, {
							'border-[1.5px] border-brand': focusedField === 'title',
							'border-[0.5px] border-divider': focusedField !== 'title',
						})}
					/>
				</RecordFormSection>

				<RecordFormSection label={t('exhibitions.venue')} hint="선택" className="mt-5">
					<BottomSheetTextInput
						ref={venueRef}
						value={venue}
						accessibilityLabel="장소 (선택)"
						onChangeText={setVenue}
						onFocus={() => setFocusedField('venue')}
						onBlur={() => setFocusedField(null)}
						placeholder="미술관·갤러리"
						returnKeyType="done"
						placeholderTextColor={colors.gray500}
						selectionColor={colors.brand}
						className={cn(inputClassName, {
							'border-[1.5px] border-brand': focusedField === 'venue',
							'border-[0.5px] border-divider': focusedField !== 'venue',
						})}
					/>
				</RecordFormSection>

				<RecordFormSection label="방문 날짜" hint="선택" className="mt-5">
					<Pressable
						onPress={() => {
							Keyboard.dismiss();
							setIsDatePickerOpen(true);
						}}
						accessibilityRole="button"
						accessibilityLabel={`방문일 ${visitDate ? toBoardDate(visitDate) : '선택'}`}
						className="h-[52px] flex-row items-center justify-between rounded-2xl border-[0.5px] border-divider bg-white pl-4 pr-2"
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Text
							className={cn(
								'font-pretendard-medium text-[15px]',
								visitDate ? 'text-ink' : 'text-gray500',
							)}
						>
							{visitDate ? toBoardDate(visitDate) : '날짜 선택'}
						</Text>
						<View className="h-9 w-9 items-center justify-center rounded-full bg-surface-neutral">
							<Ionicons name="calendar-outline" size={16} color={colors.gray700} />
						</View>
					</Pressable>
				</RecordFormSection>

				<Button
					onPress={handleSubmit}
					disabled={!canSubmit}
					accessibilityLabel="이 전시로 기록하기"
					tone="brand"
					haptic="light"
					className="mt-8"
				>
					이 전시로 기록하기
				</Button>

				<DatePickerModal
					visible={isDatePickerOpen}
					value={visitDate ?? new Date()}
					maximumDate={new Date()}
					onChange={setVisitDate}
					onReset={() => setVisitDate(null)}
					resetLabel="날짜 선택 해제"
					onDismiss={() => setIsDatePickerOpen(false)}
				/>
			</View>
		</BottomSheetScrollView>
	);
}
