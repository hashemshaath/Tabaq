import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { MICHELIN_RESTAURANTS } from '@/data/michelin';
import {
  Star, MapPin, Phone, Globe, Clock, ChefHat, Award, ArrowLeft,
  ChevronLeft, ChevronRight, X, CalendarDays, Utensils, Flame
} from 'lucide-react';

function MichelinStarBadge({ count }: { count: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-amber-400/30 rounded-lg px-3 py-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
      <span className="text-amber-400 text-xs font-bold ms-1">
        {count === 1 ? 'MICHELIN STAR' : `${count} MICHELIN STARS`}
      </span>
    </div>
  );
}

function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [cur, setCur] = useState(index);
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 end-4 z-10 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
        <X className="w-5 h-5" />
      </button>
      <button onClick={e => { e.stopPropagation(); setCur(c => (c - 1 + images.length) % images.length); }} className="absolute start-4 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={e => { e.stopPropagation(); setCur(c => (c + 1) % images.length); }} className="absolute end-4 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="max-w-5xl max-h-[85vh] px-16" onClick={e => e.stopPropagation()}>
        <img src={images[cur]} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">{cur + 1} / {images.length}</div>
    </div>
  );
}

export function MichelinDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showReservation, setShowReservation] = useState(false);
  const [resForm, setResForm] = useState({ date: '', time: '8:00 PM', guests: '2', notes: '' });
  const [resSubmitting, setResSubmitting] = useState(false);
  const [resSubmitted, setResSubmitted] = useState(false);

  function handleReservationSubmit() {
    if (!resForm.date) return;
    setResSubmitting(true);
    setTimeout(() => {
      setResSubmitting(false);
      setResSubmitted(true);
      setTimeout(() => { setShowReservation(false); setResSubmitted(false); setResForm({ date: '', time: '8:00 PM', guests: '2', notes: '' }); }, 2500);
    }, 1200);
  }

  const restaurant = MICHELIN_RESTAURANTS.find(r => r.id === id);

  usePageMeta({
    titleEn: restaurant ? `${restaurant.nameEn} — Michelin Star Restaurant` : 'Michelin Restaurant',
    titleAr: restaurant ? `${restaurant.nameAr} — مطعم نجمة ميشلان` : 'مطعم ميشلان',
    descriptionEn: restaurant?.descriptionEn ?? '',
    descriptionAr: restaurant?.descriptionAr ?? '',
    imageUrl: restaurant?.coverImage,
  }, lang);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('Restaurant not found', 'المطعم غير موجود')}</h2>
          <Link href="/michelin" className="text-amber-400 hover:underline">{t('Back to Michelin Guide', 'العودة إلى دليل ميشلان')}</Link>
        </div>
      </div>
    );
  }

  const allImages = [restaurant.coverImage, ...restaurant.galleryImages];

  return (
    <div className="min-h-screen bg-[#0d0d0f]">

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox images={allImages} index={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* Reservation modal */}
      {showReservation && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowReservation(false)}>
          <div className="bg-[#17150f] border border-amber-900/30 rounded-2xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-bold">{t('Reserve a Table', 'احجز طاولة')}</h3>
              <button onClick={() => setShowReservation(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {resSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-amber-400" />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">{t('Request Received!', 'تم استلام طلبك!')}</h4>
                <p className="text-white/60 text-sm">{t('Our concierge team will confirm your reservation within 2 hours.', 'سيؤكد فريق الكونسيرج حجزك خلال ساعتين.')}</p>
              </div>
            ) : (
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">{t('Date', 'التاريخ')}</label>
                <input
                  type="date"
                  value={resForm.date}
                  onChange={e => setResForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white/8 border border-white/15 rounded-lg text-white px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">{t('Time', 'الوقت')}</label>
                  <select
                    value={resForm.time}
                    onChange={e => setResForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full bg-white/8 border border-white/15 rounded-lg text-white px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                  >
                    {['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'].map(slot => (
                      <option key={slot} value={slot} className="bg-[#17150f]">{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">{t('Guests', 'الضيوف')}</label>
                  <select
                    value={resForm.guests}
                    onChange={e => setResForm(f => ({ ...f, guests: e.target.value }))}
                    className="w-full bg-white/8 border border-white/15 rounded-lg text-white px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                  >
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={n} value={String(n)} className="bg-[#17150f]">{n} {n === 1 ? t('Guest', 'ضيف') : t('Guests', 'ضيوف')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">{t('Special Requests', 'طلبات خاصة')}</label>
                <textarea
                  rows={3}
                  value={resForm.notes}
                  onChange={e => setResForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-white/8 border border-white/15 rounded-lg text-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-500"
                  placeholder={t('Dietary restrictions, celebrations, seating preferences...', 'قيود غذائية، مناسبات خاصة، تفضيلات الجلوس...')}
                />
              </div>
              <button
                onClick={handleReservationSubmit}
                disabled={!resForm.date || resSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {resSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {t('Submitting...', 'جاري الإرسال...')}
                  </>
                ) : t('Request Reservation', 'طلب الحجز')}
              </button>
              {!resForm.date && (
                <p className="text-amber-400/70 text-xs text-center">{t('Please select a date to continue', 'الرجاء اختيار تاريخ للمتابعة')}</p>
              )}
              <p className="text-white/30 text-xs text-center">{t('You will receive a confirmation within 2 hours', 'ستحصل على تأكيد خلال ساعتين')}</p>
            </div>
            )}
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div className="relative h-[60vh] min-h-[480px] overflow-hidden">
        <img
          src={restaurant.coverImage}
          alt={restaurant.nameEn}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.4) saturate(0.7)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/20 to-transparent" />

        {/* Back link */}
        <Link href="/michelin" className="absolute top-6 start-6 z-10 flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('Michelin Guide', 'دليل ميشلان')}
        </Link>

        <div className="absolute bottom-0 start-0 end-0 p-8 pb-12">
          <div className="max-w-4xl mx-auto">
            <MichelinStarBadge count={restaurant.stars} />
            <h1 className="text-white text-4xl md:text-5xl font-bold mt-4 mb-2">
              {lang === 'ar' ? restaurant.nameAr : restaurant.nameEn}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-1"><Utensils className="w-3.5 h-3.5 text-amber-500" />{lang === 'ar' ? restaurant.cuisineAr : restaurant.cuisineEn}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" />{lang === 'ar' ? restaurant.cityAr : restaurant.cityEn}</span>
              <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5 text-amber-500" />{lang === 'ar' ? restaurant.chefAr : restaurant.chefEn}</span>
              <span className="text-amber-400 font-medium">{restaurant.priceRange}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Sticky booking CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#17150f] border border-amber-900/30 rounded-xl mb-10">
          <div>
            <p className="text-white font-semibold">{t('Reserve an Exclusive Table', 'احجز طاولة حصرية')}</p>
            <p className="text-white/45 text-sm mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {restaurant.openingHours}
            </p>
          </div>
          <button
            onClick={() => setShowReservation(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-lg text-sm transition-colors shrink-0"
          >
            <CalendarDays className="w-4 h-4" />
            {t('Book a Table', 'احجز طاولة')}
          </button>
        </div>

        {/* About */}
        <section className="mb-10">
          <h2 className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">{t('The Restaurant', 'عن المطعم')}</h2>
          <p className="text-white/70 leading-relaxed text-base">
            {lang === 'ar' ? restaurant.descriptionAr : restaurant.descriptionEn}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: t('Since', 'منذ'), value: restaurant.since.toString() },
              { label: t('City', 'المدينة'), value: lang === 'ar' ? restaurant.cityAr : restaurant.cityEn },
              { label: t('Cuisine', 'المطبخ'), value: lang === 'ar' ? restaurant.cuisineAr : restaurant.cuisineEn },
              { label: t('Price', 'السعر'), value: restaurant.priceRange.split(' ')[0] + '...'},
            ].map(item => (
              <div key={item.label} className="bg-white/5 border border-white/8 rounded-lg p-4 text-center">
                <div className="text-white font-semibold text-sm">{item.value}</div>
                <div className="text-white/40 text-xs mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Chef */}
        <section className="mb-10 bg-[#17150f] border border-amber-900/20 rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-amber-900/30 border-2 border-amber-500/30 flex items-center justify-center shrink-0">
            <ChefHat className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-1">{t('Executive Chef', 'الشيف التنفيذي')}</p>
            <h3 className="text-white text-xl font-bold">{lang === 'ar' ? restaurant.chefAr : restaurant.chefEn}</h3>
            <p className="text-white/45 text-sm mt-1">
              {t(`Creating the vision at ${restaurant.nameEn} since ${restaurant.since}`, `يقود رؤية ${restaurant.nameAr} منذ ${restaurant.since}`)}
            </p>
          </div>
        </section>

        {/* Gallery */}
        <section className="mb-10">
          <h2 className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">{t('Gallery', 'معرض الصور')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {restaurant.galleryImages.map((img, i) => (
              <button key={i} onClick={() => setLightboxIdx(i + 1)} className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity">
                <img src={img} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.8) saturate(0.85)' }} />
              </button>
            ))}
          </div>
        </section>

        {/* Signature Dishes */}
        <section className="mb-10">
          <h2 className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-6">{t('Signature Dishes', 'الأطباق المميزة')}</h2>
          <div className="space-y-4">
            {restaurant.signatureDishes.map((dish) => (
              <div key={dish.nameEn} className="flex items-center gap-4 bg-[#17150f] border border-amber-900/20 rounded-xl overflow-hidden hover:border-amber-800/40 transition-colors">
                <img src={dish.imageUrl} alt={dish.nameEn} className="w-24 h-24 object-cover shrink-0" style={{ filter: 'brightness(0.75) saturate(0.8)' }} />
                <div className="py-4 pe-4 flex-1 min-w-0">
                  <h4 className="text-white font-semibold">{lang === 'ar' ? dish.nameAr : dish.nameEn}</h4>
                  <p className="text-white/45 text-sm mt-1 line-clamp-2">{dish.descriptionEn}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Awards */}
        <section className="mb-10">
          <h2 className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">{t('Awards & Recognition', 'الجوائز والتكريم')}</h2>
          <div className="flex flex-wrap gap-3">
            {restaurant.awards.map(award => (
              <div key={award} className="flex items-center gap-2 bg-[#17150f] border border-amber-900/30 rounded-lg px-4 py-2.5">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-white/70 text-sm">{award}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact & Info */}
        <section className="bg-[#17150f] border border-amber-900/20 rounded-xl p-6">
          <h2 className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-5">{t('Information', 'المعلومات')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-white/60">{restaurant.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-white/60">{restaurant.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-white/60">{restaurant.openingHours}</span>
            </div>
            {restaurant.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline">
                  {restaurant.website.replace('https://', '')}
                </a>
              </div>
            )}
          </div>
          <div className="mt-5 pt-5 border-t border-white/8 flex flex-col sm:flex-row gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4" />
              {t('Get Directions', 'احصل على الاتجاهات')}
            </a>
            <button
              onClick={() => setShowReservation(true)}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-6 py-2.5 rounded-lg transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              {t('Reserve a Table', 'احجز طاولة')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
