import { useState } from 'react'
import TaskActionModal from './TaskActionModal'
import './TaskList.css'

const TaskList = ({ tasks, completedToday, isTaskOverdue, onToggle, onEdit, onDelete, onAddClick }) => {
  const [selectedTask, setSelectedTask] = useState(null)

  const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHours = h % 12 || 12
    return `${displayHours}:${minutes} ${ampm}`
  }

  // Sort tasks: overdue first, then by time
  const sortedTasks = [...tasks].sort((a, b) => {
    const aOverdue = !completedToday.has(a.id) && isTaskOverdue(a)
    const bOverdue = !completedToday.has(b.id) && isTaskOverdue(b)
    
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    // Then sort by completion status
    const aCompleted = completedToday.has(a.id)
    const bCompleted = completedToday.has(b.id)
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    
    return 0
  })

  return (
    <section className="tasks-section">
      <div className="section-header">
        <h2 className="section-title">Today's Tasks</h2>
        <span className="section-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="task-list">
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            <p>No tasks for today.<br/>Add one to get started!</p>
          </div>
        ) : (
          sortedTasks.map(task => {
            const isCompleted = completedToday.has(task.id)
            const isOverdue = !isCompleted && isTaskOverdue(task)
            return (
              <div 
                key={task.id} 
                className={`task-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="task-checkbox">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="task-content">
                  <div className="task-name">{task.name}</div>
                  <div className="task-meta">
                    {task.time && (
                      <span className={`task-time ${isOverdue ? 'overdue' : ''}`}>
                        {isOverdue && '⚠️ '}{formatTime(task.time)}
                      </span>
                    )}
                    {isOverdue && <span className="task-badge overdue">Overdue</span>}
                    {!isOverdue && (
                      <span className={`task-badge ${task.type}`}>
                        {task.type === 'daily' ? 'Daily' : 'One-time'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            )
          })
        )}
      </div>

      <button className="add-task-btn" onClick={onAddClick}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Task
      </button>

      {selectedTask && (
        <TaskActionModal
          task={selectedTask}
          isCompleted={completedToday.has(selectedTask.id)}
          onClose={() => setSelectedTask(null)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </section>
  )
}

export default TaskList
