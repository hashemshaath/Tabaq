import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  useListRestaurants,
  useListCategories,
  useListOccasions,
} from '@workspace/api-client-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import {
  Filter, SlidersHorizontal, MapPin, ChevronDown, X, Star, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';

type PriceTier = 'budget' | 'mid' | 'upscale' | 'fine_dining' | '';

interface Filters {
  categoryId?: number;
  occasionId?: number;
  priceTier: PriceTier;
  minRating?: number;
  hasParking?: boolean;
  hasOutdoor?: boolean;
  isHalal?: boolean;
  sortBy?: string;
}

export function DiscoveryPage() {
  const { t, lang } = useLanguage();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');

  const [filters, setFilters] = useState<Filters>({
    categoryId: params.get('categoryId') ? Number(params.get('categoryId')) : undefined,
    occasionId: params.get('occasion') ? Number(params.get('occasion')) : undefined,
    priceTier: (params.get('price') as PriceTier) || '',
    minRating: undefined,
    sortBy: 'featured',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(0);
  const LIMIT = 12;

  const { data: categories } = useListCategories();
  const { data: occasions } = useListOccasions();

  const apiFilters: Record<string, string | number | boolean | undefined> = {
    limit: LIMIT,
    offset: page * LIMIT,
  };
  if (filters.categoryId) apiFilters.categoryId = filters.categoryId;
  if (filters.occasionId) apiFilters.occasionId = filters.occasionId;
  if (filters.priceTier) apiFilters.priceTier = filters.priceTier;
  if (filters.minRating) apiFilters.minRating = filters.minRating;

  const { data, isLoading } = useListRestaurants(apiFilters, {
    query: {
      queryKey: ['restaurants', apiFilters],
    },
  });

  const restaurants = data?.restaurants || [];
  const total = data?.total || 0;

  const activeFilterCount = [
    filters.categoryId,
    filters.occasionId,
    filters.priceTier,
    filters.minRating,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ priceTier: '', sortBy: 'featured' });
    setPage(0);
  };

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
