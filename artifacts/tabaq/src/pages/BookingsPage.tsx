import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListBookings, useUpdateBookingStatus } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Users, CheckCircle2, XCircle, AlertCircle, QrCode, X } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: React.ElementType; className: string }> = {
  confirmed: { labelEn: 'Confirmed', labelAr: 'مؤكد', icon: CheckCircle2, className: 'text-green-600 bg-green-50' },
  pending: { labelEn: 'Pending', labelAr: 'معلق', icon: AlertCircle, className: 'text-yellow-600 bg-yellow-50' },
  cancelled: { labelEn: 'Cancelled', labelAr: 'ملغى', icon: XCircle, className: 'text-red-600 bg-red-50' },
  completed: { labelEn: 'Completed', labelAr: 'مكتمل', icon: CheckCircle2, className: 'text-blue-600 bg-blue-50' },
  no_show: { labelEn: 'No Show', labelAr: 'لم يحضر', icon: XCircle, className: 'text-gray-600 bg-gray-50' },
};

function QRCodeDisplay({ value, size = 180 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, value, { width: size, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } });
  }, [value, size]);
  return <canvas ref={canvasRef} className="rounded-xl" />;
}

function BookingCard({ booking, lang, t, onCancel }: {
  booking: {
    id: number;
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
  lang: string;
  t: (en: string, ar: string) => string;
  onCancel: (id: number) => void;
}) {
  const [showQR, setShowQR] = useState(false);
  const restaurantName = lang === 'ar' ? booking.restaurantNameAr : booking.restaurantNameEn;
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {booking.restaurantCoverImageUrl && (
        <div className="h-24 relative overflow-hidden">
          <img src={booking.restaurantCoverImageUrl} alt={restaurantName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-foreground">{restaurantName}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {lang === 'ar' ? status.labelAr : status.labelEn}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{booking.referenceCode}</p>
          </div>
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <button
              onClick={() => setShowQR(true)}
              className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
              title={t('Show QR Code', 'عرض رمز QR')}
            >
              <QrCode className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <span>{booking.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>{booking.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span>{booking.partySize} {t('guests', 'أشخاص')}</span>
          </div>
        </div>

        {booking.specialRequests && (
          <p className="mt-4 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-4 py-2 italic">
            &ldquo;{booking.specialRequests}&rdquo;
          </p>
        )}

        {canCancel && (
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => onCancel(booking.id)}
            >
              {t('Cancel Booking', 'إلغاء الحجز')}
            </Button>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
          <div className="bg-background rounded-3xl p-8 text-center shadow-2xl max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-foreground">{t('Booking QR', 'رمز الحجز')}</h3>
              <button onClick={() => setShowQR(false)} className="p-1 rounded-full hover:bg-accent/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <QRCodeDisplay value={`TABAQ:BOOKING:${booking.id}:${booking.referenceCode}`} size={180} />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{t('Show this code at the restaurant', 'أظهر هذا الرمز في المطعم')}</p>
            <p className="font-bold font-mono text-primary text-xl tracking-widest">{booking.referenceCode}</p>
          </div>
        </div>
      )}
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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      },
    },
  });

  const handleCancel = (bookingId: number) => {
    if (!confirm(t('Are you sure you want to cancel this booking?', 'هل أنت متأكد من إلغاء هذا الحجز؟'))) return;
    cancelBooking.mutate({ bookingId, data: { status: 'cancelled' } });
  };

  const today = new Date().toISOString().split('T')[0];
  const allBookings = data?.bookings ?? [];
  const upcoming = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && b.date >= today);
  const past = allBookings.filter(b => b.status === 'cancelled' || b.status === 'completed' || b.date < today);

  const displayedBookings = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('My Reservations', 'حجوزاتي')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your table reservations', 'إدارة حجوزات طاولتك')}</p>
          </div>
          <Link href="/restaurants">
            <Button>{t('Book a Table', 'احجز طاولة')}</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/40 rounded-2xl mb-6">
          {(['upcoming', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'upcoming' ? t('Upcoming', 'القادمة') : t('Past', 'السابقة')}
              {tab === 'upcoming' && upcoming.length > 0 && (
                <span className="ms-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {upcoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {activeTab === 'upcoming'
                ? t('No upcoming reservations', 'لا توجد حجوزات قادمة')
                : t('No past reservations', 'لا توجد حجوزات سابقة')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('Discover restaurants and make your first booking!', 'اكتشف المطاعم واحجز طاولتك الأولى!')}
            </p>
            <Link href="/restaurants">
              <Button>{t('Explore Restaurants', 'استكشف المطاعم')}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
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
