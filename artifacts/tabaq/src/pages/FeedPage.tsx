import React, { useState } from 'react';
import {
  Rss, TrendingUp, Users, Search, Heart, MessageSquare, Share2,
  Star, Award, ChevronRight, Utensils, Camera, Flame, Bookmark,
  Plus, ArrowUp, MapPin, Clock, CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGetFeed, useListReviews } from '@workspace/api-client-react';
import { ReviewCard } from '@/components/ReviewCard';
import { StarRating } from '@/components/StarRating';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

type FeedTab = 'following' | 'community';

const TRENDING_CRITICS = [
  { id: 1, name: 'Noura Al-Rashid', nameAr: 'نورة الراشد', handle: '@noura', avatar: 'https://i.pravatar.cc/40?img=47', level: 5, reviews: 142, badge: '👑', specialty: 'Fine Dining' },
  { id: 2, name: 'Faisal Al-Harbi', nameAr: 'فيصل الحربي', handle: '@faisal', avatar: 'https://i.pravatar.cc/40?img=12', level: 4, reviews: 98, badge: '🍽️', specialty: 'Street Food' },
  { id: 3, name: 'Lama Khalid', nameAr: 'لمى خالد', handle: '@lama', avatar: 'https://i.pravatar.cc/40?img=32', level: 4, reviews: 87, badge: '⭐', specialty: 'Desserts' },
  { id: 4, name: 'Sultan Qahtani', nameAr: 'سلطان القحطاني', handle: '@sultan', avatar: 'https://i.pravatar.cc/40?img=15', level: 3, reviews: 64, badge: '🌱', specialty: 'Healthy Eats' },
];

const TRENDING_RESTAURANTS = [
  { id: 1, nameEn: 'Reem Al-Bawadi', nameAr: 'ريم البوادي', cuisine: 'شامي', rating: 4.5, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop', city: 'الرياض', trend: '+24%' },
  { id: 2, nameEn: 'Sushi Sama', nameAr: 'سوشي ساما', cuisine: 'ياباني', rating: 4.7, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop', city: 'جدة', trend: '+18%' },
  { id: 3, nameEn: 'Nusret', nameAr: 'نصرت', cuisine: 'لحوم', rating: 4.6, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop', city: 'الرياض', trend: '+12%' },
];

const TRENDING_DISHES = [
  { nameEn: 'Wagyu Tenderloin', nameAr: 'ستيك واغيو', restaurant: 'Nusret', price: '320 ر.س', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop', likes: 842 },
  { nameEn: 'Dragon Roll', nameAr: 'دراغون رول', restaurant: 'Sushi Sama', price: '85 ر.س', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=120&h=120&fit=crop', likes: 634 },
  { nameEn: 'Mezze Platter', nameAr: 'طبق المقبلات', restaurant: 'Reem Al-Bawadi', price: '55 ر.س', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=120&h=120&fit=crop', likes: 521 },
];

const MOCK_FEED_ACTIVITIES = [
  {
    id: 1,
    type: 'review',
    user: { name: 'Noura Al-Rashid', nameAr: 'نورة الراشد', avatar: 'https://i.pravatar.cc/64?img=47', handle: '@noura', badge: '👑' },
    restaurant: { nameEn: 'Reem Al-Bawadi', nameAr: 'ريم البوادي', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', id: 2 },
    rating: 4.5,
    text: 'Absolutely stunning ambiance and the lamb ouzi was to die for. The service was impeccable — they remembered my dietary preferences from last time. Highly recommend for a special occasion.',
    textAr: 'أجواء رائعة وخروف الأوزي كان لذيذاً جداً. الخدمة كانت ممتازة — تذكروا تفضيلاتي الغذائية من المرة الأخيرة. أنصح به بشدة للمناسبات الخاصة.',
    time: '45 دقيقة',
    likes: 34,
    comments: 8,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  },
  {
    id: 2,
    type: 'review',
    user: { name: 'Faisal Al-Harbi', nameAr: 'فيصل الحربي', avatar: 'https://i.pravatar.cc/64?img=12', handle: '@faisal', badge: '🍽️' },
    restaurant: { nameEn: 'Sushi Sama', nameAr: 'سوشي ساما', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop', id: 3 },
    rating: 5,
    text: 'Best sushi in Riyadh, no contest. The dragon roll with their signature sauce is a masterpiece. Fresh fish, expert craftsmanship.',
    textAr: 'أفضل سوشي في الرياض بلا منافس. رول التنين مع الصوص الخاص بهم تحفة فنية. سمك طازج وصنعة احترافية.',
    time: '2 ساعة',
    likes: 21,
    comments: 5,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
  },
  {
    id: 3,
    type: 'review',
    user: { name: 'Lama Khalid', nameAr: 'لمى خالد', avatar: 'https://i.pravatar.cc/64?img=32', handle: '@lama', badge: '⭐' },
    restaurant: { nameEn: 'Nusret', nameAr: 'نصرت', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', id: 4 },
    rating: 4,
    text: 'The wagyu was exceptional, but portions could be bigger for the price. Still, the overall experience was unforgettable.',
    textAr: 'الواغيو كان استثنائياً، لكن الحصص يمكن أن تكون أكبر بالنسبة للسعر. رغم ذلك، التجربة الإجمالية كانت لا تُنسى.',
    time: '5 ساعات',
    likes: 15,
    comments: 3,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
  },
];

function ActivityCard({ activity, lang, t }: { activity: typeof MOCK_FEED_ACTIVITIES[0]; lang: string; t: (en: string, ar: string) => string }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <article className="bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-md transition-all">
      <Link href={`/restaurants/${activity.restaurant.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img src={activity.image} alt={activity.restaurant.nameEn} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between">
            <div>
              <p className="text-white font-bold text-lg leading-tight">{lang === 'ar' ? activity.restaurant.nameAr : activity.restaurant.nameEn}</p>
              <StarRating rating={activity.rating} size="md" />
            </div>
            <span className="bg-amber-400 text-black font-black text-sm px-2.5 py-1 rounded-xl">{activity.rating.toFixed(1)}</span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img src={activity.user.avatar} alt={activity.user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-foreground text-sm">{lang === 'ar' ? activity.user.nameAr : activity.user.name}</p>
              <span className="text-base leading-none">{activity.user.badge}</span>
            </div>
            <p className="text-xs text-muted-foreground">{activity.user.handle} · {t('منذ', 'ago')} {activity.time}</p>
          </div>
          <button className="text-xs text-primary font-semibold border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/5 transition-colors">
            {t('Follow', 'تابع')}
          </button>
        </div>

        <p className="text-sm text-foreground leading-relaxed line-clamp-3">
          {lang === 'ar' ? activity.textAr : activity.text}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {activity.likes + (liked ? 1 : 0)}
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
            <MessageSquare className="w-4 h-4" />
            {activity.comments}
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="w-4 h-4" />
            {t('Share', 'شارك')}
          </button>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`flex items-center gap-1.5 text-xs font-medium ms-auto transition-colors ${bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
}

const CRITIC_BADGES = ['👑', '🥈', '🥉', '⭐', '🍽️'];

function TrendingCriticsCard({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['feed-top-critics'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?limit=4');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 120000,
  });

  const critics = (data ?? []).slice(0, 4).map((entry: any, i: number) => ({
    id: entry.user.id,
    name: entry.user.nameEn,
    nameAr: entry.user.nameAr,
    avatar: entry.user.avatarUrl || `https://i.pravatar.cc/40?u=${entry.user.id}`,
    badge: CRITIC_BADGES[i] ?? '⭐',
    reviews: entry.reviewCount,
    levelTitle: entry.user.levelTitle || 'Food Explorer',
  }));

  const displayCritics = critics.length > 0 ? critics : TRENDING_CRITICS.map((c, i) => ({
    id: c.id, name: c.name, nameAr: c.nameAr, avatar: c.avatar, badge: c.badge, reviews: c.reviews, levelTitle: c.specialty,
  }));

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground text-sm">{t('Top Food Critics', 'أبرز نقاد الطعام')}</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-4 h-3 bg-muted rounded" />
              <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-muted rounded w-24" />
                <div className="h-2 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayCritics.map((critic: (typeof displayCritics)[0], i: number) => (
            <Link key={critic.id} href="/leaderboard">
              <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-xl p-1 transition-colors cursor-pointer">
                <span className="text-xs font-black text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                <img src={critic.avatar} alt={critic.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-foreground truncate">{lang === 'ar' ? critic.nameAr : critic.name}</p>
                    <span className="text-sm">{critic.badge}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{critic.reviews} {t('reviews', 'تقييم')} · {critic.levelTitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Link href="/leaderboard">
        <button className="w-full mt-3 text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
          {t('View all critics', 'عرض جميع النقاد')} <ChevronRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

function TrendingRestaurantsCard({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data } = useQuery({
    queryKey: ['feed-trending-restaurants'],
    queryFn: async () => {
      const res = await fetch('/api/restaurants?limit=3&sortBy=topRated');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 120000,
  });

  const restaurants = (data?.restaurants ?? TRENDING_RESTAURANTS).slice(0, 3);

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-foreground text-sm">{t('Trending This Week', 'الأكثر رواجاً هذا الأسبوع')}</h3>
      </div>
      <div className="space-y-3">
        {restaurants.map((r: any) => (
          <Link key={r.id} href={`/restaurants/${r.id}`}>
            <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-2xl p-1.5 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                <img src={r.coverImageUrl ?? r.image ?? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop'} alt={r.nameEn} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{lang === 'ar' ? (r.nameAr ?? r.nameEn) : r.nameEn}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] text-muted-foreground">{Number(r.avgRating ?? r.rating ?? 0).toFixed(1)} · {r.cityNameEn ?? r.city ?? 'Riyadh'}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                <ArrowUp className="w-2.5 h-2.5" />{r.trend ?? '+12%'}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/restaurants">
        <button className="w-full mt-3 text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
          {t('Explore restaurants', 'استكشف المطاعم')} <ChevronRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

function TrendingDishesCard({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data } = useQuery({
    queryKey: ['feed-trending-dishes'],
    queryFn: async () => {
      const res = await fetch('/api/dishes/trending?limit=3');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 120000,
  });

  const dishes = (Array.isArray(data) ? data : data?.dishes ?? TRENDING_DISHES).slice(0, 3);

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground text-sm">{t("Today's Top Dishes", 'أفضل الأطباق اليوم')}</h3>
      </div>
      <div className="space-y-3">
        {dishes.map((dish: any, i: number) => (
          <Link key={dish.id ?? i} href={dish.restaurantId ? `/restaurants/${dish.restaurantId}` : '/restaurants'}>
            <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-xl p-1 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                <img src={dish.imageUrl ?? dish.image ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop'} alt={dish.nameEn} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{lang === 'ar' ? (dish.nameAr ?? dish.nameEn) : dish.nameEn}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {lang === 'ar' ? (dish.restaurantNameAr ?? dish.restaurant ?? '') : (dish.restaurantNameEn ?? dish.restaurant ?? '')} · {dish.price} {dish.currency ?? 'SAR'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {Number(dish.avgRating ?? 0).toFixed(1)}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/dishes">
        <button className="w-full mt-3 text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
          {t('Browse all dishes', 'تصفح جميع الأطباق')} <ChevronRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

function QuickShareCTA({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  return (
    <Link href="/restaurants">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground">{t('Share your dining experience', 'شارك تجربتك')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('Visit a restaurant and leave a review', 'زر مطعماً واترك تقييمك')}</p>
        </div>
        <Plus className="w-5 h-5 text-primary shrink-0" />
      </div>
    </Link>
  );
}

export default function FeedPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('community');

  const { data: feedData, isLoading: feedLoading } = useGetFeed(
    { limit: 30 },
    {
      query: {
        queryKey: ['/api/feed', { limit: 30 }],
        enabled: !!user && tab === 'following',
      },
    }
  );

  const { data: communityData, isLoading: communityLoading } = useListReviews(
    { limit: 30 },
    {
      query: {
        queryKey: ['/api/reviews', { limit: 30 }],
        enabled: tab === 'community',
      },
    }
  );

  const liveReviews = tab === 'following' ? feedData?.reviews : communityData?.reviews;
  const isLoading = tab === 'following' ? feedLoading : communityLoading;

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <span className="text-3xl">🍽️</span>
              {t('Food Feed', 'تغذية الطعام')}
            </h1>
            <Link href="/restaurants">
              <Button size="sm" className="rounded-2xl gap-2">
                <Plus className="w-4 h-4" />
                {t('Write Review', 'اكتب تقييماً')}
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">{t('Discover what the food community is saying', 'اكتشف ما يقوله مجتمع الطعام')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5">
            <QuickShareCTA t={t} lang={lang} />

            {/* Tab bar */}
            <div className="flex gap-1 bg-muted rounded-2xl p-1">
              {([
                { id: 'community' as FeedTab, label: t('Community', 'المجتمع'), icon: TrendingUp },
                { id: 'following' as FeedTab, label: t('Following', 'المتابَعون'), icon: Users },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Following unauthenticated */}
            {tab === 'following' && !user && (
              <div className="text-center py-20 bg-card border border-border/60 rounded-3xl">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{t('Sign in to see your feed', 'سجّل دخولك لرؤية تغذيتك')}</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  {t('Follow food critics and see their latest reviews in real-time.', 'تابع نقاد الطعام وشاهد تقييماتهم الأخيرة لحظة بلحظة.')}
                </p>
                <Link href="/signin"><Button className="rounded-2xl">{t('Sign In', 'تسجيل الدخول')}</Button></Link>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border/60 rounded-3xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-32" />
                          <div className="h-2.5 bg-muted rounded w-24" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-4/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live API reviews */}
            {!isLoading && liveReviews && liveReviews.length > 0 && (
              <div className="space-y-5">
                {liveReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} showTarget />
                ))}
              </div>
            )}

            {/* No live data — show rich mock feed */}
            {!isLoading && (!liveReviews || liveReviews.length === 0) && (tab === 'community' || (tab === 'following' && !!user)) && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-border" />
                  <p className="text-xs text-muted-foreground font-medium">{t('Community highlights', 'أبرز ما في المجتمع')}</p>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {MOCK_FEED_ACTIVITIES.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} lang={lang} t={t} />
                ))}
                <div className="text-center py-6">
                  <Link href="/restaurants">
                    <Button variant="outline" className="rounded-2xl gap-2">
                      <Search className="w-4 h-4" />
                      {t('Discover more restaurants', 'اكتشف المزيد من المطاعم')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-5">
            <TrendingRestaurantsCard t={t} lang={lang} />
            <TrendingCriticsCard t={t} lang={lang} />
            <TrendingDishesCard t={t} lang={lang} />

            {/* Explore prompt */}
            <div className="bg-gradient-to-br from-primary to-violet-600 rounded-3xl p-5 text-white">
              <p className="font-extrabold text-lg mb-1">{t('Ready to explore?', 'مستعد للاستكشاف؟')}</p>
              <p className="text-white/80 text-sm mb-4">{t('Book a table at Riyadh\'s best restaurants.', 'احجز طاولة في أفضل مطاعم الرياض.')}</p>
              <Link href="/restaurants">
                <button className="bg-white text-primary font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-white/90 transition-colors w-full">
                  {t('Find a Restaurant', 'ابحث عن مطعم')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
