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
        <meta name="description" content="سياسة الخصوصية لمنصة وتطبيق سوق بغداد. تعرف على كيفية جمعنا واستخدامنا وحمايتنا لبياناتك." />
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
            title="الرجوع"
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
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-gray-700/60 text-sm space-y-1">
            <div><strong className="text-amber-400">القسم المختص:</strong> الدعم الفني والإدارة</div>
            <div><strong className="text-amber-400">البريد الإلكتروني:</strong> support@souqbaghdad.store</div>
            <div><strong className="text-amber-400">تاريخ آخر تحديث:</strong> 21 تموز 2026</div>
          </div>

          <p>
            توضح سياسة الخصوصية هذه كيفية قيام منصة وتطبيق "سوق بغداد" (يشار إليها لاحقاً بـ"المنصة" أو "نحن") بجمع بياناتك الشخصية واستخدامها ونقلها والإفصاح عنها والاحتفاظ بها.
          </p>
          <p>
            "سوق بغداد" هي منصة إعلانات مبوّبة رقمية رائدة تهدف إلى تسهيل البيع والشراء وتوفير أفضل تجربة للمستخدمين في جمهورية العراق.
          </p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">1. التعريفات</h2>
          <p>يكون للكلمات والتعبيرات المعرفة في شروط الاستخدام نفس المعنى في سياسة الخصوصية هذه.</p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">2. قبول معالجة البيانات</h2>
          <p>باستخدامك لمنصة "سوق بغداد" والخدمات المرتبطة بها، فإنك تمنح موافقة صريحة للمنصة على جمع بياناتك الشخصية واستخدامها ونقلها والإفصاح عنها والاحتفاظ بها كما هو موضح في سياسة الخصوصية هذه وشروط الاستخدام.</p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">3. ما هي البيانات الشخصية التي يتم جمعها؟</h2>
          <p>نقوم بجمع ومعالجة البيانات الشخصية التالية:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li><strong className="text-white">بيانات التعريف والاتصال:</strong> عند التسجيل، قد نجمع (الاسم، رقم الهاتف للتحقق، البريد الإلكتروني، وغيرها من المعلومات الاختيارية). نقوم بجمعها للتحقق من هويتك، ومنع الاحتيال، وحماية أمن المشترين والبائعين.</li>
            <li><strong className="text-white">محتوى المستخدمين:</strong> نقوم بجمع أي محتوى تقوم بإنشائه، ويشمل ذلك الإعلانات، الصور، المحادثات عبر رسائل المنصة. نجمع هذه المعلومات لتحسين تجربة المستخدم وجودة خدماتنا.</li>
            <li><strong className="text-white">البيانات الفنية:</strong> عند استخدامك للتطبيق أو الموقع، نقوم تلقائياً بجمع معلومات فنية (معلومات الجهاز، الموقع الجغرافي، ملفات تعريف الارتباط) لتزويدك بخدمات مخصصة لموقعك.</li>
            <li><strong className="text-white">البيانات من أطراف ثالثة:</strong> قد نتلقى بيانات شخصية عنك من أطراف ثالثة لأغراض تنفيذ عقد مبرم بينك وبين أي طرف ثالث يستخدم المنصة.</li>
          </ul>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">4. كيف نستخدم بياناتك الشخصية؟</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li><strong className="text-white">الالتزامات التعاقدية:</strong> لإبرام عقد معك أو تقديم الخدمات لك.</li>
            <li><strong className="text-white">الالتزامات القانونية:</strong> للامتثال للقوانين المعمول بها.</li>
            <li><strong className="text-white">المصالح المشروعة:</strong> لتحسين الخدمات، منع الاحتيال، وحماية أمن المشترين والبائعين.</li>
            <li><strong className="text-white">الاتصالات التسويقية:</strong> لتزويدك بمعلومات حول السلع والخدمات والإشعارات داخل التطبيق.</li>
          </ul>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">5. كيف نفصح عن بياناتك الشخصية؟</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>نستخدم مزودي خدمات من طرف ثالث (مثل خوادم التخزين السحابية) لمساعدتنا في تشغيل المنصة بأمان.</li>
            <li>قد نشارك معلومات غير محددة للهوية مع مزودي التحليلات لتحسين جودة التطبيق.</li>
            <li>يجوز لنا الإفصاح عن بياناتك للامتثال لأي متطلبات قانونية من الجهات الرسمية.</li>
            <li>عند نشر إعلان، فإنك تختار التصريح عن بعض البيانات (مثل اسمك ورقمك) لمستخدمي "سوق بغداد" الآخرين لتسهيل التواصل.</li>
          </ul>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">6. المسوغات القانونية للمعالجة</h2>
          <p>نعتمد على موافقتك الصريحة، التزاماتنا التعاقدية معك، الالتزامات القانونية، وحماية المصالح الحيوية والعامة لمستخدمي المنصة.</p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">7. كيف نقوم بتخزين بياناتك الشخصية؟</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>يتم تخزين بياناتك بشكل آمن باستخدام خوادم ومزودي خدمات حوسبة سحابية موثوقين.</li>
            <li>سنحتفظ ببياناتك طالما كنت مسجلاً. عند إلغاء حسابك، قد نحتفظ ببعض البيانات للفترة التي يقتضيها القانون لحماية مصالحنا، وبعدها يتم إتلافها بشكل آمن.</li>
          </ul>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">8. حقوقك تجاه بياناتك الشخصية</h2>
          <p>يحق لك:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>العلم بكيفية جمع بياناتك.</li>
            <li>الوصول إلى بياناتك الشخصية وتعديلها عبر إعدادات حسابك.</li>
            <li>طلب إتلاف بياناتك في ظروف معينة (ما لم يمنع ذلك قانونياً) وحذف الحساب نهائياً من إعدادات الملف الشخصي.</li>
            <li>الرجوع عن موافقتك في أي وقت.</li>
          </ul>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">9. الاتصال والتسويق</h2>
          <p>قد نتواصل معك عبر إشعارات التطبيق (Push Notifications) أو الرسائل أو البريد لتأكيد تسجيلك، ولإبلاغك بحالة إعلاناتك، وللأغراض التسويقية. يمكنك تعديل هذه التفضيلات من إعدادات جهازك.</p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">10. التدابير الأمنية</h2>
          <p>نحن نستخدم إجراءات أمنية وتقنيات تشفير لحماية بياناتك من الوصول غير المصرح به. ومع ذلك، نرجو ملاحظة أن نقل البيانات عبر الإنترنت ليس آمناً بنسبة 100% مطلقاً.</p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">11. ملفات تعريف الارتباط (Cookies)</h2>
          <p>نستخدم ملفات تعريف الارتباط لتحسين أداء المنصة، وتذكر إعداداتك، وحماية المنصة من الاحتيال، وتحليل الاستخدام لتقديم أفضل تجربة ممكنة.</p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">12. التعديلات على سياسة الخصوصية</h2>
          <p>قد نقوم بتحديث هذه السياسة من حين لآخر. إن استمرار استخدامك لمنصة "سوق بغداد" بعد إجراء التعديلات يشير إلى قبولك لها.</p>

          <h2 className="text-xl font-bold text-sky-400 border-r-4 border-amber-500 pr-3 mt-6">13. الشكاوى والاعتراضات</h2>
          <p>في حال وجود أي استفسارات أو شكاوى تتعلق ببياناتك الشخصية، يرجى التواصل معنا عبر البريد الإلكتروني المذكور أعلاه (support@souqbaghdad.store) أو عبر وسائل الدعم داخل التطبيق. تخضع هذه السياسة وتفسر وفقاً للقوانين المعمول بها في جمهورية العراق، وفي حال وجود نزاع، يتم الرجوع إلى الجهات المختصة في العراق.</p>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mt-8">
            <p className="text-amber-200/80 text-sm">
              باستخدامك لمنصة وتطبيق "سوق بغداد"، فإنك توافق على سياسة الخصوصية هذه وعلى جميع شروط وقواعد الاستخدام.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
