import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Ad } from '../types';
import { formatPrice } from '../utils/format';

interface UseAdsOptions {
  pageSize?: number;
}

export function useAds({ pageSize = 4 }: UseAdsOptions = {}) {
  // General Ads State
  const [ads, setAds] = useState<Ad[]>([]);
  const [totalAdsCount, setTotalAdsCount] = useState(0);
  const [adsPage, setAdsPage] = useState(0);
  const [hasMoreAds, setHasMoreAds] = useState(true);
  const [loadingAds, setLoadingAds] = useState(false);
  const [loadingMoreAds, setLoadingMoreAds] = useState(false);

  // Transport Ads State
  const [transportAds, setTransportAds] = useState<any[]>([]);
  const [transportPage, setTransportPage] = useState(0);
  const [hasMoreTransport, setHasMoreTransport] = useState(true);
  const [loadingTransport, setLoadingTransport] = useState(false);
  const [loadingMoreTransport, setLoadingMoreTransport] = useState(false);

  // Fetch Normal Ads
  const fetchAds = useCallback(async (
    filters: { search?: string; cat?: string; gov?: string; sort?: string; priceMin?: string; priceMax?: string },
    reset = true
  ) => {
    if (reset) {
      setLoadingAds(true);
      setAdsPage(0);
    } else {
      setLoadingMoreAds(true);
    }

    try {
      const pageToFetch = reset ? 0 : adsPage + 1;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('ads')
        .select('*', { count: 'exact' })
        .eq('is_demo', false)
        .neq('category', 'transport')
        .neq('category', 'notification')
        .neq('status', 'sold');

      if (filters.cat && filters.cat !== 'all') query = query.eq('category', filters.cat);
      if (filters.gov && filters.gov !== 'الكل') query = query.eq('city', filters.gov);
      if (filters.search) {
        const term = `%${filters.search}%`;
        query = query.or(`title.ilike.${term},location.ilike.${term},short_id.ilike.${term}`);
      }
      if (filters.priceMin) {
        const minVal = parseInt(filters.priceMin.replace(/,/g, ''));
        if (!isNaN(minVal)) query = query.gte('price', minVal);
      }
      if (filters.priceMax) {
        const maxVal = parseInt(filters.priceMax.replace(/,/g, ''));
        if (!isNaN(maxVal)) query = query.lte('price', maxVal);
      }

      if (filters.sort === 'views') query = query.order('views', { ascending: false });
      else if (filters.sort === 'price-low') query = query.order('price', { ascending: true });
      else if (filters.sort === 'price-high') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      if (count !== null) setTotalAdsCount(count);

      if (data) {
        const mappedAds: Ad[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          price: row.price,
          governorate: row.city || '',
          location: row.location || '',
          phone: row.phone || '',
          category: row.category,
          images: row.images || [],
          seller: {
            name: row.seller_name || 'مستخدم',
            avatar: row.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
            isVerified: false,
            rating: row.seller_rating || 4.8,
            joinedDate: row.created_at,
            location: row.city || '',
          },
          time: '',
          createdAtISO: row.created_at,
          views: row.views || 0,
          status: row.status,
          type: row.type || 'sell',
          description: row.description || '',
          adCount: 0,
          soldCount: 0,
          responseRate: 100,
          avgResponseTime: 'دقائق',
          postedBy: row.seller_id,
          short_id: row.short_id,
        }));

        if (reset) {
          setAds(mappedAds);
        } else {
          setAds(prev => {
            const combined = [...prev, ...mappedAds];
            return combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          });
        }
        
        setAdsPage(pageToFetch);
        setHasMoreAds(data.length === pageSize);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoadingAds(false);
      setLoadingMoreAds(false);
    }
  }, [adsPage, pageSize]);

  // Fetch Transport Ads WITH PAGINATION (Fixes unbounded query egress)
  const fetchTransportAds = useCallback(async (reset = true) => {
    if (reset) {
      setLoadingTransport(true);
      setTransportPage(0);
    } else {
      setLoadingMoreTransport(true);
    }

    try {
      const pageToFetch = reset ? 0 : transportPage + 1;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('category', 'transport')
        .eq('is_demo', false)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      if (data) {
        const mappedTransport = data.map((row: any) => {
          let extra = {
            shift: 'صباحي', seats: 4, vehicleType: 'خصوصي', targetAudience: 'مختلط',
            categoryType: 'student' as 'student' | 'employee', note: '', interest: 0,
            whatsappClicks: 0, completedAt: undefined, completion_reason: null
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
          setTransportAds(mappedTransport);
        } else {
          setTransportAds(prev => {
            const combined = [...prev, ...mappedTransport];
            return combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          });
        }
        
        setTransportPage(pageToFetch);
        setHasMoreTransport(data.length === pageSize);
      }
    } catch (e) {
      console.error('Error fetching transport ads:', e);
    } finally {
      setLoadingTransport(false);
      setLoadingMoreTransport(false);
    }
  }, [transportPage, pageSize]);

  return {
    // Normal Ads
    ads,
    totalAdsCount,
    loadingAds,
    loadingMoreAds,
    hasMoreAds,
    fetchAds,
    
    // Transport Ads
    transportAds,
    loadingTransport,
    loadingMoreTransport,
    hasMoreTransport,
    fetchTransportAds
  };
}
