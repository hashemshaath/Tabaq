import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link, useLocation } from 'wouter';
import { Search, ChevronRight, Star, TrendingUp, Trophy, MapPin, CheckCircle2 } from 'lucide-react';

const UNSPLASH_FOOD = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop';

function useApi<T>(url: string): { data: T | null; loading: boolean; error: boolean } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/50 animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

function RestaurantCard({ r }: { r: any }) {
  const { lang } = useLanguage();
  const name = lang === 'ar' ? r.nameAr : r.nameEn;
  const city = lang === 'ar' ? (r.cityNameAr || '') : (r.cityNameEn || '');
  const img = r.coverImageUrl || UNSPLASH_FOOD;
  const tierLabel = r.priceTier === 'budget' ? '$' : r.priceTier === 'mid' ? '$$' : r.priceTier === 'upscale' ? '$$$' : '$$$$';

  return (
    <Link href={`/restaurants/${r.id}`} className="block group h-full">
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = UNSPLASH_FOOD; }}
          />
          <div className="absolute top-3 start-3 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="text-sm font-bold">{Number(r.avgRating).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({r.reviewCount})</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-bold text-foreground line-clamp-1 flex-1">{name}</h3>
            {r.isVerified && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3" />
            <span>{city}</span>
            <span>·</span>
            <span className="font-semibold text-foreground">{tierLabel}</span>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {(r.cuisineTypes || []).slice(0, 3).map((c: string, i: number) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
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
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'; }}
          />
          <div className="absolute top-0 start-0 bg-primary text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-br-xl rounded-tl-xl">
            {rank}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground line-clamp-1">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{restaurant}</p>
          <div className="flex items-center gap-2 mt-2">
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
  const topRated = useApi<{ restaurants: any[] }>('/api/restaurants?minRating=4.5&limit=3');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) setLocation(`/search?q=${encodeURIComponent(q)}`);
  };

  const quickTerms = lang === 'ar'
    ? ['ستيك', 'سوشي', 'بيتزا', 'إفطار']
    : ['Steak', 'Sushi', 'Pizza', 'Breakfast'];

  const occasionIcons = ['👨‍👩‍👧‍👦', '💼', '🌹', '🎂', '🥗', '🎉', '🌅', '🌙'];

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ── Hero ── */}
      <section className="relative min-h-[62vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={UNSPLASH_FOOD}
            alt="Fine dining"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/70" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-white text-sm mb-5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {t("Saudi Arabia's #1 Dining Platform", 'منصة الطعام الأولى في المملكة')}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            {t('Discover Exceptional Dining', 'اكتشف تجارب طعام استثنائية')}
          </h1>
          <p className="text-lg text-white/75 mb-8 max-w-xl mx-auto">
            {t('Find, book, and review the best restaurants in Saudi Arabia.', 'ابحث واحجز وقيّم أفضل المطاعم في المملكة العربية السعودية.')}
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
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
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg whitespace-nowrap"
              >
                {t('Search', 'بحث')}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {quickTerms.map(term => (
              <button
                key={term}
                onClick={() => setLocation(`/search?q=${encodeURIComponent(term)}`)}
                className="text-sm text-white/75 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-1.5 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Occasions ── */}
      {!occasions.loading && (occasions.data || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
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
                className="flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-2xl bg-card hover:bg-primary hover:text-white transition-all cursor-pointer border border-border/60 hover:border-primary hover:shadow-lg shrink-0"
              >
                <span className="text-3xl mb-1.5">{occ.icon || occasionIcons[idx % occasionIcons.length]}</span>
                <span className="text-xs font-semibold text-center px-1 leading-tight">
                  {lang === 'ar' ? occ.nameAr : occ.nameEn}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Categories ── */}
      {!categories.loading && (categories.data || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t('Cuisine Types', 'أنواع المطابخ')}</h2>
          <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
            {(categories.data || []).slice(0, 12).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/restaurants?categoryId=${cat.id}`}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-primary hover:text-white hover:border-primary transition-all text-sm font-semibold whitespace-nowrap"
              >
                {cat.icon && <span>{cat.icon}</span>}
                {lang === 'ar' ? cat.nameAr : cat.nameEn}
              </Link>
            ))}
          </div>
        </section>
      )}

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
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (featured.data || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(featured.data || []).slice(0, 8).map((r: any) => (
              <RestaurantCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
            <p>{t('No featured restaurants yet.', 'لا توجد مطاعم مميزة بعد.')}</p>
          </div>
        )}
      </section>

      {/* ── Top Rated ── */}
      {!topRated.loading && (topRated.data?.restaurants || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-amber-600 font-semibold text-sm">{t("Editor's Choice", 'اختيار المحررين')}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t('Top-Rated Venues', 'الأماكن الأعلى تقييماً')}</h2>
            </div>
            <Link href="/restaurants?minRating=4.5" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(topRated.data?.restaurants || []).map((r: any, idx: number) => {
              const name = lang === 'ar' ? r.nameAr : r.nameEn;
              const img = r.coverImageUrl || UNSPLASH_FOOD;
              return (
                <Link key={r.id} href={`/restaurants/${r.id}`} className="block group">
                  <div className="relative rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all h-44">
                    <img
                      src={img}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).src = UNSPLASH_FOOD; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                    <div className="absolute top-3 start-3 bg-amber-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="absolute bottom-0 p-3 w-full">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-white text-xs font-semibold">{Number(r.avgRating).toFixed(1)}</span>
                        <span className="text-white/60 text-xs">({Number(r.reviewCount).toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-card rounded-xl animate-pulse border border-border/40" />
              ))}
            </div>
          ) : (trending.data || []).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {(trending.data || []).map((d: any, idx: number) => (
                <DishItem key={d.id} d={d} rank={idx + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>{t('No trending dishes yet.', 'لا توجد أطباق شائعة بعد.')}</p>
            </div>
          )}
        </div>
      </section>

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
                {t('Write reviews, earn points, and become a top food critic.', 'اكتب تقييمات، اكسب نقاط، وكن ناقداً غذائياً متميزاً.')}
              </p>
            </div>
            <Link href="/leaderboard">
              <button className="shrink-0 bg-white text-primary font-bold px-7 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-lg whitespace-nowrap">
                {t('View Leaderboard', 'عرض المتصدرين')}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
