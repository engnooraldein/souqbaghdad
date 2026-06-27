import os

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace handleDeleteAdWithLog back to onDeleteAd in non-OwnerDashboard places
# In AdminPanel and other places:
content = content.replace("handleDeleteAdWithLog(ad.id)", "onDeleteAd(ad.id)")
content = content.replace("handleDeleteProductWithLog(p.id)", "onDeleteProduct(p.id)")

# Now, only inside OwnerDashboard's content tab, replace onDeleteAd(ad.id) and onDeleteProduct(p.id)
# Let's find OwnerDashboard content tab
old_owner_content = """        {tab==='content'&&(
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3><span className="text-gray-400 text-xs">{ads.reduce((s,a)=>s+a.views,0)} مشاهدة</span></div>
              {ads.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا إعلانات</div>:ads.map(ad=>(
                <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                    <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • {ad.views} 👁</p></div>
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
                    <p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • {p.views} 👁 • {p.condition==='new'?'جديد':'مستعمل'}</p></div>
                  <button onClick={()=>onDeleteProduct(p.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}"""

new_owner_content = """        {tab==='content'&&(
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3><span className="text-gray-400 text-xs">{ads.reduce((s,a)=>s+a.views,0)} مشاهدة</span></div>
              {ads.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا إعلانات</div>:ads.map(ad=>(
                <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                    <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • {ad.views} 👁</p></div>
                  <button onClick={()=>handleDeleteAdWithLog(ad.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">المنتجات ({products.length})</h3><span className="text-gray-400 text-xs">{products.reduce((s,p)=>s+p.views,0)} مشاهدة</span></div>
              {products.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا منتجات</div>:products.map(p=>(
                <div key={p.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • {p.views} 👁 • {p.condition==='new'?'جديد':'مستعمل'}</p></div>
                  <button onClick={()=>handleDeleteProductWithLog(p.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}"""

if old_owner_content in content:
    content = content.replace(old_owner_content, new_owner_content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed scopes successfully!")
