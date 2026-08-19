import axios from 'axios'
import { emitToast } from '../context/ToastContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
})

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.formattedMessage || error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
}

// Request Interceptor: Attach JWT Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bikeshare_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Global 401 handling and friendly error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'An unexpected error occurred. Please try again.'
    let toastType = 'error'
    let toastTitle = 'Request Failed'

    if (!error.response) {
      // Network failure or backend down
      friendlyMessage = 'Unable to connect to BikeShare servers. Please check your internet connection.'
      emitToast('error', friendlyMessage, 'Network Error')
      error.formattedMessage = friendlyMessage
      return Promise.reject(error)
    }

    const { status, data } = error.response
    const serverErrorMsg = data?.error || data?.message

    switch (status) {
      case 400:
        if (serverErrorMsg) {
          friendlyMessage = serverErrorMsg
        } else {
          friendlyMessage = 'Invalid request parameters. Please verify your input.'
        }
        break

      case 401:
        friendlyMessage = 'Your session has expired. Please log in again.'
        toastTitle = 'Session Expired'
        localStorage.removeItem('bikeshare_token')
        localStorage.removeItem('bikeshare_user')

        // Only redirect if not already on auth/public pages
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          const isPublic = ['/', '/login', '/register', '/find-bikes', '/forgot-password', '/reset-password'].includes(currentPath)
          if (!isPublic) {
            emitToast('error', friendlyMessage, toastTitle)
            setTimeout(() => {
              window.location.href = `/login?from=${encodeURIComponent(currentPath)}`
            }, 1000)
          }
        }
        break

      case 403:
        friendlyMessage = serverErrorMsg || 'You do not have permission to perform this action.'
        toastType = 'warning'
        toastTitle = 'Access Denied'
        break

      case 404:
        friendlyMessage = serverErrorMsg || 'The requested bike, booking, or resource could not be found.'
        toastTitle = 'Not Found'
        break

      case 409:
        friendlyMessage = serverErrorMsg || 'Date conflict: The selected dates are already booked by another user.'
        toastType = 'warning'
        toastTitle = 'Booking Conflict'
        break

      case 413:
        friendlyMessage = 'Uploaded file is too large. Please upload images under 5MB.'
        toastTitle = 'Upload Failed'
        break

      case 500:
        friendlyMessage = 'A server error occurred. Our engineers have been alerted.'
        toastTitle = 'Server Error'
        break

      default:
        friendlyMessage = serverErrorMsg || `Request failed with status ${status}.`
        toastTitle = status >= 500 ? 'Server Error' : 'Request Failed'
    }

    // Attach friendly message to error object
    error.formattedMessage = friendlyMessage
    if (status !== 401 || typeof window === 'undefined' || ['/', '/login', '/register', '/find-bikes', '/forgot-password', '/reset-password'].includes(window.location.pathname)) {
      emitToast(toastType, friendlyMessage, toastTitle)
    }
    return Promise.reject(error)
  }
)

export default api

// quick health-check helper (can be used in dev)
export async function healthCheck() {
  try {
    const res = await api.get('/api/health')
    return res.data
  } catch (err) {
    return { error: true, message: err.formattedMessage || err.message }
  }
}

// Bike API methods
export const bikeAPI = {
  createBike: (bikeData) => api.post('/api/bikes', bikeData),
  getAllBikes: (filters) => api.get('/api/bikes', { params: filters }),
  getBikeById: (id) => api.get(`/api/bikes/${id}`),
  getMyBikes: () => api.get('/api/bikes/my-bikes'),
  updateBike: (id, bikeData) => api.put(`/api/bikes/${id}`, bikeData),
  deleteBike: (id) => api.delete(`/api/bikes/${id}`),
  uploadImages: (id, formData) => api.post(`/api/bikes/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Booking API methods
export const bookingAPI = {
  createBooking: (bikeId, startDate, endDate) => api.post('/api/bookings', { bikeId, startDate, endDate }),
  getMyBookings: () => api.get('/api/bookings/my-bookings'),
  getOwnerBookings: () => api.get('/api/bookings/owner/requests'),
  approveBooking: (id) => api.put(`/api/bookings/${id}/approve`),
  rejectBooking: (id) => api.put(`/api/bookings/${id}/reject`),
  confirmCashPayment: (id, notes) => api.post(`/api/bookings/${id}/confirm-cash-payment`, { notes })
}

// Payment API methods
export const paymentAPI = {
  getBookingPayment: (bookingId) => api.get(`/api/payments/booking/${bookingId}`)
}
