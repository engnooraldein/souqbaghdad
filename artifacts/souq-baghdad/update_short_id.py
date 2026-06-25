import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Update getWhatsAppLink
whatsapp_new = '''function getWhatsAppLink(phone: string, itemType: 'product' | 'transport', details: any) {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
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
}'''

# Replace the existing function
c = re.sub(r'function getWhatsAppLink[\s\S]*?return `https://wa\.me/\$\{cleanPhone\}\?text=\$\{encodeURIComponent\(text\)\}`;[\s\n]*\}', whatsapp_new, c)


# Update ID: {ad.id} to ID: {ad.short_id || ad.id} in Modals
c = re.sub(r'ID: \{ad\.id\}', r'{ad.short_id ? `#${ad.short_id}` : `ID: ${ad.id}`}', c)
c = re.sub(r'ID: \{product\.id\}', r'{product.short_id ? `#${product.short_id}` : `ID: ${product.id}`}', c)

# Update copy button to copy short_id if available
c = re.sub(r'navigator\.clipboard\.writeText\(String\(ad\.id\)\)', r'navigator.clipboard.writeText(String(ad.short_id || ad.id))', c)
c = re.sub(r'navigator\.clipboard\.writeText\(String\(product\.id\)\)', r'navigator.clipboard.writeText(String(product.short_id || product.id))', c)

# Update the search filter to include short_id
# We previously added String(a.id).includes(search)
c = re.sub(r'String\(a\.id\)\.includes\(search\)', r'String(a.id).includes(search)||(a.short_id&&a.short_id.toLowerCase().includes(search.toLowerCase()))', c)
c = re.sub(r'String\(p\.id\)\.includes\(search\)', r'String(p.id).includes(search)||(p.short_id&&p.short_id.toLowerCase().includes(search.toLowerCase()))', c)

# Update getWhatsAppLink calls to pass short_id
c = re.sub(r'\{ id: ad\.id, title: ad\.title, location: ad\.location', r'{ id: ad.id, short_id: ad.short_id, title: ad.title, location: ad.location', c)
c = re.sub(r'\{ id: product\.id, title: product\.title, location: product\.governorate', r'{ id: product.id, short_id: product.short_id, title: product.title, location: product.governorate', c)


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Updated App.tsx with short_id support!')
