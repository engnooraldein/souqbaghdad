import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useNotifications(user: User | null) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: userNotifs, error: userNotifsError } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      let combined: any[] = [];
      if (!userNotifsError && userNotifs) {
        userNotifs.forEach((row: any) => {
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
            itemId: '',
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Setup Supabase Realtime Subscription (Replaces the 10-second polling interval)
    const channel = supabase
      .channel('user-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch notifications on any relevant change
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  return { notifications, fetchNotifications, loading };
}
