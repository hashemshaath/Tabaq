import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useCart } from '@/context/CartContext';
import {
  useListDishes,
  useListCategories,
  useGetTrendingDishes,
  type ListDishesDietaryTag,
  type ListDishesSortBy,
  type DishCard as TDishCard,
  ListDishesDietaryTag as DietaryTagEnum,
} from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import {
  Star, Flame, Leaf, Wheat, Coffee, ChevronLeft, ChevronRight,
  Zap, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, Sparkles, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

type ExtendedDishCard = TDishCard & {
  isTabaqStar?: boolean;
  isMostOrdered?: boolean;
  spiceLevel?: number;
};

const LIMIT = 16;

// ── Quick-add card ────────────────────────────────────────────────
function DishQuickCard({ dish, lang }: { dish: ExtendedDishCard; lang: string }) {
  const { addItem, updateQty, items } = useCart();
  const [flash, setFlash] = useState(false);
  const cartItem = items.find(i => i.dishId === dish.id);
  const qty = cartItem?.qty ?? 0;

  const imgFallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
  const restName = lang === 'ar' ? dish.restaurantNameAr : dish.restaurantNameEn;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      dishId: dish.id,
      nameEn: dish.nameEn ?? '',
      nameAr: dish.nameAr ?? '',
      price: Number(dish.price ?? 0),
      currency: dish.currency ?? 'SAR',
      imageUrl: dish.imageUrl ?? undefined,
      restaurantId: dish.restaurantId ?? 0,
      restaurantNameEn: dish.restaurantNameEn ?? '',
      restaurantNameAr: dish.restaurantNameAr ?? '',
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };

  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(dish.id, qty - 1);
  };

  return (
    <Link href={`/dishes/${dish.id}`}>
      <div className={`rounded-2xl border overflow-hidden transition-all group cursor-pointer h-full flex flex-col ${
        dish.isTabaqStar ? 'border-amber-300/70 hover:border-amber-400' : 'border-border/60 hover:border-primary/30'
      } hover:shadow-lg`}>
        {/* Image */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
          <img
            src={dish.imageUrl || imgFallback}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = imgFallback; }}
          />
          {/* Star / Top badge */}
          {dish.isTabaqStar && (
            <div className="absolute top-0 start-0 bg-amber-500 text-white px-2 py-1 rounded-br-xl rounded-tl-2xl flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-white" />
              <span className="text-[10px] font-bold">{lang === 'ar' ? 'نجمة' : 'Star'}</span>
            </div>
          )}
          {dish.isMostOrdered && !dish.isTabaqStar && (
            <div className="absolute top-0 start-0 bg-primary text-primary-foreground px-2 py-1 rounded-br-xl rounded-tl-2xl flex items-center gap-1 shadow-sm">
              <Zap className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-bold">{lang === 'ar' ? 'الأكثر' : 'Top'}</span>
            </div>
          )}
          {/* Spice level */}
          {dish.spiceLevel && dish.spiceLevel > 0 ? (
            <div className="absolute bottom-2 start-2 flex gap-0.5">
              {Array.from({ length: Math.min(dish.spiceLevel, 3) }).map((_, i) => (
                <Flame key={i} className="w-3.5 h-3.5 fill-orange-400 text-orange-400 drop-shadow" />
              ))}
            </div>
          ) : null}

          {/* Cart controls overlay */}
          <div className="absolute bottom-2 end-2">
            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 ${
                  flash ? 'bg-emerald-500 text-white scale-110' : 'bg-white text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {flash ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            ) : (
              <div className="flex items-center bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <button
                  onClick={handleDec}
                  className="w-8 h-8 flex items-center justify-center text-primary hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-black text-primary px-1 min-w-[20px] text-center tabular-nums">{qty}</span>
                <button
                  onClick={handleAdd}
                  className="w-8 h-8 flex items-center justify-center bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{restName}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold">{Number(dish.avgRating).toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground">({dish.reviewCount})</span>
            </div>
            {dish.price && (
              <span className="text-sm font-black text-primary">
                {formatPrice(dish.price, dish.currency, lang as 'en' | 'ar')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Floating Cart Bar ─────────────────────────────────────────────
function FloatingCartBar({ lang }: { lang: string }) {
  const { totalItems, totalPrice, currency } = useCart();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-40 animate-in slide-in-from-bottom-3 duration-300">
      <Link href="/checkout">
        <div className="bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-primary/95 transition-colors active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl w-9 h-9 flex items-center justify-center relative">
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1.5 -end-1.5 bg-amber-400 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] px-1">
                {totalItems}
              </span>
            </div>
            <div>
              <p className="font-bold text-sm leading-none">{t('View Cart', 'عرض السلة')}</p>
              <p className="text-white/75 text-xs mt-0.5">
                {totalItems} {t('item', 'عنصر')}{totalItems > 1 && lang === 'en' ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base">
              {formatPrice(totalPrice, currency, lang as 'en' | 'ar')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export function DishesPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    titleEn: 'Dishes | Tabaq',
    titleAr: 'الأطباق | طبق',
    descriptionEn: 'Browse hundreds of dishes from top Saudi restaurants. Filter by cuisine, dietary tags, and more.',
    descriptionAr: 'استعرض مئات الأطباق من أفضل مطاعم السعودية. صفّح حسب نوع المطبخ والتفضيلات الغذائية وأكثر.',
  }, lang);
  const { totalItems } = useCart();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');

  const [categoryId, setCategoryId] = useState<number | undefined>(
    params.get('categoryId') ? Number(params.get('categoryId')) : undefined,
  );
  const [dietaryTag, setDietaryTag] = useState<ListDishesDietaryTag | undefined>(undefined);
  const [sortBy, setSortBy] = useState<ListDishesSortBy>('popularity');
  const [page, setPage] = useState(0);
  const [activeDietIcon, setActiveDietIcon] = useState<string | null>(null);

  const { data: categories } = useListCategories();
  const { data: trendingData } = useGetTrendingDishes({ limit: 6 });

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

  const dietaryOptions: { value: ListDishesDietaryTag; labelEn: string; labelAr: string; icon: React.ReactNode; emoji: string }[] = [
    { value: DietaryTagEnum.halal, labelEn: 'Halal', labelAr: 'حلال', icon: <span className="text-emerald-600 text-xs font-black">✓</span>, emoji: '🟢' },
    { value: DietaryTagEnum.vegetarian, labelEn: 'Vegetarian', labelAr: 'نباتي', icon: <Leaf className="w-3.5 h-3.5 text-emerald-600" />, emoji: '🌿' },
    { value: DietaryTagEnum.vegan, labelEn: 'Vegan', labelAr: 'نباتي صرف', icon: <Leaf className="w-3.5 h-3.5 text-green-700" />, emoji: '🌱' },
    { value: DietaryTagEnum.gluten_free, labelEn: 'Gluten-free', labelAr: 'خالي من الغلوتين', icon: <Wheat className="w-3.5 h-3.5 text-amber-600" />, emoji: '🌾' },
  ];

  const sortOptions: { value: ListDishesSortBy; labelEn: string; labelAr: string }[] = [
    { value: 'popularity', labelEn: 'Most Popular', labelAr: 'الأكثر شعبية' },
    { value: 'rating', labelEn: 'Highest Rated', labelAr: 'الأعلى تقييماً' },
    { value: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
  ];

  const CUISINE_EMOJIS: Record<string, string> = {
    'American': '🍔', 'أمريكي': '🍔',
    'Japanese': '🍣', 'ياباني': '🍣',
    'Italian': '🍝', 'إيطالي': '🍝',
    'Saudi': '🥘', 'سعودي': '🥘',
    'Indian': '🍛', 'هندي': '🍛',
    'Levantine': '🥙', 'شامي': '🥙',
    'Bakery & Café': '☕', 'مقهى ومخبز': '☕',
    'Seafood': '🦐', 'مأكولات بحرية': '🦐',
    'Sweets': '🍰', 'حلويات': '🍰',
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('Explore Dishes', 'استكشف الأطباق')}</h1>
            <p className="text-muted-foreground mt-1">{t('Find your next favourite dish — add straight to cart', 'اكتشف طبقك المفضل القادم — أضفه مباشرةً إلى سلتك')}</p>
          </div>
          <Link href="/restaurants" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 shrink-0">
            {t('Browse Restaurants', 'تصفح المطاعم')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Trending strip */}
        {trendingData && trendingData.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-base text-foreground">{t('Trending Now', 'رائج الآن')}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {trendingData.map((dish: any) => {
                const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
                return (
                  <Link key={dish.id} href={`/dishes/${dish.id}`}>
                    <div className="flex-shrink-0 w-36 rounded-2xl border border-border/60 overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group">
                      <div className="w-full h-24 bg-muted overflow-hidden">
                        <img
                          src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop'; }}
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">{name}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {lang === 'ar' ? dish.restaurantNameAr : dish.restaurantNameEn}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-medium">{Number(dish.avgRating).toFixed(1)}</span>
                          {dish.price && (
                            <span className="text-[10px] text-primary font-bold ms-auto">
                              {formatPrice(dish.price, dish.currency, lang as 'en' | 'ar')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Cuisine pills */}
        {categories && categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar mb-3">
            <button
              onClick={() => { setCategoryId(undefined); setPage(0); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                !categoryId ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background border-border hover:border-primary/50 text-foreground'
              }`}
            >
              ✨ {t('All Cuisines', 'كل المطابخ')}
            </button>
            {categories.map(cat => {
              const name = lang === 'ar' ? cat.nameAr : cat.nameEn;
              const emoji = CUISINE_EMOJIS[name] ?? '🍽️';
              return (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); setPage(0); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    categoryId === cat.id
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {emoji} {name}
                </button>
              );
            })}
          </div>
        )}

        {/* Dietary + Sort row */}
        <div className="flex flex-wrap gap-2 items-center mb-5">
          {dietaryOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setDietaryTag(prev => prev === opt.value ? undefined : opt.value);
                setPage(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
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
              className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{lang === 'ar' ? o.labelAr : o.labelEn}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? t('Loading...', 'جارٍ التحميل...') : t(`${total} dishes`, `${total} طبق`)}
          </p>
          {totalItems > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
              <ShoppingBag className="w-3.5 h-3.5" />
              {totalItems} {t('in cart', 'في السلة')}
            </div>
          )}
        </div>

        {/* Dishes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 overflow-hidden animate-pulse">
                <div className="bg-muted" style={{ aspectRatio: '4/3' }} />
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
            {dishes.map(rawDish => (
              <DishQuickCard key={rawDish.id} dish={rawDish as ExtendedDishCard} lang={lang} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
              {t('Previous', 'السابق')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t(`Page ${page + 1} of ${totalPages}`, `صفحة ${page + 1} من ${totalPages}`)}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              {t('Next', 'التالي')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Floating checkout bar */}
      <FloatingCartBar lang={lang} />
    </div>
  );
}
