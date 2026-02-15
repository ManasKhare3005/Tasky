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
      return result === 'granted'
    } catch (error) {
      console.error('Notification permission error:', error)
      return false
    }
  }

  const showNotification = useCallback((title, body, tag = 'focus-reminder') => {
    if (permission !== 'granted') return

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        tag
      })
    } else {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag,
        renotify: true
      })
    }
  }, [permission])

  const checkAndNotify = useCallback(() => {
    if (permission !== 'granted' || !settings.notificationsEnabled) return

    // Check active hours
    if (settings.activeHoursOnly) {
      const hour = new Date().getHours()
      if (hour < 8 || hour >= 22) return
    }

    const overdueTasks = getOverdueTasks()
    const pendingTasks = getPendingTasks()
    
    // Priority 1: Overdue tasks (more urgent)
    if (overdueTasks.length > 0) {
      const lastOverdueReminder = localStorage.getItem(getKey('last_overdue_reminder'))
      const now = Date.now()
      let interval = settings.reminderInterval * 60 * 1000

      // Aggressive mode - reminder every half interval for overdue tasks
      if (settings.aggressiveMode) {
        interval = interval / 2
      }

      if (!lastOverdueReminder || (now - parseInt(lastOverdueReminder)) >= interval) {
        const taskNames = overdueTasks.slice(0, 2).map(t => t.name).join(', ')
        const moreText = overdueTasks.length > 2 ? ` +${overdueTasks.length - 2} more` : ''
        
        showNotification(
          `⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`,
          `${taskNames}${moreText} — Complete now!`,
          'focus-overdue'
        )
        localStorage.setItem(getKey('last_overdue_reminder'), now.toString())
      }
      return // Don't send regular reminder if we sent overdue reminder
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
    // Clear any existing interval
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current)
    }

    // Check immediately on mount
    checkAndNotify()

    // Then check every minute (the actual interval logic is in checkAndNotify)
    notificationIntervalRef.current = setInterval(checkAndNotify, 60000)
    
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current)
      }
    }
  }, [checkAndNotify])

  return { permission, requestPermission, showNotification }
}