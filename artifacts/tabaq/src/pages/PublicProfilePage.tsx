import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/hooks/use-language";
import { getAuthHeaders } from "@/lib/api";
import {
  User, ShieldCheck, MapPin, Calendar, Star, Users, Globe,
  Heart, Bookmark, MessageCircle, Share2, Copy, Check, Lock,
  UserPlus, UserMinus, Clock, ArrowLeft, AtSign, Flame,
  Instagram, Link2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────

type FollowStatus = "none" | "following" | "pending";
type PublicTab = "overview" | "reviews" | "visits" | "favorites";

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
  createdAt: string;
}

// ── Mock review / visit data for demonstration ─────────────────────────────────

const DEMO_REVIEWS = [
  {
    id: 1, restaurantId: 7, restaurantNameEn: "Nobu Riyadh", restaurantNameAr: "نوبو الرياض",
    restaurantImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=200&fit=crop",
    ratingOverall: 5, ratingFood: 5, ratingService: 5, ratingAmbiance: 4,
    textEn: "Absolutely divine black cod miso — the best I've had outside of Tokyo. Chef James has perfectly balanced flavours with subtle Saudi-inspired touches.",
    visitDate: "2026-03-28", likeCount: 24,
  },
  {
    id: 2, restaurantId: 1, restaurantNameEn: "Najd Village", restaurantNameAr: "قرية نجد",
    restaurantImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop",
    ratingOverall: 4, ratingFood: 5, ratingService: 4, ratingAmbiance: 5,
    textEn: "Authentic Saudi cuisine in a beautiful heritage setting. The jareesh and kabsa were cooked to perfection. Atmosphere was worth every minute of the wait.",
    visitDate: "2026-01-31", likeCount: 18,
  },
  {
    id: 3, restaurantId: 3, restaurantNameEn: "Sushi Sama", restaurantNameAr: "سوشي ساما",
    restaurantImage: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=300&h=200&fit=crop",
    ratingOverall: 5, ratingFood: 5, ratingService: 4, ratingAmbiance: 4,
    textEn: "This omakase experience exceeded all expectations. Chef Yuki's knife work is meditative to watch, and the toro nigiri is simply unmissable.",
    visitDate: "2026-01-10", likeCount: 42,
  },
];

const DEMO_VISITS = [
  { id: 1, restaurantId: 7, restaurantNameEn: "Nobu Riyadh", restaurantNameAr: "نوبو الرياض", restaurantImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=200&fit=crop", cuisineEn: "Japanese", visitDate: "2026-03-28", partySize: 2 },
  { id: 2, restaurantId: 8, restaurantNameEn: "Nusr-Et Riyadh", restaurantNameAr: "نصرت الرياض", restaurantImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop", cuisineEn: "Steakhouse", visitDate: "2026-03-14", partySize: 4 },
  { id: 3, restaurantId: 3, restaurantNameEn: "Sushi Sama", restaurantNameAr: "سوشي ساما", restaurantImage: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=300&h=200&fit=crop", cuisineEn: "Japanese", visitDate: "2026-01-10", partySize: 2 },
];

const DEMO_FAVORITES = [
  { id: 7, nameEn: "Nobu Riyadh", nameAr: "نوبو الرياض", coverImageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=200&fit=crop", cuisineEn: "Japanese", avgRating: "4.9" },
  { id: 3, nameEn: "Sushi Sama", nameAr: "سوشي ساما", coverImageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=300&h=200&fit=crop", cuisineEn: "Japanese", avgRating: "4.8" },
  { id: 1, nameEn: "Najd Village", nameAr: "قرية نجد", coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop", cuisineEn: "Saudi", avgRating: "4.7" },
];

// ── Star Rating ────────────────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

// ── Social Icon ────────────────────────────────────────────────────────────────

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href.startsWith("http") ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
    >
      {children}
    </a>
  );
}

// ── Share Modal ────────────────────────────────────────────────────────────────

function ShareProfileModal({ username, name, onClose }: { username: string; name: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/user/${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-md mx-4 mb-4 sm:mb-0 shadow-2xl">
        <h3 className="font-extrabold text-lg text-foreground mb-1">Share Profile</h3>
        <p className="text-sm text-muted-foreground mb-5">{name}'s Tabaq profile</p>

        <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3 mb-5">
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground flex-1 truncate font-mono">{profileUrl}</span>
          <button onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "WhatsApp", bg: "bg-green-500", href: `https://wa.me/?text=Check out ${name}'s food profile on Tabaq: ${profileUrl}`, icon: "📱" },
            { label: "X", bg: "bg-black", href: `https://twitter.com/intent/tweet?text=Check out ${name}'s food profile on Tabaq&url=${profileUrl}`, icon: "𝕏" },
            { label: "Copy Link", bg: "bg-secondary", href: null, icon: copied ? "✓" : "🔗" },
          ].map(item => (
            item.href ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                className={`${item.bg} rounded-2xl py-3 flex flex-col items-center gap-1.5 text-white hover:opacity-90 transition-opacity`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </a>
            ) : (
              <button key={item.label} onClick={handleCopy}
                className={`${item.bg} rounded-2xl py-3 flex flex-col items-center gap-1.5 hover:opacity-90 transition-opacity`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium text-foreground">{item.label}</span>
              </button>
            )
          ))}
        </div>

        <Button variant="outline" className="w-full rounded-2xl" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [, navigate] = useLocation();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<PublicTab>("overview");
  const [showShare, setShowShare] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Fetch profile
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/by-username/${username}`, {
        headers: authUser ? getAuthHeaders() : {},
      });
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<{
        user: ProfileUser;
        reviewCount: number;
        bookingCount: number;
        followerCount: number;
        followingCount: number;
        followStatus: FollowStatus;
        isFollowing: boolean;
      }>;
    },
    enabled: !!username,
  });

  // Follow / unfollow
  const followMutation = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      const method = action === "follow" ? "POST" : "DELETE";
      const res = await fetch(`/api/users/${data?.user.id}/follow`, {
        method,
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-profile", username] });
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/user/${username}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">{t("Loading profile…", "جارٍ تحميل الملف…")}</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t("Profile not found", "الملف الشخصي غير موجود")}</h2>
          <p className="text-muted-foreground text-sm mb-4">{t(`@${username} doesn't exist on Tabaq.`, `@${username} غير موجود على طبق.`)}</p>
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/")}>
            {t("Go Home", "الرئيسية")}
          </Button>
        </div>
      </div>
    );
  }

  const { user, reviewCount, followerCount, followingCount, followStatus } = data;
  const isOwn = authUser && (authUser as any).id === user.id;
  const name = lang === "ar" ? user.nameAr || user.nameEn || username : user.nameEn || user.nameAr || username;
  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  const hasSocialLinks = user.instagramUrl || user.xUrl || user.tiktokUrl || user.snapchatUrl || user.websiteUrl;

  const tabs: Array<{ id: PublicTab; labelEn: string; labelAr: string }> = [
    { id: "overview", labelEn: "Overview", labelAr: "نظرة عامة" },
    { id: "reviews", labelEn: "Reviews", labelAr: "التقييمات" },
    { id: "visits", labelEn: "Visits", labelAr: "الزيارات" },
    { id: "favorites", labelEn: "Favorites", labelAr: "المفضلة" },
  ];

  const isPrivateAndNotFollowing = user.isPrivate && followStatus !== "following" && !isOwn;

  return (
    <div className="min-h-screen bg-background pb-24" dir={lang === "ar" ? "rtl" : "ltr"}>
      {showShare && (
        <ShareProfileModal
          username={username ?? ""}
          name={name ?? ""}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Cover photo */}
      <div className="relative h-52 sm:h-72 w-full overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-rose-700">
        {user.coverPhotoUrl && (
          <img
            src={user.coverPhotoUrl}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 start-4 w-10 h-10 rounded-2xl bg-black/30 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ transform: lang === "ar" ? "rotate(180deg)" : undefined }} />
        </button>

        {/* Action buttons */}
        <div className="absolute top-4 end-4 flex gap-2">
          <button
            onClick={handleCopyLink}
            className="w-10 h-10 rounded-2xl bg-black/30 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            title={t("Copy profile link", "نسخ رابط الملف")}
          >
            {linkCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="w-10 h-10 rounded-2xl bg-black/30 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Own profile shortcut */}
        {isOwn && (
          <Link href="/profile">
            <button className="absolute bottom-4 end-4 bg-white/20 backdrop-blur border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/30 transition-colors">
              {t("Edit Profile", "تعديل الملف")}
            </button>
          </Link>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Avatar & Identity */}
        <div className="flex flex-col sm:flex-row items-start gap-5 -mt-14 relative z-10 mb-6">
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-muted border-4 border-background shadow-xl overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={name ?? ""} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-rose-200 flex items-center justify-center">
                  <span className="text-4xl font-extrabold text-primary/60">
                    {(name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-2 -end-2 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-background shadow">
              L{user.level}
            </div>
          </div>

          <div className="flex-1 pt-16 sm:pt-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2 flex-wrap">
                  {name}
                  {user.isVerified && <ShieldCheck className="w-5 h-5 text-primary shrink-0" />}
                  {user.isPrivate && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> {t("Private", "خاص")}
                    </span>
                  )}
                </h1>
                {user.username && (
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                    <AtSign className="w-3.5 h-3.5" />{user.username}
                  </p>
                )}
              </div>

              {/* Follow / message buttons */}
              {!isOwn && authUser && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={followStatus === "following" ? "outline" : "default"}
                    className="rounded-2xl gap-1.5"
                    onClick={() => followMutation.mutate(followStatus === "following" ? "unfollow" : "follow")}
                    disabled={followMutation.isPending}
                  >
                    {followStatus === "following" ? (
                      <><UserMinus className="w-3.5 h-3.5" />{t("Following", "تتابع")}</>
                    ) : followStatus === "pending" ? (
                      <><Clock className="w-3.5 h-3.5" />{t("Requested", "طلب إرسال")}</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" />{t("Follow", "متابعة")}</>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-2xl gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />{t("Message", "رسالة")}
                  </Button>
                </div>
              )}
              {isOwn && (
                <Link href="/profile?tab=settings">
                  <Button size="sm" variant="outline" className="rounded-2xl">
                    {t("Edit Profile", "تعديل الملف")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bio, location, social links */}
        {user.bio && (
          <p className="text-foreground/80 text-[15px] leading-relaxed mb-3">{user.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
          {user.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />{user.location}
            </span>
          )}
          {joinYear && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />{t(`Joined ${joinYear}`, `عضو منذ ${joinYear}`)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4 shrink-0 text-amber-500" />{user.levelTitle}
          </span>
        </div>

        {/* Social icons */}
        {hasSocialLinks && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {user.instagramUrl && (
              <SocialLink href={`https://instagram.com/${user.instagramUrl.replace("@", "")}`} label="Instagram">
                <Instagram className="w-4 h-4" />
              </SocialLink>
            )}
            {user.xUrl && (
              <SocialLink href={`https://x.com/${user.xUrl.replace("@", "")}`} label="X">
                <span className="text-sm font-black">𝕏</span>
              </SocialLink>
            )}
            {user.tiktokUrl && (
              <SocialLink href={`https://tiktok.com/@${user.tiktokUrl.replace("@", "")}`} label="TikTok">
                <span className="text-sm font-black">♪</span>
              </SocialLink>
            )}
            {user.snapchatUrl && (
              <SocialLink href={`https://snapchat.com/add/${user.snapchatUrl.replace("@", "")}`} label="Snapchat">
                <span className="text-base">👻</span>
              </SocialLink>
            )}
            {user.websiteUrl && (
              <SocialLink href={user.websiteUrl} label="Website">
                <Link2 className="w-4 h-4" />
              </SocialLink>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { val: reviewCount, labelEn: "Reviews", labelAr: "تقييمات", tab: "reviews" as const },
            { val: DEMO_VISITS.length, labelEn: "Visits", labelAr: "زيارات", tab: "visits" as const },
            { val: followerCount, labelEn: "Followers", labelAr: "متابعون", tab: null },
            { val: followingCount, labelEn: "Following", labelAr: "يتابع", tab: null },
          ].map(stat => (
            <button
              key={stat.labelEn}
              onClick={() => stat.tab && setActiveTab(stat.tab)}
              className="bg-card border border-border/60 rounded-2xl py-3 px-2 text-center hover:shadow-sm hover:border-border transition-all"
            >
              <div className="text-xl font-extrabold text-foreground">{stat.val}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t(stat.labelEn, stat.labelAr)}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/60 rounded-2xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 shrink-0 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(tab.labelEn, tab.labelAr)}
            </button>
          ))}
        </div>

        {/* Private gate */}
        {isPrivateAndNotFollowing ? (
          <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
            <Lock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-foreground text-lg mb-2">{t("This account is private", "هذا الحساب خاص")}</h3>
            <p className="text-muted-foreground text-sm mb-5">
              {t(`Follow @${username} to see their food journey.`, `تابع @${username} لترى رحلتهم الطهوية.`)}
            </p>
            {authUser && (
              <Button
                className="rounded-2xl gap-2"
                onClick={() => followMutation.mutate("follow")}
                disabled={followMutation.isPending || followStatus === "pending"}
              >
                <UserPlus className="w-4 h-4" />
                {followStatus === "pending" ? t("Request Sent", "تم إرسال الطلب") : t("Follow", "متابعة")}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Food Journey summary */}
                <div className="bg-card border border-border/60 rounded-3xl p-5">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    {t("Food Journey", "رحلة الطعام")}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { val: DEMO_VISITS.length, labelEn: "Restaurants visited", labelAr: "مطعم مُزار", icon: MapPin },
                      { val: reviewCount, labelEn: "Reviews written", labelAr: "تقييم مكتوب", icon: Star },
                      { val: DEMO_FAVORITES.length, labelEn: "Favorites saved", labelAr: "مفضلة محفوظة", icon: Heart },
                    ].map(item => (
                      <div key={item.labelEn} className="text-center">
                        <item.icon className="w-6 h-6 text-primary mx-auto mb-1.5" />
                        <div className="text-2xl font-extrabold text-foreground">{item.val}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t(item.labelEn, item.labelAr)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Level card */}
                <div className="bg-gradient-to-br from-primary/5 to-rose-50 dark:to-rose-900/10 border border-primary/15 rounded-3xl p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Star className="w-7 h-7 text-primary fill-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("Tabaq Level", "مستوى طبق")}</p>
                    <p className="font-extrabold text-foreground text-lg">{t("Level", "المستوى")} {user.level}: {user.levelTitle}</p>
                    <p className="text-xs text-muted-foreground">{user.points} {t("food points", "نقطة طعام")}</p>
                  </div>
                </div>

                {/* Recent reviews preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground">{t("Recent Reviews", "آخر التقييمات")}</h3>
                    <button onClick={() => setActiveTab("reviews")} className="text-xs text-primary font-semibold hover:opacity-70">
                      {t("See all", "الكل")}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {DEMO_REVIEWS.slice(0, 2).map(review => (
                      <Link key={review.id} href={`/restaurants/${review.restaurantId}`}>
                        <div className="flex gap-3 bg-card border border-border/60 rounded-2xl p-3 hover:shadow-sm transition-shadow">
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                            <img src={review.restaurantImage} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {lang === "ar" ? review.restaurantNameAr : review.restaurantNameEn}
                              </span>
                              <StarRating rating={review.ratingOverall} />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{review.textEn}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                {DEMO_REVIEWS.map(review => (
                  <Link key={review.id} href={`/restaurants/${review.restaurantId}`}>
                    <article className="bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex gap-4 p-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-muted">
                          <img src={review.restaurantImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-foreground text-base leading-snug">
                              {lang === "ar" ? review.restaurantNameAr : review.restaurantNameEn}
                            </h3>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <StarRating rating={review.ratingOverall} />
                              <span className="text-xs text-muted-foreground">{review.visitDate}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{review.textEn}</p>
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                            {[
                              { label: "Food", labelAr: "طعام", val: review.ratingFood },
                              { label: "Service", labelAr: "خدمة", val: review.ratingService },
                              { label: "Ambiance", labelAr: "أجواء", val: review.ratingAmbiance },
                            ].map(r => (
                              <span key={r.label} className="text-xs text-muted-foreground">
                                {t(r.label, r.labelAr)} <span className="font-semibold text-foreground">{r.val}/5</span>
                              </span>
                            ))}
                            <span className="ms-auto flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="w-3 h-3" />{review.likeCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}

            {/* Visits Tab */}
            {activeTab === "visits" && (
              <div className="space-y-3">
                {DEMO_VISITS.map(visit => (
                  <Link key={visit.id} href={`/restaurants/${visit.restaurantId}`}>
                    <div className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                        <img src={visit.restaurantImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">
                          {lang === "ar" ? visit.restaurantNameAr : visit.restaurantNameEn}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{visit.cuisineEn}</p>
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="text-xs font-semibold text-foreground">{visit.visitDate}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {visit.partySize} {t("guests", "ضيوف")}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === "favorites" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEMO_FAVORITES.map(rest => (
                  <Link key={rest.id} href={`/restaurants/${rest.id}`}>
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="h-36 overflow-hidden">
                        <img
                          src={rest.coverImageUrl}
                          alt={rest.nameEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground text-sm">{lang === "ar" ? rest.nameAr : rest.nameEn}</p>
                          <p className="text-xs text-muted-foreground">{rest.cuisineEn}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {rest.avgRating}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PublicProfilePage;
