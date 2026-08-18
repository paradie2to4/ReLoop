import { createContext, useContext, useEffect, useState } from 'react'
import { tokenStore } from '../services/api'
import * as authService from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (!tokenStore.getAccess()) {
        setLoading(false)
        return
      }
      try {
        const me = await authService.fetchMe()
        setUser(me)
      } catch {
        tokenStore.clear()
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  async function login(email, password) {
    const loggedInUser = await authService.login(email, password)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function register(payload) {
    const newUser = await authService.register(payload)
    setUser(newUser)
    return newUser
  }

  function logout() {
    authService.logout()
    setUser(null)
  }

  async function refreshUser() {
    const me = await authService.fetchMe()
    setUser(me)
    return me
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isSeller: !!user?.is_seller,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
