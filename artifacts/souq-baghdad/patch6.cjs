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
content = content.replace(/\/\/ ─────────────────────────────────────────────\s*\n\/\/ Logo\s*\n\/\/ ─────────────────────────────────────────────/, globalHookCode);


// 2. Start polling in App
const pollingCode = `
  useEffect(() => {
    fetchGlobalOnlineStatuses();
    const iv = setInterval(fetchGlobalOnlineStatuses, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (initialHashParsed) return;`;
content = content.replace(/useEffect\(\(\) => \{\s*\n\s*if \(initialHashParsed\) return;/m, pollingCode);


// 3. AdCard
content = content.replace(/function AdCard\(\{\s*ad,\s*onClick,\s*onSellerClick,\s*isFav,\s*onFav,\s*onActionMenu\s*\}\s*:\s*AdCardProps\)\s*\{/m, `function AdCard({ ad, onClick, onSellerClick, isFav, onFav, onActionMenu }: AdCardProps) {
  const onlineStatuses = useOnlineStatuses();`);

content = content.replace(/<img src=\{ad\.seller\?\.avatar \|\| 'https:\/\/images.unsplash.com\/photo-1633332755192-727a05c4013d\?w=100'\} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"\/>/m, `<img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>
                {onlineStatuses[ad.postedBy||''] && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" title="متصل الآن"></div>}`);


// 4. ProductCard
content = content.replace(/function ProductCard\(\{\s*product,\s*onClick,\s*onSellerClick,\s*isFav,\s*onFav,\s*onActionMenu\s*\}\s*:\s*ProductCardProps\)\s*\{/m, `function ProductCard({ product, onClick, onSellerClick, isFav, onFav, onActionMenu }: ProductCardProps) {
  const onlineStatuses = useOnlineStatuses();`);

content = content.replace(/<img src=\{product\.seller\?\.avatar \|\| 'https:\/\/images\.unsplash\.com\/photo-1633332755192-727a05c4013d\?w=100'\} alt="" className="w-8 h-8 rounded-full border-2 border-purple-500 object-cover"\/>/m, `<img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-8 h-8 rounded-full border-2 border-purple-500 object-cover"/>
              {onlineStatuses[product.postedBy||''] && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800" title="متصل الآن"></div>}`);


// 5. SellerPublicPage
content = content.replace(/function SellerPublicPage\(\{ sellerId, sellerPhone, onBack, onSelectAd, onSelectProduct \}: SellerPublicPageProps\) \{/m, `function SellerPublicPage({ sellerId, sellerPhone, onBack, onSelectAd, onSelectProduct }: SellerPublicPageProps) {
  const onlineStatuses = useOnlineStatuses();`);

content = content.replace(/<img src=\{sellerUser\?\.avatar \|\| sellerInfo\.avatar\} alt=\{sellerUser\?\.name \|\| sellerInfo\.name\} className="w-full h-full object-cover"\/>/m, `<img src={sellerUser?.avatar || sellerInfo.avatar} alt={sellerUser?.name || sellerInfo.name} className="w-full h-full object-cover"/>
            {sellerUser && onlineStatuses[sellerUser.id] && <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-lg" title="متصل الآن"></div>}`);


// 6. OwnerDashboard state
content = content.replace(/const \[broadcastSent, setBroadcastSent\] = useState\(false\);/m, `const [broadcastSent, setBroadcastSent] = useState(false);
  const [viewersModalItem, setViewersModalItem] = useState<{id:string|number, type:'ad'|'product'|'transport'}|null>(null);
  const onlineStatuses = useOnlineStatuses();`);

content = content.replace(/const isOnline = new Date\(\)\.getTime\(\) - new Date\(u\.last_seen\)\.getTime\(\) < 5 \* 60 \* 1000;/m, `const isOnline = onlineStatuses[u.id];`);


// 7. Make Views clickable in OwnerDashboard Content tab
// For Ads
content = content.replace(/<p className="text-xs text-gray-400">\{ad\.location\} • \{formatPrice\(ad\.price\)\} د\.ع • \{ad\.views\} 👁<\/p>/g, `<p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • <button onClick={() => setViewersModalItem({id: ad.id, type: 'ad'})} className="hover:text-amber-400">{ad.views} 👁</button></p>`);

// For Products
content = content.replace(/<p className="text-xs text-gray-400">\{p\.governorate\} • \{formatPrice\(p\.price\)\} د\.ع • \{p\.views\} 👁 • \{p\.condition==='new'\?'جديد':'مستعمل'\}<\/p>/g, `<p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • <button onClick={() => setViewersModalItem({id: p.id, type: 'product'})} className="hover:text-amber-400">{p.views} 👁</button> • {p.condition==='new'?'جديد':'مستعمل'}</p>`);

// For Transport
content = content.replace(/<p className="text-xs text-gray-400">\{t\.regions\} • \{formatPrice\(t\.price\)\} د\.ع • \{t\.views\|\|0\} 👁<\/p>/g, `<p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • <button onClick={() => setViewersModalItem({id: t.id, type: 'transport'})} className="hover:text-amber-400">{t.views||0} 👁</button></p>`);


// 8. Add ViewersModal inside OwnerDashboard
const dashboardEnd = `        {tab==='verification'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">`;

const replaceDashboardEnd = `        <AnimatePresence>
          {viewersModalItem && <ViewersModal itemId={viewersModalItem.id} itemType={viewersModalItem.type} onClose={() => setViewersModalItem(null)} />}
        </AnimatePresence>

        {tab==='verification'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">`;
content = content.replace(dashboardEnd, replaceDashboardEnd);


fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully for views and online indicators!');
