import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  useGetRestaurantAvailability,
  useCreateBooking,
  useListOccasions,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Users, ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface BookingModalProps {
  restaurantId: number;
  restaurantNameEn: string;
  restaurantNameAr: string;
  onClose: () => void;
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

function getDatesAhead(n: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateKey(d: Date) {
  // Use local year/month/day to avoid UTC-shift issues in GCC timezones
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(d: Date, lang: string) {
  return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function BookingModal({ restaurantId, restaurantNameEn, restaurantNameAr, onClose }: BookingModalProps) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const restaurantName = lang === 'ar' ? restaurantNameAr : restaurantNameEn;

  const dates = useMemo(() => getDatesAhead(14), []);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState(2);
  const [occasionId, setOccasionId] = useState<number | undefined>(undefined);
  const [specialRequests, setSpecialRequests] = useState('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [createdBooking, setCreatedBooking] = useState<{ referenceCode: string; date: string; time: string } | null>(null);
  const [error, setError] = useState<string>('');

  const selectedDate = dates[selectedDateIdx];
  const dateKey = formatDateKey(selectedDate);

  const { data: availabilityData, isLoading: availLoading } = useGetRestaurantAvailability(
    restaurantId,
    { date: dateKey, partySize },
    { query: { queryKey: ['availability', restaurantId, dateKey, partySize] } }
  );

  const { data: occasionsData } = useListOccasions();
  const occasions = occasionsData ?? [];

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: (data) => {
        setCreatedBooking({ referenceCode: data.referenceCode, date: data.date, time: data.time });
        setStep('success');
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      },
      onError: () => {
        setError(t('Failed to create booking. Please try again.', 'فشل إنشاء الحجز. حاول مرة أخرى.'));
      },
    },
  });

  const slots = availabilityData?.slots ?? [];

  const handleConfirm = () => {
    if (!selectedTime) {
      setError(t('Please select a time slot', 'الرجاء اختيار وقت'));
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleBook = () => {
    if (!user) return;
    createBooking.mutate({
      data: {
        restaurantId,
        date: dateKey,
        time: selectedTime,
        partySize,
        occasionId,
        specialRequests: specialRequests || undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10 rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {step === 'success' ? t('Booking Confirmed!', 'تم تأكيد الحجز!') : t('Book a Table', 'احجز طاولة')}
            </h2>
            <p className="text-sm text-muted-foreground">{restaurantName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Success Step */}
          {step === 'success' && createdBooking && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{t("You're all set!", 'أنت مستعد!')}</h3>
              <p className="text-muted-foreground mb-6">{t('Your table has been reserved.', 'تم حجز طاولتك.')}</p>

              <div className="bg-secondary/30 rounded-2xl p-5 text-start mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <CalendarDays className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium">{createdBooking.date}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium">{createdBooking.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium">{partySize} {t('guests', 'أشخاص')}</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">{t('Booking Reference', 'رقم الحجز')}</p>
                <p className="text-xl font-bold font-mono text-primary tracking-wider">{createdBooking.referenceCode}</p>
              </div>

              <Button onClick={onClose} className="w-full rounded-xl">
                {t('Done', 'تم')}
              </Button>
            </div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div>
              <div className="bg-secondary/30 rounded-2xl p-5 mb-5">
                <h3 className="font-semibold text-foreground mb-4">{t('Booking Summary', 'ملخص الحجز')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Restaurant', 'المطعم')}</span>
                    <span className="font-medium">{restaurantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Date', 'التاريخ')}</span>
                    <span className="font-medium">{dateKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Time', 'الوقت')}</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Guests', 'الأشخاص')}</span>
                    <span className="font-medium">{partySize}</span>
                  </div>
                  {occasionId && occasions.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Occasion', 'المناسبة')}</span>
                      <span className="font-medium">
                        {lang === 'ar'
                          ? occasions.find(o => o.id === occasionId)?.nameAr
                          : occasions.find(o => o.id === occasionId)?.nameEn}
                      </span>
                    </div>
                  )}
                  {specialRequests && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Special Requests', 'طلبات خاصة')}</span>
                      <span className="font-medium max-w-[60%] text-end">{specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-destructive mb-3">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('select')}>
                  <ChevronLeft className="w-4 h-4 me-1" />
                  {t('Back', 'رجوع')}
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleBook}
                  disabled={createBooking.isPending}
                >
                  {createBooking.isPending ? t('Booking...', 'جاري الحجز...') : t('Confirm Booking', 'تأكيد الحجز')}
                </Button>
              </div>
            </div>
          )}

          {/* Select Step */}
          {step === 'select' && (
            <div className="space-y-6">
              {/* Party Size */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {t('Party Size', 'عدد الأشخاص')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PARTY_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => { setPartySize(size); setSelectedTime(''); }}
                      className={`w-12 h-12 rounded-xl text-sm font-semibold border transition-all ${
                        partySize === size
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/40 text-foreground'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {t('Select Date', 'اختر التاريخ')}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {dates.map((d, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedDateIdx(idx); setSelectedTime(''); }}
                      className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs transition-all ${
                        selectedDateIdx === idx
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className="font-medium">
                        {d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short' })}
                      </span>
                      <span className="text-base font-bold">{d.getDate()}</span>
                      <span className="opacity-70">
                        {d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short' })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {t('Select Time', 'اختر الوقت')}
                </label>
                {availLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {t('No available times for this date and party size.', 'لا توجد أوقات متاحة لهذا التاريخ وعدد الأشخاص.')}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          selectedTime === slot.time
                            ? 'bg-primary text-primary-foreground border-primary'
                            : slot.available
                            ? 'border-border hover:border-primary/40 text-foreground'
                            : 'border-border/30 text-muted-foreground/40 cursor-not-allowed bg-muted/30'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Occasion */}
              {occasions.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    {t('Occasion (Optional)', 'المناسبة (اختياري)')}
                  </label>
                  <select
                    value={occasionId ?? ''}
                    onChange={e => setOccasionId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{t('No special occasion', 'بدون مناسبة')}</option>
                    {occasions.map(o => (
                      <option key={o.id} value={o.id}>
                        {lang === 'ar' ? o.nameAr : o.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Special Requests */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  {t('Special Requests (Optional)', 'طلبات خاصة (اختياري)')}
                </label>
                <textarea
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder={t('Any dietary requirements, seating preferences, or other requests...', 'أي متطلبات غذائية، تفضيلات الجلوس، أو طلبات أخرى...')}
                  className="w-full min-h-[80px] px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {!user && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
                  {t('You must be signed in to book a table.', 'يجب عليك تسجيل الدخول لحجز طاولة.')}
                </p>
              )}

              <Button
                className="w-full rounded-xl py-6 text-base"
                onClick={handleConfirm}
                disabled={!selectedTime || !user}
              >
                {t('Continue', 'متابعة')}
                <ChevronRight className="w-4 h-4 ms-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
