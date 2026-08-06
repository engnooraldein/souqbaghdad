import { FirebaseAppCheck } from '@capacitor-firebase/app-check';

// Firebase Web Config for Souq Baghdad
export const firebaseConfig = {
  apiKey: "AIzaSyCJoPaUpei1VXqvApZ831Lm5rXI28RcQZE",
  authDomain: "souqbaghdad-7dc4c.firebaseapp.com",
  projectId: "souqbaghdad-7dc4c",
  storageBucket: "souqbaghdad-7dc4c.firebasestorage.app",
  messagingSenderId: "768540672381",
  appId: "1:768540672381:web:2cfc8a0119b5a7a8100c14",
  measurementId: "G-EYTE2Z95B3"
};

export const initAppCheck = async () => {
  try {
    // This will activate Play Integrity on Android
    await FirebaseAppCheck.initialize({
      siteKey: 'YOUR_RECAPTCHA_V3_SITE_KEY', // For web fallback (optional for Android)
      isTokenAutoRefreshEnabled: true,
    });
    console.log('Firebase App Check initialized successfully (Play Integrity Active)');
  } catch (error) {
    console.error('Failed to initialize App Check:', error);
  }
};
