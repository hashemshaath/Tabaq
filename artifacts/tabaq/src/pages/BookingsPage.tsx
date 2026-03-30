import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { useListBookings, useUpdateBookingStatus } from '@workspace/api-client-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api';
import {
  CalendarDays, Clock, Users, CheckCircle2, XCircle, AlertCircle,
  QrCode, ChevronDown, ChevronUp, MapPin, Sparkles, Utensils
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

type ExperienceBooking = {
  id: number;
  referenceCode: string;
  experienceId: number;
  slotId: number | null;
  guestCount: number;
  totalAmount: string | number;
  status: string;
  depositPaid: boolean;
  fullPaid: boolean;
  specialRequests?: string | null;
  createdAt: string;
  cancelledAt?: string | null;
  experienceTitleEn?: string | null;
  experienceTitleAr?: string | null;
  experienceCoverImage?: string | null;
  slotDate?: string | null;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
};

const EXP_STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: React.ElementType; className: string }> = {
  confirmed: { labelEn: 'Confirmed', labelAr: 'مؤكد', icon: CheckCircle2, className: 'text-green-700 bg-green-100 border-green-200' },
  pending: { labelEn: 'Pending', labelAr: 'معلق', icon: AlertCircle, className: 'text-yellow-700 bg-yellow-100 border-yellow-200' },
  cancelled: { labelEn: 'Cancelled', labelAr: 'ملغى', icon: XCircle, className: 'text-red-700 bg-red-100 border-red-200' },
  completed: { labelEn: 'Completed', labelAr: 'مكتمل', icon: CheckCircle2, className: 'text-blue-700 bg-blue-100 border-blue-200' },
  no_show: { labelEn: 'No Show', labelAr: 'لم يحضر', icon: XCircle, className: 'text-gray-700 bg-gray-100 border-gray-200' },
};

function ExperienceBookingCard({ booking, lang, t }: {
  booking: ExperienceBooking;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const [showQR, setShowQR] = useState(false);
  const title = lang === 'ar' ? (booking.experienceTitleAr ?? booking.experienceTitleEn) : (booking.experienceTitleEn ?? booking.experienceTitleAr);
  const status = EXP_STATUS_CONFIG[booking.status] ?? EXP_STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const isActive = booking.status === 'confirmed' || booking.status === 'pending';
  const amount = Number(booking.totalAmount).toLocaleString('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 });

  return (
    <div className={`bg-card rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isActive ? 'border-border' : 'border-border/50 opacity-80'}`}>
      {booking.experienceCoverImage && (
        <div className="h-20 relative overflow-hidden">
          <img src={booking.experienceCoverImage} alt={title ?? ''} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
          <div className="absolute inset-0 flex items-center px-5">
            <p className="text-white font-bold text-lg drop-shadow">{title}</p>
          </div>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {!booking.experienceCoverImage && (
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/experiences/${booking.experienceId}`} className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                  {title}
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
        {showQR && isActive && (
          <div className="bg-secondary/30 rounded-2xl p-5 text-center mb-4">
            <p className="text-sm font-semibold text-foreground mb-3">{t('Show this at the venue', 'أظهر هذا عند المكان')}</p>
            <div className="flex justify-center mb-3">
              <QRDisplay value={`TABAQ:EXP:${booking.id}:${booking.referenceCode}`} size={160} />
            </div>
            <p className="font-bold font-mono text-primary text-xl tracking-widest">{booking.referenceCode}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <CalendarDays className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-foreground">{booking.slotDate ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{t('Date', 'التاريخ')}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-foreground">{booking.slotStartTime ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{t('Time', 'الوقت')}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-foreground">{booking.guestCount}</p>
            <p className="text-xs text-muted-foreground">{t('Guests', 'أشخاص')}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-primary">{amount}</p>
          <Link href={`/experiences/${booking.experienceId}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {t('View Experience', 'عرض التجربة')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 101, restaurantId: 3, restaurantNameEn: 'Nobu Riyadh', restaurantNameAr: 'نوبو الرياض',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=160&fit=crop',
    date: '2026-05-10', time: '20:00', partySize: 4,
    status: 'confirmed', referenceCode: 'TBQ-BKG-2026-00009',
    specialRequests: 'Window seat preferred. Anniversary dinner — please arrange flowers.',
  },
  {
    id: 102, restaurantId: 2, restaurantNameEn: 'Sushi Sama', restaurantNameAr: 'سوشي ساما',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=160&fit=crop',
    date: '2026-04-12', time: '20:00', partySize: 2,
    status: 'confirmed', referenceCode: 'TBQ-BKG-2026-00002',
    specialRequests: undefined,
  },
  {
    id: 103, restaurantId: 1, restaurantNameEn: 'Qariyat Najd', restaurantNameAr: 'قرية نجد',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=160&fit=crop',
    date: '2026-04-05', time: '19:30', partySize: 4,
    status: 'confirmed', referenceCode: 'TBQ-BKG-2026-00001',
    specialRequests: 'High chair needed for toddler.',
  },
  {
    id: 104, restaurantId: 4, restaurantNameEn: 'Lucine', restaurantNameAr: 'لوسين',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=160&fit=crop',
    date: '2026-03-15', time: '21:00', partySize: 6,
    status: 'completed', referenceCode: 'TBQ-BKG-2026-00008',
    specialRequests: undefined,
  },
  {
    id: 105, restaurantId: 5, restaurantNameEn: 'Reem Al-Bawadi', restaurantNameAr: 'ريم البوادي',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=160&fit=crop',
    date: '2026-03-01', time: '13:00', partySize: 3,
    status: 'completed', referenceCode: 'TBQ-BKG-2026-00005',
    specialRequests: 'Vegetarian menu please.',
  },
];

export function BookingsPage() {
  const { t, lang } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<'restaurants' | 'experiences'>('restaurants');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

  const { data, isLoading } = useListBookings({ limit: 50, offset: 0 }, {
    query: { queryKey: ['bookings'] },
  });

  const { data: expData, isLoading: expLoading } = useQuery({
    queryKey: ['me-experience-bookings'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/me/experience-bookings`, { headers: getAuthHeaders() });
      if (!res.ok) return { bookings: [] };
      return res.json() as Promise<{ bookings: ExperienceBooking[] }>;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const cancelBooking = useUpdateBookingStatus({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    },
  });

  const handleCancel = (bookingId: number) => {
    cancelBooking.mutate({ bookingId, data: { status: 'cancelled' } });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const rawBookings = (data?.bookings ?? []) as Booking[];
  const allBookings: Booking[] = rawBookings.length ? rawBookings : MOCK_BOOKINGS;
  const upcoming = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && b.date >= today);
  const past = allBookings.filter(b => b.status === 'cancelled' || b.status === 'completed' || b.date < today);

  const displayedBookings = activeTab === 'upcoming' ? upcoming : past;

  const experienceBookings = expData?.bookings ?? [];
  const expUpcoming = experienceBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && (b.slotDate ?? '') >= today);
  const expPast = experienceBookings.filter(b => b.status === 'cancelled' || b.status === 'completed' || (b.slotDate ?? '') < today);

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">{t('My Bookings', 'حجوزاتي')}</h1>
              <p className="text-muted-foreground mt-1">{t('Table reservations and experience bookings', 'حجوزات الطاولات والتجارب')}</p>
            </div>
            <Link href="/restaurants">
              <Button className="gap-2 shrink-0" size="sm">
                <CalendarDays className="w-4 h-4" />
                {t('Book a Table', 'احجز طاولة')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Main Type Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/40 rounded-2xl mb-6">
          <button
            onClick={() => setMainTab('restaurants')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === 'restaurants' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Utensils className="w-4 h-4" />
            {t('Tables', 'الطاولات')}
            {allBookings.length > 0 && (
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs leading-none">{allBookings.length}</span>
            )}
          </button>
          <button
            onClick={() => setMainTab('experiences')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === 'experiences' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Sparkles className="w-4 h-4" />
            {t('Experiences', 'التجارب')}
            {experienceBookings.length > 0 && (
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs leading-none">{experienceBookings.length}</span>
            )}
          </button>
        </div>

        {/* ── Restaurants Section ── */}
        {mainTab === 'restaurants' && (
          <>
            <div className="flex gap-1 p-1 bg-secondary/20 rounded-xl mb-6">
              {(['upcoming', 'past'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab === 'upcoming' ? t('Upcoming', 'القادمة') : t('Past', 'السابقة')}
                  {tab === 'upcoming' && upcoming.length > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">{upcoming.length}</span>
                  )}
                </button>
              ))}
            </div>
            {isLoading ? (
              <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-44 bg-muted animate-pulse rounded-3xl" />)}</div>
            ) : displayedBookings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {activeTab === 'upcoming' ? t('No upcoming reservations', 'لا توجد حجوزات قادمة') : t('No past reservations', 'لا توجد حجوزات سابقة')}
                </h3>
                <p className="text-muted-foreground mb-5 text-sm">{t('Discover top restaurants and make your first booking.', 'اكتشف أفضل المطاعم واحجز طاولتك الأولى.')}</p>
                <Link href="/restaurants"><Button>{t('Explore Restaurants', 'استكشف المطاعم')}</Button></Link>
              </div>
            ) : (
              <div className="space-y-5">
                {displayedBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} lang={lang} t={t} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Experiences Section ── */}
        {mainTab === 'experiences' && (
          <>
            {expLoading ? (
              <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-44 bg-muted animate-pulse rounded-3xl" />)}</div>
            ) : experienceBookings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{t('No experience bookings', 'لا توجد حجوزات تجارب')}</h3>
                <p className="text-muted-foreground mb-5 text-sm">{t('Discover unique dining experiences.', 'اكتشف تجارب طعام استثنائية.')}</p>
                <Link href="/experiences"><Button>{t('Browse Experiences', 'استكشف التجارب')}</Button></Link>
              </div>
            ) : (
              <>
                {expUpcoming.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{t('Upcoming', 'القادمة')}</h2>
                    <div className="space-y-5">
                      {expUpcoming.map(b => <ExperienceBookingCard key={b.id} booking={b} lang={lang} t={t} />)}
                    </div>
                  </div>
                )}
                {expPast.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{t('Past', 'السابقة')}</h2>
                    <div className="space-y-5">
                      {expPast.map(b => <ExperienceBookingCard key={b.id} booking={b} lang={lang} t={t} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
