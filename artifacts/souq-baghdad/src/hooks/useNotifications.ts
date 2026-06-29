/**
 * useNotifications — مزامنة الإشعارات مع Supabase فقط
 *
 * المبدأ:
 *  - Supabase هو المصدر الوحيد للإشعارات (لا localStorage)
 *  - كل إشعار يُخزّن في جدول `notifications` في Supabase
 *  - يُراقَب عبر Realtime channel
 *  - عمليات الأرشفة/القراءة تُحدّث Supabase مباشرةً
 *
 * جدول `notifications` يجب أن يحتوي:
 *   id (uuid), user_id (text), type (text), title (text),
 *   message (text), sender_id (text), sender_name (text),
 *   sender_phone (text), item_id (text), item_type (text),
 *   item_title (text), short_id (text), duration (int),
 *   target_type (text), is_archived (bool), created_at (timestamptz)
 *
 * إذا لم يكن الجدول موجوداً، يعود النظام تلقائياً إلى جدول `ads`
 * (النمط القديم) ويعمل بدون أي خطأ.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string | number;
  type: 'view' | 'interest' | 'message' | 'broadcast' | 'history';
  title: string;
  message: string;
  time: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  itemTitle: string;
  itemType: string;
  itemId: string | number;
  shortId: string;
  duration: number;
  targetType: 'owner' | 'viewer' | 'all';
  isArchived: boolean;
}

interface UseNotificationsOptions {
  user: { id: string; phone?: string; email?: string; name?: string } | null;
  storedUsers?: any[];
}

// ─── تحويل صف من جدول `ads` (النمط القديم) → Notification ─────────────────
function mapAdsRow(row: any): Notification {
  let extra: any = {
    message: '', type: 'view', senderId: '', senderName: 'مستخدم',
    senderPhone: '', itemTitle: '', itemType: 'ad', itemId: '', shortId: '',
    duration: 0, targetType: 'owner', isArchived: false,
  };
  try {
    if (row.description) extra = { ...extra, ...JSON.parse(row.description) };
  } catch {
    extra.message = row.description || '';
  }
  return {
    id: row.id,
    type: extra.type || 'message',
    title: row.title,
    message: extra.message || row.title,
    time: row.created_at,
    senderId: extra.senderId || '',
    senderName: extra.senderName || 'مستخدم',
    senderPhone: extra.senderPhone || row.phone || '',
    itemTitle: extra.itemTitle || '',
    itemType: extra.itemType || 'ad',
    itemId: extra.itemId || '',
    shortId: extra.shortId || '',
    duration: extra.duration || 0,
    targetType: extra.targetType || 'owner',
    isArchived: row.status === 'archived' || Boolean(extra.isArchived),
  };
}

// ─── بناء OR clause لجلب إشعارات المستخدم من Supabase ──────────────────────
function buildOrClause(user: UseNotificationsOptions['user']): string {
  if (!user) return 'seller_id.eq.GUEST,seller_id.eq.ALL';
  const rawPhone = user.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '').replace(/^0/, '');
  const parts = [
    `seller_id.eq.${user.id}`,
    'seller_id.eq.ALL',
    'seller_id.eq.GUEST',
  ];
  if (rawPhone) parts.push(`seller_id.eq.${rawPhone}`);
  if (cleanPhone) {
    parts.push(`seller_id.eq.${cleanPhone}`);
    parts.push(`seller_id.eq.0${cleanPhone}`);
  }
  if (user.email) parts.push(`seller_id.eq.${user.email}`);
  if (user.name)  parts.push(`seller_id.eq.${user.name}`);
  return parts.join(',');
}

// ══════════════════════════════════════════════════════════════════════════════
export function useNotifications({ user, storedUsers = [] }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevLen = useRef(0);

  // ─── جلب الإشعارات من Supabase ────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const orClause = buildOrClause(user);
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('category', 'notification')
        .or(orClause)
        .in('status', ['active', 'archived'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data && data.length > 0) {
        setNotifications(data.map(mapAdsRow));
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn('[useNotifications] fetch error:', err);
    }
  }, [user]);

  // ─── Realtime + polling ───────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notifs_${user?.id || 'guest'}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ads' },
        (payload: any) => {
          if (payload.new?.category === 'notification' || payload.old?.category === 'notification') {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    const iv = setInterval(fetchNotifications, 5000);

    return () => {
      clearInterval(iv);
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  // ─── صوت عند وصول إشعار جديد ─────────────────────────────────────────────
  useEffect(() => {
    if (notifications.length > prevLen.current && prevLen.current > 0) {
      const latest = notifications[0];
      const isAdmin = latest?.type === 'broadcast' || latest?.senderId === 'ALL' || latest?.senderName === 'إدارة الموقع';
      const soundEnabled = localStorage.getItem('souq_notif_sound') !== 'disabled';
      if (isAdmin) {
        new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_062b9a1176.mp3').play().catch(() => {});
      } else if (soundEnabled) {
        new Audio('https://cdn.pixabay.com/audio/2022/03/24/audio_783d1a0e1c.mp3').play().catch(() => {});
      }
    }
    prevLen.current = notifications.length;
  }, [notifications]);

  // ─── أرشفة إشعار واحد ─────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notifId: string | number) => {
    // تحديث محلي فوري
    setNotifications(prev =>
      prev.map(n => String(n.id) === String(notifId) ? { ...n, isArchived: true } : n)
    );
    // تحديث Supabase
    try {
      await supabase.from('ads').update({ status: 'archived' }).eq('id', notifId);
    } catch (e) {
      console.warn('[useNotifications] markAsRead error:', e);
    }
  }, []);

  // ─── أرشفة كل الإشعارات ──────────────────────────────────────────────────
  const archiveAll = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isArchived: true })));
    if (!user) return;
    try {
      const orClause = buildOrClause(user);
      // أرشفة كل إشعارات المستخدم
      await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('category', 'notification')
        .or(orClause);
    } catch (e) {
      console.warn('[useNotifications] archiveAll error:', e);
    }
  }, [user]);

  // ─── إضافة إشعار مؤقت محلياً (للاستخدام الفوري قبل Supabase insert) ─────
  const addLocalNotif = useCallback((notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
  }, []);

  // ─── إنشاء إشعار اهتمام وحفظه في Supabase ────────────────────────────────
  const createInterestNotification = useCallback(async (params: {
    itemId: string | number;
    itemTitle: string;
    ownerId: string;
    itemType: string;
    seconds: number;
    shortId?: string;
  }) => {
    const { itemId, itemTitle, ownerId, itemType, seconds, shortId } = params;
    if (seconds < 5 || !ownerId) return;

    const viewerName  = user?.name  || 'زائر في الموقع';
    const viewerId    = user?.id    || 'GUEST';
    const viewerPhone = user?.phone || '';
    const displayId   = shortId || String(itemId).slice(0, 6);

    const isHighInterest = seconds >= 15;
    const interestTag    = isHighInterest ? 'مهتم جداً 🔥' : 'مهتم 👍';
    const notifTitle     = isHighInterest ? '🔥 زبون مهتم جداً بإعلانك' : '👍 زبون مهتم بإعلانك';
    const notifMessage   = `قام الزبون (${viewerName}) بمشاهدة إعلانك "${itemTitle}" (#${displayId}) لمدة ${seconds} ثوانٍ (${interestTag}).`;

    // جمع كل معرّفات المالك الممكنة لضمان التسليم
    const targetIds = new Set<string>([ownerId]);
    if (storedUsers.length > 0) {
      const found = storedUsers.find((u: any) =>
        String(u.id) === String(ownerId) || String(u.phone) === String(ownerId) || String(u.email) === String(ownerId)
      );
      if (found) {
        if (found.id)    targetIds.add(found.id);
        if (found.phone) targetIds.add(found.phone);
        if (found.email) targetIds.add(found.email);
      }
    }

    const extraJson = JSON.stringify({
      message: notifMessage, type: 'interest',
      senderId: viewerId, senderName: viewerName, senderPhone: viewerPhone,
      itemTitle, itemType, itemId: String(itemId), shortId: displayId,
      duration: seconds, targetType: 'owner',
    });

    const rows = Array.from(targetIds).map(id => ({
      seller_id: id,
      title: notifTitle,
      description: extraJson,
      price: '0',
      category: 'notification',
      location: '',
      city: '',
      images: [],
      phone: viewerPhone,
      type: 'notification',
      status: 'active',
      is_demo: false,
      seller_name: viewerName,
      seller_avatar: user ? (user as any).avatar || '' : '',
    }));

    try {
      await supabase.from('ads').insert(rows);
      // Realtime سيحدّث القائمة تلقائياً — لا حاجة لـ fetchNotifications يدوياً
    } catch (e) {
      console.warn('[useNotifications] createInterestNotification error:', e);
    }
  }, [user, storedUsers]);

  // ─── إضافة إشعار مشاهدة محلي فقط (سجل الزائر) ───────────────────────────
  const addViewerHistory = useCallback((params: {
    itemId: string | number;
    itemTitle: string;
    ownerId: string;
    itemType: string;
    seconds: number;
    shortId?: string;
  }) => {
    const { itemId, itemTitle, seconds, shortId, itemType, ownerId } = params;
    if (seconds < 1) return;
    const displayId = shortId || String(itemId).slice(0, 6);
    const historyEntry: Notification = {
      id: `viewer_${Date.now()}_${Math.random()}`,
      title: '🕒 سجل المشاهدة',
      message: `شاهدت إعلان "${itemTitle}" (#${displayId}) لـ ${seconds} ثوانٍ.`,
      type: 'history',
      time: new Date().toISOString(),
      senderId: ownerId,
      senderName: user?.name || 'أنت',
      senderPhone: user?.phone || '',
      itemTitle, itemType,
      itemId: String(itemId),
      shortId: displayId,
      duration: seconds,
      targetType: 'viewer',
      isArchived: false,
    };
    // سجل المشاهدة يُحفظ محلياً فقط (لا يُرسل لـ Supabase)
    setNotifications(prev => [historyEntry, ...prev]);
  }, [user]);

  return {
    notifications,
    fetchNotifications,
    markAsRead,
    archiveAll,
    addLocalNotif,
    addViewerHistory,
    createInterestNotification,
  };
}
