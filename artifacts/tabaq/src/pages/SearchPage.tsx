import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import {
  useSearch,
  useAutocomplete,
  useListRestaurants,
  type AutocompleteSuggestion,
  AutocompleteSuggestionType,
} from '@workspace/api-client-react';
import {
  Search, Loader2, Utensils, MapPin, X, Building2, ChefHat,
  Clock, TrendingUp, Star, ArrowRight, Flame, Sparkles, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { DishCard } from '@/components/DishCard';

type SearchTab = 'all' | 'restaurants' | 'dishes';

const TRENDING_SEARCHES = [
  { en: 'Wagyu steak', ar: 'ستيك واغيو' },
  { en: 'Sushi Riyadh', ar: 'سوشي الرياض' },
  { en: 'Family dining', ar: 'عشاء عائلي' },
  { en: 'Rooftop restaurants', ar: 'مطاعم الروفتوب' },
  { en: 'Brunch spots', ar: 'أماكن البرانش' },
  { en: 'Fine dining', ar: 'مطاعم فاخرة' },
  { en: 'Halal Japanese', ar: 'ياباني حلال' },
  { en: 'Late night eats', ar: 'أكل في وقت متأخر' },
];

const QUICK_CUISINES = [
  { icon: '🥩', en: 'Grills', ar: 'مشويات', q: 'grills' },
  { icon: '🍣', en: 'Sushi', ar: 'سوشي', q: 'sushi' },
  { icon: '🍕', en: 'Pizza', ar: 'بيتزا', q: 'pizza' },
  { icon: '🥗', en: 'Healthy', ar: 'صحي', q: 'healthy' },
  { icon: '🍔', en: 'Burgers', ar: 'برغر', q: 'burgers' },
  { icon: '🥘', en: 'Levantine', ar: 'شامي', q: 'levantine' },
  { icon: '🍜', en: 'Asian', ar: 'آسيوي', q: 'asian' },
  { icon: '🥙', en: 'Saudi', ar: 'سعودي', q: 'saudi' },
  { icon: '🍝', en: 'Italian', ar: 'إيطالي', q: 'italian' },
  { icon: '🍛', en: 'Indian', ar: 'هندي', q: 'indian' },
];

const OCCASION_SEARCHES = [
  { icon: '💑', en: 'Romantic Dinner', ar: 'عشاء رومانسي', q: 'romantic' },
  { icon: '👨‍👩‍👧‍👦', en: 'Family Gathering', ar: 'تجمع عائلي', q: 'family' },
  { icon: '🎂', en: 'Birthday Party', ar: 'حفل عيد ميلاد', q: 'birthday' },
  { icon: '💼', en: 'Business Lunch', ar: 'غداء عمل', q: 'business' },
];

const RECENT_KEY = 'tabaq_recent_searches';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function addRecent(q: string) {
  try {
    const prev = getRecent().filter(r => r !== q).slice(0, 7);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev]));
  } catch {}
}
function clearRecent() {
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

export function SearchPage() {
  const [location, setLocation] = useLocation();
  const { t, lang } = useLanguage();
  usePageMeta({
    titleEn: 'Search Restaurants & Dishes | Tabaq',
    titleAr: 'بحث في المطاعم والأطباق | طبق',
    descriptionEn: 'Search for restaurants, dishes, and food experiences across Saudi Arabia.',
    descriptionAr: 'ابحث عن المطاعم والأطباق وتجارب الطعام في المملكة العربية السعودية.',
  }, lang);
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecent());
  const [showFilters, setShowFilters] = useState(false);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState('');
  const [filterPriceRange, setFilterPriceRange] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: searchData, isLoading } = useSearch(
    { q: debouncedQuery, type: activeTab === 'all' ? 'all' : activeTab },
    { query: { enabled: debouncedQuery.length > 2, queryKey: ['search', debouncedQuery, activeTab] } }
  );

  const { data: autocompleteData } = useAutocomplete(
    { q: query },
    { query: { enabled: query.length > 1 && showAutocomplete, queryKey: ['autocomplete', query] } }
  );

  const { data: featuredData } = useListRestaurants(
    { limit: 6 },
    { query: { queryKey: ['restaurants', 'top', 6] } }
  );

  const suggestions = autocompleteData?.suggestions || [];

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    setShowAutocomplete(false);
    if (suggestion.type === AutocompleteSuggestionType.restaurant) {
      setLocation(`/restaurants/${suggestion.id}`);
    } else if (suggestion.type === AutocompleteSuggestionType.dish) {
      setLocation(`/dishes/${suggestion.id}`);
    } else if (suggestion.type === AutocompleteSuggestionType.category) {
      setLocation(`/restaurants?categoryId=${suggestion.id}`);
    } else if (suggestion.type === AutocompleteSuggestionType.city) {
      setQuery(suggestion.labelEn);
      setDebouncedQuery(suggestion.labelEn);
    }
  };

  const handleSearch = (q: string) => {
    if (q.trim().length < 1) return;
    addRecent(q.trim());
    setRecentSearches(getRecent());
    setQuery(q);
    setDebouncedQuery(q);
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  const tabs: { id: SearchTab; labelEn: string; labelAr: string }[] = [
    { id: 'all', labelEn: 'All', labelAr: 'الكل' },
    { id: 'restaurants', labelEn: 'Restaurants', labelAr: 'المطاعم' },
    { id: 'dishes', labelEn: 'Dishes', labelAr: 'الأطباق' },
  ];

  const allRestaurants = searchData?.restaurants || [];
  const allDishes = searchData?.dishes || [];

  const activeFilterCount = (filterRating > 0 ? 1 : 0) + (filterOpenNow ? 1 : 0) + (filterCuisine ? 1 : 0) + (filterPriceRange ? 1 : 0);

  const restaurantsToShow = allRestaurants.filter((r: any) => {
    if (filterRating > 0 && Number(r.avgRating ?? r.rating ?? 0) < filterRating) return false;
    if (filterPriceRange && r.priceTier !== filterPriceRange) return false;
    if (filterOpenNow && r.isOpen === false) return false;
    if (filterCuisine) {
      const cuisines = (r.cuisineTypes || []).map((c: string) => c.toLowerCase());
      if (!cuisines.some((c: string) => c.includes(filterCuisine.toLowerCase()))) return false;
    }
    return true;
  });
  const dishesToShow = allDishes.filter((d: any) => {
    if (filterRating > 0 && Number(d.avgRating ?? 0) < filterRating) return false;
    return true;
  });
  const hasResults = restaurantsToShow.length > 0 || dishesToShow.length > 0;
  const hasQuery = debouncedQuery.length > 2;

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sticky Search Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative">
            <Search className="absolute start-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 z-10 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowAutocomplete(true); }}
              onFocus={() => setShowAutocomplete(true)}
              placeholder={t('Search restaurants, dishes, cuisines...', 'ابحث عن مطاعم، أطباق، مطابخ...')}
              className="w-full h-14 bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl ps-14 pe-12 text-base font-medium transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setDebouncedQuery(''); setShowAutocomplete(false); }}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Autocomplete Dropdown */}
            {showAutocomplete && suggestions.length > 0 && query.length > 1 && (
              <div
                ref={autocompleteRef}
                className="absolute top-full start-0 end-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                {suggestions.map((s: AutocompleteSuggestion, idx: number) => {
                  const label = lang === 'ar' ? s.labelAr : s.labelEn;
                  const Icon = s.type === AutocompleteSuggestionType.restaurant ? Building2
                    : s.type === AutocompleteSuggestionType.dish ? Utensils
                    : s.type === AutocompleteSuggestionType.category ? ChefHat
                    : MapPin;
                  const typeLabel = s.type === AutocompleteSuggestionType.restaurant ? t('Restaurant', 'مطعم')
                    : s.type === AutocompleteSuggestionType.dish ? t('Dish', 'طبق')
                    : s.type === AutocompleteSuggestionType.category ? t('Cuisine', 'مطبخ')
                    : t('City', 'مدينة');
                  return (
                    <button
                      key={`${s.type}-${s.id}-${idx}`}
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-start hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                      onClick={() => handleSuggestionClick(s)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{label}</p>
                        <p className="text-xs text-muted-foreground">{typeLabel}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Result tabs + filter toggle */}
          {hasQuery && (
            <div className="flex items-center gap-2 mt-3 border-b border-border">
              <div className="flex flex-1 gap-0">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  >
                    {lang === 'ar' ? tab.labelAr : tab.labelEn}
                    {tab.id === 'restaurants' && restaurantsToShow.length > 0 && (
                      <span className="ms-2 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">{restaurantsToShow.length}</span>
                    )}
                    {tab.id === 'dishes' && dishesToShow.length > 0 && (
                      <span className="ms-2 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">{dishesToShow.length}</span>
                    )}
                  </button>
                ))}
              </div>
              {(activeTab === 'all' || activeTab === 'restaurants') && (
                <button
                  onClick={() => setShowFilters(f => !f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 mb-1 rounded-xl text-sm font-medium transition-all border ${showFilters || activeFilterCount > 0 ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary hover:text-primary'}`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {t('Filters', 'فلاتر')}
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white/30 text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}

          {/* ── Filter panel ── */}
          {hasQuery && showFilters && (activeTab === 'all' || activeTab === 'restaurants') && (
            <div className="mt-3 p-4 bg-card border border-border rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Rating */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('Min Rating', 'أدنى تقييم')}</p>
                <div className="flex flex-wrap gap-2">
                  {([0, 3.5, 4, 4.5] as number[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterRating(r)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterRating === r ? 'bg-primary text-white border-primary' : 'bg-secondary text-foreground border-border hover:border-primary'}`}
                    >
                      {r === 0 ? t('Any', 'الكل') : <><Star className="w-3 h-3" /> {r}+</>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('Price Range', 'نطاق السعر')}</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { v: '', label: t('Any', 'الكل') },
                    { v: 'budget', label: t('Budget ($)', 'اقتصادي') },
                    { v: 'mid', label: t('Mid-range ($$)', 'متوسط') },
                    { v: 'upscale', label: t('Upscale ($$$)', 'راقي') },
                    { v: 'fine_dining', label: t('Fine Dining ($$$$)', 'فاخر') },
                  ] as { v: string; label: string }[]).map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setFilterPriceRange(v)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterPriceRange === v ? 'bg-primary text-white border-primary' : 'bg-secondary text-foreground border-border hover:border-primary'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisine type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('Cuisine', 'المطبخ')}</p>
                <div className="flex flex-wrap gap-2">
                  {(['', 'Saudi', 'Japanese', 'Mediterranean', 'Levantine', 'Indian', 'Cafe & Bakery'] as string[]).map(c => (
                    <button
                      key={c || 'any'}
                      onClick={() => setFilterCuisine(c)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterCuisine === c ? 'bg-primary text-white border-primary' : 'bg-secondary text-foreground border-border hover:border-primary'}`}
                    >
                      {c === '' ? t('Any', 'الكل') : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Now toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('Open Now', 'مفتوح الآن')}</p>
                <button
                  onClick={() => setFilterOpenNow(v => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${filterOpenNow ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${filterOpenNow ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Active filter chips + reset */}
              {activeFilterCount > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground">{restaurantsToShow.length} {t('restaurants match', 'مطعم مطابق')}</p>
                  <button
                    onClick={() => { setFilterRating(0); setFilterOpenNow(false); setFilterCuisine(''); setFilterPriceRange(''); }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    {t('Clear all', 'مسح الكل')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* ── PRE-SEARCH STATE ── */}
        {!hasQuery && (
          <div className="space-y-10">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-foreground flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {t('Recent Searches', 'عمليات البحث الأخيرة')}
                  </h2>
                  <button
                    onClick={() => { clearRecent(); setRecentSearches([]); }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
                  >
                    {t('Clear all', 'مسح الكل')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(r => (
                    <button
                      key={r}
                      onClick={() => handleSearch(r)}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-2xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Quick cuisine chips */}
            <section>
              <h2 className="font-bold text-foreground flex items-center gap-2 mb-4 text-base">
                <ChefHat className="w-4 h-4 text-primary" />
                {t('Browse by Cuisine', 'تصفح حسب المطبخ')}
              </h2>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {QUICK_CUISINES.map(c => (
                  <button
                    key={c.q}
                    onClick={() => handleSearch(lang === 'ar' ? c.ar : c.en)}
                    className="flex flex-col items-center gap-1.5 p-3 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{c.icon}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors text-center leading-tight">
                      {lang === 'ar' ? c.ar : c.en}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Occasion searches */}
            <section>
              <h2 className="font-bold text-foreground flex items-center gap-2 mb-4 text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                {t('What\'s the occasion?', 'ما المناسبة؟')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {OCCASION_SEARCHES.map(o => (
                  <button
                    key={o.q}
                    onClick={() => handleSearch(lang === 'ar' ? o.ar : o.en)}
                    className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group text-start"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">{o.icon}</span>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {lang === 'ar' ? o.ar : o.en}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Trending searches */}
            <section>
              <h2 className="font-bold text-foreground flex items-center gap-2 mb-4 text-base">
                <Flame className="w-4 h-4 text-orange-500" />
                {t('Trending Now', 'الأكثر بحثاً الآن')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(lang === 'ar' ? s.ar : s.en)}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-2xl text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    {lang === 'ar' ? s.ar : s.en}
                  </button>
                ))}
              </div>
            </section>

            {/* Top-rated restaurants */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground flex items-center gap-2 text-base">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {t('Top Rated Restaurants', 'أعلى المطاعم تقييماً')}
                </h2>
                <Link href="/restaurants?sort=rating">
                  <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    {t('See all', 'عرض الكل')} <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              {featuredData?.restaurants && featuredData.restaurants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(featuredData.restaurants as any[]).slice(0, 4).map((rest: any) => (
                    <Link key={rest.id} href={`/restaurants/${rest.id}`}>
                      <div className="flex gap-3 p-3.5 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                          <img
                            src={rest.coverImageUrl || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop'}
                            alt={lang === 'ar' ? rest.nameAr : rest.nameEn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                            {lang === 'ar' ? rest.nameAr : rest.nameEn}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{rest.address}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold">{Number(rest.avgRating)?.toFixed(1) || '—'}</span>
                            </div>
                            {rest.isHalal && (
                              <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md font-medium">{t('Halal', 'حلال')}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 self-center" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-3 p-3.5 bg-card border border-border rounded-2xl animate-pulse">
                      <div className="w-16 h-16 rounded-xl bg-muted shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2.5 bg-muted rounded w-1/2" />
                        <div className="h-2.5 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Discovery CTA */}
            <div className="bg-gradient-to-br from-primary to-violet-700 rounded-3xl p-6 flex items-center gap-5">
              <div className="flex-1 text-white">
                <p className="font-extrabold text-xl mb-1">{t('Explore all restaurants', 'استكشف جميع المطاعم')}</p>
                <p className="text-white/75 text-sm">{t('Browse, filter, and discover your next favourite meal.', 'تصفح وصفّ واكتشف وجبتك المفضلة القادمة.')}</p>
              </div>
              <Link href="/restaurants">
                <button className="bg-white text-primary font-bold px-5 py-3 rounded-2xl text-sm hover:bg-white/90 transition-colors whitespace-nowrap shrink-0">
                  {t('Browse All', 'تصفح الكل')}
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── RESULTS STATE ── */}
        {hasQuery && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : hasResults ? (
              <div className="space-y-12">
                {restaurantsToShow.length > 0 && (activeTab === 'all' || activeTab === 'restaurants') && (
                  <section>
                    <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      {t('Restaurants', 'المطاعم')}
                      <span className="bg-secondary text-secondary-foreground text-sm px-2 py-0.5 rounded-md font-medium">{searchData?.totalRestaurants}</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {restaurantsToShow.map(rest => (
                        <RestaurantCard key={rest.id} restaurant={rest} />
                      ))}
                    </div>
                  </section>
                )}

                {dishesToShow.length > 0 && (activeTab === 'all' || activeTab === 'dishes') && (
                  <section>
                    <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-primary" />
                      {t('Dishes', 'الأطباق')}
                      <span className="bg-secondary text-secondary-foreground text-sm px-2 py-0.5 rounded-md font-medium">{searchData?.totalDishes}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dishesToShow.map(dish => (
                        <DishCard key={dish.id} dish={dish} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t('No results found', 'لا توجد نتائج')}</h3>
                <p className="text-muted-foreground mb-8">
                  {t('No results found for', 'لم نجد نتائج لـ')} "<span className="font-semibold">{debouncedQuery}</span>"
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {TRENDING_SEARCHES.slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(lang === 'ar' ? s.ar : s.en)}
                      className="px-4 py-2 bg-secondary rounded-2xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {lang === 'ar' ? s.ar : s.en}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
