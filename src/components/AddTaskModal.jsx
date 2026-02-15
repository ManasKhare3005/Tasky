import { useState } from 'react'
import './AddTaskModal.css'

const AddTaskModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState('')
  const [type, setType] = useState('daily')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      type,
      time: time || null,
      date: type === 'oneoff' ? date : null
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Task</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <button type="submit" className="submit-btn">Add Task</button>
        </form>
      </div>
    </div>
  )
}

export default AddTaskModal
