import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link, useLocation } from 'wouter';
import {
  Search, ChevronRight, Star, TrendingUp, Trophy, MapPin,
  Flame, Layers, ArrowRight, CalendarDays, MessageSquare,
  Utensils, Sparkles, BookOpen, Tag
} from 'lucide-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { getRestaurantAwards, COLLECTIONS } from '@/lib/awards';

// ── Images ─────────────────────────────────────────────────────────
const HERO_IMGS = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop',
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
function useApi<T>(url: string): { data: T | null; loading: boolean } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);
  return { data, loading };
}

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

// ── SectionHeader ──────────────────────────────────────────────────
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
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');

  const featured   = useApi<any[]>('/api/restaurants/featured?limit=8');
  const trending   = useApi<any[]>('/api/dishes/trending?limit=6');
  const occasions  = useApi<any[]>('/api/occasions');
  const categories = useApi<any[]>('/api/categories');
  const topRated   = useApi<{ restaurants: any[] }>('/api/restaurants?minRating=4.5&limit=6');
  const newest     = useApi<{ restaurants: any[] }>('/api/restaurants?limit=4&sortBy=newest');

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
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={HERO_IMGS[0]} alt="Fine dining" className="w-full h-full object-cover" />
          {/* Left-to-right radial overlay + bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

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
                {t('Discover\nExceptional\nDining', 'اكتشف\nتجارب طعام\naستثنائية')}
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

      {/* ══ OCCASIONS ════════════════════════════════════════════ */}
      {!occasions.loading && (occasions.data || []).length > 0 && (
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

      {/* ══ CUISINE TYPES ════════════════════════════════════════ */}
      {!categories.loading && (categories.data || []).length > 0 && (
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
        {featured.loading ? (
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
      {!topRated.loading && (topRated.data?.restaurants || []).length > 0 && (
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
          {featured.loading ? (
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
          {trending.loading ? (
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
      {!newest.loading && (newest.data?.restaurants || []).length > 0 && (
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
