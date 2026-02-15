import { useState, useEffect } from 'react'
import AuthScreen from './components/AuthScreen'
import Dashboard from './components/Dashboard'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  const { user, loading, login, signup, loginWithGoogle, loginAsGuest, logout } = useAuth()

  if (loading) {
    return (
      <>
        <div className="bg-grid" />
        <div className="loading-screen">
          <div className="loading-logo">FOCUS</div>
          <div className="loading-spinner"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="bg-grid" />
      {!user ? (
        <AuthScreen 
          onLogin={login} 
          onSignup={signup}
          onGoogleLogin={loginWithGoogle}
          onGuest={loginAsGuest} 
        />
      ) : (
        <Dashboard user={user} onLogout={logout} />
      )}
    </>
  )
}

export default App