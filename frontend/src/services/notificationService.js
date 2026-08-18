import api from './api'

export async function getMyNotifications() {
  const res = await api.get('/api/notifications/mine')
  return res.data
}

export async function markAsRead(notificationId) {
  const res = await api.put(`/api/notifications/${notificationId}/read`)
  return res.data
}

export async function markAllAsRead() {
  const res = await api.put('/api/notifications/read-all')
  return res.data
}
