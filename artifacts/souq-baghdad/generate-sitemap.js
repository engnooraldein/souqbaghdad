import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env
const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env');
  process.exit(1);
}

const DOMAIN = 'https://souqbaghdad.store';

async function generateSitemap() {
  console.log('Generating sitemap...');
  try {
    const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };
    
    // Fetch active ads
    const adsRes = await fetch(`${supabaseUrl}/rest/v1/ads?status=eq.active&select=id,updated_at,images,title,short_id,type,category,city`, { headers });
    const ads = await adsRes.json();

    // Fetch active products
    const prodsRes = await fetch(`${supabaseUrl}/rest/v1/products?status=eq.active&select=id,updated_at,images,title,short_id,category,city`, { headers });
    const products = await prodsRes.json();

    function slugify(text) {
      if (!text) return 'item';
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
        .replace(/--+/g, '-');
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Add ads
    if (Array.isArray(ads)) {
      ads.forEach(ad => {
        let imageXml = '';
        if (Array.isArray(ad.images) && ad.images.length > 0) {
          const firstImg = ad.images[0];
          if (firstImg && firstImg.startsWith('http')) {
            imageXml = `\n    <image:image>\n      <image:loc>${firstImg}</image:loc>\n    </image:image>`;
          }
        }
        const typeText = ad.type === 'buy' ? 'شراء' : ad.type === 'rent' ? 'ايجار' : ad.type === 'service' ? 'خدمات' : 'بيع';
        const categoryText = ad.category || 'عام';
        const titleText = ad.title || 'اعلان';
        const govText = ad.city || 'العراق';
        const slug = `${slugify(typeText)}-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
        const adUrl = `${DOMAIN}/ad/${slug}-${ad.short_id || ad.id}`;
        xml += `  <url>
    <loc>${adUrl}</loc>
    <lastmod>${new Date(ad.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageXml}
  </url>\n`;
      });
    }

    // Add products
    if (Array.isArray(products)) {
      products.forEach(prod => {
        let imageXml = '';
        if (Array.isArray(prod.images) && prod.images.length > 0) {
          const firstImg = prod.images[0];
          if (firstImg && firstImg.startsWith('http')) {
            imageXml = `\n    <image:image>\n      <image:loc>${firstImg}</image:loc>\n    </image:image>`;
          }
        }
        const categoryText = prod.category || 'منتجات';
        const titleText = prod.title || 'منتج';
        const govText = prod.city || 'العراق';
        const slug = `تسوق-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
        const prodUrl = `${DOMAIN}/product/${slug}-${prod.short_id || prod.id}`;
        xml += `  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${new Date(prod.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageXml}
  </url>\n`;
      });
    }

    xml += `</urlset>`;

    // Write to public/sitemap.xml
    fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), xml);
    console.log('Sitemap generated successfully at public/sitemap.xml');
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
