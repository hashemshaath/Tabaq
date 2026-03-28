import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useGetRestaurant, useCreateBooking, type CreateBookingRequest } from '@workspace/api-client-react';
import { useParams } from 'wouter';
import { Star, MapPin, Phone, Globe, Clock, CheckCircle2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RestaurantDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { data, isLoading } = useGetRestaurant(Number(id), { query: { enabled: !!id, queryKey: ['restaurant', id] } });
  
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [partySize, setPartySize] = useState(2);

  const { mutate: createBooking, isPending: isBooking } = useCreateBooking();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!data?.restaurant) return <div className="p-20 text-center text-xl">{t('Not Found', 'غير موجود')}</div>;

  const { restaurant } = data;
  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const description = lang === 'ar' ? restaurant.descriptionAr : restaurant.descriptionEn;

  const handleBook = () => {
    createBooking({
      data: {
        restaurantId: restaurant.id,
        date: bookingDate,
        time: bookingTime,
        partySize: partySize,
      } as CreateBookingRequest
    }, {
      onSuccess: () => {
        alert(t('Booking confirmed!', 'تم تأكيد الحجز!'));
        setShowBooking(false);
      },
      onError: (err) => alert(err.message || 'Error')
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Header */}
      <div className="relative h-[40vh] md:h-[50vh] bg-muted w-full">
        <img 
          src={restaurant.coverImageUrl || "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1920&h=1080&fit=crop"} 
          alt={name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              {/* Logo Profile */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white p-2 shadow-xl shrink-0 translate-y-4 md:translate-y-12 z-10 border border-border">
                <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop"} alt="Logo" className="w-full h-full rounded-xl object-cover" />
              </div>
              
              <div className="text-white pb-2">
                <h1 className="text-3xl md:text-5xl font-bold flex items-center gap-3">
                  {name}
                  {restaurant.isVerified && <CheckCircle2 className="w-6 h-6 text-primary" />}
                </h1>
                <div className="flex items-center gap-4 mt-3 text-white/80 text-sm md:text-base font-medium">
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-white">{Number(restaurant.avgRating)?.toFixed(1) || '0.0'}</span>
                    <span className="opacity-70">({restaurant.reviewCount})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {restaurant.address || t('Riyadh', 'الرياض')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-2 z-10">
              <Button onClick={() => setShowBooking(true)} size="lg" className="w-full md:w-auto font-bold px-8">
                {t('Book a Table', 'احجز طاولة')}
              </Button>
              <Button variant="secondary" size="icon" className="w-14 shrink-0 rounded-2xl text-foreground">
                <Heart className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-4">{t('About', 'نبذة')}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed text-balance">
                {description || t('A premium dining destination offering exquisite culinary creations in a refined atmosphere.', 'وجهة طعام فاخرة تقدم إبداعات طهي رائعة في جو راقٍ.')}
              </p>
            </section>

            {/* Menu Tab Stub */}
            <section>
              <div className="border-b border-border flex gap-8 mb-6">
                <button className="pb-3 border-b-2 border-primary font-bold text-primary">{t('Menu', 'المنيو')}</button>
                <button className="pb-3 border-b-2 border-transparent text-muted-foreground font-medium hover:text-foreground">{t('Photos', 'الصور')}</button>
                <button className="pb-3 border-b-2 border-transparent text-muted-foreground font-medium hover:text-foreground">{t('Reviews', 'التقييمات')}</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/50 hover:bg-accent/50 transition-colors">
                    <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop" className="w-20 h-20 rounded-xl object-cover" alt="Dish" />
                    <div>
                      <h4 className="font-bold text-foreground">Premium Signature Dish {i}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">Delightful mixture of fresh ingredients prepared perfectly.</p>
                      <span className="text-primary font-bold mt-2 block">120 SAR</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">{t('Info & Details', 'معلومات وتفاصيل')}</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{t('Opening Hours', 'ساعات العمل')}</p>
                    <p className="text-sm text-muted-foreground mt-1">1:00 PM - 11:30 PM</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{t('Phone', 'رقم الهاتف')}</p>
                    <p className="text-sm text-muted-foreground mt-1" dir="ltr">{restaurant.phone || '+966 50 123 4567'}</p>
                  </div>
                </div>

                {restaurant.website && (
                  <div className="flex gap-4 items-start">
                    <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{t('Website', 'الموقع الإلكتروني')}</p>
                      <a href={restaurant.website} className="text-sm text-primary hover:underline mt-1 block" dir="ltr">{restaurant.website}</a>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">{t('Features', 'المميزات')}</h4>
                <div className="flex flex-wrap gap-2">
                  {restaurant.hasParking && <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg">{t('Parking', 'مواقف')}</span>}
                  {restaurant.hasOutdoorSeating && <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg">{t('Outdoor', 'جلسات خارجية')}</span>}
                  {restaurant.isHalal && <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg">{t('Halal', 'حلال')}</span>}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Booking Dialog Overlay */}
      {showBooking && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">{t('Book a Table', 'احجز طاولة')} - {name}</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">{t('Date', 'التاريخ')}</label>
                <input 
                  type="date" 
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background"
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('Time', 'الوقت')}</label>
                  <select 
                    className="w-full h-12 px-4 rounded-xl border border-input bg-background"
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                  >
                    <option value="">{t('Select', 'اختر')}</option>
                    <option value="19:00">07:00 PM</option>
                    <option value="20:00">08:00 PM</option>
                    <option value="21:00">09:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('Guests', 'عدد الأشخاص')}</label>
                  <select 
                    className="w-full h-12 px-4 rounded-xl border border-input bg-background"
                    value={partySize}
                    onChange={e => setPartySize(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {t('Guests', 'أشخاص')}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setShowBooking(false)}>
                {t('Cancel', 'إلغاء')}
              </Button>
              <Button 
                onClick={handleBook} 
                disabled={!bookingDate || !bookingTime || isBooking}
              >
                {isBooking ? t('Confirming...', 'جاري التأكيد...') : t('Confirm Booking', 'تأكيد الحجز')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
