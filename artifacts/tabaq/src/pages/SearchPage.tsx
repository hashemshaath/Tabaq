import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useSearch, useAutocomplete } from '@workspace/api-client-react';
import { Search, Loader2, Utensils, MapPin, X, Building2 } from 'lucide-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { DishCard } from '@/components/DishCard';

type SearchTab = 'all' | 'restaurants' | 'dishes';

export function SearchPage() {
  const [location, setLocation] = useLocation();
  const { t, lang } = useLanguage();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = params.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
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

  const suggestions = autocompleteData?.suggestions || [];

  const handleSuggestionClick = (suggestion: { type: string; id: number; labelEn: string }) => {
    setShowAutocomplete(false);
    if (suggestion.type === 'restaurant') setLocation(`/restaurants/${suggestion.id}`);
    else if (suggestion.type === 'dish') setLocation(`/dishes/${suggestion.id}`);
    else if (suggestion.type === 'city') {
      setQuery(suggestion.labelEn);
      setDebouncedQuery(suggestion.labelEn);
    }
  };

  const tabs: { id: SearchTab; labelEn: string; labelAr: string }[] = [
    { id: 'all', labelEn: 'All', labelAr: 'الكل' },
    { id: 'restaurants', labelEn: 'Restaurants', labelAr: 'المطاعم' },
    { id: 'dishes', labelEn: 'Dishes', labelAr: 'الأطباق' },
  ];

  const restaurantsToShow = searchData?.restaurants || [];
  const dishesToShow = searchData?.dishes || [];
  const hasResults = restaurantsToShow.length > 0 || dishesToShow.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative">
            <Search className="absolute start-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowAutocomplete(true); }}
              onFocus={() => setShowAutocomplete(true)}
              placeholder={t('Search restaurants, dishes, cuisines...', 'ابحث عن مطاعم، أطباق، مطابخ...')}
              className="w-full h-14 bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl ps-14 pe-12 text-lg font-medium transition-all"
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
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                {suggestions.map((s: any, idx: number) => {
                  const label = lang === 'ar' ? s.labelAr : s.labelEn;
                  const Icon = s.type === 'restaurant' ? Building2 : s.type === 'dish' ? Utensils : MapPin;
                  const typeLabel = s.type === 'restaurant' ? t('Restaurant', 'مطعم') : s.type === 'dish' ? t('Dish', 'طبق') : t('City', 'مدينة');
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

          {/* Tabs */}
          {debouncedQuery.length > 2 && (
            <div className="flex gap-0 mt-3 border-b border-border">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang === 'ar' ? tab.labelAr : tab.labelEn}
                  {tab.id === 'restaurants' && searchData?.totalRestaurants != null && (
                    <span className="ms-2 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">
                      {searchData.totalRestaurants}
                    </span>
                  )}
                  {tab.id === 'dishes' && searchData?.totalDishes != null && (
                    <span className="ms-2 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">
                      {searchData.totalDishes}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {debouncedQuery.length <= 2 ? (
          <div className="text-center py-24">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-5" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('Search for anything', 'ابحث عن أي شيء')}</h2>
            <p className="text-muted-foreground">{t('Type at least 3 characters to search for restaurants, dishes, and more.', 'اكتب 3 أحرف على الأقل للبحث عن المطاعم والأطباق.')}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : hasResults ? (
          <div className="space-y-12">
            {/* Restaurants Results */}
            {restaurantsToShow.length > 0 && (activeTab === 'all' || activeTab === 'restaurants') && (
              <section>
                <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {t('Restaurants', 'المطاعم')}
                  <span className="bg-secondary text-secondary-foreground text-sm px-2 py-0.5 rounded-md font-medium">
                    {searchData?.totalRestaurants}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {restaurantsToShow.map(rest => (
                    <RestaurantCard key={rest.id} restaurant={rest} />
                  ))}
                </div>
              </section>
            )}

            {/* Dishes Results */}
            {dishesToShow.length > 0 && (activeTab === 'all' || activeTab === 'dishes') && (
              <section>
                <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  {t('Dishes', 'الأطباق')}
                  <span className="bg-secondary text-secondary-foreground text-sm px-2 py-0.5 rounded-md font-medium">
                    {searchData?.totalDishes}
                  </span>
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
            <p className="text-muted-foreground">
              {t('No results found for', 'لم نجد نتائج لـ')} "<span className="font-semibold">{debouncedQuery}</span>"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
