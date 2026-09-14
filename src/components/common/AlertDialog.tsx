import { Text, View } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { Dialog } from '@/src/components/common/Dialog';

interface AlertDialogProps {
	/**
	 * 다이얼로그 표시 여부
	 */
	visible: boolean;
	/**
	 * 제목
	 */
	title: string;
	/**
	 * 보조 설명
	 */
	description?: string;
	/**
	 * 확인 버튼 레이블
	 */
	confirmLabel?: string;
	/**
	 * 확인 버튼 클릭 시 호출되는 함수
	 */
	onConfirm: () => void;
	/**
	 * 다이얼로그 닫기 시 호출되는 함수
	 */
	onDismiss: () => void;
}

/** 확인 버튼 하나만 있는 알림용 다이얼로그. 작업 완료·상태 변경 안내에 사용한다 */
export function AlertDialog({
	visible,
	title,
	description,
	confirmLabel = '확인',
	onConfirm,
	onDismiss,
}: AlertDialogProps) {
	const handleConfirm = () => {
		onConfirm();
		onDismiss();
	};

	return (
		<Dialog visible={visible} onDismiss={onDismiss}>
			<Text className="text-gray900 text-lg font-pretendard-bold">{title}</Text>
			{description && (
				<Text className="text-gray700 text-[13px] font-pretendard-regular mt-2">{description}</Text>
			)}
			<View className="flex-row justify-end mt-5">
				<Button
					onPress={handleConfirm}
					accessibilityLabel={confirmLabel}
					variant="ghost"
					tone="brand"
					size="small"
				>
					{confirmLabel}
				</Button>
			</View>
		</Dialog>
	);
}
