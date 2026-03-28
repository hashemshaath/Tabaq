import React from 'react';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useGetDish } from '@workspace/api-client-react';
import { Star, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function DishDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  
  const { data, isLoading } = useGetDish(Number(id), { query: { enabled: !!id, queryKey: ['dish', id] } });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!data?.dish) return <div className="p-20 text-center">{t('Not Found', 'غير موجود')}</div>;

  const { dish, restaurant } = data;
  const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
  const description = lang === 'ar' ? dish.descriptionAr : dish.descriptionEn;
  const restName = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          
          {/* Photo */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-muted aspect-square border border-border">
            <img 
              src={dish.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&h=1000&fit=crop"} 
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="py-4">
            <Link href={`/restaurants/${restaurant.id}`} className="inline-flex items-center gap-2 text-primary font-semibold mb-4 hover:underline">
              <MapPin className="w-4 h-4" />
              {restName}
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">{name}</h1>
            
            <div className="flex items-center gap-6 mb-8">
              <span className="text-3xl font-bold text-primary">
                {dish.price ? formatPrice(dish.price, dish.currency, lang) : ''}
              </span>
              <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl">
                <Star className="w-5 h-5 fill-accent-foreground text-accent-foreground" />
                <span className="font-bold text-lg">{Number(dish.avgRating)?.toFixed(1) || '0.0'}</span>
                <span className="text-muted-foreground text-sm">({dish.reviewCount})</span>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {description || t('A signature dish prepared with the finest ingredients and authentic recipes to deliver an unforgettable taste.', 'طبق مميز محضر بأجود المكونات ووصفات أصلية ليقدم طعماً لا ينسى.')}
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {dish.isHalal && <span className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium text-sm">{t('Halal', 'حلال')}</span>}
              {dish.isVegetarian && <span className="px-4 py-2 rounded-xl bg-[#27ae60]/10 text-[#27ae60] font-medium text-sm">{t('Vegetarian', 'نباتي')}</span>}
              {dish.calories && <span className="px-4 py-2 rounded-xl border border-border text-foreground font-medium text-sm">{dish.calories} kcal</span>}
            </div>

            <Link href={`/restaurants/${restaurant.id}`}>
              <Button size="lg" className="w-full sm:w-auto px-10 h-14 text-lg rounded-2xl">
                {t('View Restaurant', 'عرض المطعم')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
