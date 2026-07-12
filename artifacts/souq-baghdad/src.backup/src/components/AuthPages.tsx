import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check, ArrowLeft, Facebook, Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPagesProps {
  onBack: () => void;
}

export function AuthPages({ onBack }: AuthPagesProps) {
  const { login, register, demoLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(loginEmail.trim(), loginPassword);
      if (result.success) {
        setSuccess('تم تسجيل الدخول بنجاح!');
        setTimeout(() => onBack(), 1000);
      } else {
        setError(result.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (registerPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(registerName.trim(), registerEmail.trim(), registerPassword, registerPhone.trim());
      if (result.success) {
        setSuccess('تم إنشاء الحساب بنجاح!');
        setTimeout(() => onBack(), 1000);
      } else {
        setError(result.message || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } catch {
      setError('حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    setSuccess('تم الدخول كمسؤول!');
    setTimeout(() => onBack(), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl mb-4"
            >
              🔐
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'مرحباً بعودتك!' : 'انضم إلينا اليوم'}
            </p>
          </div>

          {/* Demo Badge */}
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 mb-6 text-center">
            <span className="text-amber-400 text-sm font-semibold">🔧 وضع تجريبي</span>
            <p className="text-amber-300/70 text-xs mt-1">استخدم "demo123" ككلمة مرور</p>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center gap-2"
              >
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="أحمد محمد"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="07701234567"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    required
                    minLength={6}
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                {isLoading ? 'جاري التحميل...' : 'إنشاء حساب'}
              </motion.button>
            </form>
          )}

          {/* Social Login */}
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-400 text-sm">أو</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-sm">فيسبوك</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 py-3 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Chrome className="w-5 h-5" />
                <span className="text-sm">جوجل</span>
              </motion.button>
            </div>
          </div>

          {/* Demo Login Button */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <motion.button
              onClick={handleDemoLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              🔧 دخول كمسؤول (تجريبي)
            </motion.button>
          </div>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-gray-400 hover:text-amber-400 text-sm transition-colors"
            >
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ تسجيل الدخول'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}