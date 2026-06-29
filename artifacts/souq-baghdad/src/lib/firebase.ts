import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCJoPaUpei1VXqvApZ831Lm5rXI28RcQZE",
  authDomain: "souqbaghdad-7dc4c.firebaseapp.com",
  projectId: "souqbaghdad-7dc4c",
  storageBucket: "souqbaghdad-7dc4c.firebasestorage.app",
  messagingSenderId: "768540672381",
  appId: "1:768540672381:web:2cfc8a0119b5a7a8100c14",
  measurementId: "G-EYTE2Z95B3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

// Helper to get Web Token
export const requestWebNotificationPermission = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Get token (You should ideally use a VAPID key here from Firebase console > Cloud Messaging > Web configuration)
      const currentToken = await getToken(messaging);
      if (currentToken) {
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
