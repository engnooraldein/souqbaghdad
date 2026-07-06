const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Define fetchTransportAds
const fetchTransportAdsFunc = `  const fetchTransportAds = useCallback(async () => {
    setLoadingTransport(true);
    try {
      const { data: transportData, error: transportError } = await supabase
        .from('ads')
        .select('*')
        .eq('category', 'transport')
        .eq('is_demo', false)
        .order('created_at', { ascending: false });
        
      if (!transportError && transportData) {
        const transportMapped = transportData.map((row: any) => {
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
            completion_reason: extra.completion_reason,
            short_id: row.short_id || undefined,
          };
        });
        setAllTransportAds(transportMapped);
      }
    } catch (e) {
      console.error('Error fetching transport ads:', e);
    } finally {
      setLoadingTransport(false);
    }
  }, []);`;

// We will insert fetchTransportAdsFunc right before "const fetchAds = useCallback"
const targetFetchAds = '  const fetchAds = useCallback(async (reset = true) => {';
if (!content.includes(targetFetchAds)) {
  console.error("Could not find fetchAds declaration in App.tsx!");
  process.exit(1);
}

content = content.replace(targetFetchAds, fetchTransportAdsFunc + '\n\n' + targetFetchAds);

// 2. Add useEffect to fetch transport ads when view changes
const viewUseEffect = `  useEffect(() => {
    if (view === 'transport' || view === 'profile') {
      fetchTransportAds();
    }
  }, [view, fetchTransportAds]);`;

// Insert it before "useEffect(() => {\n    if (['home', 'profile', 'transport'].includes(view)) {"
const targetViewEffect = `  useEffect(() => {\n    if (['home', 'profile', 'transport'].includes(view)) {`;
const targetViewEffectCRLF = `  useEffect(() => {\r\n    if (['home', 'profile', 'transport'].includes(view)) {`;

if (content.includes(targetViewEffect)) {
  content = content.replace(targetViewEffect, viewUseEffect + '\n\n' + targetViewEffect);
} else if (content.includes(targetViewEffectCRLF)) {
  content = content.replace(targetViewEffectCRLF, viewUseEffect + '\r\n\r\n' + targetViewEffectCRLF);
} else {
  console.error("Could not find view useEffect in App.tsx!");
  process.exit(1);
}

fs.writeFileSync(appPath, content, 'utf8');
console.log("Successfully added fetchTransportAds and its useEffect!");
