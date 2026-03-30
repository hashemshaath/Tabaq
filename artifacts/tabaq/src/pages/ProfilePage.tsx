import React, { useState, useEffect, useRef } from "react";
import { getAuthHeaders } from '@/lib/api';
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import {
  useGetUser,
  getGetUserQueryKey,
  useGetUserActivity,
  getGetUserActivityQueryKey,
  useGetUserFollowers,
  getGetUserFollowersQueryKey,
  useGetUserFollowing,
  getGetUserFollowingQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  User, Settings, ShieldCheck, MapPin, Calendar, Star, LogIn,
  BookOpen, Clock, Users, AtSign, CheckCircle2, XCircle, Loader2,
  Gift, Copy, ChevronRight, Sparkles, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "activity" | "followers" | "following" | "settings";

const RESERVED_USERNAMES = ["tabaq", "admin", "api", "support", "help", "www", "mail", "root", "system", "official"];
const USERNAME_REGEX = /^[a-zA-Z0-9_\.]{3,30}$/;

function validateUsername(value: string): string | null {
  if (value.length < 3) return "At least 3 characters required";
  if (value.length > 30) return "Maximum 30 characters";
  if (!USERNAME_REGEX.test(value)) return "Only letters, numbers, underscores, and dots";
  if (value.startsWith(".") || value.endsWith(".")) return "Cannot start or end with a dot";
  if (value.includes("..")) return "No consecutive dots";
  if (RESERVED_USERNAMES.includes(value.toLowerCase())) return "This username is reserved";
  return null;
}

export function ProfilePage() {
  const { t, lang } = useLanguage();
  const { user: authUser, isLoading: authLoading, token } = useAuth();
  const [tab, setTab] = useState<Tab>("activity");

  // ─── Username state ─────────────────────────────────────────────
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  const userId = authUser?.id ?? 0;
  const { data, isLoading, refetch: refetchUser } = useGetUser(userId, {
    query: { queryKey: getGetUserQueryKey(userId), enabled: !!authUser },
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data: activityData } = useGetUserActivity(userId, undefined, {
    query: { queryKey: getGetUserActivityQueryKey(userId, undefined), enabled: !!authUser && tab === "activity" },
    request: authHeaders ? { headers: authHeaders } : undefined,
  });

  const { data: followersData } = useGetUserFollowers(userId, {
    query: { queryKey: getGetUserFollowersQueryKey(userId), enabled: !!authUser && tab === "followers" },
  });

  const { data: followingData } = useGetUserFollowing(userId, {
    query: { queryKey: getGetUserFollowingQueryKey(userId), enabled: !!authUser && tab === "following" },
  });

  // Pre-fill username if user already has one
  useEffect(() => {
    if (data?.user && (data.user as any).username) {
      setUsernameInput((data.user as any).username);
    }
  }, [data]);

  // Debounced availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = usernameInput.trim().toLowerCase();
    const validErr = validateUsername(val);
    if (!val) { setUsernameStatus("idle"); setUsernameError(null); return; }
    if (validErr) { setUsernameStatus("error"); setUsernameError(validErr); return; }

    // If it's the same as current saved username, show as available
    const currentUsername = (data?.user as any)?.username;
    if (currentUsername && val === currentUsername.toLowerCase()) {
      setUsernameStatus("available");
      setUsernameError(null);
      return;
    }

    setUsernameStatus("checking");
    setUsernameError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?username=${encodeURIComponent(val)}`);
        const json = await res.json();
        if (json.available) {
          setUsernameStatus("available");
        } else {
          setUsernameStatus("taken");
          setUsernameError("This username is already taken");
        }
      } catch {
        setUsernameStatus("error");
        setUsernameError("Could not check availability");
      }
    }, 500);
  }, [usernameInput, data]);

  const handleSaveUsername = async () => {
    if (usernameStatus !== "available") return;
    setUsernameSaving(true);
    try {
      const res = await fetch("/api/me/username", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: usernameInput.trim().toLowerCase() })
      });
      if (res.ok) {
        setUsernameSaved(true);
        setUsernameStatus("idle");
        refetchUser();
        setTimeout(() => setUsernameSaved(false), 3000);
      } else {
        const err = await res.json();
        setUsernameError(err?.message || "Failed to save username");
      }
    } catch {
      setUsernameError("Network error — please try again");
    } finally {
      setUsernameSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen p-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Sample profile hero (blurred/locked) */}
        <div className="h-44 md:h-56 bg-gradient-to-r from-primary/80 via-primary to-violet-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=300&fit=crop')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Sample Profile Card */}
          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-xl border border-border -mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-start">
              {/* Locked avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 border-4 border-card shadow-lg flex items-center justify-center">
                  <User className="w-12 h-12 text-primary/40" />
                </div>
                <div className="absolute inset-0 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <div className="h-7 w-40 bg-muted rounded-xl mx-auto sm:mx-0 mb-2 animate-pulse" />
                <div className="h-4 w-28 bg-muted/60 rounded-lg mx-auto sm:mx-0 mb-4 animate-pulse" />
                <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                  {[t('Reviews','تقييمات'), t('Bookings','حجوزات'), t('Followers','متابعون'), t('Points','نقاط')].map(label => (
                    <div key={label} className="text-center">
                      <div className="h-6 w-8 bg-muted rounded-lg mx-auto mb-1 animate-pulse" />
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Central CTA */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              {t('Unlock your food profile', 'أطلق عنان ملفك الغذائي')}
            </div>
            <h2 className="text-3xl font-extrabold text-foreground mb-3">
              {t('Your culinary identity awaits', 'هويتك الطهي في انتظارك')}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-7 text-base">
              {t(
                'Sign in to track your dining adventures, earn points, climb the leaderboard, and share your food stories.',
                'سجّل دخولك لتتبع مغامراتك الطعامية، وتجميع النقاط، والصعود في القائمة، ومشاركة قصصك الغذائية.'
              )}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/signin">
                <Button className="gap-2 rounded-xl px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20">
                  <LogIn className="w-5 h-5" />
                  {t('Sign In', 'تسجيل الدخول')}
                </Button>
              </Link>
              <Link href="/restaurants">
                <Button variant="outline" className="rounded-xl px-6 h-12 text-base font-semibold">
                  {t('Explore First', 'استكشف أولاً')}
                </Button>
              </Link>
            </div>
          </div>

          {/* What you get */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Star, title: t('Earn & Track Points', 'اجمع وتتبع النقاط'), desc: t('Every review and booking earns you points toward rewards.', 'كل تقييم وحجز يمنحك نقاطاً نحو المكافآت.'), color: 'bg-amber-50 text-amber-600' },
              { icon: Gift, title: t('Exclusive Vouchers', 'قسائم حصرية'), desc: t('Receive personalised discount vouchers from your favourite spots.', 'احصل على قسائم خصم مخصصة من أماكنك المفضلة.'), color: 'bg-rose-50 text-rose-600' },
              { icon: Users, title: t('Follow Foodies', 'تابع عشاق الطعام'), desc: t('Build your own community of trusted food critics.', 'ابنِ مجتمعك الخاص من نقاد الطعام الموثوقين.'), color: 'bg-blue-50 text-blue-600' },
              { icon: ChevronRight, title: t('Personalised Feed', 'تغذية مخصصة'), desc: t('Discover restaurants matched to your taste and history.', 'اكتشف مطاعم مناسبة لذوقك وتاريخك.'), color: 'bg-violet-50 text-violet-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex gap-4 p-5 bg-card border border-border rounded-2xl hover:shadow-sm transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !data?.user) {
    return (
      <div className="min-h-screen p-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { user, reviewCount, bookingCount, followerCount, followingCount } = data;
  const name = lang === "ar" ? user.nameAr || user.nameEn : user.nameEn || user.nameAr;
  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const levelMax = user.level === 5 ? 10000 : user.level === 4 ? 5000 : user.level === 3 ? 1500 : user.level === 2 ? 500 : 100;
  const levelMin = user.level === 5 ? 5000 : user.level === 4 ? 1500 : user.level === 3 ? 500 : user.level === 2 ? 100 : 0;
  const progressPct = Math.min(((user.points - levelMin) / (levelMax - levelMin)) * 100, 100);
  const currentUsername = (user as any).username as string | undefined;

  const usernameStatusIcon = () => {
    if (usernameStatus === "checking") return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    if (usernameStatus === "available") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (usernameStatus === "taken" || usernameStatus === "error") return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary/80 to-primary w-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl p-6 md:p-8 shadow-xl border border-border -mt-24 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-start">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted border-4 border-card shadow-lg shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={name || ""} className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-grow">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
                  {name}
                  {user.isVerified && <ShieldCheck className="w-6 h-6 text-primary" />}
                  {user.isEmailVerified && (
                    <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                      {t("Email Verified", "بريد مُحقَّق")}
                    </span>
                  )}
                </h1>
                {currentUsername && (
                  <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5" />
                    {currentUsername}
                  </p>
                )}
                <p className="text-muted-foreground mt-2 max-w-lg">
                  {user.bio || t("No bio provided.", "لم يتم كتابة نبذة.")}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {t("Riyadh", "الرياض")}
                  </span>
                  {joinYear && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {t(`Joined ${joinYear}`, `انضم ${joinYear}`)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setTab("settings")}
                className="shrink-0 flex items-center gap-2 px-4 py-2 border border-input rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Settings className="w-4 h-4" />
                {t("Edit Profile", "تعديل الملف")}
              </button>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{reviewCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("Reviews", "تقييمات")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{bookingCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("Bookings", "حجوزات")}</div>
              </div>
              <button className="text-center hover:opacity-70 transition-opacity" onClick={() => setTab("followers")}>
                <div className="text-2xl font-bold text-foreground">{followerCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("Followers", "متابعون")}</div>
              </button>
              <button className="text-center hover:opacity-70 transition-opacity" onClick={() => setTab("following")}>
                <div className="text-2xl font-bold text-foreground">{followingCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("Following", "يتابع")}</div>
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{user.points ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("Points", "نقاط")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Level Banner */}
        <div className="mt-8 bg-gradient-to-r from-accent to-background p-6 rounded-3xl border border-accent flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Star className="w-7 h-7 fill-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {t("Level", "المستوى")} {user.level}: {user.levelTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user.points} {t("Points", "نقطة")}
                {user.credibilityScore && parseFloat(String(user.credibilityScore)) > 0 && (
                  <span className="ms-2 text-primary font-medium">
                    · {t("Credibility:", "مصداقية:")} {parseFloat(String(user.credibilityScore)).toFixed(1)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-1/2">
            <div className="flex justify-between text-xs font-medium mb-2 text-muted-foreground">
              <span>{user.points} XP</span>
              <span>{t(`Next level at ${levelMax} XP`, `المستوى القادم عند ${levelMax} نقطة`)}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6 overflow-x-auto">
            {([
              { id: "activity", label: t("Activity", "النشاط"), icon: Clock },
              { id: "followers", label: t("Followers", "المتابعون"), icon: Users },
              { id: "following", label: t("Following", "يتابع"), icon: Users },
              { id: "settings", label: t("Settings", "الإعدادات"), icon: Settings },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap px-3 ${
                  tab === id
                    ? "bg-card shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Activity Tab */}
          {tab === "activity" && (
            <div className="space-y-4">
              {!activityData?.events?.length ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">{t("No activity yet", "لا يوجد نشاط بعد")}</p>
                  <p className="text-sm mt-1">{t("Start reviewing restaurants to build your history.", "ابدأ بتقييم المطاعم لبناء سجلك.")}</p>
                </div>
              ) : (
                activityData.events.map((event, i) => {
                  const d = (event.data ?? {}) as Record<string, unknown>;
                  const restaurantName = lang === "ar"
                    ? (d.restaurantNameAr as string) || (d.restaurantNameEn as string)
                    : (d.restaurantNameEn as string) || (d.restaurantNameAr as string);
                  const date = event.createdAt
                    ? new Date(event.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })
                    : "";
                  return (
                    <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        event.type === "review" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                      }`}>
                        {event.type === "review" ? <Star className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {event.type === "review"
                                ? t(`Reviewed ${restaurantName}`, `قيّمت ${restaurantName}`)
                                : t(`Booked at ${restaurantName}`, `حجزت في ${restaurantName}`)}
                            </p>
                            {event.type === "review" && (
                              <div className="flex gap-0.5 mt-1">
                                {Array.from({ length: 5 }).map((_, s) => (
                                  <Star key={s} className={`w-3 h-3 ${s < Number(d.ratingOverall) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                                ))}
                              </div>
                            )}
                            {event.type === "booking" && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {d.date as string} · {d.partySize as number} {t("guests", "ضيوف")} · <span className="capitalize">{d.status as string}</span>
                              </p>
                            )}
                            {event.type === "review" && (d.textEn || d.textAr) ? (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {String(lang === "ar" ? d.textAr || d.textEn : d.textEn || d.textAr)}
                              </p>
                            ) : null}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Followers Tab */}
          {tab === "followers" && (
            <div className="space-y-3">
              {!followersData?.length ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">{t("No followers yet", "لا يوجد متابعون بعد")}</p>
                </div>
              ) : (
                followersData.map((f) => {
                  const uname = lang === "ar" ? f.nameAr || f.nameEn : f.nameEn || f.nameAr;
                  return (
                    <div key={f.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-foreground">{uname}</p>
                        <p className="text-xs text-muted-foreground">{f.levelTitle}</p>
                      </div>
                      {f.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Following Tab */}
          {tab === "following" && (
            <div className="space-y-3">
              {!followingData?.length ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">{t("Not following anyone yet", "لا تتابع أحدًا بعد")}</p>
                </div>
              ) : (
                followingData.map((f) => {
                  const uname = lang === "ar" ? f.nameAr || f.nameEn : f.nameEn || f.nameAr;
                  return (
                    <div key={f.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-foreground">{uname}</p>
                        <p className="text-xs text-muted-foreground">{f.levelTitle}</p>
                      </div>
                      {f.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && (
            <div className="space-y-6">

              {/* Username Section */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                    <AtSign className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{t("Your Username", "اسم المستخدم")}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t("Choose a unique handle for your public profile", "اختر اسمًا مميزًا لملفك الشخصي العام")}
                    </p>
                  </div>
                  {currentUsername && (
                    <span className="ms-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      {t("Active", "مفعّل")}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {currentUsername && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <AtSign className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">{currentUsername}</span>
                      <span className="ms-auto text-xs text-muted-foreground">
                        {t("Current username", "الاسم الحالي")}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {currentUsername
                        ? t("Change username", "تغيير اسم المستخدم")
                        : t("Claim your username", "احجز اسم مستخدمك")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <AtSign className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                        placeholder="yourname"
                        maxLength={30}
                        className="w-full ps-9 pe-10 h-11 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                      <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                        {usernameStatusIcon()}
                      </div>
                    </div>

                    {/* Status message */}
                    {usernameInput && (
                      <div className={`mt-1.5 text-xs flex items-center gap-1.5 ${
                        usernameStatus === "available" ? "text-green-600"
                        : (usernameStatus === "taken" || usernameStatus === "error") ? "text-red-500"
                        : "text-muted-foreground"
                      }`}>
                        {usernameStatus === "available" && <><CheckCircle2 className="w-3 h-3" /> {t("Username is available!", "الاسم متاح!")}</>}
                        {usernameStatus === "taken" && <><XCircle className="w-3 h-3" /> {usernameError}</>}
                        {usernameStatus === "error" && <><XCircle className="w-3 h-3" /> {usernameError}</>}
                        {usernameStatus === "checking" && t("Checking availability...", "جارٍ التحقق...")}
                        {usernameStatus === "idle" && usernameInput.length > 0 && t("3–30 characters, letters, numbers, _ and .", "3–30 حرفًا، أحرف، أرقام، _ و .")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Your profile URL: tabaq.sa/@username",
                        "رابط ملفك: tabaq.sa/@username"
                      )}
                    </p>
                    <button
                      onClick={handleSaveUsername}
                      disabled={usernameStatus !== "available" || usernameSaving}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        usernameStatus === "available" && !usernameSaving
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {usernameSaving ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("Saving...", "جارٍ الحفظ...")}</>
                      ) : usernameSaved ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> {t("Saved!", "تم الحفظ!")}</>
                      ) : (
                        t("Save Username", "حفظ الاسم")
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Referral & Rewards Shortcut */}
              <Link href="/referral">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center shrink-0">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{t("Referral & Rewards", "الإحالات والمكافآت")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("Invite friends, earn points. Your balance:", "ادعُ أصدقاءك، اكسب نقاطًا. رصيدك:")}
                      {" "}<span className="text-primary font-semibold">{user.points ?? 0} pts</span>
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>

              {/* Account Settings Cards */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                <div className="p-5">
                  <h3 className="font-bold text-foreground mb-1">{t("Account", "الحساب")}</h3>
                  <p className="text-xs text-muted-foreground">{t("Manage your account preferences", "إدارة تفضيلات حسابك")}</p>
                </div>

                {[
                  {
                    icon: User,
                    label: t("Personal Information", "المعلومات الشخصية"),
                    desc: t("Name, email, phone number", "الاسم، البريد الإلكتروني، الهاتف"),
                    locked: false,
                  },
                  {
                    icon: Lock,
                    label: t("Password & Security", "كلمة المرور والأمان"),
                    desc: t("Change password, 2FA", "تغيير كلمة المرور، المصادقة الثنائية"),
                    locked: false,
                  },
                  {
                    icon: MapPin,
                    label: t("Saved Addresses", "العناوين المحفوظة"),
                    desc: t("Home, work, and other locations", "المنزل، العمل، والمواقع الأخرى"),
                    locked: false,
                  },
                  {
                    icon: Sparkles,
                    label: t("Preferences", "التفضيلات"),
                    desc: t("Cuisines, dietary requirements, notifications", "المطابخ، المتطلبات الغذائية، الإشعارات"),
                    locked: false,
                  },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  );
                })}
              </div>

              {/* Danger Zone */}
              <div className="bg-card border border-red-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-red-100">
                  <h3 className="font-bold text-red-600">{t("Danger Zone", "منطقة الخطر")}</h3>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("Delete Account", "حذف الحساب")}</p>
                    <p className="text-xs text-muted-foreground">{t("This action cannot be undone", "هذا الإجراء لا يمكن التراجع عنه")}</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                    {t("Delete", "حذف")}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
