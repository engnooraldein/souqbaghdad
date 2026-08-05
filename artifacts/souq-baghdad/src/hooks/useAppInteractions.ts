export function handleUniversalShare(details: {
  title?: string;
  university?: string;
  type?: string;
  location?: string;
  governorate?: string;
  regions?: string;
  id?: any;
  short_id?: string;
  price?: string;
  image?: string;
  images?: string[];
  url?: string;
  description?: string;
  views?: number;
  createdAt?: string;
  isVerified?: boolean;
}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-share-modal', { detail: details }));
  }
}
