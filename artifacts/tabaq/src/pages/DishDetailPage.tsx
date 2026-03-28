import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useGetDish } from '@workspace/api-client-react';
import {
  Star, MapPin, Leaf, Wheat, Flame, CheckCircle2, ChevronRight,
  TrendingUp, MessageSquare, ArrowLeft
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DishCard } from '@/components/DishCard';

export function DishDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();

  const { data, isLoading } = useGetDish(Number(id), {
    query: { enabled: !!id, queryKey: ['dish', id] },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.dish) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground mb-4">{t('Dish not found', 'الطبق غير موجود')}</p>
          <Link href="/restaurants">
            <Button variant="outline">{t('Browse Restaurants', 'تصفح المطاعم')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { dish, restaurant, recentReviews, similarDishes } = data;
  const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
  const description = lang === 'ar' ? dish.descriptionAr : dish.descriptionEn;
  const restName = lang === 'ar' ? (restaurant?.nameAr ?? '') : (restaurant?.nameEn ?? '');

  const ratingBars = [
    { label: t('Food', 'الطعام'), value: Number(dish.avgRating) },
    { label: t('Value', 'القيمة'), value: Math.max(0, Number(dish.avgRating) - 0.2) },
    { label: t('Popularity', 'الشهرة'), value: Math.min(5, Number(dish.popularityScore) / 20) },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Back Link */}
        {restaurant && (
          <Link href={`/restaurants/${restaurant.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            {restName}
          </Link>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start mb-12">

          {/* Photo */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-muted aspect-square border border-border">
            <img
              src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&h=1000&fit=crop'}
              alt={name}
              className="w-full h-full object-cover"
            />
            {dish.popularityScore && Number(dish.popularityScore) > 50 && (
              <div className="absolute top-4 start-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <TrendingUp className="w-3.5 h-3.5" />
                {t('Trending', 'شائع')}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="py-2">
            {/* Restaurant Link */}
            {restaurant && (
              <Link href={`/restaurants/${restaurant.id}`} className="inline-flex items-center gap-2 text-primary font-semibold mb-4 hover:underline text-sm">
                <MapPin className="w-4 h-4" />
                {restName}
                {restaurant.isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
              </Link>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">{name}</h1>

            {/* Price & Rating */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              {dish.price && (
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(dish.price, dish.currency, lang)}
                </span>
              )}
              {Number(dish.reviewCount) > 0 && (
                <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="font-bold text-lg">{Number(dish.avgRating)?.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({dish.reviewCount} {t('reviews', 'تقييم')})</span>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                {description}
              </p>
            )}

            {/* Dietary Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {dish.isHalal && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 text-green-700 font-medium text-sm">
                  {t('Halal', 'حلال')}
                </span>
              )}
              {dish.isVegetarian && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 font-medium text-sm">
                  <Leaf className="w-3.5 h-3.5" />
                  {t('Vegetarian', 'نباتي')}
                </span>
              )}
              {dish.isVegan && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-100 text-lime-700 font-medium text-sm">
                  <Leaf className="w-3.5 h-3.5" />
                  {t('Vegan', 'نباتي صارم')}
                </span>
              )}
              {dish.isGlutenFree && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 font-medium text-sm">
                  <Wheat className="w-3.5 h-3.5 line-through opacity-50" />
                  {t('Gluten Free', 'خالٍ من الغلوتين')}
                </span>
              )}
              {dish.calories && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-foreground font-medium text-sm">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {dish.calories} kcal
                </span>
              )}
            </div>

            {/* Rating Breakdown */}
            {Number(dish.reviewCount) > 0 && (
              <div className="space-y-2 mb-6">
                {ratingBars.map(bar => (
                  <div key={bar.label} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-muted-foreground shrink-0">{bar.label}</span>
                    <div className="flex-grow bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (bar.value / 5) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-foreground">{bar.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            {restaurant && (
              <Link href={`/restaurants/${restaurant.id}`}>
                <Button size="lg" className="w-full sm:w-auto px-8 h-13 text-base rounded-2xl">
                  {t('View Restaurant & Book', 'عرض المطعم وحجز')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {recentReviews && recentReviews.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-5 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {t('Reviews', 'التقييمات')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentReviews.map(review => (
                <div key={review.id} className="bg-card border border-border/60 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {(review.userNameEn || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground text-sm">
                            {lang === 'ar' ? (review.userNameAr || review.userNameEn) : review.userNameEn}
                          </p>
                          {review.userLevelTitle && (
                            <p className="text-xs text-muted-foreground">{review.userLevelTitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="text-xs font-bold">{Number(review.ratingOverall).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(lang === 'ar' ? review.textAr : review.textEn) && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {lang === 'ar' ? review.textAr : review.textEn}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Dishes */}
        {similarDishes && similarDishes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-foreground">
                {t('More from this Restaurant', 'المزيد من هذا المطعم')}
              </h2>
              {restaurant && (
                <Link href={`/restaurants/${restaurant.id}`} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                  {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {similarDishes.map(d => (
                <DishCard key={d.id} dish={d} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
