importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCJoPaUpei1VXqvApZ831Lm5rXI28RcQZE",
  authDomain: "souqbaghdad-7dc4c.firebaseapp.com",
  projectId: "souqbaghdad-7dc4c",
  storageBucket: "souqbaghdad-7dc4c.firebasestorage.app",
  messagingSenderId: "768540672381",
  appId: "1:768540672381:web:2cfc8a0119b5a7a8100c14",
  measurementId: "G-EYTE2Z95B3"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'سوق بغداد';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo-512.webp'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
