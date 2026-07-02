const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'App.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF to ensure string matches work perfectly regardless of OS
code = code.replace(/\r\n/g, '\n');

console.log("Original code length:", code.length);

// 1. Import ProductsView
code = code.replace(
  "import { ShareModal } from './components/ShareModal';",
  "import { ShareModal } from './components/ShareModal';\nimport { ProductsView } from './components/ProductsView';"
);

// 2. Add pagination and filtering states
code = code.replace(
  `  const [initialHashParsed, setInitialHashParsed] = useState(false);
  const [storedUsers, setStoredUsers] = useState<any[]>([]);
  const playSound = useSound();`,
  `  const [initialHashParsed, setInitialHashParsed] = useState(false);
  const [storedUsers, setStoredUsers] = useState<any[]>([]);
  
  // Pagination & Filtering state
  const [adsPage, setAdsPage] = useState(0);
  const [hasMoreAds, setHasMoreAds] = useState(true);
  const [productsPage, setProductsPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [gov, setGov] = useState('الكل');
  const [sort, setSort] = useState<'recent'|'views'|'price-low'|'price-high'>('recent');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all'|'new'|'used'>('all');

  const playSound = useSound();`
);

// 3. syncStateFromHash - Direct Ad Link Retrieval
const syncAdRegex = /if \(type === 'ad' && targetId\) \{[\s\S]*?\} else if \(type === 'product' && targetId\) \{[\s\S]*?\}/;
const syncAdReplacement = `if (type === 'ad' && targetId) {
      const ad = allAds.find(a => String(a.id) === targetId || a.short_id === targetId || (a.title && targetId.includes(encodeURIComponent(a.title))));
      if (ad) {
        setSelectedAd(ad);
      } else {
        const isNumeric = /^\\d+$/.test(targetId);
        let query = supabase.from('ads').select('*').eq('is_demo', false);
        if (isNumeric) {
          query = query.eq('id', Number(targetId));
        } else {
          query = query.eq('short_id', targetId);
        }
        query.single().then(({ data, error }) => {
          if (data && !error) {
            const mappedAd: Ad = {
              id: data.id,
              title: data.title,
              price: data.price,
              governorate: data.city || '',
              location: data.location || '',
              phone: data.phone || '',
              category: data.category,
              images: data.images || [],
              seller: {
                name: data.seller_name || 'مستخدم',
                avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                isVerified: false,
                rating: data.seller_rating || 4.8,
                joinedDate: data.created_at,
                location: data.city || '',
              },
              time: '',
              createdAtISO: data.created_at,
              views: data.views || 0,
              status: data.status,
              type: data.type || 'sell',
              description: data.description || '',
              adCount: 0,
              soldCount: 0,
              responseRate: 100,
              avgResponseTime: 'دقائق',
              postedBy: data.seller_id,
            };
            setSelectedAd(mappedAd);
          }
        });
      }
    } else if (type === 'product' && targetId) {
      const prod = allProducts.find(p => String(p.id) === targetId || p.short_id === targetId);
      if (prod) {
        setSelectedProduct(prod);
      } else {
        const isNumeric = /^\\d+$/.test(targetId);
        let query = supabase.from('products').select('*');
        if (isNumeric) {
          query = query.eq('id', Number(targetId));
        } else {
          query = query.eq('short_id', targetId);
        }
        query.single().then(({ data, error }) => {
          if (data && !error) {
            const mappedProd: Product = {
              id: data.id,
              title: data.title,
              price: data.price,
              description: data.description || '',
              category: data.category,
              images: data.images || [],
              governorate: data.governorate || data.city || '',
              phone: data.phone || '',
              condition: data.condition || 'used',
              seller: {
                name: data.seller_name || 'مستخدم',
                avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                isVerified: false,
                rating: 4.8,
                joinedDate: data.created_at,
                location: data.governorate || '',
              },
              createdAtISO: data.created_at,
              views: data.views || 0,
              postedBy: data.seller_id,
              stock: data.stock || 1,
              status: data.status || 'active',
            };
            setSelectedProduct(mappedProd);
          }
        });
      }
    }`;

code = code.replace(syncAdRegex, syncAdReplacement);

// 4. Rate limiting helper and paginated fetch functions
const fetchAdsRegex = /\/\/ ── Fetch ads & products from Supabase ──[\s\S]*?const fetchProducts = useCallback[\s\S]*?\}\, \[\]\);/;
const fetchAdsReplacement = `// ── Rate Limit Helper ─────────────────────────
  const checkPostRateLimit = (): boolean => {
    const now = Date.now();
    let posts = [];
    try {
      posts = JSON.parse(localStorage.getItem('souq_post_timestamps') || '[]');
    } catch {
      posts = [];
    }
    posts = posts.filter((t: number) => now - t < 60000);
    if (posts.length >= 2) {
      showToast('⚠️ لقد تجاوزت الحد المسموح به. يمكنك نشر إعلانين كحد أقصى في الدقيقة الواحدة. يرجى الانتظار قليلاً.', 'error');
      return false;
    }
    posts.push(now);
    localStorage.setItem('souq_post_timestamps', JSON.stringify(posts));
    return true;
  };

  // ── Fetch ads & products from Supabase ─────────────────────────
  const fetchAds = useCallback(async (reset = true) => {
    const pageToFetch = reset ? 0 : adsPage + 1;
    const pageSize = 12;
    const from = pageToFetch * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('ads').select('*').eq('is_demo', false);

    if (cat && cat !== 'all') {
      query = query.eq('category', cat);
    }
    if (gov && gov !== 'الكل') {
      query = query.eq('city', gov);
    }
    if (search) {
      const term = \`%\${search}%\`;
      query = query.or(\`title.ilike.\${term},location.ilike.\${term},short_id.ilike.\${term}\`);
    }
    if (priceMin) {
      const minVal = parseInt(priceMin.replace(/,/g, ''));
      if (!isNaN(minVal)) query = query.gte('price', minVal);
    }
    if (priceMax) {
      const maxVal = parseInt(priceMax.replace(/,/g, ''));
      if (!isNaN(maxVal)) query = query.lte('price', maxVal);
    }

    if (sort === 'views') {
      query = query.order('views', { ascending: false });
    } else if (sort === 'price-low') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-high') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, error } = await query;
    if (error) { console.error('Error fetching ads:', error); return; }
    if (data) {
      // Map normal ads
      const normalRows = data.filter((row: any) => row.category !== 'transport' && row.category !== 'notification');
      const normalMapped: Ad[] = normalRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        price: row.price,
        governorate: row.city || '',
        location: row.location || '',
        phone: row.phone || '',
        category: row.category,
        images: row.images || [],
        seller: {
          name: row.seller_name || 'مستخدم',
          avatar: row.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
          isVerified: false,
          rating: row.seller_rating || 4.8,
          joinedDate: row.created_at,
          location: row.city || '',
        },
        time: '',
        createdAtISO: row.created_at,
        views: row.views || 0,
        status: row.status,
        type: row.type || 'sell',
        description: row.description || '',
        adCount: 0,
        soldCount: 0,
        responseRate: 100,
        avgResponseTime: 'دقائق',
        postedBy: row.seller_id,
      }));

      // Map transport ads
      const transportRows = data.filter((row: any) => row.category === 'transport');
      const transportMapped: TransportAd[] = transportRows.map((row: any) => {
        let extra = {
          shift: 'صباحي',
          seats: 4,
          vehicleType: 'خصوصي',
          targetAudience: 'مختلط',
          categoryType: 'student' as 'student' | 'employee',
          note: '',
          interest: 0,
          whatsappClicks: 0,
          completedAt: undefined,
          completion_reason: null
        };
        try {
          if (row.description) {
            const parsed = JSON.parse(row.description);
            extra = { ...extra, ...parsed };
          }
        } catch (e) {
          extra.note = row.description || '';
        }
        return {
          id: row.id,
          type: row.type || 'offer',
          categoryType: extra.categoryType || 'student',
          university: row.city || '',
          regions: row.location || '',
          shift: extra.shift,
          seats: Number(extra.seats) || 0,
          vehicleType: extra.vehicleType,
          targetAudience: extra.targetAudience,
          price: row.price ? formatPrice(row.price) : '',
          phone: row.phone || '',
          note: extra.note,
          sellerName: row.seller_name || 'مستخدم',
          sellerAvatar: row.seller_avatar || '',
          createdAt: row.created_at,
          status: row.status === 'active' ? 'published' : row.status,
          postedBy: row.seller_id,
          views: row.views || 0,
          interest: extra.interest,
          whatsappClicks: extra.whatsappClicks,
          completedAt: extra.completedAt,
          completion_reason: extra.completion_reason
        };
      });

      const activeMapped = normalMapped.filter(a => a.status === 'active' || a.status === 'sold');
      
      if (reset) {
        setAllAds(activeMapped.length > 0 ? activeMapped : getDefaultAds());
        setAllTransportAds(transportMapped);
        setAdsPage(0);
        setHasMoreAds(data.length === pageSize);
      } else {
        setAllAds(prev => {
          const combined = [...prev, ...activeMapped];
          const unique = combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          return unique;
        });
        setAllTransportAds(prev => {
          const combined = [...prev, ...transportMapped];
          const unique = combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          return unique;
        });
        setAdsPage(pageToFetch);
        setHasMoreAds(data.length === pageSize);
      }
    }
  }, [adsPage, search, cat, gov, sort, priceMin, priceMax]);

  const handleDeleteProfile = async (profileId: string) => {
    // Try to delete using the admin RPC first
    const { error: rpcError } = await supabase.rpc('admin_delete_user', { target_user_id: profileId });
    
    if (rpcError) {
      // Fallback to client-side deletion if RPC fails or doesn't exist yet
      await supabase.from('ads').delete().eq('seller_id', profileId);
      await supabase.from('products').delete().eq('seller_id', profileId);
      await supabase.from('transport_ads').delete().eq('seller_id', profileId);
      await supabase.from('profiles').delete().eq('id', profileId);
    }

    setAllAds(prev => prev.filter(a => a.postedBy !== profileId));
    setAllTransportAds(prev => prev.filter(a => a.postedBy !== profileId));
    setAllProducts(prev => prev.filter(p => p.postedBy !== profileId));

    try {
      const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const filtered = users.filter((u: any) => u.id !== profileId);
      localStorage.setItem('souqUsers', JSON.stringify(filtered));
    } catch (e) {}

    // Only redirect and logout if the current user deletes their own account
    if (user?.id === profileId) {
      showToast('تم حذف حسابك وجميع محتوياته بنجاح', 'success');
      setView('home');
      handleLogout();
    } else {
      showToast('تم حذف الحساب ومحتوياته نهائياً', 'success');
    }
  };

  const fetchProducts = useCallback(async (reset = true) => {
    const pageToFetch = reset ? 0 : productsPage + 1;
    const pageSize = 12;
    const from = pageToFetch * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('products').select('*');

    if (cat && cat !== 'all') {
      query = query.eq('category', cat);
    }
    if (gov && gov !== 'الكل') {
      query = query.eq('governorate', gov);
    }
    if (search) {
      const term = \`%\${search}%\`;
      query = query.or(\`title.ilike.\${term},description.ilike.\${term},short_id.ilike.\${term}\`);
    }
    if (priceMin) {
      const minVal = parseInt(priceMin.replace(/,/g, ''));
      if (!isNaN(minVal)) query = query.gte('price', minVal);
    }
    if (priceMax) {
      const maxVal = parseInt(priceMax.replace(/,/g, ''));
      if (!isNaN(maxVal)) query = query.lte('price', maxVal);
    }

    if (sort === 'views') {
      query = query.order('views', { ascending: false });
    } else if (sort === 'price-low') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-high') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, error } = await query;
    if (error) { console.error('Error fetching products:', error); return; }
    if (data) {
      const mapped: Product[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        price: row.price,
        description: row.description || '',
        category: row.category,
        images: row.images || [],
        governorate: row.governorate || row.city || '',
        phone: row.phone || '',
        condition: row.condition || 'used',
        seller: {
          name: row.seller_name || 'مستخدم',
          avatar: row.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
          isVerified: false,
          rating: 4.8,
          joinedDate: row.created_at,
          location: row.governorate || '',
        },
        createdAtISO: row.created_at,
        views: row.views || 0,
        postedBy: row.seller_id,
        stock: row.stock || 1,
        status: row.status || 'active',
      }));
      
      if (reset) {
        setAllProducts(mapped.length > 0 ? mapped : getDefaultProducts());
        setProductsPage(0);
        setHasMoreProducts(data.length === pageSize);
      } else {
        setAllProducts(prev => {
          const combined = [...prev, ...mapped];
          const unique = combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          return unique;
        });
        setProductsPage(pageToFetch);
        setHasMoreProducts(data.length === pageSize);
      }
    }
  }, [productsPage, search, cat, gov, sort, priceMin, priceMax]);`;

code = code.replace(fetchAdsRegex, fetchAdsReplacement);

// 5. Replace the static mount effect with a debounced filter query effect
code = code.replace(
  `  useEffect(() => {
    fetchAds();
    fetchProducts();
  }, [fetchAds, fetchProducts]);`,
  `  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAds(true);
      fetchProducts(true);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search, cat, gov, sort, priceMin, priceMax]);`
);

// 6. Rate limits in creations
code = code.replace(
  `  const handleAddOrEditAd = async (ad: Ad) => {
    const rowData = {`,
  `  const handleAddOrEditAd = async (ad: Ad) => {
    if (!editingAd) {
      if (!checkPostRateLimit()) return;
    }
    const rowData = {`
);

code = code.replace(
  `  const handlePostTransportAd = async (ad: TransportAd) => {
    const rowData = {`,
  `  const handlePostTransportAd = async (ad: TransportAd) => {
    if (!checkPostRateLimit()) return;
    const rowData = {`
);

code = code.replace(
  `  const handleAddOrEditProduct = async (p: Product) => {
    const rowData = {`,
  `  const handleAddOrEditProduct = async (p: Product) => {
    if (!editingProduct) {
      if (!checkPostRateLimit()) return;
    }
    const rowData = {`
);

// 7. OwnerDashboard State updates (CRLF safe)
code = code.replace(
  `  const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'logs'|'changelog'>('overview');`,
  `  const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'|'recovery'|'verification'|'reports'|'logs'|'changelog'>('overview');
  const [reports, setReports] = useState<any[]>([]);`
);

// 8. OwnerDashboard reports fetch effect
code = code.replace(
  `    const fetchUsersAndGuests = async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*').order('last_seen', { ascending: false });
        if (profiles) setDbUsers(profiles);
        const { data: guests } = await supabase.from('guests').select('*').order('last_seen', { ascending: false });
        if (guests) setDbGuests(guests);
      } catch (err) {}
    };
    fetchUsersAndGuests();
    const fetchInterval = setInterval(fetchUsersAndGuests, 60_000);

    return () => { clearInterval(iv); clearInterval(fetchInterval); };`,
  `    const fetchUsersAndGuests = async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*').order('last_seen', { ascending: false });
        if (profiles) setDbUsers(profiles);
        const { data: guests } = await supabase.from('guests').select('*').order('last_seen', { ascending: false });
        if (guests) setDbGuests(guests);
      } catch (err) {}
    };
    fetchUsersAndGuests();
    const fetchInterval = setInterval(fetchUsersAndGuests, 60_000);

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) {
          const reportMessages = data.filter((msg: any) => msg.name && msg.name.startsWith('REPORT:'));
          setReports(reportMessages);
        }
      } catch (err) {}
    };
    fetchReports();
    const reportInterval = setInterval(fetchReports, 30_000);

    return () => { 
      clearInterval(iv); 
      clearInterval(fetchInterval); 
      clearInterval(reportInterval); 
    };`
);

// 9. OwnerDashboard Tab Button lists
code = code.replace(
  `          {([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل العمليات'],['changelog','🚀 التحديثات v1.2']] as [string,string][]).map(([t,l])=>(`,
  `          {([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['guests','🕵️ الزوار (الضيوف)'],['content','📢 المحتوى'],['recovery','🛡️ الاستعادة'],['verification','🪪 التوثيق'],['reports','🚩 التقارير والبلاغات'],['broadcast','🔔 إشعار عام'],['logs','📋 سجل العمليات'],['changelog','🚀 التحديثات v1.2']] as [string,string][]).map(([t,l])=>(`
);

// 10. OwnerDashboard Reports rendering block
code = code.replace(
  `        {tab==='broadcast'&&(`,
  `        {tab==='reports'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-bold">البلاغات والتقارير ({reports.length})</h3>
            </div>
            {reports.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا توجد بلاغات حالياً</div>:
            <div className="space-y-3 p-4">
              {reports.map((rep: any) => {
                let reportData: any = {};
                try {
                  reportData = JSON.parse(rep.message);
                } catch(e) {
                  reportData = { reason: rep.message };
                }
                const isProduct = reportData.item_type === 'product';
                return (
                  <div key={rep.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">🚩</span>
                        <p className="text-white font-bold">{rep.name || 'بلاغ محتوى'}</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                          {isProduct ? 'منتج' : 'إعلان'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">المُبلغ: {rep.contact_info}</p>
                      <p className="text-sm text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg inline-block">
                        سبب البلاغ: {reportData.reason || 'محتوى غير لائق'}
                      </p>
                      <p className="text-[10px] text-gray-500">التاريخ: {new Date(rep.created_at || Date.now()).toLocaleString('ar-IQ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={async () => {
                          if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المحتوى نهائياً؟')) {
                            if (isProduct) {
                              onDeleteProduct(reportData.item_id);
                            } else {
                              onDeleteAd(reportData.item_id);
                            }
                            await supabase.from('support_messages').delete().eq('id', rep.id);
                            setReports(prev => prev.filter(r => r.id !== rep.id));
                          }
                        }} 
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
                      >
                        حذف المحتوى المخالف
                      </button>
                      <button 
                        onClick={async () => {
                          await supabase.from('support_messages').delete().eq('id', rep.id);
                          setReports(prev => prev.filter(r => r.id !== rep.id));
                        }} 
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-lg text-xs"
                      >
                        تجاهل البلاغ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            }
          </div>
        )}

        {tab==='broadcast'&&(`
);

// 11. Report buttons in AdDetailModal and ProductDetailModal close sections
// Let's replace the first close button (AdDetailModal)
const adCloseButtonIndex = code.indexOf('<button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80"><X className="w-5 h-5"/></button>');
if (adCloseButtonIndex !== -1) {
  const replacement = `<button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80"><X className="w-5 h-5"/></button>
          <button 
            onClick={async () => {
              if(!user) { onAuthRequired(); return; }
              const reason = window.prompt('يرجى كتابة سبب الإبلاغ عن هذا الإعلان:');
              if (!reason) return;
              const { error } = await supabase.from('support_messages').insert({
                name: \`REPORT: \${ad.title}\`,
                contact_info: \`\${user.name} (\${user.phone || user.id})\`,
                message: JSON.stringify({ item_id: ad.id, item_type: 'ad', reason })
              });
              if (!error) {
                alert('تم تقديم البلاغ بنجاح وسيتم مراجعته من قبل الإدارة. شكراً لك! 🚩');
              } else {
                alert('حدث خطأ أثناء إرسال البلاغ.');
              }
            }} 
            className="absolute top-3 right-14 p-2 bg-black/60 rounded-xl text-red-400 z-10 hover:bg-red-950/60 flex items-center gap-1 font-bold text-xs"
            title="إبلاغ عن محتوى مخالف"
          >
            <span>🚩</span> إبلاغ
          </button>`;
  code = code.substring(0, adCloseButtonIndex) + replacement + code.substring(adCloseButtonIndex + '<button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80"><X className="w-5 h-5"/></button>'.length);
}

// Let's replace the second close button (ProductDetailModal)
const productCloseButtonIndex = code.indexOf('<button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80"><X className="w-5 h-5"/></button>', adCloseButtonIndex + 500);
if (productCloseButtonIndex !== -1) {
  const replacement = `<button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80"><X className="w-5 h-5"/></button>
          <button 
            onClick={async () => {
              if(!user) { onAuthRequired(); return; }
              const reason = window.prompt('يرجى كتابة سبب الإبلاغ عن هذا المنتج:');
              if (!reason) return;
              const { error } = await supabase.from('support_messages').insert({
                name: \`REPORT: \${product.title}\`,
                contact_info: \`\${user.name} (\${user.phone || user.id})\`,
                message: JSON.stringify({ item_id: product.id, item_type: 'product', reason })
              });
              if (!error) {
                alert('تم تقديم البلاغ بنجاح وسيتم مراجعته من قبل الإدارة. شكراً لك! 🚩');
              } else {
                alert('حدث خطأ أثناء إرسال البلاغ.');
              }
            }} 
            className="absolute top-3 right-14 p-2 bg-black/60 rounded-xl text-red-400 z-10 hover:bg-red-950/60 flex items-center gap-1 font-bold text-xs"
            title="إبلاغ عن محتوى مخالف"
          >
            <span>🚩</span> إبلاغ
          </button>`;
  code = code.substring(0, productCloseButtonIndex) + replacement + code.substring(productCloseButtonIndex + '<button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80"><X className="w-5 h-5"/></button>'.length);
}

// 12. Lift MarketView states to props
const marketViewSig = `function MarketView({ user, allAds, allProducts, favorites, storedUsers: propStoredUsers, onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, onTransportClick, onSelectTransportAd, transportLines, onActionMenu }:{
  user:User|null; allAds:Ad[]; allProducts:Product[]; favorites:number[]; storedUsers?: any[];
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void;
  onToggleFav:(id:number)=>void; onRequireAuth:()=>void; onSellerClick:(id:string, source?: 'home'|'accounts')=>void;
  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
  onActionMenu?: any;
}) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    const h = window.location.hash;
    if (h.startsWith('#/category/')) return h.split('/')[2] || 'all';
    if (h.startsWith('#/ads/')) return h.split('/')[2] || 'all';
    if (h.startsWith('#/products/')) return h.split('/')[2] || 'all';
    return 'all';
  });
  const [gov, setGov] = useState('الكل');
  const [sort, setSort] = useState<'recent'|'views'|'price-low'|'price-high'>('recent');`;

const marketViewSigReplacement = `function MarketView({ 
  user, allAds, allProducts, favorites, storedUsers: propStoredUsers, 
  onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, 
  onTransportClick, onSelectTransportAd, transportLines, onActionMenu,
  search, setSearch, cat, setCat, gov, setGov, sort, setSort, 
  priceMin, setPriceMin, priceMax, setPriceMax,
  hasMoreAds, hasMoreProducts, onLoadMoreAds, onLoadMoreProducts
}:{
  user:User|null; allAds:Ad[]; allProducts:Product[]; favorites:number[]; storedUsers?: any[];
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void;
  onToggleFav:(id:number)=>void; onRequireAuth:()=>void; onSellerClick:(id:string, source?: 'home'|'accounts')=>void;
  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
  onActionMenu?: any;
  search: string; setSearch: (s: string) => void;
  cat: string; setCat: (c: string) => void;
  gov: string; setGov: (g: string) => void;
  sort: 'recent'|'views'|'price-low'|'price-high'; setSort: (s: any) => void;
  priceMin: string; setPriceMin: (p: string) => void;
  priceMax: string; setPriceMax: (p: string) => void;
  hasMoreAds: boolean; hasMoreProducts: boolean;
  onLoadMoreAds: () => void; onLoadMoreProducts: () => void;
}) {
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [visibleProfilesCount, setVisibleProfilesCount] = useState(12);`;

code = code.replace(marketViewSig, marketViewSigReplacement);

// 13. Map filteredProfiles, filterAds, and filterProds directly
const filterAdsRegex = `  const filteredProfiles = storedUsers.filter(u => {
    const term = search.toLowerCase();
    return !search || 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.phone && u.phone.includes(term));
  });

  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\\B(?=(\\d{3})+(?!\\d))/g,',');

  const filterAds = allAds.filter(a=>{
    if (a.status !== 'active') return false;
    const ms=!search||String(a.id).includes(search)||(a.short_id&&a.short_id.toLowerCase().includes(search.toLowerCase()))||a.title.toLowerCase().includes(search.toLowerCase())||a.location.toLowerCase().includes(search.toLowerCase());
    const mc=cat==='all'||a.category===cat; const mg=gov==='الكل'||a.governorate===gov;
    const min=priceMin?parseInt(priceMin.replace(/,/g,'')):0, max=priceMax?parseInt(priceMax.replace(/,/g,'')):Infinity, ap=parseInt(a.price)||0;
    return ms&&mc&&mg&&ap>=min&&ap<=max;
  }).sort((a,b)=>sort==='views'?b.views-a.views:sort==='price-low'?parseInt(a.price)-parseInt(b.price):sort==='price-high'?parseInt(b.price)-parseInt(a.price):new Date(b.createdAtISO).getTime()-new Date(a.createdAtISO).getTime());

  const filterProds = allProducts.filter(p=>{
    if (p.status !== 'active') return false;
    const ms=!search||String(p.id).includes(search)||(p.short_id&&p.short_id.toLowerCase().includes(search.toLowerCase()))||p.title.toLowerCase().includes(search.toLowerCase())||p.governorate.toLowerCase().includes(search.toLowerCase());
    const mc=cat==='all'||p.category===cat; const mg=gov==='الكل'||p.governorate===gov;
    const min=priceMin?parseInt(priceMin.replace(/,/g,'')):0, max=priceMax?parseInt(priceMax.replace(/,/g,'')):Infinity, pp=parseInt(p.price)||0;
    return ms&&mc&&mg&&pp>=min&&pp<=max;
  }).sort((a,b)=>sort==='views'?b.views-a.views:sort==='price-low'?parseInt(a.price)-parseInt(b.price):sort==='price-high'?parseInt(b.price)-parseInt(a.price):new Date(b.createdAtISO).getTime()-new Date(a.createdAtISO).getTime());`;

const filterAdsReplacement = `  const filteredProfiles = storedUsers.filter(u => {
    // Only show verified accounts, owners, admins, or users with at least 1 ad/product
    const isOwnerOrAdmin = u.role === 'owner' || u.role === 'admin' || u.role === 'vendor';
    const isVerified = u.isVerified || u.verified;
    const isMerchant = (u.adCount + (u.prodCount || 0)) >= 1;
    if (!isOwnerOrAdmin && !isVerified && !isMerchant) {
      return false;
    }

    const term = search.toLowerCase();
    return !search || 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.phone && u.phone.includes(term));
  });

  const displayedProfiles = filteredProfiles.slice(0, visibleProfilesCount);

  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\\B(?=(\\d{3})+(?!\\d))/g,',');

  const filterAds = allAds;
  const filterProds = allProducts;`;

code = code.replace(filterAdsRegex, filterAdsReplacement);

// 14. Paginating Profiles list in UI
const profilesListRegex = `              {/* ALL PROFILES GRID */}
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/60 rounded-3xl border border-gray-800">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد حسابات مطابقة للبحث</h3>
                  <p className="text-gray-400 text-sm">جرب البحث باسم آخر أو تأكد من رقم الهاتف المدخل</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProfiles.map(profile => {
                    const isOnline = Boolean((user && (String(profile.id) === String(user.id) || String(profile.phone) === String(user.phone))) || onlineStatuses[profile.id] || onlineStatuses[profile.phone]);
                    return (
                      <motion.div
                        key={profile.id}
                        whileHover={{ y: -4 }}
                        onClick={() => onSellerClick(profile.id, 'accounts')}
                        className="bg-gray-800 hover:bg-gray-800/90 rounded-2xl p-4 border border-gray-700/80 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between shadow-md group"
                      >
                        <div className="flex items-start gap-3.5 mb-3">
                          <div className="relative shrink-0">
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-700 group-hover:border-amber-400 transition-colors"
                            />
                            <div 
                              className={\`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 flex items-center justify-center \${
                                isOnline ? 'bg-green-500 ring-2 ring-green-500/30' : 'bg-gray-500'
                              }\`} 
                              title={isOnline ? 'متصل الآن' : 'غير متصل'}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h3 className="text-white font-bold text-sm truncate group-hover:text-amber-300 transition-colors">{profile.name}</h3>
                              {profile.isVerified && (
                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className={\`px-2 py-0.5 rounded-md text-[10px] font-bold \${isOnline ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-700 text-gray-400'}\`}>
                                {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                              </span>
                              <span className="text-gray-400 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-400" /> {profile.location || 'بغداد'}
                              </span>
                            </div>

                            {profile.phone && (
                              <p className="text-gray-400 text-xs flex items-center gap-1.5 font-mono">
                                <PhoneIcon className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{profile.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-bold bg-gray-900/80 px-2 py-1 rounded-lg border border-gray-700/50">
                              📢 {profile.adCount || 0} إعلان
                            </span>
                            {(profile.prodCount || 0) > 0 && (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                🛍️ {profile.prodCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {profile.phone && (
                              <a
                                href={\`https://wa.me/964\${profile.phone.replace(/^0/, '')}\`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all shadow-md shadow-green-500/10"
                                title="مراسلة واتساب"
                              >
                                <MessageSquare className="w-3 h-3" /> مراسلة
                              </a>
                            )}
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                              الملف <ChevronLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}`;

const profilesListReplacement = `              {/* ALL PROFILES GRID */}
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/60 rounded-3xl border border-gray-800">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد حسابات مطابقة للبحث</h3>
                  <p className="text-gray-400 text-sm">جرب البحث باسم آخر أو تأكد من رقم الهاتف المدخل</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedProfiles.map(profile => {
                      const isOnline = Boolean((user && (String(profile.id) === String(user.id) || String(profile.phone) === String(user.phone))) || onlineStatuses[profile.id] || onlineStatuses[profile.phone]);
                      return (
                        <motion.div
                          key={profile.id}
                          whileHover={{ y: -4 }}
                          onClick={() => onSellerClick(profile.id, 'accounts')}
                          className="bg-gray-800 hover:bg-gray-800/90 rounded-2xl p-4 border border-gray-700/80 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between shadow-md group"
                        >
                          <div className="flex items-start gap-3.5 mb-3">
                            <div className="relative shrink-0">
                              <img
                                src={profile.avatar}
                                alt={profile.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-700 group-hover:border-amber-400 transition-colors"
                              />
                              <div 
                                className={\`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 flex items-center justify-center \${
                                  isOnline ? 'bg-green-500 ring-2 ring-green-500/30' : 'bg-gray-500'
                                }\`} 
                                title={isOnline ? 'متصل الآن' : 'غير متصل'}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <h3 className="text-white font-bold text-sm truncate group-hover:text-amber-300 transition-colors">{profile.name}</h3>
                                {profile.isVerified && (
                                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                    <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs mb-1">
                                <span className={\`px-2 py-0.5 rounded-md text-[10px] font-bold \${isOnline ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-700 text-gray-400'}\`}>
                                  {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                                </span>
                                <span className="text-gray-400 text-[11px] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-amber-400" /> {profile.location || 'بغداد'}
                                </span>
                              </div>

                              {profile.phone && (
                                <p className="text-gray-400 text-xs flex items-center gap-1.5 font-mono">
                                  <PhoneIcon className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{profile.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300 font-bold bg-gray-900/80 px-2 py-1 rounded-lg border border-gray-700/50">
                                📢 {profile.adCount || 0} إعلان
                              </span>
                              {(profile.prodCount || 0) > 0 && (
                                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                  🛍️ {profile.prodCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {profile.phone && (
                                <a
                                  href={\`https://wa.me/964\${profile.phone.replace(/^0/, '')}\`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all shadow-md shadow-green-500/10"
                                  title="مراسلة واتساب"
                                >
                                  <MessageSquare className="w-3 h-3" /> مراسلة
                                </a>
                              )}
                              <span className="text-amber-400 font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                                الملف <ChevronLeft className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {visibleProfilesCount < filteredProfiles.length && (
                    <div className="text-center py-6 mt-4 space-y-2 border-t border-gray-800">
                      <p className="text-gray-400 text-xs">تم العثور على {filteredProfiles.length} حساب، يتم عرض {displayedProfiles.length} من أصل {filteredProfiles.length}</p>
                      <button 
                        onClick={() => setVisibleProfilesCount(prev => prev + 12)} 
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
                      >
                        عرض المزيد
                      </button>
                    </div>
                  )}
                </div>
              )}`;

code = code.replace(profilesListRegex, profilesListReplacement);

// 15. Add Load More button to Ads & Products grid in MarketView
const adsGridRegex = `{showAds&&filterAds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><FileText className="w-4 h-4"/>الإعلانات ({filterAds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                {filterAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(ad.id);}}
                  onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}/>)}
              </div>
            </div>
          )}`;

const adsGridReplacement = `{showAds&&filterAds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><FileText className="w-4 h-4"/>الإعلانات ({filterAds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className="flex flex-col gap-6">
                <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                  {filterAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                    onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(ad.id);}}
                    onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                    onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}/>)}
                </div>
                {hasMoreAds && (
                  <div className="text-center py-4 border-t border-gray-800">
                    <button 
                      onClick={onLoadMoreAds} 
                      className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition-all shadow-md"
                    >
                      عرض المزيد من الإعلانات 📢
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}`;

code = code.replace(adsGridRegex, adsGridReplacement);

const productsGridRegex = `{showProds&&filterProds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><ShoppingBag className="w-4 h-4"/>المنتجات ({filterProds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                {filterProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(p.id);}}
                  onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                  onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}/>)}
              </div>
            </div>
          )}`;

const productsGridReplacement = `{showProds&&filterProds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><ShoppingBag className="w-4 h-4"/>المنتجات ({filterProds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className="flex flex-col gap-6">
                <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                  {filterProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                    onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(p.id);}}
                    onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                    onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}/>)}
                </div>
                {hasMoreProducts && (
                  <div className="text-center py-4 border-t border-gray-800">
                    <button 
                      onClick={onLoadMoreProducts} 
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                    >
                      عرض المزيد من المنتجات 🛍️
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}`;

code = code.replace(productsGridRegex, productsGridReplacement);

// 16. App Main view routing - ProductsView addition
code = code.replace(
  `          {view==='home'&&<motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <MarketView user={user} allAds={allAds} allProducts={allProducts} favorites={favorites} storedUsers={storedUsers} onSelectAd={setSelectedAd} onSelectProduct={setSelectedProduct} onToggleFav={handleToggleFav} onRequireAuth={requireAuth} onSellerClick={handleSellerClick} onTransportClick={()=>{setView('transport');setBottomNavActive('transport');}} onSelectTransportAd={setSelectedTransportAd} transportLines={allTransportAds}/></motion.div>}`,
  `          {view==='home'&&<motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <MarketView 
              user={user} 
              allAds={allAds} 
              allProducts={allProducts} 
              favorites={favorites} 
              storedUsers={storedUsers} 
              onSelectAd={setSelectedAd} 
              onSelectProduct={setSelectedProduct} 
              onToggleFav={handleToggleFav} 
              onRequireAuth={requireAuth} 
              onSellerClick={handleSellerClick} 
              onTransportClick={()=>{setView('transport');setBottomNavActive('transport');}} 
              onSelectTransportAd={setSelectedTransportAd} 
              transportLines={allTransportAds}
              search={search}
              setSearch={setSearch}
              cat={cat}
              setCat={setCat}
              gov={gov}
              setGov={setGov}
              sort={sort}
              setSort={setSort}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              hasMoreAds={hasMoreAds}
              hasMoreProducts={hasMoreProducts}
              onLoadMoreAds={() => fetchAds(false)}
              onLoadMoreProducts={() => fetchProducts(false)}
            />
          </motion.div>}
          {view==='products'&&<motion.div key="products" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ProductsView 
              user={user} 
              onBack={()=>setView('home')} 
              onCreateProduct={()=>{if(!user){requireAuth();return;}setShowCreateProduct(true);}} 
              onSelectProduct={setSelectedProduct} 
              products={allProducts} 
              onActionMenu={setActionMenuTarget} 
              hasMoreProducts={hasMoreProducts} 
              onLoadMoreProducts={() => fetchProducts(false)}
              search={search}
              setSearch={setSearch}
              cat={cat}
              setCat={setCat}
              gov={gov}
              setGov={setGov}
              sort={sort}
              setSort={setSort}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              conditionFilter={conditionFilter}
              setConditionFilter={setConditionFilter}
            />
          </motion.div>}`
);

// 17. Bottom Navigation Bar items
code = code.replace(
  `          {/* إضافة منتج */}
          <button
            onClick={() => { setBottomNavActive('create-product'); setShowCreateProduct(true); }}
            className={\`flex flex-col items-center justify-center flex-1 py-2 transition-all \${bottomNavActive === 'create-product' ? 'text-blue-400' : 'text-gray-400'}\`}
          >
            <div className={\`p-2 rounded-xl \${bottomNavActive === 'create-product' ? 'bg-blue-500/20' : ''}\`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">منتج</span>
          </button>`,
  `          {/* المنتجات */}
          <button
            onClick={() => { setBottomNavActive('products'); setView('products'); }}
            className={\`flex flex-col items-center justify-center flex-1 py-2 transition-all \${bottomNavActive === 'products' ? 'text-blue-400' : 'text-gray-400'}\`}
          >
            <div className={\`p-2 rounded-xl \${bottomNavActive === 'products' ? 'bg-blue-500/20' : ''}\`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">المنتجات</span>
          </button>`
);

// 18. Safe Area Styles for PWA
// Header notch safe area padding
code = code.replace(
  `<header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800">`,
  `<header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 pt-[env(safe-area-inset-top,0px)]">`
);

// Bottom nav safe area bottom padding
code = code.replace(
  `<nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 lg:hidden safe-area-bottom">`,
  `<nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 lg:hidden pb-[env(safe-area-inset-bottom,0px)]">`
);

// Main padding-top adjustment
code = code.replace(
  `<main className="pt-16">`,
  `<main className="pt-[calc(4rem+env(safe-area-inset-top,0px))]">`
);

// 19. Add 'products' to AppView type union
code = code.replace(
  `type AppView = 'home'|'profile'|'admin'|'owner'|'seller'|'transport';`,
  `type AppView = 'home'|'profile'|'admin'|'owner'|'seller'|'transport'|'products';`
);

// 20. Clean up duplicate local state variables in MarketView
code = code.replace(
  `  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');\n  const [visibleProfilesCount, setVisibleProfilesCount] = useState(12);\n  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');`,
  `  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');\n  const [visibleProfilesCount, setVisibleProfilesCount] = useState(12);`
);

code = code.replace(
  `  const [priceMin, setPriceMin] = useState('');\n  const [priceMax, setPriceMax] = useState('');`,
  ``
);

// Convert all LF back to CRLF before writing to match original Git standard formatting
code = code.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, code, 'utf8');
console.log("Optimizations applied successfully!");
