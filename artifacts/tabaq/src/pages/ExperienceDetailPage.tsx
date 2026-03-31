import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders } from '@/lib/api';
import {
  Star, MapPin, Clock, Users, ChevronLeft, ChevronRight, X,
  CalendarDays, CheckCircle2, Gift, QrCode, Camera,
  Share2, Utensils, Info, MessageSquare, ShieldCheck,
  ArrowLeft, Loader2, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useGetExperience,
  useListExperienceSlots,
  useCreateExperienceBooking,
  usePayExperienceBooking,
  useCreateExperienceGift,
  useListExperienceReviews,
  useCreateExperienceReview,
  type ExperienceDetail,
  type ExperienceSlot,
  type ExperienceBooking,
  type ExperienceGift,
} from '@workspace/api-client-react';
import { CreateExperienceGiftRequestGiftCardDesign } from '@workspace/api-client-react';

const GIFT_CARD_DESIGNS: {
  id: CreateExperienceGiftRequestGiftCardDesign;
  label: string;
  labelAr: string;
  gradient: string;
  emoji: string;
}[] = [
  { id: CreateExperienceGiftRequestGiftCardDesign.celebration, label: 'Celebration', labelAr: 'احتفال', gradient: 'from-rose-400 to-pink-600', emoji: '🎉' },
  { id: CreateExperienceGiftRequestGiftCardDesign.birthday, label: 'Birthday', labelAr: 'عيد ميلاد', gradient: 'from-amber-400 to-orange-500', emoji: '🎂' },
  { id: CreateExperienceGiftRequestGiftCardDesign.anniversary, label: 'Anniversary', labelAr: 'ذكرى سنوية', gradient: 'from-violet-500 to-purple-700', emoji: '💜' },
  { id: CreateExperienceGiftRequestGiftCardDesign.classic, label: 'Classic', labelAr: 'كلاسيك', gradient: 'from-emerald-400 to-teal-600', emoji: '✨' },
  { id: CreateExperienceGiftRequestGiftCardDesign.ramadan, label: 'Ramadan', labelAr: 'رمضان', gradient: 'from-yellow-500 to-amber-700', emoji: '🌙' },
];

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  heritage: { en: 'Heritage', ar: 'التراث' },
  street_food: { en: 'Street Food', ar: 'طعام الشارع' },
  fine_dining: { en: 'Fine Dining', ar: 'مطاعم راقية' },
  live_show: { en: 'Live Show', ar: 'عروض حية' },
  cultural: { en: 'Cultural', ar: 'ثقافي' },
  outdoor: { en: 'Outdoor Dining', ar: 'طعام في الهواء الطلق' },
  tasting: { en: 'Tasting', ar: 'تذوق' },
  cooking_class: { en: 'Cooking Class', ar: 'دورة طبخ' },
  brunch: { en: 'Brunch', ar: 'برانش' },
};

type Tab = 'overview' | 'details' | 'reviews' | 'policies';


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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star className={cn('w-5 h-5 transition-colors', (hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-border')} />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="font-semibold w-6 text-end">{value.toFixed(1)}</span>
    </div>
  );
}

function GallerySection({
  images,
  title,
}: {
  images: { url: string; isPrimary?: boolean }[];
  title: string;
}) {
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { t } = useLanguage();

  if (images.length === 0) return null;

  const currentImg = images[idx]?.url ?? images[0].url;

  return (
    <>
      <div className="relative h-[55vh] min-h-[320px] max-h-[500px] overflow-hidden">
        <img src={currentImg} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % images.length)}
              className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={cn('rounded-full transition-all', i === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80')}
                />
              ))}
            </div>
          </>
        )}

        {/* Thumbnails strip */}
        <div className="absolute bottom-10 end-4 flex gap-1.5">
          {images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn('w-10 h-10 rounded-md overflow-hidden border-2 transition-all', i === idx ? 'border-white' : 'border-white/30 hover:border-white/70')}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {images.length > 4 && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-10 h-10 rounded-md bg-black/60 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold"
            >
              +{images.length - 4}
            </button>
          )}
        </div>

        {/* Back button */}
        <Link href="/experiences" className="absolute top-4 start-4 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 end-4 z-10 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img
            src={currentImg}
            alt={title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export function ExperienceDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const expId = Number(id);
  const { data: experienceRaw, isLoading, isError } = useGetExperience(expId, {
    query: { enabled: !!expId } as any,
  });
  const experience: any = (!isError && experienceRaw) ? experienceRaw : null;
  usePageMeta({
    titleEn: (experience as any)?.titleEn ? `${(experience as any).titleEn} | Tabaq` : 'Experience | Tabaq',
    titleAr: (experience as any)?.titleAr ? `${(experience as any).titleAr} | طبق` : 'تجربة | طبق',
    descriptionEn: (experience as any)?.descriptionEn ?? 'Book unique dining experiences across Saudi Arabia on Tabaq.',
    descriptionAr: (experience as any)?.descriptionAr ?? 'احجز تجارب طعام فريدة في أنحاء المملكة العربية السعودية على طبق.',
  }, lang);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [step, setStep] = useState<'select' | 'details' | 'payment' | 'success' | 'failed'>('select');
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<ExperienceSlot | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [paymentMode, setPaymentMode] = useState<'full' | 'deposit'>('full');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ExperienceBooking | null>(null);
  const [bookingError, setBookingError] = useState('');

  const [showGifting, setShowGifting] = useState(false);
  const [giftDesign, setGiftDesign] = useState<CreateExperienceGiftRequestGiftCardDesign>(
    CreateExperienceGiftRequestGiftCardDesign.celebration
  );
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [sentGift, setSentGift] = useState<ExperienceGift | null>(null);
  const [giftError, setGiftError] = useState('');

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFood, setReviewFood] = useState(0);
  const [reviewHospitality, setReviewHospitality] = useState(0);
  const [reviewAmbiance, setReviewAmbiance] = useState(0);
  const [reviewValue, setReviewValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const dates = useMemo(() => getDatesAhead(30), []);
  const selectedDate = dates[selectedDateIdx];
  const dateKey = formatDateKey(selectedDate);

  const slotDateFrom = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [selectedDate]);

  const slotDateTo = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [selectedDate]);

  const { data: slotsData, isLoading: slotsLoading } = useListExperienceSlots(
    expId,
    { dateFrom: slotDateFrom, dateTo: slotDateTo },
    { query: { enabled: !!expId && step === 'select' } as any }
  );

  const availableSlots = useMemo(
    () => (slotsData ?? []).filter(s => s.isActive && s.remainingCapacity > 0),
    [slotsData]
  );

  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useListExperienceReviews(
    expId,
    { limit: 20 },
    { query: { enabled: !!expId && activeTab === 'reviews' } as any }
  );

  const { data: myBookingsData } = useQuery({
    queryKey: ['my-experience-bookings', expId],
    queryFn: async () => {
      const res = await fetch('/api/me/experience-bookings', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json() as Promise<{ bookings: ExperienceBooking[] }>;
    },
    enabled: !!user,
  });

  const pastConfirmedBooking = useMemo(() => {
    if (!myBookingsData?.bookings) return null;
    return myBookingsData.bookings.find(
      b => (b as any).experienceId === expId && (b.status === 'confirmed' || b.status === 'completed' || b.status === 'pending')
    ) ?? null;
  }, [myBookingsData, expId]);

  const effectiveConfirmedBooking = confirmedBooking ?? pastConfirmedBooking;

  const createBooking = useCreateExperienceBooking();
  const payBooking = usePayExperienceBooking();
  const createGift = useCreateExperienceGift();
  const createReview = useCreateExperienceReview();

  if (isLoading && !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('Loading experience…', 'جاري التحميل…')}</p>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('Experience not found', 'التجربة غير موجودة')}</h2>
          <Link href="/experiences">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('Back to Experiences', 'العودة للتجارب')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = lang === 'ar' ? experience.titleAr : experience.titleEn;
  const description = lang === 'ar' ? (experience.descriptionAr ?? experience.descriptionEn) : experience.descriptionEn;
  const city = lang === 'ar' ? (experience.cityNameAr ?? '') : (experience.cityNameEn ?? '');
  const catLabel = CATEGORY_LABELS[experience.category] ?? { en: experience.category, ar: experience.category };
  const category = lang === 'ar' ? catLabel.ar : catLabel.en;
  const host = lang === 'ar' ? (experience.hostNameAr ?? experience.hostNameEn) : (experience.hostNameEn ?? '');

  const galleryImages: { url: string; isPrimary?: boolean }[] =
    (experience.images ?? []).length > 0
      ? experience.images!
      : [
          { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&h=600&fit=crop' },
          { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop' },
        ];

  const totalPrice = experience.pricePerPerson * guestCount;
  const depositAmount = experience.depositAmount ?? Math.ceil(totalPrice * 0.3);
  const currency = experience.currency || 'SAR';

  const fmt = (n: number) =>
    n.toLocaleString('en-SA', { style: 'currency', currency, minimumFractionDigits: 0 });

  const tabs: { key: Tab; en: string; ar: string; icon: React.ElementType }[] = [
    { key: 'overview', en: 'Overview', ar: 'نظرة عامة', icon: Info },
    { key: 'details', en: 'Details', ar: 'التفاصيل', icon: Utensils },
    { key: 'reviews', en: 'Reviews', ar: 'التقييمات', icon: MessageSquare },
    { key: 'policies', en: 'Policies', ar: 'السياسات', icon: ShieldCheck },
  ];

  const handleBook = async () => {
    if (!termsAccepted || !selectedSlot || !user) return;
    setBookingError('');
    try {
      const booking = await createBooking.mutateAsync({
        data: {
          experienceId: expId,
          slotId: selectedSlot.id,
          guestCount,
          guestName: guestName.trim() || undefined,
          guestEmail: guestEmail.trim() || undefined,
          specialRequests: specialRequests.trim() || undefined,
        },
      });
      const paid = await payBooking.mutateAsync({
        bookingId: booking.id,
        data: { type: paymentMode },
      });
      setConfirmedBooking(booking);
      setStep('success');
    } catch (err: any) {
      setBookingError(
        err?.message ?? t('Payment failed. Please try again.', 'فشل الدفع. يرجى المحاولة مرة أخرى.')
      );
      setStep('failed');
    }
  };

  const handleGiftSubmit = async () => {
    if (!recipientEmail || !recipientName || !user) return;
    setGiftError('');
    try {
      const gift = await createGift.mutateAsync({
        data: {
          experienceId: expId,
          recipientEmail,
          recipientName,
          personalMessage: giftMessage.trim() || undefined,
          giftCardDesign: giftDesign,
        },
      });
      setSentGift(gift);
    } catch (err: any) {
      setGiftError(
        err?.message ?? t('Could not send gift. Please try again.', 'تعذر إرسال الهدية. يرجى المحاولة.')
      );
    }
  };

  const handleSubmitReview = async () => {
    if (!user || reviewRating === 0 || !reviewText.trim() || !effectiveConfirmedBooking) return;
    setReviewError('');
    try {
      await createReview.mutateAsync({
        data: {
          experienceId: expId,
          bookingId: effectiveConfirmedBooking.id,
          ratingOverall: reviewRating,
          ratingFood: reviewFood || undefined,
          ratingHospitality: reviewHospitality || undefined,
          ratingAmbiance: reviewAmbiance || undefined,
          ratingValue: reviewValue || undefined,
          textEn: reviewText.trim(),
        },
      });
      setReviewSubmitted(true);
      refetchReviews();
    } catch (err: any) {
      setReviewError(
        err?.message ?? t('Failed to submit review.', 'فشل إرسال التقييم.')
      );
    }
  };

  const rb = reviewsData?.ratingBreakdown;

  return (
    <div className="min-h-screen bg-background">
      {/* Gallery */}
      <GallerySection images={galleryImages} title={title} />

      {/* Title + meta overlay (below gallery) */}
      <div className="bg-gradient-to-b from-black/80 to-black/40 -mt-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <span className="inline-block text-xs font-semibold text-white/90 bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">
            {category}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
            {city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{city}</span>}
            {experience.durationMinutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{formatDuration(experience.durationMinutes)}
              </span>
            )}
            {experience.capacity > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />{t(`Up to ${experience.capacity} guests`, `حتى ${experience.capacity} ضيوف`)}
              </span>
            )}
            {experience.avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold">{Number(experience.avgRating).toFixed(1)}</span>
                <span className="text-white/60">({experience.reviewCount} {t('reviews', 'تقييم')})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT — Tabs */}
          <div className="flex-1 min-w-0">
            <div className="flex border-b border-border mb-6 overflow-x-auto hide-scrollbar">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0',
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {lang === 'ar' ? tab.ar : tab.en}
                  </button>
                );
              })}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {description && (
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-3">{t('About This Experience', 'عن هذه التجربة')}</h2>
                    <p className="text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                )}

                {/* Host profile */}
                {host && (
                  <div className="flex items-center gap-4 bg-secondary/30 rounded-2xl p-5">
                    {experience.hostAvatarUrl ? (
                      <img src={experience.hostAvatarUrl} alt={host} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        {host.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{t('Hosted by', 'مقدمة بواسطة')}</p>
                      <p className="font-bold text-foreground">{host}</p>
                    </div>
                  </div>
                )}

                {experience.address && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">{t('Location', 'الموقع')}</h3>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{experience.address}</span>
                    </div>
                    {experience.latitude && experience.longitude && (
                      <div className="rounded-xl overflow-hidden border border-border h-48 bg-muted flex items-center justify-center">
                        <a
                          href={`https://maps.google.com/?q=${experience.latitude},${experience.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary font-semibold flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          {t('View on Google Maps', 'عرض على خرائط جوجل')}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { labelEn: 'Duration', labelAr: 'المدة', value: experience.durationMinutes ? formatDuration(experience.durationMinutes) : '-' },
                    { labelEn: 'Max Guests', labelAr: 'أقصى عدد ضيوف', value: experience.capacity ? String(experience.capacity) : '-' },
                    { labelEn: 'Language', labelAr: 'اللغة', value: t('Arabic & English', 'عربي وإنجليزي') },
                    { labelEn: 'Category', labelAr: 'الفئة', value: category },
                  ].map(info => (
                    <div key={info.labelEn} className="bg-secondary/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? info.labelAr : info.labelEn}</p>
                      <p className="font-semibold text-foreground text-sm">{info.value}</p>
                    </div>
                  ))}
                </div>

                {/* Menu / Programme Details */}
                {(lang === 'ar' ? experience.menuDetailsAr : experience.menuDetailsEn) && (
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{t('Menu & Programme', 'القائمة والبرنامج')}</h3>
                    <div className="bg-secondary/30 rounded-2xl p-5 space-y-2">
                      {(lang === 'ar' ? experience.menuDetailsAr! : experience.menuDetailsEn!)
                        .split('\n')
                        .filter(line => line.trim())
                        .map((line: string, i: number) => {
                          const isCourse = line.startsWith('Course') || line.startsWith('طبق') || line.startsWith('Stop') || line.startsWith('محطة') || line.startsWith('Part') || line.startsWith('الجزء') || line.startsWith('Hands-on') || line.startsWith('درس') || line.startsWith('Welcome') || line.startsWith('Arrival') || line.startsWith('الوصول') || line.startsWith('ترحيب') || line.startsWith('Dessert') || line.startsWith('حلوى') || line.startsWith('Finale') || line.startsWith('ختام') || line.startsWith('Shared') || line.startsWith('غداء') || line.startsWith('Take-home') || line.startsWith('ما تأخذه');
                          return (
                            <div key={i} className={cn('text-sm', isCourse ? 'font-semibold text-foreground pt-1' : 'text-muted-foreground ps-3')}>
                              {line.startsWith('•') ? (
                                <span className="flex gap-2"><span className="text-primary shrink-0">•</span><span>{line.slice(1).trim()}</span></span>
                              ) : line}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Rating breakdown */}
                    <div className="bg-secondary/30 rounded-2xl p-5">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-center shrink-0">
                          <p className="text-4xl font-black text-foreground">{Number(experience.avgRating).toFixed(1)}</p>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={cn('w-3.5 h-3.5', experience.avgRating >= i ? 'fill-amber-400 text-amber-400' : 'text-border')} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{experience.reviewCount} {t('reviews', 'تقييم')}</p>
                        </div>
                        {rb && (
                          <div className="flex-1 space-y-2">
                            {rb.avgFood && <RatingBar label={t('Food', 'الطعام')} value={rb.avgFood} />}
                            {rb.avgHospitality && <RatingBar label={t('Hospitality', 'الضيافة')} value={rb.avgHospitality} />}
                            {rb.avgAmbiance && <RatingBar label={t('Ambiance', 'الأجواء')} value={rb.avgAmbiance} />}
                            {rb.avgValue && <RatingBar label={t('Value', 'القيمة')} value={rb.avgValue} />}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Leave a review — only if user has a confirmed booking (session or past) */}
                    {user && effectiveConfirmedBooking && !reviewSubmitted && (
                      <div className="border border-dashed border-primary/40 rounded-2xl p-5">
                        <h3 className="font-semibold text-foreground mb-4">{t('Share Your Experience', 'شارك تجربتك')}</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('Overall Rating *', 'التقييم العام *')}</label>
                            <StarInput value={reviewRating} onChange={setReviewRating} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { labelEn: 'Food Quality', labelAr: 'جودة الطعام', val: reviewFood, set: setReviewFood },
                              { labelEn: 'Hospitality', labelAr: 'الضيافة', val: reviewHospitality, set: setReviewHospitality },
                              { labelEn: 'Ambiance', labelAr: 'الأجواء', val: reviewAmbiance, set: setReviewAmbiance },
                              { labelEn: 'Value', labelAr: 'القيمة', val: reviewValue, set: setReviewValue },
                            ].map(dim => (
                              <div key={dim.labelEn}>
                                <label className="text-xs text-muted-foreground mb-1 block">{lang === 'ar' ? dim.labelAr : dim.labelEn}</label>
                                <StarInput value={dim.val} onChange={dim.set} />
                              </div>
                            ))}
                          </div>
                          <textarea
                            value={reviewText}
                            onChange={e => setReviewText(e.target.value)}
                            placeholder={t('Tell us about your experience…', 'أخبرنا عن تجربتك…')}
                            className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          {reviewError && (
                            <p className="text-sm text-destructive flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />{reviewError}
                            </p>
                          )}
                          <Button
                            onClick={handleSubmitReview}
                            disabled={reviewRating === 0 || !reviewText.trim() || createReview.isPending}
                            className="w-full"
                          >
                            {createReview.isPending ? (
                              <><Loader2 className="w-4 h-4 animate-spin me-2" />{t('Submitting…', 'جاري الإرسال…')}</>
                            ) : t('Submit Review', 'إرسال التقييم')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {reviewSubmitted && (
                      <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl px-4 py-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">{t('Review submitted! Thank you.', 'تم إرسال التقييم! شكراً.')}</p>
                      </div>
                    )}

                    {/* Review list */}
                    <div className="space-y-4">
                      {(reviewsData?.reviews ?? []).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {t('No reviews yet. Be the first!', 'لا توجد تقييمات بعد. كن أول من يقيّم!')}
                        </div>
                      ) : (
                        (reviewsData?.reviews ?? []).map(review => {
                          const reviewerName = lang === 'ar'
                            ? (review.userNameAr ?? review.userNameEn ?? 'Anonymous')
                            : (review.userNameEn ?? 'Anonymous');
                          const reviewText = lang === 'ar'
                            ? (review.textAr ?? review.textEn)
                            : review.textEn;
                          return (
                            <div key={review.id} className="bg-card rounded-2xl border border-border/60 p-5">
                              <div className="flex items-start gap-3 mb-3">
                                {review.userAvatarUrl ? (
                                  <img src={review.userAvatarUrl} alt={reviewerName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                                    {(reviewerName).charAt(0)}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-foreground text-sm">{reviewerName}</p>
                                      {review.isVerified && (
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                                          {t('Verified', 'موثق')}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                  <div className="flex gap-0.5 mt-0.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                      <Star key={i} className={cn('w-3 h-3', review.ratingOverall >= i ? 'fill-amber-400 text-amber-400' : 'text-border')} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {reviewText && (
                                <p className="text-sm text-foreground leading-relaxed">{reviewText}</p>
                              )}
                              {(review.photoUrls ?? []).length > 0 && (
                                <div className="flex gap-2 mt-3">
                                  {review.photoUrls!.map((url, i) => (
                                    <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">{t('Rules & Policies', 'القواعد والسياسات')}</h2>
                {(lang === 'ar' ? experience.rulesAr : experience.rulesEn) ? (
                  <ul className="space-y-3">
                    {(lang === 'ar' ? experience.rulesAr! : experience.rulesEn!)
                      .split(/\.\s+/)
                      .map((s: string) => s.trim())
                      .filter((s: string) => s.length > 4)
                      .map((rule, i) => (
                        <li key={i} className="flex items-start gap-3 bg-secondary/30 rounded-xl p-4 text-sm">
                          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{rule.endsWith('.') ? rule : rule + '.'}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    {[
                      { en: 'Free cancellation up to 48 hours before the experience.', ar: 'إلغاء مجاني حتى 48 ساعة قبل التجربة.' },
                      { en: 'Please arrive 10 minutes before the start time.', ar: 'يرجى الوصول 10 دقائق قبل وقت البدء.' },
                      { en: 'Dietary requirements must be communicated at booking.', ar: 'يجب إبلاغنا بالمتطلبات الغذائية عند الحجز.' },
                      { en: 'Maximum group size may be limited per session.', ar: 'قد يكون الحد الأقصى لحجم المجموعة محدوداً لكل جلسة.' },
                    ].map((p, i) => (
                      <li key={i} className="flex items-start gap-3 bg-secondary/30 rounded-xl p-4 text-sm">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{lang === 'ar' ? p.ar : p.en}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Booking Widget */}
          <div className="lg:w-[380px] shrink-0">
            <div className="sticky top-20">
              <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                {/* Price header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-primary">{fmt(experience.pricePerPerson)}</span>
                    <span className="text-sm text-muted-foreground">{t('/ person', '/ شخص')}</span>
                  </div>
                  {experience.avgRating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">{Number(experience.avgRating).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({experience.reviewCount} {t('reviews', 'تقييم')})</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Booking success */}
                  {step === 'success' && confirmedBooking && (
                    <div className="text-center py-4">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{t('Booked!', 'تم الحجز!')}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{t('Your experience is confirmed.', 'تجربتك مؤكدة.')}</p>
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                        <p className="text-xs text-muted-foreground mb-1">{t('Booking Reference', 'رقم الحجز')}</p>
                        <p className="text-xl font-black font-mono text-primary tracking-widest">{confirmedBooking.referenceCode}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/bookings" className="flex-1">
                          <Button variant="outline" className="w-full">{t('My Bookings', 'حجوزاتي')}</Button>
                        </Link>
                        <Button className="flex-1" onClick={() => {
                          setStep('select');
                          setSelectedSlot(null);
                          setTermsAccepted(false);
                          setBookingError('');
                        }}>
                          {t('Book Again', 'حجز آخر')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Failed */}
                  {step === 'failed' && (
                    <div className="text-center py-4">
                      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-destructive" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{t('Payment Failed', 'فشل الدفع')}</h3>
                      {bookingError && <p className="text-sm text-destructive mb-4">{bookingError}</p>}
                      <Button onClick={() => setStep('payment')}>{t('Try Again', 'إعادة المحاولة')}</Button>
                    </div>
                  )}

                  {/* Step 1: Select date, slot, guests */}
                  {step === 'select' && (
                    <div className="space-y-5">
                      <h3 className="font-bold text-foreground">{t('Reserve Your Spot', 'احجز مكانك')}</h3>

                      {/* Guest count */}
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />{t('Guests', 'الضيوف')}
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setGuestCount(c => Math.max(1, c - 1))}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors font-bold"
                          >
                            −
                          </button>
                          <span className="text-lg font-bold text-foreground w-8 text-center">{guestCount}</span>
                          <button
                            onClick={() => setGuestCount(c => Math.min(experience.capacity || 20, c + 1))}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors font-bold"
                          >
                            +
                          </button>
                          {experience.capacity > 0 && (
                            <span className="text-xs text-muted-foreground">{t(`max ${experience.capacity}`, `الأقصى ${experience.capacity}`)}</span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-primary" />{t('Date', 'التاريخ')}
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                          {dates.slice(0, 14).map((d, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setSelectedDateIdx(idx); setSelectedSlot(null); }}
                              className={cn(
                                'shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs transition-all',
                                selectedDateIdx === idx
                                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                  : 'border-border hover:border-primary/40'
                              )}
                            >
                              <span className="font-medium">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short' })}</span>
                              <span className="text-base font-bold">{d.getDate()}</span>
                              <span className="opacity-70">{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short' })}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time slots */}
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">{t('Available Slots', 'الأوقات المتاحة')}</label>
                        {slotsLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('Loading slots…', 'جاري تحميل الأوقات…')}
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
                            {t('No slots available for this date.', 'لا توجد أوقات متاحة لهذا التاريخ.')}
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {availableSlots.map(slot => {
                              const isFull = slot.remainingCapacity < guestCount;
                              const isSelected = selectedSlot?.id === slot.id;
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => !isFull && setSelectedSlot(slot)}
                                  disabled={isFull}
                                  className={cn(
                                    'py-2 px-3 rounded-xl text-sm font-semibold border transition-all flex flex-col items-center',
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                      : isFull
                                      ? 'border-border text-muted-foreground bg-muted/40 cursor-not-allowed'
                                      : 'border-border hover:border-primary/50 text-foreground'
                                  )}
                                >
                                  <span>{slot.startTime}</span>
                                  <span className={cn('text-[10px] mt-0.5', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                    {isFull
                                      ? t('Full', 'ممتلئ')
                                      : `${slot.remainingCapacity} ${t('left', 'متبقي')}`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {selectedSlot && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{guestCount} × {fmt(experience.pricePerPerson)}</span>
                            <span className="font-bold text-foreground">{fmt(totalPrice)}</span>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full py-5 text-base font-bold"
                        disabled={!selectedSlot}
                        onClick={() => { if (selectedSlot) setStep('details'); }}
                      >
                        {t('Continue', 'متابعة')}
                      </Button>

                      {!user && (
                        <p className="text-xs text-muted-foreground text-center">
                          {t("You'll need to sign in to complete your booking.", 'ستحتاج للتسجيل لإتمام حجزك.')}{' '}
                          <Link href="/signin" className="text-primary font-semibold hover:underline">{t('Sign in', 'دخول')}</Link>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Step 2: Guest details */}
                  {step === 'details' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setStep('select')} className="text-muted-foreground hover:text-foreground">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold text-foreground">{t('Your Details', 'بياناتك')}</h3>
                      </div>

                      <div className="bg-secondary/30 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between"><span>{t('Date', 'التاريخ')}</span><span className="font-semibold text-foreground">{dateKey}</span></div>
                        <div className="flex justify-between"><span>{t('Time', 'الوقت')}</span><span className="font-semibold text-foreground">{selectedSlot?.startTime}</span></div>
                        <div className="flex justify-between"><span>{t('Guests', 'الضيوف')}</span><span className="font-semibold text-foreground">{guestCount}</span></div>
                      </div>

                      <input
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        placeholder={t('Full name *', 'الاسم الكامل *')}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        type="email"
                        placeholder={t('Email address *', 'البريد الإلكتروني *')}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <textarea
                        value={specialRequests}
                        onChange={e => setSpecialRequests(e.target.value)}
                        placeholder={t('Special requests, dietary requirements…', 'طلبات خاصة، متطلبات غذائية…')}
                        className="w-full min-h-[70px] px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />

                      <Button
                        className="w-full py-5 text-base font-bold"
                        disabled={!guestName || !guestEmail}
                        onClick={() => setStep('payment')}
                      >
                        {t('Continue to Payment', 'متابعة للدفع')}
                      </Button>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {step === 'payment' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setStep('details')} className="text-muted-foreground hover:text-foreground">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold text-foreground">{t('Payment', 'الدفع')}</h3>
                      </div>

                      <div className="bg-secondary/30 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{guestCount} {t('guests', 'ضيوف')} × {fmt(experience.pricePerPerson)}</span>
                          <span className="font-bold">{fmt(totalPrice)}</span>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="flex justify-between font-bold text-foreground">
                          <span>{t('Total', 'المجموع')}</span>
                          <span className="text-primary">{fmt(totalPrice)}</span>
                        </div>
                      </div>

                      {/* Payment options */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">{t('Payment Option', 'خيار الدفع')}</label>
                        <div className="space-y-2">
                          {[
                            {
                              mode: 'full' as const,
                              labelEn: 'Pay Full Amount',
                              labelAr: 'دفع المبلغ كاملاً',
                              descEn: `${fmt(totalPrice)} now`,
                              descAr: `${fmt(totalPrice)} الآن`,
                            },
                            {
                              mode: 'deposit' as const,
                              labelEn: 'Pay 30% Deposit',
                              labelAr: 'دفع 30% مقدم',
                              descEn: `${fmt(depositAmount)} now, rest at the experience`,
                              descAr: `${fmt(depositAmount)} الآن، الباقي في التجربة`,
                            },
                          ].map(opt => (
                            <button
                              key={opt.mode}
                              onClick={() => setPaymentMode(opt.mode)}
                              className={cn(
                                'w-full flex items-start gap-3 p-3 rounded-xl border text-start transition-all',
                                paymentMode === opt.mode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                              )}
                            >
                              <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center', paymentMode === opt.mode ? 'border-primary' : 'border-muted-foreground')}>
                                {paymentMode === opt.mode && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? opt.labelAr : opt.labelEn}</p>
                                <p className="text-xs text-muted-foreground">{lang === 'ar' ? opt.descAr : opt.descEn}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={e => setTermsAccepted(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          {t('I agree to the ', 'أوافق على ')}
                          <a href="/terms" target="_blank" className="text-primary hover:underline">{t('terms and conditions', 'الشروط والأحكام')}</a>
                          {t(' and cancellation policy.', ' وسياسة الإلغاء.')}
                        </span>
                      </label>

                      {bookingError && (
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />{bookingError}
                        </p>
                      )}

                      <Button
                        className="w-full py-5 text-base font-bold"
                        disabled={!termsAccepted || createBooking.isPending || payBooking.isPending || !user}
                        onClick={handleBook}
                      >
                        {(createBooking.isPending || payBooking.isPending) ? (
                          <><Loader2 className="w-4 h-4 animate-spin me-2" />{t('Processing…', 'جاري المعالجة…')}</>
                        ) : t('Confirm & Pay', 'تأكيد والدفع')}
                      </Button>

                      {!user && (
                        <p className="text-xs text-muted-foreground text-center">
                          <Link href="/signin" className="text-primary font-semibold hover:underline">{t('Sign in to confirm', 'سجل للتأكيد')}</Link>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Gift button */}
                {step === 'select' && (
                  <button
                    onClick={() => setShowGifting(v => !v)}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/50 text-primary font-semibold text-sm hover:bg-primary/5 transition-all"
                  >
                    <Gift className="w-4 h-4" />
                    {t('Send as Gift', 'أرسل كهدية')}
                  </button>
                )}
              </div>

              {/* Gifting Section */}
              {showGifting && (
                <div className="mt-4 bg-card rounded-2xl border border-border shadow-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" />
                      {t('Gift This Experience', 'أهدِ هذه التجربة')}
                    </h3>
                    <button onClick={() => setShowGifting(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {sentGift ? (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <QrCode className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="font-bold text-foreground mb-1">{t('Gift Sent!', 'تم إرسال الهدية!')}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{t('The recipient will receive an email with their gift code.', 'سيتلقى المستلم بريداً إلكترونياً برمز هديته.')}</p>
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-3">
                        <p className="text-xs text-muted-foreground mb-1">{t('Gift Code', 'رمز الهدية')}</p>
                        <p className="text-lg font-black font-mono text-primary tracking-widest">{sentGift.redeemCode}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('Recipient can redeem at: ', 'يمكن للمستلم الاسترداد في: ')}
                        <Link href={`/gift-redeem/${sentGift.redeemCode}`} className="text-primary hover:underline font-semibold">{t('Redeem Gift', 'استرداد الهدية')}</Link>
                      </p>
                    </div>
                  ) : (
                    <>
                      {!user && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                          {t('Please sign in to send a gift.', 'يرجى تسجيل الدخول لإرسال هدية.')}{' '}
                          <Link href="/signin" className="font-semibold underline">{t('Sign in', 'دخول')}</Link>
                        </div>
                      )}

                      {/* Card design selector */}
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">{t('Card Design', 'تصميم البطاقة')}</label>
                        <div className="grid grid-cols-5 gap-2">
                          {GIFT_CARD_DESIGNS.map(design => (
                            <button
                              key={design.id}
                              onClick={() => setGiftDesign(design.id)}
                              className={cn(
                                'rounded-xl p-1.5 text-center transition-all border-2',
                                giftDesign === design.id ? 'border-primary' : 'border-transparent'
                              )}
                            >
                              <div className={cn('w-full aspect-square rounded-lg bg-gradient-to-br flex items-center justify-center text-base mb-1', design.gradient)}>
                                {design.emoji}
                              </div>
                              <p className="text-[9px] font-medium text-foreground leading-tight">{lang === 'ar' ? design.labelAr : design.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                        placeholder={t("Recipient's name *", 'اسم المستلم *')}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        value={recipientEmail}
                        onChange={e => setRecipientEmail(e.target.value)}
                        type="email"
                        placeholder={t("Recipient's email *", 'بريد المستلم *')}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <textarea
                        value={giftMessage}
                        onChange={e => setGiftMessage(e.target.value)}
                        placeholder={t('Personal message (optional)…', 'رسالة شخصية (اختياري)…')}
                        className="w-full min-h-[70px] px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />

                      {giftError && (
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />{giftError}
                        </p>
                      )}

                      <Button
                        className="w-full"
                        disabled={!recipientName || !recipientEmail || createGift.isPending || !user}
                        onClick={handleGiftSubmit}
                      >
                        {createGift.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin me-2" />{t('Sending…', 'جاري الإرسال…')}</>
                        ) : t('Send Gift', 'إرسال الهدية')}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
