import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE
})

export default api

// quick health-check helper (can be used in dev)
export async function healthCheck() {
  try {
    const res = await api.get('/api/health')
    return res.data
  } catch (err) {
    return { error: true, message: err.message }
  }
}

// Bike API methods
export const bikeAPI = {
  // Create a new bike listing
  createBike: (bikeData) => api.post('/api/bikes', bikeData),

  // Get all approved bikes (public browse)
  getAllBikes: (filters) => api.get('/api/bikes', { params: filters }),

  // Get a single bike by ID
  getBikeById: (id) => api.get(`/api/bikes/${id}`),

  // Get logged-in owner's bikes
  getMyBikes: () => api.get('/api/bikes/my-bikes'),

  // Update a bike
  updateBike: (id, bikeData) => api.put(`/api/bikes/${id}`, bikeData),

  // Delete a bike
  deleteBike: (id) => api.delete(`/api/bikes/${id}`),

  // Upload images for a bike
  uploadImages: (id, formData) => api.post(`/api/bikes/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
