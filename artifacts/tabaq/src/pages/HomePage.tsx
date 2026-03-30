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

const OCCASION_META: Record<string, { img: string; gradient: string }> = {
  'Birthday Celebration': { img: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300&h=200&fit=crop', gradient: 'from-rose-400 to-pink-600' },
  'Breakfast':            { img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&h=200&fit=crop', gradient: 'from-amber-300 to-orange-400' },
  'Business Lunch':       { img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&h=200&fit=crop', gradient: 'from-slate-500 to-slate-700' },
  'Family Dinner':        { img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop', gradient: 'from-emerald-400 to-teal-600' },
  'Group Gathering':      { img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=300&h=200&fit=crop', gradient: 'from-violet-400 to-purple-600' },
  'Healthy Dining':       { img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop', gradient: 'from-green-400 to-emerald-600' },
  'Ramadan Iftar':        { img: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=300&h=200&fit=crop', gradient: 'from-indigo-500 to-purple-700' },
  'Romantic Date':        { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop', gradient: 'from-red-400 to-rose-600' },
};
const OCCASION_FALLBACK_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-rose-400 to-pink-600',
  'from-blue-400 to-cyan-500',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-400 to-rose-500',
  'from-slate-500 to-slate-700',
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
              const meta = OCCASION_META[occ.nameEn] || {};
              const gradient = meta.gradient || OCCASION_FALLBACK_GRADIENTS[idx % OCCASION_FALLBACK_GRADIENTS.length];
              const img = meta.img;
              return (
                <Link
                  key={occ.id}
                  href={`/restaurants?occasion=${occ.id}`}
                  className="group block relative rounded-2xl overflow-hidden aspect-square hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-pointer"
                >
                  {img ? (
                    <>
                      <img src={img} alt={occ.nameEn} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className={`absolute inset-0 bg-gradient-to-t ${gradient} opacity-70 group-hover:opacity-80 transition-opacity`} />
                    </>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
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

      {/* ══ HOW IT WORKS ═════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/50 dark:to-slate-800/30 rounded-3xl p-8 md:p-12 border border-border/40">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-medium text-xs tracking-[0.05em] uppercase">{t('Simple & Fast', 'بسيط وسريع')}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('How Tabaq Works', 'كيف يعمل طبق')}</h2>
            <p className="text-muted-foreground text-sm mt-2">{t('From discovery to your table in three easy steps', 'من الاكتشاف إلى طاولتك في ثلاث خطوات سهلة')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 relative">
            {/* Connector lines (desktop only) */}
            <div className="hidden md:block absolute top-8 start-1/3 end-1/3 h-px bg-gradient-to-r from-border via-primary/30 to-border" />
            {[
              {
                step: '01',
                icon: Search,
                color: 'from-blue-500 to-cyan-500',
                titleEn: 'Discover',
                titleAr: 'اكتشف',
                descEn: 'Browse restaurants, read reviews, and explore exclusive deals tailored to your taste.',
                descAr: 'تصفح المطاعم، اقرأ التقييمات، واستكشف العروض الحصرية المناسبة لذوقك.',
              },
              {
                step: '02',
                icon: CalendarCheck,
                color: 'from-violet-500 to-purple-600',
                titleEn: 'Book or Buy',
                titleAr: 'احجز أو اشتر',
                descEn: 'Reserve a table instantly or purchase a deal voucher at a discounted price.',
                descAr: 'احجز طاولة فوراً أو اشتر قسيمة عرض بسعر مخفض.',
              },
              {
                step: '03',
                icon: ScanQrCode,
                color: 'from-emerald-500 to-teal-600',
                titleEn: 'Dine & Enjoy',
                titleAr: 'تناول واستمتع',
                descEn: 'Show your QR voucher at the restaurant, enjoy your meal, and earn reward points.',
                descAr: 'أظهر قسيمة QR في المطعم، استمتع بوجبتك، واكسب نقاط مكافآت.',
              },
            ].map(({ step, icon: Icon, color, titleEn, titleAr, descEn, descAr }) => (
              <div key={step} className="flex flex-col items-center text-center relative">
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                  <span className="absolute -top-2 -end-2 w-6 h-6 bg-background border-2 border-border rounded-full text-[10px] font-black text-foreground flex items-center justify-center">{step}</span>
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{t(titleEn, titleAr)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{t(descEn, descAr)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 md:p-10">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${col.gradient} opacity-35`} />
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
        <div className="bg-gradient-to-br from-violet-950 via-violet-900 to-purple-900 rounded-3xl p-6 md:p-10 overflow-hidden relative">
          {/* Background shimmer */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 end-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 start-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          {/* Header */}
          <div className="flex items-end justify-between mb-6 relative">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-violet-300 font-semibold text-xs tracking-[0.05em] uppercase">{t('Limited Time Only', 'لوقت محدود فقط')}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{t('Exclusive Dining Deals', 'عروض تناول الطعام الحصرية')}</h2>
              <p className="text-violet-300 text-sm mt-1">{t('Save up to 50% at top restaurants. Apply code TABAQ10 for extra 10% off.', 'وفّر حتى 50٪ في أفضل المطاعم. استخدم كود TABAQ10 لخصم إضافي 10٪.')}</p>
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
