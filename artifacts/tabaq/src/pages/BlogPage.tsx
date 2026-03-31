import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Search, Clock, User, Tag, TrendingUp, BookOpen, ChevronRight, Flame, Star, ArrowRight } from 'lucide-react';

const SAMPLE_CATEGORIES = [
  { id: 0, slug: 'all', nameEn: 'All', nameAr: 'الكل' },
  { id: 1, slug: 'restaurant-guides', nameEn: 'Restaurant Guides', nameAr: 'أدلة المطاعم' },
  { id: 2, slug: 'food-culture', nameEn: 'Food & Culture', nameAr: 'الطعام والثقافة' },
  { id: 3, slug: 'chef-stories', nameEn: 'Chef Stories', nameAr: 'قصص الشيف' },
  { id: 4, slug: 'new-openings', nameEn: 'New Openings', nameAr: 'افتتاحيات جديدة' },
  { id: 5, slug: 'food-trends', nameEn: 'Food Trends', nameAr: 'ترندات الطعام' },
  { id: 6, slug: 'travel-eat', nameEn: 'Travel & Eat', nameAr: 'سافر وكُل' },
];

const SAMPLE_POSTS = [
  {
    id: 1, slug: 'best-restaurants-riyadh-2025',
    titleEn: 'The Best Restaurants in Riyadh for 2025', titleAr: 'أفضل مطاعم الرياض لعام ٢٠٢٥',
    excerptEn: 'From traditional Saudi cuisine to international fine dining, our editors handpick the definitive list of must-visit restaurants in the Saudi capital this year.',
    excerptAr: 'من المأكولات السعودية التقليدية إلى المطابخ العالمية الراقية، يختار محررونا القائمة النهائية للمطاعم التي يجب زيارتها في العاصمة السعودية هذا العام.',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop',
    authorName: 'Layla Al-Rasheed', authorAr: 'ليلى الرشيد',
    authorAvatar: 'https://i.pravatar.cc/60?u=layla',
    categoryEn: 'Restaurant Guides', categoryAr: 'أدلة المطاعم',
    categorySlug: 'restaurant-guides',
    readTimeEn: '8 min read', readTimeAr: '٨ دقائق قراءة',
    publishedAt: '2025-03-15', featured: true, trending: true,
    tags: ['Riyadh', 'Fine Dining', 'Saudi Cuisine'],
  },
  {
    id: 2, slug: 'saudi-coffee-culture-guide',
    titleEn: 'Saudi Coffee Culture: A Deep Dive into Qahwa', titleAr: 'ثقافة القهوة السعودية: رحلة في عالم القهوة العربية',
    excerptEn: 'Discover the rich traditions behind Saudi coffee, from the ceremonial pour of qahwa to the modern specialty café scene thriving across the Kingdom.',
    excerptAr: 'اكتشف التقاليد الغنية خلف القهوة السعودية، من طقوس تقديم القهوة العربية إلى مشهد المقاهي المتخصصة الحديث المزدهر في أنحاء المملكة.',
    coverImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop',
    authorName: 'Omar Al-Zahrani', authorAr: 'عمر الزهراني',
    authorAvatar: 'https://i.pravatar.cc/60?u=omar',
    categoryEn: 'Food & Culture', categoryAr: 'الطعام والثقافة',
    categorySlug: 'food-culture',
    readTimeEn: '6 min read', readTimeAr: '٦ دقائق قراءة',
    publishedAt: '2025-03-10', featured: true, trending: false,
    tags: ['Coffee', 'Qahwa', 'Culture', 'Tradition'],
  },
  {
    id: 3, slug: 'chef-noura-interview',
    titleEn: 'Chef Noura Al-Ghamdi on Reinventing Saudi Cuisine', titleAr: 'الشيف نورة الغامدي: إعادة اختراع المطبخ السعودي',
    excerptEn: 'We sat down with one of the Kingdom\'s most celebrated female chefs to discuss her journey, inspirations, and the future of Saudi gastronomy.',
    excerptAr: 'جلسنا مع إحدى أبرز الشيفات في المملكة لنناقش مسيرتها ومصادر إلهامها ومستقبل فن الطهي السعودي.',
    coverImage: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=450&fit=crop',
    authorName: 'Tabaq Editorial', authorAr: 'تحرير طبق',
    authorAvatar: 'https://i.pravatar.cc/60?u=editorial',
    categoryEn: 'Chef Stories', categoryAr: 'قصص الشيف',
    categorySlug: 'chef-stories',
    readTimeEn: '10 min read', readTimeAr: '١٠ دقائق قراءة',
    publishedAt: '2025-03-05', featured: false, trending: true,
    tags: ['Chef Interview', 'Women in Food', 'Saudi Cuisine'],
  },
  {
    id: 4, slug: 'jeddah-waterfront-dining',
    titleEn: 'Jeddah\'s Best Waterfront Dining Spots in 2025', titleAr: 'أفضل مطاعم كورنيش جدة لعام ٢٠٢٥',
    excerptEn: 'The Corniche has transformed into a dining destination like no other. We explore the best spots overlooking the Red Sea.',
    excerptAr: 'تحوّل الكورنيش إلى وجهة مطاعم لا مثيل لها. نستكشف أفضل الأماكن المطلة على البحر الأحمر.',
    coverImage: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800&h=450&fit=crop',
    authorName: 'Sara Al-Malik', authorAr: 'سارة الملك',
    authorAvatar: 'https://i.pravatar.cc/60?u=sara',
    categoryEn: 'Restaurant Guides', categoryAr: 'أدلة المطاعم',
    categorySlug: 'restaurant-guides',
    readTimeEn: '7 min read', readTimeAr: '٧ دقائق قراءة',
    publishedAt: '2025-02-28', featured: false, trending: false,
    tags: ['Jeddah', 'Waterfront', 'Seafood'],
  },
  {
    id: 5, slug: 'ramadan-iftar-guide',
    titleEn: 'The Ultimate Ramadan Iftar Dining Guide', titleAr: 'الدليل الشامل لمطاعم الإفطار الرمضاني',
    excerptEn: 'From lavish tent buffets to intimate family iftar experiences, we round up the best Ramadan dining across the Kingdom.',
    excerptAr: 'من البوفيهات الفاخرة في الخيام إلى تجارب الإفطار العائلية المميزة، نستعرض أفضل تجارب رمضان في أنحاء المملكة.',
    coverImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop',
    authorName: 'Mohammed Al-Otaibi', authorAr: 'محمد العتيبي',
    authorAvatar: 'https://i.pravatar.cc/60?u=mohammed',
    categoryEn: 'Food & Culture', categoryAr: 'الطعام والثقافة',
    categorySlug: 'food-culture',
    readTimeEn: '5 min read', readTimeAr: '٥ دقائق قراءة',
    publishedAt: '2025-02-20', featured: false, trending: true,
    tags: ['Ramadan', 'Iftar', 'Buffet'],
  },
  {
    id: 6, slug: 'top-new-openings-q1',
    titleEn: 'Top New Restaurant Openings in Saudi Arabia: Q1 2025', titleAr: 'أبرز افتتاحيات المطاعم في المملكة: الربع الأول ٢٠٢٥',
    excerptEn: 'The first quarter of 2025 has brought an exciting wave of new restaurants. Here\'s everything you need to know.',
    excerptAr: 'أفرز الربع الأول من ٢٠٢٥ موجة مثيرة من المطاعم الجديدة. إليك كل ما تحتاج معرفته.',
    coverImage: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=450&fit=crop',
    authorName: 'Tabaq Editorial', authorAr: 'تحرير طبق',
    authorAvatar: 'https://i.pravatar.cc/60?u=editorial2',
    categoryEn: 'New Openings', categoryAr: 'افتتاحيات جديدة',
    categorySlug: 'new-openings',
    readTimeEn: '9 min read', readTimeAr: '٩ دقائق قراءة',
    publishedAt: '2025-01-31', featured: false, trending: false,
    tags: ['New Openings', 'Saudi Arabia', '2025'],
  },
];

function formatDate(dateStr: string, lang: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function BlogPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
  const selectedCategoryId = SAMPLE_CATEGORIES.find(c => c.slug === selectedCategory)?.id ?? 0;

  const { data: apiPosts } = useQuery({
    queryKey: ['blog-posts', selectedCategoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (selectedCategoryId > 0) params.set('categoryId', String(selectedCategoryId));
      const res = await fetch(`${apiBase}/api/blog/posts?${params}`);
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const rawApiPosts = apiPosts?.posts ?? [];
  const normalizedApiPosts = rawApiPosts.map((p: any) => ({
    ...p,
    featured: p.isFeatured ?? false,
    trending: (p.viewCount ?? 0) > 500,
    categorySlug: p.categorySlug ?? (p.categoryNameEn ? p.categoryNameEn.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '') : 'restaurant-guides'),
    categoryEn: p.categoryNameEn ?? p.categoryEn ?? 'Restaurant Guides',
    categoryAr: p.categoryNameAr ?? p.categoryAr ?? 'أدلة المطاعم',
    coverImage: p.coverImageUrl ?? p.coverImage ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    authorName: p.authorNameEn ?? p.authorName ?? 'Tabaq Editorial',
    authorAr: p.authorNameAr ?? p.authorAr ?? 'فريق طبق التحريري',
    authorAvatar: p.authorAvatarUrl ?? p.authorAvatar ?? `https://i.pravatar.cc/60?u=${p.authorId ?? 1}`,
    readTimeEn: `${p.readTimeMinutes ?? 5} min read`,
    readTimeAr: `${p.readTimeMinutes ?? 5} دقائق قراءة`,
    tags: Array.isArray(p.tags) ? p.tags : [],
    commentsCount: Math.floor((p.viewCount ?? 0) / 120),
    likesCount: Math.floor((p.viewCount ?? 0) / 40),
  }));

  const posts = normalizedApiPosts;

  const filtered = posts.filter((p: any) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      (p.titleEn?.toLowerCase().includes(query)) ||
      (p.titleAr?.includes(query)) ||
      (p.excerptEn?.toLowerCase().includes(query));
    return matchesSearch;
  });

  const featured = filtered.filter((p: any) => p.featured);
  const trending = normalizedApiPosts.filter((p: any) => p.trending).slice(0, 4);
  const regular = filtered.filter((p: any) => !p.featured);

  return (
    <div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-red-700 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <BookOpen className="w-4 h-4" />
            <span>{t('Tabaq Magazine', 'مجلة طبق')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
            {t('Food Stories & Guides', 'قصص وأدلة الطعام')}
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mb-8">
            {t(
              'Discover the best restaurants, chef interviews, food culture, and culinary trends across Saudi Arabia and the Arab world.',
              'اكتشف أفضل المطاعم ومقابلات الشيف وثقافة الطعام والترندات الطهوية في المملكة العربية السعودية والعالم العربي.'
            )}
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('Search articles...', 'ابحث في المقالات...')}
              className="w-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl ps-12 pe-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8 -mx-4 px-4">
          {SAMPLE_CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {t(cat.nameEn, cat.nameAr)}
            </button>
          ))}
        </div>

        {/* Featured Articles */}
        {featured.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-xl font-black text-foreground">{t('Featured', 'مميز')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((post: typeof SAMPLE_POSTS[0], i: number) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className={`group cursor-pointer rounded-3xl overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-xl transition-all ${i === 0 ? 'md:col-span-2' : ''}`}>
                    <div className={`relative overflow-hidden ${i === 0 ? 'h-72 md:h-80' : 'h-52'}`}>
                      <img
                        src={post.coverImage}
                        alt={lang === 'ar' ? post.titleAr : post.titleEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 start-4">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                          {t(post.categoryEn, post.categoryAr)}
                        </span>
                      </div>
                      {post.trending && (
                        <div className="absolute top-4 end-4 flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          <Flame className="w-3 h-3" />
                          {t('Trending', 'رائج')}
                        </div>
                      )}
                      <div className="absolute bottom-0 start-0 end-0 p-5">
                        <h3 className={`font-black text-white leading-tight mb-2 ${i === 0 ? 'text-xl md:text-2xl' : 'text-base'}`}>
                          {lang === 'ar' ? post.titleAr : post.titleEn}
                        </h3>
                        {i === 0 && (
                          <p className="text-white/80 text-sm line-clamp-2 mb-3">
                            {lang === 'ar' ? post.excerptAr : post.excerptEn}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-white/70 text-xs">
                          <img src={post.authorAvatar} alt={post.authorName} className="w-6 h-6 rounded-full object-cover" />
                          <span>{lang === 'ar' ? post.authorAr : post.authorName}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lang === 'ar' ? post.readTimeAr : post.readTimeEn}</span>
                          <span>·</span>
                          <span>{formatDate(post.publishedAt, lang)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* All Posts */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-foreground">
                {selectedCategory !== 'all'
                  ? t(SAMPLE_CATEGORIES.find(c => c.slug === selectedCategory)?.nameEn ?? '', SAMPLE_CATEGORIES.find(c => c.slug === selectedCategory)?.nameAr ?? '')
                  : searchQuery
                    ? t('Search Results', 'نتائج البحث')
                    : t('Latest Articles', 'أحدث المقالات')
                }
              </h2>
              <span className="text-sm text-muted-foreground">{filtered.length} {t('articles', 'مقال')}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">{t('No articles found', 'لم يتم العثور على مقالات')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {(selectedCategory !== 'all' || searchQuery ? filtered : regular).map((post: typeof SAMPLE_POSTS[0]) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="group cursor-pointer flex gap-4 p-4 rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md bg-card transition-all">
                      <div className="relative w-32 h-24 shrink-0 rounded-xl overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={lang === 'ar' ? post.titleAr : post.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {post.trending && (
                          <div className="absolute top-1 start-1 bg-orange-500 rounded-full p-1">
                            <Flame className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                            {t(post.categoryEn, post.categoryAr)}
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                          {lang === 'ar' ? post.titleAr : post.titleEn}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {lang === 'ar' ? post.excerptAr : post.excerptEn}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <img src={post.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
                          <span>{lang === 'ar' ? post.authorAr : post.authorName}</span>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          <span>{lang === 'ar' ? post.readTimeAr : post.readTimeEn}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending */}
            <div className="bg-card border border-border rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">{t('Trending Now', 'الأكثر تداولاً')}</h3>
              </div>
              <div className="space-y-4">
                {trending.map((post, i) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="group flex gap-3 cursor-pointer">
                      <span className="text-3xl font-black text-muted-foreground/20 leading-none w-8 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {lang === 'ar' ? post.titleAr : post.titleEn}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{lang === 'ar' ? post.readTimeAr : post.readTimeEn}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-card border border-border rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">{t('Popular Tags', 'الوسوم الشائعة')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Riyadh', 'Jeddah', 'Saudi Cuisine', 'Coffee', 'Ramadan', 'Fine Dining', 'Seafood', 'Street Food', 'Chef Stories', 'New Openings'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="text-xs bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary px-3 py-1.5 rounded-full transition-colors font-medium"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div className="bg-gradient-to-br from-primary to-red-700 text-white rounded-3xl p-5">
              <h3 className="font-bold mb-2">{t('Stay in the loop', 'ابقَ على اطلاع')}</h3>
              <p className="text-sm text-primary-foreground/80 mb-4">
                {t('Get the best food stories delivered to your inbox weekly.', 'احصل على أفضل قصص الطعام في بريدك الإلكتروني أسبوعياً.')}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t('Your email', 'بريدك الإلكتروني')}
                  className="flex-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
                />
                <button className="bg-white text-primary font-bold text-sm px-3 py-2 rounded-xl hover:bg-white/90 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-card border border-border rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">{t('Categories', 'الفئات')}</h3>
              </div>
              <div className="space-y-2">
                {SAMPLE_CATEGORIES.filter(c => c.id > 0).map(cat => {
                  const count = posts.filter((p: any) => p.categorySlug === cat.slug).length;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${selectedCategory === cat.slug ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'}`}
                    >
                      <span>{t(cat.nameEn, cat.nameAr)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{count}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
