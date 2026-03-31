import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, MapPin, Globe, User, LogOut, ChevronDown, Tag,
  CalendarDays, LayoutDashboard, Trophy, Shield, Utensils,
  Bell, Menu, X, Home, Sparkles, BarChart3, ChefHat, Check,
  Settings, Award, ShoppingBag, Crown, Star, Zap,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { useCart } from "@/context/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { useListCitiesByCountry, useListCountries, type City } from "@workspace/api-client-react";
import { useLocalization } from "@/context/LocalizationContext";
import { cn } from "@/lib/utils";

// ─── Unread count hook ────────────────────────────────────────────────────────
function useUnreadCount(token: string | null, user: unknown) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  useEffect(() => {
    if (!user || !token) { setCount(0); return; }
    const fetch_ = async () => {
      try {
        const res = await fetch(`${apiBase}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const d = await res.json(); setCount(d.count ?? 0); }
      } catch { setCount(0); }
    };
    fetch_();
    intervalRef.current = setInterval(fetch_, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user, token, apiBase]);

  return count;
}

// ─── City selector dropdown ───────────────────────────────────────────────────
function CitySelector() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const { country } = useLocalization();
  const {
    selectedCityId, selectedCityName, selectedCityNameAr,
    selectedNeighborhoodId, selectedNeighborhoodName, selectedNeighborhoodNameAr,
    setCity, setNeighborhood, clearCity, clearNeighborhood, getNeighborhoods,
  } = useCity();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"city" | "neighborhood">("city");
  const { data: countries } = useListCountries();
  const countryId = countries?.find((c) => c.code === country.code)?.id ?? null;
  const { data: cities } = useListCitiesByCountry(countryId ?? 0, { query: { queryKey: ["cities-by-country", countryId], enabled: countryId !== null } });
  const neighborhoods = getNeighborhoods();

  const cityLabel = (() => {
    if (!selectedCityId) return t("All Cities", "كل المدن");
    const cName = lang === "ar" ? selectedCityNameAr : selectedCityName;
    if (selectedNeighborhoodId) {
      const nName = lang === "ar" ? selectedNeighborhoodNameAr : selectedNeighborhoodName;
      return `${cName} · ${nName}`;
    }
    return cName ?? t("Select City", "اختر مدينة");
  })();

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => { setOpen(v => !v); setStep("city"); }}
        className={cn(
          "flex items-center gap-2 text-sm font-medium transition-colors py-2 px-3 rounded-lg hover:bg-accent",
          selectedCityId ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="max-w-[120px] truncate">{cityLabel}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setStep("city"); }} />
          <div className="absolute start-0 top-12 z-50 bg-popover border border-border rounded-2xl shadow-xl py-2 w-64 animate-in fade-in zoom-in-95 duration-150">
            {step === "city" ? (
              <>
                <div className="px-4 py-2 border-b border-border mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Select City", "اختر مدينة")}</p>
                </div>
                <button
                  onClick={() => { clearCity(); setOpen(false); }}
                  className={cn("flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start", !selectedCityId && "text-primary font-semibold")}
                >
                  <span>{t("All Cities", "كل المدن")}</span>
                  {!selectedCityId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
                <div className="max-h-64 overflow-y-auto">
                  {cities?.map((city: City) => (
                    <button
                      key={city.id}
                      onClick={() => { setCity(city.id, city.nameEn, city.nameAr); setStep("neighborhood"); }}
                      className={cn("flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start", selectedCityId === city.id && "text-primary font-semibold")}
                    >
                      <span>{lang === "ar" ? city.nameAr : city.nameEn}</span>
                      {selectedCityId === city.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-border mb-1 flex items-center gap-2">
                  <button onClick={() => setStep("city")} className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                    ← {t("Back", "رجوع")}
                  </button>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ms-auto">{t("Neighborhood", "الحي")}</p>
                </div>
                <div className="px-3 py-1.5 text-xs font-semibold text-primary border-b border-border/50 mb-1">
                  {lang === "ar" ? selectedCityNameAr : selectedCityName}
                </div>
                <button
                  onClick={() => { clearNeighborhood(); setOpen(false); setStep("city"); }}
                  className={cn("flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start", !selectedNeighborhoodId && "text-primary font-semibold")}
                >
                  <span>{t("All Neighborhoods", "كل الأحياء")}</span>
                  {!selectedNeighborhoodId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
                {neighborhoods.length > 0 ? (
                  <div className="max-h-56 overflow-y-auto">
                    {neighborhoods.map((nb) => (
                      <button
                        key={nb.id}
                        onClick={() => { setNeighborhood(nb.id, nb.nameEn, nb.nameAr); setOpen(false); setStep("city"); }}
                        className={cn("flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-start", selectedNeighborhoodId === nb.id && "text-primary font-semibold")}
                      >
                        <span>{lang === "ar" ? nb.nameAr : nb.nameEn}</span>
                        {selectedNeighborhoodId === nb.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-xs text-muted-foreground italic">{t("No neighborhoods available", "لا توجد أحياء متاحة")}</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Shared menu data ─────────────────────────────────────────────────────────
const ACTIVITY_ITEMS = [
  { href: "/dashboard",      icon: LayoutDashboard, iconBg: "bg-primary/10 text-primary",                                        label: "Dashboard",         labelAr: "لوحتي",                desc: "Points & history",            descAr: "النقاط والتاريخ",          isNotif: false, isGold: false },
  { href: "/notifications",  icon: Bell,            iconBg: "bg-primary/10 text-primary",                                        label: "Notifications",     labelAr: "الإشعارات",            desc: "Bookings, offers & more",     descAr: "الحجوزات والعروض وأكثر",  isNotif: true,  isGold: false },
  { href: "/orders",         icon: ShoppingBag,     iconBg: "bg-primary/10 text-primary",                                        label: "My Orders",         labelAr: "طلباتي",               desc: "Track & reorder",             descAr: "تتبع وإعادة الطلب",       isNotif: false, isGold: false },
  { href: "/bookings",       icon: CalendarDays,    iconBg: "bg-blue-100 text-blue-600",                                         label: "My Bookings",       labelAr: "حجوزاتي",              desc: "Upcoming & past",             descAr: "القادمة والسابقة",         isNotif: false, isGold: false },
  { href: "/vouchers",       icon: Tag,             iconBg: "bg-purple-100 text-purple-600",                                     label: "My Vouchers",       labelAr: "قسائمي",               desc: "Offers & promotions",         descAr: "العروض والترقيات",         isNotif: false, isGold: false },
  { href: "/gold",           icon: Crown,           iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500 text-white",         label: "Tabaq Gold",        labelAr: "طبق الذهبي",           desc: "Membership & perks",          descAr: "العضوية والمزايا",         isNotif: false, isGold: true  },
] as const;

const ACCOUNT_ITEMS = [
  { href: "/account", icon: Settings, iconBg: "bg-primary/10 text-primary", label: "Account & Settings", labelAr: "الحساب والإعدادات", desc: "Profile, privacy, security & more", descAr: "الملف الشخصي والخصوصية والأمان" },
] as const;

// ─── Account dropdown (desktop) ───────────────────────────────────────────────
function AccountMenu({ user, token, logout }: { user: any; token: string | null; logout: () => void }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadCount(token, user);

  const close = () => setOpen(false);
  const displayName = lang === "ar" ? (user.nameAr || user.nameEn) : (user.nameEn || user.nameAr);
  const isAdmin = user?.isAdmin === true;
  const isOwner = user?.isOwner === true;

  const MenuItem = ({ href, icon: Icon, iconBg, label, labelAr, desc, descAr, badge }: {
    href: string; icon: React.ElementType; iconBg: string;
    label: string; labelAr: string; desc?: string; descAr?: string; badge?: React.ReactNode;
  }) => (
    <Link href={href} onClick={close}
      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
    >
      <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground leading-none">{t(label, labelAr)}</p>
        {(desc || descAr) && <p className="text-xs text-muted-foreground mt-0.5">{t(desc!, descAr ?? desc!)}</p>}
      </div>
      {badge}
    </Link>
  );

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full border border-border hover:border-primary transition-colors px-2 py-1 bg-secondary"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={displayName || ""} className="w-full h-full object-cover" />
            : <User className="w-4 h-4 text-primary" />}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute end-0 top-12 z-50 bg-popover border border-border rounded-2xl shadow-xl py-2 w-72 animate-in fade-in zoom-in-95 duration-150">

            {/* Profile mini-card */}
            <Link
              href={user.username ? `/${user.username}` : "/dashboard"}
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border mb-1"
            >
              <div className="w-11 h-11 rounded-full bg-primary/20 shrink-0 overflow-hidden ring-2 ring-primary/20">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={displayName || ""} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm leading-tight truncate">{displayName}</p>
                {user.username && <p className="text-xs text-muted-foreground truncate">@{user.username}</p>}
                <p className="text-[10px] text-primary font-semibold mt-0.5">{t("View public profile →", "عرض الملف العام ←")}</p>
              </div>
            </Link>

            {/* My Activity */}
            <div className="px-4 py-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("My Activity", "نشاطي")}</p>
            </div>

            {ACTIVITY_ITEMS.map((item) => (
              <MenuItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                iconBg={item.iconBg}
                label={item.label}
                labelAr={item.labelAr}
                desc={item.isNotif && unreadCount > 0 ? `${unreadCount} unread` : item.desc}
                descAr={item.isNotif && unreadCount > 0 ? `${unreadCount} غير مقروء` : item.descAr}
                badge={item.isNotif && unreadCount > 0 ? <span className="text-xs font-bold text-white bg-primary px-1.5 py-0.5 rounded-full shrink-0">{unreadCount}</span> : undefined}
              />
            ))}

            {/* Account */}
            <div className="px-4 py-1.5 mt-1 border-t border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("Account", "الحساب")}</p>
            </div>
            {ACCOUNT_ITEMS.map((item) => (
              <MenuItem key={item.href} href={item.href} icon={item.icon} iconBg={item.iconBg} label={item.label} labelAr={item.labelAr} desc={item.desc} descAr={item.descAr} />
            ))}

            {/* Business (conditional) */}
            {(isOwner || isAdmin) && (
              <>
                <div className="px-4 py-1.5 mt-1 border-t border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("Business", "الأعمال")}</p>
                </div>
                {isOwner && <MenuItem href="/console" icon={BarChart3} iconBg="bg-green-100 text-green-600" label="Business Console" labelAr="لوحة الأعمال" desc="Manage your restaurant" descAr="إدارة مطعمك" />}
                {isOwner && <MenuItem href="/console/experiences" icon={ChefHat} iconBg="bg-orange-100 text-orange-600" label="Experiences Console" labelAr="لوحة التجارب" desc="Host food experiences" descAr="استضف تجارب طعام" />}
                {isAdmin && <MenuItem href="/admin" icon={Shield} iconBg="bg-red-100 text-red-600" label="Admin Panel" labelAr="لوحة الإدارة" desc="Platform management" descAr="إدارة المنصة" />}
                {isAdmin && <MenuItem href="/settings" icon={Settings} iconBg="bg-slate-100 text-slate-600" label="Platform Settings" labelAr="إعدادات المنصة" desc="Analytics & integrations" descAr="التحليلات والتكاملات" />}
              </>
            )}

            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => { logout(); close(); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                {t("Sign Out", "تسجيل الخروج")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose, navLinks, user, logout, unreadCount, cities, selectedCityId, selectedCityNameAr, selectedCityName, setCity, clearCity, neighborhoods, selectedNeighborhoodId, setNeighborhood, clearNeighborhood }: {
  open: boolean; onClose: () => void; navLinks: any[];
  user: any; logout: () => void; unreadCount: number;
  cities: City[] | undefined; selectedCityId: number | null;
  selectedCityName: string | null; selectedCityNameAr: string | null;
  setCity: (id: number, en: string, ar: string) => void; clearCity: () => void;
  neighborhoods: { id: number; nameEn: string; nameAr: string }[];
  selectedNeighborhoodId: number | null;
  setNeighborhood: (id: number, en: string, ar: string) => void;
  clearNeighborhood: () => void;
}) {
  const { lang, toggleLanguage } = useLanguage();
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [location] = useLocation();
  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);
  const displayName = user ? (lang === "ar" ? (user.nameAr || user.nameEn) : (user.nameEn || user.nameAr)) : null;
  const isAdmin = user?.isAdmin === true;
  const isOwner = user?.isOwner === true;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-full start-0 end-0 z-50 bg-popover border-b border-border shadow-xl animate-in slide-in-from-top-2 duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

          {/* Nav links */}
          {navLinks.map((link: any) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive(link.href) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
              )}
            >
              <link.icon className="w-4 h-4" />
              {t(link.en, link.ar)}
            </Link>
          ))}

          <div className="h-px bg-border my-2" />

          {/* City filter */}
          {cities && cities.length > 0 && (
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <MapPin className="w-3 h-3 inline me-1" />{t("City", "المدينة")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => clearCity()}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all", !selectedCityId ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                >
                  {t("All", "الكل")}
                </button>
                {cities.slice(0, 8).map((city: City) => (
                  <button key={city.id} onClick={() => setCity(city.id, city.nameEn, city.nameAr)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all", selectedCityId === city.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                  >
                    {lang === "ar" ? city.nameAr : city.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Neighborhood filter */}
          {selectedCityId && neighborhoods.length > 0 && (
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("Neighborhood", "الحي")}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => clearNeighborhood()}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all", !selectedNeighborhoodId ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                >
                  {t("All", "الكل")}
                </button>
                {neighborhoods.map((nb) => (
                  <button key={nb.id} onClick={() => setNeighborhood(nb.id, nb.nameEn, nb.nameAr)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all", selectedNeighborhoodId === nb.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                  >
                    {lang === "ar" ? nb.nameAr : nb.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-border my-2" />

          {/* Auth section */}
          {user ? (
            <>
              {/* Profile block */}
              <Link href={user.username ? `/${user.username}` : "/dashboard"} onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <User className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{displayName}</p>
                  <p className="text-xs text-primary">{t("View profile →", "عرض الملف ←")}</p>
                </div>
              </Link>

              {/* نشاطي / My Activity */}
              <div className="px-4 pt-2 pb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("My Activity", "نشاطي")}</p>
              </div>
              {ACTIVITY_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    item.isGold ? "text-amber-700 hover:bg-amber-50" : "text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", item.isGold && "text-amber-500")} />
                  <span className="flex-1">{t(item.label, item.labelAr)}</span>
                  {item.isNotif && unreadCount > 0 && <span className="text-xs font-bold text-white bg-primary px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                  {item.isGold && <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">GOLD</span>}
                </Link>
              ))}

              {/* الحساب / Account */}
              <div className="px-4 pt-2 pb-1 border-t border-border mt-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("Account", "الحساب")}</p>
              </div>
              {ACCOUNT_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{t(item.label, item.labelAr)}</span>
                </Link>
              ))}

              {/* الأعمال / Business links (owner/admin) */}
              {(isOwner || isAdmin) && (
                <>
                  <div className="px-4 pt-2 pb-1 border-t border-border mt-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("Business", "الأعمال")}</p>
                  </div>
                  {isOwner && (
                    <Link href="/console" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                      <BarChart3 className="w-4 h-4 text-green-600" />{t("Business Console", "لوحة الأعمال")}
                    </Link>
                  )}
                  {isOwner && (
                    <Link href="/console/experiences" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                      <ChefHat className="w-4 h-4 text-orange-500" />{t("Experiences Console", "لوحة التجارب")}
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                      <Shield className="w-4 h-4 text-red-500" />{t("Admin Panel", "لوحة الإدارة")}
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                      <Settings className="w-4 h-4 text-slate-500" />{t("Platform Settings", "إعدادات المنصة")}
                    </Link>
                  )}
                </>
              )}

              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { logout(); onClose(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />{t("Sign Out", "تسجيل الخروج")}
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <User className="w-4 h-4" />{t("Sign In", "دخول")}
              </Link>
              <Link href="/partners" onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                <Utensils className="w-4 h-4" />{t("Register Your Restaurant", "سجّل مطعمك")}
              </Link>
            </>
          )}

          <div className="h-px bg-border my-2" />
          <div className="px-4 pb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("Language", "اللغة")}</span>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:border-primary hover:text-primary transition-colors"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const unreadCount = useUnreadCount(token, user);
  const { totalItems } = useCart();
  const { data: countries } = useListCountries();
  const countryId = countries?.find((c) => c.code === country.code)?.id ?? null;
  const { data: cities } = useListCitiesByCountry(countryId ?? 0, { query: { queryKey: ["cities-by-country", countryId], enabled: countryId !== null } });
  const neighborhoods = getNeighborhoods();

  const navLinks = [
    { href: "/",            en: "Home",           ar: "الرئيسية",      icon: Home },
    { href: "/restaurants", en: "Explore",         ar: "استكشف",        icon: Search },
    { href: "/experiences", en: "Experiences",     ar: "التجارب",       icon: Utensils },
    { href: "/catering",    en: "Catering",        ar: "التموين",       icon: ChefHat },
    { href: "/offers",      en: "Offers",          ar: "العروض",        icon: Sparkles },
    { href: "/michelin",    en: "Michelin",        ar: "ميشلان",        icon: Award },
    { href: "/leaderboard", en: "Leaderboard",     ar: "المتصدرون",     icon: Trophy },
  ];

  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}images/tabaq-logo.png`}
              alt="Tabaq"
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5">
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* City Selector */}
            <CitySelector />

            {/* Search */}
            <Link href="/search" className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors">
              <Search className="w-5 h-5" />
            </Link>

            {/* Notifications (logged in) */}
            {user && (
              <Link href="/notifications" className="relative p-2.5 rounded-full hover:bg-accent text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 end-1.5 min-w-[10px] h-[10px] bg-primary rounded-full border-2 border-background" />
                )}
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2.5 rounded-full hover:bg-accent text-foreground transition-colors"
              aria-label={t("Cart", "السلة")}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 end-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center px-0.5 border-2 border-background leading-none">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors flex items-center justify-center font-bold text-xs relative"
              title={t("Switch to Arabic", "التبديل للإنجليزية")}
            >
              <Globe className="w-5 h-5 absolute opacity-20" />
              <span className="z-10">{lang === "en" ? "ع" : "EN"}</span>
            </button>

            {/* Account menu (desktop) or Sign In */}
            {user ? (
              <AccountMenu user={user} token={token} logout={logout} />
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
              onClick={() => setMobileMenuOpen(v => !v)}
              className="lg:hidden p-2.5 rounded-full hover:bg-accent text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
        user={user}
        logout={logout}
        unreadCount={unreadCount}
        cities={cities}
        selectedCityId={selectedCityId}
        selectedCityName={selectedCityName}
        selectedCityNameAr={selectedCityNameAr}
        setCity={setCity}
        clearCity={clearCity}
        neighborhoods={neighborhoods}
        selectedNeighborhoodId={selectedNeighborhoodId}
        setNeighborhood={setNeighborhood}
        clearNeighborhood={clearNeighborhood}
      />

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}
