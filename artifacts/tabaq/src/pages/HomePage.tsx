import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  useGetFeaturedRestaurants,
  useGetTrendingDishes,
  useListOccasions,
  useListCategories,
  useListRestaurants,
} from '@workspace/api-client-react';
import { Search, ChevronRight, TrendingUp, Star, Coffee, Utensils, Wine, Cake, Compass, Heart, Users, Trophy, MapPin } from 'lucide-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { DishCard } from '@/components/DishCard';
import { Link, useLocation } from 'wouter';

const fallbackOccasionIcons = ['☕', '💼', '🌹', '🎂', '🌿', '🎉', '🤝', '🌙'];

export function HomePage() {
  const { t, lang } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedRestaurants({ limit: 8 });
  const { data: trending, isLoading: isLoadingTrending } = useGetTrendingDishes({ limit: 6 });
  const { data: occasions } = useListOccasions();
  const { data: categories } = useListCategories();
  const { data: topRatedData } = useListRestaurants(
    { minRating: 4.5, limit: 3 },
    { query: { queryKey: ['restaurants-top-rated-home'] } },
  );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) setLocation(`/search?q=${encodeURIComponent(q)}`);
  };

  const topCategories = categories?.slice(0, 8) || [];
  const topOccasions = occasions?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Premium dining"
            className="w-full h-full object-cover object-center"
            onError={e => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-white text-sm font-medium mb-6">
            <Star className="w-4 h-4 text-primary fill-primary" />
            {t('Trusted by food lovers across Saudi Arabia', 'موثوق به من محبي الطعام في المملكة العربية السعودية')}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight text-balance">
            {t('Discover the finest dining experiences', 'اكتشف أرقى تجارب تناول الطعام')}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {t('Find, book, and review the best restaurants and dishes in Saudi Arabia.', 'ابحث واحجز وقيّم أفضل المطاعم والأطباق في المملكة.')}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl md:rounded-full p-2 shadow-2xl flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow flex items-center">
                <Search className="absolute start-5 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('Search restaurants, dishes, or cuisines...', 'ابحث عن مطعم، طبق، أو نوع طعام...')}
                  className="w-full h-13 bg-transparent border-none text-white placeholder:text-white/60 focus:ring-0 focus:outline-none ps-14 pe-6 text-base"
                />
              </div>
              <button
                type="submit"
                className="h-13 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl md:rounded-full font-bold transition-all shadow-lg shadow-primary/30 whitespace-nowrap"
              >
                {t('Search', 'ابحث')}
              </button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {['Steak', 'Sushi', 'Pizza', 'Breakfast'].map(term => (
              <button
                key={term}
                onClick={() => setLocation(`/search?q=${term}`)}
                className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions Section */}
      {topOccasions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-14">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-foreground">{t('Browse by Occasion', 'تصفح حسب المناسبة')}</h2>
            <Link href="/restaurants" className="text-primary text-sm font-semibold hover:underline hidden sm:flex items-center gap-1">
              {t('See all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar snap-x">
            {topOccasions.map((occ, idx) => (
              <Link
                key={occ.id}
                href={`/restaurants?occasion=${occ.id}`}
                className="snap-start flex flex-col items-center justify-center min-w-[110px] h-[110px] rounded-2xl bg-secondary hover:bg-primary hover:text-white transition-all group cursor-pointer border border-border/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
              >
                <span className="text-3xl mb-2">{occ.icon || fallbackOccasionIcons[idx % fallbackOccasionIcons.length]}</span>
                <span className="text-xs font-semibold text-center px-2 leading-tight">
                  {lang === 'ar' ? occ.nameAr : occ.nameEn}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories Row */}
      {topCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-5">{t('Cuisine Types', 'أنواع المطابخ')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar snap-x">
            {topCategories.map(cat => (
              <Link
                key={cat.id}
                href={`/restaurants?categoryId=${cat.id}`}
                className="snap-start px-5 py-2.5 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all whitespace-nowrap text-sm font-semibold"
              >
                {lang === 'ar' ? cat.nameAr : cat.nameEn}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Restaurants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('Featured Restaurants', 'مطاعم مميزة')}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t('Curated picks for you this week', 'خيارات مختارة لك هذا الأسبوع')}</p>
          </div>
          <Link href="/restaurants?featured=true" className="text-primary font-semibold hover:underline text-sm hidden sm:flex items-center gap-1">
            {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : featured && featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.slice(0, 8).map(rest => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('No featured restaurants available.', 'لا توجد مطاعم مميزة متاحة.')}</p>
          </div>
        )}
      </section>

      {/* Top-Rated Venues by City */}
      {topRatedData && topRatedData.restaurants.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-amber-600 font-semibold text-sm">{t('Editor\'s Choice', 'اختيار المحررين')}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('Top-Rated Venues', 'الأماكن الأعلى تقييماً')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('Highest-rated restaurants in Saudi Arabia', 'أعلى المطاعم تقييماً في المملكة العربية السعودية')}</p>
            </div>
            <Link href="/restaurants?minRating=4.5" className="text-primary font-semibold hover:underline text-sm hidden sm:flex items-center gap-1">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topRatedData.restaurants.map((rest, idx) => (
              <Link key={rest.id} href={`/restaurants/${rest.id}`}>
                <div className="relative rounded-2xl overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-xl transition-all group cursor-pointer h-48">
                  <img
                    src={rest.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'}
                    alt={lang === 'ar' ? rest.nameAr : rest.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute top-3 start-3">
                    <span className="bg-amber-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="absolute bottom-0 start-0 end-0 p-3">
                    <h3 className="text-white font-bold text-sm line-clamp-1">
                      {lang === 'ar' ? rest.nameAr : rest.nameEn}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-white text-xs font-semibold">{Number(rest.avgRating).toFixed(1)}</span>
                      <span className="text-white/60 text-xs">({rest.reviewCount.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-gradient-to-br from-secondary/80 to-secondary/30 rounded-3xl p-6 md:p-10 border border-border/50">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-primary font-semibold text-sm">{t('Top Rated', 'الأعلى تقييماً')}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('Trending Dishes', 'أطباق شائعة')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('The highest rated items across the city', 'العناصر الأعلى تقييماً في المدينة')}</p>
            </div>
            <Link href="/dishes" className="text-primary font-semibold text-sm hover:underline hidden sm:flex items-center gap-1">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingTrending ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-background animate-pulse rounded-2xl" />)}
            </div>
          ) : trending && trending.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {trending.map((dish, idx) => (
                <DishCard key={dish.id} dish={dish} rank={idx + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('No trending dishes right now.', 'لا توجد أطباق شائعة الآن.')}</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="relative bg-primary rounded-3xl p-8 md:p-12 overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 end-0 w-64 h-64 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 start-0 w-48 h-48 bg-white rounded-full -translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="flex-grow text-center md:text-start">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('Share your dining experiences', 'شارك تجارب تناول الطعام')}</h2>
              <p className="text-white/80">{t('Write reviews, earn points, and become a top food critic.', 'اكتب تقييمات، اكسب نقاط، وكن ناقداً غذائياً متميزاً.')}</p>
            </div>
            <Link href="/leaderboard">
              <button className="shrink-0 bg-white text-primary font-bold px-7 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-lg whitespace-nowrap">
                {t('View Leaderboard', 'عرض المتصدرين')}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
