const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const [sellerUser, setSellerUser] = useState<any>(null);

  // Fallback to searching by ID or phone
  const sellerAds = allAds.filter(a=>a.postedBy===sellerId || a.phone===sellerId);
  const sellerProds = allProducts.filter(p=>p.postedBy===sellerId || p.phone===sellerId);
  const sellerInfo: SellerInfo|null = sellerAds[0]?.seller || sellerProds[0]?.seller || null;`;

const replacement1 = `  // Fallback to searching by ID or phone
  const sellerAds = allAds.filter(a=>a.postedBy===sellerId || a.phone===sellerId);
  const sellerProds = allProducts.filter(p=>p.postedBy===sellerId || p.phone===sellerId);
  const sellerInfo: SellerInfo|null = sellerAds[0]?.seller || sellerProds[0]?.seller || null;

  const users = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('souqUsers') || '[]'); } 
    catch { return []; }
  }, []);
  const foundUser = users.find((u: any) => u.id === sellerId || u.phone === sellerId);

  const [sellerUser, setSellerUser] = useState<any>(foundUser || (sellerInfo ? {
    id: sellerId,
    name: sellerInfo.name,
    avatar: sellerInfo.avatar,
    location: sellerInfo.location,
    isVerified: sellerInfo.isVerified,
    rating: sellerInfo.rating || 5,
    ratingCount: 1,
    cover: DEFAULT_COVER
  } : null));`;

content = content.replace(target1, replacement1);

const target2 = `  if(!sellerInfo) return (`;
const replacement2 = `  if(!sellerUser && !sellerInfo) return (`;

content = content.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', content);
console.log('done');
