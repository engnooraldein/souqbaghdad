const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// We will find "const fetchAds = useCallback" and clean up inside it.
// To make it robust, we'll locate fetchAds, then do string replacements for the specific parts inside it.

const toRemoveQuery = `      let transportMapped: TransportAd[] = [];
      if (reset) {
        setLoadingTransport(true);
        const { data: transportData, error: transportError } = await supabase
          .from('ads')
          .select('*')
          .eq('category', 'transport')
          .eq('is_demo', false)
          .order('created_at', { ascending: false });
          
        if (!transportError && transportData) {
          transportMapped = transportData.map((row: any) => {
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
        }
        setLoadingTransport(false);
      }`;

// Robust search for toRemoveQuery by replacing all spacing differences if any,
// but let's try direct replacement first. If it's CRLF, we should handle that.

const cleanToRemoveQuery = toRemoveQuery.replace(/\r\n/g, '\n');
const contentLF = content.replace(/\r\n/g, '\n');

if (contentLF.includes(cleanToRemoveQuery)) {
  content = contentLF.replace(cleanToRemoveQuery, '');
  console.log("Successfully removed transport query from fetchAds!");
} else {
  console.error("Could not find toRemoveQuery in App.tsx!");
  // Robust search
  const startKey = "let transportMapped: TransportAd[] = [];";
  const endKey = "setLoadingTransport(false);\n      }";
  const sIdx = contentLF.indexOf(startKey);
  const eIdx = contentLF.indexOf(endKey);
  if (sIdx !== -1 && eIdx !== -1) {
    const fullTarget = contentLF.substring(sIdx, eIdx + endKey.length);
    content = contentLF.replace(fullTarget, '');
    console.log("Successfully removed transport query using robust index search!");
  } else {
    process.exit(1);
  }
}

// Now replace state setters in fetchAds success block
const targetResetSetters = `          setAllAds(activeMapped);
          setAllTransportAds(transportMapped);`;

const replacementResetSetters = `          setAllAds(activeMapped);`;

const targetAppendSetters = `          setAllTransportAds(prev => {
            const combined = [...prev, ...transportMapped];
            const unique = combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
            return unique;
          });`;

content = content.replace(targetResetSetters, replacementResetSetters);
content = content.replace(targetAppendSetters, '');

// Save back to file
fs.writeFileSync(appPath, content, 'utf8');
console.log("Successfully cleaned up fetchAds!");
