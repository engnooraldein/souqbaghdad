// ===========================================
// مسؤولية هذا الملف:
// لعبة "ضارب الدجاج" المدمجة في التطبيق.
//
// لا يتصل بـ Supabase.
// منطق اللعبة مكتوب بالكامل داخل هذا الملف.
//
// انتبه:
// اللعبة تستخدم Canvas / Animation. قد تستهلك الذاكرة.
// تأكد من إيقاف الـ Animation عند إغلاق اللعبة (cleanup في useEffect).
//
// آمن للتعديل:
// نعم.
// ===========================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Heart, Clock, Star, Play, Pause, RotateCcw, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Home, Target, Zap, Award, Skull, Crown,
  ArrowLeft, ArrowRight, Swords, Flame, Shield, Bomb
} from 'lucide-react';

interface GameState {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  showStart: boolean;
  chickens: Chicken[];
  powerUps: PowerUp[];
  combo: number;
  lastHitTime: number;
}

interface Chicken {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  type: 'normal' | 'golden' | 'angry' | 'boss';
  health: number;
  points: number;
  spawnTime: number;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: 'shield' | 'freeze' | 'multishot' | 'bomb';
  spawnTime: number;
}

interface LevelConfig {
  id: number;
  name: string;
  chickensCount: number;
  timeLimit: number;
  speedMultiplier: number;
  spawnRate: number;
  bossEvery: number;
  chickenTypes: {
    normal: number;
    golden: number;
    angry: number;
    boss: number;
  };
}

const levels: LevelConfig[] = [
  { id: 1, name: 'المستوى الأول -门槛', chickensCount: 10, timeLimit: 60, speedMultiplier: 1, spawnRate: 2000, bossEvery: 0, chickenTypes: { normal: 70, golden: 20, angry: 10, boss: 0 } },
  { id: 2, name: 'المستوى الثاني - طقط', chickensCount: 15, timeLimit: 55, speedMultiplier: 1.2, spawnRate: 1800, bossEvery: 0, chickenTypes: { normal: 60, golden: 25, angry: 15, boss: 0 } },
  { id: 3, name: 'المستوى الثالث - صعب', chickensCount: 20, timeLimit: 50, speedMultiplier: 1.4, spawnRate: 1500, bossEvery: 10, chickenTypes: { normal: 50, golden: 30, angry: 15, boss: 5 } },
  { id: 4, name: 'المستوى الرابع - التحدي', chickensCount: 25, timeLimit: 45, speedMultiplier: 1.6, spawnRate: 1200, bossEvery: 8, chickenTypes: { normal: 40, golden: 30, angry: 20, boss: 10 } },
  { id: 5, name: 'المستوى الخامس - سوخ', chickensCount: 30, timeLimit: 40, speedMultiplier: 1.8, spawnRate: 1000, bossEvery: 6, chickenTypes: { normal: 30, golden: 30, angry: 25, boss: 15 } },
];

const AudioContext = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;

export function ChickenGame() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    timeLeft: 60,
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    showStart: true,
    chickens: [],
    powerUps: [],
    combo: 0,
    lastHitTime: 0,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showGameComplete, setShowGameComplete] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; text: string }>>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chickenIdRef = useRef(0);
  const powerUpIdRef = useRef(0);
  const particleIdRef = useRef(0);

  // Load saved data
  useEffect(() => {
    const savedHighScore = localStorage.getItem('souqBaghdad_chickenHighScore');
    if (savedHighScore) {
      setGameState(prev => ({ ...prev, highScore: parseInt(savedHighScore) }));
    }
  }, []);

  // Initialize Audio Context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current && AudioContext) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  // Play sound function
  const playSound = useCallback((type: 'hit' | 'golden' | 'powerup' | 'lose' | 'levelup' | 'combo' | 'miss') => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const sounds: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
      hit: { freq: 400, duration: 0.1, type: 'square' },
      golden: { freq: 800, duration: 0.3, type: 'sine' },
      powerup: { freq: 600, duration: 0.2, type: 'triangle' },
      lose: { freq: 200, duration: 0.5, type: 'sawtooth' },
      levelup: { freq: 1000, duration: 0.5, type: 'sine' },
      combo: { freq: 500, duration: 0.15, type: 'square' },
      miss: { freq: 150, duration: 0.3, type: 'triangle' },
    };

    const sound = sounds[type] || sounds.hit;

    oscillator.frequency.setValueAtTime(sound.freq, ctx.currentTime);
    oscillator.type = sound.type;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
  }, [isMuted]);

  // Create particle effect
  const createParticles = useCallback((x: number, y: number, color: string, text?: string) => {
    const newParticle = {
      id: particleIdRef.current++,
      x,
      y,
      color,
      text: text || '',
    };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  }, []);

  // Spawn chicken
  const spawnChicken = useCallback(() => {
    if (!gameAreaRef.current) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const currentLevel = levels[gameState.level - 1] || levels[0];

    // Determine chicken type based on probability
    const rand = Math.random() * 100;
    let type: 'normal' | 'golden' | 'angry' | 'boss' = 'normal';
    let cumulative = 0;

    for (const [chickenType, chance] of Object.entries(currentLevel.chickenTypes)) {
      cumulative += chance;
      if (rand <= cumulative) {
        type = chickenType as any;
        break;
      }
    }

    // Boss appears every few chickens
    const totalSpawned = gameState.chickens.length;
    if (currentLevel.bossEvery > 0 && totalSpawned > 0 && totalSpawned % currentLevel.bossEvery === 0) {
      type = 'boss';
    }

    const chicken: Chicken = {
      id: chickenIdRef.current++,
      x: Math.random() * (rect.width - 80) + 40,
      y: -100,
      speed: (2 + Math.random() * 2) * currentLevel.speedMultiplier * (type === 'angry' ? 1.5 : type === 'boss' ? 0.5 : 1),
      size: type === 'boss' ? 120 : type === 'golden' ? 70 : 60,
      type,
      health: type === 'boss' ? 5 : type === 'angry' ? 2 : 1,
      points: type === 'boss' ? 500 : type === 'golden' ? 100 : type === 'angry' ? 50 : 10,
      spawnTime: Date.now(),
    };

    setGameState(prev => ({
      ...prev,
      chickens: [...prev.chickens, chicken],
    }));
  }, [gameState.level, gameState.chickens.length]);

  // Spawn power-up
  const spawnPowerUp = useCallback(() => {
    if (!gameAreaRef.current || Math.random() > 0.3) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const types: PowerUp['type'][] = ['shield', 'freeze', 'multishot', 'bomb'];

    const powerUp: PowerUp = {
      id: powerUpIdRef.current++,
      x: Math.random() * (rect.width - 60) + 30,
      y: -50,
      type: types[Math.floor(Math.random() * types.length)],
      spawnTime: Date.now(),
    };

    setGameState(prev => ({
      ...prev,
      powerUps: [...prev.powerUps, powerUp],
    }));
  }, []);

  // Handle chicken click
  const handleChickenClick = useCallback((chicken: Chicken, e: React.MouseEvent) => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Play hit sound
    playSound(chicken.type === 'golden' ? 'golden' : 'hit');

    // Create particles
    const colors: Record<string, string> = {
      normal: '#fbbf24',
      golden: '#ffd700',
      angry: '#ef4444',
      boss: '#8b5cf6',
    };
    createParticles(x, y, colors[chicken.type], `+${chicken.points}`);

    // Update combo
    const now = Date.now();
    const isCombo = now - gameState.lastHitTime < 1000;
    const newCombo = isCombo ? gameState.combo + 1 : 1;

    // Calculate score with combo bonus
    const comboBonus = Math.min(newCombo, 10);
    const points = chicken.points * comboBonus;

    if (newCombo >= 3) {
      playSound('combo');
    }

    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      combo: newCombo,
      lastHitTime: now,
      chickens: prev.chickens.map(c =>
        c.id === chicken.id
          ? { ...c, health: c.health - 1 }
          : c
      ).filter(c => c.health > 0),
    }));
  }, [gameState.isPlaying, gameState.isPaused, gameState.combo, gameState.lastHitTime, playSound, createParticles]);

  // Handle power-up click
  const handlePowerUpClick = useCallback((powerUp: PowerUp, e: React.MouseEvent) => {
    if (!gameState.isPlaying) return;

    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    playSound('powerup');

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Apply power-up effect
    switch (powerUp.type) {
      case 'shield':
        setGameState(prev => ({ ...prev, lives: Math.min(prev.lives + 1, 5) }));
        createParticles(x, y, '#3b82f6', '+1 ❤️');
        break;
      case 'freeze':
        setGameState(prev => ({
          ...prev,
          chickens: prev.chickens.map(c => ({ ...c, speed: c.speed * 0.3 })),
        }));
        createParticles(x, y, '#06b6d4', '❄️ تجميد!');
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            chickens: prev.chickens.map(c => ({ ...c, speed: c.speed / 0.3 })),
          }));
        }, 3000);
        break;
      case 'multishot':
        // Clear half the chickens
        setGameState(prev => {
          const toRemove = prev.chickens.slice(0, Math.floor(prev.chickens.length / 2));
          const points = toRemove.reduce((sum, c) => sum + c.points, 0);
          createParticles(x, y, '#a855f7', `+${points}`);
          return {
            ...prev,
            score: prev.score + points,
            chickens: prev.chickens.slice(Math.floor(prev.chickens.length / 2)),
          };
        });
        createParticles(x, y, '#a855f7', '💥 قنبلة!');
        break;
      case 'bomb':
        // Clear all chickens
        setGameState(prev => {
          const points = prev.chickens.reduce((sum, c) => sum + c.points, 0);
          createParticles(x, y, '#ef4444', `+${points}`);
          return {
            ...prev,
            score: prev.score + points,
            chickens: [],
          };
        });
        createParticles(x, y, '#ef4444', '💥 انفجار!');
        break;
    }

    setGameState(prev => ({
      ...prev,
      powerUps: prev.powerUps.filter(p => p.id !== powerUp.id),
    }));
  }, [gameState.isPlaying, playSound, createParticles]);

  // Start game
  const startGame = useCallback(() => {
    initAudio();
    setGameState(prev => ({
      ...prev,
      showStart: false,
      isPlaying: true,
      gameOver: false,
      score: 0,
      lives: 3,
      level: 1,
      timeLeft: levels[0].timeLimit,
      chickens: [],
      powerUps: [],
      combo: 0,
    }));
  }, [initAudio]);

  // Start level
  const startLevel = useCallback(() => {
    const currentLevel = levels[gameState.level - 1] || levels[0];
    setGameState(prev => ({
      ...prev,
      timeLeft: currentLevel.timeLimit,
      chickens: [],
      powerUps: [],
      isPlaying: true,
      isPaused: false,
    }));
  }, [gameState.level]);

  // Update chickens position
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const updatedChickens = prev.chickens.map(c => ({
          ...c,
          y: c.y + c.speed,
        }));

        // Check if any chicken reached bottom
        const escapedChickens = updatedChickens.filter(c => c.y > (gameAreaRef.current?.clientHeight || 600));

        if (escapedChickens.length > 0) {
          playSound('miss');
          const newLives = prev.lives - escapedChickens.length;

          if (newLives <= 0) {
            // Game Over
            if (prev.score > prev.highScore) {
              localStorage.setItem('souqBaghdad_chickenHighScore', prev.score.toString());
            }
            return {
              ...prev,
              lives: 0,
              isPlaying: false,
              gameOver: true,
              chickens: updatedChickens.filter(c => c.y <= (gameAreaRef.current?.clientHeight || 600)),
            };
          }

          return {
            ...prev,
            lives: newLives,
            chickens: updatedChickens.filter(c => c.y <= (gameAreaRef.current?.clientHeight || 600)),
            combo: 0,
          };
        }

        return { ...prev, chickens: updatedChickens };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.isPaused, playSound]);

  // Spawn chickens
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const currentLevel = levels[gameState.level - 1] || levels[0];

    spawnIntervalRef.current = setInterval(() => {
      if (gameState.chickens.length < currentLevel.chickensCount) {
        spawnChicken();
        spawnPowerUp();
      }
    }, currentLevel.spawnRate);

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.level, gameState.chickens.length, spawnChicken, spawnPowerUp]);

  // Timer
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    timerIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          // Level complete
          if (prev.level >= levels.length) {
            // Game complete
            if (prev.score > prev.highScore) {
              localStorage.setItem('souqBaghdad_chickenHighScore', prev.score.toString());
            }
            return { ...prev, timeLeft: 0, isPlaying: false, gameOver: true };
          }

          playSound('levelup');
          return { ...prev, timeLeft: 0, isPlaying: false, chickens: [] };
        }

        // Check if all required chickens spawned and cleared
        const currentLevel = levels[prev.level - 1];
        if (prev.chickens.length === 0 && prev.timeLeft < currentLevel.timeLimit - 5) {
          // Level complete - no more chickens and time still left
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        }

        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.level, playSound]);

  // Check level completion
  useEffect(() => {
    if (!gameState.isPlaying && gameState.timeLeft === 0 && !gameState.gameOver) {
      if (gameState.level < levels.length) {
        setShowLevelComplete(true);
      } else {
        setShowGameComplete(true);
      }
    }
  }, [gameState.timeLeft, gameState.isPlaying, gameState.level, gameState.gameOver]);

  // Reset game
  const resetGame = useCallback(() => {
    setShowLevelComplete(false);
    setShowGameComplete(false);
    setGameState(prev => ({
      ...prev,
      showStart: true,
      gameOver: false,
      isPlaying: false,
      score: 0,
      lives: 3,
      level: 1,
      timeLeft: 60,
      chickens: [],
      powerUps: [],
      combo: 0,
    }));
  }, []);

  // Retry level
  const retryLevel = useCallback(() => {
    setShowLevelComplete(false);
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      lives: 3,
      timeLeft: levels[prev.level - 1].timeLimit,
      chickens: [],
      powerUps: [],
      combo: 0,
    }));
  }, []);

  // Next level
  const nextLevel = useCallback(() => {
    setShowLevelComplete(false);
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      isPlaying: true,
      timeLeft: levels[prev.level].timeLimit,
      chickens: [],
      powerUps: [],
      combo: 0,
    }));
  }, []);

  // Render chicken
  const renderChicken = (chicken: Chicken) => {
    const colors: Record<string, { bg: string; border: string }> = {
      normal: { bg: '#fbbf24', border: '#f59e0b' },
      golden: { bg: '#ffd700', border: '#fcd34d' },
      angry: { bg: '#ef4444', border: '#dc2626' },
      boss: { bg: '#8b5cf6', border: '#7c3aed' },
    };

    const emoji: Record<string, string> = {
      normal: '🐔',
      golden: '🌟🐔',
      angry: '😡🐔',
      boss: '👑🐓',
    };

    return (
      <motion.div
        key={chicken.id}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => handleChickenClick(chicken, e)}
        className="absolute cursor-pointer select-none"
        style={{
          left: chicken.x - chicken.size / 2,
          top: chicken.y,
          width: chicken.size,
          height: chicken.size,
        }}
      >
        <div
          className="w-full h-full rounded-2xl flex items-center justify-center font-bold text-2xl md:text-4xl shadow-lg border-4 transition-transform"
          style={{
            backgroundColor: colors[chicken.type].bg,
            borderColor: colors[chicken.type].border,
            boxShadow: `0 4px 20px ${colors[chicken.type].bg}80`,
          }}
        >
          {emoji[chicken.type]}
        </div>
        {chicken.health > 1 && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 rounded-full text-white text-xs">
            {chicken.health} ❤️
          </div>
        )}
      </motion.div>
    );
  };

  // Render power-up
  const renderPowerUp = (powerUp: PowerUp) => {
    const icons: Record<string, { icon: any; color: string }> = {
      shield: { icon: Shield, color: '#3b82f6' },
      freeze: { icon: Flame, color: '#06b6d4' },
      multishot: { icon: Target, color: '#a855f7' },
      bomb: { icon: Bomb, color: '#ef4444' },
    };

    const { icon: Icon, color } = icons[powerUp.type];

    return (
      <motion.div
        key={powerUp.id}
        animate={{ y: [powerUp.y, powerUp.y + 200], rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, rotate: { repeat: Infinity, duration: 2 } }}
        onClick={(e) => handlePowerUpClick(powerUp, e)}
        className="absolute cursor-pointer"
        style={{
          left: powerUp.x - 30,
          top: powerUp.y,
          width: 60,
          height: 60,
        }}
      >
        <div
          className="w-full h-full rounded-full flex items-center justify-center shadow-lg border-4 animate-pulse"
          style={{ backgroundColor: color, borderColor: 'white' }}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
      </motion.div>
    );
  };

  // Start screen
  if (gameState.showStart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/20"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl md:text-8xl mb-4"
          >
            🐔💥
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            ضارب الدجاج
          </h1>
          <p className="text-amber-400 text-lg mb-6">سوك بغداد - لعبة ترفيهية</p>

          <div className="space-y-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
              <span className="text-white">🏆 أعلى نتيجة</span>
              <span className="text-amber-400 font-bold text-xl">{gameState.highScore}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-gray-300 text-sm">المستويات</p>
                <p className="text-white font-bold">{levels.length}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-gray-300 text-sm">أنواع الدجاج</p>
                <p className="text-white font-bold">4 🐔</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6" />
              <span>ابدأ اللعب</span>
            </motion.button>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <div className="mt-6 text-gray-400 text-sm">
            <p>💡 اضغط على الدجاج قبل ما يوصل للأسفل!</p>
            <p>🌟 الدجاج الذهبي = نقاط أكثر</p>
            <p>👑 الدجاج الكبير = يحتاج عدة ضربات</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Level complete modal
  if (showLevelComplete) {
    return (
      <div className="min-h-screen bg-black/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center border border-amber-500/50"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-2">
            أحسنت! أنهيت المستوى {gameState.level}
          </h2>

          <div className="my-6">
            <p className="text-gray-400">النقاط</p>
            <p className="text-4xl font-bold text-amber-400">{gameState.score}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400">الرقم القياسي: {gameState.highScore}</span>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextLevel}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>المستوى التالي</span>
            </motion.button>

            <button
              onClick={resetGame}
              className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"
            >
              العودة للقائمة
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Game complete modal
  if (showGameComplete) {
    return (
      <div className="min-h-screen bg-black/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center border border-amber-500/50"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            👑🏆👑
          </motion.div>

          <h2 className="text-3xl font-bold text-amber-400 mb-2">
            مبروك! أنهيت اللعبة!
          </h2>
          <p className="text-gray-400 mb-6">أنت محترف ضارب الدجاج!</p>

          <div className="bg-white/10 rounded-xl p-6 mb-6">
            <p className="text-gray-400">النتيجة النهائية</p>
            <p className="text-5xl font-bold text-amber-400">{gameState.score}</p>
          </div>

          {gameState.score >= gameState.highScore && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-amber-500/20 rounded-xl p-4 mb-6"
            >
              <p className="text-amber-400 font-bold">🎊 رقم قياسي جديد! 🎊</p>
            </motion.div>
          )}

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl"
            >
              العب مرة أخرى
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Game over modal
  if (gameState.gameOver) {
    return (
      <div className="min-h-screen bg-black/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center border border-red-500/50"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
            className="text-6xl mb-4"
          >
            💀
          </motion.div>

          <h2 className="text-3xl font-bold text-red-500 mb-2">
            انتهت اللعبة!
          </h2>

          <div className="my-6">
            <p className="text-gray-400">النقاط</p>
            <p className="text-4xl font-bold text-white">{gameState.score}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400">الرقم القياسي: {gameState.highScore}</span>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>العب مرة أخرى</span>
            </motion.button>

            <button
              onClick={resetGame}
              className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"
            >
              العودة للقائمة
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Pause modal
  if (gameState.isPaused) {
    return (
      <div className="min-h-screen bg-black/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center border border-white/20"
        >
          <div className="text-6xl mb-4">⏸️</div>
          <h2 className="text-2xl font-bold text-white mb-6">اللعبة متوقفة</h2>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl"
            >
              استمرار
            </motion.button>

            <button
              onClick={resetGame}
              className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"
            >
              إنهاء اللعبة
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={resetGame}
            className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20"
          >
            <Home className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs">المستوى</p>
              <p className="text-white font-bold">{gameState.level}</p>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-xs">النقاط</p>
              <p className="text-amber-400 font-bold text-xl">{gameState.score}</p>
            </div>

            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-5 h-5 ${i < gameState.lives ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                />
              ))}
            </div>

            <div className="text-center">
              <Clock className="w-5 h-5 text-white mx-auto mb-1" />
              <p className={`font-bold ${gameState.timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                {gameState.timeLeft}s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gameState.combo >= 3 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="bg-amber-500 px-3 py-1 rounded-full text-black font-bold text-sm"
              >
                {gameState.combo}x كومبو!
              </motion.div>
            )}

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setGameState(prev => ({ ...prev, isPaused: true }))}
              className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20"
            >
              <Pause className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Level info */}
      <div className="bg-gray-900/50 py-2 text-center">
        <p className="text-blue-200 text-sm">
          {levels[gameState.level - 1]?.name} - اضرب {levels[gameState.level - 1]?.chickensCount} دجاجة!
        </p>
      </div>

      {/* Game area */}
      <div className="flex-1 p-4">
        <div
          ref={gameAreaRef}
          className="max-w-4xl mx-auto h-[500px] md:h-[600px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-4 border-gray-700 relative overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-20 h-20 bg-amber-500 rounded-full blur-2xl" />
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-gray-800 rounded-full blur-2xl" />
          </div>

          {/* Chickens */}
          <AnimatePresence>
            {gameState.chickens.map(renderChicken)}
          </AnimatePresence>

          {/* Power-ups */}
          <AnimatePresence>
            {gameState.powerUps.map(renderPowerUp)}
          </AnimatePresence>

          {/* Particles */}
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 1, scale: 1, y: particle.y }}
              animate={{ opacity: 0, scale: 1.5, y: particle.y - 100 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none text-2xl font-bold"
              style={{ left: particle.x, top: particle.y }}
            >
              <span style={{ color: particle.color }}>{particle.text}</span>
            </motion.div>
          ))}

          {/* Instructions */}
          {gameState.chickens.length === 0 && gameState.isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400 text-lg">اضغط على الدجاج! 🐔</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-lg">🐔</span>
              <span className="text-gray-400">10</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center text-lg">🌟🐔</span>
              <span className="text-gray-400">100</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-lg">😡🐔</span>
              <span className="text-gray-400">50</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-lg">👑🐓</span>
              <span className="text-gray-400">500</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"><Shield className="w-4 h-4" /></span>
              <span className="text-gray-400">حياة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"><Bomb className="w-4 h-4" /></span>
              <span className="text-gray-400">انفجار</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
