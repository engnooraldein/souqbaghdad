import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Copy to imports if not present
if 'Copy' not in content:
    content = re.sub(r'import \{([\s\S]*?)Share2', r'import {\1Share2, Copy', content)

# Replace AdDetailModal title
ad_id_ui = r'''<div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">{ad.title}</h2>
                <div className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-400">ID: {ad.id}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(ad.id)); alert('تم نسخ رقم الإعلان!'); }} className="text-amber-400 hover:text-amber-300">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>'''
content = re.sub(r'<div><h2 className="text-xl font-bold text-white mb-1">\{ad\.title\}</h2>', ad_id_ui, content)

# Replace ProductDetailModal title
prod_id_ui = r'''<div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold text-white">{product.title}</h2>
                <div className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-400">ID: {product.id}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(product.id)); alert('تم نسخ رقم الإعلان!'); }} className="text-amber-400 hover:text-amber-300">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>'''
content = re.sub(r'<div><h2 className="text-2xl font-bold text-white mb-1">\{product\.title\}</h2>', prod_id_ui, content)

# Replace TransportDetailModal title
trans_id_ui = r'''<div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">{ad.type === 'offer' ? 'عرض خط' : 'طلب خط'}</h2>
                <div className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-400">ID: {ad.id}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(ad.id)); alert('تم نسخ رقم الإعلان!'); }} className="text-amber-400 hover:text-amber-300">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>'''
content = re.sub(r'<div><h2 className="text-xl font-bold text-white mb-1">\{ad\.type === \'offer\' \? \'عرض خط\' : \'طلب خط\'\}</h2>', trans_id_ui, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Ad ID UI injected successfully!')
