import React from 'react';
import { Link } from 'wouter';
import { Star, MapPin, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import type { RestaurantCard as TRestaurantCard } from '@workspace/api-client-react';

export function RestaurantCard({ restaurant }: { restaurant: TRestaurantCard }) {
  const { t, lang } = useLanguage();
  
  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const image = restaurant.coverImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop";

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block group">
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full">
        
        {/* Image Header */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-4 start-4 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="text-sm font-bold text-foreground">{Number(restaurant.avgRating)?.toFixed(1) || 'NEW'}</span>
            <span className="text-xs text-muted-foreground">({restaurant.reviewCount || 0})</span>
          </div>
          <div className="absolute absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent h-1/3" />
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-lg font-bold text-foreground line-clamp-1 flex items-center gap-2">
              {name}
              {restaurant.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
            </h3>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? (restaurant as any).cityNameAr : (restaurant as any).cityNameEn || restaurant.cityId}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="font-medium text-foreground tracking-widest text-xs">
              {/* Dummy rendering of price tier ($$$) */}
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={i < (restaurant.priceTier === 'budget' ? 1 : restaurant.priceTier === 'mid' ? 2 : restaurant.priceTier === 'upscale' ? 3 : 4) ? "text-foreground" : "text-muted"}>$</span>
              ))}
            </span>
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            {restaurant.cuisineTypes?.slice(0, 3).map((cuisine, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                {cuisine}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
