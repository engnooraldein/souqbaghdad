export const formatPrice = (p: string | number) => {
  const n = typeof p === 'string' ? parseInt(p.replace(/,/g,'')) : p;
  return isNaN(n) ? String(p) : n.toLocaleString('en-US');
};
