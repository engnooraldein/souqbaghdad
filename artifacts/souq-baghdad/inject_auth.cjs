const fs = require('fs');

let newAuthModal = `
function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [step, setStep] = useState<'phone'|'login'|'signup'>('phone');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('بغداد');
  
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const playSound = useSound();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      if (identifier.length < 3) { setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني'); setLoading(false); return; }
      
      let phoneToCheck = identifier.trim();
      const isPhone = /^\\d+$/.test(phoneToCheck);
      
      if (isPhone || !phoneToCheck.includes('@')) {
         const { data, error } = await supabase.from('profiles').select('id').eq('phone', phoneToCheck).maybeSingle();
         if (data) {
           setStep('login');
         } else {
           if(!isPhone) {
             const { data: emailData } = await supabase.from('profiles').select('id').eq('email', phoneToCheck).maybeSingle();
             if (emailData) setStep('login');
             else setStep('signup');
           } else {
             setStep('signup');
           }
         }
      } else {
         const { data } = await supabase.from('profiles').select('id').eq('email', phoneToCheck.toLowerCase()).maybeSingle();
         if (data) setStep('login');
         else setStep('signup');
      }
    } catch(err) {
      setError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      let emailToUse = identifier.trim().toLowerCase();
      let phone = identifier.trim();
      
      if (!emailToUse.includes('@')) {
        const isPhone = /^\\d+$/.test(emailToUse);
        if (isPhone) {
          emailToUse = \`\${emailToUse}@souqbaghdad.com\`;
        } else {
          emailToUse = \`\${emailToUse.replace(/\\s+/g, '')}@souqbaghdad.com\`;
          phone = ''; // Username
        }
      } else {
        phone = ''; // Email
      }

      if (password.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); playSound('error'); setLoading(false); return; }
      
      if (step === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (error) {
          const msg = error.message.includes('Invalid login credentials')
            ? 'كلمة المرور غير صحيحة'
            : 'حدث خطأ في تسجيل الدخول';
          setError(msg); playSound('error'); setLoading(false); return;
        }
        playSound('success');
        onClose();
      } else if (step === 'signup') {
        const role = phone === '07701109692' ? 'owner' : 'user';
        const { error } = await supabase.auth.signUp({
          email: emailToUse, password,
          options: { data: { full_name: name, phone, city, role } }
        });
        if (error) {
          let msg = error.message;
          if (msg.includes('already registered') || msg === '{}') {
            msg = 'هذا الحساب مسجّل مسبقاً، يرجى تسجيل الدخول';
            setStep('login');
          }
          setError(msg); playSound('error'); setLoading(false); return;
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (!signInErr) { playSound('success'); onClose(); }
        else { setError('تم إنشاء الحساب. يرجى تسجيل الدخول.'); setStep('login'); }
      }
    } catch {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  const submitRecovery = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      if (recoveryPhone.length < 10) { setError('يرجى إدخال رقم هاتف صحيح'); playSound('error'); setLoading(false); return; }
      const { error } = await supabase.from('password_recovery_requests').insert([{ phone: recoveryPhone }]);
      if (error) throw error;
      setRecoverySent(true);
      playSound('success');
    } catch {
      setError('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
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
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{step === 'login' ? '🔐' : step === 'signup' ? '✨' : '📱'}</div>
          <h2 className="text-2xl font-bold text-white">
            {isRecovery ? 'استعادة الحساب' : step === 'phone' ? 'الدخول السريع' : step === 'login' ? 'مرحباً بعودتك' : 'حساب جديد'}
          </h2>
          {!isRecovery && step !== 'phone' && (
             <p className="text-gray-400 text-sm mt-1">{identifier}</p>
          )}
        </div>
        <AnimatePresence>
          {error&&<motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0"/><span className="text-red-400 text-sm">{error}</span>
          </motion.div>}
        </AnimatePresence>

        {isRecovery ? (
          recoverySent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-400" /></div>
              <p className="text-white text-lg font-bold">تم إرسال طلبك بنجاح</p>
              <p className="text-gray-400 text-sm leading-relaxed">راح نرسلك تفاصيل الدخول على واتساب بعد التدقيق.</p>
              <button onClick={() => { setIsRecovery(false); setRecoverySent(false); }} className="w-full mt-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700">العودة لتسجيل الدخول</button>
            </div>
          ) : (
            <form onSubmit={submitRecovery} className="space-y-4">
              <p className="text-gray-300 text-sm mb-4 text-center">أدخل رقم هاتفك لاستعادة حسابك</p>
              <div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input type="tel" value={recoveryPhone} onChange={e=>setRecoveryPhone(e.target.value)} placeholder="رقم الهاتف" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none" dir="rtl"/></div>
              <motion.button type="submit" disabled={loading} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl">{loading ? 'جاري الإرسال...' : 'استعادة كلمة المرور'}</motion.button>
              <button type="button" onClick={() => setIsRecovery(false)} className="w-full text-center text-gray-400 hover:text-white text-sm mt-2">العودة</button>
            </form>
          )
        ) : loading?<div className="flex flex-col items-center py-8"><Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3"/><p className="text-white">جاري التحميل...</p></div>:(
          step === 'phone' ? (
             <form onSubmit={handlePhoneSubmit} className="space-y-4">
               <div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                 <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="رقم الهاتف أو البريد الإلكتروني" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-4 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-lg" dir="rtl"/>
               </div>
               <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-lg mt-2 shadow-lg shadow-amber-500/20">متابعة</motion.button>
             </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {step === 'signup' && <div className="relative"><User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>}
              
              {step === 'signup' && <div className="grid grid-cols-1 gap-3">
                <select value={city} onChange={e=>setCity(e.target.value)} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none">
                  {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select>
              </div>}
              
              <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" required autoFocus className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
              
              <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20">
                {step === 'login' ? 'تسجيل الدخول' : 'تأكيد وإنشاء الحساب'}
              </motion.button>
              
              <div className="mt-4 flex flex-col items-center gap-3">
                 {step === 'login' && <button type="button" onClick={() => {setIsRecovery(true); setError('');}} className="text-amber-400 hover:text-amber-300 text-sm">نسيت كلمة المرور؟</button>}
                 <button type="button" onClick={() => {setStep('phone'); setError('');}} className="text-gray-400 hover:text-white text-sm">تغيير رقم الهاتف</button>
              </div>
            </form>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
`;

const content = fs.readFileSync('src/App.tsx', 'utf8');
const startStr = 'function AuthModal({ onClose, onLogin }';
const endStr = 'function InfoDocsModal(';

const start = content.indexOf(startStr);
const end = content.indexOf(endStr);

if (start > -1 && end > -1) {
  // We need to slice accurately.
  // end is the index of 'function InfoDocsModal('
  // There is a comment before it:
  // // ─────────────────────────────────────────────
  // // Info & Legal Docs Modal
  // // ─────────────────────────────────────────────
  const commentStart = content.lastIndexOf('// ─────────────────────────────────────────────', end - 10);
  
  const newContent = content.slice(0, start) + newAuthModal + '\\n\\n' + content.slice(commentStart);
  fs.writeFileSync('src/App.tsx', newContent);
  console.log('Replaced successfully.');
} else {
  console.log('Could not find bounds');
}
