import os

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Helper function definition
target_helper_anchor = """export const getCoverImage = (user: {role?: string, cover?: string}) => {
  if (['pro', 'vendor', 'admin', 'owner'].includes(user?.role || '')) {
    return user.cover || DEFAULT_COVER;
  }
  return DEFAULT_COVER;
};"""

replacement_helper = target_helper_anchor + """

export const getGlowClass = (role?: string) => {
  if (!role) return '';
  if (role === 'owner') return 'glow-owner';
  if (role === 'admin') return 'glow-admin';
  if (role === 'vendor') return 'glow-vendor';
  if (role === 'pro') return 'glow-pro';
  return '';
};"""

if target_helper_anchor in content:
    content = content.replace(target_helper_anchor, replacement_helper)
    print("1. Added getGlowClass helper definition.")
else:
    print("ERROR 1: getCoverImage target not found!")

# 2. Add role to sellersMap loadAllProfilesGlobal
target_map_db = """        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
          dbProfiles.forEach((p: any) => {
            sellersMap.set(p.id, {
              id: p.id,
              name: p.full_name || p.name || 'مستخدم',
              avatar: p.avatar_url || p.avatar || DEFAULT_AVATAR,
              phone: p.phone || '',
              location: p.city || p.location || 'بغداد',
              adCount: 0,
              prodCount: 0,
              rating: 4.9,
              created_at: p.created_at || new Date().toISOString(),
              isVerified: p.role === 'owner' || p.role === 'vendor' || p.role === 'admin'
            });
          });
        }"""

replacement_map_db = """        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
          dbProfiles.forEach((p: any) => {
            sellersMap.set(p.id, {
              id: p.id,
              name: p.full_name || p.name || 'مستخدم',
              avatar: p.avatar_url || p.avatar || DEFAULT_AVATAR,
              phone: p.phone || '',
              location: p.city || p.location || 'بغداد',
              adCount: 0,
              prodCount: 0,
              rating: 4.9,
              created_at: p.created_at || new Date().toISOString(),
              isVerified: p.role === 'owner' || p.role === 'vendor' || p.role === 'admin',
              role: p.role || 'user'
            });
          });
        }"""

if target_map_db in content:
    content = content.replace(target_map_db, replacement_map_db)
    print("2. Added role to sellersMap dbProfiles loop.")
else:
    print("ERROR 2: dbProfiles target not found!")

target_map_local = """        localUsers.forEach((u: any) => {
          if (!sellersMap.has(u.id)) {
            sellersMap.set(u.id, {
              id: u.id,
              name: u.name,
              avatar: u.avatar || DEFAULT_AVATAR,
              phone: u.phone || '',
              location: u.location || 'بغداد',
              adCount: u.adCount || 0,
              prodCount: 0,
              rating: 4.8,
              created_at: new Date().toISOString(),
              isVerified: u.role === 'owner' || u.role === 'vendor' || u.isVerified
            });
          }
        });"""

replacement_map_local = """        localUsers.forEach((u: any) => {
          if (!sellersMap.has(u.id)) {
            sellersMap.set(u.id, {
              id: u.id,
              name: u.name,
              avatar: u.avatar || DEFAULT_AVATAR,
              phone: u.phone || '',
              location: u.location || 'بغداد',
              adCount: u.adCount || 0,
              prodCount: 0,
              rating: 4.8,
              created_at: new Date().toISOString(),
              isVerified: u.role === 'owner' || u.role === 'vendor' || u.isVerified,
              role: u.role || 'user'
            });
          }
        });"""

if target_map_local in content:
    content = content.replace(target_map_local, replacement_map_local)
    print("3. Added role to sellersMap localUsers loop.")
else:
    print("ERROR 3: localUsers target not found!")

target_map_ads = """        allAds.forEach(ad => {
          if (ad.postedBy) {
            if (!sellersMap.has(ad.postedBy)) {
              sellersMap.set(ad.postedBy, {
                id: ad.postedBy,
                name: ad.seller?.name || 'مستخدم',
                avatar: ad.seller?.avatar || DEFAULT_AVATAR,
                phone: ad.phone || '',
                location: ad.location || ad.governorate || 'بغداد',
                adCount: 1,
                prodCount: 0,
                rating: ad.seller?.rating || 4.8,
                created_at: ad.createdAtISO || new Date().toISOString(),
                isVerified: ad.seller?.isVerified || false
              });
            } else {"""

replacement_map_ads = """        allAds.forEach(ad => {
          if (ad.postedBy) {
            if (!sellersMap.has(ad.postedBy)) {
              sellersMap.set(ad.postedBy, {
                id: ad.postedBy,
                name: ad.seller?.name || 'مستخدم',
                avatar: ad.seller?.avatar || DEFAULT_AVATAR,
                phone: ad.phone || '',
                location: ad.location || ad.governorate || 'بغداد',
                adCount: 1,
                prodCount: 0,
                rating: ad.seller?.rating || 4.8,
                created_at: ad.createdAtISO || new Date().toISOString(),
                isVerified: ad.seller?.isVerified || false,
                role: 'user'
              });
            } else {"""

if target_map_ads in content:
    content = content.replace(target_map_ads, replacement_map_ads)
    print("4. Added role to sellersMap ads fallback loop.")
else:
    print("ERROR 4: ads fallback target not found!")

target_map_prods = """        allProducts.forEach(p => {
          if (p.postedBy) {
            if (!sellersMap.has(p.postedBy)) {
              sellersMap.set(p.postedBy, {
                id: p.postedBy,
                name: p.seller?.name || 'مستخدم',
                avatar: p.seller?.avatar || DEFAULT_AVATAR,
                phone: p.phone || '',
                location: p.governorate || 'بغداد',
                adCount: 0,
                prodCount: 1,
                rating: p.seller?.rating || 4.8,
                created_at: p.createdAtISO || new Date().toISOString(),
                isVerified: p.seller?.isVerified || false
              });
            } else {"""

replacement_map_prods = """        allProducts.forEach(p => {
          if (p.postedBy) {
            if (!sellersMap.has(p.postedBy)) {
              sellersMap.set(p.postedBy, {
                id: p.postedBy,
                name: p.seller?.name || 'مستخدم',
                avatar: p.seller?.avatar || DEFAULT_AVATAR,
                phone: p.phone || '',
                location: p.governorate || 'بغداد',
                adCount: 0,
                prodCount: 1,
                rating: p.seller?.rating || 4.8,
                created_at: p.createdAtISO || new Date().toISOString(),
                isVerified: p.seller?.isVerified || false,
                role: 'user'
              });
            } else {"""

if target_map_prods in content:
    content = content.replace(target_map_prods, replacement_map_prods)
    print("5. Added role to sellersMap products fallback loop.")
else:
    print("ERROR 5: products fallback target not found!")

# 3. Add role to sellerUser loaded from Supabase direct query
target_db_single = """        if (dbProfile && isMounted) {
          setSellerUser({
            id: dbProfile.id,
            name: dbProfile.full_name || dbProfile.name || 'بائع في سوق بغداد',
            avatar: dbProfile.avatar_url || dbProfile.avatar || DEFAULT_AVATAR,
            phone: dbProfile.phone || '',
            location: dbProfile.city || dbProfile.location || 'بغداد',
            isVerified: dbProfile.role === 'owner' || dbProfile.role === 'vendor' || dbProfile.role === 'admin',
            rating: 4.9,
            ratingCount: 5,
            cover: dbProfile.cover_url || DEFAULT_COVER,
            created_at: dbProfile.created_at
          });"""

replacement_db_single = """        if (dbProfile && isMounted) {
          setSellerUser({
            id: dbProfile.id,
            name: dbProfile.full_name || dbProfile.name || 'بائع في سوق بغداد',
            avatar: dbProfile.avatar_url || dbProfile.avatar || DEFAULT_AVATAR,
            phone: dbProfile.phone || '',
            location: dbProfile.city || dbProfile.location || 'بغداد',
            isVerified: dbProfile.role === 'owner' || dbProfile.role === 'vendor' || dbProfile.role === 'admin',
            rating: 4.9,
            ratingCount: 5,
            cover: dbProfile.cover_url || DEFAULT_COVER,
            created_at: dbProfile.created_at,
            role: dbProfile.role || 'user'
          });"""

if target_db_single in content:
    content = content.replace(target_db_single, replacement_db_single)
    print("6. Added role to dbProfile maybeSingle loader mapping.")
else:
    print("ERROR 6: dbProfile maybeSingle target not found!")

# 4. Modify AdCard signature & image tags
target_ad_card_sig = """function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{
  ad:Ad; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
}) {"""

replacement_ad_card_sig = """function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{
  ad:Ad; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
  sellerRole?: string;
}) {"""

if target_ad_card_sig in content:
    content = content.replace(target_ad_card_sig, replacement_ad_card_sig)
    print("7. Updated AdCard signature.")
else:
    print("ERROR 7: AdCard signature target not found!")

target_ad_card_img = """          <button onClick={e=>{e.stopPropagation();onSellerClick?.(ad.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity relative">
            <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>"""

replacement_ad_card_img = """          <button onClick={e=>{e.stopPropagation();onSellerClick?.(ad.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity relative">
            <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-5 h-5 rounded-full object-cover ${getGlowClass(sellerRole)}`}/>"""

if target_ad_card_img in content:
    content = content.replace(target_ad_card_img, replacement_ad_card_img)
    print("8. Updated AdCard avatar image tag.")
else:
    print("ERROR 8: AdCard image target not found!")

# 5. Modify ProductCard signature & image tags
target_prod_card_sig = """function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu }:{
  product:Product; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
}) {"""

replacement_prod_card_sig = """function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{
  product:Product; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
  sellerRole?: string;
}) {"""

if target_prod_card_sig in content:
    content = content.replace(target_prod_card_sig, replacement_prod_card_sig)
    print("9. Updated ProductCard signature.")
else:
    print("ERROR 9: ProductCard signature target not found!")

target_prod_card_img = """          <button onClick={e=>{e.stopPropagation();onSellerClick?.(product.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 relative">
            <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>"""

replacement_prod_card_img = """          <button onClick={e=>{e.stopPropagation();onSellerClick?.(product.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 relative">
            <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-5 h-5 rounded-full object-cover ${getGlowClass(sellerRole)}`}/>"""

if target_prod_card_img in content:
    content = content.replace(target_prod_card_img, replacement_prod_card_img)
    print("10. Updated ProductCard avatar image tag.")
else:
    print("ERROR 10: ProductCard image target not found!")

# 6. Pass sellerRole in SellerView
target_sv_ads = """            {sellerAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}/>)}"""
replacement_sv_ads = """            {sellerAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}} sellerRole={effectiveSeller.role}/>)}"""

if target_sv_ads in content:
    content = content.replace(target_sv_ads, replacement_sv_ads)
    print("11. Passed sellerRole to AdCard in SellerView.")
else:
    print("ERROR 11: SellerView AdCard target not found!")

target_sv_prods = """            {sellerProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}/>)}"""
replacement_sv_prods = """            {sellerProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}} sellerRole={effectiveSeller.role}/>)}"""

if target_sv_prods in content:
    content = content.replace(target_sv_prods, replacement_sv_prods)
    print("12. Passed sellerRole to ProductCard in SellerView.")
else:
    print("ERROR 12: SellerView ProductCard target not found!")

# 7. Pass sellerRole in MarketView for both Ads and Products
target_mv_ads = """            {showAds&&filterAds.length>0&&(
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}}
                  onSellerClick={id=>onSellerClick(id, 'home')}
                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}/>)}
              </div>
            )}"""

replacement_mv_ads = """            {showAds&&filterAds.length>0&&(
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterAds.map(ad=>{
                  const seller = storedUsers?.find(u=>u.id===ad.postedBy);
                  return <AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                    onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}}
                    onSellerClick={id=>onSellerClick(id, 'home')}
                    onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}
                    sellerRole={seller?.role}
                  />;
                })}
              </div>
            )}"""

if target_mv_ads in content:
    content = content.replace(target_mv_ads, replacement_mv_ads)
    print("13. Mapped and passed sellerRole to AdCard in MarketView.")
else:
    print("ERROR 13: MarketView AdCard target not found!")

target_mv_prods = """            {showProds&&filterProds.length>0&&(
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}}
                  onSellerClick={id=>onSellerClick(id, 'home')}
                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}/>)}
              </div>
            )}"""

replacement_mv_prods = """            {showProds&&filterProds.length>0&&(
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterProds.map(p=>{
                  const seller = storedUsers?.find(u=>u.id===p.postedBy);
                  return <ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                    onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}}
                    onSellerClick={id=>onSellerClick(id, 'home')}
                    onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}
                    sellerRole={seller?.role}
                  />;
                })}
              </div>
            )}"""

if target_mv_prods in content:
    content = content.replace(target_mv_prods, replacement_mv_prods)
    print("14. Mapped and passed sellerRole to ProductCard in MarketView.")
else:
    print("ERROR 14: MarketView ProductCard target not found!")

# 8. Modals glow avatar updates
target_ad_modal_img = """              <div className="relative hover:opacity-80 transition-opacity shrink-0" onClick={()=>onSellerClick?.(ad.postedBy||'')}>
                <img src={liveSeller?.avatar || ad.seller?.avatar || DEFAULT_AVATAR} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>"""

replacement_ad_modal_img = """              <div className="relative hover:opacity-80 transition-opacity shrink-0" onClick={()=>onSellerClick?.(ad.postedBy||'')}>
                <img src={liveSeller?.avatar || ad.seller?.avatar || DEFAULT_AVATAR} alt="" className={`w-12 h-12 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>"""

if target_ad_modal_img in content:
    content = content.replace(target_ad_modal_img, replacement_ad_modal_img)
    print("15. Updated AdDetailModal avatar image tag.")
else:
    print("ERROR 15: AdDetailModal image target not found!")

target_prod_modal_img = """              <div className="relative hover:opacity-80 transition-opacity shrink-0" onClick={()=>onSellerClick?.(product.postedBy)}>
                <img src={liveSeller?.avatar || product.seller?.avatar || DEFAULT_AVATAR} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>"""

replacement_prod_modal_img = """              <div className="relative hover:opacity-80 transition-opacity shrink-0" onClick={()=>onSellerClick?.(product.postedBy)}>
                <img src={liveSeller?.avatar || product.seller?.avatar || DEFAULT_AVATAR} alt="" className={`w-12 h-12 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>"""

if target_prod_modal_img in content:
    content = content.replace(target_prod_modal_img, replacement_prod_modal_img)
    print("16. Updated ProductDetailModal avatar image tag.")
else:
    print("ERROR 16: ProductDetailModal image target not found!")

# 9. Large Avatar wrapper glows on SellerProfile & UserProfile
target_sv_wrapper = """        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-gray-950 shadow-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
              <img src={effectiveSeller?.avatar || DEFAULT_AVATAR} alt={effectiveSeller?.name} className="w-full h-full object-cover"/>
            </div>"""

replacement_sv_wrapper = """        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
          <div className="relative">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 shadow-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center ${effectiveSeller.role && effectiveSeller.role !== 'user' ? getGlowClass(effectiveSeller.role) : 'border-gray-950'}`}>
              <img src={effectiveSeller?.avatar || DEFAULT_AVATAR} alt={effectiveSeller?.name} className="w-full h-full object-cover"/>
            </div>"""

if target_sv_wrapper in content:
    content = content.replace(target_sv_wrapper, replacement_sv_wrapper)
    print("17. Updated SellerView large avatar wrapper border-glow.")
else:
    print("ERROR 17: SellerView avatar wrapper target not found!")

target_pv_wrapper = """          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            {/* Avatar */}
            <div className="relative z-20">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-950 shadow-xl overflow-hidden bg-white flex items-center justify-center">
                <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover"/>
              </div>"""

replacement_pv_wrapper = """          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            {/* Avatar */}
            <div className="relative z-20">
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 shadow-xl overflow-hidden bg-white flex items-center justify-center ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border-gray-950'}`}>
                <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover"/>
              </div>"""

if target_pv_wrapper in content:
    content = content.replace(target_pv_wrapper, replacement_pv_wrapper)
    print("18. Updated ProfileView large avatar wrapper border-glow.")
else:
    print("ERROR 18: ProfileView avatar wrapper target not found!")

# 10. Admin user list banned/glow avatar
target_admin_avatar = """                <div className="flex items-center gap-3">
                  <img src={u.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-12 h-12 rounded-full object-cover border-2 ${u.is_banned?'border-red-500/50':'border-gray-600'}`}/>"""

replacement_admin_avatar = """                <div className="flex items-center gap-3">
                  <img src={u.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-12 h-12 rounded-full object-cover ${u.is_banned ? 'border-2 border-red-500/50' : (u.role && u.role !== 'user' ? getGlowClass(u.role) : 'border border-gray-600')}`}/>"""

if target_admin_avatar in content:
    content = content.replace(target_admin_avatar, replacement_admin_avatar)
    print("19. Updated Admin Dashboard profile avatar image tag.")
else:
    print("ERROR 19: Admin Dashboard avatar target not found!")

# 11. Profiles Hub Top Accounts list & search result grid avatars
target_hub_top = """                            <div className="relative shrink-0">
                              <img src={topUser.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-amber-400" />"""

replacement_hub_top = """                            <div className="relative shrink-0">
                              <img src={topUser.avatar} alt="" className={`w-12 h-12 rounded-full object-cover ${topUser.role && topUser.role !== 'user' ? getGlowClass(topUser.role) : 'border-2 border-amber-400'}`} />"""

if target_hub_top in content:
    content = content.replace(target_hub_top, replacement_hub_top)
    print("20. Updated Profiles Hub Top Accounts avatar border-glow.")
else:
    print("ERROR 20: Top Accounts avatar target not found!")

target_hub_grid = """                          <div className="relative shrink-0">
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-700 group-hover:border-amber-400 transition-colors"
                            />"""

replacement_hub_grid = """                          <div className="relative shrink-0">
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className={`w-14 h-14 rounded-full object-cover transition-all ${profile.role && profile.role !== 'user' ? getGlowClass(profile.role) : 'border-2 border-gray-700 group-hover:border-amber-400'}`}
                            />"""

if target_hub_grid in content:
    content = content.replace(target_hub_grid, replacement_hub_grid)
    print("21. Updated Profiles Hub directory search grid item avatar border-glow.")
else:
    print("ERROR 21: Directory search grid item avatar target not found!")

# 12. TransportView signature, loop resolver, avatar rendering, and JSX Call passing
target_tv_sig = """function TransportView({ user, onBack, onCreateAd, onGoToMyLines, onSelectAd, lines, onPost, onUpdateStatus, onDeleteAd, onActionMenu, isInitialLoading }: {"""
replacement_tv_sig = """function TransportView({ user, onBack, onCreateAd, onGoToMyLines, onSelectAd, lines, onPost, onUpdateStatus, onDeleteAd, onActionMenu, isInitialLoading, storedUsers }: {"""

if target_tv_sig in content:
    content = content.replace(target_tv_sig, replacement_tv_sig)
    print("22. Updated TransportView signature parameter list.")
else:
    print("ERROR 22: TransportView signature target not found!")

target_tv_sig_props = """  onDeleteAd: (id: number) => void;
  onActionMenu?: any;
  isInitialLoading: boolean;
}) {"""

replacement_tv_sig_props = """  onDeleteAd: (id: number) => void;
  onActionMenu?: any;
  isInitialLoading: boolean;
  storedUsers?: any[];
}) {"""

if target_tv_sig_props in content:
    content = content.replace(target_tv_sig_props, replacement_tv_sig_props)
    print("23. Updated TransportView signature props interface.")
else:
    print("ERROR 23: TransportView signature props interface target not found!")

target_tv_loop = """            {filtered.slice(0, visibleCount).map(ad=>{
              const isEmployee = ad.categoryType === 'employee';
              return ("""

replacement_tv_loop = """            {filtered.slice(0, visibleCount).map(ad=>{
              const isEmployee = ad.categoryType === 'employee';
              const seller = storedUsers?.find(u=>u.id===ad.postedBy);
              return ("""

if target_tv_loop in content:
    content = content.replace(target_tv_loop, replacement_tv_loop)
    print("24. Resolved seller in TransportView loop.")
else:
    print("ERROR 24: TransportView loop target not found!")

target_tv_card_img = """                    <div className="flex items-center gap-2">
                      <img src={ad.sellerAvatar||'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-600"/>"""

replacement_tv_card_img = """                    <div className="flex items-center gap-2">
                      <img src={ad.sellerAvatar||'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-8 h-8 rounded-full object-cover ${seller?.role && seller.role !== 'user' ? getGlowClass(seller.role) : 'border border-gray-600'}`}/>"""

if target_tv_card_img in content:
    content = content.replace(target_tv_card_img, replacement_tv_card_img)
    print("25. Updated Transport Card avatar border-glow.")
else:
    print("ERROR 25: Transport Card avatar image target not found!")

target_tv_call = """            <TransportView user={user} onBack={()=>setView('home')} onCreateAd={()=>{if(!user){requireAuth();return;}setShowCreateTransport(true);}} onGoToMyLines={()=>{setView('profile'); setTimeout(()=>window.dispatchEvent(new CustomEvent('switch-to-lines-tab')), 100);}} onSelectAd={setSelectedTransportAd} lines={allTransportAds} onPost={handlePostTransportAd} onUpdateStatus={handleUpdateTransportStatus} onDeleteAd={handleDeleteTransportAd} onActionMenu={setActionMenuTarget} isInitialLoading={isInitialLoading}/>"""
replacement_tv_call = """            <TransportView user={user} onBack={()=>setView('home')} onCreateAd={()=>{if(!user){requireAuth();return;}setShowCreateTransport(true);}} onGoToMyLines={()=>{setView('profile'); setTimeout(()=>window.dispatchEvent(new CustomEvent('switch-to-lines-tab')), 100);}} onSelectAd={setSelectedTransportAd} lines={allTransportAds} onPost={handlePostTransportAd} onUpdateStatus={handleUpdateTransportStatus} onDeleteAd={handleDeleteTransportAd} onActionMenu={setActionMenuTarget} isInitialLoading={isInitialLoading} storedUsers={storedUsers}/>"""

if target_tv_call in content:
    content = content.replace(target_tv_call, replacement_tv_call)
    print("26. Passed storedUsers prop to TransportView instance in JSX.")
else:
    print("ERROR 26: TransportView JSX Call target not found!")

# 13. TransportDetailModal signature, matching logic, and JSX Call passing
target_tdm_sig = """function TransportDetailModal({ ad, onClose, user, onAuthRequired, onViewDurationLogged }:{
  ad:TransportAd|null; onClose:()=>void; user:User|null; onAuthRequired:()=>void;
  onViewDurationLogged?:(seconds:number)=>void;
}) {"""

replacement_tdm_sig = """function TransportDetailModal({ ad, onClose, user, onAuthRequired, onViewDurationLogged, storedUsers }:{
  ad:TransportAd|null; onClose:()=>void; user:User|null; onAuthRequired:()=>void;
  onViewDurationLogged?:(seconds:number)=>void;
  storedUsers?: any[];
}) {"""

if target_tdm_sig in content:
    content = content.replace(target_tdm_sig, replacement_tdm_sig)
    print("27. Updated TransportDetailModal signature.")
else:
    print("ERROR 27: TransportDetailModal signature target not found!")

target_tdm_seller = """        {/* Seller Info */}
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-5 flex items-center gap-3">
          <img src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-10 h-10 rounded-full border border-gray-600 object-cover"/>
          <div>
            <span className="text-white font-bold text-sm block">{ad.sellerName}</span>
            <span className="text-gray-400 text-xs">صاحب الإعلان</span>
          </div>
        </div>"""

replacement_tdm_seller = """        {/* Seller Info */}
        {(() => {
          const liveSeller = storedUsers?.find(u=>u.id===ad.postedBy);
          return (
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-5 flex items-center gap-3">
              <img src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-10 h-10 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>
              <div>
                <span className="text-white font-bold text-sm block">{ad.sellerName}</span>
                <span className="text-gray-400 text-xs">صاحب الإعلان</span>
              </div>
            </div>
          );
        })()}"""

if target_tdm_seller in content:
    content = content.replace(target_tdm_seller, replacement_tdm_seller)
    print("28. Updated TransportDetailModal seller card and avatar.")
else:
    print("ERROR 28: TransportDetailModal seller card target not found!")

target_tdm_call = """        {selectedTransportAd&&<TransportDetailModal ad={selectedTransportAd} onClose={()=>setSelectedTransportAd(null)} user={user} onAuthRequired={requireAuth} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedTransportAd.id, selectedTransportAd.type==='offer'?'خط متوفر':'طلب خط', selectedTransportAd.postedBy || '', 'transport', sec)}/>}"""
replacement_tdm_call = """        {selectedTransportAd&&<TransportDetailModal ad={selectedTransportAd} onClose={()=>setSelectedTransportAd(null)} user={user} onAuthRequired={requireAuth} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedTransportAd.id, selectedTransportAd.type==='offer'?'خط متوفر':'طلب خط', selectedTransportAd.postedBy || '', 'transport', sec)} storedUsers={storedUsers}/>}"""

if target_tdm_call in content:
    content = content.replace(target_tdm_call, replacement_tdm_call)
    print("29. Passed storedUsers prop to TransportDetailModal instance in JSX.")
else:
    print("ERROR 29: TransportDetailModal JSX call target not found!")

# 14. Currently Logged-in User Header & Mobile Menu Avatars Glow
target_header_avatar1 = """                  <button onClick={()=>setView('profile')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}>
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-600"/>"""

replacement_header_avatar1 = """                  <button onClick={()=>setView('profile')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}>
                    <img src={user.avatar} alt="" className={`w-6 h-6 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-600'}`}/>"""

if target_header_avatar1 in content:
    content = content.replace(target_header_avatar1, replacement_header_avatar1)
    print("30. Updated desktop navbar user avatar glow.")
else:
    print("ERROR 30: Desktop navbar user avatar target not found!")

target_header_avatar2 = """              {user ? (
                <button onClick={()=>setView('profile')} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white'}`}>
                  <img src={user.avatar} alt="" className="w-5.5 h-5.5 rounded-full object-cover border border-gray-600"/>"""

replacement_header_avatar2 = """              {user ? (
                <button onClick={()=>setView('profile')} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white'}`}>
                  <img src={user.avatar} alt="" className={`w-5.5 h-5.5 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-600'}`}/>"""

if target_header_avatar2 in content:
    content = content.replace(target_header_avatar2, replacement_header_avatar2)
    print("31. Updated mobile header user avatar glow.")
else:
    print("ERROR 31: Mobile header user avatar target not found!")

target_header_avatar3 = """            {user?(
              <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>"""

replacement_header_avatar3 = """            {user?(
              <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt="" className={`w-12 h-12 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border-2 border-amber-500'}`}/>"""

if target_header_avatar3 in content:
    content = content.replace(target_header_avatar3, replacement_header_avatar3)
    print("32. Updated mobile menu user avatar glow.")
else:
    print("ERROR 32: Mobile menu user avatar target not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("\nDone! Role avatar glow effects script execution completed.")
