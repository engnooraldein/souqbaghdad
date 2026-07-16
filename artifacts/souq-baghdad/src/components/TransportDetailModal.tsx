// ===========================================
// مسؤولية هذا الملف:
// يعرض نافذة تفاصيل خط النقل (Transport Detail Modal).
//
// يجلب البيانات من Supabase:
// - تسجيل مشاهدة الخط (recordItemView).
//
// استعلام Supabase:
// يُنفَّذ مرة واحدة عند فتح النافذة.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReadingModeOverlay } from './ReadingModeOverlay';
import { 
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User as UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image as ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone as PhoneIcon,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, 
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';

import { ImageCropModal } from './ImageCropModal';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

export function TransportDetailModal({ ad, onClose, user, onAuthRequired, onViewDurationLogged, storedUsers }:{
  ad:TransportAd|null; onClose:()=>void; user:User|null; onAuthRequired:()=>void;
  onViewDurationLogged?:(seconds:number)=>void;
  storedUsers?: any[];
}) {
  const [showViewers, setShowViewers] = useState(false);
  const [realViews, setRealViews] = useState(0);
  const [showReadingMode, setShowReadingMode] = useState(false);

  useEffect(()=>{
    if (ad) {
      setRealViews(ad.views || 0);
      recordItemView(ad.id, 'transport', user, ad.postedBy);
      supabase.from('ad_viewers').select('id', { count: 'exact', head: true }).eq('item_id', ad.id).eq('item_type', 'transport').then(({ count }) => {
        if (count !== null) setRealViews(Math.max(ad.views || 0, count));
      });
    }
  },[ad]);

  useEffect(() => {
    const start = Date.now();
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed >= 1 && ad) {
        onViewDurationLogged?.(elapsed);
      }
    };
  }, [ad?.id]);

  if(!ad) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10 p-6">
        <InterestTimer itemId={ad.id} itemType="transport" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-400"/>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{ad.type === 'offer' ? 'خط متوفر' : 'طلب خط'} إلى {ad.university}</h2>
              <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400"/> <span>{ad.regions}</span>
                {ad.short_id && (
                  <span className="mr-1 text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">#{ad.short_id}</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-white" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
            <p className="text-gray-400 text-[10px] mb-0.5">الدوام</p>
            <p className="text-white font-bold text-xs">{ad.shift}</p>
          </div>
          {ad.type === 'offer' && (
            <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
              <p className="text-gray-400 text-[10px] mb-0.5">المقاعد</p>
              <p className="text-emerald-400 font-bold text-xs">{ad.seats} متاح</p>
            </div>
          )}
          <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
            <p className="text-gray-400 text-[10px] mb-0.5">الفئة</p>
            <p className="text-white font-bold text-xs">{ad.targetAudience}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
            <p className="text-gray-400 text-[10px] mb-0.5">المركبة</p>
            <p className="text-white font-bold text-xs">{ad.vehicleType}</p>
          </div>
        </div>

        {ad.price && (
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-4 bg-amber-500/10 px-3 py-2 rounded-lg inline-flex">
            <Tag className="w-4 h-4"/>
            <span>السعر المفضل: {ad.price}</span>
          </div>
        )}

        {ad.note && (
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-white font-bold text-xs">ملاحظات إضافية</h3>
              {ad.note.length > 50 && (
                <button 
                  type="button"
                  onClick={() => setShowReadingMode(true)}
                  className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all duration-300"
                >
                  <span>📖</span> وضع القراءة
                </button>
              )}
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">{ad.note}</p>
            
            <AnimatePresence>
              {showReadingMode && (
                <ReadingModeOverlay 
                  text={ad.note} 
                  title={`خط إلى ${ad.university}`} 
                  onClose={() => setShowReadingMode(false)} 
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Views & Date */}
        <div className="flex items-center justify-between mb-5 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const canViewViewers = user?.isVerified || String(user?.id) === String(ad.postedBy) || user?.role === 'admin' || user?.role === 'owner';
              if (canViewViewers) setShowViewers(true);
              else alert('عذراً، رؤية قائمة المشاهدات متاحة للمعلن والحسابات الموثقة فقط 🌟');
            }} className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full hover:bg-emerald-500/20 transition-colors">
              <Eye className="w-3.5 h-3.5"/> <span>{realViews} مشاهدة</span>
            </button>
            <span>•</span>
            <span className="text-amber-400 font-bold">الاهتمام: {ad.interest}</span>
          </div>
          <TimeAgo iso={ad.createdAt} />
        </div>

        {/* Seller Info */}
        {(() => {
          const liveSeller = storedUsers?.find(u=>u.id===ad.postedBy);
          return (
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-5 flex items-center gap-3">
              <img src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-10 h-10 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>
              <div>
                <span className="text-white font-bold text-sm block">{ad.sellerName}</span>
                <span className="text-gray-400 text-xs">صاحب الإعلان</span>
              </div>
            </div>
          );
        })()}

        {/* Call Actions */}
        <div className="grid grid-cols-3 gap-2">
          <motion.a href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
            whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-1.5 py-3 bg-green-500 text-white font-bold rounded-xl text-xs">
            <MessageSquare className="w-4 h-4"/> واتساب
          </motion.a>
          <motion.button
            onClick={() => handleUniversalShare({ id: ad.id, short_id: ad.short_id, university: ad.university, type: ad.type, regions: ad.regions, price: ad.price, url: `/transport/card/${ad.short_id || ad.id}` })}
            whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-1.5 py-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/15 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 font-black rounded-xl text-xs transition-all duration-300 shadow-sm active:scale-[0.98]">
            <Share2 className="w-4 h-4 text-amber-400 animate-pulse"/>
            <span>مشاركة الخط</span>
          </motion.button>
          <motion.a href={`tel:${ad.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-1.5 py-3 bg-gray-800 text-white font-bold rounded-xl text-xs">
            <PhoneIcon className="w-4 h-4"/> اتصال
          </motion.a>
        </div>

        <AnimatePresence>
          {showViewers && (
            <Suspense fallback={null}>
              <ViewersModal itemId={ad.id} itemType="transport" onClose={() => setShowViewers(false)} />
            </Suspense>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
