import os

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add SystemLog & logSystemAction
types_target = """interface Visit {
  id: string; timestamp: string; device: 'mobile'|'desktop'|'tablet';
  location: string; userId?: string; userName?: string; page: string;
}"""

types_replacement = """interface Visit {
  id: string; timestamp: string; device: 'mobile'|'desktop'|'tablet';
  location: string; userId?: string; userName?: string; page: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export const logSystemAction = (action: string, details: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info', userName: string = 'إدارة النظام') => {
  try {
    const logs: SystemLog[] = JSON.parse(localStorage.getItem('souqSystemLogs') || '[]');
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details,
      user: userName,
      type
    };
    localStorage.setItem('souqSystemLogs', JSON.stringify([newLog, ...logs].slice(0, 500)));
  } catch (e) {
    console.error('Failed to log action:', e);
  }
};"""

if types_target in content:
    content = content.replace(types_target, types_replacement)
    print("Added SystemLog types and logSystemAction")
else:
    print("Could not find types_target")

# 2. Update OwnerDashboard signature / state
owner_dash_target = """function OwnerDashboard({ ads, products, onDeleteAd, onDeleteProduct, onClose }:{ads:Ad[];products:Product[];onDeleteAd:(id:number)=>void;onDeleteProduct:(id:number)=>void;onClose:()=>void}) {
  const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'>('overview');
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  
  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(()=>{
    try{setStoredUsers(JSON.parse(localStorage.getItem('souqUsers')||'[]'));}catch{}
    try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}
    const iv=setInterval(()=>{try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}},30_000);
    return()=>clearInterval(iv);
  },[]);"""

owner_dash_replacement = """function OwnerDashboard({ ads, products, onDeleteAd, onDeleteProduct, onClose }:{ads:Ad[];products:Product[];onDeleteAd:(id:number)=>void;onDeleteProduct:(id:number)=>void;onClose:()=>void}) {
  const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'logs'>('overview');
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  
  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(()=>{
    try{setStoredUsers(JSON.parse(localStorage.getItem('souqUsers')||'[]'));}catch{}
    try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}
    try{
      let storedLogs: SystemLog[] = JSON.parse(localStorage.getItem('souqSystemLogs')||'[]');
      if (storedLogs.length === 0) {
        storedLogs = [{
          id: 'init-1',
          timestamp: new Date().toISOString(),
          action: 'تحديث النظام',
          details: 'تم تحديث الاعتماديات ومحرك pnpm ونظام المستودع بنجاح',
          user: 'النظام الآلي',
          type: 'success'
        }];
        localStorage.setItem('souqSystemLogs', JSON.stringify(storedLogs));
      }
      setLogs(storedLogs);
    }catch{}

    const iv=setInterval(()=>{
      try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}
      try{setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));}catch{}
    },5000);
    return()=>clearInterval(iv);
  },[]);"""

if owner_dash_target in content:
    content = content.replace(owner_dash_target, owner_dash_replacement)
    print("Updated OwnerDashboard state and useEffect")
else:
    print("Could not find owner_dash_target")

# 3. Update actions in OwnerDashboard (toggleBan, changeRole, handleBroadcast)
actions_target = """  // Actions
  const toggleBan=(id:string)=>{
    const u=storedUsers.map(u=>u.id===id?{...u,isBanned:!u.isBanned}:u);
    setStoredUsers(u);localStorage.setItem('souqUsers',JSON.stringify(u));
  };

  const changeRole=(id:string, newRole:string)=>{
    const u=storedUsers.map(u=>u.id===id?{...u,role:newRole as any}:u);
    setStoredUsers(u);localStorage.setItem('souqUsers',JSON.stringify(u));
  };"""

actions_replacement = """  // Actions
  const toggleBan=(id:string)=>{
    const target = storedUsers.find(u=>u.id===id);
    const newBannedState = !target?.isBanned;
    const u=storedUsers.map(u=>u.id===id?{...u,isBanned:newBannedState}:u);
    setStoredUsers(u);localStorage.setItem('souqUsers',JSON.stringify(u));
    logSystemAction(
      newBannedState ? 'حظر مستخدم' : 'فك حظر مستخدم',
      `تم ${newBannedState ? 'حظر' : 'إلغاء حظر'} المستخدم: ${target?.name || id}`,
      newBannedState ? 'danger' : 'success',
      'المالك'
    );
    setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));
  };

  const changeRole=(id:string, newRole:string)=>{
    const target = storedUsers.find(u=>u.id===id);
    const u=storedUsers.map(u=>u.id===id?{...u,role:newRole as any}:u);
    setStoredUsers(u);localStorage.setItem('souqUsers',JSON.stringify(u));
    logSystemAction(
      'تغيير رتبة مستخدم',
      `تم تغيير رتبة ${target?.name || id} إلى ${newRole}`,
      'warning',
      'المالك'
    );
    setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));
  };

  const handleDeleteAdWithLog = (id: number) => {
    const target = ads.find(a => a.id === id);
    onDeleteAd(id);
    logSystemAction('حذف إعلان', `تم حذف الإعلان: "${target?.title || id}"`, 'danger', 'المالك');
    setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));
  };

  const handleDeleteProductWithLog = (id: number) => {
    const target = products.find(p => p.id === id);
    onDeleteProduct(id);
    logSystemAction('حذف منتج', `تم حذف المنتج: "${target?.title || id}"`, 'danger', 'المالك');
    setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));
  };"""

if actions_target in content:
    content = content.replace(actions_target, actions_replacement)
    print("Updated OwnerDashboard actions")
else:
    print("Could not find actions_target")

# 4. Log broadcast
broadcast_target = """      setBroadcastSent(true);"""
broadcast_replacement = """      logSystemAction(
        'إرسال إشعار عام',
        `عنوان الإشعار: "${broadcastTitle}" - تم الإرسال إلى ${userIds.length} مستخدم`,
        'info',
        'المالك'
      );
      setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));
      setBroadcastSent(true);"""

if broadcast_target in content:
    content = content.replace(broadcast_target, broadcast_replacement, 1)
    print("Updated broadcast logging")

# 5. Update tabs header
tabs_target = """{([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['content','📢 المحتوى'],['broadcast','🔔 إشعار عام']] as [string,string][]).map(([t,l])=>(("""
tabs_replacement = """{([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['content','📢 المحتوى'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل التغييرات']] as [string,string][]).map(([t,l])=>(("""

if tabs_target in content:
    content = content.replace(tabs_target, tabs_replacement)
    print("Updated tabs header")

# 6. Update onDelete calls in content tab
content_del_ad = "onDeleteAd(ad.id)"
content_del_ad_new = "handleDeleteAdWithLog(ad.id)"
content_del_prod = "onDeleteProduct(p.id)"
content_del_prod_new = "handleDeleteProductWithLog(p.id)"

content = content.replace(content_del_ad, content_del_ad_new)
content = content.replace(content_del_prod, content_del_prod_new)

# 7. Add logs tab content before end of OwnerDashboard
# Let's find end of broadcast tab in OwnerDashboard
broadcast_end = """        {tab==='broadcast'&&(
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
        )}"""

logs_tab_code = """

        {tab==='logs'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-700">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400"/> سجل العمليات والتغييرات ({logs.length})
                </h3>
                <p className="text-gray-400 text-xs">يسجل هذا القسم كافة التحديثات والأنشطة المنفذة على المنصة تلقائياً</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5"/>
                  <input
                    type="text"
                    placeholder="بحث في السجل..."
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white text-xs rounded-xl pr-9 pl-3 py-2 outline-none focus:border-amber-500 w-48"
                  />
                </div>
                <button
                  onClick={() => {
                    if (confirm('هل أنت تأكد من مسح سجل العمليات؟')) {
                      localStorage.removeItem('souqSystemLogs');
                      setLogs([]);
                    }
                  }}
                  className="px-3 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5"/> مسح السجل
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3"/>
                <p className="text-gray-400 text-sm">لا توجد عمليات مسجلة حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {logs
                  .filter(l => l.action.includes(logSearch) || l.details.includes(logSearch) || l.user.includes(logSearch))
                  .map(log => {
                    const badgeBg = 
                      log.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      log.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      log.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                      'bg-blue-500/10 border-blue-500/30 text-blue-400';
                    return (
                      <div key={log.id} className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 hover:border-gray-600 transition-colors">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0 mt-0.5 ${badgeBg}`}>
                            {log.action}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-xs font-medium leading-relaxed">{log.details}</p>
                            <span className="text-gray-500 text-[10px] block mt-1">المفذ: <strong className="text-gray-400">{log.user}</strong></span>
                          </div>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <span className="text-gray-400 text-[11px] font-mono bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-700/50">
                            {new Date(log.timestamp).toLocaleString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}"""

if broadcast_end in content:
    content = content.replace(broadcast_end, broadcast_end + logs_tab_code)
    print("Added logs tab component rendering")
else:
    print("Could not find broadcast_end")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx modification complete!")
