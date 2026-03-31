import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useCity } from '@/context/CityContext';
import { useCart } from '@/context/CartContext';
import { Link, useLocation } from 'wouter';
import {
  Search, ChevronRight, Star, TrendingUp, Trophy, MapPin,
  Flame, Layers, ArrowRight, CalendarDays, MessageSquare,
  Utensils, Sparkles, BookOpen, Tag, Award, Clock, Zap,
  Heart, Navigation, Percent, BadgeCheck, ScanQrCode, CalendarCheck, BadgeDollarSign,
  ChefHat, RotateCcw, Plus, Minus, ShoppingBag, CheckCircle2,
  X
} from 'lucide-react';
import { ExperienceCard } from '@/components/ExperienceCard';
import { useListExperiences, type Experience } from '@workspace/api-client-react';
import { ListExperiencesSortBy } from '@workspace/api-client-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { StarRating } from '@/components/StarRating';
import { getRestaurantAwards, COLLECTIONS } from '@/lib/awards';

// ── Images ─────────────────────────────────────────────────────────
const HERO_IMGS = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&h=1080&fit=crop',
];

const NEW_OPENINGS = [
  {
    id: 10,
    nameEn: 'Bab Al Qasr',
    nameAr: 'باب القصر',
    cuisineEn: 'Saudi Fine Dining',
    cuisineAr: 'مطبخ سعودي فاخر',
    img: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=600&h=400&fit=crop',
    rating: 4.7,
    locationEn: 'Al Nakheel, Riyadh',
    locationAr: 'النخيل، الرياض',
    daysOpen: 3,
  },
  {
    id: 11,
    nameEn: 'Ōkami Ramen',
    nameAr: 'أوكامي رامن',
    cuisineEn: 'Japanese Ramen',
    cuisineAr: 'رامن ياباني',
    img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=400&fit=crop',
    rating: 4.9,
    locationEn: 'Hittin, Riyadh',
    locationAr: 'حطين، الرياض',
    daysOpen: 7,
  },
  {
    id: 12,
    nameEn: 'Saffron House',
    nameAr: 'بيت الزعفران',
    cuisineEn: 'Modern Persian',
    cuisineAr: 'فارسي معاصر',
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop',
    rating: 4.6,
    locationEn: 'Al Malqa, Riyadh',
    locationAr: 'الملقا، الرياض',
    daysOpen: 12,
  },
  {
    id: 13,
    nameEn: 'Cielo Terrace',
    nameAr: 'تراس سييلو',
    cuisineEn: 'Modern Italian',
    cuisineAr: 'إيطالي معاصر',
    img: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=600&h=400&fit=crop',
    rating: 4.8,
    locationEn: 'King Road, Jeddah',
    locationAr: 'طريق الملك، جدة',
    daysOpen: 18,
  },
  {
    id: 14,
    nameEn: 'Terroir Garden',
    nameAr: 'حديقة تيروار',
    cuisineEn: 'Farm-to-Table',
    cuisineAr: 'من المزرعة للمائدة',
    img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=400&fit=crop',
    rating: 4.5,
    locationEn: 'Sulaymaniyah, Riyadh',
    locationAr: 'السليمانية، الرياض',
    daysOpen: 22,
  },
  {
    id: 15,
    nameEn: 'The Black Pearl',
    nameAr: 'اللؤلؤة السوداء',
    cuisineEn: 'Seafood & Grill',
    cuisineAr: 'مأكولات بحرية ومشويات',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
    rating: 4.7,
    locationEn: 'Corniche, Jeddah',
    locationAr: 'الكورنيش، جدة',
    daysOpen: 28,
  },
];

const OCCASION_META: Record<string, { img: string }> = {
  'Birthday Celebration': { img: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300&h=200&fit=crop' },
  'Breakfast':            { img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&h=200&fit=crop' },
  'Business Lunch':       { img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&h=200&fit=crop' },
  'Family Dinner':        { img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop' },
  'Group Gathering':      { img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=300&h=200&fit=crop' },
  'Healthy Dining':       { img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop' },
  'Ramadan Iftar':        { img: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=300&h=200&fit=crop' },
  'Romantic Date':        { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop' },
};
const RESTAURANT_OF_THE_WEEK = {
  id: 7,
  nameEn: 'Nobu Riyadh',
  nameAr: 'نوبو الرياض',
  coverImg: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=1600&h=800&fit=crop',
  cuisineEn: 'Japanese-Peruvian Fusion',
  cuisineAr: 'مزيج ياباني بيروفي',
  cityEn: 'Riyadh',
  cityAr: 'الرياض',
  rating: 4.85,
  reviews: 734,
  quoteEn: '"The black cod miso is the finest I\'ve encountered anywhere in the world — silky, perfectly lacquered, and absolutely unforgettable."',
  quoteAr: '"القد الأسود بالميزو هو الأرقى الذي صادفته في أي مكان بالعالم — حريري، مطلي بشكل مثالي، ولا يُنسى تماماً."',
  criticEn: '— Noura Al-Rashid, Top Food Critic',
  criticAr: '— نورة الراشد، ناقدة طعام من الدرجة الأولى',
  signatureDishesEn: ['Black Cod Miso', 'Yellowtail Jalapeño', 'Rock Shrimp Tempura'],
  signatureDishesAr: ['قد أسود بالميزو', 'ذيل أصفر بالجلابينيو', 'روك شريمب تمبورا'],
  tagEn: 'Michelin-Starred',
  tagAr: 'حائز على نجمة ميشلان',
};

// All fallback chips use brand-consistent dark tones
const OCCASION_FALLBACK_COLORS = [
  'bg-[#1a0d0d]', 'bg-[#1a1008]', 'bg-[#0d130d]', 'bg-[#0d0d1a]',
  'bg-[#1a0d12]', 'bg-[#101010]', 'bg-[#1a0a0b]', 'bg-[#0e1018]',
];

// ── Helpers ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/50 animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

function DishItem({ d, rank }: { d: any; rank: number }) {
  const { lang } = useLanguage();
  const name = lang === 'ar' ? d.nameAr : d.nameEn;
  const restaurant = lang === 'ar' ? d.restaurantNameAr : d.restaurantNameEn;
  const img = d.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  return (
    <Link href={`/dishes/${d.id}`} className="block group">
      <div className="bg-card rounded-xl p-3 border border-border/60 shadow-[0_1px_3px_rgb(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgb(0,0,0,0.09)] hover:border-primary/20 transition-all flex items-center gap-3">
        <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-muted shrink-0">
          <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-0 start-0 bg-foreground/80 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-br-md rounded-tl-md">{rank}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground line-clamp-1 text-sm tracking-[-0.01em]">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{restaurant}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold tabular-nums">{Number(d.avgRating).toFixed(1)}</span>
            </div>
            {d.price && (
              <span className="text-xs font-semibold text-primary">
                {Number(d.price).toLocaleString('en-SA', { style: 'currency', currency: d.currency || 'SAR', minimumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Order Again Section ────────────────────────────────────────────
const ORDER_AGAIN_ITEMS = [
  { id: 7, nameEn: 'Jareesh', nameAr: 'جريش', restaurantId: 3, restaurantNameEn: 'Najd Village', restaurantNameAr: 'قرية نجد', price: 45, currency: 'SAR', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop' },
  { id: 4, nameEn: 'Black Cod Miso', nameAr: 'سمك القد الأسود', restaurantId: 1, restaurantNameEn: 'Nobu Riyadh', restaurantNameAr: 'نوبو الرياض', price: 280, currency: 'SAR', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop' },
  { id: 1, nameEn: 'Lamb Ouzi', nameAr: 'خروف أوزي', restaurantId: 2, restaurantNameEn: 'Lusin', restaurantNameAr: 'لوسين', price: 185, currency: 'SAR', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop' },
  { id: 5, nameEn: 'Dragon Roll', nameAr: 'رول التنين', restaurantId: 1, restaurantNameEn: 'Nobu Riyadh', restaurantNameAr: 'نوبو الرياض', price: 120, currency: 'SAR', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=200&fit=crop' },
  { id: 11, nameEn: 'Wagyu Tenderloin', nameAr: 'تندرلوين واغيو', restaurantId: 5, restaurantNameEn: 'The Globe', restaurantNameAr: 'ذا غلوب', price: 490, currency: 'SAR', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop' },
];

function OrderAgainSection() {
  const { t, lang } = useLanguage();
  const { addItem, updateQty, items: cartItems } = useCart();
  const [flashed, setFlashed] = useState<number | null>(null);

  const handleAdd = (item: typeof ORDER_AGAIN_ITEMS[0]) => {
    addItem({ ...item, imageUrl: item.imageUrl ?? undefined });
    setFlashed(item.id);
    setTimeout(() => setFlashed(null), 700);
  };
  const handleDec = (item: typeof ORDER_AGAIN_ITEMS[0]) => {
    const ci = cartItems.find(i => i.dishId === item.id);
    if (ci) updateQty(item.id, ci.qty - 1);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base leading-none">{t('Order Again', 'اطلب مجدداً')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('Your recent favourites', 'مفضلاتك الأخيرة')}</p>
          </div>
        </div>
        <Link href="/orders" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          {t('View orders', 'عرض الطلبات')} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {ORDER_AGAIN_ITEMS.map(item => {
          const ci = cartItems.find(i => i.dishId === item.id);
          const qty = ci?.qty ?? 0;
          const isFlashed = flashed === item.id;
          return (
            <div key={item.id} className="flex-shrink-0 w-[160px] sm:w-[176px] rounded-2xl border border-border/60 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all bg-card group">
              <Link href={`/dishes/${item.id}`}>
                <div className="w-full h-24 bg-muted overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={lang === 'ar' ? item.nameAr : item.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <div className="p-2.5">
                <p className="text-xs font-semibold line-clamp-1 text-foreground">
                  {lang === 'ar' ? item.nameAr : item.nameEn}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {lang === 'ar' ? item.restaurantNameAr : item.restaurantNameEn}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-black text-primary">
                    {item.currency} {item.price}
                  </span>
                  {qty === 0 ? (
                    <button
                      onClick={() => handleAdd(item)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                        isFlashed ? 'bg-emerald-500 text-white scale-110' : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {isFlashed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-secondary/60 rounded-lg px-1 py-0.5">
                      <button onClick={() => handleDec(item)} className="w-5 h-5 flex items-center justify-center text-primary hover:bg-background rounded transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-primary tabular-nums w-4 text-center">{qty}</span>
                      <button onClick={() => handleAdd(item)} className="w-5 h-5 flex items-center justify-center bg-primary text-white rounded transition-colors hover:bg-primary/90">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── SectionHeader ──────────────────────────────────────────────────
function FoodExperiencesSection() {
  const { t } = useLanguage();
  const { data: listData, isLoading } = useListExperiences(
    { sortBy: ListExperiencesSortBy.popular, limit: 6 },
    { query: { staleTime: 5 * 60 * 1000 } as any }
  );
  const experiences = listData?.experiences ?? [];

  if (isLoading) return null;
  if (experiences.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
      <SectionHeader
        badge={t('Immersive Experiences', 'تجارب غامرة')}
        badgeIcon={ChefHat}
        title={t('Food Experiences', 'تجارب الطعام')}
        subtitle={t('Private chef dinners, cooking classes & culinary adventures across Saudi Arabia', 'عشاءات الشيف الخاصة، دروس الطبخ والمغامرات الطهوية في جميع أنحاء المملكة')}
        viewAllHref="/experiences"
        viewAllLabel={t('Browse all', 'تصفح الكل')}
      />
      <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible">
        {experiences.map(exp => (
          <div key={exp.id} className="shrink-0 w-64 md:w-auto">
            <ExperienceCard experience={exp} layout="grid" />
          </div>
        ))}
      </div>
    </section>
  );
}

function AiRecommendationsSection({ cityId, cityName, cityNameAr }: { cityId?: number; cityName?: string; cityNameAr?: string }) {
  const { t, lang } = useLanguage();
  const qs = cityId ? `?cityId=${cityId}` : '';
  const { data: recsData, isLoading: recsLoading } = useQuery({
    queryKey: ['ai-recommendations', cityId ?? null],
    queryFn: () => fetch(`/api/recommendations${qs}`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
  const items = recsData?.recommendations ?? [];

  if (recsLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="h-7 bg-muted animate-pulse rounded w-64 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-56 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary font-medium text-xs tracking-[0.05em] uppercase">
              {t('AI Picks', 'اختيارات الذكاء الاصطناعي')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">
            {cityId
              ? t(`Recommended in ${cityName}`, `موصى به في ${cityNameAr}`)
              : t('Recommended for You', 'موصى به لك')}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t('Handpicked by our AI based on ratings and popularity', 'اختارها الذكاء الاصطناعي بناءً على التقييمات والشهرة')}
          </p>
        </div>
        <Link href="/restaurants" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
          {t('Browse all', 'تصفح الكل')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {items.map((r: any) => (
          <Link key={r.id} href={`/restaurants/${r.id}`} className="group block">
            <div className="relative rounded-2xl overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-card">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={r.coverImageUrl || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop'}
                  alt={lang === 'ar' ? r.nameAr : r.nameEn}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 text-primary" />
                  {t('AI Pick', 'اختيار الذكاء')}
                </div>
                {r.avgRating > 0 && (
                  <div className="absolute bottom-2.5 end-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {Number(r.avgRating).toFixed(1)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-foreground text-sm line-clamp-1 mb-1">
                  {lang === 'ar' ? r.nameAr : r.nameEn}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                  "{lang === 'ar' ? r.reasonAr : r.reasonEn}"
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ badge, badgeIcon: Icon, title, subtitle, viewAllHref, viewAllLabel }: {
  badge?: string; badgeIcon?: React.ElementType; title: string; subtitle?: string;
  viewAllHref?: string; viewAllLabel?: string;
}) {
  return (
    <div className="flex justify-between items-end mb-6">
      <div>
        {badge && Icon && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary font-medium text-xs tracking-[0.05em] uppercase">{badge}</span>
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0">
          {viewAllLabel || 'View all'} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ── Suggested People Strip ─────────────────────────────────────────
const SUGGESTED_CRITICS = [
  { id: 1, nameEn: 'Noura Al-Rashid', nameAr: 'نورة الراشد', handle: 'noura', avatar: 'https://i.pravatar.cc/80?img=47', reviewCount: 142, badge: '👑', specialtyEn: 'Fine Dining', specialtyAr: 'المطاعم الفاخرة' },
  { id: 2, nameEn: 'Faisal Al-Harbi', nameAr: 'فيصل الحربي', handle: 'faisal', avatar: 'https://i.pravatar.cc/80?img=12', reviewCount: 98, badge: '🍽️', specialtyEn: 'Street Food', specialtyAr: 'أكل الشوارع' },
  { id: 3, nameEn: 'Lama Khalid', nameAr: 'لمى خالد', handle: 'lama', avatar: 'https://i.pravatar.cc/80?img=32', reviewCount: 87, badge: '⭐', specialtyEn: 'Desserts', specialtyAr: 'الحلويات' },
  { id: 4, nameEn: 'Sultan Qahtani', nameAr: 'سلطان القحطاني', handle: 'sultan', avatar: 'https://i.pravatar.cc/80?img=15', reviewCount: 64, badge: '🌱', specialtyEn: 'Healthy Eats', specialtyAr: 'الأكل الصحي' },
  { id: 5, nameEn: 'Reem Alobaidan', nameAr: 'ريم العبيدان', handle: 'reem', avatar: 'https://i.pravatar.cc/80?img=25', reviewCount: 201, badge: '🔥', specialtyEn: 'Saudi Cuisine', specialtyAr: 'المطبخ السعودي' },
  { id: 6, nameEn: 'Khaled Nasser', nameAr: 'خالد ناصر', handle: 'khaled', avatar: 'https://i.pravatar.cc/80?img=8', reviewCount: 55, badge: '🎯', specialtyEn: 'Grills & BBQ', specialtyAr: 'المشويات والباربيكيو' },
];

function SuggestedPeopleStrip({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const [following, setFollowing] = useState<Record<number, boolean>>({});

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('People to Follow', 'مميّزون في عالم الطعام')}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{t('Top food critics loved by the Tabaq community', 'نقاد الطعام المميزون في مجتمع طبق')}</p>
        </div>
        <Link href="/feed" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          {t('See all', 'عرض الكل')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {SUGGESTED_CRITICS.map(person => (
          <div key={person.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow group">
            <div className="relative mb-3">
              <img
                src={person.avatar}
                alt={person.nameEn}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/30 transition-all"
              />
              <span className="absolute -bottom-1 -end-1 text-base leading-none">{person.badge}</span>
            </div>
            <p className="font-semibold text-foreground text-sm leading-tight mb-0.5">{lang === 'ar' ? person.nameAr : person.nameEn}</p>
            <p className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? person.specialtyAr : person.specialtyEn}</p>
            <p className="text-xs text-muted-foreground mb-3">{person.reviewCount} {t('reviews', 'تقييم')}</p>
            <button
              onClick={() => setFollowing(prev => ({ ...prev, [person.id]: !prev[person.id] }))}
              className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-all ${
                following[person.id]
                  ? 'bg-muted text-muted-foreground border border-border'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {following[person.id] ? t('Following', 'متابَع') : t('Follow', 'متابعة')}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export function HomePage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    titleEn: 'Tabaq | طبق — Discover Saudi Arabia\'s Best Restaurants',
    titleAr: 'طبق | اكتشف أفضل مطاعم المملكة العربية السعودية',
    descriptionEn: 'Discover and book top restaurants, exclusive food experiences, and special deals across Saudi Arabia.',
    descriptionAr: 'اكتشف وأحجز أفضل المطاعم والتجارب الغذائية الحصرية والعروض المميزة في المملكة العربية السعودية.',
  }, lang);
  const { selectedCityId, selectedCityName, selectedCityNameAr, selectedNeighborhoodId, selectedNeighborhoodName, selectedNeighborhoodNameAr, clearCity } = useCity();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPrev, setHeroPrev] = useState<number | null>(null);
  const [heroFading, setHeroFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroPrev(heroSlide);
      setHeroFading(true);
      setHeroSlide(s => (s + 1) % HERO_IMGS.length);
      setTimeout(() => { setHeroPrev(null); setHeroFading(false); }, 1200);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlide]);

  const cityQuery = selectedCityId ? `&cityId=${selectedCityId}` : '';
  const cityKey   = selectedCityId ?? null;
  const STALE_5M  = 5 * 60 * 1000;
  const STALE_10M = 10 * 60 * 1000;

  const featured   = useQuery<any[]>({ queryKey: ['hp-featured', cityKey], queryFn: () => fetch(`/api/restaurants/featured?limit=8${cityQuery}`).then(r => r.json()), staleTime: STALE_5M });
  const trending   = useQuery<any[]>({ queryKey: ['hp-trending', cityKey], queryFn: () => fetch(`/api/dishes/trending?limit=6${cityQuery}`).then(r => r.json()), staleTime: STALE_5M });
  const tabaqStars = useQuery<any[]>({ queryKey: ['hp-tabaq-stars'], queryFn: () => fetch('/api/dishes/tabaq-stars?limit=6').then(r => r.json()), staleTime: STALE_10M });
  const occasions  = useQuery<any[]>({ queryKey: ['hp-occasions'], queryFn: () => fetch('/api/occasions').then(r => r.json()), staleTime: STALE_10M });
  const categories = useQuery<any[]>({ queryKey: ['hp-categories'], queryFn: () => fetch('/api/categories').then(r => r.json()), staleTime: STALE_10M });
  const topRated   = useQuery<{ restaurants: any[] }>({ queryKey: ['hp-top-rated', cityKey], queryFn: () => fetch(`/api/restaurants?minRating=4.5&limit=6${cityQuery}`).then(r => r.json()), staleTime: STALE_5M });
  const newest     = useQuery<{ restaurants: any[] }>({ queryKey: ['hp-newest', cityKey], queryFn: () => fetch(`/api/restaurants?limit=4&sortBy=newest${cityQuery}`).then(r => r.json()), staleTime: STALE_5M });
  const offersApi  = useQuery<any>({ queryKey: ['hp-offers', cityKey], queryFn: () => fetch(`/api/offers?limit=4${cityQuery}`).then(r => r.json()), staleTime: STALE_5M });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) setLocation(`/search?q=${encodeURIComponent(q)}`);
  };

  const quickTerms = lang === 'ar'
    ? ['ستيك', 'سوشي', 'بيتزا', 'مشويات', 'إفطار']
    : ['Steak', 'Sushi', 'Pizza', 'BBQ', 'Brunch'];

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative h-[88vh] min-h-[580px] max-h-[800px] flex flex-col overflow-hidden">
        {/* Rotating background images */}
        <div className="absolute inset-0">
          {/* Current slide */}
          <img
            key={heroSlide}
            src={HERO_IMGS[heroSlide]}
            alt="Fine dining"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: 'heroZoom 8s ease-out forwards' }}
          />
          {/* Previous slide fading out */}
          {heroPrev !== null && (
            <img
              key={`prev-${heroPrev}`}
              src={HERO_IMGS[heroPrev]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: heroFading ? 0 : 1, transition: 'opacity 1.2s ease-in-out', zIndex: 1 }}
            />
          )}
          {/* Left-to-right radial overlay + bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" style={{ zIndex: 2 }} />
        </div>
        <style>{`
          @keyframes heroZoom {
            from { transform: scale(1.05); }
            to   { transform: scale(1); }
          }
        `}</style>

        {/* Hero content — left-aligned, vertically centered */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-white text-sm mb-6">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                {t("Saudi Arabia's #1 Dining Platform", 'منصة الطعام الأولى في المملكة')}
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-[4.25rem] font-extrabold text-white leading-[1.08] mb-5 whitespace-pre-line">
                {t('Discover\nExceptional\nDining', 'اكتشف\nتجارب طعام\nاستثنائية')}
              </h1>
              <p className="text-base text-white/70 mb-7 max-w-md leading-relaxed">
                {t('Find, book, and review the finest restaurants across Saudi Arabia — all in one place.', 'ابحث واحجز وقيّم أفضل المطاعم في المملكة العربية السعودية — كل شيء في مكان واحد.')}
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="max-w-lg mb-5">
                <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-xl">
                  <div className="flex-1 flex items-center gap-2.5 px-4">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder={t('Restaurant, dish, or cuisine…', 'مطعم، طبق، أو مطبخ...')}
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm py-3.5 font-medium"
                    />
                  </div>
                  <button type="submit" className="px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors whitespace-nowrap">
                    {t('Search', 'بحث')}
                  </button>
                </div>
              </form>

              {/* Quick terms */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/45 text-xs font-medium">{t('Popular:', 'شائع:')}</span>
                {quickTerms.map(term => (
                  <button
                    key={term}
                    onClick={() => setLocation(`/search?q=${encodeURIComponent(term)}`)}
                    className="text-xs font-medium text-white/75 hover:text-white bg-white/10 hover:bg-white/18 border border-white/15 rounded-full px-3.5 py-1.5 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Slide dots */}
              <div className="flex items-center gap-2 mt-6">
                {HERO_IMGS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setHeroPrev(heroSlide); setHeroFading(true); setHeroSlide(i); setTimeout(() => { setHeroPrev(null); setHeroFading(false); }, 1200); }}
                    className={`rounded-full transition-all duration-500 ${i === heroSlide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/35 hover:bg-white/60'}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar pinned to bottom of hero */}
        <div className="relative z-10 bg-black/40 backdrop-blur-md border-t border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6 flex-wrap">
            {[
              { icon: Utensils,       valEn: '500+',  valAr: '+500',  labelEn: 'Restaurants',  labelAr: 'مطعم' },
              { icon: CalendarDays,   valEn: '10K+',  valAr: '+10K',  labelEn: 'Reservations', labelAr: 'حجز' },
              { icon: MessageSquare,  valEn: '50K+',  valAr: '+50K',  labelEn: 'Reviews',      labelAr: 'تقييم' },
              { icon: MapPin,         valEn: '12',    valAr: '12',    labelEn: 'Cities',       labelAr: 'مدينة' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.labelEn} className="flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-none tabular-nums">{lang === 'ar' ? s.valAr : s.valEn}</p>
                    <p className="text-white/50 text-xs mt-0.5 font-medium">{lang === 'ar' ? s.labelAr : s.labelEn}</p>
                  </div>
                </div>
              );
            })}
            <div className="hidden md:flex items-center gap-2.5 ms-auto">
              <Link href="/restaurants" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                {t('Explore Now', 'استكشف الآن')}
              </Link>
              <Link href="/offers" className="px-4 py-2 bg-white/12 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> {t("Today's Deals", 'عروض اليوم')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ORDER AGAIN ══════════════════════════════════════════ */}
      <OrderAgainSection />

      {/* ══ OCCASIONS ════════════════════════════════════════════ */}
      {!occasions.isLoading && (occasions.data || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 mb-12">
          <SectionHeader
            badge={t('Browse by Occasion', 'تصفح حسب المناسبة')}
            badgeIcon={Sparkles}
            title={t('What are you celebrating?', 'ماذا تحتفل؟')}
            subtitle={t('Find the perfect restaurant for every moment', 'ابحث عن المطعم المثالي لكل لحظة')}
            viewAllHref="/restaurants"
            viewAllLabel={t('See all', 'عرض الكل')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {(occasions.data || []).slice(0, 8).map((occ: any, idx: number) => {
              const img = (OCCASION_META[occ.nameEn] || {}).img;
              return (
                <Link
                  key={occ.id}
                  href={`/restaurants?occasion=${occ.id}`}
                  className="group block relative rounded-2xl overflow-hidden aspect-square hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-pointer"
                >
                  {img ? (
                    <>
                      <img src={img} alt={occ.nameEn} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/85 transition-opacity" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 ${OCCASION_FALLBACK_COLORS[idx % OCCASION_FALLBACK_COLORS.length]}`} />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-white">
                    <span className="text-2xl mb-1 drop-shadow-md">{occ.icon || '🍽️'}</span>
                    <span className="text-xs font-bold text-center leading-tight drop-shadow-sm">
                      {lang === 'ar' ? occ.nameAr : occ.nameEn}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ SUGGESTED PEOPLE ══════════════════════════════════════ */}
      <SuggestedPeopleStrip t={t} lang={lang} />

      {/* ══ CUISINE TYPES ════════════════════════════════════════ */}
      {!categories.isLoading && (categories.data || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">{t('Cuisine Types', 'أنواع المطابخ')}</h2>
            <Link href="/restaurants" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              {t('Browse all', 'تصفح الكل')} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {(categories.data || []).slice(0, 14).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/restaurants?categoryId=${cat.id}`}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-card hover:bg-foreground hover:text-card hover:border-foreground shadow-[0_1px_3px_rgb(0,0,0,0.06)] hover:shadow-md transition-all text-sm font-medium whitespace-nowrap"
              >
                {cat.icon && <span className="text-sm leading-none">{cat.icon}</span>}
                {lang === 'ar' ? cat.nameAr : cat.nameEn}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══ TABAQ STARS ═══════════════════════════════════════════ */}
      {!tabaqStars.isLoading && (tabaqStars.data || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1200] via-[#2d2000] to-[#1a1200] border border-[#c9a84c]/30 p-6 md:p-10">
            {/* Decorative stars */}
            <div className="pointer-events-none absolute inset-0 opacity-10 text-[10rem] leading-none select-none overflow-hidden">
              <span className="absolute top-2 start-4">⭐</span>
              <span className="absolute bottom-2 end-4">⭐</span>
            </div>

            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Award className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-white/80 font-medium text-xs tracking-[0.05em] uppercase">{t('Expert Critic Picks', 'اختيارات النقاد')}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{t('Tabaq Stars', 'نجوم طبق')}</h2>
                <p className="text-white/70 text-sm mt-1 leading-relaxed">{t('Dishes selected and awarded by our expert critics for exceptional quality', 'أطباق اختارها وكرّمها نقادنا المتخصصون لجودتها الاستثنائية')}</p>
              </div>
              <Link href="/dishes" className="flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white transition-colors shrink-0">
                {t('View all', 'عرض الكل')} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tabaqStars.data || []).map((dish: any) => {
                const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
                const restaurant = lang === 'ar' ? dish.restaurantNameAr : dish.restaurantNameEn;
                const img = dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
                return (
                  <Link key={dish.id} href={`/dishes/${dish.id}`} className="group block">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2 start-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-white" />
                          {t('Tabaq Star', 'نجمة طبق')}
                        </div>
                        {dish.spiceLevel > 0 && (
                          <div className="absolute bottom-2 end-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            {Array.from({ length: Math.min(dish.spiceLevel, 3) }).map((_, i) => (
                              <Flame key={i} className="w-3 h-3 fill-orange-400 text-orange-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-foreground text-sm line-clamp-1 mb-0.5">{name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{restaurant}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {Number(dish.avgRating) > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold">{Number(dish.avgRating).toFixed(1)}</span>
                              </div>
                            )}
                            {dish.prepTimeMinutes && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{dish.prepTimeMinutes}{t('m', 'د')}</span>
                              </div>
                            )}
                          </div>
                          {dish.price && (
                            <span className="text-sm font-black text-amber-600">
                              {Number(dish.price).toLocaleString('en-SA', { style: 'currency', currency: dish.currency || 'SAR', minimumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ AI RECOMMENDATIONS ═══════════════════════════════════ */}
      <AiRecommendationsSection
        cityId={selectedCityId ?? undefined}
        cityName={selectedCityName ?? undefined}
        cityNameAr={selectedCityNameAr ?? undefined}
      />

      {/* ══ COLLECTIONS SHOWCASE ═════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <SectionHeader
          badge={t('Handpicked', 'اختيارات')}
          badgeIcon={Layers}
          title={t('Curated Collections', 'مجموعات مختارة')}
          subtitle={t('Expertly curated lists for every mood and occasion', 'قوائم اختيارية متخصصة لكل مزاج ومناسبة')}
          viewAllHref="/collections"
          viewAllLabel={t('View all', 'عرض الكل')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLLECTIONS.slice(0, 4).map((col, i) => {
            const collectionImgs = [
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
            ];
            return (
              <Link key={col.id} href={`/collections/${col.slug}`} className="block group">
                <div className="relative h-44 rounded-xl overflow-hidden shadow-[0_2px_8px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.15)] transition-all duration-300">
                  <img src={collectionImgs[i]} alt={col.labelEn} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                  <div className="absolute inset-0 flex flex-col justify-between p-3.5 text-white">
                    <span className="text-xl">{col.icon}</span>
                    <div>
                      <p className="font-semibold text-sm leading-tight mb-1 tracking-[-0.01em]">{lang === 'ar' ? col.labelAr : col.labelEn}</p>
                      <div className="flex items-center gap-1 text-white/65 text-xs font-medium group-hover:text-white/90 transition-colors">
                        {t('Explore', 'استكشف')} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══ MICHELIN GUIDE TEASER ════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="relative rounded-2xl overflow-hidden bg-[#0d0d0f]">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop"
            alt="Michelin Guide"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            style={{ filter: 'saturate(0.5)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f] via-[#0d0d0f]/90 to-[#0d0d0f]/50" />

          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              {/* Michelin star icon */}
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 shrink-0">
                  <circle cx="12" cy="12" r="11" fill="#e23744" />
                  <path d="M12 5l1.5 4.5H18l-3.75 2.75L15.75 17 12 14.25 8.25 17l1.5-4.75L6 9.5h4.5z" fill="white" />
                </svg>
                <span className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">
                  {t('Michelin Guide Saudi Arabia 2024', 'دليل ميشلان المملكة العربية السعودية ٢٠٢٤')}
                </span>
              </div>
              <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">
                {t('Discover Saudi Arabia\'s', 'اكتشف مطاعم')}
                <span className="text-amber-400 block mt-0.5">{t('Starred Restaurants', 'المرصعة بالنجوم في المملكة')}</span>
              </h2>
              <p className="text-white/50 text-sm max-w-lg">
                {t(
                  '6 Michelin-starred establishments and 2 Bib Gourmand restaurants across Riyadh and Jeddah, recognized by the world\'s most prestigious culinary authority.',
                  '٦ مطاعم حاصلة على نجمة ميشلان و٢ بيب جورمان في الرياض وجدة، معترف بها من أرقى سلطة طهوية في العالم.'
                )}
              </p>

              {/* Mini stats */}
              <div className="flex items-center gap-6 mt-5">
                {[
                  { count: '6', label: t('Starred', 'نجمة') },
                  { count: '2', label: t('Bib Gourmand', 'بيب جورمان') },
                  { count: '2', label: t('Cities', 'مدينة') },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-amber-400 font-black text-xl">{s.count}</span>
                    <span className="text-white/40 text-xs">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini cards preview */}
            <div className="flex gap-3 shrink-0">
              {[
                { name: 'Nobu Riyadh', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&h=150&fit=crop' },
                { name: 'The Globe', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=150&h=150&fit=crop' },
                { name: 'Najd Village', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&h=150&fit=crop' },
              ].map(r => (
                <div key={r.name} className="relative hidden sm:block">
                  <img
                    src={r.img}
                    alt={r.name}
                    className="w-20 h-20 rounded-xl object-cover"
                    style={{ filter: 'brightness(0.7) saturate(0.6)' }}
                  />
                  <div className="absolute top-1.5 start-1.5 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 inline">
                      <circle cx="12" cy="12" r="11" fill="#e23744" />
                      <path d="M12 5l1.5 4.5H18l-3.75 2.75L15.75 17 12 14.25 8.25 17l1.5-4.75L6 9.5h4.5z" fill="white" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA button */}
          <div className="relative z-10 px-8 md:px-10 pb-8">
            <Link href="/michelin">
              <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                {t('Explore Michelin Guide', 'استكشف دليل ميشلان')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ LUXURY DINING ════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700/50 mb-3">
              <ChefHat className="w-3.5 h-3.5" />
              {t('Luxury Dining', 'تناول الطعام الفاخر')}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
              {t('Saudi Arabia\'s Most Prestigious Tables', 'أرقى موائد المملكة العربية السعودية')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{t('Extraordinary experiences for extraordinary occasions', 'تجارب استثنائية لمناسبات استثنائية')}</p>
          </div>
          <Link href="/restaurants?tier=fine_dining" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
            {t('See all', 'عرض الكل')} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              id: 1,
              nameEn: 'Nobu Riyadh', nameAr: 'نوبو الرياض',
              descEn: 'World-renowned Japanese-Peruvian fusion by Chef Nobu Matsuhisa — elevated omakase in the heart of Riyadh.',
              descAr: 'مزيج ياباني-بيروفي عالمي الشهرة للشيف نوبو ماتسوهيسا — أوماكاسي راقٍ في قلب الرياض.',
              img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=400&fit=crop',
              rating: 4.9, reviewCount: 1240, priceEn: 'SAR 650+', priceAr: '٦٥٠+ ريال',
              tagEn: 'Japanese Fusion', tagAr: 'فيوجن ياباني',
              badge: '⭐ Michelin Starred',
            },
            {
              id: 2,
              nameEn: 'Lusin', nameAr: 'لوسين',
              descEn: 'Acclaimed modern Armenian cuisine with Saudi-inspired elements, in an intimate candlelit setting.',
              descAr: 'مطبخ أرمني حديث حائز على إشادة واسعة مع عناصر مستوحاة من السعودية، في أجواء حميمية بالشموع.',
              img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
              rating: 4.8, reviewCount: 980, priceEn: 'SAR 450+', priceAr: '٤٥٠+ ريال',
              tagEn: 'Modern Cuisine', tagAr: 'مطبخ حديث',
              badge: '⭐ Michelin Starred',
            },
            {
              id: 5,
              nameEn: 'The Globe', nameAr: 'ذا غلوب',
              descEn: 'Iconic 360° dining at 300m above sea level — Saudi Arabia\'s most dramatic fine dining venue.',
              descAr: 'تناول طعام بزاوية ٣٦٠° على ارتفاع ٣٠٠ متر — أكثر مواقع تناول الطعام الفاخر إثارة في المملكة.',
              img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
              rating: 4.7, reviewCount: 1580, priceEn: 'SAR 550+', priceAr: '٥٥٠+ ريال',
              tagEn: 'International', tagAr: 'دولي',
              badge: '🏆 Top Rated',
            },
            {
              id: 3,
              nameEn: 'Najd Village', nameAr: 'قرية نجد',
              descEn: 'The definitive Saudi heritage dining experience — traditional Najdi recipes in stunning mud-brick architecture.',
              descAr: 'التجربة الغذائية التراثية السعودية الأكثر تميزاً — وصفات نجدية تقليدية في عمارة الطين الخلابة.',
              img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
              rating: 4.8, reviewCount: 2100, priceEn: 'SAR 250+', priceAr: '٢٥٠+ ريال',
              tagEn: 'Saudi Heritage', tagAr: 'تراث سعودي',
              badge: '🍽️ Local Favourite',
            },
          ].map(venue => (
            <Link key={venue.id} href={`/restaurants/${venue.id}`} className="block group">
              <div className="relative rounded-2xl overflow-hidden border border-border/60 hover:border-amber-200 hover:shadow-xl transition-all duration-300 bg-card">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={venue.img}
                    alt={lang === 'ar' ? venue.nameAr : venue.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-3 start-3 text-xs font-bold bg-black/60 backdrop-blur-sm text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/30">
                    {venue.badge}
                  </span>
                  <span className="absolute top-3 end-3 text-xs font-semibold bg-white/90 text-gray-800 px-2.5 py-1 rounded-full">
                    {lang === 'ar' ? venue.tagAr : venue.tagEn}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {lang === 'ar' ? venue.nameAr : venue.nameEn}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {lang === 'ar' ? venue.descAr : venue.descEn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-bold">{venue.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{venue.reviewCount.toLocaleString()} {t('reviews', 'تقييم')}</span>
                    </div>
                    <span className="text-sm font-black text-primary">{lang === 'ar' ? venue.priceAr : venue.priceEn}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ FOOD EXPERIENCES ═════════════════════════════════════ */}
      <FoodExperiencesSection />

      {/* ══ LOCATION INDICATOR ═══════════════════════════════════ */}
      {selectedCityId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center gap-2.5 py-2.5 px-4 bg-primary/8 border border-primary/20 rounded-xl text-sm">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground font-medium">
              {t('Showing results in', 'عرض نتائج في')}{' '}
              <span className="text-primary font-semibold">
                {lang === 'ar' ? selectedCityNameAr : selectedCityName}
              </span>
              {selectedNeighborhoodId && (
                <>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span className="text-primary font-semibold">
                    {lang === 'ar' ? selectedNeighborhoodNameAr : selectedNeighborhoodName}
                  </span>
                </>
              )}
            </span>
            <button
              onClick={clearCity}
              className="ms-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t('Clear', 'مسح')}
            </button>
          </div>
        </div>
      )}

      {/* ══ FEATURED RESTAURANTS ═════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <SectionHeader
          badge={t('Featured', 'مميز')}
          badgeIcon={Sparkles}
          title={t('Featured Restaurants', 'مطاعم مميزة')}
          subtitle={t('Curated picks for you this week', 'خيارات مختارة لك هذا الأسبوع')}
          viewAllHref="/restaurants?featured=true"
          viewAllLabel={t('View all', 'عرض الكل')}
        />
        {featured.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (featured.data || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(featured.data || []).slice(0, 8).map((r: any) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
            <p>{t('No featured restaurants yet.', 'لا توجد مطاعم مميزة بعد.')}</p>
          </div>
        )}
      </section>

      {/* ══ NEW OPENINGS ═════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <SectionHeader
          badge={t('Just Arrived', 'وصل حديثاً')}
          badgeIcon={Sparkles}
          title={t('New Openings', 'افتتاحات جديدة')}
          subtitle={t('Fresh tables, bold flavors — just launched in your city', 'طاولات جديدة ونكهات جريئة — افتُتحت للتو في مدينتك')}
          viewAllHref="/restaurants"
          viewAllLabel={t('Explore all', 'استعرض الكل')}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {NEW_OPENINGS.map(venue => (
            <Link key={venue.id} href={`/restaurants/${venue.id}`}>
              <div className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full flex flex-col">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={venue.img}
                    alt={lang === 'ar' ? venue.nameAr : venue.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-2 start-2 text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse inline-block" />
                    {t('New', 'جديد')}
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {lang === 'ar' ? venue.nameAr : venue.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {lang === 'ar' ? venue.cuisineAr : venue.cuisineEn}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-foreground">{venue.rating}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {lang === 'ar'
                        ? `منذ ${venue.daysOpen} يوم`
                        : `${venue.daysOpen}d ago`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ RESTAURANT OF THE WEEK ════════════════════════════════ */}
      <section className="mb-16">
        <div className="relative overflow-hidden" style={{ minHeight: 420 }}>
          <img
            src={RESTAURANT_OF_THE_WEEK.coverImg}
            alt={RESTAURANT_OF_THE_WEEK.nameEn}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center" style={{ minHeight: 420 }}>
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-primary text-white px-2.5 py-1 rounded-full">
                  {t('Restaurant of the Week', 'مطعم الأسبوع')}
                </span>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2.5 py-1 rounded-full">
                  {lang === 'ar' ? RESTAURANT_OF_THE_WEEK.tagAr : RESTAURANT_OF_THE_WEEK.tagEn}
                </span>
              </div>
              <h2 className={`text-3xl sm:text-4xl font-black text-white mb-1 ${lang === 'ar' ? 'font-arabic' : ''}`}>
                {lang === 'ar' ? RESTAURANT_OF_THE_WEEK.nameAr : RESTAURANT_OF_THE_WEEK.nameEn}
              </h2>
              <p className="text-sm text-white/60 mb-5">
                {lang === 'ar' ? RESTAURANT_OF_THE_WEEK.cuisineAr : RESTAURANT_OF_THE_WEEK.cuisineEn}
                <span className="mx-2 text-white/30">·</span>
                <MapPin className="w-3 h-3 inline mb-0.5" />
                {' '}{lang === 'ar' ? RESTAURANT_OF_THE_WEEK.cityAr : RESTAURANT_OF_THE_WEEK.cityEn}
              </p>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(RESTAURANT_OF_THE_WEEK.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                  ))}
                </div>
                <span className="text-white font-bold text-sm">{RESTAURANT_OF_THE_WEEK.rating}</span>
                <span className="text-white/40 text-sm">({RESTAURANT_OF_THE_WEEK.reviews.toLocaleString()} {t('reviews', 'تقييم')})</span>
              </div>
              <blockquote className={`text-white/80 text-sm leading-relaxed italic mb-3 border-l-2 border-primary pl-4 ${lang === 'ar' ? 'border-l-0 border-r-2 pr-4 pl-0 text-right font-arabic' : ''}`}>
                {lang === 'ar' ? RESTAURANT_OF_THE_WEEK.quoteAr : RESTAURANT_OF_THE_WEEK.quoteEn}
              </blockquote>
              <p className="text-white/50 text-xs mb-6">
                {lang === 'ar' ? RESTAURANT_OF_THE_WEEK.criticAr : RESTAURANT_OF_THE_WEEK.criticEn}
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {(lang === 'ar' ? RESTAURANT_OF_THE_WEEK.signatureDishesAr : RESTAURANT_OF_THE_WEEK.signatureDishesEn).map(dish => (
                  <span key={dish} className="text-xs text-white/70 bg-white/10 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {dish}
                  </span>
                ))}
              </div>
              <Link href={`/restaurants/${RESTAURANT_OF_THE_WEEK.id}`}>
                <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-6 py-3 rounded-full transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]">
                  {t('Explore Restaurant', 'استكشف المطعم')}
                  <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TOP-RATED RANKINGS ═══════════════════════════════════ */}
      {!topRated.isLoading && (topRated.data?.restaurants || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <SectionHeader
            badge={t('Award of Excellence', 'جائزة التميز')}
            badgeIcon={Trophy}
            title={t('Top-Rated Venues', 'الأماكن الأعلى تقييماً')}
            subtitle={t('Consistently praised by thousands of diners', 'تحظى بإشادة آلاف رواد الطعام')}
            viewAllHref="/collections/top-rated"
            viewAllLabel={t('View all', 'عرض الكل')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* #1 — Large hero card */}
            {(topRated.data?.restaurants || []).slice(0, 1).map((r: any) => {
              const name = lang === 'ar' ? r.nameAr : r.nameEn;
              const city = lang === 'ar' ? (r.cityNameAr || '') : (r.cityNameEn || '');
              const img = r.coverImageUrl || HERO_IMGS[0];
              const awards = getRestaurantAwards(r);
              return (
                <Link key={r.id} href={`/restaurants/${r.id}`} className="block group lg:col-span-2 relative rounded-3xl overflow-hidden h-72 border border-border/50 hover:shadow-2xl transition-all">
                  <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute top-4 start-4 bg-amber-400 text-black text-sm font-black w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg">#1</div>
                  {awards[0] && (
                    <div className={`absolute top-4 end-4 ${awards[0].bgClass} ${awards[0].textClass} px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg`}>
                      {awards[0].icon} {lang === 'ar' ? awards[0].labelAr : awards[0].labelEn}
                    </div>
                  )}
                  <div className="absolute bottom-0 p-5">
                    <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {city}
                    </div>
                    <h3 className="text-white font-extrabold text-2xl mb-2">{name}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-white text-sm font-bold">{Number(r.avgRating).toFixed(1)}</span>
                        <span className="text-white/60 text-xs">({Number(r.reviewCount).toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* #2 & #3 */}
            <div className="flex flex-col gap-5">
              {(topRated.data?.restaurants || []).slice(1, 3).map((r: any, idx: number) => {
                const name = lang === 'ar' ? r.nameAr : r.nameEn;
                const img = r.coverImageUrl || HERO_IMGS[0];
                return (
                  <Link key={r.id} href={`/restaurants/${r.id}`} className="block group relative rounded-2xl overflow-hidden flex-1 min-h-[120px] border border-border/50 hover:shadow-xl transition-all">
                    <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute top-3 start-3 bg-background/90 backdrop-blur-md text-foreground text-xs font-black w-7 h-7 rounded-xl flex items-center justify-center shadow-md">#{idx + 2}</div>
                    <div className="absolute bottom-0 p-3.5">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-white text-xs font-bold">{Number(r.avgRating).toFixed(1)}</span>
                        <span className="text-white/55 text-xs">({Number(r.reviewCount).toLocaleString()})</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Ranks 4-6 */}
          {(topRated.data?.restaurants || []).length > 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(topRated.data?.restaurants || []).slice(3, 6).map((r: any, idx: number) => (
                <RestaurantCard key={r.id} restaurant={r} rank={idx + 4} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══ TRENDING RESTAURANTS ═════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-gradient-to-br from-primary/8 to-violet-50 dark:from-primary/10 dark:to-violet-950/20 rounded-3xl p-6 md:p-10 border border-primary/10">
          <SectionHeader
            badge={t('Hot Right Now', 'الأكثر طلباً الآن')}
            badgeIcon={Flame}
            title={t('Trending Restaurants', 'مطاعم شائعة')}
            subtitle={t("Everyone's dining here this week", 'الكل يتناول العشاء هنا هذا الأسبوع')}
            viewAllHref="/restaurants"
            viewAllLabel={t('View all', 'عرض الكل')}
          />
          {featured.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (featured.data || []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(featured.data || []).slice(0, 4).map((r: any) => (
                <RestaurantCard key={r.id} restaurant={{ ...r, isTrending: true }} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ══ TRENDING DISHES ══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-secondary/30 rounded-3xl p-6 md:p-10 border border-border/40">
          <SectionHeader
            badge={t('Most Popular', 'الأكثر شعبية')}
            badgeIcon={TrendingUp}
            title={t('Trending Dishes', 'أطباق شائعة')}
            subtitle={t('Highest-rated dishes across the city', 'الأطباق الأعلى تقييماً في المدينة')}
            viewAllHref="/dishes"
            viewAllLabel={t('View all', 'عرض الكل')}
          />
          {trending.isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-card rounded-xl animate-pulse border border-border/40" />)}
            </div>
          ) : (trending.data || []).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {(trending.data || []).map((d: any, idx: number) => (
                <DishItem key={d.id} d={d} rank={idx + 1} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ══ NEW OPENINGS ═════════════════════════════════════════ */}
      {!newest.isLoading && (newest.data?.restaurants || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <SectionHeader
            badge={t('Just Opened', 'افتتح حديثاً')}
            badgeIcon={Sparkles}
            title={t('New Openings', 'افتتاحات جديدة')}
            subtitle={t('Fresh new places to explore this season', 'أماكن جديدة رائعة لاكتشافها هذا الموسم')}
            viewAllHref="/collections/new-openings"
            viewAllLabel={t('View all', 'عرض الكل')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(newest.data?.restaurants || []).map((r: any) => (
              <RestaurantCard key={r.id} restaurant={{ ...r, isNew: true }} />
            ))}
          </div>
        </section>
      )}

      {/* ══ EXCLUSIVE DEALS ══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-gradient-to-br from-[#1a0305] via-[#2d060a] to-[#1a0305] border border-primary/20 rounded-3xl p-6 md:p-10 overflow-hidden relative">
          {/* Background shimmer */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 end-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 start-0 w-48 h-48 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          {/* Header */}
          <div className="flex items-end justify-between mb-6 relative">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-semibold text-xs tracking-[0.05em] uppercase">{t('Limited Time Only', 'لوقت محدود فقط')}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{t('Exclusive Dining Deals', 'عروض تناول الطعام الحصرية')}</h2>
              <p className="text-white/60 text-sm mt-1">{t('Save up to 50% at top restaurants. Apply code TABAQ10 for extra 10% off.', 'وفّر حتى 50٪ في أفضل المطاعم. استخدم كود TABAQ10 لخصم إضافي 10٪.')}</p>
            </div>
            <Link href="/offers" className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors shrink-0 border border-white/20 px-3 py-1.5 rounded-full hover:bg-white/10">
              {t('View all deals', 'كل العروض')} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Deal cards grid */}
          {(() => {
            const rawOffers = offersApi.data?.offers ?? offersApi.data ?? [];
            const HOME_FALLBACK = [
              {
                id: 9001, titleEn: 'Voucher Worth SAR 100–500 to Spend on Anything Off Menu', titleAr: 'قسيمة بقيمة 100–500 ريال لإنفاقها على أي شيء من القائمة',
                restaurantNameEn: 'Najd Village', restaurantNameAr: 'قرية نجد', locationsCount: 3,
                imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=450&fit=crop',
                originalPrice: 100, discountedPrice: 60, discountPercent: 40, promoPrice: 54, currency: 'SAR',
                rating: 4.8, reviews: 342, address: 'Al Hamra District', distanceKm: 3.9,
              },
              {
                id: 9002, titleEn: 'Premium Omakase Dinner — 12 Chef-Curated Courses', titleAr: 'عشاء أوماكاسي فاخر — 12 طبقاً من اختيار الشيف',
                restaurantNameEn: 'Sushi Sama', restaurantNameAr: 'سوشي ساما', locationsCount: 2,
                imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=450&fit=crop',
                originalPrice: 650, discountedPrice: 390, discountPercent: 40, promoPrice: 351, currency: 'SAR',
                rating: 4.9, reviews: 187, address: 'Olaya Street', distanceKm: 5.2,
              },
              {
                id: 9003, titleEn: 'Luxury Afternoon Tea for Two — 3-Tier Pastry Stand', titleAr: 'شاي ما بعد الظهر الفاخر لشخصين — 3 طبقات معجنات',
                restaurantNameEn: 'The Terrace', restaurantNameAr: 'التيراس', locationsCount: 1,
                imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=450&fit=crop',
                originalPrice: 280, discountedPrice: 182, discountPercent: 35, promoPrice: 164, currency: 'SAR',
                rating: 4.6, reviews: 94, address: 'Kingdom Tower', distanceKm: 2.1,
              },
              {
                id: 9004, titleEn: 'Friday BBQ Brunch Buffet — Unlimited Grills', titleAr: 'بوفيه شواء الجمعة — مشويات لا محدودة',
                restaurantNameEn: 'Reem Al Bawadi', restaurantNameAr: 'ريم البوادي', locationsCount: 4,
                imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=450&fit=crop',
                originalPrice: 240, discountedPrice: 168, discountPercent: 30, promoPrice: 151, currency: 'SAR',
                rating: 4.5, reviews: 218, address: 'Al Aqiq District', distanceKm: 7.3,
              },
            ];
            const mappedOffers = rawOffers.slice(0, 4).map((o: any) => ({
              id: o.id,
              titleEn: o.titleEn, titleAr: o.titleAr,
              restaurantNameEn: o.restaurantNameEn ?? 'Restaurant', restaurantNameAr: o.restaurantNameAr ?? 'مطعم',
              locationsCount: 1,
              imageUrl: o.imageUrl ?? o.restaurantCoverImageUrl ?? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=450&fit=crop',
              originalPrice: Number(o.originalPrice), discountedPrice: Number(o.discountedPrice),
              discountPercent: Number(o.discountPercent), promoPrice: Math.round(Number(o.discountedPrice) * 0.9),
              currency: o.currency ?? 'SAR', rating: 4.7, reviews: 50, address: '', distanceKm: undefined,
            }));
            const deals = mappedOffers.length > 0
              ? mappedOffers
              : (!selectedCityId ? HOME_FALLBACK : []);

            if (deals.length === 0) {
              return (
                <div className="text-center py-8 text-violet-300/70 text-sm">
                  {t('No deals available in this location yet.', 'لا توجد عروض في هذا الموقع بعد.')}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {deals.map((deal: any) => {
                  const title = lang === 'ar' ? deal.titleAr : deal.titleEn;
                  const restName = lang === 'ar' ? deal.restaurantNameAr : deal.restaurantNameEn;
                  return (
                    <Link key={deal.id} href="/offers" className="group block">
                      <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-[0_2px_12px_rgb(0,0,0,0.08)] group-hover:shadow-[0_8px_28px_rgb(0,0,0,0.18)] group-hover:-translate-y-1 transition-all duration-300 border border-white/60 dark:border-border">
                        {/* Image */}
                        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
                          <img src={deal.imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                          {/* Discount badge over image */}
                          <div className="absolute top-2.5 start-2.5 bg-emerald-600 text-white text-xs font-black px-2 py-1 rounded-lg shadow-md">
                            -{deal.discountPercent}%
                          </div>
                          {/* Heart button — always visible on mobile, fade in on hover desktop */}
                          <button className="absolute top-2.5 end-2.5 w-8 h-8 bg-white/95 dark:bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all">
                            <Heart className="w-4 h-4 text-rose-400" />
                          </button>
                          {/* Bottom gradient for restaurant name overlay */}
                          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-2 start-2.5 flex items-center gap-1.5">
                            <span className="text-white text-xs font-semibold truncate max-w-[160px] drop-shadow">{restName}</span>
                            {deal.locationsCount > 1 && (
                              <span className="text-white/70 text-[10px] shrink-0">· {deal.locationsCount} {t('branches', 'فروع')}</span>
                            )}
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-3.5">
                          <h3 className="font-bold text-foreground text-xs leading-snug line-clamp-2 mb-2">{title}</h3>
                          {deal.address && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2 truncate">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{deal.address}</span>
                              {deal.distanceKm && <><span className="shrink-0 mx-0.5">·</span><span className="shrink-0">{deal.distanceKm} km</span></>}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mb-3">
                            <StarRating rating={deal.rating} size="xs" />
                            <span className="text-[11px] font-bold ms-0.5">{deal.rating}</span>
                            <span className="text-[11px] text-muted-foreground">({deal.reviews})</span>
                          </div>
                          {/* Price row */}
                          <div className="flex items-end justify-between pt-2.5 border-t border-border/50">
                            <div>
                              <span className="text-[11px] text-muted-foreground line-through block leading-none mb-0.5">{deal.currency} {deal.originalPrice}</span>
                              <span className="text-base font-black text-foreground">{deal.currency} {deal.discountedPrice}</span>
                            </div>
                            <div className="text-end">
                              <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">{t('with TABAQ10', 'بكود TABAQ10')}</span>
                              <span className="text-sm font-black text-emerald-600">{deal.currency} {deal.promoPrice}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })()}

          {/* Promo code CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 rounded-2xl px-5 py-4 border border-white/15 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{t('Use code TABAQ10 for an extra 10% off any deal', 'استخدم كود TABAQ10 للحصول على خصم إضافي 10٪ على أي عرض')}</p>
                <p className="text-violet-300 text-xs mt-0.5">{t('Applied at checkout on the deal page', 'يُطبق عند الدفع في صفحة العرض')}</p>
              </div>
            </div>
            <Link href="/offers" className="shrink-0">
              <button className="bg-white text-violet-900 font-bold px-6 py-2.5 rounded-xl hover:bg-violet-50 transition-colors text-sm shadow whitespace-nowrap">
                {t('Browse All Deals', 'تصفح كل العروض')}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="relative bg-primary rounded-3xl overflow-hidden">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1400&h=400&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80" />

          <div className="relative px-8 md:px-12 py-12 flex flex-col md:flex-row items-center gap-8">
            {/* Left */}
            <div className="flex-1 text-center md:text-start">
              <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                <BookOpen className="w-5 h-5 text-white/70" />
                <span className="text-white/70 text-sm font-semibold uppercase tracking-wider">{t('Community', 'المجتمع')}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                {t('Share your dining experiences', 'شارك تجارب تناول الطعام')}
              </h2>
              <p className="text-white/75 max-w-lg">
                {t('Write reviews, earn points, climb the leaderboard, and become a top food critic in Saudi Arabia.', 'اكتب تقييمات، اكسب نقاط، تصدر المتصدرين، وكن ناقداً غذائياً متميزاً في المملكة.')}
              </p>
            </div>

            {/* Right */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/leaderboard">
                <button className="w-full sm:w-auto bg-white text-primary font-bold px-7 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-lg whitespace-nowrap">
                  {t('View Leaderboard', 'عرض المتصدرين')}
                </button>
              </Link>
              <Link href="/restaurants">
                <button className="w-full sm:w-auto bg-white/15 hover:bg-white/25 text-white font-bold px-7 py-3.5 rounded-2xl transition-all whitespace-nowrap border border-white/25">
                  {t('Explore Now', 'استكشف الآن')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
