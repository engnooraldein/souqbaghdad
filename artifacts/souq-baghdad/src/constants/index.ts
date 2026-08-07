export const DEFAULT_AD_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#0f172a"/><path d="M220 240 L280 160 L340 240 L400 180 L480 280 L160 280 Z" fill="#1e293b"/><circle cx="230" cy="150" r="22" fill="#334155"/><text x="50%" y="82%" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#94a3b8" text-anchor="middle">سوق بغداد - الصورة غير متوفرة</text></svg>')}`;

export const DEFAULT_COVER = 'https://i.ibb.co/Ltb1z79/souqbaghdad-cover.jpg';
export const DEFAULT_AVATAR = 'https://i.ibb.co/hRyMhcc/avatar.png';

export const getCoverImage = (user: {role?: string, cover?: string}) => {
  if (['pro', 'vendor', 'admin', 'owner'].includes(user?.role || '')) {
    return user?.cover || DEFAULT_COVER;
  }
  return DEFAULT_COVER;
};

export const IRAQI_GOVERNORATES = [
  'الكل','بغداد','البصرة','نينوى','أربيل','كربلاء','النجف',
  'دهوك','السليمانية','بابل','ديالى','المثنى','ميسان',
  'القادسية','صلاح الدين','واسط','الأنبار','ذي قار','كركوك',
];

export const CATEGORIES = [
  { id:'all',          name:'الرئيسية',     emoji:'🏠' },
  { id:'general',      name:'العرض العام',  emoji:'📢' },
  { id:'cars',         name:'السيارات',    emoji:'🚗' },
  { id:'real-estate',  name:'العقارات',    emoji:'🏠' },
  { id:'phones',       name:'الهواتف',     emoji:'📱' },
  { id:'electronics',  name:'إلكترونيات', emoji:'💻' },
  { id:'gym',          name:'رياضة وجيم',  emoji:'🏋️‍♂️' },
  { id:'clothes',      name:'الملابس',     emoji:'👕' },
  { id:'cosmetics',    name:'الكوزمتك',    emoji:'💄' },
  { id:'handmade',     name:'حرف يدوية',   emoji:'🧶' },
  { id:'jobs',         name:'وظائف',       emoji:'💼' },
  { id:'furniture',    name:'أثاث',        emoji:'🛋️' },
  { id:'bikes',        name:'دراجات',      emoji:'🚲' },
  { id:'services',     name:'خدمات',       emoji:'🔧' },
  { id:'games',        name:'الألعاب',     emoji:'🎮' },
];

export const GAMES_DATA = [
  { id:1, title:'ضارب الدجاج', emoji:'🐔💥', rating:4.9 },
  { id:2, title:'ورق طاولي',   emoji:'🃏',    rating:4.8 },
  { id:3, title:'داما',         emoji:'🎲',    rating:4.6 },
  { id:4, title:'سودوكو',       emoji:'🧩',    rating:4.5 },
  { id:5, title:'شطرنج',        emoji:'♟️',    rating:4.7 },
  { id:6, title:'بورت',         emoji:'🎴',    rating:4.4 },
];

export const PUBLIC_UNIVERSITIES = [
  'جامعة بغداد', 'الجامعة المستنصرية', 'الجامعة التكنولوجية', 'الجامعة العراقية',
  'جامعة النهرين', 'جامعة تكنولوجيا المعلومات والاتصالات'
];

export const PRIVATE_UNIVERSITIES = [
  'كلية الرافدين الجامعة', 'كلية التراث الجامعة', 'كلية المنصور الجامعة',
  'كلية المأمون الجامعة', 'جامعة الفراهيدي', 'جامعة دجلة',
  'كلية الاسراء الجامعة', 'كلية مدينة العلم الجامعة', 'كلية السلام الجامعة',
  'جامعة أوروك (Uruk)', 'جامعة البيان', 'كلية بغداد للعلوم الاقتصادية الجامعة',
  'كلية أصول الدين الجامعة', 'كلية الرشيد الجامعة', 'كلية اليرموك الجامعة',
  'كلية الطف الجامعة', 'كلية الفارابي الجامعة', 'كلية المصطفى الجامعة',
  'جامعة النور', 'جامعة المعقل', 'كلية النسور الجامعة', 'جامعة المستقبل'
];

export const UNIVERSITIES = [
  'الكل', 
  ...PUBLIC_UNIVERSITIES,
  ...PRIVATE_UNIVERSITIES,
  'أخرى'
];

export const EMPLOYEE_WORKPLACES = [
  'الكل', 'الوزارات والدوائر الحكومية', 'المنطقة الخضراء', 'مجمع الكليات / الجادرية',
  'البنوك والمصارف', 'الشركات الأهلية', 'المستشفيات والدوائر الصحية', 'ميناء / مطار بغداد',
  'شارع فلسطين / زيونة (تجارية)', 'المنصور / الحارثية (دوائر وشركات)', 'الالكرادة (مؤسسات وشركات)', 'أخرى'
];

export const BAGHDAD_REGIONS = [
  'الكرادة', 'الجادرية', 'المنصور', 'اليرموك', 'الحارثية', 'حي الجامعة', 'حي العدل', 'الغزالية',
  'العامرية', 'السيدية', 'البياع', 'الدورة', 'الزعفرانية', 'بغداد الجديدة', 'الكاظمية', 'الأعظمية',
  'زيونة', 'فلسطين', 'الشعب', 'البنوك', 'حي القاهرة', 'سبع ابكار', 'حي التراث', 'حي العامل',
  'حي الجهاد', 'حي الإعلام', 'حي الرسالة', 'حي الشرطة', 'حي الخضراء', 'الفلوجة', 'التاجي', 'المحمودية',
  'الشعلة', 'الكريعات', 'جميلة', 'الصدر', 'الحبيبية', 'البلديات', 'الامين', 'المشتل', 'العبيدي', 'الكمالية'
];
