import React, { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { User, Settings, ShieldCheck, MapPin, Calendar, Star, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfilePage() {
  const { t, lang } = useLanguage();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const userId = authUser?.id ?? 0;
  const { data, isLoading } = useGetUser(userId, {
    query: { queryKey: getGetUserQueryKey(userId), enabled: !!authUser },
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
      <>
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
          <Button
            onClick={() => setLoginOpen(true)}
            className="gap-2 rounded-xl px-8 h-12 text-base font-semibold"
          >
            <LogIn className="w-5 h-5" />
            {t("Sign In", "تسجيل الدخول")}
          </Button>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
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
  const joinYear = user.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover */}
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

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{reviewCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("Reviews", "تقييمات")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{bookingCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("Bookings", "حجوزات")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{followerCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("Followers", "متابعون")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{followingCount ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("Following", "يتابع")}
                </div>
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
              </p>
            </div>
          </div>
          <div className="w-full sm:w-1/2">
            <div className="flex justify-between text-xs font-medium mb-2 text-muted-foreground">
              <span>{user.points} XP</span>
              <span>{t("Next level at 500 XP", "المستوى القادم عند ٥٠٠ نقطة")}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(((user.points ?? 0) / 500) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
