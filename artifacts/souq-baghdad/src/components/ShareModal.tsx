import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, MessageCircle, Send, Facebook, Twitter, Smartphone } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  image?: string;
  price?: string;
}

export function ShareModal({ isOpen, onClose, title, url, image, price }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullUrl = url.startsWith('http') ? url : `https://souqbaghdad.store${url}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `شاهد إعلان (${title}) على منصة سوق بغداد 🇮🇶`,
          url: fullUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const shareText = encodeURIComponent(`شاهد (${title}) بسعر ${price || ''} على منصة سوق بغداد الرقمية 🇮🇶:\n${fullUrl}`);

  const socialLinks = [
    {
      name: 'واتساب',
      icon: <MessageCircle className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
      href: `https://wa.me/?text=${shareText}`,
    },
    {
      name: 'تليجرام',
      icon: <Send className="w-5 h-5 text-sky-400" />,
      color: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300',
      href: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: 'فيس بوك',
      icon: <Facebook className="w-5 h-5 text-blue-400" />,
      color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: 'تويتر (X)',
      icon: <Twitter className="w-5 h-5 text-gray-300" />,
      color: 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-200',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative bg-gray-900/95 border border-gray-700/60 rounded-3xl p-6 w-full max-w-md shadow-2xl z-10 overflow-hidden text-right dir-rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">مشاركة الإعلان</h3>
                <p className="text-gray-400 text-xs">اختر المنصة لمشاركة الإعلان فوراً</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Item Preview Card */}
          <div className="my-4 p-3 bg-gray-800/60 rounded-2xl border border-gray-700/50 flex items-center gap-3">
            {image ? (
              <img src={image} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-600 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center text-2xl shrink-0">🛍️</div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm truncate">{title}</h4>
              {price && <p className="text-amber-400 font-bold text-xs mt-1">{price} د.ع</p>}
              <p className="text-gray-500 text-[11px] truncate mt-0.5">{fullUrl}</p>
            </div>
          </div>

          {/* Social Share Buttons Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${s.color}`}
              >
                {s.icon}
                <span className="font-bold text-xs">{s.name}</span>
              </a>
            ))}
          </div>

          {/* Native Phone Share API if available */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full mb-3 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/20"
            >
              <Smartphone className="w-4 h-4" />
              <span>مشاركة عبر تطبيقات الهاتف الأُخرى</span>
            </button>
          )}

          {/* Copy Link Section */}
          <div className="relative">
            <input
              type="text"
              readOnly
              value={fullUrl}
              className="w-full bg-gray-950 text-gray-300 text-xs rounded-2xl py-3 pr-4 pl-28 border border-gray-800 outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`absolute left-1.5 top-1.5 bottom-1.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                copied ? 'bg-emerald-500 text-black' : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
