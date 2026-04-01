import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/hooks/use-language";
import { getAuthHeaders, API_BASE } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Lock, Bell, Shield, Globe, Eye, EyeOff, Check, ChevronRight,
  ArrowLeft, Instagram, Camera, Bookmark, Calendar, MapPin, Star,
  Zap, BadgeCheck, ChefHat, Users, Save, CheckCircle2, AlertCircle,
  Volume2, VolumeX, Mail, Smartphone, Trash2, LogOut, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";


type VisibilityLevel = 'public' | 'followers' | 'only_me';
type ProfileVisibility = 'public' | 'followers' | 'private';

interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  visitsVisibility: VisibilityLevel;
  reviewsVisibility: VisibilityLevel;
  favoritesVisibility: VisibilityLevel;
  plansVisibility: VisibilityLevel;
  showInLeaderboard: boolean;
  showInSuggested: boolean;
}

interface NotificationPrefs {
  newFollower: boolean;
  reviewLiked: boolean;
  reviewComment: boolean;
  bookingConfirmed: boolean;
  bookingReminder: boolean;
  newOffer: boolean;
  pointsEarned: boolean;
  weeklyDigest: boolean;
}

type Section = 'account' | 'privacy' | 'visibility' | 'notifications' | 'security';

const SECTIONS: { id: Section; en: string; ar: string; icon: React.ElementType; desc: string; descAr: string }[] = [
  { id: 'account',       en: 'Account',       ar: 'الحساب',       icon: User,   desc: 'Profile info & account type', descAr: 'معلومات الملف ونوع الحساب' },
  { id: 'privacy',       en: 'Privacy',       ar: 'الخصوصية',     icon: Shield, desc: 'Who can see your profile',     descAr: 'من يمكنه رؤية ملفك' },
  { id: 'visibility',    en: 'Visibility',    ar: 'الظهور',        icon: Eye,    desc: 'Control what content is shown', descAr: 'تحكم في محتوى مرئي' },
  { id: 'notifications', en: 'Notifications', ar: 'الإشعارات',    icon: Bell,   desc: 'What you get notified about',  descAr: 'ما تتلقى إشعارات حوله' },
  { id: 'security',      en: 'Security',      ar: 'الأمان',       icon: Lock,   desc: 'Password & account security',  descAr: 'كلمة المرور وأمان الحساب' },
];

function Toggle({ value, onChange, label, labelAr, desc, descAr, lang }: {
  value: boolean; onChange: (v: boolean) => void;
  label: string; labelAr: string; desc?: string; descAr?: string; lang: string;
}) {
  return (
    <button onClick={() => onChange(!value)}
      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors text-start group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? labelAr : label}</p>
        {(desc || descAr) && <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? (descAr ?? desc) : desc}</p>}
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-primary' : 'bg-muted'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'end-1' : 'start-1'}`} />
      </div>
    </button>
  );
}

function VisibilityPicker({ value, onChange, label, labelAr, lang }: {
  value: VisibilityLevel; onChange: (v: VisibilityLevel) => void;
  label: string; labelAr: string; lang: string;
}) {
  const opts: { v: VisibilityLevel; en: string; ar: string; icon: React.ElementType }[] = [
    { v: 'public',    en: 'Public',       ar: 'عام',          icon: Globe },
    { v: 'followers', en: 'Followers',    ar: 'المتابعون',    icon: Users },
    { v: 'only_me',   en: 'Only Me',      ar: 'أنا فقط',      icon: Lock },
  ];
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? labelAr : label}</p>
      <div className="flex gap-2">
        {opts.map(o => {
          const Icon = o.icon;
          const isActive = value === o.v;
          return (
            <button key={o.v} onClick={() => onChange(o.v)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
              <Icon className="w-4 h-4" />
              {lang === 'ar' ? o.ar : o.en}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProfileVisibilityPicker({ value, onChange, lang }: {
  value: ProfileVisibility; onChange: (v: ProfileVisibility) => void; lang: string;
}) {
  const opts: { v: ProfileVisibility; en: string; ar: string; icon: React.ElementType; desc: string; descAr: string }[] = [
    { v: 'public',    en: 'Public',          ar: 'عام',         icon: Globe,  desc: 'Anyone can see your profile',                   descAr: 'يمكن للجميع رؤية ملفك' },
    { v: 'followers', en: 'Followers Only',  ar: 'المتابعون',   icon: Users,  desc: 'Only approved followers see your content',      descAr: 'فقط المتابعون المعتمدون' },
    { v: 'private',   en: 'Private',         ar: 'خاص',         icon: Lock,   desc: 'Profile hidden, must approve follow requests',  descAr: 'الملف مخفي، يجب الموافقة على الطلبات' },
  ];
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{t('Profile Visibility', 'مستوى ظهور الملف')}</p>
      {opts.map(o => {
        const Icon = o.icon;
        const isActive = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>{lang === 'ar' ? o.ar : o.en}</p>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? o.descAr : o.desc}</p>
            </div>
            {isActive && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

export function AccountSettingsPage() {
  const { lang } = useLanguage();
  const { user: authUser, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [section, setSection] = useState<Section>('account');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async () => {
    setPwError(null);
    setPwSuccess(false);
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError(t('Please fill in all password fields.', 'يرجى ملء جميع حقول كلمة المرور.'));
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwError(t('New password must be at least 8 characters.', 'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل.'));
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError(t('New passwords do not match.', 'كلمتا المرور الجديدتان غير متطابقتين.'));
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/me/password`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw, confirmPassword: pwForm.confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.message || t('Failed to update password.', 'فشل تحديث كلمة المرور.'));
      } else {
        setPwSuccess(true);
        setPwForm({ current: '', newPw: '', confirm: '' });
        setTimeout(() => setPwSuccess(false), 3000);
      }
    } catch {
      setPwError(t('Network error. Please try again.', 'خطأ في الشبكة. يرجى المحاولة مجدداً.'));
    } finally {
      setPwLoading(false);
    }
  };

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    visitsVisibility: 'public',
    reviewsVisibility: 'public',
    favoritesVisibility: 'public',
    plansVisibility: 'public',
    showInLeaderboard: true,
    showInSuggested: true,
  });
  const [notifs, setNotifs] = useState<NotificationPrefs>({
    newFollower: true, reviewLiked: true, reviewComment: true,
    bookingConfirmed: true, bookingReminder: true, newOffer: false,
    pointsEarned: true, weeklyDigest: true,
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['my-privacy-settings'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/privacy-settings`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : null;
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (settingsData?.privacySettings) {
      setPrivacy(ps => ({ ...ps, ...settingsData.privacySettings }));
    }
    if (settingsData?.notificationPrefs) {
      setNotifs(n => ({ ...n, ...settingsData.notificationPrefs }));
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/privacy-settings`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ privacySettings: privacy, notificationPrefs: notifs }),
      });
      if (!r.ok) throw new Error('Failed to save');
      return r.json();
    },
    onSuccess: () => {
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ['my-privacy-settings'] });
    },
    onError: (e: any) => setSaveError(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="font-semibold">{t('Sign in to access settings', 'سجّل الدخول للوصول إلى الإعدادات')}</p>
          <Link href="/signin"><Button>{t('Sign In', 'تسجيل الدخول')}</Button></Link>
        </div>
      </div>
    );
  }

  const u = authUser as any;
  const displayName = lang === 'ar' ? (u?.nameAr || u?.nameEn || u?.username) : (u?.nameEn || u?.nameAr || u?.username);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{t('Back', 'رجوع')}</span>
          </button>
          <h1 className="font-bold text-base">{t('Account Settings', 'إعدادات الحساب')}</h1>
          <Button size="sm" className="rounded-xl gap-1.5 h-9 text-xs font-semibold"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || section === 'account' || section === 'security'}>
            {saveMutation.isPending
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Saving...', 'حفظ...')}</>
              : saved
              ? <><CheckCircle2 className="w-3.5 h-3.5" />{t('Saved!', 'تم!')}</>
              : <><Save className="w-3.5 h-3.5" />{t('Save', 'حفظ')}</>
            }
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24">

        {saveError && (
          <div className="mb-4 flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{saveError}</p>
          </div>
        )}

        {/* Section tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${section === s.id ? 'bg-primary text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />
                {lang === 'ar' ? s.ar : s.en}
              </button>
            );
          })}
        </div>

        {/* ── ACCOUNT ────────────────────────────────────────────────────────── */}
        {section === 'account' && (
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden shrink-0">
                  {u?.avatarUrl
                    ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-primary/50" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">{displayName || t('No name set', 'لم يُضف اسم')}</p>
                  <p className="text-sm text-muted-foreground">@{u?.username || t('no username', 'لا اسم مستخدم')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{u?.accountType ?? 'basic'}</p>
                </div>
              </div>
              <Link href="/edit-profile">
                <Button variant="outline" className="w-full mt-4 rounded-xl gap-2">
                  <User className="w-4 h-4" />
                  {t('Edit Profile Info', 'تعديل معلومات الملف')}
                  <ChevronRight className={`w-4 h-4 ms-auto ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
            </div>

            {/* Account type upgrade */}
            {u?.accountType === 'basic' && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-amber-900 dark:text-amber-200">{t('Upgrade Your Account', 'ترقية حسابك')}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{t('Get a Professional or Chef badge, analytics dashboard, and more.', 'احصل على شارة محترف أو شيف ولوحة تحليلات والمزيد.')}</p>
                  </div>
                </div>
                <Link href="/edit-profile">
                  <Button className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-xl">
                    <Zap className="w-4 h-4 me-2" />{t('Upgrade to Professional', 'ترقية إلى محترف')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {[
                { href: '/edit-profile', icon: User, en: 'Edit Profile', ar: 'تعديل الملف الشخصي' },
                { href: '/bookings', icon: Calendar, en: 'My Reservations', ar: 'حجوزاتي' },
                { href: '/dashboard', icon: Star, en: 'My Dashboard', ar: 'لوحة التحكم' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1">{lang === 'ar' ? item.ar : item.en}</span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Danger zone */}
            <div className="bg-card border border-destructive/20 rounded-2xl divide-y divide-border">
              <div className="px-4 py-3">
                <p className="text-xs font-bold text-destructive uppercase tracking-wide">{t('Danger Zone', 'منطقة الخطر')}</p>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-destructive/5 transition-colors">
                <LogOut className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-sm font-medium text-destructive">{t('Sign Out', 'تسجيل الخروج')}</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-destructive/5 transition-colors">
                <Trash2 className="w-4 h-4 text-destructive/70 shrink-0" />
                <span className="text-sm font-medium text-destructive/70">{t('Delete Account', 'حذف الحساب')}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── PRIVACY ────────────────────────────────────────────────────────── */}
        {section === 'privacy' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
              <ProfileVisibilityPicker
                value={privacy.profileVisibility}
                onChange={v => setPrivacy(p => ({ ...p, profileVisibility: v }))}
                lang={lang}
              />
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm">{t('Discovery Settings', 'إعدادات الاكتشاف')}</h3>
              <Toggle value={privacy.showInLeaderboard} onChange={v => setPrivacy(p => ({ ...p, showInLeaderboard: v }))}
                label="Show in Leaderboard" labelAr="الظهور في المتصدرين"
                desc="Appear in the top foodies leaderboard" descAr="الظهور في قائمة أفضل المميزين"
                lang={lang} />
              <Toggle value={privacy.showInSuggested} onChange={v => setPrivacy(p => ({ ...p, showInSuggested: v }))}
                label="Show in Suggested Users" labelAr="الظهور في المقترحين"
                desc="Let others discover you through suggestions" descAr="اسمح للآخرين باكتشافك عبر المقترحين"
                lang={lang} />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
              {t('Privacy settings take effect immediately after saving.', 'تصبح إعدادات الخصوصية سارية فور الحفظ.')}
            </div>
          </div>
        )}

        {/* ── VISIBILITY ─────────────────────────────────────────────────────── */}
        {section === 'visibility' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">{t('Content Visibility', 'رؤية المحتوى')}</p>
                  <p className="text-xs text-muted-foreground">{t('Control who can see each section of your profile', 'تحكم في من يمكنه رؤية كل قسم في ملفك')}</p>
                </div>
              </div>

              {([
                { key: 'visitsVisibility',    label: 'My Visits',    labelAr: 'زياراتي',    icon: MapPin },
                { key: 'reviewsVisibility',   label: 'My Reviews',   labelAr: 'تقييماتي',   icon: Star },
                { key: 'favoritesVisibility', label: 'My Favorites', labelAr: 'مفضلتي',     icon: Bookmark },
                { key: 'plansVisibility',     label: 'My Plans',     labelAr: 'خططي',       icon: Calendar },
              ] as const).map(f => (
                <VisibilityPicker key={f.key}
                  value={privacy[f.key] as VisibilityLevel}
                  onChange={v => setPrivacy(p => ({ ...p, [f.key]: v }))}
                  label={f.label} labelAr={f.labelAr} lang={lang} />
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {t('Note: If your profile is set to Private, all content is automatically hidden from non-followers regardless of these settings.', 'ملاحظة: إذا كان ملفك خاصاً، يُخفى كل المحتوى عن غير المتابعين بغض النظر عن هذه الإعدادات.')}
              </p>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ──────────────────────────────────────────────────── */}
        {section === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-sm">{t('Social', 'الاجتماعي')}</h3>
              </div>
              <Toggle value={notifs.newFollower} onChange={v => setNotifs(n => ({ ...n, newFollower: v }))}
                label="New Follower" labelAr="متابع جديد"
                desc="When someone follows you" descAr="عندما يتابعك شخص ما" lang={lang} />
              <Toggle value={notifs.reviewLiked} onChange={v => setNotifs(n => ({ ...n, reviewLiked: v }))}
                label="Review Liked" labelAr="إعجاب بالتقييم"
                desc="When someone likes your review" descAr="عندما يعجب أحدهم بتقييمك" lang={lang} />
              <Toggle value={notifs.reviewComment} onChange={v => setNotifs(n => ({ ...n, reviewComment: v }))}
                label="New Comment" labelAr="تعليق جديد"
                desc="When someone comments on your review" descAr="عندما يعلق أحدهم على تقييمك" lang={lang} />
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-sm">{t('Reservations', 'الحجوزات')}</h3>
              </div>
              <Toggle value={notifs.bookingConfirmed} onChange={v => setNotifs(n => ({ ...n, bookingConfirmed: v }))}
                label="Booking Confirmed" labelAr="تأكيد الحجز"
                desc="Confirmation when your reservation is approved" descAr="تأكيد عند الموافقة على حجزك" lang={lang} />
              <Toggle value={notifs.bookingReminder} onChange={v => setNotifs(n => ({ ...n, bookingReminder: v }))}
                label="Booking Reminder" labelAr="تذكير بالحجز"
                desc="Reminder 1 hour before your visit" descAr="تذكير قبل ساعة من زيارتك" lang={lang} />
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-sm">{t('Updates', 'التحديثات')}</h3>
              </div>
              <Toggle value={notifs.pointsEarned} onChange={v => setNotifs(n => ({ ...n, pointsEarned: v }))}
                label="Points Earned" labelAr="نقاط مكتسبة"
                desc="When you earn Tabaq points" descAr="عند اكتساب نقاط طبق" lang={lang} />
              <Toggle value={notifs.newOffer} onChange={v => setNotifs(n => ({ ...n, newOffer: v }))}
                label="New Offers" labelAr="عروض جديدة"
                desc="Deals and offers from your favorite restaurants" descAr="صفقات وعروض من مطاعمك المفضلة" lang={lang} />
              <Toggle value={notifs.weeklyDigest} onChange={v => setNotifs(n => ({ ...n, weeklyDigest: v }))}
                label="Weekly Digest" labelAr="ملخص أسبوعي"
                desc="Your weekly food discovery summary" descAr="ملخصك الأسبوعي في اكتشاف الطعام" lang={lang} />
            </div>
          </div>
        )}

        {/* ── SECURITY ───────────────────────────────────────────────────────── */}
        {section === 'security' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm">{t('Change Password', 'تغيير كلمة المرور')}</h3>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Current Password', 'كلمة المرور الحالية')}</label>
                <input type="password" placeholder="••••••••" value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('New Password', 'كلمة المرور الجديدة')}</label>
                <input type="password" placeholder={t('8+ characters', '8 أحرف على الأقل')} value={pwForm.newPw}
                  onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t('Confirm New Password', 'تأكيد كلمة المرور')}</label>
                <input type="password" placeholder="••••••••" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              {pwError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {t('Password updated successfully!', 'تم تحديث كلمة المرور بنجاح!')}
                </div>
              )}
              <Button className="w-full rounded-xl" onClick={handlePasswordChange} disabled={pwLoading}>
                {pwLoading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin me-2" />{t('Updating...', 'جارٍ التحديث...')}</>
                  : t('Update Password', 'تحديث كلمة المرور')
                }
              </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm">{t('Connected Accounts', 'الحسابات المرتبطة')}</h3>
              {[
                { label: 'Email', icon: Mail, value: u?.email ?? t('Not connected', 'غير مرتبط') },
                { label: 'Phone', icon: Smartphone, value: u?.phone ?? t('Not connected', 'غير مرتبط') },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.value}</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg text-xs h-8">
                      {t('Connect', 'ربط')}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-destructive">{t('Delete Account', 'حذف الحساب')}</h3>
              <p className="text-xs text-muted-foreground">{t('This will permanently delete your account, reviews, and all data. This action cannot be undone.', 'سيحذف هذا حسابك وتقييماتك وجميع بياناتك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.')}</p>
              <Button variant="outline" className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5">
                <Trash2 className="w-4 h-4 me-2" />{t('Delete My Account', 'حذف حسابي')}
              </Button>
            </div>
          </div>
        )}

        {/* Save button for privacy/visibility/notifications */}
        {(section === 'privacy' || section === 'visibility' || section === 'notifications') && (
          <div className="mt-6">
            <Button className="w-full h-12 rounded-xl font-bold" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin me-2" />{t('Saving...', 'حفظ...')}</>
                : saved
                ? <><CheckCircle2 className="w-4 h-4 me-2" />{t('Settings Saved!', 'تم الحفظ!')}</>
                : <><Save className="w-4 h-4 me-2" />{t('Save Settings', 'حفظ الإعدادات')}</>
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
