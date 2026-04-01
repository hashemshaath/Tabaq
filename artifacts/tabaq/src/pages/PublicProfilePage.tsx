import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/hooks/use-language";
import { getAuthHeaders, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import {
  User, ShieldCheck, MapPin, Calendar, Star, Users, Globe,
  Heart, Bookmark, MessageCircle, Share2, Copy, Check, Lock,
  UserPlus, UserMinus, Clock, AtSign, Flame, Instagram,
  ExternalLink, Settings, LogOut, ChefHat, BarChart3, ArrowUpRight,
  Sparkles, Zap, Eye, Edit, AlertCircle, CheckCircle2, X,
  BadgeCheck, Play, Camera, TrendingUp, Award, Utensils,
  PlusCircle, Trash2, Target, ChevronRight, ThumbsUp, Bell,
  UtensilsCrossed, ListChecks, Soup, MoreHorizontal, UserX,
  VolumeX, Flag, UserCheck, CheckCircle, XCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";

// ── Types ──────────────────────────────────────────────────────────────────────
type AccountType = "basic" | "professional" | "chef";
type FollowStatus = "none" | "following" | "pending";
type ProfileTab = "overview" | "reviews" | "visits" | "favorites" | "dishes" | "plans" | "recommendations" | "lists" | "activity" | "dashboard";

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

// ── Stories system ─────────────────────────────────────────────────────────────
type UserStory = {
  id: number;
  image: string;
  caption: string;
  captionAr: string;
  timeAgo: string;
  seen: boolean;
};

function StoryViewer({ stories, startIdx, username, onClose }: {
  stories: UserStory[]; startIdx: number; username: string; onClose: () => void;
}) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [idx, setIdx] = useState(startIdx);
  const [progress, setProgress] = useState(0);
  const current = stories[idx];
  const DURATION = 5000;

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const frame = () => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct < 100) { rafRef.current = requestAnimationFrame(frame); }
      else { if (idx < stories.length - 1) setIdx(i => i + 1); else onClose(); }
    };
    const rafRef = { current: requestAnimationFrame(frame) };
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx]);

  if (!current) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-sm h-full max-h-[85vh] mx-auto" onClick={e => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="absolute top-3 start-3 end-3 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-none" style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 start-3 end-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/30 border-2 border-white overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-xs font-bold">
                {username[0]?.toUpperCase()}
              </div>
            </div>
            <div>
              <p className="text-white text-xs font-bold">@{username}</p>
              <p className="text-white/60 text-[10px]">{current.timeAgo} ago</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Image */}
        <img src={current.image} alt="" className="w-full h-full object-cover rounded-xl" />

        {/* Caption */}
        <div className="absolute bottom-6 start-0 end-0 px-5 text-center">
          <p className="text-white font-semibold text-base drop-shadow-lg">{t(current.caption, current.captionAr)}</p>
        </div>

        {/* Tap zones */}
        <button className="absolute inset-y-0 start-0 w-1/3 z-20" onClick={e => { e.stopPropagation(); if (idx > 0) setIdx(i => i - 1); }} />
        <button className="absolute inset-y-0 end-0 w-1/3 z-20" onClick={e => { e.stopPropagation(); if (idx < stories.length - 1) setIdx(i => i + 1); else onClose(); }} />
      </div>
    </div>
  );
}

function UserStoriesBar({ userId, username, isOwn, lang }: { userId: number; username: string; isOwn: boolean; lang: string }) {
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);

  const { data } = useQuery({
    queryKey: ['user-stories', userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/users/${userId}/stories?limit=20`);
      if (!res.ok) return { stories: [] };
      return res.json();
    },
    enabled: !!userId,
  });

  const stories: UserStory[] = (data?.stories ?? []).map((s: any, i: number) => ({
    id: s.id,
    image: Array.isArray(s.mediaUrls) && s.mediaUrls.length > 0 ? s.mediaUrls[0] : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    caption: s.captionEn ?? '',
    captionAr: s.captionAr ?? '',
    timeAgo: (() => {
      const diff = Date.now() - new Date(s.createdAt).getTime();
      const h = Math.floor(diff / 3600000);
      return h < 1 ? 'now' : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
    })(),
    seen: false,
  }));

  if (!isOwn && stories.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {isOwn && (
            <button className="flex flex-col items-center gap-1.5 shrink-0" onClick={() => {}}>
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors">
                <Camera className="w-6 h-6 text-primary/60" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">{t('Add Story', 'قصة')}</span>
            </button>
          )}
          {stories.map((story, i) => (
            <button key={story.id} className="flex flex-col items-center gap-1.5 shrink-0"
              onClick={() => { setViewerStart(i); setViewerOpen(true); }}>
              <div className={`w-16 h-16 rounded-full p-0.5 ${story.seen ? 'bg-border' : 'bg-gradient-to-br from-primary via-orange-400 to-amber-400'}`}>
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                  <img src={story.image} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{story.timeAgo}</span>
            </button>
          ))}
        </div>
      </div>
      {viewerOpen && stories.length > 0 && (
        <StoryViewer stories={stories} startIdx={viewerStart} username={username} onClose={() => setViewerOpen(false)} />
      )}
    </>
  );
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
    <button onClick={onClick} className={`flex flex-col items-center py-3 px-4 rounded-xl transition-colors ${onClick ? "hover:bg-secondary/60 cursor-pointer" : "cursor-default"}`}>
      <span className="text-xl font-bold">{fmtNum(value)}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </button>
  );
}

// ── Follow List Modal ──────────────────────────────────────────────────────────
function FollowListModal({
  userId, type, isOwn, lang, authUserId, onClose,
}: {
  userId: number; type: "followers" | "following"; isOwn: boolean;
  lang: string; authUserId?: number; onClose: () => void;
}) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: [`follow-list`, userId, type],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/users/${userId}/${type}`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : [];
    },
  });

  const users: any[] = Array.isArray(data) ? data : [];
  const filtered = search.trim()
    ? users.filter(u => (u.nameEn ?? "").toLowerCase().includes(search.toLowerCase()) || (u.nameAr ?? "").includes(search))
    : users;

  const removeFollowerMut = useMutation({
    mutationFn: async (followerId: number) => {
      await fetch(`${API_BASE}/api/users/${followerId}/follow`, { method: "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ["profile"] }); toast.success(t("Follower removed", "تمت إزالة المتابع")); },
  });

  const followToggleMut = useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: number; isFollowing: boolean }) => {
      await fetch(`${API_BASE}/api/users/${targetId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
    },
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ["profile"] }); },
  });

  const blockMut = useMutation({
    mutationFn: async (targetId: number) => {
      await fetch(`${API_BASE}/api/users/${targetId}/block`, { method: "POST", headers: getAuthHeaders() });
    },
    onSuccess: () => { refetch(); toast.success(t("User blocked", "تم حظر المستخدم")); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold">
            {type === "followers" ? t("Followers", "المتابعون") : t("Following", "يتابع")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        {/* Search */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t("Search...", "بحث...")}
            className="w-full bg-secondary/60 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/40"
          />
        </div>
        {/* List */}
        <div className="overflow-y-auto flex-1 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t("No users found", "لا يوجد مستخدمون")}</div>
          ) : filtered.map(u => {
            const name = lang === "ar" ? (u.nameAr || u.nameEn) : (u.nameEn || u.nameAr);
            const isMe = u.id === authUserId;
            const isUserFollowingThem = false; // simplified
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/40 transition-colors">
                <Link href={`/${u.username ?? u.id}`} onClick={onClose}>
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt={name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5"><User className="w-5 h-5 text-primary/50" /></div>
                    }
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/${u.username ?? u.id}`} onClick={onClose}>
                      <span className="text-sm font-semibold hover:text-primary transition-colors truncate">{name}</span>
                    </Link>
                    {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">@{u.username} · {t(`Lv.${u.level}`, `مستوى ${u.level}`)}</p>
                </div>
                {!isMe && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isOwn && type === "followers" && (
                      <button
                        onClick={() => removeFollowerMut.mutate(u.id)}
                        disabled={removeFollowerMut.isPending}
                        className="text-xs px-2.5 py-1 rounded-lg bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors font-medium"
                      >
                        {t("Remove", "إزالة")}
                      </button>
                    )}
                    {authUserId && !isOwn && (
                      <button
                        onClick={() => followToggleMut.mutate({ targetId: u.id, isFollowing: isUserFollowingThem })}
                        disabled={followToggleMut.isPending}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                      >
                        {t("Follow", "متابعة")}
                      </button>
                    )}
                    {authUserId && (
                      <button
                        onClick={() => blockMut.mutate(u.id)}
                        disabled={blockMut.isPending}
                        title={t("Block user", "حظر المستخدم")}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-border shrink-0 text-center text-xs text-muted-foreground">
          {filtered.length} {type === "followers" ? t("followers", "متابع") : t("following", "متابَع")}
        </div>
      </div>
    </div>
  );
}

// ── Follow Requests Panel ──────────────────────────────────────────────────────
function FollowRequestsPanel({ lang, onDone }: { lang: string; onDone: () => void }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["follow-requests"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/follow-requests`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : { requests: [] };
    },
  });

  const requests: any[] = data?.requests ?? [];

  const respondMut = useMutation({
    mutationFn: async ({ requesterId, action }: { requesterId: number; action: "accept" | "reject" }) => {
      const url = action === "accept"
        ? `/api/me/follow-requests/${requesterId}/accept`
        : `/api/me/follow-requests/${requesterId}`;
      await fetch(url, { method: action === "accept" ? "POST" : "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: (_, vars) => {
      refetch();
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(vars.action === "accept" ? t("Follow request accepted", "تم قبول طلب المتابعة") : t("Follow request declined", "تم رفض طلب المتابعة"));
    },
  });

  if (isLoading) return null;
  if (requests.length === 0) return (
    <div className="bg-card border border-border rounded-2xl p-4 text-center text-sm text-muted-foreground mb-4">
      {t("No pending follow requests", "لا توجد طلبات متابعة معلقة")}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">{t("Follow Requests", "طلبات المتابعة")}</h3>
          <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">{requests.length}</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {requests.map(req => {
          const name = lang === "ar" ? (req.nameAr || req.nameEn) : (req.nameEn || req.nameAr);
          return (
            <div key={req.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
                {req.avatarUrl
                  ? <img src={req.avatarUrl} alt={name} className="w-full h-full object-cover" />
                  : <User className="w-5 h-5 text-muted-foreground m-auto" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-xs text-muted-foreground">@{req.username}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => respondMut.mutate({ requesterId: req.id, action: "accept" })}
                  disabled={respondMut.isPending}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />{t("Accept", "قبول")}
                </button>
                <button
                  onClick={() => respondMut.mutate({ requesterId: req.id, action: "reject" })}
                  disabled={respondMut.isPending}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-destructive/10 hover:text-destructive font-medium transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />{t("Decline", "رفض")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Verification Modal ─────────────────────────────────────────────────────────
function VerificationModal({ lang, onClose }: { lang: string; onClose: () => void }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [method, setMethod] = useState<"document" | "code" | "invite_link">("document");
  const [note, setNote] = useState("");

  const { data: existingReqData } = useQuery({
    queryKey: ["my-verification-request"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/verification-request`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : null;
    },
  });

  const existing = existingReqData?.request;

  const submitMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/verification-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ method, noteFromUser: note }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.message ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success(t("Verification request submitted! We'll review it within 24-48 hours.", "تم إرسال طلب التحقق! سنراجعه خلال 24-48 ساعة."));
      onClose();
    },
    onError: (err: any) => toast.error(err.message ?? t("Failed to submit request", "فشل إرسال الطلب")),
  });

  const METHODS = [
    { key: "document" as const, icon: "🪪", en: "Upload ID Document", ar: "رفع وثيقة هوية", desc_en: "Upload a copy of your official ID (passport, national ID)", desc_ar: "ارفع نسخة من هويتك الرسمية (جواز سفر، بطاقة هوية)" },
    { key: "code" as const, icon: "🔐", en: "Verification Code", ar: "رمز التحقق", desc_en: "Enter a special invitation code from Tabaq", desc_ar: "أدخل رمز الدعوة الخاص من طبق" },
    { key: "invite_link" as const, icon: "🔗", en: "Invite Link", ar: "رابط الدعوة", desc_en: "Use a trusted invite link from Tabaq team or partner", desc_ar: "استخدم رابط دعوة موثوق من فريق طبق أو الشركاء" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold">{t("Request Verification", "طلب التحقق")}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {existing ? (
            <div className={`rounded-xl p-4 border ${existing.status === "pending" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20" : existing.status === "approved" ? "bg-green-50 border-green-200 dark:bg-green-900/20" : "bg-red-50 border-red-200 dark:bg-red-900/20"}`}>
              <div className="flex items-center gap-2 mb-1">
                {existing.status === "pending" && <Clock className="w-4 h-4 text-amber-600" />}
                {existing.status === "approved" && <CheckCircle className="w-4 h-4 text-green-600" />}
                {existing.status === "rejected" && <XCircle className="w-4 h-4 text-red-600" />}
                <span className="text-sm font-semibold capitalize">{existing.status === "pending" ? t("Under Review", "قيد المراجعة") : existing.status === "approved" ? t("Approved", "تمت الموافقة") : t("Rejected", "مرفوض")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("Your verification request was submitted via", "طلب التحقق الخاص بك تم عبر")} {existing.method}.</p>
              {existing.noteFromAdmin && <p className="text-xs mt-2 font-medium">{t("Admin note:", "ملاحظة الإدارة:")} {existing.noteFromAdmin}</p>}
              {existing.status === "rejected" && (
                <button className="mt-3 text-xs text-primary font-semibold hover:underline" onClick={() => submitMut.reset()}>
                  {t("Submit new request", "إرسال طلب جديد")}
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t("A verification badge confirms your identity as a real person, public figure, or content creator on Tabaq.", "شارة التحقق تؤكد هويتك كشخص حقيقي أو شخصية عامة أو صانع محتوى على طبق.")}</p>
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">{t("Choose verification method", "اختر طريقة التحقق")}</p>
                {METHODS.map(m => (
                  <button key={m.key} onClick={() => setMethod(m.key)}
                    className={`w-full text-start flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${method === m.key ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}>
                    <span className="text-2xl shrink-0 mt-0.5">{m.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{lang === "ar" ? m.ar : m.en}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? m.desc_ar : m.desc_en}</p>
                    </div>
                    {method === m.key && <CheckCircle className="w-4 h-4 text-primary ms-auto shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide">{t("Additional note (optional)", "ملاحظة إضافية (اختياري)")}</label>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  rows={3} placeholder={t("Briefly describe your account and why you should be verified...", "صف حسابك باختصار وسبب استحقاقك للتحقق...")}
                  className="w-full bg-secondary/60 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/40 resize-none"
                />
              </div>
            </>
          )}
        </div>
        {!existing && (
          <div className="px-5 py-4 border-t border-border shrink-0">
            <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending} className="w-full rounded-xl gap-2">
              <ShieldCheck className="w-4 h-4" />
              {submitMut.isPending ? t("Submitting...", "جارٍ الإرسال...") : t("Submit Verification Request", "إرسال طلب التحقق")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Review card ────────────────────────────────────────────────────────────────
function ReviewItem({ r, lang }: { r: any; lang: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
          {(r.restaurantCoverImageUrl || r.restaurantImage) && <img src={r.restaurantCoverImageUrl || r.restaurantImage} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          {r.restaurantId ? (
            <Link href={`/restaurants/${r.restaurantId}`}>
              <p className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer">{lang === "ar" ? r.restaurantNameAr : r.restaurantNameEn}</p>
            </Link>
          ) : (
            <p className="font-semibold text-sm truncate">{lang === "ar" ? r.restaurantNameAr : r.restaurantNameEn}</p>
          )}
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

// ── Message Modal ──────────────────────────────────────────────────────────────
function MessageModal({ user, lang, onClose }: { user: { nameEn?: string | null; nameAr?: string | null; avatarUrl?: string | null; username?: string | null }; lang: string; onClose: () => void }) {
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const name = lang === 'ar' ? (user.nameAr || user.nameEn) : (user.nameEn || user.nameAr);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-3xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <img src={user.avatarUrl ?? `https://i.pravatar.cc/40?u=${user.username}`} alt={name ?? ''} className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1">
            <p className="font-bold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-bold text-foreground">{t('Message sent!', 'تم إرسال الرسالة!')}</p>
            <p className="text-sm text-muted-foreground">{t(`Your message was sent to ${name}.`, `تم إرسال رسالتك إلى ${name}.`)}</p>
            <Button size="sm" variant="outline" onClick={onClose} className="rounded-xl">{t('Close', 'إغلاق')}</Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t(`Send a message to ${name}...`, `أرسل رسالة إلى ${name}...`)}
              className="w-full min-h-[120px] border border-border rounded-2xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">{t('Cancel', 'إلغاء')}</Button>
              <Button size="sm" disabled={!message.trim()} onClick={() => { if (message.trim()) setSent(true); }} className="rounded-xl gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />{t('Send', 'إرسال')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
function ActivityFeed({ reviews, visits, followerCount, lang }: {
  reviews: any[]; visits: any[]; followerCount: number; lang: string;
}) {
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  type ActivityItem = { type: string; icon: React.ElementType; color: string; bg: string; title: string; sub: string; time: string };
  const items: ActivityItem[] = [
    ...reviews.slice(0, 3).map((r: any, i) => ({
      type: 'review', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30',
      title: t(`Reviewed ${r.restaurantNameEn ?? 'a restaurant'}`, `قيّم ${r.restaurantNameAr ?? r.restaurantNameEn ?? 'مطعماً'}`),
      sub: `${r.ratingOverall ?? 5}★ · ${r.textEn?.slice(0, 60) ?? ''}${(r.textEn?.length ?? 0) > 60 ? '…' : ''}`,
      time: r.createdAt ? new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) : '',
    })),
    ...visits.slice(0, 2).map((v: any) => ({
      type: 'visit', icon: MapPin, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30',
      title: t(`Visited ${v.restaurantNameEn ?? 'a restaurant'}`, `زار ${v.restaurantNameAr ?? v.restaurantNameEn ?? 'مطعماً'}`),
      sub: `${v.date ?? ''} · ${v.partySize ? `${v.partySize} ${t('guests', 'ضيوف')}` : t('Solo visit', 'زيارة منفردة')}`,
      time: v.date ?? '',
    })),
    {
      type: 'join', icon: Users, color: 'text-primary', bg: 'bg-primary/5',
      title: t('Joined Tabaq', 'انضم إلى طبق'),
      sub: t(`${followerCount} followers earned`, `${followerCount} متابع`),
      time: '',
    },
  ].sort(() => Math.random() - 0.4);

  if (!items.length) {
    return (
      <div className="text-center py-16 space-y-2">
        <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto" />
        <p className="font-semibold text-muted-foreground">{t('No activity yet', 'لا توجد نشاطات بعد')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${item.bg} border border-border`}>
            <div className={`w-9 h-9 rounded-xl bg-white dark:bg-background flex items-center justify-center shrink-0 shadow-sm`}>
              <Icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{item.title}</p>
              {item.sub && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.sub}</p>}
            </div>
            {item.time && <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Food Journey Insights ─────────────────────────────────────────────────────
function FoodJourneyInsights({ reviews, visits, checkins, lang, t }: {
  reviews: any[]; visits: any[]; checkins: any[]; lang: string;
  t: (en: string, ar: string) => string;
}) {
  const cuisineCounts: Record<string, number> = {};
  for (const r of reviews) {
    const c = lang === "ar" ? (r.cuisineAr || r.cuisineEn) : (r.cuisineEn || r.cuisineAr);
    if (c) cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
  }
  const topCuisines = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxCount = topCuisines[0]?.[1] ?? 1;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.ratingOverall || 0), 0) / reviews.length).toFixed(1)
    : "—";
  const totalVisits = visits.length + checkins.length;
  if (reviews.length === 0 && totalVisits === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">{t("Food Journey", "رحلة الطعام")}</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: t("Visits", "زيارات"),    value: totalVisits,       color: "text-green-600" },
          { label: t("Reviews", "تقييمات"),  value: reviews.length,   color: "text-amber-600" },
          { label: t("Avg Rating", "تقييم"), value: avgRating,        color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-secondary/40 rounded-xl py-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {topCuisines.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-muted-foreground">{t("Favourite Cuisines", "المطابخ المفضلة")}</p>
          {topCuisines.map(([name, count]) => (
            <div key={name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground">{count} {t("reviews", "تقييمات")}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Saved restaurant card ─────────────────────────────────────────────────────
function SavedRestCard({ r, lang, onRemove }: { r: any; lang: string; onRemove?: () => void }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 group">
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
        {r.coverImageUrl && <img src={r.coverImageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{lang === "ar" ? (r.nameAr || r.nameEn) : (r.nameEn || r.nameAr)}</p>
        <p className="text-xs text-muted-foreground truncate">{lang === "ar" ? (r.cuisineAr || r.cuisineEn) : (r.cuisineEn || r.cuisineAr)}</p>
        {r.avgRating && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">{Number(r.avgRating).toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/restaurants/${r.id || r.restaurantId}`}>
          <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </span>
        </Link>
        {onRemove && (
          <button onClick={onRemove} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Saved dish card ───────────────────────────────────────────────────────────
function SavedDishCard({ d, lang, onRemove }: { d: any; lang: string; onRemove?: () => void }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 group">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
        {d.dishImageUrl && <img src={d.dishImageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{lang === "ar" ? (d.dishNameAr || d.dishNameEn) : (d.dishNameEn || d.dishNameAr)}</p>
        <p className="text-xs text-muted-foreground truncate">{d.dishCategory}</p>
        {(d.dishPriceMin || d.dishPriceMax) && (
          <p className="text-[10px] text-primary font-semibold mt-0.5">
            {d.dishPriceMin === d.dishPriceMax ? `${d.dishPriceMin} ${t("SAR", "ر.س")}` : `${d.dishPriceMin}–${d.dishPriceMax} ${t("SAR", "ر.س")}`}
          </p>
        )}
      </div>
      {onRemove && (
        <button onClick={onRemove} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Check-in card ─────────────────────────────────────────────────────────────
function CheckInCard({ c, lang, onDelete }: { c: any; lang: string; onDelete?: () => void }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  return (
    <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 group">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
        {c.restaurantCoverImage
          ? <img src={c.restaurantCoverImage} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-5 h-5 text-muted-foreground" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{lang === "ar" ? (c.restaurantNameAr || c.restaurantNameEn) : (c.restaurantNameEn || c.restaurantNameAr)}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />{c.visitDate}
          </span>
          {c.visitTime && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{c.visitTime}</span>}
          {c.partySize > 1 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{c.partySize}</span>}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${c.isPublic ? "bg-green-50 text-green-700" : "bg-secondary text-muted-foreground"}`}>
            {c.isPublic ? t("Public", "عام") : t("Private", "خاص")}
          </span>
        </div>
        {c.notes && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{c.notes}</p>}
      </div>
      {onDelete && (
        <button onClick={onDelete} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Log Check-in Modal ────────────────────────────────────────────────────────
function LogCheckinModal({ lang, onClose, onSave }: {
  lang: string;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [form, setForm] = useState({ restaurantId: "", visitDate: new Date().toISOString().split("T")[0], visitTime: "", partySize: "1", notes: "", isPublic: true });
  const { data: restList } = useQuery({
    queryKey: ["restaurants-mini"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/restaurants?limit=20`);
      return r.ok ? r.json() : { restaurants: [] };
    },
    staleTime: 120000,
  });
  const restaurants: any[] = restList?.restaurants ?? [];
  const up = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="font-bold">{t("Log a Visit", "سجّل زيارة")}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("Restaurant", "المطعم")}</label>
            <select
              value={form.restaurantId}
              onChange={e => up("restaurantId", e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t("Select a restaurant…", "اختر مطعماً…")}</option>
              {restaurants.map((r: any) => (
                <option key={r.id} value={r.id}>{lang === "ar" ? (r.nameAr || r.nameEn) : (r.nameEn || r.nameAr)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("Date", "التاريخ")}</label>
              <input type="date" value={form.visitDate} onChange={e => up("visitDate", e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("Time (optional)", "الوقت")}</label>
              <input type="time" value={form.visitTime} onChange={e => up("visitTime", e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("Party Size", "عدد الضيوف")}</label>
            <div className="flex gap-2">
              {["1","2","3","4","5","6+"].map(n => (
                <button key={n} onClick={() => up("partySize", n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.partySize === n ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("Notes (optional)", "ملاحظات")}</label>
            <textarea value={form.notes} onChange={e => up("notes", e.target.value)}
              placeholder={t("How was your experience?", "كيف كانت تجربتك؟")}
              className="w-full min-h-[80px] border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={e => up("isPublic", e.target.checked)}
              className="w-4 h-4 accent-primary rounded" />
            <span className="text-sm">{t("Make this visit public", "اجعل هذه الزيارة عامة")}</span>
          </label>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
            <Button className="flex-1 rounded-xl" disabled={!form.restaurantId} onClick={() => { onSave(form); onClose(); }}>
              {t("Log Visit", "تسجيل الزيارة")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<string, { en: string; ar: string; color: string; dot: string }> = {
  high:   { en: "High",   ar: "عالية",  color: "text-red-600",    dot: "bg-red-500" },
  medium: { en: "Medium", ar: "متوسطة", color: "text-amber-600",  dot: "bg-amber-500" },
  low:    { en: "Low",    ar: "منخفضة", color: "text-green-600",  dot: "bg-green-500" },
};
function PlanCard({ p, lang, onDelete, onMarkDone }: { p: any; lang: string; onDelete?: () => void; onMarkDone?: () => void }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const pri = PRIORITY_CFG[p.priority ?? "medium"] ?? PRIORITY_CFG.medium;
  const done = p.status === "done";
  return (
    <div className={`bg-card border border-border rounded-xl p-4 space-y-3 ${done ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-secondary shrink-0 mt-0.5">
          {p.restaurantCoverImage
            ? <img src={p.restaurantCoverImage} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Target className="w-5 h-5 text-muted-foreground" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{p.title}</p>
          {(p.restaurantNameEn || p.restaurantNameAr) && (
            <p className="text-xs text-muted-foreground truncate">{lang === "ar" ? (p.restaurantNameAr || p.restaurantNameEn) : (p.restaurantNameEn || p.restaurantNameAr)}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`flex items-center gap-1 text-[10px] font-semibold ${pri.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />{lang === "ar" ? pri.ar : pri.en}
            </span>
            {p.plannedDate && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />{p.plannedDate}
              </span>
            )}
            {p.themeLabel && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{p.themeLabel}</span>
            )}
            {p.reminderEnabled && <Bell className="w-3 h-3 text-muted-foreground" />}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!done && onMarkDone && (
            <button onClick={onMarkDone} className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors" title={t("Mark done", "تم")}>
              <Check className="w-3.5 h-3.5 text-green-600" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {p.notes && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{p.notes}</p>}
    </div>
  );
}

// ── Create Plan Modal ─────────────────────────────────────────────────────────
function CreatePlanModal({ lang, onClose, onSave }: {
  lang: string;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [form, setForm] = useState({ title: "", restaurantId: "", plannedDate: "", notes: "", priority: "medium", themeLabel: "", reminderEnabled: false });
  const { data: restList } = useQuery({
    queryKey: ["restaurants-mini"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/restaurants?limit=20`);
      return r.ok ? r.json() : { restaurants: [] };
    },
    staleTime: 120000,
  });
  const restaurants: any[] = restList?.restaurants ?? [];
  const up = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const themes = ["Dessert Week", "Brunch Tour", "Seafood Journey", "Date Night", "Family Outing"];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            <p className="font-bold">{t("New Dining Plan", "خطة طعام جديدة")}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("Plan Title *", "عنوان الخطة *")}</label>
            <input type="text" value={form.title} onChange={e => up("title", e.target.value)}
              placeholder={t("e.g. Brunch at Alfredo's", "مثال: برانش في مطعم ألفريدو")}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("Restaurant (optional)", "المطعم (اختياري)")}</label>
            <select value={form.restaurantId} onChange={e => up("restaurantId", e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">{t("None", "بدون مطعم")}</option>
              {restaurants.map((r: any) => (
                <option key={r.id} value={r.id}>{lang === "ar" ? (r.nameAr || r.nameEn) : (r.nameEn || r.nameAr)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("Planned Date", "التاريخ المخطط")}</label>
              <input type="date" value={form.plannedDate} onChange={e => up("plannedDate", e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("Priority", "الأولوية")}</label>
              <select value={form.priority} onChange={e => up("priority", e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="high">{t("High", "عالية")}</option>
                <option value="medium">{t("Medium", "متوسطة")}</option>
                <option value="low">{t("Low", "منخفضة")}</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("Theme (optional)", "الموضوع")}</label>
            <div className="flex flex-wrap gap-2">
              {themes.map(th => (
                <button key={th} onClick={() => up("themeLabel", form.themeLabel === th ? "" : th)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${form.themeLabel === th ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"}`}>
                  {th}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("Notes", "ملاحظات")}</label>
            <textarea value={form.notes} onChange={e => up("notes", e.target.value)}
              placeholder={t("Any special notes…", "أي ملاحظات خاصة…")}
              className="w-full min-h-[70px] border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.reminderEnabled} onChange={e => up("reminderEnabled", e.target.checked)}
              className="w-4 h-4 accent-primary rounded" />
            <span className="text-sm">{t("Enable reminder", "تفعيل التذكير")}</span>
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          </label>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
            <Button className="flex-1 rounded-xl" disabled={!form.title.trim()} onClick={() => { onSave(form); onClose(); }}>
              {t("Create Plan", "إنشاء الخطة")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────────
function RecommendationCard({ rec, lang, onDelete }: { rec: any; lang: string; onDelete?: () => void }) {
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const isRestaurant = !rec.dishId;
  const name = isRestaurant
    ? (lang === "ar" ? (rec.restaurantNameAr || rec.restaurantNameEn) : (rec.restaurantNameEn || rec.restaurantNameAr))
    : (lang === "ar" ? (rec.dishNameAr || rec.dishNameEn) : (rec.dishNameEn || rec.dishNameAr));
  const sub = isRestaurant
    ? (lang === "ar" ? (rec.restaurantNameAr || rec.restaurantNameEn) : (rec.restaurantNameEn || rec.restaurantNameAr))
    : (lang === "ar" ? (rec.restaurantNameAr || rec.restaurantNameEn) : (rec.restaurantNameEn || rec.restaurantNameAr));
  const note = lang === "ar" ? (rec.noteAr || rec.noteEn) : (rec.noteEn || rec.noteAr);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 group">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isRestaurant ? "bg-primary/10" : "bg-amber-50"}`}>
          {isRestaurant ? <Utensils className="w-5 h-5 text-primary" /> : <Soup className="w-5 h-5 text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isRestaurant ? "bg-primary/10 text-primary" : "bg-amber-50 text-amber-700"}`}>
              {isRestaurant ? t("Restaurant", "مطعم") : t("Dish", "طبق")}
            </span>
          </div>
          <p className="font-semibold text-sm mt-1 truncate">{name}</p>
          {!isRestaurant && sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
        {onDelete && (
          <button onClick={onDelete} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {note && (
        <div className="flex items-start gap-2 bg-secondary/40 rounded-lg px-3 py-2.5">
          <ThumbsUp className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        {isRestaurant
          ? <Link href={`/restaurants/${rec.restaurantId}`}><Button size="sm" variant="outline" className="rounded-lg text-xs h-7">{t("View Restaurant", "عرض المطعم")}</Button></Link>
          : <Link href={`/restaurants/${rec.restaurantId}`}><Button size="sm" variant="outline" className="rounded-lg text-xs h-7">{t("View Dish", "عرض الطبق")}</Button></Link>
        }
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ms-auto ${rec.isPublic ? "bg-green-50 text-green-700" : "bg-secondary text-muted-foreground"}`}>
          {rec.isPublic ? t("Public", "عام") : t("Private", "خاص")}
        </span>
      </div>
    </div>
  );
}

// ── Suggested users sidebar ───────────────────────────────────────────────────
function SuggestedUsers({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data } = useQuery({
    queryKey: ["suggested-users"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/users/suggested`);
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
  const [showMessage, setShowMessage] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [followListType, setFollowListType] = useState<null | "followers" | "following">(null);
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const otherMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (otherMenuRef.current && !otherMenuRef.current.contains(e.target as Node)) setShowOtherMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Profile data ─────────────────────────────────────────────────────────────
  const { data: pd, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/users/by-username/${username}`, { headers: getAuthHeaders() });
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
  const followsBack: boolean = pd?.followsBack ?? false;
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
      const method = followStatus === "following" ? "DELETE" : "POST";
      const r = await fetch(`${API_BASE}/api/users/${user.id}/follow`, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", username] }),
  });

  // ── Block mutation ──────────────────────────────────────────────────────────
  const blockMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const r = await fetch(`${API_BASE}/api/users/${user.id}/block`, { method: "POST", headers: getAuthHeaders() });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      setShowOtherMenu(false);
      toast.success(t("User blocked. You won't see their content.", "تم حظر المستخدم. لن ترى محتواه."));
      qc.invalidateQueries({ queryKey: ["profile", username] });
    },
  });

  // ── Mute mutation ──────────────────────────────────────────────────────────
  const muteMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const r = await fetch(`${API_BASE}/api/me/mutes/user/${user.id}`, { method: "POST", headers: getAuthHeaders() });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      setShowOtherMenu(false);
      toast.success(t("User muted. Their activity won't appear in your feed.", "تم كتم المستخدم. لن يظهر نشاطه في خلاصتك."));
    },
  });

  // ── Reviews fetch ─────────────────────────────────────────────────────────────
  const { data: revData } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/users/${user!.id}/reviews`);
      return r.ok ? r.json() : { reviews: [] };
    },
    enabled: !!user?.id && (tab === "reviews" || tab === "overview"),
  });

  // ── Visits fetch ─────────────────────────────────────────────────────────────
  const { data: visitData } = useQuery({
    queryKey: ["user-visits", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/bookings?limit=20`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : { bookings: [] };
    },
    enabled: !!user?.id && isOwn && (tab === "visits" || tab === "activity"),
  });

  // ── Saved restaurants ─────────────────────────────────────────────────────
  const { data: savedRestData } = useQuery({
    queryKey: ["saved-restaurants"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/saved-restaurants`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : [];
    },
    enabled: isOwn && tab === "favorites",
  });

  // ── Saved dishes ──────────────────────────────────────────────────────────
  const { data: savedDishData } = useQuery({
    queryKey: ["saved-dishes"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/saved-dishes`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : [];
    },
    enabled: isOwn && tab === "favorites",
  });

  // ── Plans ─────────────────────────────────────────────────────────────────
  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ["user-plans", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/plans`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : [];
    },
    enabled: isOwn && (tab === "plans" || tab === "overview"),
  });

  // ── Check-ins ─────────────────────────────────────────────────────────────
  const { data: checkinsData, refetch: refetchCheckins } = useQuery({
    queryKey: ["user-checkins", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/checkins`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : [];
    },
    enabled: isOwn && (tab === "visits" || tab === "activity" || tab === "overview"),
  });

  // ── Recommendations ───────────────────────────────────────────────────────
  const { data: recsData, refetch: refetchRecs } = useQuery({
    queryKey: ["user-recommendations", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/me/recommendations`, { headers: getAuthHeaders() });
      return r.ok ? r.json() : [];
    },
    enabled: isOwn && tab === "recommendations",
  });

  // ── Upgrade mutation ─────────────────────────────────────────────────────────
  const upgradeMut = useMutation({
    mutationFn: async (accountType: AccountType) => {
      const r = await fetch(`${API_BASE}/api/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ accountType }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { setShowUpgrade(false); qc.invalidateQueries({ queryKey: ["profile", username] }); },
  });

  const reviews: any[] = Array.isArray(revData) ? revData : (revData?.reviews ?? []);
  const visits: any[]  = visitData?.bookings ?? [];
  const savedRestaurants: any[] = Array.isArray(savedRestData) ? savedRestData : (savedRestData?.restaurants ?? []);
  const savedDishes: any[] = Array.isArray(savedDishData) ? savedDishData : [];
  const plans: any[] = Array.isArray(plansData) ? plansData : [];
  const checkins: any[] = Array.isArray(checkinsData) ? checkinsData : [];
  const recommendations: any[] = Array.isArray(recsData) ? recsData : [];

  // ── Check-in mutations ───────────────────────────────────────────────────────
  const createCheckinMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch(`${API_BASE}/api/me/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ ...data, restaurantId: parseInt(data.restaurantId, 10), partySize: parseInt(data.partySize, 10) || 1 }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => refetchCheckins(),
  });

  const deleteCheckinMut = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API_BASE}/api/me/checkins/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: () => refetchCheckins(),
  });

  // ── Plan mutations ────────────────────────────────────────────────────────────
  const createPlanMut = useMutation({
    mutationFn: async (data: any) => {
      const body: any = { ...data };
      if (data.restaurantId) body.restaurantId = parseInt(data.restaurantId, 10);
      else delete body.restaurantId;
      const r = await fetch(`${API_BASE}/api/me/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => refetchPlans(),
  });

  const deletePlanMut = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API_BASE}/api/me/plans/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: () => refetchPlans(),
  });

  const markPlanDoneMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API_BASE}/api/me/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: "done" }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => refetchPlans(),
  });

  // ── Remove saved restaurant ───────────────────────────────────────────────────
  const removeSavedRestMut = useMutation({
    mutationFn: async (restaurantId: number) => {
      await fetch(`${API_BASE}/api/me/saved-restaurants/${restaurantId}`, { method: "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-restaurants"] }),
  });

  // ── Remove saved dish ─────────────────────────────────────────────────────────
  const removeSavedDishMut = useMutation({
    mutationFn: async (dishId: number) => {
      await fetch(`${API_BASE}/api/me/saved-dishes/${dishId}`, { method: "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-dishes"] }),
  });

  // ── Delete recommendation ─────────────────────────────────────────────────────
  const deleteRecMut = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API_BASE}/api/me/recommendations/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: () => refetchRecs(),
  });

  // ── Tabs config ──────────────────────────────────────────────────────────────
  const tabs: { id: ProfileTab; en: string; ar: string; pro?: boolean; own?: boolean }[] = [
    { id: "overview",         en: "Overview",                                ar: "نظرة عامة" },
    { id: "reviews",          en: `Reviews (${reviewCount})`,                ar: `التقييمات (${reviewCount})` },
    { id: "visits",           en: `Visits`,                                  ar: "الزيارات" },
    { id: "favorites",        en: "Favorites",                               ar: "المفضلة" },
    ...(isPro ? [{ id: "dishes" as ProfileTab, en: "Dishes", ar: "الأطباق", pro: true }] : []),
    { id: "plans",            en: "Plans",                                   ar: "الخطط" },
    { id: "recommendations",  en: "Picks",                                   ar: "توصياتي" },
    { id: "activity",         en: "Activity",                                ar: "النشاط" },
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
                <Link href="/edit-profile">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer">
                    <Edit className="w-4 h-4 text-muted-foreground" />{t("Edit Profile", "تعديل الملف")}
                  </div>
                </Link>
                <Link href="/settings">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer">
                    <Settings className="w-4 h-4 text-muted-foreground" />{t("Settings", "الإعدادات")}
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
                  {!user.isVerified && (
                    <Button variant="outline" size="sm" onClick={() => setShowVerifyModal(true)}
                      className="rounded-xl gap-1.5 text-xs font-semibold h-9 border-blue-300 text-blue-600 hover:bg-blue-50">
                      <ShieldCheck className="w-3.5 h-3.5" />{t("Get Verified", "احصل على التوثيق")}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {isAuthenticated ? (
                    <div className="flex flex-col items-end gap-1">
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
                    {followsBack && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />{t("Follows you", "يتابعك")}
                      </span>
                    )}
                  </div>
                  ) : (
                    <Link href="/signin">
                      <Button size="sm" className="rounded-xl gap-1.5 text-xs font-semibold h-9">
                        <UserPlus className="w-3.5 h-3.5" />{t("Follow", "متابعة")}
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setShowMessage(true)}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  {/* ··· More actions menu (Block / Mute / Report) */}
                  {isAuthenticated && (
                    <div className="relative" ref={otherMenuRef}>
                      <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setShowOtherMenu(v => !v)}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {showOtherMenu && (
                        <div className="absolute end-0 top-11 w-48 bg-card border border-border rounded-xl shadow-xl py-1 z-30">
                          <button
                            onClick={() => muteMut.mutate()}
                            disabled={muteMut.isPending}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary text-start"
                          >
                            <VolumeX className="w-4 h-4 text-muted-foreground" />{t("Mute User", "كتم المستخدم")}
                          </button>
                          <button
                            onClick={() => blockMut.mutate()}
                            disabled={blockMut.isPending}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary text-destructive text-start"
                          >
                            <UserX className="w-4 h-4" />{t("Block User", "حظر المستخدم")}
                          </button>
                          <div className="border-t border-border my-1" />
                          <button
                            onClick={() => { setShowOtherMenu(false); toast.success(t("Report submitted. We'll review it shortly.", "تم إرسال البلاغ. سنراجعه قريباً.")); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary text-muted-foreground text-start"
                          >
                            <Flag className="w-4 h-4" />{t("Report Profile", "الإبلاغ عن الملف")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
          <StatPill label={t("Followers", "المتابعون")} value={followerCount} onClick={() => setFollowListType("followers")} />
          <StatPill label={t("Following", "يتابع")}    value={followingCount} onClick={() => setFollowListType("following")} />
          <StatPill label={t("Reviews", "تقييمات")}    value={reviewCount}    onClick={() => setTab("reviews")} />
          <StatPill label={t("Visits", "زيارات")}      value={bookingCount}   onClick={() => setTab("visits")} />
        </div>

        {/* ── FOLLOW REQUESTS (own private account) ──────────────────────────── */}
        {isOwn && user.isPrivate && (
          <div className="mb-2">
            <button
              onClick={() => setShowFollowRequests(v => !v)}
              className="w-full flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-2"
            >
              <UserCheck className="w-4 h-4" />
              {t("Manage Follow Requests", "إدارة طلبات المتابعة")}
              <ChevronRight className={`w-4 h-4 ms-auto transition-transform ${showFollowRequests ? "rotate-90" : ""}`} />
            </button>
            {showFollowRequests && (
              <FollowRequestsPanel lang={lang} onDone={() => setShowFollowRequests(false)} />
            )}
          </div>
        )}

        {/* ── STORIES BAR ──────────────────────────────────────────────────────── */}
        {!isPrivateLocked && (
          <UserStoriesBar userId={user.id} username={user.username ?? username} isOwn={isOwn} lang={lang} />
        )}

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

                  {/* Food Journey Insights */}
                  <FoodJourneyInsights reviews={reviews} visits={visits} checkins={checkins} lang={lang} t={t} />

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
            <div className="space-y-5">
              {/* Reservations section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t("Reservations", "الحجوزات")}
                    {visits.length > 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{visits.length}</span>}
                  </h3>
                  {isOwn && (
                    <Link href="/bookings">
                      <span className="text-xs text-primary font-semibold hover:underline">{t("Book a table", "احجز طاولة")}</span>
                    </Link>
                  )}
                </div>
                {visits.length === 0 ? (
                  <div className="text-center py-8 space-y-2 bg-card border border-border rounded-xl">
                    <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">{isOwn ? t("No reservations yet", "لا توجد حجوزات بعد") : t("No public visits.", "لا توجد زيارات عامة.")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visits.map((v, i) => <VisitItem key={i} v={v} lang={lang} />)}
                  </div>
                )}
              </div>

              {/* Check-ins section (own only) */}
              {isOwn && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      {t("Check-ins", "تسجيلات الحضور")}
                      {checkins.length > 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{checkins.length}</span>}
                    </h3>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 h-8" onClick={() => setShowCheckinModal(true)}>
                      <PlusCircle className="w-3.5 h-3.5" />{t("Log Visit", "سجّل زيارة")}
                    </Button>
                  </div>
                  {checkins.length === 0 ? (
                    <div className="text-center py-10 space-y-3 bg-card border border-border rounded-xl">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto">
                        <MapPin className="w-6 h-6 text-green-600/60" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t("No check-ins yet", "لا توجد تسجيلات بعد")}</p>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={() => setShowCheckinModal(true)}>
                        <PlusCircle className="w-3.5 h-3.5" />{t("Log Your First Visit", "سجّل أول زيارة")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {checkins.map((c: any) => (
                        <CheckInCard key={c.id} c={c} lang={lang} onDelete={() => deleteCheckinMut.mutate(c.id)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FAVORITES */}
          {tab === "favorites" && (
            <div className="space-y-5">
              {!isOwn ? (
                <div className="text-center py-16 space-y-2">
                  <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-muted-foreground">{t("Favorites are private", "المفضلة خاصة")}</p>
                  <p className="text-sm text-muted-foreground/70">{t("Only the account owner can see their saved items.", "فقط صاحب الحساب يمكنه رؤية العناصر المحفوظة.")}</p>
                </div>
              ) : (
                <>
                  {/* Saved restaurants */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-primary" />
                        {t("Saved Restaurants", "المطاعم المحفوظة")}
                        {savedRestaurants.length > 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{savedRestaurants.length}</span>}
                      </h3>
                      <Link href="/restaurants">
                        <span className="text-xs text-primary font-semibold hover:underline">{t("Explore more", "استكشف المزيد")}</span>
                      </Link>
                    </div>
                    {savedRestaurants.length === 0 ? (
                      <div className="text-center py-10 space-y-2 bg-card border border-border rounded-xl">
                        <Bookmark className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm text-muted-foreground">{t("No saved restaurants yet", "لا توجد مطاعم محفوظة بعد")}</p>
                        <Link href="/restaurants"><Button size="sm" variant="outline" className="rounded-xl text-xs">{t("Browse Restaurants", "تصفح المطاعم")}</Button></Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedRestaurants.map((r: any) => (
                          <SavedRestCard key={r.id || r.restaurantId} r={r} lang={lang} onRemove={() => removeSavedRestMut.mutate(r.id || r.restaurantId)} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Saved dishes */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Soup className="w-4 h-4 text-amber-500" />
                      {t("Saved Dishes", "الأطباق المحفوظة")}
                      {savedDishes.length > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{savedDishes.length}</span>}
                    </h3>
                    {savedDishes.length === 0 ? (
                      <div className="text-center py-10 space-y-2 bg-card border border-border rounded-xl">
                        <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm text-muted-foreground">{t("No saved dishes yet", "لا توجد أطباق محفوظة بعد")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedDishes.map((d: any) => (
                          <SavedDishCard key={d.id || d.dishId} d={d} lang={lang} onRemove={() => removeSavedDishMut.mutate(d.dishId)} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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
            <div className="space-y-4">
              {isOwn && (
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" />
                    {t("Dining Plans", "خطط الطعام")}
                    {plans.length > 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{plans.length}</span>}
                  </h3>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 h-8" onClick={() => setShowPlanModal(true)}>
                    <PlusCircle className="w-3.5 h-3.5" />{t("New Plan", "خطة جديدة")}
                  </Button>
                </div>
              )}
              {!isOwn ? (
                <div className="text-center py-16 space-y-2">
                  <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-muted-foreground">{t("Plans are private", "الخطط خاصة")}</p>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-14 space-y-3 bg-card border border-border rounded-2xl">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto">
                    <Target className="w-7 h-7 text-primary/60" />
                  </div>
                  <p className="font-semibold text-muted-foreground">{t("No plans yet", "لا توجد خطط بعد")}</p>
                  <p className="text-sm text-muted-foreground/70">{t("Plan your next dining experience.", "خطط لتجربة طعامك القادمة.")}</p>
                  <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowPlanModal(true)}>
                    <PlusCircle className="w-3.5 h-3.5" />{t("Create Your First Plan", "أنشئ أول خطة")}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Active plans */}
                  {plans.filter(p => p.status !== "done").length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("Active", "نشطة")}</p>
                      {plans.filter(p => p.status !== "done").map(p => (
                        <PlanCard key={p.id} p={p} lang={lang}
                          onDelete={() => deletePlanMut.mutate(p.id)}
                          onMarkDone={() => markPlanDoneMut.mutate(p.id)} />
                      ))}
                    </div>
                  )}
                  {/* Done plans */}
                  {plans.filter(p => p.status === "done").length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("Completed", "مكتملة")}</p>
                      {plans.filter(p => p.status === "done").map(p => (
                        <PlanCard key={p.id} p={p} lang={lang} onDelete={() => deletePlanMut.mutate(p.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* RECOMMENDATIONS / PICKS */}
          {tab === "recommendations" && (
            <div className="space-y-4">
              {isOwn && (
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-primary" />
                    {t("My Picks", "توصياتي")}
                    {recommendations.length > 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{recommendations.length}</span>}
                  </h3>
                </div>
              )}
              {!isOwn ? (
                <div className="text-center py-16 space-y-2">
                  <ThumbsUp className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-muted-foreground">{t("No public picks", "لا توجد توصيات عامة")}</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-14 space-y-3 bg-card border border-border rounded-2xl">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto">
                    <ThumbsUp className="w-7 h-7 text-primary/60" />
                  </div>
                  <p className="font-semibold text-muted-foreground">{t("No recommendations yet", "لا توجد توصيات بعد")}</p>
                  <p className="text-sm text-muted-foreground/70">{t("Recommend your favourite restaurants and dishes.", "أوصِ بمطاعمك وأطباقك المفضلة.")}</p>
                  <p className="text-xs text-muted-foreground/50">{t("You can add picks from any restaurant or dish page.", "يمكنك إضافة توصيات من صفحة أي مطعم أو طبق.")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec: any) => (
                    <RecommendationCard key={rec.id} rec={rec} lang={lang} onDelete={() => deleteRecMut.mutate(rec.id)} />
                  ))}
                </div>
              )}
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

          {/* ACTIVITY */}
          {tab === "activity" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-bold">{t("Recent Activity", "النشاط الأخير")}</h3>
              </div>
              <ActivityFeed reviews={reviews} visits={visits} followerCount={followerCount} lang={lang} />
            </div>
          )}

          {/* DASHBOARD — own pro/chef */}
          {tab === "dashboard" && isOwn && isPro && <ProDashboard user={user} t={t} />}
        </div>
      </div>

      {/* Modals */}
      {followListType && (
        <FollowListModal
          userId={user.id}
          type={followListType}
          isOwn={isOwn}
          lang={lang}
          authUserId={authUser?.id}
          onClose={() => setFollowListType(null)}
        />
      )}
      {showVerifyModal && <VerificationModal lang={lang} onClose={() => setShowVerifyModal(false)} />}
      {showShare && <ShareModal username={user.username!} name={displayName} onClose={() => setShowShare(false)} />}
      {showMessage && !isOwn && <MessageModal user={user} lang={lang} onClose={() => setShowMessage(false)} />}
      {showUpgrade && (
        <UpgradeModal
          current={user.accountType}
          onUpgrade={(type) => upgradeMut.mutate(type)}
          onClose={() => setShowUpgrade(false)}
        />
      )}
      {showCheckinModal && (
        <LogCheckinModal
          lang={lang}
          onClose={() => setShowCheckinModal(false)}
          onSave={(data) => createCheckinMut.mutate(data)}
        />
      )}
      {showPlanModal && (
        <CreatePlanModal
          lang={lang}
          onClose={() => setShowPlanModal(false)}
          onSave={(data) => createPlanMut.mutate(data)}
        />
      )}
    </div>
  );
}
