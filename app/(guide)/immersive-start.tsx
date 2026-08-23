import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { ImmersiveOverlay } from '@/src/components/explore';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { cn } from '@/src/lib/cn';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { useVisitStore, todayKey } from '../../src/store/visitStore';
import { supabase } from '../../src/utils/supabase';
import { colors } from '@/src/constants/colors';

interface ExhibitionSuggestion {
	id: string;
	title: string;
	venue: string;
}

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
				className='flex-1'
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScreenHeader>
					<ScreenHeader.Left>
						<ScreenHeader.Back color='rgba(255,255,255,0.9)' />
					</ScreenHeader.Left>
				</ScreenHeader>

				<Pressable className='flex-1 pt-4' onPress={Keyboard.dismiss}>
					<Text className='text-[22px] mb-1.5 font-pretendard-bold text-white'>
						몰입 모드로 시작하기
					</Text>
					<Text className='text-sm mb-9 font-pretendard-regular text-tertiary'>
						관람 중인 전시를 검색하거나 직접 입력하세요
					</Text>

					{/* 전시명 + autocomplete */}
					<View className='mb-5 z-10'>
						<Text className='text-xs mb-2 font-pretendard-semibold text-muted tracking-wider'>
							전시명
						</Text>
						<View
							className={cn(
								'rounded-lg border bg-primary',
								titleError ? 'border-error' : 'border-divider-dark',
							)}
							style={{ height: 52, overflow: 'hidden' }}
						>
							{titleFocused ? (
								<TextInput
									autoFocus
									className='flex-1 px-4 text-base text-[#e8e8e8] font-pretendard-regular'
									textAlignVertical='center'
									placeholder='예) 이우환: 시간의 여백'
									placeholderTextColor={colors.secondary}
									value={titleText}
									onChangeText={handleTitleChange}
									returnKeyType='next'
									onSubmitEditing={() => {
										setTitleFocused(false);
										setVenueFocused(true);
									}}
									style={{ lineHeight: 0 }}
									multiline={false}
									numberOfLines={1}
									onBlur={() => setTitleFocused(false)}
								/>
							) : (
								<Pressable
									style={{ flex: 1, paddingHorizontal: 16, justifyContent: 'center' }}
									onPress={() => setTitleFocused(true)}
									accessibilityRole='button'
									accessibilityLabel='전시명 입력'
								>
									<Text
										numberOfLines={1}
										className='text-base font-pretendard-regular'
										style={{ color: titleText ? '#e8e8e8' : colors.secondary }}
									>
										{titleText || '예) 이우환: 시간의 여백'}
									</Text>
								</Pressable>
							)}
							{isSearching && (
								<ActivityIndicator
									size='small'
									color={colors.secondary}
									style={{ position: 'absolute', right: 14, top: 16 }}
								/>
							)}
						</View>
						{titleError && (
							<Text className='text-xs mt-1.5 font-pretendard-regular text-error'>
								전시명을 입력해 주세요
							</Text>
						)}

						{suggestions.length > 0 && (
							<View
								className='mt-1 rounded-xl overflow-hidden bg-primary'
								style={{
									borderWidth: StyleSheet.hairlineWidth,
									borderColor: '#3C3A38',
								}}
							>
								{suggestions.map((s, index) => (
									<Pressable
										key={s.id}
										className='px-4 py-3 flex-row items-center gap-3'
										style={({ pressed }) => ({
											opacity: pressed ? 0.7 : 1,
											borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
											borderTopColor: '#3C3A38',
										})}
										onPress={() => handleSelectSuggestion(s)}
									>
										<Ionicons name='search' size={14} color={colors.secondary} />
										<View className='flex-1'>
											<Text
												className='text-[#e8e8e8] text-sm font-pretendard-semibold'
												numberOfLines={1}
											>
												{s.title}
											</Text>
											{s.venue ? (
												<Text
													className='text-xs mt-0.5 font-pretendard-regular text-tertiary'
													numberOfLines={1}
												>
													{s.venue}
												</Text>
											) : null}
										</View>
										<Ionicons name='return-down-back' size={14} color={colors.secondary} />
									</Pressable>
								))}
							</View>
						)}
					</View>

					{/* 위치 */}
					<View className='mb-8'>
						<Text className='text-xs mb-2 font-pretendard-semibold text-muted tracking-wider'>
							위치
						</Text>
						<View
							className={cn(
								'rounded-lg border bg-primary',
								venueError ? 'border-error' : 'border-divider-dark',
							)}
							style={{ height: 52, overflow: 'hidden' }}
						>
							{venueFocused ? (
								<TextInput
									autoFocus
									className='flex-1 px-4 text-base font-pretendard-regular text-[#E8E8E8]'
									placeholder='예) 국립현대미술관 과천관'
									placeholderTextColor={colors.secondary}
									value={venueText}
									onChangeText={(t) => {
										setVenueText(t);
										if (venueError) setVenueError(false);
									}}
									returnKeyType='done'
									onSubmitEditing={handleSubmit}
									numberOfLines={1}
									style={{ lineHeight: 0 }}
									onBlur={() => setVenueFocused(false)}
								/>
							) : (
								<Pressable
									style={{ flex: 1, paddingHorizontal: 16, justifyContent: 'center' }}
									onPress={() => setVenueFocused(true)}
									accessibilityRole='button'
									accessibilityLabel='위치 입력'
								>
									<Text
										numberOfLines={1}
										className='text-base font-pretendard-regular'
										style={{ color: venueText ? '#E8E8E8' : colors.secondary }}
									>
										{venueText || '예) 국립현대미술관 과천관'}
									</Text>
								</Pressable>
							)}
						</View>
						{venueError && (
							<Text className='text-xs mt-1.5 font-pretendard-regular text-error'>
								위치를 입력해 주세요
							</Text>
						)}
					</View>

					{/* 안내 */}
					<View className='gap-2.5 px-1'>
						<View className='flex-row items-center gap-2'>
							<Ionicons name='time-outline' size={14} color={colors.secondary} />
							<Text className='text-xs font-pretendard-regular text-secondary'>
								관람이 끝날 때까지 몰입 모드가 유지돼요
							</Text>
						</View>
						<View className='flex-row items-center gap-2'>
							<Ionicons name='headset-outline' size={14} color={colors.secondary} />
							<Text className='text-xs font-pretendard-regular text-secondary'>
								작품을 스캔하면 해설을 바로 받을 수 있어요
							</Text>
						</View>
						<View className='flex-row items-center gap-2'>
							<Ionicons name='list-outline' size={14} color={colors.secondary} />
							<Text className='text-xs font-pretendard-regular text-secondary'>
								들은 해설은 재생목록에 자동으로 저장돼요
							</Text>
						</View>
					</View>

					<Screen.BottomAbsolute className='bottom-2'>
						<Pressable
							className='w-full rounded-lg items-center bg-accent py-3.5'
							onPress={handleSubmit}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							accessibilityLabel='몰입 모드 시작하기'
							accessibilityRole='button'
						>
							<Text className='text-base font-pretendard-semibold text-white'>
								시작하기
							</Text>
						</Pressable>
					</Screen.BottomAbsolute>
				</Pressable>
			</KeyboardAvoidingView>
			<ImmersiveOverlay
				visible={overlayVisible}
				title={titleText.trim()}
				onStart={() => router.replace('/(guide)/create-description')}
				onClose={() => setOverlayVisible(false)}
			/>
		</Screen>
	);
}
