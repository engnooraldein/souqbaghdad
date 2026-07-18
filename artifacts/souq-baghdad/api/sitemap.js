import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).send('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active ads
    const { data: ads } = await supabase
      .from('ads')
      .select('id, created_at')
      .neq('status', 'sold')
      .eq('is_demo', false)
      .limit(5000);
      
    // Fetch active products
    const { data: products } = await supabase
      .from('products')
      .select('id, created_at')
      .neq('status', 'sold')
      .limit(5000);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.souqbaghdad.store/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    if (ads) {
      ads.forEach(ad => {
        if (!ad.created_at) return;
        xml += `
  <url>
    <loc>https://www.souqbaghdad.store/ad/${ad.id}</loc>
    <lastmod>${new Date(ad.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    }

    if (products) {
      products.forEach(product => {
        if (!product.created_at) return;
        xml += `
  <url>
    <loc>https://www.souqbaghdad.store/product/${product.id}</loc>
    <lastmod>${new Date(product.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    }

    xml += `\n</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate'); // Cache for 12 hours
    res.status(200).send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating sitemap');
  }
}
