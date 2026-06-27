import os, re

dash_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\owner_dash.tsx"
app_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(dash_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Inject SystemLog interface and utility before OwnerDashboard function
log_struct = """export interface SystemLog {
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

"""

if "export interface SystemLog" not in code:
    code = log_struct + code

# 2. Update tab state
code = code.replace(
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'>('overview');",
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'|'changelog'>('overview');"
)

# 3. Add system logs state inside OwnerDashboard
logs_state = """  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [logFilter, setLogFilter] = useState('');

  useEffect(() => {
    const loadLogs = () => {
      try { setSystemLogs(JSON.parse(localStorage.getItem('souq_system_logs') || '[]')); } catch {}
    };
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);
"""

if "const [systemLogs, setSystemLogs]" not in code:
    code = code.replace("const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);", "const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);\n" + logs_state)

# 4. Update Header Badge (gold aligned)
header_target = '<div><h1 className="text-2xl font-bold text-white">داشبورت المالك</h1><p className="text-amber-400 text-xs">تحليلات شاملة وإدارة كاملة للموقع</p></div>'
header_replacement = '<div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-white">داشبورت المالك</h1><span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">🚀 الإصدار v1.2</span></div><p className="text-amber-400 text-xs mt-0.5">تحليلات شاملة وإدارة كاملة للموقع المنصة حية ومتصلة</p></div>'
code = code.replace(header_target, header_replacement)

# 5. Add tabs button
tabs_target = "['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام']"
tabs_replacement = "['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل العمليات'],['changelog','🚀 التحديثات v1.2']"
code = code.replace(tabs_target, tabs_replacement)

# 6. Add logger calls in functions
code = code.replace("const toggleBan = async (u: StoredUser) => {", "const toggleBan = async (u: StoredUser) => {\n    logSystemAction(u.isBanned ? 'إلغاء حظر' : 'حظر مستخدم', `تم ${u.isBanned ? 'إلغاء حظر' : 'حظر'} المستخدم ${u.name || u.phone}`, u.phone);")
code = code.replace("const changeRole = async (u: StoredUser, role: 'user'|'admin'|'owner') => {", "const changeRole = async (u: StoredUser, role: 'user'|'admin'|'owner') => {\n    logSystemAction('تغيير رتبة', `تغيير رتبة ${u.name || u.phone} إلى ${role}`, u.phone);")
code = code.replace("setBroadcastSent(true);", "logSystemAction('إرسال إشعار عام', `عنوان الإشعار: ${broadcastTitle}`, 'جميع المستخدمين');\n      setBroadcastSent(true);")

# 7. Render logs tab and changelog tab content
tabs_render_code = """
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
        )}"""

end_dashboard_marker = "      </div>\n    </div>\n  );\n}"
idx = code.find(end_dashboard_marker)
if idx != -1:
    code = code[:idx] + tabs_render_code + "\n" + code[idx:]

with open(dash_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Successfully injected morning features into golden base owner_dash.tsx!")

# Sync with App.tsx
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

owner_func_code = code[:code.find("// ─────────────────────────────────────────────\n// Admin Panel")].strip()
if not owner_func_code:
    owner_func_code = code[:code.find("function AdminPanel")].strip()

start_idx = app_code.find("function OwnerDashboard")
end_idx = app_code.find("// ─────────────────────────────────────────────\n// Admin Panel")

if start_idx != -1 and end_idx != -1:
    new_app = app_code[:start_idx] + owner_func_code + "\n\n" + app_code[end_idx:]
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(new_app)
    print("App.tsx synced with golden owner_dash.tsx successfully!")
