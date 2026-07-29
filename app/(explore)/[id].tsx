import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getExhibition, type Artwork, type Exhibition } from '@/src/data/exhibitions';
import { ImmersiveOverlay } from '@/src/components/explore/ImmersiveOverlay';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { todayKey, useVisitStore } from '@/src/store/visitStore';
import { useCultureExhibitionDetail } from '@/src/hooks/useCultureExhibitionDetail';
import { useKcisaExhibitionDetail } from '@/src/hooks/useKcisaExhibitionDetail';
import { cn } from '@/src/lib/cn';
import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import {
  getExhibitionTypeLabel,
  getShortVenueLabel,
  splitArtistNames,
} from '@/src/utils/exhibitionSearch';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;
const POSTER_W = 148;
const POSTER_H = 216;

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 450 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function ExhibitionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const enterImmersive = useImmersiveStore(s => s.enter);
  const recordVisit = useVisitStore(s => s.recordExhibition);
  const setImmersiveMode = useImmersiveStore(s => s.setImmersiveMode);

  const staticExhibition = getExhibition(id);
  const { exhibition: kcisaExhibition, status: kcisaStatus } = useKcisaExhibitionDetail(
    staticExhibition ? undefined : id,
  );
  const shouldTryCulture = !staticExhibition && kcisaStatus === 'error';
  const { exhibition: apiExhibition, status: apiStatus } = useCultureExhibitionDetail(
    shouldTryCulture ? id : undefined,
  );
  const exhibition = staticExhibition ?? kcisaExhibition ?? apiExhibition ?? undefined;
  const isLoading =
    !staticExhibition &&
    (kcisaStatus === 'loading' ||
      kcisaStatus === 'idle' ||
      (shouldTryCulture && (apiStatus === 'loading' || apiStatus === 'idle')));
  const isBookmarked = useBookmarkStore(s => s.isBookmarked(id));
  const toggle = useBookmarkStore(s => s.toggle);

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
            {exhibition.heroImageUri ? (
              <>
                <Image
                  source={{ uri: exhibition.heroImageUri }}
                  className='w-full h-full'
                  resizeMode='cover'
                />
                {/* 포스터 전체에 살짝 어두운 레이어 — 상단 아이콘 대비 확보 */}
                <View
                  className='absolute inset-0'
                  style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
                  pointerEvents='none'
                />
              </>
            ) : (
              <EmptyImagePlaceholder
                className='w-full h-full items-center justify-center bg-[#dad4c8]'
                iconSize={160}
              />
            )}
          </Animated.View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            className='absolute bottom-0 left-0 right-0 h-[292px] justify-end pb-6 px-6'
          />

          <View className='absolute bottom-6 right-6'>
            <ImmersiveButton onPress={() => setImmersiveOpen(true)} />
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
            <MetaPill
              icon='location-outline'
              text={getShortVenueLabel(exhibition.venue)}
            />
            {splitArtistNames(exhibition.artist).map(name => (
              <MetaPill
                key={name}
                icon='person-outline'
                text={name}
              />
            ))}
          </ScrollView>
        </FadeInView>

        {/* 전시 제목 */}
        <FadeInView delay={170}>
          <View className='px-6 pt-1 pb-3'>
            <Text className='text-gray-900 text-[26px] leading-[34px] font-pretendard-bold'>
              {exhibition.title}
            </Text>
            <Text className='text-gray-400 text-[13px] font-pretendard-regular mt-1'>
              {exhibition.startDate} – {exhibition.endDate}
            </Text>
          </View>
        </FadeInView>

        {/* Description — 없으면(문화포털 데이터 특성상 자주 비어있음) 안내 URL 링크로 대체 */}
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
            ) : exhibition.ticketUrl ? (
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(exhibition.ticketUrl!)}
                className='flex-row items-center gap-1'
                accessibilityLabel='전시 안내 페이지 자세히 보기'
                accessibilityRole='link'
              >
                <Text className='text-gray-500 text-[14px] font-pretendard-medium underline'>
                  자세히 보기
                </Text>
                <Ionicons
                  name='open-outline'
                  size={14}
                  color='#6B7280'
                />
              </Pressable>
            ) : null}
          </View>
        </FadeInView>

        {/* 관람 정보 — 카드/아이콘 없이 순수 타이포+룰선으로만 구성한 팩트시트.
				    도록(catalogue)이나 벽면 라벨에 인쇄된 스펙 표를 참고했다. */}
        <FadeInView delay={300}>
          <View className='px-6 pt-8 mt-2'>
            <Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
              관람 정보
            </Text>
            <View style={{ height: 2, backgroundColor: '#1C1917' }} />
            {exhibition.venueAddress && <InfoRow label='위치'>{exhibition.venueAddress}</InfoRow>}
            <InfoRow label='전화번호'>{exhibition.phone ?? '정보 없음'}</InfoRow>
            <InfoRow
              label='운영시간'
              sub={exhibition.closedDays ? `${exhibition.closedDays} 휴관` : undefined}
            >
              {exhibition.openHours}
            </InfoRow>
            <InfoRow label='관람료'>{exhibition.admission}</InfoRow>

            <InfoRow
              label='전시 형태'
              isLast
            >
              {getExhibitionTypeLabel(exhibition)}
            </InfoRow>
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
                  <ArtworkCard
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
          const related =
            exhibition.relatedExhibitions ??
            exhibition.relatedExhibitionIds
              .map(relId => getExhibition(relId))
              .filter((e): e is Exhibition => e !== undefined);
          if (related.length === 0) return null;
          return (
            <FadeInView delay={500}>
              <RelatedExhibitions exhibitions={related} />
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
          <CTAButton exhibition={exhibition} />
        </SafeAreaView>
      </View>

      <ImmersiveOverlay
        visible={immersiveOpen}
        exhibition={exhibition}
        onStart={() => {
          setImmersiveOpen(false);
          enterImmersive(id);
          recordVisit(todayKey(), id); // 관람 다이어리용 방문 기록
          setImmersiveMode(true);
          router.push('/(guide)/create-description');
        }}
        onClose={() => setImmersiveOpen(false)}
      />
    </View>
  );
}

function CTAButton({ exhibition }: { exhibition: Exhibition }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isFree = !!exhibition.admissionFree;
  const hasTicket = !isFree && !!exhibition.ticketUrl;
  const label = isFree ? '무료 전시입니다' : hasTicket ? '예매하러 가기' : '예매 정보 없음';

  return (
    <Pressable
      onPressIn={() => {
        if (!hasTicket) return;
        scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      onPress={() => {
        if (!hasTicket) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        WebBrowser.openBrowserAsync(exhibition.ticketUrl!);
      }}
      accessibilityLabel={label}
      accessibilityRole='button'
      disabled={!hasTicket}
    >
      <Animated.View
        style={[animatedStyle, { backgroundColor: hasTicket ? '#111827' : '#D1D5DB' }]}
        className='mx-5 my-3 rounded-2xl py-[18px] flex-row items-center justify-center gap-2.5'
      >
        <Ionicons
          name='ticket-outline'
          size={20}
          color={hasTicket ? 'white' : '#9CA3AF'}
        />
        <Text
          className={cn(
            'font-pretendard-bold text-[16px]',
            hasTicket ? 'text-white' : 'text-[#9CA3AF]',
          )}
        >
          {label}
        </Text>
        {hasTicket && (
          <Ionicons
            name='chevron-forward'
            size={16}
            color='rgba(255,255,255,0.5)'
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

function ImmersiveButton({ onPress }: { onPress: () => void }) {
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        pressScale.value = withSpring(0.88, { damping: 12 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, { damping: 12 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      accessibilityLabel='몰입하기'
      accessibilityRole='button'
      hitSlop={8}
    >
      <Animated.View
        style={pressStyle}
        className='items-center'
      >
        <View className='w-14 h-14 rounded-full items-center justify-center bg-white/18 border-[1.5px] border-white/45'>
          <Ionicons
            name='headset'
            size={24}
            color='white'
          />
        </View>
        <Text className='text-white/70 text-[10px] font-pretendard-medium text-center mt-1.5'>
          몰입하기
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function MetaPill({
  icon,
  text,
  searchable = true,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  // 전시타입/주말운영처럼 실제 검색 가능한 필드(title/venue/artist/tags)가 아닌 계산된
  // 값은 눌러도 검색 결과가 항상 0건이라 비활성으로 둔다.
  searchable?: boolean;
}) {
  const router = useRouter();
  if (!searchable) {
    return (
      <View className='flex-row items-center gap-1.5 rounded-full px-3 py-2 bg-white'>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color='#6B7280'
          />
        )}
        <Text className='font-pretendard-regular text-[12px] text-[#374151]'>{text}</Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: text } })}
      className='flex-row items-center gap-1.5 rounded-full px-3 py-2 bg-white'
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
      accessibilityRole='button'
      accessibilityLabel={`${text}로 검색`}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color='#6B7280'
        />
      )}
      <Text className='font-pretendard-regular text-[12px] text-[#374151]'>{text}</Text>
    </Pressable>
  );
}

// 위치·작가(MetaPill, 아이콘+흰 배경)와 구분되는 분류용 태그 — 전시 타입/장르/주말운영처럼
// "사실 정보"가 아니라 "분류"에 해당하는 값에 쓴다. 포스터 색 기반 팔레트를 따른다.
function TagPill({
  text,
  palette,
}: {
  text: string;
  palette: { pillText: string; tagBg: string } | null;
}) {
  return (
    <View
      className='rounded-full px-3 py-1.5'
      style={{ backgroundColor: palette?.tagBg ?? '#F2EFE9' }}
    >
      <Text
        className='text-[12px] font-pretendard-medium'
        style={{ color: palette?.pillText ?? '#6B7280' }}
      >
        # {text}
      </Text>
    </View>
  );
}

// 관람 정보 명판의 한 줄 — 아이콘 칩(포스터 팔레트) + 라벨 + 값. 마지막 줄엔 구분선을 안 그린다.
// 관람 정보 팩트시트의 한 줄 — 라벨(좌) / 값(우, Hahmlet) + 검은 헤어라인 룰.
// 카드도 아이콘도 없이 타이포와 룰선만으로 "인쇄된 스펙 표" 느낌을 낸다.
function InfoRow({
  label,
  sub,
  isLast,
  children,
}: {
  label: string;
  sub?: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className='flex-row items-start justify-between gap-4 py-3'
      style={
        !isLast
          ? {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: 'rgba(28,25,23,0.15)',
            }
          : undefined
      }
    >
      <Text className='text-gray-500 text-[12px] font-pretendard-semibold tracking-wider uppercase pt-1'>
        {label}
      </Text>
      <View className='flex-1 items-end'>
        <Text
          className='text-[#1C1917] text-[14px] font-pretendard-regular text-right'
          style={{ lineHeight: 21 }}
        >
          {children}
        </Text>
      </View>
    </View>
  );
}

function ArtworkCard({ artwork, onPress }: { artwork: Artwork; onPress: () => void }) {
  const cardSize = (SCREEN_WIDTH - 48 - 12) / 2;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      onPress={onPress}
      style={{ width: cardSize }}
    >
      <Animated.View style={animatedStyle}>
        {artwork.imageUri || artwork.imageSource ? (
          <Image
            source={artwork.imageUri ? { uri: artwork.imageUri } : artwork.imageSource}
            style={{ height: cardSize, width: cardSize }}
            className='rounded-[16px]'
            resizeMode='cover'
          />
        ) : (
          <EmptyImagePlaceholder
            className='rounded-[16px] items-center justify-center bg-[#E5E1D8]'
            style={{ height: cardSize, width: cardSize }}
            iconSize={cardSize * 0.55}
          />
        )}
        <View className='pt-2'>
          <Text
            className='font-pretendard-medium text-[13px] text-gray-800'
            numberOfLines={1}
          >
            {artwork.title}
          </Text>
          <Text className='font-pretendard-regular text-[11px] text-gray-400 mt-0.5'>
            {artwork.artist}
            {artwork.year ? ` · ${artwork.year}` : ''}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function RelatedExhibitions({ exhibitions }: { exhibitions: Exhibition[] }) {
  const router = useRouter();
  const related = exhibitions.slice(0, 6);

  return (
    <View className='pt-8 mt-4'>
      <Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4 px-6'>
        관련 전시
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
      >
        {related.map(ex => (
          <RelatedExhibitionCard
            key={ex.id}
            exhibition={ex}
            onPress={() => router.push(`/(explore)/${ex.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function RelatedExhibitionCard({
  exhibition,
  onPress,
}: {
  exhibition: Exhibition;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      onPress={onPress}
      style={{ width: POSTER_W }}
      accessibilityLabel={`${exhibition.title}, ${exhibition.venue}`}
      accessibilityRole='button'
    >
      <Animated.View style={animatedStyle}>
        {/* 포스터 — 이미지 있으면 실제 이미지, 없으면 빈 상태 */}
        <View
          className='rounded-2xl overflow-hidden'
          style={{ width: POSTER_W, height: POSTER_H }}
        >
          {exhibition.heroImageUri || exhibition.posterImage ? (
            <Image
              source={
                exhibition.heroImageUri ? { uri: exhibition.heroImageUri } : exhibition.posterImage
              }
              style={{ width: POSTER_W, height: POSTER_H }}
              resizeMode='cover'
            />
          ) : (
            <EmptyImagePlaceholder
              style={{ width: POSTER_W, height: POSTER_H }}
              className='items-center justify-center bg-[#E5E1D8]'
              iconSize={72}
            />
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            className='absolute top-0 left-0 right-0 h-14'
            pointerEvents='none'
          />

          {/* 장르 배지 — 포스터가 흰색/밝은 배경이면 배지가 묻히므로 그림자로 경계를 살린다 */}
          <View
            className='absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 bg-white/85'
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }}
          >
            <Text className='text-[10px] font-pretendard-semibold text-[#1C1917]'>
              {exhibition.genre}
            </Text>
          </View>
        </View>

        {/* 텍스트 */}
        <View
          className='pt-2.5'
          style={{ width: POSTER_W }}
        >
          <Text
            className='font-pretendard-semibold text-[14px] text-gray-900 leading-[19px]'
            numberOfLines={2}
          >
            {exhibition.title}
          </Text>
          <View className='flex-row items-center gap-1 mt-1'>
            <Ionicons
              name='location-outline'
              size={11}
              color='#9CA3AF'
            />
            <Text
              className='font-pretendard-regular text-[11px] text-gray-400 flex-1'
              numberOfLines={1}
            >
              {exhibition.venue}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
