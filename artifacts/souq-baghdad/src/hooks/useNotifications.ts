import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';

export function useNotifications(user: any, unreadChatCount: number, playSound: (sound: 'ding' | 'pop' | 'admin' | 'error') => void) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const prevNotifsLength = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data: userNotifs, error: userNotifsError } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      let combined: any[] = [];
      if (!userNotifsError && userNotifs) {
        userNotifs.forEach((row: any) => {
          if (row.type === 'view' || row.type === 'interest' || (row.title && row.title.includes('مشاهدة'))) {
            return;
          }
          
          combined.push({
            id: row.id,
            type: row.type || 'system',
            title: row.title,
            message: row.body,
            time: row.created_at,
            senderId: '',
            senderName: 'إدارة الموقع',
            senderPhone: '',
            itemTitle: '',
            itemType: 'ad',
            itemId: row.item_id || '',
            duration: 0,
            targetType: 'owner',
            sourceTable: 'user_notifications'
          });
        });
      }
      
      combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(combined);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [user]);

  // Polling Effect
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
    const isDataSaver = localStorage.getItem('data_saver_mode') === 'true';
    const pollIntervalTime = isDataSaver ? 300000 : 90000; // 5 mins vs 90s

    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, pollIntervalTime);
    return () => clearInterval(pollInterval);
  }, [user, fetchNotifications]);

  // Sound & Local Notification Effect
  useEffect(() => {
    if (notifications.length > prevNotifsLength.current) {
      if (prevNotifsLength.current > 0) {
        const hasNewIncoming = notifications.some(n => n.targetType === 'owner' || !n.targetType);
        if (hasNewIncoming) {
          playSound('admin');
          if (Capacitor.isNativePlatform()) {
            const newest = notifications[0];
            LocalNotifications.schedule({
              notifications: [
                {
                  title: newest?.title || 'سوق بغداد',
                  body: newest?.message || 'لديك إشعار جديد!',
                  id: new Date().getTime(),
                  sound: 'default',
                  channelId: 'souq_baghdad_high_importance'
                }
              ]
            }).catch(console.warn);
          }
        }
      }
    }
    prevNotifsLength.current = notifications.length;
  }, [notifications, playSound]);

  // App Icon Badge Effect
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
      } catch (e) {}
    }
  }, [notifications, unreadChatCount]);

  const handleDeleteNotification = async (notifId: string, sourceTable?: string) => {
    try {
      if (sourceTable === 'user_notifications') {
        await supabase.from('user_notifications').delete().eq('id', notifId);
        setNotifications(prev => prev.filter(n => n.id !== notifId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      if (user) {
        await supabase.from('user_notifications').delete().eq('user_id', user.id);
      }
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    notifications,
    setNotifications,
    fetchNotifications,
    handleDeleteNotification,
    handleClearAllNotifications
  };
}
