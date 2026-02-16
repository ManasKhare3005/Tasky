import { useState, useEffect, useCallback, useRef } from 'react'

export const useNotifications = (settings, getOverdueTasks, getPendingTasks, userId) => {
  const [permission, setPermission] = useState('default')
  const [swRegistration, setSwRegistration] = useState(null)
  const getKey = (key) => `focus_${userId}_${key}`
  const notificationIntervalRef = useRef(null)

  // Register service worker and check permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Register our custom service worker for notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration)
          setSwRegistration(registration)
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        // Send a test notification to confirm it works
        showNotification('TaskMeUp', 'Notifications are now enabled! 🎉')
      }
      
      return result === 'granted'
    } catch (error) {
      console.error('Notification permission error:', error)
      return false
    }
  }

  const showNotification = useCallback((title, body, tag = 'taskmeup-reminder') => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted')
      return
    }

    console.log('Showing notification:', title, body)

    // Try Service Worker first (required for mobile)
    if (swRegistration) {
      swRegistration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      }).then(() => {
        console.log('Notification shown via SW')
      }).catch((error) => {
        console.error('SW notification error:', error)
        // Fallback to direct notification
        tryDirectNotification(title, body, tag)
      })
    } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      // Wait for SW to be ready
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag,
          renotify: true,
          vibrate: [200, 100, 200]
        })
      }).catch((error) => {
        console.error('SW ready notification error:', error)
        tryDirectNotification(title, body, tag)
      })
    } else {
      // Fallback for desktop
      tryDirectNotification(title, body, tag)
    }
  }, [permission, swRegistration])

  const tryDirectNotification = (title, body, tag) => {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag,
        renotify: true
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      console.log('Direct notification shown')
    } catch (error) {
      console.error('Direct notification error:', error)
    }
  }

  const checkAndNotify = useCallback(() => {
    console.log('Checking notifications...', { 
      permission, 
      notificationsEnabled: settings.notificationsEnabled 
    })

    if (permission !== 'granted' || !settings.notificationsEnabled) {
      return
    }

    // Check active hours
    if (settings.activeHoursOnly) {
      const hour = new Date().getHours()
      if (hour < 8 || hour >= 22) {
        console.log('Outside active hours')
        return
      }
    }

    const overdueTasks = getOverdueTasks()
    const pendingTasks = getPendingTasks()
    
    console.log('Tasks:', { overdue: overdueTasks.length, pending: pendingTasks.length })

    // Priority 1: Overdue tasks
    if (overdueTasks.length > 0) {
      const lastOverdueReminder = localStorage.getItem(getKey('last_overdue_reminder'))
      const now = Date.now()
      let interval = settings.reminderInterval * 60 * 1000

      if (settings.aggressiveMode) {
        interval = interval / 2
      }

      if (!lastOverdueReminder || (now - parseInt(lastOverdueReminder)) >= interval) {
        const taskNames = overdueTasks.slice(0, 2).map(t => t.name).join(', ')
        const moreText = overdueTasks.length > 2 ? ` +${overdueTasks.length - 2} more` : ''
        
        showNotification(
          `⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`,
          `${taskNames}${moreText} — Complete now!`,
          'taskmeup-overdue'
        )
        localStorage.setItem(getKey('last_overdue_reminder'), now.toString())
      }
      return
    }

    // Priority 2: Regular pending tasks
    if (pendingTasks.length > 0) {
      const lastReminder = localStorage.getItem(getKey('last_reminder'))
      const now = Date.now()
      let interval = settings.reminderInterval * 60 * 1000

      if (settings.aggressiveMode) {
        interval = interval / 2
      }

      if (!lastReminder || (now - parseInt(lastReminder)) >= interval) {
        showNotification(
          `${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} pending`,
          pendingTasks.slice(0, 2).map(t => t.name).join(', ') + (pendingTasks.length > 2 ? '...' : '')
        )
        localStorage.setItem(getKey('last_reminder'), now.toString())
      }
    }
  }, [permission, settings, getOverdueTasks, getPendingTasks, showNotification, userId])

  // Set up periodic checking
  useEffect(() => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current)
    }

    // Check after a short delay
    const timer = setTimeout(() => {
      checkAndNotify()
    }, 3000)

    // Then check every minute
    notificationIntervalRef.current = setInterval(checkAndNotify, 60000)
    
    return () => {
      clearTimeout(timer)
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current)
      }
    }
  }, [checkAndNotify])

  return { permission, requestPermission, showNotification, checkAndNotify }
}