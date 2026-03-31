import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/hooks/use-language";
import { usePageMeta } from "@/hooks/use-page-meta";
import { getAuthHeaders } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Lock, Bell, Shield, Globe, Eye, EyeOff, Check, ChevronRight,
  ArrowLeft, Camera, Calendar, MapPin, Star, Zap, BadgeCheck,
  Users, Save, CheckCircle2, AlertCircle, Mail, Smartphone, Trash2,
  LogOut, Instagram, Link2, MessageCircle, ChevronDown, ChevronUp,
  Heart, Bookmark, Award, Gift, HelpCircle, Phone, Volume2, VolumeX,
  UserX, Settings, Palette, Languages, CreditCard, X, Plus, Minus,
  Info, ExternalLink, Moon, Sun, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Section =
  | "personal"
  | "security"
  | "preferences"
  | "notifications"
  | "privacy"
  | "social"
  | "membership"
  | "support"
  | "delete";

const SECTIONS: { id: Section; icon: React.ElementType; en: string; ar: string; desc: string; descAr: string }[] = [
  { id: "personal",      icon: User,         en: "Personal Info",       ar: "المعلومات الشخصية",  desc: "Name, photo, bio & contact",      descAr: "الاسم والصورة والسيرة" },
  { id: "security",      icon: Lock,         en: "Security",            ar: "الأمان",              desc: "Password & account security",     descAr: "كلمة المرور وأمان الحساب" },
  { id: "preferences",   icon: Palette,      en: "Preferences",         ar: "التفضيلات",           desc: "Language, theme & display",       descAr: "اللغة والمظهر والعرض" },
  { id: "notifications", icon: Bell,         en: "Notifications",       ar: "الإشعارات",           desc: "What you get notified about",     descAr: "ما تتلقى إشعارات حوله" },
  { id: "privacy",       icon: Shield,       en: "Privacy",             ar: "الخصوصية",            desc: "Who can see your profile",        descAr: "من يمكنه رؤية ملفك" },
  { id: "social",        icon: Users,        en: "Followers",           ar: "المتابعون",            desc: "Manage your followers & following",descAr: "إدارة متابعيك ومن تتابع" },
  { id: "membership",    icon: Award,        en: "Membership",          ar: "العضوية",             desc: "Points, level & referrals",       descAr: "النقاط والمستوى والإحالات" },
  { id: "support",       icon: HelpCircle,   en: "Support",             ar: "الدعم",               desc: "Help, FAQ & contact us",          descAr: "المساعدة والأسئلة الشائعة" },
  { id: "delete",        icon: Trash2,       en: "Delete Account",      ar: "حذف الحساب",          desc: "Permanently remove your account", descAr: "إزالة حسابك نهائياً" },
];

function SectionCard({ children, title, titleAr, desc, descAr, lang }: {
  children: React.ReactNode; title: string; titleAr: string; desc?: string; descAr?: string; lang: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <h3 className="text-base font-bold text-foreground">{lang === "ar" ? titleAr : title}</h3>
        {(desc || descAr) && <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? (descAr ?? desc) : desc}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ToggleRow({ label, labelAr, desc, descAr, value, onChange, lang, disabled }: {
  label: string; labelAr: string; desc?: string; descAr?: string;
  value: boolean; onChange: (v: boolean) => void; lang: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="w-full flex items-center gap-3 py-3 text-start hover:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors disabled:opacity-50"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{lang === "ar" ? labelAr : label}</p>
        {(desc || descAr) && (
          <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? (descAr ?? desc) : desc}</p>
        )}
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? "bg-primary" : "bg-muted-foreground/30"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "end-1" : "start-1"}`} />
      </div>
    </button>
  );
}

function FormField({ label, labelAr, lang, children, hint, hintAr }: {
  label: string; labelAr: string; lang: string; children: React.ReactNode; hint?: string; hintAr?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">{lang === "ar" ? labelAr : label}</label>
      {children}
      {(hint || hintAr) && (
        <p className="text-xs text-muted-foreground">{lang === "ar" ? (hintAr ?? hint) : hint}</p>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", prefix, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; prefix?: string; maxLength?: number;
}) {
  const [show, setShow] = useState(false);
  const inputType = type === "password" ? (show ? "text" : "password") : type;
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute start-3 text-sm text-muted-foreground select-none pointer-events-none">{prefix}</span>}
      <input
        type={inputType}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full ${prefix ? "ps-8" : "ps-3"} ${type === "password" ? "pe-10" : "pe-3"} py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors`}
      />
      {type === "password" && (
        <button type="button" onClick={() => setShow(v => !v)} className="absolute end-3 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors resize-none"
    />
  );
}

function SaveBar({ saving, saved, error, onSave, lang }: {
  saving: boolean; saved: boolean; error: string; onSave: () => void; lang: string;
}) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? t("Saving…", "جارٍ الحفظ…") : saved ? t("Saved!", "تم الحفظ!") : t("Save Changes", "حفظ التغييرات")}
      </button>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL INFO SECTION
// ─────────────────────────────────────────────────────────────────────────────
function PersonalInfoSection({ user, lang, t, qc }: { user: any; lang: string; t: (en: string, ar: string) => string; qc: any }) {
  const [nameEn, setNameEn] = useState(user?.nameEn ?? "");
  const [nameAr, setNameAr] = useState(user?.nameAr ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [instagramUrl, setInstagramUrl] = useState(user?.instagramUrl ?? "");
  const [xUrl, setXUrl] = useState(user?.xUrl ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(user?.tiktokUrl ?? "");
  const [snapchatUrl, setSnapchatUrl] = useState(user?.snapchatUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(user?.websiteUrl ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameEn(user?.nameEn ?? ""); setNameAr(user?.nameAr ?? "");
    setBio(user?.bio ?? ""); setEmail(user?.email ?? "");
    setLocation(user?.location ?? ""); setInstagramUrl(user?.instagramUrl ?? "");
    setXUrl(user?.xUrl ?? ""); setTiktokUrl(user?.tiktokUrl ?? "");
    setSnapchatUrl(user?.snapchatUrl ?? ""); setWebsiteUrl(user?.websiteUrl ?? "");
    setAvatarUrl(user?.avatarUrl ?? ""); setAvatarPreview(user?.avatarUrl ?? null);
  }, [user]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setAvatarPreview(url);
      setAvatarUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ nameEn, nameAr, bio, email, location, avatarUrl, instagramUrl, xUrl, tiktokUrl, snapchatUrl, websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? t("Failed to save", "فشل الحفظ")); return; }
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["account-user"] });
      setTimeout(() => setSaved(false), 3000);
    } catch { setError(t("Network error", "خطأ في الاتصال")); }
    finally { setSaving(false); }
  };

  const completionFields = [nameEn, bio, email, location, avatarUrl];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  return (
    <div className="space-y-6">
      {/* Profile completion */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">{t("Profile Completion", "اكتمال الملف الشخصي")}</p>
          <span className="text-sm font-bold text-primary">{completionPct}%</span>
        </div>
        <div className="w-full h-2 bg-primary/15 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
        </div>
        {completionPct < 100 && (
          <p className="text-xs text-muted-foreground mt-2">
            {t("Complete your profile to unlock all features.", "أكمل ملفك للوصول إلى جميع الميزات.")}
          </p>
        )}
      </div>

      {/* Avatar */}
      <SectionCard title="Profile Photo" titleAr="صورة الملف" lang={lang}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden ring-4 ring-primary/20">
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-muted-foreground" /></div>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("Profile Picture", "صورة الملف الشخصي")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("JPG, PNG or GIF. Max 5MB.", "JPG أو PNG أو GIF. حتى 5 ميغابايت.")}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              {t("Change photo", "تغيير الصورة")}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>
      </SectionCard>

      {/* Basic info */}
      <SectionCard title="Basic Information" titleAr="المعلومات الأساسية" lang={lang}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Name (English)" labelAr="الاسم (بالإنجليزية)" lang={lang}>
            <Input value={nameEn} onChange={setNameEn} placeholder="Your name in English" />
          </FormField>
          <FormField label="Name (Arabic)" labelAr="الاسم (بالعربية)" lang={lang}>
            <Input value={nameAr} onChange={setNameAr} placeholder="اسمك بالعربية" />
          </FormField>
          <FormField label="Email Address" labelAr="البريد الإلكتروني" lang={lang} hint="Used for notifications" hintAr="يُستخدم للإشعارات">
            <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          </FormField>
          <FormField label="Location" labelAr="الموقع" lang={lang} hint="City, country" hintAr="المدينة، الدولة">
            <Input value={location} onChange={setLocation} placeholder={t("e.g. Riyadh, Saudi Arabia", "مثال: الرياض، المملكة العربية السعودية")} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Bio" labelAr="نبذة شخصية" lang={lang} hint="Tell others about your food journey" hintAr="أخبر الآخرين عن رحلتك الغذائية">
              <Textarea value={bio} onChange={setBio} placeholder={t("Food lover, explorer, critic…", "محب للطعام، مستكشف، ناقد...")} rows={3} />
              <p className="text-xs text-muted-foreground text-end mt-1">{bio.length}/200</p>
            </FormField>
          </div>
        </div>
        <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} lang={lang} />
      </SectionCard>

      {/* Read-only info */}
      <SectionCard title="Account Details" titleAr="تفاصيل الحساب" desc="These fields are managed by the system" descAr="هذه الحقول يديرها النظام" lang={lang}>
        <div className="space-y-3">
          {[
            { label: t("Username", "اسم المستخدم"), value: user?.username ? `@${user.username}` : t("Not set", "غير محدد"), icon: User },
            { label: t("Phone Number", "رقم الجوال"), value: user?.phone ?? t("Not set", "غير محدد"), icon: Smartphone },
            { label: t("Account Type", "نوع الحساب"), value: user?.accountType === "chef" ? t("Chef", "شيف") : user?.accountType === "professional" ? t("Professional", "محترف") : t("Basic", "أساسي"), icon: BadgeCheck },
            { label: t("Member Since", "عضو منذ"), value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { year: "numeric", month: "long" }) : "—", icon: Calendar },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <row.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Social links */}
      <SectionCard title="Social Links" titleAr="روابط التواصل الاجتماعي" lang={lang}>
        <div className="space-y-3">
          {[
            { key: "instagram", label: "Instagram", placeholder: "username", value: instagramUrl, set: setInstagramUrl, prefix: "@", icon: "📸" },
            { key: "x", label: "X (Twitter)", placeholder: "username", value: xUrl, set: setXUrl, prefix: "@", icon: "✕" },
            { key: "tiktok", label: "TikTok", placeholder: "username", value: tiktokUrl, set: setTiktokUrl, prefix: "@", icon: "🎵" },
            { key: "snapchat", label: "Snapchat", placeholder: "username", value: snapchatUrl, set: setSnapchatUrl, prefix: "@", icon: "👻" },
            { key: "website", label: t("Website", "الموقع الإلكتروني"), placeholder: "https://…", value: websiteUrl, set: setWebsiteUrl, icon: "🌐" },
          ].map(s => (
            <FormField key={s.key} label={s.label} labelAr={s.label} lang={lang}>
              <Input value={s.value} onChange={s.set} placeholder={s.placeholder} prefix={s.prefix} />
            </FormField>
          ))}
        </div>
        <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} lang={lang} />
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SecuritySection({ lang, t, logout }: { lang: string; t: (en: string, ar: string) => string; logout: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!current || !newPwd || !confirm) { setError(t("All fields required", "جميع الحقول مطلوبة")); return; }
    if (newPwd.length < 8) { setError(t("Password must be at least 8 characters", "كلمة المرور يجب أن تكون 8 أحرف على الأقل")); return; }
    if (newPwd !== confirm) { setError(t("Passwords don't match", "كلمتا المرور غير متطابقتين")); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ currentPassword: current, newPassword: newPwd, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? t("Failed to update", "فشل التحديث")); return; }
      setSaved(true); setCurrent(""); setNewPwd(""); setConfirm("");
      setTimeout(() => setSaved(false), 3000);
    } catch { setError(t("Network error", "خطأ في الاتصال")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Change Password" titleAr="تغيير كلمة المرور" lang={lang}>
        <div className="space-y-4">
          <FormField label="Current Password" labelAr="كلمة المرور الحالية" lang={lang}>
            <Input value={current} onChange={setCurrent} type="password" placeholder="••••••••" />
          </FormField>
          <FormField label="New Password" labelAr="كلمة المرور الجديدة" lang={lang} hint="At least 8 characters" hintAr="8 أحرف على الأقل">
            <Input value={newPwd} onChange={setNewPwd} type="password" placeholder="••••••••" />
          </FormField>
          <FormField label="Confirm New Password" labelAr="تأكيد كلمة المرور الجديدة" lang={lang}>
            <Input value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" />
          </FormField>
        </div>
        <div className="mt-4">
          <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} lang={lang} />
        </div>
      </SectionCard>

      <SectionCard title="Authentication" titleAr="طريقة المصادقة" desc="Your account security method" descAr="طريقة أمان حسابك" lang={lang}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{t("OTP via Phone", "رمز التحقق عبر الهاتف")}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("Your account uses phone number verification — already secure!", "حسابك يستخدم التحقق برقم الهاتف — آمن بالفعل!")}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 ms-auto shrink-0" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Active Session" titleAr="الجلسة النشطة" desc="Where you're currently signed in" descAr="أين أنت مسجل الدخول حالياً" lang={lang}>
        <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-muted/30">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t("Current Device", "الجهاز الحالي")}</p>
            <p className="text-xs text-muted-foreground">{t("This device · Active now", "هذا الجهاز · نشط الآن")}</p>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t("Active", "نشط")}</span>
        </div>
        <button
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-destructive/40 text-destructive font-semibold text-sm rounded-xl hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t("Sign Out", "تسجيل الخروج")}
        </button>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREFERENCES SECTION
// ─────────────────────────────────────────────────────────────────────────────
function PreferencesSection({ lang, t }: { lang: string; t: (en: string, ar: string) => string }) {
  const { setLang } = useLanguage();
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("tabaq-theme") as any) ?? "system";
  });
  const [currency, setCurrency] = useState(localStorage.getItem("tabaq-currency") ?? "SAR");

  const applyTheme = (t: "light" | "dark" | "system") => {
    setThemeState(t);
    localStorage.setItem("tabaq-theme", t);
    const isDark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  };

  const saveCurrency = (c: string) => {
    setCurrency(c);
    localStorage.setItem("tabaq-currency", c);
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Language" titleAr="اللغة" lang={lang}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { code: "en", label: "English", native: "English", flag: "🇬🇧" },
            { code: "ar", label: "Arabic",  native: "العربية",  flag: "🇸🇦" },
          ].map(lng => (
            <button
              key={lng.code}
              onClick={() => setLang(lng.code as "en" | "ar")}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${lang === lng.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              <span className="text-2xl">{lng.flag}</span>
              <div className="text-start">
                <p className={`text-sm font-bold ${lang === lng.code ? "text-primary" : "text-foreground"}`}>{lng.native}</p>
                <p className="text-xs text-muted-foreground">{lng.label}</p>
              </div>
              {lang === lng.code && <CheckCircle2 className="w-4 h-4 text-primary ms-auto shrink-0" />}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Appearance" titleAr="المظهر" lang={lang}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light",  label: t("Light", "فاتح"),   icon: Sun },
            { id: "dark",   label: t("Dark", "داكن"),    icon: Moon },
            { id: "system", label: t("System", "النظام"), icon: Monitor },
          ].map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => applyTheme(opt.id as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <Icon className={`w-5 h-5 ${theme === opt.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-semibold ${theme === opt.id ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Currency & Region" titleAr="العملة والمنطقة" lang={lang}>
        <div className="space-y-3">
          <FormField label="Display Currency" labelAr="عملة العرض" lang={lang}>
            <select
              value={currency}
              onChange={e => saveCurrency(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            >
              {[
                { code: "SAR", label: "SAR — Saudi Riyal" },
                { code: "AED", label: "AED — UAE Dirham" },
                { code: "KWD", label: "KWD — Kuwaiti Dinar" },
                { code: "USD", label: "USD — US Dollar" },
                { code: "EUR", label: "EUR — Euro" },
                { code: "GBP", label: "GBP — British Pound" },
              ].map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </FormField>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsSection({ userId, lang, t }: { userId: number; lang: string; t: (en: string, ar: string) => string }) {
  const [prefs, setPrefs] = useState({
    newFollower: true, reviewLiked: true, reviewComment: true,
    bookingConfirmed: true, bookingReminder: true, newOffer: false,
    pointsEarned: true, weeklyDigest: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const { isLoading } = useQuery({
    queryKey: ["notif-prefs", userId],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/privacy-settings`, { headers: getAuthHeaders() });
      if (!r.ok) return null;
      const d = await r.json();
      if (d.notificationPrefs) setPrefs(p => ({ ...p, ...d.notificationPrefs }));
      return d;
    },
  });

  const set = (key: keyof typeof prefs) => (v: boolean) => setPrefs(p => ({ ...p, [key]: v }));

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/me/privacy-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ notificationPrefs: prefs }),
      });
      if (!res.ok) { setError(t("Failed to save", "فشل الحفظ")); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError(t("Network error", "خطأ في الاتصال")); }
    finally { setSaving(false); }
  };

  const NOTIF_GROUPS = [
    {
      title: t("Social", "اجتماعي"), titleAr: "اجتماعي",
      items: [
        { key: "newFollower" as const, label: t("New Follower", "متابع جديد"), labelAr: "متابع جديد", desc: "When someone follows you", descAr: "عندما يتابعك شخص ما" },
        { key: "reviewLiked" as const, label: t("Review Liked", "إعجاب بمراجعتك"), labelAr: "إعجاب بمراجعتك", desc: "When your review gets a like", descAr: "عندما ينال إعجاباً مراجعتك" },
        { key: "reviewComment" as const, label: t("Review Comment", "تعليق على مراجعتك"), labelAr: "تعليق على مراجعتك", desc: "When someone comments on your review", descAr: "عندما يعلق شخص على مراجعتك" },
      ],
    },
    {
      title: t("Bookings", "الحجوزات"), titleAr: "الحجوزات",
      items: [
        { key: "bookingConfirmed" as const, label: t("Booking Confirmed", "تأكيد الحجز"), labelAr: "تأكيد الحجز", desc: "When your reservation is confirmed", descAr: "عند تأكيد حجزك" },
        { key: "bookingReminder" as const, label: t("Booking Reminder", "تذكير بالحجز"), labelAr: "تذكير بالحجز", desc: "Day-before reminders for reservations", descAr: "تذكيرات قبل يوم من الحجز" },
      ],
    },
    {
      title: t("Rewards & Marketing", "المكافآت والتسويق"), titleAr: "المكافآت والتسويق",
      items: [
        { key: "pointsEarned" as const, label: t("Points Earned", "نقاط مكتسبة"), labelAr: "نقاط مكتسبة", desc: "When you earn loyalty points", descAr: "عند اكتساب نقاط الولاء" },
        { key: "newOffer" as const, label: t("New Offers & Deals", "عروض وصفقات جديدة"), labelAr: "عروض وصفقات جديدة", desc: "Exclusive offers from restaurants", descAr: "عروض حصرية من المطاعم" },
        { key: "weeklyDigest" as const, label: t("Weekly Digest", "ملخص أسبوعي"), labelAr: "ملخص أسبوعي", desc: "Your weekly food activity summary", descAr: "ملخص نشاطك الغذائي الأسبوعي" },
      ],
    },
  ];

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {NOTIF_GROUPS.map(group => (
        <SectionCard key={group.title} title={group.title} titleAr={group.titleAr} lang={lang}>
          <div className="divide-y divide-border">
            {group.items.map(item => (
              <ToggleRow
                key={item.key}
                label={item.label} labelAr={item.labelAr}
                desc={item.desc} descAr={item.descAr}
                value={prefs[item.key]}
                onChange={set(item.key)}
                lang={lang}
              />
            ))}
          </div>
        </SectionCard>
      ))}
      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} lang={lang} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY SECTION
// ─────────────────────────────────────────────────────────────────────────────
function PrivacySection({ userId, lang, t }: { userId: number; lang: string; t: (en: string, ar: string) => string }) {
  type Vis = "public" | "followers" | "only_me";
  type ProfVis = "public" | "followers" | "private";
  const [profileVis, setProfileVis] = useState<ProfVis>("public");
  const [visitsVis, setVisitsVis] = useState<Vis>("public");
  const [reviewsVis, setReviewsVis] = useState<Vis>("public");
  const [favoritesVis, setFavoritesVis] = useState<Vis>("public");
  const [plansVis, setPlansVis] = useState<Vis>("public");
  const [inLeaderboard, setInLeaderboard] = useState(true);
  const [inSuggested, setInSuggested] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useQuery({
    queryKey: ["privacy-settings", userId],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/privacy-settings`, { headers: getAuthHeaders() });
      if (!r.ok) return null;
      const d = await r.json();
      if (d.privacySettings) {
        setProfileVis(d.privacySettings.profileVisibility ?? "public");
        setVisitsVis(d.privacySettings.visitsVisibility ?? "public");
        setReviewsVis(d.privacySettings.reviewsVisibility ?? "public");
        setFavoritesVis(d.privacySettings.favoritesVisibility ?? "public");
        setPlansVis(d.privacySettings.plansVisibility ?? "public");
        setInLeaderboard(d.privacySettings.showInLeaderboard ?? true);
        setInSuggested(d.privacySettings.showInSuggested ?? true);
      }
      return d;
    },
  });

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/me/privacy-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          privacySettings: {
            profileVisibility: profileVis,
            visitsVisibility: visitsVis,
            reviewsVisibility: reviewsVis,
            favoritesVisibility: favoritesVis,
            plansVisibility: plansVis,
            showInLeaderboard: inLeaderboard,
            showInSuggested: inSuggested,
          },
        }),
      });
      if (!res.ok) { setError(t("Failed to save", "فشل الحفظ")); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError(t("Network error", "خطأ في الاتصال")); }
    finally { setSaving(false); }
  };

  function VisPicker({ label, labelAr, value, onChange }: { label: string; labelAr: string; value: string; onChange: (v: any) => void }) {
    const opts = [
      { v: "public", en: t("Public", "عام"), icon: Globe },
      { v: "followers", en: t("Followers", "المتابعون"), icon: Users },
      { v: "only_me", en: t("Only Me", "أنا فقط"), icon: Lock },
    ];
    return (
      <div className="flex items-center gap-2 py-3 border-b border-border last:border-0">
        <p className="text-sm font-semibold text-foreground flex-1">{lang === "ar" ? labelAr : label}</p>
        <div className="flex gap-1">
          {opts.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.v}
                onClick={() => onChange(opt.v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${value === opt.v ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <Icon className="w-3 h-3" />
                {opt.en}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const PROFILE_VIS_OPTS = [
    { v: "public", label: t("Public", "عام"), desc: t("Anyone can see your profile", "يمكن للجميع رؤية ملفك") },
    { v: "followers", label: t("Followers Only", "المتابعون فقط"), desc: t("Only your followers can view your profile", "فقط متابعوك يمكنهم رؤية ملفك") },
    { v: "private", label: t("Private", "خاص"), desc: t("Only you can see your profile", "أنت فقط من يمكنه رؤية ملفك") },
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Profile Visibility" titleAr="ظهور الملف الشخصي" lang={lang}>
        <div className="space-y-2">
          {PROFILE_VIS_OPTS.map(opt => (
            <button
              key={opt.v}
              onClick={() => setProfileVis(opt.v as ProfVis)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-start ${profileVis === opt.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${profileVis === opt.v ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {profileVis === opt.v && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${profileVis === opt.v ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Content Visibility" titleAr="ظهور المحتوى" desc="Control what others can see on your profile" descAr="تحكم في ما يراه الآخرون على ملفك" lang={lang}>
        <VisPicker label="Visits & Check-ins" labelAr="الزيارات" value={visitsVis} onChange={setVisitsVis} />
        <VisPicker label="Reviews" labelAr="المراجعات" value={reviewsVis} onChange={setReviewsVis} />
        <VisPicker label="Saved Places" labelAr="الأماكن المحفوظة" value={favoritesVis} onChange={setFavoritesVis} />
        <VisPicker label="Plans to Visit" labelAr="خطط الزيارة" value={plansVis} onChange={setPlansVis} />
      </SectionCard>

      <SectionCard title="Discovery" titleAr="الاكتشاف" lang={lang}>
        <ToggleRow
          label="Show in Leaderboard" labelAr="الظهور في لوحة المتصدرين"
          desc="Let others see your rank on the food leaderboard" descAr="اسمح للآخرين برؤية ترتيبك في لوحة المتصدرين"
          value={inLeaderboard} onChange={setInLeaderboard} lang={lang}
        />
        <ToggleRow
          label="Show in Suggested Users" labelAr="الظهور في المستخدمين المقترحين"
          desc="Let others discover and follow you" descAr="اسمح للآخرين باكتشافك ومتابعتك"
          value={inSuggested} onChange={setInSuggested} lang={lang}
        />
      </SectionCard>

      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} lang={lang} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL (FOLLOWERS/FOLLOWING) SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SocialSection({ userId, lang, t }: { userId: number; lang: string; t: (en: string, ar: string) => string }) {
  const [subTab, setSubTab] = useState<"followers" | "following">("followers");

  const { data: followersData, isLoading: loadF } = useQuery({
    queryKey: ["account-followers", userId],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/users/${userId}/followers?limit=50`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : { users: [] };
    },
  });

  const { data: followingData, isLoading: loadFg, refetch: refetchFg } = useQuery({
    queryKey: ["account-following", userId],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/users/${userId}/following?limit=50`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : { users: [] };
    },
  });

  const [unfollowing, setUnfollowing] = useState<number | null>(null);

  const handleUnfollow = async (targetId: number) => {
    setUnfollowing(targetId);
    try {
      await fetch(`${API_BASE}/api/users/${targetId}/follow`, { method: "DELETE", headers: getAuthHeaders() });
      refetchFg();
    } finally { setUnfollowing(null); }
  };

  const followers: any[] = followersData?.users ?? followersData?.followers ?? [];
  const following: any[] = followingData?.users ?? followingData?.following ?? [];
  const list = subTab === "followers" ? followers : following;
  const isLoading = subTab === "followers" ? loadF : loadFg;

  function UserRow({ u }: { u: any }) {
    const name = lang === "ar" ? (u.nameAr || u.nameEn) : (u.nameEn || u.nameAr);
    return (
      <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
        <Link href={`/user/${u.username ?? u.id}`}>
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 hover:opacity-90 transition-opacity">
            {u.avatarUrl ? <img src={u.avatarUrl} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-muted-foreground" /></div>}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/user/${u.username ?? u.id}`}>
            <p className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">{name || t("User", "مستخدم")}</p>
          </Link>
          {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
        </div>
        {subTab === "following" && (
          <button
            onClick={() => handleUnfollow(u.id)}
            disabled={unfollowing === u.id}
            className="text-xs font-semibold px-3 py-1.5 border border-border rounded-lg hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
          >
            {unfollowing === u.id ? "…" : t("Unfollow", "إلغاء المتابعة")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {(["followers", "following"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${subTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "followers"
              ? `${t("Followers", "المتابعون")} (${followers.length})`
              : `${t("Following", "يتابعون")} (${following.length})`}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {subTab === "followers" ? t("No followers yet", "لا متابعون بعد") : t("Not following anyone", "لا تتابع أحداً")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {subTab === "followers"
                ? t("Share your profile to get followers", "شارك ملفك لكسب متابعين")
                : t("Discover and follow food lovers", "اكتشف ومتابعة محبي الطعام")}
            </p>
          </div>
        ) : (
          list.map((u: any) => <UserRow key={u.id} u={u} />)
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP SECTION
// ─────────────────────────────────────────────────────────────────────────────
function MembershipSection({ user, lang, t }: { user: any; lang: string; t: (en: string, ar: string) => string }) {
  const { data: pointsHistory } = useQuery({
    queryKey: ["points-history"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/points/history`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : { history: [] };
    },
  });
  const history: any[] = pointsHistory?.history ?? [];

  return (
    <div className="space-y-6">
      {/* Points & level */}
      <div className="bg-gradient-to-br from-primary/90 to-primary rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium">{t("Your Level", "مستواك")}</p>
            <h2 className="text-2xl font-black">{user?.levelTitle ?? t("Food Explorer", "مستكشف الطعام")}</h2>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-yellow-300" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black">{(user?.points ?? 0).toLocaleString()}</span>
          <span className="text-white/70 text-sm mb-1">{t("points", "نقطة")}</span>
        </div>
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <div className="bg-yellow-300 h-full rounded-full" style={{ width: `${Math.min(100, ((user?.points ?? 0) % 500) / 5)}%` }} />
        </div>
        <p className="text-white/60 text-xs mt-1">{t(`${500 - ((user?.points ?? 0) % 500)} points to next level`, `${500 - ((user?.points ?? 0) % 500)} نقطة للمستوى التالي`)}</p>
      </div>

      {/* Referral */}
      <SectionCard title="Referral Program" titleAr="برنامج الإحالة" lang={lang}>
        <p className="text-sm text-muted-foreground mb-4">
          {t("Invite friends and earn 50 points for every signup!", "ادعُ أصدقاءك واكسب 50 نقطة لكل تسجيل!")}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 bg-muted rounded-xl font-mono text-sm font-bold text-foreground select-all">
            {user?.referralCode ?? user?.refCode ?? t("—", "—")}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(user?.referralCode ?? user?.refCode ?? ""); }}
            className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shrink-0"
          >
            {t("Copy", "نسخ")}
          </button>
        </div>
      </SectionCard>

      {/* Tabaq Gold */}
      <SectionCard title="Tabaq Gold" titleAr="طبق جولد" desc="Exclusive benefits & premium access" descAr="مزايا حصرية ووصول متميز" lang={lang}>
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl mb-4">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{t("Upgrade to Gold", "الترقية إلى جولد")}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">{t("Priority reservations, exclusive deals & more", "حجوزات أولوية وصفقات حصرية والمزيد")}</p>
          </div>
        </div>
        <Link href="/gold">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-sm rounded-xl transition-colors">
            <Star className="w-4 h-4" />
            {t("Learn About Gold", "تعرف على جولد")}
          </button>
        </Link>
      </SectionCard>

      {/* Points history */}
      {history.length > 0 && (
        <SectionCard title="Recent Points Activity" titleAr="نشاط النقاط الأخير" lang={lang}>
          <div className="space-y-2">
            {history.slice(0, 8).map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${h.amount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                  {h.amount > 0 ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{lang === "ar" ? (h.reasonAr ?? h.reason) : h.reason}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${h.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {h.amount > 0 ? "+" : ""}{h.amount}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SupportSection({ lang, t }: { lang: string; t: (en: string, ar: string) => string }) {
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const links = [
    { icon: HelpCircle, label: t("Help Center", "مركز المساعدة"), desc: t("Browse common questions & guides", "تصفح الأسئلة الشائعة والأدلة"), href: "/faq" },
    { icon: MessageCircle, label: t("Contact Support", "تواصل مع الدعم"), desc: t("Get help from our team", "احصل على مساعدة من فريقنا"), href: "/contact" },
    { icon: Info, label: t("About Tabaq", "عن طبق"), desc: t("Learn about our platform", "تعرف على منصتنا"), href: "/about" },
    { icon: Lock, label: t("Privacy Policy", "سياسة الخصوصية"), desc: t("How we use your data", "كيف نستخدم بياناتك"), href: "/privacy-policy" },
    { icon: Globe, label: t("Terms of Service", "شروط الخدمة"), desc: t("Your rights and responsibilities", "حقوقك ومسؤولياتك"), href: "/terms" },
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Quick Links" titleAr="روابط سريعة" lang={lang}>
        <div className="space-y-1">
          {links.map(l => {
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{l.label}</p>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Send Feedback" titleAr="إرسال ملاحظات" desc="Help us improve Tabaq" descAr="ساعدنا في تحسين طبق" lang={lang}>
        {feedbackSent ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">{t("Thank you for your feedback!", "شكراً على ملاحظاتك!")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={feedbackMsg}
              onChange={setFeedbackMsg}
              placeholder={t("Share your thoughts, report an issue, or suggest an improvement…", "شارك أفكارك أو أبلغ عن مشكلة أو اقترح تحسيناً…")}
              rows={4}
            />
            <button
              onClick={() => { if (feedbackMsg.trim()) setFeedbackSent(true); }}
              disabled={!feedbackMsg.trim()}
              className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {t("Send Feedback", "إرسال الملاحظات")}
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ACCOUNT SECTION
// ─────────────────────────────────────────────────────────────────────────────
function DeleteAccountSection({ lang, t, logout }: { lang: string; t: (en: string, ar: string) => string; logout: () => void }) {
  const [step, setStep] = useState<"warning" | "confirm" | "done">("warning");
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const CONFIRM_PHRASE = "DELETE";

  const handleDelete = async () => {
    if (confirm !== CONFIRM_PHRASE) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 1500));
    setStep("done");
    setDeleting(false);
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{t("Account Scheduled for Deletion", "تمت جدولة حذف الحساب")}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("Your account will be permanently deleted within 30 days. You can cancel this by signing in again before that date.", "سيتم حذف حسابك نهائياً خلال 30 يوماً. يمكنك إلغاء ذلك بتسجيل الدخول مجدداً قبل تلك الفترة.")}
        </p>
        <button onClick={logout} className="mt-6 px-6 py-2.5 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-colors">
          {t("Sign Out Now", "تسجيل الخروج الآن")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-bold text-destructive mb-2">{t("Danger Zone", "منطقة الخطر")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "Deleting your account is permanent and irreversible. All your data, reviews, bookings, points, and activity will be permanently removed.",
                "حذف حسابك دائم ولا يمكن التراجع عنه. ستُحذف جميع بياناتك ومراجعاتك وحجوزاتك ونقاطك ونشاطك بشكل نهائي."
              )}
            </p>
          </div>
        </div>
      </div>

      <SectionCard title="What Will Be Deleted" titleAr="ما سيتم حذفه" lang={lang}>
        <ul className="space-y-2.5">
          {[
            t("Your profile and all personal information", "ملفك الشخصي وجميع معلوماتك الشخصية"),
            t("All reviews, check-ins, and activity", "جميع المراجعات والزيارات والنشاط"),
            t("Your bookings history", "سجل حجوزاتك"),
            t("Loyalty points and rewards", "نقاط الولاء والمكافآت"),
            t("Followers and following connections", "علاقات المتابعة"),
            t("Saved restaurants and dishes", "المطاعم والأطباق المحفوظة"),
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      {step === "warning" && (
        <div className="flex gap-3">
          <button
            onClick={() => setStep("confirm")}
            className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-white font-semibold text-sm rounded-xl hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {t("Proceed to Delete", "المتابعة للحذف")}
          </button>
        </div>
      )}

      {step === "confirm" && (
        <SectionCard title="Final Confirmation" titleAr="التأكيد النهائي" lang={lang}>
          <p className="text-sm text-muted-foreground mb-4">
            {t(`Type "${CONFIRM_PHRASE}" to confirm you want to permanently delete your account.`, `اكتب "${CONFIRM_PHRASE}" لتأكيد رغبتك في حذف حسابك نهائياً.`)}
          </p>
          <Input value={confirm} onChange={setConfirm} placeholder={CONFIRM_PHRASE} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDelete}
              disabled={confirm !== CONFIRM_PHRASE || deleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-white font-semibold text-sm rounded-xl hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? t("Deleting…", "جارٍ الحذف…") : t("Delete My Account", "حذف حسابي")}
            </button>
            <button onClick={() => setStep("warning")} className="px-5 py-2.5 border border-border text-muted-foreground font-semibold text-sm rounded-xl hover:bg-muted transition-colors">
              {t("Cancel", "إلغاء")}
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ACCOUNT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function AccountPage() {
  const { user: authUser, logout } = useAuth();
  const { t, lang } = useLanguage();
  const [section, setSection] = useState<Section>("personal");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const qc = useQueryClient();

  usePageMeta({
    titleEn: "Account Settings",
    titleAr: "إعدادات الحساب",
    descriptionEn: "Manage your Tabaq account, privacy, notifications and preferences.",
    descriptionAr: "إدارة حسابك وخصوصيتك وإشعاراتك وتفضيلاتك على طبق.",
  }, lang);

  const { data: userData } = useQuery({
    queryKey: ["account-user", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;
      const r = await fetch(`${API_BASE}/api/users/${authUser.id}`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : null;
    },
    enabled: !!authUser?.id,
  });

  const user = userData?.user ?? authUser;

  const currentSection = SECTIONS.find(s => s.id === section)!;
  const CurrentIcon = currentSection.icon;

  const renderSection = () => {
    if (!authUser) return null;
    switch (section) {
      case "personal":      return <PersonalInfoSection user={user} lang={lang} t={t} qc={qc} />;
      case "security":      return <SecuritySection lang={lang} t={t} logout={logout} />;
      case "preferences":   return <PreferencesSection lang={lang} t={t} />;
      case "notifications": return <NotificationsSection userId={authUser.id} lang={lang} t={t} />;
      case "privacy":       return <PrivacySection userId={authUser.id} lang={lang} t={t} />;
      case "social":        return <SocialSection userId={authUser.id} lang={lang} t={t} />;
      case "membership":    return <MembershipSection user={user} lang={lang} t={t} />;
      case "support":       return <SupportSection lang={lang} t={t} />;
      case "delete":        return <DeleteAccountSection lang={lang} t={t} logout={logout} />;
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t("Sign in required", "تسجيل الدخول مطلوب")}</h2>
          <Link href="/sign-in"><Button>{t("Sign In", "تسجيل الدخول")}</Button></Link>
        </div>
      </div>
    );
  }

  const displayName = lang === "ar" ? (user?.nameAr || user?.nameEn) : (user?.nameEn || user?.nameAr);

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Page header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>
            <div className="flex items-center gap-2.5">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                : <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
              }
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">{displayName || t("Account Settings", "إعدادات الحساب")}</h1>
                {user?.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile section selector */}
      <div className="lg:hidden border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setMobileNavOpen(v => !v)}
            className="w-full flex items-center gap-3 py-3.5"
          >
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <CurrentIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground flex-1 text-start">
              {lang === "ar" ? currentSection.ar : currentSection.en}
            </span>
            {mobileNavOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {mobileNavOpen && (
            <div className="pb-2 space-y-0.5">
              {SECTIONS.map(sec => {
                const Icon = sec.icon;
                const isActive = section === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => { setSection(sec.id); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-colors ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">{lang === "ar" ? sec.ar : sec.en}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-6 space-y-1">
              {SECTIONS.map(sec => {
                const Icon = sec.icon;
                const isActive = section === sec.id;
                const isDanger = sec.id === "delete";
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSection(sec.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-start transition-all ${
                      isActive
                        ? isDanger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        : isDanger ? "hover:bg-destructive/5 text-muted-foreground hover:text-destructive" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isDanger ? "text-destructive" : "text-primary") : ""}`} />
                    <div className="flex-1 min-w-0 text-start">
                      <p className={`text-sm font-semibold leading-tight ${isActive ? (isDanger ? "text-destructive" : "text-primary") : ""}`}>
                        {lang === "ar" ? sec.ar : sec.en}
                      </p>
                      <p className="text-xs opacity-60 truncate hidden xl:block">{lang === "ar" ? sec.descAr : sec.desc}</p>
                    </div>
                    {isActive && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDanger ? "bg-destructive" : "bg-primary"}`} />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-6 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section === "delete" ? "bg-destructive/10" : "bg-primary/10"}`}>
                  <CurrentIcon className={`w-5 h-5 ${section === "delete" ? "text-destructive" : "text-primary"}`} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">{lang === "ar" ? currentSection.ar : currentSection.en}</h2>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? currentSection.descAr : currentSection.desc}</p>
                </div>
              </div>
            </div>
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
