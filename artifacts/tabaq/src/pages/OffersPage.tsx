import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListOffers, usePurchaseVoucher, useGiftVoucher, type Offer } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tag, Clock, CheckCircle2, Gift, Users, ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

function timeUntil(dateStr: string | Date | null | undefined, lang: string): string {
  if (!dateStr) return '';
  const end = new Date(dateStr);
  const diffDays = Math.floor((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return lang === 'ar' ? 'انتهت' : 'Expired';
  if (diffDays === 0) return lang === 'ar' ? 'ينتهي اليوم' : 'Ends today';
  if (diffDays === 1) return lang === 'ar' ? 'ينتهي غداً' : 'Ends tomorrow';
  return lang === 'ar' ? `ينتهي خلال ${diffDays} يوم` : `Ends in ${diffDays} days`;
}

function OfferCard({ offer }: { offer: Offer }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [giftMode, setGiftMode] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const desc = lang === 'ar' ? offer.descriptionAr : offer.descriptionEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const isSoldOut = offer.remainingCapacity !== null && offer.remainingCapacity !== undefined && offer.remainingCapacity <= 0;

  const giftVoucher = useGiftVoucher();
  const purchaseVoucher = usePurchaseVoucher({
    mutation: {
      onSuccess: data => {
        if (giftMode && (recipientPhone || recipientEmail)) {
          giftVoucher.mutate(
            { voucherId: data.id, data: { recipientPhone: recipientPhone || undefined, recipientEmail: recipientEmail || undefined, giftMessage: giftMessage || undefined } },
            {
              onSuccess: () => { setVoucherCode(data.code); queryClient.invalidateQueries({ queryKey: ['vouchers'] }); },
              onError: () => { setVoucherCode(data.code); setGiftError(t('Voucher purchased, but gift notification failed. Share the code manually.', 'تم الشراء، لكن فشل إرسال الإشعار. شارك الرمز يدوياً.')); },
            }
          );
        } else {
          setVoucherCode(data.code);
          queryClient.invalidateQueries({ queryKey: ['vouchers'] });
        }
      },
    },
  });

  const isPending = purchaseVoucher.isPending || giftVoucher.isPending;

  const copyCode = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-card rounded-3xl overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300 flex flex-col ${expanded ? 'border-primary/40 shadow-xl' : 'border-border'}`}>
      {/* Image */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={offer.imageUrl || offer.restaurantCoverImageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop'}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-4 start-4 flex gap-2 z-10">
          <span className="bg-destructive text-destructive-foreground font-bold px-3 py-1 rounded-lg text-sm">
            -{Math.round(Number(offer.discountPercent))}%
          </span>
          {isSoldOut && (
            <span className="bg-gray-800/90 text-white font-bold px-3 py-1 rounded-lg text-sm">{t('Sold Out', 'نفدت')}</span>
          )}
        </div>
        <Link href={`/restaurants/${offer.restaurantId}`} className="absolute top-4 end-4 z-10 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-white/30 transition-colors">
          <ExternalLink className="w-3 h-3" /> {t('View Restaurant', 'عرض المطعم')}
        </Link>
        <div className="absolute bottom-0 start-0 end-0 p-5 z-10 text-white">
          <h3 className="font-bold text-xl mb-0.5">{title}</h3>
          <p className="text-white/80 text-sm">{restName}</p>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-muted-foreground line-through decoration-destructive decoration-2">
              {formatPrice(offer.originalPrice || 0, offer.currency, lang)}
            </p>
            <p className="text-2xl font-black text-primary">{formatPrice(offer.discountedPrice || 0, offer.currency, lang)}</p>
          </div>
          <div className="text-end">
            {offer.validUntil && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5" /> {timeUntil(offer.validUntil, lang)}
              </p>
            )}
            {offer.remainingCapacity !== null && offer.remainingCapacity !== undefined && offer.remainingCapacity > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                <Users className="w-3 h-3" /> {offer.remainingCapacity} {t('left', 'متبقية')}
              </p>
            )}
          </div>
        </div>

        {desc && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{desc}</p>}

        {/* Success: show voucher code inline */}
        {voucherCode ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="font-bold text-green-800 mb-1">{t('Voucher Ready!', 'القسيمة جاهزة!')}</p>
            <p className="text-sm text-green-700 mb-3">{t('Show this code at the restaurant.', 'أظهر هذا الرمز في المطعم.')}</p>
            {giftError && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">{giftError}</p>}
            <div className="bg-white border border-green-200 rounded-xl p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">{t('Voucher Code', 'رمز القسيمة')}</p>
              <p className="text-2xl font-black font-mono text-primary tracking-widest">{voucherCode}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={copyCode}>
                <Copy className="w-3.5 h-3.5" /> {copied ? t('Copied!', 'تم النسخ!') : t('Copy', 'نسخ')}
              </Button>
              <Link href="/vouchers" className="flex-1">
                <Button size="sm" className="w-full">{t('My Vouchers', 'قسائمي')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Expand/collapse purchase form */}
            {!isSoldOut && (
              <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl border text-sm font-semibold transition-all mt-auto ${expanded ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border hover:border-primary/50 text-foreground'}`}
              >
                <span>{expanded ? t('Hide Purchase Form', 'إخفاء نموذج الشراء') : t('Buy Voucher', 'شراء القسيمة')}</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            {isSoldOut && (
              <Button className="w-full mt-auto" disabled>{t('Sold Out', 'نفدت')}</Button>
            )}

            {/* Inline purchase form */}
            {expanded && !isSoldOut && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                {!user && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                    {t('You must be signed in to purchase a voucher.', 'يجب عليك تسجيل الدخول لشراء قسيمة.')}{' '}
                    <Link href="/signin" className="font-bold underline">{t('Sign In', 'تسجيل الدخول')}</Link>
                  </div>
                )}

                {/* Gift toggle */}
                <button
                  onClick={() => setGiftMode(!giftMode)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${giftMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <Gift className={`w-5 h-5 ${giftMode ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">{t('Send as a gift', 'أرسل كهدية')}</span>
                  <span className="ms-auto">{giftMode ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}</span>
                </button>

                {giftMode && (
                  <div className="space-y-3 p-4 bg-secondary/20 rounded-xl">
                    <p className="text-sm font-semibold text-foreground">{t("Recipient's Details", 'تفاصيل المستلم')}</p>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder={t('Phone (+966501234567)', 'هاتف (+966501234567)')}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder={t('Email (optional)', 'البريد الإلكتروني (اختياري)')}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <textarea
                      value={giftMessage}
                      onChange={e => setGiftMessage(e.target.value)}
                      placeholder={t('Personal message (optional)', 'رسالة شخصية (اختياري)')}
                      className="w-full min-h-[60px] px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                {purchaseVoucher.isError && (
                  <p className="text-sm text-destructive">{t('Failed to purchase. Please try again.', 'فشل الشراء. حاول مرة أخرى.')}</p>
                )}

                <Button
                  className="w-full py-5 text-base font-bold"
                  onClick={() => purchaseVoucher.mutate({ data: { offerId: offer.id } })}
                  disabled={!user || isPending}
                >
                  {isPending ? t('Processing...', 'جاري المعالجة...') : giftMode ? t('Send Gift Voucher', 'إرسال قسيمة هدية') : t('Confirm Purchase', 'تأكيد الشراء')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function OffersPage() {
  const { t } = useLanguage();
  const { data, isLoading } = useListOffers({ active: true });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 end-0 w-96 h-96 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-white rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-primary-foreground">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{t('Exclusive Offers', 'عروض حصرية')}</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
            {t('Limited-time vouchers from the best restaurants. Purchase instantly, right here on the page.', 'قسائم لفترة محدودة من أفضل المطاعم. اشتر فوراً من هنا دون أي نوافذ منبثقة.')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : !data?.offers?.length ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('No offers available', 'لا توجد عروض متاحة')}</h3>
            <p className="text-muted-foreground">{t('Check back soon for exciting deals!', 'تحقق لاحقاً للحصول على صفقات رائعة!')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.offers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        )}
      </div>
    </div>
  );
}
