import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update AdCard props
content = content.replace(
    'function AdCard({ ad, onSelect, isFav, onFav, onSellerClick }:{',
    'function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{'
)
content = content.replace(
    'ad:Ad; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(e:React.MouseEvent)=>void;',
    'ad:Ad; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(e:React.MouseEvent)=>void; onActionMenu?:(e:React.MouseEvent)=>void;'
)
content = content.replace(
    '<motion.div whileHover={{y:-4}} onClick={onSelect}\n      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col h-full">',
    '<motion.div whileHover={{y:-4}} onClick={onSelect} onContextMenu={onActionMenu}\n      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col h-full">'
)

# 2. Update ProductCard props
content = content.replace(
    'function ProductCard({ product, onSelect, isFav, onFav, onSellerClick }:{',
    'function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{'
)
content = content.replace(
    'product:Product; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(e:React.MouseEvent)=>void;',
    'product:Product; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(e:React.MouseEvent)=>void; onActionMenu?:(e:React.MouseEvent)=>void;'
)
content = content.replace(
    '<motion.div whileHover={{y:-4}} onClick={onSelect}\n      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full">',
    '<motion.div whileHover={{y:-4}} onClick={onSelect} onContextMenu={onActionMenu}\n      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full">'
)

# 3. Update SellerPublicPage props
content = content.replace(
    'function SellerPublicPage({ sellerId, allAds, allProducts, onBack, onSelectAd, onSelectProduct, favorites, onToggleFav, user, onAuthRequired, onDeleteProfile }:{',
    'function SellerPublicPage({ sellerId, allAds, allProducts, onBack, onSelectAd, onSelectProduct, favorites, onToggleFav, user, onAuthRequired, onDeleteProfile, onActionMenu }:{'
)
content = content.replace(
    'user:User|null; onAuthRequired:()=>void; onDeleteProfile?:(id:string)=>void;\n}) {',
    'user:User|null; onAuthRequired:()=>void; onDeleteProfile?:(id:string)=>void; onActionMenu?:(target:any)=>void;\n}) {'
)

# 4. Update AdCard usages in SellerPublicPage
content = content.replace(
    'onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}}/>)}',
    'onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}/>)}'
)

# 5. Update ProductCard usages in SellerPublicPage
content = content.replace(
    'onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}}/>)}',
    'onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}/>)}'
)

# 6. Update TransportView signature
content = content.replace(
    'function TransportView({ user, onBack, onCreateAd, onGoToMyLines, onSelectAd, lines, onPost, onUpdateStatus, onDeleteAd }: {',
    'function TransportView({ user, onBack, onCreateAd, onGoToMyLines, onSelectAd, lines, onPost, onUpdateStatus, onDeleteAd, onActionMenu }: {'
)
content = content.replace(
    'onDeleteAd?: (id: number) => void;\n}) {',
    'onDeleteAd?: (id: number) => void;\n  onActionMenu?: (target: {type:"transport", item:TransportAd}) => void;\n}) {'
)
content = content.replace(
    'if (window.confirm(\'هل أنت متأكد من حذف هذا الإعلان؟\')) {\n          onDeleteAd?.(ad.id);\n        }',
    'onActionMenu?.({ type: \'transport\', item: ad });'
)
content = content.replace(
    'if (window.confirm(\'هل أنت متأكد من حذف هذا الإعلان؟\')) {\n        onDeleteAd?.(ad.id);\n      }',
    'onActionMenu?.({ type: \'transport\', item: ad });'
)

# 7. Update TransportFormModal signature and behavior
content = content.replace(
    'function TransportFormModal({ onClose, onSubmit, user, lines = [] }: {',
    'function TransportFormModal({ onClose, onSubmit, user, lines = [], editAd }: {'
)
content = content.replace(
    'lines?: TransportAd[];\n}) {',
    'lines?: TransportAd[];\n  editAd?: TransportAd | null;\n}) {\n  const isEdit = !!editAd;'
)
content = content.replace(
    'const [type, setType] = useState<\'offer\'|\'request\'>(\'offer\');',
    'const [type, setType] = useState<\'offer\'|\'request\'>(editAd?.type || \'offer\');'
)
content = content.replace(
    'const [university, setUniversity] = useState(finalFormUniversities[0] || UNIVERSITIES[1]);\n  const [customUniversity, setCustomUniversity] = useState(\'\');\n  const [regions, setRegions] = useState(\'\');\n  const [price, setPrice] = useState(\'\');\n  const [seats, setSeats] = useState(\'4\');\n  const [shift, setShift] = useState(\'صباحي\');\n  const [vehicleType, setVehicleType] = useState(\'خصوصي\');\n  const [targetAudience, setTargetAudience] = useState(\'مختلط\');\n  const [phone, setPhone] = useState(user.phone || \'\');\n  const [note, setNote] = useState(\'\');',
    'const initialUniv = editAd?.university || finalFormUniversities[0] || UNIVERSITIES[1];\n  const isCustomUniv = editAd?.university && !finalFormUniversities.includes(editAd.university);\n  const [university, setUniversity] = useState(isCustomUniv ? \'أخرى\' : initialUniv);\n  const [customUniversity, setCustomUniversity] = useState(isCustomUniv ? editAd.university : \'\');\n  const [regions, setRegions] = useState(editAd?.regions || \'\');\n  const [price, setPrice] = useState(editAd?.price ? editAd.price : \'\');\n  const [seats, setSeats] = useState(editAd?.seats?.toString() || \'4\');\n  const [shift, setShift] = useState(editAd?.shift || \'صباحي\');\n  const [vehicleType, setVehicleType] = useState(editAd?.vehicleType || \'خصوصي\');\n  const [targetAudience, setTargetAudience] = useState(editAd?.targetAudience || \'مختلط\');\n  const [phone, setPhone] = useState(editAd?.phone || user.phone || \'\');\n  const [note, setNote] = useState(editAd?.note || \'\');'
)
content = content.replace(
    'id: Date.now(),',
    'id: isEdit ? editAd.id : Date.now(),'
)
content = content.replace(
    'postedBy: user.id, sellerName: user.name, sellerAvatar: user.avatar,',
    'postedBy: isEdit ? editAd.postedBy : user.id, sellerName: isEdit ? editAd.sellerName : user.name, sellerAvatar: isEdit ? editAd.sellerAvatar : user.avatar,'
)
content = content.replace(
    'createdAt: new Date().toISOString(),',
    'createdAt: isEdit ? editAd.createdAt : new Date().toISOString(),'
)
content = content.replace(
    'status: \'published\',',
    'status: isEdit ? editAd.status : \'published\','
)
content = content.replace(
    'views: 0,\n      interest: 0,\n      whatsappClicks: 0',
    'views: isEdit ? editAd.views : 0,\n      interest: isEdit ? editAd.interest : 0,\n      whatsappClicks: isEdit ? editAd.whatsappClicks : 0'
)


# 8. Update App states
content = content.replace(
    'const [editingProduct, setEditingProduct] = useState<Product|null>(null);',
    'const [editingProduct, setEditingProduct] = useState<Product|null>(null);\n  const [editingTransportAd, setEditingTransportAd] = useState<TransportAd|null>(null);'
)
content = content.replace(
    'const [selectedTransportAd, setSelectedTransportAd] = useState<TransportAd|null>(null);',
    'const [selectedTransportAd, setSelectedTransportAd] = useState<TransportAd|null>(null);\n  const [actionMenuTarget, setActionMenuTarget] = useState<{type:\'ad\'|\'product\'|\'transport\'; item:any}|null>(null);'
)

# 9. Modals in App.tsx
modals_replacement = """        {showCreateProduct&&user&&<ProductFormModal isOpen={showCreateProduct} onClose={()=>{setShowCreateProduct(false);setEditingProduct(null);}} onSubmit={handleAddOrEditProduct} user={user} editProduct={editingProduct}/>}
        {showCreateTransport&&user&&<TransportFormModal user={user} onClose={()=>{setShowCreateTransport(false);setEditingTransportAd(null);}} onSubmit={handlePostTransportAd} lines={allTransportAds} editAd={editingTransportAd}/>}
        {showNotifs&&<NotifPanel isOpen={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifications} onNotifClick={handleSellerClick} onHistoryClick={handleHistoryClick}/>}
        {activeDocTab&&<InfoDocsModal activeTab={activeDocTab} onClose={()=>setActiveDocTab(null)}/>}
        {activeLightbox&&<ImageLightboxModal src={activeLightbox.src} title={activeLightbox.title} onClose={()=>setActiveLightbox(null)}/>}
        {actionMenuTarget && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActionMenuTarget(null)} />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-gray-900 rounded-3xl w-full max-w-sm border border-gray-700 overflow-hidden z-10 p-4 space-y-3">
              <h3 className="text-white font-bold text-center border-b border-gray-800 pb-3 mb-3">خيارات الإعلان</h3>
              <button onClick={() => {
                if (actionMenuTarget.type === 'product') { setEditingProduct(actionMenuTarget.item); setShowCreateProduct(true); }
                if (actionMenuTarget.type === 'ad') { setEditingAd(actionMenuTarget.item); setShowCreateAd(true); }
                if (actionMenuTarget.type === 'transport') { setEditingTransportAd(actionMenuTarget.item); setShowCreateTransport(true); }
                setActionMenuTarget(null);
              }} className="w-full py-3 rounded-xl bg-gray-800 text-amber-400 font-bold flex items-center justify-center gap-2 hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                 تعديل الإعلان
              </button>
              <button onClick={() => {
                const confirmDelete = window.confirm('هل تريد بالتأكيد حذف هذا الإعلان؟');
                if (confirmDelete) {
                  if (actionMenuTarget.type === 'product') handleDeleteProduct(actionMenuTarget.item.id);
                  if (actionMenuTarget.type === 'ad') handleDeleteAd(actionMenuTarget.item.id);
                  if (actionMenuTarget.type === 'transport') handleDeleteTransportAd(actionMenuTarget.item.id);
                }
                setActionMenuTarget(null);
              }} className="w-full py-3 rounded-xl bg-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                 حذف الإعلان
              </button>
              <button onClick={() => setActionMenuTarget(null)} className="w-full py-3 rounded-xl bg-gray-800 text-gray-300 font-bold mt-2 hover:bg-gray-700">
                إلغاء
              </button>
            </motion.div>
          </div>
        )}"""
content = content.replace(
    '        {showCreateProduct&&user&&<ProductFormModal isOpen={showCreateProduct} onClose={()=>{setShowCreateProduct(false);setEditingProduct(null);}} onSubmit={handleAddOrEditProduct} user={user} editProduct={editingProduct}/>}\n        {showNotifs&&<NotifPanel isOpen={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifications} onNotifClick={handleSellerClick} onHistoryClick={handleHistoryClick}/>}\n        {activeDocTab&&<InfoDocsModal activeTab={activeDocTab} onClose={()=>setActiveDocTab(null)}/>}\n        {activeLightbox&&<ImageLightboxModal src={activeLightbox.src} title={activeLightbox.title} onClose={()=>setActiveLightbox(null)}/>}        ',
    modals_replacement
)

# 10. Fix usages in HomeView and App
content = content.replace(
    'onSellerClick={e=>{e.stopPropagation();if(ad.postedBy)onSellerClick(ad.postedBy);}}/>)}',
    'onSellerClick={e=>{e.stopPropagation();if(ad.postedBy)onSellerClick(ad.postedBy);}}\n                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) setActionMenuTarget({type:"ad",item:ad});}}/>)}'
)
content = content.replace(
    'onSellerClick={e=>{e.stopPropagation();onSellerClick(p.postedBy);}}/>)}',
    'onSellerClick={e=>{e.stopPropagation();onSellerClick(p.postedBy);}}\n                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) setActionMenuTarget({type:"product",item:p});}}/>)}'
)
content = content.replace(
    '<TransportView user={user} onBack={()=>setView(\'home\')} onCreateAd={()=>{if(!user){requireAuth();return;}setShowCreateTransport(true);}} onGoToMyLines={()=>{setView(\'profile\'); setTimeout(()=>window.dispatchEvent(new CustomEvent(\'switch-to-lines-tab\')), 100);}} onSelectAd={setSelectedTransportAd} lines={allTransportAds} onPost={handlePostTransportAd} onUpdateStatus={handleUpdateTransportStatus} onDeleteAd={handleDeleteTransportAd}/></motion.div>}',
    '<TransportView user={user} onBack={()=>setView(\'home\')} onCreateAd={()=>{if(!user){requireAuth();return;}setShowCreateTransport(true);}} onGoToMyLines={()=>{setView(\'profile\'); setTimeout(()=>window.dispatchEvent(new CustomEvent(\'switch-to-lines-tab\')), 100);}} onSelectAd={setSelectedTransportAd} lines={allTransportAds} onPost={handlePostTransportAd} onUpdateStatus={handleUpdateTransportStatus} onDeleteAd={handleDeleteTransportAd} onActionMenu={setActionMenuTarget}/></motion.div>}'
)
content = content.replace(
    '<SellerPublicPage sellerId={selectedSellerId} allAds={allAds} allProducts={allProducts} onBack={()=>setView(\'home\')} onSelectAd={setSelectedAd} onSelectProduct={setSelectedProduct} favorites={favorites} onToggleFav={handleToggleFav} user={user} onAuthRequired={requireAuth} onDeleteProfile={handleDeleteProfile}/></motion.div>}',
    '<SellerPublicPage sellerId={selectedSellerId} allAds={allAds} allProducts={allProducts} onBack={()=>setView(\'home\')} onSelectAd={setSelectedAd} onSelectProduct={setSelectedProduct} favorites={favorites} onToggleFav={handleToggleFav} user={user} onAuthRequired={requireAuth} onDeleteProfile={handleDeleteProfile} onActionMenu={setActionMenuTarget}/></motion.div>}'
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
