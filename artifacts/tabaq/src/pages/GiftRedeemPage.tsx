import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Gift, CheckCircle2, QrCode, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useGetExperienceGift,
  useRedeemExperienceGift,
} from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

const DESIGN_GRADIENTS: Record<string, { gradient: string; emoji: string }> = {
  celebration: { gradient: 'from-rose-400 to-pink-600', emoji: '🎉' },
  birthday: { gradient: 'from-amber-400 to-orange-500', emoji: '🎂' },
  anniversary: { gradient: 'from-violet-500 to-purple-700', emoji: '💜' },
  classic: { gradient: 'from-emerald-400 to-teal-600', emoji: '✨' },
  ramadan: { gradient: 'from-yellow-500 to-amber-700', emoji: '🌙' },
};

export function GiftRedeemPage() {
  const { code } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [redeemError, setRedeemError] = useState('');

  const {
    data: gift,
    isLoading,
    isError,
  } = useGetExperienceGift(code ?? '', {
    query: { enabled: !!code } as any,
  });

  const redeemGift = useRedeemExperienceGift();

  const handleRedeem = async () => {
    if (!code || !user) return;
    setRedeemError('');
    try {
      await redeemGift.mutateAsync({ code });
    } catch (err: any) {
      setRedeemError(
        err?.message ?? t('Could not redeem gift. Please try again.', 'تعذر استرداد الهدية. يرجى المحاولة.')
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('Loading gift…', 'جاري التحميل…')}</p>
        </div>
      </div>
    );
  }

  if (isError || !gift) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center w-full max-w-sm">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('Gift not found', 'الهدية غير موجودة')}</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {t('This gift code is invalid or has expired.', 'رمز الهدية هذا غير صالح أو انتهت صلاحيته.')}
          </p>
          <Link href="/experiences">
            <Button variant="outline">{t('Browse Experiences', 'تصفح التجارب')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const design = DESIGN_GRADIENTS[gift.giftCardDesign] ?? DESIGN_GRADIENTS.classic;
  const experienceName = lang === 'ar'
    ? (gift.experienceTitleAr ?? gift.experienceTitleEn ?? '')
    : (gift.experienceTitleEn ?? '');

  const isRedeemed = gift.status === 'redeemed' || redeemGift.isSuccess;
  const isExpired = gift.status === 'expired';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {isRedeemed ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t('Gift Redeemed!', 'تم استرداد الهدية!')}</h1>
            <p className="text-muted-foreground mb-6">
              {t('Your gift has been applied. Browse experiences to book your session.', 'تم تطبيق هديتك. تصفح التجارب لحجز جلستك.')}
            </p>
            <Link href="/experiences">
              <Button className="gap-2">
                {t('Browse Experiences', 'تصفح التجارب')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Gift Card Visual */}
            <div className={cn(
              'relative rounded-3xl bg-gradient-to-br p-8 text-white mb-6 shadow-2xl overflow-hidden',
              design.gradient
            )}>
              <div className="absolute top-0 end-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 start-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
              <div className="relative">
                <div className="text-4xl mb-3">{design.emoji}</div>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-sm">
                    {t('A gift experience from', 'تجربة هدية من')}
                  </span>
                </div>
                <p className="text-xl font-bold mb-4">{gift.recipientName}</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  {experienceName && <p className="font-bold text-lg">{experienceName}</p>}
                  {gift.personalMessage && (
                    <p className="text-white/80 text-sm mt-1 italic">"{gift.personalMessage}"</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs">{t('Gift Code', 'رمز الهدية')}</p>
                    <p className="font-mono font-black text-lg tracking-widest">{gift.redeemCode}</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    {gift.qrCodeUrl ? (
                      <img src={gift.qrCodeUrl} alt="QR" className="w-10 h-10 object-contain" />
                    ) : (
                      <QrCode className="w-7 h-7 text-gray-800" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isExpired ? (
              <div className="bg-card rounded-2xl border border-destructive/30 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                <h2 className="font-bold text-foreground mb-2">{t('Gift Expired', 'انتهت صلاحية الهدية')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('This gift has expired and can no longer be redeemed.', 'انتهت صلاحية هذه الهدية ولا يمكن استردادها.')}
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-foreground">{t('How to Redeem', 'كيفية الاسترداد')}</h2>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    {t('Click "Redeem Gift" below to apply your gift to your account.', 'انقر على "استرداد الهدية" أدناه لتطبيق هديتك على حسابك.')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    {t('Browse and book the experience using your gift credit.', 'تصفح وأحجز التجربة باستخدام رصيد هديتك.')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                    {t('Enjoy your culinary adventure!', 'استمتع بمغامرتك الطهوية!')}
                  </li>
                </ol>

                {!user && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400 mb-4">
                    {t('Please sign in to redeem your gift.', 'يرجى تسجيل الدخول لاسترداد هديتك.')}{' '}
                    <Link href="/signin" className="font-semibold underline">{t('Sign in', 'دخول')}</Link>
                  </div>
                )}

                {redeemError && (
                  <p className="text-sm text-destructive flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />{redeemError}
                  </p>
                )}

                <Button
                  className="w-full py-5 text-base font-bold gap-2"
                  onClick={handleRedeem}
                  disabled={redeemGift.isPending || !user}
                >
                  <Gift className="w-5 h-5" />
                  {redeemGift.isPending
                    ? t('Redeeming…', 'جاري الاسترداد…')
                    : t('Redeem Gift', 'استرداد الهدية')}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t('This gift code can only be used once.', 'يمكن استخدام رمز الهدية مرة واحدة فقط.')}
                </p>

                {gift.expiresAt && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {t('Expires: ', 'تنتهي في: ')}
                    {new Date(gift.expiresAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
