const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Multiple Image Uploads - AdFormModal
content = content.replace(
  /const \[images, setImages\] = useState<\{preview:string;progress:number\}\[]>(\(editAd\?\.images\?\.map\(img=>\(\{preview:img,progress:100\}\)\)\|\|\[\]\));/,
  'const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>($1);'
);

content = content.replace(
  /const handleImages = async \(e:React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?const files = Array\.from\(e\.target\.files\);\s*for\(const file of files\)\{\s*const idx = images\.length;\s*setImages\(prev=>\[\.\.\.prev,\{preview:'',progress:0\}\]\);\s*let p=0; const iv=setInterval\(\(\)=>\{\s*p=Math\.min\(p\+Math\.random\(\)\*30,85\);\s*setImages\(prev=>prev\.map\(\(img,i\)=>i===idx&&img\.progress<100\?\{\.\.\.img,progress:p\}:img\)\);\s*\},120\);\s*const b64 = await compressImage\(file\);\s*clearInterval\(iv\);\s*setImages\(prev=>prev\.map\(\(img,i\)=>i===idx\?\{\.\.\.img,preview:b64,progress:100\}:img\)\);\s*\}\s*\};/,
  `const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    const files = Array.from(e.target.files);
    for(const file of files){
      const tempId = Math.random().toString(36).slice(2);
      setImages(prev=>[...prev,{_uid:tempId,preview:'',progress:0}]);
      let p=0; const iv=setInterval(()=>{ 
        p=Math.min(p+Math.random()*30,85); 
        setImages(prev=>prev.map(img=>img._uid===tempId&&img.progress<100?{...img,progress:p}:img)); 
      },120);
      const b64 = await compressImage(file);
      clearInterval(iv);
      setImages(prev=>prev.map(img=>img._uid===tempId?{...img,preview:b64,progress:100}:img));
    }
  };`
);

// 2. Fix Multiple Image Uploads - ProductFormModal
content = content.replace(
  /const \[images, setImages\] = useState<\{preview:string;progress:number\}\[]>(\(editProduct\?\.images\?\.map\(img=>\(\{preview:img,progress:100\}\)\)\|\|\[\]\));/,
  'const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>($1);'
);

content = content.replace(
  /const handleImages = async \(e:React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?for\(const file of Array\.from\(e\.target\.files\)\)\{\s*const idx = images\.length;\s*setImages\(prev=>\[\.\.\.prev,\{preview:'',progress:0\}\]\);\s*let p=0; const iv=setInterval\(\(\)=>\{p=Math\.min\(p\+Math\.random\(\)\*30,85\);setImages\(prev=>prev\.map\(\(img,i\)=>i===idx&&img\.progress<100\?\{\.\.\.img,progress:p\}:img\)\);\},120\);\s*const b64=await compressImage\(file\); clearInterval\(iv\);\s*setImages\(prev=>prev\.map\(\(img,i\)=>i===idx\?\{\.\.\.img,preview:b64,progress:100\}:img\)\);\s*\}\s*\};/,
  `const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    for(const file of Array.from(e.target.files)){
      const tempId = Math.random().toString(36).slice(2);
      setImages(prev=>[...prev,{_uid:tempId,preview:'',progress:0}]);
      let p=0; const iv=setInterval(()=>{p=Math.min(p+Math.random()*30,85);setImages(prev=>prev.map((img)=>img._uid===tempId&&img.progress<100?{...img,progress:p}:img));},120);
      const b64=await compressImage(file); clearInterval(iv);
      setImages(prev=>prev.map((img)=>img._uid===tempId?{...img,preview:b64,progress:100}:img));
    }
  };`
);

// 3. Fix Notifications Category & Views Counter in recordItemView
content = content.replace(
  /if \(!error\) \{\r?\n\s*localStorage\.setItem\(lastViewKey, Date\.now\(\)\.toString\(\)\);\r?\n\s*\/\/ 3\. Send notification to seller \(only if seller exists and isn't the viewer\)\r?\n\s*if \(sellerId && sellerId !== viewerId\) \{\r?\n\s*await supabase\.from\('user_notifications'\)\.insert\(\{\r?\n\s*user_id: sellerId,\r?\n\s*title: 'مشاهدة جديدة 👀',\r?\n\s*body: `قام \$\{viewerName\} بمشاهدة إعلانك للتو\.`,\r?\n\s*type: 'view',\r?\n\s*audience: 'user'\r?\n\s*\}\);\r?\n\s*\}\r?\n\s*\}/,
  `if (!error) {
      localStorage.setItem(lastViewKey, Date.now().toString());
      
      // 3. Send notification to seller
      if (sellerId && sellerId !== viewerId) {
        await supabase.from('user_notifications').insert({
          user_id: sellerId,
          title: 'مشاهدة جديدة 👀',
          body: \`قام \${viewerName} بمشاهدة إعلانك للتو.\`,
          type: 'view',
          category: 'notification',
          audience: 'user'
        });
      }

      // 4. Update the views counter on the item itself
      const table = itemType === 'product' ? 'products' : itemType === 'transport' ? 'transport_ads' : 'ads';
      const { data: item } = await supabase.from(table).select('views').eq('id', itemId).single();
      if (item) {
        await supabase.from(table).update({ views: (item.views || 0) + 1 }).eq('id', itemId);
      }
    }`
);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully for 3 bug fixes!');
