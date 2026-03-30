import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StarRating } from '@/components/StarRating';
import { useLanguage } from '@/hooks/use-language';
import {
  useGetRestaurant,
  useGetRestaurantMenus,
  useFollowRestaurant,
  useUnfollowRestaurant,
  useDeleteReview,
  useGetRestaurantAvailability,
  useCreateBooking,
  useListOccasions,
  getGetRestaurantQueryKey,
} from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { InlineReviewComposer } from '@/components/InlineReviewComposer';
import { ReviewCard } from '@/components/ReviewCard';
import { MenuTab } from '@/components/MenuTab';
import { StoriesTab } from '@/components/StoriesTab';
import {
  Star, MapPin, Phone, Globe, Clock, CheckCircle2, Heart, HeartOff,
  Utensils, Info, Camera, MessageSquare, CalendarDays, Users,
  ChevronLeft, ChevronRight, Tag, Bell, BellRing, BookImage,
  X, ParkingSquare, Trees, DoorOpen, BadgeCheck, Wifi, CreditCard,
  Bookmark, BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api';

// ── Photo Lightbox ──────────────────────────────────────────────────
function Lightbox({ photos, index, onClose }: { photos: { url: string; alt: string }[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % photos.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [photos.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 end-4 z-10 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
        <X className="w-5 h-5" />
      </button>
      <button
        onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + photos.length) % photos.length); }}
        className="absolute start-4 z-10 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % photos.length); }}
        className="absolute end-16 z-10 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <img
        src={photos[current].url}
        alt={photos[current].alt}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
        onClick={e => e.stopPropagation()}
      />
      <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
        {photos.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i); }}
            className={`rounded-full transition-all ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
      <p className="absolute bottom-10 inset-x-0 text-center text-white/60 text-xs">{current + 1} / {photos.length}</p>
    </div>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

type Tab = 'menu' | 'book' | 'reviews' | 'photos' | 'stories' | 'info';

function getDatesAhead(n: number): Date[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function BookingSection({ restaurantId, restaurantNameEn, restaurantNameAr }: {
  restaurantId: number;
  restaurantNameEn: string;
  restaurantNameAr: string;
}) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const restaurantName = lang === 'ar' ? restaurantNameAr : restaurantNameEn;

  const dates = useMemo(() => getDatesAhead(14), []);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [occasionId, setOccasionId] = useState<number | undefined>();
  const [specialRequests, setSpecialRequests] = useState('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [createdBooking, setCreatedBooking] = useState<{ referenceCode: string; date: string; time: string } | null>(null);
  const [error, setError] = useState('');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const selectedDate = dates[selectedDateIdx];
  const dateKey = formatDateKey(selectedDate);

  const { data: availabilityData, isLoading: availLoading } = useGetRestaurantAvailability(
    restaurantId,
    { date: dateKey, partySize },
    { query: { queryKey: ['availability', restaurantId, dateKey, partySize] } }
  );
  const { data: occasionsData } = useListOccasions();
  const occasions = occasionsData ?? [];
  const slots = availabilityData?.slots ?? [];

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: data => {
        setCreatedBooking({ referenceCode: data.referenceCode, date: data.date, time: data.time });
        setStep('success');
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      },
      onError: () => setError(t('Failed to create booking. Please try again.', 'فشل إنشاء الحجز. حاول مرة أخرى.')),
    },
  });

  const handleConfirm = () => {
    if (!selectedTime) { setError(t('Please select a time slot.', 'الرجاء اختيار وقت.')); return; }
    setError(''); setStep('confirm');
  };

  const handleBook = () => {
    if (!user) return;
    createBooking.mutate({ data: { restaurantId, date: dateKey, time: selectedTime, partySize, occasionId, specialRequests: specialRequests || undefined } });
  };

  if (!user) {
    return (
      <div className="bg-secondary/30 rounded-2xl p-8 text-center">
        <CalendarDays className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">{t('Sign in to book a table', 'سجّل دخولك لحجز طاولة')}</h3>
        <p className="text-muted-foreground mb-5">{t('Create a free account to start booking at your favourite restaurants.', 'أنشئ حساباً مجانياً لحجز طاولات في مطاعمك المفضلة.')}</p>
        <Link href="/signin">
          <Button size="lg">{t('Sign In', 'تسجيل الدخول')}</Button>
        </Link>
      </div>
    );
  }

  if (step === 'success' && createdBooking) {
    return (
      <div className="text-center py-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{t("You're all set!", 'أنت مستعد!')}</h3>
        <p className="text-muted-foreground mb-6">{t('Your table has been reserved at', 'تم حجز طاولتك في')} {restaurantName}.</p>

        <div className="max-w-xs mx-auto bg-secondary/30 rounded-2xl p-5 text-start mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-primary shrink-0" />
            <span className="font-medium">{createdBooking.date}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <span className="font-medium">{createdBooking.time}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <span className="font-medium">{partySize} {t('guests', 'أشخاص')}</span>
          </div>
        </div>

        <div className="max-w-xs mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
          <p className="text-xs text-muted-foreground mb-1">{t('Booking Reference', 'رقم الحجز')}</p>
          <p className="text-2xl font-black font-mono text-primary tracking-widest">{createdBooking.referenceCode}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/bookings">
            <Button variant="outline">{t('My Bookings', 'حجوزاتي')}</Button>
          </Link>
          <Button onClick={() => { setStep('select'); setSelectedTime(''); setCreatedBooking(null); }}>
            {t('Book Another', 'حجز آخر')}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="max-w-lg">
        <h3 className="text-xl font-bold text-foreground mb-5">{t('Confirm Your Reservation', 'تأكيد حجزك')}</h3>
        <div className="bg-secondary/30 rounded-2xl p-5 mb-6">
          <div className="space-y-3 text-sm">
            {[
              { label: t('Restaurant', 'المطعم'), value: restaurantName },
              { label: t('Date', 'التاريخ'), value: dateKey },
              { label: t('Time', 'الوقت'), value: selectedTime },
              { label: t('Guests', 'الأشخاص'), value: String(partySize) },
              ...(occasionId ? [{ label: t('Occasion', 'المناسبة'), value: lang === 'ar' ? occasions.find(o => o.id === occasionId)?.nameAr ?? '' : occasions.find(o => o.id === occasionId)?.nameEn ?? '' }] : []),
              ...(specialRequests ? [{ label: t('Special Requests', 'طلبات خاصة'), value: specialRequests }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">{label}</span>
                <span className="font-semibold text-end">{value}</span>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
            <ChevronLeft className="w-4 h-4 me-1" /> {t('Back', 'رجوع')}
          </Button>
          <Button className="flex-1" onClick={handleBook} disabled={createBooking.isPending}>
            {createBooking.isPending ? t('Booking...', 'جاري الحجز...') : t('Confirm Booking', 'تأكيد الحجز')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">{t('Reserve a Table', 'احجز طاولة')}</h3>
        <p className="text-muted-foreground text-sm">{t('Select your party size, date and preferred time.', 'اختر عدد الأشخاص والتاريخ والوقت المناسب.')}</p>
      </div>

      {/* Party Size */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> {t('Party Size', 'عدد الأشخاص')}
        </label>
        <div className="flex flex-wrap gap-2">
          {PARTY_SIZES.map(size => (
            <button
              key={size}
              onClick={() => { setPartySize(size); setSelectedTime(''); }}
              className={`w-12 h-12 rounded-xl text-sm font-bold border transition-all ${partySize === size ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'border-border hover:border-primary/50 text-foreground'}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" /> {t('Select Date', 'اختر التاريخ')}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {dates.map((d, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedDateIdx(idx); setSelectedTime(''); }}
              className={`shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl border text-xs transition-all ${selectedDateIdx === idx ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'border-border hover:border-primary/40'}`}
            >
              <span className="font-medium">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short' })}</span>
              <span className="text-base font-bold">{d.getDate()}</span>
              <span className="opacity-70">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short' })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> {t('Select Time', 'اختر الوقت')}
        </label>
        {availLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-secondary/30 rounded-2xl overflow-hidden">
            <div className="text-center py-5 text-muted-foreground text-sm">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="font-medium">{t('No available times for this date and party size.', 'لا توجد أوقات متاحة لهذا التاريخ وعدد الأشخاص.')}</p>
              <p className="text-xs mt-1">{t('Try another date or join the waitlist to be notified.', 'جرّب تاريخاً آخر أو انضم لقائمة الانتظار لتلقي الإشعارات.')}</p>
            </div>

            {/* Inline Waitlist */}
            {!waitlistSubmitted ? (
              <div className="border-t border-border/50 p-4">
                {!waitlistOpen ? (
                  <button
                    onClick={() => setWaitlistOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/40 text-primary font-semibold text-sm hover:bg-primary/5 transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    {t('Join Waitlist — Get notified when available', 'انضم لقائمة الانتظار — احصل على إشعار عند التوفر')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-primary" />
                      {t("We'll notify you when a slot opens", 'سنُشعرك عند توفر مقعد')}
                    </p>
                    <input
                      type="tel"
                      value={waitlistPhone}
                      onChange={e => setWaitlistPhone(e.target.value)}
                      placeholder={t('Your phone number (+966…)', 'رقم هاتفك (+966…)')}
                      className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={waitlistPhone.length < 8}
                        onClick={() => { setWaitlistSubmitted(true); setWaitlistOpen(false); }}
                      >
                        {t('Notify Me', 'أشعرني')}
                      </Button>
                      <Button variant="outline" onClick={() => setWaitlistOpen(false)}>
                        {t('Cancel', 'إلغاء')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-border/50 p-4">
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">{t("You're on the waitlist!", 'أنت في قائمة الانتظار!')}</p>
                    <p className="text-xs text-green-600/80 dark:text-green-500">{t("We'll text you as soon as a table becomes available.", 'سنُرسل لك رسالة فور توفر طاولة.')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slots.map(slot => (
              <button
                key={slot.time}
                onClick={() => setSelectedTime(slot.time)}
                disabled={!slot.available}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  selectedTime === slot.time ? 'bg-primary text-primary-foreground border-primary shadow-md' :
                  slot.available ? 'border-border hover:border-primary/50 text-foreground hover:bg-secondary/50' :
                  'border-border/30 text-muted-foreground/40 cursor-not-allowed bg-muted/30'
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
          <label className="text-sm font-semibold text-foreground mb-2 block">{t('Occasion (Optional)', 'المناسبة (اختياري)')}</label>
          <select
            value={occasionId ?? ''}
            onChange={e => setOccasionId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{t('No special occasion', 'بدون مناسبة')}</option>
            {occasions.map(o => <option key={o.id} value={o.id}>{lang === 'ar' ? o.nameAr : o.nameEn}</option>)}
          </select>
        </div>
      )}

      {/* Special Requests */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">{t('Special Requests (Optional)', 'طلبات خاصة (اختياري)')}</label>
        <textarea
          value={specialRequests}
          onChange={e => setSpecialRequests(e.target.value)}
          placeholder={t('Dietary requirements, seating preferences, celebrations…', 'متطلبات غذائية، تفضيلات الجلوس، احتفالات…')}
          className="w-full min-h-[80px] px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

      <Button className="w-full py-6 text-base font-bold" onClick={handleConfirm} disabled={!selectedTime}>
        {t('Continue to Confirm', 'متابعة للتأكيد')}
        <ChevronRight className="w-5 h-5 ms-2" />
      </Button>
    </div>
  );
}

export function RestaurantDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const { data, isLoading } = useGetRestaurant(Number(id), {
    query: { enabled: !!id, queryKey: ['restaurant', id] },
  });
  const { data: menuData } = useGetRestaurantMenus(Number(id), {
    query: { enabled: !!id, queryKey: ['restaurant-menus', id] },
  });

  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<{ url: string; alt: string }[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const { mutate: followRestaurant } = useFollowRestaurant();
  const { mutate: unfollowRestaurant } = useUnfollowRestaurant();
  const queryClient = useQueryClient();
  const deleteReview = useDeleteReview();

  React.useEffect(() => {
    if (data) setIsFollowing(data.isFollowing ?? false);
  }, [data]);

  React.useEffect(() => {
    if (!user || !id) return;
    fetch(`/api/me/saved-restaurants/${id}`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setIsSaved(d.saved); })
      .catch(() => {});
  }, [user, id]);

  const toggleFollow = () => {
    if (!user) return;
    const restaurantId = Number(id);
    if (isFollowing) {
      unfollowRestaurant({ restaurantId }, { onSuccess: () => setIsFollowing(false) });
    } else {
      followRestaurant({ restaurantId }, { onSuccess: () => setIsFollowing(true) });
    }
  };

  const toggleSave = async () => {
    if (!user) return;
    const restaurantId = Number(id);
    const method = isSaved ? 'DELETE' : 'POST';
    const res = await fetch(`/api/me/saved-restaurants/${restaurantId}`, { method, headers: getAuthHeaders() });
    if (res.ok) {
      setIsSaved(!isSaved);
      queryClient.invalidateQueries({ queryKey: ['saved-restaurants'] });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[45vh] bg-muted animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded w-64" />
          <div className="h-4 bg-muted animate-pulse rounded w-48" />
        </div>
      </div>
    );
  }

  if (!data?.restaurant) {
    return <div className="p-20 text-center text-xl">{t('Restaurant not found', 'المطعم غير موجود')}</div>;
  }

  const { restaurant, categories, occasions, openingHours, recentReviews, ratingBreakdown, activeOffers } = data;
  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const description = lang === 'ar' ? restaurant.descriptionAr : restaurant.descriptionEn;
  const today = new Date().getDay();
  const fallback = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop';

  const priceTierLabel = ({ budget: t('Budget', 'اقتصادي'), mid: t('Mid-Range', 'متوسط'), upscale: t('Upscale', 'راقٍ'), fine_dining: t('Fine Dining', 'فاخر') } as Record<string, string>)[restaurant.priceTier as string] ?? restaurant.priceTier;

  // ── Gallery photos (hero strip + Photos tab + Lightbox) ───────────
  const rid = Number(restaurant.id) || 1;
  const GALLERY_SEEDS = [
    'restaurant,food,plating', 'gourmet,dish,food', 'fine-dining,cuisine,meal',
    'restaurant,interior,ambiance', 'chef,kitchen,cooking', 'dessert,pastry,sweet',
    'salad,healthy,fresh', 'grilled,meat,steak',
  ];
  const dishPhotos = menuData
    ? menuData.flatMap(m => m.sections).flatMap(s => (s.items || []) as any[]).filter((d: any) => d.imageUrl).map((d: any) => ({ url: d.imageUrl, alt: lang === 'ar' ? d.nameAr : d.nameEn }))
    : [];
  const curatedPhotos = GALLERY_SEEDS.map((seed, i) => ({ url: `https://images.unsplash.com/photo-${['1414235077428-338989a2e8c0','1555396273-367ea4eb4db5','1517248135467-4c7edcad34c4','1504674900247-0877df9cc836','1579871494447-9811cf80d66c','1556742049-0cfed4f6a45d','1546069901-ba9599a7e63c','1551218808-94e220e084d2'][i]}?w=800&h=600&fit=crop`, alt: seed }));
  const allGalleryPhotos = [
    ...(restaurant.coverImageUrl ? [{ url: restaurant.coverImageUrl, alt: name }] : []),
    ...dishPhotos,
    ...curatedPhotos,
  ];

  const openLightbox = (photos: { url: string; alt: string }[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  // Today's opening hours
  const todayHours = openingHours.find(h => h.dayOfWeek === today);
  const isOpenNow = todayHours && !todayHours.isClosed;
  const quickInfoFeatures = [
    restaurant.hasParking && { icon: ParkingSquare, en: 'Parking', ar: 'مواقف' },
    restaurant.hasOutdoorSeating && { icon: Trees, en: 'Outdoor', ar: 'خارجي' },
    restaurant.hasPrivateRoom && { icon: DoorOpen, en: 'Private Room', ar: 'غرفة خاصة' },
    restaurant.isHalal && { icon: BadgeCheck, en: 'Halal', ar: 'حلال' },
  ].filter(Boolean) as { icon: React.ElementType; en: string; ar: string }[];

  const tabs: { id: Tab; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { id: 'menu', label: 'Menu', labelAr: 'المنيو', icon: <Utensils className="w-4 h-4" /> },
    { id: 'book', label: 'Book', labelAr: 'حجز', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', labelAr: 'التقييمات', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'photos', label: 'Photos', labelAr: 'الصور', icon: <Camera className="w-4 h-4" /> },
    { id: 'stories', label: 'Stories', labelAr: 'القصص', icon: <BookImage className="w-4 h-4" /> },
    { id: 'info', label: 'Info', labelAr: 'معلومات', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Lightbox */}
      {lightboxPhotos && (
        <Lightbox photos={lightboxPhotos} index={lightboxIndex} onClose={() => setLightboxPhotos(null)} />
      )}

      {/* Cover */}
      <div className="relative h-[45vh] md:h-[55vh] bg-muted w-full">
        <img
          src={restaurant.coverImageUrl || fallback}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute top-4 start-4 z-10">
          <Link href="/restaurants" className="text-white/80 text-sm hover:text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {t('Restaurants', 'المطاعم')}
          </Link>
        </div>

        {/* Gallery thumbnail strip — bottom-right corner */}
        {allGalleryPhotos.length > 1 && (
          <div className="absolute bottom-4 end-4 z-10 hidden md:flex items-end gap-1.5">
            {allGalleryPhotos.slice(1, 4).map((photo, i) => (
              <button
                key={i}
                onClick={() => { setActiveTab('photos'); openLightbox(allGalleryPhotos, i + 1); }}
                className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white/40 hover:border-white transition-all hover:scale-105 shadow-lg group"
              >
                <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </button>
            ))}
            {allGalleryPhotos.length > 4 && (
              <button
                onClick={() => { setActiveTab('photos'); }}
                className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white/40 hover:border-white transition-all shadow-lg group"
              >
                <img src={allGalleryPhotos[4].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center">
                  <Camera className="w-4 h-4 text-white mb-0.5" />
                  <span className="text-white text-xs font-bold">+{allGalleryPhotos.length - 4}</span>
                </div>
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-0 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-5">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white p-1.5 shadow-2xl shrink-0 translate-y-8 md:translate-y-14 z-10 border border-border">
                <img
                  src={restaurant.logoUrl || fallback}
                  alt="Logo"
                  className="w-full h-full rounded-xl object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = fallback; }}
                />
              </div>
              <div className="text-white pb-2">
                <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3 flex-wrap">
                  {name}
                  {restaurant.isVerified && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold">{Number(restaurant.avgRating)?.toFixed(1) || 'NEW'}</span>
                    <span className="opacity-70">({restaurant.reviewCount || 0})</span>
                  </span>
                  {restaurant.address && (
                    <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                      <MapPin className="w-3.5 h-3.5" /> {restaurant.address}
                    </span>
                  )}
                  {categories.length > 0 && (
                    <span className="bg-primary/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                      {lang === 'ar' ? categories[0].nameAr : categories[0].nameEn}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-2 z-10">
              <Button onClick={() => setActiveTab('book')} size="lg" className="font-bold px-6 shadow-lg">
                <CalendarDays className="w-4 h-4 me-2" />
                {t('Book a Table', 'احجز طاولة')}
              </Button>
              <Button
                variant="secondary" size="icon" onClick={toggleFollow}
                className="w-12 h-12 shrink-0 rounded-2xl border border-border"
                title={isFollowing ? t('Unfollow', 'إلغاء المتابعة') : t('Follow', 'متابعة')}
              >
                {isFollowing ? <HeartOff className="w-5 h-5 text-destructive" /> : <Heart className="w-5 h-5 text-primary" />}
              </Button>
              {user && (
                <Button
                  variant="secondary" size="icon" onClick={toggleSave}
                  className={`w-12 h-12 shrink-0 rounded-2xl border ${isSaved ? 'border-primary bg-primary/10' : 'border-border'}`}
                  title={isSaved ? t('Remove from saved', 'إزالة من المحفوظات') : t('Save restaurant', 'حفظ المطعم')}
                >
                  {isSaved ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5 text-muted-foreground" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats + quick info */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-16">
          {/* Primary stats */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm py-4 border-b border-border/40">
            {ratingBreakdown && ratingBreakdown.count > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold">{ratingBreakdown.overall.toFixed(1)}</span>
                <span className="text-muted-foreground">({ratingBreakdown.count} {t('reviews', 'تقييم')})</span>
              </div>
            )}
            <span className="font-medium text-foreground">{priceTierLabel}</span>
            <span className="text-muted-foreground">{restaurant.followerCount ?? 0} {t('followers', 'متابع')}</span>
            {restaurant.isHalal && (
              <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 dark:bg-green-950/30 px-2.5 py-0.5 rounded-full text-xs border border-green-200 dark:border-green-900/50">
                <BadgeCheck className="w-3.5 h-3.5" /> {t('Halal', 'حلال')}
              </span>
            )}
          </div>
          {/* Quick-info pill strip */}
          <div className="flex flex-wrap items-center gap-3 py-3 text-sm overflow-x-auto hide-scrollbar">
            {/* Open/Closed status */}
            {todayHours && (
              <div className={`flex items-center gap-1.5 font-semibold ${isOpenNow ? 'text-emerald-600' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isOpenNow
                  ? t(`Open · Closes at ${todayHours.closeTime}`, `مفتوح · يغلق عند ${todayHours.closeTime}`)
                  : t('Closed today', 'مغلق اليوم')}
              </div>
            )}
            {todayHours && quickInfoFeatures.length > 0 && <span className="text-border">·</span>}
            {quickInfoFeatures.map(({ icon: Icon, en, ar }) => (
              <div key={en} className="flex items-center gap-1 text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? ar : en}</span>
              </div>
            ))}
            {allGalleryPhotos.length > 1 && (
              <>
                <span className="text-border">·</span>
                <button
                  onClick={() => setActiveTab('photos')}
                  className="flex items-center gap-1 text-primary font-medium hover:underline"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {allGalleryPhotos.length} {t('photos', 'صورة')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Active Offers Banner */}
            {activeOffers.length > 0 && (
              <div className="mb-5 space-y-2">
                {activeOffers.map(offer => (
                  <Link key={offer.id} href="/offers">
                    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4 hover:bg-primary/15 transition-colors cursor-pointer">
                      <Tag className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-foreground text-sm">{lang === 'ar' ? offer.titleAr : offer.titleEn}</p>
                        {offer.discountPercent && (
                          <p className="text-primary text-xs font-medium">{offer.discountPercent}% {t('off — tap to view', 'خصم — اضغط لعرض')}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {description && (
              <p className="text-muted-foreground leading-relaxed mb-5 text-balance">{description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <Link key={cat.id} href={`/restaurants?categoryId=${cat.id}`}>
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                    {lang === 'ar' ? cat.nameAr : cat.nameEn}
                  </span>
                </Link>
              ))}
              {occasions.map(occ => (
                <span key={occ.id} className="px-3 py-1.5 rounded-full bg-accent/50 text-accent-foreground text-sm font-medium">
                  {occ.icon} {lang === 'ar' ? occ.nameAr : occ.nameEn}
                </span>
              ))}
            </div>

            {/* Tabs — sticky below navbar */}
            <div ref={tabBarRef} className="sticky top-[57px] z-20 bg-card -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-border shadow-sm mb-6">
              <div className="flex gap-0 overflow-x-auto hide-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                  >
                    {tab.icon}
                    {lang === 'ar' ? tab.labelAr : tab.label}
                    {tab.id === 'book' && <span className="text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5 font-bold leading-none">{t('NEW', 'جديد')}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab: Menu */}
            {activeTab === 'menu' && (
              <MenuTab menuData={menuData as any} />
            )}

            {/* Tab: Book */}
            {activeTab === 'book' && (
              <BookingSection
                restaurantId={Number(id)}
                restaurantNameEn={restaurant.nameEn}
                restaurantNameAr={restaurant.nameAr}
              />
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-5">
                <InlineReviewComposer
                  restaurantId={Number(id)}
                  restaurantNameEn={restaurant.nameEn}
                  restaurantNameAr={restaurant.nameAr}
                  invalidateKey={[...getGetRestaurantQueryKey(Number(id))]}
                />

                {recentReviews.length > 0 ? (
                  <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground font-medium">{recentReviews.length} {t('reviews', 'تقييم')}</p>
                    {recentReviews.map(review => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onDelete={reviewId => {
                          deleteReview.mutate({ reviewId }, {
                            onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(Number(id)) }),
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t('No reviews yet. Be the first!', 'لا توجد تقييمات بعد. كن الأول!')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Photos */}
            {activeTab === 'photos' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Hero: first photo spans 2 columns */}
                  {allGalleryPhotos.slice(0, 1).map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(allGalleryPhotos, 0)}
                      className="col-span-2 rounded-2xl overflow-hidden aspect-video group cursor-pointer relative text-start"
                    >
                      <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                      <div className="absolute bottom-3 start-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        {t('Cover Photo', 'صورة الغلاف')}
                      </div>
                    </button>
                  ))}
                  {/* Remaining photos */}
                  {allGalleryPhotos.slice(1).map((photo, i) => (
                    <button
                      key={i + 1}
                      onClick={() => openLightbox(allGalleryPhotos, i + 1)}
                      className="rounded-2xl overflow-hidden aspect-square group cursor-pointer relative"
                    >
                      <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors rounded-2xl" />
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">{allGalleryPhotos.length} {t('photos', 'صورة')}</p>
                  <button className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                    <Camera className="w-4 h-4" />
                    {t('Upload a photo', 'ارفع صورة')}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Stories */}
            {activeTab === 'stories' && (
              <StoriesTab restaurantId={Number(id)} />
            )}

            {/* Tab: Info */}
            {activeTab === 'info' && (
              <div className="space-y-5">
                {openingHours.length > 0 && (
                  <div className="bg-card border border-border/60 rounded-2xl p-5">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> {t('Opening Hours', 'ساعات العمل')}
                    </h3>
                    <div className="space-y-2">
                      {openingHours.map(h => (
                        <div key={h.id} className={`flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0 ${h.dayOfWeek === today ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          <span>{lang === 'ar' ? DAYS_AR[h.dayOfWeek] : DAYS[h.dayOfWeek]}</span>
                          <span>{h.isClosed ? t('Closed', 'مغلق') : `${h.openTime} – ${h.closeTime}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-card border border-border/60 rounded-2xl p-5">
                  <h3 className="font-bold text-foreground mb-4">{t('Features & Amenities', 'المميزات والخدمات')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { show: restaurant.hasParking, en: 'Parking', ar: 'مواقف سيارات' },
                      { show: restaurant.hasOutdoorSeating, en: 'Outdoor Seating', ar: 'جلسات خارجية' },
                      { show: restaurant.hasPrivateRoom, en: 'Private Room', ar: 'غرفة خاصة' },
                      { show: restaurant.isHalal, en: 'Halal Certified', ar: 'شهادة حلال' },
                    ].filter(f => f.show).map(f => (
                      <div key={f.en} className="flex items-center gap-2 text-sm bg-secondary/50 rounded-xl px-3 py-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium">{lang === 'ar' ? f.ar : f.en}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border/60 rounded-2xl p-5">
                  <h3 className="font-bold text-foreground mb-4">{t('Contact & Location', 'التواصل والموقع')}</h3>
                  <div className="space-y-3">
                    {restaurant.phone && (
                      <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                        <Phone className="w-4 h-4 text-muted-foreground" /> {restaurant.phone}
                      </a>
                    )}
                    {restaurant.address && (
                      <div className="flex items-center gap-3 text-sm text-foreground">
                        <MapPin className="w-4 h-4 text-muted-foreground" /> {restaurant.address}
                      </div>
                    )}
                    {restaurant.website && (
                      <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-primary hover:underline">
                        <Globe className="w-4 h-4" /> {restaurant.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Book CTA */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 sticky top-24">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" /> {t('Reserve a Table', 'احجز طاولة')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('Instant booking confirmation for this restaurant.', 'تأكيد فوري للحجز في هذا المطعم.')}
              </p>
              <Button className="w-full font-bold" onClick={() => setActiveTab('book')}>
                {t('See Available Times', 'عرض الأوقات المتاحة')}
              </Button>
            </div>

            {/* Rating Breakdown */}
            {ratingBreakdown && ratingBreakdown.count > 0 && (
              <div className="bg-card border border-border/60 rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-4">{t('Rating Breakdown', 'تفاصيل التقييم')}</h3>
                <div className="text-center mb-4">
                  <span className="text-5xl font-black text-foreground">{ratingBreakdown.overall.toFixed(1)}</span>
                  <StarRating rating={ratingBreakdown.overall} size="lg" className="justify-center mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">{ratingBreakdown.count} {t('reviews', 'تقييم')}</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: t('Food', 'الطعام'), value: ratingBreakdown.food },
                    { label: t('Service', 'الخدمة'), value: ratingBreakdown.service },
                    { label: t('Ambiance', 'الأجواء'), value: ratingBreakdown.ambiance },
                    { label: t('Value', 'القيمة'), value: ratingBreakdown.value },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-16 shrink-0">{r.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${((r.value ?? 0) / 5) * 100}%` }} />
                      </div>
                      <span className="font-bold w-8 text-end">{r.value?.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-card border border-border/60 rounded-2xl p-5">
              <div className="space-y-3 text-sm">
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{restaurant.phone}</span>
                  </a>
                )}
                {restaurant.address && (
                  <div className="flex items-center gap-3 text-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{restaurant.address}</span>
                  </div>
                )}
                {openingHours.length > 0 && (() => {
                  const todayHours = openingHours.find(h => h.dayOfWeek === today);
                  return todayHours ? (
                    <div className="flex items-center gap-3 text-foreground">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{todayHours.isClosed ? t('Closed today', 'مغلق اليوم') : `${t('Today:', 'اليوم:')} ${todayHours.openTime} – ${todayHours.closeTime}`}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
