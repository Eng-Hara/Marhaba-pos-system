import { createContext, useContext, useEffect, useState } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // CHECK TOKEN ON APP START
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')

        if (!token) {
          setLoading(false)
          return
        }

        const response = await authService.getMe()

        // backend → { success, user }
        setUser(response.data.user)

      } catch (error) {
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // LOGIN
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)

      // backend → { success, token, user }
      const { token, user } = response.data

      if (!token) return false

      localStorage.setItem('token', token)
      setUser(user)

      return true
    } catch (error) {
      return false
    }
  }

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isManager: user?.role === 'manager' // muhiim
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)