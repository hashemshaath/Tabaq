import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  useListRestaurants,
  useListCategories,
  useListOccasions,
  useListCitiesByCountry,
} from '@workspace/api-client-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import {
  SlidersHorizontal, MapPin, X, Star, Search, Trophy, Flame, Sparkles, Clock, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';

type PriceTier = 'budget' | 'mid' | 'upscale' | 'fine_dining' | '';

interface Filters {
  categoryId?: number;
  occasionId?: number;
  priceTier: PriceTier;
  minRating?: number;
  cityId?: number;
  hasParking?: boolean;
  hasOutdoorSeating?: boolean;
  openNow?: boolean;
  sortBy?: string;
}

const SAUDI_COUNTRY_ID = 1;

export function DiscoveryPage() {
  const { t, lang } = useLanguage();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');

  const [filters, setFilters] = useState<Filters>({
    categoryId: params.get('categoryId') ? Number(params.get('categoryId')) : undefined,
    occasionId: params.get('occasion') ? Number(params.get('occasion')) : undefined,
    priceTier: (params.get('price') as PriceTier) || '',
    minRating: undefined,
    cityId: params.get('cityId') ? Number(params.get('cityId')) : undefined,
    sortBy: 'featured',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 12;

  const { data: categories } = useListCategories();
  const { data: occasions } = useListOccasions();
  const { data: cities } = useListCitiesByCountry(SAUDI_COUNTRY_ID);

  const apiFilters: Record<string, string | number | boolean | undefined> = {
    limit: LIMIT,
    offset: page * LIMIT,
  };
  if (filters.categoryId) apiFilters.categoryId = filters.categoryId;
  if (filters.occasionId) apiFilters.occasionId = filters.occasionId;
  if (filters.priceTier) apiFilters.priceTier = filters.priceTier;
  if (filters.minRating) apiFilters.minRating = filters.minRating;
  if (filters.cityId) apiFilters.cityId = filters.cityId;
  if (filters.hasParking) apiFilters.hasParking = true;
  if (filters.hasOutdoorSeating) apiFilters.hasOutdoorSeating = true;
  if (filters.openNow) apiFilters.openNow = true;

  const { data, isLoading } = useListRestaurants(apiFilters, {
    query: {
      queryKey: ['restaurants', apiFilters],
    },
  });

  // Top-rated venues by selected city (minRating=4, limit=3)
  const topRatedFilters: Record<string, string | number | boolean | undefined> = {
    limit: 3,
    minRating: 4,
    ...(filters.cityId ? { cityId: filters.cityId } : {}),
  };
  const { data: topRatedData } = useListRestaurants(topRatedFilters, {
    query: { queryKey: ['restaurants-top', topRatedFilters] },
  });

  const restaurants = data?.restaurants || [];
  const total = data?.total || 0;

  const activeFilterCount = [
    filters.categoryId,
    filters.occasionId,
    filters.priceTier,
    filters.minRating,
    filters.cityId,
    filters.hasParking,
    filters.hasOutdoorSeating,
    filters.openNow,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ priceTier: '', sortBy: 'featured' });
    setPage(0);
  };

  const selectedCity = cities?.find(c => c.id === filters.cityId);

  const priceTiers: { value: PriceTier; labelEn: string; labelAr: string }[] = [
    { value: 'budget', labelEn: 'Budget', labelAr: 'اقتصادي' },
    { value: 'mid', labelEn: 'Mid-Range', labelAr: 'متوسط' },
    { value: 'upscale', labelEn: 'Upscale', labelAr: 'راقٍ' },
    { value: 'fine_dining', labelEn: 'Fine Dining', labelAr: 'فاخر' },
  ];

  const ratingOptions = [3, 3.5, 4, 4.5];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-card border-b border-border py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-5">
            {t('Explore Restaurants', 'استكشف المطاعم')}
          </h1>

          {/* Sort Pills + Open Now */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
            {/* Open Now — always first, prominent green */}
            <button
              onClick={() => { setFilters(f => ({ ...f, openNow: !f.openNow })); setPage(0); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border shrink-0 transition-all ${
                filters.openNow
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-background border-border hover:border-emerald-400/60 text-foreground'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filters.openNow ? 'bg-white animate-pulse' : 'bg-emerald-400'}`} />
              {lang === 'ar' ? 'مفتوح الآن' : 'Open Now'}
            </button>
            <div className="w-px bg-border shrink-0 my-1" />
            {[
              { key: 'featured', icon: Sparkles, en: 'Featured', ar: 'مميز' },
              { key: 'top-rated', icon: Star, en: 'Top Rated', ar: 'الأعلى تقييماً' },
              { key: 'trending', icon: Flame, en: 'Trending', ar: 'شائع' },
              { key: 'newest', icon: Clock, en: 'New', ar: 'الأحدث' },
              { key: 'awards', icon: Award, en: 'Award Winners', ar: 'حائزو الجوائز' },
            ].map(sort => {
              const Icon = sort.icon;
              const isActive = filters.sortBy === sort.key || (sort.key === 'awards' && filters.minRating === 4.5);
              return (
                <button
                  key={sort.key}
                  onClick={() => {
                    if (sort.key === 'awards') {
                      setFilters(f => ({ ...f, minRating: f.minRating === 4.5 ? undefined : 4.5, sortBy: 'featured' }));
                    } else {
                      setFilters(f => ({ ...f, sortBy: sort.key, minRating: undefined }));
                    }
                    setPage(0);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border shrink-0 transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border hover:border-primary/40 text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {lang === 'ar' ? sort.ar : sort.en}
                </button>
              );
            })}
          </div>

          {/* Filter Pills Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Price Tier Filters */}
            <div className="flex gap-2 flex-wrap">
              {priceTiers.map(tier => (
                <button
                  key={tier.value}
                  onClick={() => {
                    setFilters(f => ({ ...f, priceTier: f.priceTier === tier.value ? '' : tier.value }));
                    setPage(0);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    filters.priceTier === tier.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {lang === 'ar' ? tier.labelAr : tier.labelEn}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-border hidden sm:block" />

            {/* More Filters */}
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 rounded-full"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('Filters', 'تصنيفات')}
              {activeFilterCount > 0 && (
                <span className="bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
                {t('Clear', 'مسح')}
              </button>
            )}
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="mt-5 p-5 bg-background rounded-2xl border border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in slide-in-from-top-2 duration-200">
              {/* Cuisine / Category */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('Cuisine Type', 'نوع المطبخ')}</label>
                <select
                  value={filters.categoryId ?? ''}
                  onChange={e => { setFilters(f => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : undefined })); setPage(0); }}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('All Cuisines', 'كل المطابخ')}</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {lang === 'ar' ? cat.nameAr : cat.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occasion */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('Occasion', 'المناسبة')}</label>
                <select
                  value={filters.occasionId ?? ''}
                  onChange={e => { setFilters(f => ({ ...f, occasionId: e.target.value ? Number(e.target.value) : undefined })); setPage(0); }}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('Any Occasion', 'أي مناسبة')}</option>
                  {occasions?.map(occ => (
                    <option key={occ.id} value={occ.id}>
                      {lang === 'ar' ? occ.nameAr : occ.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('Minimum Rating', 'الحد الأدنى للتقييم')}</label>
                <div className="flex gap-2 flex-wrap">
                  {ratingOptions.map(r => (
                    <button
                      key={r}
                      onClick={() => { setFilters(f => ({ ...f, minRating: f.minRating === r ? undefined : r })); setPage(0); }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        filters.minRating === r
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40'
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                      {r}+
                    </button>
                  ))}
                </div>
              </div>

              {/* City Filter */}
              {cities && cities.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    <MapPin className="w-3.5 h-3.5 inline me-1" />
                    {t('City', 'المدينة')}
                  </label>
                  <select
                    value={filters.cityId ?? ''}
                    onChange={e => { setFilters(f => ({ ...f, cityId: e.target.value ? Number(e.target.value) : undefined })); setPage(0); }}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{t('All Cities', 'كل المدن')}</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {lang === 'ar' ? city.nameAr : city.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amenities & Features */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('Features & Availability', 'المميزات والتوفر')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'openNow' as const, labelEn: 'Open Now', labelAr: 'مفتوح الآن' },
                    { key: 'hasParking' as const, labelEn: 'Parking', labelAr: 'مواقف' },
                    { key: 'hasOutdoorSeating' as const, labelEn: 'Outdoor Seating', labelAr: 'جلسات خارجية' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setFilters(f => ({ ...f, [opt.key]: !f[opt.key] || undefined })); setPage(0); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        filters[opt.key]
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40'
                      }`}
                    >
                      {lang === 'ar' ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Occasions Quick Filter Row */}
      {occasions && occasions.length > 0 && (
        <div className="border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => { setFilters(f => ({ ...f, occasionId: undefined })); setPage(0); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                  !filters.occasionId ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40 text-muted-foreground'
                }`}
              >
                {t('All', 'الكل')}
              </button>
              {occasions.map(occ => (
                <button
                  key={occ.id}
                  onClick={() => { setFilters(f => ({ ...f, occasionId: f.occasionId === occ.id ? undefined : occ.id })); setPage(0); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                    filters.occasionId === occ.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/40 text-muted-foreground'
                  }`}
                >
                  {occ.icon && <span>{occ.icon}</span>}
                  {lang === 'ar' ? occ.nameAr : occ.nameEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Top-Rated Venues Section */}
        {topRatedData && topRatedData.restaurants.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">
                    {selectedCity
                      ? t(`Top-Rated in ${lang === 'ar' ? selectedCity.nameAr : selectedCity.nameEn}`, `الأعلى تقييماً في ${selectedCity.nameAr}`)
                      : t('Top-Rated Venues', 'الأماكن الأعلى تقييماً')
                    }
                  </h2>
                  <p className="text-[11px] text-muted-foreground">{t('Rated 4.0+ by our community', 'مُقيَّمة 4.0+ من مجتمعنا')}</p>
                </div>
              </div>
              <Link href="/restaurants" className="text-xs text-primary font-semibold hover:underline">
                {t('See all →', 'عرض الكل ←')}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topRatedData.restaurants.map((rest, idx) => {
                const city = cities?.find(c => c.id === rest.cityId);
                const cuisines = (lang === 'ar' && (rest as any).cuisineTypesAr?.length ? (rest as any).cuisineTypesAr : (rest.cuisineTypes ?? [])).slice(0, 2);
                const MEDAL = ['🥇', '🥈', '🥉'];
                return (
                  <Link key={rest.id} href={`/restaurants/${rest.id}`}>
                    <div className="relative rounded-2xl overflow-hidden border border-border/60 hover:border-amber-300/60 hover:shadow-xl transition-all group cursor-pointer h-56">
                      <img
                        src={rest.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'}
                        alt={lang === 'ar' ? rest.nameAr : rest.nameEn}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      {/* Rank medal */}
                      <div className="absolute top-3 start-3">
                        <span className="text-xl drop-shadow-lg">{MEDAL[idx] || `#${idx + 1}`}</span>
                      </div>
                      {/* Cuisine tags */}
                      {cuisines.length > 0 && (
                        <div className="absolute top-3 end-3 flex gap-1 flex-wrap justify-end">
                          {cuisines.map((c: string, i: number) => (
                            <span key={i} className="bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="absolute bottom-0 start-0 end-0 p-4">
                        <h3 className="text-white font-bold text-base line-clamp-1 tracking-[-0.01em]">
                          {lang === 'ar' ? rest.nameAr : rest.nameEn}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-white font-bold text-sm">{Number(rest.avgRating).toFixed(1)}</span>
                          </div>
                          <span className="text-white/60 text-xs">({rest.reviewCount.toLocaleString()} {t('reviews', 'تقييم')})</span>
                          {city && (
                            <span className="text-white/60 text-xs ms-auto flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {lang === 'ar' ? city.nameAr : city.nameEn}
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
        )}

        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground font-medium text-sm">
            {isLoading
              ? t('Searching...', 'جاري البحث...')
              : `${total.toLocaleString()} ${t('restaurants', 'مطعم')}`
            }
          </p>
          {total > LIMIT && (
            <p className="text-xs text-muted-foreground">
              {t('Page', 'الصفحة')} {page + 1} / {Math.ceil(total / LIMIT)}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : restaurants.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {restaurants.map(rest => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  {t('Previous', 'السابق')}
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-4">
                  {page + 1} / {Math.ceil(total / LIMIT)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * LIMIT >= total}
                >
                  {t('Next', 'التالي')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="col-span-full py-24 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t('No restaurants found', 'لم نجد مطاعم')}</h3>
            <p className="text-muted-foreground mb-6">{t('Try adjusting your filters.', 'جرب تغيير الفلاتر.')}</p>
            <Button variant="outline" onClick={clearFilters}>{t('Clear all filters', 'مسح الفلاتر')}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
