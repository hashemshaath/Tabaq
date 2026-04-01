import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, API_BASE } from '@/lib/api';
import {
  Crown, Star, Check, Zap, Shield, Gift, ChefHat, CalendarDays,
  Tag, Users, Award, ChevronDown, ChevronRight, Sparkles, X,
  BadgePercent, Ticket, Clock, Globe, Heart, MessageSquare, CheckCircle2,
  Loader2,
} from 'lucide-react';


type PlanId = 'explorer' | 'gourmet' | 'elite';
type BillingCycle = 'monthly' | 'annual';

interface Plan {
  id: PlanId;
  nameEn: string; nameAr: string;
  descEn: string; descAr: string;
  monthlyPrice: number; annualPrice: number;
  currency: string;
  badgeColor: string; badgeBg: string;
  borderColor: string; cardBg: string;
  ctaLabelEn: string; ctaLabelAr: string;
  ctaBg: string;
  highlight?: boolean;
  badge?: { en: string; ar: string };
  icon: React.ReactNode;
}

const PLANS: Plan[] = [
  {
    id: 'explorer',
    nameEn: 'Explorer', nameAr: 'مستكشف',
    descEn: 'Perfect for casual dining enthusiasts', descAr: 'مثالي لعشاق الطعام العاديين',
    monthlyPrice: 0, annualPrice: 0, currency: 'SAR',
    badgeColor: 'text-slate-600', badgeBg: 'bg-slate-100',
    borderColor: 'border-border', cardBg: 'bg-card',
    ctaLabelEn: 'Current Plan', ctaLabelAr: 'خطتك الحالية',
    ctaBg: 'bg-secondary text-foreground',
    icon: <Globe className="w-6 h-6" />,
  },
  {
    id: 'gourmet',
    nameEn: 'Gourmet', nameAr: 'ذواقة',
    descEn: 'For serious food lovers & frequent diners', descAr: 'لعشاق الطعام والزوار المتكررين',
    monthlyPrice: 49, annualPrice: 39, currency: 'SAR',
    badgeColor: 'text-amber-700', badgeBg: 'bg-amber-100',
    borderColor: 'border-amber-400', cardBg: 'bg-gradient-to-b from-amber-50 to-white',
    ctaLabelEn: 'Upgrade to Gourmet', ctaLabelAr: 'ترقية إلى ذواقة',
    ctaBg: 'bg-amber-500 hover:bg-amber-600 text-white',
    highlight: true,
    badge: { en: 'Most Popular', ar: 'الأكثر شيوعاً' },
    icon: <Star className="w-6 h-6" />,
  },
  {
    id: 'elite',
    nameEn: 'Elite', nameAr: 'النخبة',
    descEn: 'The ultimate dining experience for connoisseurs', descAr: 'تجربة طعام لا مثيل لها للمميزين',
    monthlyPrice: 149, annualPrice: 119, currency: 'SAR',
    badgeColor: 'text-white', badgeBg: 'bg-gradient-to-r from-amber-600 to-yellow-500',
    borderColor: 'border-yellow-500', cardBg: 'bg-gradient-to-b from-gray-950 to-gray-900',
    ctaLabelEn: 'Upgrade to Elite', ctaLabelAr: 'ترقية إلى النخبة',
    ctaBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-gray-900 font-black',
    badge: { en: 'Best Value', ar: 'أفضل قيمة' },
    icon: <Crown className="w-6 h-6" />,
  },
];

interface Feature {
  labelEn: string; labelAr: string;
  explorer: boolean | string;
  gourmet: boolean | string;
  elite: boolean | string;
  icon: React.ReactNode;
}

const FEATURES: Feature[] = [
  { labelEn: 'Priority Table Reservations', labelAr: 'حجز طاولة بأولوية', explorer: false, gourmet: true, elite: true, icon: <CalendarDays className="w-4 h-4" /> },
  { labelEn: 'Monthly Dining Credits', labelAr: 'رصيد طعام شهري', explorer: false, gourmet: 'SAR 50', elite: 'SAR 200', icon: <BadgePercent className="w-4 h-4" /> },
  { labelEn: 'Exclusive Member Discounts', labelAr: 'خصومات حصرية للأعضاء', explorer: false, gourmet: 'Up to 15%', elite: 'Up to 30%', icon: <Tag className="w-4 h-4" /> },
  { labelEn: 'Free Dish Per Visit', labelAr: 'طبق مجاني لكل زيارة', explorer: false, gourmet: false, elite: true, icon: <ChefHat className="w-4 h-4" /> },
  { labelEn: 'Exclusive Menu Access', labelAr: 'وصول للقوائم الحصرية', explorer: false, gourmet: true, elite: true, icon: <Ticket className="w-4 h-4" /> },
  { labelEn: 'Points Multiplier', labelAr: 'مضاعف النقاط', explorer: '1×', gourmet: '2×', elite: '5×', icon: <Zap className="w-4 h-4" /> },
  { labelEn: 'Michelin Restaurant Access', labelAr: 'الوصول لمطاعم ميشلان', explorer: false, gourmet: false, elite: true, icon: <Star className="w-4 h-4" /> },
  { labelEn: 'Concierge Service', labelAr: 'خدمة الكونسيرج', explorer: false, gourmet: false, elite: true, icon: <Shield className="w-4 h-4" /> },
  { labelEn: 'Early Access to New Restaurants', labelAr: 'وصول مبكر للمطاعم الجديدة', explorer: false, gourmet: true, elite: true, icon: <Clock className="w-4 h-4" /> },
  { labelEn: 'Private Events & Tastings', labelAr: 'فعاليات خاصة وتذوق', explorer: false, gourmet: false, elite: true, icon: <Users className="w-4 h-4" /> },
  { labelEn: 'Birthday Dining Reward', labelAr: 'مكافأة عشاء عيد الميلاد', explorer: false, gourmet: true, elite: true, icon: <Gift className="w-4 h-4" /> },
  { labelEn: 'Personalized Food Journey', labelAr: 'رحلة طعام مخصصة', explorer: false, gourmet: true, elite: true, icon: <Heart className="w-4 h-4" /> },
];

const PERKS = [
  { icon: '🎯', titleEn: 'Priority Booking', titleAr: 'حجز ذو أولوية', descEn: 'Skip the waitlist at top restaurants', descAr: 'تجاوز قائمة الانتظار في أفضل المطاعم' },
  { icon: '💎', titleEn: 'Monthly Credits', titleAr: 'رصيد شهري', descEn: 'Get SAR credits to spend on any restaurant', descAr: 'احصل على رصيد ريال سعودي لإنفاقه في أي مطعم' },
  { icon: '⭐', titleEn: '5× Points', titleAr: '5× نقاط', descEn: 'Earn points 5 times faster on Elite', descAr: 'اكسب النقاط أسرع 5 مرات مع النخبة' },
  { icon: '🤵', titleEn: 'Concierge', titleAr: 'كونسيرج', descEn: '24/7 personal dining assistant', descAr: 'مساعد طعام شخصي على مدار الساعة' },
];

const TESTIMONIALS = [
  { name: 'Noura Al-Rashid', nameAr: 'نورة الراشد', plan: 'Elite', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', rating: 5, textEn: 'Tabaq Elite completely changed how I dine out. The concierge got me a table at Nobu on a Saturday night — impossible otherwise!', textAr: 'غيّر طبق النخبة طريقة تناولي للطعام خارجاً. الكونسيرج حجز لي طاولة في نوبو ليلة السبت — مستحيل بدونه!' },
  { name: 'Faisal Al-Otaibi', nameAr: 'فيصل العتيبي', plan: 'Gourmet', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', rating: 5, textEn: 'The 2× points and SAR 50 monthly credit easily covers half my dining costs. Worth every riyal.', textAr: 'النقاط المضاعفة ورصيد 50 ريال شهري يغطيان نصف تكاليف طعامي. تستحق كل ريال.' },
  { name: 'Lama Al-Zahrani', nameAr: 'لمى الزهراني', plan: 'Elite', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', rating: 5, textEn: 'Michelin restaurant access alone is worth the subscription. I\'ve discovered dining experiences I never knew existed in Riyadh.', textAr: 'الوصول لمطاعم ميشلان وحده يستحق الاشتراك. اكتشفت تجارب طعام لم أكن أعلم بوجودها في الرياض.' },
];

const FAQS = [
  { q: { en: 'Can I cancel anytime?', ar: 'هل يمكنني الإلغاء في أي وقت؟' }, a: { en: 'Yes. You can cancel your subscription at any time with no cancellation fees. Your benefits continue until the end of the billing period.', ar: 'نعم. يمكنك إلغاء اشتراكك في أي وقت دون أي رسوم. تستمر مزاياك حتى نهاية فترة الفوترة.' } },
  { q: { en: 'How do monthly credits work?', ar: 'كيف تعمل الرصيد الشهري؟' }, a: { en: 'Credits are automatically added to your account on the 1st of each month. They can be used at any participating restaurant on the platform.', ar: 'تُضاف الأرصدة تلقائياً إلى حسابك في الأول من كل شهر. يمكن استخدامها في أي مطعم مشارك على المنصة.' } },
  { q: { en: 'What is the concierge service?', ar: 'ما هي خدمة الكونسيرج؟' }, a: { en: 'Elite members get a dedicated dining concierge who can make reservations, arrange special requests, secure hard-to-get tables, and curate personalized dining experiences.', ar: 'يحصل أعضاء النخبة على كونسيرج طعام مخصص يمكنه إجراء الحجوزات وترتيب الطلبات الخاصة وتأمين الطاولات النادرة وتنظيم تجارب طعام مخصصة.' } },
  { q: { en: 'Can I upgrade or downgrade my plan?', ar: 'هل يمكنني الترقية أو التخفيض؟' }, a: { en: 'Absolutely. You can upgrade instantly or downgrade at the end of your current billing period. Prorated credits are applied on upgrades.', ar: 'بالطبع. يمكنك الترقية فوراً أو التخفيض في نهاية فترة الفوترة الحالية. تُطبق الأرصدة النسبية عند الترقية.' } },
];

function FAQ({ q, a, lang }: { q: { en: string; ar: string }; a: { en: string; ar: string }; lang: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-4 text-start gap-4">
        <span className="font-semibold text-foreground text-sm sm:text-base">{lang === 'ar' ? q.ar : q.en}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">{lang === 'ar' ? a.ar : a.en}</div>
      )}
    </div>
  );
}

function FeatureValue({ val, planId }: { val: boolean | string; planId: PlanId }) {
  if (val === false) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  if (val === true) return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${planId === 'elite' ? 'bg-amber-500/20' : planId === 'gourmet' ? 'bg-amber-100' : 'bg-primary/10'}`}>
      <Check className={`w-3.5 h-3.5 ${planId === 'elite' ? 'text-amber-400' : 'text-primary'}`} />
    </div>
  );
  return <span className={`text-xs font-bold text-center block ${planId === 'elite' ? 'text-amber-400' : 'text-primary'}`}>{val}</span>;
}

export function TabaqGoldPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [upgradeModal, setUpgradeModal] = useState<{ plan: Plan; billing: BillingCycle } | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingCycle>('annual');

  const { data: topReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['top-reviews-gold'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/reviews?limit=3&sort=rating`);
      if (!r.ok) return null;
      const data = await r.json();
      const five = (data.reviews ?? []).filter((rv: any) => parseFloat(rv.ratingOverall) >= 5 && rv.textEn);
      return five.length >= 3 ? five.slice(0, 3) : null;
    },
    staleTime: 300_000,
  });

  const { data: membershipData, refetch: refetchMembership } = useQuery({
    queryKey: ['me-membership'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/auth/me/membership`, { headers: getAuthHeaders() });
      if (!r.ok) return null;
      return r.json() as Promise<{ goldPlan: string | null; goldBilling: string | null; goldSince: string | null }>;
    },
    enabled: !!user,
  });

  const activePlan: PlanId = (membershipData?.goldPlan as PlanId | null) ?? 'explorer';

  function handleUpgrade(plan: Plan, currentBilling: BillingCycle) {
    if (!user) { setLocation('/signin'); return; }
    setUpgraded(false);
    setUpgradeError(null);
    setUpgradeModal({ plan, billing: currentBilling });
  }

  async function confirmUpgrade() {
    if (!upgradeModal) return;
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const r = await fetch(`${API_BASE}/api/auth/me/membership`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ plan: upgradeModal.plan.id, billing: upgradeModal.billing }),
      });
      if (!r.ok) throw new Error('upgrade_failed');
      await refetchMembership();
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setUpgraded(true);
    } catch {
      setUpgradeError(t('Something went wrong. Please try again.', 'حدث خطأ. يرجى المحاولة مجدداً.'));
    } finally {
      setUpgrading(false);
    }
  }

  usePageMeta({
    titleEn: 'Tabaq Gold — Exclusive Dining Membership',
    titleAr: 'طبق جولد — عضوية الطعام الحصرية',
    descriptionEn: 'Unlock priority bookings, dining credits, and exclusive access to the best restaurants in Saudi Arabia.',
    descriptionAr: 'افتح حجوزات ذات أولوية ورصيد طعام ووصولاً حصرياً لأفضل المطاعم في المملكة.',
  }, lang);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-background" dir={dir}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Decorative background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 end-1/4 w-80 h-80 bg-yellow-400/8 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=800&fit=crop')] bg-cover bg-center opacity-8" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          {/* Crown badge */}
          <div className="inline-flex items-center gap-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full px-5 py-2 text-sm font-bold mb-8">
            <Crown className="w-4 h-4 fill-amber-400" />
            {t('Tabaq Gold Membership', 'عضوية طبق الذهبية')}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
            {t('Elevate Your', 'ارتقِ بتجربة')}<br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              {t('Dining Experience', 'طعامك')}
            </span>
          </h1>
          <p className="text-lg text-white/65 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(
              'Unlock priority reservations, exclusive dining credits, and concierge access at Saudi Arabia\'s finest restaurants.',
              'افتح حجوزات ذات أولوية ورصيد طعام حصري ووصول لخدمة الكونسيرج في أرقى مطاعم المملكة.',
            )}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm">
            {[
              { val: '50K+', labelEn: 'Gold Members', labelAr: 'عضو ذهبي' },
              { val: '500+', labelEn: 'Partner Restaurants', labelAr: 'مطعم شريك' },
              { val: '4.9', labelEn: 'Member Rating', labelAr: 'تقييم الأعضاء' },
            ].map(s => (
              <div key={s.labelEn} className="flex flex-col items-center">
                <span className="text-2xl font-black text-amber-400">{s.val}</span>
                <span className="text-xs">{lang === 'ar' ? s.labelAr : s.labelEn}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERKS STRIP ─────────────────────────────────────────── */}
      <section className="bg-amber-500 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PERKS.map(p => (
              <div key={p.titleEn} className="flex items-center gap-3 text-amber-900">
                <span className="text-2xl shrink-0">{p.icon}</span>
                <div>
                  <p className="font-bold text-sm leading-none">{lang === 'ar' ? p.titleAr : p.titleEn}</p>
                  <p className="text-amber-900/70 text-xs mt-0.5 leading-tight">{lang === 'ar' ? p.descAr : p.descEn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        {/* Billing toggle */}
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 text-center">
            {t('Choose Your Plan', 'اختر خطتك')}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">{t('Cancel anytime. No hidden fees.', 'إلغاء في أي وقت. لا رسوم خفية.')}</p>
          <div className="inline-flex bg-secondary rounded-xl p-1 gap-1">
            {(['monthly', 'annual'] as BillingCycle[]).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === cycle ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {cycle === 'monthly' ? t('Monthly', 'شهري') : t('Annual', 'سنوي')}
                {cycle === 'annual' && (
                  <span className="absolute -top-2.5 -end-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">-20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map(plan => {
            const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isElite = plan.id === 'elite';
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 ${plan.borderColor} ${plan.cardBg} ${plan.highlight ? 'md:-mt-3 md:-mb-0 shadow-2xl' : ''} overflow-hidden flex flex-col`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 inset-x-0 py-1.5 text-center text-xs font-black ${isElite ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900' : 'bg-amber-500 text-white'}`}>
                    {lang === 'ar' ? plan.badge.ar : plan.badge.en}
                  </div>
                )}

                <div className={`p-6 ${plan.badge ? 'pt-10' : ''} flex-1`}>
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.badgeBg} ${plan.badgeColor}`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className={`font-black text-lg ${isElite ? 'text-amber-400' : 'text-foreground'}`}>
                        {lang === 'ar' ? plan.nameAr : plan.nameEn}
                      </h3>
                      <p className={`text-xs ${isElite ? 'text-white/50' : 'text-muted-foreground'}`}>
                        {lang === 'ar' ? plan.descAr : plan.descEn}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {price === 0 ? (
                      <div className={`text-3xl font-black ${isElite ? 'text-white' : 'text-foreground'}`}>
                        {t('Free', 'مجاني')}
                      </div>
                    ) : (
                      <div className="flex items-end gap-1.5">
                        <span className={`text-3xl font-black ${isElite ? 'text-white' : 'text-foreground'}`}>
                          {plan.currency} {price}
                        </span>
                        <span className={`text-sm mb-1 ${isElite ? 'text-white/50' : 'text-muted-foreground'}`}>
                          /{t('mo', 'شهر')}
                        </span>
                      </div>
                    )}
                    {billing === 'annual' && price > 0 && (
                      <p className={`text-xs mt-0.5 ${isElite ? 'text-amber-400/80' : 'text-emerald-600'}`}>
                        {t(`Billed ${plan.currency} ${price * 12}/year`, `يُحسب ${plan.currency} ${price * 12}/سنة`)}
                      </p>
                    )}
                  </div>

                  {/* Key bullets for this plan */}
                  <div className="space-y-2 mb-6">
                    {FEATURES.filter(f => f[plan.id] !== false).slice(0, 5).map(f => {
                      const val = f[plan.id];
                      return (
                        <div key={f.labelEn} className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isElite ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
                            <Check className={`w-3 h-3 ${isElite ? 'text-amber-400' : 'text-primary'}`} />
                          </div>
                          <span className={`text-sm ${isElite ? 'text-white/80' : 'text-foreground/80'}`}>
                            {lang === 'ar' ? f.labelAr : f.labelEn}
                            {typeof val === 'string' && val !== 'true' && ` — ${val}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  {plan.id === activePlan ? (
                    <div className="w-full py-3 rounded-xl text-sm font-bold text-center bg-emerald-100 text-emerald-700 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {t('Current Plan', 'خطتك الحالية')}
                    </div>
                  ) : (
                    <button
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${plan.ctaBg} cursor-pointer hover:opacity-90`}
                      onClick={() => handleUpgrade(plan, billing)}
                    >
                      {lang === 'ar' ? plan.ctaLabelAr : plan.ctaLabelEn}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES TABLE ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-xl font-black text-foreground mb-6 text-center">
          {t('Full Feature Comparison', 'مقارنة شاملة للميزات')}
        </h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 bg-muted/60">
            <div className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Feature', 'الميزة')}</div>
            {PLANS.map(p => (
              <div key={p.id} className={`p-4 text-center ${p.id === 'elite' ? 'bg-gray-950 text-amber-400' : ''}`}>
                <div className={`text-sm font-black ${p.id === 'elite' ? 'text-amber-400' : 'text-foreground'}`}>
                  {lang === 'ar' ? p.nameAr : p.nameEn}
                </div>
              </div>
            ))}
          </div>
          {/* Rows */}
          {FEATURES.map((f, i) => (
            <div key={f.labelEn} className={`grid grid-cols-4 border-t border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
              <div className="p-3.5 flex items-center gap-2 text-sm text-foreground/80">
                <span className="text-muted-foreground shrink-0">{f.icon}</span>
                {lang === 'ar' ? f.labelAr : f.labelEn}
              </div>
              {(['explorer', 'gourmet', 'elite'] as PlanId[]).map(pid => (
                <div key={pid} className={`p-3.5 flex items-center justify-center ${pid === 'elite' ? 'bg-gray-950/30' : ''}`}>
                  <FeatureValue val={f[pid]} planId={pid} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="bg-muted/40 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-semibold uppercase tracking-wider">{t('Member Stories', 'قصص الأعضاء')}</span>
            </div>
            <h2 className="text-2xl font-black text-foreground">{t('What Our Members Say', 'ما يقوله أعضاؤنا')}</h2>
          </div>
          {reviewsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(topReviews ?? TESTIMONIALS.map(tm => ({
                id: tm.name,
                userAvatarUrl: tm.avatar,
                userNameEn: tm.name,
                userNameAr: tm.nameAr,
                userLevelTitle: tm.plan,
                ratingOverall: String(tm.rating),
                textEn: tm.textEn,
                textAr: tm.textAr,
                restaurantNameEn: null as string | null,
              }))).map((rv: any) => (
                <div key={rv.id ?? rv.userNameEn} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={rv.userAvatarUrl} alt={lang === 'ar' ? rv.userNameAr : rv.userNameEn} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-sm text-foreground">{lang === 'ar' ? rv.userNameAr : rv.userNameEn}</p>
                      <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-amber-600 font-semibold">{rv.userLevelTitle}</span>
                      </div>
                    </div>
                    <div className="ms-auto flex gap-0.5">
                      {Array.from({ length: Math.round(parseFloat(rv.ratingOverall)) }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{lang === 'ar' ? rv.textAr : rv.textEn}"
                  </p>
                  {rv.restaurantNameEn && (
                    <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">
                      {lang === 'ar' ? rv.restaurantNameAr : rv.restaurantNameEn}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── UPGRADE MODAL ────────────────────────────────────────── */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { if (!upgrading) { setUpgradeModal(null); setUpgraded(false); } }}>
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            {!upgraded ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-lg text-foreground">{t('Confirm Upgrade', 'تأكيد الترقية')}</h3>
                  {!upgrading && (
                    <button onClick={() => setUpgradeModal(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className={`rounded-2xl border-2 p-4 mb-5 ${upgradeModal.plan.borderColor} ${upgradeModal.plan.cardBg}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${upgradeModal.plan.badgeBg} ${upgradeModal.plan.badgeColor}`}>
                      {upgradeModal.plan.icon}
                    </div>
                    <div>
                      <p className="font-black text-foreground">{lang === 'ar' ? upgradeModal.plan.nameAr : upgradeModal.plan.nameEn}</p>
                      <p className="text-xs text-muted-foreground">{lang === 'ar' ? upgradeModal.plan.descAr : upgradeModal.plan.descEn}</p>
                    </div>
                    <div className="ms-auto text-end">
                      <p className="font-black text-lg text-foreground">
                        {upgradeModal.plan.currency} {upgradeModal.billing === 'annual' ? upgradeModal.plan.annualPrice : upgradeModal.plan.monthlyPrice}
                      </p>
                      <p className="text-xs text-muted-foreground">/{t('month', 'شهر')}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {t('Your plan will be activated immediately. Billing details will be finalized with our team.', 'سيتم تفعيل خطتك فوراً. سيتم إتمام تفاصيل الفوترة مع فريقنا.')}
                </p>
                {upgradeError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2 mb-4">{upgradeError}</p>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setUpgradeModal(null)} disabled={upgrading} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                    {t('Cancel', 'إلغاء')}
                  </button>
                  <button onClick={confirmUpgrade} disabled={upgrading} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                    {upgrading ? <><Loader2 className="w-4 h-4 animate-spin" />{t('Activating...', 'جارٍ التفعيل...')}</> : t('Confirm Upgrade', 'تأكيد الترقية')}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-black text-xl text-foreground mb-2">{t('Plan Activated!', 'تم تفعيل الخطة!')}</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {t('You are now on', 'أنت الآن على خطة')} <strong>{lang === 'ar' ? upgradeModal.plan.nameAr : upgradeModal.plan.nameEn}</strong>. {t('Enjoy your exclusive dining benefits.', 'استمتع بمزايا الطعام الحصرية الخاصة بك.')}
                </p>
                <button onClick={() => { setUpgradeModal(null); setUpgraded(false); }} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors">
                  {t('Done', 'تم')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-foreground">{t('Frequently Asked Questions', 'الأسئلة الشائعة')}</h2>
        </div>
        <div className="bg-card border border-border rounded-2xl px-6 divide-y divide-border/50">
          {FAQS.map((faq, i) => <FAQ key={i} q={faq.q} a={faq.a} lang={lang} />)}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-16 text-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-5xl mb-6">👑</div>
          <h2 className="text-3xl font-black text-white mb-4">
            {t('Ready to dine like royalty?', 'جاهز للأكل كالملوك؟')}
          </h2>
          <p className="text-white/60 mb-8">
            {t('Join 50,000+ Gold members enjoying priority access, dining credits and exclusive Saudi dining experiences.', 'انضم إلى أكثر من 50,000 عضو ذهبي يستمتعون بالوصول ذي الأولوية والرصيد الغذائي وتجارب الطعام السعودية الحصرية.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => handleUpgrade(PLANS[1], billing)}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-gray-900 font-black px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-500/30 text-sm"
            >
              {t('Start with Gourmet — SAR 39/mo', 'ابدأ بذواقة — 39 ريال/شهر')}
            </button>
            <Link href="/restaurants">
              <button className="bg-white/10 border border-white/20 hover:bg-white/15 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all text-sm">
                {t('Explore Restaurants First', 'استكشف المطاعم أولاً')}
              </button>
            </Link>
          </div>
          <p className="text-white/35 text-xs mt-5">
            {t('No commitment required. Cancel anytime.', 'لا التزام مطلوب. إلغاء في أي وقت.')}
          </p>
        </div>
      </section>
    </div>
  );
}
