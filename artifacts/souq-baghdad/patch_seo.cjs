const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const adDetailEffect = `  useEffect(()=>{
    setImgIdx(0);
    if (ad) {
      recordItemView(ad.id, 'ad', user, ad.postedBy);
      // SEO
      document.title = \`\${ad.title} - سوق بغداد\`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', \`\${ad.title} بسعر \${ad.price} دينار. \${ad.description.substring(0, 100)}... توصيل في بغداد.\`);
      }
    } else {
      document.title = 'سوق بغداد - تسوق الآن';
    }
  },[ad]);`;

content = content.replace(/  useEffect\(\(\)=>\{\n    setImgIdx\(0\);\n    if \(ad\) \{\n      recordItemView\(ad\.id, 'ad', user, ad\.postedBy\);\n    \}\n  \},\[ad\]\);/g, adDetailEffect);

const productDetailEffect = `  useEffect(()=>{
    setImgIdx(0);
    if (product) {
      recordItemView(product.id, 'product', user, product.sellerId);
      // SEO
      document.title = \`\${product.name} - سوق بغداد\`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', \`\${product.name} بسعر \${product.price} دينار. \${product.description.substring(0, 100)}... توصيل في بغداد.\`);
      }
    } else {
      document.title = 'سوق بغداد - تسوق الآن';
    }
  },[product]);`;

content = content.replace(/  useEffect\(\(\)=>\{\n    setImgIdx\(0\);\n    if \(product\) \{\n      recordItemView\(product\.id, 'product', user, product\.sellerId\);\n    \}\n  \},\[product\]\);/g, productDetailEffect);

fs.writeFileSync('src/App.tsx', content);
console.log('SEO meta tags injected');
