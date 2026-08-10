import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { navigate } from '../utils/helpers';
import { SectionLoadingFallback } from './SectionLoadingFallback';

// Lazy loading views
const MarketView = React.lazy(() => import('../components/MarketView').then(m => ({ default: m.MarketView })));
const PrivacyPolicy = React.lazy(() => import('../components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const ProfileView = React.lazy(() => import('../components/ProfileView').then(m => ({ default: m.ProfileView })));
const SellerPublicPage = React.lazy(() => import('../components/SellerPublicPage').then(m => ({ default: m.SellerPublicPage })));
const AdminPanel = React.lazy(() => import('../components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const TransportView = React.lazy(() => import('../components/TransportView').then(m => ({ default: m.TransportView })));
const WalletView = React.lazy(() => import('../components/WalletView').then(m => ({ default: m.WalletView })));
const OwnerDashboard = React.lazy(() => import('../components/OwnerDashboard'));
const ProductsView = React.lazy(() => import('../components/ProductsView').then(m => ({ default: m.ProductsView })));

export interface AppRouterProps {
  peekView: string | null;
  peekDragX: any;
  mainDragX: any;
  onSwipePan: any;
  onSwipePanEnd: any;
  view: string;
  setView: (v: string) => void;
  user: User | null;
  allAds: any[];
  allProducts: any[];
  allTransportAds: any[];
  favorites: number[];
  storedUsers: any;
  setSelectedAd: (a: any) => void;
  setSelectedProduct: (p: any) => void;
  setSelectedTransportAd: (t: any) => void;
  handleToggleFav: (id: number) => void;
  requireAuth: () => void;
  handleSellerClick: (id: string, source?: 'home'|'accounts') => void;
  setBottomNavActive: (s: string) => void;
  isStandalone: boolean;
  handleInstallClick: () => void;
  search: string;
  setSearch: (s: string) => void;
  cat: string;
  setCat: (c: string) => void;
  gov: string;
  setGov: (g: string) => void;
  sort: "views" | "recent" | "price-low" | "price-high";
  setSort: (s: any) => void;
  priceMin: string;
  setPriceMin: (p: string) => void;
  priceMax: string;
  setPriceMax: (p: string) => void;
  conditionFilter: "new" | "used" | "all";
  setConditionFilter: (c: any) => void;
  hasMoreAds: boolean;
  hasMoreProducts: boolean;
  hasMoreTransport: boolean;
  fetchAds: (reset: boolean) => void;
  fetchProducts: (reset: boolean) => void;
  fetchTransportAds: (reset: boolean) => void;
  totalAdsCount: number;
  totalProductsCount: number;
  totalTransportCount: number;
  loadingMoreAds: boolean;
  loadingMoreProducts: boolean;
  loadingTransport: boolean;
  isInitialLoading: boolean;
  isDarkMode: boolean;
  handleHomeRefresh: () => void;
  setShowCreateProduct: (s: boolean) => void;
  showCreateTransport?: boolean;
  setShowCreateTransport: (s: boolean) => void;
  setShowCreateAd: (s: boolean) => void;
  setEditingProduct: (p: any) => void;
  setEditingAd: (a: any) => void;
  setActionMenuTarget: (t: any) => void;
  handlePostTransportAd: (d: any) => void;
  handleUpdateTransportStatus: (id: number, st: string) => void;
  handleDeleteTransportAd: (id: number) => void;
  handleDeleteAd: (id: number) => void;
  handleDeleteProduct: (id: number) => void;
  handleDeleteProfile: (id: string) => void;
  handleUpdateUser: (d: any) => void;
  handleMarkAdSold: (ad: any) => void;
  handleMarkProductSold: (p: any) => void;
  adCosts: any;
  myAds: any[];
  myProducts: any[];
  selectedSellerId: string | null;
  selectedSellerPhone: string | null;
  previousSellerSource: string;
  isAdmin: boolean;
  isOwner: boolean;
  setShowStoreGuide: (s: boolean) => void;
  setShowSearchPage?: (s: boolean) => void;
}

export const AppRouter: React.FC<AppRouterProps> = (props) => {
  return (
    <main className="pwa-main lg:pr-64 relative overflow-x-hidden pt-[calc(64px+env(safe-area-inset-top,0px))] pb-[calc(70px+env(safe-area-inset-bottom,0px))] lg:pb-0">
      {/* Peek view - adjacent page visible during swipe */}
      {props.peekView && (
        <motion.div
          style={{
            x: props.peekDragX,
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <Suspense fallback={<div className={`min-h-screen ${props.isDarkMode ? 'bg-gray-900' : 'bg-white'}`} />}>
            {props.peekView === 'home' && <MarketView user={props.user} allAds={props.allAds} allProducts={props.allProducts} favorites={props.favorites} storedUsers={props.storedUsers} onSelectAd={props.setSelectedAd} onSelectProduct={props.setSelectedProduct} onToggleFav={props.handleToggleFav} onRequireAuth={props.requireAuth} onSellerClick={props.handleSellerClick} onTransportClick={()=>{props.setView('transport');props.setBottomNavActive('transport');}} isStandalone={props.isStandalone} onInstallClick={props.handleInstallClick} onSelectTransportAd={props.setSelectedTransportAd} transportLines={props.allTransportAds} search={props.search} setSearch={props.setSearch} cat={props.cat} setCat={props.setCat} gov={props.gov} setGov={props.setGov} sort={props.sort} setSort={props.setSort} priceMin={props.priceMin} setPriceMin={props.setPriceMin} priceMax={props.priceMax} setPriceMax={props.setPriceMax} hasMoreAds={props.hasMoreAds} hasMoreProducts={props.hasMoreProducts} onLoadMoreAds={() => props.fetchAds(false)} onLoadMoreProducts={() => props.fetchProducts(false)} totalAdsCount={props.totalAdsCount} totalProductsCount={props.totalProductsCount} loadingMoreAds={props.loadingMoreAds} loadingMoreProducts={props.loadingMoreProducts} isInitialLoading={props.isInitialLoading} isDarkMode={props.isDarkMode} onRefresh={props.handleHomeRefresh} />}
            {props.peekView === 'products' && <ProductsView user={props.user} onBack={()=>props.setView('home')} onCreateProduct={()=>{if(!props.user){props.requireAuth();return;}props.setShowCreateProduct(true);}} onSelectProduct={props.setSelectedProduct} products={props.allProducts} onActionMenu={props.setActionMenuTarget} hasMoreProducts={props.hasMoreProducts} onLoadMoreProducts={() => props.fetchProducts(false)} totalProductsCount={props.totalProductsCount} loadingMoreProducts={props.loadingMoreProducts} isInitialLoading={props.isInitialLoading} search={props.search} setSearch={props.setSearch} cat={props.cat} setCat={props.setCat} gov={props.gov} setGov={props.setGov} sort={props.sort} setSort={props.setSort} priceMin={props.priceMin} setPriceMin={props.setPriceMin} priceMax={props.priceMax} setPriceMax={props.setPriceMax} conditionFilter={props.conditionFilter} setConditionFilter={props.setConditionFilter} />}
            {props.peekView === 'transport' && <TransportView user={props.user} onBack={()=>props.setView('home')} onCreateAd={()=>{if(!props.user){props.requireAuth();return;}props.setShowCreateTransport(true);}} onGoToMyLines={()=>{props.setView('profile'); setTimeout(()=>window.dispatchEvent(new CustomEvent('switch-to-lines-tab')), 100);}} onSelectAd={props.setSelectedTransportAd} lines={props.allTransportAds} onPost={props.handlePostTransportAd} onUpdateStatus={props.handleUpdateTransportStatus} onDeleteAd={props.handleDeleteTransportAd} onActionMenu={props.setActionMenuTarget} isInitialLoading={props.isInitialLoading || (props.loadingTransport && props.allTransportAds.length === 0)} storedUsers={props.storedUsers} onLoadMore={() => props.fetchTransportAds(false)} hasMore={props.hasMoreTransport} totalCount={props.totalTransportCount} adCosts={props.adCosts} showCreateTransport={props.showCreateTransport} setShowCreateTransport={props.setShowCreateTransport}/>}
            {props.peekView === 'profile' && props.user && <ProfileView user={props.user} myAds={props.myAds} myProducts={props.myProducts} onDeleteAd={props.handleDeleteAd} onEditAd={ad=>{props.setEditingAd(ad);props.setShowCreateAd(true);}} onDeleteProduct={props.handleDeleteProduct} onEditProduct={p=>{props.setEditingProduct(p);props.setShowCreateProduct(true);}} onUpdateUser={props.handleUpdateUser} onAddAd={()=>{props.setEditingAd(null);props.setShowCreateAd(true);}} onAddProduct={()=>{props.setEditingProduct(null);props.setShowCreateProduct(true);}} transportLines={props.allTransportAds} onUpdateTransportStatus={props.handleUpdateTransportStatus} onDeleteTransportAd={props.handleDeleteTransportAd} onMarkAdSold={props.handleMarkAdSold} onMarkProductSold={props.handleMarkProductSold} favorites={props.favorites} allAds={props.allAds} allProducts={props.allProducts} onAdSelect={props.setSelectedAd} onProductSelect={props.setSelectedProduct} onFav={props.handleToggleFav} onStoreGuideClick={() => props.setShowStoreGuide(true)} isDarkMode={props.isDarkMode} />}
          </Suspense>
        </motion.div>
      )}

      {/* Current view - slides with finger */}
      <motion.div
        style={{
          x: props.mainDragX,
          position: 'relative',
          zIndex: 2,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
        onPan={props.onSwipePan}
        onPanEnd={props.onSwipePanEnd}
      >
        {props.view === 'home' && <div key="home">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <MarketView 
              user={props.user} 
              allAds={props.allAds} 
              allProducts={props.allProducts} 
              favorites={props.favorites} 
              storedUsers={props.storedUsers} 
              onSelectAd={props.setSelectedAd} 
              onSelectProduct={props.setSelectedProduct} 
              onToggleFav={props.handleToggleFav} 
              onRequireAuth={props.requireAuth} 
              onSellerClick={props.handleSellerClick} 
              onTransportClick={()=>{props.setView('transport');props.setBottomNavActive('transport');}} 
              isStandalone={props.isStandalone}
              onInstallClick={props.handleInstallClick}
              onSelectTransportAd={props.setSelectedTransportAd} 
              transportLines={props.allTransportAds}
              search={props.search}
              setSearch={props.setSearch}
              cat={props.cat}
              setCat={props.setCat}
              gov={props.gov}
              setGov={props.setGov}
              sort={props.sort}
              setSort={props.setSort}
              priceMin={props.priceMin}
              setPriceMin={props.setPriceMin}
              priceMax={props.priceMax}
              setPriceMax={props.setPriceMax}
              hasMoreAds={props.hasMoreAds}
              hasMoreProducts={props.hasMoreProducts}
              onLoadMoreAds={() => props.fetchAds(false)}
              onLoadMoreProducts={() => props.fetchProducts(false)}
              totalAdsCount={props.totalAdsCount}
              totalProductsCount={props.totalProductsCount}
              loadingMoreAds={props.loadingMoreAds}
              loadingMoreProducts={props.loadingMoreProducts}
              isInitialLoading={props.isInitialLoading}
              isDarkMode={props.isDarkMode}
              onRefresh={props.handleHomeRefresh}
              setShowSearchPage={props.setShowSearchPage}
            />
          </Suspense>
        </div>}
        {props.view === 'privacy' && <div key="privacy">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <PrivacyPolicy onBack={() => props.setView('home')} />
          </Suspense>
        </div>}
        {props.view === 'products' && <div key="products">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <ProductsView 
              user={props.user} 
              onBack={()=>props.setView('home')} 
              onCreateProduct={()=>{if(!props.user){props.requireAuth();return;}props.setShowCreateProduct(true);}} 
              onSelectProduct={props.setSelectedProduct} 
              products={props.allProducts} 
              onActionMenu={props.setActionMenuTarget} 
              hasMoreProducts={props.hasMoreProducts} 
              onLoadMoreProducts={() => props.fetchProducts(false)}
              totalProductsCount={props.totalProductsCount}
              loadingMoreProducts={props.loadingMoreProducts}
              isInitialLoading={props.isInitialLoading}
              search={props.search}
              setSearch={props.setSearch}
              cat={props.cat}
              setCat={props.setCat}
              gov={props.gov}
              setGov={props.setGov}
              sort={props.sort}
              setSort={props.setSort}
              priceMin={props.priceMin}
              setPriceMin={props.setPriceMin}
              priceMax={props.priceMax}
              setPriceMax={props.setPriceMax}
              conditionFilter={props.conditionFilter}
              setConditionFilter={props.setConditionFilter}
            />
          </Suspense>
        </div>}
        {props.view === 'profile' && props.user && <div key="profile">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <ProfileView user={props.user} myAds={props.myAds} myProducts={props.myProducts} onDeleteAd={props.handleDeleteAd} onEditAd={ad=>{props.setEditingAd(ad);props.setShowCreateAd(true);}} onDeleteProduct={props.handleDeleteProduct} onEditProduct={p=>{props.setEditingProduct(p);props.setShowCreateProduct(true);}} onUpdateUser={props.handleUpdateUser} onAddAd={()=>{props.setEditingAd(null);props.setShowCreateAd(true);}} onAddProduct={()=>{props.setEditingProduct(null);props.setShowCreateProduct(true);}} transportLines={props.allTransportAds} onUpdateTransportStatus={props.handleUpdateTransportStatus} onDeleteTransportAd={props.handleDeleteTransportAd} onMarkAdSold={props.handleMarkAdSold} onMarkProductSold={props.handleMarkProductSold} favorites={props.favorites} allAds={props.allAds} allProducts={props.allProducts} onAdSelect={props.setSelectedAd} onProductSelect={props.setSelectedProduct} onFav={props.handleToggleFav} onStoreGuideClick={() => props.setShowStoreGuide(true)} isDarkMode={props.isDarkMode} />
          </Suspense>
        </div>}
        {props.view === 'wallet' && props.user && <div key="wallet">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <WalletView 
              user={props.user} 
              onBack={() => props.setView('profile')} 
              isDarkMode={props.isDarkMode} 
              onUpdateUser={props.handleUpdateUser} 
            />
          </Suspense>
        </div>}
        {props.view === 'seller' && props.selectedSellerId && <div key="seller">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <SellerPublicPage sellerId={props.selectedSellerId} allAds={props.allAds} allProducts={props.allProducts} allTransportAds={props.allTransportAds} storedUsers={props.storedUsers} onBack={() => {
              props.setView('home');
              if (props.previousSellerSource === 'accounts') {
                navigate('/accounts');
              } else {
                navigate('/');
              }
            }} onSelectAd={props.setSelectedAd} onSelectProduct={props.setSelectedProduct} onSelectTransport={props.setSelectedTransportAd} favorites={props.favorites} onToggleFav={props.handleToggleFav} user={props.user} onAuthRequired={props.requireAuth} onDeleteProfile={props.handleDeleteProfile} onActionMenu={props.setActionMenuTarget} isDarkMode={props.isDarkMode}/>
          </Suspense>
        </div>}
        {props.view === 'transport' && <div key="transport">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <TransportView user={props.user} onBack={()=>props.setView('home')} onCreateAd={()=>{if(!props.user){props.requireAuth();return;}props.setShowCreateTransport(true);}} onGoToMyLines={()=>{props.setView('profile'); setTimeout(()=>window.dispatchEvent(new CustomEvent('switch-to-lines-tab')), 100);}} onSelectAd={props.setSelectedTransportAd} lines={props.allTransportAds} onPost={props.handlePostTransportAd} onUpdateStatus={props.handleUpdateStatus} onDeleteAd={props.handleDeleteTransportAd} onActionMenu={props.setActionMenuTarget} isInitialLoading={props.isInitialLoading || (props.loadingTransport && props.allTransportAds.length === 0)} storedUsers={props.storedUsers} onLoadMore={() => props.fetchTransportAds(false)} hasMore={props.hasMoreTransport} totalCount={props.totalTransportCount} adCosts={props.adCosts} showCreateTransport={props.showCreateTransport} setShowCreateTransport={props.setShowCreateTransport}/>
          </Suspense>
        </div>}
        {props.view === 'admin' && props.isAdmin && !props.isOwner && <div key="admin">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <AdminPanel ads={props.allAds} onDeleteAd={props.handleDeleteAd} onClose={()=>props.setView('home')}/>
          </Suspense>
        </div>}
        {props.view === 'owner' && props.isOwner && <div key="owner">
          <Suspense fallback={<SectionLoadingFallback isDarkMode={props.isDarkMode} />}>
            <OwnerDashboard ads={props.allAds} products={props.allProducts} transportAds={props.allTransportAds} onDeleteAd={props.handleDeleteAd} onDeleteProduct={props.handleDeleteProduct} onDeleteTransportAd={props.handleDeleteTransportAd} onClose={()=>props.setView('home')} onDeleteProfile={props.handleDeleteProfile}/>
          </Suspense>
        </div>}
      </motion.div>
    </main>
  );
};
