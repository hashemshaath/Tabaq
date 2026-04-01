import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  BarChart3, Utensils, Users, CalendarDays, Star, MessageSquare,
  Settings, Globe, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  Eye, Edit, Trash2, Search, Filter, Shield, Bell, BookOpen,
  Tag, LayoutDashboard, Layers, Power, Zap, Award, CreditCard,
  FileText, ArrowUpRight, ChevronRight, MoreHorizontal, Plus,
  MapPin, Clock, LogOut, Database, Activity, FileSignature,
  DollarSign, Receipt, Send, Percent, BadgeCheck, Ban, RefreshCw,
  CheckSquare, X, Hash, ChefHat, Sparkles, Film, ThumbsUp, ThumbsDown, PlayCircle,
  ShieldCheck, User, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/StarRating';
import { getAuthHeaders, API_BASE } from '@/lib/api';
import { useDemoMode } from '@/context/DemoModeContext';

// ─── Verifications Admin Tab ──────────────────────────────────────
function VerificationsAdminTab({ t }: { t: (en: string, ar: string) => string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewNote, setReviewNote] = useState<Record<number, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-verifications', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const r = await fetch(`/api/admin/verification-requests${params}`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : { requests: [] };
    },
  });

  const requests: any[] = data?.requests ?? [];

  const reviewMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      const r = await fetch(`/api/admin/verification-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status, noteFromAdmin: reviewNote[id] ?? '' }),
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ['admin-verifications'] }); },
  });

  const METHOD_LABELS: Record<string, string> = { document: '🪪 ID Document', code: '🔐 Code', invite_link: '🔗 Invite Link' };
  const STATUS_COLORS: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t('Verification Requests', 'طلبات التحقق')}</h2>
          <p className="text-sm text-muted-foreground">{t('Review and approve user identity verification requests', 'مراجعة وقبول طلبات التحقق من هوية المستخدمين')}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <RefreshCw className="w-3.5 h-3.5" />{t('Refresh', 'تحديث')}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
            {t(s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1), s === 'all' ? 'الكل' : s === 'pending' ? 'معلق' : s === 'approved' ? 'مقبول' : 'مرفوض')}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{t('No verification requests', 'لا توجد طلبات تحقق')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
                    {req.userAvatarUrl
                      ? <img src={req.userAvatarUrl} alt="" className="w-full h-full object-cover" />
                      : <User className="w-5 h-5 text-muted-foreground m-auto" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{req.userName}</p>
                      {req.userIsVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">@{req.userUsername}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}>
                    {req.status}
                  </span>
                  <Link href={`/${req.userUsername}`}>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{METHOD_LABELS[req.method] ?? req.method}</span>
                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                {req.documentUrl && (
                  <a href={req.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" />{t('View Document', 'عرض الوثيقة')}
                  </a>
                )}
              </div>

              {req.noteFromUser && (
                <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-foreground">
                  <span className="font-semibold text-muted-foreground">{t('User note: ', 'ملاحظة المستخدم: ')}</span>{req.noteFromUser}
                </div>
              )}

              {req.status === 'pending' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    placeholder={t('Admin note (optional)...', 'ملاحظة الإدارة (اختياري)...')}
                    value={reviewNote[req.id] ?? ''}
                    onChange={e => setReviewNote(p => ({ ...p, [req.id]: e.target.value }))}
                    className="flex-1 text-xs bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/40"
                  />
                  <button
                    onClick={() => reviewMut.mutate({ id: req.id, status: 'approved' })}
                    disabled={reviewMut.isPending}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />{t('Approve', 'قبول')}
                  </button>
                  <button
                    onClick={() => reviewMut.mutate({ id: req.id, status: 'rejected' })}
                    disabled={reviewMut.isPending}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />{t('Reject', 'رفض')}
                  </button>
                </div>
              )}
              {req.noteFromAdmin && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">{t('Admin note: ', 'ملاحظة الإدارة: ')}</span>{req.noteFromAdmin}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Admin SEO Dashboard ─────────────────────────────────────────
type SeoSubTab = 'overview' | 'pages' | 'keywords' | 'sitemap';

const MANAGED_PAGES = [
  { path: '/', titleEn: 'Homepage', titleAr: 'الرئيسية', priority: '1.0', changefreq: 'daily' },
  { path: '/restaurants', titleEn: 'Restaurant Listing', titleAr: 'قائمة المطاعم', priority: '0.9', changefreq: 'daily' },
  { path: '/blog', titleEn: 'Blog Hub', titleAr: 'المدونة', priority: '0.8', changefreq: 'weekly' },
  { path: '/leaderboard', titleEn: 'Leaderboard', titleAr: 'لوحة المتصدرين', priority: '0.7', changefreq: 'weekly' },
  { path: '/offers', titleEn: 'Offers & Deals', titleAr: 'العروض والخصومات', priority: '0.8', changefreq: 'daily' },
  { path: '/experiences', titleEn: 'Experiences', titleAr: 'التجارب', priority: '0.7', changefreq: 'weekly' },
  { path: '/collections', titleEn: 'Collections', titleAr: 'المجموعات', priority: '0.7', changefreq: 'weekly' },
  { path: '/chefs', titleEn: 'Chefs Directory', titleAr: 'دليل الشيف', priority: '0.6', changefreq: 'weekly' },
  { path: '/dishes', titleEn: 'Dish Explorer', titleAr: 'استكشاف الأطباق', priority: '0.6', changefreq: 'weekly' },
  { path: '/search', titleEn: 'Search', titleAr: 'البحث', priority: '0.5', changefreq: 'daily' },
];

const SCHEMA_TYPES = [
  { type: 'Restaurant', pages: 'All restaurant detail pages', status: 'active', icon: '🍽️', descEn: 'LocalBusiness + AggregateRating + Menu + ReserveAction', implemented: true },
  { type: 'Article', pages: 'All blog posts', status: 'active', icon: '📰', descEn: 'Article + Author + Publisher + BreadcrumbList', implemented: true },
  { type: 'WebSite', pages: 'Homepage', status: 'active', icon: '🌐', descEn: 'WebSite + SearchAction (SitelinksSearchBox)', implemented: true },
  { type: 'Organization', pages: 'Homepage', status: 'active', icon: '🏢', descEn: 'Organization + ContactPoint + SameAs', implemented: true },
  { type: 'Menu', pages: 'Restaurant detail pages', status: 'active', icon: '📋', descEn: 'Menu + MenuSection + MenuItem with pricing', implemented: true },
  { type: 'BreadcrumbList', pages: 'Restaurant + Blog pages', status: 'active', icon: '🔗', descEn: 'BreadcrumbList for all key detail pages', implemented: true },
  { type: 'FoodEvent', pages: 'Event detail pages', status: 'partial', icon: '🎪', descEn: 'FoodEvent + location + offers', implemented: true },
  { type: 'Review', pages: 'Restaurant pages', status: 'planned', icon: '⭐', descEn: 'Individual review schema for Google rich results', implemented: false },
];

function AdminSeoTab({ t }: { t: (en: string, ar: string) => string }) {
  const [subTab, setSubTab] = useState<SeoSubTab>('overview');
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({ metaTitleEn: '', metaTitleAr: '', metaDescriptionEn: '', metaDescriptionAr: '', keywords: '', isIndexed: true, isFollowed: true, sitemapPriority: '0.8', sitemapChangefreq: 'weekly' });
  const [savingPage, setSavingPage] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [robotsTxt, setRobotsTxt] = useState('');
  const [editingRobots, setEditingRobots] = useState(false);
  const [sitemapRefreshed, setSitemapRefreshed] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywords, setKeywords] = useState<{ word: string; volume: string; difficulty: string }[]>([]);

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-seo-overview'],
    queryFn: async () => {
      const r = await fetch('/api/admin/seo/overview', { headers: getAuthHeaders() });
      return r.ok ? r.json() : null;
    },
  });

  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['admin-seo-settings'],
    queryFn: async () => {
      const r = await fetch('/api/admin/seo/settings', { headers: getAuthHeaders() });
      return r.ok ? r.json() : { settings: [] };
    },
  });

  const savedSettings: any[] = settingsData?.settings ?? [];
  const settingsByPath = Object.fromEntries(savedSettings.map((s: any) => [s.path, s]));

  function openPageEditor(path: string) {
    const existing = settingsByPath[path];
    setPageForm({
      metaTitleEn: existing?.metaTitleEn ?? '',
      metaTitleAr: existing?.metaTitleAr ?? '',
      metaDescriptionEn: existing?.metaDescriptionEn ?? '',
      metaDescriptionAr: existing?.metaDescriptionAr ?? '',
      keywords: existing?.keywords ?? '',
      isIndexed: existing?.isIndexed ?? true,
      isFollowed: existing?.isFollowed ?? true,
      sitemapPriority: existing?.sitemapPriority ?? '0.8',
      sitemapChangefreq: existing?.sitemapChangefreq ?? 'weekly',
    });
    setEditingPage(path);
    setSaveMsg('');
  }

  async function savePage() {
    if (!editingPage) return;
    setSavingPage(true);
    try {
      const r = await fetch('/api/admin/seo/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ path: editingPage, ...pageForm }),
      });
      if (r.ok) { setSaveMsg('Saved!'); refetchSettings(); setTimeout(() => setSaveMsg(''), 2000); }
      else { setSaveMsg('Error saving'); }
    } catch { setSaveMsg('Error saving'); }
    setSavingPage(false);
  }

  async function loadRobots() {
    try {
      const r = await fetch('/api/robots.txt');
      const text = await r.text();
      setRobotsTxt(text);
    } catch {}
  }

  useEffect(() => {
    if (subTab === 'sitemap') loadRobots();
  }, [subTab]);

  const SEO_SCORE_ITEMS = [
    { label: 'Restaurant JSON-LD', done: true, descEn: 'Schema.org Restaurant on all detail pages' },
    { label: 'Article JSON-LD', done: true, descEn: 'Schema.org Article on all blog posts' },
    { label: 'WebSite JSON-LD', done: true, descEn: 'SitelinksSearchBox on homepage' },
    { label: 'Menu Schema', done: true, descEn: 'Menu + MenuSection + MenuItem on restaurant pages' },
    { label: 'Breadcrumb Schema', done: true, descEn: 'BreadcrumbList on detail pages' },
    { label: 'Sitemap.xml', done: true, descEn: 'Dynamic sitemap with restaurants, blog, profiles' },
    { label: 'robots.txt', done: true, descEn: 'Proper crawl directives' },
    { label: 'Canonical URLs', done: true, descEn: 'Canonical tag set on all pages' },
    { label: 'hreflang EN/AR', done: true, descEn: 'Language alternates for bilingual pages' },
    { label: 'Open Graph Tags', done: true, descEn: 'og:title, og:description, og:image on all pages' },
    { label: 'Twitter Cards', done: true, descEn: 'Twitter Card meta on all pages' },
    { label: 'Image Alt Text', done: false, descEn: 'Ensure all images have descriptive alt text' },
  ];

  const implementedCount = SEO_SCORE_ITEMS.filter(i => i.done).length;
  const seoScore = Math.round((implementedCount / SEO_SCORE_ITEMS.length) * 100);

  const SUB_TABS: { id: SeoSubTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'pages', label: 'Page Settings', icon: FileText },
    { id: 'keywords', label: 'Keywords', icon: Hash },
    { id: 'sitemap', label: 'Sitemap & Robots', icon: Globe },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t('SEO Manager', 'مدير محركات البحث')}</h2>
          <p className="text-sm text-muted-foreground">{t('Comprehensive SEO control: structured data, meta tags, sitemap, keywords, and crawl settings.', 'تحكم شامل في محركات البحث: البيانات المنظمة، العلامات الوصفية، خريطة الموقع، الكلمات المفتاحية، وإعدادات الزحف.')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-center px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
            <div className="text-2xl font-black text-green-600">{seoScore}</div>
            <div className="text-[10px] text-green-600 font-bold uppercase">SEO Score</div>
          </div>
        </div>
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
        {SUB_TABS.map(st => {
          const Icon = st.icon;
          return (
            <button key={st.id} onClick={() => setSubTab(st.id)}
              className={`flex items-center gap-1.5 flex-1 justify-center text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${subTab === st.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />{st.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {subTab === 'overview' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'SEO Score', val: `${seoScore}/100`, icon: Globe, color: 'bg-green-50 text-green-600', border: 'border-green-200' },
              { label: 'Indexed Pages', val: overviewLoading ? '…' : (overviewData?.totalIndexedPages?.toLocaleString() ?? '—'), icon: Database, color: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
              { label: 'Restaurant Pages', val: overviewLoading ? '…' : (overviewData?.restaurantPages?.toLocaleString() ?? '—'), icon: Utensils, color: 'bg-primary/10 text-primary', border: 'border-primary/20' },
              { label: 'Blog Articles', val: overviewLoading ? '…' : (overviewData?.blogPages?.toLocaleString() ?? '—'), icon: BookOpen, color: 'bg-teal-50 text-teal-600', border: 'border-teal-200' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`bg-card border ${s.border} rounded-2xl p-4 flex items-center gap-3`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-lg font-extrabold text-foreground">{s.val}</p>
                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SEO Checklist */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">{t('SEO Implementation Checklist', 'قائمة تفحص تحسين محركات البحث')}</h3>
            </div>
            <div className="divide-y divide-border">
              {SEO_SCORE_ITEMS.map(item => (
                <div key={item.label} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.descEn}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.done ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Structured Data Overview */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">{t('Structured Data (JSON-LD) Coverage', 'تغطية البيانات المنظمة (JSON-LD)')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('Schema.org types implemented for Google Rich Results', 'أنواع Schema.org المطبقة لنتائج Google الغنية')}</p>
            </div>
            <div className="divide-y divide-border">
              {SCHEMA_TYPES.map(schema => (
                <div key={schema.type} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg shrink-0">{schema.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{schema.type}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${schema.implemented ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {schema.implemented ? '✓ Active' : 'Planned'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{schema.pages} · {schema.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE SETTINGS ── */}
      {subTab === 'pages' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('Override meta titles, descriptions, and crawl settings per page. Custom settings take priority over auto-generated ones.', 'تخصيص العناوين التعريفية والأوصاف وإعدادات الزحف لكل صفحة. الإعدادات المخصصة تأخذ الأولوية على التلقائية.')}</p>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {MANAGED_PAGES.map(page => {
                const custom = settingsByPath[page.path];
                const score = custom?.metaTitleEn && custom?.metaDescriptionEn ? 95 : custom?.metaTitleEn ? 75 : 60;
                return (
                  <div key={page.path} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-primary mb-0.5">{page.path}</p>
                      <p className="text-sm font-medium text-foreground">{page.titleEn}</p>
                      {custom?.metaTitleEn && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">"{custom.metaTitleEn}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-500'}`}>{score}</span>
                      </div>
                      <button onClick={() => openPageEditor(page.path)} className="flex items-center gap-1 text-xs text-primary font-semibold hover:bg-primary/10 px-2 py-1.5 rounded-lg transition-colors">
                        <Edit className="w-3.5 h-3.5" />{t('Edit', 'تعديل')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page Meta Editor */}
          {editingPage && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">{t('Edit SEO: ', 'تعديل SEO: ')}<code className="text-primary text-sm">{editingPage}</code></h3>
                <button onClick={() => setEditingPage(null)} className="p-1.5 hover:bg-secondary rounded-lg">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Meta Title (English)</label>
                  <input value={pageForm.metaTitleEn} onChange={e => setPageForm(f => ({...f, metaTitleEn: e.target.value}))} placeholder="Page Title | Tabaq" className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <p className={`text-[10px] mt-0.5 ${pageForm.metaTitleEn.length > 60 ? 'text-red-500' : 'text-muted-foreground'}`}>{pageForm.metaTitleEn.length}/60 chars</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">عنوان التعريف (العربية)</label>
                  <input dir="rtl" value={pageForm.metaTitleAr} onChange={e => setPageForm(f => ({...f, metaTitleAr: e.target.value}))} placeholder="عنوان الصفحة | طبق" className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <p className={`text-[10px] mt-0.5 ${pageForm.metaTitleAr.length > 60 ? 'text-red-500' : 'text-muted-foreground'}`}>{pageForm.metaTitleAr.length}/60 chars</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Meta Description (English)</label>
                  <textarea value={pageForm.metaDescriptionEn} onChange={e => setPageForm(f => ({...f, metaDescriptionEn: e.target.value}))} placeholder="Describe this page in 120-160 characters..." className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20" />
                  <p className={`text-[10px] mt-0.5 ${pageForm.metaDescriptionEn.length > 160 ? 'text-red-500' : pageForm.metaDescriptionEn.length < 120 ? 'text-amber-500' : 'text-green-600'}`}>{pageForm.metaDescriptionEn.length}/160 chars (target 120–160)</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">وصف التعريف (العربية)</label>
                  <textarea dir="rtl" value={pageForm.metaDescriptionAr} onChange={e => setPageForm(f => ({...f, metaDescriptionAr: e.target.value}))} placeholder="اكتب وصفاً بين ١٢٠-١٦٠ حرفاً..." className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20" />
                  <p className={`text-[10px] mt-0.5 ${pageForm.metaDescriptionAr.length > 160 ? 'text-red-500' : pageForm.metaDescriptionAr.length < 120 ? 'text-amber-500' : 'text-green-600'}`}>{pageForm.metaDescriptionAr.length}/160</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Focus Keywords</label>
                  <input value={pageForm.keywords} onChange={e => setPageForm(f => ({...f, keywords: e.target.value}))} placeholder="keyword1, keyword2, كلمة مفتاحية" className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={pageForm.isIndexed} onChange={e => setPageForm(f => ({...f, isIndexed: e.target.checked}))} className="rounded" />
                  {t('Indexable', 'قابل للفهرسة')}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={pageForm.isFollowed} onChange={e => setPageForm(f => ({...f, isFollowed: e.target.checked}))} className="rounded" />
                  {t('Followed', 'متابع الروابط')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{t('Priority', 'الأولوية')}:</span>
                  <select value={pageForm.sitemapPriority} onChange={e => setPageForm(f => ({...f, sitemapPriority: e.target.value}))} className="text-xs border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none">
                    {['1.0','0.9','0.8','0.7','0.6','0.5','0.4','0.3'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{t('Update freq', 'تكرار التحديث')}:</span>
                  <select value={pageForm.sitemapChangefreq} onChange={e => setPageForm(f => ({...f, sitemapChangefreq: e.target.value}))} className="text-xs border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none">
                    {['always','hourly','daily','weekly','monthly','yearly','never'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* SERP Preview */}
              {(pageForm.metaTitleEn || pageForm.metaDescriptionEn) && (
                <div className="bg-white border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-wider">SERP Preview</p>
                  <p className="text-blue-700 text-sm font-medium hover:underline cursor-pointer line-clamp-1">
                    {pageForm.metaTitleEn || 'Page Title | Tabaq'}
                  </p>
                  <p className="text-green-700 text-[11px] mt-0.5">tabaq.sa{editingPage}</p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{pageForm.metaDescriptionEn || 'Page description...'}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={savePage} disabled={savingPage} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {savingPage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {t('Save Settings', 'حفظ الإعدادات')}
                </button>
                {saveMsg && <span className={`text-sm font-semibold ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-500'}`}>{saveMsg}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KEYWORDS ── */}
      {subTab === 'keywords' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('Track and manage your target keywords. Use these to optimize page titles, headings, and content.', 'تتبع وإدارة الكلمات المفتاحية المستهدفة. استخدمها لتحسين عناوين الصفحات والعناوين الفرعية والمحتوى.')}</p>

          {/* Add keyword */}
          <div className="flex gap-2">
            <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newKeyword.trim()) { setKeywords(k => [...k, { word: newKeyword.trim(), volume: 'N/A', difficulty: 'unknown' }]); setNewKeyword(''); } }} placeholder={t('Add a keyword...', 'أضف كلمة مفتاحية...')} className="flex-1 px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={() => { if (newKeyword.trim()) { setKeywords(k => [...k, { word: newKeyword.trim(), volume: 'N/A', difficulty: 'unknown' }]); setNewKeyword(''); } }} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 px-5 py-2.5 bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
              <span>{t('Keyword', 'الكلمة المفتاحية')}</span>
              <span>{t('Search Volume', 'حجم البحث')}</span>
              <span>{t('Difficulty', 'الصعوبة')}</span>
            </div>
            <div className="divide-y divide-border">
              {keywords.map((kw, i) => (
                <div key={i} className="grid grid-cols-3 items-center px-5 py-3 group hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground">{kw.word}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{kw.volume}</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${kw.difficulty === 'low' ? 'bg-green-100 text-green-700' : kw.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : kw.difficulty === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {kw.difficulty}
                    </span>
                    <button onClick={() => setKeywords(k => k.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-red-500 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword recommendations */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-3">{t('AI Keyword Suggestions', 'اقتراحات الكلمات المفتاحية بالذكاء الاصطناعي')}</h3>
            <div className="flex flex-wrap gap-2">
              {['مطاعم فاخرة الرياض', 'صحن اليوم جدة', 'أفضل برغر الرياض', 'مطاعم حلال', 'best brunch Riyadh', 'iftar restaurants KSA', 'شيف سعودي', 'restaurant near me Riyadh', 'food delivery Saudi Arabia', 'مأكولات بحرية جدة'].map(sug => (
                <button key={sug} onClick={() => { if (!keywords.find(k => k.word === sug)) setKeywords(k => [...k, { word: sug, volume: '~', difficulty: 'medium' }]); }} className="text-xs bg-secondary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-lg font-medium transition-colors">
                  + {sug}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SITEMAP & ROBOTS ── */}
      {subTab === 'sitemap' && (
        <div className="space-y-5">
          {/* Sitemap actions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground">{t('Sitemap.xml', 'خريطة الموقع')}</h3>
                <p className="text-xs text-muted-foreground">{t('Dynamic sitemap including all restaurants, blog posts, user profiles, and categories.', 'خريطة ديناميكية تشمل جميع المطاعم ومقالات المدونة وملفات المستخدمين والتصنيفات.')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/api/sitemap.xml" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                <Globe className="w-4 h-4" />{t('View Sitemap', 'عرض الخريطة')}
              </a>
              <button onClick={() => { setSitemapRefreshed(true); setTimeout(() => setSitemapRefreshed(false), 3000); }} className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold border transition-all ${sitemapRefreshed ? 'bg-green-50 border-green-300 text-green-700' : 'border-border hover:bg-secondary text-foreground'}`}>
                <RefreshCw className={`w-4 h-4 ${sitemapRefreshed ? '' : ''}`} />
                {sitemapRefreshed ? t('Regenerated!', 'تم التحديث!') : t('Regenerate Sitemap', 'إعادة توليد الخريطة')}
              </button>
            </div>

            {/* Sitemap coverage table */}
            <div className="mt-4 bg-secondary/30 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>URL Type</span><span>Count</span><span>Frequency</span>
              </div>
              {[
                { type: 'Static pages', count: '11', freq: 'daily / weekly' },
                { type: 'Restaurant pages', count: overviewData?.restaurantPages ?? '…', freq: 'weekly' },
                { type: 'Blog articles', count: overviewData?.blogPages ?? '…', freq: 'monthly' },
                { type: 'User profiles', count: overviewData?.profilePages ?? '…', freq: 'weekly' },
                { type: 'Blog categories', count: '6+', freq: 'weekly' },
              ].map(row => (
                <div key={row.type} className="grid grid-cols-3 px-4 py-2 text-sm border-t border-border/50">
                  <span className="text-foreground font-medium">{row.type}</span>
                  <span className="text-muted-foreground">{String(row.count)}</span>
                  <span className="text-muted-foreground">{row.freq}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Robots.txt */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground">robots.txt</h3>
                <p className="text-xs text-muted-foreground">{t('Crawl directives for search engine bots.', 'توجيهات الزحف لروبوتات محركات البحث.')}</p>
              </div>
              <div className="flex gap-2">
                <a href="/api/robots.txt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Globe className="w-3 h-3" />View live
                </a>
                <button onClick={() => setEditingRobots(!editingRobots)} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-secondary rounded-lg hover:bg-secondary/80">
                  <Edit className="w-3 h-3" />{editingRobots ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
            <pre className={`text-xs font-mono bg-secondary/50 rounded-xl p-4 overflow-auto max-h-64 text-foreground ${editingRobots ? 'hidden' : ''}`}>{robotsTxt || 'Loading...'}</pre>
            {editingRobots && (
              <div className="space-y-3">
                <textarea value={robotsTxt} onChange={e => setRobotsTxt(e.target.value)} className="w-full h-48 text-xs font-mono bg-secondary/50 border border-input rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <p className="text-xs text-muted-foreground">{t('Note: robots.txt is server-generated. Changes here are for preview only. Edit the server configuration to apply changes permanently.', 'ملاحظة: ملف robots.txt يتم توليده من الخادم. التعديلات هنا للعرض فقط. عدّل إعدادات الخادم لتطبيق التغييرات بشكل دائم.')}</p>
              </div>
            )}
          </div>

          {/* hreflang info */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-3">{t('Multilingual SEO', 'تحسين محركات البحث متعدد اللغات')}</h3>
            <div className="space-y-3">
              {[
                { label: 'hreflang tags', status: true, desc: 'All pages serve hreflang="ar" and hreflang="en" alternate links' },
                { label: 'Arabic meta tags', status: true, desc: 'og:locale=ar_SA, og:locale:alternate=en_US on all pages' },
                { label: 'RTL support', status: true, desc: 'dir="rtl" applied dynamically based on language selection' },
                { label: 'Arabic keywords', status: true, desc: 'Arabic keywords included in meta content and structured data' },
                { label: 'Bilingual blog', status: true, desc: 'Blog posts have both titleAr/titleEn and contentAr/contentEn' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${item.status ? 'text-green-500' : 'text-amber-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Blog Management Tab ────────────────────────────────────────
function BlogManagementTab({ t }: { t: (en: string, ar: string) => string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titleEn: '', titleAr: '', status: 'draft', categoryId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-blog-categories'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/blog/categories`, { credentials: 'include' });
      return r.ok ? r.json() : [];
    },
  });

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/admin/blog/posts?limit=100`, { credentials: 'include', headers: getAuthHeaders() });
      return r.ok ? r.json() : [];
    },
  });
  const posts = filter === 'all' ? allPosts : allPosts.filter((p: any) => p.status === filter);

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API_BASE}/api/blog/posts/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
      if (!r.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    },
  });

  const createMut = async () => {
    if (!form.titleEn || !form.titleAr) return;
    setSubmitting(true);
    const slug = form.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await fetch(`${API_BASE}/api/blog/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          titleEn: form.titleEn,
          titleAr: form.titleAr,
          slug: `${slug}-${Date.now()}`,
          status: form.status,
          categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
          authorId: 1,
        }),
      });
      setForm({ titleEn: '', titleAr: '', status: 'draft', categoryId: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    } finally {
      setSubmitting(false);
    }
  };

  const filters: Array<{ id: typeof filter; label: string }> = [
    { id: 'all', label: 'All' }, { id: 'published', label: 'Published' }, { id: 'draft', label: 'Draft' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all ${filter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> {showForm ? t('Cancel', 'إلغاء') : t('New Post', 'مقال جديد')}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-foreground">{t('New Blog Post', 'مقال جديد')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('Title (English)', 'العنوان (إنجليزي)')}</label>
              <input value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))}
                placeholder="Article title in English..."
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('Title (Arabic)', 'العنوان (عربي)')}</label>
              <input value={form.titleAr} onChange={e => setForm(p => ({ ...p, titleAr: e.target.value }))}
                dir="rtl" placeholder="عنوان المقال بالعربية..."
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('Status', 'الحالة')}</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary bg-background">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('Category', 'الفئة')}</label>
              <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary bg-background">
                <option value="">-- No category --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nameEn}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors">{t('Cancel', 'إلغاء')}</button>
            <button onClick={createMut} disabled={submitting || !form.titleEn || !form.titleAr}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('Create Post', 'إنشاء مقال')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('No posts found', 'لا توجد مقالات')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Title', 'Category', 'Status', 'Views', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-secondary/20">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {post.coverImageUrl ? (
                        <img src={post.coverImageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-teal-600" />
                        </div>
                      )}
                      <p className="text-sm font-semibold text-foreground line-clamp-1 max-w-[200px]">{post.titleEn}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-muted-foreground">{post.categoryNameEn || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-700' : post.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-foreground">
                    {post.viewCount > 0 ? post.viewCount.toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Eye className="w-3.5 h-3.5" /></a>
                      {deleteId === post.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteMut.mutate(post.id)} className="px-2 py-0.5 text-xs bg-red-500 text-white rounded font-semibold hover:bg-red-600">
                            {deleteMut.isPending ? '...' : 'Yes'}
                          </button>
                          <button onClick={() => setDeleteId(null)} className="px-2 py-0.5 text-xs border border-border rounded hover:bg-secondary">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(post.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Menu Management Tab ────────────────────────────────────────
function MenuManagementTab({ lang, t }: { lang: string; t: (en: string, ar: string) => string }) {
  const qc = useQueryClient();
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [showDishForm, setShowDishForm] = useState<{ menuId: number; sectionId: number } | null>(null);
  const [dishForm, setDishForm] = useState({ nameEn: '', nameAr: '', price: '', descriptionEn: '', isBestseller: false, isChefChoice: false, isNewItem: false, discountPercentage: '' });

  const { data: restData } = useQuery({
    queryKey: ['admin-restaurants-list'],
    queryFn: async () => {
      const res = await fetch('/api/restaurants?limit=50', { headers: getAuthHeaders() });
      return res.json();
    },
  });

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['admin-menus', restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/menus`, { headers: getAuthHeaders() });
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const createDish = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: number; data: object }) => {
      const res = await fetch(`/api/menu-sections/${sectionId}/dishes`, {
        method: 'POST',
        headers: { ...(getAuthHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-menus', restaurantId] }); setShowDishForm(null); setDishForm({ nameEn: '', nameAr: '', price: '', descriptionEn: '', isBestseller: false, isChefChoice: false, isNewItem: false, discountPercentage: '' }); },
  });

  const deleteDish = useMutation({
    mutationFn: async (dishId: number) => {
      await fetch(`/api/dishes/${dishId}`, { method: 'DELETE', headers: getAuthHeaders() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-menus', restaurantId] }),
  });

  const restaurants = restData?.restaurants ?? restData ?? [];
  const menus = menuData?.menus ?? menuData ?? [];

  const MENU_TYPE_COLORS: Record<string, string> = {
    regular: 'bg-blue-100 text-blue-700', kids: 'bg-yellow-100 text-yellow-700',
    drinks: 'bg-cyan-100 text-cyan-700', desserts: 'bg-pink-100 text-pink-700',
    catering: 'bg-orange-100 text-orange-700', home_kitchen: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      {/* Restaurant Selector */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <Utensils className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">{t('Select Restaurant', 'اختر مطعماً')}</span>
          </div>
          <select
            className="flex-1 min-w-[200px] border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={restaurantId ?? ''}
            onChange={e => { setRestaurantId(e.target.value ? Number(e.target.value) : null); setExpandedMenu(null); }}
          >
            <option value="">{t('-- Choose a restaurant --', '-- اختر مطعماً --')}</option>
            {restaurants.map((r: any) => (
              <option key={r.id} value={r.id}>{lang === 'ar' ? (r.nameAr ?? r.nameEn) : r.nameEn}</option>
            ))}
          </select>
          {restaurantId && (
            <Link href={`/restaurants/${restaurantId}`}>
              <button className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                <Eye className="w-3.5 h-3.5" />{t('View Live', 'عرض المباشر')}
              </button>
            </Link>
          )}
        </div>
      </div>

      {!restaurantId && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-medium">{t('Select a restaurant to manage its menus', 'اختر مطعماً لإدارة قوائمه')}</p>
        </div>
      )}

      {restaurantId && isLoading && (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />)}</div>
      )}

      {restaurantId && !isLoading && menus.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t('No menus found for this restaurant', 'لا توجد قوائم لهذا المطعم')}</p>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors mx-auto">
            <Plus className="w-4 h-4" />{t('Create First Menu', 'إنشاء أول قائمة')}
          </button>
        </div>
      )}

      {restaurantId && !isLoading && menus.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">{t('Menus', 'القوائم')} ({menus.length})</h3>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />{t('Add Menu', 'إضافة قائمة')}
            </button>
          </div>

          {menus.map((menu: any) => {
            const sections = menu.sections ?? [];
            const isExpanded = expandedMenu === menu.id;
            const menuColor = MENU_TYPE_COLORS[menu.type] ?? 'bg-gray-100 text-gray-700';
            return (
              <div key={menu.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => setExpandedMenu(isExpanded ? null : menu.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Utensils className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">{lang === 'ar' ? menu.nameAr : menu.nameEn}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${menuColor}`}>{menu.type}</span>
                        {!menu.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Inactive</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{sections.length} {t('sections', 'أقسام')} · {sections.reduce((sum: number, s: any) => sum + (s.items?.length ?? 0), 0)} {t('dishes', 'أطباق')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => e.stopPropagation()} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={e => e.stopPropagation()} className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform" />}
                  </div>
                </div>

                {/* Sections */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {sections.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-3">{t('No sections yet', 'لا توجد أقسام بعد')}</p>
                        <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mx-auto">
                          <Plus className="w-3 h-3" />{t('Add Section', 'إضافة قسم')}
                        </button>
                      </div>
                    ) : sections.map((section: any) => {
                      const items = section.items ?? [];
                      const isSectionExpanded = expandedSection === section.id;
                      return (
                        <div key={section.id}>
                          <div
                            className="flex items-center justify-between px-5 py-3 bg-secondary/10 cursor-pointer hover:bg-secondary/20 transition-colors"
                            onClick={() => setExpandedSection(isSectionExpanded ? null : section.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <p className="font-semibold text-foreground text-sm">{lang === 'ar' ? section.nameAr : section.nameEn}</p>
                              <span className="text-xs text-muted-foreground">({items.length} {t('items', 'عناصر')})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={e => { e.stopPropagation(); setShowDishForm({ menuId: menu.id, sectionId: section.id }); }}
                                className="flex items-center gap-1 text-xs text-primary font-semibold hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                              >
                                <Plus className="w-3 h-3" />{t('Add Dish', 'إضافة طبق')}
                              </button>
                              <button onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {isSectionExpanded ? <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </div>

                          {/* Add Dish Form */}
                          {showDishForm?.sectionId === section.id && (
                            <div className="px-5 py-4 bg-primary/5 border-b border-primary/10">
                              <p className="text-sm font-bold text-foreground mb-3">{t('Add New Dish', 'إضافة طبق جديد')}</p>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <input value={dishForm.nameEn} onChange={e => setDishForm(f => ({...f, nameEn: e.target.value}))} placeholder={t('Name (English)', 'الاسم (إنجليزي)')} className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <input value={dishForm.nameAr} onChange={e => setDishForm(f => ({...f, nameAr: e.target.value}))} placeholder={t('Name (Arabic)', 'الاسم (عربي)')} className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" dir="rtl" />
                                <input value={dishForm.price} onChange={e => setDishForm(f => ({...f, price: e.target.value}))} placeholder={t('Price (SAR)', 'السعر (ريال)')} type="number" className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <input value={dishForm.discountPercentage} onChange={e => setDishForm(f => ({...f, discountPercentage: e.target.value}))} placeholder={t('Discount %', 'نسبة الخصم %')} type="number" className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                              </div>
                              <input value={dishForm.descriptionEn} onChange={e => setDishForm(f => ({...f, descriptionEn: e.target.value}))} placeholder={t('Description', 'الوصف')} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3" />
                              <div className="flex gap-3 mb-3">
                                {[{key:'isBestseller', labelEn:'Bestseller', labelAr:'الأكثر مبيعاً'},{key:'isChefChoice', labelEn:"Chef's Choice", labelAr:'اختيار الشيف'},{key:'isNewItem', labelEn:'New Item', labelAr:'جديد'}].map(badge => (
                                  <label key={badge.key} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                                    <input type="checkbox" checked={(dishForm as any)[badge.key]} onChange={e => setDishForm(f => ({...f, [badge.key]: e.target.checked}))} className="rounded" />
                                    {t(badge.labelEn, badge.labelAr)}
                                  </label>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => createDish.mutate({ sectionId: section.id, data: { nameEn: dishForm.nameEn, nameAr: dishForm.nameAr, price: dishForm.price ? Number(dishForm.price) : undefined, descriptionEn: dishForm.descriptionEn || undefined, isBestseller: dishForm.isBestseller, isChefChoice: dishForm.isChefChoice, isNewItem: dishForm.isNewItem, discountPercentage: dishForm.discountPercentage ? Number(dishForm.discountPercentage) : undefined } })}
                                  disabled={!dishForm.nameEn || createDish.isPending}
                                  className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                  {createDish.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                  {t('Add Dish', 'إضافة')}
                                </button>
                                <button onClick={() => setShowDishForm(null)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors">
                                  {t('Cancel', 'إلغاء')}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Dish List */}
                          {isSectionExpanded && (
                            <div className="divide-y divide-border/50">
                              {items.length === 0 ? (
                                <div className="px-8 py-4 text-xs text-muted-foreground">{t('No dishes in this section', 'لا توجد أطباق في هذا القسم')}</div>
                              ) : items.map((dish: any) => (
                                <div key={dish.id} className="flex items-center gap-4 px-8 py-3 hover:bg-secondary/10 group transition-colors">
                                  {dish.imageUrl && <img src={dish.imageUrl} alt={dish.nameEn} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                                  {!dish.imageUrl && <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0"><Utensils className="w-4 h-4 text-muted-foreground" /></div>}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? dish.nameAr : dish.nameEn}</p>
                                      {dish.isBestseller && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">Bestseller</span>}
                                      {dish.isChefChoice && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-bold">Chef's Choice</span>}
                                      {dish.isNewItem && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold">New</span>}
                                      {!dish.isAvailable && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold">Unavailable</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{dish.descriptionEn ?? '—'}</p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    {dish.price && <span className="text-sm font-bold text-primary">{Number(dish.price).toLocaleString('en-SA', { style: 'currency', currency: dish.currency || 'SAR', minimumFractionDigits: 0 })}</span>}
                                    {(dish.discountPercentage ?? 0) > 0 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold">-{dish.discountPercentage}%</span>}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Edit className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => deleteDish.mutate(dish.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="p-4 flex justify-center">
                      <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary font-medium transition-colors">
                        <Plus className="w-3.5 h-3.5" />{t('Add Section', 'إضافة قسم')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── Module Configuration ────────────────────────────────────────
type Module = {
  id: string;
  nameEn: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  enabled: boolean;
  version: string;
  dependencies: string[];
};

// ─── Stories Management Tab ─────────────────────────────────────
function StoriesManagementTab({ t }: { t: (en: string, ar: string) => string }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-stories', statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stories?status=${statusFilter}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch stories');
      return res.json();
    },
  });

  const stories: any[] = data?.stories || [];

  const moderate = async (storyId: number, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('Stories Moderation', 'إدارة القصص')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('Review and approve user-submitted restaurant stories.', 'مراجعة وقبول قصص المطاعم التي يرسلها المستخدمون.')}</p>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${statusFilter === s ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {s === 'pending' ? t('Pending', 'قيد الانتظار') : s === 'approved' ? t('Approved', 'مقبول') : t('Rejected', 'مرفوض')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('Loading stories...', 'جارٍ تحميل القصص...')}</div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">{t(`No ${statusFilter} stories`, `لا توجد قصص ${statusFilter === 'pending' ? 'معلقة' : statusFilter === 'approved' ? 'مقبولة' : 'مرفوضة'}`)}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {stories.map((story: any) => (
            <div key={story.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-start gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                  {story.mediaUrl ? (
                    story.mediaType === 'video' ? (
                      <div className="relative w-full h-full">
                        <video src={story.mediaUrl} className="w-full h-full object-cover" muted />
                        <PlayCircle className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
                      </div>
                    ) : (
                      <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <Film className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{story.caption || t('No caption', 'بدون تعليق')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('Restaurant ID', 'معرف المطعم')}: {story.restaurantId} · {t('User ID', 'معرف المستخدم')}: {story.userId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {story.mediaType === 'video' ? t('Video', 'فيديو') : t('Image', 'صورة')} · {new Date(story.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${story.status === 'pending' ? 'bg-amber-100 text-amber-700' : story.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {story.status === 'pending' ? t('Pending', 'معلق') : story.status === 'approved' ? t('Approved', 'مقبول') : t('Rejected', 'مرفوض')}
                    </span>
                  </div>

                  {/* Actions */}
                  {story.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => moderate(story.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> {t('Approve', 'قبول')}
                      </button>
                      <button
                        onClick={() => moderate(story.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> {t('Reject', 'رفض')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const INITIAL_MODULES: Module[] = [
  { id: 'reservations', nameEn: 'Reservations Engine', desc: 'Table booking, availability management, and confirmation flows', icon: CalendarDays, color: 'bg-blue-500/10 text-blue-600', enabled: true, version: '2.1.0', dependencies: [] },
  { id: 'reviews', nameEn: 'Reviews & Ratings', desc: 'User reviews, rating aggregation, and moderation tools', icon: Star, color: 'bg-amber-500/10 text-amber-600', enabled: true, version: '1.8.3', dependencies: [] },
  { id: 'vouchers', nameEn: 'Vouchers & Offers', desc: 'Promo code generation, offer campaigns, and redemption tracking', icon: Tag, color: 'bg-purple-500/10 text-purple-600', enabled: true, version: '1.4.1', dependencies: [] },
  { id: 'leaderboard', nameEn: 'Leaderboard & Points', desc: 'Gamification system, user levels, and diner rewards', icon: Award, color: 'bg-rose-500/10 text-rose-600', enabled: true, version: '1.2.0', dependencies: ['reviews'] },
  { id: 'blog', nameEn: 'Blog & Content', desc: 'Editorial content management, food guides, and SEO articles', icon: BookOpen, color: 'bg-teal-500/10 text-teal-600', enabled: true, version: '1.0.5', dependencies: [] },
  { id: 'seo', nameEn: 'SEO Manager', desc: 'Meta tags, structured data, sitemaps, and search optimization', icon: Globe, color: 'bg-indigo-500/10 text-indigo-600', enabled: true, version: '1.3.2', dependencies: ['blog'] },
  { id: 'waitlist', nameEn: 'Waitlist System', desc: 'Automated waitlist and SMS notification when tables become available', icon: Bell, color: 'bg-fuchsia-500/10 text-fuchsia-600', enabled: true, version: '1.0.1', dependencies: ['reservations'] },
  { id: 'console', nameEn: 'Business Console', desc: 'Restaurant owner dashboard, analytics, and management tools', icon: LayoutDashboard, color: 'bg-green-500/10 text-green-600', enabled: true, version: '2.0.0', dependencies: [] },
  { id: 'ai', nameEn: 'AI Recommendations', desc: 'Personalized restaurant suggestions using machine learning', icon: Zap, color: 'bg-violet-500/10 text-violet-600', enabled: false, version: '0.9.2-beta', dependencies: [] },
  { id: 'payments', nameEn: 'Payments & Wallet', desc: 'In-app payments, digital wallet, and transaction management', icon: CreditCard, color: 'bg-emerald-500/10 text-emerald-600', enabled: false, version: '0.8.0-beta', dependencies: [] },
  { id: 'analytics', nameEn: 'Advanced Analytics', desc: 'Platform-wide BI dashboards, revenue attribution, and funnel analysis', icon: BarChart3, color: 'bg-cyan-500/10 text-cyan-600', enabled: true, version: '1.5.0', dependencies: [] },
  { id: 'notifications', nameEn: 'Notification System', desc: 'Push, SMS, and email notification routing and templates', icon: Bell, color: 'bg-pink-500/10 text-pink-600', enabled: true, version: '1.1.0', dependencies: [] },
];

// ─── Types ──────────────────────────────────────────────────────
type AdminTab = 'overview' | 'offers' | 'contracts' | 'finance' | 'messages' | 'referrals' | 'restaurants' | 'registrations' | 'users' | 'bookings' | 'reviews' | 'blog' | 'seo' | 'modules' | 'settings' | 'review-queue' | 'promo-codes' | 'settlement' | 'exp-providers' | 'exp-listings' | 'exp-bookings' | 'exp-settings' | 'menus' | 'stories' | 'verifications';

// ─── Component ──────────────────────────────────────────────────
export function AdminPanelPage() {
  const { t, lang } = useLanguage();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantStatusFilter, setRestaurantStatusFilter] = useState('all');
  const { data: realStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
  });

  const { data: realModules } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/admin/modules`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.modules ?? null;
    },
    retry: false,
    staleTime: 30000,
  });

  const queryClient = useQueryClient();

  const toggleModuleApi = useMutation({
    mutationFn: async ({ moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) => {
      const res = await fetch(`${API_BASE}/api/admin/modules/${moduleId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isEnabled })
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-modules'] }),
  });

  const toggleModule = (id: string) => {
    const current = modules.find(m => m.id === id);
    if (current) {
      const newEnabled = !current.enabled;
      setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: newEnabled } : m));
      toggleModuleApi.mutate({ moduleId: id, isEnabled: newEnabled });
    }
  };

  const displayStats = realStats?.stats ?? null;

  const { data: adminRestaurantsData } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const res = await fetch('/api/restaurants?limit=100', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.restaurants ?? data ?? null;
    },
    retry: false,
    staleTime: 60000,
  });

  const { data: adminUsersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?limit=100', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 60000,
    enabled: activeTab === 'users',
  });

  const { data: adminBookingsData } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/bookings?limit=100', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 60000,
    enabled: activeTab === 'bookings',
  });

  const { data: adminReviewsData } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const res = await fetch('/api/reviews?limit=50', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 60000,
    enabled: activeTab === 'reviews',
  });

  const liveRestaurants: any[] = adminRestaurantsData ?? [];
  const liveAdminUsers: any[] = adminUsersData?.users ?? [];
  const liveAdminBookings: any[] = adminBookingsData?.bookings ?? [];
  const liveAdminReviews: any[] = adminReviewsData?.reviews ?? [];

  const { data: adminOffersData, refetch: refetchOffers } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/offers', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
  });

  const { data: referralData } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const res = await fetch('/api/admin/referrals', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'referrals',
  });

  const [pointsRules, setPointsRules] = useState({
    referralSignup: 100,
    referredBonus: 50,
    reviewWritten: 25,
    bookingMade: 15,
    voucherPurchased: 10,
    dailyMaxPoints: 500,
    pointExpireDays: 365,
    minRedemption: 100,
  });

  const toggleOfferActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/offers/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive })
      });
      return res.json();
    },
    onSuccess: () => refetchOffers(),
  });

  const [offerActionState, setOfferActionState] = useState<{ id: number; action: 'approve' | 'reject' | 'revision'; notes: string; commissionOverride?: string; paymentModel?: string } | null>(null);

  const approveOffer = useMutation({
    mutationFn: async ({ id, commissionOverridePercent, paymentModel, adminNotes }: any) => {
      const res = await fetch(`/api/admin/offers/${id}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ commissionOverridePercent, paymentModel, adminNotes })
      });
      return res.json();
    },
    onSuccess: () => { refetchOffers(); setOfferActionState(null); },
  });

  const rejectOffer = useMutation({
    mutationFn: async ({ id, adminNotes }: any) => {
      const res = await fetch(`/api/admin/offers/${id}/reject`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes })
      });
      return res.json();
    },
    onSuccess: () => { refetchOffers(); setOfferActionState(null); },
  });

  const requestRevision = useMutation({
    mutationFn: async ({ id, adminNotes }: any) => {
      const res = await fetch(`/api/admin/offers/${id}/request-revision`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes })
      });
      return res.json();
    },
    onSuccess: () => { refetchOffers(); setOfferActionState(null); },
  });

  const { data: contractsData, refetch: refetchContracts } = useQuery({
    queryKey: ['admin-contracts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/contracts', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'contracts',
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/transactions', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'finance',
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: async () => {
      const res = await fetch('/api/admin/invoices', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'finance',
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const res = await fetch('/api/admin/messages', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'messages',
  });

  const { data: registrationsData, refetch: refetchRegistrations } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/registrations?status=all', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
  });

  const pendingApplications: any[] = registrationsData?.applications?.filter((a: any) => a.status === 'pending') ?? [];

  const [contractForm, setContractForm] = useState({ restaurantId: '', paymentModel: 'full_collection', commissionPercent: '15', settlementDays: '7', partialCollectionPercent: '', validFrom: '', validUntil: '', notes: '', internalNotes: '' });
  const [showContractForm, setShowContractForm] = useState(false);

  const createContract = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      return res.json();
    },
    onSuccess: () => { refetchContracts(); setShowContractForm(false); },
  });

  const updateContractStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/contracts/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    onSuccess: () => refetchContracts(),
  });

  const [msgForm, setMsgForm] = useState({ restaurantId: '', subject: '', body: '', type: 'general' });
  const [showMsgForm, setShowMsgForm] = useState(false);

  const sendMessage = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      return res.json();
    },
    onSuccess: () => { refetchMessages(); setShowMsgForm(false); setMsgForm({ restaurantId: '', subject: '', body: '', type: 'general' }); },
  });

  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns?status=submitted&limit=50', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'review-queue',
  });

  const { data: promoCodesData, refetch: refetchPromoCodes } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const res = await fetch('/api/promo-codes', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'promo-codes',
  });

  const { data: recentReviewsData } = useQuery({
    queryKey: ['admin-recent-reviews-overview'],
    queryFn: async () => {
      const res = await fetch('/api/reviews?limit=20', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 60000,
  });

  const { data: settlementSummary } = useQuery({
    queryKey: ['admin-settlement-summary'],
    queryFn: async () => {
      const res = await fetch('/api/admin/transactions?status=pending&limit=200', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'settlement',
  });

  const liveCampaigns: any[] = Array.isArray(campaignsData) ? campaignsData : (campaignsData?.campaigns ?? []);
  const livePromoCodes: any[] = Array.isArray(promoCodesData) ? promoCodesData : (promoCodesData?.codes ?? []);
  const liveFlaggedReviews: any[] = (recentReviewsData?.reviews ?? []).filter((r: any) => parseFloat(r.ratingOverall ?? '5') <= 2).slice(0, 5);

  const pendingOffersCount = (adminOffersData?.offers as any[])?.filter((o: any) => o.approvalStatus === 'pending')?.length ?? 0;

  // ─── Experiences State ───────────────────────────────────────────
  const [expProviderFilter, setExpProviderFilter] = useState('all');
  const [expListingFilter, setExpListingFilter] = useState('all');
  const [expBookingFilter, setExpBookingFilter] = useState('all');
  const [expDateFrom, setExpDateFrom] = useState('');
  const [expDateTo, setExpDateTo] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerActionState, setProviderActionState] = useState<{ id: number; action: 'approve' | 'reject'; note: string } | null>(null);
  const [expActionState, setExpActionState] = useState<{ id: number; action: 'active' | 'suspended' | 'rejected'; note: string } | null>(null);
  const [expCancelState, setExpCancelState] = useState<{ id: number; reason: string } | null>(null);
  const [expSettings, setExpSettings] = useState<any>(null);
  const [expSettingsSaving, setExpSettingsSaving] = useState(false);

  const isExpTab = ['exp-providers', 'exp-listings', 'exp-bookings', 'exp-settings'].includes(activeTab);

  const { data: expProvidersData, refetch: refetchExpProviders } = useQuery({
    queryKey: ['admin-exp-providers', expProviderFilter],
    queryFn: async () => {
      const res = await fetch(`/api/provider-applications?status=${expProviderFilter}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'exp-providers',
  });

  const { data: expListingsData, refetch: refetchExpListings } = useQuery({
    queryKey: ['admin-exp-listings', expListingFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/experiences?status=${expListingFilter}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'exp-listings',
  });

  const { data: expBookingsData, refetch: refetchExpBookings } = useQuery({
    queryKey: ['admin-exp-bookings', expBookingFilter, expDateFrom, expDateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ status: expBookingFilter });
      if (expDateFrom) params.set('dateFrom', expDateFrom);
      if (expDateTo) params.set('dateTo', expDateTo);
      const res = await fetch(`/api/admin/experience-bookings?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
    enabled: activeTab === 'exp-bookings',
  });

  const { data: expSettingsData, refetch: refetchExpSettings } = useQuery({
    queryKey: ['admin-exp-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/experience-settings', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 60000,
    enabled: activeTab === 'exp-settings',
  });

  useEffect(() => {
    if (expSettingsData && !expSettings) {
      setExpSettings(expSettingsData);
    }
  }, [expSettingsData]);

  const approveProviderMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: number; status: string; adminNote?: string }) => {
      const res = await fetch(`/api/provider-applications/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, adminNote }),
      });
      return res.json();
    },
    onSuccess: () => { refetchExpProviders(); setProviderActionState(null); setSelectedProvider(null); },
  });

  const updateExpStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: number; status: string; adminNote?: string }) => {
      const res = await fetch(`/api/admin/experiences/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, adminNote }),
      });
      return res.json();
    },
    onSuccess: () => { refetchExpListings(); setExpActionState(null); },
  });

  const cancelExpBookingMutation = useMutation({
    mutationFn: async ({ id, cancelReason }: { id: number; cancelReason: string }) => {
      const res = await fetch(`/api/admin/experience-bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cancelReason }),
      });
      return res.json();
    },
    onSuccess: () => { refetchExpBookings(); setExpCancelState(null); },
  });

  const saveExpSettings = async () => {
    if (!expSettings) return;
    setExpSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/experience-settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(expSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setExpSettings(updated);
        refetchExpSettings();
      }
    } finally {
      setExpSettingsSaving(false);
    }
  };

  const pendingProviderCount = (expProvidersData?.providers as any[])?.filter((p: any) => p.status === 'pending')?.length ?? 0;

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number; group?: string }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'review-queue', label: 'Review Queue', icon: CheckSquare, badge: undefined },
    { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
    { id: 'settlement', label: 'Settlement', icon: Receipt },
    { id: 'registrations', label: 'Registrations', icon: Plus, badge: pendingApplications.length },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'offers', label: 'Offers', icon: Tag, badge: pendingOffersCount || undefined },
    { id: 'contracts', label: 'Contracts', icon: FileSignature },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'messages', label: 'Messages', icon: Send },
    { id: 'referrals', label: 'Referrals & Points', icon: Award },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: 1 },
    { id: 'stories', label: 'Stories', icon: Film },
    { id: 'menus', label: 'Menu Management', icon: Utensils },
    { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
    { id: 'blog', label: 'Blog & Content', icon: BookOpen },
    { id: 'seo', label: 'SEO Manager', icon: Globe },
    { id: 'modules', label: 'Modules', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const expNavItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'exp-providers', label: 'Providers', icon: Users, badge: pendingProviderCount || undefined },
    { id: 'exp-listings', label: 'Experiences', icon: MapPin },
    { id: 'exp-bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'exp-settings', label: 'Settings', icon: Settings },
  ];

  const enabledCount = modules.filter(m => m.enabled).length;

  return (
    <div className="min-h-screen bg-background flex" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-card border-e border-border flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0 z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-foreground leading-none">Tabaq</p>
            <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-start">{item.label}</span>
                {item.badge && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Experiences Section */}
          <div className="pt-2 pb-1">
            <p className="px-3 text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Experiences</p>
          </div>
          {expNavItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-start">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-border space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@tabaq.sa</p>
            </div>
          </div>
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <LogOut className="w-4 h-4" />
              Back to App
            </button>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-foreground capitalize">
            {isExpTab
              ? `Experiences — ${expNavItems.find(n => n.id === activeTab)?.label}`
              : navItems.find(n => n.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-9 ps-9 pe-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
              />
            </div>
            <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 end-1 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
        </div>

        <div className="p-6 pb-20">

          {/* ── DASHBOARD OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {displayStats ? [
                  { label: 'Total Restaurants', val: displayStats.totalRestaurants.toLocaleString(), icon: Utensils, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Total Users', val: displayStats.totalUsers.toLocaleString(), icon: Users, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Total Bookings', val: displayStats.totalBookings.toLocaleString(), icon: CalendarDays, color: 'bg-primary/10 text-primary' },
                  { label: 'Total Reviews', val: displayStats.totalReviews.toLocaleString(), icon: Star, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Active Offers', val: displayStats.activeOffers.toLocaleString(), icon: Tag, color: 'bg-green-50 text-green-600' },
                  { label: 'Avg. Platform Rating', val: Number(displayStats.avgPlatformRating) > 0 ? Number(displayStats.avgPlatformRating).toFixed(2) : 'N/A', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Platform Revenue', val: displayStats.platformRevenue ? `SAR ${Number(displayStats.platformRevenue).toLocaleString('en-SA', {maximumFractionDigits:0})}` : '—', icon: DollarSign, color: 'bg-violet-50 text-violet-600' },
                  { label: 'Gross Volume', val: displayStats.grossVolume ? `SAR ${Number(displayStats.grossVolume).toLocaleString('en-SA', {maximumFractionDigits:0})}` : '—', icon: BarChart3, color: 'bg-green-50 text-green-600' },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-extrabold text-foreground">{stat.val}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  );
                }) : Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-muted mb-3" />
                    <div className="h-7 w-24 bg-muted rounded mb-2" />
                    <div className="h-3 w-32 bg-muted/70 rounded" />
                  </div>
                ))}
              </div>

              {/* Modules Status Banner */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{enabledCount} of {modules.length} modules active</p>
                  <p className="text-sm text-muted-foreground">Platform services running normally · Last deployment 2 hours ago</p>
                </div>
                <button onClick={() => setActiveTab('modules')} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                  Manage <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Pending Registrations + Recent Reviews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-bold text-foreground">Pending Registrations</h2>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{pendingApplications.length}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {pendingApplications.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Utensils className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{r.nameEn ?? r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.city} · {r.appliedAt ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '')}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                          <button className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"><XCircle className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border">
                    <button onClick={() => setActiveTab('registrations')} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                      View all registrations <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-bold text-foreground">Low-rated Reviews</h2>
                    {liveFlaggedReviews.length > 0 && (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{liveFlaggedReviews.length}</span>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {liveFlaggedReviews.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-muted-foreground">No flagged reviews at this time</p>
                    ) : liveFlaggedReviews.map((review: any) => (
                      <div key={review.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="font-semibold text-sm text-foreground">{review.userNameEn ?? 'User'}</span>
                            <span className="text-xs text-muted-foreground ms-2">on {review.restaurantNameEn ?? '—'}</span>
                          </div>
                          <StarRating rating={review.ratingOverall ?? 0} size="xs" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">"{review.textEn ?? review.textAr ?? ''}"</p>
                        <div className="flex gap-2">
                          <button className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold hover:bg-green-200 transition-colors">Approve</button>
                          <button className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg font-semibold hover:bg-red-200 transition-colors">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border">
                    <button onClick={() => setActiveTab('reviews')} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                      Manage all reviews <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REGISTRATIONS ── */}
          {activeTab === 'registrations' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{pendingApplications.length} applications awaiting review</p>
                <div className="flex gap-2">
                  <button className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold">Approve All</button>
                </div>
              </div>
              <div className="space-y-4">
                {(registrationsData?.applications ?? []).map((r: any) => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-amber-100 text-amber-700',
                    approved: 'bg-green-100 text-green-700',
                    rejected: 'bg-red-100 text-red-700',
                  };
                  const handleAppAction = async (status: string) => {
                    await fetch(`/api/admin/registrations/${r.id}`, {
                      method: 'PATCH',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({ status }),
                    });
                    refetchRegistrations();
                  };
                  return (
                  <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                          <Utensils className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{r.nameEn ?? r.name}</h3>
                          <p className="text-sm text-muted-foreground">{r.nameAr} · {r.businessType ?? r.category}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.appliedAt ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-sm font-semibold text-foreground">{r.ownerName ?? r.owner}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold mt-2 ${statusColors[r.status] ?? 'bg-amber-100 text-amber-700'}`}>
                          <AlertCircle className="w-3 h-3" /> {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      {r.status !== 'approved' && (
                        <button onClick={() => handleAppAction('approved')} className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => handleAppAction('rejected')} className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      )}
                      {r.refCode && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-xl font-mono">{r.refCode}</span>
                      )}
                      <button className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-200 transition-colors ms-auto">
                        <MessageSquare className="w-4 h-4" /> Contact Owner
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RESTAURANTS ── */}
          {activeTab === 'restaurants' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                {['all', 'active', 'suspended'].map(f => (
                  <button
                    key={f}
                    onClick={() => setRestaurantStatusFilter(f)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all capitalize ${restaurantStatusFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}
                  >
                    {f}
                  </button>
                ))}
                <button className="ms-auto flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-4 py-2 rounded-full hover:bg-primary/5 transition-colors">
                  <Plus className="w-4 h-4" /> Add Restaurant
                </button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">Restaurant</th>
                      <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">City</th>
                      <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">Rating</th>
                      <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">Bookings</th>
                      <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">Plan</th>
                      <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {liveRestaurants.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">Loading restaurants...</td></tr>
                    )}
                    {liveRestaurants.map((r: any) => (
                      <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                              {r.coverImageUrl
                                ? <img src={r.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                : <Utensils className="w-4 h-4 text-primary" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{r.nameEn}</p>
                              {r.isVerified && <span className="text-xs text-primary flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{r.cityNameEn ?? r.cityId}</td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1 text-sm font-bold"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{Number(r.avgRating ?? 0).toFixed(1)}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground font-medium">{r.reviewCount ?? 0}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.priceTier === '$$$$' ? 'bg-purple-100 text-purple-700' : r.priceTier === '$$$' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>{r.priceTier ?? 'Standard'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            active
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Users', val: adminUsersData?.total ?? displayStats?.totalUsers ?? '—', icon: Users, color: 'bg-primary/10 text-primary' },
                  { label: 'Verified Users', val: liveAdminUsers.filter((u: any) => u.isVerified).length || '—', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
                  { label: 'Avg Points', val: liveAdminUsers.length > 0 ? Math.round(liveAdminUsers.reduce((s: number, u: any) => s + (u.points ?? 0), 0) / liveAdminUsers.length) : '—', icon: ArrowUpRight, color: 'bg-blue-50 text-blue-600' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><Icon className="w-5 h-5" /></div>
                      <div>
                        <p className="text-2xl font-extrabold text-foreground">{s.val}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">User Management</h3>
                  <div className="flex gap-2">
                    {['All', 'Active', 'Banned', 'Business Owners'].map(f => (
                      <button key={f} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${f === 'All' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">User</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Joined</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Points</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Level</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {liveAdminUsers.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading users...</td></tr>
                    )}
                    {liveAdminUsers.map((user: any) => (
                      <tr key={user.id} className="hover:bg-secondary/20">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">{(user.nameEn || 'U')[0]}</div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{user.nameEn || user.nameAr || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{user.email || user.phone || user.username || user.refCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="py-3 text-sm font-medium text-foreground">{user.points ?? 0} pts</td>
                        <td className="py-3 text-sm font-medium text-foreground">L{user.level} · {user.levelTitle}</td>
                        <td className="py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>{user.isVerified ? 'Verified' : 'Unverified'}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground text-xs">View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4 mb-2">
                {[
                  { label: 'Total Bookings', val: adminBookingsData?.total ?? displayStats?.totalBookings ?? '—', color: 'text-primary' },
                  { label: 'Confirmed', val: liveAdminBookings.filter((b: any) => b.status === 'confirmed').length || 0, color: 'text-green-600' },
                  { label: 'Pending', val: liveAdminBookings.filter((b: any) => b.status === 'pending').length || 0, color: 'text-amber-600' },
                  { label: 'Cancelled', val: liveAdminBookings.filter((b: any) => b.status === 'cancelled').length || 0, color: 'text-red-600' },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-bold text-foreground flex-1">All Bookings</h3>
                  <button className="flex items-center gap-2 text-sm text-primary font-semibold border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5">
                    <Filter className="w-3.5 h-3.5" /> Filter
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Reference', 'Diner', 'Restaurant', 'Date & Time', 'Guests', 'Status'].map(h => (
                        <th key={h} className="text-start py-2 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {liveAdminBookings.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading bookings...</td></tr>
                    )}
                    {liveAdminBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-secondary/20">
                        <td className="py-3 font-mono text-xs text-muted-foreground">{b.referenceCode}</td>
                        <td className="py-3 font-medium text-foreground">{b.userName || `User #${b.userId}`}</td>
                        <td className="py-3 text-muted-foreground">{b.restaurantNameEn || `Restaurant #${b.restaurantId}`}</td>
                        <td className="py-3 text-muted-foreground">{b.date} · {b.time}</td>
                        <td className="py-3 text-muted-foreground">{b.partySize}</td>
                        <td className="py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-amber-100 text-amber-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-secondary text-muted-foreground'}`}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REVIEWS ── */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {['All', 'Approved', 'Flagged', 'Removed'].map(f => (
                  <button key={f} className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${f === 'All' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{f}</button>
                ))}
              </div>
              {liveAdminReviews.length === 0 && (
                <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading reviews...</div>
              )}
              {liveAdminReviews.map((review: any) => {
                const userName = review.userNameEn || review.userNameAr || `User #${review.userId}`;
                const reviewText = review.textEn || review.textAr || '';
                const createdAt = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '';
                return (
                <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {review.userAvatarUrl
                          ? <img src={review.userAvatarUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-primary font-bold text-sm">{userName[0]}</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{userName}</p>
                        <p className="text-xs text-muted-foreground">{liveRestaurants.find((r: any) => r.id === review.restaurantId)?.nameEn ?? `Restaurant #${review.restaurantId}`} · {createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.ratingOverall} size="md" />
                      {review.isExpertReview && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Critic</span>}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">approved</span>
                    </div>
                  </div>
                  {reviewText && <p className="text-sm text-muted-foreground mb-3">"{reviewText}"</p>}
                  <div className="flex gap-2">
                    <button className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-200">Remove</button>
                    <button className="text-xs bg-secondary text-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-secondary/80">View Context</button>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* ── MENUS ── */}
          {activeTab === 'menus' && <MenuManagementTab lang={lang} t={t} />}

          {/* ── STORIES ── */}
          {activeTab === 'stories' && <StoriesManagementTab t={t} />}

          {/* ── VERIFICATIONS ── */}
          {activeTab === 'verifications' && <VerificationsAdminTab t={t} />}

          {/* ── BLOG ── */}
          {activeTab === 'blog' && <BlogManagementTab t={t} />}

          {/* ── SEO ── */}
          {activeTab === 'seo' && <AdminSeoTab t={t} />}

          {/* ── OFFERS MANAGEMENT ── */}
          {activeTab === 'offers' && (
            <div className="space-y-5">
              {/* Action modal */}
              {offerActionState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {offerActionState.action === 'approve' && <BadgeCheck className="w-5 h-5 text-green-600" />}
                      {offerActionState.action === 'reject' && <Ban className="w-5 h-5 text-red-600" />}
                      {offerActionState.action === 'revision' && <RefreshCw className="w-5 h-5 text-amber-600" />}
                      <h3 className="font-bold text-foreground capitalize">
                        {offerActionState.action === 'approve' ? 'Approve Offer' : offerActionState.action === 'reject' ? 'Reject Offer' : 'Request Revision'}
                      </h3>
                    </div>

                    {offerActionState.action === 'approve' && (
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Commission Override % (leave blank to use contract default)</label>
                          <input type="number" step="0.5" placeholder="e.g. 12.5" value={offerActionState.commissionOverride ?? ''}
                            onChange={e => setOfferActionState(s => s ? { ...s, commissionOverride: e.target.value } : s)}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Payment Model Override</label>
                          <select value={offerActionState.paymentModel ?? ''}
                            onChange={e => setOfferActionState(s => s ? { ...s, paymentModel: e.target.value } : s)}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="">— Use contract default —</option>
                            <option value="full_collection">Full Collection</option>
                            <option value="partial_collection">Partial Collection</option>
                            <option value="direct_payment">Direct Payment</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                        {offerActionState.action === 'approve' ? 'Admin Notes (optional)' : 'Reason / Instructions *'}
                      </label>
                      <textarea value={offerActionState.notes}
                        onChange={e => setOfferActionState(s => s ? { ...s, notes: e.target.value } : s)}
                        rows={3}
                        placeholder={offerActionState.action === 'approve' ? 'Any notes for the restaurant...' : 'Explain what needs to change...'}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setOfferActionState(null)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (offerActionState.action === 'approve') {
                            approveOffer.mutate({ id: offerActionState.id, adminNotes: offerActionState.notes || undefined, commissionOverridePercent: offerActionState.commissionOverride || undefined, paymentModel: offerActionState.paymentModel || undefined });
                          } else if (offerActionState.action === 'reject') {
                            rejectOffer.mutate({ id: offerActionState.id, adminNotes: offerActionState.notes || undefined });
                          } else {
                            requestRevision.mutate({ id: offerActionState.id, adminNotes: offerActionState.notes });
                          }
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${offerActionState.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : offerActionState.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                        {offerActionState.action === 'approve' ? 'Approve & Activate' : offerActionState.action === 'reject' ? 'Reject Offer' : 'Send for Revision'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Header actions */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
                    <Tag className="w-4 h-4" />
                    {adminOffersData?.total ?? 0} Total
                  </div>
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                    <BadgeCheck className="w-4 h-4" />
                    {(adminOffersData?.offers as any[])?.filter((o: any) => o.approvalStatus === 'approved')?.length ?? 0} Approved
                  </div>
                  {pendingOffersCount > 0 && (
                    <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <Clock className="w-4 h-4" />
                      {pendingOffersCount} Pending Review
                    </div>
                  )}
                </div>
              </div>

              {/* Offers table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-start px-5 py-3.5 text-xs font-semibold text-muted-foreground">Offer</th>
                        <th className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">Restaurant</th>
                        <th className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">Discount</th>
                        <th className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">Price</th>
                        <th className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">Redemptions</th>
                        <th className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">Valid Until</th>
                        <th className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">Approval</th>
                        <th className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">Active</th>
                        <th className="px-4 py-3.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!adminOffersData?.offers?.length ? (
                        <tr>
                          <td colSpan={9} className="py-16 text-center text-muted-foreground">
                            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No offers yet</p>
                            <p className="text-xs mt-1">Restaurants submit offers for approval here</p>
                          </td>
                        </tr>
                      ) : (
                        (adminOffersData.offers as any[]).map((offer: any) => (
                          <tr key={offer.id} className={`hover:bg-secondary/30 transition-colors ${offer.approvalStatus === 'pending' ? 'bg-amber-50/40' : ''}`}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                  <Tag className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground text-sm truncate max-w-[160px]">{offer.titleEn}</p>
                                  {offer.refCode && <p className="text-xs font-mono text-muted-foreground">{offer.refCode}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-foreground">{offer.restaurantNameEn ?? '—'}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                -{Number(offer.discountPercent ?? 0).toFixed(0)}%
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-foreground">SAR {Number(offer.discountedPrice ?? 0).toFixed(0)}</span>
                              {offer.originalPrice && <span className="text-xs text-muted-foreground line-through ms-1.5">{Number(offer.originalPrice).toFixed(0)}</span>}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-foreground">{offer.redemptions ?? 0}</span>
                              {offer.totalCapacity && <span className="text-xs text-muted-foreground"> / {offer.totalCapacity}</span>}
                            </td>
                            <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                              {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-4 py-4">
                              {offer.approvalStatus === 'approved' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full"><BadgeCheck className="w-3 h-3" /> Approved</span>}
                              {offer.approvalStatus === 'pending' && <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Pending</span>}
                              {offer.approvalStatus === 'rejected' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full"><X className="w-3 h-3" /> Rejected</span>}
                              {offer.approvalStatus === 'revision_requested' && <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full"><RefreshCw className="w-3 h-3" /> Revision</span>}
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => offer.approvalStatus === 'approved' && toggleOfferActive.mutate({ id: offer.id, isActive: !offer.isActive })}
                                disabled={offer.approvalStatus !== 'approved'}
                                className={`relative rounded-full transition-all duration-300 ${offer.isActive ? 'bg-primary' : offer.approvalStatus !== 'approved' ? 'bg-muted/50 cursor-not-allowed' : 'bg-muted'}`}
                                style={{ width: 40, height: 22 }}
                                title={offer.approvalStatus !== 'approved' ? 'Must be approved first' : ''}
                              >
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${offer.isActive ? 'start-[20px]' : 'start-0.5'}`} />
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                {offer.approvalStatus === 'pending' && (
                                  <>
                                    <button onClick={() => setOfferActionState({ id: offer.id, action: 'approve', notes: '', commissionOverride: '', paymentModel: '' })}
                                      className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title="Approve">
                                      <CheckSquare className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setOfferActionState({ id: offer.id, action: 'reject', notes: '' })}
                                      className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Reject">
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setOfferActionState({ id: offer.id, action: 'revision', notes: '' })}
                                      className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors" title="Request Revision">
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                {offer.approvalStatus === 'approved' && (
                                  <button onClick={() => setOfferActionState({ id: offer.id, action: 'reject', notes: '' })}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="Revoke">
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" title="More">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTRACTS ── */}
          {activeTab === 'contracts' && (
            <div className="space-y-5">
              {/* New Contract form */}
              {showContractForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-foreground flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary" /> New Contract</h3>
                      <button onClick={() => setShowContractForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Restaurant ID</label>
                        <input type="number" placeholder="Restaurant ID" value={contractForm.restaurantId}
                          onChange={e => setContractForm(f => ({ ...f, restaurantId: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Payment Model</label>
                          <select value={contractForm.paymentModel}
                            onChange={e => setContractForm(f => ({ ...f, paymentModel: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="full_collection">Full Collection</option>
                            <option value="partial_collection">Partial Collection</option>
                            <option value="direct_payment">Direct Payment</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Commission %</label>
                          <input type="number" step="0.5" value={contractForm.commissionPercent}
                            onChange={e => setContractForm(f => ({ ...f, commissionPercent: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                      {contractForm.paymentModel === 'partial_collection' && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tabaq Collects % (upfront)</label>
                          <input type="number" step="0.5" placeholder="e.g. 50" value={contractForm.partialCollectionPercent}
                            onChange={e => setContractForm(f => ({ ...f, partialCollectionPercent: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Settlement Days</label>
                          <input type="number" value={contractForm.settlementDays}
                            onChange={e => setContractForm(f => ({ ...f, settlementDays: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Valid From</label>
                          <input type="date" value={contractForm.validFrom}
                            onChange={e => setContractForm(f => ({ ...f, validFrom: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Valid Until (optional)</label>
                        <input type="date" value={contractForm.validUntil}
                          onChange={e => setContractForm(f => ({ ...f, validUntil: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Public Notes</label>
                        <textarea rows={2} value={contractForm.notes}
                          onChange={e => setContractForm(f => ({ ...f, notes: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Internal Notes</label>
                        <textarea rows={2} value={contractForm.internalNotes}
                          onChange={e => setContractForm(f => ({ ...f, internalNotes: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button onClick={() => setShowContractForm(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
                      <button
                        onClick={() => createContract.mutate({
                          restaurantId: parseInt(contractForm.restaurantId),
                          paymentModel: contractForm.paymentModel,
                          commissionPercent: parseFloat(contractForm.commissionPercent),
                          partialCollectionPercent: contractForm.partialCollectionPercent ? parseFloat(contractForm.partialCollectionPercent) : undefined,
                          settlementDays: parseInt(contractForm.settlementDays),
                          validFrom: contractForm.validFrom || undefined,
                          validUntil: contractForm.validUntil || undefined,
                          notes: contractForm.notes || undefined,
                          internalNotes: contractForm.internalNotes || undefined,
                        })}
                        disabled={!contractForm.restaurantId}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                        Create Contract
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
                    <FileSignature className="w-4 h-4" />
                    {contractsData?.total ?? 0} Contracts
                  </div>
                </div>
                <Button size="sm" className="gap-2" onClick={() => setShowContractForm(true)}>
                  <Plus className="w-4 h-4" /> New Contract
                </Button>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        {['Ref Code', 'Restaurant', 'Payment Model', 'Commission', 'Settlement', 'Valid From', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!contractsData?.contracts?.length ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-muted-foreground">
                            <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No contracts yet</p>
                            <p className="text-xs mt-1">Create a contract to establish commission terms with a restaurant</p>
                          </td>
                        </tr>
                      ) : (
                        (contractsData.contracts as any[]).map((c: any) => (
                          <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{c.refCode}</td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-foreground">{c.restaurantNameEn ?? `Restaurant #${c.restaurantId}`}</p>
                              <p className="text-xs text-muted-foreground">{c.restaurantRefCode ?? ''}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-semibold capitalize">{(c.paymentModel as string).replace(/_/g, ' ')}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                <Percent className="w-3 h-3" />{c.commissionPercent}%
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs text-muted-foreground">{c.settlementDays}d</td>
                            <td className="px-4 py-4 text-xs text-muted-foreground">
                              {c.validFrom ? new Date(c.validFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'draft' ? 'bg-gray-100 text-gray-600' : c.status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                {c.status === 'draft' && (
                                  <button onClick={() => updateContractStatus.mutate({ id: c.id, status: 'active' })}
                                    className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-semibold hover:bg-green-200 transition-colors">Activate</button>
                                )}
                                {c.status === 'active' && (
                                  <button onClick={() => updateContractStatus.mutate({ id: c.id, status: 'suspended' })}
                                    className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg font-semibold hover:bg-amber-200 transition-colors">Suspend</button>
                                )}
                                {c.status === 'suspended' && (
                                  <button onClick={() => updateContractStatus.mutate({ id: c.id, status: 'active' })}
                                    className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-semibold hover:bg-green-200 transition-colors">Reactivate</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── FINANCE (Transactions + Invoices) ── */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Finance summary banner */}
              <div className="bg-gradient-to-br from-violet-950 to-purple-900 rounded-2xl p-5 text-white">
                <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1">Platform Revenue Overview</p>
                <div className="flex flex-wrap gap-6 items-end">
                  <div>
                    <p className="text-3xl font-black">SAR {transactionsData?.totals?.commissionAmount ? Number(transactionsData.totals.commissionAmount).toLocaleString('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}</p>
                    <p className="text-violet-300 text-xs mt-0.5">Total Commission Earned</p>
                  </div>
                  <div className="text-end ms-auto">
                    <p className="text-xl font-bold">SAR {transactionsData?.totals?.grossAmount ? Number(transactionsData.totals.grossAmount).toLocaleString('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}</p>
                    <p className="text-violet-300 text-xs">Gross Volume Processed</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-bold">SAR {transactionsData?.totals?.netAmount ? Number(transactionsData.totals.netAmount).toLocaleString('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}</p>
                    <p className="text-violet-300 text-xs">Net Paid to Partners</p>
                  </div>
                </div>
              </div>
              {/* Finance stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Transactions', val: transactionsData?.totals?.count ?? '—', icon: Receipt, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Total Invoices', val: invoicesData?.invoices?.length ?? '—', icon: FileText, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Pending Settlement', val: (transactionsData?.transactions as any[])?.filter((t: any) => t.status === 'pending')?.length ?? '—', icon: Clock, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Overdue Invoices', val: (invoicesData?.invoices as any[])?.filter((i: any) => i.status === 'overdue')?.length ?? 0, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><Icon className="w-4 h-4" /></div>
                      <p className="text-xl font-extrabold text-foreground">{String(s.val)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Transactions ledger */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> Transaction Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20">
                        {['Ref Code', 'Type', 'Restaurant', 'Gross', 'Commission', 'Net', 'Status', 'Date'].map(h => (
                          <th key={h} className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!(transactionsData?.transactions as any[])?.length ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-muted-foreground">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">No transactions yet</p>
                          </td>
                        </tr>
                      ) : (
                        (transactionsData.transactions as any[]).map((t: any) => (
                          <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.refCode}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold capitalize">{(t.type as string).replace(/_/g, ' ')}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">{t.restaurantNameEn ?? `#${t.restaurantId}`}</td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">SAR {Number(t.grossAmount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-xs text-red-600 font-medium">{t.commissionAmount ? `-SAR ${Number(t.commissionAmount).toFixed(2)}` : '—'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-700">SAR {Number(t.netAmount).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoices */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20">
                        {['Ref Code', 'Restaurant', 'Period', 'Gross', 'Commission', 'Net', 'Transactions', 'Status', 'Due Date'].map(h => (
                          <th key={h} className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!(invoicesData?.invoices as any[])?.length ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">No invoices yet</p>
                          </td>
                        </tr>
                      ) : (
                        (invoicesData.invoices as any[]).map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.refCode}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{inv.restaurantNameEn ?? `#${inv.restaurantId}`}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(inv.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(inv.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">SAR {Number(inv.totalGrossAmount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-xs text-red-600">-SAR {Number(inv.totalCommissionAmount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-700">SAR {Number(inv.totalNetAmount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground text-center">{inv.totalTransactions}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'sent' ? 'bg-blue-100 text-blue-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeTab === 'messages' && (
            <div className="space-y-5">
              {showMsgForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-foreground flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Send Message to Restaurant</h3>
                      <button onClick={() => setShowMsgForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Restaurant ID</label>
                        <input type="number" placeholder="Restaurant ID" value={msgForm.restaurantId}
                          onChange={e => setMsgForm(f => ({ ...f, restaurantId: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Type</label>
                          <select value={msgForm.type}
                            onChange={e => setMsgForm(f => ({ ...f, type: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="general">General</option>
                            <option value="offer_feedback">Offer Feedback</option>
                            <option value="contract_update">Contract Update</option>
                            <option value="payment">Payment</option>
                            <option value="warning">Warning</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Subject</label>
                          <input type="text" placeholder="Message subject" value={msgForm.subject}
                            onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Message Body *</label>
                        <textarea rows={5} placeholder="Write your message..." value={msgForm.body}
                          onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setShowMsgForm(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
                      <button
                        onClick={() => sendMessage.mutate({ restaurantId: parseInt(msgForm.restaurantId), subject: msgForm.subject, body: msgForm.body, type: msgForm.type })}
                        disabled={!msgForm.restaurantId || !msgForm.body}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                        <Send className="w-4 h-4" /> Send Message
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
                  <MessageSquare className="w-4 h-4" />
                  {messagesData?.total ?? 0} Messages Sent
                </div>
                <Button size="sm" className="gap-2" onClick={() => setShowMsgForm(true)}>
                  <Plus className="w-4 h-4" /> New Message
                </Button>
              </div>

              <div className="space-y-3">
                {!(messagesData?.messages as any[])?.length ? (
                  <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No messages sent yet</p>
                    <p className="text-xs mt-1">Send your first message to a restaurant</p>
                  </div>
                ) : (
                  (messagesData.messages as any[]).map((msg: any) => (
                    <div key={msg.id} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{msg.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            To: {msg.restaurantNameEn ?? `Restaurant #${msg.restaurantId}`} · {msg.refCode} · {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${msg.type === 'warning' ? 'bg-red-100 text-red-700' : msg.type === 'payment' ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
                            {(msg.type as string).replace(/_/g, ' ')}
                          </span>
                          {msg.isRead ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Read</span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Unread</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{msg.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── REFERRALS & POINTS ── */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              {/* Analytics Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Referrals', val: referralData?.stats?.totalReferrals ?? '—', icon: Users, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Converted', val: referralData?.stats?.converted ?? '—', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
                  { label: 'Conversion Rate', val: referralData?.stats ? `${referralData.stats.conversionRate}%` : '—', icon: TrendingUp, color: 'bg-primary/10 text-primary' },
                  { label: 'Points Awarded', val: referralData?.stats?.totalPointsAwarded?.toLocaleString() ?? '—', icon: Award, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Points Redeemed', val: referralData?.stats?.totalPointsRedeemed?.toLocaleString() ?? '—', icon: Tag, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Outstanding Points', val: referralData?.stats?.outstandingPoints?.toLocaleString() ?? '—', icon: Activity, color: 'bg-orange-50 text-orange-600' },
                  { label: 'Pending Referrals', val: referralData?.stats?.pending ?? '—', icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
                  { label: 'Total Transactions', val: referralData?.stats?.totalTransactions?.toLocaleString() ?? '—', icon: Database, color: 'bg-cyan-50 text-cyan-600' },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-extrabold text-foreground">{String(stat.val)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Top Referrers */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="font-bold text-foreground">Top Referrers</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Most active users by invitations sent</p>
                  </div>
                  {!referralData?.topReferrers?.length ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No referrals yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {(referralData.topReferrers as any[]).map((r: any, i: number) => (
                        <div key={r.referrerId} className="flex items-center gap-3 px-5 py-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-secondary text-foreground' : 'bg-secondary text-muted-foreground'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{r.nameEn || r.email || `User #${r.referrerId}`}</p>
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          </div>
                          <div className="text-end">
                            <p className="text-sm font-bold text-foreground">{r.referralCount}</p>
                            <p className="text-xs text-muted-foreground">{r.pointsEarned ?? 0} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Points Rules Configurator */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">Points Rules</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Configure how points are earned and redeemed</p>
                    </div>
                    <button
                      onClick={() => alert('Points rules saved! (Connected to API in production)')}
                      className="text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Save Rules
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { key: 'referralSignup', label: 'Points per successful referral (referrer)', icon: '🎁' },
                      { key: 'referredBonus', label: 'Welcome bonus for referred user', icon: '👋' },
                      { key: 'reviewWritten', label: 'Points for writing a review', icon: '⭐' },
                      { key: 'bookingMade', label: 'Points for completing a booking', icon: '📅' },
                      { key: 'voucherPurchased', label: 'Points for purchasing a voucher', icon: '🎫' },
                      { key: 'dailyMaxPoints', label: 'Max points per day (cap)', icon: '⚡' },
                      { key: 'pointExpireDays', label: 'Points expire after (days)', icon: '📆' },
                      { key: 'minRedemption', label: 'Minimum points to redeem', icon: '💳' },
                    ].map(rule => (
                      <div key={rule.key} className="flex items-center justify-between gap-3">
                        <label className="text-xs font-medium text-foreground flex items-center gap-2 flex-1">
                          <span>{rule.icon}</span>
                          <span>{rule.label}</span>
                        </label>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            value={pointsRules[rule.key as keyof typeof pointsRules]}
                            onChange={e => setPointsRules(prev => ({ ...prev, [rule.key]: parseInt(e.target.value) || 0 }))}
                            className="w-20 h-8 px-2 text-sm text-end border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                          />
                          <span className="text-xs text-muted-foreground w-8">
                            {rule.key === 'pointExpireDays' ? 'days' : rule.key === 'dailyMaxPoints' || rule.key === 'minRedemption' ? 'pts' : 'pts'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {referralData?.recentActivity?.length > 0 && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="font-bold text-foreground">Recent Referral Activity</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-start px-5 py-3 font-semibold text-foreground">Code</th>
                          <th className="text-start px-4 py-3 font-semibold text-foreground">Status</th>
                          <th className="text-start px-4 py-3 font-semibold text-foreground">Referrer Pts</th>
                          <th className="text-start px-4 py-3 font-semibold text-foreground">Referred Pts</th>
                          <th className="text-start px-4 py-3 font-semibold text-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(referralData.recentActivity as any[]).map((item: any) => (
                          <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-foreground">{item.referralCode}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                item.status === 'converted' ? 'bg-green-100 text-green-700'
                                : item.status === 'signed_up' ? 'bg-blue-100 text-blue-700'
                                : item.status === 'expired' ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-foreground">{item.referrerPointsEarned} pts</td>
                            <td className="px-4 py-3 text-sm font-semibold text-foreground">{item.referredPointsEarned} pts</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MODULES ── */}
          {activeTab === 'modules' && (
            <div className="space-y-5">
              {/* Demo Mode Toggle */}
              <div className={`rounded-2xl border-2 px-5 py-4 flex items-center justify-between gap-4 transition-colors ${isDemoMode ? 'bg-amber-50 border-amber-300' : 'bg-card border-border'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDemoMode ? 'bg-amber-100' : 'bg-secondary'}`}>
                    <Database className={`w-5 h-5 ${isDemoMode ? 'text-amber-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDemoMode ? 'text-amber-900' : 'text-foreground'}`}>
                      Demo Mode {isDemoMode ? '(Active)' : '(Inactive)'}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDemoMode ? 'text-amber-700' : 'text-muted-foreground'}`}>
                      {isDemoMode
                        ? 'Platform is using seed/demo data. Toggle off to switch to live production data.'
                        : 'Platform is connected to live production data. Toggle on to use demo data for testing.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleDemoMode(!isDemoMode)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 ${isDemoMode ? 'bg-amber-500' : 'bg-muted'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isDemoMode ? 'start-[34px]' : 'start-1'}`} />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Microservices Architecture</p>
                  <p className="text-xs text-amber-700 mt-1">Each module is an independent microservice. Disabling a module will affect all dependent services. Review dependencies before toggling. Changes take effect within 60 seconds.</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                  <Power className="w-4 h-4" /> {modules.filter(m => m.enabled).length} Active
                </div>
                <div className="flex items-center gap-2 bg-secondary text-muted-foreground px-3 py-1.5 rounded-full text-sm font-semibold">
                  {modules.filter(m => !m.enabled).length} Disabled
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map(module => {
                  const Icon = module.icon;
                  return (
                    <div key={module.id} className={`bg-card border rounded-2xl p-5 transition-all ${module.enabled ? 'border-border' : 'border-border/30 opacity-60'}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${module.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {/* Toggle */}
                        <button
                          onClick={() => toggleModule(module.id)}
                          className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${module.enabled ? 'bg-primary' : 'bg-muted'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${module.enabled ? 'start-[22px]' : 'start-0.5'}`} />
                        </button>
                      </div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{module.nameEn}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{module.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground/70">v{module.version}</span>
                        {module.dependencies.length > 0 && (
                          <span className="text-xs text-amber-600 font-medium">Requires: {module.dependencies.join(', ')}</span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${module.enabled ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
                          {module.enabled ? 'Running' : 'Stopped'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── REVIEW QUEUE ── */}
          {activeTab === 'review-queue' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Review Queue</h2>
                <span className="text-sm text-muted-foreground">{liveCampaigns.length} item{liveCampaigns.length !== 1 ? 's' : ''} pending</span>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-start">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="px-5 py-4 text-start font-bold">Campaign</th>
                      <th className="px-5 py-4 text-start font-bold">Merchant</th>
                      <th className="px-5 py-4 text-start font-bold">Type</th>
                      <th className="px-5 py-4 text-start font-bold">Submitted</th>
                      <th className="px-5 py-4 text-end font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {liveCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                          No campaigns pending review
                        </td>
                      </tr>
                    ) : liveCampaigns.map((campaign: any) => (
                      <tr key={campaign.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{campaign.titleEn ?? campaign.title ?? `Campaign #${campaign.id}`}</td>
                        <td className="px-5 py-4 text-muted-foreground">{campaign.restaurantNameEn ?? campaign.merchantName ?? '—'}</td>
                        <td className="px-5 py-4">
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{campaign.type ?? 'offer'}</span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">{campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="px-5 py-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => fetch(`/api/campaigns/${campaign.id}/status`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status: 'live' }) }).then(() => refetchCampaigns())}
                              className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold hover:bg-green-200 transition-colors"
                            >Approve</button>
                            <button
                              onClick={() => fetch(`/api/campaigns/${campaign.id}/status`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status: 'rejected' }) }).then(() => refetchCampaigns())}
                              className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                            >Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROMO CODES ── */}
          {activeTab === 'promo-codes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Promo Codes</h2>
                <Button onClick={() => {
                  const code = prompt('Enter promo code (e.g. SAVE20):');
                  if (!code) return;
                  const discountType = prompt('Discount type (percentage / fixed_amount):') ?? 'percentage';
                  const discountValue = prompt('Discount value (e.g. 20 for 20%):') ?? '20';
                  fetch('/api/promo-codes', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ code: code.toUpperCase(), discountType, discountValue: parseFloat(discountValue), isActive: true, usageLimit: 100, timesUsed: 0 })
                  }).then(() => refetchPromoCodes());
                }}><Plus className="w-4 h-4 me-2" /> Create Promo Code</Button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-start">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="px-5 py-4 text-start font-bold">Code</th>
                      <th className="px-5 py-4 text-start font-bold">Type</th>
                      <th className="px-5 py-4 text-start font-bold">Value</th>
                      <th className="px-5 py-4 text-start font-bold">Usage</th>
                      <th className="px-5 py-4 text-start font-bold">Status</th>
                      <th className="px-5 py-4 text-end font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {livePromoCodes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                          No promo codes found — create one above
                        </td>
                      </tr>
                    ) : livePromoCodes.map((promo: any) => (
                      <tr key={promo.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-foreground">{promo.code}</td>
                        <td className="px-5 py-4 text-muted-foreground capitalize">{promo.discountType?.replace('_', ' ')}</td>
                        <td className="px-5 py-4 font-semibold text-foreground">
                          {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `SAR ${promo.discountValue}`}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{promo.timesUsed ?? 0} / {promo.usageLimit ?? '∞'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <button
                            onClick={() => fetch(`/api/promo-codes/${promo.id}`, {
                              method: 'PATCH',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({ isActive: !promo.isActive })
                            }).then(() => refetchPromoCodes())}
                            className="text-xs bg-secondary text-foreground px-3 py-1 rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                          >{promo.isActive ? 'Deactivate' : 'Activate'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SETTLEMENT ── */}
          {activeTab === 'settlement' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Settlement</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm text-muted-foreground mb-1">Pending Transactions</p>
                  <p className="text-3xl font-bold">{settlementSummary?.totals?.count ?? 0}</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm text-muted-foreground mb-1">Pending Gross Amount</p>
                  <p className="text-3xl font-bold">SAR {parseFloat(settlementSummary?.totals?.grossAmount ?? '0').toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm text-muted-foreground mb-1">Net Payout (to merchants)</p>
                  <p className="text-3xl font-bold">SAR {parseFloat(settlementSummary?.totals?.netAmount ?? '0').toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Pending Transactions</h3>
                <Button onClick={() => { alert('Settlement batch creation requires backend batch processing support.'); }}>Create Settlement Batch</Button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-start">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="px-5 py-4 text-start font-bold">Ref</th>
                      <th className="px-5 py-4 text-start font-bold">Restaurant</th>
                      <th className="px-5 py-4 text-start font-bold">Gross</th>
                      <th className="px-5 py-4 text-start font-bold">Commission</th>
                      <th className="px-5 py-4 text-start font-bold">Net</th>
                      <th className="px-5 py-4 text-start font-bold">Due</th>
                      <th className="px-5 py-4 text-start font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(settlementSummary?.transactions ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                          No pending transactions to settle
                        </td>
                      </tr>
                    ) : (settlementSummary?.transactions ?? []).map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{tx.refCode ?? `#${tx.id}`}</td>
                        <td className="px-5 py-4 text-foreground">{tx.restaurantNameEn ?? '—'}</td>
                        <td className="px-5 py-4 font-semibold">SAR {parseFloat(tx.grossAmount ?? '0').toFixed(2)}</td>
                        <td className="px-5 py-4 text-red-600">-SAR {parseFloat(tx.commissionAmount ?? '0').toFixed(2)}</td>
                        <td className="px-5 py-4 text-green-600 font-semibold">SAR {parseFloat(tx.netAmount ?? '0').toFixed(2)}</td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">{tx.settlementDueDate ? new Date(tx.settlementDueDate).toLocaleDateString() : '—'}</td>
                        <td className="px-5 py-4">
                          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── EXPERIENCES: PROVIDER APPLICATIONS ── */}
          {activeTab === 'exp-providers' && (
            <div className="space-y-5">
              {/* Provider Detail Panel */}
              {selectedProvider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> Provider Application
                      </h3>
                      <button onClick={() => setSelectedProvider(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-3 text-sm mb-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-xs text-muted-foreground mb-0.5">Business Name</p><p className="font-semibold text-foreground">{selectedProvider.businessNameEn}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-0.5">Arabic Name</p><p className="font-semibold text-foreground">{selectedProvider.businessNameAr || '—'}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-0.5">Contact</p><p className="font-semibold text-foreground">{selectedProvider.contactName}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-0.5">Email</p><p className="font-semibold text-foreground truncate">{selectedProvider.contactEmail}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-0.5">Phone</p><p className="font-semibold text-foreground">{selectedProvider.contactPhone || '—'}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-0.5">City</p><p className="font-semibold text-foreground">{selectedProvider.city || '—'}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-0.5">Category</p><p className="font-semibold text-foreground capitalize">{selectedProvider.categoryType || '—'}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-0.5">CR Number</p><p className="font-semibold text-foreground">{selectedProvider.crNumber || '—'}</p></div>
                      </div>
                      {selectedProvider.description && (
                        <div><p className="text-xs text-muted-foreground mb-0.5">Description</p><p className="text-sm text-foreground">{selectedProvider.description}</p></div>
                      )}
                      <div><p className="text-xs text-muted-foreground mb-0.5">Submitted</p><p className="font-semibold text-foreground">{new Date(selectedProvider.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
                    </div>

                    {selectedProvider.status === 'pending' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Admin Note (optional)</label>
                          <textarea
                            rows={3}
                            placeholder="Reason for decision..."
                            value={providerActionState !== null && providerActionState.id === selectedProvider.id ? providerActionState.note : ''}
                            onChange={e => setProviderActionState(s => s ? { ...s, note: e.target.value } : { id: selectedProvider.id, action: 'approve', note: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveProviderMutation.mutate({ id: selectedProvider.id, status: 'rejected', adminNote: providerActionState?.note })}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => approveProviderMutation.mutate({ id: selectedProvider.id, status: 'approved', adminNote: providerActionState?.note })}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
                            <BadgeCheck className="w-4 h-4" /> Approve
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedProvider.status !== 'pending' && (
                      <div className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${selectedProvider.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {selectedProvider.status === 'approved' ? <BadgeCheck className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        Application {selectedProvider.status}
                        {selectedProvider.adminNote && <span className="font-normal text-xs ms-1">— {selectedProvider.adminNote}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                  <button
                    key={f}
                    onClick={() => setExpProviderFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${expProviderFilter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Provider Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        {['Business Name', 'Contact', 'City', 'Submitted', 'Status', ''].map(h => (
                          <th key={h} className="text-start px-5 py-3.5 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!(expProvidersData?.providers as any[])?.length ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No provider applications</p>
                            <p className="text-xs mt-1">Providers submit applications through the partner portal</p>
                          </td>
                        </tr>
                      ) : (
                        (expProvidersData.providers as any[]).map((p: any) => (
                          <tr key={p.id} className={`hover:bg-secondary/30 transition-colors cursor-pointer ${p.status === 'pending' ? 'bg-amber-50/30' : ''}`} onClick={() => setSelectedProvider(p)}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                  <MapPin className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{p.businessNameEn}</p>
                                  {p.refCode && <p className="text-xs font-mono text-muted-foreground">{p.refCode}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-foreground">{p.contactName}</p>
                              <p className="text-xs text-muted-foreground">{p.contactEmail}</p>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">{p.city || '—'}</td>
                            <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-4">
                              {p.status === 'pending' && <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Pending</span>}
                              {p.status === 'approved' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full"><BadgeCheck className="w-3 h-3" /> Approved</span>}
                              {p.status === 'rejected' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Rejected</span>}
                            </td>
                            <td className="px-5 py-4">
                              <button onClick={e => { e.stopPropagation(); setSelectedProvider(p); }}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Eye className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── EXPERIENCES: LISTINGS ── */}
          {activeTab === 'exp-listings' && (
            <div className="space-y-5">
              {/* Action modal */}
              {expActionState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {expActionState.action === 'active' && <BadgeCheck className="w-5 h-5 text-green-600" />}
                      {expActionState.action === 'suspended' && <Ban className="w-5 h-5 text-amber-600" />}
                      {expActionState.action === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                      <h3 className="font-bold text-foreground capitalize">
                        {expActionState.action === 'active' ? 'Approve Experience' : expActionState.action === 'suspended' ? 'Suspend Experience' : 'Reject Experience'}
                      </h3>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Admin Note (optional)</label>
                      <textarea
                        value={expActionState.note}
                        onChange={e => setExpActionState(s => s ? { ...s, note: e.target.value } : s)}
                        rows={3}
                        placeholder="Reason or instructions..."
                        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setExpActionState(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
                      <button
                        onClick={() => updateExpStatusMutation.mutate({ id: expActionState.id, status: expActionState.action, adminNote: expActionState.note || undefined })}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${expActionState.action === 'active' ? 'bg-green-600 hover:bg-green-700' : expActionState.action === 'suspended' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                {['all', 'pending_approval', 'active', 'suspended', 'rejected'].map(f => (
                  <button
                    key={f}
                    onClick={() => setExpListingFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${expListingFilter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Listings Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        {['Title', 'Provider', 'Category', 'Price', 'Submitted', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!(expListingsData?.experiences as any[])?.length ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-muted-foreground">
                            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No experiences yet</p>
                            <p className="text-xs mt-1">Approved providers will submit experiences for review</p>
                          </td>
                        </tr>
                      ) : (
                        (expListingsData.experiences as any[]).map((exp: any) => (
                          <tr key={exp.id} className={`hover:bg-secondary/30 transition-colors ${exp.status === 'pending_approval' ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                  <MapPin className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground truncate max-w-[160px]">{exp.titleEn}</p>
                                  {exp.refCode && <p className="text-xs font-mono text-muted-foreground">{exp.refCode}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-foreground">{exp.providerName || `#${exp.providerId}`}</td>
                            <td className="px-4 py-4 text-xs text-muted-foreground capitalize">{exp.categoryType || '—'}</td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-foreground">
                                {exp.pricePerPerson ? `SAR ${Number(exp.pricePerPerson).toFixed(0)}` : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(exp.submittedAt || exp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-4">
                              {exp.status === 'pending_approval' && <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Pending</span>}
                              {exp.status === 'active' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full"><BadgeCheck className="w-3 h-3" /> Active</span>}
                              {exp.status === 'suspended' && <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full"><Ban className="w-3 h-3" /> Suspended</span>}
                              {exp.status === 'rejected' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Rejected</span>}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                {exp.status !== 'active' && (
                                  <button
                                    onClick={() => setExpActionState({ id: exp.id, action: 'active', note: '' })}
                                    className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title="Approve">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {exp.status !== 'suspended' && exp.status !== 'rejected' && (
                                  <button
                                    onClick={() => setExpActionState({ id: exp.id, action: 'suspended', note: '' })}
                                    className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors" title="Suspend">
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {exp.status !== 'rejected' && (
                                  <button
                                    onClick={() => setExpActionState({ id: exp.id, action: 'rejected', note: '' })}
                                    className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Reject">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── EXPERIENCES: BOOKINGS ── */}
          {activeTab === 'exp-bookings' && (
            <div className="space-y-5">
              {/* Cancel modal */}
              {expCancelState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <h3 className="font-bold text-foreground">Cancel Booking</h3>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Cancellation Reason *</label>
                      <textarea
                        value={expCancelState.reason}
                        onChange={e => setExpCancelState(s => s ? { ...s, reason: e.target.value } : s)}
                        rows={3}
                        placeholder="Explain the reason for cancellation..."
                        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setExpCancelState(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Back</button>
                      <button
                        onClick={() => cancelExpBookingMutation.mutate({ id: expCancelState.id, cancelReason: expCancelState.reason })}
                        disabled={!expCancelState.reason}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                        Cancel Booking
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {['all', 'confirmed', 'cancelled'].map(f => (
                    <button
                      key={f}
                      onClick={() => setExpBookingFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${expBookingFilter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ms-auto">
                  <input
                    type="date"
                    value={expDateFrom}
                    onChange={e => setExpDateFrom(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="From"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={expDateTo}
                    onChange={e => setExpDateTo(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Bookings Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        {['Ref Code', 'Guest', 'Experience', 'Provider', 'Date', 'Guests', 'Status', 'Amount', ''].map(h => (
                          <th key={h} className="text-start px-4 py-3.5 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!(expBookingsData?.bookings as any[])?.length ? (
                        <tr>
                          <td colSpan={9} className="py-16 text-center text-muted-foreground">
                            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No experience bookings yet</p>
                            <p className="text-xs mt-1">Bookings will appear here once guests start booking experiences</p>
                          </td>
                        </tr>
                      ) : (
                        (expBookingsData.bookings as any[]).map((b: any) => (
                          <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{b.refCode || `#${b.id}`}</td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-foreground">{b.guestNameEn || '—'}</p>
                              <p className="text-xs text-muted-foreground">{b.guestEmail || ''}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-foreground truncate max-w-[120px]">{b.experienceTitleEn || `#${b.experienceId}`}</td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">{b.providerName || `#${b.providerId}`}</td>
                            <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                              {b.scheduledDate || '—'} {b.scheduledTime ? `@ ${b.scheduledTime}` : ''}
                            </td>
                            <td className="px-4 py-4 text-sm text-center text-foreground">{b.guestCount}</td>
                            <td className="px-4 py-4">
                              {b.status === 'confirmed' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>}
                              {b.status === 'cancelled' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Cancelled</span>}
                              {!['confirmed', 'cancelled'].includes(b.status) && <span className="text-xs text-muted-foreground capitalize">{b.status}</span>}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-foreground">{b.totalAmount ? `SAR ${Number(b.totalAmount).toFixed(0)}` : '—'}</span>
                            </td>
                            <td className="px-4 py-4">
                              {b.status !== 'cancelled' && (
                                <button
                                  onClick={() => setExpCancelState({ id: b.id, reason: '' })}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Cancel Booking">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── EXPERIENCES: SETTINGS ── */}
          {activeTab === 'exp-settings' && (
            <div className="space-y-5 max-w-2xl">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">Experiences Module Settings</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure global defaults for the experiences module</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={saveExpSettings}
                    disabled={expSettingsSaving || !expSettings}
                    className="gap-2">
                    {expSettingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Settings
                  </Button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Module Toggle */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Module Enabled</p>
                      <p className="text-xs text-muted-foreground mt-0.5">When disabled, the experiences section is hidden from consumers and providers</p>
                    </div>
                    <button
                      onClick={() => setExpSettings((s: any) => s ? { ...s, moduleEnabled: !s.moduleEnabled } : s)}
                      className={`relative rounded-full transition-all duration-300 ${expSettings?.moduleEnabled ? 'bg-primary' : 'bg-muted'}`}
                      style={{ width: 44, height: 24 }}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${expSettings?.moduleEnabled ? 'start-[22px]' : 'start-0.5'}`} />
                    </button>
                  </div>

                  <div className="border-t border-border" />

                  {/* Commission Rate */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Default Commission Rate</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Applied to all experiences unless overridden per listing</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={expSettings?.defaultCommissionPercent ?? '15'}
                        onChange={e => setExpSettings((s: any) => s ? { ...s, defaultCommissionPercent: e.target.value } : s)}
                        className="w-20 h-10 px-3 text-end rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                      <span className="text-sm text-muted-foreground flex items-center gap-0.5"><Percent className="w-3.5 h-3.5" /></span>
                    </div>
                  </div>

                  {/* Minimum Deposit */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Default Deposit Percentage</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Percentage of total price collected at booking (100% = full payment)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="100"
                        value={expSettings?.defaultDepositPercent ?? '100'}
                        onChange={e => setExpSettings((s: any) => s ? { ...s, defaultDepositPercent: e.target.value } : s)}
                        className="w-20 h-10 px-3 text-end rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                      <span className="text-sm text-muted-foreground flex items-center gap-0.5"><Percent className="w-3.5 h-3.5" /></span>
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Refund Policy */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">Refund Policy (English)</p>
                    <textarea
                      rows={4}
                      value={expSettings?.refundPolicyEn ?? ''}
                      onChange={e => setExpSettings((s: any) => s ? { ...s, refundPolicyEn: e.target.value } : s)}
                      placeholder="Enter the refund policy displayed to consumers in English..."
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">Refund Policy (Arabic)</p>
                    <textarea
                      rows={4}
                      dir="rtl"
                      value={expSettings?.refundPolicyAr ?? ''}
                      onChange={e => setExpSettings((s: any) => s ? { ...s, refundPolicyAr: e.target.value } : s)}
                      placeholder="أدخل سياسة الاسترداد بالعربية..."
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
