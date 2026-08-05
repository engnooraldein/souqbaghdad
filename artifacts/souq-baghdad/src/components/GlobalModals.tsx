import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Plus, AlertCircle, Smartphone, X } from 'lucide-react';
import { handleUniversalShare } from '../hooks/useAppInteractions';

// Modals
import { OnboardingModal } from './OnboardingModal';
import { AuthModal } from './AuthModal';
const AdDetailModal = React.lazy(() => import('./AdDetailModal').then(m => ({ default: m.AdDetailModal })));
const ProductDetailModal = React.lazy(() => import('./ProductDetailModal').then(m => ({ default: m.ProductDetailModal })));
const TransportDetailModal = React.lazy(() => import('./TransportDetailModal').then(m => ({ default: m.TransportDetailModal })));
const AdFormModal = React.lazy(() => import('./AdFormModal').then(m => ({ default: m.AdFormModal })));
const ProductFormModal = React.lazy(() => import('./ProductFormModal').then(m => ({ default: m.ProductFormModal })));
const InfoDocsModal = React.lazy(() => import('./InfoDocsModal').then(m => ({ default: m.InfoDocsModal })));
const ShareModal = React.lazy(() => import('./ShareModal').then(m => ({ default: m.ShareModal })));
import { NotifPanel } from './NotifPanel';
import { ChatView } from './ChatView';
import { ImageLightboxModal } from './ImageLightboxModal';
import { CongratulationsModal } from './CongratulationsModal';
import { InstallOptionsModal } from './InstallOptionsModal';
import { StoreShareGuideModal } from './StoreShareGuideModal';

const DEFAULT_AVATAR = "https://i.ibb.co/hRyMhcc/avatar.png";

export interface GlobalModalsProps {
  showOnboarding: any;
  setShowOnboarding: any;
  showAuth: any;
  setShowAuth: any;
  handleLogin: any;
  selectedAd: any;
  setSelectedAd: any;
  favorites: any;
  handleToggleFav: any;
  user: any;
  storedUsers: any;
  requireAuth: any;
  handleSellerClick: any;
  handleViewDurationLogged: any;
  setActiveLightbox: any;
  setAllAds: any;
  selectedProduct: any;
  setSelectedProduct: any;
  setAllProducts: any;
  selectedTransportAd: any;
  setSelectedTransportAd: any;
  showCreateAd: any;
  setShowCreateAd: any;
  setEditingAd: any;
  handleAddOrEditAd: any;
  editingAd: any;
  adCosts: any;
  showCreateProduct: any;
  setShowCreateProduct: any;
  setEditingProduct: any;
  handleAddOrEditProduct: any;
  editingProduct: any;
  showNotifs: any;
  setShowNotifs: any;
  notifications: any;
  handleHistoryClick: any;
  markNotifAsRead: any;
  handleArchiveAllNotifications: any;
  showChatModal: any;
  setShowChatModal: any;
  chatViewport: any;
  activeChatId: any;
  setActiveChatId: any;
  setSelectedSellerId: any;
  activeDocTab: any;
  setActiveDocTab: any;
  activeLightbox: any;
  congratulationsItem: any;
  setCongratulationsItem: any;
  shareModalData: any;
  setShareModalData: any;
  showInstallGuide: any;
  setShowInstallGuide: any;
  showInstallOptions: any;
  setShowInstallOptions: any;
  handlePwaInstall: any;
  showStoreGuide: any;
  setShowStoreGuide: any;
}

export const GlobalModals: React.FC<GlobalModalsProps> = (props) => {
  const {
    showOnboarding,
    setShowOnboarding,
    showAuth,
    setShowAuth,
    handleLogin,
    selectedAd,
    setSelectedAd,
    favorites,
    handleToggleFav,
    user,
    storedUsers,
    requireAuth,
    handleSellerClick,
    handleViewDurationLogged,
    setActiveLightbox,
    setAllAds,
    selectedProduct,
    setSelectedProduct,
    setAllProducts,
    selectedTransportAd,
    setSelectedTransportAd,
    showCreateAd,
    setShowCreateAd,
    setEditingAd,
    handleAddOrEditAd,
    editingAd,
    adCosts,
    showCreateProduct,
    setShowCreateProduct,
    setEditingProduct,
    handleAddOrEditProduct,
    editingProduct,
    showNotifs,
    setShowNotifs,
    notifications,
    handleHistoryClick,
    markNotifAsRead,
    handleArchiveAllNotifications,
    showChatModal,
    setShowChatModal,
    chatViewport,
    activeChatId,
    setActiveChatId,
    setSelectedSellerId,
    activeDocTab,
    setActiveDocTab,
    activeLightbox,
    congratulationsItem,
    setCongratulationsItem,
    shareModalData,
    setShareModalData,
    showInstallGuide,
    setShowInstallGuide,
    showInstallOptions,
    setShowInstallOptions,
    handlePwaInstall,
    showStoreGuide,
    setShowStoreGuide,
  } = props;

  return (
    <>
      {/* Modals */}
      <AnimatePresence>
        {showOnboarding&&<Suspense fallback={null}><OnboardingModal isOpen={showOnboarding} onClose={()=>{setShowOnboarding(false);localStorage.setItem('souqOnboarded','1');localStorage.setItem('souq_onboarding_completed','true');}}/></Suspense>}
        {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={handleLogin}/>}
        {selectedAd&&<Suspense fallback={null}><AdDetailModal ad={selectedAd} onClose={()=>setSelectedAd(null)} isFav={favorites.includes(selectedAd.id)} onFav={()=>handleToggleFav(selectedAd.id)} user={user} storedUsers={storedUsers} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedAd(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedAd.id, selectedAd.title, selectedAd.postedBy || '', 'ad', sec)} onImageZoom={(src, title, imgs, idx) => setActiveLightbox({ src, title, images: imgs, initialIdx: idx })} onViewsUpdated={(id, views) => { setAllAds((prev: any[]) => prev.map((a: any) => String(a.id) === String(id) ? { ...a, views: Math.max(a.views || 0, views) } : a)); window.dispatchEvent(new CustomEvent('update-views', { detail: { id, views, type: 'ad' } })); }} /></Suspense>}
        {selectedProduct&&<Suspense fallback={null}><ProductDetailModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} isFav={favorites.includes(selectedProduct.id)} onFav={()=>handleToggleFav(selectedProduct.id)} user={user} storedUsers={storedUsers} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedProduct(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedProduct.id, selectedProduct.title, selectedProduct.postedBy || '', 'product', sec)} onImageZoom={(src, title, imgs, idx) => setActiveLightbox({ src, title, images: imgs, initialIdx: idx })} onViewsUpdated={(id, views) => { setAllProducts((prev: any[]) => prev.map((p: any) => String(p.id) === String(id) ? { ...p, views: Math.max(p.views || 0, views) } : p)); window.dispatchEvent(new CustomEvent('update-views', { detail: { id, views, type: 'product' } })); }} /></Suspense>}
        {selectedTransportAd&&<Suspense fallback={null}><TransportDetailModal ad={selectedTransportAd} onClose={()=>setSelectedTransportAd(null)} user={user} onAuthRequired={requireAuth} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedTransportAd.id, selectedTransportAd.type==='offer'?'خط متوفر':'طلب خط', selectedTransportAd.postedBy || '', 'transport', sec)} storedUsers={storedUsers}/></Suspense>}
        {showCreateAd&&user&&<Suspense fallback={null}><AdFormModal isOpen={showCreateAd} onClose={()=>{setShowCreateAd(false);setEditingAd(null);}} onSubmit={handleAddOrEditAd} user={user} editAd={editingAd} cost={adCosts.ad !== undefined ? adCosts.ad : 1} vipCost={adCosts.vip_ad !== undefined ? adCosts.vip_ad : 5} /></Suspense>}
        {showCreateProduct&&user&&<Suspense fallback={null}><ProductFormModal isOpen={showCreateProduct} onClose={()=>{setShowCreateProduct(false);setEditingProduct(null);}} onSubmit={handleAddOrEditProduct} user={user} editProduct={editingProduct} cost={adCosts.product !== undefined ? adCosts.product : 1} vipCost={adCosts.vip_ad !== undefined ? adCosts.vip_ad : 5} /></Suspense>}
        {showNotifs&&<Suspense fallback={null}><NotifPanel isOpen={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifications} onNotifClick={handleSellerClick} onHistoryClick={handleHistoryClick} onMarkRead={markNotifAsRead} onArchiveAll={handleArchiveAllNotifications}/></Suspense>}
        {showChatModal && (
          <Suspense fallback={null}>
            {/* Full-screen solid background - prevents iOS Safari page bleed-through */}
            <div className="fixed inset-0 z-[110] bg-gray-950" />
            {/* Chat content - positioned exactly to visual viewport */}
            <div 
              className="fixed z-[111] flex flex-col bg-gray-950 overflow-hidden"
              style={{
                top: chatViewport.top,
                left: chatViewport.left,
                width: chatViewport.width,
                height: chatViewport.height,
              }}
            >
              <ChatView
                currentUser={user}
                activeChatId={activeChatId}
                onClose={() => {
                  setShowChatModal(false);
                  setActiveChatId(null);
                }}
                onOpenAuth={() => {
                  setShowChatModal(false);
                  setShowAuth(true);
                }}
                onOpenSellerProfile={(userId) => {
                  setShowChatModal(false);
                  setSelectedSellerId(userId);
                }}
              />
            </div>
          </Suspense>
        )}

        {activeDocTab&&<Suspense fallback={null}><InfoDocsModal activeTab={activeDocTab} onClose={()=>setActiveDocTab(null)} user={user}/></Suspense>}
        {activeLightbox&&<ImageLightboxModal src={activeLightbox.src} title={activeLightbox.title} images={(activeLightbox as any).images} initialIdx={(activeLightbox as any).initialIdx} onClose={()=>setActiveLightbox(null)}/>}
        {congratulationsItem && <CongratulationsModal item={congratulationsItem} onClose={() => setCongratulationsItem(null)} />}
        {shareModalData.isOpen && (
          <Suspense fallback={null}>
            <ShareModal
              isOpen={shareModalData.isOpen}
              onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
              title={shareModalData.title}
              url={shareModalData.url}
              image={shareModalData.image}
              price={shareModalData.price}
              governorate={shareModalData.governorate}
              location={shareModalData.location}
              short_id={shareModalData.short_id}
              description={(shareModalData as any).description}
              category={shareModalData.category}
              views={shareModalData.views}
              createdAt={shareModalData.createdAt}
              isVerified={shareModalData.isVerified}
              images={shareModalData.images}
              university={shareModalData.university}
              regions={shareModalData.regions}
              type={shareModalData.type}
            />
          </Suspense>
        )}

        {showInstallGuide && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={()=>setShowInstallGuide(null)}/>
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="relative bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-700 shadow-2xl text-right" dir="rtl">
              <button onClick={()=>setShowInstallGuide(null)} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
              
              {showInstallGuide === 'safari' && (
                <>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-amber-400"/> تثبيت التطبيق على iPhone (Safari)</h2>
                  <p className="text-gray-400 text-sm mb-4">لتثبيت تطبيق "سوك بغداد" على الشاشة الرئيسية لجهاز الـ iPhone الخاص بك، يرجى اتباع الخطوات البسيطة التالية:</p>
                  <ol className="space-y-3 text-gray-300 text-sm list-decimal list-inside">
                    <li>اضغط على زر <span className="font-bold text-amber-400">مشاركة (Share)</span> <Share2 className="w-4 h-4 inline-block mx-1 text-amber-400"/> الموجود في شريط الأدوات بالأسفل.</li>
                    <li>قم بالتمرير لأسفل واضغط على خيار <span className="font-bold text-amber-400">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span> <Plus className="w-4 h-4 inline-block mx-1 text-amber-400"/>.</li>
                    <li>اضغط على <span className="font-bold text-amber-400">إضافة (Add)</span> في الزاوية العلوية اليمنى لإتمام التثبيت.</li>
                  </ol>
                </>
              )}

              {showInstallGuide === 'ios-other' && (
                <>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-400"/> متصفح غير مدعوم للتثبيت</h2>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    يبدو أنك تستخدم متصفحًا آخر غير <span className="text-amber-400 font-bold">Safari</span> على هاتف iPhone الخاص بك (مثل Chrome أو Edge).
                  </p>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    نظام iOS لا يسمح بتثبيت التطبيقات على الشاشة الرئيسية إلا من خلال متصفح <span className="text-white font-bold">Safari</span>.
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs mb-4">
                    <strong>الحل:</strong> يرجى نسخ رابط الموقع الحالي، وفتحه باستخدام متصفح <strong>Safari</strong> الرسمي على جهازك، ثم الضغط على زر التثبيت مرة أخرى.
                  </div>
                  <button onClick={() => {
                    navigator.clipboard.writeText("https://souqbaghdad.store");
                    alert("تم نسخ رابط الموقع!");
                  }} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-sm" title="نسخ رابط الموقع" aria-label="نسخ رابط الموقع">
                    نسخ رابط الموقع 📋
                  </button>
                </>
              )}

              {showInstallGuide === 'android-fallback' && (
                <>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-amber-400"/> كيفية تثبيت التطبيق</h2>
                  <p className="text-gray-400 text-sm mb-4">لتثبيت التطبيق على جهازك يدويًا:</p>
                  <ul className="space-y-3 text-gray-300 text-sm list-disc list-inside">
                    <li>اضغط على زر <span className="font-bold text-amber-400">خيارات المتصفح (الثلاث نقاط في الأعلى)</span>.</li>
                    <li>اختر <span className="font-bold text-amber-400">تثبيت التطبيق (Install App)</span> أو <span className="font-bold text-amber-400">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.</li>
                    <li>أكّد عملية التثبيت في المربع الذي يظهر لك.</li>
                  </ul>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstallOptionsModal
        isOpen={showInstallOptions}
        onClose={() => setShowInstallOptions(false)}
        onPwaInstall={handlePwaInstall}
        playStoreUrl="https://play.google.com/store/apps/details?id=store.souqbaghdad.app"
      />

      <Suspense fallback={null}>
        {user && showStoreGuide && (
          <StoreShareGuideModal
            isOpen={showStoreGuide}
            onClose={() => setShowStoreGuide(false)}
            storeUrl={`https://www.souqbaghdad.store/seller/${user.id}`}
            onShare={() => {
              setShowStoreGuide(false);
              handleUniversalShare({
                title: user.name,
                type: 'profile',
                location: user.location || 'بغداد',
                id: user.id,
                url: '/seller/' + user.id,
                image: user.avatar || DEFAULT_AVATAR
              });
            }}
          />
        )}
      </Suspense>

    </>
  );
};
