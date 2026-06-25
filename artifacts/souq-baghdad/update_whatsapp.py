import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update getWhatsAppLink function body
new_func = '''function getWhatsAppLink(phone: string, itemType: 'product' | 'transport', details: any) {
  let text = '';
  if (itemType === 'product') {
    text = `مرحباً بك في سوق بغداد! 🌟\\nيسعدنا تواصلك بخصوص المنتج: ${details.title}\\n(رقم الإعلان: ${details.id})\\n\\nتصفح المزيد عبر موقعنا: www.souqbaghdad.store`;
  } else if (itemType === 'transport') {
    text = `مرحباً بك في سوق بغداد! 🌟\\nيسعدنا تواصلك بخصوص إعلان خط الجامعة: ${details.university}\\nالمنطقة: ${details.location}\\n(رقم الإعلان: ${details.id})\\n\\nتصفح المزيد عبر موقعنا: www.souqbaghdad.store`;
  }
  const cleanPhone = phone.replace(/^0/, '');
  const num = cleanPhone.startsWith('964') ? cleanPhone : `964${cleanPhone}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}'''

content = re.sub(r"function getWhatsAppLink\(.*?\n\}", new_func, content, count=1, flags=re.DOTALL)

# 2. Update calls to getWhatsAppLink to include id
content = re.sub(
    r"getWhatsAppLink\(([^,]+),\s*(ad\.type === 'transport' \? 'transport' : 'product'),\s*\{\s*title:\s*(.*?),\s*location:\s*(.*?),\s*university:\s*(.*?),\s*time:\s*(.*?)\s*\}\)",
    r"getWhatsAppLink(\1, \2, { id: ad.id, title: \3, location: \4, university: \5, time: \6 })",
    content
)

content = re.sub(
    r"getWhatsAppLink\(([^,]+),\s*'product',\s*\{\s*title:\s*(.*?),\s*location:\s*(.*?)\s*\}\)",
    r"getWhatsAppLink(\1, 'product', { id: product.id, title: \2, location: \3 })",
    content
)

content = re.sub(
    r"getWhatsAppLink\(([^,]+),\s*'transport',\s*\{\s*title:\s*(.*?),\s*location:\s*(.*?),\s*university:\s*(.*?),\s*time:\s*(.*?)\s*\}\)",
    r"getWhatsAppLink(\1, 'transport', { id: ad.id, title: \2, location: \3, university: \4, time: \5 })",
    content
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated getWhatsAppLink and callers!')
