import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';

export const useAppGlobalState = ({
  user,
  setView,
  setCat,
  setBottomNavActive,
  setSearch,
  setGov,
  setSort,
  fetchAds,
  fetchProducts,
  fetchTransportAds,
  playNotificationSound,
  unreadChatCount,
  notifications,
  setNotifications,
  allAds,
  allProducts,
  allTransportAds,
  setSelectedAd,
  setSelectedProduct,
  setSelectedTransportAd,
  setShareModalData,
  showToast
}: any) => {
  
  // 1. Share Modal Listener
  useEffect(() => {
    const handleOpenShare = (e: any) => {
      const d = e.detail || {};
      const itemTitle = d.title || (d.university ? `${d.type === 'offer' ? 'خط متوفر' : 'طلب خط'} - ${d.university}` : 'إعلان في سوق بغداد');
      const itemLoc = d.location || d.governorate || d.regions || 'العراق';
      const itemImg = d.image || (Array.isArray(d.images) && d.images[0] ? d.images[0] : undefined);
      const itemUrl = d.url || (typeof window !== 'undefined' ? window.location.href : 'https://www.souqbaghdad.store');
      setShareModalData({
        isOpen: true,
        title: itemTitle,
        url: itemUrl,
        image: itemImg,
        price: d.price ? String(d.price) : undefined,
        governorate: itemLoc,
        short_id: d.short_id || (d.id ? String(d.id).substring(0, 5) : undefined),
        description: d.description || d.details || '',
        category: d.category || 'general',
        views: d.views,
        createdAt: d.createdAt,
        isVerified: d.isVerified,
        images: d.images,
        university: d.university,
        regions: d.regions,
        type: d.type,
      });
    };
    window.addEventListener('open-share-modal', handleOpenShare);
    return () => window.removeEventListener('open-share-modal', handleOpenShare);
  }, [setShareModalData]);

  // 2. Badge Update
  useEffect(() => {
    const unreadNotifCount = (notifications || []).filter((n: any) => !n.isRead && !n.read).length;
    const totalUnread = (unreadChatCount || 0) + unreadNotifCount;

    if (Capacitor.isNativePlatform()) {
      try {
        if (totalUnread > 0) {
          Badge.set({ count: totalUnread }).catch(() => {});
        } else {
          Badge.clear().catch(() => {});
        }
      } catch (e) {
        console.warn('Error updating native badge:', e);
      }
    }

    if (typeof window !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (totalUnread > 0) {
          (navigator as any).setAppBadge(totalUnread).catch(() => {});
        } else {
          (navigator as any).clearAppBadge().catch(() => {});
        }
      } catch (e) {}
    }
  }, [unreadChatCount, notifications]);

  // 3. Post Rate Limit
  const checkPostRateLimit = (): boolean => {
    const now = Date.now();
    let posts = [];
    try {
      posts = JSON.parse(localStorage.getItem('souq_post_timestamps') || '[]');
    } catch {
      posts = [];
    }
    posts = posts.filter((t: number) => now - t < 60000);
    if (posts.length >= 2) {
      showToast('⚠️ لقد تجاوزت الحد المسموح به. يمكنك نشر إعلانين كحد أقصى في الدقيقة الواحدة. يرجى الانتظار قليلاً.', 'error');
      return false;
    }
    posts.push(now);
    localStorage.setItem('souq_post_timestamps', JSON.stringify(posts));
    return true;
  };

  // 4. Home Refresh
  const handleHomeRefresh = useCallback(async () => {
    setView('home');
    setCat('general');
    setBottomNavActive('home');
    setSearch('');
    setGov('الكل');
    setSort('recent');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    try { playNotificationSound('pop'); } catch {}
    await Promise.all([
      fetchAds(true),
      fetchProducts(true),
      fetchTransportAds(true)
    ]);
  }, [fetchAds, fetchProducts, fetchTransportAds, playNotificationSound, setView, setCat, setBottomNavActive, setSearch, setGov, setSort]);

  // 5. History Click
  const handleHistoryClick = (itemId: string | number, itemType: string) => {
    if (itemType === 'ad') {
      const found = allAds.find((a: any) => String(a.id) === String(itemId));
      if (found) setSelectedAd(found);
    } else if (itemType === 'product') {
      const found = allProducts.find((p: any) => String(p.id) === String(itemId));
      if (found) setSelectedProduct(found);
    } else if (itemType === 'transport') {
      const found = allTransportAds.find((t: any) => String(t.id) === String(itemId));
      if (found) setSelectedTransportAd(found);
    }
  };

  // 6. Mark Notif As Read
  const markNotifAsRead = async (notifId: number | string, sourceTable: 'ads' | 'user_notifications' = 'ads', targetId?: string) => {
    try {
      if (sourceTable === 'user_notifications') {
        const { error } = await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('id', notifId);
        if (!error) {
          setNotifications((prev: any) => prev.filter((n: any) => n.id !== notifId));
          if (targetId) {
            await supabase.rpc('increment_view', { table_name: 'ads', item_id: targetId });
          }
        }
      } else {
        const { error } = await supabase
          .from('ads')
          .update({ status: 'archived' })
          .eq('id', notifId);
        if (!error) {
          setNotifications((prev: any) => prev.filter((n: any) => n.id !== notifId));
        }
      }
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  // 7. Archive All Notifs
  const handleArchiveAllNotifications = async () => {
    if (!user) return;
    try {
      await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('category', 'notification')
        .eq('seller_id', user.id)
        .eq('status', 'active');

      await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications([]);
    } catch (e) {
      console.error('Failed to archive all notifications', e);
    }
  };

  return {
    checkPostRateLimit,
    handleHomeRefresh,
    handleHistoryClick,
    markNotifAsRead,
    handleArchiveAllNotifications
  };
};
