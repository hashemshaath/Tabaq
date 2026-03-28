import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  useGetRestaurant,
  useGetRestaurantMenus,
  useFollowRestaurant,
  useUnfollowRestaurant,
  useDeleteReview,
  getGetRestaurantQueryKey,
  type Dish,
} from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { BookingModal } from '@/components/BookingModal';
import { ReviewComposerModal } from '@/components/ReviewComposerModal';
import { ReviewCard } from '@/components/ReviewCard';
import {
  Star, MapPin, Phone, Globe, Clock, CheckCircle2, Heart, HeartOff,
  Utensils, Info, Camera, MessageSquare, ChevronDown, ChevronUp,
  Leaf, Wheat, Flame, Coffee, Tag, PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

type Tab = 'menu' | 'photos' | 'reviews' | 'info';

export function RestaurantDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const { data, isLoading, refetch } = useGetRestaurant(Number(id), {
    query: { enabled: !!id, queryKey: ['restaurant', id] },
  });

  const { data: menuData } = useGetRestaurantMenus(Number(id), {
    query: { enabled: !!id, queryKey: ['restaurant-menus', id] },
  });

  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [isFollowing, setIsFollowing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [showBooking, setShowBooking] = useState(false);
  const [showReviewComposer, setShowReviewComposer] = useState(false);
  const { mutate: followRestaurant } = useFollowRestaurant();
  const { mutate: unfollowRestaurant } = useUnfollowRestaurant();
  const queryClient = useQueryClient();
  const deleteReview = useDeleteReview();

  React.useEffect(() => {
    if (data) setIsFollowing(data.isFollowing ?? false);
  }, [data]);

  const toggleFollow = () => {
    if (!user) return;
    const restaurantId = Number(id);
    if (isFollowing) {
      unfollowRestaurant({ restaurantId }, { onSuccess: () => setIsFollowing(false) });
    } else {
      followRestaurant({ restaurantId }, { onSuccess: () => setIsFollowing(true) });
    }
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.restaurant) {
    return <div className="p-20 text-center text-xl">{t('Restaurant not found', 'المطعم غير موجود')}</div>;
  }

  const { restaurant, categories, occasions, openingHours, recentReviews, ratingBreakdown, activeOffers } = data;
  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const description = lang === 'ar' ? restaurant.descriptionAr : restaurant.descriptionEn;
  const today = new Date().getDay();

  const priceTierLabel = {
    budget: t('Budget', 'اقتصادي'),
    mid: t('Mid-Range', 'متوسط'),
    upscale: t('Upscale', 'راقٍ'),
    fine_dining: t('Fine Dining', 'فاخر'),
  }[restaurant.priceTier as string] ?? restaurant.priceTier;

  const tabs: { id: Tab; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { id: 'menu', label: 'Menu', labelAr: 'المنيو', icon: <Utensils className="w-4 h-4" /> },
    { id: 'photos', label: 'Photos', labelAr: 'الصور', icon: <Camera className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', labelAr: 'التقييمات', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'info', label: 'Info', labelAr: 'معلومات', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Header */}
      <div className="relative h-[45vh] md:h-[55vh] bg-muted w-full">
        <img
          src={restaurant.coverImageUrl || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1920&h=1080&fit=crop'}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-4 start-4 z-10">
          <Link href="/restaurants" className="text-white/80 text-sm hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
            ← {t('Restaurants', 'المطاعم')}
          </Link>
        </div>

        <div className="absolute bottom-0 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              {/* Logo */}
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white p-1.5 shadow-2xl shrink-0 translate-y-8 md:translate-y-14 z-10 border border-border">
                <img
                  src={restaurant.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop'}
                  alt="Logo"
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>

              <div className="text-white pb-2">
                <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3 flex-wrap">
                  {name}
                  {restaurant.isVerified && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-white/80 text-sm font-medium">
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-white font-bold">{Number(restaurant.avgRating)?.toFixed(1) || 'NEW'}</span>
                    <span className="opacity-70">({restaurant.reviewCount || 0})</span>
                  </span>
                  {restaurant.address && (
                    <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                      <MapPin className="w-3.5 h-3.5" />
                      {restaurant.address}
                    </span>
                  )}
                  {categories.length > 0 && (
                    <span className="bg-primary/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
                      {lang === 'ar' ? categories[0].nameAr : categories[0].nameEn}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-2 z-10">
              <Button onClick={() => setShowBooking(true)} size="lg" className="font-bold px-6 shadow-lg">
                {t('Book a Table', 'احجز طاولة')}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleFollow}
                className="w-12 h-12 shrink-0 rounded-2xl border border-border"
                title={isFollowing ? t('Unfollow', 'إلغاء المتابعة') : t('Follow', 'متابعة')}
              >
                {isFollowing
                  ? <HeartOff className="w-5 h-5 text-destructive" />
                  : <Heart className="w-5 h-5 text-primary" />
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-10 md:mt-16 flex flex-wrap gap-x-8 gap-y-3">
          {ratingBreakdown && ratingBreakdown.count > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-bold">{ratingBreakdown.overall.toFixed(1)}</span>
              <span className="text-muted-foreground">({ratingBreakdown.count} {t('reviews', 'تقييم')})</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{priceTierLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{restaurant.followerCount ?? 0} {t('followers', 'متابع')}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Active Offers Banner */}
            {activeOffers.length > 0 && (
              <div className="mb-6 space-y-2">
                {activeOffers.map(offer => (
                  <div key={offer.id} className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <Tag className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="font-bold text-foreground text-sm">{lang === 'ar' ? offer.titleAr : offer.titleEn}</p>
                      {offer.discountPercent && (
                        <p className="text-primary text-xs font-medium">{offer.discountPercent}% {t('discount', 'خصم')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-muted-foreground text-base leading-relaxed mb-6 text-balance">
                {description}
              </p>
            )}

            {/* Category Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <Link key={cat.id} href={`/restaurants?categoryId=${cat.id}`}>
                  <span className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                    {lang === 'ar' ? cat.nameAr : cat.nameEn}
                  </span>
                </Link>
              ))}
              {occasions.map(occ => (
                <span key={occ.id} className="px-3 py-1.5 rounded-full bg-accent/50 text-accent-foreground text-sm font-medium">
                  {lang === 'ar' ? occ.nameAr : occ.nameEn}
                </span>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex gap-0 mb-6 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {lang === 'ar' ? tab.labelAr : tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Menu */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                {menuData && menuData.length > 0 ? (
                  menuData.map(menu => (
                    <div key={menu.id}>
                      <h3 className="text-lg font-bold mb-4 text-foreground">
                        {lang === 'ar' ? menu.nameAr : menu.nameEn}
                      </h3>
                      {menu.sections?.map(section => (
                        <div key={section.id} className="mb-4">
                          <button
                            className="w-full flex justify-between items-center py-2 px-0 text-start"
                            onClick={() => toggleSection(section.id)}
                          >
                            <h4 className="font-semibold text-foreground text-base">
                              {lang === 'ar' ? section.nameAr : section.nameEn}
                            </h4>
                            {expandedSections.has(section.id)
                              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              : <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            }
                          </button>
                          {!expandedSections.has(section.id) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                              {section.items?.map((dish: Dish) => (
                                <Link key={dish.id} href={`/dishes/${dish.id}`}>
                                  <div className="flex gap-3 p-3 rounded-2xl border border-border/60 hover:bg-accent/30 hover:border-primary/20 transition-all group">
                                    <div className="w-18 h-18 shrink-0 rounded-xl overflow-hidden bg-muted">
                                      <img
                                        src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'}
                                        alt={lang === 'ar' ? dish.nameAr : dish.nameEn}
                                        className="w-full h-full object-cover"
                                        style={{ width: '72px', height: '72px' }}
                                      />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                      <div className="flex justify-between items-start gap-1">
                                        <h5 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                          {lang === 'ar' ? dish.nameAr : dish.nameEn}
                                        </h5>
                                        {dish.price && (
                                          <span className="text-primary font-bold text-sm shrink-0 ms-1">
                                            {formatPrice(dish.price, dish.currency, lang)}
                                          </span>
                                        )}
                                      </div>
                                      {(lang === 'ar' ? dish.descriptionAr : dish.descriptionEn) && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                          {lang === 'ar' ? dish.descriptionAr : dish.descriptionEn}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1.5">
                                        {dish.isHalal && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium">{t('Halal', 'حلال')}</span>}
                                        {dish.isVegetarian && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5"><Leaf className="w-2.5 h-2.5" />{t('Veg', 'نباتي')}</span>}
                                        {dish.calories && <span className="text-[10px] text-muted-foreground">{dish.calories} kcal</span>}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Utensils className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>{t('Menu not available yet.', 'المنيو غير متوفر حالياً.')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Photos */}
            {activeTab === 'photos' && (
              <div>
                {menuData && menuData.flatMap(m => m.sections).flatMap(s => s.items || []).filter(d => d.imageUrl).length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('Dish photos from the menu', 'صور الأطباق من المنيو')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {restaurant.coverImageUrl && (
                        <div className="col-span-2 rounded-2xl overflow-hidden aspect-video">
                          <img
                            src={restaurant.coverImageUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {menuData
                        .flatMap(m => m.sections)
                        .flatMap(s => (s.items || []) as Dish[])
                        .filter(d => d.imageUrl)
                        .map(dish => (
                          <Link key={dish.id} href={`/dishes/${dish.id}`}>
                            <div className="rounded-2xl overflow-hidden aspect-square group cursor-pointer">
                              <img
                                src={dish.imageUrl!}
                                alt={lang === 'ar' ? dish.nameAr : dish.nameEn}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          </Link>
                        ))
                      }
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">{t('No photos yet', 'لا توجد صور بعد')}</p>
                    <p className="text-sm mt-1">{t('Photos will appear here when added.', 'ستظهر الصور هنا عند إضافتها.')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Write Review CTA */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {recentReviews.length} {t('reviews', 'تقييم')}
                  </p>
                  {user ? (
                    <Button
                      size="sm"
                      onClick={() => setShowReviewComposer(true)}
                      className="flex items-center gap-2"
                    >
                      <PenLine className="w-4 h-4" />
                      {t('Write a Review', 'اكتب تقييماً')}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {t('Sign in to write a review', 'سجّل دخولك لكتابة تقييم')}
                    </p>
                  )}
                </div>

                {recentReviews.length > 0 ? (
                  recentReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onDelete={(reviewId) => {
                        deleteReview.mutate({ reviewId }, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(Number(id)) });
                          },
                        });
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>{t('No reviews yet. Be the first!', 'لا توجد تقييمات بعد. كن الأول!')}</p>
                    {user && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setShowReviewComposer(true)}
                      >
                        <PenLine className="w-4 h-4 me-2" />
                        {t('Write the first review', 'اكتب أول تقييم')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Info */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Opening Hours */}
                {openingHours.length > 0 && (
                  <div className="bg-card border border-border/60 rounded-2xl p-5">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {t('Opening Hours', 'ساعات العمل')}
                    </h3>
                    <div className="space-y-2">
                      {openingHours.map(h => (
                        <div key={h.id} className={`flex justify-between text-sm py-1 ${h.dayOfWeek === today ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          <span>{lang === 'ar' ? DAYS_AR[h.dayOfWeek] : DAYS[h.dayOfWeek]}</span>
                          <span>
                            {h.isClosed
                              ? t('Closed', 'مغلق')
                              : `${h.openTime} – ${h.closeTime}`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="bg-card border border-border/60 rounded-2xl p-5">
                  <h3 className="font-bold text-foreground mb-4">{t('Features & Amenities', 'المميزات والخدمات')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.hasParking && <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-xl">{t('Parking', 'مواقف سيارات')}</span>}
                    {restaurant.hasOutdoorSeating && <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-xl">{t('Outdoor Seating', 'جلسات خارجية')}</span>}
                    {restaurant.hasPrivateRoom && <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-xl">{t('Private Room', 'غرفة خاصة')}</span>}
                    {restaurant.isHalal && <span className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-xl">{t('Halal', 'حلال')}</span>}
                    {!restaurant.hasParking && !restaurant.hasOutdoorSeating && !restaurant.hasPrivateRoom && !restaurant.isHalal && (
                      <span className="text-sm text-muted-foreground">{t('No amenities listed.', 'لا توجد مميزات مدرجة.')}</span>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-foreground mb-2">{t('Contact', 'التواصل')}</h3>
                  {restaurant.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <a href={`tel:${restaurant.phone}`} className="text-sm text-foreground hover:text-primary" dir="ltr">{restaurant.phone}</a>
                    </div>
                  )}
                  {restaurant.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-primary shrink-0" />
                      <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{restaurant.website}</a>
                    </div>
                  )}
                  {restaurant.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{restaurant.address}</span>
                    </div>
                  )}
                </div>

                {/* Location Map */}
                {restaurant.latitude && restaurant.longitude ? (
                  <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 p-4 border-b border-border/40">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-foreground">{t('Location', 'الموقع')}</h3>
                    </div>
                    <iframe
                      title={`Map of ${name}`}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${restaurant.longitude - 0.01}%2C${restaurant.latitude - 0.008}%2C${restaurant.longitude + 0.01}%2C${restaurant.latitude + 0.008}&layer=mapnik&marker=${restaurant.latitude}%2C${restaurant.longitude}`}
                      className="w-full h-56 border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-3">
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${restaurant.latitude}&mlon=${restaurant.longitude}#map=16/${restaurant.latitude}/${restaurant.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {t('Open in maps', 'فتح في الخريطة')}
                      </a>
                    </div>
                  </div>
                ) : restaurant.address ? (
                  <div className="bg-card border border-border/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-foreground">{t('Location', 'الموقع')}</h3>
                    </div>
                    <a
                      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(restaurant.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {restaurant.address}
                    </a>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Info Card */}
            <div className="bg-card border border-border rounded-3xl p-5 shadow-sm sticky top-6">
              <h3 className="font-bold text-lg mb-4">{t('Quick Info', 'معلومات سريعة')}</h3>

              {openingHours.length > 0 && (() => {
                const todayHours = openingHours.find(h => h.dayOfWeek === today);
                return todayHours ? (
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("Today's Hours", 'ساعات اليوم')}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {todayHours.isClosed ? t('Closed', 'مغلق') : `${todayHours.openTime} – ${todayHours.closeTime}`}
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}

              {restaurant.phone && (
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href={`tel:${restaurant.phone}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors" dir="ltr">
                    {restaurant.phone}
                  </a>
                </div>
              )}

              {restaurant.website && (
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate">
                    {restaurant.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t border-border mt-4">
                {restaurant.hasParking && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg">{t('Parking', 'مواقف')}</span>}
                {restaurant.hasOutdoorSeating && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg">{t('Outdoor', 'خارجي')}</span>}
                {restaurant.isHalal && <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg">{t('Halal', 'حلال')}</span>}
              </div>

              <Button onClick={() => setShowBooking(true)} className="w-full mt-5 font-bold">
                {t('Book a Table', 'احجز طاولة')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && restaurant && (
        <BookingModal
          restaurantId={restaurant.id}
          restaurantNameEn={restaurant.nameEn}
          restaurantNameAr={restaurant.nameAr}
          onClose={() => setShowBooking(false)}
        />
      )}

      {/* Review Composer Modal */}
      {showReviewComposer && restaurant && (
        <ReviewComposerModal
          restaurantId={restaurant.id}
          restaurantNameEn={restaurant.nameEn}
          restaurantNameAr={restaurant.nameAr}
          onClose={() => setShowReviewComposer(false)}
          onSuccess={() => {
            setShowReviewComposer(false);
            queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(Number(id)) });
          }}
        />
      )}
    </div>
  );
}
