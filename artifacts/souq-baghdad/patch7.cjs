const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// AdCard fix
content = content.replace(/function AdCard\(\{ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu \}:\{[^\}]+\}\) \{/m, `function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu }:any) {
  const onlineStatuses = useOnlineStatuses();`);

// ProductCard fix
content = content.replace(/function ProductCard\(\{ product, onSelect, isFav, onFav, onSellerClick, onActionMenu \}:\{[^\}]+\}\) \{/m, `function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu }:any) {
  const onlineStatuses = useOnlineStatuses();`);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed useOnlineStatuses in AdCard and ProductCard');
