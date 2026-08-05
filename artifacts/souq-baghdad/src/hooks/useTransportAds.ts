import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/format';

export function useTransportAds() {
  const [allTransportAds, setAllTransportAds] = useState<any[]>([]);
  const [loadingTransport, setLoadingTransport] = useState(false);
  const [hasMoreTransport, setHasMoreTransport] = useState(true);
  const [totalTransportCount, setTotalTransportCount] = useState(0);
  const transportPageRef = useRef(0);

  const fetchTransportAds = useCallback(async (reset = true) => {
    setLoadingTransport(true);
    try {
      const pageToFetch = reset ? 0 : transportPageRef.current + 1;
      const pageSize = 10;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      const { data: transportData, error: transportError, count } = await supabase
        .from('ads')
        .select('*', { count: 'exact' })
        .eq('category', 'transport')
        .eq('is_demo', false)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (!transportError && transportData) {
        const transportMapped = transportData.map((row: any) => {
          let extra = {
            shift: 'صباحي',
            seats: 4,
            vehicleType: 'خصوصي',
            targetAudience: 'مختلط',
            categoryType: 'student' as 'student' | 'employee' | 'emergency',
            note: '',
            interest: 0,
            whatsappClicks: 0,
            completedAt: undefined,
            completion_reason: null
          };
          try {
            if (row.description) {
              const parsed = JSON.parse(row.description);
              extra = { ...extra, ...parsed };
            }
          } catch (e) {
            extra.note = row.description || '';
          }
          return {
            id: row.id,
            type: row.type || 'offer',
            categoryType: extra.categoryType || 'student',
            university: row.city || '',
            regions: row.location || '',
            shift: extra.shift,
            seats: Number(extra.seats) || 0,
            vehicleType: extra.vehicleType,
            targetAudience: extra.targetAudience,
            price: row.price ? formatPrice(row.price) : '',
            phone: row.phone || '',
            note: extra.note,
            sellerName: row.seller_name || 'مستخدم',
            sellerAvatar: row.seller_avatar || '',
            createdAt: row.created_at,
            status: row.status === 'active' ? 'published' : row.status,
            postedBy: row.seller_id,
            views: row.views || 0,
            interest: extra.interest,
            whatsappClicks: extra.whatsappClicks,
            completedAt: extra.completedAt,
            completion_reason: extra.completion_reason,
            short_id: row.short_id || undefined,
          };
        });

        if (reset) {
          setAllTransportAds(transportMapped);
        } else {
          setAllTransportAds(prev => {
            const combined = [...prev, ...transportMapped];
            return combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          });
        }
        transportPageRef.current = pageToFetch;
        if (count !== null) {
          setTotalTransportCount(count);
        }
        setHasMoreTransport(transportData.length === pageSize);
      }
    } catch (e) {
      console.error('Error fetching transport ads:', e);
    } finally {
      setLoadingTransport(false);
    }
  }, []);

  return {
    allTransportAds, setAllTransportAds,
    loadingTransport, setLoadingTransport,
    hasMoreTransport, totalTransportCount,
    fetchTransportAds
  };
}
