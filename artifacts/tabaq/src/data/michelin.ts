export interface MichelinRestaurant {
  id: string;
  nameEn: string;
  nameAr: string;
  stars: 1 | 2 | 3;
  bib?: boolean;
  descriptionEn: string;
  descriptionAr: string;
  chefEn: string;
  chefAr: string;
  cuisineEn: string;
  cuisineAr: string;
  cityEn: string;
  cityAr: string;
  address: string;
  coverImage: string;
  galleryImages: string[];
  signatureDishes: { nameEn: string; nameAr: string; imageUrl: string; descriptionEn: string }[];
  awards: string[];
  priceRange: string;
  phone: string;
  website?: string;
  openingHours: string;
  since: number;
}

export const MICHELIN_RESTAURANTS: MichelinRestaurant[] = [
  {
    id: 'nobu-riyadh',
    nameEn: 'Nobu Riyadh',
    nameAr: 'نوبو الرياض',
    stars: 1,
    descriptionEn: 'Nobu Riyadh brings Chef Nobu Matsuhisa\'s legendary Japanese-Peruvian fusion cuisine to the heart of the Saudi capital. Set within the luxurious Four Seasons Hotel, the restaurant blends minimalist Japanese aesthetics with warm Middle Eastern hospitality, offering an unforgettable culinary journey.',
    descriptionAr: 'يُقدّم نوبو الرياض المطبخ الياباني البيروفي الأسطوري للشيف نوبو ماتسوهيسا في قلب العاصمة السعودية. يجمع المطعم الموجود في فندق فور سيزونز الفاخر بين الجماليات اليابانية البسيطة وكرم الضيافة الشرق أوسطية.',
    chefEn: 'Chef Nobu Matsuhisa',
    chefAr: 'الشيف نوبو ماتسوهيسا',
    cuisineEn: 'Japanese-Peruvian Fusion',
    cuisineAr: 'مزيج ياباني بيروفي',
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    address: 'Four Seasons Hotel Riyadh, Kingdom Centre Tower',
    coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&h=1080&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=900&h=600&fit=crop',
    ],
    signatureDishes: [
      { nameEn: 'Black Cod Miso', nameAr: 'سمك القد الأسود بالميسو', imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=400&fit=crop', descriptionEn: 'Chilean sea bass marinated in sweet miso for 48 hours, then perfectly glazed.' },
      { nameEn: 'Wagyu Tataki', nameAr: 'واغيو تاتاكي', imageUrl: 'https://images.unsplash.com/photo-1558030137-a56c1b015960?w=600&h=400&fit=crop', descriptionEn: 'Premium Japanese A5 Wagyu lightly seared, with ponzu and micro greens.' },
      { nameEn: 'Yellowtail Jalapeño', nameAr: 'تونة صفراء بالهالابينو', imageUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&h=400&fit=crop', descriptionEn: 'Hamachi sashimi with yuzu ponzu, jalapeño and micro coriander.' },
    ],
    awards: ['Michelin Star 2024', 'World\'s 50 Best Restaurants', 'Forbes Travel Guide Five-Star'],
    priceRange: 'SAR 600–1,200 per person',
    phone: '+966 11 211 5000',
    website: 'https://noburestaurants.com',
    openingHours: 'Mon–Sat: 7:00 PM – 11:30 PM',
    since: 2017,
  },
  {
    id: 'the-globe',
    nameEn: 'The Globe',
    nameAr: 'ذا جلوب',
    stars: 1,
    descriptionEn: 'Perched atop the iconic Faisaliah Tower, The Globe is Riyadh\'s most dramatic dining destination. Its golden sphere offers panoramic 360-degree views of the capital while serving contemporary European cuisine that reimagines classical techniques with Saudi seasonal ingredients.',
    descriptionAr: 'يقع ذا جلوب في أعلى برج الفيصلية الأيقوني، وهو أكثر وجهات تناول الطعام إثارة للدراما في الرياض. تقدّم الكرة الذهبية إطلالات بانورامية بزاوية 360 درجة على العاصمة مع تقديم المطبخ الأوروبي المعاصر.',
    chefEn: 'Chef Julien Jouhannaud',
    chefAr: 'الشيف جوليان جوهانو',
    cuisineEn: 'Contemporary European',
    cuisineAr: 'أوروبي معاصر',
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    address: 'Faisaliah Tower, Al Olaya District, Riyadh',
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    ],
    signatureDishes: [
      { nameEn: 'Lobster Bisque', nameAr: 'حساء الكركند', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop', descriptionEn: 'Velvety Brittany lobster bisque finished with cognac cream and crispy lobster tail.' },
      { nameEn: 'Dry-Aged Wagyu Striploin', nameAr: 'سترلوين واغيو المعتّق', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', descriptionEn: '45-day dry-aged A5 Wagyu with seasonal truffle sauce and roasted bone marrow.' },
      { nameEn: 'Arabian Mille-Feuille', nameAr: 'ميل فوي عربي', imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&h=400&fit=crop', descriptionEn: 'Reimagined French classic with cardamom cream, saffron gel and date caramel.' },
    ],
    awards: ['Michelin Star 2024', 'Condé Nast Traveller Top Restaurant 2023'],
    priceRange: 'SAR 800–1,500 per person',
    phone: '+966 11 273 2000',
    openingHours: 'Daily: 7:00 PM – 11:00 PM',
    since: 2000,
  },
  {
    id: 'li-beirut',
    nameEn: 'Li Beirut',
    nameAr: 'لي بيروت',
    stars: 1,
    descriptionEn: 'Li Beirut by Chef Yannick Alléno brings a fresh Levantine-French perspective to Riyadh\'s fine dining scene. The menu celebrates the cultural dialogue between the Levant and France through precisely crafted dishes that honour tradition while embracing modern creativity.',
    descriptionAr: 'يُقدّم لي بيروت للشيف يانيك آلينو منظوراً لبنانياً-فرنسياً جديداً على المشهد الفاخر في الرياض. تُكرّم القائمة الحوار الثقافي بين بلاد الشام وفرنسا من خلال أطباق مُعدَّة بدقة.',
    chefEn: 'Chef Yannick Alléno',
    chefAr: 'الشيف يانيك آلينو',
    cuisineEn: 'Modern Levantine-French',
    cuisineAr: 'شامي-فرنسي حديث',
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    address: 'Sofitel Riyadh Hotel & Convention Centre',
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1455279032140-49a4bf46f343?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3df1?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
    ],
    signatureDishes: [
      { nameEn: 'Tabbouleh Revisited', nameAr: 'تبولة معاد تصورها', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop', descriptionEn: 'A deconstructed homage to tabbouleh with herbs from the restaurant\'s garden.' },
      { nameEn: 'Kibbeh Nayyeh', nameAr: 'كبة نيّة', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop', descriptionEn: 'Traditional Lebanese raw kibbeh elevated with truffle oil and pomegranate molasses.' },
      { nameEn: 'Pistachio Knafeh Soufflé', nameAr: 'سوفليه كنافة بالفستق', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop', descriptionEn: 'A soufflé inspired by Lebanon\'s iconic knafeh, finished with rose water cream.' },
    ],
    awards: ['Michelin Star 2024', 'Best Restaurant Saudi Arabia 2023 — Time Out'],
    priceRange: 'SAR 500–950 per person',
    phone: '+966 11 895 0000',
    openingHours: 'Tue–Sun: 7:00 PM – 11:00 PM',
    since: 2019,
  },
  {
    id: 'taian-table',
    nameEn: 'Taian Table',
    nameAr: 'تايان تيبل',
    stars: 1,
    descriptionEn: 'Shanghai\'s acclaimed Taian Table — helmed by Chef Stefan Stiller — arrives in Riyadh with its celebrated Chinese tasting menu. Each meticulously crafted course tells the story of China\'s diverse regional culinary heritage through world-class ingredients.',
    descriptionAr: 'يصل تايان تيبل من شنغهاي المرموق إلى الرياض مع قائمة التذوق الصينية الشهيرة. كل طبق مُعدٌّ بعناية فائقة يحكي قصة التراث الطهوي الإقليمي المتنوع في الصين من خلال مكونات عالمية المستوى.',
    chefEn: 'Chef Stefan Stiller',
    chefAr: 'الشيف ستيفان ستيلر',
    cuisineEn: 'Contemporary Chinese',
    cuisineAr: 'صيني معاصر',
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    address: 'SENSO Mall, Diplomatic Quarter, Riyadh',
    coverImage: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=1920&h=1080&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555126634-323283e090fa?w=900&h=600&fit=crop',
    ],
    signatureDishes: [
      { nameEn: 'Peking Duck Taco', nameAr: 'تاكو البط البكيني', imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&h=400&fit=crop', descriptionEn: 'Crispy Peking duck in a handmade taco shell with hoisin and compressed cucumber.' },
      { nameEn: 'Sichuan Sea Bass', nameAr: 'قاروص سيتشوان', imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=400&fit=crop', descriptionEn: 'Wild sea bass in a delicate Sichuan mala broth with chrysanthemum.' },
      { nameEn: 'Tang Yuan Dessert', nameAr: 'حلوى تانج يوان', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop', descriptionEn: 'Traditional glutinous rice balls with black sesame, in rose water ginger broth.' },
    ],
    awards: ['Michelin Star 2024', 'Asia\'s 50 Best Restaurants 2023'],
    priceRange: 'SAR 550–1,000 per person',
    phone: '+966 11 480 3900',
    openingHours: 'Wed–Mon: 7:00 PM – 11:00 PM',
    since: 2022,
  },
  {
    id: 'najd-village',
    nameEn: 'Najd Village',
    nameAr: 'قرية نجد',
    stars: 1,
    bib: false,
    descriptionEn: 'Najd Village is a love letter to Saudi heritage. Set in a stunning recreation of a traditional Najdi village, it celebrates the Kingdom\'s rich culinary traditions through authentic recipes passed down through generations, presented with contemporary finesse.',
    descriptionAr: 'قرية نجد هي رسالة حب للتراث السعودي. تقع في إعادة إنشاء رائعة لقرية نجدية تقليدية، وتحتفل بالتقاليد الطهوية الغنية للمملكة من خلال وصفات أصيلة متوارثة عبر الأجيال.',
    chefEn: 'Chef Noura Al-Rashidi',
    chefAr: 'الشيفة نورة الراشدي',
    cuisineEn: 'Traditional Saudi',
    cuisineAr: 'سعودي تقليدي',
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    address: 'King Fahd Road, Al Sulaimaniyah, Riyadh',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1527515637462-cff94aca208b?w=900&h=600&fit=crop',
    ],
    signatureDishes: [
      { nameEn: 'Lamb Kabsa', nameAr: 'كبسة ضأن', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop', descriptionEn: 'Whole slow-roasted Najdi lamb on saffron rice, the crown jewel of Saudi cuisine.' },
      { nameEn: 'Jareesh with Mutton', nameAr: 'جريش باللحم', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop', descriptionEn: 'Cracked wheat stew slow-cooked with mutton, a centuries-old Najdi classic.' },
      { nameEn: 'Luqaimat', nameAr: 'لقيمات', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop', descriptionEn: 'Crispy golden dumplings drizzled with date molasses and sesame, served warm.' },
    ],
    awards: ['Michelin Star 2024', 'National Heritage Award 2022'],
    priceRange: 'SAR 200–450 per person',
    phone: '+966 11 465 1111',
    openingHours: 'Daily: 12:00 PM – 11:30 PM',
    since: 1995,
  },
  {
    id: 'mira-jeddah',
    nameEn: 'Mira',
    nameAr: 'ميرا',
    stars: 1,
    descriptionEn: 'Mira in Jeddah\'s historic Al-Balad district is a celebration of the Red Sea coast\'s seafood traditions. Chef Hisham Askar masterfully blends local Hejazi spice traditions with cutting-edge French technique to create a truly singular tasting experience.',
    descriptionAr: 'ميرا في حي البلد التاريخي بجدة هو احتفال بتقاليد المأكولات البحرية على ساحل البحر الأحمر. يمزج الشيف هشام عسكر بمهارة تقاليد التوابل الحجازية المحلية مع الأساليب الفرنسية المتطورة.',
    chefEn: 'Chef Hisham Askar',
    chefAr: 'الشيف هشام عسكر',
    cuisineEn: 'Red Sea Seafood & Modern Hejazi',
    cuisineAr: 'مأكولات بحرية وحجازي حديث',
    cityEn: 'Jeddah',
    cityAr: 'جدة',
    address: 'Al-Balad Historic District, Jeddah',
    coverImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&h=1080&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    ],
    signatureDishes: [
      { nameEn: 'Red Sea Hamour', nameAr: 'هامور البحر الأحمر', imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop', descriptionEn: 'Fresh-caught hamour poached in saffron-spiced court-bouillon, with black lime gel.' },
      { nameEn: 'Aseeda Soufflé', nameAr: 'سوفليه العصيدة', imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&h=400&fit=crop', descriptionEn: 'A soufflé inspired by the traditional Hejazi aseeda, with date and cardamom.' },
      { nameEn: 'Pearl Diver\'s Platter', nameAr: 'طبق الغوّاص', imageUrl: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600&h=400&fit=crop', descriptionEn: 'A tribute to Jeddah\'s pearl diving heritage: oysters, urchin and clams on pearl salt.' },
    ],
    awards: ['Michelin Star 2024', 'Arab Hospitality Excellence Award 2023'],
    priceRange: 'SAR 450–850 per person',
    phone: '+966 12 648 0000',
    openingHours: 'Tue–Sun: 7:00 PM – 11:30 PM',
    since: 2020,
  },
];

export const BIB_GOURMAND: Omit<MichelinRestaurant, 'stars' | 'bib' | 'galleryImages' | 'signatureDishes' | 'awards' | 'since'>[] = [
  { id: 'bg-1', nameEn: 'Butcher Shop & Grill', nameAr: 'بوتشر شوب وجريل', descriptionEn: 'Premium cuts and fire-grilled perfection at an accessible price point.', descriptionAr: 'أفضل قطع اللحوم والشواء على نار مفتوحة بسعر مناسب.', chefEn: 'Chef Rami Khoury', chefAr: 'الشيف رامي خوري', cuisineEn: 'Steakhouse', cuisineAr: 'مطعم لحوم', cityEn: 'Riyadh', cityAr: 'الرياض', address: 'Tahlia Street, Riyadh', coverImage: 'https://images.unsplash.com/photo-1558030137-a56c1b015960?w=900&h=600&fit=crop', priceRange: 'SAR 120–250 per person', phone: '+966 11 293 3000', openingHours: 'Daily: 12:00 PM – 12:00 AM' },
  { id: 'bg-2', nameEn: 'Lusin', nameAr: 'لوسين', descriptionEn: 'Vibrant Armenian-Mediterranean cuisine with fresh herbs and bold spices.', descriptionAr: 'مطبخ أرميني-متوسطي نابض بالحياة مع الأعشاب الطازجة والتوابل الجريئة.', chefEn: 'Chef Sarkis Balian', chefAr: 'الشيف سركيس باليان', cuisineEn: 'Armenian-Mediterranean', cuisineAr: 'أرمني-متوسطي', cityEn: 'Riyadh', cityAr: 'الرياض', address: 'Al-Nakheel, Riyadh', coverImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop', priceRange: 'SAR 150–300 per person', phone: '+966 11 235 5000', openingHours: 'Daily: 1:00 PM – 11:30 PM' },
];
