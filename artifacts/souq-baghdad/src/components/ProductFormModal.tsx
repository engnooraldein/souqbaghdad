// ===========================================
// مسؤولية هذا الملف:
// نافذة نشر منتج جديد أو تعديل منتج موجود (Product Form Modal).
//
// يتعامل مع Supabase مباشرة:
// - رفع الصور (uploadImageToStorage).
// - إضافة أو تحديث المنتج في جدول 'products'.
//
// استعلام Supabase:
// INSERT أو UPDATE عند الضغط على زر النشر/الحفظ.
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

export function getProductCategoryPlaceholderImage(category: string): string {
  switch (category) {
    case 'electronics':
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700'; // Tech setup
    case 'fashion':
      return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700'; // Apparel/fashion
    case 'home':
      return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=700'; // Kitchen/home
    case 'furniture':
      return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700'; // Elegant furniture
    case 'beauty':
      return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700'; // Cosmetics/beauty
    case 'toys':
      return 'https://images.unsplash.com/photo-1537651180672-73d74d866668?w=700'; // Toys/kids
    case 'bikes':
      return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=700'; // Bikes/sports
    case 'services':
      return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=700'; // Repair/services
    default:
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700'; // General elegant product
  }
}

export function ProductFormModal({ isOpen, onClose, onSubmit, user, editProduct, cost = 1 }:{
  isOpen:boolean; onClose:()=>void; onSubmit:(p:Product)=>void; user:User; editProduct?:Product|null; cost?:number;
}) {
  const isEdit = !!editProduct;
  const [fd, setFd] = useState({ title:editProduct?.title||'', price:editProduct?.price?formatPrice(editProduct.price):'', description:editProduct?.description||'', category:editProduct?.category||'electronics', governorate:editProduct?.governorate||user?.location||'بغداد', phone:editProduct?.phone||user?.phone||'', condition:(editProduct?.condition||'new') as 'new'|'used', stock:editProduct?.stock||1 });

  const dynamicPlaceholders = useMemo(() => {
    switch (fd.category) {
      case 'electronics':
        return {
          title: "مثال: سماعة بلوتوث لينوفو Thinkplus LP40",
          price: "مثال: 18,000",
          description: "مثال: بطارية تدوم 20 ساعة، جودة صوت ستيريو ممتازة، مقاومة للماء والتعرق، شحن Type-C..."
        };
      case 'fashion':
        return {
          title: "مثال: حذاء ريادي نايك طبي مريح",
          price: "مثال: 45,000",
          description: "مثال: نعل مرن ماص للصدمات، قماش مسامي للتهوية، متوفر بالقياسات من 40 إلى 45..."
        };
      case 'home':
        return {
          title: "مثال: خلاط كهربائي متعدد الوظائف 3 في 1",
          price: "مثال: 35,000",
          description: "مثال: قوة 800 واط، وعاء زجاجي مقاوم للكسر سعة 1.5 لتر، شفرات ستانلس ستيل حادة..."
        };
      case 'furniture':
        return {
          title: "مثال: ميز تواليت خشب مع مرآة مضيئة",
          price: "مثال: 150,000",
          description: "مثال: يحتوي على 3 جوارير لتنظيم المكياج، إضاءة LED مدمجة بثلاث درجات ألوان مختلفة..."
        };
      case 'beauty':
        return {
          title: "مثال: مرطب ومغذي البشرة سيرافي الأصلي",
          price: "مثال: 24,000",
          description: "مثال: حجم 236 مل، مناسب للبشرة الجافة والعادية، يحتوي على السيراميد وحمض الهيالورونيك..."
        };
      case 'toys':
        return {
          title: "مثال: سيارة سباق لاسلكية سريعة الشحن",
          price: "مثال: 22,000",
          description: "مثال: تتحرك بكافة الاتجاهات 360 درجة، مع بطارية قابلة لإعادة الشحن، مدى تحكم 30 متر..."
        };
      case 'bikes':
        return {
          title: "مثال: جهاز ركض كهربائي منزلي ذكي",
          price: "مثال: 420,000",
          description: "مثال: يتحمل وزن لغاية 110 كغم، شاشة ديجيتال لحساب السرعة والسعرات والمسافة، قابل للطي..."
        };
      case 'services':
        return {
          title: "مثال: تصميم شعار وهوية بصرية كاملة للشركات",
          price: "مثال: 100,000",
          description: "مثال: تسليم الملفات المصدرية بجودة عالية، تعديلات مفتوحة لغاية إتمام الرضا، تصميم عصري..."
        };
      default:
        return {
          title: "مثال: اكتب اسم المنتج بوضوح",
          price: "مثال: 25,000",
          description: "اكتب مواصفات المنتج بالتفصيل (اللون، الحجم، الموديل، التوصيل...)"
        };
    }
  }, [fd.category]);
  const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>((editProduct?.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)}))||[]));
  const [uploading, setUploading] = useState(false); const [pct, setPct] = useState(0);
  const playSound = useSound();

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [aiError, setAiError] = useState('');
  const [imageError, setImageError] = useState('');
  const [isModerating, setIsModerating] = useState(false);

  const [smartPrice, setSmartPrice] = useState<number | null>(null);
  const [loadingSmartPrice, setLoadingSmartPrice] = useState(false);

  const calculateSmartPrice = useCallback(async (cat: string, titleText: string) => {
    if (!cat) return;
    setLoadingSmartPrice(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('price, title')
        .eq('category', cat);

      if (!error && data && data.length > 0) {
        const titleWords = titleText.trim().toLowerCase().split(/\s+/).filter(w => w.length > 2);
        let matchingItems = data;
        if (titleWords.length > 0) {
          const filtered = data.filter(item => {
            const t = (item.title || '').toLowerCase();
            return titleWords.some(word => t.includes(word));
          });
          if (filtered.length > 0) {
            matchingItems = filtered;
          }
        }
        const prices = matchingItems
          .map(item => {
            const p = typeof item.price === 'string' ? item.price.replace(/,/g, '') : item.price;
            return parseInt(p);
          })
          .filter(p => !isNaN(p) && p > 0);

        if (prices.length > 0) {
          const avg = Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length);
          const roundedAvg = Math.round(avg / 1000) * 1000;
          setSmartPrice(roundedAvg);
        } else {
          setSmartPrice(null);
        }
      } else {
        setSmartPrice(null);
      }
    } catch (err) {
      console.error('Error fetching smart price for product:', err);
      setSmartPrice(null);
    } finally {
      setLoadingSmartPrice(false);
    }
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (isOpen) {
      timer = setTimeout(() => {
        calculateSmartPrice(fd.category, fd.title);
      }, 500);
    } else {
      setSmartPrice(null);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, fd.category, fd.title, calculateSmartPrice]);

  const handleGenerateAIDescription = async () => {
    const textToUse = fd.description.trim() || fd.title.trim();
    if (!textToUse) {
      setAiError('يرجى كتابة عنوان أو تفاصيل بسيطة أولاً ليقوم الذكاء الاصطناعي بصياغتها.');
      return;
    }
    setAiError('');
    setIsGeneratingDesc(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          title: fd.title,
          category: fd.category
        })
      });
      const data = await response.json();
      if (response.ok && data.generatedText) {
        setFd(prev => ({ ...prev, description: data.generatedText }));
      } else {
        setAiError(data.error || 'حدث خطأ أثناء توليد الوصف. يرجى المحاولة لاحقاً.');
      }
    } catch (err) {
      setAiError('حدث خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت والمحاولة لاحقاً.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };
  useEffect(()=>{if(editProduct){setFd({title:editProduct.title,price:formatPrice(editProduct.price),description:editProduct.description,category:editProduct.category,governorate:editProduct.governorate,phone:editProduct.phone,condition:editProduct.condition,stock:editProduct.stock});setImages(editProduct.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)})) || []);}},[editProduct]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    setImageError('');
    setIsModerating(true);
    for(const file of Array.from(e.target.files)){
      const uid = Math.random().toString(36).substring(2, 9);
      setImages(prev=>[...prev,{preview:'',progress:0,_uid:uid}]);
      let p=0;
      const iv=setInterval(()=>{
        p=Math.min(p+Math.random()*30,85);
        setImages(prev=>prev.map(img=>img._uid===uid&&img.progress<100?{...img,progress:p}:img));
      },120);
      try {
        // Compress and moderate the image first
        const base64Data = await compressImage(file, 900, 0.78, false);
        const modResponse = await fetch('/api/moderate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data })
        });
        const modData = await modResponse.json();

        if (modResponse.ok && !modData.isSafe) {
          clearInterval(iv);
          setImages(prev=>prev.filter(img=>img._uid!==uid));
          setImageError(`تم رفض الصورة "${file.name}" بسبب: ${modData.reason || 'محتوى غير متوافق مع شروط المنصة.'}`);
          playSound('error');
          continue;
        }

        const url = await uploadImageToStorage(file);
        clearInterval(iv);
        setImages(prev=>prev.map(img=>img._uid===uid?{...img,preview:url,progress:100}:img));
      } catch (err) {
        clearInterval(iv);
        setImages(prev=>prev.filter(img=>img._uid!==uid));
        setImageError('حدث خطأ أثناء فحص الصورة المرفوعة بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.');
      }
    }
    setIsModerating(false);
  };
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setUploading(true); playSound('click');
    for(let i=0;i<=100;i+=20){await new Promise(r=>setTimeout(r,100));setPct(i);}
    const p:Product = { id:isEdit?editProduct!.id:Date.now(), title:fd.title, price:fd.price.replace(/,/g,''), description:fd.description, category:fd.category, governorate:fd.governorate, phone:fd.phone, condition:fd.condition, stock:fd.stock,
      images:images.filter(i=>i.preview).map(i=>i.preview).concat(images.length===0?[getProductCategoryPlaceholderImage(fd.category)]:[]),
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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} className="relative bg-gradient-to-b from-[#180e2d] via-[#100921] to-[#080412] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-purple-900/30 z-10 shadow-2xl scrollbar-hide">
        <div className="flex items-center justify-between p-6 border-b border-purple-950/40 bg-gray-950/20 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-violet-500/10 rounded-xl flex items-center justify-center border border-purple-500/30">
              <ShoppingBag className="w-5 h-5 text-purple-400"/>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{isEdit?'تعديل المنتج':'إضافة منتج جديد'}</h2>
              <p className="text-[10px] text-gray-400 font-bold">اعرض منتجات متجرك بأناقة واجذب المشترين</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-gray-950/40 border border-gray-900 hover:border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all duration-300" title="إغلاق" aria-label="إغلاق">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" dir="rtl">
          {/* Condition */}
          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">حالة المنتج</label>
            <div className="grid grid-cols-2 gap-3 bg-gray-950/40 p-1.5 rounded-2xl border border-gray-900/60">
              {(['new','used'] as const).map(c=>(
                <button key={c} type="button" onClick={()=>setFd({...fd,condition:c})} className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 ${fd.condition===c?'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/15':'text-gray-400 hover:text-white'}`}>
                  {c==='new'?<><Tag className="w-4 h-4"/>جديد بالكرتون</>:<><Package className="w-4 h-4"/>مستعمل (نظيف)</>}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">تصنيف المنتج</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {cats.map(c=>(
                <button key={c.id} type="button" onClick={()=>setFd({...fd,category:c.id})} className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold border transition-all duration-300 ${fd.category===c.id?'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent shadow-lg shadow-purple-500/10 scale-102':'bg-gray-950/30 text-gray-400 border-gray-900/60 hover:bg-gray-900/40 hover:text-white'}`}>
                  <span className="text-lg">{c.emoji}</span>
                  <span className="text-[10px] tracking-tight text-center line-clamp-1">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">اسم المنتج وعنوانه</label>
            <input value={fd.title} onChange={e=>setFd({...fd,title:e.target.value})} placeholder={dynamicPlaceholders.title} required className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 placeholder-gray-500 text-sm font-semibold"/>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">السعر (دينار عراقي)</label>
              <div className="relative">
                <input value={fmt(fd.price)} onChange={e=>setFd({...fd,price:fmt(e.target.value)})} placeholder={dynamicPlaceholders.price} required className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-base font-black placeholder-gray-600 pl-12"/>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold select-none">د.ع</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">الكمية المتوفرة</label>
              <input type="number" min="1" value={fd.stock} onChange={e=>setFd({...fd,stock:+e.target.value})} className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-sm font-bold" title="الكمية المتاحة" aria-label="الكمية المتاحة" placeholder="مثال: 1"/>
            </div>
          </div>

          {/* Smart Pricing Recommendation */}
          {loadingSmartPrice ? (
            <div className="flex items-center gap-1.5 text-[11px] text-purple-400 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري احتساب السعر الذكي المقترح للمنتج والمواصفات...</span>
            </div>
          ) : smartPrice !== null ? (
            <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>متوسط السعر المقترح ذكياً: <strong className="text-purple-400">{formatPrice(smartPrice)} د.ع</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFd(prev => ({ ...prev, price: fmt(String(smartPrice)) }));
                  playSound('click');
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-black px-2.5 py-1 rounded-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
              >
                تطبيق السعر
              </button>
            </div>
          ) : null}

          {/* Governorate & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">المحافظة</label>
              <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-sm font-bold" title="اختر المحافظة" aria-label="اختر المحافظة">
                {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g} className="bg-gray-950 text-white">{g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">رقم الهاتف للتواصل</label>
              <input value={fd.phone} onChange={e=>setFd({...fd,phone:e.target.value})} placeholder="07XXXXXXXXX" required className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-sm font-bold text-left text-white" dir="ltr"/>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-300 text-xs font-black block">وصف وتفاصيل المنتج</label>
              <button
                type="button"
                onClick={handleGenerateAIDescription}
                disabled={isGeneratingDesc}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-800 disabled:to-gray-900 text-white disabled:text-gray-500 rounded-xl text-[10px] sm:text-xs font-black shadow-lg shadow-purple-500/10 transition-all duration-300 hover:scale-102 cursor-pointer disabled:cursor-not-allowed"
              >
                {isGeneratingDesc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الصياغة بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>✨ اكتب بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>
            <textarea value={fd.description} onChange={e=>{setFd({...fd,description:e.target.value}); if(aiError) setAiError('');}} placeholder={dynamicPlaceholders.description} rows={5} className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 resize-none text-sm font-medium leading-relaxed"/>
            {aiError && (
              <p className="text-red-400 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 mt-1 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-900/40">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{aiError}</span>
              </p>
            )}
          </div>

          {/* Images */}
          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">صور المنتج المرفقة ({images.filter(i=>i.preview).length}/10)</label>
            <div className="grid grid-cols-5 gap-2.5">
              {images.map((img,i)=>(
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-950/40 border border-gray-900 shadow-inner group">
                  {img.preview ? (
                    <img src={img.preview} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"/>
                  ) : (
                    <div className="w-full h-full bg-gray-900/40 animate-pulse flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-700"/>
                    </div>
                  )}
                  {img.progress<100&& (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 backdrop-blur-sm">
                      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{width:`${img.progress}%`}}/>
                      </div>
                      <span className="text-[10px] text-purple-400 font-bold mt-1">{Math.round(img.progress)}%</span>
                    </div>
                  )}
                  <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300" title="حذف الصورة" aria-label="حذف الصورة">
                    <X className="w-3.5 h-3.5 text-white"/>
                  </button>
                </div>
              ))}
              {images.length<10&& (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-900 hover:border-purple-500/40 bg-gray-950/20 hover:bg-gray-950/40 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                  <ImagePlus className="w-7 h-7 text-gray-500"/>
                  <span className="text-[10px] text-gray-500 font-bold mt-1.5">إضافة صور</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/>
                </label>
              )}
            </div>
            {isModerating && (
              <div className="flex items-center gap-1.5 text-[11px] text-purple-400 mt-2 font-bold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري فحص الصور بالذكاء الاصطناعي لحظر الصور غير اللائقة...</span>
              </div>
            )}
            {imageError && (
              <p className="text-red-400 text-[10px] sm:text-xs font-bold flex items-start gap-1.5 mt-2 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-900/40">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>{imageError}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={uploading}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 disabled:opacity-50">
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin"/> {pct}%</>
            ) : (
              <><Save className="w-5 h-5"/> {isEdit ? 'حفظ تعديلات المنتج' : 'إضافة المنتج للمتجر'}</>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
