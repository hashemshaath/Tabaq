import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getAuthHeaders } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';
import {
  Package, Clock, CheckCircle2, Truck, ChefHat, Star, RotateCcw,
  ChevronRight, ShoppingBag, MapPin, Calendar, Receipt, ArrowRight,
  XCircle, Loader2, CalendarDays, Users, AlertCircle, Lock,
} from 'lucide-react';

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
type OrderStatus = 'placed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
type MainTab = 'reservations' | 'orders';
type ResTab = 'all' | 'upcoming' | 'past' | 'cancelled';
type OrderTab = 'all' | 'active' | 'completed' | 'cancelled';

interface Booking {
  id: number;
  restaurantId: number;
  date: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  specialRequests: string | null;
  referenceCode: string;
  createdAt: string;
  restaurantNameEn: string;
  restaurantNameAr: string;
  restaurantCoverImageUrl?: string;
  restaurantCuisineEn?: string;
  restaurantCuisineAr?: string;
  restaurantCityEn?: string;
}

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
    id: 'TBQ-384921', restaurantId: 2,
    restaurantNameEn: 'Lusin', restaurantNameAr: 'لوسين',
    restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
    restaurantAddress: 'Al Olaya, Riyadh',
    items: [
      { id: 1, nameEn: 'Lamb Ouzi', nameAr: 'خروف أوزي', qty: 1, price: 185, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop' },
      { id: 2, nameEn: 'Fattoush Salad', nameAr: 'سلطة فتوش', qty: 2, price: 38, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop' },
    ],
    total: 261, currency: 'SAR', status: 'out_for_delivery', mode: 'delivery',
    placedAt: '2026-03-30T19:45:00', estimatedTime: '15–25 min',
  },
  {
    id: 'TBQ-291047', restaurantId: 1,
    restaurantNameEn: 'Nobu Riyadh', restaurantNameAr: 'نوبو الرياض',
    restaurantImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop',
    restaurantAddress: 'Four Seasons Hotel, Riyadh',
    items: [
      { id: 4, nameEn: 'Black Cod Miso', nameAr: 'سمك القد الأسود', qty: 2, price: 280, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=80&h=80&fit=crop' },
    ],
    total: 560, currency: 'SAR', status: 'delivered', mode: 'dine_in',
    placedAt: '2026-03-28T20:15:00', deliveredAt: '2026-03-28T22:30:00', rated: true,
  },
  {
    id: 'TBQ-183650', restaurantId: 3,
    restaurantNameEn: 'Najd Village', restaurantNameAr: 'قرية نجد',
    restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
    restaurantAddress: 'Al Nakheel, Riyadh',
    items: [
      { id: 6, nameEn: 'Kabsa', nameAr: 'كبسة', qty: 2, price: 65, imageUrl: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=80&h=80&fit=crop' },
    ],
    total: 130, currency: 'SAR', status: 'delivered', mode: 'pickup',
    placedAt: '2026-03-25T12:30:00', deliveredAt: '2026-03-25T13:15:00', rated: false,
  },
  {
    id: 'TBQ-092847', restaurantId: 4,
    restaurantNameEn: 'Sushi Sama', restaurantNameAr: 'سوشي ساما',
    restaurantImage: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=200&h=200&fit=crop',
    restaurantAddress: 'Corniche, Jeddah',
    items: [
      { id: 9, nameEn: 'Salmon Sashimi', nameAr: 'ساشيمي السلمون', qty: 2, price: 95, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
    ],
    total: 190, currency: 'SAR', status: 'cancelled', mode: 'delivery',
    placedAt: '2026-03-22T18:00:00',
  },
];

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { labelEn: string; labelAr: string; color: string; bg: string; icon: React.FC<any> }> = {
  pending:   { labelEn: 'Pending',   labelAr: 'في الانتظار', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   icon: Clock },
  confirmed: { labelEn: 'Confirmed', labelAr: 'مؤكد',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  completed: { labelEn: 'Completed', labelAr: 'مكتمل',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      icon: CheckCircle2 },
  cancelled: { labelEn: 'Cancelled', labelAr: 'ملغي',       color: 'text-gray-500',    bg: 'bg-gray-100 border-gray-200',     icon: XCircle },
  no_show:   { labelEn: 'No Show',   labelAr: 'لم يحضر',    color: 'text-red-600',     bg: 'bg-red-50 border-red-200',        icon: AlertCircle },
};

const ORDER_STATUS_CONFIG: Record<OrderStatus, { labelEn: string; labelAr: string; color: string; bg: string; icon: React.FC<any> }> = {
  placed:           { labelEn: 'Order Placed',    labelAr: 'تم الطلب',       color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',     icon: Receipt },
  preparing:        { labelEn: 'Preparing',        labelAr: 'جارٍ التحضير',   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',   icon: ChefHat },
  out_for_delivery: { labelEn: 'Out for Delivery', labelAr: 'في الطريق إليك', color: 'text-primary',     bg: 'bg-primary/10 border-primary/20', icon: Truck },
  delivered:        { labelEn: 'Delivered',        labelAr: 'تم التسليم',     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  cancelled:        { labelEn: 'Cancelled',        labelAr: 'ملغي',           color: 'text-gray-500',    bg: 'bg-gray-100 border-gray-200',    icon: XCircle },
};

function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  if (lang === 'ar') return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatOrderDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  if (lang === 'ar') return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ReservationCard({ booking, lang, t }: { booking: Booking; lang: string; t: (en: string, ar: string) => string }) {
  const cfg = BOOKING_STATUS_CONFIG[booking.status];
  const StatusIcon = cfg.icon;
  const restName = lang === 'ar' ? booking.restaurantNameAr : booking.restaurantNameEn;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {booking.restaurantCoverImageUrl ? (
              <img src={booking.restaurantCoverImageUrl} alt={restName} className="w-full h-full object-cover" />
            ) : (
              <CalendarDays className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">{restName}</h3>
                {booking.restaurantCityEn && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {booking.restaurantCityEn}
                  </p>
                )}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 ${cfg.bg} ${cfg.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {lang === 'ar' ? cfg.labelAr : cfg.labelEn}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                {booking.referenceCode}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(booking.date, lang)} · {booking.time}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {booking.partySize} {t('guests', 'ضيوف')}
              </span>
            </div>
            {booking.specialRequests && (
              <p className="mt-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 line-clamp-2">
                "{booking.specialRequests}"
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50 flex items-center gap-2 flex-wrap">
        {(booking.status === 'completed') && (
          <Link href={`/restaurants/${booking.restaurantId}`}>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {t('Rate Your Visit', 'قيّم زيارتك')}
            </button>
          </Link>
        )}
        {(booking.status === 'pending' || booking.status === 'confirmed') && (
          <Link href={`/bookings`}>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors">
              <CalendarDays className="w-3.5 h-3.5" />
              {t('Manage Booking', 'إدارة الحجز')}
            </button>
          </Link>
        )}
        <Link href={`/restaurants/${booking.restaurantId}`} className="ms-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:border-gray-300 transition-colors bg-white">
            {t('View Restaurant', 'عرض المطعم')}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}

function OrderCard({ order, lang, t, onReorder, reordering }: {
  order: MockOrder; lang: string;
  t: (en: string, ar: string) => string;
  onReorder: (order: MockOrder) => void;
  reordering: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = ORDER_STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
  const restName = lang === 'ar' ? order.restaurantNameAr : order.restaurantNameEn;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <img src={order.restaurantImage} alt={restName} className="w-14 h-14 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">{restName}</h3>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{order.restaurantAddress}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 ${status.bg} ${status.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {lang === 'ar' ? status.labelAr : status.labelEn}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><Receipt className="w-3 h-3" />{order.id}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatOrderDate(order.placedAt, lang)}</span>
              <span className="flex items-center gap-1">
                {order.mode === 'delivery' ? <Truck className="w-3 h-3" /> : order.mode === 'pickup' ? <Package className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                {order.mode === 'delivery' ? t('Delivery', 'توصيل') : order.mode === 'pickup' ? t('Pickup', 'استلام') : t('Dine In', 'بالمطعم')}
              </span>
            </div>
          </div>
        </div>
        {isActive && (
          <div className="mt-3 flex items-center gap-2">
            <Link href={`/orders/${order.id}`} className="text-xs font-semibold text-primary hover:underline underline-offset-2">
              {t('Track your order →', 'تتبع طلبك ←')}
            </Link>
            {order.estimatedTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500 ms-auto">
                <Clock className="w-3 h-3" /><span>{t('ETA', 'الوقت')}: {order.estimatedTime}</span>
              </div>
            )}
          </div>
        )}
        <div className="mt-4">
          <button onClick={() => setExpanded(e => !e)} className="flex items-center justify-between w-full text-start">
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
                    <p className="text-sm font-medium text-gray-900 truncate">{item.qty}× {lang === 'ar' ? item.nameAr : item.nameEn}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">{formatPrice(item.price * item.qty, order.currency, lang as 'en' | 'ar')}</span>
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
          <button onClick={() => onReorder(order)} disabled={reordering === order.id} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
            {reordering === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            {t('Reorder', 'إعادة الطلب')}
          </button>
        )}
        <Link href={`/restaurants/${order.restaurantId}`} className="ms-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:border-gray-300 transition-colors bg-white">
            {t('View Restaurant', 'عرض المطعم')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [mainTab, setMainTab] = useState<MainTab>('reservations');
  const [resTab, setResTab] = useState<ResTab>('all');
  const [orderTab, setOrderTab] = useState<OrderTab>('all');
  const [reordering, setReordering] = useState<string | null>(null);

  usePageMeta({
    titleEn: 'My Orders & Reservations — Tabaq',
    titleAr: 'طلباتي وحجوزاتي — طبق',
    descriptionEn: 'Track and manage your reservations and food orders on Tabaq.',
    descriptionAr: 'تتبع وإدارة حجوزاتك وطلباتك على طبق.',
  }, lang);

  const { data: bookingsRaw, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['orders-page-bookings'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/bookings`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: ordersRaw, isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ['orders-page-orders'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/orders`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.orders) ? data.orders : [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const realOrders: MockOrder[] = (ordersRaw ?? []).map((o: any) => {
    const eta = o.estimatedMinutes ?? 35;
    return {
      id: o.orderNumber,
      restaurantId: o.restaurantId,
      restaurantNameEn: o.restaurantNameEn ?? 'Restaurant',
      restaurantNameAr: o.restaurantNameAr ?? 'مطعم',
      restaurantImage: o.restaurantCoverImageUrl ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      restaurantAddress: o.restaurantCityEn ?? 'Riyadh',
      items: (o.items ?? []).map((item: any) => ({
        id: item.dishId,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        qty: item.qty,
        price: item.price,
        imageUrl: item.imageUrl ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop',
      })),
      total: Number(o.total),
      currency: o.currency ?? 'SAR',
      status: o.status,
      mode: o.orderMode,
      placedAt: o.createdAt,
      estimatedTime: (o.status === 'placed' || o.status === 'preparing')
        ? `${eta}–${eta + 10} min`
        : undefined,
      rated: false,
    } as MockOrder;
  });

  const bookings = bookingsRaw ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isUpcoming(b: Booking) {
    return (b.status === 'pending' || b.status === 'confirmed') && new Date(b.date) >= today;
  }
  function isPast(b: Booking) {
    return b.status === 'completed' || (b.status !== 'cancelled' && new Date(b.date) < today);
  }

  const filteredBookings = bookings.filter(b => {
    if (resTab === 'all') return true;
    if (resTab === 'upcoming') return isUpcoming(b);
    if (resTab === 'past') return isPast(b);
    if (resTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const upcomingCount = bookings.filter(isUpcoming).length;

  const filteredOrders = realOrders.filter(o => {
    if (orderTab === 'all') return true;
    if (orderTab === 'active') return ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup'].includes(o.status);
    if (orderTab === 'completed') return o.status === 'delivered';
    if (orderTab === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const handleReorder = async (order: MockOrder) => {
    setReordering(order.id);
    await new Promise(r => setTimeout(r, 600));
    order.items.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        addItem({ dishId: item.id, nameEn: item.nameEn, nameAr: item.nameAr, price: item.price, currency: order.currency, imageUrl: item.imageUrl, restaurantId: order.restaurantId, restaurantNameEn: order.restaurantNameEn, restaurantNameAr: order.restaurantNameAr });
      }
    });
    setReordering(null);
  };

  const RES_TABS: { id: ResTab; labelEn: string; labelAr: string; count: number }[] = [
    { id: 'all',       labelEn: 'All',      labelAr: 'الكل',        count: bookings.length },
    { id: 'upcoming',  labelEn: 'Upcoming', labelAr: 'القادمة',     count: bookings.filter(isUpcoming).length },
    { id: 'past',      labelEn: 'Past',     labelAr: 'السابقة',     count: bookings.filter(isPast).length },
    { id: 'cancelled', labelEn: 'Cancelled',labelAr: 'الملغاة',     count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const ORDER_TABS: { id: OrderTab; labelEn: string; labelAr: string; count: number }[] = [
    { id: 'all',       labelEn: 'All Orders', labelAr: 'كل الطلبات', count: realOrders.length },
    { id: 'active',    labelEn: 'Active',     labelAr: 'نشط',        count: realOrders.filter(o => ['placed','confirmed','preparing','out_for_delivery','ready_for_pickup'].includes(o.status)).length },
    { id: 'completed', labelEn: 'Completed',  labelAr: 'مكتمل',     count: realOrders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', labelEn: 'Cancelled',  labelAr: 'ملغي',      count: realOrders.filter(o => o.status === 'cancelled').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{t('My Orders & Reservations', 'طلباتي وحجوزاتي')}</h1>
              <p className="text-sm text-gray-500">{t('Manage your restaurant bookings and food orders', 'إدارة حجوزاتك وطلباتك')}</p>
            </div>
          </div>

          {/* Main tabs */}
          <div className="flex gap-1">
            {([
              { id: 'reservations' as MainTab, labelEn: 'Reservations', labelAr: 'الحجوزات', badge: upcomingCount > 0 ? upcomingCount : undefined },
              { id: 'orders' as MainTab, labelEn: 'Food Orders', labelAr: 'طلبات الطعام', badge: undefined },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${mainTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
                {tab.badge !== undefined && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${mainTab === tab.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* ── RESERVATIONS TAB ── */}
        {mainTab === 'reservations' && (
          <>
            {!user ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t('Sign in to see your reservations', 'سجّل دخولك لرؤية حجوزاتك')}</h3>
                <p className="text-gray-500 text-sm mb-6">{t('Your table bookings will appear here once you sign in.', 'ستظهر حجوزاتك هنا بعد تسجيل الدخول.')}</p>
                <Link href="/sign-in">
                  <button className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-primary/90 transition-colors">{t('Sign In', 'تسجيل الدخول')}</button>
                </Link>
              </div>
            ) : (
              <>
                {/* Sub-tabs */}
                <div className="flex gap-1 overflow-x-auto hide-scrollbar mb-5 -mx-1 px-1">
                  {RES_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setResTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${resTab === tab.id ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:text-gray-700 bg-white'}`}
                    >
                      {lang === 'ar' ? tab.labelAr : tab.labelEn}
                      {tab.count > 0 && (
                        <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${resTab === tab.id ? 'bg-white text-primary' : 'bg-gray-100 text-gray-500'}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CalendarDays className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {resTab === 'upcoming' ? t('No upcoming reservations', 'لا توجد حجوزات قادمة') : t('No reservations found', 'لا توجد حجوزات')}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      {resTab === 'all' || resTab === 'upcoming' ? t('Book a table at your favourite restaurant.', 'احجز طاولة في مطعمك المفضل.') : t('No reservations in this category.', 'لا توجد حجوزات في هذه الفئة.')}
                    </p>
                    {(resTab === 'all' || resTab === 'upcoming') && (
                      <Link href="/restaurants">
                        <button className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-primary/90 transition-colors">{t('Discover Restaurants', 'اكتشف المطاعم')}</button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map(b => <ReservationCard key={b.id} booking={b} lang={lang} t={t} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── FOOD ORDERS TAB ── */}
        {mainTab === 'orders' && (
          <>
            {!user ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t('Sign in to see your orders', 'سجّل دخولك لرؤية طلباتك')}</h3>
                <p className="text-gray-500 text-sm mb-6">{t('Your food orders will appear here once you sign in.', 'ستظهر طلبات طعامك هنا بعد تسجيل الدخول.')}</p>
                <Link href="/sign-in">
                  <button className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-primary/90 transition-colors">{t('Sign In', 'تسجيل الدخول')}</button>
                </Link>
              </div>
            ) : ordersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
            <>
            <div className="flex gap-1 overflow-x-auto hide-scrollbar mb-5 -mx-1 px-1">
              {ORDER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setOrderTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${orderTab === tab.id ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:text-gray-700 bg-white'}`}
                >
                  {lang === 'ar' ? tab.labelAr : tab.labelEn}
                  {tab.count > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${orderTab === tab.id ? 'bg-white text-primary' : 'bg-gray-100 text-gray-500'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t('No orders here', 'لا توجد طلبات هنا')}</h3>
                <p className="text-gray-500 text-sm">{t('Your food orders will appear here.', 'ستظهر طلبات طعامك هنا.')}</p>
              </div>
            ) : (
              <>
                {reordering && (
                  <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-80 z-50 bg-primary text-white rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-xl">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span className="font-semibold text-sm">{t('Adding items to cart...', 'جارٍ إضافة العناصر إلى السلة...')}</span>
                  </div>
                )}
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <OrderCard key={order.id} order={order} lang={lang} t={t} onReorder={handleReorder} reordering={reordering} />
                  ))}
                </div>
              </>
            )}
            </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
