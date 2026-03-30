import React, { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Link, useLocation } from "wouter";
import {
  CheckCircle2, ArrowLeft, ChevronRight, Upload, Globe,
  Phone, Mail, User, Clock, CreditCard, ChefHat, Star,
  Utensils, Coffee, Zap, Building2, AlertCircle, Image,
  MapPin, FileText, Camera, Info,
} from "lucide-react";

const BUSINESS_TYPES = [
  { id: "restaurant", labelEn: "Restaurant", labelAr: "مطعم", icon: Utensils, descEn: "Full-service dining", descAr: "مطعم بخدمة كاملة" },
  { id: "cafe", labelEn: "Café / Coffee Shop", labelAr: "كافيه", icon: Coffee, descEn: "Coffee & light bites", descAr: "قهوة ومشروبات" },
  { id: "chef", labelEn: "Private Chef / Cook", labelAr: "طاهٍ خاص", icon: ChefHat, descEn: "In-home or pop-up dining", descAr: "طعام منزلي أو مؤقت" },
  { id: "catering", labelEn: "Catering Service", labelAr: "خدمة تقديم طعام", icon: Building2, descEn: "Events & corporate", descAr: "فعاليات ومناسبات" },
  { id: "street_food", labelEn: "Street Food / Pop-up", labelAr: "طعام الشوارع", icon: Zap, descEn: "Casual street experience", descAr: "تجربة غير رسمية" },
  { id: "fine_dining", labelEn: "Fine Dining", labelAr: "مطعم راقٍ", icon: Star, descEn: "Premium upscale dining", descAr: "تجربة طعام فاخرة" },
];

const EXPERIENCE_CATEGORIES = [
  "Traditional Saudi Cuisine", "Arabic Meze & Mezze", "Seafood & Grills",
  "Brunch & Breakfast", "Desserts & Pastry", "Street Food Tour",
  "Cooking Class", "Farm-to-Table", "Fusion Cuisine", "Vegetarian / Vegan",
  "International Cuisine", "Private Dining Experience",
];

const CITIES_KSA = [
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Dhahran",
  "Tabuk", "Abha", "Taif", "Yanbu", "Jizan", "NEOM", "Diriyah",
];

const TOTAL_STEPS = 5;

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8" dir="ltr">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= current ? "bg-primary" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

type FormState = {
  businessType: string;
  businessNameEn: string;
  businessNameAr: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  sampleTitleEn: string;
  sampleTitleAr: string;
  sampleCategory: string;
  sampleDescription: string;
  priceRangeMin: string;
  priceRangeMax: string;
  typicalSlotTimes: string[];
  logoUrl: string;
  coverUrl: string;
  agreedToTerms: boolean;
};

const INITIAL_FORM: FormState = {
  businessType: "",
  businessNameEn: "",
  businessNameAr: "",
  contactEmail: "",
  contactPhone: "",
  city: "",
  sampleTitleEn: "",
  sampleTitleAr: "",
  sampleCategory: "",
  sampleDescription: "",
  priceRangeMin: "",
  priceRangeMax: "",
  typicalSlotTimes: [],
  logoUrl: "",
  coverUrl: "",
  agreedToTerms: false,
};

const TIME_OPTIONS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

export function ProviderRegisterPage() {
  const { t, lang } = useLanguage();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleSlotTime = (t: string) =>
    setForm(f => ({
      ...f,
      typicalSlotTimes: f.typicalSlotTimes.includes(t)
        ? f.typicalSlotTimes.filter(x => x !== t)
        : [...f.typicalSlotTimes, t],
    }));

  const canProceed = () => {
    if (step === 0) return !!form.businessType;
    if (step === 1) return form.businessNameEn.trim().length >= 2 && form.contactEmail.includes("@") && !!form.city;
    if (step === 2) return form.sampleTitleEn.trim().length >= 3 && !!form.sampleCategory;
    if (step === 3) return !!form.priceRangeMin;
    if (step === 4) return form.agreedToTerms;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/provider-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setRefCode(data.refCode ?? null);
        setSubmitted(true);
      } else {
        const err = await res.json();
        setError(err.message ?? t("Submission failed. Please try again.", "فشل الإرسال. يرجى المحاولة مرة أخرى."));
      }
    } catch {
      setError(t("Network error. Please check your connection.", "خطأ في الشبكة. يرجى التحقق من اتصالك."));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
            {t("Application Submitted!", "تم إرسال طلبك!")}
          </h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {t(
              `Thank you! Our team will review your application for "${form.businessNameEn}" and get back to you within 2-3 business days.`,
              `شكراً! سيقوم فريقنا بمراجعة طلبك لـ"${form.businessNameAr || form.businessNameEn}" والرد عليك خلال 2-3 أيام عمل.`
            )}
          </p>
          {refCode && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {t("Your Reference Code", "رمز المتابعة")}
              </p>
              <p className="text-lg font-bold text-primary tracking-widest font-mono">{refCode}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Keep this to track your application status", "احتفظ بهذا الرمز لمتابعة حالة طلبك")}
              </p>
            </div>
          )}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-start">
            <p className="text-xs font-semibold text-foreground mb-3">{t("What happens next:", "ماذا يحدث بعد ذلك:")}</p>
            {[
              t("Application reviewed by our team (1-2 days)", "مراجعة الطلب من فريقنا (1-2 يوم)"),
              t("Account verification & setup", "التحقق وإعداد الحساب"),
              t("Onboarding & go live!", "التأهيل والبدء!"),
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 mb-2 last:mb-0">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-sm text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/partners" className="block w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl text-center hover:bg-primary/90 transition-colors">
              {t("Back to Partner Page", "العودة لصفحة الشركاء")}
            </Link>
            <Link href="/" className="block w-full text-sm font-semibold py-3 rounded-xl text-center text-muted-foreground hover:text-foreground transition-colors">
              {t("Go to Homepage", "الصفحة الرئيسية")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Sub-header */}
      <div className="border-b border-border bg-card sticky top-16 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/partners" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t("Back", "رجوع")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-border" />
            <span className="text-sm font-semibold text-foreground">
              {t("Experience Provider Registration", "تسجيل مزود تجارب")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("Step", "خطوة")} {step + 1} {t("of", "من")} {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <StepBar current={step} total={TOTAL_STEPS} />

        {/* Step 0: Business type */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
              {t("What type of experience host are you?", "ما نوع مضيف التجارب أنت؟")}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("This helps us tailor the best setup for your experiences on Tabaq.", "هذا يساعدنا في تخصيص أفضل إعداد لتجاربك على طبق.")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => update("businessType", type.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-start transition-all hover:border-primary/30 ${form.businessType === type.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${form.businessType === type.id ? "bg-primary/10" : "bg-secondary"}`}>
                    <type.icon className={`w-5 h-5 ${form.businessType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${form.businessType === type.id ? "text-primary" : "text-foreground"}`}>
                      {lang === "ar" ? type.labelAr : type.labelEn}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === "ar" ? type.descAr : type.descEn}
                    </p>
                  </div>
                  {form.businessType === type.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Business info */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
              {t("Business Information", "معلومات النشاط")}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("Tell guests and our team about your business.", "أخبر الضيوف وفريقنا عن نشاطك.")}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Business Name (English)", "اسم النشاط (إنجليزي)")} *
                  </label>
                  <input
                    value={form.businessNameEn}
                    onChange={e => update("businessNameEn", e.target.value)}
                    placeholder="e.g. Al Nakheel Dining"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Business Name (Arabic)", "اسم النشاط (عربي)")}
                  </label>
                  <input
                    value={form.businessNameAr}
                    onChange={e => update("businessNameAr", e.target.value)}
                    placeholder="مثال: مطعم النخيل"
                    dir="rtl"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Contact Email", "البريد الإلكتروني")} *
                  </label>
                  <div className="flex">
                    <span className="border border-e-0 border-border rounded-s-xl px-3 bg-secondary text-sm text-muted-foreground flex items-center">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      value={form.contactEmail}
                      onChange={e => update("contactEmail", e.target.value)}
                      type="email"
                      placeholder="host@example.com"
                      className="flex-1 border border-border rounded-e-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Contact Phone", "رقم الهاتف")}
                  </label>
                  <div className="flex">
                    <span className="border border-e-0 border-border rounded-s-xl px-3 bg-secondary text-sm text-muted-foreground flex items-center">+966</span>
                    <input
                      value={form.contactPhone}
                      onChange={e => update("contactPhone", e.target.value)}
                      type="tel"
                      placeholder="5X XXX XXXX"
                      className="flex-1 border border-border rounded-e-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("City", "المدينة")} *
                </label>
                <select
                  value={form.city}
                  onChange={e => update("city", e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                >
                  <option value="">{t("Select city...", "اختر المدينة...")}</option>
                  {CITIES_KSA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Sample experience */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
              {t("Sample Experience", "تجربة نموذجية")}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("Tell us about the type of experience you plan to offer.", "أخبرنا عن نوع التجربة التي تخطط لتقديمها.")}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Experience Title (English)", "عنوان التجربة (إنجليزي)")} *
                  </label>
                  <input
                    value={form.sampleTitleEn}
                    onChange={e => update("sampleTitleEn", e.target.value)}
                    placeholder="e.g. Authentic Saudi Feast"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Experience Title (Arabic)", "عنوان التجربة (عربي)")}
                  </label>
                  <input
                    value={form.sampleTitleAr}
                    onChange={e => update("sampleTitleAr", e.target.value)}
                    placeholder="مثال: وليمة سعودية أصيلة"
                    dir="rtl"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  {t("Experience Category", "فئة التجربة")} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => update("sampleCategory", cat)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        form.sampleCategory === cat
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("Description", "الوصف")}
                </label>
                <textarea
                  value={form.sampleDescription}
                  onChange={e => update("sampleDescription", e.target.value)}
                  placeholder={t("Describe the experience you'll offer to guests...", "صف التجربة التي ستقدمها للضيوف...")}
                  rows={4}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing & availability */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
              {t("Pricing & Availability", "التسعير والتوفر")}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("Set your price range and typical availability.", "حدد نطاق سعرك وتوافرك المعتاد.")}
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("Price Range per Person (SAR)", "نطاق السعر للشخص (ريال)")} *
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      value={form.priceRangeMin}
                      onChange={e => update("priceRangeMin", e.target.value)}
                      type="number"
                      placeholder={t("Min", "الأدنى")}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm">{t("to", "إلى")}</span>
                  <div className="flex-1">
                    <input
                      value={form.priceRangeMax}
                      onChange={e => update("priceRangeMax", e.target.value)}
                      type="number"
                      placeholder={t("Max", "الأقصى")}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  {t("Typical Slot Times", "أوقات الجلسات المعتادة")}
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("Select the times you typically host experiences.", "اختر الأوقات التي تستضيف فيها التجارب عادةً.")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => toggleSlotTime(time)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                        form.typicalSlotTimes.includes(time)
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {time}
                    </button>
                  ))}
                </div>
                {form.typicalSlotTimes.length > 0 && (
                  <p className="text-xs text-primary mt-2 font-medium">
                    {form.typicalSlotTimes.length} {t("time(s) selected", "وقت مختار")}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  {t(
                    "You can set exact pricing and availability per experience after your account is approved.",
                    "يمكنك تحديد التسعير الدقيق والتوفر لكل تجربة بعد الموافقة على حسابك."
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Media & Review */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
              {t("Media & Review", "الوسائط والمراجعة")}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("Add your logo and cover image, then review and submit.", "أضف شعارك وصورة الغلاف، ثم راجع وأرسل.")}
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Logo URL", "رابط الشعار")}
                  </label>
                  <div className="flex">
                    <span className="border border-e-0 border-border rounded-s-xl px-3 bg-secondary text-sm text-muted-foreground flex items-center">
                      <Image className="w-4 h-4" />
                    </span>
                    <input
                      value={form.logoUrl}
                      onChange={e => update("logoUrl", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 border border-border rounded-e-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("Cover Photo URL", "رابط صورة الغلاف")}
                  </label>
                  <div className="flex">
                    <span className="border border-e-0 border-border rounded-s-xl px-3 bg-secondary text-sm text-muted-foreground flex items-center">
                      <Camera className="w-4 h-4" />
                    </span>
                    <input
                      value={form.coverUrl}
                      onChange={e => update("coverUrl", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 border border-border rounded-e-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-secondary/40 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-foreground text-sm">{t("Application Summary", "ملخص الطلب")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {[
                    { label: t("Business Type", "نوع النشاط"), val: BUSINESS_TYPES.find(b => b.id === form.businessType)?.[lang === "ar" ? "labelAr" : "labelEn"] ?? "—" },
                    { label: t("Business Name", "اسم النشاط"), val: form.businessNameEn || "—" },
                    { label: t("City", "المدينة"), val: form.city || "—" },
                    { label: t("Email", "البريد"), val: form.contactEmail || "—" },
                    { label: t("Sample Experience", "التجربة النموذجية"), val: form.sampleTitleEn || "—" },
                    { label: t("Category", "الفئة"), val: form.sampleCategory || "—" },
                    { label: t("Price Range", "نطاق السعر"), val: form.priceRangeMin ? `${form.priceRangeMin}–${form.priceRangeMax || "?"} SAR` : "—" },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-xs text-muted-foreground">{item.label}:</span>{" "}
                      <span className="font-medium text-foreground text-xs">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={e => update("agreedToTerms", e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    "I agree to Tabaq's Partner Terms of Service, Privacy Policy, and confirm that all provided information is accurate.",
                    "أوافق على شروط خدمة شركاء طبق وسياسة الخصوصية، وأؤكد أن جميع المعلومات المقدمة دقيقة."
                  )}
                </span>
              </label>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("Back", "رجوع")}
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("Continue", "المتابعة")}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? t("Submitting...", "جارٍ الإرسال...") : t("Submit Application", "إرسال الطلب")}
              {!submitting && <CheckCircle2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
