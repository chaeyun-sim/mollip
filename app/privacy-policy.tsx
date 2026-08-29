import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';

const SECTIONS = [
	{ title: '제1조 수집하는 개인정보 항목', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제2조 개인정보의 수집 및 이용 목적', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제3조 개인정보의 보유 및 이용 기간', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제4조 개인정보의 제3자 제공', placeholder: '[법적 내용 기재 예정]' },
	{ title: '제5조 이용자의 권리와 행사 방법', placeholder: '[법적 내용 기재 예정]' },
];

export default function PrivacyPolicyScreen() {
	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>개인정보처리방침</Screen.Header.Center>
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
