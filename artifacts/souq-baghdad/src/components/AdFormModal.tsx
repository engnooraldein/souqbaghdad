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

export function getAdCategoryPlaceholderImage(category: string): string {
  switch (category) {
    case 'cars':
      return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700'; // Modern luxury car
    case 'real-estate':
      return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700'; // Modern premium house
    case 'phones':
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700'; // Sleek smartphone
    case 'electronics':
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700'; // Tech/laptop setup
    case 'clothes':
      return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700'; // Modern fashion/suits
    case 'cosmetics':
      return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700'; // Cosmetics/perfume setup
    case 'handmade':
      return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=700'; // Beautiful handmade crafts
    case 'jobs':
      return 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=700'; // Professional interview/workspace
    case 'furniture':
      return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700'; // Luxury sofa/furniture
    case 'bikes':
      return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=700'; // Modern bicycle
    case 'services':
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700'; // Professional repair/service
    case 'games':
      return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700'; // Gaming console/controller
    default:
      return 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=700'; // Premium general template
  }
}

export function AdFormModal({ isOpen, onClose, onSubmit, user, editAd, cost = 1 }:{
  isOpen:boolean; onClose:()=>void; onSubmit:(ad:Ad)=>void; user:User; editAd?:Ad|null; cost?:number;
}) {
  const isEdit = !!editAd;
  const [tab, setTab] = useState<'form'|'preview'>('form');
  const [fd, setFd] = useState({ title:editAd?.title||'', price:editAd?.price?formatPrice(editAd.price):'', description:editAd?.description||'', category:editAd?.category||'cars', governorate:editAd?.governorate||user?.location||'بغداد', phone:editAd?.phone||user?.phone||'', type:editAd?.type||'sell' });

  const dynamicPlaceholders = useMemo(() => {
    switch (fd.category) {
      case 'cars':
        return {
          title: "مثال: تويوتا كورولا 2021 فل مواصفات",
          price: "مثال: 25,000,000",
          description: "مثال: محرك 1.6، بصمة، فتحة سقف، شاشة ايباد، نظيفة جداً كير ومحرك شرط الفحص..."
        };
      case 'real-estate':
        return {
          title: "مثال: بيت للبيع 200م في حي الجامعة",
          price: "مثال: 320,000,000",
          description: "مثال: طابقين، يحتوي على 4 غرف نوم، صالة واسعة، مطبخ مجهز، واجهة 10 متر، بناء حديث..."
        };
      case 'phones':
        return {
          title: "مثال: آيفون 15 برو ماكس 256 كيكابايت",
          price: "مثال: 1,450,000",
          description: "مثال: نسبة البطارية 95%، اللون تيتانيوم طبيعي، مع الكارتون والملحقات الأصلية، بدون شخوط..."
        };
      case 'electronics':
        return {
          title: "مثال: شاشة إل جي 55 بوصة 4K ذكية",
          price: "مثال: 450,000",
          description: "مثال: تدعم يوتيوب ونتفلكس، نظام ويب أوس، كفالة سنة كاملة، دقة ألوان ممتازة..."
        };
      case 'clothes':
        return {
          title: "مثال: قاط رجالي تركي فاخر",
          price: "مثال: 75,000",
          description: "مثال: متوفر بجميع القياسات من 46 إلى 56، قماش صوف ناعم، ألوان: أسود، كحلي، رصاصي..."
        };
      case 'cosmetics':
        return {
          title: "مثال: سيت عطور فرنسية أصلية",
          price: "مثال: 120,000",
          description: "مثال: عطور ثابتة وفواحة تدوم لأكثر من 24 ساعة، توصيل مجاني لكافة مناطق بغداد..."
        };
      case 'handmade':
        return {
          title: "مثال: لوحة جدارية من خيوط الكروشيه",
          price: "مثال: 40,000",
          description: "مثال: شغل يدوي متقن وخاص بالطلب، الأبعاد 50*70 سم، إطار خشبي فاخر..."
        };
      case 'jobs':
        return {
          title: "مثال: مطلوب محاسب ذو خبرة لشركة تجارية",
          price: "مثال: 800,000",
          description: "مثال: أوقات العمل من 9 صباحاً إلى 5 مساءً، يشترط إجادة برنامج الأمين وبرامج الأوفيس..."
        };
      case 'furniture':
        return {
          title: "مثال: غرف نوم تركية درجة أولى 6 قطع",
          price: "مثال: 2,150,000",
          description: "مثال: خشب صاج طبيعي، تصميم كلاسيكي مميز، مع التوصيل والشد المجاني داخل بغداد..."
        };
      case 'bikes':
        return {
          title: "مثال: دراجة هوائية هافانا سبورت",
          price: "مثال: 180,000",
          description: "مثال: حجم 26، خفيفة الوزن، هيكل ألمنيوم بالكامل، 21 سرعة، بحالة الوكالة..."
        };
      case 'services':
        return {
          title: "مثال: تنصيب وصيانة كاميرات المراقبة",
          price: "مثال: 25,000",
          description: "مثال: خدمات منزلية سريعة ومضمونة، تنصيب كاميرات دقة عالية IP مع ربط بالهاتف..."
        };
      case 'games':
        return {
          title: "مثال: بلايستيشن 5 مع يدتين ولعبتين",
          price: "مثال: 680,000",
          description: "مثال: النسخة الأوروبية قرص CD، مساحة 825 كيكابايت، نظيف جداً وغير مفتوح..."
        };
      default:
        return {
          title: "مثال: اكتب عنواناً واضحاً وجذاباً للإعلان",
          price: "مثال: 50,000",
          description: "اكتب مواصفات السلعة، حالتها، وأي تفاصيل تهم المشتري..."
        };
    }
  }, [fd.category]);
  const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>((editAd?.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)}))||[]));
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
        .from('ads')
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
      console.error('Error fetching smart price:', err);
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
  useEffect(()=>{ if(editAd){ setFd({title:editAd.title,price:formatPrice(editAd.price),description:editAd.description,category:editAd.category,governorate:editAd.governorate,phone:editAd.phone,type:editAd.type}); setImages(editAd.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)})) || []); } },[editAd]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    const files = Array.from(e.target.files);
    setImageError('');
    setIsModerating(true);
    for(const file of files){
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
    const ad:Ad = { id:isEdit?editAd!.id:Date.now(), title:fd.title, price:fd.price.replace(/,/g,''), governorate:fd.governorate, location:fd.governorate, phone:fd.phone, category:fd.category,
      images:images.filter(i=>i.preview).map(i=>i.preview).concat(images.length===0?[getAdCategoryPlaceholderImage(fd.category)]:[]),
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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} className="relative bg-gradient-to-b from-[#0c1c38] via-[#071328] to-[#040b1a] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-800/80 z-10 shadow-2xl scrollbar-hide">
        <div className="flex items-center justify-between p-6 border-b border-gray-900/60 bg-gray-950/20 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-xl flex items-center justify-center border border-amber-500/30">
              {isEdit ? <Edit2 className="w-5 h-5 text-amber-400"/> : <Sparkles className="w-5 h-5 text-amber-400"/>}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{isEdit ? 'تعديل الإعلان' : 'رفع إعلان جديد'}</h2>
              <p className="text-[10px] text-gray-400 font-bold">أنشئ عرضاً مميزاً ليصل لآلاف المشترين</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-gray-950/40 border border-gray-900 hover:border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all duration-300" title="إغلاق" aria-label="إغلاق">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="flex bg-gray-950/40 p-2 border-b border-gray-900/60 gap-2" dir="rtl">
          {(['form','preview'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${tab===t?'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/10':'text-gray-400 hover:text-white'}`}>
              {t==='form' ? '📝 بيانات الإعلان' : '👁️ معاينة العرض'}
            </button>
          ))}
        </div>

        {tab==='form'?(
          <form onSubmit={handleSubmit} className="p-6 space-y-5" dir="rtl">
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">نوع الإعلان</label>
              <div className="grid grid-cols-2 gap-3 bg-gray-950/40 p-1.5 rounded-2xl border border-gray-900/60">
                {['sell','rent'].map(t=>(
                  <button key={t} type="button" onClick={()=>setFd({...fd,type:t})} className={`py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 ${fd.type===t?'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/10':'text-gray-400 hover:text-white'}`}>
                    {t==='sell'?'للبيع':'للإيجار'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">القسم الرئيسي</label>
              <div className="grid grid-cols-4 gap-2.5">
                {cats.map(c=>(
                  <button key={c.id} type="button" onClick={()=>setFd({...fd,category:c.id})} className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold border transition-all duration-300 ${fd.category===c.id?'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-transparent shadow-lg shadow-amber-500/10 scale-102':'bg-gray-950/30 text-gray-400 border-gray-900/60 hover:bg-gray-900/40 hover:text-white'}`}>
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-[10px] sm:text-xs tracking-tight line-clamp-1">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">عنوان الإعلان</label>
              <input value={fd.title} onChange={e=>setFd({...fd,title:e.target.value})} placeholder={dynamicPlaceholders.title} required className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-300 placeholder-gray-500 text-sm font-semibold"/>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">السعر (دينار عراقي)</label>
              <div className="relative">
                <input value={fmt(fd.price)} onChange={e=>setFd({...fd,price:fmt(e.target.value)})} placeholder={dynamicPlaceholders.price} required className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-300 text-lg font-black placeholder-gray-600 pl-16"/>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-black select-none">د.ع</span>
              </div>
              
              {/* Smart Pricing Recommendation */}
              {loadingSmartPrice ? (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 mt-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري احتساب السعر الذكي المقترح للفئة والمواصفات...</span>
                </div>
              ) : smartPrice !== null ? (
                <div className="mt-1.5 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>متوسط السعر المقترح ذكياً: <strong className="text-amber-400">{formatPrice(smartPrice)} د.ع</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFd(prev => ({ ...prev, price: fmt(String(smartPrice)) }));
                      playSound('click');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-black px-2.5 py-1 rounded-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
                  >
                    تطبيق السعر
                  </button>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-300 text-xs font-black block">المحافظة</label>
                <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-300 text-sm font-bold" title="اختر المحافظة" aria-label="اختر المحافظة">
                  {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g} className="bg-gray-950 text-white">{g}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-gray-300 text-xs font-black block">رقم الهاتف للتواصل</label>
                <input value={fd.phone} onChange={e=>setFd({...fd,phone:e.target.value})} placeholder="07XXXXXXXXX" required className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-300 text-sm font-bold text-left" dir="ltr"/>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-300 text-xs font-black block">تفاصيل ووصف الإعلان</label>
                <button
                  type="button"
                  onClick={handleGenerateAIDescription}
                  disabled={isGeneratingDesc}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 disabled:from-gray-800 disabled:to-gray-900 text-black disabled:text-gray-500 rounded-xl text-[10px] sm:text-xs font-black shadow-lg shadow-amber-500/10 transition-all duration-300 hover:scale-102 cursor-pointer disabled:cursor-not-allowed"
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
              <textarea value={fd.description} onChange={e=>{setFd({...fd,description:e.target.value}); if(aiError) setAiError('');}} placeholder={dynamicPlaceholders.description} rows={5} className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-300 resize-none text-sm font-medium leading-relaxed"/>
              {aiError && (
                <p className="text-red-400 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 mt-1 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-900/40">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{aiError}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">الصور المرفقة ({images.filter(i=>i.preview).length}/10)</label>
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
                          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{width:`${img.progress}%`}}/>
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold mt-1">{Math.round(img.progress)}%</span>
                      </div>
                    )}
                    <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300" title="حذف الصورة" aria-label="حذف الصورة">
                      <X className="w-3.5 h-3.5 text-white"/>
                    </button>
                  </div>
                ))}
                {images.length<10&& (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-900 hover:border-amber-500/40 bg-gray-950/20 hover:bg-gray-950/40 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                    <ImagePlus className="w-7 h-7 text-gray-500 group-hover:text-amber-400"/>
                    <span className="text-[10px] text-gray-500 font-bold mt-1.5">إضافة صور</span>
                    <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/>
                  </label>
                )}
              </div>
              {isModerating && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 mt-2 font-bold animate-pulse">
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

            <div className="flex gap-4 pt-4 border-t border-gray-900/60">
              <button type="button" onClick={()=>setTab('preview')} className="flex-1 py-3.5 bg-gray-950/40 text-amber-400 font-black rounded-2xl text-xs sm:text-sm border border-amber-500/20 hover:bg-gray-900/30 transition-all duration-300 shadow-md">
                👁️ معاينة العرض
              </button>
              <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={uploading || (!isEdit && cost > 0 && (user.points || 0) < cost && user.role !== 'admin' && user.role !== 'owner')}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black rounded-2xl text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 shadow-lg shadow-amber-500/10">
                <div className="flex items-center gap-2">
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin"/> {pct}%</>
                  ) : (
                    <><Save className="w-4 h-4"/> {isEdit ? 'حفظ التعديلات' : 'نشر الإعلان كعرض'}</>
                  )}
                </div>
                {!isEdit && user.role !== 'admin' && user.role !== 'owner' && cost > 0 && (
                  <span className="text-[9px] opacity-80 font-bold bg-black/10 px-2 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                    <Wallet className="w-2.5 h-2.5"/> يخصم {cost} نقطة (متبقي {user.points || 0})
                  </span>
                )}
                {!isEdit && user.role !== 'admin' && user.role !== 'owner' && cost === 0 && (
                  <span className="text-[9px] opacity-80 font-bold bg-black/10 px-2 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                    ✨ مجاني بالكامل
                  </span>
                )}
              </motion.button>
            </div>
          </form>
        ):(
          <div className="p-6 space-y-4" dir="rtl">
            <div className="bg-gray-950/40 rounded-2xl overflow-hidden border border-gray-900 shadow-2xl">
              <div className="aspect-[16/10] relative bg-gray-900">
                <img src={images[0]?.preview||getAdCategoryPlaceholderImage(fd.category)} alt="" className="w-full h-full object-cover"/>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                  <span className="text-white text-xs font-bold">{fd.type==='sell'?'للبيع':'للإيجار'}</span>
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-white font-black text-lg">{fd.title||'عنوان الإعلان'}</h3>
                <div className="flex items-center gap-1.5 text-xl font-black text-amber-400">
                  <span>{formatPrice(fd.price||'0')}</span>
                  <span className="text-xs text-gray-400 font-bold">د.ع</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-bold pt-2 border-t border-gray-900/60">
                  <div className="flex items-center gap-1 text-amber-500">
                    <MapPin className="w-3.5 h-3.5"/>
                    <span>{fd.governorate}</span>
                  </div>
                  <span>•</span>
                  <span>قسم: {cats.find(c=>c.id===fd.category)?.name || 'غير معروف'}</span>
                </div>
                {fd.description && <p className="text-gray-300 text-xs sm:text-sm mt-3 line-clamp-3 bg-gray-950/20 p-3 rounded-xl border border-gray-900 leading-relaxed font-medium">{fd.description}</p>}
              </div>
            </div>
            <button onClick={()=>setTab('form')} className="w-full py-3.5 bg-gray-950/40 hover:bg-gray-900/30 text-amber-400 border border-amber-500/20 font-black rounded-2xl text-xs sm:text-sm transition-all duration-300 shadow-md">
              ← العودة وتعديل البيانات
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
