import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays, Star, Heart, Tag, Award, TrendingUp, ChevronRight,
  CheckCircle2, Clock, MapPin, Users, Bookmark, Edit, Camera,
  Trophy, Zap, Gift, Bell, Settings, ArrowRight, BookOpen,
  AtSign, Loader2, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AddressBook } from '@/components/AddressBook';
import { LocalizationSettings } from '@/components/LocalizationSettings';

// ─── Username Section Component ───────────────────────────────────────────────
function UsernameSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState((user as any)?.username ?? '');
  const [checkResult, setCheckResult] = useState<{ available: boolean; reason?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  const currentUsername = (user as any)?.username;
  const isUnchanged = inputValue.trim().toLowerCase() === (currentUsername ?? '').toLowerCase();

  // Debounced availability check
  useEffect(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3 || isUnchanged) {
      setCheckResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/username/check?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setCheckResult(data);
      } catch {
        setCheckResult(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, isUnchanged]);

  const handleSave = async () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return;
    setSaveStatus('saving');
    setSaveError('');
    try {
      const res = await fetch('/api/me/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveError(data.error || t('Failed to set username.', 'فشل تعيين اسم المستخدم.'));
      } else {
        setSaveStatus('saved');
        queryClient.invalidateQueries({ queryKey: ['me'] });
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      setSaveError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مجدداً.'));
    }
  };

  const inputBorder = () => {
    if (isChecking) return 'border-border';
    if (checkResult?.available === true) return 'border-emerald-400 ring-1 ring-emerald-200';
    if (checkResult?.available === false) return 'border-red-400 ring-1 ring-red-100';
    if (saveStatus === 'saved') return 'border-emerald-400 ring-1 ring-emerald-200';
    return 'border-input';
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <AtSign className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">{t('Username', 'اسم المستخدم')}</h3>
          <p className="text-xs text-muted-foreground">{t('Your unique Tabaq handle — visible on your public profile', 'معرّفك الفريد على طبق — يظهر في ملفك العام')}</p>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="relative">
          <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm select-none">@</div>
          <input
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value.replace(/\s/g, '').toLowerCase());
              setSaveStatus('idle');
              setSaveError('');
            }}
            placeholder={t('your_handle', 'معرّفك')}
            maxLength={30}
            className={`w-full h-11 ps-8 pe-10 rounded-xl border ${inputBorder()} bg-background text-sm focus:outline-none transition-all font-mono`}
          />
          <div className="absolute end-3.5 top-1/2 -translate-y-1/2">
            {isChecking && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
            {!isChecking && checkResult?.available === true && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {!isChecking && checkResult?.available === false && <XCircle className="w-4 h-4 text-red-500" />}
            {!isChecking && saveStatus === 'saved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </div>
        </div>

        {/* Feedback messages */}
        {!isChecking && checkResult?.available === true && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3 h-3" /> {t('Username available!', 'اسم المستخدم متاح!')}
          </p>
        )}
        {!isChecking && checkResult?.available === false && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <XCircle className="w-3 h-3" /> {checkResult.reason || t('Username not available.', 'اسم المستخدم غير متاح.')}
          </p>
        )}
        {saveStatus === 'saved' && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3 h-3" /> {t('Username saved!', 'تم حفظ اسم المستخدم!')} — @{inputValue.trim().toLowerCase()}
          </p>
        )}
        {saveStatus === 'error' && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" /> {saveError}
          </p>
        )}

        {/* Rules */}
        <div className="bg-secondary/50 rounded-xl px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground/80 mb-1">{t('Username rules', 'قواعد اسم المستخدم')}</p>
          {[
            t('3–30 characters', '3–30 حرفاً'),
            t('Letters, numbers, underscores, and dots only', 'أحرف وأرقام وشرطة سفلية ونقاط فقط'),
            t('Cannot start or end with _ or .', 'لا يمكن أن يبدأ أو ينتهي بـ _ أو .'),
            t('No spaces allowed', 'لا يُسمح بالمسافات'),
          ].map(rule => (
            <p key={rule} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/60 shrink-0" />
              {rule}
            </p>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={
            !inputValue.trim() ||
            inputValue.trim().length < 3 ||
            isChecking ||
            saveStatus === 'saving' ||
            saveStatus === 'saved' ||
            (checkResult !== null && !checkResult.available && !isUnchanged) ||
            (isUnchanged && !!currentUsername)
          }
          className="w-full h-11 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {saveStatus === 'saving' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {t('Saving...', 'جار الحفظ...')}</>
          ) : saveStatus === 'saved' ? (
            <><CheckCircle2 className="w-4 h-4" /> {t('Saved!', 'تم الحفظ!')}</>
          ) : isUnchanged && currentUsername ? (
            t('Username already set', 'اسم المستخدم محدد مسبقاً')
          ) : (
            t('Save Username', 'حفظ اسم المستخدم')
          )}
        </button>
      </div>
    </div>
  );
}

const LEVEL_CONFIG = [
  { level: 1, name: 'Food Explorer', nameAr: 'مستكشف الطعام', min: 0, max: 100, color: 'from-green-400 to-emerald-500', icon: '🌱' },
  { level: 2, name: 'Taste Enthusiast', nameAr: 'عاشق الذوق', min: 100, max: 300, color: 'from-blue-400 to-cyan-500', icon: '🍽️' },
  { level: 3, name: 'Culinary Critic', nameAr: 'ناقد طعام', min: 300, max: 600, color: 'from-purple-400 to-violet-500', icon: '📝' },
  { level: 4, name: 'Dining Connoisseur', nameAr: 'خبير الطعام', min: 600, max: 1000, color: 'from-amber-400 to-orange-500', icon: '🏆' },
  { level: 5, name: 'Tabaq Legend', nameAr: 'أسطورة طبق', min: 1000, max: 9999, color: 'from-rose-400 to-pink-500', icon: '👑' },
];

const MOCK_BOOKINGS = [
  { id: 1, restaurantName: 'Najd Village', restaurantNameAr: 'قرية نجد', date: '2026-03-29', time: '7:30 PM', guests: 4, status: 'confirmed', ref: 'TBQ-A1B2C3D4', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop' },
  { id: 2, restaurantName: 'Sushi Sama', restaurantNameAr: 'سوشي ساما', date: '2026-04-05', time: '8:00 PM', guests: 2, status: 'confirmed', ref: 'TBQ-E5F6G7H8', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop' },
  { id: 3, restaurantName: 'Reem Al Bawadi', restaurantNameAr: 'ريم البوادي', date: '2026-03-15', time: '1:00 PM', guests: 6, status: 'completed', ref: 'TBQ-I9J0K1L2', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop' },
];

const MOCK_REVIEWS = [
  { id: 1, restaurant: 'Najd Village', restaurantNameAr: 'قرية نجد', rating: 5, text: 'Absolutely incredible. The lamb chops were perfect.', date: '2026-03-16', points: 25 },
  { id: 2, restaurant: 'Hakkasan', restaurantNameAr: 'هاكاسان', rating: 4, text: 'Beautiful venue, great Cantonese food. Service was very attentive.', date: '2026-02-28', points: 25 },
];

const SAVED_RESTAURANTS = [
  { id: 1, name: 'The Grill Room', nameAr: 'غرفة الشواء', city: 'Riyadh', rating: 4.7, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=150&fit=crop', tier: 'Fine Dining' },
  { id: 2, name: 'Café Bateel', nameAr: 'كافيه بتيل', city: 'Jeddah', rating: 4.4, img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=150&fit=crop', tier: 'Café' },
  { id: 3, name: 'Fuego Steakhouse', nameAr: 'فيوجو ستيك', city: 'Riyadh', rating: 4.6, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop', tier: 'Steakhouse' },
];

const MOCK_POINTS = {
  total: 475,
  level: 3,
  bookings: 18,
  reviews: 12,
  toNextLevel: 125,
};

type DashTab = 'overview' | 'bookings' | 'reviews' | 'saved' | 'vouchers' | 'points' | 'settings';

export function UserDashboardPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashTab>('overview');

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => fetch('/api/bookings').then(r => r.ok ? r.json() : null),
    retry: false,
  });
  const { data: vouchersData } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => fetch('/api/vouchers').then(r => r.ok ? r.json() : null),
    retry: false,
  });
  const bookings = (Array.isArray(bookingsData) ? bookingsData : null) ?? MOCK_BOOKINGS;
  const vouchers = (Array.isArray(vouchersData) ? vouchersData : null) ?? [];

  const levelConfig = LEVEL_CONFIG[MOCK_POINTS.level - 1];
  const progress = ((MOCK_POINTS.total - levelConfig.min) / (levelConfig.max - levelConfig.min)) * 100;
  const displayName = lang === 'ar' ? (user?.nameAr || user?.nameEn) : user?.nameEn;

  const navTabs: { id: DashTab; labelEn: string; labelAr: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: TrendingUp },
    { id: 'bookings', labelEn: 'Bookings', labelAr: 'الحجوزات', icon: CalendarDays, badge: bookings.filter((b: any) => b.status === 'confirmed').length },
    { id: 'reviews', labelEn: 'My Reviews', labelAr: 'تقييماتي', icon: Star },
    { id: 'saved', labelEn: 'Saved', labelAr: 'المحفوظات', icon: Heart },
    { id: 'vouchers', labelEn: 'Vouchers', labelAr: 'القسائم', icon: Tag },
    { id: 'points', labelEn: 'Points & Level', labelAr: 'النقاط والمستوى', icon: Trophy },
    { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Profile Hero */}
      <div className={`bg-gradient-to-br ${levelConfig.color} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 end-0 w-64 h-64 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 start-0 w-48 h-48 bg-white rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-3xl flex items-center justify-center text-4xl">
                {levelConfig.icon}
              </div>
              <button className="absolute -bottom-1 -end-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                <Camera className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>

            {/* Name & level */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-white">{displayName || t('My Dashboard', 'لوحتي')}</h1>
                <CheckCircle2 className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-white/70 text-sm mb-3">
                {levelConfig.icon} {lang === 'ar' ? levelConfig.nameAr : levelConfig.name} · Level {MOCK_POINTS.level}
              </p>
              {/* Progress bar */}
              <div className="max-w-xs">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>{MOCK_POINTS.total} pts</span>
                  <span>{MOCK_POINTS.toNextLevel} to Level {MOCK_POINTS.level + 1}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 shrink-0">
              {[
                { val: MOCK_POINTS.bookings, labelEn: 'Bookings', labelAr: 'حجوزات' },
                { val: MOCK_POINTS.reviews, labelEn: 'Reviews', labelAr: 'تقييمات' },
                { val: MOCK_POINTS.total, labelEn: 'Points', labelAr: 'نقاط' },
              ].map(s => (
                <div key={s.labelEn} className="text-center">
                  <p className="text-2xl font-extrabold text-white">{s.val}</p>
                  <p className="text-white/60 text-xs">{lang === 'ar' ? s.labelAr : s.labelEn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border-b border-border sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto hide-scrollbar">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {lang === 'ar' ? tab.labelAr : tab.labelEn}
                  {tab.badge && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">{t('Quick Actions', 'إجراءات سريعة')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: CalendarDays, labelEn: 'Book a Table', labelAr: 'احجز طاولة', href: '/restaurants', color: 'bg-primary/10 text-primary' },
                  { icon: Star, labelEn: 'Write a Review', labelAr: 'اكتب تقييماً', href: '/restaurants', color: 'bg-amber-50 text-amber-600' },
                  { icon: Tag, labelEn: 'Redeem Voucher', labelAr: 'استبدل قسيمة', href: '/vouchers', color: 'bg-purple-50 text-purple-600' },
                  { icon: Trophy, labelEn: 'Leaderboard', labelAr: 'المتصدرون', href: '/leaderboard', color: 'bg-green-50 text-green-600' },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.labelEn} href={action.href} className="block">
                      <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/20 transition-all text-center cursor-pointer">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2 ${action.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-foreground">{lang === 'ar' ? action.labelAr : action.labelEn}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-bold text-foreground">{t('Upcoming Bookings', 'الحجوزات القادمة')}</h2>
                <button onClick={() => setActiveTab('bookings')} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                  {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {MOCK_BOOKINGS.filter(b => b.status === 'confirmed').length === 0 ? (
                <div className="text-center py-10">
                  <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">{t('No upcoming bookings', 'لا توجد حجوزات قادمة')}</p>
                  <Link href="/restaurants"><Button size="sm" className="mt-3">{t('Book a Table', 'احجز طاولة')}</Button></Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {MOCK_BOOKINGS.filter(b => b.status === 'confirmed').map(booking => (
                    <div key={booking.id} className="flex items-center gap-4 p-4">
                      <img src={booking.img} alt={booking.restaurantName} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm">{lang === 'ar' ? booking.restaurantNameAr : booking.restaurantName}</p>
                        <p className="text-xs text-muted-foreground">{booking.date} · {booking.time}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{booking.guests} {t('guests', 'أشخاص')}</span>
                          <span className="text-xs font-mono text-muted-foreground/60">· {booking.ref}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {t('Confirmed', 'مؤكد')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-bold text-foreground">{t('Recent Activity', 'النشاط الأخير')}</h2>
              </div>
              <div className="divide-y divide-border">
                {[
                  { icon: Star, text: t('You reviewed Reem Al Bawadi', 'قيّمت ريم البوادي'), pts: '+25 pts', time: '2 days ago', color: 'bg-amber-50 text-amber-600' },
                  { icon: CalendarDays, text: t('Booking confirmed: Najd Village', 'تأكيد الحجز: قرية نجد'), pts: '+10 pts', time: '3 days ago', color: 'bg-primary/10 text-primary' },
                  { icon: Award, text: t('Reached Level 3 — Culinary Critic!', 'وصلت إلى المستوى 3!'), pts: '+50 pts', time: '1 week ago', color: 'bg-purple-50 text-purple-600' },
                  { icon: Tag, text: t('Voucher redeemed: 20% off', 'تم استبدال القسيمة: خصم 20٪'), pts: '', time: '2 weeks ago', color: 'bg-green-50 text-green-600' },
                ].map((activity, idx) => {
                  const Icon = activity.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activity.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.text}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      {activity.pts && (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">{activity.pts}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[t('All', 'الكل'), t('Upcoming', 'القادمة'), t('Completed', 'المكتملة'), t('Cancelled', 'الملغاة')].map(f => (
                <button key={f} className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${f === t('All', 'الكل') ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{f}</button>
              ))}
            </div>
            {MOCK_BOOKINGS.map(booking => (
              <div key={booking.id} className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
                <img src={booking.img} alt={booking.restaurantName} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-foreground">{lang === 'ar' ? booking.restaurantNameAr : booking.restaurantName}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{booking.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.time}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.guests} {t('guests', 'أشخاص')}</span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground/60 mt-1">{booking.ref}</p>
                  {booking.status === 'completed' && (
                    <Link href={`/restaurants/${booking.id}`}>
                      <button className="mt-3 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1">
                        <Star className="w-3 h-3" /> {t('Write a Review', 'اكتب تقييماً')}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">{MOCK_REVIEWS.length} {t('reviews written', 'تقييمات مكتوبة')}</p>
              <Link href="/restaurants">
                <Button size="sm" variant="outline" className="gap-1.5"><Star className="w-3.5 h-3.5" />{t('Write Review', 'اكتب تقييماً')}</Button>
              </Link>
            </div>
            {MOCK_REVIEWS.map(review => (
              <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{review.restaurant}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />)}
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+{review.points} pts</span>
                    <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Edit className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{review.text}"</p>
              </div>
            ))}
          </div>
        )}

        {/* ── SAVED ── */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">{SAVED_RESTAURANTS.length} {t('saved restaurants', 'مطاعم محفوظة')}</p>
              <Link href="/restaurants">
                <Button size="sm" variant="outline">{t('Discover More', 'اكتشف أكثر')}</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAVED_RESTAURANTS.map(r => (
                <Link key={r.id} href={`/restaurants/${r.id}`} className="block group">
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all">
                    <div className="relative aspect-[3/2] overflow-hidden">
                      <img src={r.img} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 end-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground text-sm">{lang === 'ar' ? r.nameAr : r.name}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold">{r.rating}</span>
                        </div>
                      </div>
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md mt-2 inline-block">{r.tier}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── VOUCHERS ── */}
        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            {vouchers.length === 0 ? (
              <div className="text-center py-20">
                <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">{t('No vouchers yet', 'لا توجد قسائم بعد')}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t('Check out our offers page for exclusive deals.', 'اطلع على صفحة العروض للحصول على صفقات حصرية.')}</p>
                <Link href="/offers"><Button>{t('Browse Offers', 'تصفح العروض')}</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {vouchers.map((v: any) => (
                  <div key={v.id} className="bg-card border border-border rounded-2xl p-5">
                    <p className="font-bold text-foreground">{v.code}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── POINTS ── */}
        {activeTab === 'points' && (
          <div className="space-y-6">
            {/* Current Level Card */}
            <div className={`bg-gradient-to-br ${levelConfig.color} rounded-3xl p-7 text-white relative overflow-hidden`}>
              <div className="absolute top-4 end-4 text-6xl opacity-20">{levelConfig.icon}</div>
              <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-1">Current Level</p>
              <h2 className="text-4xl font-extrabold mb-1">{levelConfig.icon} Level {MOCK_POINTS.level}</h2>
              <p className="text-2xl font-bold text-white/80 mb-5">{lang === 'ar' ? levelConfig.nameAr : levelConfig.name}</p>
              <div className="max-w-xs">
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>{MOCK_POINTS.total} pts earned</span>
                  <span>{MOCK_POINTS.toNextLevel} to Level {MOCK_POINTS.level + 1}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Points Breakdown */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold text-foreground">{t('Points Breakdown', 'تفاصيل النقاط')}</h3>
              </div>
              <div className="divide-y divide-border">
                {[
                  { icon: CalendarDays, labelEn: 'Completed Bookings', labelAr: 'الحجوزات المكتملة', pts: 180, desc: '18 bookings × 10 pts', color: 'bg-primary/10 text-primary' },
                  { icon: Star, labelEn: 'Reviews Written', labelAr: 'التقييمات المكتوبة', pts: 300, desc: '12 reviews × 25 pts', color: 'bg-amber-50 text-amber-600' },
                  { icon: Award, labelEn: 'Level Up Bonus', labelAr: 'مكافأة الترقية', pts: 50, desc: 'Reached Level 3', color: 'bg-purple-50 text-purple-600' },
                  { icon: Gift, labelEn: 'Referral Bonus', labelAr: 'مكافأة الإحالة', pts: 0, desc: 'Invite friends to earn 50 pts each', color: 'bg-green-50 text-green-600' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.labelEn} className="flex items-center gap-4 p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{lang === 'ar' ? item.labelAr : item.labelEn}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <span className="font-extrabold text-foreground text-sm shrink-0">{item.pts > 0 ? `+${item.pts}` : '—'}</span>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="font-bold text-foreground">{t('Total Points', 'إجمالي النقاط')}</p>
                <p className="text-2xl font-extrabold text-primary">{MOCK_POINTS.total}</p>
              </div>
            </div>

            {/* All Levels */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold text-foreground">{t('All Levels', 'جميع المستويات')}</h3>
              </div>
              <div className="divide-y divide-border">
                {LEVEL_CONFIG.map(lev => (
                  <div key={lev.level} className={`flex items-center gap-4 px-5 py-3 ${lev.level === MOCK_POINTS.level ? 'bg-secondary/40' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${lev.color} flex items-center justify-center text-xl shrink-0`}>
                      {lev.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground text-sm">{lev.name}</p>
                      <p className="text-xs text-muted-foreground">{lev.min} – {lev.max === 9999 ? '∞' : lev.max} pts</p>
                    </div>
                    {lev.level === MOCK_POINTS.level && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{t('Current', 'الحالي')}</span>
                    )}
                    {lev.level < MOCK_POINTS.level && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-2xl">

            <LocalizationSettings />

            <UsernameSection />

            <div className="bg-card border border-border rounded-2xl p-5">
              <AddressBook />
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-bold text-foreground">{t('Personal Information', 'المعلومات الشخصية')}</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: t('Full Name', 'الاسم الكامل'), value: displayName || '' },
                  { label: t('Phone Number', 'رقم الهاتف'), value: user?.phone || '' },
                  { label: t('Email', 'البريد الإلكتروني'), value: '' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{f.label}</label>
                    <input type="text" defaultValue={f.value} className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
                <Button className="w-full">{t('Save Changes', 'حفظ التغييرات')}</Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-bold text-foreground">{t('Notification Preferences', 'تفضيلات الإشعارات')}</h3>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: t('Booking Confirmations', 'تأكيدات الحجز'), enabled: true },
                  { label: t('Booking Reminders', 'تذكيرات الحجز'), enabled: true },
                  { label: t('New Offers & Vouchers', 'العروض والقسائم الجديدة'), enabled: false },
                  { label: t('Review Responses', 'ردود التقييمات'), enabled: true },
                  { label: t('Leaderboard Updates', 'تحديثات المتصدرين'), enabled: false },
                ].map(pref => (
                  <div key={pref.label} className="flex items-center justify-between px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">{pref.label}</p>
                    <div className={`w-11 h-6 rounded-full transition-all cursor-pointer ${pref.enabled ? 'bg-primary' : 'bg-muted'}`}>
                      <span className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-all mt-0.5 ${pref.enabled ? 'ms-[22px]' : 'ms-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
