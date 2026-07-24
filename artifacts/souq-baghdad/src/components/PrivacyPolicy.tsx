import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 pb-24 pt-16 font-sans">
      <Helmet>
        <title>سياسة الخصوصية - سوق بغداد</title>
        <meta name="description" content="سياسة الخصوصية والأمان لمنصة وتطبيق سوق بغداد وفق معايير Google Play." />
      </Helmet>

      {/* Modern Header Bar */}
      <div className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 fixed top-0 inset-x-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">سياسة الخصوصية والأمان</h1>
              <p className="text-[10px] text-emerald-400 font-bold">معتمدة ومطابقة لإرشادات Google Play 🛡️</p>
            </div>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors"
            title="الرجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6" dir="rtl">
        {/* Compliance Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-950/60 to-gray-900 p-5 rounded-2xl border border-emerald-500/20 shadow-lg flex items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-extrabold text-white">حماية البيانات والخصوصية أولويتنا</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              نلتزم بأعلى معايير حماية بيانات المستخدمين، وتقليل طلب الأذونات، ومنحك التحكم الكامل بحسابك.
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
        </motion.div>

        {/* Section 1: Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/90 rounded-2xl p-5 border border-gray-800 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <span className="w-2 h-5 bg-amber-500 rounded-full" />
            <h2 className="text-base font-bold text-white">1. ما هي البيانات التي نجمعها؟</h2>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <div><strong className="text-white">بيانات الحساب:</strong> الاسم، رقم الهاتف لغرض التحقق، والبريد الإلكتروني.</div>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <div><strong className="text-white">المحتوى والإعلانات:</strong> الإعلانات والمنتجات التي ينشرها المستخدم لتسهيل التواصل.</div>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <div><strong className="text-white">الأذونات المحصورة:</strong> نطلب الحد الأدنى فقط من الأذونات التي تضمن عمل التطبيق بسلاسة (مثل الكاميرا لإرفاق صور الإعلانات).</div>
            </li>
          </ul>
        </motion.div>

        {/* Section 2: Data Usage */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/90 rounded-2xl p-5 border border-gray-800 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <span className="w-2 h-5 bg-sky-500 rounded-full" />
            <h2 className="text-base font-bold text-white">2. كيف نحمي ونستخدم بياناتك؟</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            يتم تشفير وتخزين البيانات على خوادم سحابية محمية. لا نقوم ببيع أو مشاركة بياناتك الشخصية مع أي طرف ثالث لأغراض إعلانية غير مصرح بها.
          </p>
        </motion.div>

        {/* Section 3: Deletion & Rights */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/90 rounded-2xl p-5 border border-gray-800 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <span className="w-2 h-5 bg-rose-500 rounded-full" />
            <h2 className="text-base font-bold text-white">3. حقك في حذف الحساب والبيانات</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            وفقاً لسياسة Google Play، يمكنك في أي وقت طلب حذف حسابك الشخصي وجميع بياناتك المترتبة بشكل نهائي من داخل إعدادات الحساب بالتطبيق أو بمراسلة الدعم الفني على:
            <span className="block mt-1 text-emerald-400 font-mono font-bold dir-ltr text-right">support@souqbaghdad.store</span>
          </p>
        </motion.div>

        {/* Support Footer */}
        <div className="text-center py-4 text-xs text-gray-500 space-y-1">
          <p>جميع الحقوق محفوظة منصة سوق بغداد الرقمية 🇮🇶 © 2026</p>
        </div>
      </div>
    </div>
  );
}
