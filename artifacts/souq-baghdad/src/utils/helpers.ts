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

export const isNewItem = (iso: string): boolean => {
  if (!iso) return false;
  return new Date().getTime() - new Date(iso).getTime() < 48 * 60 * 60 * 1000;
};
