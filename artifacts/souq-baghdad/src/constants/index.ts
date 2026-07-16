export const OWNER_EMAIL = 'nooraldeinsbah@gmail.com';

export const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e3a5f"/><circle cx="50" cy="38" r="18" fill="#4b7ab5"/><ellipse cx="50" cy="82" rx="28" ry="20" fill="#4b7ab5"/></svg>')}`;

export const DEFAULT_COVER = '/baghdad_night_bg.png';

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
  { id:'all',          name:'الكل',        emoji:'📦' },
  { id:'cars',         name:'السيارات',    emoji:'🚗' },
  { id:'real-estate',  name:'العقارات',    emoji:'🏠' },
  { id:'phones',       name:'الهواتف',     emoji:'📱' },
  { id:'electronics',  name:'إلكترونيات', emoji:'💻' },
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

export const UNIVERSITIES = [
  'الكل', 'جامعة بغداد', 'الجامعة المستنصرية', 'الجامعة التكنولوجية', 'الجامعة العراقية',
  'جامعة النهرين', 'كلية المأمون الجامعة', 'كلية التراث الجامعة', 'جامعة الفراهيدي',
  'كلية المنصور الجامعة', 'جامعة دجلة', 'كلية الاسراء الجامعة', 'كلية مدينة العلم', 'أخرى'
];

export const EMPLOYEE_WORKPLACES = [
  'الكل', 'الوزارات والدوائر الحكومية', 'المنطقة الخضراء', 'مجمع الكليات / الجادرية',
  'البنوك والمصارف', 'الشركات الأهلية', 'المستشفيات والدوائر الصحية', 'ميناء / مطار بغداد',
  'شارع فلسطين / زيونة (تجارية)', 'المنصور / الحارثية (دوائر وشركات)', 'الكرادة (مؤسسات وشركات)', 'أخرى'
];
