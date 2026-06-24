with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = ''.join(lines)

# ─── 1. Replace AuthModal submit (unique - only one submit in AuthModal) ─────────
old_submit = """  const submit = (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    setTimeout(()=>{
      if(password.length<4){setError('كلمة المرور 4 أحرف على الأقل');playSound('error');setLoading(false);return;}
      if(!isLogin&&phone.length<10){setError('رقم الهاتف غير صحيح');playSound('error');setLoading(false);return;}
      if(isBanned(email)){setError('هذا الحساب موقوف. تواصل مع الإدارة.');playSound('error');setLoading(false);return;}
      const role = email.toLowerCase()===OWNER_EMAIL?'owner':email.toLowerCase().includes('admin')?'admin':'user';
      const u:User = {
        id:'u-'+btoa(email).replace(/[^a-zA-Z0-9]/g,'').slice(0,12),
        name:isLogin?(email.split('@')[0]||'مستخدم'):name,
        email, phone:isLogin?'07700000000':phone, role,
        avatar: DEFAULT_AVATAR, cover: DEFAULT_COVER,
        bio:'', location:city, rating:4.8,
        isVerified:role!=='user', joinedDate:isLogin?'منذ فترة':'الآن',
        stats:{ads:0,favorites:0,views:0},
        sellerStats:{totalAds:0,sold:0,responseRate:0,avgResponseTime:'-'},
      };
      // Preserve existing avatar/cover if user re-logs in
      try {
        const stored:StoredUser[] = JSON.parse(localStorage.getItem('souqUsers')||'[]');
        const prev = stored.find(s=>s.id===u.id);
        if(prev?.avatar && prev.avatar !== DEFAULT_AVATAR) u.avatar = prev.avatar;
      } catch {}
      localStorage.setItem('souqUser', JSON.stringify(u));
      setTimeout(()=>{onLogin(u);onClose();},600);
      setLoading(false);
    },1000);
  };"""

new_submit = """  const submit = async (e:React.FormEvent) => {
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
  };"""

assert old_submit in content, "ERROR: AuthModal submit not found!"
content = content.replace(old_submit, new_submit, 1)
print("OK: AuthModal submit replaced")

# ─── 2. Insert loadUserFromSupabase + onAuthStateChange BEFORE line 3495 ────────
# The target is the playSound line inside the main App component (line 3495)
# Use unique surrounding context for the App's playSound line
old_activelightbox_and_sound = """  const [activeLightbox, setActiveLightbox] = useState<{ src: string; title: string } | null>(null);
  const playSound = useSound();

  // Default demo ads to show for all users"""

new_activelightbox_and_sound = """  const [activeLightbox, setActiveLightbox] = useState<{ src: string; title: string } | null>(null);
  const playSound = useSound();

  // ── دالة تحميل بيانات المستخدم من Supabase ──────────────────────────
  const loadUserFromSupabase = async (authUser: any) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    const role = authUser.email === OWNER_EMAIL ? 'owner'
      : (profile?.role || authUser.user_metadata?.role || 'user');
    const u: User = {
      id: authUser.id,
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'مستخدم',
      email: authUser.email || '',
      phone: profile?.phone || authUser.user_metadata?.phone || '',
      role,
      avatar: profile?.avatar_url || DEFAULT_AVATAR,
      cover: DEFAULT_COVER,
      bio: '',
      location: profile?.city || authUser.user_metadata?.city || 'بغداد',
      rating: 4.8,
      isVerified: role !== 'user',
      joinedDate: profile?.created_at || 'الآن',
      stats: { ads: profile?.ads_count || 0, favorites: profile?.favorites_count || 0, views: profile?.views_count || 0 },
      sellerStats: { totalAds: 0, sold: 0, responseRate: 100, avgResponseTime: 'دقائق' }
    };
    setUser(u);
    localStorage.setItem('souqUser', JSON.stringify(u));
  };

  // ── استعادة الجلسة ومراقبة Auth ────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserFromSupabase(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserFromSupabase(session.user);
      else { setUser(null); localStorage.removeItem('souqUser'); }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default demo ads to show for all users"""

assert old_activelightbox_and_sound in content, "ERROR: activeLightbox context not found!"
content = content.replace(old_activelightbox_and_sound, new_activelightbox_and_sound, 1)
print("OK: loadUserFromSupabase + onAuthStateChange added")

# ─── 3. Update handleLogout ────────────────────────────────────────────────────
old_logout = "  const handleLogout = ()=>{localStorage.removeItem('souqUser');setUser(null);setView('home');showToast('تم تسجيل الخروج','info');};"
new_logout = """  const handleLogout = async ()=>{
    await supabase.auth.signOut();
    localStorage.removeItem('souqUser');
    setUser(null);
    setView('home');
    showToast('تم تسجيل الخروج', 'info');
  };"""

assert old_logout in content, "ERROR: handleLogout not found!"
content = content.replace(old_logout, new_logout, 1)
print("OK: handleLogout updated with signOut")

# ─── 4. Update handleUpdateUser ───────────────────────────────────────────────
old_update = "  const handleUpdateUser = (u:User)=>{setUser(u);localStorage.setItem('souqUser',JSON.stringify(u));saveStoredUser(u,allAds.filter(a=>a.postedBy===u.id).length);showToast('تم حفظ الملف الشخصي ✅','success');};"
new_update = """  const handleUpdateUser = async (u:User)=>{
    setUser(u);
    localStorage.setItem('souqUser', JSON.stringify(u));
    saveStoredUser(u, allAds.filter(a=>a.postedBy===u.id).length);
    await supabase.from('profiles').upsert({
      id: u.id,
      full_name: u.name,
      email: u.email,
      phone: u.phone,
      avatar_url: u.avatar,
      city: u.location,
      role: u.role
    }, { onConflict: 'id' });
    showToast('تم حفظ الملف الشخصي ✅', 'success');
  };"""

assert old_update in content, "ERROR: handleUpdateUser not found!"
content = content.replace(old_update, new_update, 1)
print("OK: handleUpdateUser updated with Supabase profile sync")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nAll changes applied successfully!")

# Verify no duplicates
count = content.count('const loadUserFromSupabase')
print(f"loadUserFromSupabase count: {count} (should be 1)")
count2 = content.count('supabase.auth.signInWithPassword')
print(f"signInWithPassword count: {count2} (should be 2: login + after signup)")
