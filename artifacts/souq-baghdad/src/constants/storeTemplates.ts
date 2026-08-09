// ===========================================
// ملف قوالب المتاجر الاحترافية
// 5 قوالب: default, beauty, tech, medical, auto, commerce
// ===========================================

export interface StoreTemplate {
  id: string;
  label: string;
  emoji: string;
  description: string;
  bannerGradient: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  borderColor: string;
  suitableFor: string[];
}

export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: 'default',
    label: 'عام',
    emoji: '🏪',
    description: 'قالب عام مناسب لجميع الأنشطة التجارية',
    bannerGradient: 'from-gray-900 via-gray-800 to-gray-950',
    accentColor: 'amber',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    suitableFor: ['متجر عام', 'بيع وشراء', 'خدمات متنوعة'],
  },
  {
    id: 'beauty',
    label: 'كوزمتك وأزياء',
    emoji: '💄',
    description: 'قالب أنيق لمتاجر التجميل والأزياء',
    bannerGradient: 'from-pink-950 via-purple-900 to-rose-950',
    accentColor: 'pink',
    accentBg: 'bg-pink-500/10',
    accentText: 'text-pink-400',
    borderColor: 'border-pink-500/20',
    suitableFor: ['كوزمتك', 'مستحضرات تجميل', 'أزياء', 'ملابس'],
  },
  {
    id: 'tech',
    label: 'إلكترونيات وتقنية',
    emoji: '💻',
    description: 'قالب حديث لمتاجر الإلكترونيات والتقنية',
    bannerGradient: 'from-blue-950 via-slate-900 to-cyan-950',
    accentColor: 'cyan',
    accentBg: 'bg-cyan-500/10',
    accentText: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
    suitableFor: ['إلكترونيات', 'هواتف', 'لابتوب', 'كمبيوتر', 'اكسسوار'],
  },
  {
    id: 'medical',
    label: 'طبي ومهني',
    emoji: '🏥',
    description: 'قالب احترافي للأطباء والمهندسين والمتخصصين',
    bannerGradient: 'from-emerald-950 via-teal-900 to-green-950',
    accentColor: 'emerald',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    suitableFor: ['طبيب', 'مهندس', 'محامي', 'معلم', 'مختبر', 'عيادة'],
  },
  {
    id: 'auto',
    label: 'سيارات ومركبات',
    emoji: '🚗',
    description: 'قالب ديناميكي لمعارض السيارات وقطع الغيار',
    bannerGradient: 'from-orange-950 via-red-900 to-gray-950',
    accentColor: 'orange',
    accentBg: 'bg-orange-500/10',
    accentText: 'text-orange-400',
    borderColor: 'border-orange-500/20',
    suitableFor: ['سيارات', 'موتوسيكل', 'قطع غيار', 'معرض سيارات'],
  },
];

export function getTemplate(templateId: string | undefined): StoreTemplate {
  return STORE_TEMPLATES.find(t => t.id === templateId) || STORE_TEMPLATES[0];
}

export const SPECIALTIES = [
  { group: '🏥 طبي وصحي', items: ['طبيب عام', 'طبيب أسنان', 'طبيب عيون', 'صيدلاني', 'ممرض', 'مختبرات طبية', 'عيادة تجميل'] },
  { group: '⚙️ هندسة وتقنية', items: ['مهندس مدني', 'مهندس كهربائي', 'مهندس حاسبات', 'مبرمج', 'مصمم جرافيك', 'صيانة أجهزة'] },
  { group: '🛍️ متجر تجاري', items: ['متجر إلكترونيات', 'متجر أزياء', 'متجر أحذية', 'متجر كوزمتك', 'متجر أثاث', 'بقالة', 'مطبخ وأدوات منزلية'] },
  { group: '🚗 سيارات', items: ['معرض سيارات', 'قطع غيار', 'تصليح سيارات', 'كراج', 'دهان سيارات'] },
  { group: '🔧 خدمات', items: ['كهربائي', 'سباك', 'نجار', 'مكيفات', 'دهان', 'بناء', 'تنظيف'] },
  { group: '📚 تعليم', items: ['معلم خصوصي', 'أستاذ جامعي', 'دروس لغات', 'كورسات برمجة', 'تدريب رياضي'] },
  { group: '🎨 فن وإعلام', items: ['مصور فوتوغرافي', 'مصور فيديو', 'موسيقي', 'فنان', 'مؤثر اجتماعي'] },
];
