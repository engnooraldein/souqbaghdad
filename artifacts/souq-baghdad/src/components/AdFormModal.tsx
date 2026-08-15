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
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, Megaphone, Monitor, Dumbbell, Shirt, Scissors, Briefcase, Sofa
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

export function AdFormModal({ isOpen, onClose, onSubmit, user, editAd, cost = 1, vipCost = 5 }:{
  isOpen:boolean; onClose:()=>void; onSubmit:(ad:Ad)=>void; user:User; editAd?:Ad|null; cost?:number; vipCost?:number;
}) {
  const isEdit = !!editAd;
  const [tab, setTab] = useState<'form'|'preview'>('form');
  const [fd, setFd] = useState({ title:editAd?.title||'', price:editAd?.price?formatPrice(editAd.price):'', description:editAd?.description||'', category:editAd?.category||'cars', governorate:editAd?.governorate||user?.location||'بغداد', phone:editAd?.phone||user?.phone||'', type:editAd?.type||'sell', is_vip: editAd?.is_vip||false, vip_days: editAd?.vip_days||30 });
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [selectedCarModel, setSelectedCarModel] = useState('');
  const [selectedCarYear, setSelectedCarYear] = useState('');
  const [selectedCarTrim, setSelectedCarTrim] = useState('');
  const totalVipCost = fd.is_vip ? Math.ceil((vipCost / 30) * (fd.vip_days || 30)) : 0;
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
      // Fallback: generate a simple description locally when API is unavailable
      const cats: Record<string, string> = {
        cars: 'سيارات', 'real-estate': 'عقارات', phones: 'هواتف', electronics: 'إلكترونيات',
        clothes: 'ملابس', furniture: 'أثاث', services: 'خدمات', games: 'ألعاب',
        cosmetics: 'مستحضرات', bikes: 'دراجات', jobs: 'وظائف', handmade: 'منتجات يدوية'
      };
      const catLabel = cats[fd.category] || 'منتج';
      const generated = [
        `للبيع: ${fd.title || textToUse}.`,
        `من أفضل عروض قسم ال${catLabel} في سوق بغداد.`,
        `الحالة جيدة جداً.`,
        `السعر جد مناسب وقابل للتفاوض بشكل محدود.`,
        `للتواصل والاستفسار يرجى التواصل عبر الواتساب.`
      ].join(' ');
      setFd(prev => ({ ...prev, description: generated }));
    } finally {
      setIsGeneratingDesc(false);
    }
  };
  useEffect(()=>{ if(editAd){ setFd({title:editAd.title,price:formatPrice(editAd.price),description:editAd.description,category:editAd.category,governorate:editAd.governorate,phone:editAd.phone,type:editAd.type,is_vip:editAd.is_vip||false,vip_days:0}); setImages(editAd.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)})) || []); } },[editAd]);
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
        const { data: modData, error: modError } = await supabase.functions.invoke('moderate-image', {
          body: { imageBase64: base64Data }
        });

        if (modError) throw modError;

        if (!modData?.isSafe) {
          clearInterval(iv);
          setImages(prev=>prev.filter(img=>img._uid!==uid));
          setImageError(`تم رفض الصورة "${file.name}" بسبب: ${modData.reason || 'محتوى غير متوافق مع شروط المنصة.'}`);
          playSound('error');
          continue;
        }

        const url = await uploadImageToStorage(file);
        clearInterval(iv);
        setImages(prev=>prev.map(img=>img._uid===uid?{...img,preview:url,progress:100}:img));
        playSound('upload');
      } catch (err) {
        // Fallback: If AI moderation fails (e.g., quota exceeded), allow upload
        console.warn("AI Moderation failed, bypassing...", err);
        try {
          const url = await uploadImageToStorage(file);
          clearInterval(iv);
          setImages(prev=>prev.map(img=>img._uid===uid?{...img,preview:url,progress:100}:img));
          playSound('upload');
        } catch (uploadErr) {
          clearInterval(iv);
          setImages(prev=>prev.filter(img=>img._uid!==uid));
          setImageError('حدث خطأ أثناء رفع الصورة. يرجى المحاولة لاحقاً.');
        }
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
      status:'active', type:fd.type, description:fd.description, adCount:user.stats.ads+1, soldCount:0, responseRate:100, avgResponseTime:'5 دقائق', postedBy:user.id, is_vip:fd.is_vip, vip_days: fd.vip_days };
    setUploading(false); playSound('success'); onSubmit(ad); onClose();
    if(!isEdit){setFd({title:'',price:'',description:'',category:'cars',governorate:user?.location||'بغداد',phone:user?.phone||'',type:'sell',is_vip:false,vip_days:0});setImages([]);}
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
                {cats.map(c=>{
                  const catIcons: Record<string, React.ReactNode> = {
                    'all': <Home className="w-6 h-6 text-indigo-400" />,
                    'general': <Megaphone className="w-6 h-6 text-amber-400" />,
                    'cars': <Car className="w-6 h-6 text-blue-400" />,
                    'real-estate': <Home className="w-6 h-6 text-emerald-400" />,
                    'phones': <Smartphone className="w-6 h-6 text-purple-400" />,
                    'electronics': <Monitor className="w-6 h-6 text-teal-400" />,
                    'gym': <Dumbbell className="w-6 h-6 text-red-400" />,
                    'clothes': <Shirt className="w-6 h-6 text-pink-400" />,
                    'cosmetics': <Sparkles className="w-6 h-6 text-rose-400" />,
                    'handmade': <Scissors className="w-6 h-6 text-orange-400" />,
                    'jobs': <Briefcase className="w-6 h-6 text-blue-500" />,
                    'furniture': <Sofa className="w-6 h-6 text-amber-600" />,
                    'bikes': <Bike className="w-6 h-6 text-green-500" />,
                    'services': <Wrench className="w-6 h-6 text-gray-400" />,
                    'games': <Gamepad2 className="w-6 h-6 text-indigo-500" />
                  };
                  return (
                  <button key={c.id} type="button" onClick={()=>setFd({...fd,category:c.id})} className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 text-xs font-bold border transition-all duration-300 ${fd.category===c.id?'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-transparent shadow-lg shadow-amber-500/10 scale-102 [&>svg]:text-black':'bg-gray-950/30 text-gray-400 border-gray-900/60 hover:bg-gray-900/40 hover:text-white'}`}>
                    {catIcons[c.id] || <span className="text-2xl">{c.emoji}</span>}
                    <span className="text-[10px] sm:text-xs tracking-tight line-clamp-1">{c.name}</span>
                  </button>
                )})}
              </div>
            </div>

            {/* Special Interactive Car Selector Wizard */}
            {fd.category === 'cars' && (
              <div className="p-4 bg-gradient-to-br from-blue-950/60 via-gray-900 to-slate-900 border border-blue-500/40 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2.5">
                  <label className="text-blue-400 text-xs font-black flex items-center gap-2">
                    🏎️ مواصفات السيارة الدقيقة (ابحث، اختر الموديل، الفئة والسنة):
                  </label>
                  <span className="text-[10px] font-bold text-gray-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">اختيار ذكي وسريع</span>
                </div>

                {/* Step 1: Search Car Brand & Model */}
                <div className="space-y-2">
                  <label className="text-gray-300 text-[11px] font-extrabold block">1. ابحث عن موديل السيارة (مثال: النترا، كورولا، سبورتاج، تشارجر...):</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث هنا... (اكتب النترا، كامري، اوبتيما...)"
                      value={carSearchQuery}
                      onChange={(e) => setCarSearchQuery(e.target.value)}
                      className="w-full bg-gray-950 text-white rounded-xl py-2.5 px-3 border border-blue-500/30 text-xs focus:border-blue-400 outline-none"
                    />
                    {carSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCarSearchQuery('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filtered Car Models Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {[
                      { brand: 'هيونداي', model: 'النترا Elantra' },
                      { brand: 'هيونداي', model: 'سوناتا Sonata' },
                      { brand: 'هيونداي', model: 'توسان Tucson' },
                      { brand: 'هيونداي', model: 'سانتافي Santa Fe' },
                      { brand: 'تويوتا', model: 'كورولا Corolla' },
                      { brand: 'تويوتا', model: 'كامري Camry' },
                      { brand: 'تويوتا', model: 'لاندكروزر Land Cruiser' },
                      { brand: 'تويوتا', model: 'يارس Yaris' },
                      { brand: 'كيا', model: 'سبورتاج Sportage' },
                      { brand: 'كيا', model: 'اوبتيما / K5' },
                      { brand: 'كيا', model: 'سورينتو Sorento' },
                      { brand: 'كيا', model: 'سيراتو Cerato' },
                      { brand: 'دودج', model: 'تشارجر Charger' },
                      { brand: 'دودج', model: 'تحدي Challenger' },
                      { brand: 'دودج', model: 'دورانجو Durango' },
                      { brand: 'شفروليه', model: 'تاهو Tahoe' },
                      { brand: 'شفروليه', model: 'ماليبو Malibu' },
                      { brand: 'نيسان', model: 'باترول Patrol' },
                      { brand: 'نيسان', model: 'التيما Altima' },
                      { brand: 'نيسان', model: 'صني Sunny' },
                      { brand: 'بي أم دبليو', model: 'الفئة الخامسة 5 Series' },
                      { brand: 'مرسيدس', model: 'E-Class' },
                      { brand: 'مرسيدس', model: 'S-Class' },
                      { brand: 'لكزس', model: 'LX 600 / 570' },
                      { brand: 'لكزس', model: 'ES 350' },
                      { brand: 'جيب', model: 'جراند شيروكي' },
                      { brand: 'فورد', model: 'موستانج Mustang' },
                      { brand: 'فورد', model: 'إكسبلورر Explorer' }
                    ]
                    .filter(c => !carSearchQuery || `${c.brand} ${c.model}`.toLowerCase().includes(carSearchQuery.toLowerCase()))
                    .map((item, idx) => {
                      const isSelected = selectedCarModel === `${item.brand} ${item.model}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedCarModel(`${item.brand} ${item.model}`);
                            setFd(prev => ({
                              ...prev,
                              subCategory: `${item.brand} ${item.model}`,
                              title: prev.title || `${item.brand} ${item.model} ${selectedCarYear || ''} ${selectedCarTrim || ''}`.trim()
                            }));
                          }}
                          className={`p-2 rounded-xl text-[11px] font-extrabold border transition-all text-right flex flex-col cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-300 shadow-md shadow-blue-500/30 scale-102'
                              : 'bg-gray-950/70 border-gray-800 text-gray-300 hover:bg-blue-900/40 hover:text-white'
                          }`}
                        >
                          <span className="text-[9px] opacity-75">{item.brand}</span>
                          <span className="font-bold">{item.model}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Year Selector */}
                <div className="space-y-1.5 pt-2 border-t border-blue-500/20">
                  <label className="text-gray-300 text-[11px] font-extrabold block">2. حدد سنة الموديل:</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2010', '2008'].map(year => {
                      const isSelected = selectedCarYear === year;
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => {
                            setSelectedCarYear(year);
                            setFd(prev => ({
                              ...prev,
                              title: `${selectedCarModel || 'سيارة'} ${year} ${selectedCarTrim || ''}`.trim()
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-black border-amber-300 shadow-md shadow-amber-500/20'
                              : 'bg-gray-950 border-gray-800 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Trim / Edition Selector */}
                <div className="space-y-1.5 pt-2 border-t border-blue-500/20">
                  <label className="text-gray-300 text-[11px] font-extrabold block">3. حدد الفئة / المواصفات (Trim):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: '🌟 فول مواصفات / Full', value: 'فول مواصفات' },
                      { label: '✨ فئة SE / نص فول', value: 'فئة SE' },
                      { label: '🏆 فئة Limited / ليمتد', value: 'Limited' },
                      { label: '🚗 ستاندر / عادي', value: 'ستاندر' }
                    ].map(trim => {
                      const isSelected = selectedCarTrim === trim.value;
                      return (
                        <button
                          key={trim.value}
                          type="button"
                          onClick={() => {
                            setSelectedCarTrim(trim.value);
                            setFd(prev => ({
                              ...prev,
                              title: `${selectedCarModel || 'سيارة'} ${selectedCarYear || ''} ${trim.value}`.trim()
                            }));
                          }}
                          className={`p-2 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-300 shadow-md'
                              : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {trim.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Sub-categories for all categories */}
            {(() => {
              const subCategoryConfig: Record<string, { title: string; color: string; options: { label: string; value: string }[]; warning?: string }> = {
                gym: {
                  title: '🏋️‍♂️ اختر الفئة الفرعية للجم والرياضة:',
                  color: 'amber',
                  options: [
                    { label: '🧪 مكملات غذائية وبروتينات', value: 'مكملات غذائية' },
                    { label: '👕 ملابس وتجهيزات رياضية', value: 'ملابس جيم' },
                    { label: '🎒 حقائب وجنط رياضية', value: 'حقائب جيم' },
                    { label: '🏋️ معدات وأجهزة تمرين', value: 'معدات تمرين' },
                    { label: '🥤 شيكرات ومطارات ماء', value: 'شيكرات' }
                  ],
                  warning: '⚠️ تنبيه وإخلاء مسؤولية مهم للتاجر: يُمنع منعاً باتاً عرض أو بيع المنشطات، الهرمونات، أدوية التنشيف غير المرخّصة أو المواد المحظورة صحياً. يتحمل صاحب الحساب كامل المسؤولية القانونية والصحية أمام الجهات المختصة في العراق.'
                },
                phones: {
                  title: '📱 اختر نوع وهاتف الموبايل:',
                  color: 'purple',
                  options: [
                    { label: '🍎 آيفون iPhone', value: 'آيفون' },
                    { label: '📱 سامسونج Samsung', value: 'سامسونج' },
                    { label: '📱 شاومي Xiaomi', value: 'شاومي' },
                    { label: '📱 هواوي Huawei', value: 'هواوي' },
                    { label: '📱 أونر Honor', value: 'أونر' },
                    { label: '📱 بكسل Pixel', value: 'بكسل' },
                    { label: '📲 أيباد / تابلت iPad', value: 'أيباد وتابلت' },
                    { label: '🎧 ملحقات وإكسسوارات', value: 'إكسسوارات موبايل' }
                  ]
                },
                'real-estate': {
                  title: '🏡 اختر نوع العقار:',
                  color: 'emerald',
                  options: [
                    { label: '🏠 بيت / دار سكني', value: 'دار سكني' },
                    { label: '🏢 شقة تمليك / إيجار', value: 'شقة' },
                    { label: '🏞️ أرض سكنية / تجاري', value: 'أرض' },
                    { label: '🏪 محل / مكتب تجاري', value: 'محل تجاري' },
                    { label: '🏡 مزرعة / فيلا', value: 'مزرعة وفيلا' }
                  ]
                },
                electronics: {
                  title: '💻 اختر نوع الجهاز الإلكتروني:',
                  color: 'indigo',
                  options: [
                    { label: '💻 لاب توب / كمبيوتر', value: 'لاب توب' },
                    { label: '📺 شاشات وتلفزيونات', value: 'شاشات' },
                    { label: '🎧 سماعات واكسسوارات', value: 'سماعات واكسسوارات' },
                    { label: '📷 كاميرات وتصوير', value: 'كاميرات' },
                    { label: '🔌 أجهزة منزلية', value: 'أجهزة منزلية' }
                  ]
                }
              };

              const currentConfig = subCategoryConfig[fd.category];
              if (!currentConfig) return null;

              return (
                <div className="p-4 bg-gray-900/80 border border-amber-500/30 rounded-2xl space-y-3">
                  <label className="text-amber-400 text-xs font-black flex items-center gap-2">
                    {currentConfig.title}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {currentConfig.options.map(sub => {
                      const isSelected = (fd as any).subCategory === sub.value;
                      return (
                        <button
                          key={sub.value}
                          type="button"
                          onClick={() => {
                            setFd(prev => ({ ...prev, subCategory: sub.value }));
                          }}
                          className={`p-2.5 rounded-xl border text-[11px] font-extrabold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-400 shadow-md shadow-amber-500/20 scale-102 font-black'
                              : 'bg-gray-950/60 border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white'
                          }`}
                        >
                          <span>{sub.label}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {currentConfig.warning && (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-[11px] leading-relaxed flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-black text-red-400 mb-0.5">⚠️ تنبيه وإخلاء مسؤولية مهم للتاجر:</strong>
                        {currentConfig.warning}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">عنوان الإعلان</label>
              <input value={fd.title} onChange={e=>setFd({...fd,title:e.target.value})} maxLength={50} placeholder={dynamicPlaceholders.title} required className="w-full bg-gray-950/40 text-white rounded-2xl py-3.5 px-4 border border-gray-900/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all duration-300 placeholder-gray-500 text-sm font-semibold"/>
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

            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl hover:bg-amber-500/20 transition-all">
                <input type="checkbox" checked={fd.is_vip} onChange={e => setFd({...fd, is_vip: e.target.checked})} className="w-5 h-5 accent-amber-500 rounded" />
                <span className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4"/> تمييز الإعلان كـ VIP 
                </span>
              </label>
              {fd.is_vip && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl mt-2 flex items-center gap-3" dir="rtl">
                  <label className="text-amber-400 text-xs font-bold">مدة التمييز (أيام):</label>
                  <input type="number" min="1" max="365" value={fd.vip_days} onChange={e => setFd({...fd, vip_days: parseInt(e.target.value) || 1})} className="w-20 bg-gray-950 text-white border border-amber-500/30 rounded-lg px-2 py-1 text-center text-sm outline-none focus:border-amber-500" />
                  <span className="text-amber-300 text-xs font-bold mr-auto">تضاف {totalVipCost} نقطة إضافية</span>
                </div>
              )}
            </div>

            {/* 🛡️ مربع الموافقة على الشروط والتعهد القانوني */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="sr-only"
                    required
                  />
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 ${acceptedTerms ? 'bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/30' : 'bg-gray-900 border-gray-700 group-hover:border-amber-500/50'}`}>
                    {acceptedTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <div className="flex-1 text-xs font-bold text-gray-200 leading-snug">
                  <span>أوافق على </span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowTermsModal(!showTermsModal); }}
                    className="text-amber-400 hover:text-amber-300 underline font-black underline-offset-2 ml-0.5"
                  >
                    الشروط والأحكام والتعهد القانوني 🛡️
                  </button>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    يتعهد الناشر بصحة البيانات وتحمل كافة المسؤولية القانونية وتنزيه المنصة من أي مسألة.
                  </p>
                </div>
              </label>

              {/* التفاصيل القانونية الموسعة عند الضغط */}
              <AnimatePresence>
                {showTermsModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-amber-500/20 text-[11px] text-gray-300 font-medium space-y-1.5 leading-relaxed bg-black/30 p-3 rounded-xl mt-1"
                  >
                    <p className="font-bold text-amber-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> التعهد والمسؤولية القانونية للإعلان:
                    </p>
                    <p>1️⃣ <strong>حماية الزبون والمشتري</strong>: يتعهد الناشر بمصداقية الإعلان، مطابقة المعروضات للمواصفات المعلنة، والامتناع عن التدليس.</p>
                    <p>2️⃣ <strong>إخلاء مسؤولية المنصة</strong>: منصة (سوق بغداد الرقمي) وسيط إعلاني تقني فقط، ولا تتحمل أي مسؤولية قانونية أو مالية ناتجة عن البيع أو الشراء بين الأفراد.</p>
                    <p>3️⃣ <strong>مسؤولية الناشر القانونية</strong>: يتحمل المعلن كافة المساءلة والمسؤولية التامة أمام الجهات الرسمية في حال عرض مواد محظورة أو مسروقة أو غير مرخصة.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-900/60">
              <button type="button" onClick={()=>setTab('preview')} className="flex-1 py-3.5 bg-gray-950/40 text-amber-400 font-black rounded-2xl text-xs sm:text-sm border border-amber-500/20 hover:bg-gray-900/30 transition-all duration-300 shadow-md">
                👁️ معاينة العرض
              </button>
              <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={!acceptedTerms || uploading || (!isEdit && cost > 0 && (user.points || 0) < cost && user.role !== 'admin' && user.role !== 'owner')}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black rounded-2xl text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 shadow-lg shadow-amber-500/10">
                <div className="flex items-center gap-2">
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin"/> {pct}%</>
                  ) : (
                    <><Save className="w-4 h-4"/> {isEdit ? 'حفظ التعديلات' : 'نشر الإعلان كعرض'}</>
                  )}
                </div>
                {!isEdit && user.role !== 'admin' && user.role !== 'owner' && (cost + totalVipCost) > 0 && (
                  <span className="text-[9px] opacity-80 font-bold bg-black/10 px-2 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                    <Wallet className="w-2.5 h-2.5"/> يخصم {cost + totalVipCost} نقطة (متبقي {user.points || 0})
                  </span>
                )}
                {!isEdit && user.role !== 'admin' && user.role !== 'owner' && (cost + totalVipCost) === 0 && (
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
