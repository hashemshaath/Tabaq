import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useGetFeaturedRestaurants, useGetTrendingDishes } from '@workspace/api-client-react';
import { Search, Compass, Utensils, Coffee, Wine, Cake } from 'lucide-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { DishCard } from '@/components/DishCard';
import { Link, useLocation } from 'wouter';

export function HomePage() {
  const { t, lang } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedRestaurants({ limit: 4 });
  const { data: trending, isLoading: isLoadingTrending } = useGetTrendingDishes({ limit: 4 });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = fd.get('q');
    if (q) setLocation(`/search?q=${encodeURIComponent(q.toString())}`);
  };

  const occasions = [
    { id: 1, icon: Coffee, en: 'Breakfast', ar: 'فطور' },
    { id: 2, icon: Utensils, en: 'Business', ar: 'أعمال' },
    { id: 3, icon: Wine, en: 'Romantic', ar: 'رومانسي' },
    { id: 4, icon: Cake, en: 'Birthday', ar: 'ميلاد' },
    { id: 5, icon: Compass, en: 'Outdoor', ar: 'جلسات خارجية' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Premium dining experience" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-balance leading-tight">
            {t('Discover the finest dining experiences', 'اكتشف أرقى تجارب تناول الطعام')}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {t('Find, book, and review the best restaurants, cafes, and dishes around you.', 'ابحث واحجز وقيّم أفضل المطاعم والمقاهي والأطباق من حولك.')}
          </p>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-2xl md:rounded-full border border-white/20 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow flex items-center">
              <Search className="absolute start-5 text-white/50 w-5 h-5" />
              <input 
                type="text" 
                name="q"
                placeholder={t('Search restaurants, dishes, or cuisines...', 'ابحث عن مطعم، طبق، أو نوع طعام...')}
                className="w-full h-14 bg-transparent border-none text-white placeholder:text-white/60 focus:ring-0 focus:outline-none ps-14 pe-6 text-lg"
              />
            </div>
            <button type="submit" className="h-14 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl md:rounded-full font-bold transition-all shadow-lg shadow-primary/30">
              {t('Search', 'ابحث')}
            </button>
          </form>
        </div>
      </section>

      {/* Occasions Horizontal Scroll */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
        <h2 className="text-xl font-bold text-foreground mb-6">{t('Browse by Occasion', 'تصفح حسب المناسبة')}</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {occasions.map((occ) => {
            const Icon = occ.icon;
            return (
              <Link key={occ.id} href={`/restaurants?occasion=${occ.id}`} className="snap-start flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-2xl bg-secondary hover:bg-primary hover:text-white transition-colors group cursor-pointer border border-border">
                <Icon className="w-8 h-8 mb-2 text-primary group-hover:text-white transition-colors" />
                <span className="text-sm font-semibold">{lang === 'en' ? occ.en : occ.ar}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t('Featured Restaurants', 'مطاعم مميزة')}</h2>
            <p className="text-muted-foreground mt-2">{t('Curated picks for you this week', 'خيارات مختارة لك هذا الأسبوع')}</p>
          </div>
          <Link href="/restaurants" className="text-primary font-semibold hover:underline hidden sm:block">
            {t('View all', 'عرض الكل')}
          </Link>
        </div>

        {isLoadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-72 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured?.map(rest => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        )}
      </section>

      {/* Trending Dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-secondary/50 rounded-3xl p-6 md:p-10 border border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{t('Trending Dishes', 'أطباق شائعة')}</h2>
              <p className="text-muted-foreground mt-2">{t('The highest rated items across the city', 'العناصر الأعلى تقييماً في المدينة')}</p>
            </div>
          </div>

          {isLoadingTrending ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-background animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {trending?.map((dish, idx) => (
                <DishCard key={dish.id} dish={dish} rank={idx + 1} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
