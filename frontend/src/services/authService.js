import api from './api'

export async function register(data) {
  const res = await api.post('/api/auth/register', data)
  return res.data
}

export async function login(credentials) {
  const res = await api.post('/api/auth/login', credentials)
  return res.data
}

export async function logout() {
  const res = await api.post('/api/auth/logout')
  return res.data
}

export async function forgotPassword(email) {
  const res = await api.post('/api/auth/forgot-password', { email })
  return res.data
}

export async function resetPassword(token, password) {
  const res = await api.post('/api/auth/reset-password', { token, password })
  return res.data
}
