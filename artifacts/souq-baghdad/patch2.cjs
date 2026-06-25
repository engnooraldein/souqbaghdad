const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 5. Fix MarketView props
content = content.replace(/function MarketView\(\{ user, allAds, allProducts, favorites, onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, onTransportClick, onSelectTransportAd, transportLines \}:\{/, "function MarketView({ user, allAds, allProducts, favorites, onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, onTransportClick, onSelectTransportAd, transportLines, onActionMenu }:{");
content = content.replace(/transportLines: TransportAd\[\];\s*\}\) \{/g, "transportLines: TransportAd[];\n  onActionMenu?: any;\n}) {");

// 8. Restore DEVICE_COLORS
content = content.replace(/const COLORS = \['#f59e0b','#10b981','#3b82f6'\];/g, "const DEVICE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6'];\nconst COLORS = ['#f59e0b','#10b981','#3b82f6'];");

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully');
