import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImmersiveOverlay } from '@/src/components/explore/ImmersiveOverlay';
import { ExhibitionArtworkCard } from '@/src/components/explore/ExhibitionArtworkCard';
import { ExhibitionImmersiveCTA } from '@/src/components/explore/ExhibitionImmersiveCTA';
import { ExhibitionImmersiveFab } from '@/src/components/explore/ExhibitionImmersiveFab';
import { ExhibitionInfoRow } from '@/src/components/explore/ExhibitionInfoRow';
import { ExhibitionMetaPill } from '@/src/components/explore/ExhibitionMetaPill';
import { ExhibitionOfficialLink } from '@/src/components/explore/ExhibitionOfficialLink';
import { RelatedExhibitions } from '@/src/components/explore/RelatedExhibitions';
import { FadeInView } from '@/src/components/common/FadeInView';
import { ExhibitionPoster } from '@/src/components/common/EmptyImagePlaceholder';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { useCultureExhibitionDetail } from '@/src/hooks/useCultureExhibitionDetail';
import { useExhibitionDetail } from '@/src/hooks/useExhibitionDetail';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { todayKey, useVisitStore } from '@/src/store/visitStore';
import {
  getExhibitionTypeDisplay,
  getGenreTag,
  splitArtistNames,
} from '@/src/utils/exhibitionSearch';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;

export default function ExhibitionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const enterImmersive = useImmersiveStore(s => s.enter);
  const recordVisit = useVisitStore(s => s.recordExhibition);
  const setImmersiveMode = useImmersiveStore(s => s.setImmersiveMode);

  const isNumericDbId = id != null && Number.isFinite(Number(id));
  const { exhibition: kcisaExhibition, status: kcisaStatus } = useExhibitionDetail(
    isNumericDbId ? id : undefined,
  );
  const shouldTryCulture = !isNumericDbId || kcisaStatus === 'error';
  const { exhibition: apiExhibition, status: apiStatus } = useCultureExhibitionDetail(
    shouldTryCulture ? id : undefined,
  );
  const exhibition = kcisaExhibition ?? apiExhibition ?? undefined;
  const isLoading =
    kcisaStatus === 'loading' ||
    kcisaStatus === 'idle' ||
    (shouldTryCulture && (apiStatus === 'loading' || apiStatus === 'idle'));
  const isBookmarked = useBookmarkStore(s => s.isBookmarked(id));
  const toggle = useBookmarkStore(s => s.toggle);
  const { ensureAuth } = useRequireAuth();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // 데이터가 fade로 나타나는 것과 맞춰 히어로 이미지도 함께 fade-in (안 그러면 이미지만 뚝 나타남)
  const heroOpacity = useSharedValue(0);
  useEffect(() => {
    if (!exhibition) return;
    heroOpacity.value = 0;
    heroOpacity.value = withTiming(1, { duration: 450 });
  }, [exhibition?.id]);

  const heroImageStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: scrollY.value * 0.35 }],
  }));

  const backScale = useSharedValue(1);
  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const bookmarkScale = useSharedValue(1);
  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const shareScale = useSharedValue(1);
  const shareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
  }));

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${exhibition?.title} @ ${exhibition?.venue}\n${exhibition?.startDate} – ${exhibition?.endDate}`,
        title: exhibition?.title,
      });
    } catch {
      // share cancelled
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-[#F8F6F2]'>
        <ActivityIndicator color='#9CA3AF' />
      </SafeAreaView>
    );
  }

  if (!exhibition) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-[#F8F6F2]'>
        <Text className='text-gray-500 text-base font-pretendard-regular mb-4'>
          전시를 찾을 수 없어요
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className='text-gray-900 text-sm font-pretendard-medium underline'>돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className='flex-1 bg-[#F8F6F2]'>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Hero Section */}
        <View
          className='overflow-hidden w-full'
          style={{ height: HERO_HEIGHT }}
        >
          <Animated.View style={[{ width: '100%', height: HERO_HEIGHT }, heroImageStyle]}>
            <ExhibitionPoster
              heroImageUri={exhibition.heroImageUri}
              posterImage={exhibition.posterImage}
              style={{ width: '100%', height: HERO_HEIGHT }}
              iconSize={160}
              resizeMode='cover'
              dimOverlay
            />
          </Animated.View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            className='absolute bottom-0 left-0 right-0 h-[292px] justify-end pb-6 px-6'
          />

          <View className='absolute bottom-6 right-6'>
            <ExhibitionImmersiveFab onPress={() => setImmersiveOpen(true)} />
          </View>
        </View>

        {/* Meta Info — 위치·작가·장르·전시타입·주말운영을 태그로 노출 (검색 가능하도록 이름은 개별 태그) */}
        <FadeInView delay={100}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingVertical: 16,
              gap: 8,
            }}
          >
            <ExhibitionMetaPill
              icon='location-outline'
              text={exhibition.venue}
            />
            {splitArtistNames(exhibition.artist).map(name => (
              <ExhibitionMetaPill
                key={name}
                icon='person-outline'
                text={name}
              />
            ))}
            {exhibition.exhibitionType && <ExhibitionMetaPill text={exhibition.exhibitionType} />}
            {getGenreTag(exhibition) && <ExhibitionMetaPill text={getGenreTag(exhibition)!} />}
          </ScrollView>
        </FadeInView>

        {/* 전시 제목 */}
        <FadeInView delay={170}>
          <View className='px-6 pt-1 pb-3'>
            <Text className='text-gray-900 text-[26px] leading-[34px] font-pretendard-bold'>
              {exhibition.title.trim()}
            </Text>
            <View className='flex-row items-center flex-wrap gap-x-3 gap-y-1 mt-3'>
              <Text className='text-gray-400 text-[13px] font-pretendard-regular'>
                {exhibition.startDate} – {exhibition.endDate}
              </Text>
              {exhibition.ticketUrl ? (
                <ExhibitionOfficialLink exhibition={exhibition} />
              ) : null}
            </View>
          </View>
        </FadeInView>

        {/* Description — 본문만 (외부 안내는 제목 아래 링크) */}
        <FadeInView delay={200}>
          <View className='px-6'>
            {exhibition.description ? (
              <>
                <Text
                  className='font-pretendard-light text-[15px] leading-[26px] text-gray-600'
                  numberOfLines={descriptionExpanded ? undefined : 3}
                >
                  {exhibition.description}
                </Text>
                <Pressable
                  onPress={() => setDescriptionExpanded(prev => !prev)}
                  className='mt-2'
                >
                  <Text className='text-gray-400 text-[13px] font-pretendard-medium'>
                    {descriptionExpanded ? '접기' : '더보기'}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </FadeInView>

        {(exhibition.tags?.length ?? 0) > 0 && (
          <FadeInView delay={250}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingTop: 12,
                paddingBottom: 4,
                gap: 8,
              }}
            >
              {(exhibition.tags ?? [])?.map(tag => (
                <ExhibitionMetaPill
                  key={tag}
                  icon='pricetag-outline'
                  text={tag}
                />
              ))}
            </ScrollView>
          </FadeInView>
        )}

        {/* 관람 정보 — 카드/아이콘 없이 순수 타이포+룰선으로만 구성한 팩트시트.
				    도록(catalogue)이나 벽면 라벨에 인쇄된 스펙 표를 참고했다. */}
        <FadeInView delay={300}>
          <View className='px-6 pt-10'>
            <Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
              관람 정보
            </Text>
            <View style={{ height: 2, backgroundColor: '#1C1917' }} />
            {exhibition.venueAddress && <ExhibitionInfoRow label='위치'>{exhibition.venueAddress}</ExhibitionInfoRow>}
            <ExhibitionInfoRow label='전화번호'>{exhibition.phone ?? '정보 없음'}</ExhibitionInfoRow>
            <ExhibitionInfoRow label='운영시간'>{exhibition.openHours}</ExhibitionInfoRow>
            <ExhibitionInfoRow label='관람료'>{exhibition.admission}</ExhibitionInfoRow>

            <ExhibitionInfoRow
              label='전시 형태'
              isLast
            >
              {getExhibitionTypeDisplay(exhibition)}
            </ExhibitionInfoRow>
            <View style={{ height: 2, backgroundColor: '#1C1917' }} />
          </View>
        </FadeInView>

        {/* 관련 추천 작품 */}
        {exhibition.artworks.length > 0 && (
          <FadeInView delay={400}>
            <View className='px-6 pt-8'>
              <Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
                관련 추천 작품
              </Text>
              <View className='flex-row flex-wrap justify-between gap-y-4'>
                {exhibition.artworks.slice(0, 4).map(artwork => (
                  <ExhibitionArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    onPress={() => router.push(`/(explore)/artwork/${artwork.id}`)}
                  />
                ))}
              </View>
            </View>
          </FadeInView>
        )}

        {/* 추천 전시 — API 소스는 이미 조회된 relatedExhibitions, 정적 데이터는 id로 조회 */}
        {(() => {
          const related = exhibition.relatedExhibitions;
          if (related?.length === 0) return null;
          return (
            <FadeInView delay={500}>
              <RelatedExhibitions exhibitions={related!} />
            </FadeInView>
          );
        })()}
      </Animated.ScrollView>

      {/* 뒤로가기 버튼 */}
      <Pressable
        onPressIn={() => {
          backScale.value = withTiming(0.92, { duration: 100 });
        }}
        onPressOut={() => {
          backScale.value = withTiming(1, { duration: 150 });
        }}
        onPress={() => router.back()}
        className='absolute left-5'
        style={{ top: insets.top + 16 }}
        accessibilityLabel='뒤로가기'
        accessibilityRole='button'
        hitSlop={8}
      >
        <Animated.View
          style={backAnimatedStyle}
          className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
        >
          <Ionicons
            name='chevron-back'
            size={22}
            color='#1a1a1a'
          />
        </Animated.View>
      </Pressable>

      {/* 우측 상단 버튼 그룹 (공유 + 북마크) */}
      <View
        className='absolute right-5 flex-row gap-2'
        style={{ top: insets.top + 16 }}
      >
        {/* 공유 버튼 */}
        <Pressable
          onPressIn={() => {
            shareScale.value = withTiming(0.92, { duration: 100 });
          }}
          onPressOut={() => {
            shareScale.value = withTiming(1, { duration: 150 });
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleShare();
          }}
          accessibilityLabel='공유하기'
          accessibilityRole='button'
          hitSlop={8}
        >
          <Animated.View
            style={shareAnimatedStyle}
            className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
          >
            <Ionicons
              name='share-outline'
              size={20}
              color='#1a1a1a'
            />
          </Animated.View>
        </Pressable>

        {/* 북마크 버튼 */}
        <Pressable
          onPressIn={() => {
            bookmarkScale.value = withTiming(0.92, { duration: 100 });
          }}
          onPressOut={() => {
            bookmarkScale.value = withTiming(1, { duration: 150 });
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!ensureAuth(`/(explore)/${id}`)) return;
            toggle(id);
          }}
          accessibilityLabel='북마크'
          accessibilityRole='button'
          hitSlop={8}
        >
          <Animated.View
            style={bookmarkAnimatedStyle}
            className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? '#111827' : '#1a1a1a'}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* 하단 CTA */}
      <View className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100'>
        <SafeAreaView edges={['bottom']}>
          <ExhibitionImmersiveCTA onPress={() => setImmersiveOpen(true)} />
        </SafeAreaView>
      </View>

      <ImmersiveOverlay
        visible={immersiveOpen}
        exhibition={exhibition}
        onStart={() => {
          setImmersiveOpen(false);
          enterImmersive(id);
          recordVisit(todayKey(), id, {
            title: exhibition.title,
            venue: exhibition.venue,
          });
          setImmersiveMode(true);
          router.push('/(guide)/create-description');
        }}
        onClose={() => setImmersiveOpen(false)}
      />
    </View>
  );
}
