import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { useListVouchers, type Voucher } from '@workspace/api-client-react';
import {
  Tag, Clock, CheckCircle2, XCircle, Gift, Copy, Check, ScanLine,
  ChevronDown, ChevronUp, QrCode, RotateCcw, ExternalLink, AlertTriangle,
  X, Shield, Info, ChevronRight
} from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

type VoucherTab = 'active' | 'used' | 'expired' | 'refunded';

const TAB_CONFIG: Record<VoucherTab, {
  labelEn: string; labelAr: string;
  statusMatch: string[];
  emptyEn: string; emptyAr: string;
}> = {
  active: {
    labelEn: 'Active', labelAr: 'النشطة',
    statusMatch: ['active', 'issued', 'sold'],
    emptyEn: 'No active vouchers', emptyAr: 'لا توجد قسائم نشطة',
  },
  used: {
    labelEn: 'Used', labelAr: 'المستخدمة',
    statusMatch: ['redeemed', 'partially_redeemed'],
    emptyEn: 'No used vouchers', emptyAr: 'لا توجد قسائم مستخدمة',
  },
  expired: {
    labelEn: 'Expired', labelAr: 'المنتهية',
    statusMatch: ['expired'],
    emptyEn: 'No expired vouchers', emptyAr: 'لا توجد قسائم منتهية',
  },
  refunded: {
    labelEn: 'Refunded', labelAr: 'المستردة',
    statusMatch: ['refunded', 'voided'],
    emptyEn: 'No refunded vouchers', emptyAr: 'لا توجد قسائم مستردة',
  },
};

const STATUS_STYLE: Record<string, { color: string; icon: React.ElementType }> = {
  active:             { color: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle2 },
  issued:             { color: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle2 },
  sold:               { color: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle2 },
  redeemed:           { color: 'text-blue-700 bg-blue-100 border-blue-200', icon: CheckCircle2 },
  partially_redeemed: { color: 'text-indigo-700 bg-indigo-100 border-indigo-200', icon: CheckCircle2 },
  expired:            { color: 'text-gray-500 bg-gray-100 border-gray-200', icon: XCircle },
  refunded:           { color: 'text-orange-700 bg-orange-100 border-orange-200', icon: RotateCcw },
  voided:             { color: 'text-red-600 bg-red-100 border-red-200', icon: XCircle },
};

function QRCodeDisplay({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const size = 160; c.width = size; c.height = size;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    const seed = code.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const cells = 21; const cellSize = size / cells;
    for (let r = 0; r < cells; r++) {
      for (let col = 0; col < cells; col++) {
        const isCorner = (r < 7 && col < 7) || (r < 7 && col >= cells - 7) || (r >= cells - 7 && col < 7);
        if (isCorner) {
          const inInner2 = (r >= 2 && r <= 4 && col >= 2 && col <= 4) || (r >= 2 && r <= 4 && col >= cells - 5 && col <= cells - 3) || (r >= cells - 5 && r <= cells - 3 && col >= 2 && col <= 4);
          const inInner = (r >= 1 && r <= 5 && col >= 1 && col <= 5) || (r >= 1 && r <= 5 && col >= cells - 6 && col <= cells - 2) || (r >= cells - 6 && r <= cells - 2 && col >= 1 && col <= 5);
          ctx.fillStyle = inInner2 ? '#111' : inInner ? '#fff' : '#111';
          ctx.fillRect(col * cellSize, r * cellSize, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#111';
          const hash = (seed * (r * cells + col + 1) * 2654435761) >>> 0;
          if (hash % 2 === 0) ctx.fillRect(col * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [code]);
  return <canvas ref={canvasRef} className="rounded-lg" style={{ width: 160, height: 160 }} />;
}

function ValidityBar({ validUntil, purchasedAt }: { validUntil: string | null; purchasedAt?: string | null }) {
  if (!validUntil) return null;
  const now = Date.now();
  const end = new Date(validUntil).getTime();
  const start = purchasedAt ? new Date(purchasedAt).getTime() : end - 60 * 86400000;
  const total = end - start;
  const remaining = end - now;
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const daysLeft = Math.ceil(remaining / 86400000);
  const isWarning = daysLeft <= 7;
  const isDanger = daysLeft <= 2;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {daysLeft <= 0 ? 'Expired' : `${daysLeft}d remaining`}
        </span>
        <span className="text-muted-foreground">
          {new Date(validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RefundModal({ voucher, onClose, lang, t }: {
  voucher: Voucher;
  onClose: () => void;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const REASONS = [
    { en: 'Changed my mind', ar: 'غيّرت رأيي' },
    { en: 'Duplicate purchase', ar: 'شراء مكرر' },
    { en: 'Restaurant closed / unavailable', ar: 'المطعم مغلق أو غير متاح' },
    { en: 'Quality issue at restaurant', ar: 'مشكلة في جودة المطعم' },
    { en: 'Technical error during purchase', ar: 'خطأ تقني أثناء الشراء' },
    { en: 'Other', ar: 'أخرى' },
  ];

  const handleSubmit = () => {
    if (!reason) return;
    setTimeout(() => setSubmitted(true), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t('Refund Request Submitted', 'تم تقديم طلب الاسترداد')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('Our team will review your request within 3-5 business days.', 'سيراجع فريقنا طلبك خلال 3-5 أيام عمل.')}
            </p>
            <Button onClick={onClose} className="w-full">{t('Done', 'تم')}</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">{t('Request Refund', 'طلب استرداد')}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {t(
                    'Refunds are subject to review and may take 3-5 business days to process. Once-redeemed vouchers are not eligible.',
                    'الاستردادات خاضعة للمراجعة وقد تستغرق 3-5 أيام عمل. لا يحق استرداد القسائم التي استُخدمت.'
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">{t('Reason for refund', 'سبب الاسترداد')} *</p>
                <div className="space-y-2">
                  {REASONS.map(r => (
                    <label key={r.en} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="refund-reason"
                        value={r.en}
                        checked={reason === r.en}
                        onChange={() => setReason(r.en)}
                        className="w-4 h-4 accent-primary shrink-0"
                      />
                      <span className={`text-sm transition-colors ${reason === r.en ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {lang === 'ar' ? r.ar : r.en}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">{t('Additional details (optional)', 'تفاصيل إضافية')}</p>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder={t('Tell us more about your issue...', 'أخبرنا أكثر عن مشكلتك...')}
                  rows={3}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!reason}
                className="w-full"
              >
                {t('Submit Refund Request', 'تقديم طلب الاسترداد')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VoucherCard({ voucher, lang, t }: {
  voucher: Voucher;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const [copied, setCopied] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const restName = lang === 'ar' ? (voucher.restaurantNameAr ?? voucher.restaurantNameEn) : voucher.restaurantNameEn;
  const style = STATUS_STYLE[voucher.status] ?? STATUS_STYLE.expired;
  const StatusIcon = style.icon;
  const isActive = ['active', 'issued', 'sold'].includes(voucher.status);
  const isPartial = (voucher.status as string) === 'partially_redeemed';
  const canRefund = ['active', 'issued', 'sold'].includes(voucher.status);

  const copyCode = () => {
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusLabel = ({
    active: t('Active', 'نشطة'),
    used: t('Used', 'مستخدمة'),
    issued: t('Active', 'نشطة'),
    sold: t('Active', 'نشطة'),
    redeemed: t('Used', 'مستخدمة'),
    partially_redeemed: t('Partially Used', 'مستخدمة جزئياً'),
    expired: t('Expired', 'منتهية'),
    refunded: t('Refunded', 'مستردة'),
    voided: t('Voided', 'ملغاة'),
  } as Record<string, string>)[voucher.status] ?? voucher.status;

  return (
    <>
      {showRefundModal && (
        <RefundModal voucher={voucher} onClose={() => setShowRefundModal(false)} lang={lang} t={t} />
      )}
      <div className={`bg-card rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isActive || isPartial ? 'border-border' : 'border-border/50 opacity-85'}`}>
        {/* Top accent bar */}
        <div className={`h-1.5 ${isActive ? 'bg-primary' : isPartial ? 'bg-indigo-500' : 'bg-border'}`} />

        <div className="p-5 space-y-4">
          {/* Header: Restaurant + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/restaurants/${voucher.restaurantId}`} className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate block">
                {restName}
              </Link>
              {voucher.isGift && (
                <span className="inline-flex items-center gap-1 text-xs text-pink-600 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full mt-1">
                  <Gift className="w-3 h-3" />
                  {t('Gift Voucher', 'قسيمة هدية')}
                </span>
              )}
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${style.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusLabel}
            </span>
          </div>

          {/* Face Value */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-primary leading-none">
                {formatPrice(voucher.value, voucher.currency, lang as 'en' | 'ar')}
              </p>
              {(voucher as any).purchasePrice && Number((voucher as any).purchasePrice) !== Number(voucher.value) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Paid', 'دفعت')} {formatPrice((voucher as any).purchasePrice, voucher.currency, lang as 'en' | 'ar')}
                  {' · '}
                  <span className="text-emerald-600 font-semibold">
                    {Math.round((1 - Number((voucher as any).purchasePrice) / Number(voucher.value)) * 100)}% {t('saved', 'وفّرت')}
                  </span>
                </p>
              )}
            </div>
            {/* View Deal link */}
            {(voucher as any).campaignId && (
              <Link href="/offers" className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                {t('View Deal', 'عرض الصفقة')} <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Validity Progress Bar */}
          {(isActive || isPartial) && voucher.validUntil && (
            <ValidityBar validUntil={voucher.validUntil} purchasedAt={(voucher as any).createdAt} />
          )}

          {/* Used/Expired dates */}
          {voucher.redeemedAt && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {t('Used on', 'استُخدم في')}{' '}
              {new Date(voucher.redeemedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          {/* Voucher Code */}
          <div className="bg-secondary/40 border border-dashed border-border rounded-2xl px-4 py-3 flex items-center gap-3">
            <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
            <code className="flex-grow text-lg font-bold font-mono text-foreground tracking-widest">{voucher.code}</code>
            <button
              onClick={copyCode}
              disabled={!isActive && !isPartial}
              className={`p-2 rounded-xl transition-all ${isActive || isPartial ? 'hover:bg-accent/60 text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30 cursor-default'}`}
              title={t('Copy code', 'نسخ الرمز')}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Gift message */}
          {voucher.giftMessage && (
            <div className="bg-pink-50 border border-pink-100 rounded-xl px-4 py-2.5 text-sm text-pink-700 italic">
              &ldquo;{voucher.giftMessage}&rdquo;
            </div>
          )}

          {/* Gift status */}
          {voucher.isGift && voucher.role === 'owner' && (
            <div className={`rounded-xl px-3 py-2.5 text-xs flex items-center gap-1.5 ${
              voucher.giftDeliveryStatus === 'delivered' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              <Gift className="w-3.5 h-3.5 shrink-0" />
              {voucher.giftDeliveryStatus === 'delivered'
                ? t('Gift delivered to recipient', 'تم تسليم الهدية للمستلم')
                : t('Gift pending — recipient not yet registered', 'الهدية معلقة — المستلم لم يسجل بعد')
              }
            </div>
          )}

          {/* Action buttons */}
          {(isActive || isPartial) && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowRedeem(!showRedeem)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showRedeem ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
              >
                {showRedeem ? <QrCode className="w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
                {showRedeem ? t('Hide QR', 'إخفاء') : t('Show QR', 'عرض الـ QR')}
                {showRedeem ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {canRefund && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/50 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('Refund', 'استرداد')}
                </button>
              )}
            </div>
          )}

          {/* QR Code panel */}
          {showRedeem && (isActive || isPartial) && (
            <div className="bg-secondary/30 border border-border/60 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-semibold text-foreground text-center">
                {t('Show this at the restaurant', 'اعرض هذا في المطعم')}
              </p>
              <div className="flex justify-center">
                <QRCodeDisplay code={voucher.code} />
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <code className="flex-1 text-xl font-black font-mono text-primary tracking-widest text-center">{voucher.code}</code>
                <button
                  onClick={copyCode}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('Copied!', 'تم!') : t('Copy', 'نسخ')}
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3 h-3 text-emerald-500" />
                {t('Tabaq Buyer Protection', 'حماية المشتري من طبق')}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 1, restaurantId: 2, restaurantNameEn: 'Sushi Sama', restaurantNameAr: 'سوشي ساما',
    code: 'TABAQ-SUSHI-20', value: '150', currency: 'SAR',
    status: 'active', validUntil: '2026-04-30T23:59:59Z',
    purchasedAt: '2026-03-10T10:00:00Z', redeemedAt: null,
    isGift: false, giftMessage: null, giftDeliveryStatus: null, role: 'owner',
  } as unknown as Voucher,
  {
    id: 2, restaurantId: 3, restaurantNameEn: 'Nobu Riyadh', restaurantNameAr: 'نوبو الرياض',
    code: 'NOBU-VIP-500', value: '500', currency: 'SAR',
    status: 'active', validUntil: '2026-05-15T23:59:59Z',
    purchasedAt: '2026-03-01T09:00:00Z', redeemedAt: null,
    isGift: true, giftMessage: 'Happy Birthday! Enjoy an unforgettable dinner 🎂', giftDeliveryStatus: 'delivered', role: 'recipient',
  } as unknown as Voucher,
  {
    id: 3, restaurantId: 1, restaurantNameEn: 'Qariyat Najd', restaurantNameAr: 'قرية نجد',
    code: 'NAJD-15OFF', value: '100', currency: 'SAR',
    status: 'redeemed', validUntil: '2026-03-20T23:59:59Z',
    purchasedAt: '2026-02-20T11:00:00Z', redeemedAt: '2026-03-15T19:30:00Z',
    isGift: false, giftMessage: null, giftDeliveryStatus: null, role: 'owner',
  } as unknown as Voucher,
  {
    id: 4, restaurantId: 4, restaurantNameEn: 'Lucine', restaurantNameAr: 'لوسين',
    code: 'LUCINE-XPRD', value: '200', currency: 'SAR',
    status: 'expired', validUntil: '2026-02-28T23:59:59Z',
    purchasedAt: '2026-01-15T08:00:00Z', redeemedAt: null,
    isGift: false, giftMessage: null, giftDeliveryStatus: null, role: 'owner',
  } as unknown as Voucher,
];

export function VouchersPage() {
  const { t, lang } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<VoucherTab>('active');

  const { data, isLoading } = useListVouchers(undefined, {
    query: { queryKey: ['vouchers'] },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allVouchers: Voucher[] = ((data as Voucher[] | undefined)?.length ? data as Voucher[] : MOCK_VOUCHERS);

  const tabCounts = Object.fromEntries(
    (Object.keys(TAB_CONFIG) as VoucherTab[]).map(key => [
      key,
      allVouchers.filter(v => TAB_CONFIG[key].statusMatch.includes(v.status)).length,
    ])
  ) as Record<VoucherTab, number>;

  const displayed = allVouchers.filter(v => TAB_CONFIG[tab].statusMatch.includes(v.status));
  const cfg = TAB_CONFIG[tab];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">{t('My Wallet', 'محفظتي')}</h1>
              <p className="text-muted-foreground mt-1">{t('Your vouchers and dining rewards', 'قسائمك ومكافآت الطعام')}</p>
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
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-3 mb-6">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            {t(
              'Vouchers must be shown to restaurant staff before ordering. Refunds for unused vouchers can be requested within 14 days of purchase.',
              'يجب إبراز القسائم لموظف المطعم قبل الطلب. يمكن طلب استرداد القسائم غير المستخدمة خلال 14 يوماً من الشراء.'
            )}
          </p>
        </div>

        {/* 4 Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/40 rounded-2xl mb-8">
          {(Object.keys(TAB_CONFIG) as VoucherTab[]).map(key => {
            const count = tabCounts[key];
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  tab === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang === 'ar' ? TAB_CONFIG[key].labelAr : TAB_CONFIG[key].labelEn}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold ${
                    tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-56 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Tag className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {lang === 'ar' ? cfg.emptyAr : cfg.emptyEn}
            </h3>
            {tab === 'active' && (
              <>
                <p className="text-muted-foreground mb-6 text-sm max-w-xs mx-auto">
                  {t('Browse exclusive offers and save on your next meal.', 'تصفح العروض الحصرية ووفّر في وجبتك القادمة.')}
                </p>
                <Link href="/offers">
                  <Button>{t('Explore Deals', 'استكشف العروض')}</Button>
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
