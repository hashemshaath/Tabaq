import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import {
  Package, Clock, CheckCircle2, Truck, ChefHat, Star, RotateCcw,
  ChevronRight, ShoppingBag, MapPin, Calendar, Receipt, ArrowRight,
  XCircle, Loader2
} from 'lucide-react';

type OrderStatus = 'placed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
type OrderTab = 'all' | 'active' | 'completed' | 'cancelled';

interface MockOrderItem {
  id: number;
  nameEn: string;
  nameAr: string;
  qty: number;
  price: number;
  imageUrl: string;
}

interface MockOrder {
  id: string;
  restaurantId: number;
  restaurantNameEn: string;
  restaurantNameAr: string;
  restaurantImage: string;
  restaurantAddress: string;
  items: MockOrderItem[];
  total: number;
  currency: string;
  status: OrderStatus;
  mode: 'delivery' | 'pickup' | 'dine_in';
  placedAt: string;
  estimatedTime?: string;
  deliveredAt?: string;
  rated?: boolean;
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'TBQ-384921',
    restaurantId: 2,
    restaurantNameEn: 'Lusin',
    restaurantNameAr: 'لوسين',
    restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
    restaurantAddress: 'Al Olaya, Riyadh',
    items: [
      { id: 1, nameEn: 'Lamb Ouzi', nameAr: 'خروف أوزي', qty: 1, price: 185, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop' },
      { id: 2, nameEn: 'Fattoush Salad', nameAr: 'سلطة فتوش', qty: 2, price: 38, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop' },
      { id: 3, nameEn: 'Baklava', nameAr: 'بقلاوة', qty: 2, price: 28, imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=80&h=80&fit=crop' },
    ],
    total: 317,
    currency: 'SAR',
    status: 'out_for_delivery',
    mode: 'delivery',
    placedAt: '2026-03-30T19:45:00',
    estimatedTime: '15–25 min',
  },
  {
    id: 'TBQ-291047',
    restaurantId: 1,
    restaurantNameEn: 'Nobu Riyadh',
    restaurantNameAr: 'نوبو الرياض',
    restaurantImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop',
    restaurantAddress: 'Four Seasons Hotel, Riyadh',
    items: [
      { id: 4, nameEn: 'Black Cod Miso', nameAr: 'سمك القد الأسود', qty: 2, price: 280, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=80&h=80&fit=crop' },
      { id: 5, nameEn: 'Dragon Roll', nameAr: 'رول التنين', qty: 1, price: 120, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
    ],
    total: 695,
    currency: 'SAR',
    status: 'delivered',
    mode: 'dine_in',
    placedAt: '2026-03-28T20:15:00',
    deliveredAt: '2026-03-28T22:30:00',
    rated: true,
  },
  {
    id: 'TBQ-183650',
    restaurantId: 3,
    restaurantNameEn: 'Najd Village',
    restaurantNameAr: 'قرية نجد',
    restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
    restaurantAddress: 'Al Nakheel, Riyadh',
    items: [
      { id: 6, nameEn: 'Kabsa', nameAr: 'كبسة', qty: 2, price: 65, imageUrl: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=80&h=80&fit=crop' },
      { id: 7, nameEn: 'Jareesh', nameAr: 'جريش', qty: 1, price: 45, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop' },
      { id: 8, nameEn: 'Harees', nameAr: 'هريس', qty: 1, price: 40, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop' },
    ],
    total: 230,
    currency: 'SAR',
    status: 'delivered',
    mode: 'pickup',
    placedAt: '2026-03-25T12:30:00',
    deliveredAt: '2026-03-25T13:15:00',
    rated: false,
  },
  {
    id: 'TBQ-092847',
    restaurantId: 4,
    restaurantNameEn: 'Sushi Sama',
    restaurantNameAr: 'سوشي ساما',
    restaurantImage: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=200&h=200&fit=crop',
    restaurantAddress: 'Corniche, Jeddah',
    items: [
      { id: 9, nameEn: 'Salmon Sashimi', nameAr: 'ساشيمي السلمون', qty: 2, price: 95, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
      { id: 10, nameEn: 'Edamame', nameAr: 'إيدامامي', qty: 1, price: 30, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop' },
    ],
    total: 235,
    currency: 'SAR',
    status: 'cancelled',
    mode: 'delivery',
    placedAt: '2026-03-22T18:00:00',
  },
  {
    id: 'TBQ-047213',
    restaurantId: 5,
    restaurantNameEn: 'The Globe',
    restaurantNameAr: 'ذا غلوب',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
    restaurantAddress: 'Riyadh Front, Riyadh',
    items: [
      { id: 11, nameEn: 'Wagyu Tenderloin', nameAr: 'تندرلوين واغيو', qty: 1, price: 490, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop' },
      { id: 12, nameEn: 'Truffle Pasta', nameAr: 'باستا الكمأة', qty: 1, price: 195, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=80&h=80&fit=crop' },
    ],
    total: 700,
    currency: 'SAR',
    status: 'delivered',
    mode: 'dine_in',
    placedAt: '2026-03-18T20:00:00',
    deliveredAt: '2026-03-18T22:00:00',
    rated: true,
  },
];

const STATUS_CONFIG: Record<OrderStatus, { labelEn: string; labelAr: string; color: string; bg: string; icon: React.FC<any> }> = {
  placed: { labelEn: 'Order Placed', labelAr: 'تم الطلب', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Receipt },
  preparing: { labelEn: 'Preparing', labelAr: 'جارٍ التحضير', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: ChefHat },
  out_for_delivery: { labelEn: 'Out for Delivery', labelAr: 'في الطريق إليك', color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: Truck },
  delivered: { labelEn: 'Delivered', labelAr: 'تم التسليم', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  cancelled: { labelEn: 'Cancelled', labelAr: 'ملغي', color: 'text-gray-500', bg: 'bg-gray-100 border-gray-200', icon: XCircle },
};

const ORDER_STEPS: { status: OrderStatus; labelEn: string; labelAr: string }[] = [
  { status: 'placed', labelEn: 'Placed', labelAr: 'مُقدَّم' },
  { status: 'preparing', labelEn: 'Preparing', labelAr: 'قيد التحضير' },
  { status: 'out_for_delivery', labelEn: 'On the way', labelAr: 'في الطريق' },
  { status: 'delivered', labelEn: 'Delivered', labelAr: 'تم التسليم' },
];

function getStepIndex(status: OrderStatus): number {
  const map: Record<OrderStatus, number> = { placed: 0, preparing: 1, out_for_delivery: 2, delivered: 3, cancelled: -1 };
  return map[status];
}

function formatOrderDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  if (lang === 'ar') {
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function OrderCard({ order, lang, t, onReorder }: {
  order: MockOrder; lang: string;
  t: (en: string, ar: string) => string;
  onReorder: (order: MockOrder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;
  const stepIdx = getStepIndex(order.status);
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
  const restName = lang === 'ar' ? order.restaurantNameAr : order.restaurantNameEn;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <img
            src={order.restaurantImage}
            alt={restName}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">{restName}</h3>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {order.restaurantAddress}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 ${status.bg} ${status.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {lang === 'ar' ? status.labelAr : status.labelEn}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                {order.id}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatOrderDate(order.placedAt, lang)}
              </span>
              <span className="flex items-center gap-1">
                {order.mode === 'delivery' ? <Truck className="w-3 h-3" /> : order.mode === 'pickup' ? <Package className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                {order.mode === 'delivery' ? t('Delivery', 'توصيل') : order.mode === 'pickup' ? t('Pickup', 'استلام') : t('Dine In', 'بالمطعم')}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar for active orders */}
        {isActive && order.status !== 'cancelled' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-primary">{t('Tracking your order', 'تتبع طلبك')}</p>
              {order.estimatedTime && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{t('ETA', 'الوقت')}: {order.estimatedTime}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1 relative">
              <div className="absolute top-2.5 start-[12.5%] end-[12.5%] h-0.5 bg-gray-200">
                <div
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${(stepIdx / 3) * 100}%` }}
                />
              </div>
              {ORDER_STEPS.map((step, i) => (
                <div key={step.status} className="flex flex-col items-center gap-1 relative z-10">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    i <= stepIdx ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200'
                  }`}>
                    {i < stepIdx ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : i === stepIdx ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : null}
                  </div>
                  <span className={`text-[9px] text-center font-medium leading-tight ${i <= stepIdx ? 'text-primary' : 'text-gray-400'}`}>
                    {lang === 'ar' ? step.labelAr : step.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items preview */}
        <div className="mt-4">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center justify-between w-full text-start"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {order.items.slice(0, 3).map(item => (
                  <img key={item.id} src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border-2 border-white" />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {order.items.length} {t('items', 'عناصر')} · <span className="font-bold text-gray-900">{formatPrice(order.total, order.currency, lang as 'en' | 'ar')}</span>
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>

          {expanded && (
            <div className="mt-3 divide-y divide-gray-100">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.qty}× {lang === 'ar' ? item.nameAr : item.nameEn}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">
                    {formatPrice(item.price * item.qty, order.currency, lang as 'en' | 'ar')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 font-bold">
                <span className="text-gray-700">{t('Total', 'الإجمالي')}</span>
                <span className="text-primary">{formatPrice(order.total, order.currency, lang as 'en' | 'ar')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50 flex items-center gap-2 flex-wrap">
        {order.status === 'delivered' && !order.rated && (
          <Link href={`/restaurants/${order.restaurantId}`}>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {t('Rate Your Experience', 'قيّم تجربتك')}
            </button>
          </Link>
        )}
        {(order.status === 'delivered' || order.status === 'cancelled') && (
          <button
            onClick={() => onReorder(order)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('Reorder', 'إعادة الطلب')}
          </button>
        )}
        <Link href={`/restaurants/${order.restaurantId}`} className="ms-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:border-gray-300 transition-colors bg-white">
            {t('View Restaurant', 'عرض المطعم')}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [reordering, setReordering] = useState<string | null>(null);

  usePageMeta({
    titleEn: 'My Orders — Tabaq',
    titleAr: 'طلباتي — طبق',
    descriptionEn: 'Track and manage your food orders on Tabaq.',
    descriptionAr: 'تتبع وإدارة طلباتك على طبق.',
  }, lang);

  const handleReorder = async (order: MockOrder) => {
    setReordering(order.id);
    await new Promise(r => setTimeout(r, 600));
    order.items.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        addItem({
          dishId: item.id,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          price: item.price,
          currency: order.currency,
          imageUrl: item.imageUrl,
          restaurantId: order.restaurantId,
          restaurantNameEn: order.restaurantNameEn,
          restaurantNameAr: order.restaurantNameAr,
        });
      }
    });
    setReordering(null);
  };

  const filtered = MOCK_ORDERS.filter(o => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return o.status === 'placed' || o.status === 'preparing' || o.status === 'out_for_delivery';
    if (activeTab === 'completed') return o.status === 'delivered';
    if (activeTab === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const activeCount = MOCK_ORDERS.filter(o => ['placed', 'preparing', 'out_for_delivery'].includes(o.status)).length;

  const TABS: { id: OrderTab; labelEn: string; labelAr: string; count?: number }[] = [
    { id: 'all', labelEn: 'All Orders', labelAr: 'كل الطلبات', count: MOCK_ORDERS.length },
    { id: 'active', labelEn: 'Active', labelAr: 'نشط', count: activeCount },
    { id: 'completed', labelEn: 'Completed', labelAr: 'مكتمل', count: MOCK_ORDERS.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي', count: MOCK_ORDERS.filter(o => o.status === 'cancelled').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{t('My Orders', 'طلباتي')}</h1>
              <p className="text-sm text-gray-500">{t('Track and manage your food orders', 'تتبع طلباتك وإدارتها')}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
                {tab.count !== undefined && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                    activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active order pulse banner */}
      {activeCount > 0 && activeTab !== 'active' && (
        <div className="bg-primary text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-semibold">
              {activeCount === 1
                ? t('You have 1 active order in progress', 'لديك طلب نشط قيد التنفيذ')
                : t(`You have ${activeCount} active orders`, `لديك ${activeCount} طلبات نشطة`)}
            </span>
            <button onClick={() => setActiveTab('active')} className="ms-auto text-xs underline underline-offset-2 font-semibold">
              {t('Track now', 'تتبع الآن')}
            </button>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t('No orders here', 'لا توجد طلبات هنا')}</h3>
            <p className="text-gray-500 text-sm mb-6">
              {activeTab === 'active'
                ? t('No active orders at the moment.', 'لا توجد طلبات نشطة حالياً.')
                : t('Your orders will appear here.', 'ستظهر طلباتك هنا.')}
            </p>
            <Link href="/restaurants">
              <button className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-primary/90 transition-colors">
                {t('Order Now', 'اطلب الآن')}
              </button>
            </Link>
          </div>
        ) : (
          <>
            {reordering && (
              <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-80 z-50 bg-primary text-white rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-xl animate-in slide-in-from-bottom-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="font-semibold text-sm">{t('Adding items to cart...', 'جارٍ إضافة العناصر إلى السلة...')}</span>
              </div>
            )}
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                lang={lang}
                t={t}
                onReorder={handleReorder}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
