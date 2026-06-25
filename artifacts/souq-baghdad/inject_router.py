import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Share2, Copy } from 'lucide-react';
"""
if "react-router-dom" not in content:
    content = re.sub(r"(import React.*?;\n)", r"\1" + imports, content, count=1)

# Add useLocation and useNavigate inside App
# We can inject them right after `const [view, setView] = useState<AppView>('home');`
sync_vars = """
  const navigate = useNavigate();
  const location = useLocation();
"""
content = re.sub(r"(const \[view, setView\] = useState<AppView>\('home'\);\n)", r"\1" + sync_vars, content, count=1)

# Add the useEffect right before `return (` at line 4092 (we can just replace `return (` with our code)
sync_effect = """
  // Sync URL to State
  useEffect(() => {
    const path = location.pathname;
    
    // View mapping
    if (path.startsWith('/transport')) setView('transport');
    else if (path.startsWith('/profile')) setView('profile');
    else if (path.startsWith('/admin')) setView('admin');
    else if (path.startsWith('/owner')) setView('owner');
    else if (path.startsWith('/seller')) setView('seller');
    else setView('home');

    // Details mapping
    if (path.startsWith('/ad/')) {
      const id = path.split('/')[2];
      const ad = allAds.find(a => a.id.toString() === id);
      if (ad) setSelectedAd(ad);
    } else if (path.startsWith('/product/')) {
      const id = path.split('/')[2];
      const prod = allProducts.find(p => p.id.toString() === id);
      if (prod) setSelectedProduct(prod);
    } else if (path.startsWith('/transport-ad/')) {
      const id = path.split('/')[2];
      const trans = allTransportAds.find(t => t.id.toString() === id);
      if (trans) setSelectedTransportAd(trans);
    } else {
      setSelectedAd(null);
      setSelectedProduct(null);
      setSelectedTransportAd(null);
    }
  }, [location.pathname, allAds, allProducts, allTransportAds]);

  // Sync State to URL
  useEffect(() => {
    if (selectedAd) {
      if (location.pathname !== `/ad/${selectedAd.id}`) navigate(`/ad/${selectedAd.id}`, { replace: true });
    } else if (selectedProduct) {
      if (location.pathname !== `/product/${selectedProduct.id}`) navigate(`/product/${selectedProduct.id}`, { replace: true });
    } else if (selectedTransportAd) {
      if (location.pathname !== `/transport-ad/${selectedTransportAd.id}`) navigate(`/transport-ad/${selectedTransportAd.id}`, { replace: true });
    } else {
      const targetPath = view === 'home' ? '/' : `/${view}`;
      if (location.pathname !== targetPath) navigate(targetPath, { replace: true });
    }
  }, [view, selectedAd, selectedProduct, selectedTransportAd]);

  return (
"""
content = re.sub(r"\n(\s*)return \(\s*\n(\s*)<div className=", "\n" + sync_effect + r"\2<div className=", content, count=1)


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected router logic successfully!")
