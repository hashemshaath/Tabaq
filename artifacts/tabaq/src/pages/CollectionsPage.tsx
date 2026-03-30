import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useListRestaurants } from '@workspace/api-client-react';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ChevronRight, Layers, ArrowLeft } from 'lucide-react';
import { COLLECTIONS } from '@/lib/awards';
import { Button } from '@/components/ui/button';

function CollectionGrid({ collectionId }: { collectionId: string }) {
  const { t, lang } = useLanguage();
  const col = COLLECTIONS.find(c => c.slug === collectionId);
  if (!col) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-5xl">🍽️</div>
      <h2 className="text-2xl font-bold text-foreground">{t('Collection not found', 'المجموعة غير موجودة')}</h2>
      <p className="text-muted-foreground">{t('This collection doesn\'t exist or has been removed.', 'هذه المجموعة غير موجودة أو تم إزالتها.')}</p>
      <Link href="/collections">
        <Button>{t('Back to Collections', 'العودة إلى المجموعات')}</Button>
      </Link>
    </div>
  );

  const { data, isLoading } = useListRestaurants(
    col.params as Record<string, string | number | boolean | undefined>,
    { query: { queryKey: ['collection', collectionId] } }
  );
  const restaurants = data?.restaurants ?? [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${col.gradient} text-white`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <Link href="/collections" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('All Collections', 'كل المجموعات')}
          </Link>
          <div className="text-5xl mb-4">{col.icon}</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            {lang === 'ar' ? col.labelAr : col.labelEn}
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            {lang === 'ar' ? col.descAr : col.descEn}
          </p>
        </div>
      </div>

      {/* Restaurant grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.map((r, idx) => (
              <RestaurantCard key={r.id} restaurant={r} rank={collectionId === 'top-rated' ? idx + 1 : undefined} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-muted-foreground">{t('No restaurants in this collection yet.', 'لا توجد مطاعم في هذه المجموعة بعد.')}</p>
            <Link href="/restaurants" className="mt-4 inline-block">
              <Button>{t('Browse All', 'تصفح الكل')}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function CollectionsPage() {
  const { id } = useParams<{ id?: string }>();
  const { t, lang } = useLanguage();
  usePageMeta({
    titleEn: 'Collections | Tabaq',
    titleAr: 'المجموعات | طبق',
    descriptionEn: 'Handpicked restaurant collections for every occasion, taste, and budget across Saudi Arabia.',
    descriptionAr: 'مجموعات مطاعم مختارة بعناية لكل مناسبة وذوق وميزانية في أنحاء المملكة.',
  }, lang);

  if (id) {
    return <CollectionGrid collectionId={id} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Page Hero */}
      <div className="bg-gradient-to-br from-foreground/5 to-foreground/10 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Layers className="w-4 h-4" />
            {t('Curated Lists', 'قوائم مختارة')}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3">
            {t('Collections', 'المجموعات')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t('Handpicked restaurant collections for every occasion, taste, and budget.', 'مجموعات مطاعم مختارة بعناية لكل مناسبة وذوق وميزانية.')}
          </p>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {COLLECTIONS.map(col => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CollectionCard({ collection }: { collection: typeof COLLECTIONS[number] }) {
  const { lang } = useLanguage();
  const { data } = useListRestaurants(
    collection.params as Record<string, string | number | boolean | undefined>,
    { query: { queryKey: ['collection-preview', collection.id] } }
  );
  const restaurants = data?.restaurants ?? [];
  const previewImages = restaurants.slice(0, 3).map(r => r.coverImageUrl).filter(Boolean);

  return (
    <Link href={`/collections/${collection.slug}`} className="block group">
      <div className="relative rounded-3xl overflow-hidden border border-border/60 hover:shadow-2xl hover:border-transparent transition-all duration-300 h-60">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${collection.gradient}`} />

        {/* Preview images */}
        {previewImages.length > 0 && (
          <div className="absolute inset-0 opacity-30">
            <img src={previewImages[0]} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
          <div>
            <span className="text-4xl">{collection.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold mb-1">
              {lang === 'ar' ? collection.labelAr : collection.labelEn}
            </h3>
            <p className="text-white/75 text-xs line-clamp-2 mb-3">
              {lang === 'ar' ? collection.descAr : collection.descEn}
            </p>
            <div className="flex items-center justify-between">
              {restaurants.length > 0 && (
                <span className="text-xs text-white/70 font-medium">
                  {restaurants.length}+ {lang === 'ar' ? 'مطعم' : 'restaurants'}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-full group-hover:bg-white/30 transition-colors">
                {lang === 'ar' ? 'استكشف' : 'Explore'} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
