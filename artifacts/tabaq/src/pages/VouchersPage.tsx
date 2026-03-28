import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListVouchers, type Voucher } from '@workspace/api-client-react';
import { Tag, Clock, CheckCircle2, XCircle, Gift, Copy, Check, ScanLine } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: React.ElementType; className: string }> = {
  active: { labelEn: 'Active', labelAr: 'نشطة', icon: CheckCircle2, className: 'text-green-600 bg-green-50' },
  used: { labelEn: 'Used', labelAr: 'مستخدمة', icon: CheckCircle2, className: 'text-blue-600 bg-blue-50' },
  expired: { labelEn: 'Expired', labelAr: 'منتهية', icon: XCircle, className: 'text-gray-500 bg-gray-50' },
};

function VoucherCard({ voucher, lang, t, onRedeem }: {
  voucher: Voucher;
  lang: string;
  t: (en: string, ar: string) => string;
  onRedeem: (id: number, code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
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

        {/* Gift delivery status for sender */}
        {voucher.isGift && voucher.role === 'owner' && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 ${
            voucher.giftDeliveryStatus === 'delivered'
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}>
            <Gift className="w-3.5 h-3.5" />
            {voucher.giftDeliveryStatus === 'delivered'
              ? t('Gift delivered to registered recipient', 'تم تسليم الهدية للمستلم المسجل')
              : t('Gift pending — recipient not yet registered', 'الهدية معلقة — المستلم لم يسجل بعد')
            }
          </div>
        )}

        {/* Received gift banner */}
        {voucher.isGift && voucher.role === 'recipient' && (
          <div className="mt-3 bg-pink-50 rounded-lg px-3 py-2 text-xs text-pink-700 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            {t('You received this as a gift', 'لقد تلقيت هذا كهدية')}
          </div>
        )}

        {isActive && (
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onRedeem(voucher.id, voucher.code)}
            >
              <ScanLine className="w-4 h-4" />
              {t('Redeem at Restaurant', 'استرداد في المطعم')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function RedeemConfirmModal({ voucherCode, onClose, lang, t }: {
  voucherCode: string;
  onClose: () => void;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-background rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-foreground mb-2">{t('Redeem at Restaurant', 'الاسترداد في المطعم')}</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {t(
            'Show this code to the restaurant staff. They will scan or enter it to apply your discount.',
            'أظهر هذا الرمز لموظف المطعم. سيقوم بمسحه أو إدخاله لتطبيق الخصم.'
          )}
        </p>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('Voucher Code', 'رمز القسيمة')}</p>
          <p className="text-2xl font-bold font-mono text-primary tracking-wider">{voucherCode}</p>
        </div>
        <Button className="w-full rounded-xl" onClick={onClose}>{t('Done', 'تم')}</Button>
      </div>
    </div>
  );
}

export function VouchersPage() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<'active' | 'used'>('active');
  const [redeemTarget, setRedeemTarget] = useState<{ id: number; code: string } | null>(null);

  const { data, isLoading } = useListVouchers(undefined, {
    query: { queryKey: ['vouchers'] },
  });

  const handleRedeemOpen = (id: number, code: string) => {
    setRedeemTarget({ id, code });
  };

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
              <VoucherCard key={voucher.id} voucher={voucher} lang={lang} t={t} onRedeem={handleRedeemOpen} />
            ))}
          </div>
        )}
      </div>

      {redeemTarget && (
        <RedeemConfirmModal
          voucherCode={redeemTarget.code}
          onClose={() => setRedeemTarget(null)}
          lang={lang}
          t={t}
        />
      )}
    </div>
  );
}
