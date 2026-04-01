import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import {
  Utensils, Building2, Coffee, ChefHat, Star, MapPin,
  CheckCircle2, ArrowRight, ArrowLeft, Upload, Globe,
  Phone, Mail, User, FileText, Clock, CreditCard,
  Zap, Shield, TrendingUp, ChevronRight, Info, AlertCircle, X
} from 'lucide-react';

// ─── Types & Constants ─────────────────────────────────────────────
type BusinessType = 'restaurant' | 'cafe' | 'fast_food' | 'cloud_kitchen' | 'catering' | 'bakery' | 'fine_dining';

const BUSINESS_TYPES = [
  { id: 'restaurant', label: 'Restaurant', labelAr: 'مطعم', icon: Utensils, desc: 'Full-service dining establishment', descAr: 'مطعم بخدمة كاملة' },
  { id: 'cafe', label: 'Café / Coffee Shop', labelAr: 'كافيه', icon: Coffee, desc: 'Coffee, tea, and light bites', descAr: 'قهوة وشاي ووجبات خفيفة' },
  { id: 'fast_food', label: 'Fast Food / Quick Service', labelAr: 'وجبات سريعة', icon: Zap, desc: 'Counter service and takeaway', descAr: 'خدمة عداد والوجبات المحمولة' },
  { id: 'fine_dining', label: 'Fine Dining', labelAr: 'مطعم راقٍ', icon: Star, desc: 'Premium, upscale dining experience', descAr: 'تجربة طعام راقية ومميزة' },
  { id: 'cloud_kitchen', label: 'Cloud Kitchen', labelAr: 'مطبخ سحابي', icon: ChefHat, desc: 'Delivery-only, no dine-in', descAr: 'توصيل فقط بدون صالة طعام' },
  { id: 'catering', label: 'Catering Service', labelAr: 'خدمة تقديم طعام', icon: Building2, desc: 'Events, weddings, corporate', descAr: 'فعاليات وأعراس وشركات' },
] as const;

const CUISINE_OPTIONS = [
  'Saudi Cuisine', 'Middle Eastern', 'Indian', 'Chinese', 'Japanese', 'Korean',
  'Italian', 'American', 'Mediterranean', 'Lebanese', 'Turkish', 'Mexican',
  'French', 'Seafood', 'Vegetarian / Vegan', 'Bakery & Pastry', 'Fusion',
];

const CITIES_KSA = [
  'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran',
  'Tabuk', 'Abha', 'Taif', 'Yanbu', 'Jizan', 'NEOM', 'Diriyah',
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '199 SAR/mo',
    features: ['Up to 100 reservations/month', 'Basic analytics dashboard', 'Menu management', 'Customer reviews access'],
    popular: false,
    color: 'border-border',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '499 SAR/mo',
    features: ['Unlimited reservations', 'Advanced analytics & reports', 'Offers & voucher creation', 'Priority listing & badge', 'Business Console full access', 'Dedicated account manager'],
    popular: true,
    color: 'border-primary',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: ['Everything in Professional', 'Multi-branch management', 'Custom integrations', 'White-label options', 'API access', 'SLA & priority support'],
    popular: false,
    color: 'border-border',
  },
];

const TOTAL_STEPS = 5;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8" dir="ltr">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < current ? 'bg-primary' : i === current ? 'bg-primary' : 'bg-border'}`} />
        </React.Fragment>
      ))}
    </div>
  );
}

export function ProviderRegistrationPage() {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessType: '' as BusinessType | '',
    nameEn: '',
    nameAr: '',
    cuisines: [] as string[],
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    nationalId: '',
    crNumber: '',
    description: '',
    seatingCapacity: '',
    plan: 'professional',
    agreedToTerms: false,
  });

  const update = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleCuisine = (c: string) => {
    setForm(f => ({
      ...f,
      cuisines: f.cuisines.includes(c) ? f.cuisines.filter(x => x !== c) : [...f.cuisines, c].slice(0, 5),
    }));
  };

  const canProceed = () => {
    if (step === 0) return !!form.businessType;
    if (step === 1) return form.nameEn.trim().length >= 2 && form.cuisines.length > 0 && !!form.city;
    if (step === 2) return form.phone.trim().length >= 9 && form.email.includes('@');
    if (step === 3) return form.ownerName.trim().length >= 2 && form.ownerEmail.includes('@') && form.crNumber.trim().length >= 6;
    if (step === 4) return !!form.plan && form.agreedToTerms;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/partner-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setRefCode(data.refCode ?? null);
        setSubmitted(true);
      } else {
        const err = await res.json();
        alert(err.message || 'Submission failed. Please try again.');
      }
    } catch {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">{t('Application Submitted!', 'تم إرسال طلبك!')}</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {t(
              `Thank you, ${form.ownerName}. Our team will review your application for ${form.nameEn || 'your business'} and get back to you within 2-3 business days.`,
              `شكراً ${form.ownerName}. سيقوم فريقنا بمراجعة طلبك لـ${form.nameAr || form.nameEn || 'نشاطك التجاري'} والرد عليك خلال 2-3 أيام عمل.`
            )}
          </p>
          {refCode && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-muted-foreground mb-1">{t('Your Reference Code', 'رمز المتابعة')}</p>
              <p className="text-lg font-bold text-primary tracking-widest font-mono">{refCode}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('Keep this code to track your application status', 'احتفظ بهذا الرمز لمتابعة حالة طلبك')}</p>
            </div>
          )}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-start">
            <p className="text-xs font-semibold text-foreground mb-3">{t('What happens next:', 'ماذا يحدث بعد ذلك:')}</p>
            {[
              t('Application reviewed by our team (1-2 days)', 'مراجعة الطلب من فريقنا (1-2 يوم)'),
              t('Documents verification', 'التحقق من المستندات'),
              t('Account activation & onboarding call', 'تفعيل الحساب ومكالمة التأهيل'),
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 mb-2 last:mb-0">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-sm text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/partners" className="block w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl text-center hover:bg-primary/90 transition-colors">
              {t('Back to Partner Page', 'العودة لصفحة الشركاء')}
            </Link>
            <Link href="/" className="block w-full text-sm font-semibold py-3 rounded-xl text-center text-muted-foreground hover:text-foreground transition-colors">
              {t('Go to Homepage', 'الصفحة الرئيسية')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-16 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/partners" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('Back', 'رجوع')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-border" />
            <span className="text-sm font-semibold text-foreground">{t('Partner Registration', 'تسجيل شريك')}</span>
          </div>
          <span className="text-xs text-muted-foreground">{t('Step', 'خطوة')} {step + 1} {t('of', 'من')} {TOTAL_STEPS}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* ── Step 0: Business Type ── */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">{t('What type of business?', 'ما نوع نشاطك التجاري؟')}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t('This helps us tailor the best setup for your business on Tabaq.', 'هذا يساعدنا في تخصيص أفضل إعداد لنشاطك على طبق.')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => update('businessType', type.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-start transition-all hover:border-primary/30 ${form.businessType === type.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${form.businessType === type.id ? 'bg-primary/10' : 'bg-secondary'}`}>
                    <type.icon className={`w-5 h-5 ${form.businessType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${form.businessType === type.id ? 'text-primary' : 'text-foreground'}`}>
                      {lang === 'ar' ? type.labelAr : type.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? type.descAr : type.desc}</p>
                  </div>
                  {form.businessType === type.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary ms-auto mt-0.5 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Business Details ── */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">{t('Business Details', 'تفاصيل النشاط التجاري')}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t('Tell us about your establishment.', 'أخبرنا عن مؤسستك.')}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Business Name (English)', 'اسم النشاط (بالإنجليزية)')} *</label>
                  <input value={form.nameEn} onChange={e => update('nameEn', e.target.value)} placeholder="e.g. Najd Village" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Business Name (Arabic)', 'اسم النشاط (بالعربية)')}</label>
                  <input value={form.nameAr} onChange={e => update('nameAr', e.target.value)} placeholder="مثال: قرية نجد" dir="rtl" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('City', 'المدينة')} *</label>
                  <select value={form.city} onChange={e => update('city', e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                    <option value="">{t('Select city...', 'اختر المدينة...')}</option>
                    {CITIES_KSA.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Seating Capacity', 'السعة')}</label>
                  <input value={form.seatingCapacity} onChange={e => update('seatingCapacity', e.target.value)} type="number" placeholder="e.g. 80" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Address', 'العنوان')}</label>
                <input value={form.address} onChange={e => update('address', e.target.value)} placeholder={t('Full address...', 'العنوان الكامل...')} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">{t('Cuisine Types', 'أنواع المطبخ')} * <span className="font-normal text-muted-foreground">(up to 5)</span></label>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map(c => (
                    <button key={c} onClick={() => toggleCuisine(c)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${form.cuisines.includes(c) ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {form.cuisines.length > 0 && <p className="text-xs text-primary mt-2 font-medium">{form.cuisines.length} selected</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Short Description', 'وصف مختصر')}</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder={t('Tell diners what makes your place special...', 'أخبر الزبائن ما الذي يجعل مكانك مميزاً...')} rows={3} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Contact Info ── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">{t('Contact Information', 'معلومات الاتصال')}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t('How should customers and our team reach you?', 'كيف يمكن للعملاء وفريقنا الوصول إليك؟')}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Business Phone', 'هاتف النشاط')} *</label>
                  <div className="flex">
                    <span className="border border-e-0 border-border rounded-s-xl px-3 bg-secondary text-sm text-muted-foreground flex items-center">+966</span>
                    <input value={form.phone} onChange={e => update('phone', e.target.value)} type="tel" placeholder="5X XXX XXXX" className="flex-1 border border-border rounded-e-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Business Email', 'بريد النشاط')} *</label>
                  <input value={form.email} onChange={e => update('email', e.target.value)} type="email" placeholder="info@yourrestaurant.com" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Website (optional)', 'الموقع الإلكتروني (اختياري)')}</label>
                <div className="flex">
                  <span className="border border-e-0 border-border rounded-s-xl px-3 bg-secondary text-sm text-muted-foreground flex items-center"><Globe className="w-4 h-4" /></span>
                  <input value={form.website} onChange={e => update('website', e.target.value)} type="url" placeholder="https://yourrestaurant.com" className="flex-1 border border-border rounded-e-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Owner / Legal ── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">{t('Owner & Legal Details', 'معلومات المالك والقانونية')}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t('Required for verification and account setup.', 'مطلوب للتحقق وإعداد الحساب.')}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Owner Full Name', 'اسم المالك الكامل')} *</label>
                  <input value={form.ownerName} onChange={e => update('ownerName', e.target.value)} placeholder={t('Full name', 'الاسم الكامل')} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Owner Phone', 'هاتف المالك')}</label>
                  <div className="flex">
                    <span className="border border-e-0 border-border rounded-s-xl px-3 bg-secondary text-sm text-muted-foreground flex items-center">+966</span>
                    <input value={form.ownerPhone} onChange={e => update('ownerPhone', e.target.value)} type="tel" placeholder="5X XXX XXXX" className="flex-1 border border-border rounded-e-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Owner Email', 'بريد المالك')} *</label>
                <input value={form.ownerEmail} onChange={e => update('ownerEmail', e.target.value)} type="email" placeholder="owner@email.com" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('Commercial Registration (CR)', 'السجل التجاري')} *</label>
                  <input value={form.crNumber} onChange={e => update('crNumber', e.target.value)} placeholder="e.g. 1234567890" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t('National ID / Iqama', 'الهوية الوطنية / الإقامة')}</label>
                  <input value={form.nationalId} onChange={e => update('nationalId', e.target.value)} placeholder="ID number" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground font-mono" />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('Your information is encrypted and used only for verification. We comply with Saudi PDPL data protection regulations.', 'معلوماتك مشفرة وتستخدم فقط للتحقق. نحن نمتثل لنظام حماية البيانات الشخصية السعودي.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Plan Selection ── */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">{t('Choose Your Plan', 'اختر خطتك')}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t('Start free for 30 days. No credit card required to apply.', 'ابدأ مجاناً لمدة 30 يوماً. لا يلزم بطاقة ائتمان للتقديم.')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {PLANS.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => update('plan', plan.id)}
                  className={`relative text-start p-4 rounded-xl border-2 transition-all hover:border-primary/40 ${form.plan === plan.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 start-4 bg-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {t('Most Popular', 'الأكثر شيوعاً')}
                    </span>
                  )}
                  <p className={`text-sm font-bold mb-1 ${form.plan === plan.id ? 'text-primary' : 'text-foreground'}`}>{plan.name}</p>
                  <p className="text-base font-black text-foreground mb-3">{plan.price}</p>
                  <div className="space-y-1.5">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${form.plan === plan.id ? 'text-primary' : 'text-emerald-500'}`} />
                        <span className="text-xs text-muted-foreground leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-foreground mb-2">{t('Registration Summary', 'ملخص التسجيل')}</p>
              <div className="space-y-1 text-sm">
                {[
                  { label: t('Business', 'النشاط'), val: form.nameEn || '—' },
                  { label: t('Type', 'النوع'), val: BUSINESS_TYPES.find(b => b.id === form.businessType)?.label || '—' },
                  { label: t('City', 'المدينة'), val: form.city || '—' },
                  { label: t('Plan', 'الخطة'), val: PLANS.find(p => p.id === form.plan)?.name || '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <div className={`w-4.5 h-4.5 border-2 rounded transition-all shrink-0 mt-0.5 flex items-center justify-center ${form.agreedToTerms ? 'bg-primary border-primary' : 'border-border'}`} style={{ width: 18, height: 18 }} onClick={() => update('agreedToTerms', !form.agreedToTerms)}>
                {form.agreedToTerms && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t('I agree to the ', 'أوافق على ')}
                <Link href="/terms" className="text-primary hover:underline">{t('Terms of Service', 'شروط الخدمة')}</Link>
                {t(' and ', ' و')}
                <Link href="/privacy" className="text-primary hover:underline">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>
                {t('. I confirm all information provided is accurate.', '. أؤكد أن جميع المعلومات المقدمة دقيقة.')}
              </span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/60">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={`flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors ${step === 0 ? 'invisible' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('Back', 'رجوع')}
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              {t('Continue', 'متابعة')}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-8 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t('Submitting...', 'جارٍ الإرسال...')}
                </span>
              ) : (
                <>
                  {t('Submit Application', 'إرسال الطلب')}
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
