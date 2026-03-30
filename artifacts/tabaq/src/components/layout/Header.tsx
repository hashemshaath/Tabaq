import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, MapPin, Globe, User, LogOut, ChevronDown, Tag,
  CalendarDays, LayoutDashboard, Trophy, Shield, Utensils,
  Bell, Menu, X, Home, Sparkles, BarChart3, ChefHat, Check
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { useListCitiesByCountry, useListCountries, type City } from "@workspace/api-client-react";
import { useLocalization } from "@/context/LocalizationContext";
import { cn } from "@/lib/utils";

function useUnreadCount(token: string | null, user: unknown) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiBase = typeof window !== "undefined"
    ? (import.meta.env.BASE_URL?.replace(/\/$/, "") || "")
    : "";

  useEffect(() => {
    if (!user || !token) { setCount(0); return; }

    const fetch_ = async () => {
      try {
        const res = await fetch(`${apiBase}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count ?? 0);
        }
      } catch {
        setCount(0);
      }
    };

    fetch_();
    intervalRef.current = setInterval(fetch_, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user, token, apiBase]);

  return count;
}

export function Header() {
  const { lang, toggleLanguage, t } = useLanguage();
  const { country } = useLocalization();
  const [location] = useLocation();
  const { user, token, logout } = useAuth();
  const {
    selectedCityId, selectedCityName, selectedCityNameAr,
    selectedNeighborhoodId, selectedNeighborhoodName, selectedNeighborhoodNameAr,
    setCity, setNeighborhood, clearCity, clearNeighborhood, getNeighborhoods,
  } = useCity();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [neighborhoodStep, setNeighborhoodStep] = useState(false);
  const unreadCount = useUnreadCount(token, user);
  const { data: countries } = useListCountries();
  const countryId = countries?.find((c) => c.code === country.code)?.id ?? null;
  const { data: cities } = useListCitiesByCountry(countryId ?? 0, { query: { enabled: countryId !== null } });

  const neighborhoods = getNeighborhoods();

  const cityLabel = (() => {
    const cName = lang === 'ar' ? selectedCityNameAr : selectedCityName;
    if (!selectedCityId) return t('All Cities', 'كل المدن');
    if (selectedNeighborhoodId) {
      const nName = lang === 'ar' ? selectedNeighborhoodNameAr : selectedNeighborhoodName;
      return `${cName} · ${nName}`;
    }
    return cName ?? t('Select City', 'اختر مدينة');
  })();

  const isAdmin = (user as any)?.isAdmin === true;
  const isOwner = (user as any)?.isOwner === true;

  const navLinks = [
    { href: "/", en: "Home", ar: "الرئيسية", icon: Home },
    { href: "/restaurants", en: "Discovery", ar: "استكشف", icon: Search },
    { href: "/experiences", en: "Experiences", ar: "التجارب", icon: ChefHat },
    { href: "/offers", en: "Offers", ar: "العروض", icon: Sparkles },
    { href: "/leaderboard", en: "Leaderboard", ar: "المتصدرين", icon: Trophy },
  ];

  const displayName = user
    ? lang === "ar"
      ? (user as any).nameAr || (user as any).nameEn
      : (user as any).nameEn || (user as any).nameAr
    : null;

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}images/tabaq-logo.png`}
            alt="Tabaq"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground relative py-2 tracking-[-0.01em]",
                isActive(link.href) ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {t(link.en, link.ar)}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
          <Link
            href="/partners"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground relative py-2 flex items-center gap-1 tracking-[-0.01em]",
              isActive("/partners") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Utensils className="w-3.5 h-3.5" />
            {t("For Partners", "للشركاء")}
            {isActive("/partners") && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* City Selector */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setCityMenuOpen(v => !v)}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors py-2 px-3 rounded-lg hover:bg-accent",
                selectedCityId ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="max-w-[120px] truncate">{cityLabel}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", cityMenuOpen && "rotate-180")} />
            </button>

            {cityMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setCityMenuOpen(false); setNeighborhoodStep(false); }} />
                <div className="absolute start-0 top-12 z-50 bg-popover border border-border rounded-2xl shadow-xl py-2 w-64 animate-in fade-in zoom-in-95 duration-150">
                  {!neighborhoodStep ? (
                    <>
                      <div className="px-4 py-2 border-b border-border mb-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('Select City', 'اختر مدينة')}</p>
                      </div>

                      <button
                        onClick={() => { clearCity(); setCityMenuOpen(false); setNeighborhoodStep(false); }}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start",
                          !selectedCityId && "text-primary font-semibold"
                        )}
                      >
                        <span>{t('All Cities', 'كل المدن')}</span>
                        {!selectedCityId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>

                      {cities && cities.length > 0 && (
                        <div className="max-h-64 overflow-y-auto">
                          {cities.map((city: City) => (
                            <button
                              key={city.id}
                              onClick={() => {
                                setCity(city.id, city.nameEn, city.nameAr);
                                setNeighborhoodStep(true);
                              }}
                              className={cn(
                                "flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start",
                                selectedCityId === city.id && "text-primary font-semibold"
                              )}
                            >
                              <span>{lang === 'ar' ? city.nameAr : city.nameEn}</span>
                              {selectedCityId === city.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 border-b border-border mb-1 flex items-center gap-2">
                        <button
                          onClick={() => setNeighborhoodStep(false)}
                          className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                        >
                          ← {t('Back', 'رجوع')}
                        </button>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ms-auto">{t('Neighborhood', 'الحي')}</p>
                      </div>

                      <div className="px-3 py-1.5 text-xs font-semibold text-primary border-b border-border/50 mb-1">
                        {lang === 'ar' ? selectedCityNameAr : selectedCityName}
                      </div>

                      <button
                        onClick={() => { clearNeighborhood(); setCityMenuOpen(false); setNeighborhoodStep(false); }}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start",
                          !selectedNeighborhoodId && "text-primary font-semibold"
                        )}
                      >
                        <span>{t('All Neighborhoods', 'كل الأحياء')}</span>
                        {!selectedNeighborhoodId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>

                      {neighborhoods.length > 0 ? (
                        <div className="max-h-56 overflow-y-auto">
                          {neighborhoods.map((nb) => (
                            <button
                              key={nb.id}
                              onClick={() => { setNeighborhood(nb.id, nb.nameEn, nb.nameAr); setCityMenuOpen(false); setNeighborhoodStep(false); }}
                              className={cn(
                                "flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start",
                                selectedNeighborhoodId === nb.id && "text-primary font-semibold"
                              )}
                            >
                              <span>{lang === 'ar' ? nb.nameAr : nb.nameEn}</span>
                              {selectedNeighborhoodId === nb.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-xs text-muted-foreground italic">
                          {t('No neighborhoods available', 'لا توجد أحياء متاحة')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <Link href="/search" className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </Link>

          {user && (
            <Link href="/notifications" className="relative p-2.5 rounded-full hover:bg-accent text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 end-1.5 min-w-[10px] h-[10px] bg-primary rounded-full border-2 border-background flex items-center justify-center">
                  {unreadCount > 9 ? null : null}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={toggleLanguage}
            className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors flex items-center justify-center font-bold text-xs relative"
            title={t("Switch to Arabic", "التبديل للإنجليزية")}
          >
            <Globe className="w-5 h-5 absolute opacity-20" />
            <span className="z-10">{lang === "en" ? "ع" : "EN"}</span>
          </button>

          {/* Auth area — desktop */}
          {user ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border hover:border-primary transition-colors px-2 py-1 bg-secondary"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {(user as any).avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt={displayName || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-24 truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute end-0 top-12 z-50 bg-popover border border-border rounded-2xl shadow-xl py-2 w-56 animate-in fade-in zoom-in-95 duration-150">

                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("My Account", "حسابي")}</p>
                    </div>

                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("My Dashboard", "لوحتي")}</p>
                        <p className="text-xs text-muted-foreground">{t("Profile, points & history", "الملف والنقاط والتاريخ")}</p>
                      </div>
                    </Link>

                    <Link href="/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center relative">
                        <Bell className="w-3.5 h-3.5 text-primary" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("Notifications", "الإشعارات")}</p>
                        <p className="text-xs text-muted-foreground">
                          {unreadCount > 0 ? t(`${unreadCount} unread`, `${unreadCount} غير مقروء`) : t("Bookings, offers & more", "الحجوزات والعروض وأكثر")}
                        </p>
                      </div>
                    </Link>

                    <Link href="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("My Bookings", "حجوزاتي")}</p>
                        <p className="text-xs text-muted-foreground">{t("Upcoming & past", "القادمة والسابقة")}</p>
                      </div>
                    </Link>

                    <Link href="/vouchers" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("My Vouchers", "قسائمي")}</p>
                        <p className="text-xs text-muted-foreground">{t("Offers & promotions", "العروض والترقيات")}</p>
                      </div>
                    </Link>

                    <Link href="/leaderboard" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("Leaderboard", "المتصدرون")}</p>
                        <p className="text-xs text-muted-foreground">{t("Rank & rewards", "الترتيب والمكافآت")}</p>
                      </div>
                    </Link>

                    {/* Business/Admin section */}
                    <div className="px-4 py-2 border-t border-b border-border mt-1 mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Business", "الأعمال")}</p>
                    </div>

                    {isOwner && (
                      <Link href="/console" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                          <LayoutDashboard className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-none">{t("Business Console", "لوحة الأعمال")}</p>
                          <p className="text-xs text-muted-foreground">{t("Manage your restaurant", "إدارة مطعمك")}</p>
                        </div>
                      </Link>
                    )}

                    <Link href="/console/experiences" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("Experiences Console", "لوحة التجارب")}</p>
                        <p className="text-xs text-muted-foreground">{t("Host food experiences", "استضف تجارب طعام")}</p>
                      </div>
                    </Link>

                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-none">{t("Admin Panel", "لوحة الإدارة")}</p>
                          <p className="text-xs text-muted-foreground">{t("Platform management", "إدارة المنصة")}</p>
                        </div>
                      </Link>
                    )}

                    <hr className="border-border my-1" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("Sign Out", "تسجيل الخروج")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/partners"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                <Utensils className="w-3.5 h-3.5" />
                {t("For Restaurants", "للمطاعم")}
              </Link>
              <Link
                href="/signin"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <User className="w-4 h-4" />
                {t("Sign In", "دخول")}
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2.5 rounded-full hover:bg-accent text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-full start-0 end-0 z-50 bg-popover border-b border-border shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

              {/* Nav links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {t(link.en, link.ar)}
                </Link>
              ))}

              <Link
                href="/partners"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive("/partners") ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                )}
              >
                <Utensils className="w-4 h-4" />
                {t("For Partners", "للشركاء")}
              </Link>

              <div className="h-px bg-border my-2" />

              {/* Mobile City Selector */}
              {cities && cities.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <MapPin className="w-3 h-3 inline me-1" />
                    {t('City', 'المدينة')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => clearCity()}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        !selectedCityId
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {t('All', 'الكل')}
                    </button>
                    {cities.slice(0, 8).map((city: City) => (
                      <button
                        key={city.id}
                        onClick={() => setCity(city.id, city.nameEn, city.nameAr)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          selectedCityId === city.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {lang === 'ar' ? city.nameAr : city.nameEn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Neighborhood Selector — shown only after a city is selected */}
              {selectedCityId && neighborhoods.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t('Neighborhood', 'الحي')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => clearNeighborhood()}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        !selectedNeighborhoodId
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {t('All', 'الكل')}
                    </button>
                    {neighborhoods.map((nb) => (
                      <button
                        key={nb.id}
                        onClick={() => setNeighborhood(nb.id, nb.nameEn, nb.nameAr)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          selectedNeighborhoodId === nb.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {lang === 'ar' ? nb.nameAr : nb.nameEn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px bg-border my-2" />

              {/* Auth section */}
              {user ? (
                <>
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                        {(user as any).avatarUrl ? (
                          <img src={(user as any).avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{t("Diner Account", "حساب متذوق")}</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    {t("My Dashboard", "لوحتي")}
                  </Link>
                  <Link href="/bookings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                    <CalendarDays className="w-4 h-4" />
                    {t("My Bookings", "حجوزاتي")}
                  </Link>
                  <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                    <div className="relative">
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && <span className="absolute -top-1 -end-1 w-2 h-2 bg-primary rounded-full" />}
                    </div>
                    <span>{t("Notifications", "الإشعارات")}</span>
                    {unreadCount > 0 && <span className="ms-auto text-xs font-bold text-primary">{unreadCount}</span>}
                  </Link>

                  <div className="h-px bg-border my-1" />
                  {isOwner && (
                    <Link href="/console" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      {t("Business Console", "لوحة الأعمال")}
                    </Link>
                  )}
                  <Link href="/console/experiences" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                    <ChefHat className="w-4 h-4 text-orange-500" />
                    {t("Experiences Console", "لوحة التجارب")}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                      <Shield className="w-4 h-4 text-red-500" />
                      {t("Admin Panel", "لوحة الإدارة")}
                    </Link>
                  )}

                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("Sign Out", "تسجيل الخروج")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <User className="w-4 h-4" />
                    {t("Sign In", "دخول")}
                  </Link>
                  <Link href="/partners" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:border-primary hover:text-primary transition-colors">
                    <Utensils className="w-4 h-4" />
                    {t("Register Your Restaurant", "سجّل مطعمك")}
                  </Link>
                </>
              )}

              <div className="h-px bg-border my-2" />
              <div className="px-4 pb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("Language", "اللغة")}</span>
                <button
                  onClick={() => { toggleLanguage(); }}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  {lang === "en" ? "العربية" : "English"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
