import { useState, useEffect } from 'react';
import { Ad, Product, TransportAd } from '../types';

export function useAppModals() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateTransport, setShowCreateTransport] = useState(false);
  const [showStoreGuide, setShowStoreGuide] = useState(false);

  const [editingAd, setEditingAd] = useState<Ad|null>(null);
  const [editingProduct, setEditingProduct] = useState<Product|null>(null);
  const [editingTransportAd, setEditingTransportAd] = useState<TransportAd|null>(null);
  
  const [selectedAd, setSelectedAd] = useState<Ad|null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product|null>(null);
  const [selectedTransportAd, setSelectedTransportAd] = useState<TransportAd|null>(null);
  
  const [actionMenuTarget, setActionMenuTarget] = useState<{type:'ad'|'product'|'transport'; item:any}|null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info'; visible: boolean; icon?: any }>({ msg: '', type: 'info', visible: false });

  const [activeDocTab, setActiveDocTab] = useState<string | null>(null);

  const [activeLightbox, setActiveLightbox] = useState<{ src: string; title: string; images?: string[]; initialIdx?: number } | null>(null);
  
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; title: string; url: string; image?: string; price?: string; governorate?: string; location?: string; short_id?: string; description?: string; category?: string; views?: number; createdAt?: string; isVerified?: boolean; images?: string[]; university?: string; regions?: string; type?: string; }>({ isOpen: false, title: '', url: '' });

  const [congratulationsItem, setCongratulationsItem] = useState<{ title: string; type: 'ad' | 'product' } | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem('souq_onboarding_completed') || localStorage.getItem('souqOnboarded');
    if (!completed) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  return {
    showOnboarding, setShowOnboarding,
    showNotifs, setShowNotifs,
    showMobileMenu, setShowMobileMenu,
    showCreateAd, setShowCreateAd,
    showCreateProduct, setShowCreateProduct,
    showCreateTransport, setShowCreateTransport,
    showStoreGuide, setShowStoreGuide,
    editingAd, setEditingAd,
    editingProduct, setEditingProduct,
    editingTransportAd, setEditingTransportAd,
    selectedAd, setSelectedAd,
    selectedProduct, setSelectedProduct,
    selectedTransportAd, setSelectedTransportAd,
    actionMenuTarget, setActionMenuTarget,
    toast, setToast,
    activeDocTab, setActiveDocTab,
    activeLightbox, setActiveLightbox,
    shareModalData, setShareModalData,
    congratulationsItem, setCongratulationsItem
  };
}
