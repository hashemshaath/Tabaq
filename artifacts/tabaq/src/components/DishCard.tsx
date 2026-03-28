import React from 'react';
import { Link } from 'wouter';
import { Star } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { formatPrice } from '@/lib/utils';
import type { DishCard as TDishCard } from '@workspace/api-client-react';

export function DishCard({ dish, rank }: { dish: TDishCard, rank?: number }) {
  const { t, lang } = useLanguage();
  
  const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
  const restaurantName = lang === 'ar' ? dish.restaurantNameAr : dish.restaurantNameEn;
  const image = dish.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop";

  return (
    <Link href={`/dishes/${dish.id}`} className="block group">
      <div className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-4">
        
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-muted">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {rank && (
            <div className="absolute top-0 start-0 bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center font-bold rounded-br-xl rounded-tl-xl z-10">
              #{rank}
            </div>
          )}
        </div>

        <div className="flex-grow py-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">{name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{restaurantName}</p>
            </div>
            {dish.price && (
              <span className="font-bold text-primary shrink-0 ms-2">
                {formatPrice(dish.price, dish.currency, lang)}
              </span>
            )}
          </div>
          
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
              <Star className="w-3.5 h-3.5 fill-accent-foreground text-accent-foreground" />
              <span className="text-xs font-bold text-foreground">{Number(dish.avgRating)?.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {dish.reviewCount} {t('reviews', 'تقييم')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
