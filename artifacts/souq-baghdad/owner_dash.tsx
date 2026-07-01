export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  admin: string;
  details: string;
  target?: string;
}

export const logSystemAction = (action: string, details: string, target?: string, admin: string = 'المالك') => {
  try {
    const logs: SystemLog[] = JSON.parse(localStorage.getItem('souq_system_logs') || '[]');
    const newLog: SystemLog = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      action,
      admin,
      details,
      target
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    localStorage.setItem('souq_system_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to log action:', err);
  }
};

function OwnerDashboard({ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose, onDeleteProfile }: {
  ads:Ad[];
  products:Product[];
  transportAds:TransportAd[];
  onDeleteAd:(id:string|number)=>void;
  onDeleteProduct:(id:string|number)=>void;
  onDeleteTransportAd:(id:number)=>void;
  onClose:()=>void;
  onDeleteProfile?:(id:string)=>void;
}) {
  const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'|'changelog'>('overview');
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<any[]>([]);
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbGuests, setDbGuests] = useState<any[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [logFilter, setLogFilter] = useState('');

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
          .from('password_recovery_requests')
          .select('*')
          .order('created_at', { ascending: false });
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

    return () => { clearInterval(iv); clearInterval(fetchInterval); };
  },[]);

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
      const userIds = storedUsers.map(u => u.id).filter(id => id);
      if (userIds.length > 0) {
        const notifications = userIds.map(uid => ({
          seller_id: uid,
          title: broadcastTitle,
          description: broadcastMsg,
          price: '0',
          category: 'notification',
          location: '',
          city: '',
          images: [],
          phone: '',
          type: 'notification',
          status: 'active',
          is_demo: false,
          seller_name: 'إدارة الموقع',
          seller_avatar: '',
          metadata: { type: 'message', message: broadcastMsg, title: broadcastTitle }
        }));
        
        const chunkSize = 100;
        for (let i = 0; i < notifications.length; i += chunkSize) {
          const chunk = notifications.slice(i, i + chunkSize);
          await supabase.from('ads').insert(chunk);
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

  return (
    <div className="min-h-screen bg-gray-950 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-6 h-6 text-black"/></div>
            <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-white">داشبورت المالك</h1><span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">🚀 الإصدار v1.2</span></div><p className="text-amber-400 text-xs mt-0.5">تحليلات شاملة وإدارة كاملة للموقع المنصة حية ومتصلة</p></div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
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
          {([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل العمليات'],['changelog','🚀 التحديثات v1.2']] as [string,string][]).map(([t,l])=>(
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
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-bold">سجل الزيارات ({visits.length})</h3>
              <button onClick={()=>{try{localStorage.removeItem('souqVisits');}catch{}setVisits([]);}} className="text-xs text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3"/>مسح</button>
            </div>
            {visits.length===0?<div className="p-10 text-center"><Globe className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">لا توجد زيارات</p></div>:(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50"><tr>{['الوقت','الجهاز','الموقع','المستخدم'].map(h=><th key={h} className="text-right py-3 px-4 text-gray-400 font-medium text-xs">{h}</th>)}</tr></thead>
                  <tbody>
                    {visits.slice(0,100).map((v,i)=>(
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
            )}
          </div>
        )}
        
        {tab==='users'&&(
          <div className="space-y-3">
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
            {dbUsers.length===0?<div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700"><Users className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">لا مستخدمون بعد</p></div>:dbUsers.map(u=>{
              const isOnline = new Date().getTime() - new Date(u.last_seen || 0).getTime() < 5 * 60 * 1000;
              
              return (
              <div key={u.id} className={`bg-gray-800 rounded-2xl p-4 border ${u.is_banned?'border-red-500/30':'border-gray-700'} flex items-center gap-3 flex-wrap relative`}>
                {u.role !== 'owner' && (
                  <input type="checkbox" className="w-5 h-5 accent-red-500 rounded cursor-pointer hidden sm:block flex-shrink-0" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                    else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                  }} />
                )}
                <div className="relative flex-shrink-0">
                  <img src={u.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-12 h-12 rounded-full object-cover border-2 ${u.is_banned?'border-red-500/50':'border-gray-600'}`}/>
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'غير متصل'}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {u.role !== 'owner' && (
                      <input type="checkbox" className="w-4 h-4 accent-red-500 rounded cursor-pointer sm:hidden flex-shrink-0" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
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
                
                <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 flex-wrap">
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
                    <select 
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
          </div>
        )}
        
        {tab==='content'&&(
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3><span className="text-gray-400 text-xs">{ads.reduce((s,a)=>s+a.views,0)} مشاهدة</span></div>
              {ads.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا إعلانات</div>:ads.map(ad=>(
                <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                    <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • <button onClick={() => setViewersModalItem({id: ad.id, type: 'ad'})} className="hover:text-amber-400">{ad.views} 👁</button></p></div>
                  <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">المنتجات ({products.length})</h3><span className="text-gray-400 text-xs">{products.reduce((s,p)=>s+p.views,0)} مشاهدة</span></div>
              {products.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا منتجات</div>:products.map(p=>(
                <div key={p.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • <button onClick={() => setViewersModalItem({id: p.id, type: 'product'})} className="hover:text-amber-400">{p.views} 👁</button> • {p.condition==='new'?'جديد':'مستعمل'}</p></div>
                  <button onClick={()=>onDeleteProduct(p.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">خطوط النقل ({transportAds.length})</h3><span className="text-gray-400 text-xs">{transportAds.reduce((s,t)=>s+(t.views||0),0)} مشاهدة</span></div>
              {transportAds.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا يوجد خطوط نقل</div>:transportAds.map(t=>(
                <div key={t.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Car className="w-6 h-6 text-gray-400"/>
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{t.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'} ({t.university})</p>
                    <p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • <button onClick={() => setViewersModalItem({id: t.id, type: 'transport'})} className="hover:text-amber-400">{t.views||0} 👁</button></p></div>
                  <button onClick={()=>onDeleteTransportAd(t.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        
        {tab==='recovery'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">طلبات استعادة الحسابات ({recoveryRequests.length})</h3></div>
            {recoveryRequests.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا توجد طلبات</div>:
            <div className="space-y-3 p-4">
              {recoveryRequests.map(req => {
                const profile = dbUsers.find((p: any) => p.phone === req.phone);
                const displayReq = {
                  ...req,
                  profiles: profile || { full_name: 'مستخدم غير معروف', phone: req.phone, email: 'بدون بريد' }
                };
                return (
                  <div key={displayReq.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-bold">{displayReq.profiles?.full_name || 'مستخدم غير معروف'}</p>
                        <p className="text-xs text-gray-400">البريد: {displayReq.profiles?.email} • الهاتف: {displayReq.profiles?.phone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${displayReq.status==='pending'?'bg-amber-500/20 text-amber-400':'bg-green-500/20 text-green-400'}`}>
                        {displayReq.status==='pending' ? 'قيد المراجعة' : 'تمت المعالجة'}
                      </span>
                    </div>
                    {displayReq.notes && <div className="mt-2 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700"><p className="text-xs text-gray-500 mb-1">تفاصيل الإثبات أو المشكلة:</p>{displayReq.notes}</div>}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
                      <button onClick={async () => {
                        await supabase.from('password_recovery_requests').update({ status: displayReq.status === 'pending' ? 'resolved' : 'pending' }).eq('id', displayReq.id);
                        setRecoveryRequests(prev => prev.map(r => r.id === displayReq.id ? {...r, status: displayReq.status === 'pending' ? 'resolved' : 'pending'} : r));
                      }} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${displayReq.status==='pending'?'bg-green-500/10 border-green-500/20 text-green-400':'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                        {displayReq.status==='pending' ? 'تحديد كـ "تمت المعالجة"' : 'إعادة إلى "قيد المراجعة"'}
                      </button>
                      {displayReq.profiles?.phone && (
                        <a href={getWhatsAppResetLink(displayReq.profiles.phone)} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                          تواصل واتساب
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden space-y-4 p-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-700">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">📋 سجل تغييرات وعمليات النظام</h3>
                <p className="text-gray-400 text-xs">يسجل كافة تحديثات وإجراءات الإدارة والمشرفين فور حدوثها</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input type="text" placeholder="بحث في السجل..." value={logFilter} onChange={e=>setLogFilter(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 flex-1 md:w-48" />
                <button onClick={()=>{if(confirm('هل انت متأكد من مسح جميع السجلات؟')){localStorage.removeItem('souq_system_logs');setSystemLogs([]);}}} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-xs font-bold transition">مسح السجل</button>
              </div>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {systemLogs.filter(l=>!logFilter||l.action.includes(logFilter)||l.details.includes(logFilter)||(l.target&&l.target.includes(logFilter))).length===0?(
                <div className="text-center py-8 text-gray-500 text-xs">لا توجد سجلات حالية</div>
              ):(
                systemLogs.filter(l=>!logFilter||l.action.includes(logFilter)||l.details.includes(logFilter)||(l.target&&l.target.includes(logFilter))).map(log=>(
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
                ))
              )}
            </div>
          </div>
        )}

        {tab==='changelog'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-amber-400"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold text-xl">سجل التحديثات والإصدارات</h2>
                    <span className="px-2.5 py-0.5 bg-amber-500 text-black font-extrabold text-xs rounded-full">v1.2.0</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">تتبع كافة التعديلات، التحسينات، والمميزات الجديدة في منصة سوق بغداد</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-amber-500 text-black text-[10px] font-extrabold px-3 py-1 rounded-br-xl uppercase tracking-wider">
                الإصدار الحالي المباشر
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-lg">🚀 الإصدار v1.2.0</span>
                <span className="text-gray-400 text-xs font-mono">({new Date().toLocaleDateString('ar-IQ')})</span>
              </div>
              <div className="space-y-3 pt-2">
                <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-3.5">
                  <h4 className="text-amber-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">📌 ملاحظات التحديث (ما الجديد؟)</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">تمت إضافة قسم **سجل العمليات والتغييرات (Activity Logs)** الكامل، وتحديث بيئة البناء والتصدير القياسية لمطابقة خوادم Vercel و GitHub Actions، إضافة لنظام تتبع الإصدارات الحية لضمان وصول التحديث للمستخدم فوراً.</p>
                </div>
                <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-3.5">
                  <h4 className="text-green-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">⚡ التحسينات والإصلاحات</h4>
                  <ul className="text-gray-300 text-xs space-y-1.5 list-disc list-inside">
                    <li>ربط عمليات الحظر، الترقية، حذف الإعلانات، والرسائل العامة بنظام سجل تلقائي يحفظ التوقيت والمنفذ.</li>
                    <li>تسريع زمن بناء المشروع وتوحيد مسارات التصدير السحابي المباشر.</li>
                  </ul>
                </div>
                <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-3.5">
                  <h4 className="text-blue-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">💡 كيف الاستخدام؟</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">يمكنك التنقل بين تبويبة <strong>"سجل العمليات"</strong> لمتابعة الأنشطة اليومية للمشرفين والمالك، وتبويبة <strong>"التحديثات v1.2"</strong> للتحقق دائماً من رقم الإصدار الحالي للمنصة.</p>
                </div>
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
function AdminPanel({ ads, onDeleteAd, onClose }:{ads:Ad[];onDeleteAd:(id:number)=>void;onClose:()=>void}) {
  return (
    <div className="min-h-screen bg-gray-950 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-red-400"/></div>
            <div><h1 className="text-xl font-bold text-white">لوحة الإدارة</h1><p className="text-gray-400 text-xs">إدارة الإعلانات والمحتوى</p></div></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3></div>
          {ads.length===0?<div className="p-8 text-center text-gray-400">لا إعلانات</div>:ads.map(ad=>(
            <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50">
              <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover"/>
              <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع</p></div>
              <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Notifications Panel
// ─────────────────────────────────────────────
function NotifPanel({ isOpen, onClose, notifs, onNotifClick, onHistoryClick }:{
  isOpen:boolean;
  onClose:()=>void;
  notifs:any[];
  onNotifClick:(senderId:string)=>void;
  onHistoryClick:(itemId: string | number, itemType: string)=>void;
}) {
  const [tab, setTab] = useState<'incoming' | 'history'>('incoming');

  const incomingNotifs = notifs.filter(n => n.targetType === 'owner' || !n.targetType);
  const historyNotifs = notifs.filter(n => n.targetType === 'viewer');
  const activeNotifs = tab === 'incoming' ? incomingNotifs : historyNotifs;

  return (
    <AnimatePresence>
      {isOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60"/>
        <motion.div initial={{x:300}} animate={{x:0}} exit={{x:300}} onClick={e=>e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 p-5 overflow-y-auto border-l border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">الإشعارات</h2>
            <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
          </div>

          <div className="flex gap-2 mb-4 bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button 
              onClick={() => setTab('incoming')} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'incoming' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🔔 المهتمين بي ({incomingNotifs.length})
            </button>
            <button 
              onClick={() => setTab('history')} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'history' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🕒 سجل مشاهداتي ({historyNotifs.length})
            </button>
          </div>

          <div className="space-y-2">
            {activeNotifs.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                {tab === 'incoming' ? 'لا توجد إشعارات واردة حالياً' : 'لم تقم بمشاهدة أي إعلانات بعد'}
              </div>
            ) : (
              activeNotifs.map((n, i) => (
                <div key={n.id || i} 
                  onClick={() => {
                    if (tab === 'incoming') {
                      if (n.senderId) { onNotifClick(n.senderId); onClose(); }
                    } else {
                      if (n.itemId) { onHistoryClick(n.itemId, n.itemType); onClose(); }
                    }
                  }}
                  className="bg-gray-800 rounded-xl p-3 border border-gray-700 transition-colors cursor-pointer hover:border-amber-500/50 hover:bg-gray-800/80"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'message' ? 'bg-blue-500/20' : n.type === 'interest' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                      {n.type === 'message' ? <MessageSquare className="w-4 h-4 text-blue-400" /> : n.type === 'interest' ? <Heart className="w-4 h-4 text-red-400 fill-red-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{n.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed break-words">{n.message}</p>
                      
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        <p className="text-gray-500 text-[10px]"><TimeAgo iso={n.time || new Date().toISOString()} /></p>
                        {tab === 'incoming' && n.senderId && (
                          <span className="text-[10px] text-amber-400 font-semibold">👉 عرض الملف</span>
                        )}
                        {tab === 'history' && n.itemId && (
                          <span className="text-[10px] text-emerald-400 font-semibold">🔍 فتح الإعلان</span>
                        )}
                      </div>

                      {tab === 'incoming' && n.senderPhone && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                          <a 
                            href={`https://wa.me/964${n.senderPhone.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-green-500/10"
                          >
                            <MessageSquare className="w-3 h-3" /> مراسلة واتساب
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Market View
// ─────────────────────────────────────────────
function MarketView({ user, allAds, allProducts, favorites, onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, onTransportClick, onSelectTransportAd, transportLines, onActionMenu }:{
  user:User|null; allAds:Ad[]; allProducts:Product[]; favorites:number[];
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void;
  onToggleFav:(id:number)=>void; onRequireAuth:()=>void; onSellerClick:(id:string)=>void;
  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
  onActionMenu?: any;
}) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [gov, setGov] = useState('الكل');
  const [sort, setSort] = useState<'recent'|'views'|'price-low'|'price-high'>('recent');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [contentTab, setContentTab] = useState<'ads'|'products'|'profiles'|'transport'|'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [storedUsers, setStoredUsers] = useState<any[]>([]);

  const publishedTransportLines = transportLines.filter(a => a.status === 'published');

  const filteredTransport = publishedTransportLines.filter(a => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (a.regions && a.regions.toLowerCase().includes(term)) ||
           (a.university && a.university.toLowerCase().includes(term)) ||
           (a.note && a.note.toLowerCase().includes(term));
  });

  useEffect(() => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const sellersMap = new Map();
      
      // Seed with local users
      localUsers.forEach((u: any) => {
        sellersMap.set(u.id, {
          id: u.id,
          name: u.name,
          avatar: u.avatar || DEFAULT_AVATAR,
          phone: u.phone,
          location: u.location,
          adCount: u.adCount || 0,
          isVerified: u.role === 'owner' || u.role === 'vendor' || u.isVerified
        });
      });

      // Add sellers from ads
      allAds.forEach(ad => {
        if (ad.postedBy && !sellersMap.has(ad.postedBy)) {
          sellersMap.set(ad.postedBy, {
            id: ad.postedBy,
            name: ad.seller?.name || 'مستخدم',
            avatar: ad.seller?.avatar || DEFAULT_AVATAR,
            phone: ad.phone || '',
            location: ad.location || ad.governorate || '',
            adCount: 1,
            isVerified: ad.seller?.isVerified || false
          });
        } else if (ad.postedBy) {
          const existing = sellersMap.get(ad.postedBy);
          existing.adCount += 1;
          if (ad.phone && !existing.phone) existing.phone = ad.phone;
        }
      });

      // Add sellers from products
      allProducts.forEach(p => {
        if (p.postedBy && !sellersMap.has(p.postedBy)) {
          sellersMap.set(p.postedBy, {
            id: p.postedBy,
            name: p.seller?.name || 'مستخدم',
            avatar: p.seller?.avatar || DEFAULT_AVATAR,
            phone: p.phone || '',
            location: p.governorate || '',
            adCount: 1,
            isVerified: p.seller?.isVerified || false
          });
        } else if (p.postedBy) {
          const existing = sellersMap.get(p.postedBy);
          existing.adCount += 1;
          if (p.phone && !existing.phone) existing.phone = p.phone;
        }
      });

      setStoredUsers(Array.from(sellersMap.values()));
    } catch (e) {
      console.error(e);
    }
  }, [allAds, allProducts]);

  const filteredProfiles = storedUsers.filter(u => {
    const term = search.toLowerCase();
    return !search || 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.phone && u.phone.includes(term));
  });

  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');

  const filterAds = allAds.filter(a=>{
    const ms=!search||String(a.id).includes(search)||(a.short_id&&a.short_id.toLowerCase().includes(search.toLowerCase()))||a.title.toLowerCase().includes(search.toLowerCase())||a.location.toLowerCase().includes(search.toLowerCase());
    const mc=cat==='all'||a.category===cat; const mg=gov==='الكل'||a.governorate===gov;
    const min=priceMin?parseInt(priceMin.replace(/,/g,'')):0, max=priceMax?parseInt(priceMax.replace(/,/g,'')):Infinity, ap=parseInt(a.price)||0;
    return ms&&mc&&mg&&ap>=min&&ap<=max;
  }).sort((a,b)=>sort==='views'?b.views-a.views:sort==='price-low'?parseInt(a.price)-parseInt(b.price):sort==='price-high'?parseInt(b.price)-parseInt(a.price):new Date(b.createdAtISO).getTime()-new Date(a.createdAtISO).getTime());

  const filterProds = allProducts.filter(p=>{
    const ms=!search||String(p.id).includes(search)||(p.short_id&&p.short_id.toLowerCase().includes(search.toLowerCase()))||p.title.toLowerCase().includes(search.toLowerCase())||p.governorate.toLowerCase().includes(search.toLowerCase());
    const mc=cat==='all'||p.category===cat; const mg=gov==='الكل'||p.governorate===gov;
    const min=priceMin?parseInt(priceMin.replace(/,/g,'')):0, max=priceMax?parseInt(priceMax.replace(/,/g,'')):Infinity, pp=parseInt(p.price)||0;
    return ms&&mc&&mg&&pp>=min&&pp<=max;
  }).sort((a,b)=>sort==='views'?b.views-a.views:sort==='price-low'?parseInt(a.price)-parseInt(b.price):sort==='price-high'?parseInt(b.price)-parseInt(a.price):new Date(b.createdAtISO).getTime()-new Date(a.createdAtISO).getTime());

  const showAds = contentTab==='ads'||contentTab==='all';
  const showProds = contentTab==='products'||contentTab==='all';

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-12 relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-10 right-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"/><div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl"/></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <motion.h1 initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="text-3xl md:text-4xl font-bold text-white mb-3">كل شي تحتاجه <span className="text-amber-400">بمكان واحد</span></motion.h1>
            <p className="text-gray-300">إعلانات + متجر — السوق الرقمي العراقي</p>
          </div>
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن سيارة، هاتف، عقار، منتج..."
                className="w-full bg-white/10 backdrop-blur text-white placeholder-gray-300 rounded-2xl py-4 pr-12 pl-4 border border-white/20 focus:border-amber-400 outline-none text-sm"/></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.filter(c=>c.id!=='games').map(c=>(
              <motion.button key={c.id} whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setCat(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${cat===c.id?'bg-amber-500 text-black border-amber-500':'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
                <span>{c.emoji}</span><span>{c.name}</span>
              </motion.button>
            ))}
          </div>
          {/* Transport Quick Access */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="mt-5 max-w-2xl mx-auto">
            <button onClick={()=>onTransportClick?.()}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-2xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-400"/>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">🚌 قسم الخطوط</p>
                  <p className="text-emerald-300 text-xs">رحلات بين مدن العراق</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1 transition-transform"/>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filter bar */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
              {/* Content type tabs */}
              <div className="flex bg-gray-700 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-hide max-w-full">
                {([['all','الكل'],['ads','📢 إعلانات'],['products','🛍️ منتجات'],['profiles','👤 حسابات'],['transport','🚌 الخطوط']] as [string,string][]).map(([t,l])=>(
                  <button key={t} onClick={()=>setContentTab(t as any)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold ${contentTab===t?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>{l}</button>
                ))}
              </div>
              <div className="flex-1 flex flex-wrap gap-2 items-center justify-end">
                <select value={gov} onChange={e=>setGov(e.target.value)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none">
                  {IRAQI_GOVERNORATES.map(g=><option key={g}>{g}</option>)}</select>
                <select value={sort} onChange={e=>setSort(e.target.value as any)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none">
                  <option value="recent">الأحدث</option><option value="views">الأكثر مشاهدة</option>
                  <option value="price-low">السعر: من الأقل</option><option value="price-high">السعر: من الأعلى</option>
                </select>
                <button onClick={()=>setShowFilters(!showFilters)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs border ${showFilters?'bg-amber-500 text-black border-amber-500':'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  <SlidersHorizontal className="w-3.5 h-3.5"/><span>فلاتر</span></button>
                <div className="flex bg-gray-700 rounded-xl p-0.5">
                  <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode==='grid'?'bg-amber-500 text-black':'text-gray-400'}`}><Grid className="w-4 h-4"/></button>
                  <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode==='list'?'bg-amber-500 text-black':'text-gray-400'}`}><List className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {showFilters&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className="pt-3 mt-3 border-t border-gray-700 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2"><label className="text-gray-400 text-xs">السعر من:</label>
                    <input value={fmt(priceMin)} onChange={e=>setPriceMin(fmt(e.target.value))} placeholder="0" className="w-32 bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm outline-none"/></div>
                  <div className="flex items-center gap-2"><label className="text-gray-400 text-xs">إلى:</label>
                    <input value={fmt(priceMax)} onChange={e=>setPriceMax(fmt(e.target.value))} placeholder="بلا حد" className="w-32 bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm outline-none"/></div>
                  <button onClick={()=>{setPriceMin('');setPriceMax('');setGov('الكل');setSearch('');}} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm">مسح الفلاتر</button>
                </div>
              </motion.div>}
            </AnimatePresence>
          </div>

          {/* Ads */}
          {showAds&&filterAds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><FileText className="w-4 h-4"/>الإعلانات ({filterAds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                {filterAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(ad.id);}}
                  onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}/>)}
              </div>
            </div>
          )}

          {/* Products */}
          {showProds&&filterProds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><ShoppingBag className="w-4 h-4"/>المنتجات ({filterProds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                {filterProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(p.id);}}
                  onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}/>)}
              </div>
            </div>
          )}

          {/* Transport Lines */}
          {contentTab === 'transport' && (
            <div className="mb-8">
              {filteredTransport.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🚌</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد خطوط مطابقة</h3>
                  <p className="text-gray-400 text-sm">جرب البحث بكلمات أخرى أو تصفح قسم الخطوط الكامل</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {filteredTransport.map(ad => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onSelectTransportAd?.(ad)}
                      className={`bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer hover:border-emerald-500/60 ${
                        ad.type === 'offer' ? 'border-emerald-500/30' : 'border-amber-500/30'
                      }`}
                    >
                      {/* Type Badge */}
                      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold ${
                        ad.type === 'offer' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'
                      }`}>
                        {ad.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'}
                      </div>

                      <div className="p-4 pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                              {ad.university}
                            </h3>
                            <p className="text-gray-400 text-sm flex items-center gap-1.5 leading-relaxed">
                              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>المناطق: <span className="text-white">{ad.regions}</span></span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          <div className="bg-gray-900 rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">الدوام</p>
                            <p className="text-white font-bold text-xs">{ad.shift}</p>
                          </div>
                          {ad.type === 'offer' && (
                            <div className="bg-gray-900 rounded-xl p-2 text-center">
                              <p className="text-gray-400 text-[10px]">المقاعد</p>
                              <p className="text-emerald-400 font-bold text-xs">{ad.seats} <span className="text-gray-500 font-normal">متاح</span></p>
                            </div>
                          )}
                          <div className="bg-gray-900 rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">الفئة</p>
                            <p className="text-white font-bold text-xs">{ad.targetAudience}</p>
                          </div>
                          <div className="bg-gray-900 rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">المركبة</p>
                            <p className="text-white font-bold text-xs">{ad.vehicleType}</p>
                          </div>
                        </div>

                        {ad.price && (
                          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-3 bg-amber-500/10 px-3 py-2 rounded-lg inline-flex">
                            <Tag className="w-4 h-4" />
                            <span>السعر المفضل: {ad.price}</span>
                          </div>
                        )}

                        {ad.note && (
                          <p className="text-gray-300 text-xs mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">{ad.note}</p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <img
                              src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-gray-600"
                            />
                            <div>
                              <span className="text-gray-300 text-xs block font-semibold">{ad.sellerName}</span>
                              <span className="text-gray-500 text-[10px] block">
                                <TimeAgo iso={ad.createdAt} />
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.a
                              href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type === 'offer' ? 'خط متوفر' : 'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> واتساب
                            </motion.a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profiles */}
          {contentTab === 'profiles' && (
            <div className="mb-8">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد حسابات مطابقة</h3>
                  <p className="text-gray-400 text-sm">جرب البحث باسم آخر أو رقم هاتف آخر</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProfiles.map(profile => (
                    <motion.div
                      key={profile.id}
                      whileHover={{ y: -4 }}
                      onClick={() => onSellerClick(profile.id)}
                      className="bg-gray-800 rounded-2xl p-4 border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-white font-bold text-sm truncate">{profile.name}</h3>
                          {profile.isVerified && (
                            <span className="text-blue-500 flex-shrink-0">
                              <Shield className="w-3.5 h-3.5 fill-current text-blue-500" />
                            </span>
                          )}
                        </div>
                        {profile.phone && (
                          <p className="text-gray-400 text-xs flex items-center gap-1 mb-0.5">
                            <PhoneIcon className="w-3 h-3 text-emerald-400" />
                            <span className="font-semibold">{profile.phone}</span>
                          </p>
                        )}
                        <p className="text-gray-500 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{profile.location || 'العراق'}</span>
                          <span className="mx-1">•</span>
                          <span className="text-amber-400 font-medium">{profile.adCount} إعلان</span>
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty */}
          {contentTab !== 'profiles' && ((showAds&&filterAds.length===0)||(showProds&&filterProds.length===0))&&filterAds.length===0&&filterProds.length===0&&(
            <div className="text-center py-20"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3><p className="text-gray-400 text-sm">جرب تغيير الفلاتر أو كلمة البحث</p></div>
          )}
        </div>
      </section>

      {/* Games */}
      <section className="hidden py-12 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6"><span className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full mb-3"><Gamepad2 className="w-4 h-4 text-amber-400"/><span className="text-amber-400 text-sm font-semibold">قسم الترفيه</span></span>
            <h2 className="text-2xl font-bold text-white">🎮 الألعاب الترفيهية</h2></div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {GAMES_DATA.map(g=><motion.div key={g.id} whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/20 cursor-pointer hover:bg-white/20">
              <div className="text-3xl mb-1">{g.emoji}</div><h3 className="text-white text-xs font-bold">{g.title}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-300 text-[10px] mt-1"><Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400"/>{g.rating}</div>
            </motion.div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
// ─────────────────────────────────────────────
// Transport View (قسم خطوط الجامعات)
// ─────────────────────────────────────────────
const UNIVERSITIES = [
  'الكل', 'جامعة بغداد', 'الجامعة المستنصرية', 'الجامعة التكنولوجية', 'الجامعة العراقية',
  'جامعة النهرين', 'كلية المأمون الجامعة', 'كلية التراث الجامعة', 'جامعة الفراهيدي',
  'كلية المنصور الجامعة', 'جامعة دجلة', 'كلية الاسراء الجامعة', 'كلية مدينة العلم', 'أخرى'
];

interface TransportAd {
  id: number;
  type: 'offer' | 'request'; // متوفر خط أو أبحث عن خط
  university: string;
  regions: string;
  price: string;
  seats: number;
  shift: string;
  vehicleType: string;
  targetAudience: string;
  phone: string;
  note: string;
  postedBy: string;
  sellerName: string;
  sellerAvatar: string;
  createdAt: string;
  status: 'pending' | 'published' | 'matched' | 'archived' | 'deleted_soft';
  completion_reason?: 'found_line' | 'line_full' | 'closed_by_owner' | null;
  completedAt?: string;
  views: number;
  interest: number;
  whatsappClicks?: number;
}

function TransportFormModal({ onClose, onSubmit, user, lines = [], editAd }: {
  onClose: () => void;
  onSubmit: (ad: TransportAd) => void;
  user: { id: string; name: string; avatar: string; phone: string };
  lines?: TransportAd[];
  editAd?: TransportAd | null;
}) {
  const isEdit = !!editAd;
  const [type, setType] = useState<'offer'|'request'>(editAd?.type || 'offer');
  
  const dynamicFormUniversities = Array.from(new Set([
    ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
    ...lines.filter(l => l.status === 'published').map(l => l.university)
  ])).filter(Boolean);

  const finalFormUniversities = [...dynamicFormUniversities, 'أخرى'];

  const initialUniv = editAd?.university || finalFormUniversities[0] || UNIVERSITIES[1];
  const isCustomUniv = editAd?.university && !finalFormUniversities.includes(editAd.university);
  const [university, setUniversity] = useState(isCustomUniv ? 'أخرى' : initialUniv);
  const [customUniversity, setCustomUniversity] = useState(isCustomUniv ? editAd.university : '');
  const [regions, setRegions] = useState(editAd?.regions || '');
  const [price, setPrice] = useState(editAd?.price ? editAd.price : '');
  const [seats, setSeats] = useState(editAd?.seats?.toString() || '4');
  const [shift, setShift] = useState(editAd?.shift || 'صباحي');
  const [vehicleType, setVehicleType] = useState(editAd?.vehicleType || 'خصوصي');
  const [targetAudience, setTargetAudience] = useState(editAd?.targetAudience || 'مختلط');
  const [phone, setPhone] = useState(editAd?.phone || user.phone || '');
  const [note, setNote] = useState(editAd?.note || '');

  const formatPriceInput = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('en-US');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUniversity = university === 'أخرى' ? customUniversity.trim() : university;
    if (!finalUniversity || !regions || !phone) return;
    onSubmit({
      id: isEdit ? editAd.id : Date.now(),
      type, university: finalUniversity, regions, price, seats: type==='offer'?parseInt(seats)||4:0,
      shift, vehicleType, targetAudience, phone, note,
      postedBy: isEdit ? editAd.postedBy : user.id, sellerName: isEdit ? editAd.sellerName : user.name, sellerAvatar: isEdit ? editAd.sellerAvatar : user.avatar,
      createdAt: isEdit ? editAd.createdAt : new Date().toISOString(),
      status: isEdit ? editAd.status : 'published',
      views: isEdit ? editAd.views : 0,
      interest: isEdit ? editAd.interest : 0,
      whatsappClicks: isEdit ? editAd.whatsappClicks : 0
    });
    onClose();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-md border border-emerald-500/30 z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">إعلان خطوط الجامعات</h2>
              <p className="text-emerald-100 text-xs">طالب أم صاحب خط؟</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 bg-white/20 rounded-xl text-white"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="flex bg-gray-800 p-1 rounded-xl">
            <button type="button" onClick={()=>setType('offer')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type==='offer'?'bg-emerald-500 text-white':'text-gray-400 hover:text-white'}`}>صاحب خط (أوفر مقاعد)</button>
            <button type="button" onClick={()=>setType('request')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type==='request'?'bg-emerald-500 text-white':'text-gray-400 hover:text-white'}`}>طالب (أبحث عن خط)</button>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">الجامعة / الكلية</label>
            <select value={university} onChange={e=>setUniversity(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm mb-2">
              {finalFormUniversities.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {university === 'أخرى' && (
              <input value={customUniversity} onChange={e=>setCustomUniversity(e.target.value)} placeholder="اكتب اسم الجامعة أو الكلية هنا" required
                className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm animate-in fade-in duration-200"/>
            )}
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">مناطق المرور (مثال: السيدية، المنصور، الكرادة)</label>
            <input value={regions} onChange={e=>setRegions(e.target.value)} placeholder="أدخل المناطق مفصولة بفاصلة" required
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نوع الدوام</label>
              <select value={shift} onChange={e=>setShift(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm">
                <option>صباحي</option><option>مسائي</option><option>صباحي ومسائي</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">المقاعد (لأصحاب الخطوط)</label>
              <input type="number" min="1" max="50" value={seats} onChange={e=>setSeats(e.target.value)} disabled={type==='request'}
                className="w-full bg-gray-800 text-white disabled:opacity-50 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نوع المركبة</label>
              <select value={vehicleType} onChange={e=>setVehicleType(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm">
                <option>خصوصي</option><option>أجرة</option><option>فان 11 راكب</option><option>كوستر</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">الفئة</label>
              <select value={targetAudience} onChange={e=>setTargetAudience(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm">
                <option>مختلط</option><option>بنات فقط</option><option>شباب فقط</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">السعر الشهري (اختياري)</label>
            <input value={price} onChange={e=>setPrice(formatPriceInput(e.target.value))} placeholder="مثال: 100,000 د.ع"
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">رقم الهاتف للتواصل</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07XXXXXXXXX" required
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">ملاحظات إضافية (اختياري)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="مثال: السيارة مكيفة، سواقة هادئة، التزام بالوقت..."
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm resize-none"/>
          </div>

          <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
            <Car className="w-5 h-5"/> نشر الإعلان
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

