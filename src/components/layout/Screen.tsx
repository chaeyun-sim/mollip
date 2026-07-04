import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../../lib/cn';
import { ScreenHeader } from './ScreenHeader';

interface ScreenProps {
	className?: string;
}

function Screen({ className, children }: PropsWithChildren<ScreenProps>) {
	return (
		<>
			<StatusBar style='light' />
			<LinearGradient colors={['#0C0A09', '#171412']} style={{ flex: 1 }}>
				<SafeAreaView
					edges={['top', 'left', 'right']}
					className={cn('px-6 flex-1', className)}
				>
					{children}
				</SafeAreaView>
			</LinearGradient>
		</>
	);
}

function Bottom({ children, className }: PropsWithChildren<ScreenProps>) {
	return (
		<View className={cn('pt-3 pb-2 bg-transparent', className)}>{children}</View>
	);
}

function BottomAbsolute({
	className,
	children,
}: PropsWithChildren<ScreenProps>) {
	return (
		<View className={cn('absolute left-0 right-0 bottom-0 pb-6', className)}>
			{children}
		</View>
	);
}

Screen.Header = ScreenHeader;
Screen.Bottom = Bottom;
Screen.BottomAbsolute = BottomAbsolute;

export { Screen };
