import React from 'react';
import { Link } from 'wouter';
import { Star, MapPin, CheckCircle2, Flame, CalendarDays, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import type { RestaurantCard as TRestaurantCard } from '@workspace/api-client-react';
import { getRestaurantAwards } from '@/lib/awards';

export type RestaurantCardData = TRestaurantCard & {
  cityNameEn?: string | null;
  cityNameAr?: string | null;
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
  budget: '$',
  mid: '$$',
  upscale: '$$$',
  fine_dining: '$$$$',
};

export function RestaurantCard({ restaurant, rank }: { restaurant: RestaurantCardData; rank?: number }) {
  const { lang } = useLanguage();

  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const cityName = lang === 'ar' ? restaurant.cityNameAr : restaurant.cityNameEn;
  const image = restaurant.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop';
  const priceSymbol = PRICE_SYMBOLS[restaurant.priceTier ?? 'mid'] ?? '$$';
  const awards = getRestaurantAwards(restaurant);
  const topAward = awards[0];
  const rating = Number(restaurant.avgRating ?? 0);
  const reviews = Number(restaurant.reviewCount ?? 0);
  const isTrending = restaurant.isTrending || (reviews > 20 && rating >= 4.3);
  const isNew = restaurant.isNew || (reviews > 0 && reviews <= 5);
  const cuisines = (restaurant.cuisineTypes ?? []).slice(0, 2);
  const { open, label: openLabel } = getOpenStatus(lang);

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block group h-full">
      <div className="bg-card rounded-2xl overflow-hidden border border-border/60 hover:border-primary/25 shadow-[0_1px_4px_rgb(0,0,0,0.07)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-250 flex flex-col h-full">

        {/* Image — 3:2 landscape ratio */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '3/2' }}>
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'; }}
          />

          {/* Top-left: rank OR award */}
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

          {/* Top-right: trending or new */}
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

          {/* Bottom-left: open/closed pill + halal badge */}
          <div className="absolute bottom-2.5 start-2.5 flex gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 ${open ? 'bg-emerald-500/85 text-white' : 'bg-black/60 text-white/80'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-white' : 'bg-white/50'}`} />
              {openLabel}
            </span>
            {restaurant.isHalal && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-700/85 text-white backdrop-blur-sm flex items-center gap-0.5">
                <BadgeCheck className="w-2.5 h-2.5" />
                {lang === 'ar' ? 'حلال' : 'Halal'}
              </span>
            )}
          </div>

          {/* Hover CTA — slides up */}
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-white text-foreground text-xs font-bold px-4 py-2 rounded-full shadow-xl translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              {lang === 'ar' ? 'احجز طاولة' : 'Book a Table'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 flex flex-col flex-grow">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[0.9rem] font-semibold text-foreground line-clamp-1 flex-1 leading-snug tracking-[-0.01em] group-hover:text-primary transition-colors">{name}</h3>
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
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-foreground tabular-nums">{rating > 0 ? rating.toFixed(1) : '—'}</span>
              {reviews > 0 && <span className="text-xs text-muted-foreground">({reviews})</span>}
            </div>

            <div className="flex gap-1 flex-wrap justify-end">
              {cuisines.map((cuisine, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium">
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
