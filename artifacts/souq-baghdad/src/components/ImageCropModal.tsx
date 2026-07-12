import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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


import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

export function ImageCropModal({ src, aspectRatio=1, title='قص الصورة', onSave, onClose }:{
  src:string; aspectRatio?:number; title?:string; onSave:(b64:string)=>void; onClose:()=>void;
}) {
  const PREV_W = 300, PREV_H = Math.round(300/aspectRatio);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos]   = useState({ x:0, y:0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x:0, y:0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const onMouseDown = (e:React.MouseEvent) => { e.preventDefault(); setDragging(true); setStart({x:e.clientX-pos.x, y:e.clientY-pos.y}); };
  const onMouseMove = (e:React.MouseEvent) => { if(!dragging) return; setPos({x:e.clientX-start.x, y:e.clientY-start.y}); };
  const onMouseUp   = () => setDragging(false);
  const onTouchStart = (e:React.TouchEvent) => { const t=e.touches[0]; setDragging(true); setStart({x:t.clientX-pos.x, y:t.clientY-pos.y}); };
  const onTouchMove  = (e:React.TouchEvent) => { if(!dragging) return; const t=e.touches[0]; setPos({x:t.clientX-start.x, y:t.clientY-start.y}); };

  const handleSave = () => {
    const img = imgRef.current; if(!img) return;
    const c = document.createElement('canvas');
    c.width=PREV_W; c.height=PREV_H;
    const ctx = c.getContext('2d')!;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    // Calculate the scale at which the browser's object-cover renders the image
    const coverScale = Math.max((PREV_W*zoom)/nw, (PREV_H*zoom)/nh);
    const dw = nw * coverScale;
    const dh = nh * coverScale;
    const dx = (PREV_W - dw)/2 + pos.x;
    const dy = (PREV_H - dh)/2 + pos.y;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, PREV_W, PREV_H);
    ctx.drawImage(img, dx, dy, dw, dh);
    onSave(c.toDataURL('image/jpeg', 0.88));
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="relative bg-gray-900 rounded-2xl p-5 w-full max-w-sm border border-gray-700 shadow-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 bg-gray-800 rounded-lg text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-4 h-4"/></button>
        </div>
        {/* Crop area */}
        <div className="relative overflow-hidden rounded-xl bg-gray-800 border border-gray-600 cursor-grab active:cursor-grabbing select-none mx-auto"
          style={{width:PREV_W, height:PREV_H}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}>
          <img ref={imgRef} src={src} alt=""
            className="absolute object-cover pointer-events-none"
            style={{ width:PREV_W*zoom, height:PREV_H*zoom, left:(PREV_W-PREV_W*zoom)/2+pos.x, top:(PREV_H-PREV_H*zoom)/2+pos.y }}
            draggable={false}/>
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',backgroundSize:`${PREV_W/3}px ${PREV_H/3}px`}}/>
          <div className="absolute inset-0 border-2 border-white/40 rounded-xl pointer-events-none"/>
        </div>
        {/* Zoom */}
        <div className="flex items-center gap-3 mt-4">
          <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0"/>
          <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={e=>setZoom(+e.target.value)} className="flex-1 accent-amber-400" title="نسبة التقريب" aria-label="نسبة التقريب"/>
          <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0"/>
          <span className="text-gray-400 text-xs w-8">{(zoom*100).toFixed(0)}%</span>
        </div>
        <p className="text-gray-500 text-xs text-center mt-2">اسحب الصورة لتحريكها</p>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium">إلغاء</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-amber-500 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Check className="w-4 h-4"/> حفظ</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
