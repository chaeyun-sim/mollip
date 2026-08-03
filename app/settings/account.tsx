import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import { Screen } from '../../src/components/layout/Screen';
import { useAuthStore } from '../../src/store/authStore';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const signOut = useAuthStore(s => s.signOut);
  const [signingOut, setSigningOut] = useState(false);
  const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(tabs)');
    } catch {
      setSigningOut(false);
    }
  };

  if (!user) {
    return (
      <Screen variant='warm'>
        <Screen.Header>
          <Screen.Header.Left>
            <Screen.Header.Back
              color='#1C1917'
              onPress={() => router.back()}
            />
          </Screen.Header.Left>
          <Screen.Header.Center>
            <Text className='text-[18px] text-gray-900 font-hahmlet-semibold'>계정 정보</Text>
          </Screen.Header.Center>
          <Screen.Header.Right />
        </Screen.Header>

        <View className='flex-1 px-6 pt-10'>
          <Text className='font-pretendard-regular text-gray-500 text-[15px] mb-8 leading-[22px]'>
            아카이브·저장한 전시를 이용하려면 로그인해 주세요.
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/auth/login',
                params: { returnTo: '/settings/account' },
              })
            }
            className='rounded-3xl bg-[#F2EFE9] items-center justify-center'
            style={{ minHeight: 52 }}
            accessibilityRole='button'
            accessibilityLabel='로그인하기'
          >
            <Text className='font-pretendard-semibold text-[15px] text-[#1C1917]'>로그인하기</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant='warm'>
      <Screen.Header>
        <Screen.Header.Left>
          <Screen.Header.Back
            color='#1C1917'
            onPress={() => router.back()}
          />
        </Screen.Header.Left>
        <Screen.Header.Center>
          <Text className='text-[18px] text-gray-900 font-hahmlet-semibold'>계정 정보</Text>
        </Screen.Header.Center>
        <Screen.Header.Right />
      </Screen.Header>

      <View className='pt-6'>
        {user.email && (
          <View
            className='rounded-3xl overflow-hidden bg-[#F2EFE9] mb-6'
            style={{
              shadowColor: '#1C1917',
              shadowOpacity: 0.05,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <View
              className='flex-row items-center justify-between px-4 border-b border-black/5'
              style={{ minHeight: 52 }}
            >
              <Text className='font-pretendard-regular text-gray-900 text-[15px]'>이메일</Text>
              <Text
                className='font-pretendard-regular text-gray-500 text-[13px] max-w-[55%]'
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          className='rounded-3xl bg-[#F2EFE9] flex-row items-center justify-center gap-2'
          style={{ minHeight: 52, opacity: signingOut ? 0.6 : 1 }}
          accessibilityRole='button'
          accessibilityLabel='로그아웃'
        >
          {signingOut ? (
            <ActivityIndicator color='#1C1917' />
          ) : (
            <>
              <Ionicons
                name='log-out-outline'
                size={18}
                color='#1C1917'
              />
              <Text className='font-pretendard-semibold text-[15px] text-[#1C1917]'>로그아웃</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowWithdrawWarning(true);
          }}
          className='flex-row items-center justify-end mt-5'
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
          hitSlop={8}
          accessibilityRole='button'
          accessibilityLabel='탈퇴하기'
        >
          <Ionicons
            name='trash-outline'
            size={14}
            color='#EF4444'
          />
          <Text className='px-1 font-pretendard-regular text-red-500 text-[12px] leading-[18px]'>
            탈퇴하기
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showWithdrawWarning}
        transparent
        animationType='fade'
        onRequestClose={() => setShowWithdrawWarning(false)}
      >
        <View className='flex-1 items-center justify-center bg-black/50 px-8'>
          <View className='w-full rounded-3xl bg-white p-6'>
            <Text className='text-[17px] font-pretendard-semibold text-gray-900 mb-2'>
              정말 탈퇴하시겠어요?
            </Text>
            <Text className='text-[13px] leading-[20px] font-pretendard-regular text-gray-500 mb-6'>
              계정 정보, 관람 기록, 저장한 전시가 모두 삭제되며{'\n'}이 작업은 되돌릴 수 없어요.
            </Text>
            <View className='flex-row gap-2'>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowWithdrawWarning(false);
                }}
                className='flex-1 rounded-2xl bg-[#F2EFE9] items-center justify-center'
                style={({ pressed }) => ({ minHeight: 50, opacity: pressed ? 0.7 : 1 })}
                accessibilityRole='button'
                accessibilityLabel='취소'
              >
                <Text className='font-pretendard-semibold text-[15px] text-[#1C1917]'>취소</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowWithdrawWarning(false);
                  router.push('/settings/delete-account');
                }}
                className='flex-1 rounded-2xl bg-red-500 items-center justify-center'
                style={({ pressed }) => ({ minHeight: 50, opacity: pressed ? 0.85 : 1 })}
                accessibilityRole='button'
                accessibilityLabel='그래도 탈퇴할래요'
              >
                <Text className='font-pretendard-semibold text-[15px] text-white'>
                  그래도 탈퇴할래요
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
