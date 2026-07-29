import { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import { ExhibitionCard } from '@/src/components/map/ExhibitionCard';
import { cn } from '@/src/lib/cn';
import { parseDate } from '@/src/utils/mapUtils';
import type { VenueGroup } from '@/src/data/venues';

interface VenueSheetProps {
  venue: VenueGroup;
  filterDate: Date;
  distanceText: string | null;
  onGoToExhibition: (id: string) => void;
  onRequestDirections: () => void;
}

type Tab = 'active' | 'upcoming';

export function VenueSheet({
  venue,
  filterDate,
  distanceText,
  onGoToExhibition,
  onRequestDirections,
}: VenueSheetProps) {
  const [tab, setTab] = useState<Tab>('active');

  const activeExhibitions = useMemo(() => {
    const d = new Date(filterDate);
    d.setHours(0, 0, 0, 0);
    return venue.exhibitions.filter(ex => {
      const start = parseDate(ex.startDate);
      const end = parseDate(ex.endDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  }, [venue, filterDate]);

  const upcomingExhibitions = useMemo(() => {
    const d = new Date(filterDate);
    d.setHours(0, 0, 0, 0);
    return venue.exhibitions.filter(ex => parseDate(ex.startDate) > d);
  }, [venue, filterDate]);

  // 대표 이미지 — 진행 중인 전시가 있으면 그걸, 없으면 예정 전시, 그마저 없으면 기본 이미지
  const heroExhibition = activeExhibitions[0] ?? upcomingExhibitions[0];

  const listExhibitions = tab === 'active' ? activeExhibitions : upcomingExhibitions;

  // 이 장소의 대표 전시가 가진 포스터 색 — 탭 밑줄·전시 도트 등 한 곳의 억양색으로만 쓴다
  const accentColor = heroExhibition?.posterColor ?? '#1C1917';


  return (
    <BottomSheetScrollView
      className='px-5 pt-3'
      showsVerticalScrollIndicator={false}
    >
      {/* 헤더 영역 */}
      <View>
        <View className='flex-row items-start justify-between mb-2'>
          <View className='flex-1 pr-12'>
            <Text className='text-black text-[26px] font-hahmlet-bold leading-[30px]'>
              {venue.venueName}
            </Text>
            <View className='flex flex-col gap-2 mt-4'>
              {venue.venueAddress && (
                <View className='flex-row items-center gap-1'>
                  <Ionicons
                    name='location-outline'
                    size={13}
                    color='rgba(0,0,0,0.45)'
                  />
                  <Text
                    className='text-black/60 text-[13px] font-pretendard-medium flex-1'
                    numberOfLines={1}
                  >
                    {venue.venueAddress}
                  </Text>
                </View>
              )}

              <View className='flex-row items-center flex-wrap gap-x-1.5 gap-y-1'>
                <View className='flex-row items-center gap-1'>
                  <Ionicons
                    name='time-outline'
                    size={13}
                    color='rgba(0,0,0,0.45)'
                  />
                  <Text className='text-black/60 text-[13px] font-pretendard-medium'>
                    {venue.openHours}
                  </Text>
                </View>
                {venue.closedDays && (
                  <View className='flex-row items-center gap-1.5'>
                    <View className='w-[3px] h-[3px] rounded-full bg-black/25' />
                    <Text className='text-black/55 text-[13px] font-pretendard-regular'>
                      {venue.closedDays} 휴무
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className='items-center'>
            <Pressable
              onPress={onRequestDirections}
              hitSlop={6}
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              className='items-center justify-center rounded-full bg-[#1C1917] w-11 h-11'
              accessibilityRole='button'
              accessibilityLabel={`${venue.venueName}까지 길찾기`}
            >
              <Ionicons
                name='navigate-outline'
                size={20}
                color='white'
              />
            </Pressable>
            {distanceText && (
              <Text className='text-black/45 text-[11px] font-pretendard-medium mt-1.5'>
                {distanceText}
              </Text>
            )}
          </View>
        </View>

        <View className='gap-1.5 mb-5'>
          {(venue.phone || venue.homepageUrl) && (
            <View className='flex-row items-center flex-wrap gap-x-1.5 gap-y-1'>
              {venue.phone && (
                <Text className='text-black/55 text-[13px] font-pretendard-regular'>
                  {venue.phone}
                </Text>
              )}
              {venue.homepageUrl && (
                <Pressable
                  onPress={() => Linking.openURL(venue.homepageUrl!)}
                  hitSlop={8}
                  className='flex-row items-center gap-1 ml-0.5 py-1'
                  accessibilityLabel='홈페이지로 이동'
                  accessibilityRole='link'
                >
                  {venue.phone && (
                    <View className='w-[3px] h-[3px] rounded-full bg-black/25 mr-1' />
                  )}
                  <Text className='text-black text-[13px] font-pretendard-semibold underline'>
                    홈페이지
                  </Text>
                  <Ionicons
                    name='arrow-up-outline'
                    size={11}
                    className='rotate-45'
                    color='#1C1917'
                  />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* 탭 — 카탈로그 목차처럼, 채워진 필 대신 밑줄로 선택을 표시 */}
        <View
          className='flex-row items-end gap-6 mb-4 border-b border-black/[0.06]'
          accessibilityRole='tablist'
        >
          {(
            [
              ['active', '진행 중', activeExhibitions.length],
              ['upcoming', '예정', upcomingExhibitions.length],
            ] as const
          ).map(([key, label, count]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              hitSlop={8}
              className='pt-2 pb-2.5'
              style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
              accessibilityRole='tab'
              accessibilityState={{ selected: tab === key }}
              accessibilityLabel={`${label} 전시 ${count}개`}
            >
              <Text
                className={cn(
                  'text-[14px] font-pretendard-bold',
                  tab === key ? 'text-black' : 'text-black/55',
                )}
              >
                {label} <Text className='text-[12px] font-pretendard-medium'>{count}</Text>
              </Text>
              {tab === key && (
                <View
                  className='absolute -bottom-px left-0 right-0 h-[2px] rounded-full'
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* 전시 목록 (선택된 탭) */}
      <View>
        {listExhibitions.length === 0 ? (
          <View className='flex-row items-center gap-2 py-2 mb-8'>
            <Ionicons
              name='warning-outline'
              size={16}
              color='rgba(0,0,0,0.3)'
            />
            <Text className='text-black/45 text-sm font-pretendard-regular'>
              {tab === 'active' ? '진행 중인 전시가 없어요' : '예정된 전시가 없어요'}
            </Text>
          </View>
        ) : (
          <View className='gap-3 mb-10'>
            {listExhibitions.map(ex => (
              <ExhibitionCard
                key={ex.id}
                ex={ex}
                status={tab}
                onPress={onGoToExhibition}
              />
            ))}
          </View>
        )}
      </View>
    </BottomSheetScrollView>
  );
}
