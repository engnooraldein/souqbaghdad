import { supabase } from '../lib/supabase';

export function useTransportActions({
  user,
  setUser,
  adCosts,
  checkPostRateLimit,
  showToast,
  fetchTransportAds,
  allTransportAds
}: {
  user: any;
  setUser: any;
  adCosts: any;
  checkPostRateLimit: () => boolean;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'delete') => void;
  fetchTransportAds: () => void;
  allTransportAds: any[];
}) {

  const handlePostTransportAd = async (ad: any) => {
    if (!checkPostRateLimit()) return;
    const rowData = {
      seller_id: user?.id || ad.postedBy || '',
      title: ad.type === 'offer' ? `أوفر خط إلى ${ad.university}` : `أبحث عن خط إلى ${ad.university}`,
      description: JSON.stringify({
        shift: ad.shift,
        seats: ad.seats,
        vehicleType: ad.vehicleType,
        targetAudience: ad.targetAudience,
        categoryType: ad.categoryType || 'student',
        note: ad.note,
        interest: ad.interest || 0,
        whatsappClicks: ad.whatsappClicks || 0,
        completedAt: ad.completedAt,
        completion_reason: ad.completion_reason
      }),
      price: ad.price ? ad.price.replace(/[^0-9]/g, '') : '0',
      category: 'transport',
      location: ad.regions,
      city: ad.university,
      images: [],
      phone: ad.phone,
      type: ad.type,
      status: ad.status === 'published' ? 'active' : ad.status,
      is_demo: false,
      seller_name: ad.sellerName || user?.name || 'مستخدم',
      seller_avatar: ad.sellerAvatar || user?.avatar || '',
      short_id: ad.short_id || Math.random().toString(36).substring(2, 7).toUpperCase(),
    };

    const cost = adCosts?.transport !== undefined ? adCosts.transport : 1;
    if (user?.role !== 'admin' && user?.role !== 'owner' && cost > 0) {
      const { data: deductData, error: deductError } = await supabase.rpc('deduct_points', {
        p_user_id: user?.id,
        p_amount: cost,
        p_reason: 'خصم لنشر خط نقل'
      });
      
      if (deductError || !deductData?.success) {
        showToast(deductData?.message || 'رصيد النقاط غير كافٍ. يرجى شحن المحفظة.', 'error');
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
    
    console.log("INSERTING INTO ADS:", rowData);
    const { error } = await supabase.from('ads').insert(rowData);
    if (error) {
      if (error.message?.includes('row-level security') || error.code === '42501') {
        showToast('انتهت جلسة الدخول لأسباب أمنية. يرجى تسجيل الدخول مجدداً لمتابعة النشر.', 'error');
        localStorage.removeItem('souqUser');
        if (setUser) setUser(null);
      } else {
        showToast('خطأ: ' + (error.message || 'حدث خطأ أثناء حفظ الخط'), 'error');
      }
      console.error(error);
      return;
    }
    
    const isDataSaver = true; // localStorage.getItem('data_saver_mode') === 'true'; // Forced ON by Owner
    if (!isDataSaver) {
      try {
        const { data: alerts, error: alertError } = await supabase
          .from('subscription_alerts')
          .select('*');
          
        if (!alertError && alerts && alerts.length > 0) {
          const matches = alerts.filter(alert => {
            if (alert.user_id === rowData.seller_id) return false;
            
            const alertCat = alert.category_type;
            const adCat = ad.categoryType || 'student';
            if (alertCat && alertCat !== 'all' && alertCat !== adCat) return false;
            
            if (alert.university && alert.university.trim() !== '') {
              const alertUnivNorm = alert.university.trim().toLowerCase();
              const adUnivNorm = ad.university.trim().toLowerCase();
              if (!adUnivNorm.includes(alertUnivNorm) && !alertUnivNorm.includes(adUnivNorm)) {
                return false;
              }
            }
            
            if (alert.regions && alert.regions.trim() !== '') {
              const alertRegs = alert.regions.split(/[،,,\-]/).map((r: string) => r.trim().toLowerCase()).filter(Boolean);
              const adRegs = ad.regions.split(/[،,,\-]/).map((r: string) => r.trim().toLowerCase()).filter(Boolean);
              const hasOverlap = alertRegs.some((ar: string) => adRegs.some((adr: string) => adr.includes(ar) || ar.includes(adr)));
              if (!hasOverlap) return false;
            }
            
            if (alert.type && alert.type !== 'all' && alert.type !== ad.type) return false;
            
            return true;
          });

          if (matches.length > 0) {
            const notifsToInsert = matches.map(match => ({
              user_id: match.user_id,
              title: ad.categoryType === 'emergency' ? '🚗 رحلة طوارئ يومية مطابقة!' : '🔔 خط نقل جديد يطابق بحثك!',
              body: ad.categoryType === 'emergency'
                ? `تم نشر رحلة طوارئ يومية من مناطق (${ad.regions}) إلى (${ad.university}) بسعر ${ad.price || 'غير محدد'}. تواصل الآن!`
                : `تم نشر خط نقل جديد من مناطق (${ad.regions}) إلى (${ad.university}) بسعر ${ad.price || 'غير محدد'}. تواصل الآن!`,
              type: 'transport_alert',
              read: false,
              created_at: new Date().toISOString()
            }));
            
            await supabase.from('user_notifications').insert(notifsToInsert);
          }
        }
      } catch (e) {
        console.error("Error matching alert notifications:", e);
      }
    }

    showToast('تم نشر الخط بنجاح ✅', 'success');
    fetchTransportAds();
  };

  const handleUpdateTransportStatus = async (id: number, status: string, reason: string | null = null) => {
    const newStatus = status === 'published' ? 'active' : status;
    const dbStatus = newStatus;

    const { data: existingAd } = await supabase
      .from('ads')
      .select('description')
      .eq('id', id)
      .single();

    let existingDesc: any = {};
    if (existingAd && existingAd.description) {
      try { 
        existingDesc = typeof existingAd.description === 'string' 
          ? JSON.parse(existingAd.description) 
          : existingAd.description; 
      } catch(e) {}
    }

    const descriptionData = JSON.stringify({
      ...existingDesc,
      completedAt: status === 'matched' ? new Date().toISOString() : (existingDesc.completedAt || null),
      completion_reason: reason || existingDesc.completion_reason || null
    });

    const { error } = await supabase
      .from('ads')
      .update({
        status: dbStatus,
        description: descriptionData
      })
      .eq('id', id);

    if (error) {
      if (error.message?.includes('row-level security') || error.code === '42501') {
        showToast('انتهت جلسة الدخول لأسباب أمنية. يرجى تسجيل الدخول مجدداً.', 'error');
        localStorage.removeItem('souqUser');
        if (setUser) setUser(null);
      } else {
        showToast('حدث خطأ أثناء تحديث الحالة', 'error');
      }
      console.error(error);
      return;
    }
    showToast('تم تحديث حالة الخط بنجاح ✅', 'success');
    fetchTransportAds();
  };

  const handleDeleteTransportAd = async (id: number) => {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('حدث خطأ أثناء حذف الخط', 'error');
      console.error(error);
      return;
    }
    showToast('تم حذف الخط بنجاح', 'delete');
    fetchTransportAds();
  };

  return {
    handlePostTransportAd,
    handleUpdateTransportStatus,
    handleDeleteTransportAd
  };
}
