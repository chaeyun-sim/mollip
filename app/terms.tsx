import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';

const SECTIONS = [
	{ title: '제1조 목적', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제2조 정의', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제3조 서비스의 제공 및 변경', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제4조 이용자의 의무', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제5조 면책조항', placeholder: '[법적 내용 기재 예정]' },
];

export default function TermsScreen() {
	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>서비스 이용약관</Screen.Header.Center>
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
			>
				{SECTIONS.map((section) => (
					<View key={section.title} className="mb-6">
						<Text
							className="text-gray900 mb-2"
							style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 15 }}
						>
							{section.title}
						</Text>
						<Text
							className="text-gray600 leading-6"
							style={{ fontFamily: 'Pretendard-Regular', fontSize: 14 }}
						>
							{section.placeholder}
						</Text>
					</View>
				))}
			</ScrollView>
		</Screen>
	);
}
