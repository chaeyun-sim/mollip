import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImmersiveOverlay } from '@/src/components/explore';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import {
	ExhibitionTitleField,
	type ExhibitionSuggestion,
} from '@/src/components/guide/ExhibitionTitleField';
import { VenueField } from '@/src/components/guide/VenueField';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { useVisitStore, todayKey } from '../../src/store/visitStore';
import { supabase } from '../../src/utils/supabase';

const GUIDE_NOTES = [
	{ icon: 'time-outline', text: '관람이 끝날 때까지 몰입 모드가 유지돼요' },
	{ icon: 'headset-outline', text: '작품을 스캔하면 해설을 바로 받을 수 있어요' },
	{ icon: 'list-outline', text: '들은 해설은 재생목록에 자동으로 저장돼요' },
] as const;

export default function ImmersiveStartScreen() {
	const router = useRouter();
	const enterImmersive = useImmersiveStore((s) => s.enter);
	const recordExhibition = useVisitStore((s) => s.recordExhibition);

	const [titleText, setTitleText] = useState('');
	const [searchQuery, setSearchQuery] = useState(''); // 사용자 직접 입력만 반영
	const [venueText, setVenueText] = useState('');
	const [titleError, setTitleError] = useState(false);
	const [venueError, setVenueError] = useState(false);
	const [suggestions, setSuggestions] = useState<ExhibitionSuggestion[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [titleFocused, setTitleFocused] = useState(false);
	const [venueFocused, setVenueFocused] = useState(false);

	const [overlayVisible, setOverlayVisible] = useState(false);

	const selectedIdRef = useRef<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (searchQuery.trim().length < 2) {
			setSuggestions([]);
			return;
		}
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			setIsSearching(true);
			const { data } = await supabase
				.from('exhibitions')
				.select('id, title, event_site, venue_name_fallback')
				.ilike('title', `%${searchQuery.trim()}%`)
				.limit(5);
			setSuggestions(
				(data ?? []).map((row) => ({
					id: String(row.id),
					title: row.title as string,
					venue: (row.venue_name_fallback ?? row.event_site ?? '') as string,
				})),
			);
			setIsSearching(false);
		}, 300);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [searchQuery]);

	const handleSelectSuggestion = useCallback(
		(suggestion: ExhibitionSuggestion) => {
			selectedIdRef.current = suggestion.id;
			setTitleText(suggestion.title);
			setSearchQuery(''); // 검색 트리거 리셋 — useEffect 재실행 방지
			setVenueText(suggestion.venue);
			setSuggestions([]);
			setTitleFocused(false);
			if (titleError) setTitleError(false);
			if (venueError) setVenueError(false);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setVenueFocused(true);
		},
		[titleError, venueError],
	);

	const handleTitleChange = useCallback(
		(text: string) => {
			selectedIdRef.current = null;
			setTitleText(text);
			setSearchQuery(text); // 사용자 타이핑만 검색 트리거
			if (titleError) setTitleError(false);
		},
		[titleError],
	);

	const handleSubmit = useCallback(() => {
		const title = titleText.trim();
		const venue = venueText.trim();
		const titleMissing = !title;
		const venueMissing = !venue;
		if (titleMissing) setTitleError(true);
		if (venueMissing) setVenueError(true);
		if (titleMissing || venueMissing) return;

		const exhibitionId = selectedIdRef.current;
		enterImmersive(exhibitionId, title);
		recordExhibition(todayKey(), exhibitionId, { title, venue });
		Keyboard.dismiss();
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		setOverlayVisible(true);
	}, [titleText, venueText, enterImmersive, recordExhibition]);

	return (
		<Screen>
			<Stack.Screen options={{ gestureEnabled: false }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScreenHeader>
					<ScreenHeader.Left>
						<ScreenHeader.Back color="white-90" />
					</ScreenHeader.Left>
				</ScreenHeader>

				<Pressable className="flex-1 pt-4" onPress={Keyboard.dismiss}>
					<Text className="text-[22px] mb-1.5 font-pretendard-bold text-white">
						몰입 모드로 시작하기
					</Text>
					<Text className="text-sm mb-9 font-pretendard-regular text-tertiary">
						관람 중인 전시를 검색하거나 직접 입력하세요
					</Text>

					<ExhibitionTitleField
						value={titleText}
						error={titleError}
						focused={titleFocused}
						isSearching={isSearching}
						suggestions={suggestions}
						onFocus={() => setTitleFocused(true)}
						onBlur={() => setTitleFocused(false)}
						onChangeText={handleTitleChange}
						onSubmitEditing={() => {
							setTitleFocused(false);
							setVenueFocused(true);
						}}
						onSelectSuggestion={handleSelectSuggestion}
					/>

					<VenueField
						value={venueText}
						error={venueError}
						focused={venueFocused}
						onFocus={() => setVenueFocused(true)}
						onBlur={() => setVenueFocused(false)}
						onChangeText={(t) => {
							setVenueText(t);
							if (venueError) setVenueError(false);
						}}
						onSubmitEditing={handleSubmit}
					/>

					{/* 안내 */}
					<View className="gap-2.5 px-1">
						{GUIDE_NOTES.map((note) => (
							<View key={note.icon} className="flex-row items-center gap-2">
								<Ionicons name={note.icon} size={14} className="text-secondary" />
								<Text className="text-xs font-pretendard-regular text-secondary">{note.text}</Text>
							</View>
						))}
					</View>

					<Screen.BottomAbsolute className="bottom-2">
						<Pressable
							className="w-full rounded-lg items-center bg-accent py-3.5"
							onPress={handleSubmit}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							accessibilityLabel="몰입 모드 시작하기"
							accessibilityRole="button"
						>
							<Text className="text-base font-pretendard-semibold text-white">시작하기</Text>
						</Pressable>
					</Screen.BottomAbsolute>
				</Pressable>
			</KeyboardAvoidingView>
			<ImmersiveOverlay
				visible={overlayVisible}
				title={titleText.trim()}
				onStart={() => router.replace('/(guide)/playlist')}
				onClose={() => setOverlayVisible(false)}
			/>
		</Screen>
	);
}
