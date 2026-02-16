import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useSettings } from '../hooks/useSettings'
import { useNotifications } from '../hooks/useNotifications'
import Header from './Header'
import ProgressRing from './ProgressRing'
import TaskList from './TaskList'
import AddTaskModal from './AddTaskModal'
import Settings from './Settings'
import './Dashboard.css'

const Dashboard = ({ user, onLogout }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  const { 
    tasks, 
    completedToday, 
    streak,
    loading: tasksLoading,
    addTask,
    editTask,
    deleteTask, 
    toggleTask, 
    exportData 
  } = useTasks(user.id, user.isGuest)
  
  const { settings, updateSetting } = useSettings(user.id)

  // Auto-refresh every minute to update overdue status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Helper function to check if task is overdue
  const isTaskOverdue = useCallback((task) => {
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
  }, [currentTime]) // Recalculate when currentTime changes

  // Get today's tasks
  const todayTasks = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0]
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
  }, [tasks, completedToday, currentTime])

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    return todayTasks.filter(task => {
      if (completedToday.has(task.id)) return false
      return isTaskOverdue(task)
    })
  }, [todayTasks, completedToday, isTaskOverdue, currentTime])

  // Get pending tasks
  const pendingTasks = useMemo(() => {
    return todayTasks.filter(t => !completedToday.has(t.id))
  }, [todayTasks, completedToday])

  // Calculate progress
  const progress = useMemo(() => {
    const total = todayTasks.length
    const completed = todayTasks.filter(t => completedToday.has(t.id)).length
    const pending = total - completed
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pending, percent }
  }, [todayTasks, completedToday])

  // Callbacks for notifications
  const getOverdueTasksMemo = useCallback(() => overdueTasks, [overdueTasks])
  const getPendingTasksMemo = useCallback(() => pendingTasks, [pendingTasks])
  
  const { permission, requestPermission, showNotification, checkAndNotify } = useNotifications(
    settings, 
    getOverdueTasksMemo,
    getPendingTasksMemo,
    user.id
  )

  // Trigger notification check when overdue tasks change
  useEffect(() => {
    if (overdueTasks.length > 0 && settings.notificationsEnabled && permission === 'granted') {
      checkAndNotify()
    }
  }, [overdueTasks.length, currentTime])

  const handleTestNotification = () => {
    showNotification('Test Notification', 'TaskMeUp notifications are working! 🎉')
  }

  const getStatusMessage = () => {
    const { percent, pending } = progress
    const overdueCount = overdueTasks.length
    
    if (overdueCount > 0) {
      return { text: `🚨 ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}! Do it now!`, type: 'danger' }
    }
    if (percent === 100) return { text: '🎉 Amazing! You crushed it today!', type: '' }
    if (percent >= 75) return { text: '🔥 Almost there! Keep going!', type: '' }
    if (percent >= 50) return { text: '💪 Halfway done! You got this!', type: 'warning' }
    if (percent >= 25) return { text: `⚡ ${pending} tasks waiting. Let's move!`, type: 'warning' }
    if (pending > 0) return { text: `⏰ ${pending} tasks need your attention!`, type: 'danger' }
    return { text: "Let's crush it today!", type: '' }
  }

  const status = getStatusMessage()

  const handleAddTask = (taskData) => {
    addTask(taskData)
    setShowAddModal(false)
  }

  return (
    <div className="app-container">
      <Header 
        user={user} 
        onLogout={onLogout} 
        onExport={exportData}
      />

      <section className="progress-section">
        <ProgressRing percent={progress.percent} />
        <div className={`status-message ${status.type}`}>
          {status.text}
        </div>
      </section>

      <section className="today-summary">
        <div className="summary-card">
          <div className="summary-value">{progress.completed}</div>
          <div className="summary-label">Done</div>
        </div>
        <div className="summary-card">
          <div className="summary-value pending">{progress.pending}</div>
          <div className="summary-label">Pending</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{streak}</div>
          <div className="summary-label">Streak</div>
        </div>
      </section>

      <TaskList 
        tasks={todayTasks}
        completedToday={completedToday}
        isTaskOverdue={isTaskOverdue}
        onToggle={toggleTask}
        onEdit={editTask}
        onDelete={deleteTask}
        onAddClick={() => setShowAddModal(true)}
      />

      <Settings 
        settings={settings}
        onUpdateSetting={updateSetting}
        notificationPermission={permission}
        onRequestPermission={requestPermission}
        onTestNotification={handleTestNotification}
      />

      {showAddModal && (
        <AddTaskModal 
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  )
}

export default Dashboard