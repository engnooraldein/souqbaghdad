import ArabicReshaper from 'npm:arabic-reshaper';

const text = "سوق بغداد الرقمي 123";
const reshaped = ArabicReshaper.convertArabic(text);
const reversed = reshaped.split('').reverse().join('');
console.log("Original:", text);
console.log("Reshaped:", reshaped);
console.log("Reversed:", reversed);
