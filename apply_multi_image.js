const fs = require('fs');
const path = 'c:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts';
let f = fs.readFileSync(path, 'utf8');

// Normalize newlines for regex matching
f = f.replace(/\r\n/g, '\n');

// 1. Fix Gemini Prompt
const regexPrompt = /اكتب منشور تسويقي قصير وجذاب جداً باللغة العربية والعامية العراقية للإعلان التالي لمنصات التواصل الاجتماعي:[\s\S]*?ولا تستخدم علامات النجمة \(\*\) أو تنسيقات Markdown\./;
const replacementPrompt = `اكتب منشور تسويقي قصير وجذاب جداً باللغة العربية والعامية العراقية للإعلان التالي لمنصات التواصل الاجتماعي:
العنوان أو التفاصيل: \${ad.title || (ad.categoryType ? 'خط نقل ' + ad.categoryType : 'إعلان')}
السعر: \${ad.price || 'غير محدد'}
النوع: \${ad.category || ad.vehicleType || 'عام'}
الموقع أو المناطق: \${ad.city || ad.regions || 'بغداد'} \${ad.location || ''}
اسم الناشر (البائع): \${ad.seller_name || 'غير محدد'}
\${ad.shift ? 'أوقات الدوام: ' + ad.shift : ''}

ملاحظة هامة جداً 1: ضع هاشتاقات ذكية وممتازة متعلقة بمحتوى الإعلان بدقة في نهاية المنشور. (مثلاً: للإعلانات العامة استخدم هاشتاقات تخص الفئة مثل #سيارات_للبيع #عقارات #موبايلات حسب نوع الإعلان. واذكر هاشتاق للمنطقة واسم البائع إذا أمكن).
ملاحظة هامة جداً 2: اذكر اسم البائع في المنشور إذا كان متوفراً (مثال: يعرض لكم \${ad.seller_name || 'البائع'}...).
ملاحظة هامة جداً 3: ضع رابط الموقع في نهاية المنشور تماماً لكي يتمكن المشتري من الضغط عليه: \${detailUrl}
ملاحظة هامة جداً 4: يرجى ترتيب النص بشكل مريح للعين باستخدام فواصل أسطر فارغة بين الجمل، ولا تستخدم علامات النجمة (*) أو تنسيقات Markdown أبدأً.`;
f = f.replace(regexPrompt, replacementPrompt);

// 2. Fix Ads URL
f = f.replace(/const link = \`https:\/\/www\.souqbaghdad\.store\/card\/\$\{adId\}\`;/g, "const link = `https://www.souqbaghdad.store/ad/${adId}`;");

// 3. Update postToFacebook
const regexFB = /async function postToFacebook\(text: string, photoUrl: string \| null\) \{[\s\S]*?\}\n\nasync function deleteFromFacebook/m;
const replacementFB = `async function postToFacebook(text: string, photoUrl: string | string[] | null) {
  if (!META_PAGE_ACCESS_TOKEN || !META_PAGE_ID) return { error: { message: 'رمز الوصول لفيسبوك مفقود أو غير صالح' } };
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : (photoUrl ? [photoUrl] : []);
    
    if (urls.length > 1) {
      const attachedMedia = [];
      for (const url of urls) {
        const uploadRes = await fetch(\`https://graph.facebook.com/v20.0/\${META_PAGE_ID}/photos\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url, published: false, access_token: META_PAGE_ACCESS_TOKEN })
        });
        const uploadData = await uploadRes.json();
        if (uploadData && uploadData.id) {
          attachedMedia.push({ media_fbid: uploadData.id });
        }
      }
      
      if (attachedMedia.length > 0) {
        const res = await fetch(\`https://graph.facebook.com/v20.0/\${META_PAGE_ID}/feed\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, attached_media: attachedMedia, access_token: META_PAGE_ACCESS_TOKEN })
        });
        const data = await res.json();
        if (data.error) console.error('FB API Error:', data.error);
        return data;
      }
    }

    const singleUrl = urls.length > 0 ? urls[0] : null;
    const url = singleUrl 
      ? \`https://graph.facebook.com/v20.0/\${META_PAGE_ID}/photos\`
      : \`https://graph.facebook.com/v20.0/\${META_PAGE_ID}/feed\`;
      
    let body: any = { message: text, access_token: META_PAGE_ACCESS_TOKEN };
    if (singleUrl) {
      body = { caption: text, url: singleUrl, access_token: META_PAGE_ACCESS_TOKEN };
    }
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error) {
      console.error('FB API Error:', data.error);
    }
    return data;
  } catch (err: any) {
    console.error('FB Fetch Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بفيسبوك' } };
  }
}

async function deleteFromFacebook`;
f = f.replace(regexFB, replacementFB);

// 4. Update postToInstagram
const regexIG = /async function postToInstagram\(text: string, photoUrl: string \| null\) \{[\s\S]*?\}\n\nasync function deleteFromInstagram/m;
const replacementIG = `async function postToInstagram(text: string, photoUrl: string | string[] | null) {
  if (!META_PAGE_ACCESS_TOKEN || !META_IG_ACCOUNT_ID || !photoUrl) return { error: { message: 'رمز الوصول لانستكرام أو الصورة مفقودة' } };
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : [photoUrl];
    
    if (urls.length > 1) {
      const containerIds = [];
      for (const url of urls) {
        const uploadBody = {
          image_url: url,
          is_carousel_item: true,
          access_token: META_PAGE_ACCESS_TOKEN
        };
        const uploadRes = await fetch(\`https://graph.facebook.com/v20.0/\${META_IG_ACCOUNT_ID}/media\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadBody)
        });
        const uploadData = await uploadRes.json();
        if (uploadData && uploadData.id) {
          containerIds.push(uploadData.id);
        }
      }
      
      if (containerIds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const carouselBody = {
          caption: text,
          media_type: 'CAROUSEL',
          children: containerIds.join(','),
          access_token: META_PAGE_ACCESS_TOKEN
        };
        
        const carouselRes = await fetch(\`https://graph.facebook.com/v20.0/\${META_IG_ACCOUNT_ID}/media\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(carouselBody)
        });
        const carouselData = await carouselRes.json();
        
        if (carouselData && carouselData.id) {
           await new Promise(resolve => setTimeout(resolve, 5000));
           const publishBody = {
             creation_id: carouselData.id,
             access_token: META_PAGE_ACCESS_TOKEN
           };
           const publishRes = await fetch(\`https://graph.facebook.com/v20.0/\${META_IG_ACCOUNT_ID}/media_publish\`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(publishBody)
           });
           return await publishRes.json();
        } else {
           return { error: { message: \`Failed to create carousel: \${JSON.stringify(carouselData)}\` } };
        }
      }
    }
    
    const singleUrl = urls[0];
    const uploadUrl = \`https://graph.facebook.com/v20.0/\${META_IG_ACCOUNT_ID}/media\`;
    
    const uploadBody = {
      image_url: singleUrl,
      caption: text,
      access_token: META_PAGE_ACCESS_TOKEN
    };
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadBody)
    });
    const uploadData = await uploadRes.json();
    
    if (!uploadData.id) {
      console.error('IG Upload Error:', uploadData);
      return { error: { message: \`Media ID not available. URL: \${singleUrl}. Response: \${JSON.stringify(uploadData)}\` } };
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const publishUrl = \`https://graph.facebook.com/v20.0/\${META_IG_ACCOUNT_ID}/media_publish\`;
    const publishBody = {
      creation_id: uploadData.id,
      access_token: META_PAGE_ACCESS_TOKEN
    };
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody)
    });
    const data = await publishRes.json();
    return data;
  } catch (err: any) {
    console.error('IG Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بانستكرام' } };
  }
}

async function deleteFromInstagram`;
f = f.replace(regexIG, replacementIG);

// 5. Add sendMediaGroup to Telegram
const regexSendPhoto = /async function sendPhoto[\s\S]*?return res\.json\(\);\n\}\n/m;
const replacementSendPhoto = `async function sendPhoto(chatId: string | number, photoUrl: string, caption: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(\`\${tgUrl}/sendPhoto\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function sendMediaGroup(chatId: string | number, photoUrls: string[], caption: string) {
  const media = photoUrls.slice(0, 10).map((url, index) => {
    const item: any = { type: 'photo', media: url };
    if (index === 0) {
      item.caption = caption;
      item.parse_mode = 'HTML';
    }
    return item;
  });
  const body: any = { chat_id: chatId, media };
  const res = await fetch(\`\${tgUrl}/sendMediaGroup\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}
`;
if (!f.includes('sendMediaGroup')) {
  f = f.replace(regexSendPhoto, replacementSendPhoto);
}

// 6. Update the publishing flow to use sendMediaGroup and array images
// In Products
const regexProductFlow = /if \(publishTg\) \{\n\s*if \(photoUrl\) \{\n\s*await sendPhoto\(record\.post_channel, photoUrl, telegramCaption, keyboard\);\n\s*\} else \{\n\s*await sendMessage\(record\.post_channel, telegramCaption, keyboard\);\n\s*\}/m;
const replacementProductFlow = `if (publishTg) {
              const imagesToPost = record.images && record.images.length > 0 ? record.images : (photoUrl ? [photoUrl] : []);
              if (imagesToPost.length > 1) {
                await sendMediaGroup(record.post_channel, imagesToPost, telegramCaption);
                await sendMessage(record.post_channel, 'للتواصل وعرض التفاصيل:', keyboard);
              } else if (imagesToPost.length === 1) {
                await sendPhoto(record.post_channel, imagesToPost[0], telegramCaption, keyboard);
              } else {
                await sendMessage(record.post_channel, telegramCaption, keyboard);
              }`;
f = f.replace(regexProductFlow, replacementProductFlow);

// In Ads
const regexAdFlow = /if \(publishTg\) \{\n\s*if \(photoUrl\) \{\n\s*await sendPhoto\(PRODUCT_CHANNEL, photoUrl, caption, keyboard\);\n\s*\} else \{\n\s*await sendMessage\(PRODUCT_CHANNEL, caption, keyboard\);\n\s*\}/m;
const replacementAdFlow = `if (publishTg) {
              const imagesToPost = record.images && record.images.length > 0 ? record.images : (photoUrl ? [photoUrl] : []);
              if (imagesToPost.length > 1) {
                await sendMediaGroup(PRODUCT_CHANNEL, imagesToPost, caption);
                await sendMessage(PRODUCT_CHANNEL, 'للتواصل وعرض التفاصيل:', keyboard);
              } else if (imagesToPost.length === 1) {
                await sendPhoto(PRODUCT_CHANNEL, imagesToPost[0], caption, keyboard);
              } else {
                await sendMessage(PRODUCT_CHANNEL, caption, keyboard);
              }`;
f = f.replace(regexAdFlow, replacementAdFlow);

// Also pass record.images to FB, IG, TK in products and ads
const regexProductFbIgPhotoUrl = /const fbIgPhotoUrl = imageUrl \|\| 'https:\/\/souqbaghdad\.store\/opengraph\.jpg';/;
const replacementProductFbIgPhotoUrl = "const fbIgPhotoUrl = record.images && record.images.length > 0 ? record.images : (imageUrl ? [imageUrl] : ['https://souqbaghdad.store/opengraph.jpg']);";
f = f.replace(regexProductFbIgPhotoUrl, replacementProductFbIgPhotoUrl);

const regexAdFbIgPhotoUrl = /const fbIgPhotoUrl = imageUrl \|\| 'https:\/\/souqbaghdad\.store\/opengraph\.jpg';/;
const replacementAdFbIgPhotoUrl = "const fbIgPhotoUrl = record.images && record.images.length > 0 ? record.images : (imageUrl ? [imageUrl] : ['https://souqbaghdad.store/opengraph.jpg']);";
f = f.replace(regexAdFbIgPhotoUrl, replacementAdFbIgPhotoUrl);

const regexTkImages1 = /const tkImages = record\.images && record\.images\.length > 0 \? record\.images : \[fbIgPhotoUrl\];/g;
const replacementTkImages1 = "const tkImages = record.images && record.images.length > 0 ? record.images : (Array.isArray(fbIgPhotoUrl) ? fbIgPhotoUrl : [fbIgPhotoUrl]);";
f = f.replace(regexTkImages1, replacementTkImages1);

fs.writeFileSync(path, f, 'utf8');
console.log('Script completed');
