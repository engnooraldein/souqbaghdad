const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace session handler in App.tsx
const oldSessionHandler = `    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserFromSupabase(session.user);
      else { setUser(null); localStorage.removeItem('souqUser'); }
    });`;

const newSessionHandler = `    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserFromSupabase(session.user);
      } else {
        const currentUser = localStorage.getItem('souqUser');
        if (currentUser) {
          localStorage.setItem('souqLastUser', currentUser);
        }
        setUser(null);
        localStorage.removeItem('souqUser');
      }
    });`;

if (content.includes(oldSessionHandler)) {
  content = content.replace(oldSessionHandler, newSessionHandler);
}

// Modify AuthModal to check souqLastUser
const authModalStart = `function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [step, setStep] = useState<'phone'|'login'|'signup'>('phone');`;

const authModalNewStart = `function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [step, setStep] = useState<'phone'|'login'|'signup'>(() => {
    const last = localStorage.getItem('souqLastUser');
    return last ? 'login' : 'phone';
  });
  const [identifier, setIdentifier] = useState(() => {
    const last = localStorage.getItem('souqLastUser');
    if (last) {
      try {
        const u = JSON.parse(last);
        return u.phone || u.email || '';
      } catch { return ''; }
    }
    return '';
  });`;

if (content.includes(authModalStart)) {
  // It also has:
  // const [identifier, setIdentifier] = useState('');
  // We need to replace both
  content = content.replace(authModalStart, authModalNewStart).replace(`  const [identifier, setIdentifier] = useState('');\n`, '');
}

fs.writeFileSync('src/App.tsx', content);
console.log('One-Tap login patch applied');
