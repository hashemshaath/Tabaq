import React, { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '@/lib/api';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, CalendarDays, Users, Star, TrendingUp, ChevronRight,
  CheckCircle2, Clock, XCircle, AlertCircle, MessageSquare,
  Utensils, Settings, Bell, Eye, ArrowUpRight, Percent, Gift,
  Tag, Plus, ScanLine, QrCode, ExternalLink, MapPin,
  FileSignature, BadgeCheck, RefreshCw, Ban, Hash, Info, X,
  Sparkles, Image, DollarSign, Calendar, ChevronLeft, Save,
  Upload, Trash2, Check, LayoutDashboard, Ticket, LogOut,
  ChevronDown, Search, Download, Camera, Smartphone, MousePointer2,
  Globe, Phone, MessageCircle, MoreVertical, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/StarRating';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// ─── QR Code Display (Copied from OffersPage) ──────────────────────────────
function QRCodeDisplay({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const size = 160; c.width = size; c.height = size;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    const seed = code.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const cells = 21; const cellSize = size / cells;
    for (let r = 0; r < cells; r++) {
      for (let col = 0; col < cells; col++) {
        const isCorner = (r < 7 && col < 7) || (r < 7 && col >= cells - 7) || (r >= cells - 7 && col < 7);
        if (isCorner) {
          const inInner2 = (r >= 2 && r <= 4 && col >= 2 && col <= 4) || (r >= 2 && r <= 4 && col >= cells - 5 && col <= cells - 3) || (r >= cells - 5 && r <= cells - 3 && col >= 2 && col <= 4);
          const inInner = (r >= 1 && r <= 5 && col >= 1 && col <= 5) || (r >= 1 && r <= 5 && col >= cells - 6 && col <= cells - 2) || (r >= cells - 6 && r <= cells - 2 && col >= 1 && col <= 5);
          ctx.fillStyle = inInner2 ? '#111' : inInner ? '#fff' : '#111';
          ctx.fillRect(col * cellSize, r * cellSize, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#111';
          const hash = (seed * (r * cells + col + 1) * 2654435761) >>> 0;
          if (hash % 2 === 0) ctx.fillRect(col * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [code]);
  return <canvas ref={canvasRef} className="rounded-md mx-auto" style={{ width: 160, height: 160 }} />;
}

const STATUS_MAP: Record<string, { icon: React.ElementType; labelEn: string; className: string }> = {
  confirmed: { icon: CheckCircle2, labelEn: 'Confirmed', className: 'text-green-700 bg-green-100' },
  pending: { icon: AlertCircle, labelEn: 'Pending', className: 'text-yellow-700 bg-yellow-100' },
  cancelled: { icon: XCircle, labelEn: 'Cancelled', className: 'text-red-700 bg-red-100' },
};

const CAMPAIGN_STATUS_MAP: Record<string, { labelEn: string; labelAr: string; className: string }> = {
  draft: { labelEn: 'Draft', labelAr: 'مسودة', className: 'text-gray-600 bg-gray-100' },
  submitted: { labelEn: 'Submitted', labelAr: 'تم التقديم', className: 'text-blue-600 bg-blue-50' },
  under_review: { labelEn: 'Under Review', labelAr: 'قيد المراجعة', className: 'text-amber-600 bg-amber-50' },
  approved: { labelEn: 'Approved', labelAr: 'تمت الموافقة', className: 'text-green-600 bg-green-50' },
  live: { labelEn: 'Live', labelAr: 'مباشر', className: 'text-primary bg-primary/10' },
  paused: { labelEn: 'Paused', labelAr: 'متوقف مؤقتاً', className: 'text-yellow-600 bg-yellow-50' },
  ended: { labelEn: 'Ended', labelAr: 'منتهي', className: 'text-gray-400 bg-gray-50' },
  rejected: { labelEn: 'Rejected', labelAr: 'مرفوض', className: 'text-red-600 bg-red-50' },
};

const VOUCHER_STATUS_MAP: Record<string, { labelEn: string; labelAr: string; className: string }> = {
  active: { labelEn: 'Active', labelAr: 'نشط', className: 'text-green-600 bg-green-50' },
  redeemed: { labelEn: 'Redeemed', labelAr: 'تم استخدامه', className: 'text-blue-600 bg-blue-50' },
  used: { labelEn: 'Used', labelAr: 'مستخدم', className: 'text-blue-600 bg-blue-50' },
  expired: { labelEn: 'Expired', labelAr: 'منتهي', className: 'text-gray-400 bg-gray-50' },
  refunded: { labelEn: 'Refunded', labelAr: 'مسترجع', className: 'text-red-600 bg-red-50' },
};

type ConsoleTab = 'overview' | 'bookings' | 'campaigns' | 'offers' | 'vouchers' | 'reviews' | 'menu' | 'settings';

export function BusinessConsolePage() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<ConsoleTab>('overview');
  const [activeCampaignFilter, setActiveCampaignFilter] = useState('All');
  const [activeVoucherFilter, setActiveVoucherFilter] = useState('All');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<any>({
    type: 'discount_deal',
    options: [{ nameEn: '', nameAr: '', originalPrice: '', dealPrice: '', initialCap: '', monthlyCap: '', validityDays: '60' }],
    images: [],
    highlights: ['', '', ''],
    descriptionEn: '',
    descriptionAr: '',
    redemptionMethod: 'on_site',
    requiresReservation: false,
  });

  const [redeemCode, setRedeemCode] = useState('');
  const [redeemResult, setRedeemResult] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch the restaurant owned by the logged-in user
  const { data: myRestaurantData, isLoading: restaurantLoading } = useQuery({
    queryKey: ['me-restaurant'],
    queryFn: async () => {
      const res = await fetch('/api/me/restaurant', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 300000,
  });
  const myRestaurant = myRestaurantData?.restaurant ?? null;
  const RESTAURANT_ID = myRestaurant?.id ?? 2;

  // Real campaigns
  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ['console-campaigns', RESTAURANT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?restaurantId=${RESTAURANT_ID}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: activeTab === 'campaigns',
  });

  // Real vouchers
  const { data: vouchersData } = useQuery({
    queryKey: ['console-vouchers', RESTAURANT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/redemptions?restaurantId=${RESTAURANT_ID}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: activeTab === 'vouchers',
  });

  // Real stats for this restaurant
  const { data: statsData } = useQuery({
    queryKey: ['console-stats', RESTAURANT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats`, { headers: getAuthHeaders() }); // In production this would be restaurant specific
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  // Real bookings for this restaurant
  const { data: bookingsData } = useQuery({
    queryKey: ['console-bookings', RESTAURANT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${RESTAURANT_ID}/bookings?limit=50`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
  });

  // Real reviews for this restaurant
  const { data: reviewsData } = useQuery({
    queryKey: ['console-reviews', RESTAURANT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?restaurantId=${RESTAURANT_ID}&limit=20`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
  });

  // Real contract for this restaurant
  const { data: contractData } = useQuery({
    queryKey: ['console-contract', RESTAURANT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${RESTAURANT_ID}/contract`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  const liveBookings: any[] = bookingsData?.bookings ?? [];
  const liveReviews: any[] = reviewsData?.reviews ?? [];
  const liveContract = contractData?.contract ?? null;
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = liveBookings.filter((b: any) => b.date === today);

  const displayCampaigns: any[] = campaignsData?.campaigns ?? [];
  const filteredCampaigns = displayCampaigns.filter((c: any) =>
    activeCampaignFilter === 'All' ? true : c.status === activeCampaignFilter.toLowerCase().replace(/ /g, '_')
  );

  const displayVouchers: any[] = vouchersData?.vouchers ?? [];
  const filteredVouchers = displayVouchers.filter((v: any) =>
    activeVoucherFilter === 'All' ? true : v.status === activeVoucherFilter.toLowerCase()
  );

  const liveStats = statsData ? [
    { labelEn: 'Total Bookings', labelAr: 'إجمالي الحجوزات', value: statsData.stats.totalBookings.toLocaleString(), change: 'Live data', up: true, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { labelEn: 'Avg. Rating', labelAr: 'متوسط التقييم', value: statsData.stats.avgPlatformRating, change: `${statsData.stats.totalReviews} reviews`, up: true, icon: Star, color: 'text-amber-600 bg-amber-50' },
    { labelEn: 'Total Diners', labelAr: 'إجمالي الزوار', value: statsData.stats.totalUsers.toLocaleString(), change: 'Live data', up: true, icon: Users, color: 'text-green-600 bg-green-50' },
    { labelEn: 'Active Offers', labelAr: 'عروض نشطة', value: statsData.stats.activeOffers.toString(), change: 'Live data', up: true, icon: Tag, color: 'text-primary bg-primary/10' },
  ] : [];

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
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
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
      refetchCampaigns();
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
    },
  });

  const tabs: { id: ConsoleTab; labelEn: string; labelAr: string; icon: React.ElementType }[] = [
    { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: BarChart3 },
    { id: 'bookings', labelEn: 'Bookings', labelAr: 'الحجوزات', icon: CalendarDays },
    { id: 'campaigns', labelEn: 'Campaigns', labelAr: 'الحملات', icon: Tag },
    { id: 'vouchers', labelEn: 'Vouchers', labelAr: 'القسائم', icon: Ticket },
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
                  <h1 className="text-xl font-bold text-background">
                    {restaurantLoading ? (
                      <span className="inline-block w-40 h-5 bg-background/20 animate-pulse rounded" />
                    ) : (
                      lang === 'ar' ? (myRestaurant?.nameAr ?? 'لوحة تحكم المطعم') : (myRestaurant?.nameEn ?? 'Restaurant Console')
                    )}
                  </h1>
                  {myRestaurant?.isVerified && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-background/60 text-sm">{t('Business Console', 'لوحة تحكم الأعمال')}</p>
                  {myRestaurant?.refCode && (
                    <span className="font-mono text-xs bg-background/10 text-background/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {myRestaurant.refCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl hover:bg-background/10 text-background transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              <Link href={`/restaurants/${RESTAURANT_ID}`}>
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
              {liveStats.map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.labelEn} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
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

            {/* today's bookings + Recent Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* today's bookings */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-bold text-foreground">{t("Today's Bookings", 'حجوزات اليوم')}</h2>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                    {todayBookings.length}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {todayBookings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">{t('No bookings today', 'لا توجد حجوزات اليوم')}</p>
                  )}
                  {todayBookings.map((booking: any) => {
                    const st = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
                    const StatusIcon = st.icon;
                    return (
                      <div key={booking.id ?? booking.ref} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm">{booking.partySize ?? booking.guests}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate font-mono">{booking.referenceCode ?? booking.refCode ?? booking.ref}</p>
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
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-bold text-foreground">{t('Recent Reviews', 'التقييمات الأخيرة')}</h2>
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-amber-700 text-xs font-bold">{statsData ? parseFloat(statsData.stats.avgPlatformRating).toFixed(1) : '4.7'}</span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {liveReviews.slice(0, 3).map((review: any, idx: number) => (
                    <div key={review.id ?? idx} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{(lang === 'ar' ? review.userNameAr : review.userNameEn) ?? review.name ?? `User #${review.userId}`}</p>
                          <StarRating rating={Math.round(parseFloat(review.ratingOverall ?? review.rating ?? 0))} size="xs" className="mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{review.date ?? (review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '')}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{lang === 'ar' ? (review.textAr ?? review.text) : (review.textEn ?? review.text)}</p>
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
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">{t('Platform Contract', 'عقد المنصة')}</h2>
              </div>
              <div className="p-5">
                {liveContract ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: t('Contract Ref', 'رقم العقد'), val: liveContract.refCode, mono: true },
                        { label: t('Commission Rate', 'نسبة العمولة'), val: `${liveContract.commissionPercent}%`, highlight: true },
                        { label: t('Payment Model', 'نموذج الدفع'), val: (liveContract.paymentModel ?? '').replace(/_/g, ' '), capitalize: true },
                        { label: t('Settlement', 'التسوية'), val: `${liveContract.settlementDays} days` },
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
                      <span className="text-xs text-muted-foreground">{t('Valid from', 'صالح من')} {liveContract.validFrom ? new Date(liveContract.validFrom).toLocaleDateString() : '—'}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t('No contract on file', 'لا يوجد عقد مسجل')}</p>
                  </div>
                )}
              </div>
            </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-bold text-foreground mb-4">{t('Quick Actions', 'إجراءات سريعة')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button 
              onClick={() => { setActiveTab('campaigns'); setShowWizard(true); }}
              className="flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all text-center"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t('New Campaign', 'حملة جديدة')}</p>
            </button>
            <button 
              onClick={() => { setActiveTab('vouchers'); }}
              className="flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all text-center"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
                <QrCode className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t('Redeem Voucher', 'تحقق من القسيمة')}</p>
            </button>
            {[
              { icon: CalendarDays, labelEn: 'Manage Availability', labelAr: 'إدارة التوفر', color: 'bg-green-50 text-green-600' },
              { icon: MessageSquare, labelEn: 'Reviews', labelAr: 'التقييمات', color: 'bg-amber-50 text-amber-600' },
              { icon: Utensils, labelEn: 'Update Menu', labelAr: 'تحديث القائمة', color: 'bg-purple-50 text-purple-600' },
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

        {/* Quick Redeem Section */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">{t('Quick Redemption', 'التحقق السريع')}</h3>
            <p className="text-sm text-muted-foreground">{t('Enter voucher code or scan QR to mark as redeemed.', 'أدخل رمز القسيمة أو امسح الرمز للتأكيد.')}</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="VCH-XXXX-XXXX" 
                className="pl-9 bg-background uppercase font-mono"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
              />
            </div>
            <Button className="gap-2" onClick={() => { setActiveTab('vouchers'); }}>
              <Check className="w-4 h-4" />
              {t('Redeem', 'تحقق')}
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Campaign Management', 'إدارة الحملات')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t('Create and monitor your marketing deals', 'إنشاء ومراقبة عروضك التسويقية')}</p>
              </div>
              <Button className="gap-2" onClick={() => setShowWizard(true)}>
                <Plus className="w-4 h-4" />
                {t('New Campaign', 'حملة جديدة')}
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {['All', 'Draft', 'Under Review', 'Live', 'Paused', 'Ended', 'Rejected'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveCampaignFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeCampaignFilter === f 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t(f, f)}
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Campaign', 'الحملة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Status', 'الحالة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Duration', 'المدة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Performance', 'الأداء')}</th>
                      <th className="text-end px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Actions', 'الإجراءات')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCampaigns.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Tag className="w-10 h-10 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">{t('No campaigns found in this category.', 'لم يتم العثور على حملات في هذه الفئة.')}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredCampaigns.map((campaign: any) => {
                      const st = CAMPAIGN_STATUS_MAP[campaign.status] || CAMPAIGN_STATUS_MAP.draft;
                      return (
                        <tr key={campaign.id} className="hover:bg-secondary/10 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
                                {campaign.imageUrl ? (
                                  <img src={campaign.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                    <Sparkles className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-sm line-clamp-1">{lang === 'ar' ? campaign.titleAr : campaign.titleEn}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{campaign.refCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className={`${st.className} border-none shadow-none px-2.5 py-0.5`}>
                              {lang === 'ar' ? st.labelAr : st.labelEn}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            <div className="flex flex-col gap-0.5">
                              <span>{new Date(campaign.startAt || campaign.validFrom).toLocaleDateString()}</span>
                              <span className="opacity-60">{t('to', 'إلى')} {new Date(campaign.endAt || campaign.validUntil).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1.5 min-w-[120px]">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                                <span className="text-muted-foreground">{t('Sold', 'مباع')}</span>
                                <span className="text-foreground">{campaign.redemptions || 0} / {campaign.totalCapacity || '∞'}</span>
                              </div>
                              <Progress value={campaign.totalCapacity ? ((campaign.redemptions || 0) / campaign.totalCapacity) * 100 : 0} className="h-1.5" />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-end">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Vouchers Tab */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Voucher Management', 'إدارة القسائم')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t('Track and redeem customer vouchers', 'تتبع وتحقق من قسائم العملاء')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  {t('Export CSV', 'تصدير CSV')}
                </Button>
                <Button className="gap-2" onClick={() => document.getElementById('redeem-input')?.focus()}>
                  <ScanLine className="w-4 h-4" />
                  {t('Quick Redeem', 'تحقق سريع')}
                </Button>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
              <div className="max-w-xl mx-auto space-y-4">
                <div className="text-center space-y-1 mb-4">
                  <h3 className="font-bold text-foreground">{t('Redeem a Voucher', 'التحقق من القسيمة')}</h3>
                  <p className="text-xs text-muted-foreground">{t('Scan QR code or enter the 12-digit voucher code below', 'امسح الرمز أو أدخل رمز القسيمة المكون من 12 رقماً أدناه')}</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="redeem-input"
                      placeholder="VCH-XXXX-XXXX" 
                      className="pl-9 bg-background h-12 text-lg font-mono uppercase tracking-widest"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                    />
                  </div>
                  <Button size="lg" className="px-8 h-12" onClick={() => {
                    const v = displayVouchers.find((v: any) => v.code.toLowerCase() === redeemCode.toLowerCase());
                    if (v) setRedeemResult(v);
                    else toast.error(t('Invalid voucher code', 'رمز القسيمة غير صالح'));
                  }}>
                    {t('Verify', 'تحقق')}
                  </Button>
                </div>
              </div>
            </div>

            {redeemResult && (
              <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      {redeemResult.code}
                    </CardTitle>
                    <CardDescription>{redeemResult.campaignNameEn} · {redeemResult.optionNameEn}</CardDescription>
                  </div>
                  <Badge className={VOUCHER_STATUS_MAP[redeemResult.status]?.className}>
                    {VOUCHER_STATUS_MAP[redeemResult.status]?.labelEn}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Customer', 'العميل')}</p>
                      <p className="text-sm font-semibold">{redeemResult.customerName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Purchase Date', 'تاريخ الشراء')}</p>
                      <p className="text-sm font-semibold">{redeemResult.purchaseDate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Face Value', 'القيمة')}</p>
                      <p className="text-sm font-semibold text-primary">{redeemResult.faceValue} SAR</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Paid Price', 'سعر الشراء')}</p>
                      <p className="text-sm font-semibold">{redeemResult.purchasePrice} SAR</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-secondary/20 pt-4 flex justify-between gap-3">
                  <Button variant="ghost" onClick={() => setRedeemResult(null)}>{t('Cancel', 'إلغاء')}</Button>
                  <Button 
                    className="flex-1 gap-2" 
                    disabled={redeemResult.status !== 'active'}
                    onClick={() => {
                      toast.success(t('Voucher redeemed successfully!', 'تم التحقق من القسيمة بنجاح!'));
                      setRedeemResult(null);
                      setRedeemCode('');
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('Confirm Redemption', 'تأكيد الاستخدام')}
                  </Button>
                </CardFooter>
              </Card>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {['All', 'Active', 'Redeemed', 'Expired', 'Refunded'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveVoucherFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeVoucherFilter === f 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t(f, f)}
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Voucher Code', 'رمز القسيمة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Campaign / Option', 'الحملة / الخيار')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Customer', 'العميل')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Value', 'القيمة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Status', 'الحالة')}</th>
                      <th className="text-end px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredVouchers.map((voucher: any) => (
                      <tr key={voucher.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-foreground">{voucher.code}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground line-clamp-1">{voucher.campaignNameEn}</span>
                            <span className="text-xs text-muted-foreground">{voucher.optionNameEn}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-foreground">{voucher.customerName}</span>
                            <span className="text-xs text-muted-foreground">{voucher.purchaseDate}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-primary">{voucher.purchasePrice} SAR</span>
                            <span className="text-[10px] text-muted-foreground line-through opacity-60">{voucher.faceValue} SAR</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={`${VOUCHER_STATUS_MAP[voucher.status]?.className} border-none shadow-none`}>
                            {lang === 'ar' ? VOUCHER_STATUS_MAP[voucher.status]?.labelAr : VOUCHER_STATUS_MAP[voucher.status]?.labelEn}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Campaign Management', 'إدارة الحملات')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t('Create and monitor your marketing deals', 'إنشاء ومراقبة عروضك التسويقية')}</p>
              </div>
              <Button className="gap-2" onClick={() => setShowWizard(true)}>
                <Plus className="w-4 h-4" />
                {t('New Campaign', 'حملة جديدة')}
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {['All', 'Draft', 'Under Review', 'Live', 'Paused', 'Ended', 'Rejected'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveCampaignFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeCampaignFilter === f 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t(f, f)}
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Campaign', 'الحملة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Status', 'الحالة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Duration', 'المدة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Performance', 'الأداء')}</th>
                      <th className="text-end px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Actions', 'الإجراءات')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCampaigns.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Tag className="w-10 h-10 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">{t('No campaigns found in this category.', 'لم يتم العثور على حملات في هذه الفئة.')}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredCampaigns.map((campaign: any) => {
                      const st = CAMPAIGN_STATUS_MAP[campaign.status] || CAMPAIGN_STATUS_MAP.draft;
                      return (
                        <tr key={campaign.id} className="hover:bg-secondary/10 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
                                {campaign.imageUrl ? (
                                  <img src={campaign.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                    <Sparkles className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-sm line-clamp-1">{lang === 'ar' ? campaign.titleAr : campaign.titleEn}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{campaign.refCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className={`${st.className} border-none shadow-none px-2.5 py-0.5`}>
                              {lang === 'ar' ? st.labelAr : st.labelEn}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            <div className="flex flex-col gap-0.5">
                              <span>{new Date(campaign.startAt || campaign.validFrom).toLocaleDateString()}</span>
                              <span className="opacity-60">{t('to', 'إلى')} {new Date(campaign.endAt || campaign.validUntil).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1.5 min-w-[120px]">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                                <span className="text-muted-foreground">{t('Sold', 'مباع')}</span>
                                <span className="text-foreground">{campaign.redemptions || 0} / {campaign.totalCapacity || '∞'}</span>
                              </div>
                              <Progress value={campaign.totalCapacity ? ((campaign.redemptions || 0) / campaign.totalCapacity) * 100 : 0} className="h-1.5" />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-end">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Vouchers Tab */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Voucher Management', 'إدارة القسائم')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t('Track and redeem customer vouchers', 'تتبع وتحقق من قسائم العملاء')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  {t('Export CSV', 'تصدير CSV')}
                </Button>
                <Button className="gap-2" onClick={() => document.getElementById('redeem-input')?.focus()}>
                  <ScanLine className="w-4 h-4" />
                  {t('Quick Redeem', 'تحقق سريع')}
                </Button>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
              <div className="max-w-xl mx-auto space-y-4">
                <div className="text-center space-y-1 mb-4">
                  <h3 className="font-bold text-foreground">{t('Redeem a Voucher', 'التحقق من القسيمة')}</h3>
                  <p className="text-xs text-muted-foreground">{t('Scan QR code or enter the 12-digit voucher code below', 'امسح الرمز أو أدخل رمز القسيمة المكون من 12 رقماً أدناه')}</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="redeem-input"
                      placeholder="VCH-XXXX-XXXX" 
                      className="pl-9 bg-background h-12 text-lg font-mono uppercase tracking-widest"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                    />
                  </div>
                  <Button size="lg" className="px-8 h-12" onClick={() => {
                    const v = displayVouchers.find((v: any) => v.code.toLowerCase() === redeemCode.toLowerCase());
                    if (v) setRedeemResult(v);
                    else toast.error(t('Invalid voucher code', 'رمز القسيمة غير صالح'));
                  }}>
                    {t('Verify', 'تحقق')}
                  </Button>
                </div>
              </div>
            </div>

            {redeemResult && (
              <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      {redeemResult.code}
                    </CardTitle>
                    <CardDescription>{redeemResult.campaignNameEn} · {redeemResult.optionNameEn}</CardDescription>
                  </div>
                  <Badge className={VOUCHER_STATUS_MAP[redeemResult.status]?.className}>
                    {VOUCHER_STATUS_MAP[redeemResult.status]?.labelEn}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Customer', 'العميل')}</p>
                      <p className="text-sm font-semibold">{redeemResult.customerName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Purchase Date', 'تاريخ الشراء')}</p>
                      <p className="text-sm font-semibold">{redeemResult.purchaseDate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Face Value', 'القيمة')}</p>
                      <p className="text-sm font-semibold text-primary">{redeemResult.faceValue} SAR</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('Paid Price', 'سعر الشراء')}</p>
                      <p className="text-sm font-semibold">{redeemResult.purchasePrice} SAR</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-secondary/20 pt-4 flex justify-between gap-3">
                  <Button variant="ghost" onClick={() => setRedeemResult(null)}>{t('Cancel', 'إلغاء')}</Button>
                  <Button 
                    className="flex-1 gap-2" 
                    disabled={redeemResult.status !== 'active'}
                    onClick={() => {
                      toast.success(t('Voucher redeemed successfully!', 'تم التحقق من القسيمة بنجاح!'));
                      setRedeemResult(null);
                      setRedeemCode('');
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('Confirm Redemption', 'تأكيد الاستخدام')}
                  </Button>
                </CardFooter>
              </Card>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {['All', 'Active', 'Redeemed', 'Expired', 'Refunded'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveVoucherFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeVoucherFilter === f 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t(f, f)}
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Voucher Code', 'رمز القسيمة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Campaign / Option', 'الحملة / الخيار')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Customer', 'العميل')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Value', 'القيمة')}</th>
                      <th className="text-start px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Status', 'الحالة')}</th>
                      <th className="text-end px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredVouchers.map((voucher: any) => (
                      <tr key={voucher.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-foreground">{voucher.code}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground line-clamp-1">{voucher.campaignNameEn}</span>
                            <span className="text-xs text-muted-foreground">{voucher.optionNameEn}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-foreground">{voucher.customerName}</span>
                            <span className="text-xs text-muted-foreground">{voucher.purchaseDate}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-primary">{voucher.purchasePrice} SAR</span>
                            <span className="text-[10px] text-muted-foreground line-through opacity-60">{voucher.faceValue} SAR</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={`${VOUCHER_STATUS_MAP[voucher.status]?.className} border-none shadow-none`}>
                            {lang === 'ar' ? VOUCHER_STATUS_MAP[voucher.status]?.labelAr : VOUCHER_STATUS_MAP[voucher.status]?.labelEn}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Dialog */}
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
            <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{t('Campaign Wizard', 'معالج الحملة')}</DialogTitle>
                  <p className="text-xs text-muted-foreground">{t('Step', 'الخطوة')} {wizardStep} {t('of', 'من')} 7</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 me-4">
                  {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                    <div 
                      key={s} 
                      className={`h-1.5 w-6 rounded-full transition-colors ${s === wizardStep ? 'bg-primary' : s < wizardStep ? 'bg-primary/40' : 'bg-muted'}`}
                    />
                  ))}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowWizard(false)} className="rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-8">
              {wizardStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{t('Step 1: The Basics', 'الخطوة 1: الأساسيات')}</h3>
                    <p className="text-sm text-muted-foreground">{t('Tell us about your campaign goal and type.', 'أخبرنا عن هدف ونوع حملتك.')}</p>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('Campaign Name (Internal)', 'اسم الحملة (داخلي)')}</Label>
                        <Input placeholder="e.g. Ramadan Special 2026" value={wizardData.name} onChange={e => setWizardData({...wizardData, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Target City', 'المدينة المستهدفة')}</Label>
                        <Select value={wizardData.city} onValueChange={v => setWizardData({...wizardData, city: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="riyadh">Riyadh</SelectItem>
                            <SelectItem value="jeddah">Jeddah</SelectItem>
                            <SelectItem value="khobar">Al Khobar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('Public Title (EN)', 'العنوان العام (EN)')}</Label>
                        <Input placeholder="50% Off Total Bill" value={wizardData.titleEn} onChange={e => setWizardData({...wizardData, titleEn: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-right block">{t('العنوان العام (AR)', 'Public Title (AR)')}</Label>
                        <Input dir="rtl" placeholder="خصم 50% على الفاتورة" value={wizardData.titleAr} onChange={e => setWizardData({...wizardData, titleAr: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>{t('Deal Type', 'نوع العرض')}</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'spend_credit', icon: DollarSign, label: 'Spend Credit', sub: 'Pay X get Y credit' },
                          { id: 'item_voucher', icon: Utensils, label: 'Item Voucher', sub: 'Free dish or menu' },
                          { id: 'discount_deal', icon: Percent, label: 'Discount Deal', sub: '% or fixed off' },
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setWizardData({...wizardData, type: type.id})}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                              wizardData.type === type.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20 bg-card'
                            }`}
                          >
                            <type.icon className={`w-6 h-6 ${wizardData.type === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold">{t(type.label, type.label)}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{t(type.sub, type.sub)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">{t('Step 2: Campaign Options', 'الخطوة 2: خيارات الحملة')}</h3>
                      <p className="text-sm text-muted-foreground">{t('Add one or more pricing tiers for this deal.', 'أضف مستوى سعري واحد أو أكثر لهذا العرض.')}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setWizardData({...wizardData, options: [...wizardData.options, { nameEn: '', nameAr: '', originalPrice: '', dealPrice: '', initialCap: '', monthlyCap: '', validityDays: '60' }]})}>
                      <Plus className="w-4 h-4 me-2" /> {t('Add Option', 'إضافة خيار')}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {wizardData.options.map((opt: any, idx: number) => (
                      <div key={idx} className="p-5 border border-border rounded-2xl bg-secondary/10 space-y-4 relative group">
                        {wizardData.options.length > 1 && (
                          <Button 
                            variant="ghost" size="icon" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 text-red-500"
                            onClick={() => setWizardData({...wizardData, options: wizardData.options.filter((_: any, i: number) => i !== idx)})}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Option Name (EN)', 'اسم الخيار (EN)')}</Label>
                            <Input value={opt.nameEn} onChange={e => {
                              const newOpts = [...wizardData.options];
                              newOpts[idx].nameEn = e.target.value;
                              setWizardData({...wizardData, options: newOpts});
                            }} placeholder="Single Person" />
                          </div>
                          <div className="space-y-2 text-right">
                            <Label className="text-xs">{t('اسم الخيار (AR)', 'Option Name (AR)')}</Label>
                            <Input dir="rtl" value={opt.nameAr} onChange={e => {
                              const newOpts = [...wizardData.options];
                              newOpts[idx].nameAr = e.target.value;
                              setWizardData({...wizardData, options: newOpts});
                            }} placeholder="لشخص واحد" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Original Price', 'السعر الأصلي')}</Label>
                            <div className="relative">
                              <Input type="number" value={opt.originalPrice} onChange={e => {
                                const newOpts = [...wizardData.options];
                                newOpts[idx].originalPrice = e.target.value;
                                setWizardData({...wizardData, options: newOpts});
                              }} className="pr-10" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">SAR</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Deal Price', 'سعر العرض')}</Label>
                            <div className="relative">
                              <Input type="number" value={opt.dealPrice} onChange={e => {
                                const newOpts = [...wizardData.options];
                                newOpts[idx].dealPrice = e.target.value;
                                setWizardData({...wizardData, options: newOpts});
                              }} className="pr-10 border-primary/50 bg-primary/5" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">SAR</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Discount', 'الخصم')}</Label>
                            <div className="h-10 flex items-center px-3 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200">
                              {opt.originalPrice && opt.dealPrice ? `${Math.round((1 - (opt.dealPrice / opt.originalPrice)) * 100)}% Off` : '--'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Initial Cap', 'السعة الكلية')}</Label>
                            <Input type="number" placeholder="Unlimited" value={opt.initialCap} onChange={e => {
                              const newOpts = [...wizardData.options];
                              newOpts[idx].initialCap = e.target.value;
                              setWizardData({...wizardData, options: newOpts});
                            }} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Monthly Cap', 'السعة الشهرية')}</Label>
                            <Input type="number" placeholder="No Limit" value={opt.monthlyCap} onChange={e => {
                              const newOpts = [...wizardData.options];
                              newOpts[idx].monthlyCap = e.target.value;
                              setWizardData({...wizardData, options: newOpts});
                            }} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Validity (Days)', 'الصلاحية (يوم)')}</Label>
                            <Input type="number" value={opt.validityDays} onChange={e => {
                              const newOpts = [...wizardData.options];
                              newOpts[idx].validityDays = e.target.value;
                              setWizardData({...wizardData, options: newOpts});
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{t('Step 3: Campaign Photos', 'الخطوة 3: صور الحملة')}</h3>
                    <p className="text-sm text-muted-foreground">{t('High quality photos convert 3x better.', 'الصور عالية الجودة تزيد من المبيعات 3 أضعاف.')}</p>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center gap-4 bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">{t('Drop images here or click to upload', 'اسحب الصور هنا أو اضغط للتحميل')}</p>
                      <p className="text-xs text-muted-foreground">{t('PNG, JPG up to 10MB each. Recommend 4:3 aspect ratio.', 'PNG، JPG بحد أقصى 10 ميجا بايت لكل منها. يوصى بنسبة 4:3.')}</p>
                    </div>
                    <Button variant="outline" className="mt-2">{t('Select Files', 'اختر الملفات')}</Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="aspect-[4/3] bg-muted rounded-2xl relative group overflow-hidden border border-border">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Image className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <button className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 justify-center mt-6">
                    <Checkbox id="media-consent" checked={wizardData.consent} onCheckedChange={v => setWizardData({...wizardData, consent: v})} />
                    <Label htmlFor="media-consent" className="text-xs font-medium text-muted-foreground">
                      {t('I confirm I have the rights to use these images.', 'أؤكد أنني أملك حقوق استخدام هذه الصور.')}
                    </Label>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{t('Step 4: Highlights & Description', 'الخطوة 4: النقاط الهامة والوصف')}</h3>
                    <p className="text-sm text-muted-foreground">{t('Describe what makes this deal special.', 'صف ما يجعل هذا العرض مميزاً.')}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {t('Campaign Highlights (EN)', 'النقاط الهامة (EN)')}
                      </Label>
                      <div className="space-y-2">
                        {wizardData.highlights.map((h: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <span className="w-6 h-10 flex items-center justify-center text-xs font-bold text-muted-foreground">{i+1}</span>
                            <Input 
                              placeholder={`Highlight ${i+1}`} 
                              value={h} 
                              onChange={e => {
                                const newH = [...wizardData.highlights];
                                newH[i] = e.target.value;
                                setWizardData({...wizardData, highlights: newH});
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div className="space-y-2">
                        <Label>{t('Detailed Description (EN)', 'الوصف التفصيلي (EN)')}</Label>
                        <Textarea 
                          placeholder="What's included in this deal? E.g. Valid for dinner only, includes appetizers..." 
                          className="min-h-[150px] resize-none"
                          value={wizardData.descriptionEn}
                          onChange={e => setWizardData({...wizardData, descriptionEn: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 text-right">
                        <Label>{t('الوصف التفصيلي (AR)', 'Detailed Description (AR)')}</Label>
                        <Textarea 
                          dir="rtl"
                          placeholder="ماذا يتضمن هذا العرض؟ مثال: صالح للعشاء فقط، يشمل المقبلات..." 
                          className="min-h-[150px] resize-none"
                          value={wizardData.descriptionAr}
                          onChange={e => setWizardData({...wizardData, descriptionAr: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{t('Step 5: Fine Print', 'الخطوة 5: الشروط والأحكام')}</h3>
                    <p className="text-sm text-muted-foreground">{t('Specify terms and restrictions.', 'حدد الشروط والقيود.')}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t('Platform Standard Terms (Read-only)', 'شروط المنصة القياسية (للقراءة فقط)')}</p>
                      <ul className="space-y-2">
                        <li className="text-xs flex items-center gap-2 text-muted-foreground"><Check className="w-3 h-3 text-green-600" /> {t('Vouchers cannot be combined with other offers.', 'لا يمكن دمج القسائم مع عروض أخرى.')}</li>
                        <li className="text-xs flex items-center gap-2 text-muted-foreground"><Check className="w-3 h-3 text-green-600" /> {t('Vouchers expire on the date shown.', 'تنتهي صلاحية القسائم في التاريخ الموضح.')}</li>
                        <li className="text-xs flex items-center gap-2 text-muted-foreground"><Check className="w-3 h-3 text-green-600" /> {t('Vouchers are non-refundable after redemption.', 'القسائم غير قابلة للاسترداد بعد الاستخدام.')}</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'reservation', label: 'Reservation Required', labelAr: 'يتطلب حجز مسبق' },
                        { id: 'dinein', label: 'Dine-in Only', labelAr: 'للطلبات الداخلية فقط' },
                        { id: 'weekend', label: 'Valid on Weekends', labelAr: 'صالح في عطلة نهاية الأسبوع' },
                        { id: 'family', label: 'Families Only', labelAr: 'للعائلات فقط' },
                        { id: 'limit', label: 'Limit 1 Per User', labelAr: 'قسيمة واحدة لكل مستخدم' },
                        { id: 'kids', label: 'Kids Policy Applies', labelAr: 'تطبق سياسة الأطفال' },
                      ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-primary/20 transition-colors">
                          <Label htmlFor={item.id} className="cursor-pointer">
                            <p className="text-sm font-bold">{t(item.label, item.label)}</p>
                            <p className="text-[10px] text-muted-foreground">{item.labelAr}</p>
                          </Label>
                          <Checkbox id={item.id} checked={wizardData[item.id]} onCheckedChange={v => setWizardData({...wizardData, [item.id]: v})} />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('Custom Fine Print (Optional)', 'شروط مخصصة (اختياري)')}</Label>
                      <Textarea placeholder="Any other specific terms..." value={wizardData.customTerms} onChange={e => setWizardData({...wizardData, customTerms: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{t('Step 6: Redemption', 'الخطوة 6: الاستخدام')}</h3>
                    <p className="text-sm text-muted-foreground">{t('How should customers redeem this deal?', 'كيف يجب على العملاء استخدام هذا العرض؟')}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>{t('Redemption Method', 'طريقة الاستخدام')}</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'on_site', icon: MapPin, label: 'On-Site', sub: 'In restaurant' },
                          { id: 'on_demand', icon: Smartphone, label: 'On-Demand', sub: 'Via App' },
                          { id: 'online', icon: Globe, label: 'Online', sub: 'Website' },
                        ].map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setWizardData({...wizardData, redemptionMethod: method.id})}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                              wizardData.redemptionMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20 bg-card'
                            }`}
                          >
                            <method.icon className={`w-6 h-6 ${wizardData.redemptionMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold">{t(method.label, method.label)}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{t(method.sub, method.sub)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 border border-border rounded-2xl bg-muted/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">{t('Reservation Required', 'يتطلب حجز مسبق')}</Label>
                          <p className="text-xs text-muted-foreground">{t('Highly recommended for dining deals', 'يوصى به بشدة لعروض الطعام')}</p>
                        </div>
                        <Checkbox checked={wizardData.requiresReservation} onCheckedChange={v => setWizardData({...wizardData, requiresReservation: v})} />
                      </div>
                      
                      {wizardData.requiresReservation && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <Label className="text-xs">{t('Booking Phone', 'هاتف الحجز')}</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input className="pl-9" placeholder="+966 5..." />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('WhatsApp Link', 'رابط واتساب')}</Label>
                            <div className="relative">
                              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input className="pl-9" placeholder="wa.me/..." />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 7 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{t('Step 7: Review & Submit', 'الخطوة 7: المراجعة والتقديم')}</h3>
                    <p className="text-sm text-muted-foreground">{t('Review your campaign before submitting for approval.', 'راجع حملتك قبل تقديمها للموافقة.')}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm sticky top-0">
                        <div className="aspect-[4/3] bg-muted relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image className="w-10 h-10 text-muted-foreground/20" />
                          </div>
                          <div className="absolute top-3 right-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                            {wizardData.options[0]?.originalPrice && wizardData.options[0]?.dealPrice 
                              ? `${Math.round((1 - (wizardData.options[0].dealPrice / wizardData.options[0].originalPrice)) * 100)}% OFF` 
                              : '--'}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Reem Al Bawadi</p>
                            <h4 className="font-bold text-sm leading-tight">{wizardData.titleEn || 'Campaign Title'}</h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <StarRating rating={5} size="xs" />
                            <span className="text-[10px] text-muted-foreground font-bold">(124)</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 border-t border-border pt-3">
                            <span className="text-lg font-black text-foreground">{wizardData.options[0]?.dealPrice || '0'} SAR</span>
                            <span className="text-xs text-muted-foreground line-through opacity-50">{wizardData.options[0]?.originalPrice || '0'} SAR</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 space-y-6">
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">{t('Campaign Details', 'تفاصيل الحملة')}</h5>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t('Title (AR)', 'العنوان (AR)')}</p>
                            <p className="text-sm font-bold text-foreground" dir="rtl">{wizardData.titleAr || '--'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t('Deal Type', 'نوع العرض')}</p>
                            <p className="text-sm font-bold text-foreground">{wizardData.type}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t('Redemption', 'الاستخدام')}</p>
                            <p className="text-sm font-bold text-foreground capitalize">{wizardData.redemptionMethod.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t('Reservation', 'الحجز')}</p>
                            <p className="text-sm font-bold text-foreground">{wizardData.requiresReservation ? 'Required' : 'Optional'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="w-4 h-4 text-primary" />
                          <p className="text-sm font-bold text-primary">{t('Submission Confirmation', 'تأكيد التقديم')}</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {t('By submitting, you agree to Tabaq\'s campaign terms. Your campaign will undergo a review process which typically takes 24-48 hours.', 'بتقديمك للحملة، فإنك توافق على شروط طبق للحملات. ستخضع حملتك لعملية مراجعة تستغرق عادةً من 24 إلى 48 ساعة.')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Checkbox id="confirm-submit" checked={wizardData.confirmed} onCheckedChange={v => setWizardData({...wizardData, confirmed: v})} />
                          <Label htmlFor="confirm-submit" className="text-xs font-medium">{t('I confirm all information is accurate.', 'أؤكد أن جميع المعلومات دقيقة.')}</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-8 py-5 flex items-center justify-between z-20">
              <Button 
                variant="ghost" 
                onClick={() => setWizardStep(s => Math.max(1, s - 1))}
                disabled={wizardStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('Previous', 'السابق')}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowWizard(false)}>{t('Save Draft', 'حفظ كمسودة')}</Button>
                {wizardStep < 7 ? (
                  <Button onClick={() => setWizardStep(s => Math.min(7, s + 1))} className="gap-2 min-w-[120px]">
                    {t('Next', 'التالي')}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    className="gap-2 min-w-[140px] shadow-lg shadow-primary/20"
                    disabled={!wizardData.confirmed}
                    onClick={() => {
                      toast.success(t('Campaign submitted for review!', 'تم تقديم الحملة للمراجعة!'));
                      setShowWizard(false);
                      setWizardStep(1);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('Submit Review', 'تقديم للمراجعة')}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{t('Guest Reviews', 'تقييمات الضيوف')}</h2>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-amber-700">{statsData ? parseFloat(statsData.avgRating).toFixed(1) : '4.7'}</span>
                <span className="text-amber-600/70 text-sm">avg rating</span>
              </div>
            </div>
            {liveReviews.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">{t('No reviews yet', 'لا توجد تقييمات بعد')}</div>
            )}
            {liveReviews.map((review: any, idx: number) => (
              <div key={review.id ?? idx} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shrink-0">
                      {((lang === 'ar' ? review.userNameAr : review.userNameEn) ?? review.name ?? `U${review.userId ?? idx}`)[0]}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{(lang === 'ar' ? review.userNameAr : review.userNameEn) ?? review.name ?? `User #${review.userId}`}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating rating={Math.round(parseFloat(review.ratingOverall ?? review.rating ?? 0))} size="md" />
                        <span className="text-xs text-muted-foreground">{review.date ?? (review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '')}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold shrink-0 hover:bg-primary/90 transition-colors">{t('Reply', 'رد')}</button>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{lang === 'ar' ? (review.textAr ?? review.text) : (review.textEn ?? review.text)}</p>
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
                { label: t('Active', 'نشط'), val: (displayCampaigns as any[]).filter((o: any) => o.isActive).length, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: t('Pending Review', 'في انتظار المراجعة'), val: (displayCampaigns as any[]).filter((o: any) => o.approvalStatus === 'pending').length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: t('Total Redemptions', 'إجمالي الاستخدامات'), val: (displayCampaigns as any[]).reduce((a: number, o: any) => a + (o.redemptions ?? 0), 0), color: 'bg-primary/5 text-primary border-primary/20' },
                { label: t('Total Offers', 'إجمالي العروض'), val: (displayCampaigns as any[]).length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl p-4 ${s.color}`}>
                  <p className="text-2xl font-extrabold">{s.val}</p>
                  <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
                </div>
              ))}
            </div>

            {!(displayCampaigns as any[]).length && (
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
              {(displayCampaigns as any[]).map((offer: any) => (
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
                              onClick={() => { fetch(`/api/campaigns/${offer.id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ isActive: !offer.isActive }) }).then(() => refetchCampaigns()); }}
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
              {
                labelEn: 'Restaurant Name (English)',
                labelAr: 'اسم المطعم (إنجليزي)',
                value: myRestaurant?.nameEn ?? t('Not set', 'غير محدد'),
              },
              {
                labelEn: 'Restaurant Name (Arabic)',
                labelAr: 'اسم المطعم (عربي)',
                value: myRestaurant?.nameAr ?? t('Not set', 'غير محدد'),
              },
              {
                labelEn: 'Phone Number',
                labelAr: 'رقم الهاتف',
                value: myRestaurant?.phone ?? t('Not set', 'غير محدد'),
              },
              {
                labelEn: 'Address',
                labelAr: 'العنوان',
                value: myRestaurant?.address ?? t('Not set', 'غير محدد'),
              },
              {
                labelEn: 'Website',
                labelAr: 'الموقع الإلكتروني',
                value: myRestaurant?.website ?? t('Not set', 'غير محدد'),
              },
            ].map(field => (
              <div key={field.labelEn} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">{lang === 'ar' ? field.labelAr : field.labelEn}</p>
                  <p className="font-semibold text-foreground truncate">{field.value}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0">{t('Edit', 'تعديل')}</Button>
              </div>
            ))}
            {myRestaurant?.refCode && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{t('Restaurant Reference Code', 'الرمز المرجعي للمطعم')}</p>
                <p className="font-mono font-bold text-foreground">{myRestaurant.refCode}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('Use this code for support inquiries', 'استخدم هذا الرمز في استفسارات الدعم')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
