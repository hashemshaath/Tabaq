import React from 'react';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useGetDish } from '@workspace/api-client-react';
import { InlineReviewComposer } from '@/components/InlineReviewComposer';
import { ReviewCard } from '@/components/ReviewCard';
import {
  Star, MapPin, Leaf, Wheat, Flame, CheckCircle2, ChevronRight,
  TrendingUp, MessageSquare, ArrowLeft, CalendarDays
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
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted animate-pulse rounded-3xl" />
            <div className="space-y-4 pt-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-4/5" />
            </div>
          </div>
        </div>
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

  const hasRating = Number(dish.reviewCount) > 0;
  const avgRating = Number(dish.avgRating);

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">{t('Home', 'الرئيسية')}</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          {restaurant && (
            <>
              <Link href={`/restaurants/${restaurant.id}`} className="hover:text-primary transition-colors">{restName}</Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[200px]">{name}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start mb-14">

          {/* Photo */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-muted aspect-square border border-border/60 group">
            <img
              src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&h=1000&fit=crop'}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
            {dish.popularityScore && Number(dish.popularityScore) > 50 && (
              <div className="absolute top-4 start-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <TrendingUp className="w-3.5 h-3.5" />
                {t('Trending', 'شائع')}
              </div>
            )}
            {hasRating && (
              <div className="absolute bottom-4 end-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm font-bold shadow-lg">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {avgRating.toFixed(1)}
                <span className="text-white/60 font-normal text-xs">({dish.reviewCount})</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="py-2 space-y-6">
            {/* Restaurant Link */}
            {restaurant && (
              <Link href={`/restaurants/${restaurant.id}`} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                <MapPin className="w-3.5 h-3.5" />
                {restName}
                {restaurant.isVerified && <CheckCircle2 className="w-3 h-3" />}
              </Link>
            )}

            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-2">{name}</h1>
              {description && (
                <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>

            {/* Price & Rating */}
            <div className="flex items-center gap-4 flex-wrap">
              {dish.price && (
                <span className="text-4xl font-black text-primary">
                  {formatPrice(dish.price, dish.currency, lang)}
                </span>
              )}
              {hasRating && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-amber-700">{avgRating.toFixed(1)}</span>
                  <span className="text-amber-600/70 text-sm">({dish.reviewCount} {t('reviews', 'تقييم')})</span>
                </div>
              )}
            </div>

            {/* Dietary / Info Tags */}
            <div className="flex flex-wrap gap-2">
              {dish.isHalal && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 text-green-700 font-semibold text-sm border border-green-200">
                  {t('Halal', 'حلال')}
                </span>
              )}
              {dish.isVegetarian && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm border border-emerald-200">
                  <Leaf className="w-3.5 h-3.5" /> {t('Vegetarian', 'نباتي')}
                </span>
              )}
              {dish.isVegan && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-100 text-lime-700 font-semibold text-sm border border-lime-200">
                  <Leaf className="w-3.5 h-3.5" /> {t('Vegan', 'نباتي صارم')}
                </span>
              )}
              {dish.isGlutenFree && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 font-semibold text-sm border border-amber-200">
                  <Wheat className="w-3.5 h-3.5 line-through opacity-50" /> {t('Gluten Free', 'خالٍ من الغلوتين')}
                </span>
              )}
              {dish.calories && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary text-foreground font-semibold text-sm">
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> {dish.calories} kcal
                </span>
              )}
            </div>

            {/* Nutrition if available */}
            {(dish.protein || dish.carbs || dish.fat) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('Protein', 'بروتين'), value: dish.protein, unit: 'g', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                  { label: t('Carbs', 'كربوهيدرات'), value: dish.carbs, unit: 'g', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                  { label: t('Fat', 'دهون'), value: dish.fat, unit: 'g', color: 'text-red-600 bg-red-50 border-red-100' },
                ].filter(n => n.value).map(n => (
                  <div key={n.label} className={`rounded-2xl border p-3 text-center ${n.color}`}>
                    <p className="text-xl font-black">{n.value}{n.unit}</p>
                    <p className="text-xs font-medium opacity-70">{n.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap">
              {restaurant && (
                <>
                  <Link href={`/restaurants/${restaurant.id}?tab=book`}>
                    <Button size="lg" className="gap-2 rounded-2xl px-6">
                      <CalendarDays className="w-4 h-4" />
                      {t('Book a Table', 'احجز طاولة')}
                    </Button>
                  </Link>
                  <Link href={`/restaurants/${restaurant.id}`}>
                    <Button variant="outline" size="lg" className="gap-2 rounded-2xl px-6">
                      <ArrowLeft className="w-4 h-4" />
                      {t('View Restaurant', 'عرض المطعم')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Write a Review — Inline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-5 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t('Reviews', 'التقييمات')}
          </h2>

          <div className="space-y-5">
            <InlineReviewComposer
              dishId={Number(id)}
              dishNameEn={dish.nameEn}
              dishNameAr={dish.nameAr}
              invalidateKey={['dish', id]}
            />

            {recentReviews && recentReviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {recentReviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}

            {(!recentReviews || recentReviews.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('No reviews yet — be the first!', 'لا توجد تقييمات بعد — كن الأول!')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Similar Dishes */}
        {similarDishes && similarDishes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-foreground">{t('More from this Restaurant', 'المزيد من هذا المطعم')}</h2>
              {restaurant && (
                <Link href={`/restaurants/${restaurant.id}`} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                  {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {similarDishes.slice(0, 6).map(d => (
                <DishCard key={d.id} dish={d} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
