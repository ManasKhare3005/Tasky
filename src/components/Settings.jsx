import './Settings.css'

const Settings = ({ 
  settings, 
  onUpdateSetting, 
  notificationPermission, 
  onRequestPermission, 
  onTestNotification,
  pushEnabled,
  onRequestPushPermission,
  onDisablePush,
  isGuest
}) => {
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

  const handlePushToggle = async () => {
    if (pushEnabled) {
      onDisablePush()
    } else {
      await onRequestPushPermission()
    }
  }

  const isEnabled = notificationPermission === 'granted' && settings.notificationsEnabled

  return (
    <section className="settings-section">
      <div className="section-header">
        <h2 className="section-title">Settings</h2>
      </div>

      {/* Background Push Notifications - only for logged in users */}
      {!isGuest && (
        <div className="settings-card featured">
          <div className="settings-row">
            <div className="settings-info">
              <h3>🔔 Background Notifications</h3>
              <p>{pushEnabled ? 'You\'ll get reminders even when app is closed' : 'Get reminders even when app is closed'}</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={pushEnabled}
                onChange={handlePushToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {!pushEnabled && (
            <p className="settings-hint">Recommended for best experience</p>
          )}
        </div>
      )}

      {isGuest && (
        <div className="settings-card">
          <div className="guest-notice">
            <span>💡</span>
            <p>Sign up to enable background notifications that work even when the app is closed!</p>
          </div>
        </div>
      )}

      <div className="settings-card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">In-App Notifications</label>
          {notificationPermission !== 'granted' ? (
            <button 
              className="notification-btn"
              onClick={handleNotificationClick}
              disabled={notificationPermission === 'denied'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notificationPermission === 'denied' 
                ? 'Notifications Blocked (check browser settings)' 
                : 'Enable Notifications'}
            </button>
          ) : (
            <div className="notification-controls">
              <div className="settings-row">
                <div className="settings-info">
                  <h3>In-App Reminders</h3>
                  <p>{isEnabled ? 'Active when app is open' : 'Paused'}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.notificationsEnabled}
                    onChange={e => onUpdateSetting('notificationsEnabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {isEnabled && onTestNotification && (
                <button 
                  className="test-notification-btn"
                  onClick={onTestNotification}
                >
                  Send Test Notification
                </button>
              )}
            </div>
          )}
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
            <p>Double reminder frequency for overdue tasks</p>
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
