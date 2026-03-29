import React from 'react';
import { Link } from 'wouter';
import { Star, MapPin, CheckCircle2, Flame } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import type { RestaurantCard as TRestaurantCard } from '@workspace/api-client-react';
import { getRestaurantAwards } from '@/lib/awards';

export type RestaurantCardData = TRestaurantCard & {
  cityNameEn?: string | null;
  cityNameAr?: string | null;
  isTrending?: boolean;
  isNew?: boolean;
};

const PRICE_SYMBOLS: Record<string, string> = {
  budget: '$',
  mid: '$$',
  upscale: '$$$',
  fine_dining: '$$$$',
};

export function RestaurantCard({ restaurant, rank }: { restaurant: RestaurantCardData; rank?: number }) {
  const { lang } = useLanguage();
  
  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const cityName = lang === 'ar' ? restaurant.cityNameAr : restaurant.cityNameEn;
  const image = restaurant.coverImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop";
  const priceSymbol = PRICE_SYMBOLS[restaurant.priceTier ?? 'mid'] ?? '$$';
  const awards = getRestaurantAwards(restaurant);
  const topAward = awards[0];
  const rating = Number(restaurant.avgRating ?? 0);
  const reviews = Number(restaurant.reviewCount ?? 0);
  const isTrending = restaurant.isTrending || (reviews > 20 && rating >= 4.3);
  const isNew = restaurant.isNew || (reviews > 0 && reviews <= 5);
  const cuisines = (restaurant.cuisineTypes ?? []).slice(0, 2);

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block group h-full">
      <div className="bg-card rounded-xl overflow-hidden border border-border/60 hover:border-primary/25 shadow-[0_1px_4px_rgb(0,0,0,0.07)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.10)] transition-all duration-250 flex flex-col h-full">
        
        {/* Image — 3:2 landscape ratio */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '3/2' }}>
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop"; }}
          />

          {/* Rank badge */}
          {rank !== undefined ? (
            <div className="absolute top-2.5 start-2.5 w-7 h-7 bg-amber-400 text-black rounded-lg flex items-center justify-center text-xs font-black shadow">
              {rank}
            </div>
          ) : topAward ? (
            <div className={`absolute top-2.5 start-2.5 ${topAward.bgClass} ${topAward.textClass} px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow`}>
              <span>{topAward.icon}</span>
              <span>{lang === 'ar' ? topAward.labelAr : topAward.labelEn}</span>
            </div>
          ) : null}

          {/* Status badges */}
          {isTrending && !isNew && (
            <div className="absolute top-2.5 end-2.5 bg-primary text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow">
              <Flame className="w-3 h-3" />
              {lang === 'ar' ? 'شائع' : 'Trending'}
            </div>
          )}
          {isNew && (
            <div className="absolute top-2.5 end-2.5 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow">
              {lang === 'ar' ? 'جديد' : 'New'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 flex flex-col flex-grow">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-[0.9rem] font-semibold text-foreground line-clamp-1 flex-1 leading-snug tracking-[-0.01em]">{name}</h3>
            {restaurant.isVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{cityName || ''}</span>
            <span className="mx-0.5 text-border">·</span>
            <span className="font-medium text-foreground/70 shrink-0">{priceSymbol}</span>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-foreground tabular-nums">{rating > 0 ? rating.toFixed(1) : '—'}</span>
              {reviews > 0 && <span className="text-xs text-muted-foreground">({reviews})</span>}
            </div>

            {/* Cuisine tags */}
            <div className="flex gap-1">
              {cuisines.map((cuisine, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium">
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
