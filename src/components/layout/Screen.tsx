import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../../lib/cn';
import { ScreenHeader } from './ScreenHeader';

interface ScreenProps {
	className?: string;
	edges?: Edges;
	/** dark: 가이드·몰입 / warm: 아카이브·탐색 본문 / gradient: 로그인·온보딩 톤 웜 그라데이션 (설정류) */
	variant?: 'dark' | 'warm' | 'gradient';
	/** dark variant 전용: true이면 흰 배경 + 다크 StatusBar */
	highContrast?: boolean;
}

function Screen({
	className,
	children,
	edges,
	variant = 'dark',
	highContrast = false,
}: PropsWithChildren<ScreenProps>) {
	if (variant === 'dark' && highContrast) {
		return (
			<>
				<StatusBar style='dark' />
				<View className='flex-1 bg-white'>
					<SafeAreaView
						edges={edges || ['top', 'left', 'right']}
						className={cn('px-6 flex-1', className)}
					>
						{children}
					</SafeAreaView>
				</View>
			</>
		);
	}

	if (variant === 'warm') {
		return (
			<>
				<StatusBar style='dark' />
				<View className='flex-1 bg-[#F8F6F2]'>
					<SafeAreaView
						edges={edges || ['top', 'left', 'right']}
						className={cn('px-6 flex-1', className)}
					>
						{children}
					</SafeAreaView>
				</View>
			</>
		);
	}

	if (variant === 'gradient') {
		return (
			<>
				<StatusBar style='dark' />
				<View className='flex-1'>
					<LinearGradient
						colors={['#FFF3E6', '#F7DFCE', '#F8F6F2']}
						locations={[0, 0.3, 0.75]}
						style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
					/>
					<SafeAreaView
						edges={edges || ['top', 'left', 'right']}
						className={cn('px-6 flex-1', className)}
					>
						{children}
					</SafeAreaView>
				</View>
			</>
		);
	}

	return (
		<>
			<StatusBar style='light' />
			<LinearGradient colors={['#0C0A09', '#171412']} style={{ flex: 1 }}>
				<SafeAreaView
					edges={edges || ['top', 'left', 'right']}
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
