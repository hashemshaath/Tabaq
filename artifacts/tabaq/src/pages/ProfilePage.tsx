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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PROFILE_DATA = {
  user: {
    id: 0, nameEn: "Layla Al-Rashidi", nameAr: "ليلى الراشدي",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
    isVerified: true, isEmailVerified: true,
    bio: "Food explorer & home chef documenting Saudi Arabia's finest dining scene — one meal at a time.",
    createdAt: "2023-09-15T00:00:00Z", points: 1850, level: 4,
    levelTitle: "Gourmand", credibilityScore: "9.2", username: "layla.rashidi",
    isPrivate: false,
  },
  reviewCount: 47, bookingCount: 12, followerCount: 284, followingCount: 91,
};

const MOCK_CHECK_INS = [
  { id: 1, restaurantId: 7,  restaurantNameEn: "Nobu Riyadh",        restaurantNameAr: "نوبو الرياض",        restaurantCoverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", restaurantCuisineEn: "Japanese", visitDate: "2026-03-28", visitTime: "20:00", partySize: 2, notes: "Black cod miso was absolutely divine.", companionNames: "Ahmad" },
  { id: 2, restaurantId: 8,  restaurantNameEn: "Nusr-Et Riyadh",     restaurantNameAr: "نصرت الرياض",        restaurantCoverImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", restaurantCuisineEn: "Steakhouse", visitDate: "2026-03-14", visitTime: "21:00", partySize: 4, notes: "Best wagyu in the city.", companionNames: "Sara, Khalid, Noura" },
  { id: 3, restaurantId: 9,  restaurantNameEn: "La Petite Maison",   restaurantNameAr: "لا بيتيت ميزون",    restaurantCoverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", restaurantCuisineEn: "French",   visitDate: "2026-02-20", visitTime: "19:30", partySize: 2, notes: "Truffle risotto was perfectly balanced.", companionNames: "" },
  { id: 4, restaurantId: 1,  restaurantNameEn: "Najd Village",       restaurantNameAr: "قرية نجد",          restaurantCoverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", restaurantCuisineEn: "Saudi",    visitDate: "2026-01-31", visitTime: "19:00", partySize: 6, notes: "Authentic Saudi hospitality at its finest.", companionNames: "Family" },
  { id: 5, restaurantId: 3,  restaurantNameEn: "Sushi Sama",         restaurantNameAr: "سوشي ساما",         restaurantCoverImage: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop", restaurantCuisineEn: "Japanese", visitDate: "2026-01-10", visitTime: "20:30", partySize: 2, notes: "Omakase experience exceeded all expectations.", companionNames: "Ahmad" },
];

const MOCK_REVIEWS = [
  { id: 1, restaurantId: 7,  restaurantNameEn: "Nobu Riyadh",      restaurantNameAr: "نوبو الرياض",      restaurantCoverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", dishId: null, dishNameEn: null, ratingOverall: 5, ratingFood: 5, ratingService: 5, ratingAmbiance: 4, textEn: "Absolutely divine black cod miso — the best I've had outside of Tokyo. Chef Marcus has perfectly balanced flavours with subtle Saudi-inspired touches.", visitDate: "2026-03-28", createdAt: "2026-03-29T10:00:00Z", likeCount: 24 },
  { id: 2, restaurantId: 1,  restaurantNameEn: "Najd Village",     restaurantNameAr: "قرية نجد",         restaurantCoverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", dishId: null, dishNameEn: null, ratingOverall: 4, ratingFood: 5, ratingService: 4, ratingAmbiance: 5, textEn: "Authentic Saudi cuisine in a beautiful heritage setting. The jareesh and kabsa were cooked to perfection. Service was a bit slow but the atmosphere was worth it.", visitDate: "2026-01-31", createdAt: "2026-02-01T09:00:00Z", likeCount: 18 },
  { id: 3, restaurantId: 2,  restaurantNameEn: "Lucine",           restaurantNameAr: "لوسين",            restaurantCoverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", dishId: null, dishNameEn: null, ratingOverall: 5, ratingFood: 5, ratingService: 5, ratingAmbiance: 5, textEn: "Impeccable service and creative Armenian fusion dishes. The mante dumplings with sumac yogurt were revelatory. One of Riyadh's hidden gems.", visitDate: "2026-01-15", createdAt: "2026-01-16T20:00:00Z", likeCount: 31 },
  { id: 4, restaurantId: 3,  restaurantNameEn: "Sushi Sama",       restaurantNameAr: "سوشي ساما",        restaurantCoverImage: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop", dishId: 12, dishNameEn: "Toro Nigiri", ratingOverall: 5, ratingFood: 5, ratingService: 4, ratingAmbiance: 4, textEn: "This Toro Nigiri is in a league of its own. Perfectly marbled bluefin tuna, hand-pressed rice, and a delicate brush of soy. Unmissable.", visitDate: "2026-01-10", createdAt: "2026-01-11T18:00:00Z", likeCount: 42 },
];

const MOCK_SAVED_RESTAURANTS = [
  { id: 7,  nameEn: "Nobu Riyadh",       nameAr: "نوبو الرياض",       coverImageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", cuisineEn: "Japanese",  cityEn: "Riyadh", avgRating: "4.9", savedAt: "2026-03-01" },
  { id: 3,  nameEn: "Sushi Sama",         nameAr: "سوشي ساما",         coverImageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop", cuisineEn: "Japanese",  cityEn: "Riyadh", avgRating: "4.8", savedAt: "2026-02-15" },
  { id: 9,  nameEn: "La Petite Maison",   nameAr: "لا بيتيت ميزون",   coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", cuisineEn: "French",    cityEn: "Riyadh", avgRating: "4.7", savedAt: "2026-01-20" },
  { id: 8,  nameEn: "Nusr-Et Riyadh",     nameAr: "نصرت الرياض",       coverImageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", cuisineEn: "Steakhouse",cityEn: "Riyadh", avgRating: "4.6", savedAt: "2026-01-05" },
];

const MOCK_SAVED_DISHES = [
  { dishId: 12, dishNameEn: "Toro Nigiri",          dishNameAr: "توروه نيجيري",     dishImageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=200&h=200&fit=crop", dishPriceMin: "85", restaurantId: 3,  restaurantNameEn: "Sushi Sama",        savedAt: "2026-02-20" },
  { dishId: 31, dishNameEn: "Black Cod Miso",        dishNameAr: "سمك القد الأسود بالميسو", dishImageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop", dishPriceMin: "145", restaurantId: 7, restaurantNameEn: "Nobu Riyadh",       savedAt: "2026-03-28" },
  { dishId: 8,  dishNameEn: "Truffle Risotto",       dishNameAr: "ريزوتو الكمأة",    dishImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop", dishPriceMin: "120", restaurantId: 9, restaurantNameEn: "La Petite Maison",  savedAt: "2026-01-22" },
  { dishId: 5,  dishNameEn: "Mante Dumplings",       dishNameAr: "مانتي",            dishImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop", dishPriceMin: "65",  restaurantId: 2, restaurantNameEn: "Lucine",            savedAt: "2026-01-17" },
];

const MOCK_PLANS = [
  { id: 1, restaurantId: 7,  restaurantNameEn: "Nobu Riyadh",         restaurantNameAr: "نوبو الرياض",      restaurantCoverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", title: "Black Truffle Season Dinner",  plannedDate: "2026-04-20", notes: "Ask for the chef's truffle tasting menu.", priority: "high",   status: "active", themeLabel: "Special Occasion", reminderEnabled: true },
  { id: 2, restaurantId: 11, restaurantNameEn: "Zuma Riyadh",         restaurantNameAr: "زوما الرياض",      restaurantCoverImage: "https://images.unsplash.com/photo-1617196034083-421b4040ed20?w=400&h=300&fit=crop", title: "Rooftop Brunch",               plannedDate: "2026-04-05", notes: "Make a reservation at least 2 weeks in advance.", priority: "medium", status: "active", themeLabel: "Weekend Brunch",  reminderEnabled: false },
  { id: 3, restaurantId: null, restaurantNameEn: null,                 restaurantNameAr: null,               restaurantCoverImage: null, title: "Dessert Week Tour",            plannedDate: "2026-05-01", notes: "Try the best desserts across Riyadh — patisseries, chocolate labs, and ice cream.", priority: "low", status: "active", themeLabel: "Food Theme Week", reminderEnabled: false },
  { id: 4, restaurantId: 3,  restaurantNameEn: "Sushi Sama",           restaurantNameAr: "سوشي ساما",        restaurantCoverImage: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop", title: "Omakase Experience",           plannedDate: "2026-01-10", notes: "Done! Best meal of the year.", priority: "high", status: "completed", themeLabel: null, reminderEnabled: false },
];

const MOCK_RECOMMENDATIONS = [
  { id: 1, restaurantId: 7,  restaurantNameEn: "Nobu Riyadh",       restaurantNameAr: "نوبو الرياض",      restaurantCoverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", restaurantCuisineEn: "Japanese", dishId: 31, dishNameEn: "Black Cod Miso", dishNameAr: "سمك القد الأسود بالميسو", noteEn: "This dish will change your perception of fish forever. Silky, rich, perfectly glazed. Book at least 2 weeks ahead.", noteAr: "هذا الطبق سيغيّر نظرتك للأسماك إلى الأبد.", createdAt: "2026-03-29" },
  { id: 2, restaurantId: 2,  restaurantNameEn: "Lucine",             restaurantNameAr: "لوسين",            restaurantCoverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", restaurantCuisineEn: "Armenian",  dishId: null, dishNameEn: null, dishNameAr: null, noteEn: "Riyadh's best-kept secret. Exceptional Armenian-Lebanese cuisine with impeccable service. Go for the mante and stay for the baklava.",  noteAr: "الجوهرة المخفية في الرياض. مطبخ أرمني لبناني استثنائي.", createdAt: "2026-01-16" },
  { id: 3, restaurantId: 3,  restaurantNameEn: "Sushi Sama",         restaurantNameAr: "سوشي ساما",        restaurantCoverImage: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop", restaurantCuisineEn: "Japanese",  dishId: 12, dishNameEn: "Toro Nigiri", dishNameAr: "توروه نيجيري", noteEn: "The Toro Nigiri here is flown in from Tokyo twice weekly. Pure luxury in two bites. Order the omakase if you can.", noteAr: "تونة التورو تُستورد من طوكيو مرتين أسبوعياً.", createdAt: "2026-01-11" },
];

const MOCK_ACTIVITY = {
  events: [
    { type: "check_in", createdAt: "2026-03-28T20:00:00Z", data: { restaurantNameEn: "Nobu Riyadh", restaurantNameAr: "نوبو الرياض", restaurantId: 7, partySize: 2 } },
    { type: "review",   createdAt: "2026-03-29T10:00:00Z", data: { restaurantNameEn: "Nobu Riyadh", restaurantNameAr: "نوبو الرياض", restaurantId: 7, ratingOverall: 5, textEn: "Absolutely divine black cod miso..." } },
    { type: "bookmark", createdAt: "2026-03-01T09:00:00Z", data: { restaurantNameEn: "Nobu Riyadh", restaurantNameAr: "نوبو الرياض", restaurantId: 7 } },
    { type: "review",   createdAt: "2026-02-01T09:00:00Z", data: { restaurantNameEn: "Najd Village", restaurantNameAr: "قرية نجد",  restaurantId: 1, ratingOverall: 4, textEn: "Authentic Saudi cuisine in a beautiful heritage setting..." } },
    { type: "review",   createdAt: "2026-01-16T20:00:00Z", data: { restaurantNameEn: "Lucine",      restaurantNameAr: "لوسين",       restaurantId: 2, ratingOverall: 5, textEn: "Impeccable service and creative Armenian fusion dishes..." } },
    { type: "follow",   createdAt: "2026-01-10T08:00:00Z", data: { nameEn: "Faisal Al-Otaibi", nameAr: "فيصل العتيبي" } },
  ],
};

const MOCK_FOLLOWERS_LIST = [
  { id: 11, nameEn: "Faisal Al-Otaibi",     nameAr: "فيصل العتيبي",     avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",  levelTitle: "Food Critic", isVerified: true },
  { id: 12, nameEn: "Sara Mahmoud",          nameAr: "سارة محمود",        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face", levelTitle: "Gourmet Explorer", isVerified: false },
  { id: 13, nameEn: "Mohammed Al-Zahrani",   nameAr: "محمد الزهراني",    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",  levelTitle: "Food Adventurer", isVerified: false },
  { id: 14, nameEn: "Noura Al-Ghamdi",       nameAr: "نورا الغامدي",     avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",     levelTitle: "Michelin Enthusiast", isVerified: true },
];

const MOCK_FOLLOWING_LIST = [
  { id: 15, nameEn: "Khalid Bin Mansour",    nameAr: "خالد بن منصور",    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",  levelTitle: "Saudi Cuisine Expert", isVerified: true },
  { id: 16, nameEn: "Hessa Al-Salmani",      nameAr: "حصة السلماني",     avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",  levelTitle: "Michelin Tracker", isVerified: true },
  { id: 17, nameEn: "Turki Al-Anzi",         nameAr: "تركي العنزي",      avatarUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face",   levelTitle: "Street Food Lover", isVerified: false },
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfilePage() {
  const { t, lang } = useLanguage();
  const { user: authUser, isLoading: authLoading, token } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [localCheckIns, setLocalCheckIns] = useState<typeof MOCK_CHECK_INS>(MOCK_CHECK_INS);
  const [localPlans, setLocalPlans] = useState<typeof MOCK_PLANS>(MOCK_PLANS);
  const [favFilter, setFavFilter] = useState<"restaurants" | "dishes">("restaurants");
  const [reviewFilter, setReviewFilter] = useState<"all" | "restaurant" | "dish">("all");
  const [isPrivate, setIsPrivate] = useState(false);
  const [contentPrivacy, setContentPrivacy] = useState<Record<string, VisibilityOption>>({
    visits: "public", reviews: "public", favorites: "public",
    activity: "public", plans: "followers", recommendations: "public",
  });
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

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

  const effectiveData = authUser ? data : MOCK_PROFILE_DATA;
  const effectiveFollowers: any[] = authUser ? (followersData ?? []) : MOCK_FOLLOWERS_LIST;
  const effectiveFollowing: any[] = authUser ? (followingData ?? []) : MOCK_FOLLOWING_LIST;
  const effectiveActivity = authUser ? activityData : MOCK_ACTIVITY;
  const effectiveCheckIns: any[] = authUser ? (checkInsData ?? []) : localCheckIns;
  const effectivePlans: any[] = authUser ? (plansData ?? []) : localPlans;
  const effectiveSavedRestaurants: any[] = authUser ? (savedRestaurantsData ?? []) : MOCK_SAVED_RESTAURANTS;
  const effectiveSavedDishes: any[] = authUser ? (savedDishesData ?? []) : MOCK_SAVED_DISHES;
  const effectiveReviews: any[] = authUser ? (reviewsData ?? []) : MOCK_REVIEWS;
  const effectiveRecommendations: any[] = authUser ? (recommendationsData ?? []) : MOCK_RECOMMENDATIONS;
  const effectiveBlockedUsers: any[] = authUser ? (blockedUsersData ?? []) : [];

  if (authUser && (isLoading || !data?.user)) return (
    <div className="min-h-screen p-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { user, reviewCount, bookingCount, followerCount, followingCount } = effectiveData ?? MOCK_PROFILE_DATA;
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

      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-primary via-primary/80 to-rose-700 w-full relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-card rounded-3xl p-6 md:p-8 shadow-xl border border-border -mt-24 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-start">
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted border-4 border-card shadow-lg overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={name || ""} className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-6 text-muted-foreground" />
              )}
            </div>
            <button className="absolute bottom-1 end-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
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
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />{t("Riyadh, KSA", "الرياض، المملكة")}
                  </span>
                  {joinYear && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />{t(`Joined ${joinYear}`, `انضم ${joinYear}`)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    {effectiveCheckIns.length} {t("visits", "زيارة")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 border border-input rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Edit2 className="w-4 h-4" />{t("Edit Profile", "تعديل الملف")}
              </button>
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
        <div className="mt-6 bg-gradient-to-r from-accent to-background p-5 rounded-3xl border border-accent flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Star className="w-6 h-6 fill-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t("Level", "المستوى")} {user.level}: {user.levelTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {user.points} {t("points", "نقطة")}
                {user.credibilityScore && parseFloat(String(user.credibilityScore)) > 0 && (
                  <span className="ms-2 text-primary font-medium">· {t("Credibility:", "مصداقية:")} {parseFloat(String(user.credibilityScore)).toFixed(1)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-2/5">
            <div className="flex justify-between text-xs font-medium mb-1.5 text-muted-foreground">
              <span>{user.points} XP</span>
              <span>{t(`Next: ${levelMax} XP`, `التالي: ${levelMax} نقطة`)}</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6 overflow-x-auto scrollbar-hide">
            {TABS.map(({ id, labelEn, labelAr, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-none flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap px-3 ${
                  tab === id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(labelEn, labelAr)}
              </button>
            ))}
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

              {/* Food journey stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: effectiveCheckIns.length,           icon: MapPin,     enLabel: "Restaurants Visited", arLabel: "مطاعم زُرت",         color: "text-emerald-600" },
                  { val: effectiveReviews.length,             icon: Star,       enLabel: "Reviews Written",     arLabel: "تقييمات كتبت",       color: "text-primary" },
                  { val: effectiveSavedRestaurants.length,    icon: Heart,      enLabel: "Places Saved",        arLabel: "أماكن محفوظة",       color: "text-rose-500" },
                  { val: effectiveRecommendations.length,     icon: ThumbsUp,   enLabel: "Recommendations",     arLabel: "توصيات",             color: "text-amber-600" },
                ].map(({ val, icon: Icon, enLabel, arLabel, color }) => (
                  <div key={enLabel} className="bg-card border border-border rounded-2xl p-4 text-center">
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                    <div className="text-2xl font-bold text-foreground">{val}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t(enLabel, arLabel)}</div>
                  </div>
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

              {/* Account Privacy */}
              <PrivacyCard isPrivate={isPrivate} onToggle={handlePrivacyToggle} t={t} />

              {/* Per-content Privacy */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{t("Content Visibility", "ظهور المحتوى")}</h3>
                    <p className="text-xs text-muted-foreground">{t("Control who can see each type of your content", "تحكم في من يمكنه رؤية كل نوع من محتواك")}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {CONTENT_TYPES.map(({ key, labelEn, labelAr }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium text-foreground">{t(labelEn, labelAr)}</label>
                      <div className="flex gap-1 bg-muted rounded-xl p-0.5">
                        {VISIBILITY_OPTIONS.map(({ value, labelEn: vLabelEn, labelAr: vLabelAr, icon: VIcon }) => (
                          <button
                            key={value}
                            onClick={() => setContentPrivacy(prev => ({ ...prev, [key]: value }))}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              contentPrivacy[key] === value ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <VIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">{t(vLabelEn, vLabelAr)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    {privacySaved && (
                      <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{t("Saved!", "تم الحفظ!")}</span>
                    )}
                    <Button size="sm" className="rounded-xl gap-1.5" disabled={privacySaving} onClick={handleSaveContentPrivacy}>
                      {privacySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {t("Save Privacy Settings", "حفظ إعدادات الخصوصية")}
                    </Button>
                  </div>
                </div>
              </div>

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
