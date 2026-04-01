import React, { useState, useCallback } from 'react';
import { useLocalization } from '@/context/LocalizationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Plus, Edit2, Trash2, Star, Home, Briefcase, Building2,
  Phone, ChevronDown, Check, Loader2, X, Navigation, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthHeaders, API_BASE } from '@/lib/api';

interface UserAddress {
  id: number;
  label: string; labelAr: string; isDefault: boolean;
  addressLine1: string; addressLine2?: string; district?: string;
  city: string; region?: string; postalCode?: string; countryCode: string;
  nationalAddress?: string; buildingNumber?: string; additionalNumber?: string;
  unitNumber?: string; contactName?: string; contactPhone?: string;
  latitude?: number; longitude?: number;
}

const LABEL_OPTIONS = [
  { key: 'Home', keyAr: 'البيت', icon: Home },
  { key: 'Office', keyAr: 'المكتب', icon: Briefcase },
  { key: 'Apartment', keyAr: 'الشقة', icon: Building2 },
  { key: 'Other', keyAr: 'أخرى', icon: MapPin },
];

const DEFAULT_COORDS = { lat: 24.7136, lon: 46.6753 };

interface AddressFormData {
  label: string; labelAr: string; isDefault: boolean;
  addressLine1: string; addressLine2: string; district: string;
  city: string; region: string; postalCode: string; countryCode: string;
  nationalAddress: string; buildingNumber: string; additionalNumber: string;
  unitNumber: string; contactName: string; contactPhone: string;
  latitude?: number; longitude?: number;
}

const emptyForm = (): AddressFormData => ({
  label: 'Home', labelAr: 'البيت', isDefault: false,
  addressLine1: '', addressLine2: '', district: '',
  city: '', region: '', postalCode: '', countryCode: 'SA',
  nationalAddress: '', buildingNumber: '', additionalNumber: '',
  unitNumber: '', contactName: '', contactPhone: '',
});

function fromAddress(addr: UserAddress): AddressFormData {
  return {
    label: addr.label, labelAr: addr.labelAr, isDefault: addr.isDefault,
    addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || '',
    district: addr.district || '', city: addr.city, region: addr.region || '',
    postalCode: addr.postalCode || '', countryCode: addr.countryCode,
    nationalAddress: addr.nationalAddress || '', buildingNumber: addr.buildingNumber || '',
    additionalNumber: addr.additionalNumber || '', unitNumber: addr.unitNumber || '',
    contactName: addr.contactName || '', contactPhone: addr.contactPhone || '',
    latitude: addr.latitude, longitude: addr.longitude,
  };
}

function MapPicker({ lat, lon, onSelect }: { lat: number; lon: number; onSelect: (lat: number, lon: number) => void }) {
  const { t } = useLocalization();
  const delta = 0.01;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-secondary/30">
      <div className="relative h-56">
        <iframe
          key={`${lat}-${lon}`}
          src={mapSrc}
          width="100%" height="100%"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          title="Address Map"
        />
        <div className="absolute inset-0 pointer-events-none flex items-end p-3">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-border/30 pointer-events-auto">
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <MapPin className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-foreground">{lat.toFixed(4)}, {lon.toFixed(4)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border-t border-border/40">
        <Navigation className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1">{t('Adjust pin by editing coordinates or', 'اضبط المعلم بتعديل الإحداثيات أو')}</span>
        <a href={osmLink} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {t('Open Map', 'فتح الخريطة')}
        </a>
      </div>
      <div className="flex items-center gap-2 px-3 pb-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Lat</label>
          <input
            type="number" step="0.0001"
            defaultValue={lat}
            onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onSelect(v, lon); }}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Lon</label>
          <input
            type="number" step="0.0001"
            defaultValue={lon}
            onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onSelect(lat, v); }}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>
    </div>
  );
}

interface AddressFormProps {
  initial?: UserAddress;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

function AddressForm({ initial, onSave, onCancel, saving }: AddressFormProps) {
  const { t, country, language } = useLocalization();
  const [form, setForm] = useState<AddressFormData>(initial ? fromAddress(initial) : emptyForm());
  const [showMap, setShowMap] = useState(!!(initial?.latitude));
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});
  const mapLat = form.latitude || DEFAULT_COORDS.lat;
  const mapLon = form.longitude || DEFAULT_COORDS.lon;
  const isSaudi = form.countryCode === 'SA';

  const set = (key: keyof AddressFormData, value: string | boolean | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.addressLine1.trim()) e.addressLine1 = t('Required', 'مطلوب');
    if (!form.city.trim()) e.city = t('Required', 'مطلوب');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const Field = ({ label, labelAr, field, placeholder, placeholderAr, required, type = 'text' }: {
    label: string; labelAr: string; field: keyof AddressFormData;
    placeholder?: string; placeholderAr?: string; required?: boolean; type?: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {language === 'ar' ? labelAr : label}{required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      <input
        type={type} value={form[field] as string}
        onChange={e => set(field, e.target.value)}
        placeholder={language === 'ar' ? placeholderAr : placeholder}
        className={`w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors[field] ? 'border-red-400' : 'border-border'}`}
      />
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">
          {initial ? t('Edit Address', 'تعديل العنوان') : t('New Address', 'عنوان جديد')}
        </h3>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-2">{t('Address Label', 'اسم العنوان')}</label>
        <div className="flex flex-wrap gap-2">
          {LABEL_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = form.label === opt.key;
            return (
              <button
                key={opt.key} type="button"
                onClick={() => { set('label', opt.key); set('labelAr', opt.keyAr); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {language === 'ar' ? opt.keyAr : opt.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label="Address Line 1" labelAr="السطر الأول" field="addressLine1" placeholder="Street address, building name" placeholderAr="الشارع، اسم المبنى" required />
        </div>
        <div className="sm:col-span-2">
          <Field label="Address Line 2" labelAr="السطر الثاني" field="addressLine2" placeholder="Apt, floor, suite (optional)" placeholderAr="الشقة، الطابق (اختياري)" />
        </div>
        <Field label="District" labelAr="الحي" field="district" placeholder="Neighborhood / district" placeholderAr="الحي" />
        <Field label="City" labelAr="المدينة" field="city" placeholder="City" placeholderAr="المدينة" required />

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            {t('Region / Province', 'المنطقة / المحافظة')}
          </label>
          <div className="relative">
            <select
              value={form.region}
              onChange={e => set('region', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
            >
              <option value="">{t('Select region', 'اختر المنطقة')}</option>
              {(country.regions || []).map((r, i) => (
                <option key={r} value={r}>
                  {language === 'ar' ? (country.regionsAr?.[i] || r) : r}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <Field
          label={country.postalCodeLabel || 'Postal Code'}
          labelAr={country.postalCodeLabelAr || 'الرمز البريدي'}
          field="postalCode"
          placeholder="e.g. 12345" placeholderAr="مثال: 12345"
        />
      </div>

      {isSaudi && (
        <div className="bg-secondary/40 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-lg">🇸🇦</div>
            <p className="text-xs font-bold text-foreground">{t('Saudi National Address', 'العنوان الوطني السعودي')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Building No." labelAr="رقم المبنى" field="buildingNumber" placeholder="e.g. 2457" placeholderAr="مثال: 2457" />
            <Field label="Additional No." labelAr="الرقم الإضافي" field="additionalNumber" placeholder="e.g. 3456" placeholderAr="مثال: 3456" />
            <div className="col-span-2">
              <Field label="National Address" labelAr="العنوان الوطني" field="nationalAddress" placeholder="e.g. RRCA 2457" placeholderAr="مثال: RRCA 2457" />
            </div>
            <div className="col-span-2">
              <Field label="Unit Number" labelAr="رقم الوحدة" field="unitNumber" placeholder="Apartment / unit no." placeholderAr="رقم الشقة / الوحدة" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact Name" labelAr="اسم جهة الاتصال" field="contactName" placeholder="Full name" placeholderAr="الاسم الكامل" />
        <Field label="Contact Phone" labelAr="رقم التواصل" field="contactPhone" placeholder="+966 5X XXX XXXX" placeholderAr="+966 5X XXX XXXX" type="tel" />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          {showMap ? t('Hide map', 'إخفاء الخريطة') : t('Pin on map (optional)', 'تحديد الموقع على الخريطة (اختياري)')}
        </button>
        {showMap && (
          <div className="mt-3">
            <MapPicker
              lat={mapLat} lon={mapLon}
              onSelect={(lat, lon) => { set('latitude', lat); set('longitude', lon); }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 bg-secondary/40 rounded-xl p-3">
        <button
          type="button"
          onClick={() => set('isDefault', !form.isDefault)}
          className={`relative w-10 h-5.5 rounded-full transition-all duration-300 shrink-0 ${form.isDefault ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          style={{ height: '22px' }}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${form.isDefault ? 'start-[22px]' : 'start-0.5'}`} />
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">{t('Set as default address', 'تعيين كعنوان افتراضي')}</p>
          <p className="text-xs text-muted-foreground">{t('Used for bookings and deliveries by default', 'يُستخدم للحجوزات والتوصيل تلقائياً')}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">{t('Cancel', 'إلغاء')}</Button>
        <Button type="submit" disabled={saving} className="flex-1 gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? t('Save Changes', 'حفظ التغييرات') : t('Add Address', 'إضافة العنوان')}
        </Button>
      </div>
    </form>
  );
}

export function AddressBook() {
  const { t, language } = useLocalization();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<UserAddress | null | 'new'>(null);

  const { data: addresses = [], isLoading } = useQuery<UserAddress[]>({
    queryKey: ['addresses'],
    queryFn: () => fetch(`${API_BASE}/api/me/addresses`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : []),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: AddressFormData }) => {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_BASE}/api/me/addresses/${id}` : `${API_BASE}/api/me/addresses`;
      const r = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to save address');
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API_BASE}/api/me/addresses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!r.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const defaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API_BASE}/api/me/addresses/${id}/default`, { method: 'PATCH', headers: getAuthHeaders() });
      if (!r.ok) throw new Error('Failed to set default');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  if (editing !== null) {
    return (
      <AddressForm
        initial={editing === 'new' ? undefined : editing}
        onSave={(data) => saveMutation.mutate({ id: editing === 'new' ? undefined : (editing as UserAddress).id, data })}
        onCancel={() => setEditing(null)}
        saving={saveMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">{t('Address Book', 'دفتر العناوين')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('Manage your saved addresses', 'إدارة عناوينك المحفوظة')}</p>
        </div>
        <Button size="sm" onClick={() => setEditing('new')} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t('Add Address', 'إضافة عنوان')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-secondary/30 rounded-2xl">
          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">{t('No addresses yet', 'لا توجد عناوين بعد')}</p>
          <p className="text-sm text-muted-foreground mb-4">{t('Add your first address to get started', 'أضف عنوانك الأول للبدء')}</p>
          <Button onClick={() => setEditing('new')} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            {t('Add Address', 'إضافة عنوان')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(addresses as UserAddress[]).map(addr => {
            const LabelOpt = LABEL_OPTIONS.find(o => o.key === addr.label) || LABEL_OPTIONS[3];
            const Icon = LabelOpt.icon;
            return (
              <div key={addr.id} className={`bg-card border rounded-2xl p-4 transition-all ${addr.isDefault ? 'border-primary/40 bg-primary/[0.02]' : 'border-border'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${addr.isDefault ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-foreground text-sm">{language === 'ar' ? addr.labelAr : addr.label}</p>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                          <Star className="w-2.5 h-2.5" />
                          {t('Default', 'افتراضي')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-snug">
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[addr.district, addr.city, addr.region].filter(Boolean).join(', ')}
                      {addr.postalCode && ` · ${addr.postalCode}`}
                    </p>
                    {addr.nationalAddress && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{addr.nationalAddress}</p>
                    )}
                    {addr.contactPhone && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{addr.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
                  {!addr.isDefault && (
                    <button
                      onClick={() => defaultMutation.mutate(addr.id)}
                      disabled={defaultMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t('Set as default', 'تعيين كافتراضي')}
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={() => setEditing(addr)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('Edit', 'تعديل')}
                  </button>
                  <button
                    onClick={() => { if (confirm(t('Delete this address?', 'حذف هذا العنوان؟'))) deleteMutation.mutate(addr.id); }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('Delete', 'حذف')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
