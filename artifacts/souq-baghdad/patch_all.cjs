const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Global Hook
const globalHookCode = `
// ─────────────────────────────────────────────
// Online Statuses Cache
// ─────────────────────────────────────────────
let globalOnlineStatuses: Record<string, boolean> = {};
let onlineListeners: Array<() => void> = [];

const useOnlineStatuses = () => {
  const [statuses, setStatuses] = useState(globalOnlineStatuses);
  useEffect(() => {
    const trigger = () => setStatuses({...globalOnlineStatuses});
    onlineListeners.push(trigger);
    return () => { onlineListeners = onlineListeners.filter(l => l !== trigger); };
  }, []);
  return statuses;
}

const fetchGlobalOnlineStatuses = async () => {
  try {
    const { data } = await supabase.from('profiles').select('id, last_seen');
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach(p => {
        if(p.last_seen) {
          map[p.id] = new Date().getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000;
        }
      });
      globalOnlineStatuses = map;
      onlineListeners.forEach(l => l());
    }
  } catch(e) {}
};

// ─────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────`;
content = content.replace(/\/\/ ─────────────────────────────────────────────\n\/\/ Logo\n\/\/ ─────────────────────────────────────────────/, globalHookCode);


// 2. Start polling in App
const pollingCode = `
  useEffect(() => {
    fetchGlobalOnlineStatuses();
    const iv = setInterval(fetchGlobalOnlineStatuses, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (initialHashParsed) return;`;
content = content.replace(/useEffect\(\(\) => \{\n    if \(initialHashParsed\) return;/m, pollingCode);


// 3. AdCard (replacing exact blocks)
content = content.replace(
  `function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{ ad: Ad, onSelect: ()=>void, isFav: boolean, onFav?: (e: React.MouseEvent)=>void, onSellerClick?: (id: string)=>void, onActionMenu?: (e: React.MouseEvent)=>void }) {`,
  `function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{ ad: Ad, onSelect: ()=>void, isFav: boolean, onFav?: (e: React.MouseEvent)=>void, onSellerClick?: (id: string)=>void, onActionMenu?: (e: React.MouseEvent)=>void }) {\n  const onlineStatuses = useOnlineStatuses();`
);

content = content.replace(
  `<img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>`,
  `<img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {onlineStatuses[ad.postedBy||''] && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" title="متصل الآن"></div>}`
);

content = content.replace(
  `          <button onClick={e=>{e.stopPropagation();onSellerClick?.(e);}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">`,
  `          <button onClick={e=>{e.stopPropagation();onSellerClick?.(ad.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">`
);


// 4. ProductCard
content = content.replace(
  `function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{ product: Product, onSelect: ()=>void, isFav: boolean, onFav?: (e: React.MouseEvent)=>void, onSellerClick?: (id: string)=>void, onActionMenu?: (e: React.MouseEvent)=>void }) {`,
  `function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{ product: Product, onSelect: ()=>void, isFav: boolean, onFav?: (e: React.MouseEvent)=>void, onSellerClick?: (id: string)=>void, onActionMenu?: (e: React.MouseEvent)=>void }) {\n  const onlineStatuses = useOnlineStatuses();`
);

content = content.replace(
  `<img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>`,
  `<img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>\n            {onlineStatuses[product.postedBy||''] && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-800" title="متصل الآن"></div>}`
);

content = content.replace(
  `          <button onClick={e=>{e.stopPropagation();onSellerClick?.(e);}} className="flex items-center gap-1.5 hover:opacity-80">`,
  `          <button onClick={e=>{e.stopPropagation();onSellerClick?.(product.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80">`
);


// 5. AdDetailModal and ProductDetailModal
content = content.replace(
  `onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string)=>void;\n}) {`,
  `onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string)=>void;\n}) {\n  const onlineStatuses = useOnlineStatuses();`
);

content = content.replace(
  `                <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {ad.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`,
  `                <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {onlineStatuses[ad.postedBy||''] && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" title="متصل الآن"></div>}\n                {ad.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`
);

// ProductDetailModal
content = content.replace(
  `onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string)=>void;\n}) {\n  const [imgIdx, setImgIdx] = useState(0);`,
  `onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string)=>void;\n}) {\n  const onlineStatuses = useOnlineStatuses();\n  const [imgIdx, setImgIdx] = useState(0);`
);

content = content.replace(
  `                <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {product.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`,
  `                <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {onlineStatuses[product.postedBy||''] && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" title="متصل الآن"></div>}\n                {product.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`
);


// 6. SellerPublicPage
content = content.replace(
  `function SellerPublicPage({ sellerId, sellerPhone, onBack, onSelectAd, onSelectProduct }: SellerPublicPageProps) {`,
  `function SellerPublicPage({ sellerId, sellerPhone, onBack, onSelectAd, onSelectProduct }: SellerPublicPageProps) {\n  const onlineStatuses = useOnlineStatuses();`
);

content = content.replace(
  `<img src={sellerUser?.avatar || sellerInfo.avatar} alt={sellerUser?.name || sellerInfo.name} className="w-full h-full object-cover"/>\n            {sellerUser?.isVerified && <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-4 border-gray-900 flex items-center justify-center" title="حساب موثق"><CheckCircle className="w-4 h-4 text-white"/></div>}`,
  `<img src={sellerUser?.avatar || sellerInfo.avatar} alt={sellerUser?.name || sellerInfo.name} className="w-full h-full object-cover"/>\n            {sellerUser && onlineStatuses[sellerUser.id] && <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-900 shadow-lg" title="متصل الآن"></div>}\n            {sellerUser?.isVerified && <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-4 border-gray-900 flex items-center justify-center" title="حساب موثق"><CheckCircle className="w-4 h-4 text-white"/></div>}`
);


// 7. OwnerDashboard
content = content.replace(
  `  const [broadcastSent, setBroadcastSent] = useState(false);`,
  `  const [broadcastSent, setBroadcastSent] = useState(false);\n  const [viewersModalItem, setViewersModalItem] = useState<{id:string|number, type:'ad'|'product'|'transport'}|null>(null);\n  const onlineStatuses = useOnlineStatuses();`
);

content = content.replace(
  `const isOnline = new Date().getTime() - new Date(u.last_seen).getTime() < 5 * 60 * 1000;`,
  `const isOnline = onlineStatuses[u.id];`
);

content = content.replace(
  `<p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • {ad.views} 👁</p>`,
  `<p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • <button onClick={() => setViewersModalItem({id: ad.id, type: 'ad'})} className="hover:text-amber-400">{ad.views} 👁</button></p>`
);

content = content.replace(
  `<p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • {p.views} 👁 • {p.condition==='new'?'جديد':'مستعمل'}</p>`,
  `<p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • <button onClick={() => setViewersModalItem({id: p.id, type: 'product'})} className="hover:text-amber-400">{p.views} 👁</button> • {p.condition==='new'?'جديد':'مستعمل'}</p>`
);

content = content.replace(
  `<p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • {t.views||0} 👁</p>`,
  `<p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • <button onClick={() => setViewersModalItem({id: t.id, type: 'transport'})} className="hover:text-amber-400">{t.views||0} 👁</button></p>`
);

const dashboardEnd = `        {tab==='verification'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">`;

const replaceDashboardEnd = `        <AnimatePresence>
          {viewersModalItem && <ViewersModal itemId={viewersModalItem.id} itemType={viewersModalItem.type} onClose={() => setViewersModalItem(null)} />}
        </AnimatePresence>

        {tab==='verification'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">`;
content = content.replace(dashboardEnd, replaceDashboardEnd);

// Fix MarketView onSellerClick
content = content.replace(
  `onSellerClick={e=>{e.stopPropagation();if(ad.postedBy)onSellerClick(ad.postedBy);}}`,
  `onSellerClick={(id)=>{if(id)onSellerClick(id);}}`
);
content = content.replace(
  `onSellerClick={e=>{e.stopPropagation();onSellerClick(p.postedBy);}}`,
  `onSellerClick={(id)=>{if(id)onSellerClick(id);}}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched fully and safely.');
