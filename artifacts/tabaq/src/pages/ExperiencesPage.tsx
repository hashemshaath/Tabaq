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

const MOCK_EXPERIENCES = [
  {
    id: 1,
    titleEn: "Chef's Table at Nobu Riyadh",
    titleAr: "طاولة الشيف في نوبو الرياض",
    category: ListExperiencesCategory.fine_dining,
    pricePerPerson: 850,
    currency: "SAR",
    durationMinutes: 180,
    capacity: 8,
    avgRating: 4.9,
    reviewCount: 34,
    cityNameEn: "Riyadh",
    cityNameAr: "الرياض",
    hostNameEn: "Chef Nobu Matsuhisa",
    hostNameAr: "الشيف نوبو ماتسوهيسا",
    restaurantId: 1,
    cityId: 1,
    images: [{ url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop", isPrimary: true }],
  },
  {
    id: 2,
    titleEn: "Old Riyadh Street Food Walk",
    titleAr: "جولة طعام الشارع في الرياض القديمة",
    category: ListExperiencesCategory.street_food,
    pricePerPerson: 120,
    currency: "SAR",
    durationMinutes: 150,
    capacity: 15,
    avgRating: 4.7,
    reviewCount: 81,
    cityNameEn: "Riyadh",
    cityNameAr: "الرياض",
    hostNameEn: "Abdullah Al-Rashidi",
    hostNameAr: "عبدالله الراشدي",
    restaurantId: 2,
    cityId: 1,
    images: [{ url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop", isPrimary: true }],
  },
  {
    id: 3,
    titleEn: "Saudi Heritage Cooking Masterclass",
    titleAr: "دورة الطبخ السعودي التراثي",
    category: ListExperiencesCategory.cooking_class,
    pricePerPerson: 350,
    currency: "SAR",
    durationMinutes: 240,
    capacity: 10,
    avgRating: 4.8,
    reviewCount: 57,
    cityNameEn: "Riyadh",
    cityNameAr: "الرياض",
    hostNameEn: "Umm Khalid",
    hostNameAr: "أم خالد",
    restaurantId: 3,
    cityId: 1,
    images: [{ url: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=400&fit=crop", isPrimary: true }],
  },
  {
    id: 4,
    titleEn: "Jeddah Seafood & Souq Discovery",
    titleAr: "اكتشاف المأكولات البحرية وسوق جدة",
    category: ListExperiencesCategory.cultural,
    pricePerPerson: 220,
    currency: "SAR",
    durationMinutes: 180,
    capacity: 12,
    avgRating: 4.6,
    reviewCount: 43,
    cityNameEn: "Jeddah",
    cityNameAr: "جدة",
    hostNameEn: "Fatimah Al-Harbi",
    hostNameAr: "فاطمة الحربي",
    restaurantId: 4,
    cityId: 2,
    images: [{ url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop", isPrimary: true }],
  },
  {
    id: 5,
    titleEn: "Al-Ula Desert Dining Under the Stars",
    titleAr: "عشاء في صحراء العُلا تحت النجوم",
    category: ListExperiencesCategory.outdoor,
    pricePerPerson: 650,
    currency: "SAR",
    durationMinutes: 210,
    capacity: 20,
    avgRating: 5.0,
    reviewCount: 18,
    cityNameEn: "Al Ula",
    cityNameAr: "العُلا",
    hostNameEn: "Tabaq Experiences",
    hostNameAr: "تجارب طبق",
    restaurantId: 5,
    cityId: 5,
    images: [{ url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop", isPrimary: true }],
  },
  {
    id: 6,
    titleEn: "Madinah Date & Honey Tasting",
    titleAr: "تذوق التمور والعسل في المدينة المنورة",
    category: ListExperiencesCategory.tasting,
    pricePerPerson: 180,
    currency: "SAR",
    durationMinutes: 120,
    capacity: 16,
    avgRating: 4.5,
    reviewCount: 29,
    cityNameEn: "Madinah",
    cityNameAr: "المدينة المنورة",
    hostNameEn: "Sheikh Hamad Dates",
    hostNameAr: "تمور الشيخ حمد",
    restaurantId: 6,
    cityId: 3,
    images: [{ url: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&h=400&fit=crop", isPrimary: true }],
  },
  {
    id: 7,
    titleEn: "Lucine Private Armenian Dinner",
    titleAr: "عشاء أرمني خاص في لوسين",
    category: ListExperiencesCategory.fine_dining,
    pricePerPerson: 490,
    currency: "SAR",
    durationMinutes: 150,
    capacity: 6,
    avgRating: 4.9,
    reviewCount: 22,
    cityNameEn: "Riyadh",
    cityNameAr: "الرياض",
    hostNameEn: "Chef Haig Krikorian",
    hostNameAr: "الشيف هايغ كريكوريان",
    restaurantId: 7,
    cityId: 1,
    images: [{ url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&h=400&fit=crop", isPrimary: true }],
  },
  {
    id: 8,
    titleEn: "Riyadh Brunch Collective",
    titleAr: "برانش الرياض الجماعي",
    category: ListExperiencesCategory.brunch,
    pricePerPerson: 280,
    currency: "SAR",
    durationMinutes: 180,
    capacity: 30,
    avgRating: 4.4,
    reviewCount: 67,
    cityNameEn: "Riyadh",
    cityNameAr: "الرياض",
    hostNameEn: "Tabaq Experiences",
    hostNameAr: "تجارب طبق",
    restaurantId: 8,
    cityId: 1,
    images: [{ url: "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&h=400&fit=crop", isPrimary: true }],
  },
] as any[];

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
    const list = listData?.experiences?.length ? listData.experiences : MOCK_EXPERIENCES;
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
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium text-xs tracking-[0.05em] uppercase">{t('Curated Experiences', 'تجارب مختارة')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('Food Experiences', 'تجارب الطعام')}
          </h1>
          <p className="text-muted-foreground text-sm mb-6 max-w-xl">
            {t(
              'Immersive culinary journeys — from private chef dinners to hands-on cooking classes across Saudi Arabia.',
              'رحلات طهي غامرة — من عشاءات الشيف الخاصة إلى دروس الطبخ التفاعلية في جميع أنحاء المملكة.'
            )}
          </p>

          {/* Search bar */}
          <div className="flex items-center max-w-lg bg-background border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="flex-1 flex items-center gap-2 px-4">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('Search experiences…', 'ابحث عن تجربة…')}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm py-3"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sort Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 hide-scrollbar">
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
          </div>

          {/* Filter controls row */}
          <div className="flex flex-wrap gap-2 items-center mt-3">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(v => !v)}
              className="gap-2 rounded-full"
              size="sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('Filters', 'تصنيفات')}
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
