import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api';
import {
  ArrowRight, ArrowLeft, Phone, MessageCircle, ChevronDown, ChevronUp,
  Star, MapPin, Clock, CheckCircle2, ChefHat, Package, Bike, Home,
  Copy, Check, RotateCcw, ShoppingBag, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

type Stage = 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';

const STAGES: { key: Stage; labelEn: string; labelAr: string; icon: React.ElementType; descEn: string; descAr: string }[] = [
  { key: 'confirmed',       labelEn: 'Order Confirmed',  labelAr: 'تم تأكيد الطلب',    icon: CheckCircle2, descEn: 'Restaurant received your order',   descAr: 'استلم المطعم طلبك' },
  { key: 'preparing',      labelEn: 'Preparing',         labelAr: 'جارٍ التحضير',       icon: ChefHat,      descEn: 'Chef is cooking your meal',          descAr: 'الشيف يحضر وجبتك' },
  { key: 'out_for_delivery', labelEn: 'Out for Delivery', labelAr: 'في الطريق إليك',   icon: Bike,         descEn: 'Driver is heading your way',         descAr: 'السائق في طريقه إليك' },
  { key: 'delivered',      labelEn: 'Delivered',          labelAr: 'تم التسليم',         icon: Home,         descEn: 'Enjoy your meal!',                   descAr: 'استمتع بوجبتك!' },
];

const STAGE_INDEX: Record<Stage, number> = {
  confirmed: 0, preparing: 1, out_for_delivery: 2, delivered: 3,
};

// Map real API status → display Stage
function mapStatus(apiStatus: string): Stage {
  switch (apiStatus) {
    case 'placed':            return 'confirmed';
    case 'confirmed':         return 'confirmed';
    case 'preparing':         return 'preparing';
    case 'out_for_delivery':  return 'out_for_delivery';
    case 'delivered':         return 'delivered';
    default:                  return 'confirmed';
  }
}


// ─── AnimatedMap ─────────────────────────────────────────────────────────────
function AnimatedMap({ stage }: { stage: Stage }) {
  const progress = (STAGE_INDEX[stage] / 3) * 100;
  const truckX = 20 + (progress / 100) * 260;

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 320 192" preserveAspectRatio="xMidYMid meet" className="absolute inset-0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="320" height="192" fill="url(#grid)" />
        <path d="M 20 96 Q 80 60 140 80 Q 200 100 260 70 Q 290 55 300 96" stroke="rgba(255,255,255,0.12)" strokeWidth="20" strokeLinecap="round" fill="none" />
        <path d="M 20 96 Q 80 60 140 80 Q 200 100 260 70 Q 290 55 300 96" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="6 4" />
        <path
          d="M 20 96 Q 80 60 140 80 Q 200 100 260 70 Q 290 55 300 96"
          stroke="#e23744"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
          strokeDasharray={`${progress * 2.9} 1000`}
        />
        {/* Restaurant marker */}
        <circle cx="20" cy="96" r="6" fill="#e23744" filter="url(#glow)" />
        <circle cx="20" cy="96" r="3" fill="white" />
        {/* Destination marker */}
        <circle cx="300" cy="96" r="6" fill="#22c55e" filter="url(#glow)" />
        <circle cx="300" cy="96" r="3" fill="white" />
        {/* Truck icon */}
        <g transform={`translate(${truckX - 12}, 72)`} style={{ transition: 'transform 1s ease' }}>
          <rect x="0" y="0" width="24" height="16" rx="4" fill="#e23744" filter="url(#glow)" />
          <rect x="16" y="4" width="8" height="10" rx="2" fill="rgba(255,255,255,0.3)" />
          <circle cx="6" cy="16" r="3" fill="white" />
          <circle cx="18" cy="16" r="3" fill="white" />
        </g>
      </svg>
      <div className="absolute bottom-4 start-4 end-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>{stage !== 'delivered' ? 'Restaurant' : 'Picked Up'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
}

// ─── ETA Countdown ────────────────────────────────────────────────────────────
function ETACountdown({ etaMinutes, stage }: { etaMinutes: number; stage: Stage }) {
  const [seconds, setSeconds] = useState(etaMinutes * 60);

  useEffect(() => {
    if (stage === 'delivered') return;
    const interval = setInterval(() => {
      setSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  if (stage === 'delivered') {
    return (
      <div className="text-center">
        <p className="text-4xl font-black text-green-600">🎉</p>
        <p className="text-sm font-semibold text-green-700 mt-1">Delivered!</p>
      </div>
    );
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = mins < 5;

  return (
    <div className="text-center">
      <p className={`text-4xl font-black tabular-nums ${isUrgent ? 'text-primary animate-pulse' : 'text-foreground'}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </p>
      <p className="text-xs text-muted-foreground mt-1">estimated time</p>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function TrackingSkeleton({ dir }: { dir: string }) {
  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border h-14" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {[180, 200, 220, 120].map((h, i) => (
          <div key={i} className="bg-muted animate-pulse rounded-3xl" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function OrderTrackingPage() {
  const { t, lang } = useLanguage();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  const [, params] = useRoute('/orders/:id');
  const orderNumber = params?.id ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-tracking', orderNumber],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/orders/${orderNumber}`, {
        headers: getAuthHeaders(),
      });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!orderNumber,
    refetchInterval: 30_000, // poll every 30s for live status updates
  });

  const [showItems, setShowItems] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <TrackingSkeleton dir={dir} />;

  const order = data?.order ?? null;

  if (isError || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center" dir={dir}>
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold text-foreground">
          {t('Order not found', 'الطلب غير موجود')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t(
            'We couldn\'t find this order. It may have expired or the link is incorrect.',
            'لم نتمكن من العثور على هذا الطلب. قد يكون انتهت صلاحيته أو الرابط غير صحيح.'
          )}
        </p>
        <Link href="/orders">
          <Button>{t('Back to Orders', 'العودة للطلبات')}</Button>
        </Link>
      </div>
    );
  }

  // Map API data to display format
  const stage: Stage = mapStatus(order.status);
  const stageIdx = STAGE_INDEX[stage];
  const isDelivered = stage === 'delivered';
  const isDeliveryMode = order.orderMode === 'delivery';

  const restName = lang === 'ar' ? (order.restaurantNameAr || order.restaurantNameEn) : (order.restaurantNameEn || order.restaurantNameAr);
  const items: { nameEn: string; nameAr: string; qty: number; price: number; imageUrl?: string }[] = Array.isArray(order.items) ? order.items : [];
  const totalDisplay = `${parseFloat(order.total).toLocaleString()} ${order.currency || t('SAR', 'ر.س.')}`;
  const etaMinutes = order.estimatedMinutes ?? 30;

  const currentStage = STAGES[stageIdx];
  const CurrentIcon = currentStage.icon;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/orders">
            <button className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
              <BackIcon className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm truncate">{restName || t('Your Order', 'طلبك')}</p>
            <button onClick={copyId} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <span className="font-mono">{orderNumber}</span>
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          {!isDelivered && order.status !== 'cancelled' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">{t('Live', 'مباشر')}</span>
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">{t('Cancelled', 'ملغي')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Cancelled state */}
        {order.status === 'cancelled' && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t('Order Cancelled', 'تم إلغاء الطلب')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('This order was cancelled. If you were charged, a refund will be processed shortly.', 'تم إلغاء هذا الطلب. إذا تمت محاسبتك، سيتم رد المبلغ قريباً.')}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/orders"><Button variant="outline">{t('View Orders', 'الطلبات')}</Button></Link>
              {order.restaurantId && <Link href={`/restaurants/${order.restaurantId}`}><Button>{t('Reorder', 'اطلب مجدداً')}</Button></Link>}
            </div>
          </div>
        )}

        {order.status !== 'cancelled' && (
          <>
            {/* Status Hero Card */}
            <div className={`rounded-3xl p-6 text-center space-y-2 ${isDelivered ? 'bg-green-50 border border-green-200' : 'bg-primary/5 border border-primary/20'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isDelivered ? 'bg-green-500' : 'bg-primary'}`}>
                <CurrentIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground">
                {lang === 'ar' ? currentStage.labelAr : currentStage.labelEn}
              </h1>
              <p className="text-muted-foreground text-sm">
                {lang === 'ar' ? currentStage.descAr : currentStage.descEn}
              </p>
              {order.customerName && (
                <p className="text-xs text-muted-foreground pt-1">
                  {t('for', 'لـ')} <span className="font-semibold text-foreground">{order.customerName}</span>
                </p>
              )}
            </div>

            {/* ETA + Map (delivery only) */}
            {isDeliveryMode && (
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-4 p-5 border-b border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-muted-foreground">{t('Estimated Arrival', 'وقت التسليم المتوقع')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isDelivered
                        ? t('Your order has been delivered', 'تم تسليم طلبك')
                        : t('Arriving at your door', 'يصل إلى بابك قريباً')}
                    </p>
                    {order.deliveryAddress && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{order.deliveryAddress}</span>
                      </p>
                    )}
                  </div>
                  <ETACountdown etaMinutes={etaMinutes} stage={stage} />
                </div>
                <div className="p-4">
                  <AnimatedMap stage={stage} />
                </div>
              </div>
            )}

            {/* Pickup / Dine-in ETA */}
            {!isDeliveryMode && !isDelivered && (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  {order.orderMode === 'pickup' ? <Package className="w-6 h-6 text-primary" /> : <ChefHat className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {order.orderMode === 'pickup'
                      ? t('Ready for pickup in', 'جاهز للاستلام خلال')
                      : t('Ready at your table in', 'جاهز على طاولتك خلال')}
                  </p>
                  <p className="text-2xl font-black text-primary tabular-nums">{etaMinutes} {t('min', 'دقيقة')}</p>
                </div>
              </div>
            )}

            {/* Progress Stepper */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-muted-foreground mb-5 uppercase tracking-wide">
                {t('Order Progress', 'مراحل الطلب')}
              </h2>
              <div className="space-y-0">
                {STAGES.map((s, i) => {
                  if (!isDeliveryMode && s.key === 'out_for_delivery') return null;
                  const isCompleted = i < stageIdx;
                  const isActive = i === stageIdx;
                  const isPending = i > stageIdx;
                  const Icon = s.icon;
                  const isLast = i === STAGES.length - 1;

                  return (
                    <div key={s.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-8 my-1 transition-all duration-700 ${i < stageIdx ? 'bg-green-400' : 'bg-border'}`} />
                        )}
                      </div>
                      <div className={`pb-4 pt-2 min-w-0 ${isPending ? 'opacity-40' : ''}`}>
                        <p className={`font-semibold text-sm ${isActive ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-foreground'}`}>
                          {lang === 'ar' ? s.labelAr : s.labelEn}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isActive ? (lang === 'ar' ? s.descAr : s.descEn) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver Card (delivery only) */}
            {isDeliveryMode && !isDelivered && stage === 'out_for_delivery' && (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  {t('Your Driver', 'السائق')}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bike className="w-7 h-7 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -end-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-base">{t('Driver Assigned', 'تم تعيين السائق')}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">{t('On the way', 'في الطريق إليك')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Driver details available in the app', 'تفاصيل السائق متاحة في التطبيق')}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowCallMenu(!showCallMenu)}
                        className="w-10 h-10 rounded-2xl bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      {showCallMenu && (
                        <div className="absolute bottom-12 end-0 bg-card border border-border rounded-2xl shadow-xl p-3 w-44 space-y-1 z-10">
                          <p className="text-xs text-muted-foreground px-2 pb-1">{t('Contact driver via', 'تواصل مع السائق عبر')}</p>
                          {['WhatsApp', t('Direct Call', 'اتصال مباشر')].map(opt => (
                            <button key={opt} onClick={() => setShowCallMenu(false)} className="w-full text-start px-3 py-2 rounded-xl hover:bg-secondary text-sm font-medium transition-colors">
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="w-10 h-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {items.length > 0 && (
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowItems(!showItems)}
                  className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {items.slice(0, 3).map((item, i) => (
                        item.imageUrl
                          ? <img key={i} src={item.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-card" />
                          : <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center"><ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" /></div>
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{items.length} {t('items', 'عناصر')}</p>
                      <p className="text-xs text-muted-foreground">{totalDisplay} {t('total', 'الإجمالي')}</p>
                    </div>
                  </div>
                  {showItems ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {showItems && (
                  <div className="border-t border-border divide-y divide-border">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          : <div className="w-10 h-10 rounded-xl bg-muted shrink-0 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-muted-foreground" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {lang === 'ar' ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}
                          </p>
                          <p className="text-xs text-muted-foreground">× {item.qty}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground shrink-0">
                          {(item.price * item.qty).toLocaleString()} {order.currency || t('SAR', 'ر.س.')}
                        </p>
                      </div>
                    ))}
                    {/* Totals */}
                    <div className="px-5 py-3 space-y-1.5 bg-secondary/20">
                      {parseFloat(order.deliveryFee) > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{t('Delivery fee', 'رسوم التوصيل')}</span>
                          <span>{parseFloat(order.deliveryFee).toLocaleString()} {order.currency}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{t('Total', 'الإجمالي')}</span>
                        <span className="text-base font-extrabold text-primary">{totalDisplay}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Restaurant Info */}
            <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                {order.restaurantCoverImageUrl
                  ? <img src={order.restaurantCoverImageUrl} alt={restName} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                  : <div className="w-14 h-14 rounded-2xl bg-muted shrink-0 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-muted-foreground" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{restName || t('Restaurant', 'المطعم')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {order.orderMode === 'delivery'
                      ? t('Delivery order', 'طلب توصيل')
                      : order.orderMode === 'pickup'
                        ? t('Pickup order', 'طلب استلام')
                        : t('Dine-in order', 'طلب في المطعم')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {order.restaurantId && (
                  <Link href={`/restaurants/${order.restaurantId}`}>
                    <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1">
                      {t('View', 'عرض')}
                    </Button>
                  </Link>
                )}
              </div>
              {order.notes && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">{t('Order notes:', 'ملاحظات الطلب:')}</p>
                  <p className="text-sm text-foreground mt-0.5">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Rate Experience (after delivered) */}
            {isDelivered && !rated && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center space-y-4">
                <p className="font-bold text-lg text-foreground">{t('How was your experience?', 'كيف كانت تجربتك؟')}</p>
                <p className="text-sm text-muted-foreground">{t('Rate your order from', 'قيّم طلبك من')} {restName}</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={`w-9 h-9 transition-colors ${n <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <Button onClick={() => setRated(true)} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('Submit Rating', 'إرسال التقييم')}
                  </Button>
                )}
              </div>
            )}

            {isDelivered && rated && (
              <div className="bg-green-50 border border-green-200 rounded-3xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-green-800">{t('Thanks for your feedback!', 'شكراً على تقييمك!')}</p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`w-5 h-5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pb-6">
              <Link href="/orders" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <RotateCcw className="w-4 h-4" />
                  {t('All Orders', 'كل الطلبات')}
                </Button>
              </Link>
              {order.restaurantId && (
                <Link href={`/restaurants/${order.restaurantId}`} className="flex-1">
                  <Button className="w-full gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    {t('Reorder', 'اطلب مجدداً')}
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
