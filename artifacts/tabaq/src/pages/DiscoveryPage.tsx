import React, { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import {
  useListRestaurants,
  useListCategories,
  useListOccasions,
  useListCitiesByCountry,
} from '@workspace/api-client-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { Link, useLocation } from 'wouter';
import {
  SlidersHorizontal, MapPin, X, Star, Search, Trophy, Flame, Sparkles,
  Clock, Award, LayoutGrid, List, ChevronDown, CheckCircle2,
  ParkingSquare, Trees, Wifi, BadgeCheck, DoorOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type PriceTier = 'budget' | 'mid' | 'upscale' | 'fine_dining' | '';
type ViewMode = 'grid' | 'list';

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
const LIMIT = 12;

const SORT_OPTIONS = [
  { key: 'featured', icon: Sparkles, en: 'Featured', ar: 'مميز' },
  { key: 'top-rated', icon: Star, en: 'Top Rated', ar: 'الأعلى تقييماً' },
  { key: 'trending', icon: Flame, en: 'Trending', ar: 'شائع' },
  { key: 'newest', icon: Clock, en: 'Newest', ar: 'الأحدث' },
  { key: 'awards', icon: Award, en: 'Award Winners', ar: 'حائزو الجوائز' },
];

const PRICE_TIERS: { value: PriceTier; labelEn: string; labelAr: string; symbol: string }[] = [
  { value: 'budget', labelEn: 'Budget', labelAr: 'اقتصادي', symbol: '$' },
  { value: 'mid', labelEn: 'Mid-Range', labelAr: 'متوسط', symbol: '$$' },
  { value: 'upscale', labelEn: 'Upscale', labelAr: 'راقٍ', symbol: '$$$' },
  { value: 'fine_dining', labelEn: 'Fine Dining', labelAr: 'فاخر', symbol: '$$$$' },
];

const RATING_OPTIONS = [4.5, 4.0, 3.5, 3.0];

const AMENITIES = [
  { key: 'openNow' as const, icon: CheckCircle2, en: 'Open Now', ar: 'مفتوح الآن' },
  { key: 'hasParking' as const, icon: ParkingSquare, en: 'Parking', ar: 'مواقف سيارات' },
  { key: 'hasOutdoorSeating' as const, icon: Trees, en: 'Outdoor Seating', ar: 'جلسات خارجية' },
];

// ── Compact list-view card ─────────────────────────────────────────
function RestaurantListItem({ restaurant, lang }: { restaurant: any; lang: string }) {
  const fallback = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop';
  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <div className="flex gap-4 bg-white rounded-lg border border-gray-200 p-3.5 hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer">
        <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          <img
            src={restaurant.coverImageUrl || fallback}
            alt={lang === 'ar' ? restaurant.nameAr : restaurant.nameEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-primary transition-colors">
              {lang === 'ar' ? restaurant.nameAr : restaurant.nameEn}
            </h3>
            {restaurant.isOpen && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">
                {lang === 'ar' ? 'مفتوح' : 'Open'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {restaurant.avgRating && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-gray-900">{Number(restaurant.avgRating).toFixed(1)}</span>
                <span className="text-xs text-gray-400">({restaurant.reviewCount})</span>
              </div>
            )}
            {restaurant.priceTier && (
              <span className="text-xs text-gray-500">
                {PRICE_TIERS.find(p => p.value === restaurant.priceTier)?.symbol || ''}
              </span>
            )}
            {restaurant.isHalal && (
              <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <BadgeCheck className="w-3 h-3" /> {lang === 'ar' ? 'حلال' : 'Halal'}
              </span>
            )}
          </div>
          {restaurant.address && (
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> {restaurant.address}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar Section ────────────────────────────────────────────────
function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <button
        className="flex items-center justify-between w-full py-3 text-sm font-bold text-gray-900 hover:text-primary transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

export function DiscoveryPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    titleEn: 'Explore Restaurants | Tabaq',
    titleAr: 'استكشف المطاعم | طبق',
    descriptionEn: 'Browse and filter hundreds of restaurants across Saudi Arabia by cuisine, price, rating, and more.',
    descriptionAr: 'تصفح وفلتر مئات المطاعم عبر المملكة العربية السعودية حسب المطبخ والسعر والتقييم والمزيد.',
  }, lang);

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
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: categoriesData } = useListCategories();
  const { data: occasionsData } = useListOccasions();
  const { data: citiesData } = useListCitiesByCountry(SAUDI_COUNTRY_ID);
  const categories = categoriesData ?? [];
  const occasions = occasionsData ?? [];
  const cities = citiesData ?? [];

  const sortKeyMap: Record<string, string> = {
    'top-rated': 'topRated',
    'trending': 'trending',
    'newest': 'newest',
    'featured': 'featured',
    'mostReviewed': 'mostReviewed',
  };

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
  if (filters.sortBy && filters.sortBy !== 'awards') {
    apiFilters.sortBy = sortKeyMap[filters.sortBy] ?? filters.sortBy;
  }

  const { data, isLoading } = useListRestaurants(apiFilters as any, {
    query: { queryKey: ['restaurants', apiFilters] },
  });

  const topRatedFilters: Record<string, number | undefined> = {
    limit: 3,
    minRating: 4,
    ...(filters.cityId ? { cityId: filters.cityId } : {}),
  };
  const { data: topRatedData } = useListRestaurants(topRatedFilters as any, {
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

  const clearFilters = () => { setFilters({ priceTier: '', sortBy: 'featured' }); setPage(0); };
  const update = (patch: Partial<Filters>) => { setFilters(f => ({ ...f, ...patch })); setPage(0); };

  const selectedCity = cities.find(c => c.id === filters.cityId);
  const selectedCategory = categories.find(c => c.id === filters.categoryId);

  // Active filter chips for display
  const activeChips = [
    filters.openNow && { key: 'openNow', label: t('Open Now', 'مفتوح الآن'), clear: () => update({ openNow: undefined }) },
    filters.priceTier && { key: 'price', label: PRICE_TIERS.find(p => p.value === filters.priceTier)?.[lang === 'ar' ? 'labelAr' : 'labelEn'] ?? '', clear: () => update({ priceTier: '' }) },
    filters.minRating && { key: 'rating', label: `${filters.minRating}+ ★`, clear: () => update({ minRating: undefined }) },
    filters.categoryId && selectedCategory && { key: 'cat', label: lang === 'ar' ? selectedCategory.nameAr : selectedCategory.nameEn, clear: () => update({ categoryId: undefined }) },
    filters.cityId && selectedCity && { key: 'city', label: lang === 'ar' ? selectedCity.nameAr : selectedCity.nameEn, clear: () => update({ cityId: undefined }) },
    filters.hasParking && { key: 'parking', label: t('Parking', 'مواقف'), clear: () => update({ hasParking: undefined }) },
    filters.hasOutdoorSeating && { key: 'outdoor', label: t('Outdoor', 'خارجي'), clear: () => update({ hasOutdoorSeating: undefined }) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  // ── Sidebar content (shared between desktop + mobile drawer) ──────
  const SidebarContent = (
    <div className="space-y-0">
      {/* City */}
      <SidebarSection title={t('City', 'المدينة')}>
        <div className="space-y-1 pt-1">
          <button
            onClick={() => update({ cityId: undefined })}
            className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${!filters.cityId ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('All Cities', 'كل المدن')}
          </button>
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => update({ cityId: filters.cityId === city.id ? undefined : city.id })}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${filters.cityId === city.id ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{lang === 'ar' ? city.nameAr : city.nameEn}</span>
              {filters.cityId === city.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Cuisine */}
      <SidebarSection title={t('Cuisine', 'المطبخ')}>
        <div className="space-y-1 pt-1">
          <button
            onClick={() => update({ categoryId: undefined })}
            className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${!filters.categoryId ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('All Cuisines', 'كل المطابخ')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => update({ categoryId: filters.categoryId === cat.id ? undefined : cat.id })}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${filters.categoryId === cat.id ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
              {filters.categoryId === cat.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Price Range */}
      <SidebarSection title={t('Price Range', 'نطاق السعر')}>
        <div className="space-y-1 pt-1">
          {PRICE_TIERS.map(tier => (
            <button
              key={tier.value}
              onClick={() => update({ priceTier: filters.priceTier === tier.value ? '' : tier.value })}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${filters.priceTier === tier.value ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{lang === 'ar' ? tier.labelAr : tier.labelEn}</span>
              <span className={`text-xs font-mono ${filters.priceTier === tier.value ? 'text-primary' : 'text-gray-400'}`}>{tier.symbol}</span>
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Rating */}
      <SidebarSection title={t('Minimum Rating', 'الحد الأدنى للتقييم')}>
        <div className="space-y-1.5 pt-1">
          {RATING_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => update({ minRating: filters.minRating === r ? undefined : r })}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${filters.minRating === r ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-3 h-3 ${i <= Math.floor(r) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span>{r}+ {t('stars', 'نجوم')}</span>
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Amenities */}
      <SidebarSection title={t('Features', 'المميزات')}>
        <div className="space-y-1 pt-1">
          {AMENITIES.map(opt => (
            <button
              key={opt.key}
              onClick={() => update({ [opt.key]: !filters[opt.key] || undefined } as any)}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${filters[opt.key] ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <opt.icon className="w-4 h-4 shrink-0" />
              <span>{lang === 'ar' ? opt.ar : opt.en}</span>
              {filters[opt.key] && <CheckCircle2 className="w-3.5 h-3.5 ms-auto text-primary" />}
            </button>
          ))}
        </div>
      </SidebarSection>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full mt-3 py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          {t('Clear All Filters', 'مسح الفلاتر')}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className={`absolute top-0 bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-72 bg-white overflow-y-auto shadow-2xl`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">{t('Filters', 'الفلاتر')}</h3>
              <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">{SidebarContent}</div>
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('Restaurants', 'المطاعم')}
                {selectedCity && <span className="text-primary ms-2">{lang === 'ar' ? selectedCity.nameAr : selectedCity.nameEn}</span>}
              </h1>
              {!isLoading && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {total.toLocaleString()} {t('places to eat', 'مكان لتناول الطعام')}
                </p>
              )}
            </div>
            {/* City quick selector */}
            {cities.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <select
                  value={filters.cityId ?? ''}
                  onChange={e => update({ cityId: e.target.value ? Number(e.target.value) : undefined })}
                  className="border-0 bg-transparent font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="">{t('All Cities', 'كل المدن')}</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{lang === 'ar' ? city.nameAr : city.nameEn}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {/* Open Now */}
            <button
              onClick={() => update({ openNow: !filters.openNow || undefined })}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border shrink-0 transition-all ${
                filters.openNow
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filters.openNow ? 'bg-white animate-pulse' : 'bg-emerald-400'}`} />
              {t('Open Now', 'مفتوح الآن')}
            </button>

            <div className="w-px h-6 bg-gray-200 shrink-0" />

            {SORT_OPTIONS.map(sort => {
              const Icon = sort.icon;
              const isActive = filters.sortBy === sort.key || (sort.key === 'awards' && filters.minRating === 4.5);
              return (
                <button
                  key={sort.key}
                  onClick={() => {
                    if (sort.key === 'awards') {
                      update({ minRating: filters.minRating === 4.5 ? undefined : 4.5, sortBy: 'featured' });
                    } else {
                      update({ sortBy: sort.key, minRating: undefined });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border shrink-0 transition-all ${
                    isActive
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {lang === 'ar' ? sort.ar : sort.en}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── OCCASION QUICK FILTER ── */}
      {occasions.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex gap-2 overflow-x-auto pb-0.5 hide-scrollbar">
              <button
                onClick={() => update({ occasionId: undefined })}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-all shrink-0 ${
                  !filters.occasionId ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary bg-white'
                }`}
              >
                {t('All', 'الكل')}
              </button>
              {occasions.map(occ => (
                <button
                  key={occ.id}
                  onClick={() => update({ occasionId: filters.occasionId === occ.id ? undefined : occ.id })}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-all shrink-0 ${
                    filters.occasionId === occ.id
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary bg-white'
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

      {/* ── MAIN TWO-COLUMN LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-gray-900">{t('Filters', 'الفلاتر')}</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {SidebarContent}
            </div>
          </aside>

          {/* ── RIGHT CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar row */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-primary/40 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('Filters', 'فلتر')}
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Active filter chips */}
                {activeChips.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {activeChips.map(chip => (
                      <span
                        key={chip.key}
                        className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20 shrink-0 cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={chip.clear}
                      >
                        {chip.label}
                        <X className="w-3 h-3" />
                      </span>
                    ))}
                    {activeFilterCount > 1 && (
                      <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 font-medium shrink-0 px-1 transition-colors">
                        {t('Clear all', 'مسح الكل')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* View toggle + count */}
              <div className="flex items-center gap-3">
                {!isLoading && (
                  <p className="text-sm text-gray-500 hidden sm:block">
                    {total.toLocaleString()} {t('results', 'نتيجة')}
                  </p>
                )}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Top-Rated Banner (shown only on no-filter featured state) ── */}
            {!activeFilterCount && filters.sortBy === 'featured' && topRatedData && topRatedData.restaurants.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-gray-900">{t('Top-Rated Venues', 'الأماكن الأعلى تقييماً')}</h2>
                    <span className="text-xs text-gray-400">{t('4.0+ rated', '4.0+ تقييم')}</span>
                  </div>
                  <Link href="/restaurants?minRating=4" className="text-xs text-primary font-medium hover:underline">{t('See all →', 'عرض الكل ←')}</Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {topRatedData.restaurants.map((rest, idx) => {
                    const MEDAL = ['🥇', '🥈', '🥉'];
                    return (
                      <Link key={rest.id} href={`/restaurants/${rest.id}`}>
                        <div className="relative rounded-lg overflow-hidden h-44 group cursor-pointer border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all">
                          <img
                            src={rest.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'}
                            alt={lang === 'ar' ? rest.nameAr : rest.nameEn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                          <div className="absolute top-2.5 start-2.5 text-xl">{MEDAL[idx]}</div>
                          <div className="absolute bottom-0 p-3">
                            <p className="text-white font-bold text-sm leading-tight truncate">{lang === 'ar' ? rest.nameAr : rest.nameEn}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-white text-xs font-semibold">{Number(rest.avgRating).toFixed(1)}</span>
                              <span className="text-white/60 text-xs">({rest.reviewCount})</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── RESTAURANT RESULTS ── */}
            {isLoading ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-64 bg-white border border-gray-200 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white border border-gray-200 animate-pulse rounded-lg" />
                  ))}
                </div>
              )
            ) : restaurants.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {restaurants.map(rest => (
                      <RestaurantCard key={rest.id} restaurant={rest} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {restaurants.map(rest => (
                      <RestaurantListItem key={rest.id} restaurant={rest} lang={lang} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {total > LIMIT && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={page === 0}
                      className="border-gray-200"
                    >
                      {t('Previous', 'السابق')}
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(total / LIMIT)) }).map((_, i) => {
                        const pageNum = Math.max(0, page - 2) + i;
                        if (pageNum >= Math.ceil(total / LIMIT)) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${pageNum === page ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={(page + 1) * LIMIT >= total}
                      className="border-gray-200"
                    >
                      {t('Next', 'التالي')}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 py-20 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('No restaurants found', 'لم نجد مطاعم')}</h3>
                <p className="text-gray-500 text-sm mb-5">{t('Try adjusting your filters.', 'جرب تغيير الفلاتر.')}</p>
                <Button variant="outline" size="sm" onClick={clearFilters}>{t('Clear all filters', 'مسح الفلاتر')}</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
