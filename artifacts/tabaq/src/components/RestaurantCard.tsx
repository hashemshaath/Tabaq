import React from 'react';
import { Link } from 'wouter';
import { Star, MapPin, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
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

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block group h-full">
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full">
        
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop"; }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Top-left: rank or award badge */}
          {rank !== undefined ? (
            <div className="absolute top-3 start-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-black shadow-lg">
              {rank}
            </div>
          ) : topAward ? (
            <div className={`absolute top-3 start-3 ${topAward.bgClass} ${topAward.textClass} px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg`}>
              <span>{topAward.icon}</span>
              <span>{lang === 'ar' ? topAward.labelAr : topAward.labelEn}</span>
            </div>
          ) : null}

          {/* Top-right: Trending or New badge */}
          {isTrending && !isNew && (
            <div className="absolute top-3 end-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Flame className="w-3 h-3" />
              {lang === 'ar' ? 'شائع' : 'Trending'}
            </div>
          )}
          {isNew && (
            <div className="absolute top-3 end-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              {lang === 'ar' ? 'جديد' : 'New'}
            </div>
          )}

          {/* Bottom-left: Rating */}
          <div className="absolute bottom-3 start-3 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="text-sm font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
            {reviews > 0 && <span className="text-xs text-muted-foreground">({reviews})</span>}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="text-base font-bold text-foreground line-clamp-1 flex-1">{name}</h3>
            {restaurant.isVerified && (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{cityName || ''}</span>
            <span className="w-1 h-1 rounded-full bg-border shrink-0" />
            <span className="font-semibold text-foreground shrink-0">{priceSymbol}</span>
          </div>

          <div className="mt-auto flex flex-wrap gap-1.5">
            {(restaurant.cuisineTypes ?? []).slice(0, 2).map((cuisine, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                {cuisine}
              </span>
            ))}
            {awards.slice(1).map(award => (
              <span key={award.id} className={`px-2 py-0.5 rounded-md text-xs font-bold ${award.bgClass} ${award.textClass}`}>
                {award.icon} {lang === 'ar' ? award.labelAr : award.labelEn}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
