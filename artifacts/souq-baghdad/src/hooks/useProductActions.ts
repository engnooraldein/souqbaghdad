import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProductActions({
  user,
  setUser,
  adCosts,
  checkPostRateLimit,
  showToast,
  playSound,
  fetchProducts,
  setAllProducts,
  editingProduct,
  setEditingProduct,
  setCongratulationsItem
}: {
  user: any;
  setUser: any;
  adCosts: any;
  checkPostRateLimit: () => boolean;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'delete') => void;
  playSound: (sound: 'ding'|'pop'|'admin'|'error'|'success') => void;
  fetchProducts: () => void;
  setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  setCongratulationsItem: (item: { title: string; type: 'ad' | 'product' } | null) => void;
}) {

  const handleAddOrEditProduct = async (p: Product) => {
    if (!editingProduct) {
      if (!checkPostRateLimit()) return;
    }
    const rowData = {
      seller_id: user?.id || '',
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      governorate: p.governorate,
      phone: p.phone,
      images: p.images,
      condition: p.condition,
      stock: p.stock,
      is_vip: p.is_vip || false,
      vip_days: p.vip_days || 30,
      seller_name: user?.name,
      seller_avatar: user?.avatar,
    };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(rowData).eq('id', p.id);
      if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
      setEditingProduct(null);
      showToast('تم تعديل المنتج ✅', 'success');
    } else {
      let cost = adCosts?.product !== undefined ? adCosts.product : 1;
      if (p.is_vip) {
        cost += Math.ceil(((adCosts?.vip_ad !== undefined ? adCosts.vip_ad : 30) / 30) * (p.vip_days || 30));
      }
      if (user?.role !== 'admin' && user?.role !== 'owner' && cost > 0) {
        const { data: deductData, error: deductError } = await supabase.rpc('deduct_points', {
          p_user_id: user?.id,
          p_amount: cost,
          p_reason: 'خصم لنشر منتج'
        });
        
        if (deductError || !deductData?.success) {
          showToast(deductData?.message || 'رصيد النقاط غير كافٍ لنشر منتج. يرجى شحن المحفظة.', 'error');
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

      const { error } = await supabase.from('products').insert(rowData);
      if (error) { showToast('حدث خطأ أثناء النشر', 'error'); console.error(error); return; }
      showToast('تم نشر المنتج في متجرك! 🛍️', 'success');
    }
    fetchProducts();
  };

  const handleMarkProductSold = async (p: Product) => {
    if (!window.confirm('هل تريد وضع علامة "تم البيع" على هذا المنتج؟ سيختفي من المعرض العام ويُحفظ في الأرشيف.')) return;
    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', p.id);
    if (error) {
      showToast('حدث خطأ أثناء تحديث الحالة', 'error');
      console.error(error);
      return;
    }
    setAllProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, status: 'sold' } : pr));
    playSound('success');
    setCongratulationsItem({ title: p.title, type: 'product' });
    fetchProducts();
  };

  const handleDeleteProduct = async (id: number) => {
    await supabase.from('products').delete().eq('id', id);
    setAllProducts(prev => prev.filter(pr => pr.id !== id));
    showToast('تم حذف المنتج', 'delete');
  };

  return {
    handleAddOrEditProduct,
    handleMarkProductSold,
    handleDeleteProduct
  };
}
