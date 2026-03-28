import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useSearch } from '@workspace/api-client-react';
import { Search, Loader2 } from 'lucide-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { DishCard } from '@/components/DishCard';

export function SearchPage() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = params.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(handler);
  }, [query]);

  const { data, isLoading } = useSearch({ q: debouncedQuery, type: 'all' }, { query: { enabled: debouncedQuery.length > 2 } });

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="relative mb-12">
          <Search className="absolute start-6 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('Search restaurants, dishes...', 'ابحث عن المطاعم، الأطباق...')}
            className="w-full h-16 bg-card border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-full ps-16 pe-6 text-xl font-medium shadow-sm transition-all"
          />
          {isLoading && <Loader2 className="absolute end-6 top-1/2 -translate-y-1/2 text-primary w-6 h-6 animate-spin" />}
        </div>

        {debouncedQuery.length <= 2 ? (
          <div className="text-center text-muted-foreground py-20 text-lg">
            {t('Type at least 3 characters to search.', 'اكتب 3 أحرف على الأقل للبحث.')}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Restaurants */}
            {data?.restaurants && data.restaurants.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  {t('Restaurants', 'المطاعم')} 
                  <span className="bg-secondary text-secondary-foreground text-sm px-2 py-0.5 rounded-md">{data.totalRestaurants}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.restaurants.map(rest => <RestaurantCard key={rest.id} restaurant={rest} />)}
                </div>
              </section>
            )}

            {/* Dishes */}
            {data?.dishes && data.dishes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  {t('Dishes', 'الأطباق')}
                  <span className="bg-secondary text-secondary-foreground text-sm px-2 py-0.5 rounded-md">{data.totalDishes}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.dishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                </div>
              </section>
            )}

            {!isLoading && (!data?.restaurants?.length && !data?.dishes?.length) && (
              <div className="text-center text-muted-foreground py-20 text-lg">
                {t('No results found for', 'لم يتم العثور على نتائج لـ')} "{debouncedQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
