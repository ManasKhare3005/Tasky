import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, messaging, getToken, onMessage } from '../firebase'

// Your VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = 'BI_Oh5EZtdjRwIymyo3Pw9av_eMISTF1R0wmaUwYnkoNYl6dPr2tV5nrlQhsfmupiiSfyM-80u8liW8ICKoFAeo'

export const usePushNotifications = (userId, isGuest = false) => {
  const [fcmToken, setFcmToken] = useState(null)
  const [pushPermission, setPushPermission] = useState('default')
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
    }
  }, [])

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      
      // Show notification manually for foreground
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'TaskItUp', {
          body: payload.notification?.body,
          icon: '/icon-192.png'
        })
      }
    })

    return () => unsubscribe && unsubscribe()
  }, [])

  const requestPushPermission = async () => {
    if (!messaging || isGuest) {
      console.log('FCM not available or guest user')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)

      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return false
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('Service Worker registered:', registration)

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      })

      if (token) {
        console.log('FCM Token:', token)
        setFcmToken(token)
        
        // Save token to Firestore for this user
        await saveFcmToken(userId, token)
        setPushEnabled(true)
        return true
      } else {
        console.log('No FCM token received')
        return false
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return false
    }
  }

  const saveFcmToken = async (userId, token) => {
    try {
      await setDoc(doc(db, 'users', userId, 'tokens', 'fcm'), {
        token,
        updatedAt: new Date().toISOString(),
        platform: 'web'
      })
      console.log('FCM token saved to Firestore')
    } catch (error) {
      console.error('Error saving FCM token:', error)
    }
  }

  const disablePushNotifications = async () => {
    if (!userId || isGuest) return

    try {
      // Remove token from Firestore
      await setDoc(doc(db, 'users', userId, 'tokens', 'fcm'), {
        token: null,
        disabled: true,
        updatedAt: new Date().toISOString()
      })
      setFcmToken(null)
      setPushEnabled(false)
      console.log('Push notifications disabled')
    } catch (error) {
      console.error('Error disabling push:', error)
    }
  }

  // Check if push is already enabled on mount
  useEffect(() => {
    const checkExistingToken = async () => {
      if (!userId || isGuest) return

      try {
        const tokenDoc = await getDoc(doc(db, 'users', userId, 'tokens', 'fcm'))
        if (tokenDoc.exists() && tokenDoc.data().token) {
          setFcmToken(tokenDoc.data().token)
          setPushEnabled(true)
        }
      } catch (error) {
        console.error('Error checking existing token:', error)
      }
    }

    checkExistingToken()
  }, [userId, isGuest])

  return {
    fcmToken,
    pushPermission,
    pushEnabled,
    requestPushPermission,
    disablePushNotifications
  }
}
