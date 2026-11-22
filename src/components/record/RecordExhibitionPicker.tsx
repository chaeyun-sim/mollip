import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import { SearchBar } from '@/src/components/common/SearchBar';
import { ManualRecordForm, type ManualRecordValue } from '@/src/components/record/ManualRecordForm';
import { RecordExhibitionRow } from '@/src/components/record/RecordExhibitionRow';
import { colors } from '@/src/constants/colors';
import { useVisitExhibitionMeta } from '@/src/hooks/queries/useVisitExhibitionMeta';
import { useBookmarkedExhibitions } from '@/src/hooks/useBookmarkedExhibitions';
import { useExhibitionSearch } from '@/src/hooks/useExhibitionSearch';
import { dateKeyOf, useVisitStore } from '@/src/store/visitStore';
import type { Exhibition } from '@/src/data/exhibitions';
import type { RecordDraft } from '@/src/store/recordDraftStore';
import { getExhibitionStatus } from '@/src/utils/exhibitionSearch';
import { localizeExhibition } from '@/src/utils/localizedExhibition';

const MAX_SUGGESTIONS = 6;
const MAX_RESULTS = 30;

const formatPeriod = (ex: Pick<Exhibition, 'startDate' | 'endDate'>) =>
	[ex.startDate, ex.endDate].filter(Boolean).join(' – ');

/** 도슨트 관람일 — 한국어 10월 27일, 영어 Oct 27 */
const formatVisitDay = (dateKey: string, language: string) => {
	const [y, m, d] = dateKey.split('-').map(Number);
	if (language === 'en') {
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
			new Date(y, m - 1, d),
		);
	}
	return `${m}월 ${d}일`;
};

interface RecordExhibitionPickerProps {
	/** 전시를 골랐을 때 — 시작할 draft를 넘긴다 */
	onPick: (draft: RecordDraft) => void;
}

/** 기록하기 첫 질문 — 추천(도슨트 관람·스크랩) 또는 검색으로 전시를 고르고, 없으면 바로 직접 기록 */
export function RecordExhibitionPicker({ onPick }: RecordExhibitionPickerProps) {
	const { t, i18n } = useTranslation();

	const insets = useSafeAreaInsets();
	const [focused, setFocused] = useState(false);
	const [isManualOpen, setIsManualOpen] = useState(false);
	const manualSheetRef = useRef<BottomSheetModal>(null);
	// 직접 기록은 시트가 완전히 닫힌 뒤에 다음 질문으로 넘어간다
	const pendingManualDraft = useRef<RecordDraft | null>(null);
	const visits = useVisitStore((s) => s.visits);
	const { data: bookmarked } = useBookmarkedExhibitions();
	const { searchText, debouncedSearchText, setSearchText, results, isLoading } =
		useExhibitionSearch();

	// 도슨트로 들었지만 아직 기록하지 않은 관람 — 방문일이 정해져 있어 체크인부터 이어진다
	const pendingVisits = useMemo(
		() =>
			Object.fromEntries(Object.entries(visits).filter(([, visit]) => visit.status === 'pending')),
		[visits],
	);
	const { posterUrls: pendingPosters, englishNames: pendingEnglishNames } =
		useVisitExhibitionMeta(pendingVisits);
	const bookmarkSuggestions = useMemo(
		() =>
			bookmarked.filter((ex) => getExhibitionStatus(ex) !== 'upcoming').slice(0, MAX_SUGGESTIONS),
		[bookmarked],
	);
	const query = debouncedSearchText.trim();
	const tabResults = useMemo(() => results.slice(0, MAX_RESULTS), [results]);
	const hasPending = Object.keys(pendingVisits).length > 0;
	const isEn = i18n.language === 'en';
	// 목록에 보이는 이름만 언어에 맞춘다 — 기록에는 한국어 원본을 저장한다
	const localize = (ex: Exhibition) => localizeExhibition(ex, i18n.language);
	const pendingTitleOf = (visitKey: string, title?: string) =>
		(isEn ? pendingEnglishNames[visitKey]?.title : undefined) ??
		title ??
		t('diary.picker_today_exhibition');
	const pendingVenueOf = (visitKey: string, venue?: string) =>
		(isEn ? pendingEnglishNames[visitKey]?.venue : undefined) ?? venue;

	const handlePickExhibition = (ex: Exhibition) => {
		onPick({
			exhibitionId: ex.id,
			title: ex.title.trim(),
			venue: ex.venue.trim() || undefined,
			titleEn: ex.titleEn?.trim() || undefined,
			venueEn: ex.venueEn?.trim() || undefined,
			poster: ex.heroImageUri ?? null,
			startDate: ex.startDate,
			endDate: ex.endDate,
		});
	};

	const handlePickPending = (visitKey: string) => {
		const visit = visits[visitKey];
		onPick({
			exhibitionId: visit.exhibitionId,
			title: visit.exhibitionTitle ?? '오늘의 전시',
			venue: visit.venue,
			titleEn: pendingEnglishNames[visitKey]?.title,
			venueEn: pendingEnglishNames[visitKey]?.venue,
			poster: visit.thumbnail ?? pendingPosters[visitKey] ?? null,
			fixedDateKey: dateKeyOf(visitKey),
			dateKey: dateKeyOf(visitKey),
			listenedTitles: visit.listened.map((l) => l.title),
		});
	};

	const handleSubmitManual = (value: ManualRecordValue) => {
		pendingManualDraft.current = {
			exhibitionId: null,
			title: value.title,
			venue: value.venue,
			poster: value.poster ?? null,
			isPosterUploaded: Boolean(value.poster),
			dateKey: value.visitDate,
		};
		manualSheetRef.current?.dismiss();
	};

	const handleDismissManual = () => {
		setIsManualOpen(false);
		const draft = pendingManualDraft.current;
		if (!draft) return;
		pendingManualDraft.current = null;
		onPick(draft);
	};

	const handleOpenManual = () => {
		Keyboard.dismiss();
		setFocused(false);
		setIsManualOpen(true);
		manualSheetRef.current?.present();
	};

	return (
		<>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerClassName="pb-16"
				>
					<Text className="mt-6 font-pretendard-bold text-[22px] leading-[32px] text-gray900">
						{t('diary.picker_title')}
					</Text>

					<SearchBar
						variant="tonal"
						value={searchText}
						onChangeText={setSearchText}
						placeholder={t('diary.picker_search_placeholder')}
						returnKeyType="search"
						className="mt-4"
						onFocus={() => setFocused(true)}
						onEndEditing={() => setFocused(false)}
						onBlur={() => setFocused(false)}
					/>

					{query ? (
						<View className="mt-4">
							<View className="mt-2">
								{tabResults.map(({ exhibition }) => (
									<RecordExhibitionRow
										key={exhibition.id}
										title={localize(exhibition).title}
										venue={localize(exhibition).venue}
										meta={formatPeriod(exhibition)}
										poster={exhibition.heroImageUri}
										onPress={() => handlePickExhibition(exhibition)}
									/>
								))}
								{isLoading && !tabResults.length && (
									<Text className="py-6 text-center text-gray500 text-[13px] font-pretendard-regular">
										{t('diary.picker_searching')}
									</Text>
								)}
							</View>
							{focused && !tabResults.length && (
								<ScalePressable
									onPress={handleOpenManual}
									accessibilityRole="button"
									accessibilityLabel={t('diary.picker_manual_a11y', { query })}
									className="flex-row items-center gap-3 rounded-2xl border border-dashed border-gray300 px-4 py-3.5"
								>
									<Ionicons name="create-outline" size={20} className="text-gray700" />
									<View className="flex-1">
										<Text className="text-gray900 text-[14.5px] font-pretendard-semibold">
											{t('diary.picker_manual', { query })}
										</Text>
										<Text className="mt-0.5 text-gray500 text-[12px] font-pretendard-regular">
											{t('diary.manual_description')}
										</Text>
									</View>
									<Ionicons name="chevron-forward" size={16} className="text-gray400" />
								</ScalePressable>
							)}
						</View>
					) : (
						<>
							{hasPending && (
								<View className="mt-6">
									<Text className="mb-1 text-gray600 text-[12px] font-pretendard-semibold tracking-[0.5px]">
										{t('diary.picker_docent_section')}
									</Text>
									{Object.entries(pendingVisits).map(([visitKey, visit]) => (
										<RecordExhibitionRow
											key={visitKey}
											badge={t('diary.picker_docent_badge')}
											title={pendingTitleOf(visitKey, visit.exhibitionTitle)}
											venue={pendingVenueOf(visitKey, visit.venue)}
											meta={t('diary.picker_docent_visit', {
												date: formatVisitDay(dateKeyOf(visitKey), i18n.language),
											})}
											poster={visit.thumbnail ?? pendingPosters[visitKey]}
											onPress={() => handlePickPending(visitKey)}
										/>
									))}
								</View>
							)}
							{bookmarkSuggestions.length > 0 && (
								<View className="mt-6">
									<Text className="mb-1 text-gray600 text-[12px] font-pretendard-semibold tracking-[0.5px]">
										{t('diary.picker_bookmarked')}
									</Text>
									{bookmarkSuggestions.map((ex) => (
										<RecordExhibitionRow
											key={ex.id}
											title={localize(ex).title}
											venue={localize(ex).venue}
											meta={formatPeriod(ex)}
											poster={ex.heroImageUri}
											onPress={() => handlePickExhibition(ex)}
										/>
									))}
								</View>
							)}
							{isLoading && bookmarkSuggestions.length === 0 && (
								<View className="mt-6">
									<Text className="mb-1 text-gray600 text-[12px] font-pretendard-semibold tracking-[0.5px]">
										{t('diary.picker_bookmarked')}
									</Text>
									<ActivityIndicator style={{ marginTop: 40 }} />
								</View>
							)}
							{!focused && !isLoading && !bookmarkSuggestions.length && (
								<Text className="mt-6 text-gray600 text-[14px] leading-[21px] font-pretendard-regular">
									{t('diary.picker_empty')}
								</Text>
							)}
						</>
					)}
				</ScrollView>
			</KeyboardAvoidingView>

			<BottomSheetModal
				ref={manualSheetRef}
				accessible={false}
				snapPoints={['92%']}
				topInset={insets.top}
				enableDynamicSizing={false}
				enablePanDownToClose
				keyboardBehavior="interactive"
				keyboardBlurBehavior="restore"
				backgroundStyle={{ backgroundColor: colors.canvas }}
				handleIndicatorStyle={{ backgroundColor: colors.divider, width: 36 }}
				backdropComponent={(props) => (
					<BottomSheetBackdrop
						{...props}
						disappearsOnIndex={-1}
						appearsOnIndex={0}
						opacity={0.42}
					/>
				)}
				onDismiss={handleDismissManual}
			>
				{isManualOpen && (
					<ManualRecordForm
						initialTitle={searchText.trim()}
						onSubmit={handleSubmitManual}
						onCancel={() => manualSheetRef.current?.dismiss()}
					/>
				)}
			</BottomSheetModal>
		</>
	);
}
