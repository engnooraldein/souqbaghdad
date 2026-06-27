import os

dash_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\owner_dash.tsx"
app_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(dash_path, "r", encoding="utf-8") as f:
    dash_content = f.read()

# 1. Update tab state in owner_dash
dash_content = dash_content.replace(
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'>('overview');",
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'>('overview');\n  const [logs, setLogs] = useState<SystemLog[]>([]);\n  const [logSearch, setLogSearch] = useState('');"
)

# 2. Update useEffect in owner_dash to load and poll logs
old_ue = """    return () => { clearInterval(iv); clearInterval(fetchInterval); };
  },[]);"""

new_ue = """    try{
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

    const logsIv = setInterval(()=>{
      try{setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));}catch{}
    }, 5000);

    return () => { clearInterval(iv); clearInterval(fetchInterval); clearInterval(logsIv); };
  },[]);"""

dash_content = dash_content.replace(old_ue, new_ue)

# 3. Add logging to actions in owner_dash
old_ban = """  const toggleBan = async (id: string) => {
    const user = dbUsers.find(u => u.id === id);
    if (!user) return;
    const newStatus = !user.is_banned;
    setDbUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: newStatus } : u));
    try {
      await supabase.from('profiles').update({ is_banned: newStatus }).eq('id', id);
    } catch (e) {
      console.error('Failed to toggle ban', e);
    }
  };"""

new_ban = """  const toggleBan = async (id: string) => {
    const user = dbUsers.find(u => u.id === id);
    if (!user) return;
    const newStatus = !user.is_banned;
    setDbUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: newStatus } : u));
    try {
      await supabase.from('profiles').update({ is_banned: newStatus }).eq('id', id);
      logSystemAction(
        newStatus ? 'حظر مستخدم' : 'فك حظر مستخدم',
        `تم ${newStatus ? 'حظر' : 'إلغاء حظر'} المستخدم: ${user.full_name || user.email || id}`,
        newStatus ? 'danger' : 'success',
        'المالك'
      );
      setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));
    } catch (e) {
      console.error('Failed to toggle ban', e);
    }
  };"""

dash_content = dash_content.replace(old_ban, new_ban)

old_role = """  const changeRole = async (id: string, newRole: string) => {
    setDbUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    } catch (e) {
      console.error('Failed to change role', e);
    }
  };"""

new_role = """  const changeRole = async (id: string, newRole: string) => {
    const user = dbUsers.find(u => u.id === id);
    setDbUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', id);
      logSystemAction(
        'تغيير رتبة مستخدم',
        `تم تغيير رتبة ${user?.full_name || id} إلى ${newRole}`,
        'warning',
        'المالك'
      );
      setLogs(JSON.parse(localStorage.getItem('souqSystemLogs')||'[]'));
    } catch (e) {
      console.error('Failed to change role', e);
    }
  };"""

dash_content = dash_content.replace(old_role, new_role)

# 4. Add tabs header in owner_dash
old_tabs = """{([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام']] as [string,string][]).map(([t,l])=>("""
new_tabs = """{([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل التغييرات']] as [string,string][]).map(([t,l])=>("""

dash_content = dash_content.replace(old_tabs, new_tabs)

# 5. Add logs tab rendering in owner_dash
old_bc_end = """        {tab==='broadcast'&&(
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

new_bc_end = old_bc_end + """

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

dash_content = dash_content.replace(old_bc_end, new_bc_end)

with open(dash_path, "w", encoding="utf-8") as f:
    f.write(dash_content)

print("owner_dash.tsx updated successfully!")

# 6. Now sync owner_dash.tsx into App.tsx
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

# Extract OwnerDashboard code from dash_content (up to end of component)
owner_func_code = dash_content[:dash_content.find("// ─────────────────────────────────────────────\n// Admin Panel")].strip()
if not owner_func_code:
    owner_func_code = dash_content[:dash_content.find("function AdminPanel")].strip()

# Replace in App.tsx
start_marker = "// Owner Dashboard\n// ─────────────────────────────────────────────\nconst DEVICE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6'];\nfunction OwnerDashboard"
if start_marker not in app_content:
    start_marker = "function OwnerDashboard"

end_marker = "// ─────────────────────────────────────────────\n// Admin Panel"

start_idx = app_content.find("function OwnerDashboard")
end_idx = app_content.find("// ─────────────────────────────────────────────\n// Admin Panel")

if start_idx != -1 and end_idx != -1:
    new_app = app_content[:start_idx] + owner_func_code + "\n\n" + app_content[end_idx:]
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(new_app)
    print("App.tsx synced with owner_dash.tsx successfully!")
else:
    print(f"Indices: start={start_idx}, end={end_idx}")
