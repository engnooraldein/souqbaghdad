import os

dash_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\owner_dash.tsx"
app_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(dash_path, "r", encoding="utf-8") as f:
    dash_content = f.read()

# 1. Update state type for tab
dash_content = dash_content.replace(
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'>('overview');",
    "const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'|'changelog'>('overview');"
)

# 2. Add Version Badge in header
header_target = '<div><h1 className="text-2xl font-bold text-white">داشبورت المالك</h1><p className="text-amber-400 text-xs">تحليلات شاملة وإدارة كاملة للموقع</p></div>'
header_replacement = '<div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-white">داشبورت المالك</h1><span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">🚀 الإصدار v1.2</span></div><p className="text-amber-400 text-xs mt-0.5">تحليلات شاملة وإدارة كاملة للموقع المنصة حية ومتصلة</p></div>'

dash_content = dash_content.replace(header_target, header_replacement)

# 3. Add Changelog tab button
tabs_target = "{([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل التغييرات']] as [string,string][]).map(([t,l])=>("
tabs_replacement = "{([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل التغييرات'],['changelog','🚀 التحديثات (v1.2)']] as [string,string][]).map(([t,l])=>("

dash_content = dash_content.replace(tabs_target, tabs_replacement)

# 4. Render Changelog tab content
logs_tab_marker = "{tab==='logs'&&( \n          <div className=\"bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden space-y-4 p-5\">"
if "{tab==='logs'&&(" not in dash_content:
    print("Warning: tab==='logs' not found exactly, searching alternative")

changelog_tab_code = """

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

            {/* Version 1.2 Card */}
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
                  <h4 className="text-amber-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">
                    📌 ملاحظات التحديث (ما الجديد؟)
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    تمت إضافة قسم **سجل العمليات والتغييرات (Activity Logs)** الكامل، وتحديث بيئة البناء والتصدير القياسية لمطابقة خوادم Vercel و GitHub Actions، إضافة لنظام تتبع الإصدارات الحية لضمان وصول التحديث للمستخدم فوراً.
                  </p>
                </div>

                <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-3.5">
                  <h4 className="text-green-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">
                    ⚡ التحسينات والإصلاحات
                  </h4>
                  <ul className="text-gray-300 text-xs space-y-1.5 list-disc list-inside">
                    <li>إصلاح مسار التجميع والتصدير إلى مجلد dist/public لمطابقة إعدادات السيرفر السحابي Vercel.</li>
                    <li>ربط عمليات الحظر، الترقية، حذف الإعلانات، والرسائل العامة بنظام سجل تلقائي يحفظ التوقيت والمنفذ.</li>
                    <li>إلغاء الحقول القديمة في package.json وتسريع زمن البناء التلقائي ليكون أقل من 20 ثانية.</li>
                  </ul>
                </div>

                <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-3.5">
                  <h4 className="text-blue-400 font-bold text-sm mb-1.5 flex items-center gap-1.5">
                    💡 كيف الاستخدام؟
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    يمكنك التنقل بين تبويبة <strong>"سجل التغييرات"</strong> لمتابعة الأنشطة اليومية للمشرفين والمالك، وتبويبة <strong>"التحديثات (v1.2)"</strong> للتحقق دائماً من رقم الإصدار الحالي للمنصة وضمان وصول الكود الجديد.
                  </p>
                </div>
              </div>
            </div>

            {/* Version 1.1 Card */}
            <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-4 space-y-2 opacity-80">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-bold text-sm">📦 الإصدار v1.1.0</span>
                <span className="text-gray-500 text-[11px]">أمس</span>
              </div>
              <p className="text-gray-400 text-xs">
                تحسين نظام الأرشفة والـ SEO للموقع، معالجة الروابط المباشرة وتفعيل مشاركة الإعلانات عبر شبكات التواصل الاجتماعي.
              </p>
            </div>
          </div>
        )}"""

# Insert changelog before end of OwnerDashboard
end_dashboard_marker = "      </div>\n    </div>\n  );\n}"
idx = dash_content.find(end_dashboard_marker)
if idx != -1:
    dash_content = dash_content[:idx] + changelog_tab_code + "\n" + dash_content[idx:]
    print("Added changelog tab code to owner_dash.tsx")
else:
    print("Could not find end_dashboard_marker")

with open(dash_path, "w", encoding="utf-8") as f:
    f.write(dash_content)

# Sync with App.tsx
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

owner_func_code = dash_content[:dash_content.find("// ─────────────────────────────────────────────\n// Admin Panel")].strip()
if not owner_func_code:
    owner_func_code = dash_content[:dash_content.find("function AdminPanel")].strip()

start_idx = app_content.find("function OwnerDashboard")
end_idx = app_content.find("// ─────────────────────────────────────────────\n// Admin Panel")

if start_idx != -1 and end_idx != -1:
    new_app = app_content[:start_idx] + owner_func_code + "\n\n" + app_content[end_idx:]
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(new_app)
    print("App.tsx synced with owner_dash.tsx successfully!")
