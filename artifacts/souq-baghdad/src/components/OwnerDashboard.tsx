import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  X, ShieldAlert, Sparkles, Shield, UserX, AlertCircle, Ban, 
  Users, Activity, Crown, FileText, ShoppingBag, Package, Store, 
  Trash2, ArrowRight, Eye, CheckCircle2, ChevronRight, ChevronLeft, Search, 
  Clock, Bell, Lock, User as UserIcon, Phone, Check, RefreshCw,
  Globe, Smartphone, Monitor, Tablet, MapPin, BarChart3, Star,
  UserCheck, Key, CheckCircle, Loader2, Mail, Car, Layers, Ticket, Copy, Settings
} from 'lucide-react';
import { useOnlineStatuses } from '../hooks/useOnlineStatuses';
import type { Ad, Product, User, StoredUser, Visit, SystemLog, TransportAd } from '../types';
import { formatPrice } from '../utils/format';
import { logSystemAction } from '../utils/logs';
import { getGlowClass, getWhatsAppResetLink } from '../utils/helpers';
import { ViewersModal } from './ViewersModal';

export default function OwnerDashboard({ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose, onDeleteProfile }: {
  ads:Ad[];
  products:Product[];
  transportAds:TransportAd[];
  onDeleteAd:(id:string|number)=>void;
  onDeleteProduct:(id:string|number)=>void;
  onDeleteTransportAd:(id:number)=>void;
  onClose:()=>void;
  onDeleteProfile?:(id:string)=>void;
}) {
  const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'reports'|'logs'|'changelog'|'settings'|'promo_codes'>('overview');
  const [costs, setCosts] = useState<{ad:number; product:number; transport:number}>({ad:1, product:1, transport:1});
  const [savingSettings, setSavingSettings] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbGuests, setDbGuests] = useState<any[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // Dashboard Pagination
  const [visibleUsers, setVisibleUsers] = useState(4);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [visibleGuests, setVisibleGuests] = useState(4);
  const [visibleLogs, setVisibleLogs] = useState(4);
  const [visibleVisits, setVisibleVisits] = useState(4);
  const [visibleDashboardAds, setVisibleDashboardAds] = useState(4);
  const [visibleDashboardProducts, setVisibleDashboardProducts] = useState(4);
  const [visibleDashboardLines, setVisibleDashboardLines] = useState(4);
  const [logFilter, setLogFilter] = useState('');

  const filteredDbUsers = useMemo(() => {
    return dbUsers.filter(u => 
      !userSearchQuery || 
      (u.phone && u.phone.includes(userSearchQuery)) ||
      (u.full_name && u.full_name.includes(userSearchQuery)) ||
      (u.email && u.email.includes(userSearchQuery))
    );
  }, [dbUsers, userSearchQuery]);

  useEffect(() => {
    const loadLogs = () => {
      try { setSystemLogs(JSON.parse(localStorage.getItem('souq_system_logs') || '[]')); } catch {}
    };
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);


  
  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [viewersModalItem, setViewersModalItem] = useState<{id:string|number, type:'ad'|'product'|'transport'}|null>(null);
  const onlineStatuses = useOnlineStatuses();

  useEffect(()=>{
    try{setStoredUsers(JSON.parse(localStorage.getItem('souqUsers')||'[]'));}catch{}
    try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}
    const iv=setInterval(()=>{try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}},30_000);
    
    
    const fetchVerification = async () => {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select(`*, profiles(full_name, phone, email)`)
          .order('created_at', { ascending: false });
        if (data && !error) setVerificationRequests(data);
      } catch (err) {}
    };
    fetchVerification();
const fetchRecovery = async () => {
      try {
        const { data, error } = await supabase
          .from('recovery_requests')
          .select(`*, profiles(full_name, phone, email)`)
          .order('request_time', { ascending: false });
        if (data && !error) setRecoveryRequests(data);
      } catch (err) {}
    };
    fetchRecovery();

    const fetchUsersAndGuests = async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*').order('last_seen', { ascending: false });
        if (profiles) setDbUsers(profiles);
        const { data: guests } = await supabase.from('guests').select('*').order('last_seen', { ascending: false });
        if (guests) setDbGuests(guests);
      } catch (err) {}
    };
    fetchUsersAndGuests();
    const fetchInterval = setInterval(fetchUsersAndGuests, 60_000);

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) {
          const reportMessages = data.filter((msg: any) => msg.name && msg.name.startsWith('REPORT:'));
          setReports(reportMessages);
        }
      } catch (err) {}
    };
    fetchReports();
    const reportInterval = setInterval(fetchReports, 30_000);

    const fetchPromoCodes = async () => {
      try {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*, profiles:used_by(name, phone)')
          .order('created_at', { ascending: false });
        if (data && !error) {
          setPromoCodes(data);
        }
      } catch (err) {}
    };
    fetchPromoCodes();
    const promoInterval = setInterval(fetchPromoCodes, 60_000);

    return () => { 
      clearInterval(iv); 
      clearInterval(fetchInterval); 
      clearInterval(reportInterval); 
      clearInterval(promoInterval);
    };
  },[]);

  useEffect(() => {
    if (tab === 'settings') {
      supabase.from('system_settings').select('*').then(({data, error}) => {
        if(!error && data) {
          const c: any = { ad:1, product:1, transport:1 };
          data.forEach(r => { c[r.category] = r.cost; });
          setCosts(c);
        }
      });
    }
  }, [tab]);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      for (const [cat, cost] of Object.entries(costs)) {
        await supabase.from('system_settings').upsert({ category: cat, cost: Number(cost) });
      }
      alert('تم حفظ أسعار الإعلانات بنجاح ✅');
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ');
    }
    setSavingSettings(false);
  };

  // Calculate stats
  const today = new Date().toDateString();
  const todayV = visits.filter(v=>new Date(v.timestamp).toDateString()===today);
  const DEVICE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6'];
  const deviceData=[{name:'موبايل',value:visits.filter(v=>v.device==='mobile').length},{name:'كمبيوتر',value:visits.filter(v=>v.device==='desktop').length},{name:'تابلت',value:visits.filter(v=>v.device==='tablet').length}].filter(d=>d.value>0);
  const locMap:Record<string,number>={};
  visits.forEach(v=>{locMap[v.location]=(locMap[v.location]||0)+1;});
  const locData=Object.entries(locMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({name,value}));
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return{name:`${d.getDate()}/${d.getMonth()+1}`,زيارات:visits.filter(v=>new Date(v.timestamp).toDateString()===d.toDateString()).length};}).reverse();
  
  // Financial & Market stats
  const parsePrice = (p: string) => {
    if(!p) return 0;
    const num = Number(p.toString().replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? 0 : num;
  };
  const totalMarketValue = ads.reduce((s,a)=>s+parsePrice(a.price),0) + products.reduce((s,p)=>s+parsePrice(p.price),0);
  const formatter = new Intl.NumberFormat('en-US');
  
  const allContent = [...ads, ...products];
  const mostViewed = allContent.sort((a,b)=>b.views - a.views)[0];
  
  const catMap:Record<string,number>={};
  ads.forEach(a=>{catMap[a.category]=(catMap[a.category]||0)+1;});
  const topCategory = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'لا يوجد';

  // Actions
  const toggleBan = async (id: string) => {
    const user = dbUsers.find(u => u.id === id);
    if (!user) return;
    const newStatus = !user.is_banned;
    setDbUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: newStatus } : u));
    try {
      await supabase.from('profiles').update({ is_banned: newStatus }).eq('id', id);
    } catch (e) {
      console.error('Failed to toggle ban', e);
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    setDbUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    } catch (e) {
      console.error('Failed to change role', e);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!broadcastTitle || !broadcastMsg) return;
    setIsBroadcasting(true);
    try {
      const userIds = dbUsers.map(u => u.id).filter(id => id);
      if (userIds.length > 0) {
        const notifications = userIds.map(uid => ({
          user_id: uid,
          title: broadcastTitle,
          body: broadcastMsg,
          type: 'system',
          audience: 'all',
          read: false
        }));
        
        const chunkSize = 100;
        for (let i = 0; i < notifications.length; i += chunkSize) {
          const chunk = notifications.slice(i, i + chunkSize);
          await supabase.from('user_notifications').insert(chunk);
        }
      }
      logSystemAction('إرسال إشعار عام', `عنوان الإشعار: ${broadcastTitle}`, 'جميع المستخدمين');
      setBroadcastSent(true);
      setTimeout(() => { setBroadcastTitle(''); setBroadcastMsg(''); setBroadcastSent(false); }, 3000);
    } catch (err) {
      console.error('Broadcast failed:', err);
      alert('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const generatePromoCode = async (points: number, prefix: string = '') => {
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = prefix ? `${prefix}-${randomString}` : randomString;
    
    try {
      const { data, error } = await supabase.from('promo_codes').insert({
        code,
        points,
        is_used: false
      }).select().single();
      
      if (error) throw error;
      setPromoCodes(prev => [data, ...prev]);
      alert(`تم توليد الكود بنجاح: ${code}`);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء توليد الكود');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c2b5e] pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-6 h-6 text-black"/></div>
            <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-white">داشبورت المالك</h1><span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">🚀 الإصدار v1.2</span></div><p className="text-amber-400 text-xs mt-0.5">تحليلات شاملة وإدارة كاملة للموقع المنصة حية ومتصلة</p></div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>
        
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[{l:'زيارات اليوم',v:todayV.length,icon:<Activity className="w-5 h-5"/>,c:'text-green-400',bg:'bg-green-500/10 border-green-500/20'},
            {l:'إجمالي الزيارات',v:visits.length,icon:<Globe className="w-5 h-5"/>,c:'text-blue-400',bg:'bg-blue-500/10 border-blue-500/20'},
            {l:'المستخدمون',v:storedUsers.length,icon:<Users className="w-5 h-5"/>,c:'text-purple-400',bg:'bg-purple-500/10 border-purple-500/20'},
            {l:'المحتوى',v:ads.length+products.length,icon:<Layers className="w-5 h-5"/>,c:'text-amber-400',bg:'bg-amber-500/10 border-amber-500/20'}].map((s,i)=>(
            <div key={i} className={`${s.bg} rounded-2xl p-4 border text-center`}>
              <div className={`flex justify-center mb-2 ${s.c}`}>{s.icon}</div>
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {([['overview','📊 نظرة عامة'],['promo_codes','🎟️ الأكواد الترويجية'],['settings','⚙️ التسعير والنقاط'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['reports','🚩 التقارير والبلاغات'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل العمليات'],['changelog','🚀 نسخة برو (التحديثات)']] as [string,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab===t?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{l}</button>
          ))}
        </div>
        
        {tab==='overview'&&(
          <div className="space-y-5">
            {/* Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-amber-400 mb-1"><BarChart3 className="w-6 h-6"/></span>
                <p className="text-gray-300 text-xs mb-1">إجمالي القيمة السوقية</p>
                <h3 className="text-white text-2xl font-bold" dir="ltr">{formatter.format(totalMarketValue)} <span className="text-amber-500 text-sm">IQD</span></h3>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-emerald-400 mb-1"><Star className="w-6 h-6"/></span>
                <p className="text-gray-300 text-xs mb-1">الإعلان الأكثر مشاهدة</p>
                <h3 className="text-white text-lg font-bold line-clamp-1">{mostViewed?.title || 'لا يوجد'}</h3>
                <span className="text-gray-500 text-xs">{mostViewed?.views || 0} مشاهدة</span>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-purple-400 mb-1"><Package className="w-6 h-6"/></span>
                <p className="text-gray-300 text-xs mb-1">القسم الأكثر نشاطاً</p>
                <h3 className="text-white text-lg font-bold">{topCategory}</h3>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-amber-400"/>الزيارات آخر 7 أيام</h3>
              {visits.length===0?<div className="h-40 flex items-center justify-center text-gray-500 text-sm">لا توجد زيارات مسجلة بعد</div>:(
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={last7} margin={{top:5,right:5,left:-20,bottom:5}}>
                    <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize:11}} tickLine={false}/>
                    <YAxis stroke="#6b7280" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                    <Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'12px',color:'#fff'}}/>
                    <Bar dataKey="زيارات" fill="#f59e0b" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-400"/>حسب الجهاز</h3>
                {deviceData.length===0?<p className="text-gray-500 text-sm text-center py-6">لا بيانات</p>:(
                  <>
                    <ResponsiveContainer width="100%" height={140}><PieChart><Pie data={deviceData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">{deviceData.map((_,i)=><Cell key={i} fill={DEVICE_COLORS[i%3]}/>)}</Pie><Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'12px',color:'#fff'}}/><Legend formatter={v=><span style={{color:'#d1d5db',fontSize:11}}>{v}</span>}/></PieChart></ResponsiveContainer>
                    <div className="mt-2 space-y-1.5">
                      {deviceData.map((d,i)=>(
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:DEVICE_COLORS[i%3]}}/>
                          <span className="text-gray-300 text-xs flex-1">{d.name}</span>
                          <div className="w-20 h-1.5 bg-gray-700 rounded-full"><div className="h-full rounded-full" style={{width:`${Math.round(d.value/visits.length*100)}%`,background:DEVICE_COLORS[i%3]}}/></div>
                          <span className="text-white text-xs font-bold w-6">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-green-400"/>حسب الموقع</h3>
                {locData.length===0?<p className="text-gray-500 text-sm text-center py-6">لا بيانات</p>:(
                  <div className="space-y-2">
                    {locData.map((d,i)=>{const pct=visits.length?Math.round(d.value/visits.length*100):0;return(
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-14 text-right flex-shrink-0">{d.name}</span>
                        <div className="flex-1 h-2.5 bg-gray-700 rounded-full"><motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:i*0.05,duration:0.6}} className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"/></div>
                        <span className="text-amber-400 text-xs font-bold w-6">{d.value}</span>
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {tab==='visitors'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="sticky top-[4rem] z-20 bg-gray-900/95 backdrop-blur-md p-4 border-b border-gray-750 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-bold">سجل الزيارات ({visits.length})</h3>
                <span className="text-gray-400 text-xs">تم العثور على {visits.length} زيارة، يتم عرض {Math.min(visibleVisits, visits.length)} من أصل {visits.length}</span>
              </div>
              <button onClick={()=>{try{localStorage.removeItem('souqVisits');}catch{}setVisits([]);}} className="text-xs text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3"/>مسح</button>
            </div>
            {visits.length===0?<div className="p-10 text-center"><Globe className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">لا توجد زيارات</p></div>:(
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50"><tr>{['الوقت','الجهاز','الموقع','المستخدم'].map(h=><th key={h} className="text-right py-3 px-4 text-gray-400 font-medium text-xs">{h}</th>)}</tr></thead>
                  <tbody>
                    {visits.slice(0, visibleVisits).map((v,i)=>(
                      <tr key={i} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-2.5 px-4 text-gray-300 text-xs">{new Date(v.timestamp).toLocaleString('ar-IQ',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}</td>
                        <td className="py-2.5 px-4"><span className={`flex items-center gap-1 text-xs ${v.device==='mobile'?'text-amber-400':v.device==='tablet'?'text-purple-400':'text-blue-400'}`}>{v.device==='mobile'?<Smartphone className="w-3 h-3"/>:v.device==='tablet'?<Tablet className="w-3 h-3"/>:<Monitor className="w-3 h-3"/>}{v.device==='mobile'?'موبايل':v.device==='tablet'?'تابلت':'كمبيوتر'}</span></td>
                        <td className="py-2.5 px-4 text-gray-300 text-xs">{v.location}</td>
                        <td className="py-2.5 px-4 text-gray-300 text-xs">{v.userName||<span className="text-gray-500">زائر</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visibleVisits < visits.length && (
                <div className="text-center py-4 border-t border-gray-700/50">
                  <p className="text-gray-400 text-xs mb-2">تم العثور على {visits.length} زيارة، يتم عرض {Math.min(visibleVisits, visits.length)} من أصل {visits.length}</p>
                  <button onClick={() => setVisibleVisits(prev => prev + 4)} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition-all">
                    عرض المزيد 👥
                  </button>
                </div>
              )}
            </>)}
          </div>
        )}
        
        {tab==='users'&&(
          <div className="space-y-3">
            {/* Sticky Counts stats banner */}
            <div className="sticky top-[4rem] z-20 bg-gray-900/95 backdrop-blur-md py-3 px-4 border border-gray-700 rounded-2xl mb-3 flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-gray-350 font-bold text-xs">إدارة الحسابات المسجلة</p>
                <p className="text-gray-450 text-xs">تم العثور على {filteredDbUsers.length} مستخدم، يتم عرض {Math.min(visibleUsers, filteredDbUsers.length)}</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2"/>
                <input 
                  type="text" 
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الهاتف أو الاسم أو الإيميل..."
                  className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-xl px-4 py-2.5 pr-9 outline-none focus:border-amber-500"
                />
              </div>
            </div>
            {selectedUserIds.length > 0 && (
               <div className="flex justify-between items-center bg-gray-800 p-3 rounded-xl border border-red-500/30 mb-3">
                 <span className="text-red-400 font-bold">تم تحديد {selectedUserIds.length} حسابات</span>
                 <button onClick={async () => {
                    if (window.confirm(`هل أنت متأكد من حذف ${selectedUserIds.length} حسابات نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                      for (const uid of selectedUserIds) {
                         if (onDeleteProfile) onDeleteProfile(uid);
                      }
                      setDbUsers(prev => prev.filter(u => !selectedUserIds.includes(u.id)));
                      setSelectedUserIds([]);
                    }
                 }} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-600">
                    <Trash2 className="w-4 h-4"/> حذف الكل
                 </button>
               </div>
            )}
            {filteredDbUsers.length===0?<div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700"><Users className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">لا مستخدمون بعد</p></div>:filteredDbUsers.slice(0, visibleUsers).map(u=>{
              const isOnline = new Date().getTime() - new Date(u.last_seen || 0).getTime() < 5 * 60 * 1000;
              
              return (
              <div key={u.id} className={`bg-gray-800 rounded-2xl p-4 border ${u.is_banned?'border-red-500/30':'border-gray-700'} flex flex-col sm:flex-row sm:items-center gap-3 relative`}>
                {u.role !== 'owner' && (
                  <input type="checkbox" className="w-5 h-5 accent-red-500 rounded cursor-pointer hidden sm:block flex-shrink-0" title="تحديد المستخدم" aria-label="تحديد المستخدم" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                    else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                  }} />
                )}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-shrink-0">
                  <img src={u.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-12 h-12 rounded-full object-cover ${u.is_banned ? 'border-2 border-red-500/50' : (u.role && u.role !== 'user' ? getGlowClass(u.role) : 'border border-gray-600')}`}/>
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'غير متصل'}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {u.role !== 'owner' && (
                      <input type="checkbox" className="w-4 h-4 accent-red-500 rounded cursor-pointer sm:hidden flex-shrink-0" title="تحديد المستخدم" aria-label="تحديد المستخدم" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                        else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                      }} />
                    )}
                    <p className="text-white font-bold text-sm">{u.full_name}</p>
                    {u.is_banned&&<span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">موقوف</span>}
                    {u.role==='owner'&&<span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full flex items-center gap-0.5"><Crown className="w-2.5 h-2.5"/>مالك</span>}
                    {u.role==='admin'&&<span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full flex items-center gap-0.5"><Shield className="w-2.5 h-2.5"/>مشرف</span>}
                    {u.role==='vendor'&&<span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full flex items-center gap-0.5"><UserCheck className="w-2.5 h-2.5"/>تاجر موثق</span>}
                    {u.role==='pro'&&<span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full flex items-center gap-0.5"><Star className="w-2.5 h-2.5"/>برو</span>}
                  </div>
                  <p className="text-gray-400 text-xs">{u.email || u.phone}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">{u.city} • آخر ظهور: {u.last_seen ? new Date(u.last_seen).toLocaleString('ar-IQ') : 'غير معروف'}</p>
                </div>
                
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-center">
                    <p className="text-[10px] text-gray-400">الرصيد</p>
                    <p className="font-bold text-amber-400 font-mono text-sm">{u.points || 0}</p>
                  </div>
                </div>

                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0 flex-wrap justify-end">
                  <button onClick={() => alert('تفاصيل المستخدم: \n' + JSON.stringify(u, null, 2))} className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl" title="معلومات المستخدم"><Eye className="w-4 h-4"/></button>
                  {u.role !== 'owner' && (
                    <button onClick={() => {
                      if(window.confirm('تنبيه: سيتم حذف هذا الحساب نهائياً مع كافة إعلاناته المرتبطة به. هل أنت متأكد؟')) {
                        if(onDeleteProfile) onDeleteProfile(u.id);
                        setDbUsers(prev => prev.filter(usr => usr.id !== u.id));
                      }
                    }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" title="حذف الحساب">
                      <Trash2 className="w-3.5 h-3.5"/> حذف الحساب
                    </button>
                  )}
                  {u.role !== 'owner' && (
                    <select title="تغيير الدور" aria-label="تغيير الدور" 
                      value={u.role || 'user'} 
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
                    >
                      <option value="user">مستخدم عادي</option>
                      <option value="vendor">تاجر موثق</option>
                      <option value="admin">مشرف منصة</option>
                      <option value="pro">برو (Pro)</option>
                    </select>
                  )}
                  {u.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={async () => {
                          if(confirm('هل أنت متأكد من إعادة تعيين كلمة المرور إلى 123456؟')) {
                            try {
                              const { error } = await supabase.rpc('admin_reset_password', { target_user_id: u.id, new_password: '123456' });
                              if(error) throw error;
                              alert('تم تغيير كلمة المرور بنجاح إلى: 123456');
                            } catch(e:any) {
                              alert('فشل في إعادة التعيين: ' + e.message);
                            }
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                      >
                        <Key className="w-3.5 h-3.5"/> تصفير الرمز (123456)
                      </button>
                      {u.phone && (
                        <a 
                          href={getWhatsAppResetLink(u.phone)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                          title="إرسال رسالة واتساب بالتفاصيل الجديدة"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> واتساب
                        </a>
                      )}
                    </div>
                  )}
                  {u.role!=='owner'&&<button onClick={()=>toggleBan(u.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border ${u.is_banned?'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20':'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}>
                    {u.is_banned?<><UserCheck className="w-3.5 h-3.5"/>رفع الإيقاف</>:<><UserX className="w-3.5 h-3.5"/>حظر</>}</button>}
                </div>
              </div>
            );})}
            {visibleUsers < dbUsers.length && (
              <div className="text-center py-4 border-t border-gray-700/50">
                <p className="text-gray-400 text-xs mb-2">تم العثور على {dbUsers.length} مستخدم، يتم عرض {Math.min(visibleUsers, dbUsers.length)} من أصل {dbUsers.length}</p>
                <button onClick={() => setVisibleUsers(prev => prev + 4)} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition-all shadow-md">
                  عرض المزيد 🧑‍💼
                </button>
              </div>
            )}
          </div>
        )}
        
        {tab==='content'&&(
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3><span className="text-gray-400 text-xs">{ads.reduce((s,a)=>s+a.views,0)} مشاهدة</span></div>
              {ads.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا إعلانات</div>: (
                <>
                  {ads.slice(0, visibleDashboardAds).map(ad=>(
                    <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                      <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                      <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                        <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • <button onClick={() => setViewersModalItem({id: ad.id, type: 'ad'})} className="hover:text-amber-400">{ad.views} 👁</button></p></div>
                      <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0" title="حذف الإعلان" aria-label="حذف الإعلان"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {visibleDashboardAds < ads.length && (
                    <div className="text-center py-2.5 border-t border-gray-700 bg-gray-900/40">
                      <button onClick={() => setVisibleDashboardAds(prev => prev + 4)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-bold transition">
                        عرض المزيد من الإعلانات ({Math.min(visibleDashboardAds, ads.length)} من {ads.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">المنتجات ({products.length})</h3><span className="text-gray-400 text-xs">{products.reduce((s,p)=>s+p.views,0)} مشاهدة</span></div>
              {products.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا منتجات</div>: (
                <>
                  {products.slice(0, visibleDashboardProducts).map(p=>(
                    <div key={p.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                      <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • <button onClick={() => setViewersModalItem({id: p.id, type: 'product'})} className="hover:text-amber-400">{p.views} 👁</button> • {p.condition==='new'?'جديد':'مستعمل'}</p></div>
                      <button onClick={()=>onDeleteProduct(p.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0" title="حذف المنتج" aria-label="حذف المنتج"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {visibleDashboardProducts < products.length && (
                    <div className="text-center py-2.5 border-t border-gray-700 bg-gray-900/40">
                      <button onClick={() => setVisibleDashboardProducts(prev => prev + 4)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-bold transition">
                        عرض المزيد من المنتجات ({Math.min(visibleDashboardProducts, products.length)} من {products.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">خطوط النقل ({transportAds.length})</h3><span className="text-gray-400 text-xs">{transportAds.reduce((s,t)=>s+(t.views||0),0)} مشاهدة</span></div>
              {transportAds.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا يوجد خطوط نقل</div>: (
                <>
                  {transportAds.slice(0, visibleDashboardLines).map(t=>(
                    <div key={t.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                      <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Car className="w-6 h-6 text-gray-400"/>
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{t.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'} ({t.university})</p>
                        <p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • <button onClick={() => setViewersModalItem({id: t.id, type: 'transport'})} className="hover:text-amber-400">{t.views||0} 👁</button></p></div>
                      <button onClick={()=>onDeleteTransportAd(t.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0" title="حذف خط النقل" aria-label="حذف خط النقل"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {visibleDashboardLines < transportAds.length && (
                    <div className="text-center py-2.5 border-t border-gray-700 bg-gray-900/40">
                      <button onClick={() => setVisibleDashboardLines(prev => prev + 4)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-bold transition">
                        عرض المزيد من خطوط النقل ({Math.min(visibleDashboardLines, transportAds.length)} من {transportAds.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        
        {tab==='recovery'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">طلبات استعادة الحسابات ({recoveryRequests.length})</h3></div>
            {recoveryRequests.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا توجد طلبات</div>:
            <div className="space-y-3 p-4">
              {recoveryRequests.map(req => (
                <div key={req.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-bold">{req.profiles?.full_name || 'مستخدم غير معروف'}</p>
                      <p className="text-xs text-gray-400">البريد: {req.profiles?.email} • الهاتف: {req.profiles?.phone}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${req.status==='pending'?'bg-amber-500/20 text-amber-400':'bg-green-500/20 text-green-400'}`}>
                      {req.status==='pending' ? 'قيد المراجعة' : 'تمت المعالجة'}
                    </span>
                  </div>
                  {req.notes && <div className="mt-2 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700"><p className="text-xs text-gray-500 mb-1">تفاصيل الإثبات أو المشكلة:</p>{req.notes}</div>}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
                    <button onClick={async () => {
                      await supabase.from('recovery_requests').update({ status: req.status === 'pending' ? 'resolved' : 'pending' }).eq('id', req.id);
                      setRecoveryRequests(prev => prev.map(r => r.id === req.id ? {...r, status: req.status === 'pending' ? 'resolved' : 'pending'} : r));
                    }} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${req.status==='pending'?'bg-green-500/10 border-green-500/20 text-green-400':'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                      {req.status==='pending' ? 'تحديد كـ "تمت المعالجة"' : 'إعادة إلى "قيد المراجعة"'}
                    </button>
                    {req.profiles?.phone && (
                      <a href={getWhatsAppResetLink(req.profiles.phone)} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                        تواصل واتساب
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            }
          </div>
        )}
        
        
        <AnimatePresence>
          {viewersModalItem && <ViewersModal itemId={viewersModalItem.id} itemType={viewersModalItem.type} onClose={() => setViewersModalItem(null)} />}
        </AnimatePresence>

        {tab==='verification'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">طلبات توثيق الهوية ({verificationRequests.length})</h3></div>
            {verificationRequests.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا توجد طلبات</div>:
            <div className="space-y-3 p-4">
              {verificationRequests.map(req => (
                <div key={req.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-bold">{req.profiles?.full_name || 'مستخدم'}</p>
                      <p className="text-xs text-gray-400">الهاتف: {req.profiles?.phone}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${req.status==='pending'?'bg-amber-500/20 text-amber-400':req.status==='approved'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>
                      {req.status==='pending' ? 'قيد المراجعة' : req.status==='approved' ? 'تمت الموافقة' : 'مرفوض'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <img src={req.id_image_url} alt="ID" className="w-full max-w-sm rounded-lg border border-gray-700 object-contain" />
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
                    <button onClick={async () => {
                      await supabase.from('verification_requests').update({ status: 'approved' }).eq('id', req.id);
                      setVerificationRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'approved'} : r));
                    }} className="flex-1 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-bold">موافقة</button>
                    <button onClick={async () => {
                      await supabase.from('verification_requests').update({ status: 'rejected' }).eq('id', req.id);
                      setVerificationRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'rejected'} : r));
                    }} className="flex-1 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold">رفض</button>
                  </div>
                </div>
              ))}
            </div>
            }
          </div>
        )}

        {tab==='reports'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-bold">البلاغات والتقارير ({reports.length})</h3>
            </div>
            {reports.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا توجد بلاغات حالياً</div>:
            <div className="space-y-3 p-4">
              {reports.map((rep: any) => {
                let reportData: any = {};
                try {
                  reportData = JSON.parse(rep.message);
                } catch(e) {
                  reportData = { reason: rep.message };
                }
                const isProduct = reportData.item_type === 'product';
                return (
                  <div key={rep.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">🚩</span>
                        <p className="text-white font-bold">{rep.name || 'بلاغ محتوى'}</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                          {isProduct ? 'منتج' : 'إعلان'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">المُبلغ: {rep.contact_info}</p>
                      <p className="text-sm text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg inline-block">
                        سبب البلاغ: {reportData.reason || 'محتوى غير لائق'}
                      </p>
                      <p className="text-[10px] text-gray-500">التاريخ: {new Date(rep.created_at || Date.now()).toLocaleString('ar-IQ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={async () => {
                          if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المحتوى نهائياً؟')) {
                            if (isProduct) {
                              onDeleteProduct(reportData.item_id);
                            } else {
                              onDeleteAd(reportData.item_id);
                            }
                            await supabase.from('support_messages').delete().eq('id', rep.id);
                            setReports(prev => prev.filter(r => r.id !== rep.id));
                          }
                        }} 
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
                      >
                        حذف المحتوى المخالف
                      </button>
                      <button 
                        onClick={async () => {
                          await supabase.from('support_messages').delete().eq('id', rep.id);
                          setReports(prev => prev.filter(r => r.id !== rep.id));
                        }} 
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-lg text-xs"
                      >
                        تجاهل البلاغ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            }
          </div>
        )}

        {tab==='promo_codes'&&(
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center"><Ticket className="w-6 h-6 text-amber-500"/></div>
                <div>
                  <h2 className="text-white font-bold text-lg">الأكواد الترويجية (البرومو كود)</h2>
                  <p className="text-gray-400 text-xs">توليد وإدارة الأكواد لشحن رصيد المشتركين</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <button onClick={() => generatePromoCode(50, 'GIFT')} className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-xl flex flex-col items-center justify-center hover:opacity-90">
                  <span className="text-xl mb-1">🎁 50 نقطة</span>
                  <span className="text-xs opacity-80">كود هدية (GIFT)</span>
                </button>
                <button onClick={() => generatePromoCode(100)} className="flex-1 py-4 bg-gray-700 text-white font-bold rounded-xl flex flex-col items-center justify-center border border-gray-600 hover:bg-gray-600">
                  <span className="text-xl mb-1">💳 100 نقطة</span>
                  <span className="text-xs text-gray-400">كود اعتيادي</span>
                </button>
                <button onClick={() => generatePromoCode(500, 'PRO')} className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl flex flex-col items-center justify-center hover:opacity-90">
                  <span className="text-xl mb-1">🌟 500 نقطة</span>
                  <span className="text-xs opacity-80">كود كبار الشخصيات (PRO)</span>
                </button>
              </div>

              <h3 className="text-white font-bold mb-4">الأكواد السابقة ({promoCodes.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-gray-900/50 text-gray-400 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-tr-xl">الكود</th>
                      <th className="px-4 py-3">النقاط</th>
                      <th className="px-4 py-3">الحالة</th>
                      <th className="px-4 py-3">المستخدم</th>
                      <th className="px-4 py-3 rounded-tl-xl">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.slice(0, 50).map((promo) => (
                      <tr key={promo.id} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3 font-mono text-amber-400 font-bold flex items-center gap-2">
                          {promo.code}
                          <button onClick={() => { navigator.clipboard.writeText(promo.code); alert('تم نسخ الكود!'); }} className="text-gray-400 hover:text-white" title="نسخ"><Copy className="w-4 h-4"/></button>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">+{promo.points}</td>
                        <td className="px-4 py-3">
                          {promo.is_used ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs">تم الاستخدام</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">متاح</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {promo.profiles?.name || promo.profiles?.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{new Date(promo.created_at).toLocaleDateString('ar-IQ')}</td>
                      </tr>
                    ))}
                    {promoCodes.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-500">لا توجد أكواد مولدة بعد</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab==='broadcast'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6 text-amber-500"/></div>
              <div>
                <h2 className="text-white font-bold text-lg">إرسال إشعار للجميع</h2>
                <p className="text-gray-400 text-xs">سيصل هذا الإشعار كرسالة منبثقة في التطبيق لجميع المستخدمين ({storedUsers.length} مستخدم).</p>
              </div>
            </div>

            {broadcastSent ? (
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3"/>
                <h3 className="text-green-400 font-bold text-lg mb-1">تم إرسال الإشعار بنجاح!</h3>
                <p className="text-gray-300 text-sm">سيتمكن المستخدمون من رؤيته عند فتحهم للتطبيق أو تحديثهم للصفحة.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-1.5">عنوان الإشعار</label>
                  <input required value={broadcastTitle} onChange={e=>setBroadcastTitle(e.target.value)}
                    placeholder="مثال: تحديث جديد في سوك بغداد!"
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-1.5">نص الرسالة</label>
                  <textarea required value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} rows={4}
                    placeholder="اكتب رسالتك لجميع المستخدمين هنا..."
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
                <button type="submit" disabled={isBroadcasting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
                  {isBroadcasting ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Mail className="w-5 h-5"/> إرسال الإشعار الآن</>}
                </button>
              </form>
            )}
          </div>
        )}


        {tab==='logs'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="sticky top-[4rem] z-20 bg-gray-900/95 backdrop-blur-md p-5 border-b border-gray-750 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">📋 سجل تغييرات وعمليات النظام</h3>
                <p className="text-gray-400 text-xs mt-1">تتبع كافة تحديثات وإجراءات الإدارة والمشرفين فور حدوثها</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input type="text" placeholder="بحث في السجل..." value={logFilter} onChange={e=>setLogFilter(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 flex-1 md:w-48" />
                <button onClick={()=>{if(confirm('هل انت متأكد من مسح جميع السجلات؟')){localStorage.removeItem('souq_system_logs');setSystemLogs([]);}}} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-xs font-bold transition">مسح السجل</button>
              </div>
            </div>
            <div className="p-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {(() => {
                const filtered = systemLogs.filter(l=>!logFilter||l.action.includes(logFilter)||l.details.includes(logFilter)||(l.target&&l.target.includes(logFilter)));
                if (filtered.length === 0) {
                  return <div className="text-center py-8 text-gray-500 text-xs">لا توجد سجلات حالية</div>;
                }
                const displayed = filtered.slice(0, visibleLogs);
                return (
                  <div className="space-y-2">
                    {displayed.map(log=>(
                      <div key={log.id} className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 font-bold rounded-md text-[11px]">{log.action}</span>
                            <span className="text-gray-300 font-semibold">{log.details}</span>
                          </div>
                          {log.target && <div className="text-gray-500 text-[11px]">الهدف: {log.target}</div>}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 border-t md:border-t-0 border-gray-800 pt-2 md:pt-0">
                          <span>بواسطة: <strong className="text-gray-400">{log.admin}</strong></span>
                          <span>{new Date(log.timestamp).toLocaleString('ar-IQ')}</span>
                        </div>
                      </div>
                    ))}
                    {visibleLogs < filtered.length && (
                      <div className="text-center py-4 border-t border-gray-800">
                        <p className="text-gray-400 text-xs mb-2">يتم عرض {displayed.length} من أصل {filtered.length} سجل عملي</p>
                        <button onClick={() => setVisibleLogs(prev => prev + 4)} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition-all">
                          عرض المزيد 📋
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {tab==='changelog'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-6 max-w-4xl mx-auto font-sans text-right" dir="rtl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-amber-400"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold text-xl">سجل التحديثات والإصدارات (نسخة برو ✨)</h2>
                    <span className="px-2.5 py-0.5 bg-amber-500 text-black font-extrabold text-xs rounded-full">v1.6.8</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">تتبع التغييرات والتحديثات الزمنية مع كافة التفاصيل والميزات المضافة</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* v1.6.8 */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl p-5 space-y-3 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                  الإصدار الأخير
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-base">⚡ الإصدار v1.6.8 (تحسين أداء الواجهات وإصلاح أخطاء الجلب)</span>
                  <span className="text-gray-400 text-xs font-mono">(09/07/2026)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-805/80 border border-gray-700/80 rounded-xl p-3.5">
                    <h4 className="text-amber-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">📌 التحديثات والإصلاحات</h4>
                    <ul className="text-gray-300 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>إصلاح جلب البيانات:</strong> حل مشكلة الخطأ 400 عند فتح أو مشاركة رابط حساب البائع (SellerPublicPage).</li>
                      <li><strong>تحسين INP:</strong> إزالة `framer-motion` من أزرار التسجيل لتقليل تأخير الاستجابة أثناء النقر، واستبدالها بحركات CSS خفيفة.</li>
                      <li><strong>تحسينات الاستعلام:</strong> منع محاولات البحث برقم الهاتف إذا كان المستخدم لا يمتلك رقماً لتفادي طلبات غير صحيحة من الخادم.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* v1.6.0 */}
              <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                  إصدار سابق
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-base">⚡ الإصدار v1.6.0 (تحسين الأداء وفصل المكونات)</span>
                  <span className="text-gray-400 text-xs font-mono">(06/07/2026)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-805/80 border border-gray-700/80 rounded-xl p-3.5">
                    <h4 className="text-amber-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">📌 المميزات والتحديثات المضافة</h4>
                    <ul className="text-gray-300 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>تحسين سرعة التحميل:</strong> تطبيق تقنية Lazy Loading لتحميل لوحة التحكم بشكل مستقل لزيادة سرعة الصفحة الرئيسية.</li>
                      <li><strong>تنظيم الكود:</strong> فصل لوحة تحكم الإدارة إلى ملف منفصل تماماً لتسهيل الصيانة.</li>
                      <li><strong>تحسين الـ Types:</strong> فصل واجهات البيانات (Types) إلى مجلد `src/types` منفصل.</li>
                      <li><strong>إصلاح الأيقونات:</strong> توفير جميع الأيقونات الناقصة في لوحة التحكم.</li>
                    </ul>
                  </div>
                  <div className="bg-gray-805/80 border border-gray-700/80 rounded-xl p-3.5">
                    <h4 className="text-green-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">⚡ التفاصيل التقنية</h4>
                    <p className="text-gray-300 text-xs leading-relaxed">تم فصل الملفات إلى مجلدات مخصصة (hooks, utils, types) وتطبيق استيراد المكونات ديناميكياً باستخدام `React.lazy` و `Suspense` لتحسين سرعة ظهور أول محتوى (FCP) وزيادة أداء التطبيق.</p>
                  </div>
                </div>
              </div>

              {/* v1.5.0 */}
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-bold text-base">🤖 الإصدار v1.5.0 (المساعد الذكي التفاعلي)</span>
                  <span className="text-gray-500 text-xs font-mono">(04/07/2026)</span>
                </div>
                <div className="space-y-1.5 text-gray-400 text-sm">
                  <p>• تحويل بوت التيليكرام إلى مساعد تفاعلي يتيح للزبائن استعادة حساباتهم.</p>
                  <p>• التوجيه التلقائي للمستخدم نحو المساعد الذكي عند طلب الاستعادة.</p>
                  <p>• نظام توليد آمن لكلمات المرور بضغطة زر واحدة عبر التيليكرام.</p>
                </div>
              </div>

              {/* v1.4.0 */}
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-bold text-base">🚀 الإصدار v1.4.0 (النسخة الاحترافية)</span>
                  <span className="text-gray-400 text-xs font-mono">(02/07/2026 - 09:00 م)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-805/80 border border-gray-700/80 rounded-xl p-3.5">
                    <h4 className="text-amber-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">📌 المميزات والتحديثات المضافة</h4>
                    <ul className="text-gray-300 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>تثبيت العدادات عند التمرير:</strong> تثبيت شريط إحصائيات التصفح ("تم العثور على X، يتم عرض Y من أصل X") في الأعلى عند النزول.</li>
                      <li><strong>رسالة الترحيب والتحميل:</strong> ظهور تنبيه تفاعلي متحرك عند جلب المحتوى من قاعدة البيانات لتهيئة المستخدم للانتظار.</li>
                      <li><strong>توحيد فئات المنتجات:</strong> مطابقة فئات فورم الرفع مع فئات الفرز والفلترة في المتجر المخصص.</li>
                    </ul>
                  </div>
                  <div className="bg-gray-805/80 border border-gray-700/80 rounded-xl p-3.5">
                    <h4 className="text-green-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">⚡ التفاصيل التقنية</h4>
                    <p className="text-gray-300 text-xs leading-relaxed">تم تطبيق مؤشر تحميل متحرك في أزرار "عرض المزيد" لمنع التكرار وتقليل استهلاك الموارد، وتعديل هيكل الفئات ليتضمن: إلكترونيات، أزياء وملابس، المنزل، أثاث وديكور، العناية والجمال، دراجات، ألعاب، خدمات، وأصناف أخرى.</p>
                  </div>
                </div>
              </div>

              {/* v1.3.0 */}
              <div className="bg-gray-900 border border-gray-750 rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-bold text-base">📦 الإصدار v1.3.0</span>
                  <span className="text-gray-500 text-xs font-mono">(02/07/2026 - 05:45 م)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                    <h4 className="text-gray-300 font-bold text-xs mb-1">📌 المميزات والتحديثات</h4>
                    <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside pr-1">
                      <li>فصل استعلام خطوط النقل وحل مشكلة القوائم الفارغة.</li>
                      <li>إضافة وسم "حديث ✨" المتحرك للإعلانات الجديدة خلال 24 ساعة.</li>
                      <li>عكس اتجاه أزرار الشريط السفلي للهواتف لتسهيل الوصول.</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                    <h4 className="text-gray-300 font-bold text-xs mb-1">⚡ تفاصيل التحسين</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">استبعاد فئتي النقل والإشعارات من الاستعلام الرئيسي للإعلانات لضمان حجز كافة خانات الـ 12 إعلاناً بالكامل للمنتجات المعروضة.</p>
                  </div>
                </div>
              </div>

              {/* v1.2.0 */}
              <div className="bg-gray-900 border border-gray-750 rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-bold text-base">📦 الإصدار v1.2.0</span>
                  <span className="text-gray-500 text-xs font-mono">(02/07/2026 - 12:30 م)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                    <h4 className="text-gray-300 font-bold text-xs mb-1">📌 المميزات والتحديثات</h4>
                    <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside pr-1">
                      <li>لوحة تحهم التقارير والبلاغات الجديدة.</li>
                      <li>نظام تصفح وترقيم وتحديد عدد العناصر في Dashboard المالك.</li>
                      <li>نظام سجل العمليات والأنشطة الإدارية.</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                    <h4 className="text-gray-300 font-bold text-xs mb-1">⚡ تفاصيل التحسين</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">ربط عمليات الحظر، الترقية، وحذف الإعلانات بنظام سجل تلقائي يحفظ التوقيت والمنفذ.</p>
                  </div>
                </div>
              </div>

              {/* v1.1.0 */}
              <div className="bg-gray-900 border border-gray-750 rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-bold text-base">📦 الإصدار v1.1.0</span>
                  <span className="text-gray-500 text-xs font-mono">(01/07/2026 - 06:00 م)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                    <h4 className="text-gray-300 font-bold text-xs mb-1">📌 المميزات والتحديثات</h4>
                    <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside pr-1">
                      <li>حل مشكلة Safe Area و Safe Area Insets مع هواتف iPhone.</li>
                      <li>تمكين روابط الدخول المباشر للإعلانات والمنتجات ومشاركتها بشكل سليم.</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                    <h4 className="text-gray-300 font-bold text-xs mb-1">⚡ تفاصيل التحسين</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">تحسين ملفات التعريف والميتا وتحديث ملفات التنسيق index.css لتناسب أجهزة آبل بالكامل.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-6">
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-white font-bold mb-4 text-xl flex items-center gap-2">
                <Settings className="w-6 h-6 text-emerald-400" />
                تكلفة النشر والتسعير بنظام النقاط
              </h3>
              
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

              <div className="pt-4">
                <button onClick={saveSettings} disabled={savingSettings} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                  {savingSettings ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Check className="w-5 h-5"/> حفظ التعديلات</>}
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">يتم تطبيق الأسعار الجديدة فوراً على جميع المستخدمين.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Admin Panel
// ─────────────────────────────────────────────
