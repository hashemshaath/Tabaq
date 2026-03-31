import React from 'react';
import { Link } from 'wouter';
import { Star, MapPin, CheckCircle2, Flame, CalendarDays, BadgeCheck, Clock } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import type { RestaurantCard as TRestaurantCard } from '@workspace/api-client-react';
import { getRestaurantAwards } from '@/lib/awards';

export type RestaurantCardData = TRestaurantCard & {
  cityNameEn?: string | null;
  cityNameAr?: string | null;
  cuisineTypesAr?: string[];
  isTrending?: boolean;
  isNew?: boolean;
  isHalal?: boolean;
};

function getOpenStatus(lang: string): { open: boolean; label: string } {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isFriday = day === 5;
  const closedMidday = isFriday && hour >= 11 && hour < 13;
  const isOpen = !closedMidday && hour >= 11 && hour < 23;
  return {
    open: isOpen,
    label: isOpen ? (lang === 'ar' ? 'مفتوح' : 'Open') : (lang === 'ar' ? 'مغلق' : 'Closed'),
  };
}

const PRICE_SYMBOLS: Record<string, string> = {
  budget: '＄',
  mid: '＄＄',
  upscale: '＄＄＄',
  fine_dining: '＄＄＄＄',
};

const PRICE_LABELS: Record<string, { en: string; ar: string }> = {
  budget: { en: 'Budget', ar: 'اقتصادي' },
  mid: { en: 'Mid-range', ar: 'متوسط' },
  upscale: { en: 'Upscale', ar: 'راقٍ' },
  fine_dining: { en: 'Fine Dining', ar: 'فاخر' },
};

export function RestaurantCard({ restaurant, rank }: { restaurant: RestaurantCardData; rank?: number }) {
  const { lang } = useLanguage();

  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const cityName = lang === 'ar' ? restaurant.cityNameAr : restaurant.cityNameEn;
  const image = restaurant.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop';
  const priceSymbol = PRICE_SYMBOLS[restaurant.priceTier ?? 'mid'] ?? '＄＄';
  const priceTierLabel = restaurant.priceTier ? PRICE_LABELS[restaurant.priceTier] : null;
  const awards = getRestaurantAwards(restaurant);
  const topAward = awards[0];
  const rating = Number(restaurant.avgRating ?? 0);
  const reviews = Number(restaurant.reviewCount ?? 0);
  const isTrending = restaurant.isTrending || (reviews > 200 && rating >= 4.3);
  const isNew = restaurant.isNew === true;
  const cuisines = (lang === 'ar' && restaurant.cuisineTypesAr?.length
    ? restaurant.cuisineTypesAr
    : restaurant.cuisineTypes ?? []
  ).slice(0, 2);
  const { open, label: openLabel } = getOpenStatus(lang);

  const ratingColor = rating >= 4.5 ? '#21897e' : rating >= 4.0 ? '#5ba346' : rating >= 3.5 ? '#cfa200' : '#e23744';

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block group h-full">
      <article className="bg-card rounded-lg overflow-hidden border border-border hover:border-border hover:shadow-elevation-3 shadow-elevation-1 transition-all duration-200 flex flex-col h-full card-hover">

        {/* Image */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'; }}
          />

          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Rank badge */}
          {rank !== undefined && (
            <div className="absolute top-2.5 start-2.5 w-7 h-7 bg-primary text-white rounded-md flex items-center justify-center text-xs font-bold shadow-elevation-2">
              {rank}
            </div>
          )}

          {/* Award badge */}
          {!rank && topAward && (
            <div className={`absolute top-2.5 start-2.5 ${topAward.bgClass} ${topAward.textClass} px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow`}>
              <span>{topAward.icon}</span>
              <span>{lang === 'ar' ? topAward.labelAr : topAward.labelEn}</span>
            </div>
          )}

          {/* Trending / New badge */}
          {isTrending && !isNew && (
            <div className="absolute top-2.5 end-2.5 bg-primary text-white px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow">
              <Flame className="w-3 h-3" />
              {lang === 'ar' ? 'رائج' : 'Trending'}
            </div>
          )}
          {isNew && (
            <div className="absolute top-2.5 end-2.5 bg-blue-500 text-white px-2 py-1 rounded-md text-[11px] font-semibold shadow">
              {lang === 'ar' ? 'جديد' : 'New'}
            </div>
          )}

          {/* Bottom overlay: open status + halal */}
          <div className="absolute bottom-0 start-0 end-0 p-2.5 flex items-center justify-between">
            <div className="flex gap-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1 ${
                open ? 'bg-emerald-600/90 text-white' : 'bg-black/60 text-white/80'
              }`}>
                <Clock className="w-2.5 h-2.5" />
                {openLabel}
              </span>
              {restaurant.isHalal && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-700/90 text-white backdrop-blur-sm flex items-center gap-0.5">
                  <BadgeCheck className="w-2.5 h-2.5" />
                  {lang === 'ar' ? 'حلال' : 'Halal'}
                </span>
              )}
            </div>

            {/* CTA pill — slides up on hover */}
            <div className="flex items-center gap-1 bg-white text-foreground text-[11px] font-semibold px-3 py-1.5 rounded-md shadow-elevation-2 translate-y-6 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-250">
              <CalendarDays className="w-3 h-3 text-primary" />
              {lang === 'ar' ? 'احجز' : 'Book'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-grow">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-foreground line-clamp-1 flex-1 leading-snug group-hover:text-primary transition-colors">{name}</h3>
            {restaurant.isVerified && (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            )}
          </div>

          {/* Location + price */}
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{cityName || ''}</span>
            {priceTierLabel && (
              <>
                <span className="text-border mx-0.5">·</span>
                <span className="font-medium text-muted-foreground shrink-0" title={lang === 'ar' ? priceTierLabel.ar : priceTierLabel.en}>
                  {priceSymbol}
                </span>
              </>
            )}
          </div>

          {/* Rating + cuisines */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {rating > 0 ? (
                <>
                  <span
                    className="px-1.5 py-0.5 rounded-md text-white text-[11px] font-bold flex items-center gap-0.5"
                    style={{ backgroundColor: ratingColor }}
                  >
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {rating.toFixed(1)}
                  </span>
                  {reviews > 0 && (
                    <span className="text-[12px] text-muted-foreground">
                      ({reviews} {lang === 'ar' ? 'تقييم' : 'reviews'})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[12px] text-muted-foreground">{lang === 'ar' ? 'لا تقييمات' : 'No ratings'}</span>
              )}
            </div>

            <div className="flex gap-1 flex-wrap justify-end">
              {cuisines.map((cuisine, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium"
                >
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
