// ===========================================
// مسؤولية هذا الملف:
// قسم الفيديوهات القصيرة (Short Videos).
//
// قد يتصل بـ Supabase Storage لجلب الفيديوهات.
// تحقق من useEffect للتأكد من عدم وجود جلب متكرر.
//
// انتبه:
// الفيديوهات قد تستهلك bandwidth كبيراً من Supabase Storage.
//
// آمن للتعديل:
// نعم، بحذر.
// ===========================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, ChevronLeft, ChevronRight, Home, Search, Plus, User } from 'lucide-react';

interface Video {
  id: number;
  videoUrl: string;
  thumbnail: string;
  title: string;
  author: string;
  avatar: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

const videos: Video[] = [
  {
    id: 1,
    videoUrl: 'https://example.com/video1.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=700&fit=crop',
    title: 'Mercedes AMG GT 2024 - نظرة شاملة',
    author: 'عالم السيارات',
    avatar: 'https://i.pravatar.cc/150?img=1',
    description: 'مراجعة شاملة لأجمل سيارة ألمانية',
    likes: 12500,
    comments: 342,
    shares: 89,
    isLiked: false,
    isBookmarked: false
  },
  {
    id: 2,
    videoUrl: 'https://example.com/video2.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=700&fit=crop',
    title: 'فيلا فاخرة في المنصور',
    author: 'عقارات بغداد',
    avatar: 'https://i.pravatar.cc/150?img=2',
    description: 'فيلا 500 متر مربع - 5 غرف نوم',
    likes: 8900,
    comments: 156,
    shares: 45,
    isLiked: true,
    isBookmarked: false
  },
  {
    id: 3,
    videoUrl: 'https://example.com/video3.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=700&fit=crop',
    title: 'iPhone 15 Pro Max - أول نظرة',
    author: 'تك عربي',
    avatar: 'https://i.pravatar.cc/150?img=3',
    description: 'أحدث هاتف من آبل بين يديك',
    likes: 25000,
    comments: 678,
    shares: 234,
    isLiked: false,
    isBookmarked: true
  },
  {
    id: 4,
    videoUrl: 'https://example.com/video4.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=700&fit=crop',
    title: 'بيك اب تويوتا هايلكس 2024',
    author: 'شركة النجوم',
    avatar: 'https://i.pravatar.cc/150?img=4',
    description: 'أقوى سيارة للعمل والترحال',
    likes: 15000,
    comments: 289,
    shares: 112,
    isLiked: false,
    isBookmarked: false
  },
];

export function ShortVideosSection() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videosData, setVideosData] = useState(videos);
  const [showFullVideo, setShowFullVideo] = useState(false);

  const handleNext = () => {
    setCurrentVideo((prev) => (prev + 1) % videosData.length);
  };

  const handlePrev = () => {
    setCurrentVideo((prev) => (prev - 1 + videosData.length) % videosData.length);
  };

  const handleLike = () => {
    setVideosData((prev) =>
      prev.map((v, i) =>
        i === currentVideo
          ? {
              ...v,
              isLiked: !v.isLiked,
              likes: v.isLiked ? v.likes - 1 : v.likes + 1
            }
          : v
      )
    );
  };

  const handleBookmark = () => {
    setVideosData((prev) =>
      prev.map((v, i) =>
        i === currentVideo ? { ...v, isBookmarked: !v.isBookmarked } : v
      )
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const current = videosData[currentVideo];

  if (showFullVideo) {
    return (
      <section className="fixed inset-0 z-50 bg-black">
        {/* Video Player */}
        <div className="relative h-full flex items-center justify-center">
          <img
            src={current.thumbnail}
            alt={current.title}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
            <button
              onClick={() => setShowFullVideo(false)}
              className="p-2 bg-white/20 backdrop-blur rounded-full"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-white/20 backdrop-blur rounded-full"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur rounded-full"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur rounded-full"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Content */}
          <div className="absolute bottom-24 left-4 right-20">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={current.avatar}
                alt={current.author}
                className="w-12 h-12 rounded-full border-2 border-white"
              />
              <div>
                <h3 className="text-white font-bold text-lg">@{current.author}</h3>
                <p className="text-white/70 text-sm">{current.title}</p>
              </div>
            </div>
            <p className="text-white/80 text-sm mb-4">{current.description}</p>

            {/* Hashtags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs text-white">#سيارات</span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs text-white">#عراقي</span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs text-white">#سوك_بغداد</span>
            </div>
          </div>

          {/* Actions */}
          <div className="absolute bottom-24 right-4 flex flex-col gap-6">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center ${current.isLiked ? 'text-red-500' : 'text-white'}`}>
                <Heart className={`w-7 h-7 ${current.isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-white text-sm">{formatNumber(current.likes)}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                <MessageCircle className="w-7 h-7" />
              </div>
              <span className="text-white text-sm">{formatNumber(current.comments)}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                <Share2 className="w-7 h-7" />
              </div>
              <span className="text-white text-sm">{formatNumber(current.shares)}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleBookmark}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center ${current.isBookmarked ? 'text-amber-400' : 'text-white'}`}>
                <Bookmark className={`w-7 h-7 ${current.isBookmarked ? 'fill-current' : ''}`} />
              </div>
            </motion.button>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur">
            <div className="flex items-center justify-around py-4">
              <button className="flex flex-col items-center gap-1">
                <Home className="w-6 h-6 text-white" />
                <span className="text-white/60 text-xs">الرئيسية</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <Search className="w-6 h-6 text-white" />
                <span className="text-white/60 text-xs">استكشف</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-black" />
                </div>
              </button>
              <button className="flex flex-col items-center gap-1">
                <Bookmark className="w-6 h-6 text-white" />
                <span className="text-white/60 text-xs">المفضلة</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <User className="w-6 h-6 text-white" />
                <span className="text-white/60 text-xs">حسابي</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            فيديوهات قصيرة
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            اكتشف أحدث المنتجات والعروض بطريقة جذابة
          </p>
        </motion.div>

        {/* Videos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videosData.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setCurrentVideo(index);
                setShowFullVideo(true);
              }}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-white/30 backdrop-blur rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Stats */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-4 text-white text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {formatNumber(video.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {formatNumber(video.comments)}
                  </span>
                </div>
                <p className="text-white text-xs line-clamp-2">{video.title}</p>
              </div>

              {/* Author */}
              <div className="absolute top-4 left-4">
                <img
                  src={video.avatar}
                  alt={video.author}
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setCurrentVideo(0);
              setShowFullVideo(true);
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:shadow-xl transition-all"
          >
            <span>مشاهدة المزيد</span>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
