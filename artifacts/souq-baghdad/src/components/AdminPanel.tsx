// ===========================================
// مسؤولية هذا الملف:
// لوحة تحكم المشرف (Admin Panel).
//
// يجلب البيانات من Supabase:
// - قائمة الإعلانات للمراجعة.
// - إجراءات الحذف والحظر.
//
// 🔒 وصول مقيّد:
// يجب أن يكون user.role === 'admin' أو 'owner' للوصول.
// تحقق من الـ guard في App.tsx قبل عرض هذا المكوّن.
//
// آمن للتعديل:
// نعم، لكن انتبه للصلاحيات وتأثير الحذف على البيانات.
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
  RefreshCw, TrendingDown, Clock, HelpCircle, Archive, ShoppingCart, Target, 
  Globe, Search as SearchIcon, ArrowLeft, MoreHorizontal, LayoutGrid,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, 
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';
import { ConfirmationDialog } from './ConfirmationDialog';

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

export function AdminPanel({ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose }:{ads:Ad[]; products:Product[]; transportAds:TransportAd[]; onDeleteAd:(id:number)=>void; onDeleteProduct:(id:string)=>void; onDeleteTransportAd:(id:number)=>void; onClose:()=>void}) {
  const [tab, setTab] = useState<'ads'|'products'|'transport'|'reports'|'users'|'settings'>('ads');
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [costs, setCosts] = useState<{ad:number; product:number; transport:number; vip_ad:number}>({ad:1, product:1, transport:1, vip_ad:5});
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{id: any, type: 'ad'|'product'|'transport'} | null>(null);
  const [deletingReport, setDeletingReport] = useState(false);

  useEffect(() => {
    if(tab === 'reports') {
      supabase.from('support_messages').select('*').order('created_at', { ascending: false }).limit(200).then(({data}) => {
        if(data) setReports(data.filter((msg: any) => msg.name && msg.name.startsWith('REPORT:')));
      });
    } else if(tab === 'users') {
      supabase.from('profiles').select('id, full_name, phone, points, created_at').order('created_at', { ascending: false }).limit(200).then(({data}) => {
        if(data) setUsers(data.map(u => ({ ...u, name: u.full_name })));
      });
    } else if (tab === 'settings') {
      supabase.from('system_settings').select('*').then(({data, error}) => {
        if(!error && data) {
          const c: any = { ad:1, product:1, transport:1, vip_ad:5 };
          data.forEach(r => { c[r.category] = r.cost; });
          setCosts(c);
        }
      });
    }
  }, [tab]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [cat, cost] of Object.entries(costs)) {
        await supabase.from('system_settings').upsert({ category: cat, cost: Number(cost) });
      }
      alert('تم حفظ أسعار الإعلانات بنجاح ✅');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-black pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-red-400"/></div>
            <div><h1 className="text-xl font-bold text-white">لوحة الإدارة</h1><p className="text-gray-400 text-xs">إدارة الإعلانات والمستخدمين والتسعير</p></div></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar mb-4">
          <button onClick={() => setTab('ads')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'ads' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>الإعلانات</button>
          <button onClick={() => setTab('products')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'products' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}>المنتجات</button>
          <button onClick={() => setTab('transport')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'transport' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>الخطوط</button>
          <button onClick={() => setTab('reports')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'reports' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>البلاغات</button>
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'users' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>المستخدمين ({users.length || '...'})</button>
          <button onClick={() => setTab('settings')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'settings' ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'}`}>الأسعار والنقاط</button>
        </div>

        {['ads','products','transport'].includes(tab) && (
          <div className="mb-4 relative">
            <Search className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2"/>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث بالاسم أو المعرف (ID)..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pr-10 outline-none focus:border-red-500"/>
          </div>
        )}

        {tab === 'ads' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            {(ads.filter(a => a.title?.includes(searchQuery) || String(a.id).includes(searchQuery) || String(a.short_id).includes(searchQuery)).length===0)?<div className="p-8 text-center text-gray-400">لا يوجد نتائج</div>:ads.filter(a => a.title?.includes(searchQuery) || String(a.id).includes(searchQuery) || String(a.short_id).includes(searchQuery)).map(ad=>(
              <div key={ad.id} className="flex items-center gap-3 p-3 border-b border-gray-700/50">
                <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" loading="lazy" decoding="async" className="w-12 h-12 rounded-lg object-cover"/>
                <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                  <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع</p></div>
                <button onClick={()=>setDeleteItem({id: ad.id, type: 'ad'})} className="p-2 bg-red-500/20 rounded-lg text-red-400" title="حذف الإعلان" aria-label="حذف الإعلان"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            {(products.filter(p => p.title?.includes(searchQuery) || String(p.id).includes(searchQuery)).length===0)?<div className="p-8 text-center text-gray-400">لا يوجد نتائج</div>:products.filter(p => p.title?.includes(searchQuery) || String(p.id).includes(searchQuery)).map(p=>(
              <div key={p.id} className="flex items-center gap-3 p-3 border-b border-gray-700/50">
                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover"/>
                <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{p.title}</p>
                  <p className="text-xs text-gray-400">{formatPrice(p.price)} د.ع</p></div>
                <button onClick={()=>setDeleteItem({id: p.id, type: 'product'})} className="p-2 bg-red-500/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        )}

        {tab === 'transport' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            {(transportAds.filter(t => (t.type === 'offer' ? 'خط متاح' : 'محتاج خط').includes(searchQuery) || t.university?.includes(searchQuery) || String(t.id).includes(searchQuery) || String(t.short_id).includes(searchQuery)).length===0)?<div className="p-8 text-center text-gray-400">لا يوجد نتائج</div>:transportAds.filter(t => (t.type === 'offer' ? 'خط متاح' : 'محتاج خط').includes(searchQuery) || t.university?.includes(searchQuery) || String(t.id).includes(searchQuery) || String(t.short_id).includes(searchQuery)).map(t=>(
              <div key={t.id} className="flex items-center gap-3 p-3 border-b border-gray-700/50">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center"><Car className="w-6 h-6 text-gray-400"/></div>
                <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{t.type === 'offer' ? 'خط متاح' : 'محتاج خط'} ({t.university})</p>
                  <p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع</p></div>
                <button onClick={()=>setDeleteItem({id: t.id, type: 'transport'})} className="p-2 bg-red-500/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        )}

        {tab === 'reports' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden p-4 space-y-3">
            {reports.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد بلاغات</p> : reports.map(rep => {
              let reportData: any = {};
              try { reportData = JSON.parse(rep.message); } catch(e) { reportData = { reason: rep.message }; }
              const isProduct = reportData.item_type === 'product';
              const isTransport = reportData.item_type === 'transport' || String(rep.name).includes('Transport');
              return (
                <div key={rep.id} className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold text-sm">{rep.name}</h4>
                      <p className="text-gray-400 text-xs mb-2">من: {rep.contact_info}</p>
                      <p className="text-orange-400 text-sm font-bold bg-orange-500/10 px-3 py-1.5 rounded-lg inline-block">السبب: {reportData.reason || 'مخالفة الشروط'}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={async () => {
                        if(confirm('هل أنت متأكد من حذف العنصر المُبلّغ عنه؟')) {
                          setDeletingReport(true);
                          if (isProduct) onDeleteProduct(reportData.item_id);
                          else if (isTransport) onDeleteTransportAd(reportData.item_id);
                          else onDeleteAd(reportData.item_id);
                          await supabase.from('support_messages').delete().eq('id', rep.id);
                          setReports(prev => prev.filter(r => r.id !== rep.id));
                          setDeletingReport(false);
                        }
                      }} disabled={deletingReport} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600">حذف العنصر</button>
                      <button onClick={async () => {
                        await supabase.from('support_messages').delete().eq('id', rep.id);
                        setReports(prev => prev.filter(r => r.id !== rep.id));
                      }} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-500">تجاهل البلاغ</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 grid grid-cols-3 gap-2 border-b border-gray-700 text-sm font-bold text-gray-400">
              <div>المستخدم</div>
              <div>الهاتف</div>
              <div className="text-left">النقاط</div>
            </div>
            {users.map(u => (
              <div key={u.id} className="p-4 grid grid-cols-3 gap-2 border-b border-gray-700/50 items-center">
                <div className="text-white text-sm truncate" title={u.name}>{u.name || 'مستخدم'}</div>
                <div className="text-gray-400 text-xs font-mono">{u.phone || '---'}</div>
                <div className="text-left font-bold text-amber-400 font-mono">{u.points || 0}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-white font-bold mb-4">تكلفة النشر (بالنقاط) لكل قسم</h3>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">قسم الإعلانات المبوبة</label>
                <input type="number" min="0" value={costs.ad} onChange={e => setCosts({...costs, ad: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">قسم المنتجات والتسوق</label>
                <input type="number" min="0" value={costs.product} onChange={e => setCosts({...costs, product: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">قسم خطوط النقل</label>
                <input type="number" min="0" value={costs.transport} onChange={e => setCosts({...costs, transport: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-amber-400 text-sm mb-2 font-bold">تكلفة تمييز إعلان VIP (تضاف للتكلفة الأصلية)</label>
                <input type="number" min="0" value={costs.vip_ad} onChange={e => setCosts({...costs, vip_ad: Number(e.target.value)})} className="w-full bg-gray-900 border border-amber-500/50 rounded-xl px-4 py-2 text-white outline-none focus:border-amber-500" />
              </div>
            </div>
            
            <button onClick={saveSettings} disabled={saving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Check className="w-5 h-5"/> حفظ التعديلات</>}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">تحديث الصفحة سيتم تلقائياً بعد الحفظ لتطبيق الأسعار الجديدة.</p>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => {
          if (deleteItem !== null) {
            if (deleteItem.type === 'ad') onDeleteAd(deleteItem.id);
            else if (deleteItem.type === 'product') onDeleteProduct(deleteItem.id);
            else if (deleteItem.type === 'transport') onDeleteTransportAd(deleteItem.id);
            setDeleteItem(null);
          }
        }}
        title="هل أنت متأكد من حذف الإعلان؟"
        description="سيتم حذف هذا الإعلان بشكل نهائي من المنصة ولا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف الإعلان نهائياً"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
