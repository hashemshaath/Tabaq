import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/hooks/use-language";
import { getAuthHeaders } from "@/lib/api";
import {
  Camera, Save, X, User, MapPin, Globe, Instagram, ChefHat,
  BadgeCheck, Zap, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff,
  Lock, Unlock, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type AccountType = "basic" | "professional" | "chef";

interface ProfileForm {
  nameEn: string;
  nameAr: string;
  username: string;
  bio: string;
  location: string;
  instagramUrl: string;
  xUrl: string;
  tiktokUrl: string;
  snapchatUrl: string;
  websiteUrl: string;
  isPrivate: boolean;
  accountType: AccountType;
}

function AvatarUpload({ current, onChange }: { current: string | null; onChange: (url: string) => void }) {
  const { t, lang } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setPreview(url);
      onChange(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden ring-4 ring-primary/20">
          {preview
            ? <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-muted-foreground" /></div>
          }
        </div>
        <button onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
          <Camera className="w-4 h-4 text-white" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{t("Tap camera to change photo", "اضغط للتغيير")}</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function CoverUpload({ current, onChange }: { current: string | null; onChange: (url: string) => void }) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setPreview(url);
      onChange(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative h-36 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl overflow-hidden cursor-pointer group"
      onClick={() => inputRef.current?.click()}>
      {preview && <img src={preview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="w-7 h-7 text-white" />
        <p className="text-white text-sm font-semibold">{t("Change Cover", "تغيير الغلاف")}</p>
      </div>
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity ${preview ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        {!preview && <><Camera className="w-7 h-7 text-muted-foreground" /><p className="text-muted-foreground text-sm">{t("Add Cover Photo", "أضف صورة الغلاف")}</p></>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

const ACCOUNT_TIERS: { type: AccountType; titleEn: string; titleAr: string; descEn: string; descAr: string; icon: React.ElementType; color: string; bg: string; badge?: string }[] = [
  { type: 'basic',        titleEn: 'Basic User',    titleAr: 'مستخدم عادي', descEn: 'Reviews, favorites, visits',           descAr: 'تقييمات، مفضلة، زيارات',        icon: User,       color: 'text-gray-600',  bg: 'bg-gray-100' },
  { type: 'professional', titleEn: 'Professional',  titleAr: 'محترف',       descEn: 'Dish portfolio, analytics dashboard',  descAr: 'معرض الأطباق، لوحة التحليلات',  icon: BadgeCheck, color: 'text-blue-700',  bg: 'bg-blue-100',  badge: 'PRO' },
  { type: 'chef',         titleEn: 'Chef',          titleAr: 'شيف',         descEn: 'Kitchen dashboard, order requests',    descAr: 'لوحة المطبخ، طلبات الأصناف',    icon: ChefHat,    color: 'text-amber-700', bg: 'bg-amber-100', badge: 'CHEF' },
];

export function EditProfilePage() {
  const { lang, t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user: authUser } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    nameEn: '', nameAr: '', username: '', bio: '', location: '',
    instagramUrl: '', xUrl: '', tiktokUrl: '', snapchatUrl: '', websiteUrl: '',
    isPrivate: false, accountType: 'basic',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) return;
    const u = authUser as any;
    setForm({
      nameEn: u.nameEn ?? '', nameAr: u.nameAr ?? '', username: u.username ?? '',
      bio: u.bio ?? '', location: u.location ?? '',
      instagramUrl: u.instagramUrl ?? '', xUrl: u.xUrl ?? '',
      tiktokUrl: u.tiktokUrl ?? '', snapchatUrl: u.snapchatUrl ?? '',
      websiteUrl: u.websiteUrl ?? '', isPrivate: u.isPrivate ?? false,
      accountType: u.accountType ?? 'basic',
    });
    setAvatarUrl(u.avatarUrl ?? null);
    setCoverUrl(u.coverPhotoUrl ?? null);
  }, [authUser]);

  const validateUsername = (val: string) => {
    if (val.length < 4) return t('Min 4 characters', 'الحد الأدنى 4 أحرف');
    if (val.length > 20) return t('Max 20 characters', 'الحد الأقصى 20 حرف');
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return t('Letters, numbers, underscore only', 'أحرف وأرقام وشرطة سفلية فقط');
    return null;
  };

  const set = (k: keyof ProfileForm, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'username') setUsernameError(validateUsername(v));
  };

  const handleSave = async () => {
    const uErr = validateUsername(form.username);
    if (uErr) { setUsernameError(uErr); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        nameEn: form.nameEn || undefined,
        nameAr: form.nameAr || undefined,
        username: form.username || undefined,
        bio: form.bio || undefined,
        location: form.location || undefined,
        instagramUrl: form.instagramUrl || undefined,
        xUrl: form.xUrl || undefined,
        tiktokUrl: form.tiktokUrl || undefined,
        snapchatUrl: form.snapchatUrl || undefined,
        websiteUrl: form.websiteUrl || undefined,
        isPrivate: form.isPrivate,
        accountType: form.accountType,
      };
      if (avatarUrl && !avatarUrl.startsWith('http')) payload.avatarUrl = avatarUrl;
      if (coverUrl && !coverUrl.startsWith('http')) payload.coverPhotoUrl = coverUrl;

      const r = await fetch(`${API_BASE}/api/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to save');
      }
      setSaved(true);
      setTimeout(() => {
        if (form.username) setLocation(`/${form.username}`);
        else setLocation('/dashboard');
      }, 1200);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('Please sign in to edit your profile.', 'يرجى تسجيل الدخول.')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background pb-24" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{t('Back', 'رجوع')}</span>
          </button>
          <h1 className="font-bold text-base">{t('Edit Profile', 'تعديل الملف الشخصي')}</h1>
          <Button size="sm" className="rounded-xl gap-1.5 h-9 text-xs font-semibold" onClick={handleSave} disabled={saving || !!usernameError}>
            {saving ? (
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Saving...', 'حفظ...')}</div>
            ) : saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5" />{t('Saved!', 'تم!')}</>
            ) : (
              <><Save className="w-3.5 h-3.5" />{t('Save', 'حفظ')}</>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">

        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 font-semibold">{t('Profile saved! Redirecting...', 'تم الحفظ! جارٍ التوجيه...')}</p>
          </div>
        )}

        {/* Photos */}
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-foreground">{t('Photos', 'الصور')}</h2>
          <CoverUpload current={coverUrl} onChange={setCoverUrl} />
          <AvatarUpload current={avatarUrl} onChange={setAvatarUrl} />
        </section>

        {/* Basic info */}
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-foreground">{t('Basic Info', 'المعلومات الأساسية')}</h2>

          {/* Username */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Username', 'اسم المستخدم')} *</label>
            <div className={`flex items-center border rounded-xl overflow-hidden ${usernameError ? 'border-destructive' : 'border-border'} bg-background focus-within:ring-2 focus-within:ring-primary/20`}>
              <span className="ps-3 text-muted-foreground text-sm">@</span>
              <input
                value={form.username} onChange={e => set('username', e.target.value.toLowerCase())}
                className="flex-1 px-2 py-2.5 text-sm bg-transparent focus:outline-none"
                placeholder="username" maxLength={20}
              />
              <span className={`pe-3 text-xs ${form.username.length > 17 ? 'text-amber-500' : 'text-muted-foreground'}`}>{form.username.length}/20</span>
            </div>
            {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
            <p className="text-xs text-muted-foreground mt-1">{t('Your profile URL: tabaq.co/', 'رابط ملفك: tabaq.co/')}<strong>{form.username || 'username'}</strong></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Name (English)', 'الاسم (إنجليزي)')}</label>
              <input value={form.nameEn} onChange={e => set('nameEn', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ahmed Al-Rashid" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Name (Arabic)', 'الاسم (عربي)')}</label>
              <input value={form.nameAr} onChange={e => set('nameAr', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="أحمد الراشد" dir="rtl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Bio', 'النبذة التعريفية')}</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3} maxLength={200}
              placeholder={t('Tell people about yourself and your food journey...', 'اكتب عن نفسك ورحلتك مع الطعام...')} />
            <p className="text-xs text-muted-foreground text-end mt-1">{form.bio.length}/200</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              <MapPin className="w-3.5 h-3.5 inline me-1" />{t('Location', 'الموقع')}
            </label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Riyadh, Saudi Arabia" />
          </div>
        </section>

        {/* Social links */}
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-foreground">{t('Social Links', 'وسائل التواصل')}</h2>
          {[
            { key: 'instagramUrl' as const, label: 'Instagram', placeholder: '@yourhandle', icon: Instagram, color: 'text-pink-500' },
            { key: 'xUrl' as const, label: 'X (Twitter)', placeholder: '@yourhandle', icon: () => <span className="font-bold text-xs">𝕏</span>, color: 'text-foreground' },
            { key: 'tiktokUrl' as const, label: 'TikTok', placeholder: '@yourhandle', icon: Play, color: 'text-foreground' },
            { key: 'snapchatUrl' as const, label: 'Snapchat', placeholder: '@yourhandle', icon: Camera, color: 'text-yellow-500' },
            { key: 'websiteUrl' as const, label: t('Website', 'الموقع الإلكتروني'), placeholder: 'https://yoursite.com', icon: Globe, color: 'text-blue-500' },
          ].map(({ key, label, placeholder, icon: Icon, color }) => (
            <div key={key} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <input value={form[key]} onChange={e => set(key, e.target.value)}
                className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={placeholder} />
            </div>
          ))}
        </section>

        {/* Privacy */}
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-foreground">{t('Privacy', 'الخصوصية')}</h2>
          <button onClick={() => set('isPrivate', !form.isPrivate)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${form.isPrivate ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${form.isPrivate ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                {form.isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div className="text-start">
                <p className="font-semibold text-sm">{form.isPrivate ? t('Private Account', 'حساب خاص') : t('Public Account', 'حساب عام')}</p>
                <p className="text-xs text-muted-foreground">
                  {form.isPrivate ? t('Only approved followers see your content', 'فقط المتابعون المعتمدون يرون محتواك') : t('Anyone can see your profile and content', 'يمكن للجميع رؤية ملفك ومحتواك')}
                </p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${form.isPrivate ? 'bg-primary' : 'bg-secondary'} relative`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isPrivate ? 'end-1' : 'start-1'}`} />
            </div>
          </button>
        </section>

        {/* Account type upgrade */}
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground">{t('Account Type', 'نوع الحساب')}</h2>
            <span className="text-xs text-muted-foreground">{t('Upgrade anytime', 'يمكن الترقية في أي وقت')}</span>
          </div>
          <div className="space-y-3">
            {ACCOUNT_TIERS.map(tier => {
              const Icon = tier.icon;
              const isSelected = form.accountType === tier.type;
              const isUpgrade = ACCOUNT_TIERS.findIndex(t => t.type === form.accountType) < ACCOUNT_TIERS.findIndex(t => t.type === tier.type);
              return (
                <button key={tier.type}
                  onClick={() => { if (tier.type !== 'basic' || form.accountType === 'basic') set('accountType', tier.type); }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <div className={`w-10 h-10 ${tier.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${tier.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>{lang === 'ar' ? tier.titleAr : tier.titleEn}</p>
                      {tier.badge && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-black">{tier.badge}</span>}
                      {isUpgrade && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />UPGRADE</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{lang === 'ar' ? tier.descAr : tier.descEn}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
          {form.accountType !== 'basic' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                {form.accountType === 'professional'
                  ? t('Professional accounts get a portfolio tab, analytics dashboard, and priority visibility.', 'الحسابات الاحترافية تحصل على تبويب المحفظة ولوحة التحليلات والأولوية في النتائج.')
                  : t('Chef accounts unlock kitchen dashboard, order request management, and featured chef placement.', 'حسابات الشيف تفتح لوحة المطبخ وإدارة طلبات الأصناف والموضع المميز.')}
              </p>
            </div>
          )}
        </section>

        {/* Save footer */}
        <div className="sticky bottom-0 pb-6 pt-2 bg-gray-50 dark:bg-background">
          <Button className="w-full h-12 rounded-xl font-bold text-sm" onClick={handleSave} disabled={saving || !!usernameError}>
            {saving ? (
              <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Saving...', 'حفظ...')}</div>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4 me-2" />{t('Saved! Redirecting...', 'تم الحفظ!')}</>
            ) : (
              <><Save className="w-4 h-4 me-2" />{t('Save Changes', 'حفظ التغييرات')}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
