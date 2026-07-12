// ===========================================
// مسؤولية هذا الملف:
// منصة الألعاب المدمجة في التطبيق.
// يعرض قائمة الألعاب المتاحة ويفتح اللعبة المختارة.
//
// لا يتصل بـ Supabase مباشرة.
//
// آمن للتعديل:
// نعم.
// ===========================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Users, Trophy, Star, Crown, ChevronLeft, Play, Info, Heart, Share2, Filter, TrendingUp } from 'lucide-react';

interface GamesPlatformProps {
  onBack: () => void;
}

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: 'card' | 'board' | 'puzzle' | 'arcade';
  players: string;
  isDemo: boolean;
  popularity: number;
  rating: number;
  playersCount: number;
}

const games: Game[] = [
  {
    id: '1',
    title: 'ورق طاولي',
    description: 'لعبة ورق كلاسيكية عراقية - العب مع أصدقائك!',
    thumbnail: 'https://images.unsplash.com/photo-1529701954973-1b4c2e2b6b9c?w=400',
    category: 'card',
    players: '2-4',
    isDemo: true,
    popularity: 95,
    rating: 4.8,
    playersCount: 1250,
  },
  {
    id: '2',
    title: 'داما',
    description: 'لعبة الداما التقليدية - تحدى أصدقاءك!',
    thumbnail: 'https://images.unsplash.com/photo-1606503153255-59d8b8b0f6c7?w=400',
    category: 'board',
    players: '2',
    isDemo: true,
    popularity: 88,
    rating: 4.6,
    playersCount: 890,
  },
  {
    id: '3',
    title: 'سودوكو',
    description: 'لغز الأرقام - اختبر ذكاءك!',
    thumbnail: 'https://images.unsplash.com/photo-1635776062360-af423602aff3?w=400',
    category: 'puzzle',
    players: '1',
    isDemo: true,
    popularity: 75,
    rating: 4.5,
    playersCount: 560,
  },
  {
    id: '4',
    title: 'ضارب الدجاج',
    description: 'اضرب الدجاج واجمع النقاط!',
    thumbnail: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
    category: 'arcade',
    players: '1',
    isDemo: false,
    popularity: 92,
    rating: 4.9,
    playersCount: 2340,
  },
  {
    id: '5',
    title: 'بورت - لعبه ورقي',
    description: 'لعبة البورت الشهيرة عراقياً',
    thumbnail: 'https://images.unsplash.com/photo-1529354163723-2c4f8b4b1b4c?w=400',
    category: 'card',
    players: '2-4',
    isDemo: true,
    popularity: 85,
    rating: 4.7,
    playersCount: 1100,
  },
  {
    id: '6',
    title: 'شطرنج',
    description: 'لعبة الشطرنج العريقة',
    thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d35b?w=400',
    category: 'board',
    players: '2',
    isDemo: true,
    popularity: 80,
    rating: 4.8,
    playersCount: 780,
  },
];

const categories = [
  { id: 'all', label: 'الكل', icon: Gamepad2 },
  { id: 'card', label: 'ورق', icon: Star },
  { id: 'board', label: 'طاولة', icon: Users },
  { id: 'puzzle', label: 'ألغاز', icon: Trophy },
  { id: 'arcade', label: 'أركيد', icon: Crown },
];

export function GamesPlatform({ onBack }: GamesPlatformProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredGames = activeCategory === 'all'
    ? games
    : games.filter(g => g.category === activeCategory);

  const toggleFavorite = (gameId: string) => {
    setFavorites(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const shareGame = (game: Game) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`هل جربت لعبة ${game.title} في سوك بغداد؟`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`, '_blank');
  };

  const categoryIcons: Record<string, string> = {
    card: '🃏',
    board: '🎲',
    puzzle: '🧩',
    arcade: '🎮',
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 pt-8 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-purple-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <button
            onClick={onBack}
            className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 mb-4"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎮
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">منصة الألعاب</h1>
            <p className="text-gray-300">استمتع بأفضل الألعاب الترفيهية!</p>

            {/* Demo Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full mt-4">
              <span className="text-amber-400 text-sm font-semibold">🔧 قسم تجريبي</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-400">{games.length}</p>
              <p className="text-gray-400 text-sm">الألعاب</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">6,820</p>
              <p className="text-gray-400 text-sm">لاعب نشط</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">15,400</p>
              <p className="text-gray-400 text-sm">مباراة اليوم</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">4.7</p>
              <p className="text-gray-400 text-sm">تقييم الموقع</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-4">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <cat.icon className="w-5 h-5" />
              <span>{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video">
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />

                {/* Demo Badge */}
                {game.isDemo && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 rounded-full text-xs font-bold text-black flex items-center gap-1">
                    🔧 تجريبي
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur rounded-full text-xl">
                  {categoryIcons[game.category]}
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedGame(game)}
                    className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Play className="w-8 h-8 text-black" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-bold text-lg">{game.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{game.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">{game.rating}</span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{game.players} لاعبين</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{game.playersCount} играч</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGame(game)}
                    className="flex-1 py-2 bg-amber-500 text-black font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>لعب</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavorite(game.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      favorites.includes(game.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(game.id) ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => shareGame(game)}
                    className="p-2 bg-gray-700 text-gray-400 hover:text-amber-400 rounded-xl"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Game Detail Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedGame(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-3xl max-w-lg w-full overflow-hidden border border-gray-700"
            >
              {/* Header */}
              <div className="relative">
                <img
                  src={selectedGame.thumbnail}
                  alt={selectedGame.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />

                {selectedGame.isDemo && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 rounded-full text-sm font-bold text-black">
                    🔧 تجريبي
                  </div>
                )}

                <button
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">{selectedGame.title}</h2>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-bold">{selectedGame.rating}</span>
                  </div>
                </div>

                <p className="text-gray-400 mb-6">{selectedGame.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                    <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-white font-bold">{selectedGame.players}</p>
                    <p className="text-gray-400 text-xs">عدد اللاعبين</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                    <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-white font-bold">{selectedGame.popularity}%</p>
                    <p className="text-gray-400 text-xs">الشعبية</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                    <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-white font-bold">{selectedGame.playersCount}</p>
                    <p className="text-gray-400 text-xs">ياللعبون</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Play className="w-6 h-6" />
                    <span>ابدأ اللعب</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="px-4 py-4 bg-gray-700 text-white rounded-xl"
                  >
                    <Info className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
