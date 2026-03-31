import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StarRating } from '@/components/StarRating';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import {
  useGetRestaurant,
  useGetRestaurantMenus,
  useFollowRestaurant,
  useUnfollowRestaurant,
  useDeleteReview,
  useGetRestaurantAvailability,
  useCreateBooking,
  useListOccasions,
  useListRestaurants,
  getGetRestaurantQueryKey,
} from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { InlineReviewComposer } from '@/components/InlineReviewComposer';
import { ReviewCard } from '@/components/ReviewCard';
import { MenuTab } from '@/components/MenuTab';
import { StoriesTab } from '@/components/StoriesTab';
import { RestaurantCard } from '@/components/RestaurantCard';
import {
  Star, MapPin, Phone, Globe, Clock, CheckCircle2, Heart, HeartOff,
  Utensils, Info, Camera, MessageSquare, CalendarDays, Users,
  ChevronLeft, ChevronRight, Tag, BookImage,
  X, ParkingSquare, Trees, DoorOpen, BadgeCheck, Wifi, CreditCard,
  Bookmark, BookmarkCheck, Share2, ArrowLeft, Navigation,
  Package, TrendingUp, Bike, ChefHat, Crown, Flame, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api';
import { ShareModal } from '@/components/ShareModal';

// ── Day labels ──────────────────────────────────────────────────────
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

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
        className="absolute end-4 z-10 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="max-w-5xl max-h-[85vh] px-16" onClick={e => e.stopPropagation()}>
        <img src={photos[current].url} alt={photos[current].alt} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{current + 1} / {photos.length}</div>
    </div>
  );
}

// ── Chef Data ────────────────────────────────────────────────────────
const CHEF_DATA: Record<number, {
  photo: string;
  nameEn: string; nameAr: string;
  titleEn: string; titleAr: string;
  specialtyEn: string; specialtyAr: string;
  bioEn: string; bioAr: string;
  yearsExp: number;
  awardsCount: number;
  michelinStars?: number;
}> = {
  1: {
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&h=200&fit=crop&face',
    nameEn: 'Chef Abdullah Al-Ghamdi',
    nameAr: 'الشيف عبدالله الغامدي',
    titleEn: 'Executive Chef',
    titleAr: 'الشيف التنفيذي',
    specialtyEn: 'Traditional Najdi Cuisine',
    specialtyAr: 'المطبخ النجدي التقليدي',
    bioEn: 'A fourth-generation chef from Najd, Chef Abdullah has spent 18 years perfecting slow-cooked Saudi classics — from harees to kabsa. He trained under legendary chef Mohammed Al-Harbi and now leads one of the Kingdom\'s most beloved kitchens.',
    bioAr: 'شيف من الجيل الرابع في نجد، أمضى عبدالله ١٨ عاماً في إتقان الأطباق السعودية التقليدية كالهريس والكبسة. تتلمذ على يد الشيف الأسطوري محمد الحربي، ويقود الآن أحد أحب مطابخ المملكة.',
    yearsExp: 18,
    awardsCount: 5,
  },
  2: {
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&face',
    nameEn: 'Chef Nora Al-Rasheed',
    nameAr: 'الشيف نورة الرشيد',
    titleEn: 'Head Chef & Co-Founder',
    titleAr: 'شيف رئيسية ومؤسسة مشاركة',
    specialtyEn: 'Modern Armenian–Levantine Fusion',
    specialtyAr: 'فيوجن أرمني شامي معاصر',
    bioEn: 'Born in Beirut and trained in Lyon, Chef Nora brings the warmth of the Levant to Riyadh\'s fine dining scene. Her rose-water-infused signature dishes and open-fire lamb preparations have earned her a cult following across the Kingdom.',
    bioAr: 'وُلدت في بيروت وتدربت في ليون، تجلب الشيف نورة دفء بلاد الشام إلى مشهد الطعام الراقي في الرياض. أطباقها المميزة بماء الورد وطهو اللحم على النار المكشوفة جعلتها نجمة في المملكة.',
    yearsExp: 14,
    awardsCount: 8,
    michelinStars: 1,
  },
  3: {
    photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&h=200&fit=crop',
    nameEn: 'Chef Kenji Watanabe',
    nameAr: 'الشيف كينجي واتانابي',
    titleEn: 'Head Sushi Master',
    titleAr: 'أستاذ السوشي الرئيسي',
    specialtyEn: 'Omakase & Nigiri',
    specialtyAr: 'أوماكاسي ونيغيري',
    bioEn: 'A Tokyo native with 20 years of Tsukiji fish market expertise, Chef Kenji trained under Jiro Ono\'s protégés and has mastered the art of Omakase dining. Every plate is a meditation on precision, freshness, and restraint.',
    bioAr: 'مواطن طوكيوي بـ٢٠ عاماً من خبرة سوق سمك تسوكيجي، تتلمذ الشيف كينجي على يد تلاميذ جيرو أونو. كل طبق يعكس تأمله في الدقة والطزاجة والبساطة.',
    yearsExp: 20,
    awardsCount: 6,
  },
  4: {
    photo: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=200&h=200&fit=crop',
    nameEn: 'Chef Marcus Sinclair',
    nameAr: 'الشيف ماركوس سينكلير',
    titleEn: 'Culinary Director',
    titleAr: 'المدير الطهوي',
    specialtyEn: 'Nobu-Style Fusion',
    specialtyAr: 'فيوجن على طراز نوبو',
    bioEn: 'Trained at the original Nobu NYC under Chef Nobu Matsuhisa himself, Marcus brings the legendary Peruvian-Japanese fusion to Riyadh. A Michelin 2-star veteran, he has helmed kitchens in Tokyo, London, and Dubai.',
    bioAr: 'تدرب في نوبو نيويورك الأصلي تحت إشراف الشيف نوبو ماتسوهيسا شخصياً، يجلب ماركوس الفيوجن البيروفي الياباني الأسطوري إلى الرياض. محترف بنجمتين ميشلان، أدار مطابخ في طوكيو ولندن ودبي.',
    yearsExp: 22,
    awardsCount: 12,
    michelinStars: 2,
  },
  5: {
    photo: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=200&h=200&fit=crop',
    nameEn: 'Chef Andrei Constantin',
    nameAr: 'الشيف أندريه كونستانتين',
    titleEn: 'Executive Chef',
    titleAr: 'الشيف التنفيذي',
    specialtyEn: 'Modern European & Global Fusion',
    specialtyAr: 'أوروبي حديث وفيوجن عالمي',
    bioEn: 'Romanian-born Chef Andrei learned his craft across Michelin kitchens in Paris and Copenhagen before settling in the Gulf. His philosophy: honor local ingredients, surprise with global technique.',
    bioAr: 'الشيف أندريه الروماني الأصل تعلم حرفته في مطابخ ميشلان بباريس وكوبنهاغن قبل الاستقرار في الخليج. فلسفته: تكريم المكونات المحلية والمفاجأة بالتقنيات العالمية.',
    yearsExp: 16,
    awardsCount: 7,
    michelinStars: 1,
  },
};

// ── Booking Section ─────────────────────────────────────────────────
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

const CROWD_DATA = [0,0,0,0,0,0,20,35,55,70,75,65,80,70,55,45,50,65,85,90,80,65,45,20];

function getSlotCrowdLevel(restaurantId: number, timeStr: string): 'quiet' | 'moderate' | 'busy' {
  const hour = parseInt(timeStr.split(':')[0] ?? '12', 10);
  const hash = ((restaurantId * 1103515245 + 12345) >>> 0) % 15;
  const val = Math.min(100, (CROWD_DATA[hour] ?? 0) + hash - 7);
  if (val < 40) return 'quiet';
  if (val < 70) return 'moderate';
  return 'busy';
}

function SlotCrowdBadge({ level, t }: { level: 'quiet' | 'moderate' | 'busy'; t: (en: string, ar: string) => string }) {
  if (level === 'quiet') return <span className="text-[9px] font-bold text-emerald-600">● {t('Quiet', 'هادئ')}</span>;
  if (level === 'moderate') return <span className="text-[9px] font-bold text-amber-500">● {t('Moderate', 'متوسط')}</span>;
  return <span className="text-[9px] font-bold text-red-500">● {t('Busy', 'مزدحم')}</span>;
}

type PreOrderItem = { id: number; nameEn: string; nameAr: string; price: number; currency: string; qty: number };

function BookingSection({ restaurantId, restaurantNameEn, restaurantNameAr, compact, menuData }: {
  restaurantId: number; restaurantNameEn: string; restaurantNameAr: string; compact?: boolean;
  menuData?: { sections?: { items?: { id: number; nameEn?: string | null; nameAr?: string | null; price?: string | null; currency?: string | null; imageUrl?: string | null }[] }[] }[];
}) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const restaurantName = lang === 'ar' ? restaurantNameAr : restaurantNameEn;

  const dates = useMemo(() => getDatesAhead(14), []);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [tableType, setTableType] = useState<string | undefined>();
  const [occasionId, setOccasionId] = useState<number | undefined>();
  const [specialRequests, setSpecialRequests] = useState('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [createdBooking, setCreatedBooking] = useState<{ referenceCode: string; date: string; time: string } | null>(null);
  const [error, setError] = useState('');
  const [waitlistSlot, setWaitlistSlot] = useState<string | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [showPreOrder, setShowPreOrder] = useState(false);
  const [preOrderItems, setPreOrderItems] = useState<PreOrderItem[]>([]);

  const popularDishes = useMemo(() => {
    if (!menuData) return [];
    return menuData
      .flatMap(m => m.sections ?? [])
      .flatMap(s => s.items ?? [])
      .slice(0, 6);
  }, [menuData]);

  const updatePreOrder = (dish: { id: number; nameEn?: string | null; nameAr?: string | null; price?: string | null; currency?: string | null }, delta: number) => {
    setPreOrderItems(prev => {
      const existing = prev.find(i => i.id === dish.id);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter(i => i.id !== dish.id);
        return prev.map(i => i.id === dish.id ? { ...i, qty: newQty } : i);
      }
      if (delta <= 0) return prev;
      return [...prev, { id: dish.id, nameEn: dish.nameEn ?? '', nameAr: dish.nameAr ?? '', price: Number(dish.price ?? 0), currency: dish.currency ?? 'SAR', qty: 1 }];
    });
  };
  const preOrderTotal = preOrderItems.reduce((s, i) => s + i.price * i.qty, 0);

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
      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">{t('Sign in to book a table', 'سجّل دخولك لحجز طاولة')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('Create a free account to reserve instantly.', 'أنشئ حساباً مجانياً للحجز الفوري.')}</p>
        <Link href="/signin"><Button size="sm" className="w-full">{t('Sign In', 'تسجيل الدخول')}</Button></Link>
      </div>
    );
  }

  if (step === 'success' && createdBooking) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{t("You're all set!", 'أنت مستعد!')}</h3>
        <p className="text-sm text-gray-500 mb-5">{t('Table reserved at', 'تم الحجز في')} {restaurantName}</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm space-y-2 text-start">
          <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /><span>{createdBooking.date}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><span>{createdBooking.time}</span></div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span>{partySize} {t('guests', 'أشخاص')}</span></div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">{t('Reference', 'رقم الحجز')}</p>
          <p className="text-xl font-black font-mono text-primary tracking-widest">{createdBooking.referenceCode}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/bookings" className="flex-1"><Button variant="outline" className="w-full" size="sm">{t('My Bookings', 'حجوزاتي')}</Button></Link>
          <Button className="flex-1" size="sm" onClick={() => { setStep('select'); setSelectedTime(''); setCreatedBooking(null); }}>{t('Book Again', 'حجز آخر')}</Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">{t('Confirm Reservation', 'تأكيد الحجز')}</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm space-y-2">
          {[
            { label: t('Date', 'التاريخ'), value: dateKey },
            { label: t('Time', 'الوقت'), value: selectedTime },
            { label: t('Guests', 'الأشخاص'), value: String(partySize) },
            ...(tableType ? [{ label: t('Table', 'الطاولة'), value: { indoor: lang === 'ar' ? 'داخلي' : 'Indoor', window: lang === 'ar' ? 'طاولة نافذة' : 'Window Seat', outdoor: lang === 'ar' ? 'في الهواء الطلق' : 'Outdoor', vip: 'VIP Room' }[tableType] ?? tableType }] : []),
            ...(occasionId ? [{ label: t('Occasion', 'المناسبة'), value: lang === 'ar' ? occasions.find(o => o.id === occasionId)?.nameAr ?? '' : occasions.find(o => o.id === occasionId)?.nameEn ?? '' }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>

        {preOrderItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5" /> {t('Pre-ordered Food', 'طعام مطلوب مسبقاً')}
            </p>
            {preOrderItems.map(item => (
              <div key={item.id} className="flex justify-between text-xs text-amber-900 mb-1">
                <span>{lang === 'ar' ? item.nameAr : item.nameEn} × {item.qty}</span>
                <span className="font-bold">{(item.price * item.qty).toLocaleString()} {item.currency}</span>
              </div>
            ))}
            <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between text-xs font-black text-amber-900">
              <span>{t('Pre-order Total', 'إجمالي الطلب المسبق')}</span>
              <span>{preOrderTotal.toLocaleString()} SAR</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="sm" onClick={() => setStep('select')}>
            <ChevronLeft className="w-4 h-4 me-1" /> {t('Back', 'رجوع')}
          </Button>
          <Button className="flex-1" size="sm" onClick={handleBook} disabled={createBooking.isPending}>
            {createBooking.isPending ? t('Booking...', 'جاري...') : t('Confirm', 'تأكيد')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Party Size */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('Party Size', 'عدد الأشخاص')}</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setPartySize(p => Math.max(1, p - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary text-gray-700 transition-colors text-lg font-light">−</button>
          <span className="text-lg font-bold text-gray-900 w-8 text-center">{partySize}</span>
          <button onClick={() => setPartySize(p => Math.min(20, p + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary text-gray-700 transition-colors text-lg font-light">+</button>
          <span className="text-sm text-gray-500">{t('guests', 'أشخاص')}</span>
        </div>
      </div>

      {/* Table Type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('Table Preference', 'تفضيل الطاولة')}</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'indoor', icon: '🪑', labelEn: 'Indoor', labelAr: 'داخلي' },
            { id: 'window', icon: '🪟', labelEn: 'Window Seat', labelAr: 'طاولة نافذة' },
            { id: 'outdoor', icon: '🌿', labelEn: 'Outdoor', labelAr: 'في الهواء الطلق' },
            { id: 'vip', icon: '⭐', labelEn: 'VIP Room', labelAr: 'غرفة VIP' },
          ] as const).map(type => (
            <button
              key={type.id}
              onClick={() => setTableType(tableType === type.id ? undefined : type.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${tableType === type.id ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:border-primary/50 bg-white'}`}
            >
              <span className="text-base leading-none">{type.icon}</span>
              <span>{lang === 'ar' ? type.labelAr : type.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Strip */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('Date', 'التاريخ')}</label>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {dates.slice(0, 7).map((date, i) => (
            <button
              key={i}
              onClick={() => { setSelectedDateIdx(i); setSelectedTime(''); }}
              className={`flex flex-col items-center shrink-0 w-14 py-2 rounded-lg border text-xs font-medium transition-colors ${selectedDateIdx === i ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white'}`}
            >
              <span className="text-[10px] uppercase">{date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' })}</span>
              <span className="text-base font-bold leading-tight">{date.getDate()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('Available Times', 'الأوقات المتاحة')}</label>
        {availLoading ? (
          <div className="flex gap-2 flex-wrap">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 w-20 bg-gray-100 animate-pulse rounded-lg" />)}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-sm text-gray-400 py-2">{t('No slots available for this date.', 'لا توجد مواعيد متاحة.')}</div>
        ) : (
          <>
            {/* Suggested Quiet Times */}
            {(() => {
              const quietSlots = slots
                .filter((s: any) => s.available)
                .map((s: any) => ({ ...s, crowdLevel: getSlotCrowdLevel(restaurantId, s.time) }))
                .filter((s: any) => s.crowdLevel === 'quiet')
                .slice(0, 3);
              if (quietSlots.length === 0) return null;
              return (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <span>✨</span> {t('AI-Suggested Quiet Times', 'أوقات هادئة مقترحة')}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {quietSlots.map((s: any) => (
                      <button
                        key={s.time}
                        onClick={() => setSelectedTime(s.time)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${selectedTime === s.time ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-100'}`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* All slots with crowd badge */}
            <div className="flex flex-wrap gap-2">
              {slots.map((slot: any) => {
                const crowd = getSlotCrowdLevel(restaurantId, slot.time);
                if (!slot.available) {
                  return (
                    <div key={slot.time} className="flex flex-col items-center">
                      <button
                        disabled
                        className="px-3 py-2 rounded-lg border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through text-sm font-medium"
                      >
                        {slot.time}
                      </button>
                      <button
                        onClick={() => { setWaitlistSlot(slot.time); setWaitlistJoined(false); }}
                        className="mt-0.5 text-[9px] text-primary font-semibold hover:underline"
                      >
                        + {t('Waitlist', 'قائمة الانتظار')}
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedTime === slot.time ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-700 hover:border-primary hover:text-primary bg-white'}`}
                  >
                    <span>{slot.time}</span>
                    <SlotCrowdBadge level={crowd} t={t} />
                  </button>
                );
              })}
            </div>

            {/* Waitlist confirmation */}
            {waitlistSlot && !waitlistJoined && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-2">
                  {t(`Join waitlist for ${waitlistSlot}?`, `الانضمام لقائمة الانتظار في ${waitlistSlot}؟`)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setWaitlistJoined(true); }}
                    className="flex-1 text-xs font-bold bg-amber-600 text-white py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    {t('Join Waitlist', 'انضم لقائمة الانتظار')}
                  </button>
                  <button onClick={() => setWaitlistSlot(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2">
                    {t('Cancel', 'إلغاء')}
                  </button>
                </div>
              </div>
            )}
            {waitlistJoined && waitlistSlot && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs font-semibold text-green-800">
                  {t(`You're on the waitlist for ${waitlistSlot}. We'll notify you if a spot opens.`, `أنت في قائمة الانتظار للساعة ${waitlistSlot}. سنُعلمك إذا توفر مكان.`)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Occasion */}
      {occasions.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('Occasion (optional)', 'المناسبة (اختياري)')}</label>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {occasions.map((occ: any) => (
              <button
                key={occ.id}
                onClick={() => setOccasionId(occasionId === occ.id ? undefined : occ.id)}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg border text-sm transition-colors ${occasionId === occ.id ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white'}`}
              >
                <span>{occ.icon}</span>
                <span>{lang === 'ar' ? occ.nameAr : occ.nameEn}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Special Requests */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('Special Requests', 'طلبات خاصة')}</label>
        <textarea
          value={specialRequests}
          onChange={e => setSpecialRequests(e.target.value)}
          placeholder={t('Any dietary needs or special requests...', 'متطلبات غذائية أو طلبات خاصة...')}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-400"
          rows={2}
        />
      </div>

      {/* Pre-order Food */}
      {popularDishes.length > 0 && (
        <div>
          <button
            onClick={() => setShowPreOrder(!showPreOrder)}
            className="w-full flex items-center justify-between text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Utensils className="w-4 h-4" />
              {t('Pre-order food', 'طلب مسبق للطعام')}
              {preOrderItems.length > 0 && (
                <span className="bg-primary text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
                  {preOrderItems.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </span>
            <span className="text-xs text-gray-400">{t('optional', 'اختياري')} {showPreOrder ? '▲' : '▼'}</span>
          </button>

          {showPreOrder && (
            <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-amber-50 border-b border-amber-100 px-3 py-2">
                <p className="text-[10px] text-amber-800 font-semibold">{t('Select dishes to be ready when you arrive', 'اختر أطباق تكون جاهزة عند وصولك')}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {popularDishes.map(dish => {
                  const qty = preOrderItems.find(i => i.id === dish.id)?.qty ?? 0;
                  const name = (lang === 'ar' ? dish.nameAr : dish.nameEn) ?? '';
                  return (
                    <div key={dish.id} className="flex items-center gap-3 px-3 py-2.5">
                      {dish.imageUrl && <img src={dish.imageUrl} alt={name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 line-clamp-1">{name}</p>
                        <p className="text-xs text-primary font-bold">{Number(dish.price ?? 0).toLocaleString()} {dish.currency ?? 'SAR'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updatePreOrder(dish, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary text-sm">−</button>
                        <span className="text-sm font-bold text-gray-900 w-4 text-center">{qty}</span>
                        <button onClick={() => updatePreOrder(dish, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary text-sm">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {preOrderItems.length > 0 && (
                <div className="bg-primary/5 border-t border-primary/10 px-3 py-2 flex justify-between items-center">
                  <span className="text-xs text-gray-600">{preOrderItems.reduce((s, i) => s + i.qty, 0)} {t('items pre-ordered', 'عناصر مطلوبة مسبقاً')}</span>
                  <span className="text-sm font-black text-primary">{preOrderTotal.toLocaleString()} SAR</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button className="w-full font-bold" onClick={handleConfirm} disabled={!selectedTime}>
        {t('Continue', 'متابعة')} →
      </Button>
    </div>
  );
}

// ── Main RestaurantDetailPage ───────────────────────────────────────
type Tab = 'overview' | 'menu' | 'book' | 'reviews' | 'photos' | 'info';

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const idIsValid = !isNaN(numericId) && numericId > 0;
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followType, setFollowType] = useState<string>('all');
  const [showFollowMenu, setShowFollowMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<{ url: string; alt: string }[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetRestaurant(numericId, {
    query: { enabled: idIsValid, queryKey: getGetRestaurantQueryKey(numericId) },
  });
  const { data: menuData } = useGetRestaurantMenus(numericId, {
    query: { enabled: idIsValid, queryKey: ['restaurant-menus', numericId] },
  });
  const followRestaurant = useFollowRestaurant();
  const unfollowRestaurant = useUnfollowRestaurant();
  const deleteReview = useDeleteReview();
  const { data: nearbyData } = useListRestaurants(
    { limit: 4 },
    { query: { enabled: idIsValid, staleTime: 5 * 60 * 1000, queryKey: ['nearby', numericId] } }
  );
  const nearbyRestaurants = (nearbyData?.restaurants ?? []).filter((r: any) => r.id !== numericId).slice(0, 3);

  // Save state on load
  useEffect(() => {
    if (!user || !idIsValid) return;
    fetch(`/api/me/saved-restaurants/${numericId}`, { headers: getAuthHeaders() })
      .then(r => r.json()).then(d => setIsSaved(!!d.saved)).catch(() => {});
  }, [numericId, user, idIsValid]);

  // Follow state on load
  useEffect(() => {
    if (!data?.restaurant) return;
    setIsFollowing(!!(data.restaurant as any).isFollowing);
  }, [data?.restaurant]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        setHeaderVisible(window.scrollY > heroRef.current.offsetHeight - 80);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const doFollow = async (type: string) => {
    if (!user) return;
    setFollowType(type);
    setShowFollowMenu(false);
    setIsFollowing(true);
    followRestaurant.mutate({ restaurantId: numericId, body: { followType: type } } as any);
  };

  const doUnfollow = async () => {
    if (!user) return;
    setShowFollowMenu(false);
    setIsFollowing(false);
    unfollowRestaurant.mutate({ restaurantId: numericId });
  };

  const updateFollowType = async (type: string) => {
    if (!user) return;
    setFollowType(type);
    setShowFollowMenu(false);
    const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
    await fetch(`${apiBase}/api/restaurants/${numericId}/follow`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ followType: type }),
    });
  };

  const FOLLOW_TYPES = [
    { id: 'all',       labelEn: 'All Updates',      labelAr: 'جميع التحديثات',   icon: '🔔' },
    { id: 'offers',    labelEn: 'Offers Only',       labelAr: 'العروض فقط',       icon: '🏷️' },
    { id: 'events',    labelEn: 'Events Only',       labelAr: 'الفعاليات فقط',    icon: '🎉' },
    { id: 'new_dishes',labelEn: 'New Dishes Only',   labelAr: 'الأطباق الجديدة',  icon: '🍽️' },
    { id: 'openings',  labelEn: 'New Openings',      labelAr: 'الافتتاحات الجديدة',icon: '🆕' },
  ];

  const toggleSave = async () => {
    if (!user) return;
    const method = isSaved ? 'DELETE' : 'POST';
    const res = await fetch(`/api/me/saved-restaurants/${numericId}`, { method, headers: getAuthHeaders() });
    if (res.ok) {
      setIsSaved(!isSaved);
      queryClient.invalidateQueries({ queryKey: ['saved-restaurants'] });
    }
  };

  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const restaurantNameEn = (data?.restaurant as any)?.nameEn ?? 'Restaurant';
  const restaurantNameAr = (data?.restaurant as any)?.nameAr ?? 'مطعم';
  const restaurantDescEn = (data?.restaurant as any)?.descriptionEn ?? '';
  const restaurantDescAr = (data?.restaurant as any)?.descriptionAr ?? '';
  usePageMeta({
    titleEn: data?.restaurant ? `${restaurantNameEn} | Tabaq` : 'Restaurant | Tabaq',
    titleAr: data?.restaurant ? `${restaurantNameAr} | طبق` : 'مطعم | طبق',
    descriptionEn: restaurantDescEn || `Discover ${restaurantNameEn} on Tabaq — book a table, view the menu, and read reviews.`,
    descriptionAr: restaurantDescAr || `اكتشف ${restaurantNameAr} على طبق — احجز طاولة، اطّلع على القائمة، واقرأ التقييمات.`,
  }, lang);

  if (!idIsValid) {
    return <div className="p-20 text-center text-xl">{t('Restaurant not found', 'المطعم غير موجود')}</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-[50vh] bg-gray-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-gray-100 animate-pulse rounded w-64" />
          <div className="h-4 bg-gray-100 animate-pulse rounded w-48" />
          <div className="h-4 bg-gray-100 animate-pulse rounded w-96" />
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

  const priceTierLabel = ({
    budget: t('Budget · SAR 30–80', 'اقتصادي · ٣٠–٨٠ ريال'),
    mid: t('Mid-Range · SAR 80–180', 'متوسط · ٨٠–١٨٠ ريال'),
    upscale: t('Upscale · SAR 180–350', 'راقٍ · ١٨٠–٣٥٠ ريال'),
    fine_dining: t('Fine Dining · SAR 350+', 'فاخر · ٣٥٠+ ريال'),
  } as Record<string, string>)[restaurant.priceTier as string] ?? restaurant.priceTier;

  // Gallery photos
  const GALLERY_SEEDS = [
    '1414235077428-338989a2e8c0','1555396273-367ea4eb4db5','1517248135467-4c7edcad34c4',
    '1504674900247-0877df9cc836','1579871494447-9811cf80d66c','1556742049-0cfed4f6a45d',
    '1546069901-ba9599a7e63c','1551218808-94e220e084d2',
  ];
  const dishPhotos = menuData
    ? menuData.flatMap(m => m.sections).flatMap(s => (s.items || []) as any[])
        .filter((d: any) => d.imageUrl).map((d: any) => ({ url: d.imageUrl, alt: lang === 'ar' ? d.nameAr : d.nameEn }))
    : [];
  const curatedPhotos = GALLERY_SEEDS.map((id, i) => ({
    url: `https://images.unsplash.com/photo-${id}?w=800&h=600&fit=crop`,
    alt: `Photo ${i + 1}`,
  }));
  const allGalleryPhotos = [
    ...(restaurant.coverImageUrl ? [{ url: restaurant.coverImageUrl, alt: name }] : []),
    ...dishPhotos,
    ...curatedPhotos,
  ];

  const openLightbox = (photos: { url: string; alt: string }[], index: number) => {
    setLightboxPhotos(photos); setLightboxIndex(index);
  };

  const todayHours = openingHours.find(h => h.dayOfWeek === today);
  const isOpenNow = todayHours && !todayHours.isClosed;

  const amenities = [
    restaurant.hasParking && { icon: ParkingSquare, en: 'Parking', ar: 'مواقف سيارات' },
    restaurant.hasOutdoorSeating && { icon: Trees, en: 'Outdoor Seating', ar: 'جلسات خارجية' },
    restaurant.hasPrivateRoom && { icon: DoorOpen, en: 'Private Room', ar: 'غرفة خاصة' },
    restaurant.isHalal && { icon: BadgeCheck, en: 'Halal Certified', ar: 'شهادة حلال' },
    true && { icon: Wifi, en: 'Free Wi-Fi', ar: 'واي فاي مجاني' },
    true && { icon: CreditCard, en: 'Card Accepted', ar: 'يقبل البطاقات' },
  ].filter(Boolean) as { icon: React.ElementType; en: string; ar: string }[];

  const tabs: { id: Tab; label: string; labelAr: string }[] = [
    { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
    { id: 'menu', label: 'Menu', labelAr: 'المنيو' },
    { id: 'photos', label: `Photos (${allGalleryPhotos.length})`, labelAr: `الصور (${allGalleryPhotos.length})` },
    { id: 'reviews', label: `Reviews (${restaurant.reviewCount || 0})`, labelAr: `التقييمات (${restaurant.reviewCount || 0})` },
    { id: 'info', label: 'Info', labelAr: 'معلومات' },
  ];

  // Map URL from address
  const mapAddress = encodeURIComponent(restaurant.address || (name + ', Saudi Arabia'));
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${mapAddress}&output=embed&z=15`;
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${mapAddress}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Lightbox */}
      {lightboxPhotos && (
        <Lightbox photos={lightboxPhotos} index={lightboxIndex} onClose={() => setLightboxPhotos(null)} />
      )}

      {/* ── STICKY SCROLL HEADER ── */}
      <div className={`fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/restaurants" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
            {ratingBreakdown && ratingBreakdown.count > 0 && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {ratingBreakdown.overall.toFixed(1)} · {ratingBreakdown.count} {t('reviews', 'تقييم')}
              </p>
            )}
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setActiveTab('book')}>
            {t('Book Table', 'احجز')}
          </Button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div ref={heroRef} className="relative bg-gray-900">
        {/* Back button */}
        <Link href="/restaurants" className="absolute top-4 start-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full hover:bg-black/60 transition-colors">
          <ChevronLeft className="w-4 h-4" /> {t('Back', 'رجوع')}
        </Link>

        {/* Cover image */}
        <div className="relative h-[52vh] overflow-hidden">
          <img
            src={restaurant.coverImageUrl || fallback}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Photo grid button — bottom right */}
          {allGalleryPhotos.length > 1 && (
            <button
              onClick={() => setActiveTab('photos')}
              className="absolute bottom-4 end-4 z-10 hidden md:flex items-center gap-2 bg-white/90 hover:bg-white text-gray-900 text-sm font-medium px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              <Camera className="w-4 h-4" />
              {t('See all photos', 'مشاهدة الصور')} ({allGalleryPhotos.length})
            </button>
          )}

          {/* Thumbnail strip — bottom right desktop */}
          <div className="absolute bottom-4 end-4 z-10 hidden md:flex items-end gap-1.5 pe-0" style={{ display: 'none' }}>
            {allGalleryPhotos.slice(1, 4).map((photo, i) => (
              <button key={i} onClick={() => openLightbox(allGalleryPhotos, i + 1)}
                className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white/50 hover:border-white shadow-lg group">
                <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Hero Info overlay */}
        <div className="absolute bottom-0 start-0 end-0 px-4 sm:px-6 pb-6 pt-8">
          <div className="max-w-6xl mx-auto">
            {/* Category + Open badge row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {categories.slice(0, 2).map(cat => (
                <span key={cat.id} className="text-xs font-medium bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/30">
                  {lang === 'ar' ? cat.nameAr : cat.nameEn}
                </span>
              ))}
              {restaurant.isHalal && (
                <span className="text-xs font-medium bg-green-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> {t('Halal', 'حلال')}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
              {name}
              {restaurant.isVerified && <CheckCircle2 className="inline w-6 h-6 text-primary ms-2 shrink-0" />}
            </h1>

            {/* Rating + Info row */}
            <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
              {ratingBreakdown && ratingBreakdown.count > 0 ? (
                <div className="flex items-center gap-1.5 bg-amber-500 text-white px-2.5 py-1 rounded-md font-bold">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  {ratingBreakdown.overall.toFixed(1)}
                </div>
              ) : null}
              <span className="text-white/70">{restaurant.reviewCount || 0} {t('reviews', 'تقييم')}</span>
              {restaurant.address && (
                <span className="flex items-center gap-1 text-white/80">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {restaurant.address}
                </span>
              )}
              <span className="text-white/70">{priceTierLabel.split('·')[0].trim()}</span>
            </div>

            {/* Open/Closed + hours */}
            {todayHours && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${isOpenNow ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {isOpenNow
                    ? t(`Open · Closes ${todayHours.closeTime}`, `مفتوح · يغلق ${todayHours.closeTime}`)
                    : t('Closed now', 'مغلق الآن')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS STRIP ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 overflow-x-auto hide-scrollbar">
          <Button className="shrink-0 font-bold px-6" onClick={() => setActiveTab('book')}>
            <CalendarDays className="w-4 h-4 me-2" />
            {t('Book a Table', 'احجز طاولة')}
          </Button>
          {/* Follow button with preference picker */}
          <div className="relative shrink-0">
            <Button
              variant="outline"
              className={`border-gray-300 text-gray-700 hover:bg-gray-50 ${isFollowing ? 'border-primary text-primary bg-primary/5' : ''}`}
              onClick={() => user ? setShowFollowMenu(m => !m) : undefined}
            >
              {isFollowing
                ? <><Heart className="w-4 h-4 me-1.5 fill-primary text-primary" />{t('Following', 'متابَع')}</>
                : <><Heart className="w-4 h-4 me-1.5" />{t('Follow', 'متابعة')}</>
              }
            </Button>

            {showFollowMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowFollowMenu(false)} />
                <div className={`absolute z-40 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 w-52 ${lang === 'ar' ? 'right-0' : 'left-0'}`}>
                  {isFollowing ? (
                    <>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t('Notify me about', 'أُنبّهني عند')}
                      </p>
                      {FOLLOW_TYPES.map(ft => (
                        <button
                          key={ft.id}
                          onClick={() => updateFollowType(ft.id)}
                          className={`w-full text-start px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${followType === ft.id ? 'text-primary font-bold' : 'text-gray-700'}`}
                        >
                          <span>{ft.icon}</span>
                          {lang === 'ar' ? ft.labelAr : ft.labelEn}
                          {followType === ft.id && <span className="ms-auto text-primary">✓</span>}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={doUnfollow}
                          className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <HeartOff className="w-3.5 h-3.5" />
                          {t('Unfollow', 'إلغاء المتابعة')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t('Follow for', 'تابع من أجل')}
                      </p>
                      {FOLLOW_TYPES.map(ft => (
                        <button
                          key={ft.id}
                          onClick={() => doFollow(ft.id)}
                          className="w-full text-start px-4 py-2 text-sm flex items-center gap-2.5 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                        >
                          <span>{ft.icon}</span>
                          {lang === 'ar' ? ft.labelAr : ft.labelEn}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          {user && (
            <Button variant="outline" onClick={toggleSave} className={`shrink-0 border-gray-300 text-gray-700 hover:bg-gray-50 ${isSaved ? 'text-primary border-primary bg-primary/5' : ''}`}>
              {isSaved ? <BookmarkCheck className="w-4 h-4 me-1.5 text-primary" /> : <Bookmark className="w-4 h-4 me-1.5" />}
              {isSaved ? t('Saved', 'محفوظ') : t('Save', 'حفظ')}
            </Button>
          )}
          <Button variant="outline" className="shrink-0 border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleShare}>
            <Share2 className="w-4 h-4 me-1.5" />
            {t('Share', 'مشاركة')}
          </Button>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="shrink-0">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Phone className="w-4 h-4 me-1.5" />
                {restaurant.phone}
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div ref={tabBarRef} className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
              >
                {lang === 'ar' ? tab.labelAr : tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT CONTENT ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ─ Tab: Overview ─ */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Active Offers Banner */}
                {activeOffers.length > 0 && (
                  <div className="space-y-2">
                    {activeOffers.map(offer => (
                      <Link key={offer.id} href="/offers">
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-4 hover:bg-primary/10 transition-colors cursor-pointer">
                          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{lang === 'ar' ? offer.titleAr : offer.titleEn}</p>
                            {offer.discountPercent && (
                              <p className="text-primary text-xs font-medium">{offer.discountPercent}% {t('off — tap to claim', 'خصم — اضغط للمطالبة')}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* About */}
                {description && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3">{t('About', 'عن المطعم')}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {categories.map(cat => (
                        <Link key={cat.id} href={`/restaurants?categoryId=${cat.id}`}>
                          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                            {lang === 'ar' ? cat.nameAr : cat.nameEn}
                          </span>
                        </Link>
                      ))}
                      {occasions.map(occ => (
                        <span key={occ.id} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                          {occ.icon} {lang === 'ar' ? occ.nameAr : occ.nameEn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chef Profile */}
                {CHEF_DATA[Number(id)] && (() => {
                  const chef = CHEF_DATA[Number(id)];
                  return (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-primary" />
                        {t('Meet the Chef', 'تعرف على الشيف')}
                      </h2>
                      <div className="flex gap-4 items-start">
                        <img
                          src={chef.photo}
                          alt={lang === 'ar' ? chef.nameAr : chef.nameEn}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm">
                              {lang === 'ar' ? chef.nameAr : chef.nameEn}
                            </h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                              {lang === 'ar' ? chef.titleAr : chef.titleEn}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lang === 'ar' ? chef.specialtyAr : chef.specialtyEn}
                          </p>
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">
                            {lang === 'ar' ? chef.bioAr : chef.bioEn}
                          </p>
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                            <div className="text-center">
                              <div className="text-sm font-black text-foreground">{chef.yearsExp}+</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('Years Exp.', 'سنة خبرة')}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-black text-foreground">{chef.awardsCount}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('Awards', 'جوائز')}</div>
                            </div>
                            {chef.michelinStars && (
                              <div className="text-center">
                                <div className="text-sm font-black text-foreground flex items-center gap-0.5">
                                  {Array.from({ length: chef.michelinStars }).map((_, i) => (
                                    <Award key={i} className="w-3.5 h-3.5 text-amber-500" />
                                  ))}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('Michelin', 'ميشلان')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Chef's Highlights */}
                {menuData && (() => {
                  const allDishes = menuData.flatMap((m: any) => m.sections ?? []).flatMap((s: any) => (s.items ?? []) as any[]);
                  const badges = [
                    { key: 'isTabaqStar', labelEn: "Chef's Choice", labelAr: 'اختيار الشيف', icon: Crown, color: 'bg-amber-500 text-white' },
                    { key: 'isMostOrdered', labelEn: 'Bestseller', labelAr: 'الأكثر طلباً', icon: Flame, color: 'bg-primary text-white' },
                  ];
                  const featured = allDishes.filter((d: any) => d.isTabaqStar || d.isMostOrdered).slice(0, 3);
                  const fallback = allDishes.slice(0, 3);
                  const highlights = featured.length > 0 ? featured : fallback;
                  if (highlights.length === 0) return null;
                  return (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-primary" />
                        {t("Chef's Highlights", 'أبرز أطباق الشيف')}
                      </h2>
                      <div className="space-y-3">
                        {highlights.map((dish: any, idx: number) => {
                          const dishName = lang === 'ar' ? dish.nameAr : dish.nameEn;
                          const badge = badges.find(b => dish[b.key]) ?? (idx === 0 ? badges[0] : null);
                          const BadgeIcon = badge?.icon;
                          return (
                            <Link key={dish.id} href={`/dishes/${dish.id}`}>
                              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                                  {dish.imageUrl ? (
                                    <img src={dish.imageUrl} alt={dishName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                      <Utensils className="w-5 h-5 text-primary/40" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    {badge && BadgeIcon && (
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.color}`}>
                                        <BadgeIcon className="w-2.5 h-2.5" />
                                        {t(badge.labelEn, badge.labelAr)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{dishName}</p>
                                  {dish.price && (
                                    <p className="text-primary font-bold text-xs mt-0.5">
                                      {Number(dish.price).toLocaleString('en-SA', { style: 'currency', currency: dish.currency || 'SAR', minimumFractionDigits: 0 })}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <button onClick={() => setActiveTab('menu')} className="w-full mt-3 text-sm text-primary font-semibold hover:underline text-center">
                        {t('See full menu →', 'عرض القائمة كاملة →')}
                      </button>
                    </div>
                  );
                })()}

                {/* Dining Experience Tags */}
                {occasions.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-primary" />
                      {t('Perfect For', 'مثالي لـ')}
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                      {occasions.slice(0, 6).map((occ: any) => (
                        <div key={occ.id} className="flex items-center gap-2.5 bg-secondary/40 rounded-xl px-3 py-2.5">
                          <span className="text-lg leading-none">{occ.icon}</span>
                          <span className="text-xs font-semibold text-foreground">
                            {lang === 'ar' ? occ.nameAr : occ.nameEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crowd Indicator */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {t('Popular Times', 'أوقات الازدحام')}
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">{t('Based on historical visit data', 'بناءً على بيانات الزيارات التاريخية')}</p>
                  {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const crowdData = [0,0,0,0,0,0,20,35,55,70,75,65,80,70,55,45,50,65,85,90,80,65,45,20];
                    const labels = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];
                    const startHour = Math.max(0, currentHour - 2);
                    const displayHours = Array.from({ length: 8 }, (_, i) => (startHour + i) % 24);
                    const maxVal = Math.max(...displayHours.map(h => crowdData[h])) || 1;
                    const busyNow = crowdData[currentHour];
                    const busyLabel = busyNow < 30 ? t('Not busy', 'هادئ') : busyNow < 60 ? t('Moderately busy', 'متوسط الازدحام') : t('Usually busy', 'مزدحم');
                    const busyColor = busyNow < 30 ? 'text-emerald-600' : busyNow < 60 ? 'text-amber-600' : 'text-red-500';
                    return (
                      <>
                        <p className="text-sm font-semibold mb-3">
                          {t('Right now:', 'الآن:')} <span className={busyColor}>{busyLabel}</span>
                          {isOpenNow && <span className="text-gray-400 font-normal"> · {t('Closes', 'يغلق')} {todayHours?.closeTime}</span>}
                        </p>
                        <div className="flex items-end gap-1 h-14">
                          {displayHours.map(h => {
                            const val = crowdData[h];
                            const heightPct = maxVal > 0 ? Math.max(8, (val / maxVal) * 100) : 8;
                            const isCurrent = h === currentHour;
                            return (
                              <div key={h} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className={`w-full rounded-t-sm transition-all ${isCurrent ? 'bg-primary' : 'bg-gray-200'}`}
                                  style={{ height: `${heightPct}%` }}
                                />
                                <span className={`text-[9px] ${isCurrent ? 'text-primary font-bold' : 'text-gray-400'}`}>{labels[h]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Ordering Options */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    {t('Order Options', 'خيارات الطلب')}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('book')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-primary bg-primary/5 text-primary transition-colors"
                    >
                      <CalendarDays className="w-5 h-5" />
                      <div className="text-center">
                        <div className="font-semibold text-sm">{t('Dine In', 'تناول بالمطعم')}</div>
                        <div className="text-xs text-primary/70 mt-0.5">{t('Book a table', 'احجز طاولة')}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('menu')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-primary/40 hover:bg-primary/3 text-gray-600 hover:text-primary transition-colors"
                    >
                      <Package className="w-5 h-5" />
                      <div className="text-center">
                        <div className="font-semibold text-sm">{t('Pickup', 'استلام')}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{t('Order & collect', 'اطلب واستلم')}</div>
                      </div>
                    </button>
                  </div>
                  {restaurant.address && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{restaurant.address}</span>
                    </div>
                  )}
                </div>

                {/* Dining Info Strip */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{t('Quick Info', 'معلومات سريعة')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Cost', 'التكلفة')}</p>
                      <p className="font-semibold text-gray-900">{priceTierLabel}</p>
                    </div>
                    {todayHours && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Hours Today', 'ساعات اليوم')}</p>
                        <p className={`font-semibold ${isOpenNow ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isOpenNow ? `${todayHours.openTime} – ${todayHours.closeTime}` : t('Closed', 'مغلق')}
                        </p>
                      </div>
                    )}
                    {restaurant.followerCount !== undefined && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Followers', 'المتابعون')}</p>
                        <p className="font-semibold text-gray-900">{restaurant.followerCount}</p>
                      </div>
                    )}
                    {restaurant.phone && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Phone', 'الهاتف')}</p>
                        <a href={`tel:${restaurant.phone}`} className="font-semibold text-primary hover:underline">{restaurant.phone}</a>
                      </div>
                    )}
                    {restaurant.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Address', 'العنوان')}</p>
                        <p className="font-semibold text-gray-900">{restaurant.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                {amenities.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4">{t('Features & Amenities', 'المميزات والخدمات')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenities.map(f => (
                        <div key={f.en} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                            <f.icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">{lang === 'ar' ? f.ar : f.en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opening Hours */}
                {openingHours.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> {t('Opening Hours', 'ساعات العمل')}
                    </h2>
                    <div className="space-y-1">
                      {openingHours.map(h => (
                        <div key={h.id} className={`flex justify-between text-sm py-2 border-b border-gray-100 last:border-0 ${h.dayOfWeek === today ? 'font-bold text-primary' : 'text-gray-600'}`}>
                          <span>{lang === 'ar' ? DAYS_AR[h.dayOfWeek] : DAYS[h.dayOfWeek]}</span>
                          <span>{h.isClosed ? t('Closed', 'مغلق') : `${h.openTime} – ${h.closeTime}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Preview Strip */}
                {allGalleryPhotos.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-900">{t('Photos', 'الصور')}</h2>
                      <button onClick={() => setActiveTab('photos')} className="text-sm text-primary font-medium hover:underline">
                        {t('See all', 'مشاهدة الكل')} ({allGalleryPhotos.length})
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {allGalleryPhotos.slice(0, 4).map((photo, i) => (
                        <button key={i} onClick={() => { setActiveTab('photos'); openLightbox(allGalleryPhotos, i); }}
                          className="aspect-square rounded-lg overflow-hidden group relative">
                          <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          {i === 3 && allGalleryPhotos.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                              <Camera className="w-4 h-4 mb-1" />
                              <span className="text-xs font-bold">+{allGalleryPhotos.length - 4}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Places */}
                {nearbyRestaurants.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {t('Nearby Restaurants', 'مطاعم قريبة')}
                      </h2>
                      <Link href="/restaurants" className="text-sm text-primary font-medium hover:underline">
                        {t('See all', 'مشاهدة الكل')}
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {nearbyRestaurants.slice(0, 3).map((nr: any) => (
                        <Link key={nr.id} href={`/restaurants/${nr.id}`}>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                            <img
                              src={nr.coverImageUrl || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop'}
                              alt={lang === 'ar' ? nr.nameAr : nr.nameEn}
                              className="w-14 h-14 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors truncate">
                                {lang === 'ar' ? nr.nameAr : nr.nameEn}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {nr.rating && (
                                  <div className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {typeof nr.rating === 'number' ? nr.rating.toFixed(1) : nr.rating}
                                  </div>
                                )}
                                <span className="text-xs text-gray-400">· {t('~500m away', '~٥٠٠م قريب')}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─ Tab: Menu ─ */}
            {activeTab === 'menu' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 pb-0">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{t('Menu', 'القائمة')}</h2>
                </div>
                <div className="p-5 pt-0">
                  <MenuTab
                    menuData={menuData as any}
                    restaurantId={numericId}
                    restaurantNameEn={restaurantNameEn}
                    restaurantNameAr={restaurantNameAr}
                  />
                </div>
              </div>
            )}

            {/* ─ Tab: Photos ─ */}
            {activeTab === 'photos' && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">{t('Photos', 'الصور')} ({allGalleryPhotos.length})</h2>
                  <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                    <Camera className="w-4 h-4" /> {t('Add photo', 'إضافة صورة')}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allGalleryPhotos.slice(0, 1).map((photo, i) => (
                    <button key={i} onClick={() => openLightbox(allGalleryPhotos, 0)}
                      className="col-span-2 rounded-lg overflow-hidden aspect-video group cursor-pointer relative">
                      <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
                      <span className="absolute bottom-2 start-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-md font-medium">{t('Cover', 'الغلاف')}</span>
                    </button>
                  ))}
                  {allGalleryPhotos.slice(1).map((photo, i) => (
                    <button key={i + 1} onClick={() => openLightbox(allGalleryPhotos, i + 1)}
                      className="rounded-lg overflow-hidden aspect-square group cursor-pointer">
                      <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─ Tab: Reviews ─ */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Rating summary card */}
                {ratingBreakdown && ratingBreakdown.count > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-6">
                      <div className="text-center shrink-0">
                        <div className="text-5xl font-black text-gray-900">{ratingBreakdown.overall.toFixed(1)}</div>
                        <StarRating rating={ratingBreakdown.overall} size="sm" className="justify-center mt-1" />
                        <p className="text-xs text-gray-400 mt-1">{ratingBreakdown.count} {t('reviews', 'تقييم')}</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[
                          { label: t('Food', 'الطعام'), value: ratingBreakdown.food },
                          { label: t('Service', 'الخدمة'), value: ratingBreakdown.service },
                          { label: t('Ambiance', 'الأجواء'), value: ratingBreakdown.ambiance },
                          { label: t('Value', 'القيمة'), value: ratingBreakdown.value },
                        ].filter(r => r.value).map(r => (
                          <div key={r.label} className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500 w-16 shrink-0 text-xs">{r.label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${((r.value ?? 0) / 5) * 100}%` }} />
                            </div>
                            <span className="font-bold text-gray-900 w-7 text-end text-xs">{r.value?.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Write review */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{t('Write a Review', 'اكتب تقييمًا')}</h2>
                  <InlineReviewComposer
                    restaurantId={numericId}
                    restaurantNameEn={restaurant.nameEn}
                    restaurantNameAr={restaurant.nameAr}
                    invalidateKey={[...getGetRestaurantQueryKey(numericId)]}
                  />
                </div>

                {/* Review list */}
                {recentReviews.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 font-medium">{recentReviews.length} {t('reviews', 'تقييم')}</p>
                    {recentReviews.map(review => (
                      <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <ReviewCard
                          review={review}
                          onDelete={reviewId => {
                            deleteReview.mutate({ reviewId }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(numericId) }),
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">{t('No reviews yet. Be the first!', 'لا توجد تقييمات بعد. كن الأول!')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ─ Tab: Info ─ */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* Contact */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{t('Contact & Location', 'التواصل والموقع')}</h2>
                  <div className="space-y-3">
                    {restaurant.phone && (
                      <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary transition-colors group">
                        <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                          <Phone className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                        </div>
                        <span>{restaurant.phone}</span>
                      </a>
                    )}
                    {restaurant.address && (
                      <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary transition-colors group">
                        <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                          <MapPin className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                        </div>
                        <span>{restaurant.address}</span>
                      </a>
                    )}
                    {restaurant.website && (
                      <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-primary hover:underline group">
                        <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                          <Globe className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                        </div>
                        <span>{restaurant.website}</span>
                      </a>
                    )}
                    {restaurant.address && (
                      <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 hover:bg-primary/10 transition-colors">
                        <Navigation className="w-4 h-4" />
                        {t('Get Directions', 'احصل على الاتجاهات')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Map */}
                {restaurant.address && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="text-base font-bold text-gray-900">{t('Location', 'الموقع')}</h2>
                      <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5" /> {t('Open in Maps', 'فتح في الخريطة')}
                      </a>
                    </div>
                    <div className="h-64 bg-gray-100 flex items-center justify-center">
                      <iframe
                        title={`${name} location`}
                        src={googleMapsEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Hours */}
                {openingHours.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> {t('Opening Hours', 'ساعات العمل')}
                    </h2>
                    <div className="space-y-1">
                      {openingHours.map(h => (
                        <div key={h.id} className={`flex justify-between text-sm py-2.5 border-b border-gray-100 last:border-0 ${h.dayOfWeek === today ? 'font-bold text-primary' : 'text-gray-600'}`}>
                          <span>{lang === 'ar' ? DAYS_AR[h.dayOfWeek] : DAYS[h.dayOfWeek]}</span>
                          <span>{h.isClosed ? t('Closed', 'مغلق') : `${h.openTime} – ${h.closeTime}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{t('Features & Amenities', 'المميزات والخدمات')}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map(f => (
                      <div key={f.en} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <div className="w-7 h-7 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                          <f.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium">{lang === 'ar' ? f.ar : f.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─ Tab: Stories (hidden but available) ─ */}
            {activeTab === ('stories' as any) && (
              <StoriesTab restaurantId={numericId} />
            )}

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="hidden lg:block space-y-4">

            {/* Book CTA */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-20">
              <h3 className="text-base font-bold text-gray-900 mb-1">{t('Reserve a Table', 'احجز طاولة')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('Instant confirmation.', 'تأكيد فوري.')}</p>
              {activeTab === 'book' ? (
                <BookingSection
                  restaurantId={numericId}
                  restaurantNameEn={restaurant.nameEn}
                  restaurantNameAr={restaurant.nameAr}
                  compact
                  menuData={menuData}
                />
              ) : (
                <Button className="w-full font-bold" onClick={() => setActiveTab('book')}>
                  {t('See Available Times', 'عرض الأوقات المتاحة')}
                </Button>
              )}
            </div>

            {/* Rating Sidebar */}
            {ratingBreakdown && ratingBreakdown.count > 0 && activeTab !== 'reviews' && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">{t('Ratings', 'التقييمات')}</h3>
                  <button onClick={() => setActiveTab('reviews')} className="text-xs text-primary hover:underline">{t('All reviews', 'كل التقييمات')}</button>
                </div>
                <div className="text-center mb-4">
                  <span className="text-4xl font-black text-gray-900">{ratingBreakdown.overall.toFixed(1)}</span>
                  <StarRating rating={ratingBreakdown.overall} size="sm" className="justify-center mt-1" />
                  <p className="text-xs text-gray-400 mt-1">{ratingBreakdown.count} {t('reviews', 'تقييم')}</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: t('Food', 'الطعام'), value: ratingBreakdown.food },
                    { label: t('Service', 'الخدمة'), value: ratingBreakdown.service },
                    { label: t('Ambiance', 'الأجواء'), value: ratingBreakdown.ambiance },
                    { label: t('Value', 'القيمة'), value: ratingBreakdown.value },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-14 shrink-0">{r.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${((r.value ?? 0) / 5) * 100}%` }} />
                      </div>
                      <span className="font-bold text-gray-700 w-6 text-end">{r.value?.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Contact */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('Contact', 'تواصل')}</h3>
              <div className="space-y-2.5 text-sm">
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2.5 text-gray-600 hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 text-gray-400" /> {restaurant.phone}
                  </a>
                )}
                {restaurant.address && (
                  <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-gray-600 hover:text-primary transition-colors">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="leading-snug">{restaurant.address}</span>
                  </a>
                )}
                {restaurant.website && (
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-primary hover:underline">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{restaurant.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOOK TAB (full-width on mobile) ── */}
        {activeTab === 'book' && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5 max-w-xl lg:hidden">
            <h2 className="text-base font-bold text-gray-900 mb-4">{t('Reserve a Table', 'احجز طاولة')}</h2>
            <BookingSection
              restaurantId={numericId}
              restaurantNameEn={restaurant.nameEn}
              restaurantNameAr={restaurant.nameAr}
              menuData={menuData}
            />
          </div>
        )}
        {activeTab === 'book' && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5 hidden lg:block max-w-xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">{t('Reserve a Table', 'احجز طاولة')}</h2>
            <BookingSection
              restaurantId={numericId}
              restaurantNameEn={restaurant.nameEn}
              restaurantNameAr={restaurant.nameAr}
              menuData={menuData}
            />
          </div>
        )}
      </div>


      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        restaurant={{
          nameEn: restaurant.nameEn,
          nameAr: restaurant.nameAr,
          coverImageUrl: restaurant.coverImageUrl,
          avgRating: (restaurant as any).avgRating,
        }}
      />
      {/* ── SIMILAR RESTAURANTS ── */}
      <SimilarRestaurantsSection restaurantId={numericId} categoryId={categories[0]?.id} lang={lang} t={t} />
    </div>
  );
}

// ── Similar Restaurants ─────────────────────────────────────────────
function SimilarRestaurantsSection({ restaurantId, categoryId, lang, t }: {
  restaurantId: number;
  categoryId?: number;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const { data, isLoading } = useListRestaurants(
    { categoryId, limit: 7, minRating: 4 },
    { query: { staleTime: 5 * 60 * 1000, queryKey: ['similar-restaurants', restaurantId, categoryId] } }
  );

  const similar = (data?.restaurants ?? []).filter((r: any) => r.id !== restaurantId).slice(0, 6);

  if (!isLoading && similar.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{t('You might also like', 'قد يعجبك أيضًا')}</h2>
        <Link href="/restaurants" className="text-sm text-primary font-medium hover:underline">{t('View all', 'عرض الكل')}</Link>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {similar.map((r: any) => (
            <Link key={r.id} href={`/restaurants/${r.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={r.coverImageUrl || `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop`}
                    alt={lang === 'ar' ? r.nameAr : r.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                    {lang === 'ar' ? r.nameAr : r.nameEn}
                  </p>
                  {r.avgRating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-500 font-medium">{Number(r.avgRating).toFixed(1)}</span>
                    </div>
                  )}
                  {r.address && (
                    <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" /> {r.address}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
