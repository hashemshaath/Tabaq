import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListOffers } from '@workspace/api-client-react';
import { Tag, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function OffersPage() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useListOffers({ active: true });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('Exclusive Offers', 'عروض حصرية')}</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
            {t('Limited time deals from the best restaurants in town. Purchase vouchers and save.', 'صفقات لفترة محدودة من أفضل مطاعم المدينة. اشتر القسائم ووفّر.')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.offers?.map(offer => {
              const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
              const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
              return (
                <div key={offer.id} className="bg-card rounded-3xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="relative aspect-video bg-muted p-6 flex flex-col justify-between">
                    <img src={offer.imageUrl || offer.restaurantCoverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <span className="bg-destructive text-destructive-foreground font-bold px-3 py-1 rounded-lg text-sm">
                        -{Math.round(Number(offer.discountPercent))}%
                      </span>
                    </div>
                    
                    <div className="relative z-10 text-white">
                      <h3 className="font-bold text-2xl mb-1">{title}</h3>
                      <p className="text-white/80">{restName}</p>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground line-through decoration-destructive decoration-2">
                          {formatPrice(offer.originalPrice || 0, offer.currency, lang)}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(offer.discountedPrice || 0, offer.currency, lang)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                          <Clock className="w-4 h-4" /> {t('Ends soon', 'ينتهي قريباً')}
                        </span>
                      </div>
                    </div>
                    
                    <Button className="w-full rounded-xl py-6 text-base mt-auto">
                      {t('Buy Voucher', 'شراء القسيمة')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
