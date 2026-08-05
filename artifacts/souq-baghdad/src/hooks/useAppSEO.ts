import { useMemo } from 'react';
import { Ad, Product } from '../types';
import { formatPrice } from '../utils/format';

interface UseAppSEOProps {
  selectedAd: Ad | null;
  selectedProduct: Product | null;
  view: string;
  selectedSellerId: string | null;
  selectedSellerPhone: string | null;
}

export function useAppSEO({
  selectedAd,
  selectedProduct,
  view,
  selectedSellerId,
  selectedSellerPhone
}: UseAppSEOProps) {
  return useMemo(() => {
    let pageTitle = "سوق بغداد الرقمي - السوق الرقمي العراقي | أكبر منصة إعلانات في العراق";
    let pageDescription = "سوق بغداد الرقمي - أكبر منصة عراقية للبيع والشراء والإعلانات. سيارات، عقارات، هواتف، إلكترونيات، خدمات والمزيد. اكتشف آلاف الإعلانات في أقسام متعددة.";
    let pageImage = "https://www.souqbaghdad.store/logo.jpg";
    let canonicalUrl = "https://www.souqbaghdad.store/";

    const slugify = (text: string) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
        .replace(/--+/g, '-');
    };

    if (selectedAd) {
      const typeText = selectedAd.type === 'buy' ? 'شراء' : selectedAd.type === 'rent' ? 'ايجار' : selectedAd.type === 'service' ? 'خدمات' : 'بيع';
      const categoryText = selectedAd.category || 'عام';
      const titleText = selectedAd.title || 'اعلان';
      const govText = selectedAd.governorate || selectedAd.location || 'العراق';
      const slug = `${slugify(typeText)}-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;

      pageTitle = `${selectedAd.title} - ${govText} | ${formatPrice(selectedAd.price)} د.ع - سوق بغداد`;
      pageDescription = `${selectedAd.description ? selectedAd.description.slice(0, 150) + '...' : 'تفاصيل الإعلان'} | سوق بغداد - أكبر منصة عراقية للبيع والشراء والإعلانات. سيارات، عقارات، هواتف، إلكترونيات، خدمات والمزيد.`;
      pageImage = selectedAd.images?.[0] || pageImage;
      canonicalUrl = `https://souqbaghdad.store/ad/${slug}-${selectedAd.short_id || selectedAd.id}`;
    } else if (selectedProduct) {
      const categoryText = selectedProduct.category || 'منتجات';
      const titleText = selectedProduct.title || 'منتج';
      const govText = selectedProduct.governorate || 'العراق';
      const slug = `تسوق-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;

      pageTitle = `${selectedProduct.title} - ${govText} | ${formatPrice(selectedProduct.price)} د.ع - سوق بغداد`;
      pageDescription = `${selectedProduct.description ? selectedProduct.description.slice(0, 150) + '...' : 'تفاصيل المنتج'} | سوق بغداد - أكبر منصة عراقية للبيع والشراء والإعلانات. سيارات، عقارات، هواتف، إلكترونيات، خدمات والمزيد.`;
      pageImage = selectedProduct.images?.[0] || pageImage;
      canonicalUrl = `https://souqbaghdad.store/product/${slug}-${selectedProduct.short_id || selectedProduct.id}`;
    } else if (view === 'seller' && selectedSellerId) {
      pageTitle = `صفحة البائع | سوق بغداد`;
      pageDescription = `تصفح كافة الإعلانات والمنتجات المتوفرة لدى هذا المعلن في منصة سوق بغداد.`;
      canonicalUrl = `https://souqbaghdad.store/seller/${selectedSellerPhone || selectedSellerId}`;
    } else if (view === 'transport') {
      pageTitle = `خطوط النقل والتوصيل | سوق بغداد`;
      pageDescription = `تصفح خطوط النقل والتوصيل المتاحة في العراق - سوق بغداد`;
      canonicalUrl = `https://souqbaghdad.store/transport`;
    }

    return { pageTitle, pageDescription, pageImage, canonicalUrl };
  }, [selectedAd, selectedProduct, view, selectedSellerId, selectedSellerPhone]);
}
