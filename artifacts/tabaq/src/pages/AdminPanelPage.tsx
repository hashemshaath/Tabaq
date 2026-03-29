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
  MapPin, Clock, LogOut, Database, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Mock Data ──────────────────────────────────────────────────
const OVERVIEW_STATS = [
  { label: 'Total Restaurants', val: '547', change: '+12', up: true, icon: Utensils, color: 'bg-blue-50 text-blue-600' },
  { label: 'Total Users', val: '42,891', change: '+1.2K', up: true, icon: Users, color: 'bg-purple-50 text-purple-600' },
  { label: 'Bookings This Month', val: '11,342', change: '+8%', up: true, icon: CalendarDays, color: 'bg-primary/10 text-primary' },
  { label: 'Pending Approvals', val: '23', change: '-5', up: false, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
  { label: 'Platform Revenue', val: 'SAR 198K', change: '+15%', up: true, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
  { label: 'Avg. Platform Rating', val: '4.65', change: '+0.1', up: true, icon: Star, color: 'bg-amber-50 text-amber-600' },
];

const PENDING_RESTAURANTS = [
  { id: 101, name: 'Al Romansiah Riyadh', nameAr: 'الرومنسية', category: 'Saudi Cuisine', city: 'Riyadh', appliedAt: '2 hours ago', owner: 'Fahad Al-Otaibi', phone: '+966 55 123 4567' },
  { id: 102, name: 'Fuego Steakhouse', nameAr: 'فيوجو ستيك', category: 'Steakhouse', city: 'Jeddah', appliedAt: '5 hours ago', owner: 'Abdulaziz Mahjoub', phone: '+966 56 789 0123' },
  { id: 103, name: 'Tokyo Garden', nameAr: 'حديقة طوكيو', category: 'Japanese', city: 'Riyadh', appliedAt: '1 day ago', owner: 'Omar Al-Zahrani', phone: '+966 54 321 6789' },
  { id: 104, name: 'The Greenhouse', nameAr: 'البيت الزجاجي', category: 'Vegetarian', city: 'NEOM', appliedAt: '2 days ago', owner: 'Nour Al-Faisal', phone: '+966 50 987 6543' },
];

const ALL_RESTAURANTS = [
  { id: 1, name: 'Najd Village', city: 'Riyadh', status: 'active', rating: 4.8, bookings: 342, tier: 'Professional', verified: true },
  { id: 2, name: 'Reem Al Bawadi', city: 'Riyadh', status: 'active', rating: 4.5, bookings: 218, tier: 'Professional', verified: true },
  { id: 3, name: 'Sushi Sama', city: 'Riyadh', status: 'active', rating: 4.9, bookings: 156, tier: 'Starter', verified: false },
  { id: 4, name: 'Burger & Lobster', city: 'Jeddah', status: 'suspended', rating: 3.2, bookings: 45, tier: 'Starter', verified: false },
  { id: 5, name: 'Hakkasan', city: 'Riyadh', status: 'active', rating: 4.7, bookings: 289, tier: 'Enterprise', verified: true },
];

const RECENT_REVIEWS = [
  { id: 1, user: 'Ahmed K.', restaurant: 'Najd Village', rating: 5, text: 'Amazing food and ambiance.', status: 'approved', date: '1 hour ago' },
  { id: 2, user: 'Noura F.', restaurant: 'Sushi Sama', rating: 2, text: 'Service was terrible. Never going back.', status: 'flagged', date: '3 hours ago' },
  { id: 3, user: 'James T.', restaurant: 'Reem Al Bawadi', rating: 5, text: 'Best restaurant in Riyadh!', status: 'approved', date: '5 hours ago' },
  { id: 4, user: 'Sara M.', restaurant: 'Hakkasan', rating: 1, text: 'Spam review content.', status: 'removed', date: '1 day ago' },
];

const BLOG_POSTS = [
  { id: 1, title: 'Top 10 Fine Dining Restaurants in Riyadh 2026', status: 'published', views: 12450, date: '2026-03-25' },
  { id: 2, title: 'The Rise of Plant-Based Dining in Saudi Arabia', status: 'draft', views: 0, date: '2026-03-28' },
  { id: 3, title: 'Ramadan Dining Guide: Best Iftar Experiences', status: 'published', views: 8920, date: '2026-03-15' },
  { id: 4, title: 'Interview: Chef Mohammed Al-Harbi on Saudi Cuisine', status: 'scheduled', views: 0, date: '2026-04-01' },
];

const SEO_PAGES = [
  { path: '/', title: 'Tabaq | طبق — Discover Saudi Arabia\'s Best Restaurants', score: 94 },
  { path: '/restaurants', title: 'Explore Restaurants in Saudi Arabia | Tabaq', score: 89 },
  { path: '/collections', title: 'Restaurant Collections & Curated Lists | Tabaq', score: 82 },
  { path: '/collections/top-rated', title: 'Top Rated Restaurants in Saudi Arabia | Tabaq', score: 91 },
];

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
type AdminTab = 'overview' | 'restaurants' | 'registrations' | 'users' | 'bookings' | 'reviews' | 'blog' | 'seo' | 'modules' | 'settings';

// ─── Component ──────────────────────────────────────────────────
export function AdminPanelPage() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantStatusFilter, setRestaurantStatusFilter] = useState('all');

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

  const { data: realStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch(`${apiBase.replace('/','')}/api/admin/stats`.replace(/^\//, '/'), { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
  });

  const { data: realModules } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const res = await fetch(`${apiBase.replace('/','')}/api/admin/modules`.replace(/^\//, '/'), { credentials: 'include' });
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
      const res = await fetch(`${apiBase.replace('/','')}/api/admin/modules/${moduleId}`.replace(/^\//, '/'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
        credentials: 'include',
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

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registrations', label: 'Registrations', icon: Plus, badge: PENDING_RESTAURANTS.length },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: 1 },
    { id: 'blog', label: 'Blog & Content', icon: BookOpen },
    { id: 'seo', label: 'SEO Manager', icon: Globe },
    { id: 'modules', label: 'Modules', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
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
          <h1 className="text-lg font-bold text-foreground capitalize">{navItems.find(n => n.id === activeTab)?.label}</h1>
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
                {(displayStats ? [
                  { label: 'Total Restaurants', val: displayStats.totalRestaurants.toLocaleString(), change: 'Live data', up: true, icon: Utensils, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Total Users', val: displayStats.totalUsers.toLocaleString(), change: 'Live data', up: true, icon: Users, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Total Bookings', val: displayStats.totalBookings.toLocaleString(), change: 'Live data', up: true, icon: CalendarDays, color: 'bg-primary/10 text-primary' },
                  { label: 'Total Reviews', val: displayStats.totalReviews.toLocaleString(), change: 'Live data', up: true, icon: Star, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Active Offers', val: displayStats.activeOffers.toLocaleString(), change: 'Live data', up: true, icon: Tag, color: 'bg-green-50 text-green-600' },
                  { label: 'Avg. Platform Rating', val: Number(displayStats.avgPlatformRating) > 0 ? Number(displayStats.avgPlatformRating).toFixed(2) : 'N/A', change: 'Live data', up: true, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
                ] : OVERVIEW_STATS).map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-extrabold text-foreground">{stat.val}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                        <ArrowUpRight className={`w-3 h-3 ${!stat.up ? 'rotate-180' : ''}`} />
                        {stat.change}{stat.change === 'Live data' ? '' : ' this month'}
                      </div>
                    </div>
                  );
                })}
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
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{PENDING_RESTAURANTS.length}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {PENDING_RESTAURANTS.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Utensils className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.city} · {r.appliedAt}</p>
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
                    <h2 className="font-bold text-foreground">Flagged Reviews</h2>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">1</span>
                  </div>
                  <div className="divide-y divide-border">
                    {RECENT_REVIEWS.filter(r => r.status === 'flagged').map(review => (
                      <div key={review.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="font-semibold text-sm text-foreground">{review.user}</span>
                            <span className="text-xs text-muted-foreground ms-2">on {review.restaurant}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">"{review.text}"</p>
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
                <p className="text-muted-foreground text-sm">{PENDING_RESTAURANTS.length} applications awaiting review</p>
                <div className="flex gap-2">
                  <button className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold">Approve All</button>
                </div>
              </div>
              <div className="space-y-4">
                {PENDING_RESTAURANTS.map(r => (
                  <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                          <Utensils className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{r.name}</h3>
                          <p className="text-sm text-muted-foreground">{r.nameAr} · {r.category}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.appliedAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-sm font-semibold text-foreground">{r.owner}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold mt-2">
                          <AlertCircle className="w-3 h-3" /> Pending Review
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <button className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button className="flex items-center gap-1.5 bg-secondary text-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors">
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      <button className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-200 transition-colors ms-auto">
                        <MessageSquare className="w-4 h-4" /> Contact Owner
                      </button>
                    </div>
                  </div>
                ))}
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
                    {ALL_RESTAURANTS.filter(r => restaurantStatusFilter === 'all' || r.status === restaurantStatusFilter).map(r => (
                      <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Utensils className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{r.name}</p>
                              {r.verified && <span className="text-xs text-primary flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{r.city}</td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1 text-sm font-bold"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{r.rating}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground font-medium">{r.bookings}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.tier === 'Enterprise' ? 'bg-purple-100 text-purple-700' : r.tier === 'Professional' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>{r.tier}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {r.status}
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
                  { label: 'Total Users', val: '42,891', icon: Users, color: 'bg-primary/10 text-primary' },
                  { label: 'Active This Month', val: '18,432', icon: Activity, color: 'bg-green-50 text-green-600' },
                  { label: 'New This Week', val: '1,247', icon: ArrowUpRight, color: 'bg-blue-50 text-blue-600' },
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
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Bookings</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Reviews</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-start py-2 text-xs font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: 'Ahmed Al-Rashidi', email: 'ahmed@example.com', joined: '2025-12-01', bookings: 24, reviews: 12, status: 'active', role: 'Diner' },
                      { name: 'Noura Al-Faisal', email: 'noura@example.com', joined: '2025-11-15', bookings: 8, reviews: 5, status: 'active', role: 'Diner' },
                      { name: 'Fahad Al-Otaibi', email: 'fahad@restaurant.com', joined: '2025-10-08', bookings: 1, reviews: 0, status: 'active', role: 'Business Owner' },
                      { name: 'James Thompson', email: 'james@example.com', joined: '2026-01-22', bookings: 3, reviews: 2, status: 'banned', role: 'Diner' },
                    ].map((user, idx) => (
                      <tr key={idx} className="hover:bg-secondary/20">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">{user.name[0]}</div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{user.joined}</td>
                        <td className="py-3 text-sm font-medium text-foreground">{user.bookings}</td>
                        <td className="py-3 text-sm font-medium text-foreground">{user.reviews}</td>
                        <td className="py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground text-xs">View</button>
                            <button className={`p-1.5 rounded text-xs ${user.status === 'banned' ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-600'}`}>{user.status === 'banned' ? 'Unban' : 'Ban'}</button>
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
                  { label: 'Today', val: '347', color: 'text-primary' },
                  { label: 'This Week', val: '2,891', color: 'text-blue-600' },
                  { label: 'This Month', val: '11,342', color: 'text-green-600' },
                  { label: 'Cancellation Rate', val: '4.2%', color: 'text-amber-600' },
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
                    {[
                      { ref: 'TBQ-A1B2C3', diner: 'Ahmed K.', restaurant: 'Najd Village', date: 'Mar 29, 7:30 PM', guests: 4, status: 'confirmed' },
                      { ref: 'TBQ-D4E5F6', diner: 'Sarah M.', restaurant: 'Sushi Sama', date: 'Mar 29, 8:00 PM', guests: 2, status: 'confirmed' },
                      { ref: 'TBQ-G7H8I9', diner: 'Mohammed A.', restaurant: 'Hakkasan', date: 'Mar 30, 1:00 PM', guests: 6, status: 'pending' },
                      { ref: 'TBQ-J0K1L2', diner: 'Noura F.', restaurant: 'Reem Al Bawadi', date: 'Mar 28, 7:00 PM', guests: 3, status: 'cancelled' },
                    ].map(b => (
                      <tr key={b.ref} className="hover:bg-secondary/20">
                        <td className="py-3 font-mono text-xs text-muted-foreground">{b.ref}</td>
                        <td className="py-3 font-medium text-foreground">{b.diner}</td>
                        <td className="py-3 text-muted-foreground">{b.restaurant}</td>
                        <td className="py-3 text-muted-foreground">{b.date}</td>
                        <td className="py-3 text-muted-foreground">{b.guests}</td>
                        <td className="py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span>
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
              {RECENT_REVIEWS.map(review => (
                <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm">{review.user[0]}</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.user}</p>
                        <p className="text-xs text-muted-foreground">on {review.restaurant} · {review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />)}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${review.status === 'approved' ? 'bg-green-100 text-green-700' : review.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{review.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">"{review.text}"</p>
                  <div className="flex gap-2">
                    {review.status !== 'approved' && <button className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200">Approve</button>}
                    {review.status !== 'removed' && <button className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-200">Remove</button>}
                    <button className="text-xs bg-secondary text-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-secondary/80">View Context</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BLOG ── */}
          {activeTab === 'blog' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {['All', 'Published', 'Draft', 'Scheduled'].map(f => (
                    <button key={f} className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all ${f === 'All' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{f}</button>
                  ))}
                </div>
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" /> New Post
                </button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      {['Title', 'Status', 'Views', 'Date', 'Actions'].map(h => (
                        <th key={h} className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {BLOG_POSTS.map(post => (
                      <tr key={post.id} className="hover:bg-secondary/20">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-teal-600" />
                            </div>
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{post.title}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-700' : post.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{post.status}</span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-foreground">{post.views > 0 ? post.views.toLocaleString() : '—'}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{post.date}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Edit className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SEO ── */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Avg. SEO Score', val: '89/100', icon: Globe, color: 'bg-green-50 text-green-600' },
                  { label: 'Indexed Pages', val: '1,247', icon: Database, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Search Impressions/mo', val: '84K', icon: Eye, color: 'bg-purple-50 text-purple-600' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><Icon className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xl font-extrabold text-foreground">{s.val}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Page SEO Status</h3>
                  <button className="text-sm text-primary font-semibold hover:underline">Regenerate Sitemap</button>
                </div>
                <div className="divide-y divide-border">
                  {SEO_PAGES.map(page => (
                    <div key={page.path} className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-primary mb-0.5">{page.path}</p>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{page.title}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${page.score}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${page.score >= 90 ? 'text-green-600' : page.score >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{page.score}</span>
                        </div>
                        <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Edit className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-4">Global Meta Settings</h3>
                <div className="space-y-4 max-w-2xl">
                  {[
                    { label: 'Site Title Template', value: '%page_title% | Tabaq — Saudi Arabia\'s Best Dining Platform', type: 'text' },
                    { label: 'Default Meta Description', value: 'Discover, book, and review the finest restaurants in Saudi Arabia. Tabaq connects diners with top restaurants across Riyadh, Jeddah, and the GCC.', type: 'textarea' },
                    { label: 'Canonical Domain', value: 'https://tabaq.sa', type: 'text' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea defaultValue={field.value} className="w-full h-20 px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      ) : (
                        <input type="text" defaultValue={field.value} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      )}
                    </div>
                  ))}
                  <Button className="mt-2">Save SEO Settings</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── MODULES ── */}
          {activeTab === 'modules' && (
            <div className="space-y-5">
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

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {[
                {
                  section: 'General',
                  fields: [
                    { label: 'Platform Name', value: 'Tabaq | طبق', type: 'text' },
                    { label: 'Support Email', value: 'support@tabaq.sa', type: 'email' },
                    { label: 'Default Country', value: 'Saudi Arabia', type: 'text' },
                    { label: 'Default Currency', value: 'SAR', type: 'text' },
                  ]
                },
                {
                  section: 'Commission & Billing',
                  fields: [
                    { label: 'Starter Plan Price (SAR/month)', value: '0', type: 'number' },
                    { label: 'Professional Plan Price (SAR/month)', value: '499', type: 'number' },
                    { label: 'Enterprise Plan Price (custom)', value: 'Custom quote', type: 'text' },
                  ]
                },
              ].map(section => (
                <div key={section.section} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-secondary/30">
                    <h3 className="font-bold text-foreground">{section.section} Settings</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {section.fields.map(field => (
                      <div key={field.label} className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-foreground">{field.label}</label>
                        <input type={field.type} defaultValue={field.value} className="h-10 px-3 rounded-xl border border-input bg-background text-sm w-48 text-end focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 border-t border-border">
                    <Button size="sm">Save {section.section} Settings</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
