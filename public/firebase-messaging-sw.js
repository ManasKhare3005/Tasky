// Firebase Cloud Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Your Firebase config - REPLACE WITH YOUR VALUES
firebase.initializeApp({
  apiKey: "AIzaSyByxN1MhqL3XiKSJBsf4vZWW8K1I7x-F_k",
  authDomain: "tasks-fd5ab.firebaseapp.com",
  projectId: "tasks-fd5ab",
  storageBucket: "tasks-fd5ab.firebasestorage.app",
  messagingSenderId: "702340603046",
  appId: "1:702340603046:web:16ca3976b3fe4a710fa867",
  measurementId: "G-DMYXP2YJD3"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'TaskItUp';
  const notificationOptions = {
    body: payload.notification?.body || 'You have pending tasks!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || 'taskitup-notification',
    renotify: true,
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});