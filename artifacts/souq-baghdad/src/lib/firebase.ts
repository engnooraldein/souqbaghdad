// Firebase Web Config for Souq Baghdad
import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyCJoPaUpei1VXqvApZ831Lm5rXI28RcQZE",
  authDomain: "souqbaghdad-7dc4c.firebaseapp.com",
  projectId: "souqbaghdad-7dc4c",
  storageBucket: "souqbaghdad-7dc4c.firebasestorage.app",
  messagingSenderId: "768540672381",
  appId: "1:768540672381:web:2cfc8a0119b5a7a8100c14",
  measurementId: "G-EYTE2Z95B3"
};

// Initialize Firebase App instance for Web if needed
export const firebaseApp = initializeApp(firebaseConfig);
