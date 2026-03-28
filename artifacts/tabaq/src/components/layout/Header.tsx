import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, MapPin, Globe, User, LogOut, ChevronDown, Tag, CalendarDays, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Header() {
  const { lang, toggleLanguage, t } = useLanguage();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", en: "Home", ar: "الرئيسية" },
    { href: "/restaurants", en: "Discovery", ar: "استكشف" },
    { href: "/collections", en: "Collections", ar: "المجموعات" },
    { href: "/offers", en: "Offers", ar: "العروض" },
    { href: "/leaderboard", en: "Leaderboard", ar: "المتصدرين" },
  ];

  const displayName = user
    ? lang === "ar"
      ? user.nameAr || user.nameEn
      : user.nameEn || user.nameAr
    : null;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Tabaq" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold tracking-tight text-primary">
            {t("Tabaq", "طبق")}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary relative py-2",
                location === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t(link.en, link.ar)}
              {location === link.href && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{t("Riyadh", "الرياض")}</span>
          </button>

          <Link href="/search" className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </Link>

          <button
            onClick={toggleLanguage}
            className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors flex items-center justify-center font-bold text-xs relative"
            title={t("Switch to Arabic", "التبديل للإنجليزية")}
          >
            <Globe className="w-5 h-5 absolute opacity-20" />
            <span className="z-10">{lang === "en" ? "ع" : "EN"}</span>
          </button>

          {/* Auth area */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border hover:border-primary transition-colors px-2 py-1 bg-secondary"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName || ""} className="w-full h-full object-cover" />
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
                  <div className="absolute end-0 top-12 z-50 bg-popover border border-border rounded-2xl shadow-xl py-2 w-48 animate-in fade-in zoom-in-95 duration-150">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      {t("My Profile", "ملفي الشخصي")}
                    </Link>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      {t("My Bookings", "حجوزاتي")}
                    </Link>
                    <Link
                      href="/vouchers"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {t("My Vouchers", "قسائمي")}
                    </Link>
                    <Link
                      href="/console"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                      {t("Business Console", "لوحة الأعمال")}
                    </Link>
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
            <Link
              href="/signin"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <User className="w-4 h-4" />
              {t("Sign In", "دخول")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
