import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListBookings, useUpdateBookingStatus } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, Clock, Users, CheckCircle2, XCircle, AlertCircle,
  QrCode, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: React.ElementType; className: string }> = {
  confirmed: { labelEn: 'Confirmed', labelAr: 'مؤكد', icon: CheckCircle2, className: 'text-green-700 bg-green-100 border-green-200' },
  pending: { labelEn: 'Pending', labelAr: 'معلق', icon: AlertCircle, className: 'text-yellow-700 bg-yellow-100 border-yellow-200' },
  cancelled: { labelEn: 'Cancelled', labelAr: 'ملغى', icon: XCircle, className: 'text-red-700 bg-red-100 border-red-200' },
  completed: { labelEn: 'Completed', labelAr: 'مكتمل', icon: CheckCircle2, className: 'text-blue-700 bg-blue-100 border-blue-200' },
  no_show: { labelEn: 'No Show', labelAr: 'لم يحضر', icon: XCircle, className: 'text-gray-700 bg-gray-100 border-gray-200' },
};

function QRDisplay({ value, size = 180 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, value, { width: size, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } });
  }, [value, size]);
  return <canvas ref={canvasRef} className="rounded-2xl" />;
}

type Booking = {
  id: number;
  restaurantId: number;
  restaurantNameEn: string;
  restaurantNameAr: string;
  restaurantCoverImageUrl?: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  referenceCode: string;
  specialRequests?: string;
  occasionId?: number;
};

function BookingCard({ booking, lang, t, onCancel }: {
  booking: Booking;
  lang: string;
  t: (en: string, ar: string) => string;
  onCancel: (id: number) => void;
}) {
  const [showQR, setShowQR] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const restaurantName = lang === 'ar' ? booking.restaurantNameAr : booking.restaurantNameEn;
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const isActive = booking.status === 'confirmed' || booking.status === 'pending';

  return (
    <div className={`bg-card rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isActive ? 'border-border' : 'border-border/50 opacity-80'}`}>
      {/* Cover image strip */}
      {booking.restaurantCoverImageUrl && (
        <div className="h-20 relative overflow-hidden">
          <img src={booking.restaurantCoverImageUrl} alt={restaurantName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
          <div className="absolute inset-0 flex items-center px-5">
            <p className="text-white font-bold text-lg drop-shadow">{restaurantName}</p>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {!booking.restaurantCoverImageUrl && (
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/restaurants/${booking.restaurantId}`} className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                  {restaurantName}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.className}`}>
                <StatusIcon className="w-3 h-3" />
                {lang === 'ar' ? status.labelAr : status.labelEn}
              </span>
              <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-md">{booking.referenceCode}</span>
            </div>
          </div>
          {isActive && (
            <button
              onClick={() => setShowQR(!showQR)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${showQR ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
            >
              <QrCode className="w-4 h-4" />
              {showQR ? t('Hide QR', 'إخفاء') : t('Show QR', 'عرض QR')}
              {showQR ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* QR Code — Inline */}
        {showQR && isActive && (
          <div className="bg-secondary/30 rounded-2xl p-5 text-center mb-4">
            <p className="text-sm font-semibold text-foreground mb-3">{t('Show this at the restaurant entrance', 'أظهر هذا عند مدخل المطعم')}</p>
            <div className="flex justify-center mb-3">
              <QRDisplay value={`TABAQ:BOOKING:${booking.id}:${booking.referenceCode}`} size={160} />
            </div>
            <p className="font-bold font-mono text-primary text-xl tracking-widest">{booking.referenceCode}</p>
          </div>
        )}

        {/* Booking Info Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <CalendarDays className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-foreground">{booking.date}</p>
            <p className="text-xs text-muted-foreground">{t('Date', 'التاريخ')}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-foreground">{booking.time}</p>
            <p className="text-xs text-muted-foreground">{t('Time', 'الوقت')}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-foreground">{booking.partySize}</p>
            <p className="text-xs text-muted-foreground">{t('Guests', 'أشخاص')}</p>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="bg-secondary/30 rounded-xl px-4 py-2.5 mb-4">
            <p className="text-xs text-muted-foreground italic">&ldquo;{booking.specialRequests}&rdquo;</p>
          </div>
        )}

        {/* Actions */}
        {canCancel && (
          <div>
            {!confirmCancel ? (
              <div className="flex gap-3">
                <Link href={`/restaurants/${booking.restaurantId}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {t('View Restaurant', 'عرض المطعم')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setConfirmCancel(true)}
                >
                  {t('Cancel', 'إلغاء')}
                </Button>
              </div>
            ) : (
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
                <p className="text-sm font-semibold text-foreground mb-1">{t('Cancel this reservation?', 'هل تريد إلغاء هذا الحجز؟')}</p>
                <p className="text-xs text-muted-foreground mb-3">{t('This action cannot be undone.', 'لا يمكن التراجع عن هذا الإجراء.')}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmCancel(false)}
                  >
                    {t('Keep Booking', 'الاحتفاظ بالحجز')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => { onCancel(booking.id); setConfirmCancel(false); }}
                  >
                    {t('Yes, Cancel', 'نعم، إلغاء')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BookingsPage() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data, isLoading } = useListBookings({ limit: 50, offset: 0 }, {
    query: { queryKey: ['bookings'] },
  });

  const cancelBooking = useUpdateBookingStatus({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    },
  });

  const handleCancel = (bookingId: number) => {
    cancelBooking.mutate({ bookingId, data: { status: 'cancelled' } });
  };

  const today = new Date().toISOString().split('T')[0];
  const allBookings = (data?.bookings ?? []) as Booking[];
  const upcoming = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && b.date >= today);
  const past = allBookings.filter(b => b.status === 'cancelled' || b.status === 'completed' || b.date < today);

  const displayedBookings = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">{t('My Reservations', 'حجوزاتي')}</h1>
              <p className="text-muted-foreground mt-1">{t('View and manage your table bookings', 'اعرض وأدر حجوزات طاولاتك')}</p>
            </div>
            <Link href="/restaurants">
              <Button className="gap-2 shrink-0">
                <CalendarDays className="w-4 h-4" />
                {t('Book a Table', 'احجز طاولة')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/40 rounded-2xl mb-8">
          {(['upcoming', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'upcoming' ? t('Upcoming', 'القادمة') : t('Past', 'السابقة')}
              {tab === 'upcoming' && upcoming.length > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                  {upcoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-44 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
              <CalendarDays className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {activeTab === 'upcoming'
                ? t('No upcoming reservations', 'لا توجد حجوزات قادمة')
                : t('No past reservations', 'لا توجد حجوزات سابقة')}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {t('Discover top restaurants and make your first booking.', 'اكتشف أفضل المطاعم واحجز طاولتك الأولى.')}
            </p>
            <Link href="/restaurants">
              <Button>{t('Explore Restaurants', 'استكشف المطاعم')}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {displayedBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                lang={lang}
                t={t}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
