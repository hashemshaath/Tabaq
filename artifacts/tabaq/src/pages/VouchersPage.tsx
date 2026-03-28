import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListVouchers, type Voucher } from '@workspace/api-client-react';
import { Tag, Clock, CheckCircle2, XCircle, Gift, Copy, Check } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: React.ElementType; className: string }> = {
  active: { labelEn: 'Active', labelAr: 'نشطة', icon: CheckCircle2, className: 'text-green-600 bg-green-50' },
  redeemed: { labelEn: 'Redeemed', labelAr: 'مستخدمة', icon: CheckCircle2, className: 'text-blue-600 bg-blue-50' },
  expired: { labelEn: 'Expired', labelAr: 'منتهية', icon: XCircle, className: 'text-gray-500 bg-gray-50' },
  cancelled: { labelEn: 'Cancelled', labelAr: 'ملغاة', icon: XCircle, className: 'text-red-600 bg-red-50' },
};

function VoucherCard({ voucher, lang, t }: {
  voucher: Voucher;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const [copied, setCopied] = useState(false);
  const restName = lang === 'ar' ? voucher.restaurantNameAr : voucher.restaurantNameEn;
  const status = STATUS_CONFIG[voucher.status] ?? STATUS_CONFIG.active;
  const StatusIcon = status.icon;
  const isActive = voucher.status === 'active';

  const copyCode = () => {
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-opacity ${isActive ? 'border-border' : 'border-border/50 opacity-75'}`}>
      <div className={`h-1.5 ${isActive ? 'bg-primary' : 'bg-border'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="font-bold text-foreground text-base">{restName}</p>
            {voucher.isGift && (
              <span className="inline-flex items-center gap-1 text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full mt-1">
                <Gift className="w-3 h-3" />
                {t('Gift Voucher', 'قسيمة هدية')}
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.className}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </span>
        </div>

        <div className="bg-secondary/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <code className="flex-grow text-xl font-bold font-mono text-primary tracking-widest">{voucher.code}</code>
          <button
            onClick={copyCode}
            disabled={!isActive}
            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'hover:bg-accent/50 text-muted-foreground hover:text-foreground' : 'text-muted-foreground/40 cursor-default'}`}
            title={t('Copy code', 'نسخ الرمز')}
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-foreground">
            {formatPrice(voucher.value, voucher.currency, lang as 'en' | 'ar')}
          </p>
          {voucher.validUntil && isActive && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {t('Valid until', 'صالحة حتى')} {new Date(voucher.validUntil).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {voucher.redeemedAt && !isActive && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('Used on', 'استُخدم في')} {new Date(voucher.redeemedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {voucher.giftMessage && (
          <p className="mt-3 text-sm text-muted-foreground italic bg-secondary/30 rounded-lg px-3 py-2">
            &ldquo;{voucher.giftMessage}&rdquo;
          </p>
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('My Vouchers', 'قسائمي')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your discount vouchers', 'إدارة قسائم الخصم الخاصة بك')}</p>
          </div>
          <Link href="/offers">
            <Button variant="outline">{t('Get Vouchers', 'الحصول على قسائم')}</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/40 rounded-2xl mb-6">
          {(['active', 'used'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === tabKey
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tabKey === 'active' ? t('Active', 'النشطة') : t('Used / Expired', 'المستخدمة / المنتهية')}
              {tabKey === 'active' && activeVouchers.length > 0 && (
                <span className="ms-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {activeVouchers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {tab === 'active'
                ? t('No active vouchers', 'لا توجد قسائم نشطة')
                : t('No used vouchers yet', 'لا توجد قسائم مستخدمة بعد')}
            </h3>
            {tab === 'active' && (
              <>
                <p className="text-muted-foreground mb-6">
                  {t('Browse exclusive offers and purchase vouchers to save on your next meal.', 'تصفح العروض الحصرية واشترِ القسائم لتوفير المال في وجبتك القادمة.')}
                </p>
                <Link href="/offers">
                  <Button>{t('Explore Offers', 'استكشف العروض')}</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(voucher => (
              <VoucherCard key={voucher.id} voucher={voucher} lang={lang} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
