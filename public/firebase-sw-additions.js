// This file contains additional service worker code for Firebase messaging
// It will be imported by the main service worker

// Initialize Firebase in the service worker
// NOTE: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyByxN1MhqL3XiKSJBsf4vZWW8K1I7x-F_k",
  authDomain: "tasks-fd5ab.firebaseapp.com",
  projectId: "tasks-fd5ab",
  storageBucket: "tasks-fd5ab.firebasestorage.app",
  messagingSenderId: "702340603046",
  appId: "1:702340603046:web:16ca3976b3fe4a710fa867",
  measurementId: "G-DMYXP2YJD3"
};

// Check if Firebase scripts are loaded
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  
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
}

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

// Handle push events directly (fallback)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = { title: 'TaskItUp', body: 'You have pending tasks!' };
  
  if (event.data) {
    try {
      data = event.data.json();
      if (data.notification) {
        data = data.notification;
      }
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});