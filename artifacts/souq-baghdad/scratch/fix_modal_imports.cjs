const fs = require('fs');
const path = require('path');

function addImports(filePath, imports) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = imports + '\n' + content;
  fs.writeFileSync(filePath, content, 'utf-8');
}

const adDetailImports = `
import { Suspense } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Eye, Shield, Star, MessageSquare, PhoneIcon, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';
import { InterestTimer } from './InterestTimer';
import { getWhatsAppLink } from '../utils/helpers';
import { recordItemView } from '../App';
import { handleUniversalShare } from '../App';
import { CATEGORIES } from '../App';
import { DEFAULT_AVATAR } from '../constants';
const ViewersModal = React.lazy(() => import('./ViewersModal').then(m => ({ default: m.ViewersModal })));
`;

const productDetailImports = `
import { Suspense } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Eye, Shield, MessageSquare, PhoneIcon, Heart, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';
import { InterestTimer } from './InterestTimer';
import { getWhatsAppLink } from '../utils/helpers';
import { recordItemView } from '../App';
import { handleUniversalShare } from '../App';
import { DEFAULT_AVATAR } from '../constants';
const ViewersModal = React.lazy(() => import('./ViewersModal').then(m => ({ default: m.ViewersModal })));
`;

addImports(path.join(__dirname, '../src/components/AdDetailModal.tsx'), adDetailImports);
addImports(path.join(__dirname, '../src/components/ProductDetailModal.tsx'), productDetailImports);
console.log('Imports added successfully');
