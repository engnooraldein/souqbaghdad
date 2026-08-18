import { createClient } from '@supabase/supabase-js';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).send('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch active ads with detailed metadata & images for Google Image Search
    const { data: ads } = await supabase
      .from('ads')
      .select('id, title, images, city, category, created_at')
      .neq('status', 'sold')
      .eq('is_demo', false)
      .limit(5000);
      
    // 2. Fetch active products with detailed metadata & images for Google Image Search
    const { data: products } = await supabase
      .from('products')
      .select('id, title, images, category, created_at')
      .neq('status', 'sold')
      .limit(5000);

    // 3. Fetch public sellers & stores
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, created_at')
      .limit(2000);

    // 4. Categories list for targeted SEO indexing
    const categories = [
      'cars', 'realestate', 'phones', 'electronics', 
      'clothes', 'cosmetics', 'handmade', 'jobs', 
      'furniture', 'bikes', 'services'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- الصفحة الرئيسية مع صور الهوية البصرية والتصاميم والشعار -->
  <url>
    <loc>https://www.souqbaghdad.store/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://www.souqbaghdad.store/logo.jpg</image:loc>
      <image:title>شعار سوق بغداد - السوق الرقمي العراقي</image:title>
      <image:caption>هوية وتصاميم سوق بغداد المنصة الرقمية الأولى للإعلانات والمتاجر في العراق</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://www.souqbaghdad.store/baghdad_night.webp</image:loc>
      <image:title>خلفية بغداد الليلية وتصاميم سوق بغداد</image:title>
      <image:caption>تصميم واجهة سوق بغداد بالوضع الليلي</image:caption>
    </image:image>
  </url>
  <url>
    <loc>https://www.souqbaghdad.store/IQ</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.souqbaghdad.store/transport</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.souqbaghdad.store/privacy.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;

    // إضافة الأقسام الرئيسية
    categories.forEach(cat => {
      xml += `
  <url>
    <loc>https://www.souqbaghdad.store/category/${cat}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    // إضافة الإعلانات مع عناوين الصور والشرح الدقيق لـ Google Images
    if (ads) {
      ads.forEach(ad => {
        if (!ad.created_at) return;
        const dateStr = new Date(ad.created_at).toISOString().split('T')[0];
        let imageXml = '';
        if (Array.isArray(ad.images) && ad.images.length > 0) {
          ad.images.slice(0, 4).forEach((imgUrl, idx) => {
            if (imgUrl) {
              const imgTitle = (ad.title || 'إعلان سوق بغداد') + (idx > 0 ? ` - صورة ${idx + 1}` : '');
              const imgCaption = `${ad.title || 'إعلان'} - ${ad.city || 'بغداد العراق'} - سوق بغداد للبيع والشراء الإعلانات المباشرة`;
              imageXml += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(imgTitle)}</image:title>
      <image:caption>${escapeXml(imgCaption)}</image:caption>
    </image:image>`;
            }
          });
        }
        xml += `
  <url>
    <loc>https://www.souqbaghdad.store/ad/${ad.id}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>${imageXml}
  </url>`;
      });
    }

    // إضافة المنتجات مع عناوين الصور والشرح الدقيق لـ Google Images
    if (products) {
      products.forEach(product => {
        if (!product.created_at) return;
        const dateStr = new Date(product.created_at).toISOString().split('T')[0];
        let imageXml = '';
        if (Array.isArray(product.images) && product.images.length > 0) {
          product.images.slice(0, 4).forEach((imgUrl, idx) => {
            if (imgUrl) {
              const imgTitle = (product.title || 'منتج سوق بغداد') + (idx > 0 ? ` - صورة ${idx + 1}` : '');
              const imgCaption = `${product.title || 'منتج'} - تسوق أونلاين في العراق عبر سوق بغداد`;
              imageXml += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(imgTitle)}</image:title>
      <image:caption>${escapeXml(imgCaption)}</image:caption>
    </image:image>`;
            }
          });
        }
        xml += `
  <url>
    <loc>https://www.souqbaghdad.store/product/${product.id}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>${imageXml}
  </url>`;
      });
    }

    // إضافة المتاجر وصانعي المحتوى والمتاجر الموثقة
    if (profiles) {
      profiles.forEach(p => {
        if (!p.id) return;
        let avatarXml = '';
        if (p.avatar_url) {
          const storeName = p.full_name || 'متجر موثق في سوق بغداد';
          avatarXml = `
    <image:image>
      <image:loc>${escapeXml(p.avatar_url)}</image:loc>
      <image:title>${escapeXml(storeName)}</image:title>
      <image:caption>${escapeXml(storeName + ' - متجر وحساب موثق في سوق بغداد العراق')}</image:caption>
    </image:image>`;
        }
        xml += `
  <url>
    <loc>https://www.souqbaghdad.store/seller/${p.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${avatarXml}
  </url>`;
      });
    }

    xml += `\n</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating sitemap');
  }
}
