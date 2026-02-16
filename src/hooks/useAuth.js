import { useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const userData = userDoc.data()
        
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || userData?.name || 'User',
          isGuest: false
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signup = async (name, email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name
      await updateProfile(result.user, { displayName: name })
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        email,
        createdAt: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      let message = 'Failed to create account'
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists'
      } else if (error.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      }
      return { success: false, error: message }
    }
  }

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      let message = 'Failed to log in'
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password'
      }
      return { success: false, error: message }
    }
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          name: result.user.displayName,
          email: result.user.email,
          createdAt: new Date().toISOString()
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Google sign-in error:', error)
      
      let message = 'Failed to sign in with Google'
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed'
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Pop-up blocked by browser. Please allow pop-ups.'
      } else if (error.code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized. Add it in Firebase Console.'
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is not enabled. Enable it in Firebase Console.'
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in cancelled'
      } else if (error.message) {
        message = error.message
      }
      
      return { success: false, error: message }
    }
  }

  const loginAsGuest = () => {
    // Guest mode still uses localStorage only
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Guest',
      email: 'guest@local',
      isGuest: true
    }
    setUser(guestUser)
    localStorage.setItem('focus_guest_user', JSON.stringify(guestUser))
    return { success: true, user: guestUser }
  }

  const logout = async () => {
    try {
      if (user?.isGuest) {
        localStorage.removeItem('focus_guest_user')
        setUser(null)
      } else {
        await signOut(auth)
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check for guest user on mount
  useEffect(() => {
    if (!loading && !user) {
      const guestUser = localStorage.getItem('focus_guest_user')
      if (guestUser) {
        setUser(JSON.parse(guestUser))
      }
    }
  }, [loading])

  return { 
    user, 
    loading, 
    login, 
    signup, 
    loginWithGoogle, 
    loginAsGuest, 
    logout, 
    getInitials 
  }
}
