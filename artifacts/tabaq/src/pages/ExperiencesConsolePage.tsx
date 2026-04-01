import React, { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders, API_BASE } from "@/lib/api";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Plus, Edit2, Trash2, Eye, EyeOff,
  Star, CalendarDays, BarChart3, MessageSquare, ChevronRight,
  CheckCircle2, Clock, XCircle, AlertCircle, ArrowUpRight,
  Users, TrendingUp, DollarSign, Utensils, ChevronLeft,
  Save, X, MapPin, Image, Tag, Hash, RefreshCw, Loader2,
  ChevronDown, ChefHat, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  draft: "text-gray-600 bg-gray-100",
  pending: "text-amber-700 bg-amber-100",
  active: "text-green-700 bg-green-100",
  suspended: "text-red-700 bg-red-100",
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-700 bg-amber-100",
  confirmed: "text-green-700 bg-green-100",
  cancelled: "text-red-700 bg-red-100",
  completed: "text-blue-700 bg-blue-100",
};

const EXPERIENCE_CATEGORIES = [
  "Traditional Saudi Cuisine", "Arabic Meze & Mezze", "Seafood & Grills",
  "Brunch & Breakfast", "Desserts & Pastry", "Street Food Tour",
  "Cooking Class", "Farm-to-Table", "Fusion Cuisine", "Vegetarian / Vegan",
  "International Cuisine", "Private Dining Experience",
];

const CITIES_KSA = [
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar",
  "Tabuk", "Abha", "Taif", "Yanbu", "Jizan",
];

type Tab = "experiences" | "bookings" | "analytics" | "reviews";

type ExperienceFormData = {
  titleEn: string; titleAr: string;
  descriptionEn: string; descriptionAr: string;
  category: string; highlights: string; tags: string;
  durationMinutes: string; pricePerPerson: string; depositAmount: string;
  currency: string; capacity: string; address: string; city: string;
  latitude: string; longitude: string;
  menuDetailsEn: string; menuDetailsAr: string;
  rulesEn: string; rulesAr: string;
  primaryImageUrl: string; galleryUrls: string;
  status: string;
};

const EMPTY_EXP_FORM: ExperienceFormData = {
  titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "",
  category: "", highlights: "", tags: "",
  durationMinutes: "", pricePerPerson: "", depositAmount: "",
  currency: "SAR", capacity: "", address: "", city: "",
  latitude: "", longitude: "",
  menuDetailsEn: "", menuDetailsAr: "", rulesEn: "", rulesAr: "",
  primaryImageUrl: "", galleryUrls: "", status: "draft",
};

function PendingApprovalBanner({ t, lang }: { t: any; lang: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
          {t("Application Pending", "الطلب قيد المراجعة")}
        </h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {t(
            "Your provider application is being reviewed by our team. You'll be notified by email once approved.",
            "طلبك قيد المراجعة من قِبل فريقنا. ستتلقى إشعاراً بالبريد الإلكتروني بعد الموافقة."
          )}
        </p>
        <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-start">
          <p className="text-xs font-semibold text-foreground mb-3">{t("What happens next:", "ماذا يحدث بعد ذلك:")}</p>
          {[
            t("Application reviewed (1-2 days)", "مراجعة الطلب (1-2 يوم)"),
            t("Email notification upon approval", "إشعار بالبريد الإلكتروني عند الموافقة"),
            t("Dashboard unlocked, start creating!", "فتح لوحة التحكم، ابدأ الإنشاء!"),
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-2 last:mb-0">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-sm text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
        <Link href="/" className="block w-full text-sm font-semibold py-3 rounded-xl text-center text-muted-foreground hover:text-foreground transition-colors">
          {t("Go to Homepage", "الصفحة الرئيسية")}
        </Link>
      </div>
    </div>
  );
}

// ─── Experience Form (Create/Edit) ────────────────────────────────────────────
function ExperienceForm({
  initial,
  providerId,
  experienceId,
  onCancel,
  onSaved,
  t,
  lang,
}: {
  initial?: Partial<ExperienceFormData>;
  providerId: number;
  experienceId?: number;
  onCancel: () => void;
  onSaved: () => void;
  t: any;
  lang: string;
}) {
  const [form, setForm] = useState<ExperienceFormData>({ ...EMPTY_EXP_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("18:00");
  const [slotEnd, setSlotEnd] = useState("21:00");
  const [slotCap, setSlotCap] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);
  const [activeSection, setActiveSection] = useState<"details" | "slots">("details");

  const queryClient = useQueryClient();

  const { data: slotsData, refetch: refetchSlots } = useQuery({
    queryKey: ["exp-slots", experienceId],
    queryFn: async () => {
      if (!experienceId) return { slots: [] };
      const res = await fetch(`${API_BASE}/api/experiences/${experienceId}/slots`, { headers: getAuthHeaders() });
      if (!res.ok) return { slots: [] };
      return res.json();
    },
    enabled: !!experienceId,
  });

  const slots: any[] = slotsData?.slots ?? [];

  const upd = <K extends keyof ExperienceFormData>(k: K, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.titleEn.trim()) { toast.error(t("Title is required", "العنوان مطلوب")); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        providerId,
        highlights: form.highlights ? form.highlights.split("\n").filter(Boolean) : [],
        tags: form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
        galleryUrls: form.galleryUrls ? form.galleryUrls.split("\n").filter(Boolean) : [],
      };

      const url = experienceId ? `/api/experiences/${experienceId}` : "/api/experiences";
      const method = experienceId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success(t("Experience saved!", "تم حفظ التجربة!"));
      onSaved();
    } catch {
      toast.error(t("Failed to save experience", "فشل حفظ التجربة"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlot = async () => {
    if (!experienceId || !slotDate || !slotStart || !slotEnd) return;
    setAddingSlot(true);
    try {
      const res = await fetch(`${API_BASE}/api/experiences/${experienceId}/slots`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: slotDate, startTime: slotStart, endTime: slotEnd, capacityOverride: slotCap || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("Slot added!", "تمت إضافة الموعد!"));
      refetchSlots();
      setSlotDate("");
    } catch {
      toast.error(t("Failed to add slot", "فشل إضافة الموعد"));
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!experienceId) return;
    try {
      await fetch(`${API_BASE}/api/experiences/${experienceId}/slots/${slotId}`, { method: "DELETE", headers: getAuthHeaders() });
      toast.success(t("Slot removed", "تم حذف الموعد"));
      refetchSlots();
    } catch {
      toast.error(t("Failed to remove slot", "فشل حذف الموعد"));
    }
  };

  const inputCls = "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";
  const labelCls = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 bg-background z-40 overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
            <span className="font-semibold text-foreground">
              {experienceId ? t("Edit Experience", "تعديل التجربة") : t("Create New Experience", "إنشاء تجربة جديدة")}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("Save", "حفظ")}
          </button>
        </div>

        {/* Section tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-0 border-t border-border">
          {[
            { id: "details" as const, labelEn: "Experience Details", labelAr: "تفاصيل التجربة" },
            { id: "slots" as const, labelEn: "Slots & Availability", labelAr: "المواعيد والتوفر", disabled: !experienceId },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => !s.disabled && setActiveSection(s.id)}
              disabled={s.disabled}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                activeSection === s.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "ar" ? s.labelAr : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeSection === "details" && (
          <div className="space-y-8">
            {/* Basic info */}
            <section>
              <h2 className="font-bold text-foreground mb-4">{t("Basic Information", "المعلومات الأساسية")}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Title (English)", "العنوان (إنجليزي)")} *</label>
                    <input value={form.titleEn} onChange={e => upd("titleEn", e.target.value)} placeholder="e.g. Authentic Saudi Feast" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("Title (Arabic)", "العنوان (عربي)")}</label>
                    <input value={form.titleAr} onChange={e => upd("titleAr", e.target.value)} placeholder="مثال: وليمة سعودية أصيلة" dir="rtl" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Description (English)", "الوصف (إنجليزي)")}</label>
                    <textarea value={form.descriptionEn} onChange={e => upd("descriptionEn", e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Describe the experience..." />
                  </div>
                  <div>
                    <label className={labelCls}>{t("Description (Arabic)", "الوصف (عربي)")}</label>
                    <textarea value={form.descriptionAr} onChange={e => upd("descriptionAr", e.target.value)} rows={3} dir="rtl" className={`${inputCls} resize-none`} placeholder="صف التجربة..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Category", "الفئة")}</label>
                    <select value={form.category} onChange={e => upd("category", e.target.value)} className={inputCls}>
                      <option value="">{t("Select category...", "اختر الفئة...")}</option>
                      {EXPERIENCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t("Status", "الحالة")}</label>
                    <select value={form.status} onChange={e => upd("status", e.target.value)} className={inputCls}>
                      <option value="draft">{t("Draft", "مسودة")}</option>
                      <option value="pending">{t("Submit for Review", "إرسال للمراجعة")}</option>
                      <option value="active">{t("Active", "نشط")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t("Highlights (one per line)", "النقاط البارزة (سطر لكل نقطة)")}</label>
                  <textarea value={form.highlights} onChange={e => upd("highlights", e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder={t("Fresh seasonal ingredients\n5-course dinner\nLive cooking demonstration", "مكونات موسمية طازجة\nعشاء من 5 أطباق\nعرض طهي مباشر")} />
                </div>
                <div>
                  <label className={labelCls}>{t("Tags (comma separated)", "الوسوم (مفصولة بفاصلة)")}</label>
                  <input value={form.tags} onChange={e => upd("tags", e.target.value)} placeholder="saudi, traditional, family" className={inputCls} />
                </div>
              </div>
            </section>

            {/* Pricing & logistics */}
            <section>
              <h2 className="font-bold text-foreground mb-4">{t("Pricing & Logistics", "التسعير والخدمات")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>{t("Price/Person (SAR)", "السعر/شخص")}</label>
                  <input value={form.pricePerPerson} onChange={e => upd("pricePerPerson", e.target.value)} type="number" placeholder="250" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("Deposit (SAR)", "العربون")}</label>
                  <input value={form.depositAmount} onChange={e => upd("depositAmount", e.target.value)} type="number" placeholder="50" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("Capacity", "السعة")}</label>
                  <input value={form.capacity} onChange={e => upd("capacity", e.target.value)} type="number" placeholder="12" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("Duration (min)", "المدة (دقيقة)")}</label>
                  <input value={form.durationMinutes} onChange={e => upd("durationMinutes", e.target.value)} type="number" placeholder="120" className={inputCls} />
                </div>
              </div>
            </section>

            {/* Location */}
            <section>
              <h2 className="font-bold text-foreground mb-4">{t("Location", "الموقع")}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("City", "المدينة")}</label>
                    <select value={form.city} onChange={e => upd("city", e.target.value)} className={inputCls}>
                      <option value="">{t("Select city...", "اختر المدينة...")}</option>
                      {CITIES_KSA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t("Address", "العنوان")}</label>
                    <input value={form.address} onChange={e => upd("address", e.target.value)} placeholder={t("Full address...", "العنوان الكامل...")} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Latitude", "خط العرض")}</label>
                    <input value={form.latitude} onChange={e => upd("latitude", e.target.value)} placeholder="24.7136" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("Longitude", "خط الطول")}</label>
                    <input value={form.longitude} onChange={e => upd("longitude", e.target.value)} placeholder="46.6753" className={inputCls} />
                  </div>
                </div>
              </div>
            </section>

            {/* Menu & Rules */}
            <section>
              <h2 className="font-bold text-foreground mb-4">{t("Menu Details & Rules", "تفاصيل القائمة والقواعد")}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Menu/Details (English)", "القائمة/التفاصيل (إنجليزي)")}</label>
                    <textarea value={form.menuDetailsEn} onChange={e => upd("menuDetailsEn", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("Menu/Details (Arabic)", "القائمة/التفاصيل (عربي)")}</label>
                    <textarea value={form.menuDetailsAr} onChange={e => upd("menuDetailsAr", e.target.value)} rows={3} dir="rtl" className={`${inputCls} resize-none`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Rules & Policies (English)", "القواعد والسياسات (إنجليزي)")}</label>
                    <textarea value={form.rulesEn} onChange={e => upd("rulesEn", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("Rules & Policies (Arabic)", "القواعد والسياسات (عربي)")}</label>
                    <textarea value={form.rulesAr} onChange={e => upd("rulesAr", e.target.value)} rows={3} dir="rtl" className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </div>
            </section>

            {/* Images */}
            <section>
              <h2 className="font-bold text-foreground mb-4">{t("Gallery", "المعرض")}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{t("Primary Image URL", "رابط الصورة الرئيسية")}</label>
                  <input value={form.primaryImageUrl} onChange={e => upd("primaryImageUrl", e.target.value)} placeholder="https://..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("Additional Gallery URLs (one per line)", "روابط الصور الإضافية (سطر لكل رابط)")}</label>
                  <textarea value={form.galleryUrls} onChange={e => upd("galleryUrls", e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="https://..." />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === "slots" && experienceId && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4">{t("Add New Slot", "إضافة موعد جديد")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>{t("Date", "التاريخ")} *</label>
                  <input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("Start Time", "وقت البدء")} *</label>
                  <input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("End Time", "وقت الانتهاء")} *</label>
                  <input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("Cap Override", "تجاوز السعة")}</label>
                  <input type="number" value={slotCap} onChange={e => setSlotCap(e.target.value)} placeholder={t("Default", "افتراضي")} className={inputCls} />
                </div>
              </div>
              <button
                onClick={handleAddSlot}
                disabled={addingSlot || !slotDate}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {addingSlot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t("Add Slot", "إضافة موعد")}
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-foreground">{t("Existing Slots", "المواعيد الحالية")}</h2>
                <span className="text-xs text-muted-foreground">{slots.length} {t("slots", "مواعيد")}</span>
              </div>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  {t("No slots yet. Add your first slot above.", "لا توجد مواعيد بعد. أضف موعدك الأول أعلاه.")}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {slots.map((slot: any) => (
                    <div key={slot.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{slot.date}</p>
                        <p className="text-xs text-muted-foreground">{slot.startTime} – {slot.endTime} {slot.capacityOverride ? `· Cap: ${slot.capacityOverride}` : ""}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${slot.isCancelled ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>
                        {slot.isCancelled ? t("Cancelled", "ملغى") : t("Active", "نشط")}
                      </span>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ExperiencesConsolePage() {
  const { t, lang } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("experiences");
  const [editingExp, setEditingExp] = useState<{ exp?: any; open: boolean }>({ open: false });
  const [responseText, setResponseText] = useState<Record<number, { en: string; ar: string }>>({});
  const [deletingExpId, setDeletingExpId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: providerData, isLoading: providerLoading } = useQuery({
    queryKey: ["my-provider"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/providers/me`, { headers: getAuthHeaders() });
      if (!res.ok) return { provider: null, status: null };
      return res.json();
    },
    enabled: !!token,
    staleTime: 30000,
  });

  const provider = providerData?.provider;
  const providerStatus = providerData?.status;

  const { data: experiencesData, refetch: refetchExperiences } = useQuery({
    queryKey: ["my-experiences"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/providers/me/experiences`, { headers: getAuthHeaders() });
      if (!res.ok) return { experiences: [] };
      return res.json();
    },
    enabled: !!token && providerStatus === "approved",
    staleTime: 30000,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ["provider-bookings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/providers/me/bookings`, { headers: getAuthHeaders() });
      if (!res.ok) return { bookings: [] };
      return res.json();
    },
    enabled: !!token && providerStatus === "approved" && activeTab === "bookings",
    staleTime: 30000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["provider-analytics"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/providers/me/analytics`, { headers: getAuthHeaders() });
      if (!res.ok) return { analytics: null };
      return res.json();
    },
    enabled: !!token && providerStatus === "approved" && activeTab === "analytics",
    staleTime: 60000,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["provider-reviews"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/providers/me/reviews`, { headers: getAuthHeaders() });
      if (!res.ok) return { reviews: [] };
      return res.json();
    },
    enabled: !!token && providerStatus === "approved" && activeTab === "reviews",
    staleTime: 30000,
  });

  const bookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`${API_BASE}/api/experience-bookings/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("Booking status updated!", "تم تحديث حالة الحجز!"));
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    },
    onError: () => toast.error(t("Failed to update booking", "فشل تحديث الحجز")),
  });

  const deleteExpMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/experiences/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      toast.success(t("Experience deleted", "تم حذف التجربة"));
      refetchExperiences();
    },
    onError: () => toast.error(t("Failed to delete experience", "فشل حذف التجربة")),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`${API_BASE}/api/experiences/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("Status updated!", "تم تحديث الحالة!"));
      refetchExperiences();
    },
    onError: () => toast.error(t("Failed to update status", "فشل تحديث الحالة")),
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, responseEn, responseAr }: { id: number; responseEn: string; responseAr: string }) => {
      const res = await fetch(`${API_BASE}/api/experience-reviews/${id}/respond`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ responseEn, responseAr }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("Response submitted!", "تم إرسال الرد!"));
      queryClient.invalidateQueries({ queryKey: ["provider-reviews"] });
      setResponseText({});
    },
    onError: () => toast.error(t("Failed to submit response", "فشل إرسال الرد")),
  });

  const experiences: any[] = experiencesData?.experiences ?? [];
  const bookings: any[] = bookingsData?.bookings ?? [];
  const reviews: any[] = reviewsData?.reviews ?? [];
  const analytics = analyticsData?.analytics;

  if (authLoading || providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">{t("Sign in required", "يجب تسجيل الدخول")}</h2>
          <p className="text-muted-foreground text-sm mb-4">{t("Please sign in to access the experiences console.", "يرجى تسجيل الدخول للوصول إلى لوحة التجارب.")}</p>
          <Link href="/signin" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            {t("Sign In", "تسجيل الدخول")}
          </Link>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t("Not a registered provider", "لست مزوداً مسجلاً")}</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {t("Apply to become an experience provider to start hosting food experiences.", "قدّم طلباً لتصبح مزود تجارب وابدأ باستضافة تجارب الطعام.")}
          </p>
          <Link href="/partners/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            {t("Apply as Provider", "التقديم كمزود")}
          </Link>
        </div>
      </div>
    );
  }

  if (providerStatus !== "approved") {
    return <PendingApprovalBanner t={t} lang={lang} />;
  }

  const tabs: { id: Tab; labelEn: string; labelAr: string; icon: React.ElementType }[] = [
    { id: "experiences", labelEn: "My Experiences", labelAr: "تجاربي", icon: Utensils },
    { id: "bookings", labelEn: "Bookings", labelAr: "الحجوزات", icon: CalendarDays },
    { id: "analytics", labelEn: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
    { id: "reviews", labelEn: "Reviews", labelAr: "التقييمات", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === "ar" ? "rtl" : "ltr"}>
      {editingExp.open && (
        <ExperienceForm
          initial={editingExp.exp ? {
            titleEn: editingExp.exp.titleEn ?? "",
            titleAr: editingExp.exp.titleAr ?? "",
            descriptionEn: editingExp.exp.descriptionEn ?? "",
            descriptionAr: editingExp.exp.descriptionAr ?? "",
            category: editingExp.exp.category ?? "",
            highlights: (editingExp.exp.highlights ?? []).join("\n"),
            tags: (editingExp.exp.tags ?? []).join(", "),
            durationMinutes: editingExp.exp.durationMinutes?.toString() ?? "",
            pricePerPerson: editingExp.exp.pricePerPerson?.toString() ?? "",
            depositAmount: editingExp.exp.depositAmount?.toString() ?? "",
            currency: editingExp.exp.currency ?? "SAR",
            capacity: editingExp.exp.capacity?.toString() ?? "",
            address: editingExp.exp.address ?? "",
            city: editingExp.exp.city ?? "",
            latitude: editingExp.exp.latitude?.toString() ?? "",
            longitude: editingExp.exp.longitude?.toString() ?? "",
            menuDetailsEn: editingExp.exp.menuDetailsEn ?? "",
            menuDetailsAr: editingExp.exp.menuDetailsAr ?? "",
            rulesEn: editingExp.exp.rulesEn ?? "",
            rulesAr: editingExp.exp.rulesAr ?? "",
            primaryImageUrl: editingExp.exp.primaryImageUrl ?? "",
            galleryUrls: (editingExp.exp.galleryUrls ?? []).join("\n"),
            status: editingExp.exp.status ?? "draft",
          } : undefined}
          providerId={provider.id}
          experienceId={editingExp.exp?.id}
          onCancel={() => setEditingExp({ open: false })}
          onSaved={() => { setEditingExp({ open: false }); refetchExperiences(); }}
          t={t}
          lang={lang}
        />
      )}

      {/* Console Header */}
      <div className="bg-foreground text-background border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                {provider.logoUrl
                  ? <img src={provider.logoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                  : <ChefHat className="w-6 h-6 text-white" />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-background">
                    {lang === "ar" ? (provider.businessNameAr || provider.businessNameEn) : provider.businessNameEn}
                  </h1>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-background/60 text-sm mt-0.5">
                  {t("Experiences Console", "لوحة تحكم التجارب")} {provider.city ? `· ${provider.city}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditingExp({ open: true })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("New Experience", "تجربة جديدة")}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border-b border-border sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {lang === "ar" ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Experiences Tab ── */}
        {activeTab === "experiences" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">{t("Your Experiences", "تجاربك")}</h2>
                <p className="text-sm text-muted-foreground">{experiences.length} {t("total", "إجمالي")}</p>
              </div>
              <button
                onClick={() => setEditingExp({ open: true })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("Create New", "إنشاء جديد")}
              </button>
            </div>

            {experiences.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{t("No experiences yet", "لا توجد تجارب بعد")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("Create your first food experience to start accepting bookings.", "أنشئ تجربتك الطعامية الأولى لبدء قبول الحجوزات.")}
                </p>
                <button
                  onClick={() => setEditingExp({ open: true })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t("Create Experience", "إنشاء تجربة")}
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Experience", "التجربة")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Category", "الفئة")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Status", "الحالة")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Bookings", "الحجوزات")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Rating", "التقييم")}</th>
                        <th className="text-end px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Actions", "الإجراءات")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {experiences.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {exp.primaryImageUrl ? (
                                <img src={exp.primaryImageUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  <Utensils className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-foreground">{lang === "ar" ? (exp.titleAr || exp.titleEn) : exp.titleEn}</p>
                                <p className="text-xs text-muted-foreground font-mono">{exp.refCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">{exp.category || "—"}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[exp.status] ?? "text-gray-600 bg-gray-100"}`}>
                              {exp.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-foreground font-semibold">{exp.totalBookings ?? 0}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="text-sm font-medium">{parseFloat(exp.avgRating ?? "0").toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleStatusMutation.mutate({ id: exp.id, status: exp.status === "active" ? "draft" : "active" })}
                                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                                title={exp.status === "active" ? t("Unpublish", "إلغاء النشر") : t("Publish", "نشر")}
                              >
                                {exp.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setEditingExp({ open: true, exp })}
                                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {deletingExpId === exp.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => { deleteExpMutation.mutate(exp.id); setDeletingExpId(null); }}
                                    className="px-2 py-1 text-xs bg-destructive text-white rounded-md font-semibold"
                                  >
                                    {t("Confirm", "تأكيد")}
                                  </button>
                                  <button
                                    onClick={() => setDeletingExpId(null)}
                                    className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md"
                                  >
                                    {t("Cancel", "إلغاء")}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingExpId(exp.id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                                  title={t("Delete experience", "حذف التجربة")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bookings Tab ── */}
        {activeTab === "bookings" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground">{t("Bookings", "الحجوزات")}</h2>
              <p className="text-sm text-muted-foreground">{bookings.length} {t("total bookings", "إجمالي الحجوزات")}</p>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">{t("No bookings yet", "لا توجد حجوزات بعد")}</h3>
                <p className="text-sm text-muted-foreground">{t("Bookings will appear here once guests start reserving.", "ستظهر الحجوزات هنا بمجرد أن يبدأ الضيوف في الحجز.")}</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Ref", "المرجع")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Guest", "الضيف")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Experience", "التجربة")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Date/Slot", "التاريخ/الموعد")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Guests", "الضيوف")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Amount", "المبلغ")}</th>
                        <th className="text-start px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Status", "الحالة")}</th>
                        <th className="text-end px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t("Actions", "الإجراءات")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bookings.map((b: any) => (
                        <tr key={b.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{b.refCode ?? `#${b.id}`}</td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-foreground">{b.guestName || `User #${b.userId}`}</p>
                            <p className="text-xs text-muted-foreground">{b.guestEmail || ""}</p>
                          </td>
                          <td className="px-5 py-4 text-foreground">{lang === "ar" ? (b.experienceTitleAr || b.experienceTitleEn) : b.experienceTitleEn}</td>
                          <td className="px-5 py-4">
                            <p className="text-foreground">{b.slotDate || "—"}</p>
                            {b.slotStart && <p className="text-xs text-muted-foreground">{b.slotStart} – {b.slotEnd}</p>}
                          </td>
                          <td className="px-5 py-4 text-center font-semibold text-foreground">{b.guestCount}</td>
                          <td className="px-5 py-4 font-semibold text-foreground">{b.totalAmount ? `${b.totalAmount} SAR` : "—"}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${BOOKING_STATUS_COLORS[b.status] ?? "text-gray-600 bg-gray-100"}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {b.status === "pending" && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => bookingStatusMutation.mutate({ id: b.id, status: "confirmed" })}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {t("Accept", "قبول")}
                                </button>
                                <button
                                  onClick={() => bookingStatusMutation.mutate({ id: b.id, status: "cancelled" })}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  {t("Reject", "رفض")}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">{t("Analytics", "التحليلات")}</h2>
              <p className="text-sm text-muted-foreground">{t("Track performance of your experiences.", "تتبع أداء تجاربك.")}</p>
            </div>

            {!analytics ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { labelEn: "Total Bookings", labelAr: "إجمالي الحجوزات", value: analytics.totalBookings.toLocaleString(), icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
                    { labelEn: "Total Revenue", labelAr: "إجمالي الإيرادات", value: `${Number(analytics.totalRevenue).toLocaleString()} SAR`, icon: DollarSign, color: "text-green-600 bg-green-50" },
                    { labelEn: "Avg Rating", labelAr: "متوسط التقييم", value: parseFloat(analytics.avgRating ?? "0").toFixed(1), icon: Star, color: "text-amber-600 bg-amber-50" },
                    { labelEn: "Experiences", labelAr: "التجارب", value: analytics.totalExperiences.toString(), icon: Utensils, color: "text-primary bg-primary/10" },
                  ].map(stat => (
                    <div key={stat.labelEn} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? stat.labelAr : stat.labelEn}</p>
                    </div>
                  ))}
                </div>

                {/* Monthly Revenue Chart */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-foreground mb-4">{t("Monthly Revenue (SAR)", "الإيرادات الشهرية (ريال)")}</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={analytics.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: any) => [`${v.toLocaleString()} SAR`, t("Revenue", "الإيرادات")]} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bookings Trend */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-foreground mb-4">{t("Bookings Trend", "اتجاه الحجوزات")}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analytics.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Experiences */}
                {analytics.topExperiences.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="font-bold text-foreground">{t("Top Experiences", "أفضل التجارب")}</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {analytics.topExperiences.map((exp: any, idx: number) => (
                        <div key={exp.id} className="flex items-center gap-4 px-5 py-4">
                          <span className="text-2xl font-extrabold text-muted-foreground/30 w-8 shrink-0">{idx + 1}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{lang === "ar" ? (exp.titleAr || exp.titleEn) : exp.titleEn}</p>
                            <p className="text-xs text-muted-foreground">{exp.bookings} {t("bookings", "حجوزات")}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span className="text-sm font-semibold">{parseFloat(exp.rating ?? "0").toFixed(1)}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[exp.status] ?? "text-gray-600 bg-gray-100"}`}>
                            {exp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === "reviews" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground">{t("Guest Reviews", "تقييمات الضيوف")}</h2>
              <p className="text-sm text-muted-foreground">{reviews.length} {t("reviews", "تقييمات")}</p>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">{t("No reviews yet", "لا توجد تقييمات بعد")}</h3>
                <p className="text-sm text-muted-foreground">{t("Reviews from guests will appear here.", "ستظهر تقييمات الضيوف هنا.")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => {
                  const rt = responseText[review.id] ?? { en: "", ar: "" };
                  const hasResponse = !!review.providerResponseEn || !!review.providerResponseAr;
                  return (
                    <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{t("Guest", "ضيف")} #{review.userId}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lang === "ar" ? (review.experienceTitleAr || review.experienceTitleEn) : review.experienceTitleEn}
                          </p>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.round(parseFloat(review.ratingOverall ?? review.rating ?? "0")) ? "fill-amber-500 text-amber-500" : "text-border"}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>

                      {(review.textEn || review.textAr) && (
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {lang === "ar" ? (review.textAr || review.textEn) : (review.textEn || review.textAr)}
                        </p>
                      )}

                      {hasResponse ? (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5">
                          <p className="text-xs font-semibold text-primary mb-1">{t("Your Response", "ردك")}</p>
                          <p className="text-sm text-foreground">
                            {lang === "ar" ? (review.providerResponseAr || review.providerResponseEn) : (review.providerResponseEn || review.providerResponseAr)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {review.respondedAt ? new Date(review.respondedAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground">{t("Respond to this review:", "الرد على هذا التقييم:")}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <textarea
                              value={rt.en}
                              onChange={e => setResponseText(prev => ({ ...prev, [review.id]: { ...rt, en: e.target.value } }))}
                              placeholder={t("Your response (English)...", "ردك (إنجليزي)...")}
                              rows={2}
                              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none"
                            />
                            <textarea
                              value={rt.ar}
                              onChange={e => setResponseText(prev => ({ ...prev, [review.id]: { ...rt, ar: e.target.value } }))}
                              placeholder={t("ردك (عربي)...", "ردك (عربي)...")}
                              rows={2}
                              dir="rtl"
                              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none"
                            />
                          </div>
                          <button
                            onClick={() => respondMutation.mutate({ id: review.id, responseEn: rt.en, responseAr: rt.ar })}
                            disabled={!rt.en && !rt.ar}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                          >
                            {t("Submit Response", "إرسال الرد")}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
