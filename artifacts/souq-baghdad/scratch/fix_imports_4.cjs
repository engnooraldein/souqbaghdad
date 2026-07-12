const fs = require('fs');

let pv = fs.readFileSync('src/components/ProfileView.tsx', 'utf-8');
pv = pv.replace(/import { DEFAULT_AVATAR } from '\.\.\/App';\n/g, '');
pv = pv.replace(/, DEFAULT_AVATAR } from '\.\.\/App'/g, " } from '../App'");
pv = pv.replace(/DEFAULT_AVATAR, /g, "");
if (!pv.includes('import { MyLinesTab }')) {
    pv = "import { MyLinesTab } from './MyLinesTab';\n" + pv;
}
fs.writeFileSync('src/components/ProfileView.tsx', pv);

let mv = fs.readFileSync('src/components/MarketView.tsx', 'utf-8');
mv = mv.replace(/import { DEFAULT_AVATAR } from '\.\.\/App';\n/g, '');
mv = mv.replace(/, DEFAULT_AVATAR } from '\.\.\/App'/g, " } from '../App'");
mv = mv.replace(/DEFAULT_AVATAR, /g, "");
fs.writeFileSync('src/components/MarketView.tsx', mv);

let sp = fs.readFileSync('src/components/SellerPublicPage.tsx', 'utf-8');
sp = sp.replace(/import { DEFAULT_AVATAR } from '\.\.\/App';\n/g, '');
sp = sp.replace(/, DEFAULT_AVATAR } from '\.\.\/App'/g, " } from '../App'");
sp = sp.replace(/DEFAULT_AVATAR, /g, "");
fs.writeFileSync('src/components/SellerPublicPage.tsx', sp);
console.log('Fixed DEFAULT_AVATAR imports');
