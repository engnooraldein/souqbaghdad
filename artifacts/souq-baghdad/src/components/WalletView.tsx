import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, MessageCircle, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { User } from '../types';
import { useIAP } from '../hooks/useIAP';
import { supabase } from '../lib/supabase';

interface WalletViewProps {
  user: User;
  onBack: () => void;
  isDarkMode?: boolean;
  onUpdateUser: (u: User, quiet?: boolean) => void;
}

export function WalletView({ user, onBack, isDarkMode = true, onUpdateUser }: WalletViewProps) {
  const { packages, isReady, isLoading: isIapLoading, purchasePackage } = useIAP(user.id);
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim() || !user) return;
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', {
        p_code: promoCode.trim().toUpperCase(),
        p_user_id: user.id
      });
      if (error) throw error;
      if (data.success) {
        // Sync points
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user && authData.user.id !== user.id) {
            const { data: authProfile } = await supabase.from('profiles').select('points').eq('id', authData.user.id).single();
            if (authProfile && authProfile.points > 10) {
              const { data: mainProfile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
              const newPoints = (mainProfile?.points || 0) + authProfile.points - 10;
              await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id);
              await supabase.from('profiles').update({ points: 10 }).eq('id', authData.user.id);
            }
          }
        } catch(e) {
          console.warn('Sync points failed', e);
        }

        const { data: freshProfile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
        const newPoints = freshProfile?.points ?? (user.points || 0);

        onUpdateUser({ ...user, points: newPoints }, true);
        alert(data.message || 'تم تفعيل الكود بنجاح!');
        setPromoCode('');
      } else {
        alert(data.message || 'الكود غير صالح أو مستخدم مسبقاً.');
      }
    } catch (e: any) {
      console.error('Error redeeming code:', e);
      alert(e.message || 'حدث خطأ أثناء تفعيل الكود');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRechargeWhatsApp = () => {
    const text = encodeURIComponent(`مرحباً سوق بغداد،\nأريد شحن حسابي\nرقم الحساب: ${user.id}\nالاسم: ${user.name}`);
    window.open(`https://wa.me/9647700028170?text=${text}`, '_blank');
  };

  return (
    <div className={`min-h-[100dvh] pb-24 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      {/* Header */}
      <div className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between transition-colors ${isDarkMode ? 'bg-[#0a0a0a]/80 border-gray-800/60' : 'bg-white/80 border-slate-200/80 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-2 sm:p-2.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}>
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-l from-emerald-400 to-teal-500 bg-clip-text text-transparent">المحفظة</h1>
            <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>رصيدك وباقات الشحن</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-md shadow-slate-100'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className={`w-16 h-16 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'}`}>
                <Wallet className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500 font-semibold'} font-medium mb-1`}>الرصيد الحالي</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className={`text-5xl font-black font-mono tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{user.points || 0}</span>
                <span className="text-emerald-400 font-bold">نقطة</span>
              </div>
              
              {!Capacitor.isNativePlatform() && (
                <>
                  <button 
                    onClick={handleRechargeWhatsApp}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>تواصل للشحن السريع</span>
                  </button>
                  <p className="text-gray-500 text-xs mt-3">خصم 50% على الباقة الأساسية (100 نقطة بـ 2,500 د.ع)</p>
                </>
              )}

              {Capacitor.isNativePlatform() && isReady && packages.length > 0 && user.role === 'owner' && (
                <div className="mt-6 w-full text-right">
                  <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>الباقات المتوفرة (الدفع الرسمي)</h3>
                  <div className="flex flex-col gap-3">
                    {packages.map(pkg => (
                      <button 
                        key={pkg.id}
                        onClick={async () => {
                          const started = await purchasePackage(pkg.id);
                        }}
                        disabled={isIapLoading}
                        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex justify-between items-center opacity-100 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-emerald-200" />
                          <span>{pkg.title}</span>
                        </div>
                        <span className="font-mono bg-white/20 px-3 py-1 rounded-lg">{pkg.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>تفعيل برومو كود</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="أدخل الكود هنا (مثال: GIFT-100)" 
                className={`flex-1 border rounded-xl px-4 py-3 outline-none transition-colors uppercase font-mono text-center sm:text-right ${isDarkMode ? 'bg-gray-900 text-white placeholder-gray-500 border-gray-700 focus:border-amber-500/50' : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-amber-500'}`}
                disabled={isRedeeming}
              />
              <button 
                onClick={handleRedeemPromoCode}
                disabled={isRedeeming || !promoCode.trim()}
                className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors min-w-[120px]"
              >
                {isRedeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تفعيل'}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
