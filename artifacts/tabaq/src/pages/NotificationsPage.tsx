import React, { useState } from 'react';
import {
  Bell, CalendarDays, Star, Users, Tag, Gift, Award, ChevronRight,
  Check, CheckCheck, Settings, Trash2, Clock, Heart, MessageSquare, Zap
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

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
    bodyEn: 'You earned 10 points for confirming your booking at Reem Al-Bawadi. Keep it up!',
    bodyAr: 'ربحت 10 نقاط لتأكيدك الحجز في ريم البوادي. استمر!',
    link: '/dashboard',
  },
  {
    id: 3, type: 'offer', read: false, time: '2026-03-29T07:00:00', timeAgo: '2 ساعة',
    titleEn: 'New Offer: 20% off at Sushi Sama', titleAr: 'عرض جديد: خصم 20% في سوشي ساما',
    bodyEn: 'Exclusive offer for Tabaq members — valid until end of March. Grab it before it\'s gone!',
    bodyAr: 'عرض حصري لأعضاء طبق — صالح حتى نهاية مارس. لا تفوته!',
    link: '/offers', meta: { image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
  },
  {
    id: 4, type: 'review_response', read: false, time: '2026-03-28T18:00:00', timeAgo: 'أمس',
    titleEn: 'Reem Al-Bawadi replied to your review', titleAr: 'ريم البوادي ردّ على تقييمك',
    bodyEn: '"Thank you for your kind words! We look forward to hosting you again soon." — The Management',
    bodyAr: '"شكراً لكلماتك الطيبة! نتطلع إلى استضافتك مرة أخرى قريباً." — الإدارة',
    link: '/restaurants/2', meta: { image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop' },
  },
  {
    id: 5, type: 'new_follower', read: true, time: '2026-03-28T15:30:00', timeAgo: 'أمس',
    titleEn: 'Noura Al-Rashid is following you', titleAr: 'نورة الراشد بدأت متابعتك',
    bodyEn: 'Top critic Noura Al-Rashid is now following your food journey. Say hi!',
    bodyAr: 'الناقدة الكبرى نورة الراشد تتابع رحلتك الغذائية الآن. قل مرحباً!',
    link: '/leaderboard', meta: { avatar: 'https://i.pravatar.cc/80?img=47', badge: '👑' },
  },
  {
    id: 6, type: 'achievement', read: true, time: '2026-03-27T12:00:00', timeAgo: 'يومان',
    titleEn: '🏅 Achievement Unlocked: Taste Explorer!', titleAr: '🏅 إنجاز جديد: مستكشف الطعام!',
    bodyEn: 'You\'ve visited 10 different restaurant categories. Your palate knows no limits!',
    bodyAr: 'زرت 10 فئات مختلفة من المطاعم. ذوقك لا حدود له!',
    link: '/dashboard',
  },
  {
    id: 7, type: 'reminder', read: true, time: '2026-03-27T08:00:00', timeAgo: 'يومان',
    titleEn: 'Reminder: Booking Tomorrow at Sushi Sama', titleAr: 'تذكير: حجزك غداً في سوشي ساما',
    bodyEn: 'Don\'t forget your reservation for 2 guests at 8:00 PM. We look forward to seeing you!',
    bodyAr: 'لا تنسَ حجزك لـ 2 أشخاص الساعة 8:00 م. نتطلع لرؤيتك!',
    link: '/bookings', meta: { image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
  },
  {
    id: 8, type: 'points', read: true, time: '2026-03-26T10:00:00', timeAgo: '3 أيام',
    titleEn: '+25 Points for your review!', titleAr: 'ربحت 25 نقطة على تقييمك!',
    bodyEn: 'Your review of Sushi Sama earned you 25 bonus points. You\'re on your way to Level 4!',
    bodyAr: 'تقييمك لسوشي ساما جلب لك 25 نقطة إضافية. أنت في طريقك إلى المستوى 4!',
    link: '/dashboard',
  },
  {
    id: 9, type: 'offer', read: true, time: '2026-03-25T09:00:00', timeAgo: '4 أيام',
    titleEn: 'Your voucher expires in 3 days!', titleAr: 'قسيمتك تنتهي خلال 3 أيام!',
    bodyEn: 'Don\'t let your 15% off voucher go to waste. Use it before March 28.',
    bodyAr: 'لا تُضيّع قسيمة الخصم 15%. استخدمها قبل 28 مارس.',
    link: '/vouchers',
  },
  {
    id: 10, type: 'system', read: true, time: '2026-03-24T08:00:00', timeAgo: '5 أيام',
    titleEn: 'Welcome to Tabaq! 🎉', titleAr: 'مرحباً بك في طبق! 🎉',
    bodyEn: 'Start your food journey — explore restaurants, earn points, and share your dining experiences.',
    bodyAr: 'ابدأ رحلتك الغذائية — استكشف المطاعم واجمع النقاط وشارك تجاربك.',
    link: '/restaurants',
  },
];

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; color: string; bg: string }> = {
  booking: { icon: <CalendarDays className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10' },
  review_response: { icon: <MessageSquare className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  new_follower: { icon: <Users className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  offer: { icon: <Tag className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
  points: { icon: <Zap className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
  reminder: { icon: <Clock className="w-5 h-5" />, color: 'text-teal-600', bg: 'bg-teal-50' },
  achievement: { icon: <Award className="w-5 h-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  system: { icon: <Bell className="w-5 h-5" />, color: 'text-muted-foreground', bg: 'bg-muted' },
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

export default function NotificationsPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filterTab === 'all') return true;
    if (filterTab === 'social') return ['new_follower', 'review_response', 'achievement'].includes(n.type);
    return n.type === filterTab;
  });

  const grouped = groupByDate(filtered, lang);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

  if (!user) {
    return (
      <div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-lg mx-auto px-4 pt-24 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">{t('Sign in to see notifications', 'سجّل دخولك لرؤية الإشعارات')}</h2>
          <p className="text-muted-foreground mb-8">{t('Stay up to date with your bookings, reviews, and offers.', 'ابقَ على اطلاع بحجوزاتك وتقييماتك وعروضك.')}</p>
          <Link href="/signin"><Button className="rounded-2xl px-8">{t('Sign In', 'تسجيل الدخول')}</Button></Link>
        </div>
      </div>
    );
  }

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
                {t('Mark all read', 'تعليم الكل كمقروء')}
              </button>
            )}
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border px-3 py-2 rounded-xl hover:text-foreground transition-colors">
                <Settings className="w-3.5 h-3.5" />
                {t('Settings', 'الإعدادات')}
              </button>
            </Link>
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

        {/* Grouped notifications */}
        {Object.keys(grouped).length === 0 ? (
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
                    const cfg = TYPE_CONFIG[notif.type];
                    const hasMedia = notif.meta?.image || notif.meta?.avatar;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${notif.read ? 'bg-card border-border/50 hover:border-border' : 'bg-primary/3 border-primary/20 hover:border-primary/40'}`}
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
                          <p className={`text-sm font-bold leading-snug ${notif.read ? 'text-foreground' : 'text-foreground'}`}>
                            {lang === 'ar' ? notif.titleAr : notif.titleEn}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {lang === 'ar' ? notif.bodyAr : notif.bodyEn}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {t('منذ', 'ago')} {notif.timeAgo}
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

            {notifications.length > 0 && (
              <div className="text-center pt-4 pb-8">
                <button
                  onClick={() => setNotifications([])}
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
    </div>
  );
}
