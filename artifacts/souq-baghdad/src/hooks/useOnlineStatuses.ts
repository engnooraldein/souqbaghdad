import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let globalOnlineStatuses: Record<string, boolean> = {};
let onlineListeners: Array<() => void> = [];

export const useOnlineStatuses = () => {
  const [statuses, setStatuses] = useState(globalOnlineStatuses);
  useEffect(() => {
    const trigger = () => setStatuses({...globalOnlineStatuses});
    onlineListeners.push(trigger);
    fetchGlobalOnlineStatuses();
    const interval = setInterval(fetchGlobalOnlineStatuses, 15000);
    return () => { 
      onlineListeners = onlineListeners.filter(l => l !== trigger); 
      clearInterval(interval);
    };
  }, []);
  return statuses;
}

const fetchGlobalOnlineStatuses = async () => {
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
      onlineListeners.forEach(l => l());
    }
  } catch(e) {}
};
