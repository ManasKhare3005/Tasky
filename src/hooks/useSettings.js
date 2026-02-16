import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const defaultSettings = {
  reminderInterval: 30,
  activeHoursOnly: true,
  aggressiveMode: false,
  notificationsEnabled: false
}

export const useSettings = (userId, isGuest = false) => {
  const getLocalKey = (key) => `focus_${userId}_${key}`
  
  const [settings, setSettings] = useState(defaultSettings)
  const [loaded, setLoaded] = useState(false)

  // Load settings
  useEffect(() => {
    if (!userId) return

    const loadSettings = async () => {
      if (isGuest) {
        // Guest mode: use localStorage
        const saved = localStorage.getItem(getLocalKey('settings'))
        if (saved) {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) })
        }
      } else {
        // Firebase mode
        try {
          const settingsDoc = await getDoc(doc(db, 'users', userId, 'settings', 'current'))
          if (settingsDoc.exists()) {
            setSettings({ ...defaultSettings, ...settingsDoc.data() })
          }
        } catch (error) {
          console.error('Error loading settings:', error)
        }
      }
      setLoaded(true)
    }

    loadSettings()
  }, [userId, isGuest])

  // Save settings
  useEffect(() => {
    if (!userId || !loaded) return

    if (isGuest) {
      localStorage.setItem(getLocalKey('settings'), JSON.stringify(settings))
    } else {
      // Save to Firestore (for Cloud Functions to access)
      setDoc(doc(db, 'users', userId, 'settings', 'current'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }).catch(console.error)
    }
  }, [settings, userId, isGuest, loaded])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return { settings, updateSetting }
}
