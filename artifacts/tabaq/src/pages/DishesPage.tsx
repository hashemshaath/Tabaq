import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  useListDishes,
  useListCategories,
  useGetTrendingDishes,
  type ListDishesDietaryTag,
  type ListDishesSortBy,
  ListDishesDietaryTag as DietaryTagEnum,
} from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { Star, Flame, Leaf, Wheat, Coffee, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const LIMIT = 16;

export function DishesPage() {
  const { t, lang } = useLanguage();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');

  const [categoryId, setCategoryId] = useState<number | undefined>(
    params.get('categoryId') ? Number(params.get('categoryId')) : undefined,
  );
  const [dietaryTag, setDietaryTag] = useState<ListDishesDietaryTag | undefined>(undefined);
  const [sortBy, setSortBy] = useState<ListDishesSortBy>('popularity');
  const [page, setPage] = useState(0);

  const { data: categories } = useListCategories();
  const { data: trendingData } = useGetTrendingDishes({ limit: 5 });

  const apiParams = {
    limit: LIMIT,
    offset: page * LIMIT,
    ...(categoryId ? { categoryId } : {}),
    ...(dietaryTag ? { dietaryTag } : {}),
    sortBy,
  };

  const { data, isLoading } = useListDishes(apiParams, {
    query: { queryKey: ['dishes', apiParams] },
  });

  const dishes = data?.dishes || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const dietaryOptions: { value: ListDishesDietaryTag; labelEn: string; labelAr: string; icon: React.ReactNode }[] = [
    { value: DietaryTagEnum.halal, labelEn: 'Halal', labelAr: 'حلال', icon: <span className="text-green-600">✓</span> },
    { value: DietaryTagEnum.vegetarian, labelEn: 'Vegetarian', labelAr: 'نباتي', icon: <Leaf className="w-3.5 h-3.5 text-emerald-600" /> },
    { value: DietaryTagEnum.vegan, labelEn: 'Vegan', labelAr: 'نباتي صرف', icon: <Leaf className="w-3.5 h-3.5 text-green-700" /> },
    { value: DietaryTagEnum.gluten_free, labelEn: 'Gluten-free', labelAr: 'خالي من الغلوتين', icon: <Wheat className="w-3.5 h-3.5 text-amber-600" /> },
  ];

  const sortOptions: { value: ListDishesSortBy; labelEn: string; labelAr: string }[] = [
    { value: 'popularity', labelEn: 'Most Popular', labelAr: 'الأكثر شعبية' },
    { value: 'rating', labelEn: 'Highest Rated', labelAr: 'الأعلى تقييماً' },
    { value: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('Explore Dishes', 'استكشف الأطباق')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('Find your next favourite dish from top restaurants', 'اكتشف طبقك المفضل القادم من أفضل المطاعم')}
            </p>
          </div>
          <Link href="/restaurants" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
            {t('Browse Restaurants', 'تصفح المطاعم')}
          </Link>
        </div>

        {/* Trending Dishes Banner */}
        {trendingData && trendingData.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-lg">{t('Trending Now', 'رائج الآن')}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {trendingData.map(dish => (
                <Link key={dish.id} href={`/dishes/${dish.id}`}>
                  <div className="flex-shrink-0 w-40 rounded-2xl border border-border/60 overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group">
                    <div className="w-full h-24 bg-muted overflow-hidden">
                      <img
                        src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'}
                        alt={lang === 'ar' ? dish.nameAr : dish.nameEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {lang === 'ar' ? dish.nameAr : dish.nameEn}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {lang === 'ar' ? dish.restaurantNameAr : dish.restaurantNameEn}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-medium">{Number(dish.avgRating).toFixed(1)}</span>
                        {dish.price && (
                          <span className="text-[10px] text-muted-foreground ms-auto">
                            {formatPrice(dish.price, dish.currency, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Category pills */}
          {categories && categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setCategoryId(undefined); setPage(0); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  !categoryId
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background border-border hover:border-primary/50 text-foreground'
                }`}
              >
                {t('All Cuisines', 'كل المطابخ')}
              </button>
              {categories.slice(0, 10).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); setPage(0); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    categoryId === cat.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {lang === 'ar' ? cat.nameAr : cat.nameEn}
                </button>
              ))}
            </div>
          )}

          {/* Dietary + Sort row */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 text-sm text-muted-foreground me-2">
              <Filter className="w-4 h-4" />
              <span>{t('Filter:', 'تصفية:')}</span>
            </div>
            {dietaryOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setDietaryTag(prev => prev === opt.value ? undefined : opt.value);
                  setPage(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  dietaryTag === opt.value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border hover:border-primary/40 text-foreground'
                }`}
              >
                {opt.icon}
                {lang === 'ar' ? opt.labelAr : opt.labelEn}
              </button>
            ))}
            <div className="ms-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">{t('Sort:', 'ترتيب:')}</span>
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as ListDishesSortBy); setPage(0); }}
                className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:border-primary"
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {lang === 'ar' ? o.labelAr : o.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-4">
          {isLoading
            ? t('Loading dishes...', 'جاري التحميل...')
            : t(`${total} dishes found`, `${total} طبق متاح`)
          }
        </div>

        {/* Dishes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 overflow-hidden animate-pulse">
                <div className="bg-muted h-40" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Coffee className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">{t('No dishes found', 'لا توجد أطباق')}</p>
            <p className="text-sm mt-1">{t('Try adjusting your filters', 'جرّب تعديل خيارات التصفية')}</p>
            <Button variant="outline" className="mt-4" onClick={() => {
              setCategoryId(undefined);
              setDietaryTag(undefined);
              setSortBy('popularity');
              setPage(0);
            }}>
              {t('Clear filters', 'مسح الفلاتر')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {dishes.map(dish => (
              <Link key={dish.id} href={`/dishes/${dish.id}`}>
                <div className="rounded-2xl border border-border/60 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer h-full">
                  <div className="relative overflow-hidden bg-muted h-40">
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                      alt={lang === 'ar' ? dish.nameAr : dish.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {dish.price && (
                      <div className="absolute bottom-2 end-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-primary">
                        {formatPrice(dish.price, dish.currency, lang)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {lang === 'ar' ? dish.nameAr : dish.nameEn}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {lang === 'ar' ? dish.restaurantNameAr : dish.restaurantNameEn}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">{Number(dish.avgRating).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({dish.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('Previous', 'السابق')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t(`Page ${page + 1} of ${totalPages}`, `صفحة ${page + 1} من ${totalPages}`)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              {t('Next', 'التالي')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
