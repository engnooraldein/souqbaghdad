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

export function ProductFormModal({ isOpen, onClose, onSubmit, user, editProduct, cost = 1 }:{
  isOpen:boolean; onClose:()=>void; onSubmit:(p:Product)=>void; user:User; editProduct?:Product|null; cost?:number;
}) {
  const isEdit = !!editProduct;
  const [fd, setFd] = useState({ title:editProduct?.title||'', price:editProduct?.price?formatPrice(editProduct.price):'', description:editProduct?.description||'', category:editProduct?.category||'electronics', governorate:editProduct?.governorate||user?.location||'بغداد', phone:editProduct?.phone||user?.phone||'', condition:(editProduct?.condition||'new') as 'new'|'used', stock:editProduct?.stock||1 });
  const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>((editProduct?.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)}))||[]));
  const [uploading, setUploading] = useState(false); const [pct, setPct] = useState(0);
  const playSound = useSound();
  useEffect(()=>{if(editProduct){setFd({title:editProduct.title,price:formatPrice(editProduct.price),description:editProduct.description,category:editProduct.category,governorate:editProduct.governorate,phone:editProduct.phone,condition:editProduct.condition,stock:editProduct.stock});setImages(editProduct.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)})) || []);}},[editProduct]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    for(const file of Array.from(e.target.files)){
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
    const p:Product = { id:isEdit?editProduct!.id:Date.now(), title:fd.title, price:fd.price.replace(/,/g,''), description:fd.description, category:fd.category, governorate:fd.governorate, phone:fd.phone, condition:fd.condition, stock:fd.stock,
      images:images.filter(i=>i.preview).map(i=>i.preview).concat(images.length===0?['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700']:[]),
      seller:{name:user.name,avatar:user.avatar,isVerified:user.isVerified,rating:user.rating||5,joinedDate:user.joinedDate,location:user.location},
      createdAtISO:isEdit?(editProduct?.createdAtISO||new Date().toISOString()):new Date().toISOString(), views:isEdit?(editProduct?.views||0):0, postedBy:user.id,
      status:isEdit?(editProduct?.status||'active'):'active' };
    setUploading(false); playSound('success'); onSubmit(p); onClose();
    if(!isEdit){setFd({title:'',price:'',description:'',category:'electronics',governorate:user?.location||'بغداد',phone:user?.phone||'',condition:'new',stock:1});setImages([]);}
  };
  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  const cats = [
    { id: 'electronics', name: 'أجهزة وإلكترونيات', emoji: '💻' },
    { id: 'fashion', name: 'أزياء وملابس', emoji: '👕' },
    { id: 'home', name: 'المنزل والمطبخ', emoji: '🏠' },
    { id: 'furniture', name: 'أثاث وديكور', emoji: '🛋️' },
    { id: 'beauty', name: 'العناية والجمال', emoji: '✨' },
    { id: 'toys', name: 'ألعاب وأطفال', emoji: '🧸' },
    { id: 'bikes', name: 'دراجات ورياضة', emoji: '🚲' },
    { id: 'services', name: 'خدمات المتجر', emoji: '🔧' },
    { id: 'other', name: 'أصناف أخرى', emoji: '📦' }
  ];
  if(!isOpen) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-purple-400"/></div>
            <h2 className="text-xl font-bold text-white">{isEdit?'تعديل المنتج':'إضافة منتج جديد'}</h2></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Condition */}
          <div className="grid grid-cols-2 gap-3">{(['new','used'] as const).map(c=>(
            <button key={c} type="button" onClick={()=>setFd({...fd,condition:c})} className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${fd.condition===c?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {c==='new'?<><Tag className="w-4 h-4"/>جديد</>:<><Package className="w-4 h-4"/>مستعمل</>}</button>
          ))}</div>
          {/* Category */}
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">القسم</label>
            <div className="grid grid-cols-4 gap-2">{cats.map(c=>(
              <button key={c.id} type="button" onClick={()=>setFd({...fd,category:c.id})} className={`p-2 rounded-xl flex flex-col items-center gap-1 text-xs ${fd.category===c.id?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                <span className="text-lg">{c.emoji}</span><span>{c.name}</span></button>
            ))}</div></div>
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">اسم المنتج</label>
            <input value={fd.title} onChange={e=>setFd({...fd,title:e.target.value})} placeholder="مثال: ساعة كاسيو G-Shock" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">السعر (دينار)</label>
              <input value={fmt(fd.price)} onChange={e=>setFd({...fd,price:fmt(e.target.value)})} placeholder="35,000" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none font-bold"/></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">الكمية المتاحة</label>
              <input type="number" min="1" value={fd.stock} onChange={e=>setFd({...fd,stock:+e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none" title="الكمية المتاحة" aria-label="الكمية المتاحة" placeholder="الكمية المتاحة"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">المحافظة</label>
              <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none" title="اختر المحافظة" aria-label="اختر المحافظة">
                {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">رقم الهاتف</label>
              <input value={fd.phone} onChange={e=>setFd({...fd,phone:e.target.value})} placeholder="07XXXXXXXXX" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
          </div>
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">الوصف</label>
            <textarea value={fd.description} onChange={e=>setFd({...fd,description:e.target.value})} placeholder="اكتب وصفاً مفصلاً للمنتج..." rows={3} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none resize-none"/></div>
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">صور المنتج ({images.filter(i=>i.preview).length}/10)</label>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img,i)=>(
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-800">
                  {img.preview?<img src={img.preview} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full bg-gray-700 animate-pulse"/>}
                  {img.progress<100&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-3/4 h-1 bg-gray-600 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{width:`${img.progress}%`}}/></div></div>}
                  <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center" title="حذف الصورة" aria-label="حذف الصورة"><X className="w-3 h-3 text-white"/></button>
                </div>
              ))}
              {images.length<10&&<label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500">
                <ImagePlus className="w-6 h-6 text-gray-500"/><span className="text-[10px] text-gray-500 mt-1">إضافة</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/></label>}
            </div></div>
          <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={uploading}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {uploading?<><Loader2 className="w-4 h-4 animate-spin"/>{pct}%</>:<><Save className="w-4 h-4"/>{isEdit?'حفظ التعديلات':'نشر المنتج'}</>}</motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
