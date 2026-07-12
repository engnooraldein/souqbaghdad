export const getGlowClass = (role?: string): string => {
  if (!role) return '';
  if (role === 'owner') return 'glow-owner';
  if (role === 'admin') return 'glow-admin';
  if (role === 'vendor') return 'glow-vendor';
  if (role === 'pro') return 'glow-pro';
  return '';
};

export const getWhatsAppResetLink = (phone: string): string => {
  if (!phone) return '#';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('07')) clean = '964' + clean.slice(1);
  else if (clean.startsWith('7')) clean = '964' + clean;
  const msg = `🌟 *أهلاً بك في سوق بغداد - السوق الرقمي العراقي*\n\nتم تصفير كلمة سر حسابك بنجاح.\n🔑 الرمز السري الجديد هو: *123456*\n\n💡 *ملاحظة:* يمكنك تغيير كلمة السر في أي وقت من خلال:\n(حسابي الشخصي > الملف الشخصي > قسم الحساب).\n\nشكراً لاستخدامك منصتنا، ونتمنى لك تجربة تسوق رائعة! 🛒\n🌐 رابط الموقع: www.souqbaghdad.store`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
};

export const isNewItem = (iso?: string): boolean => {
  if (!iso) return false;
  return new Date().getTime() - new Date(iso).getTime() < 48 * 60 * 60 * 1000;
};

export function getWhatsAppLink(phone: string, itemType: 'product' | 'transport', details: any) {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
  if (!cleanPhone.startsWith('964') && !cleanPhone.startsWith('+964')) {
    cleanPhone = '964' + cleanPhone;
  }
  cleanPhone = cleanPhone.replace('+', '');
  const idStr = details.short_id ? `#${details.short_id}` : `#${String(details.id).substring(0, 5)}`;
  const title = details.title || details.university || 'إعلان';
  const location = details.location || details.governorate || 'غير محدد';
  
  const text = `السلام عليكم 🌹
شفت إعلان (*${title}*) وحاب أستفسر عنه إذا متوفر حالياً.

*تفاصيل الإعلان:*
📌 *${title}*
🆔 *رمز الإعلان:* ${idStr}
📍 *${location}*

*رسالة من منصة سوق بغداد:*
سوق بغداد هو السوق الرقمي العراقي الحديث، نسهل عليكم التواصل المباشر بين البائع والمشتري بكل سرعة وأمان.
🌐 تصفحوا المزيد من العروض عبر موقعنا:
www.souqbaghdad.store
بانتظار ردكم، شكراً 🙏`;
  
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}

export const slugify = (text: string) => {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
    .replace(/--+/g, '-');
};
