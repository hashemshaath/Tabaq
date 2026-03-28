import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListVouchers, type Voucher } from '@workspace/api-client-react';
import { Tag, Clock, CheckCircle2, XCircle, Gift, Copy, Check, ScanLine, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: React.ElementType; className: string }> = {
  active: { labelEn: 'Active', labelAr: 'نشطة', icon: CheckCircle2, className: 'text-green-700 bg-green-100 border-green-200' },
  used: { labelEn: 'Used', labelAr: 'مستخدمة', icon: CheckCircle2, className: 'text-blue-700 bg-blue-100 border-blue-200' },
  expired: { labelEn: 'Expired', labelAr: 'منتهية', icon: XCircle, className: 'text-gray-500 bg-gray-100 border-gray-200' },
};

function VoucherCard({ voucher, lang, t }: {
  voucher: Voucher;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const [copied, setCopied] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);

  const restName = lang === 'ar' ? voucher.restaurantNameAr : voucher.restaurantNameEn;
  const status = STATUS_CONFIG[voucher.status] ?? STATUS_CONFIG.expired;
  const StatusIcon = status.icon;
  const isActive = voucher.status === 'active';

  const copyCode = () => {
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`bg-card rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isActive ? 'border-border' : 'border-border/50 opacity-80'}`}>
      {/* Top accent bar */}
      <div className={`h-1.5 ${isActive ? 'bg-primary' : 'bg-border'}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/restaurants/${voucher.restaurantId}`} className="font-bold text-lg text-foreground hover:text-primary transition-colors">
              {restName}
            </Link>
            {voucher.isGift && (
              <span className="inline-flex items-center gap-1 text-xs text-pink-600 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full mt-1 ms-2">
                <Gift className="w-3 h-3" />
                {t('Gift Voucher', 'قسيمة هدية')}
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${status.className}`}>
            <StatusIcon className="w-3 h-3" />
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </span>
        </div>

        {/* Value + Expiry */}
        <div className="flex items-center justify-between">
          <p className="text-3xl font-black text-primary">
            {formatPrice(voucher.value, voucher.currency, lang as 'en' | 'ar')}
          </p>
          {voucher.validUntil && isActive && (
            <p className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {t('Valid until', 'صالحة حتى')}{' '}
              {new Date(voucher.validUntil).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {voucher.redeemedAt && !isActive && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('Used on', 'استُخدم في')}{' '}
              {new Date(voucher.redeemedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Voucher Code */}
        <div className="bg-secondary/40 border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-3">
          <code className="flex-grow text-xl font-bold font-mono text-primary tracking-widest">{voucher.code}</code>
          <button
            onClick={copyCode}
            disabled={!isActive}
            className={`p-2 rounded-xl transition-all ${isActive ? 'hover:bg-accent/60 text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-default'}`}
            title={t('Copy code', 'نسخ الرمز')}
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {voucher.giftMessage && (
          <div className="bg-pink-50 border border-pink-100 rounded-xl px-4 py-2.5 text-sm text-pink-700 italic">
            &ldquo;{voucher.giftMessage}&rdquo;
          </div>
        )}

        {voucher.isGift && voucher.role === 'owner' && (
          <div className={`rounded-xl px-3 py-2.5 text-xs flex items-center gap-1.5 ${
            voucher.giftDeliveryStatus === 'delivered' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
          }`}>
            <Gift className="w-3.5 h-3.5 shrink-0" />
            {voucher.giftDeliveryStatus === 'delivered'
              ? t('Gift delivered to registered recipient', 'تم تسليم الهدية للمستلم المسجل')
              : t('Gift pending — recipient not yet registered', 'الهدية معلقة — المستلم لم يسجل بعد')
            }
          </div>
        )}

        {voucher.isGift && voucher.role === 'recipient' && (
          <div className="bg-pink-50 border border-pink-100 rounded-xl px-3 py-2.5 text-xs text-pink-700 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 shrink-0" />
            {t('You received this as a gift', 'لقد تلقيت هذا كهدية')}
          </div>
        )}

        {/* Redeem Button */}
        {isActive && (
          <div>
            <button
              onClick={() => setShowRedeem(!showRedeem)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showRedeem ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
            >
              <ScanLine className="w-4 h-4" />
              {t('Redeem at Restaurant', 'استرداد في المطعم')}
              {showRedeem ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Inline Redeem Instructions */}
            {showRedeem && (
              <div className="mt-3 bg-secondary/30 border border-border/60 rounded-2xl p-5">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {t('How to redeem', 'كيفية الاسترداد')}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t(
                    'Show this code to the restaurant staff. They will enter or scan it to apply your discount.',
                    'أظهر هذا الرمز لموظف المطعم. سيقوم بإدخاله أو مسحه لتطبيق الخصم.'
                  )}
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1.5">{t('Your Voucher Code', 'رمز قسيمتك')}</p>
                  <p className="text-3xl font-black font-mono text-primary tracking-widest">{voucher.code}</p>
                </div>
                <button
                  onClick={copyCode}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent/50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('Copied!', 'تم النسخ!') : t('Copy Code', 'نسخ الرمز')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function VouchersPage() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<'active' | 'used'>('active');

  const { data, isLoading } = useListVouchers(undefined, {
    query: { queryKey: ['vouchers'] },
  });

  const allVouchers = data ?? [];
  const activeVouchers = allVouchers.filter(v => v.status === 'active');
  const usedVouchers = allVouchers.filter(v => v.status !== 'active');
  const displayed = tab === 'active' ? activeVouchers : usedVouchers;

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">{t('My Vouchers', 'قسائمي')}</h1>
              <p className="text-muted-foreground mt-1">{t('View and redeem your discount vouchers', 'اعرض واسترد قسائم الخصم الخاصة بك')}</p>
            </div>
            <Link href="/offers">
              <Button variant="outline" className="shrink-0 gap-2">
                <Tag className="w-4 h-4" />
                {t('Get Vouchers', 'احصل على قسائم')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/40 rounded-2xl mb-8">
          {(['active', 'used'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === tabKey ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tabKey === 'active' ? t('Active', 'النشطة') : t('Used / Expired', 'المستخدمة / المنتهية')}
              {tabKey === 'active' && activeVouchers.length > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                  {activeVouchers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-44 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Tag className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {tab === 'active' ? t('No active vouchers', 'لا توجد قسائم نشطة') : t('No past vouchers', 'لا توجد قسائم سابقة')}
            </h3>
            {tab === 'active' && (
              <>
                <p className="text-muted-foreground mb-6 text-sm">
                  {t('Browse exclusive offers and get vouchers to save on your next meal.', 'تصفح العروض الحصرية واحصل على قسائم لتوفير المال في وجبتك القادمة.')}
                </p>
                <Link href="/offers">
                  <Button>{t('Explore Offers', 'استكشف العروض')}</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {displayed.map(voucher => (
              <VoucherCard key={voucher.id} voucher={voucher} lang={lang} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
