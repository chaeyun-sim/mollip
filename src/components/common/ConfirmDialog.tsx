import { Text, View } from 'react-native';

import { Button, type ButtonTone } from '@/src/components/common/Button';
import { Dialog } from '@/src/components/common/Dialog';

interface ConfirmDialogProps {
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
	 * 취소 버튼 레이블
	 */
	cancelLabel?: string;
	/**
	 * 확인 버튼 레이블
	 */
	confirmLabel?: string;
	/**
	 * 확인 버튼 톤. 파괴적 액션이면 danger로 지정한다
	 */
	confirmTone?: ButtonTone;
	/**
	 * 확인 버튼 클릭 시 호출되는 함수
	 */
	onConfirm: () => void;
	/**
	 * 취소 버튼 클릭 시 호출되는 함수
	 */
	onCancel: () => void;
	/**
	 * 다이얼로그 닫기 시 호출되는 함수
	 */
	onDismiss: () => void;
}

/** 취소/확인 두 버튼으로 사용자 선택을 받는 다이얼로그. 중요한 액션 확인에 사용한다 */
export function ConfirmDialog({
	visible,
	title,
	description,
	cancelLabel = '아니오',
	confirmLabel = '예',
	confirmTone = 'brand',
	onConfirm,
	onCancel,
	onDismiss,
}: ConfirmDialogProps) {
	const handleCancel = () => {
		onCancel();
		onDismiss();
	};

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
			<View className="flex-row gap-2 mt-5">
				<Button
					onPress={handleCancel}
					accessibilityLabel={cancelLabel}
					variant="solid"
					tone="gray"
					size="medium"
					block={false}
					className="flex-1"
				>
					{cancelLabel}
				</Button>
				<Button
					onPress={handleConfirm}
					accessibilityLabel={confirmLabel}
					variant="solid"
					tone={confirmTone}
					size="medium"
					block={false}
					className="flex-1"
				>
					{confirmLabel}
				</Button>
			</View>
		</Dialog>
	);
}
