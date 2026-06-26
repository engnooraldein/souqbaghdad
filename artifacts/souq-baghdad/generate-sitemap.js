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
    const adsRes = await fetch(`${supabaseUrl}/rest/v1/ads?status=eq.active&select=id,updated_at`, { headers });
    const ads = await adsRes.json();

    // Fetch active products
    const prodsRes = await fetch(`${supabaseUrl}/rest/v1/products?status=eq.active&select=id,updated_at`, { headers });
    const products = await prodsRes.json();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Add ads
    if (Array.isArray(ads)) {
      ads.forEach(ad => {
        xml += `  <url>
    <loc>${DOMAIN}/ad/${ad.id}</loc>
    <lastmod>${new Date(ad.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });
    }

    // Add products
    if (Array.isArray(products)) {
      products.forEach(prod => {
        xml += `  <url>
    <loc>${DOMAIN}/product/${prod.id}</loc>
    <lastmod>${new Date(prod.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
