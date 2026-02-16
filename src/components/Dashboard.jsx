import { useState, useCallback, useEffect } from 'react'
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
  const [, setTick] = useState(0) // Force re-render trigger
  
  const { 
    tasks, 
    completedToday, 
    streak,
    loading: tasksLoading,
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
  } = useTasks(user.id, user.isGuest)
  
  const { settings, updateSetting } = useSettings(user.id)
  
  const getOverdueTasksMemo = useCallback(() => getOverdueTasks(), [tasks, completedToday])
  const getPendingTasksMemo = useCallback(() => getPendingTasks(), [tasks, completedToday])
  
  const { permission, requestPermission, showNotification, checkAndNotify } = useNotifications(
    settings, 
    getOverdueTasksMemo,
    getPendingTasksMemo,
    user.id
  )

  // Auto-refresh every minute to update overdue status
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1) // Force re-render to update overdue status
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  const handleTestNotification = () => {
    showNotification('Test Notification', 'TaskMeUp notifications are working! 🎉')
  }

  const progress = getProgress()
  const todayTasks = getTodayTasks()
  const overdueTasks = getOverdueTasks()

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