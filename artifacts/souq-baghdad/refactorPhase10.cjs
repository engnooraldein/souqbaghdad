const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Add Imports
const importsToAdd = `
import { AppRouter } from './components/AppRouter';
import { useAppGlobalState } from './hooks/useAppGlobalState';
`;
if (!appCode.includes('import { AppRouter }')) {
  appCode = appCode.replace(/(import React, {.*?\} from 'react';)/s, `$1\n${importsToAdd}`);
}

// 2. Replace the loose functions and side-effects (lines ~528 to ~750) with useAppGlobalState hook
// We'll replace a specific block.

const hookReplacement = `
  const {
    checkPostRateLimit,
    handleHomeRefresh,
    handleHistoryClick,
    markNotifAsRead,
    handleArchiveAllNotifications
  } = useAppGlobalState({
    user,
    setView,
    setCat,
    setBottomNavActive,
    setSearch,
    setGov,
    setSort,
    fetchAds,
    fetchProducts,
    fetchTransportAds,
    playNotificationSound,
    unreadChatCount,
    notifications,
    setNotifications,
    allAds,
    allProducts,
    allTransportAds,
    setSelectedAd,
    setSelectedProduct,
    setSelectedTransportAd,
    setShareModalData,
    showToast
  });
`;

// Remove the old Badge effect, Share modal effect, checkPostRateLimit, handleHomeRefresh, handleHistoryClick, markNotifAsRead, handleArchiveAllNotifications
// This is a bit risky with Regex since these are big functions. It's safer to just find the boundary.
const startRegex = /\/\/\s*هذا useEffect يعمل مرة واحدة عند فتح التطبيق\.\s*\n\s*\/\/\s*يستمع لحدث \(open-share-modal\)/m;
const endRegex = /handleArchiveAllNotifications = async \(\) => \{[\s\S]*?\}\s*;\s*\n/m;

const matchStart = appCode.match(startRegex);
const matchEnd = appCode.match(endRegex);

if (matchStart && matchEnd) {
  const startIndex = matchStart.index;
  const endIndex = matchEnd.index + matchEnd[0].length;
  appCode = appCode.substring(0, startIndex) + hookReplacement + appCode.substring(endIndex);
}

// 3. Replace the <main>...</main> with <AppRouter>
const mainRegex = /<main className="pwa-main lg:pr-64 relative overflow-x-hidden pt-\[calc\(64px\+env\(safe-area-inset-top,0px\)\)\] pb-\[calc\(70px\+env\(safe-area-inset-bottom,0px\)\)\] lg:pb-0">.*?<\/main>/s;

const appRouterComponent = `<AppRouter 
        peekView={peekView}
        peekDragX={peekDragX}
        mainDragX={mainDragX}
        onSwipePan={onSwipePan}
        onSwipePanEnd={onSwipePanEnd}
        view={view}
        setView={setView}
        user={user}
        allAds={allAds}
        allProducts={allProducts}
        allTransportAds={allTransportAds}
        favorites={favorites}
        storedUsers={storedUsers}
        setSelectedAd={setSelectedAd}
        setSelectedProduct={setSelectedProduct}
        setSelectedTransportAd={setSelectedTransportAd}
        handleToggleFav={handleToggleFav}
        requireAuth={requireAuth}
        handleSellerClick={handleSellerClick}
        setBottomNavActive={setBottomNavActive}
        isStandalone={isStandalone}
        handleInstallClick={handleInstallClick}
        search={search}
        setSearch={setSearch}
        cat={cat}
        setCat={setCat}
        gov={gov}
        setGov={setGov}
        sort={sort}
        setSort={setSort}
        priceMin={priceMin}
        setPriceMin={setPriceMin}
        priceMax={priceMax}
        setPriceMax={setPriceMax}
        conditionFilter={conditionFilter}
        setConditionFilter={setConditionFilter}
        hasMoreAds={hasMoreAds}
        hasMoreProducts={hasMoreProducts}
        hasMoreTransport={hasMoreTransport}
        fetchAds={fetchAds}
        fetchProducts={fetchProducts}
        fetchTransportAds={fetchTransportAds}
        totalAdsCount={totalAdsCount}
        totalProductsCount={totalProductsCount}
        totalTransportCount={totalTransportCount}
        loadingMoreAds={loadingMoreAds}
        loadingMoreProducts={loadingMoreProducts}
        loadingTransport={loadingTransport}
        isInitialLoading={isInitialLoading}
        isDarkMode={isDarkMode}
        handleHomeRefresh={handleHomeRefresh}
        setShowCreateProduct={setShowCreateProduct}
        setShowCreateTransport={setShowCreateTransport}
        setShowCreateAd={setShowCreateAd}
        setEditingProduct={setEditingProduct}
        setEditingAd={setEditingAd}
        setActionMenuTarget={setActionMenuTarget}
        handlePostTransportAd={handlePostTransportAd}
        handleUpdateTransportStatus={handleUpdateTransportStatus}
        handleDeleteTransportAd={handleDeleteTransportAd}
        handleDeleteAd={handleDeleteAd}
        handleDeleteProduct={handleDeleteProduct}
        handleDeleteProfile={handleDeleteProfile}
        handleUpdateUser={handleUpdateUser}
        handleMarkAdSold={handleMarkAdSold}
        handleMarkProductSold={handleMarkProductSold}
        adCosts={adCosts}
        myAds={myAds}
        myProducts={myProducts}
        selectedSellerId={selectedSellerId}
        selectedSellerPhone={selectedSellerPhone}
        previousSellerSource={previousSellerSource}
        isAdmin={isAdmin}
        isOwner={isOwner}
        setShowStoreGuide={setShowStoreGuide}
      />`;

appCode = appCode.replace(mainRegex, appRouterComponent);

fs.writeFileSync(appPath, appCode);
console.log('Phase 10: Router and Loose Functions extracted successfully!');
