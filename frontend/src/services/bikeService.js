import api from './api'

export async function createBike(bikeData) {
  const res = await api.post('/api/bikes', bikeData)
  return res.data
}

export async function updateBike(id, bikeData) {
  const res = await api.put(`/api/bikes/${id}`, bikeData)
  return res.data
}

export async function deleteBike(id) {
  const res = await api.delete(`/api/bikes/${id}`)
  return res.data
}

export async function uploadImages(bikeId, formData) {
  const res = await api.post(`/api/bikes/${bikeId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function getMyBikes() {
  const res = await api.get('/api/bikes/my-bikes')
  return res.data
}

export async function getBikeById(id) {
  const res = await api.get(`/api/bikes/${id}`)
  return res.data
}

export async function listApprovedBikes(filters = {}) {
  const res = await api.get('/api/bikes', { params: filters })
  return res.data
}

export async function searchBikes(filters = {}) {
  const res = await api.get('/api/bikes/search', { params: filters })
  return res.data
}

