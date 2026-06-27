/**
 * Utility functions for generating clean, SEO-friendly Arabic URL slugs.
 */

export function slugify(text: string): string {
  if (!text) return 'item';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\u0600-\u06FF\-]+/g, '') // Remove non-word chars (preserving Arabic range 0600-06FF)
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function generateAdUrl(category: string, title: string, id: string | number): string {
  const cleanCategory = category ? slugify(category) : 'all';
  const cleanTitle = slugify(title) || 'ad';
  return `/ad/${id}/${cleanCategory}/${cleanTitle}`;
}

export function generateProductUrl(category: string, title: string, id: string | number): string {
  const cleanCategory = category ? slugify(category) : 'all';
  const cleanTitle = slugify(title) || 'product';
  return `/product/${id}/${cleanCategory}/${cleanTitle}`;
}

export function extractIdFromPath(path: string): { type: 'ad' | 'product' | 'seller' | null; id: string | number | null } {
  const adMatch = path.match(/\/ad\/([^\/]+)/);
  if (adMatch) return { type: 'ad', id: adMatch[1] };

  const productMatch = path.match(/\/product\/([^\/]+)/);
  if (productMatch) return { type: 'product', id: productMatch[1] };

  const sellerMatch = path.match(/\/seller\/([^\/]+)/);
  if (sellerMatch) return { type: 'seller', id: sellerMatch[1] };

  return { type: null, id: null };
}
