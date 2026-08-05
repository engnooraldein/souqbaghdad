import { supabase } from '../lib/supabase';
import { User, Visit, StoredUser } from '../types';

export function detectDevice(): Visit['device'] {
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function recordVisit(user: User | null) {
  if (typeof window === 'undefined') return;
  const v: Visit = { 
    id: Date.now()+Math.random().toString(36).slice(2), 
    timestamp: new Date().toISOString(), 
    device: detectDevice(), 
    location: user?.location||'زائر', 
    userId: user?.id, 
    userName: user?.name, 
    page:'home' 
  };
  try { 
    const prev:Visit[] = JSON.parse(localStorage.getItem('souqVisits')||'[]'); 
    localStorage.setItem('souqVisits', JSON.stringify([v,...prev].slice(0,2000))); 
  } catch {}
}

export function saveStoredUser(user: User, adCount: number) {
  if (typeof window === 'undefined') return;
  try {
    const users: StoredUser[] = JSON.parse(localStorage.getItem('souqUsers')||'[]');
    const idx = users.findIndex(u=>u.id===user.id);
    const su: StoredUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      role: user.role,
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      rating: users[idx]?.rating ?? user.rating ?? 5,
      ratingCount: users[idx]?.ratingCount ?? 1,
      registeredAt: users[idx]?.registeredAt || new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      adCount,
      isBanned: users[idx]?.isBanned || false
    };
    if (idx>=0) users[idx]=su; else users.unshift(su);
    localStorage.setItem('souqUsers', JSON.stringify(users));
  } catch {}
}

export function isBanned(email: string) {
  if (typeof window === 'undefined') return false;
  try { return (JSON.parse(localStorage.getItem('souqUsers')||'[]') as StoredUser[]).find(u=>u.email===email)?.isBanned||false; } catch { return false; }
}

export async function recordItemView(itemId: string|number, itemType: 'ad'|'product'|'transport', currentUser: User|null, sellerId?: string) {
  try {
    if (currentUser && sellerId && currentUser.id === sellerId) {
      return;
    }

    const lastViewKey = `last_view_${itemType}_${itemId}`;
    const lastView = localStorage.getItem(lastViewKey);
    if (lastView && Date.now() - Number(lastView) < 60 * 60 * 1000) {
      return;
    }

    localStorage.setItem(lastViewKey, Date.now().toString());

    const table = itemType === 'product' ? 'products' : 'ads';
    const { error: rpcErr } = await supabase.rpc('increment_view', { table_name: table, item_id: itemId });
    
    if (rpcErr) {
      const { data: item } = await supabase.from(table).select('views').eq('id', itemId).single();
      if (item) {
        await supabase.from(table).update({ views: (item.views || 0) + 1 }).eq('id', itemId);
      }
    }
  } catch (e) {
    console.error('Failed to record view', e);
  }
}
