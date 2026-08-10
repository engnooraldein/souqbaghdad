import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { getNumericHash } from '../utils/helpers';
import { User } from '../types';

export function useChatPolling(user: User | null, playNotificationSound: any) {
  const [showChatModal, setShowChatModal] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [chatViewport, setChatViewport] = useState({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight });

  // Track visual viewport to handle mobile browser chrome
  useEffect(() => {
    if (!showChatModal) return;
    const update = () => {
      if (window.visualViewport) {
        setChatViewport({
          top: window.visualViewport.offsetTop,
          left: window.visualViewport.offsetLeft,
          width: window.visualViewport.width,
          height: window.visualViewport.height,
        });
      }
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [showChatModal]);

  // Handle hardware / browser back button for Chat Modal
  useEffect(() => {
    if (!showChatModal) return;
    const handlePopState = () => {
      setShowChatModal(false);
      setActiveChatId(null);
    };
    try {
      window.history.pushState({ modal: 'chat' }, '');
    } catch (_) {}
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showChatModal]);

  const activeChatIdRef = useRef(activeChatId);
  const showChatModalRef = useRef(showChatModal);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    showChatModalRef.current = showChatModal;
  }, [showChatModal]);

  // Deep Link Listener for Notifications
  useEffect(() => {
    let localSub: any;
    let pushSub: any;

    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const extra = action.notification.extra;
        if (extra && (extra.chatId || extra.chat_id)) {
          const targetChatId = extra.chatId || extra.chat_id;
          setActiveChatId(targetChatId);
          setShowChatModal(true);
          const notifId = getNumericHash(targetChatId);
          LocalNotifications.cancel({ notifications: [{ id: notifId }] }).catch(() => {});
        }
      }).then(handle => { localSub = handle; });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification.data;
        if (data && (data.chatId || data.chat_id)) {
          const targetChatId = data.chatId || data.chat_id;
          setActiveChatId(targetChatId);
          setShowChatModal(true);
          const notifId = getNumericHash(targetChatId);
          LocalNotifications.cancel({ notifications: [{ id: notifId }] }).catch(() => {});
        }
      }).then(handle => { pushSub = handle; });

      return () => {
        if (localSub) localSub.remove();
        if (pushSub) pushSub.remove();
      };
    }
  }, []);

  // Fetch unread messages count
  const fetchUnreadChatCount = useCallback(async () => {
    if (!user) {
      setUnreadChatCount(0);
      if (Capacitor.isNativePlatform()) {
        Badge.clear().catch(() => {});
      }
      return;
    }
    try {
      const currentUserIdStr = String(user.id);
      const { data: userChats } = await supabase
        .from('chats')
        .select('id')
        .or(`buyer_id.eq.${currentUserIdStr},seller_id.eq.${currentUserIdStr}`);

      if (userChats && userChats.length > 0) {
        const chatIds = userChats.map(c => c.id);
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', chatIds)
          .eq('is_read', false)
          .neq('sender_id', currentUserIdStr);

        const totalUnread = count || 0;
        setUnreadChatCount(totalUnread);

        if (Capacitor.isNativePlatform()) {
          try {
            if (totalUnread > 0) {
              await Badge.set({ count: totalUnread });
            } else {
              await Badge.clear();
            }
          } catch (e) {
            console.warn('Failed to update native app badge:', e);
          }
        }
      } else {
        setUnreadChatCount(0);
        if (Capacitor.isNativePlatform()) {
          Badge.clear().catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error fetching unread chat count:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadChatCount();
  }, [fetchUnreadChatCount]);

  // Polling for new messages
  useEffect(() => {
    if (!user) return undefined;
    const currentUserIdStr = String(user.id);
    let lastChecked = new Date().toISOString();

    const pollNewMessages = async () => {
      try {
        const { data: newMsgs } = await supabase
          .from('messages')
          .select('*, chats!inner(id, buyer_id, seller_id)')
          .gt('created_at', lastChecked)
          .neq('sender_id', currentUserIdStr)
          .eq('is_read', false)
          .or(`buyer_id.eq.${currentUserIdStr},seller_id.eq.${currentUserIdStr}`, { referencedTable: 'chats' })
          .order('created_at', { ascending: false })
          .limit(1);

        if (newMsgs && newMsgs.length > 0) {
          const newMsg = newMsgs[0];
          lastChecked = new Date().toISOString();
          
          fetchUnreadChatCount();
          const isCurrentlyInThisChat = showChatModalRef.current && String(activeChatIdRef.current) === String(newMsg.chat_id);
          
          if (!isCurrentlyInThisChat) {
            playNotificationSound('info');
            
            if (Capacitor.isNativePlatform()) {
              try {
                const isBuyer = String(newMsg.chats.buyer_id) === currentUserIdStr;
                const otherUserId = isBuyer ? newMsg.chats.seller_id : newMsg.chats.buyer_id;

                const { data: senderProfile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', otherUserId)
                  .maybeSingle();

                const senderName = senderProfile?.full_name || 'سوق بغداد';
                const notifId = getNumericHash(newMsg.chat_id);

                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: senderName,
                      body: `💬 ${newMsg.content}`,
                      id: notifId,
                      badge: 1,
                      channelId: 'souq_baghdad_high_importance',
                      schedule: { at: new Date(Date.now() + 100) },
                      sound: 'res://platform_default',
                      actionTypeId: '',
                      extra: { chatId: newMsg.chat_id, type: 'chat' }
                    } as any
                  ]
                });
              } catch (err) {
                console.warn('Failed to trigger LocalNotification:', err);
              }
            }
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    const isDataSaver = localStorage.getItem('data_saver_mode') === 'true';
    const pollIntervalTime = isDataSaver ? 120000 : 30000; // 2 mins vs 30s

    const interval = setInterval(pollNewMessages, pollIntervalTime);
    return () => clearInterval(interval);
  }, [user, playNotificationSound, fetchUnreadChatCount]);

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setActiveChatId(e.detail?.chatId || null);
      setShowChatModal(true);
    };
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  return {
    showChatModal,
    setShowChatModal,
    activeChatId,
    setActiveChatId,
    unreadChatCount,
    setUnreadChatCount,
    chatViewport
  };
}
