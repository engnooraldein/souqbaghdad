export function getAdTimestamp(a: any): number {
  if (!a) return 0;
  if (a.createdAtISO) {
    const t = new Date(a.createdAtISO).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (a.created_at) {
    if (typeof a.created_at === 'number' && !isNaN(a.created_at) && a.created_at > 0) {
      return a.created_at > 1e11 ? a.created_at : a.created_at * 1000;
    }
    const t = new Date(a.created_at).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (a.createdAt) {
    if (typeof a.createdAt === 'number' && !isNaN(a.createdAt) && a.createdAt > 0) {
      return a.createdAt > 1e11 ? a.createdAt : a.createdAt * 1000;
    }
    if (typeof a.createdAt === 'string') {
      const t = new Date(a.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }
  if (a.timestamp) {
    if (typeof a.timestamp === 'number' && !isNaN(a.timestamp) && a.timestamp > 0) {
      return a.timestamp > 1e11 ? a.timestamp : a.timestamp * 1000;
    }
    const t = new Date(a.timestamp).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (typeof a.id === 'number' && a.id > 1000000000) {
    return a.id;
  }
  if (typeof a.id === 'string' && /^\d{10,13}$/.test(a.id)) {
    const num = Number(a.id);
    if (!isNaN(num) && num > 1000000000) return num;
  }
  return 0;
}