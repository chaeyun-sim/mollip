import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { TextField } from '@/src/components/common/TextField';
import { useEssayStream } from '@/src/hooks/useEssayStream';
import { clipToSentence } from '@/src/utils/clipToSentence';

interface RecordMemoFieldProps {
	value: string;
	onChange: (memo: string) => void;
	exhibitionTitle: string;
	rating: number;
	listenedTitles: string[];
	maxLength: number;
}

/** 액자 캡션 입력 — 직접 쓰거나 "AI로 써보기"로 채운다. 패딩은 바깥 프레임이 갖고 입력창은 내용만큼 늘어난다 */
export function RecordMemoField({
	value,
	onChange,
	exhibitionTitle,
	rating,
	listenedTitles,
	maxLength,
}: RecordMemoFieldProps) {
	const { t } = useTranslation();

	const { stage, text, generate, cancel } = useEssayStream();
	// 스트리밍 효과가 부모의 새 콜백마다 다시 돌지 않게 최신 콜백만 ref로 들고 있는다
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	});

	const isStreaming = stage === 'streaming';
	const isError = stage === 'error';
	const hasValue = value.trim().length > 0;

	// AI가 쓰는 동안 입력칸을 스트리밍 글로 채운다 — 완성되면 상한 안의 마지막 문장까지만 남긴다
	useEffect(() => {
		if (stage === 'streaming') onChangeRef.current(text.slice(0, maxLength));
		if (stage === 'done') onChangeRef.current(clipToSentence(text, maxLength));
	}, [stage, text, maxLength]);

	// 화면을 나가면 진행 중인 생성을 멈춘다
	useEffect(() => () => cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps

	const runGenerate = () => {
		generate({
			exhibitionTitle,
			rating,
			memo: value.trim() || undefined,
			listenedTitles,
		});
	};

	const handleGenerate = () => {
		if (isStreaming) return;
		if (!hasValue) {
			runGenerate();
			return;
		}
		Alert.alert(t('diary.memo_regenerate_title'), t('diary.memo_regenerate_body'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{ text: t('diary.memo_regenerate_confirm'), onPress: runGenerate },
		]);
	};

	return (
		<View>
			<View className="mb-2.5 flex-row items-center justify-between">
				<Text className="font-pretendard-regular text-[12px] text-gray500">
					{value.length} / {maxLength}
				</Text>
				<Pressable
					onPress={handleGenerate}
					disabled={isStreaming}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel={t('diary.memo_ai_a11y')}
					accessibilityHint={t('diary.memo_ai_hint')}
					accessibilityState={{ disabled: isStreaming }}
					className="flex-row items-center gap-1"
					style={({ pressed }) => ({ opacity: isStreaming ? 0.4 : pressed ? 0.6 : 1 })}
				>
					<Ionicons name="sparkles-outline" size={14} className="text-brand" />
					<Text className="font-pretendard-semibold text-[13px] text-brand">
						{isStreaming ? t('diary.memo_ai_writing') : t('diary.memo_ai_a11y')}
					</Text>
				</Pressable>
			</View>

			<View className="min-h-[110px] rounded-2xl border border-[rgba(28,25,23,0.1)] bg-white p-4">
				<TextField
					variant="plain"
					multiline
					scrollEnabled={false}
					value={value}
					onChangeText={(memo) => onChange(memo.slice(0, maxLength))}
					editable={!isStreaming}
					placeholder={t('diary.memo_placeholder')}
					maxLength={maxLength}
					accessibilityLabel={t('diary.memo_a11y')}
					className="flex-none p-0 text-[14px]"
					lineBreakStrategyIOS="hangul-word"
					style={{ lineHeight: 20 }}
				/>
			</View>

			{isError && (
				<Text className="mt-2 font-pretendard-regular text-[12px] text-gray600">
					{t('diary.memo_ai_failed')}
				</Text>
			)}
		</View>
	);
}
