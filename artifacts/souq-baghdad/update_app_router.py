import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports = """
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Share2 } from 'lucide-react';
"""
if "react-router-dom" not in content:
    content = re.sub(r"(import React.*?;\n)", r"\1" + imports, content, count=1)

# Inject Router Sync Hook inside App
sync_hook = """
  const [view, setView] = useState<AppView>('home');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/transport')) setView('transport');
    else if (path.startsWith('/profile')) setView('profile');
    else if (path.startsWith('/admin')) setView('admin');
    else if (path.startsWith('/owner')) setView('owner');
    else if (path.startsWith('/seller')) setView('seller');
    else setView('home');
    
    if (path.startsWith('/ad/')) {
      const id = path.split('/')[2];
      const ad = souqAds.find(a => a.id === id);
      if (ad) setSelectedAd(ad);
    } else if (path.startsWith('/product/')) {
      const id = path.split('/')[2];
      const prod = products.find(p => p.id === id);
      if (prod) setSelectedProduct(prod);
    } else {
      setSelectedAd(null);
      setSelectedProduct(null);
    }
  }, [location.pathname]);

  const handleNavigate = (newView: AppView) => {
    setView(newView);
    if (newView === 'home') navigate('/', { replace: true });
    else navigate(`/${newView}`, { replace: true });
  };
"""

# Replace the state definition
content = re.sub(
    r"const \[view, setView\] = useState<AppView>\('home'\);\n",
    sync_hook,
    content,
    count=1
)

# Also we need to replace all `setView(` with `handleNavigate(` to trigger URL updates.
content = re.sub(r"setView\(", "handleNavigate(", content)

# But wait, our `handleNavigate` is defined inside `App`. If there are `setView` calls, they will be replaced.
# But inside `App` there is `const handleNavigate = (newView: AppView) => { ... }`.
# Wait, `sync_hook` defines `handleNavigate`. The problem is that `handleNavigate` takes `AppView`. 
# If someone calls `setView('something')` inside an effect or child, it will now call `handleNavigate('something')`. This is exactly what we want.

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx imports and router sync!")
