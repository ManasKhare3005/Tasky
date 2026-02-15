import { useState, useEffect } from 'react'

const defaultSettings = {
  reminderInterval: 30,
  activeHoursOnly: true,
  aggressiveMode: false,
  notificationsEnabled: false
}

export const useSettings = (userId) => {
  const getKey = (key) => `focus_${userId}_${key}`
  
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    if (!userId) return
    const saved = localStorage.getItem(getKey('settings'))
    if (saved) {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) })
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    localStorage.setItem(getKey('settings'), JSON.stringify(settings))
  }, [settings, userId])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return { settings, updateSetting }
}
