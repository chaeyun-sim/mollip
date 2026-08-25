import { Ionicons } from '@expo/vector-icons';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { Pressable, PressableProps } from 'react-native';

interface FabProps extends PressableProps {
  /**
   * 아이콘 이름
   */
  icon: keyof typeof Ionicons.glyphMap;
  needsLogin?: boolean;
  returnTo?: string;
}

/** 원형 primary FAB. 비로그인 상태면 로그인 화면으로 보낸다(LoginRequiredPressable). */
export function Fab({ icon, needsLogin = false, returnTo, ...props }: FabProps) {
  return needsLogin ? (
    <LoginRequiredPressable
      accessibilityRole='button'
      className='h-[58px] w-[58px] items-center justify-center rounded-full bg-primary'
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      returnTo={returnTo}
      {...props}
    >
      <Ionicons
        name={icon}
        size={26}
        className="text-bg-tonal"
      />
    </LoginRequiredPressable>
  ) : (
    <Pressable
      accessibilityRole='button'
      className='h-[58px] w-[58px] items-center justify-center rounded-full bg-primary'
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      {...props}
    >
      <Ionicons
        name={icon}
        size={26}
        className="text-bg-tonal"
      />
    </Pressable>
  );
}
