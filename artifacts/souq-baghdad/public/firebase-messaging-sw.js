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
  const title = payload.notification?.title || payload.data?.title || 'سوق بغداد';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = payload.notification?.image || payload.data?.image || '/logo-512.webp';

  const notificationOptions = {
    body,
    icon: '/logo-512.webp',
    badge: '/logo-128.webp',
    image: icon !== '/logo-512.webp' ? icon : undefined,
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.type || 'general'
  };

  // Update App Icon Badge on home screen
  if ('setAppBadge' in navigator) {
    const badgeVal = parseInt(payload.data?.badge || '1', 10);
    navigator.setAppBadge(isNaN(badgeVal) ? 1 : badgeVal).catch(() => {});
  }

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Clear or decrement badge on click
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
