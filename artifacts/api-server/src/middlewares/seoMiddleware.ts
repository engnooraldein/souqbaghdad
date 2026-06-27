import type { Request, Response, NextFunction } from "express";

const BOT_USER_AGENTS = [
  "googlebot",
  "bingbot",
  "yandexbot",
  "duckduckbot",
  "slurp",
  "baiduspider",
  "facebookexternalhit",
  "twitterbot",
  "rogerbot",
  "linkedinbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "pinterest/0.",
  "developers.google.com/+/web/snippet",
  "slackbot",
  "vkShare",
  "w3c_validator",
  "redditbot",
  "applebot",
  "whatsapp",
  "flipboard",
  "tumblr",
  "bitlybot",
  "skypeuripreview",
  "nuzzel",
  "discordbot",
  "google page speed",
  "qwantify",
  "pinterestbot",
  "telegrambot",
];

export function isBot(userAgent?: string): boolean {
  if (!userAgent) return false;
  const lowerUA = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lowerUA.includes(bot));
}

export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"];
  
  // Only intercept for web crawlers / social bots on product or ad pages
  if (isBot(ua) && (req.path.startsWith("/ad/") || req.path.startsWith("/product/"))) {
    const parts = req.path.split("/").filter(Boolean);
    const type = parts[0]; // "ad" or "product"
    const id = parts[1] || "0";
    
    const title = type === "ad" ? `إعلان رقم #${id} - سوق بغداد` : `منتج رقم #${id} - سوق بغداد`;
    const description = "تصفح أفضل الإعلانات والمنتجات في العراق عبر منصة سوق بغداد الرقمية. تواصل مباشر بين البائع والمشتري بدون عمولات.";
    const imageUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3b809b?w=900&q=60";
    const canonicalUrl = `https://souqbaghdad.store${req.path}`;

    const schemaJson = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": title,
      "image": [imageUrl],
      "description": description,
      "brand": {
        "@type": "Brand",
        "name": "سوق بغداد"
      },
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "priceCurrency": "IQD",
        "price": "1000",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- OpenGraph Meta Tags -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="سوق بغداد">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Product Schema JSON-LD -->
  <script type="application/ld+json">
    ${JSON.stringify(schemaJson)}
  </script>
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${imageUrl}" alt="${title}">
</body>
</html>`;

    res.header("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
    return;
  }

  next();
}
