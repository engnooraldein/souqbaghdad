import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

export interface IAPPackage {
  id: string;
  title: string;
  price: string;
  points: number;
}

const FALLBACK_PACKAGES: IAPPackage[] = [
  { id: 'points_100', title: '100 نقطة', price: '2,500 د.ع', points: 100 },
  { id: 'points_200', title: '200 نقطة', price: '5,000 د.ع', points: 200 },
  { id: 'points_300', title: '300 نقطة', price: '7,500 د.ع', points: 300 },
  { id: 'points_400', title: '400 نقطة', price: '10,000 د.ع', points: 400 },
];

export const useIAP = (userId?: string) => {
  const [packages, setPackages] = useState<IAPPackage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // المتجر يكون متاحاً عبر cordova-plugin-purchase في كائن النافذة
    const store = (window as any).CdvPurchase?.store || (window as any).store;

    if (!store) {
      console.warn("IAP Store plugin not found (might be missing in web, normal in dev). Fallback to mock packages.");
      setPackages(FALLBACK_PACKAGES);
      setIsReady(true);
      return;
    }

    // تسجيل الباقات للمتجر المباشر
    store.register([
      { id: 'points_100', type: store.CONSUMABLE, platform: store.GOOGLE_PLAY },
      { id: 'points_200', type: store.CONSUMABLE, platform: store.GOOGLE_PLAY },
      { id: 'points_300', type: store.CONSUMABLE, platform: store.GOOGLE_PLAY },
      { id: 'points_400', type: store.CONSUMABLE, platform: store.GOOGLE_PLAY },
    ]);

    // متابعة عمليات الشراء عند الموافقة عليها
    store.when().approved((transaction: any) => {
      transaction.verify();
    });

    // عند الانتهاء والتحقق من الشراء يتم شحن الحساب
    store.when().verified(async (receipt: any) => {
      const productId = receipt.products[0].id;
      const pack = FALLBACK_PACKAGES.find(p => p.id === productId);

      if (pack && userId) {
        // جلب الرصيد الحالي
        const { data: currentProfile } = await supabase.from('profiles').select('points').eq('id', userId).single();
        if (currentProfile) {
           await supabase.from('profiles').update({ points: (currentProfile.points || 0) + pack.points }).eq('id', userId);
           alert(`تم شحن ${pack.points} نقطة لحسابك بنجاح!`);
        }
      }
      receipt.finish();
      setIsLoading(false);
    });

    store.when().cancelled(() => {
      setIsLoading(false);
    });

    // تهيئة المنتجات الجاهزة من جوجل
    store.ready(() => {
      const loadedPackages = FALLBACK_PACKAGES.map(pkg => {
        const product = store.get(pkg.id);
        return {
          ...pkg,
          price: product?.pricing?.price || pkg.price,
          title: product?.title || pkg.title
        };
      });
      setPackages(loadedPackages);
      setIsReady(true);
    });

    store.initialize([store.GOOGLE_PLAY]);
    
  }, [userId]);

  const purchasePackage = async (packId: string) => {
    if (!Capacitor.isNativePlatform()) return false;
    
    setIsLoading(true);
    const store = (window as any).CdvPurchase?.store || (window as any).store;
    
    if (store) {
      const product = store.get(packId);
      if (product) {
        store.order(product);
        // الشراء هنا غير متزامن ويتم عبر الـ Listeners 
        // سنرجع true لكي نعطي واجهة المستخدم انطباع ببدء العملية
        return true; 
      }
    }
    setIsLoading(false);
    return false;
  };

  return {
    packages,
    isReady,
    isLoading,
    purchasePackage
  };
};
