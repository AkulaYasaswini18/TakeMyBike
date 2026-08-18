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

export async function confirmCashPayment(id, notes = '') {
  const res = await api.post(`/api/bookings/${id}/confirm-cash-payment`, { notes })
  return res.data
}

export async function getBookingPayment(bookingId) {
  const res = await api.get(`/api/payments/booking/${bookingId}`)
  return res.data
}

export async function generateOtp(bookingId) {
  const res = await api.post(`/api/bookings/${bookingId}/generate-otp`)
  return res.data
}

export async function verifyOtp(bookingId, otp) {
  const res = await api.post(`/api/bookings/${bookingId}/verify-otp`, { otp })
  return res.data
}

export async function uploadInspection(bookingId, formData) {
  const res = await api.post(`/api/bookings/${bookingId}/inspection`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data
}

export async function getInspections(bookingId) {
  const res = await api.get(`/api/bookings/${bookingId}/inspections`)
  return res.data
}


