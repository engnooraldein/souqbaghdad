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

// Components that ALREADY have files (Phase 5 & 6)
const existingComponents = [
    'ProfileView', 'SellerPublicPage', 'AdminPanel', 'NotifPanel', 
    'MarketView', 'TransportView', 'ImageCropModal', 'AuthModal', 
    'InfoDocsModal', 'ImageLightboxModal', 'TransportDetailModal', 
    'AdFormModal', 'ProductFormModal', 'PasswordChangeModal', 'TransportFormModal'
];

// Components that NEED to be extracted (Phase 1-4)
const componentsToExtract = [
    'TimeAgo', 'Logo', 'Toast', 'InterestTimer', 'SkeletonCard', 
    'OnboardingModal', 'CongratulationsModal', 'AdCard', 'ProductCard', 
    'AdDetailModal', 'ProductDetailModal', 'MyLinesTab', 'TransportAdCard'
];

let extractions = [];

ts.forEachChild(sourceFile, node => {
    if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        if (existingComponents.includes(name) || componentsToExtract.includes(name)) {
            const start = node.getStart(sourceFile);
            const end = node.getEnd();
            extractions.push({ name, start, end, type: existingComponents.includes(name) ? 'remove' : 'extract' });
        }
    }
});

// Sort in reverse order to splice safely
extractions.sort((a, b) => b.start - a.start);

let importsToAdd = [];

// Helper to generate a new component file
function createComponentFile(name, codeContent) {
    // Generate simple imports. We will just import React and lucide-react broadly, plus types and App exports.
    const fileContent = `import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass } from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';

// Map all lucide icons to global scope to avoid missing imports
const {
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User: UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image: ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone: PhoneIcon,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon
} = LucideIcons;

export ${codeContent}
`;
    fs.writeFileSync(path.join(__dirname, '../src/components/' + name + '.tsx'), fileContent, 'utf-8');
}

for (const ext of extractions) {
    const componentCode = sourceCode.substring(ext.start, ext.end);
    
    if (ext.type === 'extract') {
        createComponentFile(ext.name, componentCode);
        console.log('Extracted ' + ext.name + ' to src/components/' + ext.name + '.tsx');
    }

    // Remove from App.tsx
    sourceCode = sourceCode.substring(0, ext.start) + sourceCode.substring(ext.end);
    
    // Schedule import
    importsToAdd.push('import { ' + ext.name + ' } from "./components/' + ext.name + '";');
    
    console.log('Removed ' + ext.name + ' from App.tsx');
}

// Prepend imports
sourceCode = importsToAdd.reverse().join('\n') + '\n' + sourceCode;

fs.writeFileSync(appPath, sourceCode, 'utf-8');
console.log('All extractions and removals complete.');
