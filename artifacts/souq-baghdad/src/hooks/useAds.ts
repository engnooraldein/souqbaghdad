import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Ad, Product } from '../types';
import { DEFAULT_AVATAR } from './useAuth';

export const getDefaultAds = (): Ad[] => [];
export const getDefaultProducts = (): Product[] => [];

interface UseAdsProps {
  search: string;
  cat: string;
  gov: string;
  sort: string;
  priceMin: string;
  priceMax: string;
}

export function useAds({ search, cat, gov, sort, priceMin, priceMax }: UseAdsProps) {
  const [allAds, setAllAds] = useState<Ad[]>(getDefaultAds);
  const [allProducts, setAllProducts] = useState<Product[]>(getDefaultProducts);
  
  const [loadingMoreAds, setLoadingMoreAds] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  
  const [adsPage, setAdsPage] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const [hasMoreAds, setHasMoreAds] = useState(true);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [totalAdsCount, setTotalAdsCount] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  
  const isFirstLoadDone = useRef(false);

  const fetchAds = useCallback(async (reset = true) => {
    if (reset) {
      if (!isFirstLoadDone.current) {
        setIsInitialLoading(true);
      }
      setLoadingMoreAds(true);
    } else {
      setLoadingMoreAds(true);
    }
    try {
      const pageToFetch = reset ? 0 : adsPage + 1;
      const pageSize = 20;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('ads').select('*', { count: 'exact' }).eq('is_demo', false).neq('category', 'transport').neq('category', 'notification').neq('status', 'sold');

      if (cat && cat !== 'all' && cat !== 'general') {
        query = query.eq('category', cat);
      }
      if (gov && gov !== 'الكل' && cat !== 'general') {
        query = query.eq('city', gov);
      }
      if (search && cat !== 'general') {
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},location.ilike.${term},short_id.ilike.${term}`);
      }
      if (priceMin && cat !== 'general') {
        const minVal = parseInt(priceMin.replace(/,/g, ''));
        if (!isNaN(minVal)) query = query.gte('price', minVal);
      }
      if (priceMax && cat !== 'general') {
        const maxVal = parseInt(priceMax.replace(/,/g, ''));
        if (!isNaN(maxVal)) query = query.lte('price', maxVal);
      }

      if (cat === 'general') {
        query = query.order('created_at', { ascending: false });
      } else {
        if (sort === 'views') {
          query = query.order('views', { ascending: false });
        } else if (sort === 'price-low') {
          query = query.order('price', { ascending: true });
        } else if (sort === 'price-high') {
          query = query.order('price', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) { console.error('Error fetching ads:', error); return; }
      if (count !== null) setTotalAdsCount(count);
      if (data) {
        const normalRows = data.filter((row: any) => row.category !== 'transport' && row.category !== 'notification');
        const normalMapped: Ad[] = normalRows.map((row: any) => {
          const titleAndDesc = `${row.title || ''} ${row.description || ''}`.toLowerCase();
          const isUsed = titleAndDesc.includes('مستعمل') || titleAndDesc.includes('مستعملة') || titleAndDesc.includes('مستخدم') || titleAndDesc.includes('بالة') || titleAndDesc.includes('ثاني يد') || titleAndDesc.includes('مستعمله');
          const isNew = titleAndDesc.includes('جديد') || titleAndDesc.includes('جديدة') || titleAndDesc.includes('كارتون') || titleAndDesc.includes('بالكارتون') || titleAndDesc.includes('غير مستخدم') || titleAndDesc.includes('جديده') || titleAndDesc.includes('حديثة') || titleAndDesc.includes('زيرو');
          const inferredCondition: 'new' | 'used' = isNew && !isUsed ? 'new' : 'used';
          const condition: 'new' | 'used' = row.condition || inferredCondition;

          return {
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
            condition,
            description: row.description || '',
            adCount: 0,
            soldCount: 0,
            responseRate: 100,
            avgResponseTime: 'دقائق',
            postedBy: row.seller_id,
            short_id: row.short_id,
            is_vip: row.is_vip || false,
            vip_days: row.vip_days || 30,
          };
        });

        const activeMapped = normalMapped.filter(a => a.status === 'active' || a.status === 'sold');
        
        if (reset) {
          setAllAds(activeMapped);
          setAdsPage(0);
          setHasMoreAds(data.length === pageSize);
        } else {
          setAllAds(prev => {
            const combined = [...prev, ...activeMapped];
            return combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          });
          setAdsPage(pageToFetch);
          setHasMoreAds(data.length === pageSize);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFirstLoadDone.current = true;
      setIsInitialLoading(false);
      setLoadingMoreAds(false);
    }
  }, [adsPage, search, cat, gov, sort, priceMin, priceMax]);

  const fetchProducts = useCallback(async (reset = true) => {
    if (reset) {
      if (!isFirstLoadDone.current) {
        setIsInitialLoading(true);
      }
      setLoadingMoreProducts(true);
    } else {
      setLoadingMoreProducts(true);
    }
    try {
      const pageToFetch = reset ? 0 : productsPage + 1;
      const pageSize = 4;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('products').select('*', { count: 'exact' }).neq('status', 'sold');

      if (cat && cat !== 'all' && cat !== 'general') {
        query = query.eq('category', cat);
      }
      if (gov && gov !== 'الكل') {
        query = query.eq('governorate', gov);
      }
      if (search) {
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term},short_id.ilike.${term}`);
      }
      if (priceMin) {
        const minVal = parseInt(priceMin.replace(/,/g, ''));
        if (!isNaN(minVal)) query = query.gte('price', minVal);
      }
      if (priceMax) {
        const maxVal = parseInt(priceMax.replace(/,/g, ''));
        if (!isNaN(maxVal)) query = query.lte('price', maxVal);
      }

      if (sort === 'views') {
        query = query.order('views', { ascending: false });
      } else if (sort === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price-high') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) { console.error('Error fetching products:', error); return; }
      if (count !== null) setTotalProductsCount(count);
      if (data) {
        const mapped: Product[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          price: row.price,
          description: row.description || '',
          category: row.category,
          images: row.images || [],
          governorate: row.governorate || row.city || '',
          phone: row.phone || '',
          condition: row.condition || 'used',
          seller: {
            name: row.seller_name || 'مستخدم',
            avatar: row.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
            isVerified: false,
            rating: 4.8,
            joinedDate: row.created_at,
            location: row.governorate || '',
          },
          createdAtISO: row.created_at,
          views: row.views || 0,
          postedBy: row.seller_id,
          stock: row.stock || 1,
          status: row.status || 'active',
          short_id: row.short_id,
          is_vip: row.is_vip || false,
          vip_days: row.vip_days || 30,
        }));
        
        if (reset) {
          setAllProducts(mapped);
          setProductsPage(0);
          setHasMoreProducts(data.length === pageSize);
        } else {
          setAllProducts(prev => {
            const combined = [...prev, ...mapped];
            return combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          });
          setProductsPage(pageToFetch);
          setHasMoreProducts(data.length === pageSize);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFirstLoadDone.current = true;
      setIsInitialLoading(false);
      setLoadingMoreProducts(false);
    }
  }, [productsPage, search, cat, gov, sort, priceMin, priceMax]);

  return {
    allAds, setAllAds,
    allProducts, setAllProducts,
    fetchAds, fetchProducts,
    loadingMoreAds, loadingMoreProducts, isInitialLoading,
    hasMoreAds, hasMoreProducts,
    totalAdsCount, totalProductsCount
  };
}
