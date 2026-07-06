import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { supabase } from '../lib/supabase'; // تأكد إن مسار استدعاء supabase صحيح حسب مشروعك

export default function LiveVisitorCounter() {
  // رقم مبدئي تقديري يظهر قبل جلب البيانات
  const [count, setCount] = useState(350);
  const [badge, setBadge] = useState<{ value: number; id: number } | null>(null);

  // 1. جلب البيانات من قاعدة البيانات وحفظها بالـ Cache لـ 72 ساعة (توفير البيانات والـ Quota)
  useEffect(() => {
    const fetchInitialCount = async () => {
      try {
        const cachedData = localStorage.getItem('visitor_cache');
        const now = new Date().getTime();

        // فحص الذاكرة المؤقتة (إذا مر عليها أقل من 72 ساعة نستخدمها)
        if (cachedData) {
          const { value, timestamp } = JSON.parse(cachedData);
          if (now - timestamp < 259200000) { // 72 ساعة = 259,200,000 مللي ثانية
            setCount(value);
            return;
          }
        }

        // جلب عدد المستخدمين المسجلين من جدول profiles
        const { count: dbUsersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // جلب عدد الزوار من جدول guests
        const { count: dbGuestsCount, error: guestsError } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true });

        const usersTotal = (!usersError && dbUsersCount !== null) ? dbUsersCount : 20;
        const guestsTotal = (!guestsError && dbGuestsCount !== null) ? dbGuestsCount : 50;

        // المعادلة المطلوبة: (المستخدمين + الزائرين) * 5
        const calculatedTotal = (usersTotal + guestsTotal) * 5;
        setCount(calculatedTotal);

        // حفظ الرقم بالذاكرة
        localStorage.setItem('visitor_cache', JSON.stringify({
          value: calculatedTotal,
          timestamp: now
        }));
      } catch (err) {
        console.error("Error fetching visitor count:", err);
      }
    };

    // التأكد من ذاكرة الجلسة حتى الرقم ما يتغير فجأة عند التنقل بالموقع
    const sessionCount = sessionStorage.getItem('live_visitor_count');
    if (sessionCount) {
      setCount(parseInt(sessionCount, 10));
    } else {
      fetchInitialCount();
    }
  }, []);

  // 2. حركة الأرقام العشوائية (زيادة طبيعية بـ 1 أو 2 أو 3 أو 4 كل فتره لتبدو حقيقية)
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        const increaseBy = Math.floor(Math.random() * 4) + 1; // زيادة 1 أو 2 أو 3 أو 4
        const newCount = prev + increaseBy;
        
        setBadge({ value: increaseBy, id: Date.now() });

        sessionStorage.setItem('live_visitor_count', newCount.toString());
        return newCount;
      });
    }, 45000); // يتحدث كل 45 ثانية بشكل هادئ وطبيعي

    return () => clearInterval(interval);
  }, []);

  // 3. إخفاء الرقم الطائر بعد ثانية ونص
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(() => setBadge(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [badge]);

  return (
    <div className="flex justify-center items-center my-6 relative w-full px-4">
      {/* التصميم الزجاجي */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)] px-5 py-3 rounded-full flex items-center justify-between w-full max-w-md">
        
        <div className="flex items-center gap-3">
          {/* نقطة البث المباشر */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Users className="text-slate-400 w-5 h-5" />
        </div>

        <span className="text-[13px] md:text-sm font-medium tracking-wide flex-1 text-right text-slate-200">
          أكثر من 
          <motion.strong 
            key={count} 
            initial={{ scale: 1.1, color: '#6ee7b7' }} 
            animate={{ scale: 1, color: '#34d399' }} 
            transition={{ duration: 0.3 }}
            className="text-emerald-400 text-base mx-1.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] inline-block"
          >
            {count.toLocaleString()}
          </motion.strong> 
          مستخدم وزائر!
        </span>
      </div>

      {/* حركة الرقم الطائر (+1, +2) */}
      <AnimatePresence>
        {badge && (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: -25, scale: 1.1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-0 text-emerald-400 font-bold text-lg drop-shadow-[0_0_10px_rgba(52,211,153,1)] z-10"
          >
            +{badge.value}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
