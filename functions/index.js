const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// Scheduled function - runs every 15 minutes
exports.checkOverdueTasks = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'America/Phoenix'
}, async (event) => {
  console.log('Running scheduled task check...');
  
  const now = new Date();
  const currentHour = now.getHours();
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Get FCM token
        const tokenDoc = await db.collection('users').doc(userId).collection('tokens').doc('fcm').get();
        
        if (!tokenDoc.exists || !tokenDoc.data().token || tokenDoc.data().disabled) {
          continue;
        }
        
        const fcmToken = tokenDoc.data().token;
        
        // Get settings
        const settingsDoc = await db.collection('users').doc(userId).collection('settings').doc('current').get();
        const settings = settingsDoc.exists ? settingsDoc.data() : {};
        
        // Check active hours
        if (settings.activeHoursOnly !== false && (currentHour < 8 || currentHour >= 22)) {
          continue;
        }
        
        // Get tasks
        const tasksSnapshot = await db.collection('users').doc(userId).collection('tasks').get();
        if (tasksSnapshot.empty) continue;
        
        const todayKey = now.toISOString().split('T')[0];
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get completed tasks
        const completedDoc = await db.collection('users').doc(userId).collection('completed').doc(todayKey).get();
        const completedIds = new Set(completedDoc.exists ? completedDoc.data().taskIds || [] : []);
        
        // Filter today's tasks
        const todayTasks = tasks.filter(task => {
          if (task.type === 'daily') return true;
          if (task.type === 'oneoff' && task.date === todayKey) return true;
          if (task.type === 'oneoff' && task.date && task.date < todayKey && !completedIds.has(task.id)) return true;
          return false;
        });
        
        // Find overdue tasks
        const overdueTasks = todayTasks.filter(task => {
          if (completedIds.has(task.id)) return false;
          if (!task.time) return false;
          
          const [hours, minutes] = task.time.split(':').map(Number);
          const taskTime = new Date(now);
          taskTime.setHours(hours, minutes, 0, 0);
          
          if (task.type === 'oneoff' && task.date && task.date < todayKey) return true;
          return now > taskTime;
        });
        
        const pendingTasks = todayTasks.filter(task => !completedIds.has(task.id));
        
        if (overdueTasks.length === 0 && pendingTasks.length === 0) continue;
        
        // Check last notification time
        const lastNotifDoc = await db.collection('users').doc(userId).collection('notifications').doc('last').get();
        const lastNotifTime = lastNotifDoc.exists ? lastNotifDoc.data().timestamp : 0;
        
        const reminderInterval = (settings.reminderInterval || 30) * 60 * 1000;
        const interval = settings.aggressiveMode && overdueTasks.length > 0 ? reminderInterval / 2 : reminderInterval;
        
        if (now.getTime() - lastNotifTime < interval) continue;
        
        // Send notification
        let title, body;
        if (overdueTasks.length > 0) {
          title = `⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`;
          body = overdueTasks.slice(0, 3).map(t => t.name).join(', ');
        } else {
          title = `📋 ${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} pending`;
          body = pendingTasks.slice(0, 3).map(t => t.name).join(', ');
        }
        
        await messaging.send({
          token: fcmToken,
          notification: { title, body },
          webpush: {
            notification: {
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              vibrate: [200, 100, 200]
            }
          }
        });
        
        console.log(`Notification sent to user ${userId}`);
        
        await db.collection('users').doc(userId).collection('notifications').doc('last').set({
          timestamp: now.getTime()
        });
        
      } catch (error) {
        console.error(`Error for user ${userId}:`, error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
});

// Test notification endpoint
exports.sendTestNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('Must be logged in');
  }
  
  const userId = request.auth.uid;
  const tokenDoc = await db.collection('users').doc(userId).collection('tokens').doc('fcm').get();
  
  if (!tokenDoc.exists || !tokenDoc.data().token) {
    throw new Error('No FCM token');
  }
  
  await messaging.send({
    token: tokenDoc.data().token,
    notification: {
      title: '🎉 Test Notification',
      body: 'Background notifications are working!'
    }
  });
  
  return { success: true };
});