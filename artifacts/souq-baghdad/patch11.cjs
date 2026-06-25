const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

const globalHookCode = `
// ─────────────────────────────────────────────
// Online Statuses Cache
// ─────────────────────────────────────────────
let globalOnlineStatuses: Record<string, boolean> = {};
let onlineListeners: Array<() => void> = [];

export const useOnlineStatuses = () => {
  const [statuses, setStatuses] = React.useState(globalOnlineStatuses);
  React.useEffect(() => {
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
content = content.replace('// ─────────────────────────────────────────────\n// Logo\n// ─────────────────────────────────────────────', globalHookCode);

const pollingCode = `
  useEffect(() => {
    fetchGlobalOnlineStatuses();
    const iv = setInterval(fetchGlobalOnlineStatuses, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (initialHashParsed) return;`;
content = content.replace('useEffect(() => {\n    if (initialHashParsed) return;', pollingCode);

// AdCard
content = content.replace(
  'const time = useRelativeTime(ad.createdAtISO);',
  'const onlineStatuses = useOnlineStatuses();\n  const time = useRelativeTime(ad.createdAtISO);'
);
content = content.replace(
  `onClick={e=>{e.stopPropagation();onSellerClick?.(e);}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"`,
  `onClick={e=>{e.stopPropagation();onSellerClick?.(ad.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity relative"`
);
content = content.replace(
  `<img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>`,
  `<img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>\n            {onlineStatuses[ad.postedBy||''] && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-800" title="متصل الآن"></div>}`
);


// ProductCard
content = content.replace(
  'const time = useRelativeTime(product.createdAtISO);',
  'const onlineStatuses = useOnlineStatuses();\n  const time = useRelativeTime(product.createdAtISO);'
);
content = content.replace(
  `onClick={e=>{e.stopPropagation();onSellerClick?.(e);}} className="flex items-center gap-1.5 hover:opacity-80"`,
  `onClick={e=>{e.stopPropagation();onSellerClick?.(product.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 relative"`
);
// To avoid replacing the one from AdCard twice, use a regex that matches within ProductCard context or just since we replace one at a time, it's safer to just replace all instances:
content = content.replace(
  /<img src={product\.seller\?\.avatar \|\| 'https:\/\/images\.unsplash\.com\/photo-1633332755192-727a05c4013d\?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"\/>/g,
  `<img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>\n            {onlineStatuses[product.postedBy||''] && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-800" title="متصل الآن"></div>}`
);

// AdDetailModal
content = content.replace(
  'const [showViewers, setShowViewers] = useState(false);',
  'const [showViewers, setShowViewers] = useState(false);\n  const onlineStatuses = useOnlineStatuses();'
);
content = content.replace(
  `<img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {ad.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`,
  `<img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {onlineStatuses[ad.postedBy||''] && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" title="متصل الآن"></div>}\n                {ad.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`
);

// ProductDetailModal
content = content.replace(
  // Use a second replace for ProductDetailModal because they both have `setShowViewers`
  'const [showViewers, setShowViewers] = useState(false);\n  useEffect(()=>{',
  'const [showViewers, setShowViewers] = useState(false);\n  const onlineStatuses = useOnlineStatuses();\n  useEffect(()=>{'
);
content = content.replace(
  `<img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {product.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`,
  `<img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>\n                {onlineStatuses[product.postedBy||''] && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" title="متصل الآن"></div>}\n                {product.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}`
);

// SellerPublicPage
content = content.replace(
  'const [tab, setTab] = useState<\'ads\'|\'products\'>(\'ads\');',
  'const onlineStatuses = useOnlineStatuses();\n  const [tab, setTab] = useState<\'ads\'|\'products\'>(\'ads\');'
);
content = content.replace(
  `<img src={sellerUser?.avatar || sellerInfo.avatar} alt={sellerUser?.name || sellerInfo.name} className="w-full h-full object-cover"/>\n            {sellerUser?.isVerified && <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-4 border-gray-900 flex items-center justify-center" title="حساب موثق"><CheckCircle className="w-4 h-4 text-white"/></div>}`,
  `<img src={sellerUser?.avatar || sellerInfo.avatar} alt={sellerUser?.name || sellerInfo.name} className="w-full h-full object-cover"/>\n            {sellerUser && onlineStatuses[sellerUser.id] && <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-900 shadow-lg" title="متصل الآن"></div>}\n            {sellerUser?.isVerified && <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-4 border-gray-900 flex items-center justify-center" title="حساب موثق"><CheckCircle className="w-4 h-4 text-white"/></div>}`
);

// OwnerDashboard
content = content.replace(
  'const [broadcastSent, setBroadcastSent] = useState(false);',
  'const [broadcastSent, setBroadcastSent] = useState(false);\n  const [viewersModalItem, setViewersModalItem] = useState<{id:string|number, type:\'ad\'|\'product\'|\'transport\'}|null>(null);\n  const onlineStatuses = useOnlineStatuses();'
);
content = content.replace(
  'const isOnline = new Date().getTime() - new Date(u.last_seen).getTime() < 5 * 60 * 1000;',
  'const isOnline = onlineStatuses[u.id];'
);
content = content.replace(
  '<p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • {ad.views} 👁</p>',
  '<p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • <button onClick={() => setViewersModalItem({id: ad.id, type: \'ad\'})} className="hover:text-amber-400">{ad.views} 👁</button></p>'
);
content = content.replace(
  '<p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • {p.views} 👁 • {p.condition===\'new\'?\'جديد\':\'مستعمل\'}</p>',
  '<p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • <button onClick={() => setViewersModalItem({id: p.id, type: \'product\'})} className="hover:text-amber-400">{p.views} 👁</button> • {p.condition===\'new\'?\'جديد\':\'مستعمل\'}</p>'
);
content = content.replace(
  '<p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • {t.views||0} 👁</p>',
  '<p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • <button onClick={() => setViewersModalItem({id: t.id, type: \'transport\'})} className="hover:text-amber-400">{t.views||0} 👁</button></p>'
);
content = content.replace(
  `        {tab==='verification'&&(`,
  `        <AnimatePresence>\n          {viewersModalItem && <ViewersModal itemId={viewersModalItem.id} itemType={viewersModalItem.type} onClose={() => setViewersModalItem(null)} />}\n        </AnimatePresence>\n\n        {tab==='verification'&&(`
);

// MarketView Fix `onSellerClick` calls to pass the `id` string directly
content = content.replace(
  `onSellerClick={e=>{e.stopPropagation();if(ad.postedBy)onSellerClick(ad.postedBy);}}`,
  `onSellerClick={(id)=>{if(id)onSellerClick(id);}}`
);
content = content.replace(
  `onSellerClick={e=>{e.stopPropagation();onSellerClick(p.postedBy);}}`,
  `onSellerClick={(id)=>{if(id)onSellerClick(id);}}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched via reliable single-line replacements!');
