const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Update Props
code = code.replace(
  'export function AdminPanel({ ads, onDeleteAd, onClose }:{ads:Ad[];onDeleteAd:(id:number)=>void;onClose:()=>void}) {',
  'export function AdminPanel({ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose }:{ads:Ad[]; products:Product[]; transportAds:TransportAd[]; onDeleteAd:(id:number)=>void; onDeleteProduct:(id:string)=>void; onDeleteTransportAd:(id:number)=>void; onClose:()=>void}) {'
);

// Update States
code = code.replace(
  "const [tab, setTab] = useState<'ads'|'users'|'settings'>('ads');",
  "const [tab, setTab] = useState<'ads'|'products'|'transport'|'reports'|'users'|'settings'>('ads');\n  const [searchQuery, setSearchQuery] = useState('');\n  const [reports, setReports] = useState<any[]>([]);"
);

// Update Delete States
code = code.replace(
  'const [deleteAdId, setDeleteAdId] = useState<number | null>(null);',
  "const [deleteItem, setDeleteItem] = useState<{id: any, type: 'ad'|'product'|'transport'} | null>(null);\n  const [deletingReport, setDeletingReport] = useState(false);"
);

// Update Data Fetching
code = code.replace(
  "if(tab === 'users') {",
  "if(tab === 'reports') {\n      supabase.from('support_messages').select('*').order('created_at', { ascending: false }).limit(200).then(({data}) => {\n        if(data) setReports(data.filter((msg: any) => msg.name && msg.name.startsWith('REPORT:')));\n      });\n    } else if(tab === 'users') {"
);

// Update Tabs UI
code = code.replace(
  "<button onClick={() => setTab('ads')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'ads' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>الإعلانات ({ads.length})</button>",
  "<button onClick={() => setTab('ads')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'ads' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>الإعلانات</button>\n          <button onClick={() => setTab('products')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'products' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}>المنتجات</button>\n          <button onClick={() => setTab('transport')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'transport' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>الخطوط</button>\n          <button onClick={() => setTab('reports')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === 'reports' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>البلاغات</button>"
);

// Add Search Bar
code = code.replace(
  "        {tab === 'ads' && (",
  "        {['ads','products','transport'].includes(tab) && (\n          <div className=\"mb-4 relative\">\n            <Search className=\"w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2\"/>\n            <input type=\"text\" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder=\"ابحث بالاسم أو المعرف (ID)...\" className=\"w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pr-10 outline-none focus:border-red-500\"/>\n          </div>\n        )}\n\n        {tab === 'ads' && ("
);

// Filter Ads logic
code = code.replace(
  '{ads.length===0?<div className="p-8 text-center text-gray-400">لا إعلانات</div>:ads.map(ad=>(',
  '{(ads.filter(a => a.title?.includes(searchQuery) || String(a.id).includes(searchQuery) || String(a.short_id).includes(searchQuery)).length===0)?<div className="p-8 text-center text-gray-400">لا يوجد نتائج</div>:ads.filter(a => a.title?.includes(searchQuery) || String(a.id).includes(searchQuery) || String(a.short_id).includes(searchQuery)).map(ad=>('
);
code = code.replace(
  'setDeleteAdId(ad.id)',
  "setDeleteItem({id: ad.id, type: 'ad'})"
);

// Add Products Tab
code = code.replace(
  "        {tab === 'users' && (",
  "        {tab === 'products' && (\n          <div className=\"bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden\">\n            {(products.filter(p => p.title?.includes(searchQuery) || String(p.id).includes(searchQuery)).length===0)?<div className=\"p-8 text-center text-gray-400\">لا يوجد نتائج</div>:products.filter(p => p.title?.includes(searchQuery) || String(p.id).includes(searchQuery)).map(p=>(\n              <div key={p.id} className=\"flex items-center gap-3 p-3 border-b border-gray-700/50\">\n                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt=\"\" className=\"w-12 h-12 rounded-lg object-cover\"/>\n                <div className=\"flex-1 min-w-0\"><p className=\"text-white text-sm font-medium line-clamp-1\">{p.title}</p>\n                  <p className=\"text-xs text-gray-400\">{formatPrice(p.price)} د.ع</p></div>\n                <button onClick={()=>setDeleteItem({id: p.id, type: 'product'})} className=\"p-2 bg-red-500/20 rounded-lg text-red-400\"><Trash2 className=\"w-4 h-4\"/></button>\n              </div>\n            ))}\n          </div>\n        )}\n\n        {tab === 'transport' && (\n          <div className=\"bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden\">\n            {(transportAds.filter(t => (t.type === 'offer' ? 'خط متاح' : 'محتاج خط').includes(searchQuery) || t.university?.includes(searchQuery) || String(t.id).includes(searchQuery) || String(t.short_id).includes(searchQuery)).length===0)?<div className=\"p-8 text-center text-gray-400\">لا يوجد نتائج</div>:transportAds.filter(t => (t.type === 'offer' ? 'خط متاح' : 'محتاج خط').includes(searchQuery) || t.university?.includes(searchQuery) || String(t.id).includes(searchQuery) || String(t.short_id).includes(searchQuery)).map(t=>(\n              <div key={t.id} className=\"flex items-center gap-3 p-3 border-b border-gray-700/50\">\n                <div className=\"w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center\"><Car className=\"w-6 h-6 text-gray-400\"/></div>\n                <div className=\"flex-1 min-w-0\"><p className=\"text-white text-sm font-medium line-clamp-1\">{t.type === 'offer' ? 'خط متاح' : 'محتاج خط'} ({t.university})</p>\n                  <p className=\"text-xs text-gray-400\">{t.regions} • {formatPrice(t.price)} د.ع</p></div>\n                <button onClick={()=>setDeleteItem({id: t.id, type: 'transport'})} className=\"p-2 bg-red-500/20 rounded-lg text-red-400\"><Trash2 className=\"w-4 h-4\"/></button>\n              </div>\n            ))}\n          </div>\n        )}\n\n        {tab === 'reports' && (\n          <div className=\"bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden p-4 space-y-3\">\n            {reports.length === 0 ? <p className=\"text-center text-gray-400 py-8\">لا توجد بلاغات</p> : reports.map(rep => {\n              let reportData: any = {};\n              try { reportData = JSON.parse(rep.message); } catch(e) { reportData = { reason: rep.message }; }\n              const isProduct = reportData.item_type === 'product';\n              const isTransport = reportData.item_type === 'transport' || String(rep.name).includes('Transport');\n              return (\n                <div key={rep.id} className=\"bg-gray-700/50 p-4 rounded-xl border border-gray-600\">\n                  <div className=\"flex justify-between items-start\">\n                    <div>\n                      <h4 className=\"text-white font-bold text-sm\">{rep.name}</h4>\n                      <p className=\"text-gray-400 text-xs mb-2\">من: {rep.contact_info}</p>\n                      <p className=\"text-orange-400 text-sm font-bold bg-orange-500/10 px-3 py-1.5 rounded-lg inline-block\">السبب: {reportData.reason || 'مخالفة الشروط'}</p>\n                    </div>\n                    <div className=\"flex flex-col gap-2\">\n                      <button onClick={async () => {\n                        if(confirm('هل أنت متأكد من حذف العنصر المُبلّغ عنه؟')) {\n                          setDeletingReport(true);\n                          if (isProduct) onDeleteProduct(reportData.item_id);\n                          else if (isTransport) onDeleteTransportAd(reportData.item_id);\n                          else onDeleteAd(reportData.item_id);\n                          await supabase.from('support_messages').delete().eq('id', rep.id);\n                          setReports(prev => prev.filter(r => r.id !== rep.id));\n                          setDeletingReport(false);\n                        }\n                      }} disabled={deletingReport} className=\"px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600\">حذف العنصر</button>\n                      <button onClick={async () => {\n                        await supabase.from('support_messages').delete().eq('id', rep.id);\n                        setReports(prev => prev.filter(r => r.id !== rep.id));\n                      }} className=\"px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-500\">تجاهل البلاغ</button>\n                    </div>\n                  </div>\n                </div>\n              );\n            })}\n          </div>\n        )}\n\n        {tab === 'users' && ("
);

// Update Confirmation Dialog
code = code.replace(
  'isOpen={deleteAdId !== null}',
  'isOpen={deleteItem !== null}'
);
code = code.replace(
  'onClose={() => setDeleteAdId(null)}',
  "onClose={() => setDeleteItem(null)}"
);
code = code.replace(
  'if (deleteAdId !== null) {\n            onDeleteAd(deleteAdId);\n            setDeleteAdId(null);\n          }',
  "if (deleteItem !== null) {\n            if (deleteItem.type === 'ad') onDeleteAd(deleteItem.id);\n            else if (deleteItem.type === 'product') onDeleteProduct(deleteItem.id);\n            else if (deleteItem.type === 'transport') onDeleteTransportAd(deleteItem.id);\n            setDeleteItem(null);\n          }"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('AdminPanel updated.');
