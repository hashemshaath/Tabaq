import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { useListBookings, useUpdateBookingStatus } from '@workspace/api-client-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api';
import {
  CalendarDays, Clock, Users, CheckCircle2, XCircle, AlertCircle,
  QrCode, ChevronDown, ChevronUp, MapPin, Sparkles, Utensils, Edit2, X,
  Plus, Minus, ShoppingBag, ChevronRight,
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

function getDatesAhead(n: number) {
  const dates: Date[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) { const x = new Date(d); x.setDate(d.getDate() + i); dates.push(x); }
  return dates;
}
function formatDateKey(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const MODIFY_TIMES = ['12:00','12:30','13:00','13:30','14:00','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30'];

function BookingCard({ booking, lang, t, onCancel, onModify }: {
  booking: Booking;
  lang: string;
  t: (en: string, ar: string) => string;
  onCancel: (id: number) => void;
  onModify: (id: number, data: { date: string; time: string }) => Promise<void>;
}) {
  const [showQR, setShowQR] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [modifyDateIdx, setModifyDateIdx] = useState(0);
  const [modifyTime, setModifyTime] = useState('');
  const [modifyLoading, setModifyLoading] = useState(false);
  const [modifySuccess, setModifySuccess] = useState(false);
  const modifyDates = useMemo(() => getDatesAhead(14), []);

  const restaurantName = lang === 'ar' ? booking.restaurantNameAr : booking.restaurantNameEn;
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const isActive = booking.status === 'confirmed' || booking.status === 'pending';

  const handleModifySubmit = async () => {
    if (!modifyTime) return;
    setModifyLoading(true);
    try {
      await onModify(booking.id, { date: formatDateKey(modifyDates[modifyDateIdx]), time: modifyTime });
      setModifySuccess(true);
      setTimeout(() => { setShowModify(false); setModifySuccess(false); setModifyTime(''); }, 1500);
    } finally {
      setModifyLoading(false);
    }
  };

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
          <div className="space-y-3">
            {modifySuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs font-semibold text-green-800">{t('Booking updated!', 'تم تحديث الحجز!')}</p>
              </div>
            )}

            {showModify && !modifySuccess && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">{t('Modify Reservation', 'تعديل الحجز')}</p>
                <div>
                  <label className="text-[10px] text-blue-700 font-semibold uppercase tracking-wide mb-1 block">{t('New Date', 'التاريخ الجديد')}</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {modifyDates.slice(0, 7).map((d, i) => (
                      <button
                        key={i}
                        onClick={() => setModifyDateIdx(i)}
                        className={`shrink-0 flex flex-col items-center w-12 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${modifyDateIdx === i ? 'bg-blue-600 text-white border-blue-600' : 'border-blue-200 text-blue-700 bg-white hover:bg-blue-100'}`}
                      >
                        <span className="uppercase">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' })}</span>
                        <span className="text-sm font-bold">{d.getDate()}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-blue-700 font-semibold uppercase tracking-wide mb-1 block">{t('New Time', 'الوقت الجديد')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MODIFY_TIMES.map(tm => (
                      <button
                        key={tm}
                        onClick={() => setModifyTime(tm)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${modifyTime === tm ? 'bg-blue-600 text-white border-blue-600' : 'border-blue-200 text-blue-700 bg-white hover:bg-blue-100'}`}
                      >
                        {tm}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => { setShowModify(false); setModifyTime(''); }}>
                    {t('Cancel', 'إلغاء')}
                  </Button>
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleModifySubmit} disabled={!modifyTime || modifyLoading}>
                    {modifyLoading ? t('Saving...', 'جاري الحفظ...') : t('Confirm Change', 'تأكيد التغيير')}
                  </Button>
                </div>
              </div>
            )}

            {!confirmCancel ? (
              <div className="flex gap-2">
                <Link href={`/restaurants/${booking.restaurantId}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {t('View', 'عرض')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                  onClick={() => { setShowModify(!showModify); setConfirmCancel(false); }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('Modify', 'تعديل')}
                </Button>
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

// ── Table Type Config ──────────────────────────────────────────────────────────
const TABLE_TYPES = [
  { id: 'indoor',      labelEn: 'Indoor',       labelAr: 'داخلي',        icon: '🪑', descEn: 'Classic indoor dining',   descAr: 'طعام داخلي كلاسيكي',  bg: 'bg-blue-50 dark:bg-blue-950/20',   ring: 'ring-blue-400',   iconBg: 'bg-blue-100'  },
  { id: 'outdoor',     labelEn: 'Outdoor',      labelAr: 'خارجي',        icon: '🌿', descEn: 'Fresh air terrace',       descAr: 'تراس في الهواء الطلق', bg: 'bg-green-50 dark:bg-green-950/20', ring: 'ring-green-400',  iconBg: 'bg-green-100' },
  { id: 'vip',         labelEn: 'VIP Room',     labelAr: 'غرفة VIP',     icon: '👑', descEn: 'Private premium room',    descAr: 'غرفة خاصة فاخرة',      bg: 'bg-amber-50 dark:bg-amber-950/20', ring: 'ring-amber-400',  iconBg: 'bg-amber-100' },
  { id: 'window_seat', labelEn: 'Window Seat',  labelAr: 'مقعد النافذة', icon: '🌆', descEn: 'Scenic window view',      descAr: 'إطلالة خلابة من النافذة', bg: 'bg-violet-50 dark:bg-violet-950/20', ring: 'ring-violet-400', iconBg: 'bg-violet-100'},
] as const;

type TableTypeId = typeof TABLE_TYPES[number]['id'];

const CROWD_LEVELS = {
  low:    { labelEn: 'Low Crowd',    labelAr: 'هادئ',       color: 'text-green-700  bg-green-100',  dot: 'bg-green-500'  },
  medium: { labelEn: 'Moderate',     labelAr: 'متوسط',      color: 'text-amber-700  bg-amber-100',  dot: 'bg-amber-500'  },
  busy:   { labelEn: 'Busy',         labelAr: 'مزدحم',      color: 'text-red-700    bg-red-100',    dot: 'bg-red-500'    },
};

function getCrowdLevel(hour: number): 'low' | 'medium' | 'busy' {
  if (hour >= 12 && hour <= 14) return 'busy';
  if (hour >= 19 && hour <= 21) return 'busy';
  if ((hour >= 11 && hour < 12) || (hour >= 14 && hour < 16) || (hour >= 18 && hour < 19) || (hour >= 21 && hour < 23)) return 'medium';
  return 'low';
}

const ALL_TIMES = ['11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00'];

function QuickBookPanel({
  lang, t, restaurants, onClose, onBooked,
}: {
  lang: string;
  t: (en: string, ar: string) => string;
  restaurants: Array<{ id: number; nameEn: string; nameAr: string }>;
  onClose: () => void;
  onBooked: () => void;
}) {
  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [restaurantId, setRestaurantId] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [tableType, setTableType] = useState<TableTypeId>('indoor');
  const [dateIdx, setDateIdx] = useState(0);
  const [time, setTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);
  const [preOrderQty, setPreOrderQty] = useState<Record<number, number>>({});
  const [showPreOrder, setShowPreOrder] = useState(false);

  const dates = useMemo(() => getDatesAhead(14), []);
  const selectedDate = dates[dateIdx];
  const dateKey = formatDateKey(selectedDate);

  const { data: crowdData } = useQuery({
    queryKey: ['crowd', restaurantId, dateKey],
    queryFn: async () => {
      if (!restaurantId) return null;
      const r = await fetch(`${apiBase}/api/restaurants/${restaurantId}/crowd-prediction?date=${dateKey}`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : null;
    },
    enabled: !!restaurantId && !!dateKey,
    staleTime: 60000,
  });

  const { data: suggestedData } = useQuery({
    queryKey: ['suggested-times', restaurantId, dateKey, partySize],
    queryFn: async () => {
      if (!restaurantId) return null;
      const r = await fetch(`${apiBase}/api/restaurants/${restaurantId}/suggested-times?date=${dateKey}&partySize=${partySize}`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : null;
    },
    enabled: !!restaurantId && !!dateKey,
    staleTime: 60000,
  });

  const suggestedTimes: string[] = suggestedData?.suggestions
    ? suggestedData.suggestions.filter((s: any) => s.available && (s.isRecommended || s.score >= 60)).slice(0, 5).map((s: any) => s.time)
    : ['19:00', '19:30', '20:00'];

  const { data: menuData } = useQuery({
    queryKey: ['restaurant-menus-preorder', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const r = await fetch(`${apiBase}/api/restaurants/${restaurantId}/menus`);
      return r.ok ? r.json() : null;
    },
    enabled: !!restaurantId,
    staleTime: 300000,
  });

  const preOrderDishes = useMemo(() => {
    if (!menuData) return [];
    const dishes: Array<{ id: number; nameEn: string; nameAr: string; price: number | null; imageUrl: string | null; isBestseller?: boolean; isChefChoice?: boolean }> = [];
    for (const menu of menuData) {
      if (menu.type === 'catering' || menu.type === 'home_kitchen') continue;
      for (const section of (menu.sections ?? [])) {
        for (const dish of (section.items ?? [])) {
          dishes.push(dish);
        }
      }
    }
    const sorted = [...dishes].sort((a, b) => {
      if (a.isBestseller && !b.isBestseller) return -1;
      if (b.isBestseller && !a.isBestseller) return 1;
      if (a.isChefChoice && !b.isChefChoice) return -1;
      if (b.isChefChoice && !a.isChefChoice) return 1;
      return 0;
    });
    return sorted.slice(0, 10);
  }, [menuData]);

  const preOrderTotal = useMemo(() => {
    return Object.entries(preOrderQty).reduce((acc, [id, qty]) => {
      const dish = preOrderDishes.find(d => d.id === Number(id));
      if (dish && dish.price && qty > 0) acc += Number(dish.price) * qty;
      return acc;
    }, 0);
  }, [preOrderQty, preOrderDishes]);

  const handleBook = async () => {
    if (!restaurantId || !time) return;
    setSubmitting(true);
    const selectedPreOrder = preOrderDishes
      .filter(d => (preOrderQty[d.id] ?? 0) > 0)
      .map(d => ({ dishId: d.id, name: d.nameEn, quantity: preOrderQty[d.id], price: Number(d.price ?? 0) }));
    try {
      const r = await fetch(`${apiBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          date: dateKey,
          time,
          partySize,
          tableType,
          specialRequests: specialRequests || undefined,
          preOrderItems: selectedPreOrder.length > 0 ? selectedPreOrder : undefined,
        }),
      });
      if (r.ok) { setBooked(true); setTimeout(() => { onBooked(); onClose(); }, 1800); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaitlist = async () => {
    if (!restaurantId || !time) return;
    await fetch(`${apiBase}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ restaurantId: Number(restaurantId), date: dateKey, time, partySize }),
    });
    setJoinedWaitlist(true);
  };

  if (booked) {
    return (
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-bold text-lg text-green-900 dark:text-green-100">{t('Reservation Confirmed!', 'تم تأكيد الحجز!')}</h3>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">{t('Check your bookings below.', 'راجع حجوزاتك أدناه.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Panel header */}
      <div className="bg-primary/5 border-b border-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-base">{t('New Reservation', 'حجز جديد')}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Step 1: Restaurant + Basics */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">{t('Step 1 — Basics', 'الخطوة ١ — الأساسيات')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Restaurant', 'المطعم')}</label>
              <select
                value={restaurantId}
                onChange={e => setRestaurantId(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t('-- Choose restaurant --', '-- اختر مطعماً --')}</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{lang === 'ar' ? r.nameAr : r.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Guests', 'عدد الأشخاص')}</label>
              <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-background">
                <button onClick={() => setPartySize(p => Math.max(1, p - 1))} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 font-bold text-lg">−</button>
                <span className="flex-1 text-center font-bold text-base">{partySize}</span>
                <button onClick={() => setPartySize(p => Math.min(20, p + 1))} className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 font-bold text-lg">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Table Type Cards */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">{t('Step 2 — Table Preference', 'الخطوة ٢ — تفضيل الطاولة')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TABLE_TYPES.map(tt => {
              const selected = tableType === tt.id;
              return (
                <button
                  key={tt.id}
                  onClick={() => setTableType(tt.id)}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all ${selected ? `${tt.ring} ring-2 border-transparent ${tt.bg}` : 'border-border hover:border-primary/30 bg-background'}`}
                >
                  <div className={`w-10 h-10 ${tt.iconBg} rounded-xl flex items-center justify-center text-xl mb-2`}>{tt.icon}</div>
                  <p className="text-xs font-bold leading-tight">{t(tt.labelEn, tt.labelAr)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t(tt.descEn, tt.descAr)}</p>
                  {selected && <div className="mt-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Date + Time + Crowd */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">{t('Step 3 — Date & Time', 'الخطوة ٣ — التاريخ والوقت')}</p>

          {/* Date strip */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('Pick a Date', 'اختر تاريخاً')}</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.slice(0, 10).map((d, i) => {
                const isSelected = i === dateIdx;
                const isWeekend = d.getDay() === 4 || d.getDay() === 5;
                return (
                  <button
                    key={i}
                    onClick={() => { setDateIdx(i); setTime(''); }}
                    className={`shrink-0 flex flex-col items-center w-14 py-2 rounded-xl border text-center transition-all ${isSelected ? 'bg-primary text-white border-primary' : `border-border bg-background hover:border-primary/40 ${isWeekend ? 'bg-amber-50/50' : ''}`}`}
                  >
                    <span className="text-[10px] font-semibold uppercase">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                    <span className="text-[9px] opacity-70">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Suggested times banner */}
          {suggestedTimes.length > 0 && (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 mb-1.5">{t('AI Recommended Times', 'الأوقات المقترحة')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTimes.map(st => (
                    <button key={st} onClick={() => setTime(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${time === st ? 'bg-violet-600 text-white border-violet-600' : 'border-violet-300 text-violet-700 bg-white dark:bg-violet-900/20 hover:bg-violet-100'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All time slots with crowd indicator */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('All Available Times', 'جميع الأوقات المتاحة')}</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TIMES.map(tm => {
                const hour = parseInt(tm);
                const crowd = getCrowdLevel(hour);
                const cl = CROWD_LEVELS[crowd];
                const isSelected = time === tm;
                const isSuggested = suggestedTimes.includes(tm);
                return (
                  <button key={tm} onClick={() => setTime(tm)}
                    className={`relative flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'border-border bg-background hover:border-primary/40'} ${isSuggested && !isSelected ? 'border-violet-300' : ''}`}>
                    <span>{tm}</span>
                    {!isSelected && (
                      <div className={`flex items-center gap-0.5 mt-0.5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cl.dot}`} />
                        <span className="text-[8px] text-muted-foreground">{crowd === 'low' ? t('Low', 'هادئ') : crowd === 'medium' ? t('Mod', 'متوسط') : t('Busy', 'مزدحم')}</span>
                      </div>
                    )}
                    {isSuggested && !isSelected && (
                      <div className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-violet-500 flex items-center justify-center">
                        <Sparkles className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crowd prediction summary for selected time */}
          {time && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${CROWD_LEVELS[getCrowdLevel(parseInt(time))].color}`}>
              <div className={`w-2 h-2 rounded-full ${CROWD_LEVELS[getCrowdLevel(parseInt(time))].dot} shrink-0`} />
              {t(`${getCrowdLevel(parseInt(time)) === 'low' ? 'Low crowd expected' : getCrowdLevel(parseInt(time)) === 'medium' ? 'Moderate crowd expected' : 'Busy time — consider a different slot'}`,
                `${getCrowdLevel(parseInt(time)) === 'low' ? 'يُتوقع هدوء' : getCrowdLevel(parseInt(time)) === 'medium' ? 'ازدحام متوسط متوقع' : 'وقت مزدحم — جرّب وقتاً آخر'}`)}
            </div>
          )}

          {/* Special requests */}
          {time && restaurantId && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Special Requests (optional)', 'طلبات خاصة (اختياري)')}</label>
              <input
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder={t('e.g. Window seat, birthday cake, high chair...', 'مثال: مقعد نافذة، كعكة عيد ميلاد...')}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        {/* Pre-order Food Section */}
        {restaurantId && time && preOrderDishes.length > 0 && (
          <div className="border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowPreOrder(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/60 transition-colors text-sm font-semibold"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>{t('Pre-order Food (optional)', 'طلب طعام مسبق (اختياري)')}</span>
                {Object.values(preOrderQty).some(q => q > 0) && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {Object.values(preOrderQty).filter(q => q > 0).reduce((a, b) => a + b, 0)} {t('items', 'عناصر')}
                  </span>
                )}
              </div>
              {showPreOrder ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showPreOrder && (
              <div className="divide-y divide-border/50">
                <p className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/30">
                  {t('Add items to enjoy when you arrive — we will have them ready.', 'أضف عناصر لتستمتع بها عند وصولك — سنجهزها لك مسبقاً.')}
                </p>
                {preOrderDishes.map(dish => {
                  const qty = preOrderQty[dish.id] ?? 0;
                  const dname = lang === 'ar' ? dish.nameAr : dish.nameEn;
                  return (
                    <div key={dish.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
                      {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt={dname} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border/40" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Utensils className="w-5 h-5 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{dname}</p>
                        {dish.price && (
                          <p className="text-xs text-primary font-bold mt-0.5">
                            {dish.price} {t('SAR', 'ر.س')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 ? (
                          <>
                            <button
                              onClick={() => setPreOrderQty(q => ({ ...q, [dish.id]: Math.max(0, (q[dish.id] ?? 0) - 1) }))}
                              className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold w-5 text-center tabular-nums">{qty}</span>
                          </>
                        ) : null}
                        <button
                          onClick={() => setPreOrderQty(q => ({ ...q, [dish.id]: (q[dish.id] ?? 0) + 1 }))}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {preOrderTotal > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                    <span className="text-sm font-semibold text-foreground">{t('Pre-order Total', 'إجمالي الطلب المسبق')}</span>
                    <span className="text-base font-bold text-primary">{preOrderTotal.toFixed(0)} {t('SAR', 'ر.س')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <Button
            className="w-full h-12 text-sm font-bold rounded-xl"
            disabled={!restaurantId || !time || submitting}
            onClick={handleBook}
          >
            {submitting ? (
              <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Booking...', 'جاري الحجز...')}</div>
            ) : (
              <>{t('Confirm Reservation', 'تأكيد الحجز')} {tableType && `· ${TABLE_TYPES.find(tt => tt.id === tableType)?.icon}`}</>
            )}
          </Button>

          {time && getCrowdLevel(parseInt(time)) === 'busy' && !joinedWaitlist && (
            <button onClick={handleWaitlist}
              className="w-full h-10 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              {t('Join Waitlist Instead', 'الانضمام لقائمة الانتظار')}
            </button>
          )}

          {joinedWaitlist && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-green-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {t("You're on the waitlist! We'll notify you if a table opens up.", "أنت في قائمة الانتظار! سنُعلمك عند توفر طاولة.")}
            </div>
          )}
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
  const [showQuickBook, setShowQuickBook] = useState(false);
  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

  const { data: restaurantsData } = useQuery({
    queryKey: ['all-restaurants-for-booking'],
    queryFn: async () => {
      const r = await fetch(`${apiBase}/api/restaurants?limit=50`);
      return r.ok ? r.json() : { restaurants: [] };
    },
    staleTime: 120000,
  });

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

  const handleModify = async (bookingId: number, data: { date: string; time: string }) => {
    const headers = getAuthHeaders();
    await fetch(`${apiBase}/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
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
  const allBookings: Booking[] = rawBookings;
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
            <Button className="gap-2 shrink-0" size="sm" onClick={() => setShowQuickBook(v => !v)}>
              <CalendarDays className="w-4 h-4" />
              {showQuickBook ? t('Close', 'إغلاق') : t('New Reservation', 'حجز جديد')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Quick Book Panel */}
        {showQuickBook && (
          <div className="mb-6">
            <QuickBookPanel
              lang={lang}
              t={t}
              restaurants={restaurantsData?.restaurants ?? restaurantsData ?? []}
              onClose={() => setShowQuickBook(false)}
              onBooked={() => {
                queryClient.invalidateQueries({ queryKey: ['bookings'] });
                setShowQuickBook(false);
              }}
            />
          </div>
        )}

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
                  <BookingCard key={booking.id} booking={booking} lang={lang} t={t} onCancel={handleCancel} onModify={handleModify} />
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
