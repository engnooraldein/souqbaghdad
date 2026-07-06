const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
const outputPath = path.join(__dirname, '..', 'src', 'components', 'OwnerDashboard.tsx');

const content = fs.readFileSync(appPath, 'utf8');
const lines = content.split('\n');

// Line 3433 to 4368 (1-indexed is lines[3432] to lines[4367])
// Let's find the indices dynamically to be extra safe.
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function OwnerDashboard')) {
    startIdx = i;
  }
  if (startIdx !== -1 && lines[i].includes('function AdminPanel')) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end of OwnerDashboard dynamically!");
  process.exit(1);
}

console.log(`Found OwnerDashboard at line ${startIdx + 1} to ${endIdx}`);

const dashboardCode = lines.slice(startIdx, endIdx).join('\n');

const template = `import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  X, ShieldAlert, Sparkles, Shield, UserX, AlertCircle, Ban, 
  Users, Activity, Crown, FileText, ShoppingBag, Package, Store, 
  Trash2, ArrowRight, Eye, CheckCircle2, ChevronRight, ChevronLeft, Search, 
  Clock, Bell, Lock, User, Phone, Check, RefreshCw
} from 'lucide-react';
import { useOnlineStatuses } from '../App';
import { Ad, Product, User, StoredUser, Visit, SystemLog } from '../App';
import { formatPrice, ViewersModal, logSystemAction } from '../App';

// We need to define or import TransportAd if it's used
import { TransportAd } from '../App';

export default ${dashboardCode}
`;

fs.writeFileSync(outputPath, template, 'utf8');
console.log("Successfully extracted OwnerDashboard to src/components/OwnerDashboard.tsx");
