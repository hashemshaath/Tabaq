import React, { useState } from "react";
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
import { User, Settings, ShieldCheck, MapPin, Calendar, Star, LogIn, BookOpen, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "activity" | "followers" | "following";

export function ProfilePage() {
  const { t, lang } = useLanguage();
  const { user: authUser, isLoading: authLoading, token } = useAuth();
  const [tab, setTab] = useState<Tab>("activity");

  const userId = authUser?.id ?? 0;
  const { data, isLoading } = useGetUser(userId, {
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

  if (authLoading) {
    return (
      <div className="min-h-screen p-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8">
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t("Sign in to view your profile", "سجّل دخولك لعرض ملفك الشخصي")}
        </h2>
        <p className="text-muted-foreground max-w-sm">
          {t(
            "Create an account or sign in to track your bookings, reviews, and rewards.",
            "أنشئ حسابًا أو سجّل دخولك لمتابعة حجوزاتك وتقييماتك ومكافآتك."
          )}
        </p>
        <Link href="/signin">
          <Button className="gap-2 rounded-xl px-8 h-12 text-base font-semibold">
            <LogIn className="w-5 h-5" />
            {t("Sign In", "تسجيل الدخول")}
          </Button>
        </Link>
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
              <Button variant="outline" className="shrink-0 gap-2 rounded-xl">
                <Settings className="w-4 h-4" />
                {t("Edit Profile", "تعديل الملف")}
              </Button>
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
          <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6">
            {([
              { id: "activity", label: t("Activity", "النشاط"), icon: Clock },
              { id: "followers", label: t("Followers", "المتابعون"), icon: Users },
              { id: "following", label: t("Following", "يتابع"), icon: Users },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
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
        </div>
      </div>
    </div>
  );
}
