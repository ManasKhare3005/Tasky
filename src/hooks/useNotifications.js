import { useState, useEffect, useCallback, useRef } from 'react'

export const useNotifications = (settings, getOverdueTasks, getPendingTasks, userId) => {
  const [permission, setPermission] = useState('default')
  const getKey = (key) => `focus_${userId}_${key}`
  const notificationIntervalRef = useRef(null)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
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
        // Send test notification
        setTimeout(() => {
          showNotification('TaskMeUp', 'Notifications are now enabled! 🎉')
        }, 500)
      }
      
      return result === 'granted'
    } catch (error) {
      console.error('Notification permission error:', error)
      return false
    }
  }

  const showNotification = useCallback(async (title, body, tag = 'taskmeup-reminder') => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted')
      return
    }

    console.log('Attempting to show notification:', title)

    try {
      // Check if we have a service worker with showNotification support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag,
          renotify: true,
          vibrate: [200, 100, 200]
        })
        console.log('Notification sent via Service Worker')
      } else {
        // Fallback to regular Notification API (works on desktop)
        const notification = new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag
        })
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
        console.log('Notification sent via Notification API')
      }
    } catch (error) {
      console.error('Notification error:', error)
      // Last resort fallback
      try {
        new Notification(title, { body, icon: '/icon-192.png' })
      } catch (e) {
        console.error('All notification methods failed:', e)
      }
    }
  }, [permission])

  const checkAndNotify = useCallback(() => {
    if (permission !== 'granted' || !settings.notificationsEnabled) {
      return
    }

    // Check active hours
    if (settings.activeHoursOnly) {
      const hour = new Date().getHours()
      if (hour < 8 || hour >= 22) {
        return
      }
    }

    const overdueTasks = getOverdueTasks()
    const pendingTasks = getPendingTasks()

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
          `⚠️ ${overdueTasks.length} overdue!`,
          `${taskNames}${moreText}`,
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
          pendingTasks.slice(0, 2).map(t => t.name).join(', ')
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

    const timer = setTimeout(() => {
      checkAndNotify()
    }, 3000)

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