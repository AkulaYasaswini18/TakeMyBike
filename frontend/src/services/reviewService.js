import api from './api'

export async function createReview(reviewData) {
  const res = await api.post('/api/reviews', reviewData)
  return res.data
}

export async function getBikeReviews(bikeId) {
  const res = await api.get(`/api/reviews/bike/${bikeId}`)
  return res.data
}

export async function getUserReviews(userId) {
  const res = await api.get(`/api/reviews/user/${userId}`)
  return res.data
}

export async function getBookingReviews(bookingId) {
  const res = await api.get(`/api/reviews/booking/${bookingId}`)
  return res.data
}
