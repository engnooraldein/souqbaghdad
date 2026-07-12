const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let sourceCode = fs.readFileSync(appPath, 'utf-8');

const sourceFile = ts.createSourceFile(
    'App.tsx',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

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

let extractions = [];

ts.forEachChild(sourceFile, node => {
    if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        if (componentsToExtract.includes(name)) {
            const start = node.getStart(sourceFile);
            const end = node.getEnd();
            const code = sourceCode.substring(start, end);
            extractions.push({ name, start, end, code });
        }
    }
});

if (extractions.length === 0) {
    console.log('No components found to extract.');
    process.exit(0);
}

// Sort in reverse order to splice safely
extractions.sort((a, b) => b.start - a.start);

for (const ext of extractions) {
    const exportedCode = ext.code.replace(/^function /, 'export function ');
    
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

    fs.writeFileSync(path.join(__dirname, `../src/components/${ext.name}.tsx`), fileContent, 'utf-8');
    
    // Remove from App.tsx
    sourceCode = sourceCode.substring(0, ext.start) + sourceCode.substring(ext.end);
    
    // Add import
    const importStr = `import { ${ext.name} } from './components/${ext.name}';\n`;
    sourceCode = importStr + sourceCode;
    
    console.log(`Successfully extracted ${ext.name}`);
}

fs.writeFileSync(appPath, sourceCode, 'utf-8');
console.log('All extractions complete.');
