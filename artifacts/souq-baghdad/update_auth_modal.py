import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_auth_modal = """function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('بغداد');
  const playSound = useSound();

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message.includes('Invalid login credentials')
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : error.message.includes('Email not confirmed')
            ? 'يرجى تأكيد بريدك الإلكتروني أولاً'
            : 'حدث خطأ في تسجيل الدخول';
          setError(msg); playSound('error'); setLoading(false); return;
        }
        playSound('success');
        onClose();
      } else {
        if (phone.length < 10) { setError('رقم الهاتف غير صحيح'); playSound('error'); setLoading(false); return; }
        if (password.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); playSound('error'); setLoading(false); return; }
        const role = email.toLowerCase() === OWNER_EMAIL ? 'owner' : 'user';
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name, phone, city, role } }
        });
        if (error) {
          const msg = error.message.includes('already registered')
            ? 'هذا البريد الإلكتروني مسجّل مسبقاً'
            : error.message;
          setError(msg); playSound('error'); setLoading(false); return;
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInErr) { playSound('success'); onClose(); }
        else { setError('تم إنشاء الحساب. يرجى تسجيل الدخول.'); }
      }
    } catch {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl p-7 w-full max-w-md border border-gray-700 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
        <div className="text-center mb-6"><div className="text-5xl mb-3">{isLogin?'🔐':'✨'}</div>
          <h2 className="text-2xl font-bold text-white">{isLogin?'تسجيل الدخول':'إنشاء حساب'}</h2></div>
        <AnimatePresence>
          {error&&<motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400"/><span className="text-red-400 text-sm">{error}</span>
          </motion.div>}
        </AnimatePresence>
        {loading?<div className="flex flex-col items-center py-8"><Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3"/><p className="text-white">جاري التحميل...</p></div>:(
          <form onSubmit={submit} className="space-y-4">
            {!isLogin&&<div className="relative"><User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>}
            <div className="relative"><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
            {!isLogin&&<div className="grid grid-cols-2 gap-3">
              <div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07XXXXXXXXX" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
              <select value={city} onChange={e=>setCity(e.target.value)} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none">
                {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select>
            </div>}
            <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"/>
              <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
            <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl">
              {isLogin?'تسجيل الدخول':'إنشاء الحساب'}</motion.button>
          </form>
        )}
        <div className="mt-5 text-center">
          <button onClick={()=>{setIsLogin(!isLogin);setError('');}} className="text-gray-400 hover:text-amber-400 text-sm">
            {isLogin?'ليس لديك حساب؟ سجّل الآن':'لديك حساب؟ تسجيل الدخول'}</button></div>
      </motion.div>
    </motion.div>
  );
}"""

new_auth_modal = """function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('بغداد');
  const playSound = useSound();

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      const emailToUse = `${phone}@souqbaghdad.local`;
      if (phone.length < 10) { setError('رقم الهاتف غير صحيح'); playSound('error'); setLoading(false); return; }
      if (password.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); playSound('error'); setLoading(false); return; }
      
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (error) {
          const msg = error.message.includes('Invalid login credentials')
            ? 'رقم الهاتف أو كلمة المرور غير صحيحة'
            : 'حدث خطأ في تسجيل الدخول';
          setError(msg); playSound('error'); setLoading(false); return;
        }
        playSound('success');
        onClose();
      } else {
        const role = phone === '07712345678' ? 'owner' : 'user'; // Owner logic placeholder
        const { error } = await supabase.auth.signUp({
          email: emailToUse, password,
          options: { data: { full_name: name, phone, city, role } }
        });
        if (error) {
          const msg = error.message.includes('already registered')
            ? 'رقم الهاتف هذا مسجّل مسبقاً'
            : error.message;
          setError(msg); playSound('error'); setLoading(false); return;
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (!signInErr) { playSound('success'); onClose(); }
        else { setError('تم إنشاء الحساب. يرجى تسجيل الدخول.'); }
      }
    } catch {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl p-7 w-full max-w-md border border-gray-700 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
        <div className="text-center mb-6"><div className="text-5xl mb-3">{isLogin?'🔐':'✨'}</div>
          <h2 className="text-2xl font-bold text-white">{isLogin?'تسجيل الدخول':'إنشاء حساب'}</h2></div>
        <AnimatePresence>
          {error&&<motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400"/><span className="text-red-400 text-sm">{error}</span>
          </motion.div>}
        </AnimatePresence>
        {loading?<div className="flex flex-col items-center py-8"><Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3"/><p className="text-white">جاري التحميل...</p></div>:(
          <form onSubmit={submit} className="space-y-4">
            {!isLogin&&<div className="relative"><User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>}
            
            <div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="رقم الهاتف (مثل 07700000000)" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none" dir="ltr"/></div>
            
            {!isLogin&&<div className="grid grid-cols-1 gap-3">
              <select value={city} onChange={e=>setCity(e.target.value)} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none">
                {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select>
            </div>}
            <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"/>
              <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
            <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl">
              {isLogin?'تسجيل الدخول':'إنشاء الحساب'}</motion.button>
          </form>
        )}
        <div className="mt-5 text-center">
          <button onClick={()=>{setIsLogin(!isLogin);setError('');}} className="text-gray-400 hover:text-amber-400 text-sm">
            {isLogin?'ليس لديك حساب؟ سجّل الآن':'لديك حساب؟ تسجيل الدخول'}</button></div>
      </motion.div>
    </motion.div>
  );
}"""

if old_auth_modal in content:
    content = content.replace(old_auth_modal, new_auth_modal, 1)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ تم تعديل AuthModal ليكون برقم الهاتف وكلمة المرور فقط!")
else:
    print("❌ لم يتم العثور على الدالة بالشكل المتوقع!")
