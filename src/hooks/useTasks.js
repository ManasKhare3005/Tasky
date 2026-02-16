import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'

const getTodayKey = () => new Date().toISOString().split('T')[0]

const isTaskOverdue = (task) => {
  if (!task.time) return false
  
  const now = new Date()
  const [hours, minutes] = task.time.split(':').map(Number)
  const taskTime = new Date()
  taskTime.setHours(hours, minutes, 0, 0)
  
  if (task.type === 'oneoff' && task.date) {
    const taskDate = new Date(task.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    taskDate.setHours(0, 0, 0, 0)
    
    if (taskDate < today) return true
    if (taskDate > today) return false
  }
  
  return now > taskTime
}

export const useTasks = (userId, isGuest = false) => {
  const [tasks, setTasks] = useState([])
  const [completedToday, setCompletedToday] = useState(new Set())
  const [streak, setStreak] = useState(0)
  const [lastCompletedDate, setLastCompletedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const isLoaded = useRef(false)

  // Helper for localStorage keys (guest mode)
  const getLocalKey = (key) => `focus_${userId}_${key}`

  // Load data from Firestore or localStorage
  useEffect(() => {
    if (!userId) return

    if (isGuest) {
      // Guest mode: use localStorage
      const savedTasks = localStorage.getItem(getLocalKey('tasks'))
      const savedCompleted = localStorage.getItem(getLocalKey('completed_' + getTodayKey()))
      const savedStreak = localStorage.getItem(getLocalKey('streak'))
      const savedLastDate = localStorage.getItem(getLocalKey('last_completed'))

      if (savedTasks) {
        try { setTasks(JSON.parse(savedTasks)) } catch (e) {}
      }
      if (savedCompleted) {
        try { setCompletedToday(new Set(JSON.parse(savedCompleted))) } catch (e) {}
      }
      if (savedStreak) setStreak(parseInt(savedStreak))
      if (savedLastDate) setLastCompletedDate(savedLastDate)
      
      isLoaded.current = true
      setLoading(false)
      return
    }

    // Firebase mode: set up real-time listener for tasks
    const tasksRef = collection(db, 'users', userId, 'tasks')
    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(tasksData)
      isLoaded.current = true
      setLoading(false)
    })

    // Load user stats (streak, completed, etc.)
    const loadUserStats = async () => {
      try {
        const statsDoc = await getDoc(doc(db, 'users', userId, 'stats', 'current'))
        if (statsDoc.exists()) {
          const data = statsDoc.data()
          setStreak(data.streak || 0)
          setLastCompletedDate(data.lastCompletedDate || null)
        }

        // Load today's completed tasks
        const todayDoc = await getDoc(doc(db, 'users', userId, 'completed', getTodayKey()))
        if (todayDoc.exists()) {
          setCompletedToday(new Set(todayDoc.data().taskIds || []))
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadUserStats()

    return () => unsubscribeTasks()
  }, [userId, isGuest])

  // Save tasks (guest mode only - Firebase saves directly in add/edit/delete)
  useEffect(() => {
    if (!userId || !isLoaded.current || !isGuest) return
    localStorage.setItem(getLocalKey('tasks'), JSON.stringify(tasks))
  }, [tasks, userId, isGuest])

  // Save completed
  useEffect(() => {
    if (!userId || !isLoaded.current) return
    
    if (isGuest) {
      localStorage.setItem(getLocalKey('completed_' + getTodayKey()), JSON.stringify([...completedToday]))
    } else {
      // Save to Firestore
      setDoc(doc(db, 'users', userId, 'completed', getTodayKey()), {
        taskIds: [...completedToday],
        updatedAt: new Date().toISOString()
      }).catch(console.error)
    }
  }, [completedToday, userId, isGuest])

  // Save streak
  useEffect(() => {
    if (!userId || !isLoaded.current) return
    
    if (isGuest) {
      localStorage.setItem(getLocalKey('streak'), streak.toString())
      if (lastCompletedDate) {
        localStorage.setItem(getLocalKey('last_completed'), lastCompletedDate)
      }
    } else {
      // Save to Firestore
      setDoc(doc(db, 'users', userId, 'stats', 'current'), {
        streak,
        lastCompletedDate,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(console.error)
    }
  }, [streak, lastCompletedDate, userId, isGuest])

  // Check streak on load
  useEffect(() => {
    const today = getTodayKey()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().split('T')[0]

    if (lastCompletedDate !== today && lastCompletedDate !== yesterdayKey) {
      setStreak(0)
    }
  }, [lastCompletedDate])

  const getTodayTasks = useCallback(() => {
    const todayKey = getTodayKey()
    return tasks.filter(task => {
      if (task.type === 'daily') return true
      if (task.type === 'oneoff') {
        if (task.date === todayKey) return true
        if (task.date && task.date < todayKey && !completedToday.has(task.id)) {
          return true
        }
      }
      return false
    })
  }, [tasks, completedToday])

  const getOverdueTasks = useCallback(() => {
    return getTodayTasks().filter(task => {
      if (completedToday.has(task.id)) return false
      return isTaskOverdue(task)
    })
  }, [getTodayTasks, completedToday])

  const getPendingTasks = useCallback(() => {
    return getTodayTasks().filter(t => !completedToday.has(t.id))
  }, [getTodayTasks, completedToday])

  const addTask = async (task) => {
    const newTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }

    if (isGuest) {
      setTasks(prev => [...prev, newTask])
    } else {
      try {
        await setDoc(doc(db, 'users', userId, 'tasks', newTask.id), newTask)
      } catch (error) {
        console.error('Error adding task:', error)
      }
    }
    return newTask
  }

  const editTask = async (updatedTask) => {
    const taskWithTimestamp = { 
      ...updatedTask, 
      updatedAt: new Date().toISOString() 
    }

    if (isGuest) {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? taskWithTimestamp : task
      ))
    } else {
      try {
        await updateDoc(doc(db, 'users', userId, 'tasks', updatedTask.id), taskWithTimestamp)
      } catch (error) {
        console.error('Error updating task:', error)
      }
    }
  }

  const deleteTask = async (taskId) => {
    if (isGuest) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } else {
      try {
        await deleteDoc(doc(db, 'users', userId, 'tasks', taskId))
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
    
    setCompletedToday(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  const toggleTask = (taskId) => {
    setCompletedToday(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  // Check completion whenever completedToday changes
  useEffect(() => {
    const todayTasks = getTodayTasks()
    const allDone = todayTasks.length > 0 && todayTasks.every(t => completedToday.has(t.id))
    
    if (allDone) {
      const today = getTodayKey()
      if (lastCompletedDate !== today) {
        setStreak(prev => prev + 1)
        setLastCompletedDate(today)
      }
    }
  }, [completedToday, getTodayTasks, lastCompletedDate])

  const getProgress = () => {
    const todayTasks = getTodayTasks()
    const total = todayTasks.length
    const completed = todayTasks.filter(t => completedToday.has(t.id)).length
    const pending = total - completed
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pending, percent }
  }

  const exportData = () => {
    const data = {
      tasks,
      streak,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focus-backup-${getTodayKey()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    tasks,
    completedToday,
    streak,
    loading,
    getTodayTasks,
    getOverdueTasks,
    getPendingTasks,
    isTaskOverdue,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    getProgress,
    exportData
  }
}
