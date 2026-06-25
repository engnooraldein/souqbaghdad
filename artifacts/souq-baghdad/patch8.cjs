const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// AdCard fix
content = content.replace(/function AdCard\(\{ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu \}:any\) \{/m, `function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{ ad: Ad, onSelect: ()=>void, isFav: boolean, onFav?: (e: React.MouseEvent)=>void, onSellerClick?: (id: string)=>void, onActionMenu?: (e: React.MouseEvent)=>void }) {`);

// ProductCard fix
content = content.replace(/function ProductCard\(\{ product, onSelect, isFav, onFav, onSellerClick, onActionMenu \}:any\) \{/m, `function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{ product: Product, onSelect: ()=>void, isFav: boolean, onFav?: (e: React.MouseEvent)=>void, onSellerClick?: (id: string)=>void, onActionMenu?: (e: React.MouseEvent)=>void }) {`);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed useOnlineStatuses in AdCard and ProductCard');
