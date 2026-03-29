import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, CalendarDays, Users, Star, TrendingUp, ChevronRight,
  CheckCircle2, Clock, XCircle, AlertCircle, MessageSquare,
  Utensils, Settings, Bell, Eye, ArrowUpRight, Percent, Gift,
  Tag, Plus, ScanLine, QrCode, ExternalLink, MapPin,
  FileSignature, BadgeCheck, RefreshCw, Ban, Hash, Info, X,
  Sparkles, Image, DollarSign, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const MOCK_STATS = [
  { labelEn: 'Total Bookings', labelAr: 'إجمالي الحجوزات', value: '1,248', change: '+12%', up: true, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
  { labelEn: 'Avg. Rating', labelAr: 'متوسط التقييم', value: '4.7', change: '+0.2', up: true, icon: Star, color: 'text-amber-600 bg-amber-50' },
  { labelEn: 'Total Diners', labelAr: 'إجمالي الزوار', value: '4,891', change: '+8%', up: true, icon: Users, color: 'text-green-600 bg-green-50' },
  { labelEn: 'Revenue (SAR)', labelAr: 'الإيرادات (ر.س)', value: '83,420', change: '+5%', up: true, icon: TrendingUp, color: 'text-primary bg-primary/10' },
];

const MOCK_BOOKINGS = [
  { name: 'Ahmed Al Rashidi', date: '2026-03-29', time: '7:30 PM', guests: 4, status: 'confirmed', ref: 'TBQ-A1B2C3D4' },
  { name: 'Sarah Johnson', date: '2026-03-29', time: '8:00 PM', guests: 2, status: 'confirmed', ref: 'TBQ-E5F6G7H8' },
  { name: 'Mohammed Al Qahtani', date: '2026-03-29', time: '8:30 PM', guests: 6, status: 'pending', ref: 'TBQ-I9J0K1L2' },
  { name: 'Fatima Al Mansouri', date: '2026-03-30', time: '1:00 PM', guests: 3, status: 'confirmed', ref: 'TBQ-M3N4O5P6' },
  { name: 'Ali Hassan', date: '2026-03-30', time: '7:00 PM', guests: 8, status: 'pending', ref: 'TBQ-Q7R8S9T0' },
];

const MOCK_REVIEWS = [
  { name: 'Ahmed K.', rating: 5, text: 'Absolutely incredible experience. The lamb chops were perfectly cooked!', date: '2 hours ago', replied: false },
  { name: 'Noura F.', rating: 4, text: 'Great food and ambiance. Service could be a bit faster during peak hours.', date: '1 day ago', replied: true },
  { name: 'James T.', rating: 5, text: 'Best restaurant in Riyadh by far. Will definitely return.', date: '2 days ago', replied: false },
];

const STATUS_MAP: Record<string, { icon: React.ElementType; labelEn: string; className: string }> = {
  confirmed: { icon: CheckCircle2, labelEn: 'Confirmed', className: 'text-green-700 bg-green-100' },
  pending: { icon: AlertCircle, labelEn: 'Pending', className: 'text-yellow-700 bg-yellow-100' },
  cancelled: { icon: XCircle, labelEn: 'Cancelled', className: 'text-red-700 bg-red-100' },
};

const MOCK_CONSOLE_OFFERS = [
  {
    id: 1, titleEn: '50% Off Premium Dining Set Menu', titleAr: 'خصم 50% على قائمة الطعام المميزة',
    discountPercent: 50, originalPrice: 280, discountedPrice: 140, currency: 'SAR',
    isActive: true, validUntil: '2026-04-30', redemptions: 34, totalCapacity: 100,
    approvalStatus: 'approved' as const, refCode: 'TBQ-OFR-2026-000001',
    commissionOverridePercent: null, paymentModel: null,
  },
  {
    id: 2, titleEn: 'Weekend Brunch for Two', titleAr: 'برانش نهاية الأسبوع لاثنين',
    discountPercent: 30, originalPrice: 220, discountedPrice: 154, currency: 'SAR',
    isActive: false, validUntil: '2026-05-15', redemptions: 0, totalCapacity: 50,
    approvalStatus: 'pending' as const, refCode: 'TBQ-OFR-2026-000002',
    commissionOverridePercent: null, paymentModel: null,
  },
  {
    id: 3, titleEn: 'Family Feast Package', titleAr: 'باقة وليمة العائلة',
    discountPercent: 25, originalPrice: 400, discountedPrice: 300, currency: 'SAR',
    isActive: false, validUntil: '2026-03-31', redemptions: 8, totalCapacity: 30,
    approvalStatus: 'revision_requested' as const, refCode: 'TBQ-OFR-2026-000003',
    commissionOverridePercent: null, paymentModel: null,
  },
];

const MOCK_CONTRACT = {
  refCode: 'TBQ-CTR-2026-000001',
  status: 'active',
  paymentModel: 'full_collection',
  commissionPercent: '15.00',
  settlementDays: 7,
  validFrom: '2026-01-01',
};

type ConsoleTab = 'overview' | 'bookings' | 'offers' | 'reviews' | 'menu' | 'settings';

export function BusinessConsolePage() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<ConsoleTab>('overview');
  const [consoleOffers, setConsoleOffers] = useState(MOCK_CONSOLE_OFFERS);
  const queryClient = useQueryClient();

  // The demo restaurant ID — in production this comes from auth context
  const RESTAURANT_ID = 2;

  // Fetch real offers from the API for this restaurant
  const { data: liveOffersData, refetch: refetchLiveOffers } = useQuery({
    queryKey: ['console-offers', RESTAURANT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/admin/restaurants/${RESTAURANT_ID}/offers`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
    enabled: activeTab === 'offers',
  });

  // Merge: real DB offers first, then mock examples (so new submissions appear at top)
  const displayOffers = liveOffersData?.offers?.length
    ? liveOffersData.offers
    : consoleOffers;

  // Create offer form state
  const EMPTY_FORM = {
    titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
    imageUrl: '', originalPrice: '', discountPercent: '', validFrom: '', validUntil: '',
    totalCapacity: '',
  };
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createSuccess, setCreateSuccess] = useState<{ refCode: string; titleEn: string } | null>(null);

  const discountedPrice = createForm.originalPrice && createForm.discountPercent
    ? Math.round(parseFloat(createForm.originalPrice) * (1 - parseFloat(createForm.discountPercent) / 100))
    : null;

  const createOfferMutation = useMutation({
    mutationFn: async (body: Record<string, any>) => {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to create offer');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCreateSuccess({ refCode: data.offer?.refCode ?? '', titleEn: data.offer?.titleEn ?? '' });
      setCreateForm(EMPTY_FORM);
      refetchLiveOffers();
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
    },
  });

  const tabs: { id: ConsoleTab; labelEn: string; labelAr: string; icon: React.ElementType }[] = [
    { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: BarChart3 },
    { id: 'bookings', labelEn: 'Bookings', labelAr: 'الحجوزات', icon: CalendarDays },
    { id: 'offers', labelEn: 'Offers', labelAr: 'العروض', icon: Tag },
    { id: 'reviews', labelEn: 'Reviews', labelAr: 'التقييمات', icon: MessageSquare },
    { id: 'menu', labelEn: 'Menu', labelAr: 'القائمة', icon: Utensils },
    { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Console Header */}
      <div className="bg-foreground text-background border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-background">Reem Al Bawadi</h1>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-background/60 text-sm">{t('Business Console', 'لوحة تحكم الأعمال')} · Riyadh, Saudi Arabia</p>
                  <span className="font-mono text-xs bg-background/10 text-background/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Hash className="w-3 h-3" /> TBQ-RST-2026-000002
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl hover:bg-background/10 text-background transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              <Link href="/restaurants/2">
                <Button size="sm" variant="outline" className="border-background/30 text-background hover:bg-background/10 gap-2">
                  <Eye className="w-4 h-4" />
                  {t('View Listing', 'عرض القائمة')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border-b border-border sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {lang === 'ar' ? tab.labelAr : tab.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {MOCK_STATS.map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.labelEn} className="bg-card border border-border rounded-2xl p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? stat.labelAr : stat.labelEn}</p>
                    <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.change} {t('vs last month', 'مقارنة بالشهر الماضي')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today's Bookings + Recent Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's bookings */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-bold text-foreground">{t("Today's Bookings", 'حجوزات اليوم')}</h2>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                    {MOCK_BOOKINGS.filter(b => b.date === '2026-03-29').length}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {MOCK_BOOKINGS.filter(b => b.date === '2026-03-29').map(booking => {
                    const st = STATUS_MAP[booking.status];
                    const StatusIcon = st.icon;
                    return (
                      <div key={booking.ref} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm">{booking.guests}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{booking.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.time}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-border">
                  <button onClick={() => setActiveTab('bookings')} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                    {t('View all bookings', 'عرض كل الحجوزات')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-bold text-foreground">{t('Recent Reviews', 'التقييمات الأخيرة')}</h2>
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-amber-700 text-xs font-bold">4.7</span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {MOCK_REVIEWS.map((review, idx) => (
                    <div key={idx} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{review.name}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                          {review.replied && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Replied</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.text}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border">
                  <button onClick={() => setActiveTab('reviews')} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                    {t('Manage reviews', 'إدارة التقييمات')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contract Info Panel */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">{t('Platform Contract', 'عقد المنصة')}</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: t('Contract Ref', 'رقم العقد'), val: MOCK_CONTRACT.refCode, mono: true },
                    { label: t('Commission Rate', 'نسبة العمولة'), val: `${MOCK_CONTRACT.commissionPercent}%`, highlight: true },
                    { label: t('Payment Model', 'نموذج الدفع'), val: MOCK_CONTRACT.paymentModel.replace(/_/g, ' '), capitalize: true },
                    { label: t('Settlement', 'التسوية'), val: `${MOCK_CONTRACT.settlementDays} days` },
                  ].map(item => (
                    <div key={item.label} className="bg-secondary/40 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className={`font-semibold text-sm ${item.mono ? 'font-mono text-xs' : ''} ${item.highlight ? 'text-primary' : 'text-foreground'} ${item.capitalize ? 'capitalize' : ''}`}>
                        {item.val}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <BadgeCheck className="w-3 h-3" /> {t('Active Contract', 'عقد نشط')}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('Valid from', 'صالح من')} {MOCK_CONTRACT.validFrom}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="font-bold text-foreground mb-4">{t('Quick Actions', 'إجراءات سريعة')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: CalendarDays, labelEn: 'Manage Availability', labelAr: 'إدارة التوفر', color: 'bg-blue-50 text-blue-600' },
                  { icon: Percent, labelEn: 'Create an Offer', labelAr: 'إنشاء عرض', color: 'bg-primary/10 text-primary' },
                  { icon: Gift, labelEn: 'Issue Vouchers', labelAr: 'إصدار قسائم', color: 'bg-purple-50 text-purple-600' },
                  { icon: Utensils, labelEn: 'Update Menu', labelAr: 'تحديث القائمة', color: 'bg-green-50 text-green-600' },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <button key={action.labelEn} className="flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? action.labelAr : action.labelEn}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{t('All Bookings', 'كل الحجوزات')}</h2>
              <div className="flex gap-2">
                {['All', 'Today', 'Upcoming', 'Pending'].map(f => (
                  <button key={f} className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-colors ${f === 'All' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">{t('Guest', 'الضيف')}</th>
                    <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">{t('Date & Time', 'التاريخ والوقت')}</th>
                    <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">{t('Guests', 'الأشخاص')}</th>
                    <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">{t('Reference', 'المرجع')}</th>
                    <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">{t('Status', 'الحالة')}</th>
                    <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_BOOKINGS.map(booking => {
                    const st = STATUS_MAP[booking.status];
                    const StatusIcon = st.icon;
                    return (
                      <tr key={booking.ref} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-sm">
                              {booking.name[0]}
                            </div>
                            <span className="font-medium text-foreground text-sm">{booking.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{booking.date} · {booking.time}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            {booking.guests}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{booking.ref}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {st.labelEn}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <button className="text-xs font-semibold text-green-600 hover:underline">Accept</button>
                              <button className="text-xs font-semibold text-red-600 hover:underline">Decline</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{t('Guest Reviews', 'تقييمات الضيوف')}</h2>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-amber-700">4.7</span>
                <span className="text-amber-600/70 text-sm">avg rating</span>
              </div>
            </div>
            {MOCK_REVIEWS.map((review, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shrink-0">
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{review.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  {review.replied ? (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold shrink-0">{t('Replied', 'تم الرد')}</span>
                  ) : (
                    <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold shrink-0 hover:bg-primary/90 transition-colors">{t('Reply', 'رد')}</button>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-5">

            {/* ── Create Offer Drawer ── */}
            {showCreateForm && (
              <div className="fixed inset-0 z-50 flex" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateForm(false); setCreateSuccess(null); }} />
                <div className="w-full max-w-xl bg-card border-s border-border h-full overflow-y-auto shadow-2xl flex flex-col">
                  {/* Drawer header */}
                  <div className="px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{t('Create New Offer', 'إنشاء عرض جديد')}</h3>
                        <p className="text-xs text-muted-foreground">{t('Submitted for admin review', 'يُرسل للمراجعة من قبل فريق طبق')}</p>
                      </div>
                    </div>
                    <button onClick={() => { setShowCreateForm(false); setCreateSuccess(null); }} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Success state */}
                  {createSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mb-4">
                        <BadgeCheck className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{t('Offer Submitted!', 'تم إرسال العرض!')}</h3>
                      <p className="text-muted-foreground mb-1 text-sm">{createSuccess.titleEn}</p>
                      {createSuccess.refCode && (
                        <p className="font-mono text-xs bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground mb-4">{createSuccess.refCode}</p>
                      )}
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('Your offer is now pending review by the Tabaq team. You\'ll be notified once it\'s approved.', 'عرضك الآن في انتظار مراجعة فريق طبق. سيتم إخطارك بمجرد الموافقة عليه.')}
                      </p>
                      <div className="flex gap-3 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => { setCreateSuccess(null); setCreateForm(EMPTY_FORM); }}>
                          {t('Create Another', 'إنشاء عرض آخر')}
                        </Button>
                        <Button className="flex-1" onClick={() => { setShowCreateForm(false); setCreateSuccess(null); }}>
                          {t('Done', 'تم')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 p-6 space-y-5">
                      {/* Offer titles */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('Offer Name', 'اسم العرض')}</p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">English Title *</label>
                            <input type="text" placeholder="e.g. 50% Off Premium Dinner for Two"
                              value={createForm.titleEn}
                              onChange={e => setCreateForm(f => ({ ...f, titleEn: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Arabic Title * (العنوان بالعربية)</label>
                            <input type="text" placeholder="مثال: خصم 50% على عشاء مميز لشخصين" dir="rtl"
                              value={createForm.titleAr}
                              onChange={e => setCreateForm(f => ({ ...f, titleAr: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right" />
                          </div>
                        </div>
                      </div>

                      {/* Descriptions */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('Description', 'الوصف')}</p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">English Description</label>
                            <textarea rows={3} placeholder="Describe what's included in this offer..."
                              value={createForm.descriptionEn}
                              onChange={e => setCreateForm(f => ({ ...f, descriptionEn: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Arabic Description (الوصف بالعربية)</label>
                            <textarea rows={3} dir="rtl" placeholder="اوصف ما يتضمنه هذا العرض..."
                              value={createForm.descriptionAr}
                              onChange={e => setCreateForm(f => ({ ...f, descriptionAr: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-right" />
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5" />{t('Pricing', 'التسعير')}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Original Price (SAR) *</label>
                            <input type="number" step="1" placeholder="380"
                              value={createForm.originalPrice}
                              onChange={e => setCreateForm(f => ({ ...f, originalPrice: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Discount %</label>
                            <input type="number" step="5" min="1" max="90" placeholder="30"
                              value={createForm.discountPercent}
                              onChange={e => setCreateForm(f => ({ ...f, discountPercent: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                        </div>
                        {discountedPrice !== null && (
                          <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                            <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" />
                            <p className="text-sm text-green-800">
                              {t('Customer pays:', 'يدفع العميل:')} <span className="font-bold">SAR {discountedPrice}</span>
                              <span className="text-green-600 ms-2">({t('saves', 'يوفر')} SAR {parseFloat(createForm.originalPrice) - discountedPrice})</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dates & Capacity */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />{t('Dates & Capacity', 'التواريخ والسعة')}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Valid From *</label>
                            <input type="date" value={createForm.validFrom}
                              onChange={e => setCreateForm(f => ({ ...f, validFrom: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Valid Until *</label>
                            <input type="date" value={createForm.validUntil}
                              onChange={e => setCreateForm(f => ({ ...f, validUntil: e.target.value }))}
                              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">Total Vouchers Available</label>
                          <input type="number" step="1" placeholder="e.g. 100 (leave blank for unlimited)"
                            value={createForm.totalCapacity}
                            onChange={e => setCreateForm(f => ({ ...f, totalCapacity: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>

                      {/* Image */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Image className="w-3.5 h-3.5" />{t('Cover Image', 'صورة الغلاف')}
                        </p>
                        <input type="url" placeholder="https://images.unsplash.com/..."
                          value={createForm.imageUrl}
                          onChange={e => setCreateForm(f => ({ ...f, imageUrl: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        {createForm.imageUrl && (
                          <img src={createForm.imageUrl} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />
                        )}
                      </div>

                      {/* Approval info */}
                      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-800">
                          {t('Your offer will be reviewed by the Tabaq team before going live. This usually takes 1–2 business days.', 'سيتم مراجعة عرضك من قبل فريق طبق قبل نشره. عادةً ما يستغرق ذلك 1-2 أيام عمل.')}
                        </p>
                      </div>

                      {/* Error */}
                      {createOfferMutation.isError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {(createOfferMutation.error as Error)?.message ?? t('Something went wrong', 'حدث خطأ ما')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit button */}
                  {!createSuccess && (
                    <div className="p-6 border-t border-border sticky bottom-0 bg-card">
                      <Button
                        className="w-full gap-2"
                        disabled={!createForm.titleEn || !createForm.titleAr || !createForm.originalPrice || !createForm.validFrom || !createForm.validUntil || createOfferMutation.isPending}
                        onClick={() => createOfferMutation.mutate({
                          restaurantId: RESTAURANT_ID,
                          titleEn: createForm.titleEn,
                          titleAr: createForm.titleAr,
                          descriptionEn: createForm.descriptionEn || undefined,
                          descriptionAr: createForm.descriptionAr || undefined,
                          imageUrl: createForm.imageUrl || undefined,
                          originalPrice: parseFloat(createForm.originalPrice),
                          discountPercent: createForm.discountPercent ? parseFloat(createForm.discountPercent) : undefined,
                          discountedPrice: discountedPrice || undefined,
                          validFrom: createForm.validFrom,
                          validUntil: createForm.validUntil,
                          totalCapacity: createForm.totalCapacity ? parseInt(createForm.totalCapacity) : undefined,
                        })}
                      >
                        {createOfferMutation.isPending ? (
                          <>{t('Submitting...', 'جارٍ الإرسال...')}</>
                        ) : (
                          <><Sparkles className="w-4 h-4" /> {t('Submit for Approval', 'إرسال للموافقة')}</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('My Offers', 'عروضي')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('Manage exclusive deals for your restaurant', 'إدارة العروض الحصرية لمطعمك')}
                </p>
              </div>
              <Button className="gap-2" size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                {t('Create Offer', 'إنشاء عرض')}
              </Button>
            </div>

            {/* Approval process notice */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                {t('New offers are reviewed by the Tabaq team before going live. Approved offers are automatically activated.', 'تتم مراجعة العروض الجديدة من قبل فريق طبق قبل نشرها. العروض المعتمدة يتم تفعيلها تلقائياً.')}
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('Active', 'نشط'), val: (displayOffers as any[]).filter((o: any) => o.isActive).length, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: t('Pending Review', 'في انتظار المراجعة'), val: (displayOffers as any[]).filter((o: any) => o.approvalStatus === 'pending').length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: t('Total Redemptions', 'إجمالي الاستخدامات'), val: (displayOffers as any[]).reduce((a: number, o: any) => a + (o.redemptions ?? 0), 0), color: 'bg-primary/5 text-primary border-primary/20' },
                { label: t('Total Offers', 'إجمالي العروض'), val: (displayOffers as any[]).length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl p-4 ${s.color}`}>
                  <p className="text-2xl font-extrabold">{s.val}</p>
                  <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
                </div>
              ))}
            </div>

            {!(displayOffers as any[]).length && (
              <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
                <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-foreground">{t('No offers yet', 'لا توجد عروض بعد')}</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{t('Create your first exclusive offer for customers', 'أنشئ أول عرض حصري لعملائك')}</p>
                <Button size="sm" onClick={() => setShowCreateForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> {t('Create First Offer', 'إنشاء أول عرض')}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {(displayOffers as any[]).map((offer: any) => (
                <div key={offer.id} className={`bg-card border rounded-2xl p-5 flex gap-4 items-start ${offer.approvalStatus === 'revision_requested' ? 'border-amber-300' : offer.approvalStatus === 'rejected' ? 'border-red-300' : 'border-border'}`}>
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Tag className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground">{lang === 'ar' ? offer.titleAr : offer.titleEn}</p>
                          {/* Approval Status Badge */}
                          {offer.approvalStatus === 'approved' && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              <BadgeCheck className="w-3 h-3" /> {t('Approved', 'معتمد')}
                            </span>
                          )}
                          {offer.approvalStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> {t('Pending Review', 'في انتظار المراجعة')}
                            </span>
                          )}
                          {offer.approvalStatus === 'rejected' && (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              <Ban className="w-3 h-3" /> {t('Rejected', 'مرفوض')}
                            </span>
                          )}
                          {offer.approvalStatus === 'revision_requested' && (
                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              <RefreshCw className="w-3 h-3" /> {t('Revision Requested', 'طلب مراجعة')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{offer.refCode}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                            -{offer.discountPercent}% OFF
                          </span>
                          <span>
                            <span className="font-semibold text-foreground">{offer.currency} {offer.discountedPrice}</span>
                            <span className="line-through ms-1.5">{offer.originalPrice}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t('Expires', 'ينتهي')} {offer.validUntil}
                          </span>
                        </div>

                        {/* Revision notice */}
                        {offer.approvalStatus === 'revision_requested' && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                            <p className="font-semibold mb-0.5">{t('Revision Required:', 'مطلوب مراجعة:')}</p>
                            <p>{t('Please review the offer details and update before resubmitting.', 'يرجى مراجعة تفاصيل العرض وتحديثه قبل إعادة الإرسال.')}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {offer.approvalStatus === 'approved' && (
                          <>
                            <div className="text-end">
                              <p className="text-sm font-bold text-foreground">{offer.redemptions} / {offer.totalCapacity}</p>
                              <p className="text-xs text-muted-foreground">{t('Redeemed', 'استُخدم')}</p>
                            </div>
                            <button
                              onClick={() => setConsoleOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o))}
                              className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${offer.isActive ? 'bg-primary' : 'bg-muted'}`}
                            >
                              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${offer.isActive ? 'start-[22px]' : 'start-0.5'}`} />
                            </button>
                          </>
                        )}
                        <button className="p-2 rounded-xl hover:bg-secondary transition-colors">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Redemption progress — only for approved active */}
                    {offer.approvalStatus === 'approved' && offer.redemptions > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min((offer.redemptions / offer.totalCapacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{t('Redemption Scanner', 'ماسح الاستخدام')}</p>
                <p className="text-sm text-muted-foreground">{t('Scan customer QR codes at the restaurant to validate offers', 'امسح رموز QR للعملاء في المطعم للتحقق من العروض')}</p>
              </div>
              <Button size="sm" className="gap-2 shrink-0">
                <ScanLine className="w-4 h-4" />
                {t('Open Scanner', 'فتح الماسح')}
              </Button>
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t('Menu Management', 'إدارة القائمة')}</h3>
            <p className="text-muted-foreground mb-6">{t('Add, edit, and manage your menu items and categories.', 'أضف وعدّل وأدر عناصر القائمة والفئات.')}</p>
            <Button>{t('Manage Menu', 'إدارة القائمة')}</Button>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-foreground">{t('Restaurant Settings', 'إعدادات المطعم')}</h2>
            {[
              { labelEn: 'Restaurant Name', labelAr: 'اسم المطعم', value: 'Reem Al Bawadi' },
              { labelEn: 'Phone Number', labelAr: 'رقم الهاتف', value: '+966 11 234 5678' },
              { labelEn: 'Address', labelAr: 'العنوان', value: 'King Fahd Road, Riyadh' },
              { labelEn: 'Opening Hours', labelAr: 'أوقات العمل', value: '12:00 PM – 11:00 PM' },
            ].map(field => (
              <div key={field.labelEn} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">{lang === 'ar' ? field.labelAr : field.labelEn}</p>
                  <p className="font-semibold text-foreground">{field.value}</p>
                </div>
                <Button size="sm" variant="outline">{t('Edit', 'تعديل')}</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
