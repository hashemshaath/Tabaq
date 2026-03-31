import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import {
  useGetUser, getGetUserQueryKey,
  useGetUserActivity, getGetUserActivityQueryKey,
  useGetUserFollowers, getGetUserFollowersQueryKey,
  useGetUserFollowing, getGetUserFollowingQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  User, Settings, ShieldCheck, MapPin, Calendar, Star,
  BookOpen, Clock, Users, AtSign, CheckCircle2, XCircle, Loader2,
  Gift, ChevronRight, Sparkles, Lock, UserPlus, UserMinus,
  Shield, Check, X, Heart, Bookmark, ListChecks, ThumbsUp,
  BarChart2, Globe, Ban, PlusCircle, Flame, Award, TrendingUp,
  Utensils, Camera, Trash2, Edit2, Share2, Bell, ChevronDown,
  Target, Plus, AlertCircle, MapPinOff, ArrowRight, Eye,
  Copy, Instagram, Link2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
  | "overview" | "visits" | "reviews" | "favorites"
  | "plans" | "recommendations" | "activity"
  | "followers" | "following" | "settings";

type VisibilityOption = "public" | "followers" | "only_me";

// ─── Constants ────────────────────────────────────────────────────────────────

const RESERVED_USERNAMES = ["tabaq", "admin", "api", "support", "help", "www", "mail", "root", "system", "official"];
const USERNAME_REGEX = /^[a-zA-Z0-9_\.]{3,30}$/;
const CONTENT_TYPES: Array<{ key: string; labelEn: string; labelAr: string }> = [
  { key: "visits",          labelEn: "Visited Places",    labelAr: "الأماكن المُزارة" },
  { key: "reviews",         labelEn: "Reviews",           labelAr: "التقييمات" },
  { key: "favorites",       labelEn: "Favourites",        labelAr: "المفضلة" },
  { key: "activity",        labelEn: "Activity Feed",     labelAr: "خلاصة النشاط" },
  { key: "plans",           labelEn: "Visit Plans",       labelAr: "خطط الزيارة" },
  { key: "recommendations", labelEn: "Recommendations",   labelAr: "التوصيات" },
];
const VISIBILITY_OPTIONS: Array<{ value: VisibilityOption; labelEn: string; labelAr: string; icon: React.FC<{ className?: string }> }> = [
  { value: "public",    labelEn: "Public",         labelAr: "عام",                 icon: Globe },
  { value: "followers", labelEn: "Followers Only", labelAr: "المتابعون فقط",       icon: Users },
  { value: "only_me",   labelEn: "Only Me",        labelAr: "أنا فقط",             icon: Lock },
];


type FollowRequest = { followerId: number; followerName?: string; followerAvatar?: string; followerUsername?: string; createdAt: string; };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateUsername(value: string): string | null {
  if (value.length < 3) return "At least 3 characters required";
  if (value.length > 30) return "Maximum 30 characters";
  if (!USERNAME_REGEX.test(value)) return "Only letters, numbers, underscores, and dots";
  if (value.startsWith(".") || value.endsWith(".")) return "Cannot start or end with a dot";
  if (value.includes("..")) return "No consecutive dots";
  if (RESERVED_USERNAMES.includes(value.toLowerCase())) return "This username is reserved";
  return null;
}

function fmtDate(dateStr: string, lang: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return dateStr; }
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${cls} ${i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, action }: { icon: React.FC<{ className?: string }>; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p className="font-semibold text-base text-foreground">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function PriorityBadge({ priority, t }: { priority: string; t: (en: string, ar: string) => string }) {
  const colors: Record<string, string> = {
    high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  const labels: Record<string, { en: string; ar: string }> = {
    high:   { en: "High",   ar: "عالية" },
    medium: { en: "Medium", ar: "متوسطة" },
    low:    { en: "Low",    ar: "منخفضة" },
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[priority] ?? colors.medium}`}>
      {t(labels[priority]?.en ?? "Medium", labels[priority]?.ar ?? "متوسطة")}
    </span>
  );
}

// ─── Check-in Dialog ──────────────────────────────────────────────────────────

function CheckInDialog({ onClose, onSave, t, lang }: {
  onClose: () => void;
  onSave: (data: { restaurantId: number; restaurantName: string; visitDate: string; visitTime: string; partySize: number; notes: string; companionNames: string }) => void;
  t: (en: string, ar: string) => string;
  lang: string;
}) {
  const [restaurantId, setRestaurantId] = useState(7);
  const [restaurantName, setRestaurantName] = useState("Nobu Riyadh");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]!);
  const [visitTime, setVisitTime] = useState("20:00");
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState("");
  const [companionNames, setCompanionNames] = useState("");

  const RESTAURANT_OPTIONS = [
    { id: 7,  nameEn: "Nobu Riyadh",       nameAr: "نوبو الرياض" },
    { id: 1,  nameEn: "Najd Village",       nameAr: "قرية نجد" },
    { id: 3,  nameEn: "Sushi Sama",         nameAr: "سوشي ساما" },
    { id: 8,  nameEn: "Nusr-Et Riyadh",     nameAr: "نصرت الرياض" },
    { id: 9,  nameEn: "La Petite Maison",   nameAr: "لا بيتيت ميزون" },
    { id: 2,  nameEn: "Lucine",             nameAr: "لوسين" },
    { id: 11, nameEn: "Zuma Riyadh",        nameAr: "زوما الرياض" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">{t("Log a Visit", "سجّل زيارة")}</h2>
              <p className="text-xs text-muted-foreground">{t("Add this restaurant to your food journey", "أضف هذا المطعم لرحلتك الغذائية")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Restaurant", "المطعم")}</label>
            <select
              value={restaurantId}
              onChange={e => {
                const id = parseInt(e.target.value);
                const r = RESTAURANT_OPTIONS.find(r => r.id === id);
                setRestaurantId(id);
                setRestaurantName(lang === "ar" ? (r?.nameAr ?? "") : (r?.nameEn ?? ""));
              }}
              className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {RESTAURANT_OPTIONS.map(r => (
                <option key={r.id} value={r.id}>{lang === "ar" ? r.nameAr : r.nameEn}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("Visit Date", "تاريخ الزيارة")}</label>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
                className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("Time", "الوقت")}</label>
              <input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)}
                className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Party Size", "عدد الأشخاص")}</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-9 h-9 rounded-full border border-input flex items-center justify-center hover:bg-muted text-lg font-bold">−</button>
              <span className="w-8 text-center font-semibold text-lg">{partySize}</span>
              <button onClick={() => setPartySize(Math.min(20, partySize + 1))} className="w-9 h-9 rounded-full border border-input flex items-center justify-center hover:bg-muted text-lg font-bold">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("With (optional)", "مع (اختياري)")}</label>
            <input type="text" value={companionNames} onChange={e => setCompanionNames(e.target.value)}
              placeholder={t("Ahmad, Sara...", "أحمد، سارة...")}
              className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Notes (optional)", "ملاحظات (اختيارية)")}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder={t("How was the experience?", "كيف كانت التجربة؟")}
              className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
          <Button className="flex-1 rounded-xl gap-2" onClick={() => { onSave({ restaurantId, restaurantName, visitDate, visitTime, partySize, notes, companionNames }); onClose(); }}>
            <Check className="w-4 h-4" />{t("Log Visit", "تسجيل الزيارة")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Dialog ──────────────────────────────────────────────────────────────

function PlanDialog({ onClose, onSave, t, lang }: {
  onClose: () => void;
  onSave: (data: { title: string; restaurantId: number | null; restaurantName: string; plannedDate: string; notes: string; priority: string; themeLabel: string; reminderEnabled: boolean }) => void;
  t: (en: string, ar: string) => string;
  lang: string;
}) {
  const [title, setTitle] = useState("");
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [plannedDate, setPlannedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [themeLabel, setThemeLabel] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const RESTAURANT_OPTIONS = [
    { id: 7,  nameEn: "Nobu Riyadh",       nameAr: "نوبو الرياض" },
    { id: 1,  nameEn: "Najd Village",       nameAr: "قرية نجد" },
    { id: 3,  nameEn: "Sushi Sama",         nameAr: "سوشي ساما" },
    { id: 8,  nameEn: "Nusr-Et Riyadh",     nameAr: "نصرت الرياض" },
    { id: 9,  nameEn: "La Petite Maison",   nameAr: "لا بيتيت ميزون" },
    { id: 11, nameEn: "Zuma Riyadh",        nameAr: "زوما الرياض" },
  ];

  const THEME_OPTIONS = ["", "Special Occasion", "Date Night", "Weekend Brunch", "Business Lunch", "Food Theme Week", "Family Gathering", "Michelin Hunt"];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">{t("Add Visit Plan", "إضافة خطة زيارة")}</h2>
              <p className="text-xs text-muted-foreground">{t("Plan your next food experience", "خطط لتجربتك الغذائية القادمة")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Plan Title *", "عنوان الخطة *")}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t("e.g. Truffle Season Dinner", "مثال: عشاء موسم الكمأة")}
              className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Restaurant (optional)", "المطعم (اختياري)")}</label>
            <select value={restaurantId ?? ""} onChange={e => setRestaurantId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">{t("No specific restaurant", "بدون مطعم محدد")}</option>
              {RESTAURANT_OPTIONS.map(r => <option key={r.id} value={r.id}>{lang === "ar" ? r.nameAr : r.nameEn}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("Planned Date", "التاريخ المخطط")}</label>
              <input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)}
                className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("Priority", "الأولوية")}</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="high">{t("High", "عالية")}</option>
                <option value="medium">{t("Medium", "متوسطة")}</option>
                <option value="low">{t("Low", "منخفضة")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Theme (optional)", "الموضوع (اختياري)")}</label>
            <select value={themeLabel} onChange={e => setThemeLabel(e.target.value)}
              className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {THEME_OPTIONS.map(o => <option key={o} value={o}>{o || t("None", "لا شيء")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Notes", "ملاحظات")}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder={t("Any special requirements or reminders...", "أي متطلبات خاصة أو تذكيرات...")}
              className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${reminderEnabled ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${reminderEnabled ? "start-6" : "start-1"}`} />
            </button>
            <span className="text-sm font-medium">{t("Enable reminder", "تفعيل التذكير")}</span>
          </label>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
          <Button className="flex-1 rounded-xl gap-2" disabled={!title.trim()} onClick={() => {
            if (!title.trim()) return;
            const r = RESTAURANT_OPTIONS.find(r => r.id === restaurantId);
            onSave({ title: title.trim(), restaurantId, restaurantName: lang === "ar" ? (r?.nameAr ?? "") : (r?.nameEn ?? ""), plannedDate, notes, priority, themeLabel, reminderEnabled });
            onClose();
          }}>
            <Plus className="w-4 h-4" />{t("Add Plan", "إضافة الخطة")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Profile Dialog ──────────────────────────────────────────────────────

function EditProfileDialog({ user, onClose, onSave, t, lang }: {
  user: any;
  onClose: () => void;
  onSave: (data: { nameEn?: string; nameAr?: string; bio?: string; cityId?: number }) => void;
  t: (en: string, ar: string) => string;
  lang: string;
}) {
  const [nameEn, setNameEn] = useState(user.nameEn ?? "");
  const [nameAr, setNameAr] = useState(user.nameAr ?? "");
  const [bio, setBio] = useState(user.bio ?? "");

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-foreground">{t("Edit Profile", "تعديل الملف الشخصي")}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Name (English)", "الاسم (إنجليزي)")}</label>
            <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)}
              className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Name (Arabic)", "الاسم (عربي)")}</label>
            <input type="text" value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl"
              className="w-full h-10 px-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("Bio", "النبذة التعريفية")}</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200}
              placeholder={t("Tell your food story...", "احكِ قصتك الغذائية...")}
              className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <p className="text-xs text-muted-foreground mt-1 text-end">{bio.length}/200</p>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
          <Button className="flex-1 rounded-xl gap-2" onClick={() => { onSave({ nameEn, nameAr, bio }); onClose(); }}>
            <Check className="w-4 h-4" />{t("Save Changes", "حفظ التغييرات")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Privacy Card ──────────────────────────────────────────────────────────────

function PrivacyCard({ isPrivate, onToggle, t }: { isPrivate: boolean; onToggle: () => void; t: (en: string, ar: string) => string }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{t("Account Privacy", "خصوصية الحساب")}</h3>
          <p className="text-xs text-muted-foreground">{t("Control who can follow and view your profile", "تحكم في من يمكنه المتابعة ومشاهدة ملفك")}</p>
        </div>
      </div>
      <div className="p-5">
        <label className="flex items-center justify-between gap-4 cursor-pointer" onClick={onToggle}>
          <div>
            <p className="font-medium text-foreground text-sm">{t("Private Account", "حساب خاص")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPrivate
                ? t("Only approved followers can see your content", "فقط المتابعون المعتمدون يمكنهم رؤية محتواك")
                : t("Anyone can view your profile and content", "يمكن لأي شخص رؤية ملفك ومحتواك")}
            </p>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isPrivate ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isPrivate ? "start-7" : "start-1"}`} />
          </div>
        </label>
      </div>
    </div>
  );
}

// ─── Social Links Card (Settings) ─────────────────────────────────────────────

interface SocialLinksCardProps {
  user: any;
  onSave: (links: Record<string, string>) => Promise<void>;
  t: (en: string, ar: string) => string;
  lang: string;
}

function SocialLinksCard({ user, onSave, t }: SocialLinksCardProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vals, setVals] = useState({
    instagramUrl: user?.instagramUrl ?? "",
    xUrl: user?.xUrl ?? "",
    tiktokUrl: user?.tiktokUrl ?? "",
    snapchatUrl: user?.snapchatUrl ?? "",
    websiteUrl: user?.websiteUrl ?? "",
    location: user?.location ?? "",
    coverPhotoUrl: user?.coverPhotoUrl ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(vals);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        className="w-full p-5 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-grow text-start">
          <h3 className="font-bold text-foreground text-sm">{t("Social Links & Info", "الروابط الاجتماعية والمعلومات")}</h3>
          <p className="text-xs text-muted-foreground">{t("Instagram, X, TikTok, Snapchat, website, location", "انستقرام، إكس، تيك توك، سناب شات، الموقع والمدينة")}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border space-y-3 pt-4">
          {[
            { key: "location", label: t("Location / City", "المدينة / الموقع"), placeholder: t("Riyadh, KSA", "الرياض، المملكة"), icon: <MapPin className="w-4 h-4 text-muted-foreground" /> },
            { key: "coverPhotoUrl", label: t("Cover Photo URL", "رابط صورة الغلاف"), placeholder: "https://...", icon: <Camera className="w-4 h-4 text-muted-foreground" /> },
            { key: "instagramUrl", label: "Instagram", placeholder: "@username", icon: <Instagram className="w-4 h-4 text-muted-foreground" /> },
            { key: "xUrl", label: "X (Twitter)", placeholder: "@username", icon: <span className="text-xs font-black text-muted-foreground">𝕏</span> },
            { key: "tiktokUrl", label: "TikTok", placeholder: "@username", icon: <span className="text-xs font-black text-muted-foreground">♪</span> },
            { key: "snapchatUrl", label: "Snapchat", placeholder: "@username", icon: <span className="text-base">👻</span> },
            { key: "websiteUrl", label: t("Website", "الموقع الإلكتروني"), placeholder: "https://...", icon: <Link2 className="w-4 h-4 text-muted-foreground" /> },
          ].map(field => (
            <div key={field.key} className="flex items-center gap-3">
              <div className="w-8 flex justify-center shrink-0">{field.icon}</div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                <input
                  type="text"
                  value={vals[field.key as keyof typeof vals]}
                  onChange={e => setVals(v => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-secondary rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          ))}
          <Button
            className="w-full mt-2 rounded-xl gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saved ? t("Saved!", "تم الحفظ!") : t("Save Changes", "حفظ التغييرات")}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfilePage() {
  const { t, lang } = useLanguage();
  const { user: authUser, isLoading: authLoading, token } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [localCheckIns, setLocalCheckIns] = useState<any[]>([]);
  const [localPlans, setLocalPlans] = useState<any[]>([]);
  const [favFilter, setFavFilter] = useState<"restaurants" | "dishes">("restaurants");
  const [reviewFilter, setReviewFilter] = useState<"all" | "restaurant" | "dish">("all");
  const [isPrivate, setIsPrivate] = useState(false);
  const [contentPrivacy, setContentPrivacy] = useState<Record<string, VisibilityOption>>({
    visits: "public", reviews: "public", favorites: "public",
    activity: "public", plans: "followers", recommendations: "public",
  });
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  // Social sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);

  // Username state
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClient = useQueryClient();
  const userId = authUser?.id ?? 0;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data, isLoading, refetch: refetchUser } = useGetUser(userId, {
    query: { queryKey: getGetUserQueryKey(userId), enabled: !!authUser },
  });

  const { data: activityData } = useGetUserActivity(userId, undefined, {
    query: { queryKey: getGetUserActivityQueryKey(userId, undefined), enabled: !!authUser && tab === "activity" },
    request: authHeaders ? { headers: authHeaders } : undefined,
  });

  const { data: followersData } = useGetUserFollowers(userId, {
    query: { queryKey: getGetUserFollowersQueryKey(userId), enabled: !!authUser },
  });

  const { data: followingData } = useGetUserFollowing(userId, {
    query: { queryKey: getGetUserFollowingQueryKey(userId), enabled: !!authUser },
  });

  // Real API queries for profile features
  const { data: checkInsData, refetch: refetchCheckIns } = useQuery({
    queryKey: ["me-checkins"],
    queryFn: async () => { const r = await fetch("/api/me/checkins", { headers: getAuthHeaders() }); return r.ok ? r.json() : []; },
    enabled: !!authUser,
  });
  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ["me-plans"],
    queryFn: async () => { const r = await fetch("/api/me/plans", { headers: getAuthHeaders() }); return r.ok ? r.json() : []; },
    enabled: !!authUser,
  });
  const { data: savedRestaurantsData } = useQuery({
    queryKey: ["me-saved-restaurants"],
    queryFn: async () => { const r = await fetch("/api/me/saved-restaurants", { headers: getAuthHeaders() }); return r.ok ? r.json() : []; },
    enabled: !!authUser,
  });
  const { data: savedDishesData, refetch: refetchSavedDishes } = useQuery({
    queryKey: ["me-saved-dishes"],
    queryFn: async () => { const r = await fetch("/api/me/saved-dishes", { headers: getAuthHeaders() }); return r.ok ? r.json() : []; },
    enabled: !!authUser,
  });
  const { data: recommendationsData, refetch: refetchRecs } = useQuery({
    queryKey: ["me-recommendations"],
    queryFn: async () => { const r = await fetch("/api/me/recommendations", { headers: getAuthHeaders() }); return r.ok ? r.json() : []; },
    enabled: !!authUser,
  });
  const { data: reviewsData } = useQuery({
    queryKey: ["user-reviews", userId],
    queryFn: async () => { const r = await fetch(`/api/users/${userId}/reviews`); return r.ok ? r.json() : []; },
    enabled: !!authUser && userId > 0,
  });
  const { data: blockedUsersData, refetch: refetchBlocked } = useQuery({
    queryKey: ["me-blocked-users"],
    queryFn: async () => { const r = await fetch("/api/me/blocked-users", { headers: getAuthHeaders() }); return r.ok ? r.json() : []; },
    enabled: !!authUser && tab === "settings",
  });
  const { data: contentPrivacyData, refetch: refetchContentPrivacy } = useQuery({
    queryKey: ["me-content-privacy"],
    queryFn: async () => { const r = await fetch("/api/me/content-privacy", { headers: getAuthHeaders() }); return r.ok ? r.json() : null; },
    enabled: !!authUser,
  });

  const followingIds = new Set<number>((followingData ?? []).map((u: any) => u.id));

  const followMutation = useMutation({
    mutationFn: async ({ targetId, action }: { targetId: number; action: "follow" | "unfollow" }) => {
      const method = action === "follow" ? "POST" : "DELETE";
      await fetch(`/api/users/${targetId}/follow`, { method, headers: getAuthHeaders() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetUserFollowersQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: getGetUserFollowingQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (targetId: number) => {
      await fetch(`/api/users/${targetId}/block`, { method: "DELETE", headers: getAuthHeaders() });
    },
    onSuccess: () => refetchBlocked(),
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      if (authUser) {
        await fetch(`/api/me/plans/${planId}`, { method: "DELETE", headers: getAuthHeaders() });
        refetchPlans();
      } else {
        setLocalPlans(prev => prev.filter(p => p.id !== planId));
      }
    },
  });

  const deleteCheckInMutation = useMutation({
    mutationFn: async (checkInId: number) => {
      if (authUser) {
        await fetch(`/api/me/checkins/${checkInId}`, { method: "DELETE", headers: getAuthHeaders() });
        refetchCheckIns();
      } else {
        setLocalCheckIns(prev => prev.filter(c => c.id !== checkInId));
      }
    },
  });

  const togglePlanStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (authUser) {
        await fetch(`/api/me/plans/${id}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ status }) });
        refetchPlans();
      } else {
        setLocalPlans(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      }
    },
  });

  // Pre-fill username
  useEffect(() => {
    if (data?.user && (data.user as any).username) setUsernameInput((data.user as any).username);
    if (data?.user && typeof (data.user as any).isPrivate === "boolean") setIsPrivate((data.user as any).isPrivate);
  }, [data]);

  // Sync content privacy from API
  useEffect(() => {
    if (contentPrivacyData) setContentPrivacy(contentPrivacyData);
  }, [contentPrivacyData]);

  // Debounced username check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = usernameInput.trim().toLowerCase();
    const validErr = validateUsername(val);
    if (!val) { setUsernameStatus("idle"); setUsernameError(null); return; }
    if (validErr) { setUsernameStatus("error"); setUsernameError(validErr); return; }
    const currentUsername = (data?.user as any)?.username;
    if (currentUsername && val === currentUsername.toLowerCase()) { setUsernameStatus("available"); setUsernameError(null); return; }
    setUsernameStatus("checking"); setUsernameError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?username=${encodeURIComponent(val)}`);
        const json = await res.json();
        setUsernameStatus(json.available ? "available" : "taken");
        if (!json.available) setUsernameError("This username is already taken");
      } catch { setUsernameStatus("error"); setUsernameError("Could not check availability"); }
    }, 500);
  }, [usernameInput, data]);

  const handleSaveUsername = async () => {
    if (usernameStatus !== "available") return;
    setUsernameSaving(true);
    try {
      const res = await fetch("/api/me/username", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ username: usernameInput.trim().toLowerCase() }) });
      if (res.ok) { setUsernameSaved(true); setUsernameStatus("idle"); refetchUser(); setTimeout(() => setUsernameSaved(false), 3000); }
      else { const err = await res.json(); setUsernameError(err?.message || "Failed to save username"); }
    } catch { setUsernameError("Network error — please try again"); }
    finally { setUsernameSaving(false); }
  };

  const handlePrivacyToggle = async () => {
    const next = !isPrivate;
    setIsPrivate(next);
    if (authUser) await fetch("/api/me/privacy", { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ isPrivate: next }) });
  };

  const handleSaveContentPrivacy = async () => {
    setPrivacySaving(true);
    try {
      if (authUser) await fetch("/api/me/content-privacy", { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(contentPrivacy) });
      setPrivacySaved(true); setTimeout(() => setPrivacySaved(false), 3000);
    } finally { setPrivacySaving(false); }
  };

  const handleAddCheckIn = async (data: any) => {
    if (authUser) {
      await fetch("/api/me/checkins", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ restaurantId: data.restaurantId, visitDate: data.visitDate, visitTime: data.visitTime, partySize: data.partySize, notes: data.notes, companionNames: data.companionNames }) });
      refetchCheckIns();
    } else {
      setLocalCheckIns(prev => [{ id: Date.now(), restaurantId: data.restaurantId, restaurantNameEn: data.restaurantName, restaurantNameAr: data.restaurantName, restaurantCoverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", restaurantCuisineEn: "Restaurant", visitDate: data.visitDate, visitTime: data.visitTime, partySize: data.partySize, notes: data.notes, companionNames: data.companionNames }, ...prev]);
    }
  };

  const handleAddPlan = async (data: any) => {
    if (authUser) {
      await fetch("/api/me/plans", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
      refetchPlans();
    } else {
      setLocalPlans(prev => [{ id: Date.now(), restaurantId: data.restaurantId, restaurantNameEn: data.restaurantName, restaurantNameAr: data.restaurantName, restaurantCoverImage: null, title: data.title, plannedDate: data.plannedDate, notes: data.notes, priority: data.priority, status: "active", themeLabel: data.themeLabel || null, reminderEnabled: data.reminderEnabled }, ...prev]);
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  if (authLoading) return (
    <div className="min-h-screen p-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!authUser) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t("Sign in to view your profile", "سجّل الدخول لعرض ملفك الشخصي")}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {t("Track your visits, reviews, bookings, and food journey all in one place.", "تابع زياراتك وتقييماتك وحجوزاتك ورحلتك الغذائية في مكان واحد.")}
        </p>
        <Link href="/signin" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
          {t("Sign In", "تسجيل الدخول")}
        </Link>
      </div>
    </div>
  );

  const effectiveData = data;
  const effectiveFollowers: any[] = followersData ?? [];
  const effectiveFollowing: any[] = followingData ?? [];
  const effectiveActivity = activityData;
  const effectiveCheckIns: any[] = checkInsData ?? [];
  const effectivePlans: any[] = plansData ?? [];
  const effectiveSavedRestaurants: any[] = savedRestaurantsData ?? [];
  const effectiveSavedDishes: any[] = savedDishesData ?? [];
  const effectiveReviews: any[] = reviewsData ?? [];
  const effectiveRecommendations: any[] = recommendationsData ?? [];
  const effectiveBlockedUsers: any[] = blockedUsersData ?? [];

  if (isLoading || !data?.user) return (
    <div className="min-h-screen p-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { user, reviewCount, bookingCount, followerCount, followingCount } = effectiveData!;
  const name = lang === "ar" ? user.nameAr || user.nameEn : user.nameEn || user.nameAr;
  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const levelMax = user.level === 5 ? 10000 : user.level === 4 ? 5000 : user.level === 3 ? 1500 : user.level === 2 ? 500 : 100;
  const levelMin = user.level === 5 ? 5000 : user.level === 4 ? 1500 : user.level === 3 ? 500 : user.level === 2 ? 100 : 0;
  const progressPct = Math.min(((user.points - levelMin) / (levelMax - levelMin)) * 100, 100);
  const currentUsername = (user as any).username as string | undefined;

  // Food journey insights (computed from mock/real data)
  const cuisineCount: Record<string, number> = {};
  for (const ci of effectiveCheckIns) { const c = ci.restaurantCuisineEn ?? "Other"; cuisineCount[c] = (cuisineCount[c] ?? 0) + 1; }
  const topCuisines = Object.entries(cuisineCount).sort(([, a], [, b]) => b - a).slice(0, 4);
  const maxCuisineCount = topCuisines[0]?.[1] ?? 1;

  const activePlans = effectivePlans.filter(p => p.status === "active");
  const completedPlans = effectivePlans.filter(p => p.status === "completed");
  const filteredReviews = effectiveReviews.filter(r => reviewFilter === "all" ? true : reviewFilter === "dish" ? !!r.dishId : !r.dishId);

  const TABS: Array<{ id: Tab; labelEn: string; labelAr: string; icon: React.FC<{ className?: string }> }> = [
    { id: "overview",        labelEn: "Overview",         labelAr: "نظرة عامة",  icon: BarChart2 },
    { id: "visits",          labelEn: "Visits",           labelAr: "الزيارات",   icon: MapPin },
    { id: "reviews",         labelEn: "Reviews",          labelAr: "التقييمات",  icon: Star },
    { id: "favorites",       labelEn: "Favourites",       labelAr: "المفضلة",    icon: Heart },
    { id: "plans",           labelEn: "Plans",            labelAr: "الخطط",      icon: ListChecks },
    { id: "recommendations", labelEn: "Recommends",       labelAr: "التوصيات",   icon: ThumbsUp },
    { id: "activity",        labelEn: "Activity",         labelAr: "النشاط",     icon: Clock },
    { id: "followers",       labelEn: "Followers",        labelAr: "المتابعون",  icon: Users },
    { id: "following",       labelEn: "Following",        labelAr: "يتابع",      icon: Users },
    { id: "settings",        labelEn: "Settings",         labelAr: "الإعدادات",  icon: Settings },
  ];

  const usernameStatusIcon = () => {
    if (usernameStatus === "checking") return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    if (usernameStatus === "available") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (usernameStatus === "taken" || usernameStatus === "error") return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Dialogs */}
      {showCheckInDialog && <CheckInDialog onClose={() => setShowCheckInDialog(false)} onSave={handleAddCheckIn} t={t} lang={lang} />}
      {showPlanDialog && <PlanDialog onClose={() => setShowPlanDialog(false)} onSave={handleAddPlan} t={t} lang={lang} />}
      {showEditProfile && <EditProfileDialog user={user} onClose={() => setShowEditProfile(false)} onSave={async (d) => { if (authUser) { await fetch("/api/me/profile", { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify(d) }); refetchUser(); } }} t={t} lang={lang} />}
      {/* Share modal */}
      {showShareModal && currentUsername && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-md mx-4 mb-4 sm:mb-0 shadow-2xl">
            <h3 className="font-extrabold text-lg text-foreground mb-1">{t("Share Your Profile", "شارك ملفك الشخصي")}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t("Let others discover your food journey", "دع الآخرين يكتشفون رحلتك الطهوية")}</p>
            <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3 mb-5">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1 truncate font-mono">{`${window.location.origin}/user/${currentUsername}`}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/user/${currentUsername}`); setProfileLinkCopied(true); setTimeout(() => setProfileLinkCopied(false), 2000); }}>
                {profileLinkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <a href={`https://wa.me/?text=Check out my food profile on Tabaq: ${window.location.origin}/user/${currentUsername}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 rounded-2xl py-3 flex flex-col items-center gap-1.5 text-white hover:opacity-90 transition-opacity">
                <span className="text-xl">📱</span><span className="text-xs font-medium">WhatsApp</span>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=My food journey on Tabaq&url=${window.location.origin}/user/${currentUsername}`} target="_blank" rel="noopener noreferrer" className="bg-black rounded-2xl py-3 flex flex-col items-center gap-1.5 text-white hover:opacity-90 transition-opacity">
                <span className="text-xl font-black">𝕏</span><span className="text-xs font-medium">X</span>
              </a>
            </div>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setShowShareModal(false)}>{t("Close", "إغلاق")}</Button>
          </div>
        </div>
      )}

      {/* Cover */}
      <div className="h-52 md:h-72 w-full relative overflow-hidden bg-gradient-to-br from-rose-900 via-primary to-rose-600">
        {(user as any).coverPhotoUrl && (
          <img src={(user as any).coverPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Subtle food pattern overlay */}
        {!(user as any).coverPhotoUrl && (
          <>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </>
        )}
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/20 to-transparent" />
        {/* Action buttons */}
        <div className="absolute top-4 end-4 flex gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/user/${currentUsername ?? ""}`); setProfileLinkCopied(true); setTimeout(() => setProfileLinkCopied(false), 2000); }}
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-black/60 transition-all"
          >
            {profileLinkCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {profileLinkCopied ? t("Copied!", "تم النسخ!") : t("Copy Link", "نسخ الرابط")}
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-black/60 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            {t("Share", "مشاركة")}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-card rounded-3xl p-6 md:p-8 shadow-2xl border border-border -mt-20 md:-mt-28 relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-start">
          {/* Avatar */}
          <div className="relative shrink-0 -mt-4 md:-mt-16">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-muted border-[3px] border-card shadow-xl overflow-hidden ring-4 ring-primary/10">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={name || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-primary/40" />
                </div>
              )}
            </div>
            {!!authUser && (
              <button
                onClick={() => setShowEditProfile(true)}
                className="absolute bottom-1 end-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors ring-2 ring-card"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-grow">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  {name}
                  {user.isVerified && <ShieldCheck className="w-6 h-6 text-primary" />}
                  {user.isEmailVerified && (
                    <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                      {t("Verified", "مُحقَّق")}
                    </span>
                  )}
                  {isPrivate && (
                    <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />{t("Private", "خاص")}
                    </span>
                  )}
                </h1>
                {currentUsername && (
                  <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5 justify-center md:justify-start">
                    <AtSign className="w-3.5 h-3.5" />{currentUsername}
                  </p>
                )}
                <p className="text-muted-foreground mt-2 max-w-lg text-sm">
                  {user.bio || t("No bio provided.", "لم تتم كتابة نبذة بعد.")}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm font-medium text-muted-foreground flex-wrap">
                  {(user as any).location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />{(user as any).location}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />{t("Riyadh, KSA", "الرياض، المملكة")}
                    </span>
                  )}
                  {joinYear && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />{t(`Joined ${joinYear}`, `انضم ${joinYear}`)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    {effectiveCheckIns.length} {t("visits", "زيارة")}
                  </span>
                  {currentUsername && (
                    <Link href={`/user/${currentUsername}`} className="flex items-center gap-1 text-primary hover:opacity-70 transition-opacity">
                      <Globe className="w-4 h-4" />{t("Public profile", "الملف العام")}
                    </Link>
                  )}
                </div>

                {/* Social media links */}
                {((user as any).instagramUrl || (user as any).xUrl || (user as any).tiktokUrl || (user as any).snapchatUrl || (user as any).websiteUrl) && (
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                    {(user as any).instagramUrl && (
                      <a href={`https://instagram.com/${String((user as any).instagramUrl).replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {(user as any).xUrl && (
                      <a href={`https://x.com/${String((user as any).xUrl).replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                        <span className="text-sm font-black">𝕏</span>
                      </a>
                    )}
                    {(user as any).tiktokUrl && (
                      <a href={`https://tiktok.com/@${String((user as any).tiktokUrl).replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                        <span className="text-sm font-black">♪</span>
                      </a>
                    )}
                    {(user as any).snapchatUrl && (
                      <a href={`https://snapchat.com/add/${String((user as any).snapchatUrl).replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                        <span className="text-base">👻</span>
                      </a>
                    )}
                    {(user as any).websiteUrl && (
                      <a href={(user as any).websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                        <Link2 className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />{t("Edit Profile", "تعديل الملف")}
                </button>
                <Link href="/account">
                  <button className="flex items-center gap-2 px-3.5 py-2 border border-input rounded-xl text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("Settings", "الإعدادات")}</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8 pt-6 border-t border-border">
              {[
                { val: effectiveCheckIns.length, enLabel: "Visits", arLabel: "زيارات", tab: "visits" as Tab },
                { val: reviewCount ?? effectiveReviews.length, enLabel: "Reviews", arLabel: "تقييمات", tab: "reviews" as Tab },
                { val: effectiveSavedRestaurants.length, enLabel: "Saved", arLabel: "محفوظات", tab: "favorites" as Tab },
                { val: followerCount ?? 0, enLabel: "Followers", arLabel: "متابعون", tab: "followers" as Tab },
                { val: followingCount ?? 0, enLabel: "Following", arLabel: "يتابع", tab: "following" as Tab },
                { val: user.points ?? 0, enLabel: "Points", arLabel: "نقاط", tab: null },
              ].map(({ val, enLabel, arLabel, tab: targetTab }) => (
                <button
                  key={enLabel}
                  className="text-center hover:opacity-70 transition-opacity"
                  onClick={() => targetTab && setTab(targetTab)}
                >
                  <div className="text-2xl font-bold text-foreground">{val}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{t(enLabel, arLabel)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Level Banner */}
        <div className="mt-5 relative overflow-hidden bg-gradient-to-r from-primary/8 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 shadow-inner">
                <Star className="w-5 h-5 text-primary fill-primary/50" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-widest text-primary/70">{t("Level", "المستوى")} {user.level}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{user.levelTitle}</span>
                  {user.credibilityScore && parseFloat(String(user.credibilityScore)) > 0 && (
                    <span className="text-xs text-muted-foreground">· {t("Credibility", "مصداقية")} {parseFloat(String(user.credibilityScore)).toFixed(1)}</span>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground mt-0.5">{user.points.toLocaleString()} {t("XP earned", "نقطة مكتسبة")}</p>
              </div>
            </div>
            <div className="w-full sm:w-52">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-primary font-bold">{progressPct}%</span>
                <span className="text-muted-foreground">{t(`${levelMax} XP to next`, `${levelMax} للمستوى التالي`)}</span>
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-rose-500 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="border-b border-border mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 min-w-max">
              {TABS.map(({ id, labelEn, labelAr, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${
                    tab === id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(labelEn, labelAr)}
                </button>
              ))}
            </div>
          </div>

          {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Quick actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: MapPin,    enLabel: "Log a Visit",        arLabel: "سجّل زيارة",      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", onClick: () => setShowCheckInDialog(true) },
                  { icon: Star,      enLabel: "Write Review",        arLabel: "اكتب تقييماً",    color: "bg-primary/10 text-primary",                                                  onClick: () => setTab("reviews") },
                  { icon: ListChecks,enLabel: "Add Plan",            arLabel: "أضف خطة",         color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",             onClick: () => setShowPlanDialog(true) },
                  { icon: ThumbsUp,  enLabel: "Recommend",           arLabel: "أوصِ",            color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",          onClick: () => setTab("recommendations") },
                ].map(({ icon: Icon, enLabel, arLabel, color, onClick }) => (
                  <button key={enLabel} onClick={onClick}
                    className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5 group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-center text-foreground">{t(enLabel, arLabel)}</span>
                  </button>
                ))}
              </div>

              {/* Top cuisines */}
              {topCuisines.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{t("Your Top Cuisines", "أكثر المطابخ التي زرتها")}</h3>
                      <p className="text-xs text-muted-foreground">{t("Based on your visit history", "بناءً على سجل زياراتك")}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {topCuisines.map(([cuisine, count]) => (
                      <div key={cuisine}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-foreground">{cuisine}</span>
                          <span className="text-muted-foreground">{count} {t("visits", "زيارة")}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(count / maxCuisineCount) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity preview */}
              <div className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground">{t("Recent Activity", "النشاط الأخير")}</h3>
                  </div>
                  <button onClick={() => setTab("activity")} className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-70">
                    {t("View all", "عرض الكل")} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {(effectiveActivity?.events ?? []).slice(0, 3).map((event: any, i: number) => {
                    const d = (event.data ?? {}) as Record<string, unknown>;
                    const rName = lang === "ar" ? (d.restaurantNameAr as string) || (d.restaurantNameEn as string) : (d.restaurantNameEn as string) || (d.restaurantNameAr as string);
                    const evDate = event.createdAt ? fmtDate(event.createdAt, lang) : "";
                    const icons: Record<string, React.FC<{ className?: string }>> = { review: Star, check_in: MapPin, bookmark: Heart, follow: UserPlus, booking: Calendar };
                    const IconC = icons[event.type as string] ?? Clock;
                    const bgColors: Record<string, string> = { review: "bg-primary/10 text-primary", check_in: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", bookmark: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400", follow: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", booking: "bg-muted text-muted-foreground" };
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColors[event.type as string] ?? "bg-muted text-muted-foreground"}`}>
                          <IconC className="w-4 h-4" />
                        </div>
                        <p className="text-sm text-foreground flex-grow min-w-0 truncate">
                          {event.type === "review" && t(`Reviewed ${rName}`, `قيّمت ${rName}`)}
                          {event.type === "check_in" && t(`Visited ${rName}`, `زرت ${rName}`)}
                          {event.type === "bookmark" && t(`Saved ${rName}`, `حفظت ${rName}`)}
                          {event.type === "follow" && t(`Followed ${lang === "ar" ? (d.nameAr as string) : (d.nameEn as string)}`, `تابعت ${lang === "ar" ? (d.nameAr as string) : (d.nameEn as string)}`)}
                          {event.type === "booking" && t(`Booked at ${rName}`, `حجزت في ${rName}`)}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">{evDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plans preview */}
              {activePlans.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-foreground">{t("Upcoming Plans", "الخطط القادمة")} <span className="text-muted-foreground text-sm">({activePlans.length})</span></h3>
                    </div>
                    <button onClick={() => setTab("plans")} className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-70">
                      {t("View all", "عرض الكل")} <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activePlans.slice(0, 2).map(plan => (
                      <div key={plan.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                        <ListChecks className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{plan.title}</p>
                          {plan.plannedDate && <p className="text-xs text-muted-foreground">{fmtDate(plan.plannedDate, lang)}</p>}
                        </div>
                        <PriorityBadge priority={plan.priority} t={t} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VISITS TAB ──────────────────────────────────────────────────── */}
          {tab === "visits" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("My Visit History", "سجل زياراتي")}</h2>
                  <p className="text-sm text-muted-foreground">{effectiveCheckIns.length} {t("restaurants visited", "مطعم زُرت")}</p>
                </div>
                <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setShowCheckInDialog(true)}>
                  <Plus className="w-4 h-4" />{t("Log Visit", "سجّل زيارة")}
                </Button>
              </div>

              {effectiveCheckIns.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title={t("No visits logged yet", "لم تُسجَّل زيارات بعد")}
                  subtitle={t("Start building your food journey by logging your first visit.", "ابدأ رحلتك الغذائية بتسجيل زيارتك الأولى.")}
                  action={<Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowCheckInDialog(true)}><Plus className="w-4 h-4" />{t("Log First Visit", "سجّل زيارتك الأولى")}</Button>}
                />
              ) : (
                <div className="space-y-3">
                  {effectiveCheckIns.map((ci: any) => (
                    <div key={ci.id} className="bg-card border border-border rounded-2xl overflow-hidden flex gap-0">
                      {ci.restaurantCoverImage && (
                        <div className="w-24 shrink-0 overflow-hidden">
                          <img src={ci.restaurantCoverImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-grow p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/restaurants/${ci.restaurantId}`}>
                              <h3 className="font-bold text-foreground hover:text-primary transition-colors truncate">
                                {lang === "ar" ? ci.restaurantNameAr || ci.restaurantNameEn : ci.restaurantNameEn || ci.restaurantNameAr}
                              </h3>
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">{ci.restaurantCuisineEn}</p>
                          </div>
                          <button onClick={() => deleteCheckInMutation.mutate(ci.id)}
                            className="shrink-0 w-7 h-7 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(ci.visitDate, lang)}</span>
                          {ci.visitTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ci.visitTime}</span>}
                          {ci.partySize && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ci.partySize} {t("guests", "ضيف")}</span>}
                          {ci.companionNames && <span className="flex items-center gap-1"><User className="w-3 h-3" />{ci.companionNames}</span>}
                        </div>
                        {ci.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{ci.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS TAB ─────────────────────────────────────────────────── */}
          {tab === "reviews" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("My Reviews", "تقييماتي")}</h2>
                  <p className="text-sm text-muted-foreground">{filteredReviews.length} {t("reviews", "تقييم")}</p>
                </div>
                <div className="flex gap-1 bg-muted rounded-xl p-0.5">
                  {(["all", "restaurant", "dish"] as const).map(f => (
                    <button key={f} onClick={() => setReviewFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${reviewFilter === f ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {f === "all" ? t("All", "الكل") : f === "restaurant" ? t("Restaurants", "مطاعم") : t("Dishes", "أطباق")}
                    </button>
                  ))}
                </div>
              </div>

              {filteredReviews.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title={t("No reviews yet", "لا توجد تقييمات بعد")}
                  subtitle={t("Visit a restaurant and share your experience.", "زر مطعمًا وشارك تجربتك.")}
                  action={<Link href="/restaurants"><Button size="sm" variant="outline" className="rounded-xl">{t("Browse Restaurants", "تصفح المطاعم")}</Button></Link>}
                />
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review: any) => (
                    <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        {review.restaurantCoverImage && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                            <img src={review.restaurantCoverImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link href={`/restaurants/${review.restaurantId}`}>
                                <p className="font-bold text-foreground hover:text-primary transition-colors">
                                  {lang === "ar" ? review.restaurantNameAr || review.restaurantNameEn : review.restaurantNameEn}
                                </p>
                              </Link>
                              {review.dishNameEn && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Utensils className="w-3 h-3" />{review.dishNameEn}
                                </p>
                              )}
                            </div>
                            <div className="text-end shrink-0">
                              <StarRow rating={Number(review.ratingOverall)} />
                              <p className="text-xs text-muted-foreground mt-1">{review.visitDate ? fmtDate(review.visitDate, lang) : fmtDate(review.createdAt, lang)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {(review.textEn || review.textAr) && (
                        <p className="text-sm text-foreground mt-3 leading-relaxed">
                          "{lang === "ar" ? review.textAr || review.textEn : review.textEn || review.textAr}"
                        </p>
                      )}
                      {/* Sub-ratings */}
                      {(review.ratingFood || review.ratingService || review.ratingAmbiance) && (
                        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
                          {review.ratingFood && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{Number(review.ratingFood).toFixed(1)}</span> {t("Food", "الطعام")}</div>}
                          {review.ratingService && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{Number(review.ratingService).toFixed(1)}</span> {t("Service", "الخدمة")}</div>}
                          {review.ratingAmbiance && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{Number(review.ratingAmbiance).toFixed(1)}</span> {t("Ambiance", "الأجواء")}</div>}
                          {review.likeCount > 0 && <div className="text-xs text-muted-foreground ms-auto flex items-center gap-1"><Heart className="w-3 h-3" />{review.likeCount}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FAVORITES TAB ────────────────────────────────────────────────── */}
          {tab === "favorites" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{t("My Favourites", "مفضلتي")}</h2>
                <div className="flex gap-1 bg-muted rounded-xl p-0.5">
                  <button onClick={() => setFavFilter("restaurants")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${favFilter === "restaurants" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {t("Restaurants", "مطاعم")} <span className="ms-1 opacity-60">({effectiveSavedRestaurants.length})</span>
                  </button>
                  <button onClick={() => setFavFilter("dishes")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${favFilter === "dishes" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {t("Dishes", "أطباق")} <span className="ms-1 opacity-60">({effectiveSavedDishes.length})</span>
                  </button>
                </div>
              </div>

              {favFilter === "restaurants" && (
                effectiveSavedRestaurants.length === 0 ? (
                  <EmptyState
                    icon={Heart}
                    title={t("No saved restaurants yet", "لا توجد مطاعم محفوظة")}
                    subtitle={t("Tap the heart icon on any restaurant to save it here.", "اضغط على أيقونة القلب في أي مطعم لحفظه هنا.")}
                    action={<Link href="/restaurants"><Button size="sm" variant="outline" className="rounded-xl">{t("Browse Restaurants", "تصفح المطاعم")}</Button></Link>}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {effectiveSavedRestaurants.map((r: any) => (
                      <div key={r.id ?? r.restaurantId} className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative h-36 overflow-hidden">
                          <img src={r.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 start-3 text-white">
                            <p className="font-bold text-sm">{lang === "ar" ? r.nameAr || r.nameEn : r.nameEn}</p>
                            <p className="text-xs opacity-80">{r.cuisineEn} · {r.cityEn}</p>
                          </div>
                          {r.avgRating && (
                            <div className="absolute top-2 end-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{Number(r.avgRating).toFixed(1)}
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex justify-between items-center">
                          <Link href={`/restaurants/${r.id ?? r.restaurantId}`}>
                            <Button size="sm" variant="ghost" className="rounded-xl text-xs gap-1 h-8">
                              {t("View", "عرض")} <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                          <button
                            onClick={async () => {
                              if (authUser) { await fetch(`/api/me/saved-restaurants/${r.id ?? r.restaurantId}`, { method: "DELETE", headers: getAuthHeaders() }); queryClient.invalidateQueries({ queryKey: ["me-saved-restaurants"] }); }
                            }}
                            className="w-8 h-8 rounded-full hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors">
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {favFilter === "dishes" && (
                effectiveSavedDishes.length === 0 ? (
                  <EmptyState
                    icon={Utensils}
                    title={t("No saved dishes yet", "لا توجد أطباق محفوظة")}
                    subtitle={t("Save your favourite dishes from any restaurant menu.", "احفظ أطباقك المفضلة من قوائم المطاعم.")}
                    action={<Link href="/restaurants"><Button size="sm" variant="outline" className="rounded-xl">{t("Browse Restaurants", "تصفح المطاعم")}</Button></Link>}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {effectiveSavedDishes.map((d: any) => (
                      <div key={d.dishId} className="bg-card border border-border rounded-2xl flex gap-3 p-3 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          {d.dishImageUrl
                            ? <img src={d.dishImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            : <div className="w-full h-full bg-muted flex items-center justify-center"><Utensils className="w-5 h-5 text-muted-foreground" /></div>
                          }
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{lang === "ar" ? d.dishNameAr || d.dishNameEn : d.dishNameEn}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{d.restaurantNameEn}</p>
                          {d.dishPriceMin && <p className="text-xs font-medium text-primary mt-1">SAR {d.dishPriceMin}+</p>}
                        </div>
                        <button
                          onClick={async () => {
                            if (authUser) { await fetch(`/api/me/saved-dishes/${d.dishId}`, { method: "DELETE", headers: getAuthHeaders() }); refetchSavedDishes(); }
                          }}
                          className="shrink-0 w-8 h-8 rounded-full hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center self-start transition-colors">
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── PLANS TAB ────────────────────────────────────────────────────── */}
          {tab === "plans" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("Visit Plans", "خطط الزيارة")}</h2>
                  <p className="text-sm text-muted-foreground">{activePlans.length} {t("active", "نشطة")} · {completedPlans.length} {t("completed", "مكتملة")}</p>
                </div>
                <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setShowPlanDialog(true)}>
                  <Plus className="w-4 h-4" />{t("Add Plan", "إضافة خطة")}
                </Button>
              </div>

              {activePlans.length === 0 && completedPlans.length === 0 ? (
                <EmptyState
                  icon={ListChecks}
                  title={t("No plans yet", "لا توجد خطط بعد")}
                  subtitle={t("Create a visit plan to organize your future dining experiences.", "أنشئ خطة زيارة لتنظيم تجاربك الغذائية المستقبلية.")}
                  action={<Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowPlanDialog(true)}><Plus className="w-4 h-4" />{t("Create First Plan", "أنشئ خطتك الأولى")}</Button>}
                />
              ) : (
                <>
                  {activePlans.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />{t("Active Plans", "الخطط النشطة")} <span className="text-muted-foreground text-sm">({activePlans.length})</span>
                      </h3>
                      {activePlans.map(plan => (
                        <div key={plan.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                          <div className="flex gap-0">
                            {plan.restaurantCoverImage && (
                              <div className="w-20 shrink-0 overflow-hidden">
                                <img src={plan.restaurantCoverImage} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-grow p-4 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-foreground truncate">{plan.title}</h3>
                                    <PriorityBadge priority={plan.priority} t={t} />
                                    {plan.themeLabel && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{plan.themeLabel}</span>
                                    )}
                                  </div>
                                  {(plan.restaurantNameEn || plan.restaurantNameAr) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {lang === "ar" ? plan.restaurantNameAr || plan.restaurantNameEn : plan.restaurantNameEn}
                                    </p>
                                  )}
                                  {plan.plannedDate && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <Calendar className="w-3 h-3" />{fmtDate(plan.plannedDate, lang)}
                                    </p>
                                  )}
                                  {plan.reminderEnabled && (
                                    <p className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                                      <Bell className="w-3 h-3" />{t("Reminder set", "تذكير مُعيَّن")}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => togglePlanStatus.mutate({ id: plan.id, status: "completed" })}
                                    className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors"
                                    title={t("Mark as done", "وضع علامة تم")}>
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deletePlanMutation.mutate(plan.id)}
                                    className="w-7 h-7 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {plan.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{plan.notes}"</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {completedPlans.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />{t("Completed", "مكتملة")} <span className="text-sm">({completedPlans.length})</span>
                      </h3>
                      {completedPlans.map(plan => (
                        <div key={plan.id} className="bg-card border border-border rounded-2xl p-4 opacity-60">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              <span className="font-medium text-sm text-foreground line-through truncate">{plan.title}</span>
                              {plan.plannedDate && <span className="text-xs text-muted-foreground">{fmtDate(plan.plannedDate, lang)}</span>}
                            </div>
                            <button onClick={() => deletePlanMutation.mutate(plan.id)}
                              className="w-7 h-7 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {plan.notes && <p className="text-xs text-muted-foreground mt-2 ms-6 italic">"{plan.notes}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── RECOMMENDATIONS TAB ──────────────────────────────────────────── */}
          {tab === "recommendations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("My Recommendations", "توصياتي")}</h2>
                  <p className="text-sm text-muted-foreground">{effectiveRecommendations.length} {t("recommendations", "توصية")}</p>
                </div>
              </div>

              {effectiveRecommendations.length === 0 ? (
                <EmptyState
                  icon={ThumbsUp}
                  title={t("No recommendations yet", "لا توجد توصيات بعد")}
                  subtitle={t("Recommend your favourite restaurants and dishes to your followers.", "أوصِ بمطاعمك وأطباقك المفضلة لمتابعيك.")}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {effectiveRecommendations.map((rec: any) => (
                    <div key={rec.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all group">
                      {rec.restaurantCoverImage && (
                        <div className="relative h-32 overflow-hidden">
                          <img src={rec.restaurantCoverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
                          <div className="absolute bottom-2 start-3 text-white">
                            <p className="font-bold text-sm">{lang === "ar" ? rec.restaurantNameAr || rec.restaurantNameEn : rec.restaurantNameEn}</p>
                            <p className="text-xs opacity-80">{rec.restaurantCuisineEn}</p>
                          </div>
                          <div className="absolute top-2 end-2 flex gap-1">
                            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />{t("Recommended", "موصى به")}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        {rec.dishNameEn && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Utensils className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">{t("Dish:", "الطبق:")} {lang === "ar" ? rec.dishNameAr || rec.dishNameEn : rec.dishNameEn}</span>
                          </div>
                        )}
                        <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                          "{lang === "ar" ? rec.noteAr || rec.noteEn : rec.noteEn || rec.noteAr}"
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">{fmtDate(rec.createdAt, lang)}</span>
                          <div className="flex gap-2">
                            <button className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={async () => {
                                if (authUser) { await fetch(`/api/me/recommendations/${rec.id}`, { method: "DELETE", headers: getAuthHeaders() }); refetchRecs(); }
                              }}
                              className="w-7 h-7 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
          {tab === "activity" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">{t("Activity Feed", "خلاصة النشاط")}</h2>
              {!effectiveActivity?.events?.length ? (
                <EmptyState
                  icon={BookOpen}
                  title={t("No activity yet", "لا يوجد نشاط بعد")}
                  subtitle={t("Start reviewing restaurants to build your activity history.", "ابدأ بتقييم المطاعم لبناء سجل نشاطك.")}
                />
              ) : (
                (effectiveActivity!.events ?? []).map((event: any, i: number) => {
                  const d = (event.data ?? {}) as Record<string, unknown>;
                  const restaurantName = lang === "ar"
                    ? (d.restaurantNameAr as string) || (d.restaurantNameEn as string)
                    : (d.restaurantNameEn as string) || (d.restaurantNameAr as string);
                  const evDate = event.createdAt ? fmtDate(event.createdAt, lang) : "";
                  const iconMap: Record<string, { icon: React.FC<{ className?: string }>; bg: string }> = {
                    review:   { icon: Star,      bg: "bg-primary/10 text-primary" },
                    check_in: { icon: MapPin,    bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
                    bookmark: { icon: Heart,     bg: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" },
                    follow:   { icon: UserPlus,  bg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
                    booking:  { icon: Calendar,  bg: "bg-muted text-muted-foreground" },
                  };
                  const { icon: EventIcon, bg } = iconMap[event.type as string] ?? { icon: Clock, bg: "bg-muted text-muted-foreground" };
                  return (
                    <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                        <EventIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {event.type === "review"   && t(`Reviewed ${restaurantName}`, `قيّمت ${restaurantName}`)}
                              {event.type === "check_in" && t(`Visited ${restaurantName}`, `زرت ${restaurantName}`)}
                              {event.type === "bookmark" && t(`Saved ${restaurantName}`, `حفظت ${restaurantName}`)}
                              {event.type === "follow"   && t(`Followed ${String(d.nameEn ?? "")}`, `تابعت ${String(d.nameAr || d.nameEn || "")}`)}
                              {event.type === "booking"  && t(`Booked at ${restaurantName}`, `حجزت في ${restaurantName}`)}
                            </p>
                            {event.type === "review" && (
                              <StarRow rating={Number(d.ratingOverall ?? 0)} size="xs" />
                            )}
                            {event.type === "review" && (d.textEn || d.textAr) && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {String(lang === "ar" ? d.textAr || d.textEn : d.textEn || d.textAr)}
                              </p>
                            )}
                            {event.type === "booking" && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {String(d.date ?? "")} · {Number(d.partySize ?? 0)} {t("guests", "ضيوف")} · <span className="capitalize">{String(d.status ?? "")}</span>
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{evDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── FOLLOWERS TAB ────────────────────────────────────────────────── */}
          {tab === "followers" && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                {t("Followers", "المتابعون")} <span className="text-muted-foreground text-base">({effectiveFollowers.length})</span>
              </h2>
              {!effectiveFollowers?.length ? (
                <EmptyState icon={Users} title={t("No followers yet", "لا يوجد متابعون بعد")} subtitle={t("Share your profile to gain followers.", "شارك ملفك للحصول على متابعين.")} />
              ) : (
                effectiveFollowers.map((f: any) => {
                  const uname = lang === "ar" ? f.nameAr || f.nameEn : f.nameEn || f.nameAr;
                  const isFollowingBack = followingIds.has(f.id);
                  const isPending = followMutation.isPending && (followMutation.variables as any)?.targetId === f.id;
                  return (
                    <div key={f.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-foreground truncate">{uname}</p>
                        <p className="text-xs text-muted-foreground">{f.levelTitle}</p>
                      </div>
                      {f.isVerified && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                      <div className="flex gap-2 shrink-0">
                        {authUser && f.id !== authUser.id && (
                          <Button size="sm" variant={isFollowingBack ? "outline" : "default"} className="rounded-xl gap-1.5 h-8" disabled={isPending}
                            onClick={() => followMutation.mutate({ targetId: f.id, action: isFollowingBack ? "unfollow" : "follow" })}>
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFollowingBack ? <><UserMinus className="w-3.5 h-3.5" />{t("Unfollow", "إلغاء")}</> : <><UserPlus className="w-3.5 h-3.5" />{t("Follow Back", "تابع")}</>}
                          </Button>
                        )}
                        <button
                          onClick={async () => { if (authUser) { await fetch(`/api/users/${f.id}/block`, { method: "POST", headers: getAuthHeaders() }); queryClient.invalidateQueries({ queryKey: getGetUserFollowersQueryKey(userId) }); } }}
                          className="w-8 h-8 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                          title={t("Block user", "حظر المستخدم")}>
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── FOLLOWING TAB ────────────────────────────────────────────────── */}
          {tab === "following" && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                {t("Following", "يتابع")} <span className="text-muted-foreground text-base">({effectiveFollowing.length})</span>
              </h2>
              {!effectiveFollowing?.length ? (
                <EmptyState
                  icon={Users}
                  title={t("Not following anyone yet", "لا تتابع أحدًا بعد")}
                  subtitle={t("Discover food critics on the leaderboard.", "اكتشف نقاد الطعام في قائمة المتصدرين.")}
                  action={<Link href="/leaderboard"><Button size="sm" variant="outline" className="rounded-xl">{t("View Leaderboard", "قائمة المتصدرين")}</Button></Link>}
                />
              ) : (
                effectiveFollowing.map((f: any) => {
                  const uname = lang === "ar" ? f.nameAr || f.nameEn : f.nameEn || f.nameAr;
                  const isPending = followMutation.isPending && (followMutation.variables as any)?.targetId === f.id;
                  return (
                    <div key={f.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-foreground truncate">{uname}</p>
                        <p className="text-xs text-muted-foreground">{f.levelTitle}</p>
                      </div>
                      {f.isVerified && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-muted-foreground shrink-0" disabled={isPending}
                        onClick={() => followMutation.mutate({ targetId: f.id, action: "unfollow" })}>
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><UserMinus className="w-3.5 h-3.5" />{t("Unfollow", "إلغاء")}</>}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ─────────────────────────────────────────────────── */}
          {tab === "settings" && (
            <div className="space-y-6">

              {/* Account Settings banner */}
              <Link href="/account">
                <div className="group bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer">
                  <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{t("Full Account Settings", "إعدادات الحساب الكاملة")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("Privacy, notifications, security, addresses, membership and more", "الخصوصية والإشعارات والأمان والعناوين والعضوية والمزيد")}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-primary shrink-0 ${lang === "ar" ? "rotate-180" : ""}`} />
                </div>
              </Link>

              {/* Username */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                    <AtSign className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{t("Your Username", "اسم المستخدم")}</h3>
                    <p className="text-xs text-muted-foreground">{t("Choose a unique handle for your public profile", "اختر اسمًا مميزًا لملفك الشخصي العام")}</p>
                  </div>
                  {currentUsername && (
                    <span className="ms-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">{t("Active", "مفعّل")}</span>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  {currentUsername && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <AtSign className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">{currentUsername}</span>
                      <span className="ms-auto text-xs text-muted-foreground">{t("Current username", "الاسم الحالي")}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {currentUsername ? t("Change username", "تغيير اسم المستخدم") : t("Claim your username", "احجز اسم مستخدمك")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <AtSign className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <input type="text" value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                        placeholder="yourname" maxLength={30}
                        className="w-full ps-9 pe-10 h-11 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                      <div className="absolute inset-y-0 end-0 flex items-center pe-3">{usernameStatusIcon()}</div>
                    </div>
                    {usernameInput && (
                      <div className={`mt-1.5 text-xs flex items-center gap-1.5 ${usernameStatus === "available" ? "text-green-600" : (usernameStatus === "taken" || usernameStatus === "error") ? "text-red-500" : "text-muted-foreground"}`}>
                        {usernameStatus === "available" && <><CheckCircle2 className="w-3 h-3" />{t("Username is available!", "الاسم متاح!")}</>}
                        {usernameStatus === "taken" && <><XCircle className="w-3 h-3" />{usernameError}</>}
                        {usernameStatus === "error" && <><XCircle className="w-3 h-3" />{usernameError}</>}
                        {usernameStatus === "checking" && t("Checking...", "جارٍ التحقق...")}
                        {usernameStatus === "idle" && usernameInput.length > 0 && t("3–30 chars, letters, numbers, _ and .", "3–30 حرفًا")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{t("Your profile URL: tabaq.sa/@username", "رابط ملفك: tabaq.sa/@username")}</p>
                    <Button size="sm" className="rounded-xl gap-1.5" disabled={usernameStatus !== "available" || usernameSaving} onClick={handleSaveUsername}>
                      {usernameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : usernameSaved ? <><Check className="w-3.5 h-3.5" />{t("Saved!", "تم الحفظ!")}</> : t("Save", "حفظ")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Blocked Users */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <Ban className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{t("Blocked Users", "المستخدمون المحظورون")}</h3>
                    <p className="text-xs text-muted-foreground">{t("Blocked users cannot view your profile or follow you", "المستخدمون المحظورون لا يمكنهم مشاهدة ملفك أو متابعتك")}</p>
                  </div>
                  {effectiveBlockedUsers.length > 0 && (
                    <span className="ms-auto text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-medium">{effectiveBlockedUsers.length}</span>
                  )}
                </div>
                <div className="p-5">
                  {effectiveBlockedUsers.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t("No blocked users", "لا يوجد مستخدمون محظورون")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {effectiveBlockedUsers.map((bu: any) => {
                        const uname = lang === "ar" ? bu.nameAr || bu.nameEn : bu.nameEn || bu.nameAr;
                        return (
                          <div key={bu.blockedId} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0">
                              {bu.avatarUrl ? <img src={bu.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground m-auto" />}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{uname}</p>
                              {bu.username && <p className="text-xs text-muted-foreground">@{bu.username}</p>}
                            </div>
                            <Button size="sm" variant="outline" className="shrink-0 rounded-xl text-xs gap-1" disabled={unblockMutation.isPending}
                              onClick={() => unblockMutation.mutate(bu.blockedId)}>
                              {t("Unblock", "إلغاء الحظر")}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>


              {/* Profile URL */}
              {currentUsername && (
                <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">{t("Your Public Profile", "ملفك العام")}</p>
                    <p className="text-xs text-muted-foreground truncate">{`${window.location.origin}/user/${currentUsername}`}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/user/${currentUsername}`); setProfileLinkCopied(true); setTimeout(() => setProfileLinkCopied(false), 2000); }}
                      className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      {profileLinkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <Link href={`/user/${currentUsername}`}>
                      <button className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center hover:bg-secondary/80 transition-colors">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Notification Preferences Link */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-foreground">{t("Notification Preferences", "تفضيلات الإشعارات")}</h3>
                    <p className="text-xs text-muted-foreground">{t("Manage what notifications you receive and how", "إدارة الإشعارات التي تتلقاها وكيفية وصولها")}</p>
                  </div>
                  <Link href="/notifications">
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 shrink-0">
                      {t("Manage", "إدارة")} <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-bold text-foreground">{t("Account", "الحساب")}</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("Points History", "سجل النقاط")}</p>
                      <p className="text-xs text-muted-foreground">{user.points} {t("total points earned", "نقطة مكتسبة")}</p>
                    </div>
                    <Link href="/profile/points">
                      <Button size="sm" variant="outline" className="rounded-xl gap-1">
                        {t("View", "عرض")} <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("Referral Programme", "برنامج الإحالة")}</p>
                      <p className="text-xs text-muted-foreground">{t("Invite friends and earn bonus points", "ادعُ الأصدقاء واكسب نقاطًا إضافية")}</p>
                    </div>
                    <Link href="/referrals">
                      <Button size="sm" variant="outline" className="rounded-xl gap-1">
                        <Gift className="w-3.5 h-3.5" />{t("Invite", "دعوة")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
