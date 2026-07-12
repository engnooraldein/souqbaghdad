const fs = require('fs');

let pv = fs.readFileSync('src/components/ProfileView.tsx', 'utf-8');
if (!pv.includes('import { DEFAULT_AVATAR }')) {
    pv = "import { DEFAULT_AVATAR } from '../App';\n" + pv;
    fs.writeFileSync('src/components/ProfileView.tsx', pv);
}

let mv = fs.readFileSync('src/components/MarketView.tsx', 'utf-8');
if (!mv.includes('import { DEFAULT_AVATAR }')) {
    mv = "import { DEFAULT_AVATAR } from '../App';\n" + mv;
    fs.writeFileSync('src/components/MarketView.tsx', mv);
}

let sp = fs.readFileSync('src/components/SellerPublicPage.tsx', 'utf-8');
if (!sp.includes('import { DEFAULT_AVATAR }')) {
    sp = "import { DEFAULT_AVATAR } from '../App';\n" + sp;
    fs.writeFileSync('src/components/SellerPublicPage.tsx', sp);
}
console.log('Fixed imports for real');
