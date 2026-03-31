import React, { useState } from 'react';
import {
  Bell, CalendarDays, Star, Users, Tag, Gift, Award, ChevronRight,
  Check, CheckCheck, Settings, Trash2, Clock, MessageSquare, Zap,
  X, Mail, Smartphone, Volume2, VolumeX, ToggleLeft, ToggleRight,
  Rss, Globe, ShieldCheck, Heart, Package, Ticket
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { getAuthHeaders } from '@/lib/api';
import { toast } from 'sonner';

type NotifType = 'booking' | 'review_response' | 'new_follower' | 'offer' | 'points' | 'reminder' | 'achievement' | 'system';

interface Notification {
  id: number;
  type: NotifType;
  read: boolean;
  time: string;
  timeAgo: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  link?: string;
  meta?: { image?: string; avatar?: string; badge?: string };
}

interface NotifPref {
  notifType: string;
  labelEn: string;
  labelAr: string;
  enabled: boolean;
  channels: string[];
  availableChannels: string[];
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1, type: 'booking', read: false, time: '2026-03-29T09:00:00', timeAgo: '15 دقيقة',
    titleEn: 'Booking Confirmed', titleAr: 'تم تأكيد الحجز',
    bodyEn: 'Your table at Reem Al-Bawadi for 4 guests on March 29 at 7:30 PM is confirmed.',
    bodyAr: 'تم تأكيد طاولتك في ريم البوادي لـ 4 أشخاص في 29 مارس الساعة 7:30 م.',
    link: '/bookings', meta: { image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop' },
  },
  {
    id: 2, type: 'points', read: false, time: '2026-03-29T08:30:00', timeAgo: '45 دقيقة',
    titleEn: '+10 Points Earned!', titleAr: 'ربحت 10 نقاط!',
    bodyEn: 'You earned 10 points for confirming your booking at Reem Al-Bawadi.',
    bodyAr: 'ربحت 10 نقاط لتأكيدك الحجز في ريم البوادي.',
    link: '/dashboard',
  },
  {
    id: 3, type: 'offer', read: false, time: '2026-03-29T07:00:00', timeAgo: '2 ساعة',
    titleEn: 'New Offer: 20% off at Sushi Sama', titleAr: 'عرض جديد: خصم 20% في سوشي ساما',
    bodyEn: "Exclusive offer for Tabaq members — valid until end of March. Grab it before it's gone!",
    bodyAr: 'عرض حصري لأعضاء طبق — صالح حتى نهاية مارس. لا تفوته!',
    link: '/offers', meta: { image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
  },
  {
    id: 4, type: 'review_response', read: false, time: '2026-03-28T18:00:00', timeAgo: 'أمس',
    titleEn: 'Reem Al-Bawadi replied to your review', titleAr: 'ريم البوادي ردّ على تقييمك',
    bodyEn: '"Thank you for your kind words! We look forward to hosting you again." — The Management',
    bodyAr: '"شكراً لكلماتك الطيبة! نتطلع إلى استضافتك مرة أخرى." — الإدارة',
    link: '/restaurants/2', meta: { image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop' },
  },
  {
    id: 5, type: 'new_follower', read: true, time: '2026-03-28T15:30:00', timeAgo: 'أمس',
    titleEn: 'Noura Al-Rashid is following you', titleAr: 'نورة الراشد بدأت متابعتك',
    bodyEn: 'Top critic Noura Al-Rashid is now following your food journey.',
    bodyAr: 'الناقدة الكبرى نورة الراشد تتابع رحلتك الغذائية الآن.',
    link: '/leaderboard', meta: { avatar: 'https://i.pravatar.cc/80?img=47', badge: '👑' },
  },
  {
    id: 6, type: 'achievement', read: true, time: '2026-03-27T12:00:00', timeAgo: 'يومان',
    titleEn: '🏅 Achievement Unlocked: Taste Explorer!', titleAr: '🏅 إنجاز جديد: مستكشف الطعام!',
    bodyEn: "You've visited 10 different restaurant categories. Your palate knows no limits!",
    bodyAr: 'زرت 10 فئات مختلفة من المطاعم. ذوقك لا حدود له!',
    link: '/dashboard',
  },
  {
    id: 7, type: 'system', read: true, time: '2026-03-24T08:00:00', timeAgo: '5 أيام',
    titleEn: 'Welcome to Tabaq! 🎉', titleAr: 'مرحباً بك في طبق! 🎉',
    bodyEn: 'Start your food journey — explore restaurants, earn points, and share your dining experiences.',
    bodyAr: 'ابدأ رحلتك الغذائية — استكشف المطاعم واجمع النقاط وشارك تجاربك.',
    link: '/restaurants',
  },
];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  booking: { icon: <CalendarDays className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10' },
  review_response: { icon: <MessageSquare className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  new_follower: { icon: <Users className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  offer: { icon: <Tag className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  points: { icon: <Zap className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  reminder: { icon: <Clock className="w-5 h-5" />, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/30' },
  achievement: { icon: <Award className="w-5 h-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  system: { icon: <Bell className="w-5 h-5" />, color: 'text-muted-foreground', bg: 'bg-muted' },
};

const CHANNEL_CONFIG: Record<string, { icon: React.ReactNode; labelEn: string; labelAr: string; color: string }> = {
  in_app: { icon: <Bell className="w-3.5 h-3.5" />, labelEn: 'In-App', labelAr: 'داخل التطبيق', color: 'text-blue-600' },
  email: { icon: <Mail className="w-3.5 h-3.5" />, labelEn: 'Email', labelAr: 'بريد إلكتروني', color: 'text-green-600' },
  sms: { icon: <Smartphone className="w-3.5 h-3.5" />, labelEn: 'SMS', labelAr: 'رسالة نصية', color: 'text-purple-600' },
  push: { icon: <Rss className="w-3.5 h-3.5" />, labelEn: 'Push', labelAr: 'إشعار فوري', color: 'text-orange-600' },
};

const NOTIF_TYPE_ICONS: Record<string, React.ReactNode> = {
  booking_confirmed: <CalendarDays className="w-4 h-4 text-primary" />,
  booking_cancelled: <CalendarDays className="w-4 h-4 text-red-500" />,
  new_follower: <Users className="w-4 h-4 text-purple-500" />,
  new_review: <Star className="w-4 h-4 text-amber-500" />,
  new_offer: <Tag className="w-4 h-4 text-orange-500" />,
  new_dish: <Package className="w-4 h-4 text-teal-500" />,
  new_opening: <Globe className="w-4 h-4 text-blue-500" />,
  order_status: <Ticket className="w-4 h-4 text-indigo-500" />,
  points_earned: <Zap className="w-4 h-4 text-yellow-500" />,
  follow_request: <Heart className="w-4 h-4 text-pink-500" />,
  promo_code: <Gift className="w-4 h-4 text-red-500" />,
  event_reminder: <Clock className="w-4 h-4 text-teal-500" />,
};

const FILTER_TABS = [
  { id: 'all', labelEn: 'All', labelAr: 'الكل' },
  { id: 'booking', labelEn: 'Bookings', labelAr: 'الحجوزات' },
  { id: 'offer', labelEn: 'Offers', labelAr: 'العروض' },
  { id: 'points', labelEn: 'Points', labelAr: 'النقاط' },
  { id: 'social', labelEn: 'Social', labelAr: 'الاجتماعية' },
];

function groupByDate(notifs: Notification[], lang: string) {
  const groups: Record<string, Notification[]> = {};
  notifs.forEach(n => {
    const key = n.timeAgo.includes('دقيقة') || n.timeAgo.includes('ساعة') ? (lang === 'ar' ? 'اليوم' : 'Today')
      : n.timeAgo === 'أمس' ? (lang === 'ar' ? 'أمس' : 'Yesterday')
      : (lang === 'ar' ? 'هذا الأسبوع' : 'This Week');
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

// ─── Notification Preferences Panel ────────────────────────────────────────────
function NotificationPrefsPanel({
  open, onClose, token
}: { open: boolean; onClose: () => void; token?: string | null }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const qc = useQueryClient();

  const { data: prefsData, isLoading } = useQuery({
    queryKey: ['notification-prefs', token],
    queryFn: async () => {
      const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${apiBase}/api/notifications/preferences`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return res.json() as Promise<{ preferences: NotifPref[] }>;
    },
    enabled: open && !!token,
    staleTime: 60000,
  });

  const prefs: NotifPref[] = prefsData?.preferences ?? [];

  const updateMutation = useMutation({
    mutationFn: async (updates: { notifType: string; enabled?: boolean; channels?: string[] }[]) => {
      const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${apiBase}/api/notifications/preferences`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-prefs'] });
      toast.success(t('Preferences saved', 'تم حفظ الإعدادات'));
    },
    onError: () => toast.error(t('Failed to save', 'فشل الحفظ')),
  });

  const toggleEnabled = (pref: NotifPref) => {
    updateMutation.mutate([{ notifType: pref.notifType, enabled: !pref.enabled }]);
  };

  const toggleChannel = (pref: NotifPref, channel: string) => {
    const next = pref.channels.includes(channel)
      ? pref.channels.filter(c => c !== channel)
      : [...pref.channels, channel];
    if (next.length === 0) return; // must have at least one channel
    updateMutation.mutate([{ notifType: pref.notifType, channels: next }]);
  };

  if (!open) return null;

  const PREF_GROUPS = [
    { labelEn: 'Bookings & Orders', labelAr: 'الحجوزات والطلبات', types: ['booking_confirmed', 'booking_cancelled', 'order_status'] },
    { labelEn: 'Social', labelAr: 'الاجتماعية', types: ['new_follower', 'follow_request', 'new_review'] },
    { labelEn: 'Discovery', labelAr: 'الاستكشاف', types: ['new_offer', 'new_dish', 'new_opening', 'promo_code', 'event_reminder'] },
    { labelEn: 'Rewards', labelAr: 'المكافآت', types: ['points_earned'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-background shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-base font-extrabold text-foreground">{t('Notification Preferences', 'إعدادات الإشعارات')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('Control what you receive and how', 'تحكم فيما تتلقاه وكيف')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            PREF_GROUPS.map(group => {
              const groupPrefs = prefs.filter(p => group.types.includes(p.notifType));
              if (groupPrefs.length === 0) return null;
              return (
                <div key={group.labelEn}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    {lang === 'ar' ? group.labelAr : group.labelEn}
                  </p>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
                    {groupPrefs.map(pref => (
                      <div key={pref.notifType} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="shrink-0">
                              {NOTIF_TYPE_ICONS[pref.notifType] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
                            </div>
                            <span className="text-sm font-semibold text-foreground truncate">
                              {lang === 'ar' ? pref.labelAr : pref.labelEn}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleEnabled(pref)}
                            disabled={updateMutation.isPending}
                            className="shrink-0 transition-all"
                          >
                            {pref.enabled
                              ? <ToggleRight className="w-8 h-8 text-primary" />
                              : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                          </button>
                        </div>

                        {pref.enabled && (
                          <div className="flex gap-1.5 flex-wrap ms-[26px]">
                            {pref.availableChannels.map(ch => {
                              const cfg = CHANNEL_CONFIG[ch];
                              const active = pref.channels.includes(ch);
                              return (
                                <button
                                  key={ch}
                                  onClick={() => toggleChannel(pref, ch)}
                                  disabled={updateMutation.isPending}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                    active
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                                  }`}
                                >
                                  {cfg?.icon}
                                  {lang === 'ar' ? cfg?.labelAr : cfg?.labelEn}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Mute section teaser */}
          <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
            <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
              <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              {t('Muted Users & Restaurants', 'المكتومون والمطاعم')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('You can mute any user or restaurant from their profile page to stop receiving their activity in your feed.', 'يمكنك كتم أي مستخدم أو مطعم من صفحة ملفه لإيقاف ظهور نشاطه في خلاصتك.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interests Panel ────────────────────────────────────────────────────────────
const INTEREST_GROUPS_DISPLAY = [
  {
    key: 'cuisine',
    labelEn: 'Cuisines',
    labelAr: 'المطابخ',
    emoji: '🍽️',
    items: ['Arabic', 'Italian', 'Japanese', 'Indian', 'Mexican', 'French', 'Chinese', 'Mediterranean', 'Turkish', 'Korean'],
  },
  {
    key: 'dish_type',
    labelEn: 'Dish Types',
    labelAr: 'أنواع الأطباق',
    emoji: '🥘',
    items: ['Grills', 'Seafood', 'Desserts', 'Coffee', 'Pasta', 'Pizza', 'Sushi', 'Burgers', 'Shawarma', 'Salads'],
  },
  {
    key: 'event',
    labelEn: 'Experiences',
    labelAr: 'التجارب',
    emoji: '🎉',
    items: ['Live Music', 'Cooking Classes', 'Tasting Events', 'Cultural Nights', 'Private Dining'],
  },
  {
    key: 'preference',
    labelEn: 'Preferences',
    labelAr: 'التفضيلات',
    emoji: '⭐',
    items: ['New Openings', 'Exclusive Offers', 'Michelin Guide', 'Halal Only', 'Vegetarian Friendly'],
  },
];

function InterestsPanel({ open, onClose, token }: { open: boolean; onClose: () => void; token?: string | null }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = useState(false);

  const { data } = useQuery({
    queryKey: ['user-interests', token],
    queryFn: async () => {
      const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${apiBase}/api/me/interests`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json() as Promise<{ interests: Record<string, string[]> }>;
    },
    enabled: open && !!token,
    staleTime: 60000,
  });

  React.useEffect(() => {
    if (data?.interests && !loaded) {
      setSelected(data.interests);
      setLoaded(true);
    }
  }, [data, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${apiBase}/api/me/interests`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selected }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-interests'] });
      toast.success(t('Interests saved!', 'تم حفظ اهتماماتك!'));
      onClose();
    },
    onError: () => toast.error(t('Failed to save', 'فشل الحفظ')),
  });

  const toggle = (groupKey: string, item: string) => {
    setSelected(prev => {
      const cur = prev[groupKey] ?? [];
      return {
        ...prev,
        [groupKey]: cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item],
      };
    });
  };

  const totalSelected = Object.values(selected).reduce((a, b) => a + b.length, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-background shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-base font-extrabold text-foreground">{t('My Interests', 'اهتماماتي')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`${totalSelected} selected · used to personalize your feed`, `${totalSelected} محدد · لتخصيص خلاصتك`)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {INTEREST_GROUPS_DISPLAY.map(group => (
            <div key={group.key}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {group.emoji} {lang === 'ar' ? group.labelAr : group.labelEn}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map(item => {
                  const isActive = (selected[group.key] ?? []).includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggle(group.key, item)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-4 border-t border-border bg-card">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {saveMutation.isPending ? t('Saving…', 'جارٍ الحفظ…') : t('Save Interests', 'حفظ الاهتمامات')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user, token } = useAuth();
  const [filterTab, setFilterTab] = useState('all');
  const [overrides, setOverrides] = useState<Record<number, Partial<Notification>>>({});
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [showPrefs, setShowPrefs] = useState(false);
  const [showInterests, setShowInterests] = useState(false);

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

  const { data: liveData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications', token],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/notifications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && !!token,
    staleTime: 30000,
  });

  const rawNotifications: Notification[] = liveData?.notifications?.length
    ? (liveData.notifications as Notification[])
    : MOCK_NOTIFICATIONS;

  const notifications = rawNotifications.map(n => ({ ...n, ...(overrides[n.id] ?? {}) }));
  const unreadCount = notifications.filter(n => !n.read && !dismissed.has(n.id)).length;

  const filtered = notifications.filter(n => {
    if (dismissed.has(n.id)) return false;
    if (filterTab === 'all') return true;
    if (filterTab === 'social') return ['new_follower', 'review_response', 'achievement'].includes(n.type);
    return n.type === filterTab;
  });

  const grouped = groupByDate(filtered, lang);

  const markAllRead = () => setOverrides(prev => {
    const next = { ...prev };
    notifications.forEach(n => { next[n.id] = { ...next[n.id], read: true }; });
    return next;
  });
  const markRead = (id: number) => setOverrides(prev => ({ ...prev, [id]: { ...prev[id], read: true } }));
  const dismiss = (id: number) => setDismissed(prev => new Set([...prev, id]));

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              {t('Notifications', 'الإشعارات')}
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-black px-2 py-0.5 rounded-full min-w-[22px] text-center">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0
                ? t(`${unreadCount} unread notifications`, `${unreadCount} إشعار غير مقروء`)
                : t('All caught up!', 'أنت على اطلاع بكل شيء!')}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/20 px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('Mark all read', 'تعليم الكل')}
              </button>
            )}
            <button
              onClick={() => setShowInterests(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border px-3 py-2 rounded-xl hover:text-foreground transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
              {t('Interests', 'اهتمامات')}
            </button>
            <button
              onClick={() => setShowPrefs(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border px-3 py-2 rounded-xl hover:text-foreground transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {t('Settings', 'الإعدادات')}
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${filterTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'}`}
            >
              {lang === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {notifLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="font-semibold text-foreground">{t('No notifications', 'لا توجد إشعارات')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('Nothing here yet', 'لا شيء هنا بعد')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">{group}</p>
                <div className="space-y-2">
                  {items.map(notif => {
                    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
                    const hasMedia = notif.meta?.image || notif.meta?.avatar;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${notif.read ? 'bg-card border-border/50 hover:border-border' : 'bg-primary/[0.03] border-primary/20 hover:border-primary/40'}`}
                      >
                        {!notif.read && (
                          <div className="absolute top-4 end-4 w-2 h-2 bg-primary rounded-full shrink-0" />
                        )}

                        {hasMedia ? (
                          <div className="relative shrink-0">
                            {notif.meta?.avatar ? (
                              <img src={notif.meta.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl overflow-hidden">
                                <img src={notif.meta?.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className={`absolute -bottom-1 -end-1 w-6 h-6 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color} border-2 border-card`}>
                              <div className="scale-75">{cfg.icon}</div>
                            </div>
                            {notif.meta?.badge && (
                              <span className="absolute -top-1 -end-1 text-base">{notif.meta.badge}</span>
                            )}
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 pe-6">
                          <p className="text-sm font-bold leading-snug text-foreground">
                            {lang === 'ar' ? notif.titleAr : notif.titleEn}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {lang === 'ar' ? notif.bodyAr : notif.bodyEn}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {t('ago', 'منذ')} {notif.timeAgo}
                            </span>
                            {notif.link && (
                              <Link href={notif.link}>
                                <span className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                                  {t('View', 'عرض')} <ChevronRight className="w-2.5 h-2.5" />
                                </span>
                              </Link>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                          className="absolute top-3 start-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filtered.length > 0 && (
              <div className="text-center pt-4 pb-8">
                <button
                  onClick={() => setDismissed(new Set(notifications.map(n => n.id)))}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('Clear all notifications', 'مسح جميع الإشعارات')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panels */}
      <NotificationPrefsPanel open={showPrefs} onClose={() => setShowPrefs(false)} token={token} />
      <InterestsPanel open={showInterests} onClose={() => setShowInterests(false)} token={token} />
    </div>
  );
}
