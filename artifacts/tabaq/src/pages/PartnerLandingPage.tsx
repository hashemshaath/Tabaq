import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import {
  CheckCircle2, TrendingUp, Users, Calendar, Star, ChevronRight,
  BarChart3, Shield, Zap, Globe, MessageSquare, Percent, Award,
  ArrowRight, Play, Phone, Mail, MapPin, Clock, CreditCard,
  Utensils, Settings, Bell, Eye, HeartHandshake, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PARTNER_HERO = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1200&fit=crop';
const RESTAURANT_1 = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop';
const RESTAURANT_2 = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop';
const RESTAURANT_3 = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop';

const STATS = [
  { value: '500+', label: 'Partner Restaurants', icon: Utensils },
  { value: '50K+', label: 'Monthly Diners', icon: Users },
  { value: '10K+', label: 'Reservations/Month', icon: Calendar },
  { value: '4.8★', label: 'Average Rating', icon: Star },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    titleEn: 'Fill More Tables',
    titleAr: 'امل المزيد من الطاولات',
    descEn: 'Reach thousands of diners actively searching for their next dining experience in Saudi Arabia. Our platform drives qualified, reservation-ready guests to your venue.',
    descAr: 'تواصل مع آلاف رواد الطعام الذين يبحثون عن تجربتهم الغذائية القادمة في المملكة.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: BarChart3,
    titleEn: 'Powerful Analytics',
    titleAr: 'تحليلات قوية',
    descEn: 'Understand your customers like never before. Track booking trends, peak hours, diner demographics, and revenue performance with our real-time business intelligence dashboard.',
    descAr: 'افهم عملاءك كما لم تفعل من قبل. تتبع اتجاهات الحجز والساعات الذروة ومعلومات الزوار.',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    icon: Shield,
    titleEn: 'Commission-Free Bookings',
    titleAr: 'حجوزات بدون عمولة',
    descEn: 'Keep 100% of your revenue. Unlike competitors, we never charge per-cover fees. Pay a flat monthly subscription and own every table, every time.',
    descAr: 'احتفظ بـ 100٪ من إيراداتك. على عكس المنافسين، لا نتقاضى رسوماً لكل غطاء. ادفع اشتراكاً شهرياً ثابتاً.',
    color: 'bg-green-500/10 text-green-600',
  },
  {
    icon: MessageSquare,
    titleEn: 'Reputation Management',
    titleAr: 'إدارة السمعة',
    descEn: 'Respond to reviews, showcase your best dishes, and build a loyal following. Our tools help you turn every dining experience into a 5-star story.',
    descAr: 'رد على التقييمات واعرض أفضل أطباقك وابنِ قاعدة عملاء مخلصين.',
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    icon: Percent,
    titleEn: 'Offers & Promotions',
    titleAr: 'العروض والترقيات',
    descEn: 'Create exclusive offers, happy hour deals, and seasonal promotions. Drive traffic during slow periods and reward your most loyal customers with personalized vouchers.',
    descAr: 'أنشئ عروضاً حصرية وصفقات Happy Hour وترقيات موسمية. جذب العملاء خلال الأوقات الهادئة.',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: Globe,
    titleEn: 'Bilingual Presence',
    titleAr: 'حضور ثنائي اللغة',
    descEn: 'Your restaurant profile appears beautifully in both Arabic and English, reaching the full Saudi dining market — locals and international visitors alike.',
    descAr: 'يظهر ملف مطعمك بشكل جميل باللغتين العربية والإنجليزية، مما يصل إلى السوق السعودية الكاملة.',
    color: 'bg-teal-500/10 text-teal-600',
  },
];

const STEPS = [
  {
    step: '01',
    titleEn: 'Apply in Minutes',
    titleAr: 'قدّم طلبك في دقائق',
    descEn: 'Fill out a quick registration form with your restaurant details. Our onboarding team reviews your application within 24 hours.',
    descAr: 'أكمل نموذج تسجيل سريع بتفاصيل مطعمك. يراجع فريق الإعداد طلبك خلال 24 ساعة.',
    img: RESTAURANT_1,
  },
  {
    step: '02',
    titleEn: 'Set Up Your Profile',
    titleAr: 'أعدّ ملفك الشخصي',
    descEn: 'Add your menu, photos, opening hours, and availability. Our dedicated team helps you create a stunning restaurant profile that converts browsers into bookers.',
    descAr: 'أضف قائمتك وصورك وأوقات عملك وتوافرك. يساعدك فريقنا المتخصص في إنشاء ملف مطعم رائع.',
    img: RESTAURANT_2,
  },
  {
    step: '03',
    titleEn: 'Start Receiving Bookings',
    titleAr: 'ابدأ في استقبال الحجوزات',
    descEn: 'Go live and start accepting reservations immediately. Manage everything from your Business Console — available on web and mobile.',
    descAr: 'انطلق وابدأ في قبول الحجوزات فوراً. أدر كل شيء من لوحة تحكم الأعمال — متاحة على الويب والجوال.',
    img: RESTAURANT_3,
  },
];

const TESTIMONIALS = [
  {
    name: 'Chef Khalid Al-Harbi',
    role: 'Owner, Najd Village Restaurant',
    city: 'Riyadh',
    text: 'Tabaq transformed our bookings. We went from 60% to 92% table occupancy in 3 months. The analytics tell us exactly which nights need promotions and which dishes are driving repeat visits.',
    rating: 5,
    avatar: 'K',
    color: 'bg-primary',
  },
  {
    name: 'Nora Al-Rashidi',
    role: 'Manager, Reem Al Bawadi',
    city: 'Jeddah',
    text: "The business console is genuinely the best we've used. I can see today's reservations, manage the waitlist, and respond to reviews all in one place. No per-cover fees means more profit for us.",
    rating: 5,
    avatar: 'N',
    color: 'bg-purple-600',
  },
  {
    name: 'James Thornton',
    role: 'F&B Director, The Terrace',
    city: 'NEOM',
    text: 'The bilingual platform is essential for us — we serve both Saudi nationals and international guests. Tabaq handles Arabic and English beautifully, and the concierge integration is seamless.',
    rating: 5,
    avatar: 'J',
    color: 'bg-teal-600',
  },
];

const PLANS = [
  {
    name: 'Starter',
    nameAr: 'المبتدئ',
    price: 'Free',
    priceAr: 'مجاني',
    desc: 'Perfect for new restaurants getting started.',
    descAr: 'مثالي للمطاعم الجديدة التي تبدأ.',
    features: [
      'Restaurant profile listing',
      'Up to 50 bookings/month',
      'Basic analytics',
      'Customer reviews',
      'Email support',
    ],
    cta: 'Get Started Free',
    ctaAr: 'ابدأ مجاناً',
    highlight: false,
  },
  {
    name: 'Professional',
    nameAr: 'المحترف',
    price: 'SAR 499',
    priceAr: '499 ر.س',
    period: '/month',
    periodAr: '/شهر',
    desc: 'For growing restaurants serious about performance.',
    descAr: 'للمطاعم المتنامية الجادة في الأداء.',
    features: [
      'Everything in Starter',
      'Unlimited bookings',
      'Advanced analytics & reports',
      'Offers & vouchers system',
      'Waitlist management',
      'Priority search placement',
      'Phone & email support',
    ],
    cta: 'Start 30-Day Trial',
    ctaAr: 'ابدأ تجربة 30 يوم',
    highlight: true,
  },
  {
    name: 'Enterprise',
    nameAr: 'المؤسسي',
    price: 'Custom',
    priceAr: 'مخصص',
    desc: 'For restaurant groups and hotel F&B operations.',
    descAr: 'لمجموعات المطاعم وعمليات F&B في الفنادق.',
    features: [
      'Everything in Professional',
      'Multi-venue management',
      'API access & integrations',
      'Dedicated account manager',
      'Custom reporting',
      'White-label options',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    ctaAr: 'تواصل مع المبيعات',
    highlight: false,
  },
];

const FEATURES_GRID = [
  { icon: Calendar, en: 'Real-time Reservation Management', ar: 'إدارة الحجوزات الفورية' },
  { icon: Bell, en: 'Instant Booking Notifications', ar: 'إشعارات الحجز الفورية' },
  { icon: Users, en: 'Guest Profile & History', ar: 'ملف الضيف وتاريخه' },
  { icon: Eye, en: 'Menu Showcase & Photos', ar: 'عرض القائمة والصور' },
  { icon: CreditCard, en: 'No Per-Cover Commission', ar: 'بدون عمولة لكل غطاء' },
  { icon: Award, en: 'Michelin-style Badge Awards', ar: 'جوائز شارات بنمط ميشلان' },
  { icon: Settings, en: 'Availability & Hours Control', ar: 'التحكم في التوفر وأوقات العمل' },
  { icon: Zap, en: 'Waitlist & Walk-in Support', ar: 'دعم قائمة الانتظار والحضور' },
];

export function PartnerLandingPage() {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background pb-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={PARTNER_HERO} alt="Restaurant interior" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 backdrop-blur-sm text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Rocket className="w-4 h-4" />
              {t("Saudi Arabia's #1 Restaurant Platform", 'منصة المطاعم الأولى في المملكة')}
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
              {t('Grow Your Restaurant with Tabaq', 'نمّ مطعمك مع طبق')}
            </h1>

            <p className="text-xl text-white/75 mb-8 max-w-lg leading-relaxed">
              {t(
                'Join 500+ top restaurants across Saudi Arabia. Fill more tables, understand your guests, and build a brand that diners love — all from one powerful platform.',
                'انضم إلى أكثر من 500 مطعم عبر المملكة العربية السعودية. امل المزيد من الطاولات، افهم ضيوفك، وابنِ علامة تجارية يحبها رواد الطعام.'
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/admin/register">
                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-xl shadow-primary/30 flex items-center gap-2 justify-center">
                  {t('List Your Restaurant — Free', 'سجّل مطعمك مجاناً')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all flex items-center gap-2 justify-center">
                <Play className="w-5 h-5" />
                {t('Watch Demo', 'شاهد العرض')}
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {['K', 'N', 'J', 'A'].map((l, i) => (
                  <div key={i} className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-white text-sm font-bold ${['bg-primary', 'bg-purple-600', 'bg-teal-600', 'bg-amber-600'][i]}`}>{l}</div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{t('Trusted by 500+ restaurants', 'موثوق به من قِبل 500+ مطعم')}</p>
                <div className="flex gap-0.5 mt-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick registration card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-white text-2xl font-bold mb-2">{t('Start for free today', 'ابدأ مجاناً اليوم')}</h3>
            <p className="text-white/60 text-sm mb-6">{t('No credit card required. Setup in under 10 minutes.', 'لا يلزم بطاقة ائتمان. الإعداد في أقل من 10 دقائق.')}</p>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder={t('Restaurant name', 'اسم المطعم')} className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary" />
                <input type="tel" placeholder={t('Your phone number', 'رقم هاتفك')} className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('Business email', 'البريد الإلكتروني التجاري')} className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary" />
                <button type="submit" className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-base transition-all shadow-lg">
                  {t('Get Started — Free', 'ابدأ مجاناً')}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
                <h4 className="text-white text-xl font-bold mb-2">{t("You're on the list!", 'أنت في القائمة!')}</h4>
                <p className="text-white/60 text-sm">{t("Our team will reach out within 24 hours to complete your setup.", 'سيتواصل معك فريقنا خلال 24 ساعة لإكمال إعدادك.')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-foreground text-background py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-4xl font-extrabold text-background font-display">{stat.value}</p>
                <p className="text-background/60 text-sm mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">{t('Why Tabaq', 'لماذا طبق')}</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mt-3 mb-4">
            {t('Everything you need to succeed', 'كل ما تحتاجه للنجاح')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('Built specifically for the Saudi dining market, Tabaq gives you the tools, visibility, and insights to grow your restaurant business.', 'مبني خصيصاً لسوق الطعام السعودي، يمنحك طبق الأدوات والرؤية والمعلومات اللازمة لتنمية أعمال مطعمك.')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map(benefit => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.titleEn} className="bg-card border border-border rounded-3xl p-7 hover:shadow-lg hover:border-primary/20 transition-all group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${benefit.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{lang === 'ar' ? benefit.titleAr : benefit.titleEn}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{lang === 'ar' ? benefit.descAr : benefit.descEn}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">{t('Simple Onboarding', 'إعداد بسيط')}</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mt-3">
              {t('Up and running in 3 steps', 'جاهز في 3 خطوات')}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {STEPS.map((step, idx) => (
              <div key={step.step} className="relative">
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={step.img} alt={step.titleEn} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 start-4 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-lg">
                      {step.step}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{lang === 'ar' ? step.titleAr : step.titleEn}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{lang === 'ar' ? step.descAr : step.descEn}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/3 -end-4 z-10 w-8 h-8 bg-primary text-white rounded-full items-center justify-center shadow-md">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">{t('Platform Features', 'ميزات المنصة')}</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mt-3 mb-6">
              {t('Your Business Console, Supercharged', 'لوحة تحكم أعمالك، معززة')}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {t(
                'The Tabaq Business Console gives you a complete view of your restaurant operations — from real-time bookings to guest reviews, menu management to revenue analytics.',
                'تمنحك لوحة تحكم أعمال طبق رؤية كاملة لعمليات مطعمك — من الحجوزات الفورية إلى تقييمات الضيوف وإدارة القائمة إلى تحليلات الإيرادات.'
              )}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {FEATURES_GRID.map(feature => {
                const Icon = feature.icon;
                return (
                  <div key={feature.en} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors">
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{lang === 'ar' ? feature.ar : feature.en}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/console">
              <Button size="lg" className="gap-2 text-base font-bold">
                {t('View Business Console', 'عرض لوحة التحكم')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Business Console Preview Card */}
          <div className="relative">
            <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
              {/* Mock console header */}
              <div className="bg-foreground text-background px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Reem Al Bawadi</p>
                  <p className="text-background/50 text-xs">Business Console</p>
                </div>
                <div className="ms-auto flex gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-amber-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
              </div>
              {/* Mock stats */}
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Bookings Today', val: '24', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Avg. Rating', val: '4.8 ★', icon: Star, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Revenue (SAR)', val: '12,450', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
                  { label: 'New Reviews', val: '7', icon: MessageSquare, color: 'text-primary bg-primary/10' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-secondary/40 rounded-2xl p-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-extrabold text-foreground">{s.val}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  );
                })}
              </div>
              {/* Mock booking list */}
              <div className="px-5 pb-5 space-y-2">
                {[
                  { name: 'Ahmed K.', time: '7:30 PM', guests: 4, status: 'bg-green-100 text-green-700' },
                  { name: 'Sarah M.', time: '8:00 PM', guests: 2, status: 'bg-green-100 text-green-700' },
                  { name: 'Mohammed A.', time: '8:30 PM', guests: 6, status: 'bg-yellow-100 text-yellow-700' },
                ].map(b => (
                  <div key={b.name} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-3 py-2.5">
                    <div className="w-7 h-7 bg-primary/15 rounded-lg flex items-center justify-center text-primary text-xs font-bold shrink-0">{b.guests}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.time}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.status}`}>{b.status.includes('green') ? 'Confirmed' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -end-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -start-4 w-16 h-16 bg-purple-500/20 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-gradient-to-br from-foreground/5 to-foreground/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">{t('Success Stories', 'قصص النجاح')}</span>
            <h2 className="text-4xl font-extrabold text-foreground mt-3">
              {t('What our partners say', 'ما يقوله شركاؤنا')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t_ => (
              <div key={t_.name} className="bg-card border border-border rounded-3xl p-7 flex flex-col hover:shadow-xl hover:border-primary/20 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <blockquote className="text-foreground text-sm leading-relaxed flex-1 mb-6">"{t_.text}"</blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className={`w-10 h-10 ${t_.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0`}>{t_.avatar}</div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{t_.name}</p>
                    <p className="text-muted-foreground text-xs">{t_.role}</p>
                  </div>
                  <div className="ms-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {t_.city}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">{t('Pricing', 'الأسعار')}</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mt-3 mb-4">
            {t('Simple, transparent pricing', 'أسعار بسيطة وشفافة')}
          </h2>
          <p className="text-muted-foreground text-lg">{t('No per-cover fees. No hidden charges. Ever.', 'بدون رسوم لكل غطاء. بدون رسوم مخفية. أبداً.')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative rounded-3xl border p-8 flex flex-col ${plan.highlight ? 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/25 scale-[1.02]' : 'bg-card border-border'}`}>
              {plan.highlight && (
                <div className="absolute -top-4 start-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">
                  {t('Most Popular', 'الأكثر شيوعاً')}
                </div>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-primary-foreground' : 'text-foreground'}`}>
                {lang === 'ar' ? plan.nameAr : plan.name}
              </h3>
              <p className={`text-sm mb-4 ${plan.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {lang === 'ar' ? plan.descAr : plan.desc}
              </p>
              <div className="mb-6">
                <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {lang === 'ar' ? plan.priceAr : plan.price}
                </span>
                {plan.period && <span className={`text-sm ms-1 ${plan.highlight ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{lang === 'ar' ? plan.periodAr : plan.period}</span>}
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-primary-foreground/70' : 'text-primary'}`} />
                    <span className={`text-sm ${plan.highlight ? 'text-primary-foreground/90' : 'text-foreground'}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${plan.highlight ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                {lang === 'ar' ? plan.ctaAr : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-foreground text-center mb-10">{t('Frequently Asked Questions', 'الأسئلة الشائعة')}</h2>
          {[
            { q: 'Is there a setup fee?', a: 'No. Registration and profile setup are completely free. You only pay once you start accepting unlimited bookings on the Professional plan.' },
            { q: 'Do you charge commission per booking?', a: 'Absolutely not. Tabaq charges a flat monthly subscription with zero per-cover or per-booking fees — ever. Your revenue is 100% yours.' },
            { q: 'How long does onboarding take?', a: 'Most restaurants are live within 48 hours. Our team handles the profile setup, menu upload, and photography recommendations so you can focus on cooking.' },
            { q: 'Can I manage multiple locations?', a: 'Yes. The Enterprise plan is designed for restaurant groups and hotel F&B operations managing multiple venues from a single Business Console.' },
            { q: 'Is Tabaq available in Arabic?', a: 'Fully. The entire platform — for diners and for your Business Console — is available in both Arabic and English with proper RTL support.' },
          ].map((faq, idx) => (
            <details key={idx} className="bg-card border border-border rounded-2xl mb-3 group">
              <summary className="px-5 py-4 font-semibold text-foreground cursor-pointer flex items-center justify-between gap-4 list-none">
                {faq.q}
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-violet-800" />
        <div className="absolute inset-0 opacity-10">
          <img src={PARTNER_HERO} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <HeartHandshake className="w-14 h-14 text-white/70 mx-auto mb-6" />
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-5">
            {t("Ready to join Saudi Arabia's top dining platform?", 'هل أنت مستعد للانضمام إلى أفضل منصة طعام في المملكة؟')}
          </h2>
          <p className="text-white/75 text-lg mb-8 max-w-2xl mx-auto">
            {t('Start for free. Go live in 48 hours. No commission, no per-cover fees — ever. Join 500+ partner restaurants already growing with Tabaq.', 'ابدأ مجاناً. انطلق خلال 48 ساعة. بدون عمولة، بدون رسوم لكل غطاء — أبداً.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary font-bold px-10 py-4 rounded-2xl text-lg hover:bg-white/90 transition-all shadow-2xl">
              {t('List Your Restaurant — Free', 'سجّل مطعمك مجاناً')}
            </button>
            <div className="flex items-center gap-3 text-white/80 justify-center">
              <Phone className="w-5 h-5" />
              <span className="text-lg font-semibold">+966 11 234 5678</span>
            </div>
          </div>
          <p className="text-white/50 text-sm mt-6">{t('Or email us at', 'أو أرسل لنا بريداً إلكترونياً على')} <a href="mailto:partners@tabaq.sa" className="underline text-white/70 hover:text-white">partners@tabaq.sa</a></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold">Tabaq <span className="font-normal opacity-50">| طبق</span></span>
          </div>
          <div className="flex gap-6 text-sm text-background/60">
            <Link href="/" className="hover:text-background transition-colors">{t('Diner App', 'تطبيق رواد الطعام')}</Link>
            <Link href="/collections" className="hover:text-background transition-colors">{t('Collections', 'المجموعات')}</Link>
            <Link href="/admin" className="hover:text-background transition-colors">{t('Admin', 'الإدارة')}</Link>
          </div>
          <p className="text-background/40 text-xs">© 2026 Tabaq. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</p>
        </div>
      </footer>
    </div>
  );
}
