import React, { useEffect, useState } from 'react'
import * as authService from '../services/authService'
import api from '../services/api'

const AuthContext = React.createContext({ user: null })

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bikeshare_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('bikeshare_token'))

  useEffect(() => {
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
    else delete api.defaults.headers.common.Authorization
  }, [token])

  const login = async (credentials) => {
    const data = await authService.login(credentials)
    if (data.token) {
      setToken(data.token)
      localStorage.setItem('bikeshare_token', data.token)
    }
    if (data.user) {
      setUser(data.user)
      localStorage.setItem('bikeshare_user', JSON.stringify(data.user))
    }
    return data
  }

  const register = async (payload) => {
    const data = await authService.register(payload)
    return data
  }

  const logout = async () => {
    try { await authService.logout() } catch (e) {}
    setToken(null); setUser(null)
    localStorage.removeItem('bikeshare_token'); localStorage.removeItem('bikeshare_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
