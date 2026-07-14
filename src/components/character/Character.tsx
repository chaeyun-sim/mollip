import { SvgXml } from 'react-native-svg';

import { SCULPTURE_XML } from '@/src/components/character/sculptureXml';

// 감정 종류
// default: 평상시 / happy: 기쁨 / excited: 신남 / curious: 궁금
// thinking: 생각 중 / moved: 감동 / sad: 슬픔·오류 / sleepy: 꾸벅(빈 상태)
export type CharacterEmotion = keyof typeof SCULPTURE_XML;

interface CharacterProps {
	emotion?: CharacterEmotion;
	size?: number; // 렌더링 가로 크기(px)
}

// 원본 이미지 비율 (264 x 322)
const ASPECT_RATIO = 322 / 264;

// 미술관 오디오 도슨트 캐릭터 — 석고상. emotion prop으로 표정을 바꾼다.
export function Character({ emotion = 'default', size = 96 }: CharacterProps) {
	return (
		<SvgXml
			xml={SCULPTURE_XML[emotion]}
			width={size}
			height={size * ASPECT_RATIO}
		/>
	);
}
