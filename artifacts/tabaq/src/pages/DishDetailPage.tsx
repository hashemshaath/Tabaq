import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { StarRating } from '@/components/StarRating';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useGetDish } from '@workspace/api-client-react';
import { useCart } from '@/context/CartContext';
import { InlineReviewComposer } from '@/components/InlineReviewComposer';
import { ReviewCard } from '@/components/ReviewCard';
import {
  Star, MapPin, Leaf, Wheat, Flame, CheckCircle2, ChevronRight,
  TrendingUp, MessageSquare, ArrowLeft, CalendarDays, Clock,
  AlertCircle, Award, Zap, Shield, Plus, Minus, ShoppingBag, ArrowRight, Sparkles,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DishCard } from '@/components/DishCard';
import type { Dish } from '@workspace/api-client-react';

type ExtendedDish = Dish & {
  isTabaqStar?: boolean;
  isMostOrdered?: boolean;
  isHealthy?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
  allergens?: string[];
  spiceLevel?: number;
  prepTimeMinutes?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

const ALLERGEN_MAP: Record<string, { en: string; ar: string; color: string }> = {
  nuts: { en: 'Tree Nuts', ar: 'مكسرات', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  peanuts: { en: 'Peanuts', ar: 'فول سوداني', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  dairy: { en: 'Dairy', ar: 'منتجات الألبان', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  gluten: { en: 'Gluten', ar: 'جلوتين', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  shellfish: { en: 'Shellfish', ar: 'محار', color: 'bg-red-100 text-red-800 border-red-200' },
  eggs: { en: 'Eggs', ar: 'بيض', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  soy: { en: 'Soy', ar: 'صويا', color: 'bg-green-100 text-green-800 border-green-200' },
  fish: { en: 'Fish', ar: 'سمك', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  sesame: { en: 'Sesame', ar: 'سمسم', color: 'bg-orange-100 text-orange-800 border-orange-200' },
};

function SpiceMeter({ level }: { level: number }) {
  const labels: Record<number, { en: string; ar: string; color: string }> = {
    1: { en: 'Mild', ar: 'خفيف', color: 'text-yellow-600' },
    2: { en: 'Medium', ar: 'متوسط', color: 'text-orange-500' },
    3: { en: 'Spicy', ar: 'حار', color: 'text-orange-600' },
    4: { en: 'Very Spicy', ar: 'حار جداً', color: 'text-red-500' },
    5: { en: 'Extremely Hot', ar: 'شديد الحرارة', color: 'text-red-700' },
  };
  const info = labels[level];
  return (
    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Flame key={i} className={`w-5 h-5 ${i <= level ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground/20'}`} />
        ))}
      </div>
      {info && <span className={`text-sm font-bold ${info.color}`}>{info.en}</span>}
    </div>
  );
}


export function DishDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { addItem, items: cartItems, updateQty } = useCart();
  const [localQty, setLocalQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const numericId = id ? parseInt(id, 10) : NaN;
  const idIsValid = !isNaN(numericId);

  const { data, isLoading } = useGetDish(numericId, {
    query: { enabled: idIsValid, queryKey: ['dish', id] },
  });

  usePageMeta({
    titleEn: data?.dish?.nameEn ? `${data.dish.nameEn} | Tabaq` : 'Dish | Tabaq',
    titleAr: data?.dish?.nameAr ? `${data.dish.nameAr} | طبق` : 'طبق | طبق',
    descriptionEn: data?.dish?.descriptionEn ?? 'Discover this dish and more on Tabaq — Saudi Arabia\'s dining platform.',
    descriptionAr: data?.dish?.descriptionAr ?? 'اكتشف هذا الطبق والمزيد على طبق — منصة الطعام في المملكة.',
  }, lang);

  if (!idIsValid) {
    return <div className="p-20 text-center text-xl">{t('Dish not found', 'الطبق غير موجود')}</div>;
  }

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

  const { restaurant, recentReviews, similarDishes } = data;
  const dish = data.dish as ExtendedDish;
  const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
  const description = lang === 'ar' ? dish.descriptionAr : dish.descriptionEn;
  const restName = lang === 'ar' ? (restaurant?.nameAr ?? '') : (restaurant?.nameEn ?? '');

  const cartQty = cartItems.find(i => i.dishId === numericId)?.qty ?? 0;

  const handleAddToCart = () => {
    for (let i = 0; i < localQty; i++) {
      addItem({
        dishId: numericId,
        nameEn: dish.nameEn ?? '',
        nameAr: dish.nameAr ?? '',
        price: Number(dish.price ?? 0),
        currency: dish.currency ?? 'SAR',
        imageUrl: dish.imageUrl ?? undefined,
        restaurantId: restaurant?.id ?? 0,
        restaurantNameEn: restaurant?.nameEn ?? '',
        restaurantNameAr: restaurant?.nameAr ?? '',
      });
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const hasRating = Number(dish.reviewCount) > 0;
  const avgRating = Number(dish.avgRating);
  const allergens = dish.allergens ?? [];
  const spiceLevel = dish.spiceLevel ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Tabaq Star Banner */}
      {dish.isTabaqStar && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2.5">
            <Star className="w-4 h-4 fill-white shrink-0" />
            <span className="text-sm font-bold">
              {t("Tabaq Star — Our critics have highlighted this dish for exceptional quality.", "نجمة طبق — أبرز نقادنا هذا الطبق لجودته الاستثنائية.")}
            </span>
          </div>
        </div>
      )}

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

            {/* Overlay badges */}
            <div className="absolute top-4 start-4 flex flex-col gap-2">
              {dish.isTabaqStar && (
                <div className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  {t('Tabaq Star', 'نجمة طبق')}
                </div>
              )}
              {dish.isMostOrdered && !dish.isTabaqStar && (
                <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  {t('Most Ordered', 'الأكثر طلباً')}
                </div>
              )}
              {dish.popularityScore && Number(dish.popularityScore) > 50 && !dish.isTabaqStar && !dish.isMostOrdered && (
                <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t('Trending', 'شائع')}
                </div>
              )}
            </div>

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
                  <StarRating rating={avgRating} size="lg" />
                  <span className="font-bold text-amber-700">{avgRating.toFixed(1)}</span>
                  <span className="text-amber-600/70 text-sm">({dish.reviewCount} {t('reviews', 'تقييم')})</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {(dish.prepTimeMinutes || spiceLevel > 0) && (
              <div className="flex gap-3 flex-wrap">
                {dish.prepTimeMinutes && (
                  <div className="flex items-center gap-2 bg-secondary/60 border border-border/60 rounded-2xl px-4 py-2.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground leading-none">{t('Prep Time', 'وقت التحضير')}</p>
                      <p className="text-sm font-bold text-foreground">{dish.prepTimeMinutes} {t('min', 'دقيقة')}</p>
                    </div>
                  </div>
                )}
                {dish.calories && (
                  <div className="flex items-center gap-2 bg-secondary/60 border border-border/60 rounded-2xl px-4 py-2.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground leading-none">{t('Calories', 'السعرات')}</p>
                      <p className="text-sm font-bold text-foreground">{dish.calories} kcal</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spice Level */}
            {spiceLevel > 0 && <SpiceMeter level={spiceLevel} />}

            {/* Dietary Tags */}
            <div className="flex flex-wrap gap-2">
              {dish.isHalal && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 text-green-700 font-semibold text-sm border border-green-200">
                  <Shield className="w-3.5 h-3.5" /> {t('Halal', 'حلال')}
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
              {dish.isHealthy && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-100 text-teal-700 font-semibold text-sm border border-teal-200">
                  {t('Healthy Choice', 'خيار صحي')}
                </span>
              )}
              {dish.isDairyFree && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-100 text-sky-700 font-semibold text-sm border border-sky-200">
                  {t('Dairy-Free', 'خالٍ من الألبان')}
                </span>
              )}
              {dish.isNutFree && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-100 text-lime-700 font-semibold text-sm border border-lime-200">
                  {t('Nut-Free', 'خالٍ من المكسرات')}
                </span>
              )}
            </div>

            {/* Nutrition */}
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

            {/* Add to Cart */}
            {dish.price && (
              <div className="space-y-3">
                {/* Qty stepper */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl p-1">
                    <button
                      onClick={() => setLocalQty(q => Math.max(1, q - 1))}
                      disabled={localQty <= 1}
                      className="w-9 h-9 rounded-lg bg-background border border-border hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-black tabular-nums w-6 text-center text-foreground">{localQty}</span>
                    <button
                      onClick={() => setLocalQty(q => q + 1)}
                      className="w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(Number(dish.price) * localQty, dish.currency, lang)}
                  </span>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAddToCart}
                  className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-base transition-all ${
                    addedToCart
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {t('Added to Cart!', 'أُضيف إلى السلة!')}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      {t('Add to Cart', 'أضف إلى السلة')}
                    </>
                  )}
                </button>

                {/* Cart link if items already in cart */}
                {cartQty > 0 && (
                  <Link href="/checkout">
                    <button className="w-full flex items-center justify-between bg-primary/10 text-primary border border-primary/20 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-primary/15 transition-colors">
                      <span>{t('View Cart', 'عرض السلة')} · {cartQty} {t('in cart', 'في السلة')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                )}
              </div>
            )}

            {/* Secondary CTAs */}
            <div className="flex gap-3 flex-wrap">
              {restaurant && (
                <>
                  <Link href={`/restaurants/${restaurant.id}?tab=book`}>
                    <Button size="lg" className="gap-2 rounded-2xl px-6" variant="outline">
                      <CalendarDays className="w-4 h-4" />
                      {t('Book a Table', 'احجز طاولة')}
                    </Button>
                  </Link>
                  <Link href={`/restaurants/${restaurant.id}`}>
                    <Button variant="ghost" size="lg" className="gap-2 rounded-2xl px-6">
                      <ArrowLeft className="w-4 h-4" />
                      {t('View Menu', 'عرض المنيو')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Allergens Panel */}
        {allergens.length > 0 && (
          <section className="mb-10">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                {t('Allergen Information', 'معلومات المسببات التحسسية')}
              </h3>
              <p className="text-xs text-amber-700 mb-3">
                {t('This dish contains or may contain the following allergens. Please inform the restaurant of any allergies.', 'يحتوي هذا الطبق أو قد يحتوي على المسببات التحسسية التالية. يُرجى إعلام المطعم بأي حساسية.')}
              </p>
              <div className="flex flex-wrap gap-2">
                {allergens.map(a => {
                  const info = ALLERGEN_MAP[a.toLowerCase()];
                  return (
                    <span key={a} className={`px-3 py-1.5 rounded-xl border text-sm font-semibold ${info ? info.color : 'bg-muted text-foreground border-border'}`}>
                      {info ? (lang === 'ar' ? info.ar : info.en) : a}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Critic Highlight */}
        {dish.isTabaqStar && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-300/40 p-6">
              <div className="absolute top-0 end-0 text-8xl opacity-10">⭐</div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{t("Tabaq Star Dish", "طبق نجمة طبق")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(
                      "Our expert food critics have visited this restaurant and selected this dish as an exceptional highlight — a must-try experience.",
                      "زار نقادنا الغذائيون هذا المطعم واختاروا هذا الطبق بوصفه اختياراً استثنائياً يستحق التجربة."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* Reviews */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-5 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t('Reviews', 'التقييمات')}
          </h2>

          <div className="space-y-5">
            <InlineReviewComposer
              dishId={numericId}
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
