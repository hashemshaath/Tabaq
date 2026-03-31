import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import {
  useListExperiences,
  useListCitiesByCountry,
  type ListExperiencesParams,
} from '@workspace/api-client-react';
import { ListExperiencesSortBy } from '@workspace/api-client-react';
import { ListExperiencesCategory } from '@workspace/api-client-react';
import { ExperienceCard } from '@/components/ExperienceCard';
import {
  SlidersHorizontal, X, Star, Search, Flame, Sparkles, Clock, LayoutGrid, List,
  MapPin, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SAUDI_COUNTRY_ID = 1;

const EXPERIENCE_CATEGORIES: { value: ListExperiencesCategory; en: string; ar: string }[] = [
  { value: ListExperiencesCategory.heritage, en: 'Heritage', ar: 'التراث' },
  { value: ListExperiencesCategory.street_food, en: 'Street Food', ar: 'طعام الشارع' },
  { value: ListExperiencesCategory.fine_dining, en: 'Fine Dining', ar: 'مطاعم راقية' },
  { value: ListExperiencesCategory.live_show, en: 'Live Show', ar: 'عروض حية' },
  { value: ListExperiencesCategory.cultural, en: 'Cultural', ar: 'ثقافي' },
];

const SORT_OPTIONS: { key: ListExperiencesSortBy; icon: React.ElementType; en: string; ar: string }[] = [
  { key: ListExperiencesSortBy.popular, icon: Sparkles, en: 'Popular', ar: 'الأكثر شعبية' },
  { key: ListExperiencesSortBy.rated, icon: Star, en: 'Top Rated', ar: 'الأعلى تقييماً' },
  { key: ListExperiencesSortBy.trending, icon: Flame, en: 'Trending', ar: 'شائع' },
  { key: ListExperiencesSortBy.newest, icon: Clock, en: 'Newest', ar: 'الأحدث' },
];

const PRICE_RANGES = [
  { value: '', en: 'Any Price', ar: 'أي سعر' },
  { value: '0-100', en: 'Under SAR 100', ar: 'أقل من 100 ريال', min: 0, max: 100 },
  { value: '100-300', en: 'SAR 100–300', ar: '100–300 ريال', min: 100, max: 300 },
  { value: '300-600', en: 'SAR 300–600', ar: '300–600 ريال', min: 300, max: 600 },
  { value: '600+', en: 'SAR 600+', ar: '+600 ريال', min: 600, max: undefined },
];

interface Filters {
  cityId: number | undefined;
  category: ListExperiencesCategory | '';
  priceRange: string;
  minRating: number;
  sortBy: ListExperiencesSortBy;
}


export function ExperiencesPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    titleEn: 'Food Experiences | Tabaq',
    titleAr: 'تجارب طعام | طبق',
    descriptionEn: 'Book unique culinary experiences — chef\'s table dinners, cooking classes, and more across Saudi Arabia.',
    descriptionAr: 'احجز تجارب طهي فريدة — عشاء مع الشيف، ودروس الطبخ، والمزيد في المملكة العربية السعودية.',
  }, lang);
  const [filters, setFilters] = useState<Filters>({
    cityId: undefined,
    category: '',
    priceRange: '',
    minRating: 0,
    sortBy: ListExperiencesSortBy.popular,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<number | undefined>(undefined);

  const { data: cities } = useListCitiesByCountry(SAUDI_COUNTRY_ID);

  const priceRange = PRICE_RANGES.find(p => p.value === filters.priceRange);

  const apiParams: ListExperiencesParams = {
    sortBy: filters.sortBy,
    ...(cityFilter !== undefined ? { cityId: cityFilter } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.minRating > 0 ? { minRating: filters.minRating } : {}),
    ...(priceRange?.min !== undefined ? { priceMin: priceRange.min } : {}),
    ...(priceRange?.max !== undefined ? { priceMax: priceRange.max } : {}),
    limit: 50,
  };

  const { data: listData, isLoading } = useListExperiences(apiParams);

  const experiences = useMemo(() => {
    const list = listData?.experiences?.length ? listData.experiences : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      exp => exp.titleEn.toLowerCase().includes(q) || exp.titleAr.includes(q),
    );
  }, [listData, searchQuery]);

  const activeFilterCount = [
    cityFilter !== undefined,
    !!filters.category,
    !!filters.priceRange,
    filters.minRating > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      cityId: undefined,
      category: '',
      priceRange: '',
      minRating: 0,
      sortBy: ListExperiencesSortBy.popular,
    });
    setCityFilter(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '420px' }}>
        <img
          src="https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1600&h=900&fit=crop"
          alt="Food experiences"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              {t('Curated Experiences', 'تجارب مختارة')}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight drop-shadow-lg">
              {t('Food Experiences', 'تجارب الطعام')}
            </h1>
            <p className="text-white/80 text-sm md:text-base mb-6 max-w-xl">
              {t(
                'Immersive culinary journeys — from private chef dinners to hands-on cooking classes across Saudi Arabia.',
                'رحلات طهي غامرة — من عشاءات الشيف الخاصة إلى دروس الطبخ التفاعلية في جميع أنحاء المملكة.'
              )}
            </p>

            {/* Search bar */}
            <div className="flex items-center max-w-lg bg-white/95 backdrop-blur rounded-xl overflow-hidden shadow-xl">
              <div className="flex-1 flex items-center gap-2 px-4">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('Search experiences…', 'ابحث عن تجربة…')}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm py-3.5"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Quick-Browse ──────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-0.5 hide-scrollbar items-center">
            {SORT_OPTIONS.map(sort => {
              const Icon = sort.icon;
              const isActive = filters.sortBy === sort.key;
              return (
                <button
                  key={sort.key}
                  onClick={() => setFilters(f => ({ ...f, sortBy: sort.key }))}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border shrink-0 transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border hover:border-primary/40 text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {lang === 'ar' ? sort.ar : sort.en}
                </button>
              );
            })}

            <div className="w-px h-6 bg-border mx-1 shrink-0" />

            {/* Category filter pills */}
            <button
              onClick={() => setFilters(f => ({ ...f, category: '' }))}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border shrink-0 transition-all',
                !filters.category ? 'bg-foreground text-background border-foreground' : 'bg-background border-border hover:border-primary/40 text-foreground'
              )}
            >
              {t('All', 'الكل')}
            </button>
            {EXPERIENCE_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilters(f => ({ ...f, category: f.category === cat.value ? '' : cat.value }))}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border shrink-0 transition-all',
                  filters.category === cat.value
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border hover:border-primary/40 text-foreground'
                )}
              >
                {lang === 'ar' ? cat.ar : cat.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sub-Filter Bar ─────────────────────────────────────── */}
      <div className="bg-background border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(v => !v)}
              className="gap-2 rounded-full"
              size="sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('More Filters', 'فلاتر')}
              {activeFilterCount > 0 && (
                <span className="bg-white text-primary text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* City quick-filter pills */}
            {(cities ?? []).slice(0, 5).map(city => (
              <button
                key={city.id}
                onClick={() => setCityFilter(f => f === city.id ? undefined : city.id)}
                className={cn(
                  'flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all',
                  cityFilter === city.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary/40 text-foreground'
                )}
              >
                <MapPin className="w-3 h-3" />
                {lang === 'ar' ? city.nameAr : city.nameEn}
              </button>
            ))}

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {t('Clear', 'مسح')}
              </button>
            )}

            <div className="ms-auto flex items-center gap-1 border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-5 bg-background rounded-2xl border border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in slide-in-from-top-2 duration-200">
              {/* Category */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('Category', 'الفئة')}</label>
                <select
                  value={filters.category}
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value as ListExperiencesCategory | '' }))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('All Categories', 'كل الفئات')}</option>
                  {EXPERIENCE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {lang === 'ar' ? cat.ar : cat.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('Price Range', 'نطاق السعر')}</label>
                <select
                  value={filters.priceRange}
                  onChange={e => setFilters(f => ({ ...f, priceRange: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PRICE_RANGES.map(pr => (
                    <option key={pr.value} value={pr.value}>
                      {lang === 'ar' ? pr.ar : pr.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('Min Rating', 'أدنى تقييم')}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[0, 4, 4.5, 4.8].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === r ? 0 : r }))}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        filters.minRating === r
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40'
                      )}
                    >
                      {r === 0 ? t('Any', 'أي') : <><Star className="w-2.5 h-2.5 fill-current" />{r}+</>}
                    </button>
                  ))}
                </div>
              </div>

              {/* City filter via select */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  <MapPin className="w-3.5 h-3.5 inline me-1" />
                  {t('City', 'المدينة')}
                </label>
                <select
                  value={cityFilter ?? ''}
                  onChange={e => setCityFilter(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('All Cities', 'كل المدن')}</option>
                  {(cities ?? []).map(city => (
                    <option key={city.id} value={city.id}>
                      {lang === 'ar' ? city.nameAr : city.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && !experiences.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">{t('Loading experiences…', 'جاري تحميل التجارب…')}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-muted-foreground text-sm font-medium">
                {experiences.length} {t('experiences found', 'تجربة متاحة')}
              </p>
            </div>

            {experiences.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t('No experiences found', 'لم نجد تجارب')}</h3>
                <p className="text-muted-foreground mb-6">{t('Try adjusting your filters.', 'جرب تغيير الفلاتر.')}</p>
                <Button variant="outline" onClick={clearFilters}>{t('Clear all filters', 'مسح الفلاتر')}</Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {experiences.map(exp => (
                  <ExperienceCard key={exp.id} experience={exp} layout="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {experiences.map(exp => (
                  <ExperienceCard key={exp.id} experience={exp} layout="list" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
