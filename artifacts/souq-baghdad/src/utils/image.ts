import { supabase } from '../lib/supabase';

export async function compressImage(file: File, maxPx = 900, quality = 0.78, addWatermark = true): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if (addWatermark) {
          const fontSize = Math.max(16, Math.floor(canvas.width * 0.035));
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = `bold ${fontSize}px Tajawal, sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText('سوك بغداد | souqbaghdad.store', canvas.width - 20, canvas.height - 20);
        }
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToStorage(fileOrBase64: File | string, bucket = 'ad-images', maxPx = 900, quality = 0.78, addWatermark = true): Promise<string> {
  try {
    let base64Data: string;
    if (typeof fileOrBase64 === 'string') {
      base64Data = fileOrBase64;
    } else {
      base64Data = await compressImage(fileOrBase64, maxPx, quality, addWatermark);
    }

    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const fileExt = 'jpeg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to storage:', err);
    throw err;
  }
}
