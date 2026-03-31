import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/hooks/use-language";
import { getAuthHeaders } from "@/lib/api";
import {
  User, ShieldCheck, MapPin, Calendar, Star, Users, Globe,
  Heart, Bookmark, MessageCircle, Share2, Copy, Check, Lock,
  UserPlus, UserMinus, Clock, AtSign, Flame, Instagram,
  ExternalLink, Settings, LogOut, ChefHat, BarChart3, ArrowUpRight,
  Sparkles, Zap, Eye, Edit, AlertCircle, CheckCircle2, X,
  BadgeCheck, Play, Camera, TrendingUp, Award, Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";

// ── Types ──────────────────────────────────────────────────────────────────────
type AccountType = "basic" | "professional" | "chef";
type FollowStatus = "none" | "following" | "pending";
type ProfileTab = "overview" | "reviews" | "visits" | "favorites" | "dishes" | "plans" | "lists" | "dashboard";

interface ProfileUser {
  id: number;
  nameEn: string | null;
  nameAr: string | null;
  username: string | null;
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
  bio: string | null;
  location: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  points: number;
  level: number;
  levelTitle: string;
  instagramUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  websiteUrl: string | null;
  accountType: AccountType;
  createdAt: string;
}

// ── Configs ────────────────────────────────────────────────────────────────────
const ACCOUNT_CFG: Record<AccountType, { en: string; ar: string; color: string; bg: string; Icon: React.ElementType }> = {
  basic:        { en: "Basic User",    ar: "مستخدم عادي", color: "text-gray-600",  bg: "bg-gray-100",  Icon: User },
  professional: { en: "Professional",  ar: "محترف",       color: "text-blue-700",  bg: "bg-blue-100",  Icon: BadgeCheck },
  chef:         { en: "Chef",          ar: "شيف",         color: "text-amber-700", bg: "bg-amber-100", Icon: ChefHat },
};

function levelRing(level: number) {
  if (level >= 10) return "ring-4 ring-amber-400";
  if (level >= 7)  return "ring-4 ring-violet-400";
  if (level >= 4)  return "ring-4 ring-blue-400";
  return "ring-2 ring-border";
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Share modal ────────────────────────────────────────────────────────────────
function ShareModal({ username, name, onClose }: { username: string; name: string; onClose: () => void }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/${username}`;
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 end-4 p-2 rounded-full hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        <div className="text-center">
          <p className="font-bold text-lg">{t("Share Profile", "مشاركة الملف الشخصي")}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{name}</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
          <p className="flex-1 text-sm font-mono text-muted-foreground truncate">{url}</p>
          <button onClick={copy} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90"}`}>
            {copied ? <><Check className="w-3 h-3" /> {t("Copied!", "تم!")}</> : <><Copy className="w-3 h-3" /> {t("Copy", "نسخ")}</>}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${name}'s profile: ${url}`)}`, cls: "bg-green-500" },
            { label: "X / Twitter", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, cls: "bg-black" },
            { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}`, cls: "bg-blue-500" },
          ].map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
              className={`${s.cls} text-white rounded-xl py-2.5 text-xs font-semibold text-center hover:opacity-90 transition-opacity`}>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Upgrade modal ──────────────────────────────────────────────────────────────
function UpgradeModal({ current, onUpgrade, onClose }: { current: AccountType; onUpgrade: (t: AccountType) => void; onClose: () => void }) {
  const { t } = useLanguage();
  const next: AccountType = current === "basic" ? "professional" : "chef";
  const cfg = ACCOUNT_CFG[next];
  const benefits = next === "professional"
    ? ["Professional badge on your profile", "Dish portfolio tab", "Analytics dashboard", "Priority in search results"]
    : ["Chef badge with golden ring", "Full kitchen dashboard", "Order request management", "Featured chef placement"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-card rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 end-4 p-2 rounded-full hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        <div className="text-center space-y-2">
          <div className={`w-14 h-14 ${cfg.bg} rounded-2xl flex items-center justify-center mx-auto`}>
            <cfg.Icon className={`w-7 h-7 ${cfg.color}`} />
          </div>
          <h2 className="text-xl font-bold">{t(`Upgrade to ${cfg.en}`, `ترقية إلى ${cfg.ar}`)}</h2>
        </div>
        <ul className="space-y-2">
          {benefits.map(b => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>{t("Later", "لاحقاً")}</Button>
          <Button className="flex-1" onClick={() => onUpgrade(next)}>{t("Upgrade Now", "ترقية الآن")}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────────
function StatPill({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center py-3 px-4 hover:bg-secondary/60 rounded-xl transition-colors">
      <span className="text-xl font-bold">{fmtNum(value)}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </button>
  );
}

// ── Review card ────────────────────────────────────────────────────────────────
function ReviewItem({ r, lang }: { r: any; lang: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
          {r.restaurantImage && <img src={r.restaurantImage} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{lang === "ar" ? r.restaurantNameAr : r.restaurantNameEn}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < r.ratingOverall ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            ))}
            <span className="text-xs text-muted-foreground ms-1">
              {new Date(r.visitDate || r.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        {r.likeCount > 0 && <span className="ms-auto flex items-center gap-1 text-xs text-muted-foreground shrink-0"><Heart className="w-3 h-3" />{r.likeCount}</span>}
      </div>
      {(r.textEn || r.text) && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{lang === "ar" ? (r.textAr || r.textEn || r.text) : (r.textEn || r.text)}</p>}
    </div>
  );
}

// ── Visit card ─────────────────────────────────────────────────────────────────
function VisitItem({ v, lang }: { v: any; lang: string }) {
  return (
    <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary shrink-0">
        {v.restaurantCoverImageUrl && <img src={v.restaurantCoverImageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{lang === "ar" ? v.restaurantNameAr : v.restaurantNameEn}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{v.date}</span>
          {v.partySize && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{v.partySize}</span>}
        </div>
      </div>
      <Link href={`/restaurants/${v.restaurantId}`}>
        <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </span>
      </Link>
    </div>
  );
}

// ── Pro dashboard ──────────────────────────────────────────────────────────────
function ProDashboard({ user, t }: { user: ProfileUser; t: (en: string, ar: string) => string }) {
  const statCards = [
    { Icon: Eye,    label: t("Profile Views", "مشاهدات الملف"), value: "2.4K", change: "+12%" },
    { Icon: Heart,  label: t("Total Likes",   "إجمالي الإعجابات"), value: "847",  change: "+5%"  },
    { Icon: Star,   label: t("Avg Rating",    "متوسط التقييم"),   value: "4.8",  change: "+0.2" },
    { Icon: Users,  label: t("Followers",     "المتابعون"),        value: fmtNum(Math.floor(user.points / 10)), change: "+23"  },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">{t("Analytics Dashboard", "لوحة التحليلات")}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <s.Icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-green-600">{s.change}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h4 className="font-semibold text-sm">{t("Engagement Overview", "نظرة على التفاعل")}</h4>
        {[
          { label: t("Profile Visits (30d)", "زيارات (30 يوم)"), pct: 78 },
          { label: t("Review Reach",         "وصول التقييمات"),  pct: 65 },
          { label: t("Story Views",          "مشاهدات القصص"),   pct: 54 },
          { label: t("Search Appearances",   "الظهور في البحث"), pct: 43 },
        ].map(m => (
          <div key={m.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{m.label}</span>
              <span className="font-semibold">{m.pct}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold">{t("Boost your profile", "عزّز ملفك الشخصي")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("Add 3 more reviews to reach Elite status.", "أضف 3 تقييمات أخرى للوصول إلى مرتبة النخبة.")}</p>
        </div>
      </div>
    </div>
  );
}

// ── Suggested users sidebar ───────────────────────────────────────────────────
function SuggestedUsers({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data } = useQuery({
    queryKey: ["suggested-users"],
    queryFn: async () => {
      const r = await fetch("/api/users/suggested");
      return r.ok ? r.json() : { users: [] };
    },
    staleTime: 60000,
  });
  const users: any[] = data?.users ?? [];
  if (!users.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{t("People to Follow", "أشخاص للمتابعة")}</p>
        <Link href="/leaderboard"><span className="text-xs text-primary font-semibold hover:underline">{t("See all", "عرض الكل")}</span></Link>
      </div>
      {users.slice(0, 4).map((u: any) => (
        <Link key={u.id} href={`/${u.username}`}>
          <div className="flex items-center gap-3 py-2 hover:bg-secondary/30 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden shrink-0">
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground m-auto mt-2" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{lang === "ar" ? (u.nameAr || u.nameEn) : (u.nameEn || u.username)}</p>
              <p className="text-xs text-muted-foreground">@{u.username}</p>
            </div>
            <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export function PublicProfilePage() {
  const params = useParams<{ username?: string; 0?: string }>();
  const username = params.username || (params as any)["0"] || "";

  const { t, lang } = useLanguage();
  const { user: authUser, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [showShare, setShowShare] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Profile data ─────────────────────────────────────────────────────────────
  const { data: pd, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const r = await fetch(`/api/users/by-username/${username}`, { headers: getAuthHeaders() });
      if (!r.ok) throw new Error("not_found");
      return r.json();
    },
    enabled: !!username,
    retry: false,
  });

  const user: ProfileUser | undefined = pd?.user;
  const reviewCount: number = pd?.reviewCount ?? 0;
  const bookingCount: number = pd?.bookingCount ?? 0;
  const followerCount: number = pd?.followerCount ?? 0;
  const followingCount: number = pd?.followingCount ?? 0;
  const followStatus: FollowStatus = pd?.followStatus ?? "none";
  const isOwn = isAuthenticated && authUser?.id === user?.id;
  const isPro = user?.accountType === "professional" || user?.accountType === "chef";
  const cfg = user ? ACCOUNT_CFG[user.accountType ?? "basic"] : ACCOUNT_CFG.basic;

  usePageMeta({
    titleEn: user ? `${user.nameEn || user.username} | Tabaq` : "Profile | Tabaq",
    titleAr: user ? `${user.nameAr || user.nameEn || user.username} | طبق` : "الملف | طبق",
    descriptionEn: user?.bio ?? "Food profile on Tabaq.",
    descriptionAr: user?.bio ?? "ملف طعام على طبق.",
  }, lang);

  // ── Follow mutation ──────────────────────────────────────────────────────────
  const followMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const r = await fetch(`/api/users/${user.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", username] }),
  });

  // ── Reviews fetch ─────────────────────────────────────────────────────────────
  const { data: revData } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      const r = await fetch(`/api/users/${user!.id}/reviews`);
      return r.ok ? r.json() : { reviews: [] };
    },
    enabled: !!user?.id && (tab === "reviews" || tab === "overview"),
  });

  // ── Visits fetch ─────────────────────────────────────────────────────────────
  const { data: visitData } = useQuery({
    queryKey: ["user-visits", user?.id],
    queryFn: async () => {
      const r = await fetch(`/api/bookings?limit=20`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : { bookings: [] };
    },
    enabled: !!user?.id && isOwn && tab === "visits",
  });

  // ── Upgrade mutation ─────────────────────────────────────────────────────────
  const upgradeMut = useMutation({
    mutationFn: async (accountType: AccountType) => {
      const r = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ accountType }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { setShowUpgrade(false); qc.invalidateQueries({ queryKey: ["profile", username] }); },
  });

  const reviews: any[] = revData?.reviews ?? [];
  const visits: any[]  = visitData?.bookings ?? [];

  // ── Tabs config ──────────────────────────────────────────────────────────────
  const tabs: { id: ProfileTab; en: string; ar: string; pro?: boolean; own?: boolean }[] = [
    { id: "overview",  en: "Overview",                       ar: "نظرة عامة" },
    { id: "reviews",   en: `Reviews (${reviewCount})`,        ar: `التقييمات (${reviewCount})` },
    { id: "visits",    en: `Visits (${bookingCount})`,        ar: `الزيارات (${bookingCount})` },
    { id: "favorites", en: "Favorites",                       ar: "المفضلة" },
    ...(isPro ? [{ id: "dishes" as ProfileTab, en: "Dishes", ar: "الأطباق", pro: true }] : []),
    { id: "plans",     en: "Plans",                           ar: "الخطط" },
    { id: "lists",     en: "Lists",                           ar: "القوائم" },
    ...(isOwn && isPro ? [{ id: "dashboard" as ProfileTab, en: "Dashboard", ar: "لوحة التحكم", own: true }] : []),
  ];

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="h-52 bg-secondary animate-pulse" />
        <div className="max-w-2xl mx-auto px-4 -mt-14">
          <div className="w-28 h-28 rounded-full bg-secondary animate-pulse border-4 border-background" />
          <div className="mt-4 space-y-3">
            <div className="h-6 w-40 bg-secondary rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-secondary rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-secondary rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">{t("Profile Not Found", "الملف الشخصي غير موجود")}</h1>
        <p className="text-muted-foreground text-sm text-center">{t(`We couldn't find @${username}.`, `لم نجد @${username}.`)}</p>
        <Button variant="outline" onClick={() => setLocation("/")}>{t("Go Home", "الصفحة الرئيسية")}</Button>
      </div>
    );
  }

  const displayName = lang === "ar" ? (user.nameAr || user.nameEn || user.username || "") : (user.nameEn || user.nameAr || user.username || "");
  const hasSocial = user.instagramUrl || user.xUrl || user.tiktokUrl || user.snapchatUrl || user.websiteUrl;
  const isPrivateLocked = user.isPrivate && !isOwn && followStatus !== "following";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* ── COVER ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-52 sm:h-64 overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-background">
        {user.coverPhotoUrl && <img src={user.coverPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Back button */}
        <button onClick={() => window.history.back()}
          className="absolute top-4 start-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
          <svg className={`w-5 h-5 ${lang === "ar" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Owner settings menu */}
        {isOwn && (
          <div className="absolute top-4 end-4" ref={menuRef}>
            <button onClick={() => setShowMenu(v => !v)}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute end-0 top-11 w-44 bg-card border border-border rounded-xl shadow-xl py-1 z-20">
                <Link href="/settings">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer">
                    <Edit className="w-4 h-4 text-muted-foreground" />{t("Edit Profile", "تعديل الملف")}
                  </div>
                </Link>
                <Link href="/profile">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer">
                    <User className="w-4 h-4 text-muted-foreground" />{t("My Account", "حسابي")}
                  </div>
                </Link>
                {user.accountType === "basic" && (
                  <button onClick={() => { setShowMenu(false); setShowUpgrade(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary text-start">
                    <Zap className="w-4 h-4 text-amber-500" />{t("Upgrade Account", "ترقية الحساب")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4">

        {/* ── AVATAR + ACTIONS ──────────────────────────────────────────────── */}
        <div className="-mt-14 mb-5">
          <div className="flex items-end justify-between gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`w-28 h-28 rounded-full bg-secondary border-4 border-background overflow-hidden ${levelRing(user.level)}`}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5"><User className="w-12 h-12 text-primary/50" /></div>
                }
              </div>
              {user.isVerified && (
                <div className="absolute bottom-1 end-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-2">
              {isOwn ? (
                <>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold h-9">
                      <Edit className="w-3.5 h-3.5" />{t("Edit", "تعديل")}
                    </Button>
                  </Link>
                  {user.accountType === "basic" && (
                    <Button size="sm" onClick={() => setShowUpgrade(true)}
                      className="rounded-xl gap-1.5 text-xs font-semibold h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0">
                      <Zap className="w-3.5 h-3.5" />{t("Upgrade", "ترقية")}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {isAuthenticated ? (
                    <Button size="sm"
                      variant={followStatus === "following" ? "outline" : "default"}
                      className="rounded-xl gap-1.5 text-xs font-semibold h-9"
                      onClick={() => followMut.mutate()}
                      disabled={followMut.isPending}
                    >
                      {followStatus === "following"
                        ? <><UserMinus className="w-3.5 h-3.5" />{t("Unfollow", "إلغاء المتابعة")}</>
                        : followStatus === "pending"
                          ? <><Clock className="w-3.5 h-3.5" />{t("Requested", "تم الطلب")}</>
                          : <><UserPlus className="w-3.5 h-3.5" />{t("Follow", "متابعة")}</>
                      }
                    </Button>
                  ) : (
                    <Link href="/signin">
                      <Button size="sm" className="rounded-xl gap-1.5 text-xs font-semibold h-9">
                        <UserPlus className="w-3.5 h-3.5" />{t("Follow", "متابعة")}
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setShowShare(true)}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Name + badges */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                <cfg.Icon className="w-3 h-3" />
                {lang === "ar" ? cfg.ar : cfg.en}
              </span>
            </div>

            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5" />{user.username}
              {user.isPrivate && <Lock className="w-3 h-3 ms-1 text-muted-foreground/60" />}
            </p>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${user.level >= 10 ? "bg-amber-100 text-amber-700" : user.level >= 7 ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                {t("Lv.", "المستوى")} {user.level} · {user.levelTitle}
              </span>
              <span className="text-xs text-muted-foreground">{fmtNum(user.points)} {t("pts", "نقطة")}</span>
            </div>

            {user.bio && <p className="text-sm text-foreground leading-relaxed mt-2">{user.bio}</p>}

            {user.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />{user.location}
              </p>
            )}

            {/* Social links */}
            {hasSocial && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {user.instagramUrl && (
                  <a href={`https://instagram.com/${user.instagramUrl.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-pink-500 transition-colors">
                    <Instagram className="w-3.5 h-3.5" />{user.instagramUrl}
                  </a>
                )}
                {user.xUrl && (
                  <a href={`https://x.com/${user.xUrl.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <span className="font-bold text-[11px]">𝕏</span>{user.xUrl}
                  </a>
                )}
                {user.tiktokUrl && (
                  <a href={`https://tiktok.com/@${user.tiktokUrl.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-black transition-colors">
                    <Play className="w-3 h-3 fill-current" />{user.tiktokUrl}
                  </a>
                )}
                {user.snapchatUrl && (
                  <a href={`https://snapchat.com/add/${user.snapchatUrl.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-yellow-500 transition-colors">
                    <Camera className="w-3 h-3" />{user.snapchatUrl}
                  </a>
                )}
                {user.websiteUrl && (
                  <a href={user.websiteUrl.startsWith("http") ? user.websiteUrl : `https://${user.websiteUrl}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="w-3.5 h-3.5" />{user.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground/60 flex items-center gap-1 pt-0.5">
              <Calendar className="w-3 h-3" />
              {t("Member since", "عضو منذ")} {new Date(user.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl mb-4 flex items-center divide-x divide-border rtl:divide-x-reverse">
          <StatPill label={t("Followers", "المتابعون")} value={followerCount} />
          <StatPill label={t("Following", "يتابع")}    value={followingCount} />
          <StatPill label={t("Reviews", "تقييمات")}    value={reviewCount}    onClick={() => setTab("reviews")} />
          <StatPill label={t("Visits", "زيارات")}      value={bookingCount}   onClick={() => setTab("visits")} />
        </div>

        {/* ── TAB BAR ──────────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <div className="flex gap-0 border-b border-border min-w-max">
            {tabs.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${tab === tb.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {lang === "ar" ? tb.ar : tb.en}
                {tb.pro && <span className="ms-1.5 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
                {tb.own && <span className="ms-1.5 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">ME</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────────────────────────── */}
        <div className="pb-24">

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              {isPrivateLocked ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
                  <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
                  <h3 className="font-semibold">{t("This account is private", "هذا الحساب خاص")}</h3>
                  <p className="text-sm text-muted-foreground">{t("Follow to see their content.", "تابع لترى المحتوى.")}</p>
                  {isAuthenticated
                    ? <Button size="sm" onClick={() => followMut.mutate()} disabled={followMut.isPending}>{followStatus === "pending" ? t("Requested", "تم الطلب") : t("Follow", "متابعة")}</Button>
                    : <Link href="/signin"><Button size="sm">{t("Sign in to follow", "سجّل دخولك للمتابعة")}</Button></Link>
                  }
                </div>
              ) : (
                <>
                  {/* Quick stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { Icon: Star,    value: reviewCount,    label: t("Reviews Written",      "تقييمات مكتوبة"),    color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/20" },
                      { Icon: MapPin,  value: bookingCount,   label: t("Restaurants Visited",  "مطاعم زارها"),       color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/20" },
                      { Icon: Flame,   value: user.points,    label: t("Tabaq Points",         "نقاط طبق"),          color: "text-primary",    bg: "bg-primary/5" },
                      { Icon: Award,   value: user.level,     label: t("Food Level",           "مستوى الطعام"),      color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20" },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
                        <s.Icon className={`w-6 h-6 ${s.color} shrink-0`} />
                        <div>
                          <p className="text-xl font-bold">{fmtNum(s.value)}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent reviews */}
                  {reviews.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{t("Recent Reviews", "آخر التقييمات")}</h3>
                        <button onClick={() => setTab("reviews")} className="text-xs text-primary font-semibold">{t("See all", "عرض الكل")}</button>
                      </div>
                      {reviews.slice(0, 2).map((r, i) => <ReviewItem key={i} r={r} lang={lang} />)}
                    </div>
                  )}

                  {/* Upgrade CTA for own basic profile */}
                  {isOwn && user.accountType === "basic" && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900 dark:text-amber-200">{t("Unlock Professional Features", "افتح الميزات المهنية")}</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{t("Get dish showcase, analytics, and a professional badge.", "احصل على عرض أطباق وتحليلات وشارة مهنية.")}</p>
                        </div>
                      </div>
                      <Button size="sm" className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white border-0" onClick={() => setShowUpgrade(true)}>
                        {t("Upgrade to Professional", "ترقية إلى محترف")}
                      </Button>
                    </div>
                  )}

                  {isOwn && <SuggestedUsers t={t} lang={lang} />}
                </>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {tab === "reviews" && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Star className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-muted-foreground">{t("No reviews yet", "لا توجد تقييمات بعد")}</p>
                  <p className="text-sm text-muted-foreground/70">{isOwn ? t("Visit restaurants and share your experience.", "زر المطاعم وشارك تجربتك.") : t("No public reviews.", "لا توجد تقييمات عامة.")}</p>
                </div>
              ) : reviews.map((r, i) => <ReviewItem key={i} r={r} lang={lang} />)}
            </div>
          )}

          {/* VISITS */}
          {tab === "visits" && (
            <div className="space-y-3">
              {visits.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-muted-foreground">{t("No visits recorded", "لا توجد زيارات مسجلة")}</p>
                  <p className="text-sm text-muted-foreground/70">{isOwn ? t("Make a reservation to track your visits.", "احجز لتتبع زياراتك.") : t("No public visits.", "لا توجد زيارات عامة.")}</p>
                </div>
              ) : visits.map((v, i) => <VisitItem key={i} v={v} lang={lang} />)}
            </div>
          )}

          {/* FAVORITES */}
          {tab === "favorites" && (
            <div className="text-center py-16 space-y-2">
              <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold text-muted-foreground">{t("No favorites saved", "لا توجد مفضلة محفوظة")}</p>
              {isOwn && <Link href="/restaurants"><Button size="sm" className="mt-2">{t("Explore Restaurants", "استكشف المطاعم")}</Button></Link>}
            </div>
          )}

          {/* DISHES — Pro/Chef only */}
          {tab === "dishes" && isPro && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t("Dish Portfolio", "محفظة الأطباق")}</h3>
                {isOwn && <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1.5"><Utensils className="w-3.5 h-3.5" />{t("Add Dish", "إضافة طبق")}</Button>}
              </div>
              <div className="text-center py-12 space-y-2">
                <ChefHat className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="font-semibold text-muted-foreground">{t("No dishes yet", "لا توجد أطباق بعد")}</p>
                <p className="text-sm text-muted-foreground/70">{isOwn ? t("Add your signature dishes.", "أضف أطباقك المميزة.") : t("No dishes added yet.", "لم يُضف أي أطباق بعد.")}</p>
              </div>
            </div>
          )}

          {/* PLANS */}
          {tab === "plans" && (
            <div className="text-center py-16 space-y-2">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold text-muted-foreground">{t("No dining plans", "لا توجد خطط للطعام")}</p>
              <p className="text-sm text-muted-foreground/70">{isOwn ? t("Create plans and invite friends.", "أنشئ خططاً وادعُ أصدقاءك.") : t("No public plans.", "لا توجد خطط عامة.")}</p>
            </div>
          )}

          {/* LISTS */}
          {tab === "lists" && (
            <div className="text-center py-16 space-y-2">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold text-muted-foreground">{t("No lists yet", "لا توجد قوائم بعد")}</p>
              <p className="text-sm text-muted-foreground/70">{isOwn ? t("Create curated restaurant lists.", "أنشئ قوائم مطاعم منتقاة.") : t("No public lists.", "لا توجد قوائم عامة.")}</p>
            </div>
          )}

          {/* DASHBOARD — own pro/chef */}
          {tab === "dashboard" && isOwn && isPro && <ProDashboard user={user} t={t} />}
        </div>
      </div>

      {/* Modals */}
      {showShare && <ShareModal username={user.username!} name={displayName} onClose={() => setShowShare(false)} />}
      {showUpgrade && (
        <UpgradeModal
          current={user.accountType}
          onUpgrade={(type) => upgradeMut.mutate(type)}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
