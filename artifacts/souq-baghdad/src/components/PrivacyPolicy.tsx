import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black pb-20 pt-16">
      <Helmet>
        <title>سياسة الخصوصية - سوق بغداد</title>
        <meta name="description" content="سياسة الخصوصية لتطبيق سوق بغداد. تعرف على كيفية جمعنا واستخدامنا لبياناتك." />
      </Helmet>

      {/* Header */}
      <div className="bg-slate-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-white">سياسة الخصوصية</h1>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-8" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-800 text-gray-300 leading-relaxed space-y-6"
        >
          <p>
            تاريخ آخر تحديث: {new Date().toLocaleDateString('ar-IQ')}
          </p>
          
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            مقدمة
          </h2>
          <p>
            أهلاً بكم في تطبيق "سوق بغداد". نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك عند استخدامك للتطبيق.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8">البيانات التي نجمعها</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li><strong className="text-gray-300">المعلومات الشخصية:</strong> مثل اسمك ورقم هاتفك (عند التسجيل).</li>
            <li><strong className="text-gray-300">بيانات الإعلانات:</strong> أي معلومات، صور، أو نصوص تقوم بنشرها ضمن إعلاناتك.</li>
            <li><strong className="text-gray-300">معلومات الجهاز والموقع:</strong> عند الموافقة، قد نجمع بيانات الموقع الجغرافي لتحسين دقة عرض الإعلانات القريبة منك.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">كيف نستخدم بياناتك</h2>
          <p>
            تُستخدم البيانات بشكل أساسي لتوفير خدمات "سوق بغداد"، بما في ذلك عرض إعلاناتك للمستخدمين الآخرين، وتأمين حسابك، وتسهيل التواصل بين البائع والمشتري.
          </p>

          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mt-8">
            <Lock className="w-6 h-6 text-emerald-500" />
            حماية بياناتك
          </h2>
          <p>
            نحن نتخذ إجراءات أمنية صارمة لحماية معلوماتك من الوصول غير المصرح به. جميع البيانات مخزنة في خوادم سحابية مشفرة ومؤمنة، ولا نشارك معلوماتك الشخصية مع أطراف ثالثة لأغراض تسويقية.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8">المحتوى الذي ينشئه المستخدم (UGC)</h2>
          <p>
            باعتبار أن التطبيق يسمح للمستخدمين بنشر إعلاناتهم ومنتجاتهم، يرجى ملاحظة الآتي:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>أنت مسؤول بالكامل عن أي محتوى (نصوص أو صور) تقوم بنشره.</li>
            <li>نمتلك الحق في إزالة أي إعلان يخالف القوانين أو الآداب العامة دون إشعار مسبق.</li>
            <li>يوفر التطبيق أزراراً للمستخدمين <strong>للإبلاغ</strong> عن أي محتوى غير لائق، بالإضافة إلى إمكانية <strong>حظر</strong> المستخدمين المسيئين. سيتم مراجعة كافة البلاغات واتخاذ الإجراء اللازم.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8">حقوقك</h2>
          <p>
            لديك الحق في تعديل بياناتك الشخصية أو حذفها في أي وقت عبر إعدادات التطبيق. كما يمكنك طلب حذف حسابك نهائياً مع كافة بياناتك المتعلقة به.
          </p>
          
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mt-8">
            <p className="text-amber-200/80 text-sm">
              باستخدامك لتطبيق "سوق بغداد"، فإنك توافق على سياسة الخصوصية هذه وعلى شروط الاستخدام الخاصة بنا.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
