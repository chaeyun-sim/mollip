import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

interface DialogProps {
	/**
	 * 다이얼로그 표시 여부
	 */
	visible: boolean;
	/**
	 * 다이얼로그 닫기 시 호출되는 함수 (배경 탭 또는 안드로이드 뒤로가기)
	 */
	onDismiss: () => void;
	/**
	 * 배경 탭으로 닫기를 허용할지 여부. false면 확인/취소 버튼으로만 닫힌다
	 */
	dismissible?: boolean;
	children: ReactNode;
}

/** 화면 중앙 카드형 다이얼로그. 확인/선택 버튼 구성은 AlertDialog / ConfirmDialog가 담당한다 */
export function Dialog({ visible, onDismiss, dismissible = true, children }: DialogProps) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={dismissible ? onDismiss : undefined}
		>
			<Pressable
				className="flex-1 items-center justify-center bg-black/40 px-8"
				onPress={dismissible ? onDismiss : undefined}
			>
				<Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-[320px]">
					<View className="w-full rounded-3xl bg-white px-5 pt-6 pb-4" accessibilityRole="alert">
						{children}
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
