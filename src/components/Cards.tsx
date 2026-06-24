import { motion } from 'framer-motion';
import { LucideIcon, ChevronLeft } from 'lucide-react';

interface CategoryCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  count: string;
  onClick?: () => void;
}

export function CategoryCard({
  title,
  subtitle,
  icon: Icon,
  gradient,
  count,
  onClick
}: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      onClick={onClick}
      className="category-card cursor-pointer group"
    >
      <div className={`h-48 bg-gradient-to-br ${gradient} p-6 relative overflow-hidden`}>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Icon */}
        <motion.div
          whileHover={{ rotate: 10 }}
          className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4"
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">{title}</h3>
              <p className="text-white/80 text-sm">{subtitle}</p>
            </div>
            <div className="text-left">
              <span className="badge-iraqi">{count}+</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="absolute bottom-4 left-4">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ChevronLeft className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ProductCardProps {
  image: string;
  title: string;
  price: string;
  location: string;
  time: string;
  badge?: 'new' | 'hot' | 'premium';
  onClick?: () => void;
}

export function ProductCard({
  image,
  title,
  price,
  location,
  time,
  badge,
  onClick
}: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="premium-card cursor-pointer overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {badge && (
          <div className={`absolute top-3 left-3 ${
            badge === 'new' ? 'badge-new' : badge === 'hot' ? 'badge-hot' : 'badge-iraqi'
          }`}>
            {badge === 'new' && 'جديد'}
            {badge === 'hot' && '🔥 ساخن'}
            {badge === 'premium' && '⭐ مميز'}
          </div>
        )}
        {/* Video indicator */}
        <div className="absolute bottom-3 right-3 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Price */}
        <p className="text-2xl font-bold text-blue-900 dark:text-amber-400 mb-3">
          {price}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </span>
          <span>{time}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface VideoCardProps {
  thumbnail: string;
  title: string;
  author: string;
  avatar: string;
  views: string;
  likes: number;
  onClick?: () => void;
}

export function VideoCard({
  thumbnail,
  title,
  author,
  avatar,
  views,
  likes,
  onClick
}: VideoCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="premium-card cursor-pointer overflow-hidden"
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/30 backdrop-blur rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded text-xs text-white">
          0:45
        </div>

        {/* Author Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3">
            <img src={avatar} alt={author} className="w-10 h-10 rounded-full border-2 border-white" />
            <div>
              <h3 className="text-white font-bold text-sm line-clamp-2">{title}</h3>
              <p className="text-white/70 text-xs">{author}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="px-2 py-1 bg-black/50 rounded-full text-xs text-white flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            {views}
          </span>
        </div>
      </div>

      {/* Engagement */}
      <div className="p-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
        <span className="text-gray-500 text-sm">{author}</span>
        <div className="flex items-center gap-4 text-gray-400">
          <span className="flex items-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {likes}
          </span>
        </div>
      </div>
    </motion.div>
  );
}