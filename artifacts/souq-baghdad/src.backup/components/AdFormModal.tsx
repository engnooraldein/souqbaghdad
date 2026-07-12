// ===========================================
// مسؤولية هذا الملف:
// نافذة نشر إعلان جديد أو تعديل إعلان موجود (Ad Form Modal).
//
// يتعامل مع Supabase مباشرة:
// - رفع الصور (uploadImageToStorage).
// - إضافة أو تحديث الإعلان في جدول 'ads'.
//
// استعلام Supabase:
// INSERT أو UPDATE عند الضغط على زر النشر/الحفظ.
//
// انتبه:
// - تحقق من rate limit قبل النشر (checkPostRateLimit).
// - تحقق من عدد الإعلانات المسموح بها للمستخدم.
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم كسر منطق التحقق (Validation).
// ===========================================
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

export function AdFormModal({ isOpen, onClose, onSubmit, user, editAd, cost = 1 }:{
  isOpen:boolean; onClose:()=>void; onSubmit:(ad:Ad)=>void; user:User; editAd?:Ad|null; cost?:number;
}) {
  const isEdit = !!editAd;
  const [tab, setTab] = useState<'form'|'preview'>('form');
  const [fd, setFd] = useState({ title:editAd?.title||'', price:editAd?.price?formatPrice(editAd.price):'', description:editAd?.description||'', category:editAd?.category||'cars', governorate:editAd?.governorate||user?.location||'بغداد', phone:editAd?.phone||user?.phone||'', type:editAd?.type||'sell' });
  const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>((editAd?.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)}))||[]));
  const [uploading, setUploading] = useState(false); const [pct, setPct] = useState(0);
  const playSound = useSound();
  useEffect(()=>{ if(editAd){ setFd({title:editAd.title,price:formatPrice(editAd.price),description:editAd.description,category:editAd.category,governorate:editAd.governorate,phone:editAd.phone,type:editAd.type}); setImages(editAd.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)})) || []); } },[editAd]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    const files = Array.from(e.target.files);
    for(const file of files){
      const uid = Math.random().toString(36).substring(2, 9);
      setImages(prev=>[...prev,{preview:'',progress:0,_uid:uid}]);
      let p=0;
      const iv=setInterval(()=>{
        p=Math.min(p+Math.random()*30,85);
        setImages(prev=>prev.map(img=>img._uid===uid&&img.progress<100?{...img,progress:p}:img));
      },120);
      try {
        const url = await uploadImageToStorage(file);
        clearInterval(iv);
        setImages(prev=>prev.map(img=>img._uid===uid?{...img,preview:url,progress:100}:img));
      } catch (err) {
        clearInterval(iv);
        setImages(prev=>prev.filter(img=>img._uid!==uid));
      }
    }
  };
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setUploading(true); playSound('click');
    for(let i=0;i<=100;i+=20){await new Promise(r=>setTimeout(r,100));setPct(i);}
    const ad:Ad = { id:isEdit?editAd!.id:Date.now(), title:fd.title, price:fd.price.replace(/,/g,''), governorate:fd.governorate, location:fd.governorate, phone:fd.phone, category:fd.category,
      images:images.filter(i=>i.preview).map(i=>i.preview).concat(images.length===0?['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700']:[]),
      seller:{name:user.name,avatar:user.avatar,isVerified:user.isVerified,rating:user.rating||5,joinedDate:user.joinedDate,location:user.location},
      time:'الآن', createdAtISO:isEdit?(editAd?.createdAtISO||new Date().toISOString()):new Date().toISOString(), views:isEdit?(editAd?.views||0):0,
      status:'active', type:fd.type, description:fd.description, adCount:user.stats.ads+1, soldCount:0, responseRate:100, avgResponseTime:'5 دقائق', postedBy:user.id };
    setUploading(false); playSound('success'); onSubmit(ad); onClose();
    if(!isEdit){setFd({title:'',price:'',description:'',category:'cars',governorate:user?.location||'بغداد',phone:user?.phone||'',type:'sell'});setImages([]);}
    setTab('form');
  };
  const fmt = (v:string) => v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  const cats = CATEGORIES.filter(c=>c.id!=='all'&&c.id!=='games');
  if(!isOpen) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">{isEdit&&<div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center"><Edit2 className="w-4 h-4 text-amber-400"/></div>}
            <h2 className="text-xl font-bold text-white">{isEdit?'تعديل الإعلان':'رفع إعلان جديد'}</h2></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex border-b border-gray-700">
          {(['form','preview'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-3 text-sm font-bold ${tab===t?'text-amber-400 border-b-2 border-amber-400':'text-gray-400'}`}>{t==='form'?'📝 بيانات الإعلان':'👁️ معاينة'}</button>
          ))}
        </div>
        {tab==='form'?(
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">{['sell','rent'].map(t=>(
              <button key={t} type="button" onClick={()=>setFd({...fd,type:t})} className={`py-3 rounded-xl font-bold text-sm ${fd.type===t?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t==='sell'?'للبيع':'للإيجار'}</button>
            ))}</div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">القسم</label>
              <div className="grid grid-cols-4 gap-2">{cats.map(c=>(
                <button key={c.id} type="button" onClick={()=>setFd({...fd,category:c.id})} className={`p-2 rounded-xl flex flex-col items-center gap-1 text-xs ${fd.category===c.id?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  <span className="text-lg">{c.emoji}</span><span>{c.name}</span></button>
              ))}</div></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">عنوان الإعلان</label>
              <input value={fd.title} onChange={e=>setFd({...fd,title:e.target.value})} placeholder="مثال: Toyota Land Cruiser 2024" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">السعر (دينار عراقي)</label>
              <input value={fmt(fd.price)} onChange={e=>setFd({...fd,price:fmt(e.target.value)})} placeholder="مثال: 850,000,000" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none text-lg font-bold"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-300 text-xs font-medium mb-2 block">المحافظة</label>
                <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none" title="اختر المحافظة" aria-label="اختر المحافظة">
                  {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select></div>
              <div><label className="text-gray-300 text-xs font-medium mb-2 block">رقم الهاتف</label>
                <input value={fd.phone} onChange={e=>setFd({...fd,phone:e.target.value})} placeholder="07XXXXXXXXX" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
            </div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">الوصف</label>
              <textarea value={fd.description} onChange={e=>setFd({...fd,description:e.target.value})} placeholder="اكتب وصفاً مفصلاً..." rows={3} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none resize-none"/></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">الصور ({images.filter(i=>i.preview).length}/10)</label>
              <div className="grid grid-cols-4 gap-2">
                {images.map((img,i)=>(
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-800">
                    {img.preview?<img src={img.preview} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full bg-gray-700 animate-pulse"/>}
                    {img.progress<100&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-3/4 h-1 bg-gray-600 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{width:`${img.progress}%`}}/></div></div>}
                    <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center" title="حذف الصورة" aria-label="حذف الصورة"><X className="w-3 h-3 text-white"/></button>
                  </div>
                ))}
                {images.length<10&&<label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500">
                  <ImagePlus className="w-6 h-6 text-gray-500"/><span className="text-[10px] text-gray-500 mt-1">إضافة</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/></label>}
              </div></div>
            <div className="flex gap-3">
              <button type="button" onClick={()=>setTab('preview')} className="flex-1 py-3 bg-gray-800 text-amber-400 font-bold rounded-xl text-sm border border-amber-500/30">👁️ معاينة</button>
              <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={uploading || (!isEdit && cost > 0 && (user.points || 0) < cost && user.role !== 'admin' && user.role !== 'owner')}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-sm flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400">
                <div className="flex items-center gap-2">{uploading?<><Loader2 className="w-4 h-4 animate-spin"/>{pct}%</>:<><Save className="w-4 h-4"/>{isEdit?'حفظ التعديلات':'نشر الإعلان'}</>}</div>
                {!isEdit && user.role !== 'admin' && user.role !== 'owner' && cost > 0 && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Wallet className="w-3 h-3"/> يخصم {cost} نقطة (متبقي {user.points || 0})</span>}
                {!isEdit && user.role !== 'admin' && user.role !== 'owner' && cost === 0 && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1">✨ مجاني</span>}
              </motion.button>
            </div>
          </form>
        ):(
          <div className="p-5">
            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
              <div className="aspect-[4/3]"><img src={images[0]?.preview||'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-full h-full object-cover"/></div>
              <div className="p-4"><h3 className="text-white font-bold mb-1">{fd.title||'عنوان الإعلان'}</h3>
                <p className="text-xl font-bold text-amber-400 mb-2">{formatPrice(fd.price||'0')} <span className="text-xs text-gray-400">د.ع</span></p>
                <p className="text-gray-400 text-xs">{fd.governorate} • {fd.description?.slice(0,60)||'وصف الإعلان'}</p></div>
            </div>
            <button onClick={()=>setTab('form')} className="mt-4 w-full py-3 bg-gray-800 text-amber-400 font-bold rounded-xl text-sm">← تعديل البيانات</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
