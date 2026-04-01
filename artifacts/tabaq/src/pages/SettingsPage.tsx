import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useSettings } from '@/context/SettingsContext';
import {
  BarChart3, Mail, MessageSquare, Flame, Search, MapPin,
  Save, CheckCircle2, Eye, EyeOff, AlertCircle, ChevronRight,
  Bell, Globe, CreditCard, LayoutDashboard
} from 'lucide-react';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  prefix?: string;
}

function Field({ label, value, onChange, placeholder, type = 'text', hint, prefix }: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute start-3 text-sm text-muted-foreground select-none pointer-events-none">{prefix}</span>
        )}
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors ${prefix ? 'ps-8' : 'ps-3'} pe-3 py-2.5`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute end-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}

function SectionCard({ icon, title, subtitle, badge, children }: SectionCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-elevation-1">
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {badge && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-md">{badge}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: 'analytics', label: 'Analytics', labelAr: 'التحليلات', icon: BarChart3 },
  { id: 'seo', label: 'SEO', labelAr: 'تهيئة البحث', icon: Search },
  { id: 'smtp', label: 'Email (SMTP)', labelAr: 'البريد الإلكتروني', icon: Mail },
  { id: 'sms', label: 'SMS Gateway', labelAr: 'بوابة الرسائل', icon: MessageSquare },
  { id: 'maps', label: 'Google Maps', labelAr: 'خرائط جوجل', icon: MapPin },
  { id: 'firebase', label: 'Firebase', labelAr: 'فايربيس', icon: Flame },
];

export function SettingsPage() {
  const { t, lang } = useLanguage();
  const { settings, updateAnalytics, updateSmtp, updateSms, updateFirebase, updateSeo, updateMaps, saveAll, isDirty } = useSettings();
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('analytics');

  const handleSave = async () => {
    await saveAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('Platform Settings', 'إعدادات المنصة')}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Configure analytics, integrations, SEO, and communication channels', 'إعداد التحليلات والتكاملات وتهيئة محركات البحث وقنوات التواصل')}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : isDirty
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-elevation-2'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? t('Saved!', 'تم الحفظ!') : t('Save Changes', 'حفظ التغييرات')}
            </button>
          </div>

          {isDirty && !saved && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {t('You have unsaved changes', 'لديك تغييرات غير محفوظة')}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar navigation */}
          <aside className="w-56 shrink-0 hidden lg:block">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-24">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-0 ${
                      activeSection === s.id
                        ? 'bg-primary/5 text-primary border-s-2 border-s-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {lang === 'ar' ? s.labelAr : s.label}
                    {activeSection === s.id && <ChevronRight className="w-3.5 h-3.5 ms-auto" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile section tabs */}
          <div className="lg:hidden w-full mb-6">
            <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                      activeSection === s.id
                        ? 'bg-primary text-white'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {lang === 'ar' ? s.labelAr : s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* Analytics */}
            {activeSection === 'analytics' && (
              <SectionCard
                icon={<BarChart3 className="w-5 h-5" />}
                title={t('Analytics & Tracking', 'التحليلات والتتبع')}
                subtitle={t('Connect Google Analytics, GTM, and Meta Pixel for visitor insights', 'ربط Google Analytics وGTM وMeta Pixel لتحليل الزوار')}
                badge="Marketing"
              >
                <Field
                  label={t('Google Analytics 4 Measurement ID', 'معرف Google Analytics 4')}
                  value={settings.analytics.googleAnalyticsId}
                  onChange={v => updateAnalytics({ googleAnalyticsId: v })}
                  placeholder="G-XXXXXXXXXX"
                  hint={t('Starts with G- e.g. G-ABC123DEF4', 'يبدأ بـ G- مثل G-ABC123DEF4')}
                />
                <Field
                  label={t('Google Tag Manager Container ID', 'معرف حاوية Google Tag Manager')}
                  value={settings.analytics.googleTagManagerId}
                  onChange={v => updateAnalytics({ googleTagManagerId: v })}
                  placeholder="GTM-XXXXXXX"
                  hint={t('Starts with GTM-', 'يبدأ بـ GTM-')}
                />
                <div className="sm:col-span-2">
                  <Field
                    label={t('Meta (Facebook) Pixel ID', 'معرف Meta Pixel')}
                    value={settings.analytics.metaPixelId}
                    onChange={v => updateAnalytics({ metaPixelId: v })}
                    placeholder="1234567890123456"
                    hint={t('Found in Meta Business Manager → Events Manager', 'يوجد في Meta Business Manager → Events Manager')}
                  />
                </div>

                {/* Status indicators */}
                <div className="sm:col-span-2 grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  {[
                    { label: 'GA4', active: !!settings.analytics.googleAnalyticsId },
                    { label: 'GTM', active: !!settings.analytics.googleTagManagerId },
                    { label: 'Pixel', active: !!settings.analytics.metaPixelId },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center gap-2 p-3 rounded-lg border ${item.active ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-muted/30'}`}>
                      <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                      <span className={`text-xs font-semibold ${item.active ? 'text-emerald-700' : 'text-muted-foreground'}`}>{item.label}</span>
                      <span className={`text-[10px] ms-auto ${item.active ? 'text-emerald-600' : 'text-muted-foreground'}`}>{item.active ? t('Active', 'مفعّل') : t('Off', 'معطّل')}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* SEO */}
            {activeSection === 'seo' && (
              <SectionCard
                icon={<Search className="w-5 h-5" />}
                title={t('SEO Settings', 'إعدادات تهيئة محركات البحث')}
                subtitle={t('Configure meta tags, keywords, and social sharing metadata', 'إعداد العلامات الوصفية والكلمات المفتاحية وبيانات المشاركة')}
                badge="SEO"
              >
                <div className="sm:col-span-2">
                  <Field
                    label={t('Default Meta Title', 'عنوان الميتا الافتراضي')}
                    value={settings.seo.metaTitle}
                    onChange={v => updateSeo({ metaTitle: v })}
                    placeholder="Tabaq | Discover the Best Restaurants"
                    hint={t('Recommended: 50–60 characters', 'موصى به: 50–60 حرف')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('Meta Description', 'وصف الميتا')}</label>
                  <textarea
                    value={settings.seo.metaDescription}
                    onChange={e => updateSeo({ metaDescription: e.target.value })}
                    rows={3}
                    placeholder={t('Describe your platform in 150–160 characters...', 'صف منصتك في 150–160 حرف...')}
                    className="w-full bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors px-3 py-2.5 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{settings.seo.metaDescription.length}/160 {t('characters', 'حرف')}</p>
                </div>
                <div className="sm:col-span-2">
                  <Field
                    label={t('Keywords', 'الكلمات المفتاحية')}
                    value={settings.seo.keywords}
                    onChange={v => updateSeo({ keywords: v })}
                    placeholder="restaurants, dining, food, Saudi Arabia"
                    hint={t('Comma-separated keywords', 'كلمات مفتاحية مفصولة بفواصل')}
                  />
                </div>
                <Field
                  label={t('OG Image URL', 'رابط صورة OG')}
                  value={settings.seo.ogImage}
                  onChange={v => updateSeo({ ogImage: v })}
                  placeholder="https://tabaq.sa/og-image.jpg"
                  hint={t('1200×630px recommended', 'يُوصى بـ 1200×630 بكسل')}
                />
                <Field
                  label={t('Twitter Handle', 'حساب تويتر')}
                  value={settings.seo.twitterHandle}
                  onChange={v => updateSeo({ twitterHandle: v })}
                  placeholder="@tabaqapp"
                  prefix="@"
                />
                <div className="sm:col-span-2">
                  <Field
                    label={t('Canonical Domain', 'النطاق الأساسي')}
                    value={settings.seo.canonicalDomain}
                    onChange={v => updateSeo({ canonicalDomain: v })}
                    placeholder="https://tabaq.sa"
                    hint={t('Used for canonical URLs and sitemap', 'يُستخدم لعناوين URL الأساسية وخريطة الموقع')}
                  />
                </div>
              </SectionCard>
            )}

            {/* SMTP */}
            {activeSection === 'smtp' && (
              <SectionCard
                icon={<Mail className="w-5 h-5" />}
                title={t('Email (SMTP) Configuration', 'إعداد البريد الإلكتروني (SMTP)')}
                subtitle={t('Configure outgoing email for notifications, OTPs, and booking confirmations', 'إعداد البريد الصادر للإشعارات وكلمات المرور لمرة واحدة وتأكيدات الحجز')}
                badge="Email"
              >
                <Field
                  label={t('SMTP Host', 'خادم SMTP')}
                  value={settings.smtp.host}
                  onChange={v => updateSmtp({ host: v })}
                  placeholder="smtp.gmail.com"
                />
                <Field
                  label={t('SMTP Port', 'منفذ SMTP')}
                  value={settings.smtp.port}
                  onChange={v => updateSmtp({ port: v })}
                  placeholder="587"
                  hint={t('587 (TLS), 465 (SSL), 25 (plain)', '587 (TLS)، 465 (SSL)، 25 (عادي)')}
                />
                <Field
                  label={t('Email Address', 'عنوان البريد الإلكتروني')}
                  value={settings.smtp.email}
                  onChange={v => updateSmtp({ email: v })}
                  placeholder="noreply@tabaq.sa"
                  type="email"
                />
                <Field
                  label={t('Password / App Password', 'كلمة المرور')}
                  value={settings.smtp.password}
                  onChange={v => updateSmtp({ password: v })}
                  placeholder="••••••••"
                  type="password"
                />
                <div className="sm:col-span-2">
                  <Field
                    label={t('From Name', 'اسم المرسل')}
                    value={settings.smtp.fromName}
                    onChange={v => updateSmtp({ fromName: v })}
                    placeholder="Tabaq"
                    hint={t('Displayed in recipient\'s inbox as sender name', 'يظهر في صندوق الوارد للمستلم كاسم المرسل')}
                  />
                </div>

                <div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {t(
                      'For Gmail, use an App Password (Google Account → Security → App passwords). For production, consider SendGrid or AWS SES.',
                      'لـ Gmail، استخدم كلمة مرور تطبيق (حساب Google ← الأمان ← كلمات مرور التطبيقات). للإنتاج، استخدم SendGrid أو AWS SES.'
                    )}
                  </p>
                </div>
              </SectionCard>
            )}

            {/* SMS */}
            {activeSection === 'sms' && (
              <SectionCard
                icon={<MessageSquare className="w-5 h-5" />}
                title={t('SMS Gateway Configuration', 'إعداد بوابة الرسائل النصية')}
                subtitle={t('Configure SMS for OTP verification and booking notifications', 'إعداد الرسائل النصية للتحقق وإشعارات الحجز')}
                badge="SMS"
              >
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('SMS Provider', 'مزود خدمة الرسائل')}</label>
                  <select
                    value={settings.sms.provider}
                    onChange={e => updateSms({ provider: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary px-3 py-2.5"
                  >
                    <option value="unifonic">Unifonic (Saudi Arabia)</option>
                    <option value="twilio">Twilio</option>
                    <option value="messagebird">MessageBird</option>
                    <option value="vonage">Vonage (Nexmo)</option>
                    <option value="stc">STC Telecom API</option>
                    <option value="mobily">Mobily SMS</option>
                  </select>
                </div>
                <Field
                  label={t('API Key', 'مفتاح API')}
                  value={settings.sms.apiKey}
                  onChange={v => updateSms({ apiKey: v })}
                  placeholder="sk_live_..."
                  type="password"
                />
                <Field
                  label={t('Sender ID', 'معرف المرسل')}
                  value={settings.sms.senderId}
                  onChange={v => updateSms({ senderId: v })}
                  placeholder="TABAQ"
                  hint={t('Max 11 alphanumeric chars. Must be pre-approved by carrier.', 'حتى 11 حرفاً أبجدياً رقمياً. يجب الموافقة عليه مسبقاً.')}
                />
              </SectionCard>
            )}

            {/* Maps */}
            {activeSection === 'maps' && (
              <SectionCard
                icon={<MapPin className="w-5 h-5" />}
                title={t('Google Maps Integration', 'تكامل خرائط جوجل')}
                subtitle={t('Display restaurant locations on interactive maps', 'عرض مواقع المطاعم على خرائط تفاعلية')}
                badge="Maps"
              >
                <div className="sm:col-span-2">
                  <Field
                    label={t('Google Maps API Key', 'مفتاح API لخرائط جوجل')}
                    value={settings.maps.googleMapsApiKey}
                    onChange={v => updateMaps({ googleMapsApiKey: v })}
                    placeholder="AIzaSy..."
                    type="password"
                    hint={t(
                      'Enable Maps JavaScript API and Places API in Google Cloud Console.',
                      'فعّل Maps JavaScript API وPlaces API في Google Cloud Console.'
                    )}
                  />
                </div>
                <div className="sm:col-span-2 p-4 bg-muted/40 border border-border rounded-lg">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{t('Required APIs', 'واجهات API المطلوبة')}</h4>
                  <ul className="space-y-1">
                    {['Maps JavaScript API', 'Places API', 'Geocoding API', 'Directions API'].map(api => (
                      <li key={api} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {api}
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionCard>
            )}

            {/* Firebase */}
            {activeSection === 'firebase' && (
              <SectionCard
                icon={<Flame className="w-5 h-5" />}
                title={t('Firebase Configuration', 'إعداد Firebase')}
                subtitle={t('Configure Firebase for push notifications and real-time features', 'إعداد Firebase للإشعارات الفورية والميزات اللحظية')}
                badge="Push"
              >
                <Field
                  label={t('API Key', 'مفتاح API')}
                  value={settings.firebase.apiKey}
                  onChange={v => updateFirebase({ apiKey: v })}
                  placeholder="AIzaSy..."
                  type="password"
                />
                <Field
                  label={t('Auth Domain', 'نطاق المصادقة')}
                  value={settings.firebase.authDomain}
                  onChange={v => updateFirebase({ authDomain: v })}
                  placeholder="my-app.firebaseapp.com"
                />
                <Field
                  label={t('Project ID', 'معرف المشروع')}
                  value={settings.firebase.projectId}
                  onChange={v => updateFirebase({ projectId: v })}
                  placeholder="my-project-id"
                />
                <Field
                  label={t('Storage Bucket', 'حاوية التخزين')}
                  value={settings.firebase.storageBucket}
                  onChange={v => updateFirebase({ storageBucket: v })}
                  placeholder="my-app.appspot.com"
                />
                <Field
                  label={t('Messaging Sender ID', 'معرف مرسل الرسائل')}
                  value={settings.firebase.messagingSenderId}
                  onChange={v => updateFirebase({ messagingSenderId: v })}
                  placeholder="123456789012"
                />
                <Field
                  label={t('App ID', 'معرف التطبيق')}
                  value={settings.firebase.appId}
                  onChange={v => updateFirebase({ appId: v })}
                  placeholder="1:123456789012:web:abc123..."
                />
                <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {t(
                      'Find these values in Firebase Console → Project Settings → Your Apps.',
                      'ابحث عن هذه القيم في Firebase Console → إعدادات المشروع → تطبيقاتك.'
                    )}
                  </p>
                </div>
              </SectionCard>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
