import { useState, useEffect } from 'react'
import './TaskActionModal.css'

const TaskActionModal = ({ task, isCompleted, onClose, onToggle, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(task.name)
  const [type, setType] = useState(task.type)
  const [time, setTime] = useState(task.time || '')
  const [date, setDate] = useState(task.date || new Date().toISOString().split('T')[0])

  useEffect(() => {
    // Reset form when task changes
    setName(task.name)
    setType(task.type)
    setTime(task.time || '')
    setDate(task.date || new Date().toISOString().split('T')[0])
    setIsEditing(false)
  }, [task])

  const handleSave = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onEdit({
      ...task,
      name: name.trim(),
      type,
      time: time || null,
      date: type === 'oneoff' ? date : null
    })
    onClose()
  }

  const formatTime = (time) => {
    if (!time) return 'No time set'
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHours = h % 12 || 12
    return `${displayHours}:${minutes} ${ampm}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-action-modal" onClick={e => e.stopPropagation()}>
        {!isEditing ? (
          <>
            <div className="task-action-header">
              <h3 className="task-action-title">{task.name}</h3>
              <div className="task-action-meta">
                {task.time && <span>{formatTime(task.time)}</span>}
                <span className={`task-badge ${task.type}`}>
                  {task.type === 'daily' ? 'Daily' : 'One-time'}
                </span>
              </div>
            </div>

            <div className="task-action-buttons">
              <button 
                className={`action-btn ${isCompleted ? 'undo' : 'complete'}`}
                onClick={() => { onToggle(task.id); onClose() }}
              >
                {isCompleted ? (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                    Mark Incomplete
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Mark Complete
                  </>
                )}
              </button>

              <button 
                className="action-btn edit"
                onClick={() => setIsEditing(true)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Task
              </button>

              <button 
                className="action-btn delete"
                onClick={() => { onDelete(task.id); onClose() }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Task
              </button>
            </div>

            <button className="cancel-btn" onClick={onClose}>Cancel</button>
          </>
        ) : (
          <>
            <div className="modal-header">
              <h3 className="modal-title">Edit Task</h3>
              <button className="modal-close" onClick={() => setIsEditing(false)}>&times;</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Task Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="What do you need to do?"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <div className="toggle-group">
                  <button 
                    type="button" 
                    className={`toggle-btn ${type === 'daily' ? 'active' : ''}`}
                    onClick={() => setType('daily')}
                  >
                    Daily
                  </button>
                  <button 
                    type="button" 
                    className={`toggle-btn ${type === 'oneoff' ? 'active' : ''}`}
                    onClick={() => setType('oneoff')}
                  >
                    One-time
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Scheduled Time</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                </div>
                {type === 'oneoff' && (
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="edit-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default TaskActionModal
