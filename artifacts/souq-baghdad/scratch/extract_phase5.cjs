const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf-8');

function extractComponent(componentName) {
    const fnStart = `function ${componentName}(`;
    const startIdx = appContent.indexOf(fnStart);
    if (startIdx === -1) {
        console.log(`Could not find ${componentName} in App.tsx`);
        return false;
    }

    // Find the opening brace of the function body
    let braceLevel = 0;
    let foundFirstBrace = false;
    let endIdx = -1;

    for (let i = startIdx; i < appContent.length; i++) {
        if (appContent[i] === '{') {
            braceLevel++;
            foundFirstBrace = true;
        } else if (appContent[i] === '}') {
            braceLevel--;
        }

        if (foundFirstBrace && braceLevel === 0) {
            endIdx = i + 1;
            break;
        }
    }

    if (endIdx === -1) {
        console.log(`Could not find end of ${componentName}`);
        return false;
    }

    const componentCode = appContent.substring(startIdx, endIdx);
    
    // Convert to export function
    const exportedCode = componentCode.replace(`function ${componentName}(`, `export function ${componentName}(`);
    
    // Add imports needed (we will add all standard ones to be safe, ts/eslint can clean later)
    let fileContent = `import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';\n` +
                      `import { motion, AnimatePresence } from 'framer-motion';\n` +
                      `import { \n` +
                      `  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, \n` +
                      `  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, \n` +
                      `  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, \n` +
                      `  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, \n` +
                      `  User as UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, \n` +
                      `  MessageCircle, Star, Image as ImageIcon, Map, Calendar, \n` +
                      `  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, \n` +
                      `  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus\n` +
                      `} from 'lucide-react';\n` +
                      `import { User, Ad, Product, TransportAd } from '../types';\n` +
                      `import { CATEGORIES } from '../App';\n` +
                      `import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass } from '../utils/helpers';\n` +
                      `import { TimeAgo } from './TimeAgo';\n` +
                      `import { SkeletonCard } from './SkeletonCard';\n` +
                      `import { AdCard } from './AdCard';\n` +
                      `import { ProductCard } from './ProductCard';\n` +
                      `import { TransportAdCard } from './TransportAdCard';\n` +
                      `import { IraqiEagle } from './Icons';\n` +
                      `\n` + exportedCode + `\n`;

    fs.writeFileSync(path.join(__dirname, `../src/components/${componentName}.tsx`), fileContent, 'utf-8');
    
    // Remove from App.tsx
    appContent = appContent.substring(0, startIdx) + appContent.substring(endIdx);
    
    // Add import to App.tsx
    const lastImportMatch = [...appContent.matchAll(/^import .*?(?:;|\n)/gm)];
    if (lastImportMatch.length > 0) {
        const last = lastImportMatch[lastImportMatch.length - 1];
        const importIdx = last.index + last[0].length;
        appContent = appContent.substring(0, importIdx) + `import { ${componentName} } from './components/${componentName}';\n` + appContent.substring(importIdx);
    }
    
    console.log(`Successfully extracted ${componentName}`);
    return true;
}

const componentsToExtract = [
    'AuthModal',
    'AdFormModal',
    'ProductFormModal',
    'TransportFormModal',
    'ImageCropModal',
    'ImageLightboxModal',
    'PasswordChangeModal',
    'InfoDocsModal',
    'TransportDetailModal'
];

componentsToExtract.forEach(comp => extractComponent(comp));

fs.writeFileSync(appPath, appContent, 'utf-8');
console.log('All extractions complete. Check typecheck.');
