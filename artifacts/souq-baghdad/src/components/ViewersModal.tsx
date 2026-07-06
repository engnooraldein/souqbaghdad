import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getRelative } from '../utils/time';

export function ViewersModal({ itemId, itemType, onClose }: { itemId: string|number, itemType: 'ad'|'product'|'transport', onClose: () => void }) {
  const [viewers, setViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewers = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_viewers')
          .select('*')
          .eq('item_id', itemId)
          .eq('item_type', itemType)
          .order('viewed_at', { ascending: false })
          .limit(50);
          
        if (!error && data) {
          setViewers(data);
        }
      } catch (e) {
        console.error('Error fetching viewers', e);
      } finally {
        setLoading(false);
      }
    };
    fetchViewers();
  }, [itemId, itemType]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose}/>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-800 p-5 shadow-2xl relative z-[210]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">👀 الحسابات التي شاهدت الإعلان ({viewers.length})</h3>
          <button onClick={onClose} className="p-1.5 bg-gray-800 rounded-lg text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-4 h-4"/></button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-gray-500 text-xs text-center py-6">جاري التحميل...</p>
          ) : viewers.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-6">لا يوجد مشاهدات مسجلة بعد</p>
          ) : (
            viewers.map((v, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <img src={v.viewer_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-600"/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-xs truncate">{v.viewer_name || 'زائر'}</p>
                  <p className="text-[10px] text-gray-400">{v.viewer_location || 'العراق'}</p>
                </div>
                <span className="text-[9px] text-gray-500">{getRelative(v.viewed_at)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
