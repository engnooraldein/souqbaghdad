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

    // 1. Fetch active ads with images & titles for Google Image Search
    const { data: ads } = await supabase
      .from('ads')
      .select('id, title, images, created_at')
      .neq('status', 'sold')
      .eq('is_demo', false)
      .limit(5000);
      
    // 2. Fetch active products with images & titles for Google Image Search
    const { data: products } = await supabase
      .from('products')
      .select('id, title, images, created_at')
      .neq('status', 'sold')
      .limit(5000);

    // 3. Fetch public sellers & stores
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
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
  <!-- الرئيسية -->
  <url>
    <loc>https://www.souqbaghdad.store/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
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

    // إضافة الإعلانات مع صورها لـ Google Images
    if (ads) {
      ads.forEach(ad => {
        if (!ad.created_at) return;
        const dateStr = new Date(ad.created_at).toISOString().split('T')[0];
        let imageXml = '';
        if (Array.isArray(ad.images) && ad.images.length > 0) {
          ad.images.slice(0, 3).forEach(imgUrl => {
            if (imgUrl) {
              imageXml += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(ad.title || 'إعلان في سوق بغداد')}</image:title>
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

    // إضافة المنتجات مع صورها لـ Google Images
    if (products) {
      products.forEach(product => {
        if (!product.created_at) return;
        const dateStr = new Date(product.created_at).toISOString().split('T')[0];
        let imageXml = '';
        if (Array.isArray(product.images) && product.images.length > 0) {
          product.images.slice(0, 3).forEach(imgUrl => {
            if (imgUrl) {
              imageXml += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(product.title || 'منتج في سوق بغداد')}</image:title>
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
          avatarXml = `
    <image:image>
      <image:loc>${escapeXml(p.avatar_url)}</image:loc>
      <image:title>${escapeXml(p.full_name || 'متجر في سوق بغداد')}</image:title>
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
