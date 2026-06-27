import { Router, type IRouter } from "express";

const sitemapRouter: IRouter = Router();

sitemapRouter.get("/sitemap.xml", (_req, res) => {
  const baseUrl = "https://souqbaghdad.store";
  const now = new Date().toISOString();

  const staticPages = [
    "",
    "/all",
    "/transportation",
    "/profile",
    "/category/phones",
    "/category/cars",
    "/category/real-estate",
    "/category/electronics",
    "/category/jobs",
    "/category/furniture",
    "/category/bikes",
    "/category/services",
    "/category/games",
  ];

  const urls = staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

export default sitemapRouter;
