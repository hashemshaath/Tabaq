import React, { useState, useEffect, useRef } from 'react';
import { useRoute, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import {
  ArrowRight, ArrowLeft, Phone, MessageCircle, ChevronDown, ChevronUp,
  Star, MapPin, Clock, CheckCircle2, ChefHat, Package, Bike, Home,
  Copy, Check, RotateCcw, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Stage = 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';

const STAGES: { key: Stage; labelEn: string; labelAr: string; icon: React.ElementType; descEn: string; descAr: string }[] = [
  { key: 'confirmed', labelEn: 'Order Confirmed', labelAr: 'تم تأكيد الطلب', icon: CheckCircle2, descEn: 'Restaurant received your order', descAr: 'استلم المطعم طلبك' },
  { key: 'preparing', labelEn: 'Preparing', labelAr: 'جارٍ التحضير', icon: ChefHat, descEn: 'Chef is cooking your meal', descAr: 'الشيف يحضر وجبتك' },
  { key: 'out_for_delivery', labelEn: 'Out for Delivery', labelAr: 'في الطريق إليك', icon: Bike, descEn: 'Driver is heading your way', descAr: 'السائق في طريقه إليك' },
  { key: 'delivered', labelEn: 'Delivered', labelAr: 'تم التسليم', icon: Home, descEn: 'Enjoy your meal!', descAr: 'استمتع بوجبتك!' },
];

const STAGE_INDEX: Record<Stage, number> = {
  confirmed: 0, preparing: 1, out_for_delivery: 2, delivered: 3,
};

const MOCK_ORDERS: Record<string, {
  id: string; restaurantId: number; restaurantNameEn: string; restaurantNameAr: string;
  restaurantImage: string; restaurantAddress: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number; imageUrl: string }[];
  total: number; currency: string; status: Stage; mode: string; placedAt: string;
  etaMinutes: number;
}> = {
  'TBQ-384921': {
    id: 'TBQ-384921', restaurantId: 2,
    restaurantNameEn: 'Lusin', restaurantNameAr: 'لوسين',
    restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
    restaurantAddress: 'Al Olaya, Riyadh',
    items: [
      { nameEn: 'Lamb Ouzi', nameAr: 'خروف أوزي', qty: 1, price: 185, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop' },
      { nameEn: 'Fattoush Salad', nameAr: 'سلطة فتوش', qty: 2, price: 38, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop' },
      { nameEn: 'Baklava', nameAr: 'بقلاوة', qty: 2, price: 28, imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=80&h=80&fit=crop' },
    ],
    total: 317, currency: 'SAR', status: 'out_for_delivery', mode: 'delivery',
    placedAt: '2026-03-30T19:45:00', etaMinutes: 18,
  },
  'TBQ-291047': {
    id: 'TBQ-291047', restaurantId: 1,
    restaurantNameEn: 'Nobu Riyadh', restaurantNameAr: 'نوبو الرياض',
    restaurantImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop',
    restaurantAddress: 'Four Seasons Hotel, Riyadh',
    items: [
      { nameEn: 'Black Cod Miso', nameAr: 'سمك القد الأسود', qty: 2, price: 280, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=80&h=80&fit=crop' },
      { nameEn: 'Dragon Roll', nameAr: 'رول التنين', qty: 1, price: 120, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
    ],
    total: 695, currency: 'SAR', status: 'delivered', mode: 'dine_in',
    placedAt: '2026-03-28T20:15:00', etaMinutes: 0,
  },
};

const DRIVER = {
  nameEn: 'Khalid Al-Otaibi', nameAr: 'خالد العتيبي',
  rating: 4.9, totalDeliveries: 1240,
  vehicleEn: 'Toyota Camry · White', vehicleAr: 'تويوتا كامري · أبيض',
  plate: 'RYD 4892',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&faces=1',
};

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
          strokeDasharray={`${(progress / 100) * 360} 360`}
        />

        <circle cx="20" cy="96" r="8" fill="#1e40af" stroke="white" strokeWidth="2" />
        <text x="20" y="100" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">R</text>

        <circle cx="300" cy="96" r="8" fill="#16a34a" stroke="white" strokeWidth="2" />
        <text x="300" y="100" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">H</text>

        {stage !== 'delivered' && (
          <g transform={`translate(${truckX}, ${
            truckX < 80 ? 96 - (truckX - 20) * 0.42
            : truckX < 140 ? 96 - 25 + (truckX - 80) * 0.33
            : truckX < 200 ? 80 + (truckX - 140) * 0.27
            : truckX < 260 ? 100 - (truckX - 200) * 0.5
            : 70 + (truckX - 260) * 0.65
          })`}>
            <circle cx="0" cy="0" r="16" fill="#e23744" filter="url(#glow)" />
            <text x="0" y="4" textAnchor="middle" fill="white" fontSize="14">🛵</text>
          </g>
        )}

        {stage === 'delivered' && (
          <g transform="translate(300, 96)">
            <circle cx="0" cy="0" r="16" fill="#16a34a" filter="url(#glow)" />
            <text x="0" y="4" textAnchor="middle" fill="white" fontSize="14">✓</text>
          </g>
        )}

        <circle cx="20" cy="96" r="24" fill="rgba(30,64,175,0.15)" />
        <circle cx="300" cy="96" r="24" fill="rgba(22,163,74,0.15)" />
      </svg>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-xl">
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
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

export function OrderTrackingPage() {
  const { t, lang } = useLanguage();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id ?? '';

  const order = MOCK_ORDERS[orderId];

  const [stage, setStage] = useState<Stage>(order?.status ?? 'out_for_delivery');
  const [showItems, setShowItems] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);

  const stageIdx = STAGE_INDEX[stage];

  const copyId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center" dir={dir}>
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold text-foreground">{t('Order not found', 'الطلب غير موجود')}</h2>
        <Link href="/orders">
          <Button>{t('Back to Orders', 'العودة للطلبات')}</Button>
        </Link>
      </div>
    );
  }

  const restName = lang === 'ar' ? order.restaurantNameAr : order.restaurantNameEn;
  const currentStage = STAGES[stageIdx];
  const CurrentIcon = currentStage.icon;
  const isDelivered = stage === 'delivered';

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
            <p className="font-bold text-foreground text-sm truncate">{restName}</p>
            <button onClick={copyId} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <span className="font-mono">{orderId}</span>
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          {!isDelivered && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">{t('Live', 'مباشر')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

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
        </div>

        {/* ETA + Map */}
        {order.mode === 'delivery' && (
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
              </div>
              <ETACountdown etaMinutes={order.etaMinutes} stage={stage} />
            </div>
            <div className="p-4">
              <AnimatedMap stage={stage} />
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
              const isCompleted = i < stageIdx;
              const isActive = i === stageIdx;
              const isPending = i > stageIdx;
              const Icon = s.icon;
              const isLast = i === STAGES.length - 1;

              return (
                <div key={s.key} className="flex gap-4">
                  {/* Line + dot */}
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
                  {/* Text */}
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

          {/* Dev: progress simulation buttons */}
          {!isDelivered && (
            <div className="mt-2 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-2 text-center">Simulate progress</p>
              <div className="flex gap-2 justify-center">
                {STAGES.filter((_, i) => i !== stageIdx).map(s => (
                  <button
                    key={s.key}
                    onClick={() => setStage(s.key)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                  >
                    {lang === 'ar' ? s.labelAr : s.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Driver Card — only for delivery orders in transit */}
        {order.mode === 'delivery' && !isDelivered && (
          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {t('Your Driver', 'السائق')}
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img src={DRIVER.avatar} alt="driver" className="w-14 h-14 rounded-2xl object-cover" />
                <div className="absolute -bottom-1 -end-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base">{lang === 'ar' ? DRIVER.nameAr : DRIVER.nameEn}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-foreground">{DRIVER.rating}</span>
                  <span className="text-xs text-muted-foreground">· {DRIVER.totalDeliveries.toLocaleString()} {t('deliveries', 'توصيل')}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? DRIVER.vehicleAr : DRIVER.vehicleEn} · {DRIVER.plate}</p>
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
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {order.items.slice(0, 3).map((item, i) => (
                  <img key={i} src={item.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-card" />
                ))}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{order.items.length} {t('items', 'عناصر')}</p>
                <p className="text-xs text-muted-foreground">{order.total} {t('SAR', 'ر.س.')} {t('total', 'الإجمالي')}</p>
              </div>
            </div>
            {showItems ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showItems && (
            <div className="border-t border-border divide-y divide-border">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{lang === 'ar' ? item.nameAr : item.nameEn}</p>
                    <p className="text-xs text-muted-foreground">× {item.qty}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{item.price * item.qty} {t('SAR', 'ر.س.')}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-secondary/20">
                <span className="text-sm font-semibold text-foreground">{t('Total', 'الإجمالي')}</span>
                <span className="text-base font-extrabold text-primary">{order.total} {t('SAR', 'ر.س.')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={order.restaurantImage} alt={restName} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">{restName}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{order.restaurantAddress}</span>
              </div>
            </div>
            <Link href={`/restaurants/${order.restaurantId}`}>
              <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1">
                {t('View', 'عرض')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Rate Experience — show after delivered */}
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
          <Link href={`/restaurants/${order.restaurantId}`} className="flex-1">
            <Button className="w-full gap-2">
              <ShoppingBag className="w-4 h-4" />
              {t('Reorder', 'اطلب مجدداً')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
