const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Inject useOnlineStatuses
if (!content.includes('export const useOnlineStatuses')) {
  const hookCode = `
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
  content = content.replace(/\/\/ ─────────────────────────────────────────────\r?\n\/\/ Logo\r?\n\/\/ ─────────────────────────────────────────────/, hookCode);
}

// Fix 2: AdCard onSellerClick parameter type
content = content.replace(
  /onSellerClick\?: \(id: string\)=>void/g,
  `onSellerClick?: (id: any)=>void`
);
content = content.replace(
  /onSellerClick\?:\(id:string\)=>void/g,
  `onSellerClick?:(id:any)=>void`
);

// Fix 3: MarketView onSellerClick parameter
content = content.replace(
  /onSellerClick=\{e=>\{e\.stopPropagation\(\);onSellerClick\(p\.postedBy\);\}\}/g,
  `onSellerClick={(id)=>{if(id)onSellerClick(id);}}`
);
content = content.replace(
  /onSellerClick=\{e=>\{e\.stopPropagation\(\);if\(ad\.postedBy\)onSellerClick\(ad\.postedBy\);\}\}/g,
  `onSellerClick={(id)=>{if(id)onSellerClick(id);}}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx final fixes applied!');
