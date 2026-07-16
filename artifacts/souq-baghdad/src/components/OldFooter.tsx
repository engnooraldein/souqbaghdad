// ===========================================
// مسؤولية هذا الملف:
// نسخة قديمة من الـ Footer (غير مستخدمة حالياً).
//
// ⚠️ تحذير Dead Code:
// هذا الملف قديم ولا يُستخدم في التطبيق.
// يُنصح بحذفه لتنظيف المشروع.
//
// آمن للحذف:
// نعم، بعد التأكد من عدم استخدامه في أي import.
// ===========================================
import { motion } from 'framer-motion';
import { Car, Home, Smartphone, Watch, Bike, ShoppingBag, Wrench, Video, Store, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { IraqiEagle } from './Icons';

export function Footer() {
  const categories = [
    { name: 'السيارات', icon: Car, link: '#' },
    { name: 'العقارات', icon: Home, link: '#' },
    { name: 'الهواتف', icon: Smartphone, link: '#' },
    { name: 'الإلكترونيات', icon: Watch, link: '#' },
    { name: 'الدراجات', icon: Bike, link: '#' },
    { name: 'المنتجات', icon: ShoppingBag, link: '#' },
    { name: 'الخدمات', icon: Wrench, link: '#' },
    { name: 'الفيديوهات', icon: Video, link: '#' },
    { name: 'المتاجر', icon: Store, link: '#' },
  ];

  const quickLinks = [
    { name: 'عن سوك بغداد', link: '#' },
    { name: 'كيف يعمل', link: '#' },
    { name: 'الأسعار', link: '#' },
    { name: 'الأسئلة الشائعة', link: '#' },
    { name: 'شروط الاستخدام', link: '#' },
    { name: 'سياسة الخصوصية', link: '#' },
  ];

  const cities = [
    'بغداد', 'البصرة', 'أربيل', 'نينوى', 'النجف', 'كربلاء', 'ذي قار',
    'بابل', 'ديالى', 'كركوك', ' صلاح الدين', ' الأنبار', ' القادسية',
    'ميسان', 'واسط', 'ذي قار', ' المثنى', ' ذي قار'
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl flex items-center justify-center golden-glow">
                <IraqiEagle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">سوك بغداد</h2>
                <p className="text-amber-400 text-sm">السوق الرقمي العراقي</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              أكبر منصة عراقية للبيع والشراء والإعلانات. نوفر لك تجربة تسوق حديثة وسهلة مع هوية عراقية عصرية.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, href: '#', color: 'bg-gray-800' },
                { icon: Twitter, href: '#', color: 'bg-sky-500' },
                { icon: Instagram, href: '#', color: 'bg-pink-600' },
                { icon: Youtube, href: '#', color: 'bg-red-600' },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  className={`w-10 h-10 ${social.color} rounded-xl flex items-center justify-center`}
                >
                  <social.icon className="w-5 h-5 text-white" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">الأقسام</h3>
            <ul className="space-y-3">
              {categories.slice(0, 6).map((category) => (
                <li key={category.name}>
                  <a
                    href={category.link}
                    className="text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-2"
                  >
                    <category.icon className="w-4 h-4" />
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">روابط سريعة</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.link}
                    className="text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">تواصل معنا</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                <span className="text-gray-400">بغداد، العراق - شارع الكرادة داخل</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-gray-400">07700028170</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-gray-400">info@souqbaghdad.com</span>
              </li>
            </ul>

            {/* App Download */}
            <div className="mt-6">
              <p className="text-gray-400 text-sm mb-3">حمّل التطبيق</p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-gray-800 rounded-xl flex items-center gap-2"
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="text-white text-sm">App Store</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-gray-800 rounded-xl flex items-center gap-2"
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  <span className="text-white text-sm">Google Play</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Iraqi Flag Banner */}
      <div className="border-t border-b border-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
            <span className="text-amber-400 font-semibold">المدن الرئيسية:</span>
            {cities.slice(0, 8).map((city) => (
              <a key={city} href="#" className="hover:text-amber-400 transition-colors">
                {city}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 سوك بغداد. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full" />
                <div className="w-3 h-3 bg-black rounded-full" />
                <div className="w-3 h-3 bg-red-600 rounded-full" />
              </div>
              <span className="text-gray-500 text-sm">العراق</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
