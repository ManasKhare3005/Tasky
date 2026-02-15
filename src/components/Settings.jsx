import './Settings.css'

const Settings = ({ settings, onUpdateSetting, notificationPermission, onRequestPermission }) => {
  const intervals = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' }
  ]

  const handleNotificationClick = async () => {
    const granted = await onRequestPermission()
    if (granted) {
      onUpdateSetting('notificationsEnabled', true)
    }
  }

  return (
    <section className="settings-section">
      <div className="section-header">
        <h2 className="section-title">Settings</h2>
      </div>

      <div className="settings-card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Notifications</label>
          <button 
            className={`notification-btn ${notificationPermission === 'granted' ? 'granted' : ''}`}
            onClick={handleNotificationClick}
            disabled={notificationPermission === 'denied'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {notificationPermission === 'granted' 
              ? 'Notifications Enabled' 
              : notificationPermission === 'denied'
              ? 'Notifications Blocked'
              : 'Enable Push Notifications'}
          </button>
        </div>
      </div>

      <div className="settings-card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Reminder Interval</label>
          <div className="interval-selector">
            {intervals.map(({ value, label }) => (
              <button 
                key={value}
                className={`interval-btn ${settings.reminderInterval === value ? 'active' : ''}`}
                onClick={() => onUpdateSetting('reminderInterval', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-info">
            <h3>Active Hours Only</h3>
            <p>Only send reminders 8 AM - 10 PM</p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.activeHoursOnly}
              onChange={e => onUpdateSetting('activeHoursOnly', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-info">
            <h3>Aggressive Mode</h3>
            <p>Increase frequency when tasks are pending</p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.aggressiveMode}
              onChange={e => onUpdateSetting('aggressiveMode', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </section>
  )
}

export default Settings
