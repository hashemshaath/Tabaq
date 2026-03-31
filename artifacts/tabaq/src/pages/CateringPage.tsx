import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useCity } from '@/context/CityContext';
import {
  ChefHat, Users, Star, MapPin, CheckCircle2, ArrowRight, Phone,
  Mail, Calendar, Building2, Heart, Utensils, Search, SlidersHorizontal,
  Send, X, ChevronDown, Clock, Award, Globe, Sparkles,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CateringPackage {
  id: number;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  pricePerPerson: string;
  minGuests: number;
  maxGuests?: number;
  currency: string;
  imageUrl?: string;
  includedDishes?: Array<{ nameEn: string; nameAr: string; description?: string }>;
  restaurantNameEn?: string;
  restaurantNameAr?: string;
  restaurantCoverImageUrl?: string;
  menuType?: string;
}

// ── Mock/fallback data (shown when DB has no catering packages yet) ─────────
const MOCK_PACKAGES: CateringPackage[] = [
  {
    id: -1,
    nameEn: 'Prestige Corporate Package',
    nameAr: 'باقة بريستيج للشركات',
    descriptionEn: 'Elegant multi-course dining for board meetings, client entertainment, and corporate milestones. Includes dedicated service team and custom menu curation.',
    descriptionAr: 'مأدبة راقية متعددة الأطباق للاجتماعات والضيافة الرسمية. تشمل فريق خدمة مخصص وقائمة طعام مصممة خصيصاً.',
    pricePerPerson: '180',
    minGuests: 20,
    maxGuests: 200,
    currency: 'SAR',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    restaurantNameEn: 'Nobu Riyadh',
    restaurantNameAr: 'نوبو الرياض',
    menuType: 'catering',
    includedDishes: [
      { nameEn: 'Welcome canapés selection', nameAr: 'مقبلات الترحيب' },
      { nameEn: 'Premium cold mezze spread', nameAr: 'مزة باردة فاخرة' },
      { nameEn: 'Chef\'s signature main course', nameAr: 'الطبق الرئيسي المميز' },
      { nameEn: 'Artisan dessert station', nameAr: 'محطة الحلويات الحرفية' },
      { nameEn: 'Premium beverages', nameAr: 'مشروبات مميزة' },
    ],
  },
  {
    id: -2,
    nameEn: 'Royal Wedding Package',
    nameAr: 'باقة حفلات الزفاف الملكية',
    descriptionEn: 'An unforgettable wedding feast combining traditional Saudi hospitality with world-class gastronomy. Customizable to your cultural traditions and preferences.',
    descriptionAr: 'وليمة زفاف لا تُنسى تجمع بين الضيافة السعودية الأصيلة والمطبخ العالمي الراقي. قابلة للتخصيص وفق تقاليدكم وتفضيلاتكم.',
    pricePerPerson: '250',
    minGuests: 100,
    maxGuests: 1000,
    currency: 'SAR',
    imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
    restaurantNameEn: 'Lusin',
    restaurantNameAr: 'لوسين',
    menuType: 'catering',
    includedDishes: [
      { nameEn: 'Traditional Saudi gahwa & dates', nameAr: 'القهوة السعودية والتمور' },
      { nameEn: 'Whole roasted lamb (Ouzi)', nameAr: 'خروف محشو (أوزي)' },
      { nameEn: 'Mezze & salad spread (20+ items)', nameAr: 'مزة وسلطات (أكثر من ٢٠ صنفاً)' },
      { nameEn: 'Live cooking stations', nameAr: 'محطات الطهي الحية' },
      { nameEn: 'Custom wedding cake', nameAr: 'كعكة الزفاف المخصصة' },
      { nameEn: 'Flower water & Arabic sweets', nameAr: 'ماء الورد والحلويات العربية' },
    ],
  },
  {
    id: -3,
    nameEn: 'Ramadan Iftar Buffet',
    nameAr: 'بوفيه إفطار رمضان',
    descriptionEn: 'A lavish Ramadan Iftar experience with traditional Gulf dishes, live cooking stations, and a spectacular dessert corner. Minimum 50 guests.',
    descriptionAr: 'تجربة إفطار رمضانية فاخرة بأطباق خليجية أصيلة ومحطات طهي حية وركن حلويات مبهج. بحد أدنى ٥٠ ضيفاً.',
    pricePerPerson: '130',
    minGuests: 50,
    maxGuests: 500,
    currency: 'SAR',
    imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
    restaurantNameEn: 'Najd Village',
    restaurantNameAr: 'قرية نجد',
    menuType: 'buffet',
    includedDishes: [
      { nameEn: 'Thareed & Harees', nameAr: 'ثريد وهريس' },
      { nameEn: 'Machboos & Kabsa stations', nameAr: 'محطات المجبوس والكبسة' },
      { nameEn: 'Fresh juices & Vimto', nameAr: 'عصائر طازجة وفيمتو' },
      { nameEn: 'Luqaimat & Umm Ali', nameAr: 'لقيمات وأم علي' },
      { nameEn: 'Dates & Arabic coffee', nameAr: 'تمور وقهوة عربية' },
    ],
  },
  {
    id: -4,
    nameEn: 'Private Celebration Package',
    nameAr: 'باقة الاحتفالات الخاصة',
    descriptionEn: 'Perfect for birthdays, anniversaries, graduation parties and family milestones. Intimate and fully customizable with dedicated event manager.',
    descriptionAr: 'مثالية لأعياد الميلاد والمناسبات الخاصة والتخرج. خاصة وقابلة للتخصيص الكامل مع مدير حدث مخصص.',
    pricePerPerson: '95',
    minGuests: 15,
    maxGuests: 80,
    currency: 'SAR',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
    restaurantNameEn: 'Sushi Sama',
    restaurantNameAr: 'سوشي ساما',
    menuType: 'catering',
    includedDishes: [
      { nameEn: 'Welcome cocktails & mocktails', nameAr: 'مشروبات الترحيب' },
      { nameEn: 'Customizable 3-course menu', nameAr: 'قائمة ٣ أطباق قابلة للتخصيص' },
      { nameEn: 'Celebration cake', nameAr: 'كعكة الاحتفال' },
      { nameEn: 'Décor & balloon setup', nameAr: 'ديكور وبالونات' },
    ],
  },
  {
    id: -5,
    nameEn: 'National Day Gala',
    nameAr: 'حفل اليوم الوطني',
    descriptionEn: 'Celebrate Saudi National Day with an authentic Arabian feast featuring regional specialties, heritage performances catering, and traditional décor.',
    descriptionAr: 'احتفل باليوم الوطني السعودي بولائم عربية أصيلة وتراث حضاري وديكور تقليدي فاخر.',
    pricePerPerson: '155',
    minGuests: 50,
    maxGuests: 600,
    currency: 'SAR',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
    restaurantNameEn: 'Najd Village',
    restaurantNameAr: 'قرية نجد',
    menuType: 'catering',
    includedDishes: [
      { nameEn: 'Traditional Saudi Kabsa feast', nameAr: 'كبسة سعودية تقليدية' },
      { nameEn: 'Whole roasted sheep', nameAr: 'خروف مشوي كامل' },
      { nameEn: 'Heritage dessert selection', nameAr: 'تشكيلة حلويات تراثية' },
      { nameEn: 'Arabic coffee & date ceremony', nameAr: 'قهوة عربية وحفل التمور' },
    ],
  },
  {
    id: -6,
    nameEn: 'Business Lunch Package',
    nameAr: 'باقة غداء الأعمال',
    descriptionEn: 'Smart, efficient, and impressive. Designed for working lunches, team meals, and mid-day corporate meetings without compromising on quality.',
    descriptionAr: 'ذكي وفعال ومبهر. مصمم لغداء العمل واجتماعات النهار دون المساومة على الجودة.',
    pricePerPerson: '75',
    minGuests: 10,
    maxGuests: 100,
    currency: 'SAR',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
    restaurantNameEn: 'The Butcher Shop',
    restaurantNameAr: 'ذا بوتشر شوب',
    menuType: 'catering',
    includedDishes: [
      { nameEn: 'Executive salad bar', nameAr: 'بار السلطات التنفيذي' },
      { nameEn: '2 protein mains + sides', nameAr: '٢ طبق رئيسي + مرافقات' },
      { nameEn: 'Artisan bread & spreads', nameAr: 'خبز حرفي ومرافقاته' },
      { nameEn: 'Dessert & coffee station', nameAr: 'محطة الحلويات والقهوة' },
    ],
  },
];

const EVENT_TYPES = [
  { id: 'all', labelEn: 'All Events', labelAr: 'جميع المناسبات', icon: Sparkles },
  { id: 'corporate', labelEn: 'Corporate', labelAr: 'شركات وأعمال', icon: Building2 },
  { id: 'wedding', labelEn: 'Weddings', labelAr: 'حفلات الزفاف', icon: Heart },
  { id: 'iftar', labelEn: 'Ramadan Iftar', labelAr: 'إفطار رمضان', icon: Utensils },
  { id: 'national', labelEn: 'National Day', labelAr: 'اليوم الوطني', icon: Award },
  { id: 'private', labelEn: 'Private Party', labelAr: 'حفلات خاصة', icon: Star },
];

const HOW_IT_WORKS = [
  { num: '01', titleEn: 'Browse & Filter', titleAr: 'تصفح وفلتر', descEn: 'Explore catering packages by event type, headcount, budget and cuisine style.', descAr: 'استعرض باقات التموين حسب نوع المناسبة والعدد والميزانية.' },
  { num: '02', titleEn: 'Submit Inquiry', titleAr: 'أرسل طلبك', descEn: 'Fill in your event details and requirements. We\'ll match you with the ideal package.', descAr: 'أدخل تفاصيل مناسبتك. سنوافقك على الباقة المثالية.' },
  { num: '03', titleEn: 'Get a Quote', titleAr: 'احصل على عرض', descEn: 'Receive a customised proposal within 24 hours. Adjust and finalise to your taste.', descAr: 'استلم عرضاً مخصصاً خلال ٢٤ ساعة. عدّله وأتمّه وفق ذوقك.' },
  { num: '04', titleEn: 'Enjoy Your Event', titleAr: 'استمتع بمناسبتك', descEn: 'Sit back while our culinary team handles everything — from setup to service.', descAr: 'استرح بينما يتولى فريقنا الطهوي كل شيء من الإعداد حتى الخدمة.' },
];

const WHY_CHOOSE = [
  { icon: ChefHat, titleEn: 'Elite Restaurant Partners', titleAr: 'شراكات مطاعم النخبة', descEn: 'Packages from top-rated Tabaq restaurants with verified culinary teams.', descAr: 'باقات من أفضل مطاعم طبق مع فرق طهي موثقة.' },
  { icon: SlidersHorizontal, titleEn: 'Fully Customizable', titleAr: 'قابل للتخصيص بالكامل', descEn: 'Every menu, portion and dietary requirement adjusted to your brief.', descAr: 'كل قائمة ووجبة ومتطلب غذائي مُكيَّف وفق طلبك.' },
  { icon: Clock, titleEn: '24-Hour Response', titleAr: 'استجابة خلال ٢٤ ساعة', descEn: 'Our events team responds to all inquiries within one business day.', descAr: 'يرد فريق الفعاليات على جميع الاستفسارات خلال يوم عمل واحد.' },
  { icon: Globe, titleEn: 'All KSA Regions', titleAr: 'جميع مناطق المملكة', descEn: 'Serving Riyadh, Jeddah, Dammam, Makkah and beyond nationwide.', descAr: 'نخدم الرياض وجدة والدمام ومكة وسائر أنحاء المملكة.' },
];

// ─── Inquiry Modal ─────────────────────────────────────────────────────────────
function InquiryModal({ pkg, onClose, t, lang }: { pkg: CateringPackage | null; onClose: () => void; t: (en: string, ar: string) => string; lang: string }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', eventType: '', eventDate: '', guestCount: String(pkg?.minGuests ?? 50), notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refCode, setRefCode] = useState('');

  if (!pkg) return null;
  const safePkg = pkg;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/catering/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: safePkg.id > 0 ? safePkg.id : null, restaurantId: null, ...form }),
      });
      const data = await r.json();
      if (r.ok) { setSubmitted(true); setRefCode(data.referenceCode); }
    } catch {}
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground text-lg">{t('Request a Quote', 'طلب عرض أسعار')}</h2>
            <p className="text-sm text-muted-foreground">{lang === 'ar' ? pkg.nameAr : pkg.nameEn} · {lang === 'ar' ? pkg.restaurantNameAr : pkg.restaurantNameEn}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t('Inquiry Submitted!', 'تم تقديم الطلب!')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('Our events team will contact you within 24 hours.', 'سيتواصل معك فريق الفعاليات خلال ٢٤ ساعة.')}</p>
            <div className="bg-secondary/50 rounded-xl px-4 py-3 inline-block">
              <p className="text-xs text-muted-foreground">{t('Reference Code', 'رمز المرجع')}</p>
              <p className="font-mono font-bold text-primary text-lg">{refCode}</p>
            </div>
            <button onClick={onClose} className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors">
              {t('Done', 'إغلاق')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{lang === 'ar' ? pkg.nameAr : pkg.nameEn}</p>
                <p className="text-xs text-muted-foreground">{t('from', 'من')} {pkg.currency} {pkg.pricePerPerson} / {t('person', 'شخص')} · {t('min', 'حد أدنى')} {pkg.minGuests} {t('guests', 'ضيف')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t('Your Name *', 'اسمك *')}</label>
                <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder={t('Full name', 'الاسم الكامل')} className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t('Phone *', 'الجوال *')}</label>
                <input required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+966 5xx xxx xxxx" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t('Email', 'البريد الإلكتروني')}</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@email.com" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t('Event Type *', 'نوع المناسبة *')}</label>
                <select required value={form.eventType} onChange={e => setForm(f => ({...f, eventType: e.target.value}))} className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">{t('Select type', 'اختر النوع')}</option>
                  {EVENT_TYPES.filter(e => e.id !== 'all').map(ev => (
                    <option key={ev.id} value={ev.id}>{lang === 'ar' ? ev.labelAr : ev.labelEn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t('Event Date', 'تاريخ المناسبة')}</label>
                <input type="date" value={form.eventDate} onChange={e => setForm(f => ({...f, eventDate: e.target.value}))} className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t('Guest Count *', 'عدد الضيوف *')}</label>
                <input required type="number" min={pkg.minGuests} value={form.guestCount} onChange={e => setForm(f => ({...f, guestCount: e.target.value}))} className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">{t('Special Requirements', 'متطلبات خاصة')}</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder={t('Dietary restrictions, theme, preferred setup...', 'قيود غذائية، ثيم، إعداد مفضل...')} className="w-full h-20 px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {t('Submit Inquiry', 'إرسال الطلب')}
            </button>
            <p className="text-center text-xs text-muted-foreground">{t('No commitment required. We\'ll call you to finalise details.', 'لا التزام مطلوب. سنتصل بك لإتمام التفاصيل.')}</p>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, onInquire, t, lang }: { pkg: CateringPackage; onInquire: (pkg: CateringPackage) => void; t: (en: string, ar: string) => string; lang: string }) {
  const name = lang === 'ar' ? pkg.nameAr : pkg.nameEn;
  const desc = lang === 'ar' ? (pkg.descriptionAr ?? pkg.descriptionEn) : pkg.descriptionEn;
  const restaurantName = lang === 'ar' ? (pkg.restaurantNameAr ?? pkg.restaurantNameEn) : pkg.restaurantNameEn;
  const price = parseFloat(pkg.pricePerPerson);

  const guestRange = pkg.maxGuests
    ? `${pkg.minGuests} – ${pkg.maxGuests.toLocaleString()}`
    : `${pkg.minGuests}+`;

  const typeLabel = pkg.menuType === 'buffet'
    ? t('Buffet', 'بوفيه')
    : t('Catering', 'تموين');

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
      <div className="relative h-52 overflow-hidden bg-secondary">
        {pkg.imageUrl ? (
          <img src={pkg.imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 start-3 flex gap-2 flex-wrap">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{typeLabel}</span>
        </div>
        <div className="absolute bottom-3 end-3 text-end">
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-3 py-2 text-white">
            <p className="text-xs text-white/70">{t('from', 'من')}</p>
            <p className="text-lg font-black">{pkg.currency} {price.toFixed(0)}</p>
            <p className="text-[10px] text-white/70">/ {t('person', 'شخص')}</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {restaurantName && (
          <p className="text-xs text-primary font-semibold mb-1">{restaurantName}</p>
        )}
        <h3 className="font-bold text-foreground text-base mb-2 leading-snug">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{desc}</p>

        {pkg.includedDishes && pkg.includedDishes.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('Includes', 'يشمل')}</p>
            <div className="space-y-1">
              {pkg.includedDishes.slice(0, 3).map((dish, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground">{lang === 'ar' ? dish.nameAr : dish.nameEn}</span>
                </div>
              ))}
              {pkg.includedDishes.length > 3 && (
                <p className="text-xs text-primary font-semibold ps-4">+{pkg.includedDishes.length - 3} {t('more items', 'أصناف أخرى')}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-4 pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium">{guestRange} {t('guests', 'ضيف')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Utensils className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium">{typeLabel}</span>
          </div>
        </div>

        <button
          onClick={() => onInquire(pkg)}
          className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {t('Request a Quote', 'طلب عرض أسعار')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function CateringPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { selectedCityId } = useCity();

  usePageMeta({
    titleEn: 'Catering & Event Packages | Tabaq',
    titleAr: 'باقات التموين والفعاليات | طبق',
    descriptionEn: 'Discover premium catering packages for weddings, corporate events, Ramadan Iftar and private parties across Saudi Arabia. Request a quote from top restaurants on Tabaq.',
    descriptionAr: 'اكتشف باقات تموين فاخرة للزفاف والشركات وإفطار رمضان والحفلات الخاصة في المملكة. احصل على عرض أسعار من أفضل مطاعم طبق.',
    keywords: 'catering Saudi Arabia, wedding catering Riyadh, corporate catering KSA, iftar catering, تموين السعودية, تموين حفلات, تموين شركات, طبق',
    type: 'website',
  }, lang);

  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [guestCount, setGuestCount] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [searchQ, setSearchQ] = useState<string>('');
  const [inquiryPkg, setInquiryPkg] = useState<CateringPackage | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['catering-packages', selectedCityId, guestCount, maxBudget],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCityId) params.set('cityId', String(selectedCityId));
      if (guestCount) params.set('minGuests', guestCount);
      if (maxBudget) params.set('maxBudget', maxBudget);
      const r = await fetch(`/api/catering/packages?${params}`);
      return r.ok ? r.json() : { packages: [] };
    },
  });

  const rawPackages: CateringPackage[] = (apiData?.packages && apiData.packages.length > 0) ? apiData.packages : MOCK_PACKAGES;

  let displayed = rawPackages.filter(pkg => {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (
        !(pkg.nameEn?.toLowerCase().includes(q) || pkg.nameAr?.includes(q) ||
          pkg.restaurantNameEn?.toLowerCase().includes(q) || pkg.restaurantNameAr?.includes(q) ||
          pkg.descriptionEn?.toLowerCase().includes(q))
      ) return false;
    }
    if (guestCount && pkg.maxGuests && pkg.maxGuests < parseInt(guestCount)) return false;
    if (maxBudget && parseFloat(pkg.pricePerPerson) > parseFloat(maxBudget)) return false;
    if (selectedEvent !== 'all') {
      if (selectedEvent === 'wedding' && !pkg.nameEn?.toLowerCase().includes('wedding') && !pkg.nameAr?.includes('زفاف') && !pkg.nameAr?.includes('زواج')) return false;
      if (selectedEvent === 'corporate' && !pkg.nameEn?.toLowerCase().includes('corpor') && !pkg.nameEn?.toLowerCase().includes('business') && !pkg.nameAr?.includes('شركة') && !pkg.nameAr?.includes('أعمال')) return false;
      if (selectedEvent === 'iftar' && !pkg.nameEn?.toLowerCase().includes('iftar') && !pkg.nameEn?.toLowerCase().includes('ramadan') && !pkg.nameAr?.includes('رمضان') && !pkg.nameAr?.includes('إفطار')) return false;
      if (selectedEvent === 'national' && !pkg.nameEn?.toLowerCase().includes('national') && !pkg.nameAr?.includes('وطني')) return false;
      if (selectedEvent === 'private' && !pkg.nameEn?.toLowerCase().includes('private') && !pkg.nameEn?.toLowerCase().includes('celebrat') && !pkg.nameAr?.includes('خاص') && !pkg.nameAr?.includes('احتفال')) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0a00] via-[#2d1500] to-[#0f0700]">
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"
            alt="Catering"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 text-primary text-sm font-semibold mb-6 backdrop-blur-sm">
            <ChefHat className="w-4 h-4" />
            {t('Premium Catering & Event Services', 'خدمات التموين والفعاليات الراقية')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            {t('Make Every Event', 'اجعل كل مناسبة')}
            <span className="text-primary block">{t('Extraordinary', 'استثنائية')}</span>
          </h1>
          <p className="text-lg text-white/75 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t(
              'Premium catering packages from Saudi Arabia\'s finest restaurants. Weddings, corporate events, Ramadan Iftar, and more — all tailored to perfection.',
              'باقات تموين فاخرة من أرقى مطاعم المملكة. حفلات زفاف، فعاليات الشركات، إفطار رمضان والمزيد — كلها مصممة وفق رغباتك.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#packages" className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              {t('Browse Packages', 'استعرض الباقات')}
              <ArrowRight className="w-4 h-4" />
            </a>
            <button onClick={() => setInquiryPkg(MOCK_PACKAGES[0])} className="border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/10 transition-colors backdrop-blur-sm">
              {t('Get a Custom Quote', 'احصل على عرض مخصص')}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-12">
            {[
              { val: '50+', labelEn: 'Restaurant Partners', labelAr: 'مطعم شريك' },
              { val: '1,200+', labelEn: 'Events Served', labelAr: 'فعالية مُنجزة' },
              { val: '24h', labelEn: 'Quote Response', labelAr: 'وقت الرد' },
            ].map(s => (
              <div key={s.val} className="text-center">
                <p className="text-2xl font-black text-primary">{s.val}</p>
                <p className="text-xs text-white/60 mt-1">{lang === 'ar' ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Event Type Tabs ── */}
      <section id="packages" className="border-b border-border bg-card sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {EVENT_TYPES.map(ev => {
              const Icon = ev.icon;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                    selectedEvent === ev.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {lang === 'ar' ? ev.labelAr : ev.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center mb-8">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={t('Search packages or restaurants...', 'ابحث عن باقات أو مطاعم...')}
              className="w-full ps-10 pe-4 py-3 text-sm rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border transition-colors ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'border-input bg-card hover:bg-secondary text-foreground'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('Filters', 'التصفية')}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t('Min. Guest Count', 'الحد الأدنى للضيوف')}</label>
              <input
                type="number" min={1} value={guestCount}
                onChange={e => setGuestCount(e.target.value)}
                placeholder={t('e.g. 100', 'مثال: ١٠٠')}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t('Max Budget (SAR/person)', 'الميزانية القصوى (ريال/شخص)')}</label>
              <input
                type="number" min={1} value={maxBudget}
                onChange={e => setMaxBudget(e.target.value)}
                placeholder={t('e.g. 200', 'مثال: ٢٠٠')}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setGuestCount(''); setMaxBudget(''); setSearchQ(''); setSelectedEvent('all'); }}
                className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors border border-input bg-background"
              >
                {t('Clear All', 'مسح الكل')}
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{displayed.length}</span> {t('packages available', 'باقة متاحة')}
          </p>
          {(apiData?.packages?.length === 0) && (
            <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-semibold">
              {t('Showing curated examples', 'عرض أمثلة منسقة')}
            </span>
          )}
        </div>

        {/* Package grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-3xl overflow-hidden border border-border animate-pulse">
                <div className="h-52 bg-secondary" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-secondary rounded-full w-1/3" />
                  <div className="h-5 bg-secondary rounded-full w-3/4" />
                  <div className="h-4 bg-secondary rounded-full w-full" />
                  <div className="h-4 bg-secondary rounded-full w-5/6" />
                  <div className="h-11 bg-secondary rounded-2xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} onInquire={setInquiryPkg} t={t} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">{t('No packages match your filters', 'لا توجد باقات تطابق التصفية')}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t('Try adjusting your search or filters.', 'جرّب تعديل البحث أو التصفية.')}</p>
            <button onClick={() => { setSelectedEvent('all'); setGuestCount(''); setMaxBudget(''); setSearchQ(''); }} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors">
              {t('Show All Packages', 'عرض كل الباقات')}
            </button>
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section className="bg-secondary/40 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">{t('How It Works', 'كيف يعمل')}</h2>
            <p className="text-muted-foreground mt-2">{t('Book your dream event catering in 4 simple steps.', 'احجز تموين مناسبتك المثالية في ٤ خطوات بسيطة.')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(step => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground text-lg font-black flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {step.num}
                </div>
                <h3 className="font-bold text-foreground mb-2">{lang === 'ar' ? step.titleAr : step.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{lang === 'ar' ? step.descAr : step.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Tabaq Catering ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">{t('Why Tabaq Catering?', 'لماذا تموين طبق؟')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.titleEn} className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-2">{lang === 'ar' ? item.titleAr : item.titleEn}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lang === 'ar' ? item.descAr : item.descEn}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">{t('Ready to Plan Your Event?', 'هل أنت مستعد لتخطيط فعاليتك؟')}</h2>
          <p className="text-white/75 mb-8 text-base">
            {t('Get a personalised catering proposal from our team within 24 hours — no commitment required.', 'احصل على عرض تموين مخصص من فريقنا خلال ٢٤ ساعة — دون أي التزام.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setInquiryPkg(MOCK_PACKAGES[0])} className="bg-white text-primary px-8 py-4 rounded-2xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              {t('Send Inquiry Now', 'أرسل طلبك الآن')}
            </button>
            <a href="tel:+966920000000" className="border border-white/30 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
              <Phone className="w-4 h-4" />
              {t('Call Our Events Team', 'اتصل بفريق الفعاليات')}
            </a>
          </div>
        </div>
      </section>

      {/* ── Inquiry Modal ── */}
      {inquiryPkg && <InquiryModal pkg={inquiryPkg} onClose={() => setInquiryPkg(null)} t={t} lang={lang} />}
    </div>
  );
}
