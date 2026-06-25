const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add short_id to Ad and Product
content = content.replace(/avgResponseTime: string; postedBy\?: string;\s*}/, "avgResponseTime: string; postedBy?: string; short_id?: string;\n}");
content = content.replace(/views: number; postedBy: string; stock: number;\s*}/, "views: number; postedBy: string; stock: number; short_id?: string;\n}");

// 2. Fix recordItemView calls
content = content.replace(/recordItemView\(ad\.id, 'ad', user, ad\.seller_id\);/g, "recordItemView(ad.id, 'ad', user, ad.postedBy);");
content = content.replace(/recordItemView\(product\.id, 'product', user, product\.seller_id\);/g, "recordItemView(product.id, 'product', user, product.postedBy);");
content = content.replace(/recordItemView\(ad\.id, 'transport', user, ad\.seller_id\);/g, "recordItemView(ad.id, 'transport', user, ad.postedBy);");

// 3. Fix ProfileView setEf email issue
content = content.replace(/setEf\(\{name:user\.name,phone:user\.phone,location:user\.location,bio:user\.bio\|\|''\}\)/g, "setEf({name:user.name,phone:user.phone,location:user.location,bio:user.bio||'',email:user.email||''})");

// 4. Fix SellerPublicPage props
content = content.replace(/onDeleteProfile\?:\(id:string\)=>void;\s*\}\) \{/g, "onDeleteProfile?:(id:string)=>void; onActionMenu?:any;\n}) {");

// 5. Fix MarketView props
content = content.replace(/transportLines: TransportAd\[\];\s*\}\) \{/g, "transportLines: TransportAd[];\n  onActionMenu?: any;\n}) {");

// 6. Fix OwnerDashboard onDeleteTransportAd prop type
content = content.replace(/onDeleteTransportAd:\(id:string\)=>void;/g, "onDeleteTransportAd:(id:number)=>void;");

// 7. Fix OwnerDashboard Transport rendering
content = content.replace(/<div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">\{t\.title\}<\/p>\s*<p className="text-xs text-gray-400">\{t\.fromLocation\} ➔ \{t\.toLocation\} • \{formatPrice\(t\.price\)\} د\.ع • \{t\.views\|\|0\} 👁<\/p><\/div>\s*<button onClick=\{\(\)=>onDeleteTransportAd\(t\.id\)\} className="p-2 bg-red-500\/20 rounded-lg text-red-400 hover:bg-red-500\/30 flex-shrink-0"><Trash2 className="w-4 h-4"\/><\/button>/g, `<div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{t.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'} ({t.university})</p>\n                    <p className="text-xs text-gray-400">{t.regions} • {formatPrice(t.price)} د.ع • {t.views||0} 👁</p></div>\n                  <button onClick={()=>onDeleteTransportAd(t.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>`);

// 8. Restore DEVICE_COLORS
content = content.replace(/const COLORS = \['#f59e0b','#10b981','#3b82f6'\];/g, "const DEVICE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6'];\nconst COLORS = ['#f59e0b','#10b981','#3b82f6'];");

// 9. Fix MarketView action menu calls
content = content.replace(/setActionMenuTarget\(\{type:"ad",item:ad\}\)/g, "onActionMenu?.({type:\"ad\",item:ad})");
content = content.replace(/setActionMenuTarget\(\{type:"product",item:p\}\)/g, "onActionMenu?.({type:\"product\",item:p})");

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully');
