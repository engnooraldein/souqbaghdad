const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update top imports
const oldImports = `import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ShareModal } from './components/ShareModal';
import { ProductsView } from './components/ProductsView';
import { LoadingScreen } from './components/LoadingScreen';`;

const newImports = `import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ShareModal } from './components/ShareModal';
import { ProductsView } from './components/ProductsView';
import { LoadingScreen } from './components/LoadingScreen';
import { useOnlineStatuses } from './hooks/useOnlineStatuses';
import { SellerInfo, Ad, Product, User, StoredUser, Visit, SystemLog, TransportAd } from './types';
import { formatPrice } from './utils/format';
import { logSystemAction } from './utils/logs';
import { getRelative, useRelativeTime } from './utils/time';
import { ViewersModal } from './components/ViewersModal';`;

content = content.replace(oldImports, newImports);

// 2. Remove inline interfaces SellerInfo, Ad, Product, User, StoredUser, Visit
const startKeyTypes = 'export interface SellerInfo {';
const endKeyTypes = 'export interface Visit {\n  id: string; timestamp: string; device: \'mobile\'|\'desktop\'|\'tablet\';\n  location: string; userId?: string; userName?: string; page: string;\n}';

const sIdx = content.indexOf(startKeyTypes);
const eIdx = content.indexOf(endKeyTypes);

if (sIdx !== -1 && eIdx !== -1) {
  const fullTypesBlock = content.substring(sIdx, eIdx + endKeyTypes.length);
  content = content.replace(fullTypesBlock, '// Interfaces moved to src/types/index.ts');
  console.log("Successfully removed inline types.");
} else {
  console.error("Could not find inline types block to remove!");
  process.exit(1);
}

// 3. Remove inline formatPrice
const oldFormatPrice = `export const formatPrice = (p: string | number) => {
  const n = typeof p === 'string' ? parseInt(p.replace(/,/g,'')) : p;
  return isNaN(n) ? String(p) : n.toLocaleString('en-US');
};`;

if (content.includes(oldFormatPrice)) {
  content = content.replace(oldFormatPrice, '// formatPrice utility moved to src/utils/format.ts');
  console.log("Successfully removed inline formatPrice.");
} else {
  console.error("Could not find inline formatPrice to remove!");
  process.exit(1);
}

// 4. Remove useOnlineStatuses and fetchGlobalOnlineStatuses block
const startHookKey = 'let globalOnlineStatuses: Record<string, boolean> = {};';
const endHookKey = 'const fetchGlobalOnlineStatuses = async () => {\n  try {\n    const { data } = await supabase.from(\'profiles\').select(\'id, phone, last_seen\');\n    if (data) {\n      const map: Record<string, boolean> = {};\n      data.forEach(p => {\n        if(p.last_seen) {\n          const isRecentlySeen = new Date().getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000;\n          if (p.id) map[p.id] = isRecentlySeen;\n          if (p.phone) map[p.phone] = isRecentlySeen;\n        }\n      });\n      globalOnlineStatuses = map;\n      onlineListeners.forEach(l => l());\n    }\n  } catch(e) {}\n};';

const hsIdx = content.indexOf(startHookKey);
const heIdx = content.indexOf(endHookKey);

if (hsIdx !== -1 && heIdx !== -1) {
  const fullHookBlock = content.substring(hsIdx, heIdx + endHookKey.length);
  content = content.replace(fullHookBlock, '// useOnlineStatuses moved to src/hooks/useOnlineStatuses.ts');
  console.log("Successfully removed useOnlineStatuses block.");
} else {
  console.error("Could not find useOnlineStatuses block to remove!");
  // Robust check
  const simpleKey = 'export const useOnlineStatuses = () => {';
  const simpleEndKey = 'globalOnlineStatuses = map;\n      onlineListeners.forEach(l => l());\n    }\n  } catch(e) {}\n};';
  const sIdx2 = content.indexOf(simpleKey);
  const eIdx2 = content.indexOf(simpleEndKey);
  if (sIdx2 !== -1 && eIdx2 !== -1) {
    const fullBlock2 = content.substring(sIdx2 - 100, eIdx2 + simpleEndKey.length);
    content = content.replace(fullBlock2, '// useOnlineStatuses moved to src/hooks/useOnlineStatuses.ts');
    console.log("Successfully removed useOnlineStatuses block using robust fallback!");
  } else {
    process.exit(1);
  }
}

// 5. Remove ViewersModal component definition
const startViewersKey = 'export function ViewersModal({ itemId, itemType, onClose }: { itemId: string|number, itemType: \'ad\'|\'product\'|\'transport\', onClose: () => void }) {';
const endViewersKey = '  );\n}';

const vsIdx = content.indexOf(startViewersKey);
const veIdx = content.indexOf(endViewersKey, vsIdx);

if (vsIdx !== -1 && veIdx !== -1) {
  const fullViewersBlock = content.substring(vsIdx, veIdx + endViewersKey.length);
  content = content.replace(fullViewersBlock, '// ViewersModal moved to src/components/ViewersModal.tsx');
  console.log("Successfully removed ViewersModal definition.");
} else {
  console.error("Could not find ViewersModal definition to remove!");
  process.exit(1);
}

// 6. Remove inline TransportAd interface definition
const oldTransportAd = `export interface TransportAd {
  id: number;
  type: 'offer' | 'request'; // متوفر خط أو أبحث عن خط
  categoryType?: 'student' | 'employee'; // طلاب أم موظفين
  university: string;
  regions: string;
  price: string;
  seats: number;
  shift: string;
  vehicleType: string;
  targetAudience: string;
  phone: string;
  note: string;
  postedBy: string;
  sellerName: string;
  sellerAvatar: string;
  createdAt: string;
  status: 'pending' | 'published' | 'matched' | 'archived' | 'deleted_soft';
  completion_reason?: 'found_line' | 'line_full' | 'closed_by_owner' | null;
  completedAt?: string;
  views: number;
  interest: number;
  whatsappClicks?: number;
  short_id?: string;
}`;

if (content.includes(oldTransportAd)) {
  content = content.replace(oldTransportAd, '// TransportAd moved to src/types/index.ts');
  console.log("Successfully removed inline TransportAd.");
} else {
  console.error("Could not find inline TransportAd to remove!");
  // Robust check
  const startKeyTA = 'export interface TransportAd {';
  const endKeyTA = 'whatsappClicks?: number;\n  short_id?: string;\n}';
  const sIdx3 = content.indexOf(startKeyTA);
  const eIdx3 = content.indexOf(endKeyTA);
  if (sIdx3 !== -1 && eIdx3 !== -1) {
    const fullBlock3 = content.substring(sIdx3, eIdx3 + endKeyTA.length);
    content = content.replace(fullBlock3, '// TransportAd moved to src/types/index.ts');
    console.log("Successfully removed inline TransportAd using robust method!");
  } else {
    process.exit(1);
  }
}

// 7. Remove getRelative and useRelativeTime inline definitions since they are imported
const startTimeKey = 'function getRelative(iso: string): string {';
const endTimeKey = 'return rel;\n}';

const tsIdx = content.indexOf(startTimeKey);
const teIdx = content.indexOf(endTimeKey, tsIdx);

if (tsIdx !== -1 && teIdx !== -1) {
  const fullTimeBlock = content.substring(tsIdx, teIdx + endTimeKey.length);
  content = content.replace(fullTimeBlock, '// Time helpers moved to src/utils/time.ts');
  console.log("Successfully removed inline time helpers.");
} else {
  console.error("Could not find inline time helpers to remove!");
  process.exit(1);
}

// 8. Remove logSystemAction definition
const startLogKey = 'export const logSystemAction = (action: string, details: string, target?: string, admin: string = \'المالك\') => {';
const endLogKey = '  } catch (err) {\n    console.error(\'Failed to log action:\', err);\n  }\n};';

const lsIdx = content.indexOf(startLogKey);
const leIdx = content.indexOf(endLogKey, lsIdx);

if (lsIdx !== -1 && leIdx !== -1) {
  const fullLogBlock = content.substring(lsIdx, leIdx + endLogKey.length);
  content = content.replace(fullLogBlock, '// logSystemAction moved to src/utils/logs.ts');
  console.log("Successfully removed inline logSystemAction.");
} else {
  console.error("Could not find inline logSystemAction to remove!");
  process.exit(1);
}

fs.writeFileSync(appPath, content, 'utf8');
console.log("Successfully finished updating App.tsx!");
