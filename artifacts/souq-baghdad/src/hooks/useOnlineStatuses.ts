// ===========================================
// مسؤولية هذا الـ Hook:
// يجلب حالة الاتصال (Online/Offline) لجميع المستخدمين.
//
// آلية العمل:
// يستخدم نمط Singleton — استعلام Supabase واحد يُشارَك بين كل المكوّنات.
// Cache مدتها 3 دقائق عبر LocalStorage لتقليل استهلاك الباقة.
//
// 🔥 استهلاك Supabase:
// استعلام واحد فقط كل 3 دقائق بغض النظر عن عدد المكوّنات التي تستخدم الـ Hook.
// هذا التصميم ممتاز ويمنع استهلاك الباقة.
//
// ✅ آمن للتعديل:
// نعم. يمكن تعديل فترة الـ Cache من 180000ms (3 دقائق).
// ===========================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let globalOnlineStatuses: Record<string, boolean> = {};
let onlineListeners: Array<() => void> = [];

export const useOnlineStatuses = () => {
  const [statuses, setStatuses] = useState(globalOnlineStatuses);
  useEffect(() => {
    const trigger = () => setStatuses({...globalOnlineStatuses});
    onlineListeners.push(trigger);
    
    // Fetch only if we haven't fetched recently (e.g. within 3 minutes) or if forced
    fetchGlobalOnlineStatuses();
    
    return () => { 
      onlineListeners = onlineListeners.filter(l => l !== trigger); 
    };
  }, []);
  return statuses;
}

let isFetching = false;

// We export this so App.tsx can call it when a user publishes an ad
export const triggerOnlineStatusesSync = () => {
  fetchGlobalOnlineStatuses(true);
};

const fetchGlobalOnlineStatuses = async (force = false) => {
  const now = Date.now();
  const lastFetchStr = localStorage.getItem('last_online_sync_time');
  const lastFetchTime = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
  
  // If not forced, only sync once every 3 minutes
  if (!force && (isFetching || now - lastFetchTime < 180000)) return; 
  
  isFetching = true;
  try {
    const { data } = await supabase.from('profiles').select('id, phone, last_seen');
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach(p => {
        if(p.last_seen) {
          const isRecentlySeen = new Date().getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000;
          if (p.id) map[p.id] = isRecentlySeen;
          if (p.phone) map[p.phone] = isRecentlySeen;
        }
      });
      globalOnlineStatuses = map;
      localStorage.setItem('last_online_sync_time', Date.now().toString());
      onlineListeners.forEach(l => l());
    }
  } catch(e) {} finally {
    isFetching = false;
  }
};
