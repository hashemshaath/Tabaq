import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListOffers, usePurchaseVoucher, useGiftVoucher, type Offer } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tag, Clock, CheckCircle2, X, Gift, Users } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

function timeUntil(dateStr: string | Date | null | undefined, lang: string): string {
  if (!dateStr) return '';
  const end = new Date(dateStr);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return lang === 'ar' ? 'انتهت' : 'Expired';
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return lang === 'ar' ? 'ينتهي اليوم' : 'Ends today';
  if (diffDays === 1) return lang === 'ar' ? 'ينتهي غداً' : 'Ends tomorrow';
  return lang === 'ar' ? `ينتهي خلال ${diffDays} يوم` : `Ends in ${diffDays} days`;
}

function VoucherPurchaseModal({
  offer,
  onClose,
  onSuccess,
}: {
  offer: Offer;
  onClose: () => void;
  onSuccess: (voucherCode: string) => void;
}) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [giftMode, setGiftMode] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [voucherCode, setVoucherCode] = useState('');
  const queryClient = useQueryClient();

  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;

  const [giftError, setGiftError] = useState<string | null>(null);

  const giftVoucher = useGiftVoucher();

  const purchaseVoucher = usePurchaseVoucher({
    mutation: {
      onSuccess: (data) => {
        if (giftMode && (recipientPhone || recipientEmail)) {
          setGiftError(null);
          giftVoucher.mutate(
            {
              voucherId: data.id,
              data: {
                recipientPhone: recipientPhone || undefined,
                recipientEmail: recipientEmail || undefined,
                giftMessage: giftMessage || undefined,
              },
            },
            {
              onSuccess: () => {
                setVoucherCode(data.code);
                setStep('success');
                queryClient.invalidateQueries({ queryKey: ['vouchers'] });
                onSuccess(data.code);
              },
              onError: () => {
                // Purchase succeeded but gift delivery failed — show voucher code with a warning
                setVoucherCode(data.code);
                setGiftError(t('Voucher purchased, but gift notification could not be sent. Share the code manually.', 'تم شراء القسيمة، لكن لم نتمكن من إرسال إشعار الهدية. شارك الرمز يدوياً.'));
                setStep('success');
                queryClient.invalidateQueries({ queryKey: ['vouchers'] });
              },
            },
          );
        } else {
          setVoucherCode(data.code);
          setStep('success');
          queryClient.invalidateQueries({ queryKey: ['vouchers'] });
          onSuccess(data.code);
        }
      },
    },
  });

  const isPending = purchaseVoucher.isPending || giftVoucher.isPending;

  const handlePurchase = () => {
    purchaseVoucher.mutate({ data: { offerId: offer.id } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10 rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {step === 'success' ? t('Voucher Purchased!', 'تم شراء القسيمة!') : t('Buy Voucher', 'شراء قسيمة')}
            </h2>
            <p className="text-sm text-muted-foreground">{restName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {step === 'success' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t('Voucher is ready!', 'القسيمة جاهزة!')}</h3>
              <p className="text-muted-foreground mb-4">{t('Use this code at the restaurant.', 'استخدم هذا الرمز في المطعم.')}</p>
              {giftError && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 text-start">
                  {giftError}
                </div>
              )}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">{t('Voucher Code', 'رمز القسيمة')}</p>
                <p className="text-2xl font-bold font-mono text-primary tracking-wider">{voucherCode}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                  {t('Close', 'إغلاق')}
                </Button>
                <Link href="/vouchers">
                  <Button className="flex-1 rounded-xl">{t('My Vouchers', 'قسائمي')}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Offer Details */}
              <div className="bg-secondary/30 rounded-2xl p-4 mb-5">
                <p className="font-semibold text-foreground mb-1">{title}</p>
                <p className="text-sm text-muted-foreground mb-3">{restName}</p>
                <div className="flex items-center gap-3">
                  <span className="text-lg line-through text-muted-foreground">
                    {formatPrice(offer.originalPrice || 0, offer.currency, lang)}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(offer.discountedPrice || 0, offer.currency, lang)}
                  </span>
                  <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-lg">
                    -{Math.round(Number(offer.discountPercent))}%
                  </span>
                </div>
                {offer.validUntil && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {timeUntil(offer.validUntil, lang)}
                  </p>
                )}
                {offer.remainingCapacity !== null && offer.remainingCapacity !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {offer.remainingCapacity} {t('remaining', 'متبقية')}
                  </p>
                )}
              </div>

              {/* Gift Mode Toggle */}
              <button
                onClick={() => setGiftMode(!giftMode)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border mb-5 transition-all ${
                  giftMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <Gift className={`w-5 h-5 ${giftMode ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm">{t('Send as a gift', 'أرسل كهدية')}</span>
              </button>

              {giftMode && (
                <div className="space-y-3 mb-5 p-4 bg-secondary/20 rounded-xl">
                  <p className="text-sm font-semibold text-foreground">{t('Recipient Details', 'تفاصيل المستلم')}</p>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    placeholder={t('Phone number (e.g. +966501234567)', 'رقم الجوال (مثال: +966501234567)')}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder={t('Email address (optional)', 'البريد الإلكتروني (اختياري)')}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <textarea
                    value={giftMessage}
                    onChange={e => setGiftMessage(e.target.value)}
                    placeholder={t('Personal gift message (optional)', 'رسالة هدية شخصية (اختياري)')}
                    className="w-full min-h-[72px] px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {!user && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3 mb-4">
                  {t('You must be signed in to purchase a voucher.', 'يجب عليك تسجيل الدخول لشراء قسيمة.')}
                </p>
              )}

              {purchaseVoucher.isError && (
                <p className="text-sm text-destructive mb-3">
                  {t('Failed to purchase voucher. Please try again.', 'فشل شراء القسيمة. حاول مرة أخرى.')}
                </p>
              )}

              <Button
                className="w-full rounded-xl py-6 text-base"
                onClick={handlePurchase}
                disabled={!user || isPending}
              >
                {isPending
                  ? t('Processing...', 'جاري المعالجة...')
                  : giftMode
                  ? t('Send Gift Voucher', 'إرسال قسيمة هدية')
                  : t('Buy Voucher', 'شراء القسيمة')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OffersPage() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useListOffers({ active: true });
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

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
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : !data?.offers?.length ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('No offers available', 'لا توجد عروض متاحة')}</h3>
            <p className="text-muted-foreground">{t('Check back soon for exciting deals!', 'تحقق لاحقاً للحصول على صفقات مثيرة!')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.offers.map(offer => {
              const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
              const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
              const isSoldOut = offer.remainingCapacity !== null && offer.remainingCapacity !== undefined && offer.remainingCapacity <= 0;

              return (
                <div key={offer.id} className="bg-card rounded-3xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={offer.imageUrl || offer.restaurantCoverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    <div className="absolute top-4 start-4 z-10 flex gap-2">
                      <span className="bg-destructive text-destructive-foreground font-bold px-3 py-1 rounded-lg text-sm">
                        -{Math.round(Number(offer.discountPercent))}%
                      </span>
                      {isSoldOut && (
                        <span className="bg-gray-800/90 text-white font-bold px-3 py-1 rounded-lg text-sm">
                          {t('Sold Out', 'نفدت')}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-0 start-0 end-0 z-10 p-5 text-white">
                      <h3 className="font-bold text-xl mb-1">{title}</h3>
                      <p className="text-white/80 text-sm">{restName}</p>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground line-through decoration-destructive decoration-2">
                          {formatPrice(offer.originalPrice || 0, offer.currency, lang)}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(offer.discountedPrice || 0, offer.currency, lang)}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-xs text-amber-600 font-medium flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5" />
                          {timeUntil(offer.validUntil, lang)}
                        </p>
                        {offer.remainingCapacity !== null && offer.remainingCapacity !== undefined && offer.remainingCapacity > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {offer.remainingCapacity} {t('left', 'متبقية')}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full rounded-xl py-5 text-base mt-auto"
                      disabled={isSoldOut}
                      onClick={() => setSelectedOffer(offer)}
                    >
                      {isSoldOut ? t('Sold Out', 'نفدت') : t('Buy Voucher', 'شراء القسيمة')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOffer && (
        <VoucherPurchaseModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onSuccess={() => { setSelectedOffer(null); }}
        />
      )}
    </div>
  );
}
