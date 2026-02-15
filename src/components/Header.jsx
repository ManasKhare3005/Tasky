import { useState, useEffect, useRef } from 'react'
import './Header.css'

const Header = ({ user, onLogout, onExport }) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = () => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' }
    return new Date().toLocaleDateString('en-US', options)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <header className="header">
      <div className="logo">FOCUS</div>
      <div className="header-right">
        <div className="date-display">{formatDate()}</div>
        <div className="user-menu-container" ref={menuRef}>
          <button 
            className="user-menu-btn" 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          >
            <div className="user-avatar">{getInitials(user.name)}</div>
          </button>

          {showMenu && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-avatar large">{getInitials(user.name)}</div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">
                    {user.isGuest ? 'Guest Account' : user.email}
                  </div>
                </div>
              </div>
              <div className="user-menu-divider" />
              <button className="user-menu-item" onClick={() => { onExport(); setShowMenu(false) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Data
              </button>
              <button className="user-menu-item danger" onClick={onLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
