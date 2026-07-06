const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'src', 'components', 'OwnerDashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

const targetLF = `import { useOnlineStatuses } from '../App';
import { Ad, Product, User, StoredUser, Visit, SystemLog } from '../App';
import { formatPrice, ViewersModal, logSystemAction } from '../App';

// We need to define or import TransportAd if it's used
import { TransportAd } from '../App';`;

const replacement = `import { useOnlineStatuses } from '../hooks/useOnlineStatuses';
import { Ad, Product, User, StoredUser, Visit, SystemLog, TransportAd } from '../types';
import { formatPrice } from '../utils/format';
import { logSystemAction } from '../utils/logs';
import { ViewersModal } from './ViewersModal';`;

// Normalize line endings
content = content.replace(/\r\n/g, '\n');
const cleanTarget = targetLF.replace(/\r\n/g, '\n');

if (content.includes(cleanTarget)) {
  content = content.replace(cleanTarget, replacement);
  fs.writeFileSync(dashPath, content, 'utf8');
  console.log("Successfully fixed OwnerDashboard imports!");
} else {
  console.error("Could not find import block in OwnerDashboard.tsx!");
  process.exit(1);
}
