import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link, useLocation } from 'wouter';
import { Search, ChevronRight, Star, TrendingUp, Trophy, MapPin, CheckCircle2, Flame, Layers, ArrowRight, CalendarDays, MessageSquare, Utensils } from 'lucide-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { getRestaurantAwards, COLLECTIONS } from '@/lib/awards';

const HERO_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop';

function useApi<T>(url: string): { data: T | null; loading: boolean } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setLoading(false); } });
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
      <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center gap-3">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
          <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-0 start-0 bg-primary text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-br-xl rounded-tl-xl">{rank}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground line-clamp-1 text-sm">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{restaurant}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-md">
              <Star className="w-3 h-3 fill-primary text-primary" />
              <span className="text-xs font-bold">{Number(d.avgRating).toFixed(1)}</span>
            </div>
            {d.price && (
              <span className="text-sm font-bold text-primary">
                {Number(d.price).toLocaleString('en-SA', { style: 'currency', currency: d.currency || 'SAR', minimumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HomePage() {
  const { t, lang } = useLanguage();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');

  const featured = useApi<any[]>('/api/restaurants/featured?limit=8');
  const trending = useApi<any[]>('/api/dishes/trending?limit=6');
  const occasions = useApi<any[]>('/api/occasions');
  const categories = useApi<any[]>('/api/categories');
  const topRated = useApi<{ restaurants: any[] }>('/api/restaurants?minRating=4.5&limit=6');
  const newest = useApi<{ restaurants: any[] }>('/api/restaurants?limit=4&sortBy=newest');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) setLocation(`/search?q=${encodeURIComponent(q)}`);
  };

  const quickTerms = lang === 'ar'
    ? ['ستيك', 'سوشي', 'بيتزا', 'مشويات', 'إفطار']
    : ['Steak', 'Sushi', 'Pizza', 'BBQ', 'Brunch'];

  const occasionIcons = ['👨‍👩‍👧‍👦', '💼', '🌹', '🎂', '🥗', '🎉', '🌅', '🌙'];

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ── Hero ── */}
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Fine dining" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/75" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-white text-sm mb-5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {t("Saudi Arabia's #1 Dining Platform", 'منصة الطعام الأولى في المملكة')}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            {t('Discover Exceptional Dining', 'اكتشف تجارب طعام استثنائية')}
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            {t('Find, book, and review the finest restaurants in Saudi Arabia.', 'ابحث واحجز وقيّم أفضل المطاعم في المملكة العربية السعودية.')}
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-5">
            <div className="flex gap-2 bg-white/10 backdrop-blur-xl border border-white/25 rounded-2xl p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 ps-3">
                <Search className="w-5 h-5 text-white/60 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('Search restaurants or dishes…', 'ابحث عن مطعم أو طبق…')}
                  className="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none text-base py-2"
                />
              </div>
              <button type="submit" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg whitespace-nowrap">
                {t('Search', 'بحث')}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2">
            {quickTerms.map(term => (
              <button
                key={term}
                onClick={() => setLocation(`/search?q=${encodeURIComponent(term)}`)}
                className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-1.5 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-3 grid grid-cols-3 gap-4">
            {[
              { icon: Utensils, valEn: '500+', valAr: '+500', labelEn: 'Restaurants', labelAr: 'مطعم' },
              { icon: CalendarDays, valEn: '10K+', valAr: '+10K', labelEn: 'Reservations', labelAr: 'حجز' },
              { icon: MessageSquare, valEn: '50K+', valAr: '+50K', labelEn: 'Reviews', labelAr: 'تقييم' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.labelEn} className="flex items-center justify-center gap-2 text-white">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm">{lang === 'ar' ? s.valAr : s.valEn}</p>
                    <p className="text-white/60 text-xs">{lang === 'ar' ? s.labelAr : s.labelEn}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Occasions ── */}
      {!occasions.loading && (occasions.data || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 mb-12">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-foreground">{t('Browse by Occasion', 'تصفح حسب المناسبة')}</h2>
            <Link href="/restaurants" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              {t('See all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {(occasions.data || []).slice(0, 8).map((occ: any, idx: number) => (
              <Link
                key={occ.id}
                href={`/restaurants?occasion=${occ.id}`}
                className="flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-2xl bg-card hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer border border-border/60 hover:border-primary hover:shadow-lg shrink-0 group"
              >
                <span className="text-3xl mb-1.5">{occ.icon || occasionIcons[idx % occasionIcons.length]}</span>
                <span className="text-xs font-semibold text-center px-1 leading-tight group-hover:text-primary-foreground">
                  {lang === 'ar' ? occ.nameAr : occ.nameEn}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Cuisine Types ── */}
      {!categories.loading && (categories.data || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t('Cuisine Types', 'أنواع المطابخ')}</h2>
          <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
            {(categories.data || []).slice(0, 14).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/restaurants?categoryId=${cat.id}`}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-sm font-semibold whitespace-nowrap"
              >
                {cat.icon && <span>{cat.icon}</span>}
                {lang === 'ar' ? cat.nameAr : cat.nameEn}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Collections Showcase ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold text-sm">{t('Handpicked', 'اختيارات')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('Collections', 'المجموعات')}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t('Curated lists for every mood and occasion', 'قوائم مختارة لكل مزاج ومناسبة')}</p>
          </div>
          <Link href="/collections" className="text-primary font-semibold hover:underline text-sm flex items-center gap-1">
            {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COLLECTIONS.slice(0, 4).map(col => (
            <Link key={col.id} href={`/collections/${col.slug}`} className="block group">
              <div className={`relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br ${col.gradient}`}>
                <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                  <span className="text-3xl">{col.icon}</span>
                  <div>
                    <p className="font-extrabold text-sm leading-tight">{lang === 'ar' ? col.labelAr : col.labelEn}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-white/70 text-xs font-medium group-hover:text-white transition-colors">
                      {t('Explore', 'استكشف')} <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Restaurants ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('Featured Restaurants', 'مطاعم مميزة')}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t('Curated picks for you this week', 'خيارات مختارة لك هذا الأسبوع')}</p>
          </div>
          <Link href="/restaurants?featured=true" className="text-primary font-semibold hover:underline text-sm flex items-center gap-1">
            {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
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

      {/* ── Top-Rated Rankings ── */}
      {!topRated.loading && (topRated.data?.restaurants || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-amber-600 font-semibold text-sm">{t("Award of Excellence", 'جائزة التميز')}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t('Top-Rated Venues', 'الأماكن الأعلى تقييماً')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('Consistently praised by thousands of diners', 'تحظى بإشادة آلاف رواد الطعام')}</p>
            </div>
            <Link href="/collections/top-rated" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Top 1 — Large card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {(topRated.data?.restaurants || []).slice(0, 1).map((r: any) => {
              const name = lang === 'ar' ? r.nameAr : r.nameEn;
              const city = lang === 'ar' ? (r.cityNameAr || '') : (r.cityNameEn || '');
              const img = r.coverImageUrl || HERO_IMG;
              const awards = getRestaurantAwards(r);
              return (
                <Link key={r.id} href={`/restaurants/${r.id}`} className="block group lg:col-span-2 relative rounded-3xl overflow-hidden h-64 border border-border/50 hover:shadow-2xl transition-all">
                  <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 start-4 bg-amber-500 text-white text-sm font-black w-9 h-9 rounded-full flex items-center justify-center shadow-lg">#1</div>
                  {awards[0] && (
                    <div className={`absolute top-4 end-4 ${awards[0].bgClass} ${awards[0].textClass} px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                      {awards[0].icon} {lang === 'ar' ? awards[0].labelAr : awards[0].labelEn}
                    </div>
                  )}
                  <div className="absolute bottom-0 p-5">
                    <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
                      <MapPin className="w-3 h-3" /> {city}
                    </div>
                    <h3 className="text-white font-extrabold text-xl mb-1.5">{name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-white text-sm font-bold">{Number(r.avgRating).toFixed(1)}</span>
                        <span className="text-white/60 text-xs">({Number(r.reviewCount).toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Ranks 2-3 */}
            <div className="flex flex-col gap-5">
              {(topRated.data?.restaurants || []).slice(1, 3).map((r: any, idx: number) => {
                const name = lang === 'ar' ? r.nameAr : r.nameEn;
                const img = r.coverImageUrl || HERO_IMG;
                return (
                  <Link key={r.id} href={`/restaurants/${r.id}`} className="block group relative rounded-2xl overflow-hidden h-[116px] border border-border/50 hover:shadow-xl transition-all">
                    <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute top-3 start-3 bg-background/90 backdrop-blur-md text-foreground text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md">#{idx+2}</div>
                    <div className="absolute bottom-0 p-3">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-white text-xs font-bold">{Number(r.avgRating).toFixed(1)}</span>
                        <span className="text-white/60 text-xs">({Number(r.reviewCount).toLocaleString()})</span>
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

      {/* ── Trending Restaurants ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-3xl p-6 md:p-10 border border-orange-100 dark:border-orange-900/30">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-orange-600 font-semibold text-sm">{t('Hot Right Now', 'الأكثر طلباً الآن')}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('Trending Restaurants', 'مطاعم شائعة')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('Everyone\'s dining here this week', 'الكل يتناول العشاء هنا هذا الأسبوع')}</p>
            </div>
            <Link href="/restaurants" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
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

      {/* ── Trending Dishes ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-gradient-to-br from-secondary/80 to-secondary/20 rounded-3xl p-6 md:p-10 border border-border/40">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-primary font-semibold text-sm">{t('Most Popular', 'الأكثر شعبية')}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('Trending Dishes', 'أطباق شائعة')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('Highest-rated dishes across the city', 'الأطباق الأعلى تقييماً في المدينة')}</p>
            </div>
            <Link href="/dishes" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
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

      {/* ── New Restaurants ── */}
      {!newest.loading && (newest.data?.restaurants || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-600 font-semibold text-sm">🆕 {t('Just Opened', 'افتتح حديثاً')}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t('New Openings', 'افتتاحات جديدة')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('Fresh new places to explore this season', 'أماكن جديدة رائعة لاكتشافها هذا الموسم')}</p>
            </div>
            <Link href="/collections/new-openings" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(newest.data?.restaurants || []).map((r: any) => (
              <RestaurantCard key={r.id} restaurant={{ ...r, isNew: true }} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="relative bg-primary rounded-3xl p-8 md:p-12 overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 end-0 w-64 h-64 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 start-0 w-48 h-48 bg-white rounded-full -translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-grow text-center md:text-start">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {t('Share your dining experiences', 'شارك تجارب تناول الطعام')}
              </h2>
              <p className="text-white/80">
                {t('Write reviews, earn points, climb the leaderboard, and become a top food critic.', 'اكتب تقييمات، اكسب نقاط، تصدر المتصدرين، وكن ناقداً غذائياً متميزاً.')}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/leaderboard">
                <button className="bg-white text-primary font-bold px-7 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-lg whitespace-nowrap">
                  {t('View Leaderboard', 'عرض المتصدرين')}
                </button>
              </Link>
              <Link href="/restaurants">
                <button className="bg-white/20 hover:bg-white/30 text-white font-bold px-7 py-3.5 rounded-2xl transition-all whitespace-nowrap border border-white/30">
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

