import { supabase } from '../lib/supabase';
import { Ad } from '../types';

export function useAdActions({
  user,
  setUser,
  adCosts,
  checkPostRateLimit,
  showToast,
  playSound,
  triggerOnlineStatusesSync,
  fetchAds,
  setAllAds,
  editingAd,
  setEditingAd,
  setFavorites,
  setCongratulationsItem
}: {
  user: any;
  setUser: any;
  adCosts: any;
  checkPostRateLimit: () => boolean;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'delete') => void;
  playSound: (sound: 'ding'|'pop'|'admin'|'error'|'success') => void;
  triggerOnlineStatusesSync: () => void;
  fetchAds: () => void;
  setAllAds: React.Dispatch<React.SetStateAction<Ad[]>>;
  editingAd: Ad | null;
  setEditingAd: (ad: Ad | null) => void;
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
  setCongratulationsItem: (item: { title: string; type: 'ad' | 'product' } | null) => void;
}) {

  const handleToggleFav = (id: number) => {
    setFavorites(prev => {
      const f = prev.includes(id);
      showToast(f ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة', 'success');
      const newFavs = f ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('souqFavs', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const handleAddOrEditAd = async (ad: Ad) => {
    if (!editingAd) {
      if (!checkPostRateLimit()) return;
    }
    const rowData = {
      seller_id: user?.id || '',
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category: ad.category,
      location: ad.location,
      city: ad.governorate,
      images: ad.images,
      phone: ad.phone,
      type: ad.type,
      status: 'active',
      is_demo: false,
      is_vip: ad.is_vip || false,
      vip_days: ad.vip_days || 30,
      seller_name: user?.name,
      seller_avatar: user?.avatar,
    };
    if (editingAd) {
      const { error } = await supabase.from('ads').update(rowData).eq('id', ad.id);
      if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
      setEditingAd(null);
      showToast('تم تعديل الإعلان ✅', 'success');
    } else {
      let cost = adCosts?.ad !== undefined ? adCosts.ad : 1;
      if (ad.is_vip) {
        cost += Math.ceil(((adCosts?.vip_ad !== undefined ? adCosts.vip_ad : 30) / 30) * (ad.vip_days || 30));
      }
      if (user?.role !== 'admin' && user?.role !== 'owner' && cost > 0) {
        const { data: deductData, error: deductError } = await supabase.rpc('deduct_points', {
          p_user_id: user?.id,
          p_amount: cost,
          p_reason: 'خصم لنشر إعلان مبوب'
        });
        
        if (deductError || !deductData?.success) {
          showToast(deductData?.message || 'رصيد النقاط غير كافٍ لنشر إعلان. يرجى شحن المحفظة.', 'error');
          return;
        }
        
        if (user && deductData.remaining !== undefined) {
          setUser((prev: any) => {
            if (!prev) return prev;
            const u = { ...prev, points: deductData.remaining };
            localStorage.setItem('souqUser', JSON.stringify(u));
            return u;
          });
        }
      }

      const { data, error } = await supabase.from('ads').insert(rowData).select().single();
      triggerOnlineStatusesSync();
      if (error) { showToast('حدث خطأ أثناء النشر', 'error'); console.error(error); return; }
      if (user && data) {
        setUser((prev: any) => {
          if (!prev) return prev;
          const u = { ...prev, stats: { ...prev.stats, ads: prev.stats?.ads ? prev.stats.ads + 1 : 1 } };
          localStorage.setItem('souqUser', JSON.stringify(u));
          return u;
        });
      }
      showToast('تم نشر إعلانك! 🎉', 'success');
    }
    fetchAds();
  };

  const handleMarkAdSold = async (ad: Ad) => {
    if (!window.confirm('هل تريد وضع علامة "تم البيع" على هذا الإعلان؟ سيختفي من المعرض العام ويُحفظ في الأرشيف.')) return;
    const { error } = await supabase.from('ads').update({ status: 'sold' }).eq('id', ad.id);
    if (error) {
      showToast('حدث خطأ أثناء تحديث الحالة', 'error');
      console.error(error);
      return;
    }
    setAllAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'sold' } : a));
    playSound('success');
    setCongratulationsItem({ title: ad.title, type: 'ad' });
    fetchAds();
  };

  const handleDeleteAd = async (id: number) => {
    await supabase.from('ads').delete().eq('id', id);
    setAllAds(prev => prev.filter(a => a.id !== id));
    showToast('تم حذف الإعلان', 'delete');
  };

  return {
    handleToggleFav,
    handleAddOrEditAd,
    handleMarkAdSold,
    handleDeleteAd
  };
}
