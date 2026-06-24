import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, ImagePlus, FileText, Music, Cpu, Search, CheckCircle, Zap } from 'lucide-react';

interface AICenterProps {
  onBack: () => void;
}

const features = [
  { id: 'image', label: 'تحسين الصور', description: 'زيادة الجودة، إزالة الخلفية، تكبير الصور.', icon: ImagePlus },
  { id: 'summary', label: 'تلخيص المنتجات', description: 'ملخص سريع، المميزات، العيوب، الاستخدام.', icon: FileText },
  { id: 'marketing', label: 'إنشاء محتوى', description: 'نصوص إنستغرام، تيك توك، فيسبوك، هاشتاغ.', icon: Music },
  { id: 'assistant', label: 'المساعد الذكي', description: 'استفسارات المستخدم، البحث الذكي، التوصيات.', icon: Cpu },
];

export function AICenter({ onBack }: AICenterProps) {
  const [activeFeature, setActiveFeature] = useState('assistant');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('اكتب سؤالك أو وصف المهمة هنا وسيقوم المساعد بالرد فوراً.');

  const handleAsk = () => {
    if (!query.trim()) return;
    setResponse(`المساعد يعمل على طلبك: "${query.trim()}"\n\n- يبحث الآن عن أفضل النتائج...\n- يقترح منتجات مناسبة ويشرح الخيارات.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 py-8 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
            الرجوع
          </button>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-2xl shadow-slate-900/40">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-3xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-amber-300">AI Center</p>
                  <h1 className="text-3xl font-bold text-white">مركز الذكاء الاصطناعي</h1>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">استخدم أدوات الذكاء الاصطناعي لبناء تجربة متطورة داخل الموقع دون تغيير النظام الأساسي الحالي. هنا تحصل على تحليل ذكي، توصيات، إنشاء محتوى ومعالجة صور متقدمة.</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => setActiveFeature(feature.id)}
                      className={`w-full text-left rounded-3xl border p-5 transition ${activeFeature === feature.id ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-amber-400 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-3xl bg-black/40 flex items-center justify-center text-amber-300">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{feature.label}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{feature.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-1/2 rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/70 p-6 backdrop-blur-xl shadow-2xl shadow-slate-900/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-amber-300">المساعد الذكي</p>
                  <h2 className="text-2xl font-bold">تحدث مع الذكاء الاصطناعي</h2>
                </div>
                <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-gray-300">سريع | عربي</div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Search className="w-5 h-5 text-amber-400" />
                    <p className="text-sm text-gray-300">اسأل المساعد أو اطلب توصية منتج.</p>
                  </div>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="مثال: أريد هاتف للألعاب"
                    className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white placeholder:text-gray-500 focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAsk}
                    className="flex-1 rounded-3xl bg-amber-500 px-6 py-3 text-black font-semibold hover:bg-amber-400 transition"
                  >
                    اطلب الآن
                  </button>
                  <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm text-gray-300">اقتراحات سريعة</div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/50 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-300">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">الرد الذكي</p>
                      <p className="text-white font-semibold">نتائج فورية لمساعدتك في التسوق.</p>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-300">{response}</pre>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-gray-400 mb-2">أدوات مدعومة</p>
                  <div className="flex flex-wrap gap-2 text-xs text-amber-300">
                    <span className="rounded-full bg-white/5 px-3 py-2">تلخيص</span>
                    <span className="rounded-full bg-white/5 px-3 py-2">بحث ذكي</span>
                    <span className="rounded-full bg-white/5 px-3 py-2">تحسين صور</span>
                    <span className="rounded-full bg-white/5 px-3 py-2">إنشاء محتوى</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-gray-400 mb-2">حالة AI Center</p>
                  <p className="text-white font-semibold">جاهز للعمل مع تصميم متقدم وميزات ذكية.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
