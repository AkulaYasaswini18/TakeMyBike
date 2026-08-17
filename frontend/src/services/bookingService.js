import api from './api'

export async function createBooking(bikeId, startDate, endDate) {
  const res = await api.post('/api/bookings', { bikeId, startDate, endDate })
  return res.data
}

export async function getMyBookings() {
  const res = await api.get('/api/bookings/my-bookings')
  return res.data
}

export async function getOwnerBookings() {
  const res = await api.get('/api/bookings/owner/requests')
  return res.data
}

export async function approveBooking(id) {
  const res = await api.put(`/api/bookings/${id}/approve`)
  return res.data
}

export async function rejectBooking(id) {
  const res = await api.put(`/api/bookings/${id}/reject`)
  return res.data
}
