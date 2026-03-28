import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListRestaurants } from '@workspace/api-client-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { Filter, SlidersHorizontal, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DiscoveryPage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ cityId: 1, limit: 12 });
  
  const { data, isLoading } = useListRestaurants(filters);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-card border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('Explore Restaurants', 'استكشف المطاعم')}
          </h1>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="secondary" className="gap-2 rounded-full">
              <MapPin className="w-4 h-4 text-primary" />
              {t('Riyadh', 'الرياض')}
            </Button>
            <Button variant="outline" className="gap-2 rounded-full">
              <SlidersHorizontal className="w-4 h-4" />
              {t('Cuisine', 'نوع الطعام')}
            </Button>
            <Button variant="outline" className="gap-2 rounded-full">
              <Filter className="w-4 h-4" />
              {t('Filters', 'تصنيفات')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground font-medium">
            {isLoading ? t('Searching...', 'جاري البحث...') : `${data?.total || 0} ${t('restaurants found', 'مطعم وجدنا')}`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-72 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.restaurants?.map(rest => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
            {!data?.restaurants?.length && (
              <div className="col-span-full py-20 text-center">
                <p className="text-xl text-muted-foreground">{t('No restaurants found.', 'لم يتم العثور على مطاعم.')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
